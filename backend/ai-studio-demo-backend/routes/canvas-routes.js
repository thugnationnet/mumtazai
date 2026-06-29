/**
 * CANVAS GENERATION API ROUTES
 * Endpoints for AI-powered canvas content generation
 * Supports: Mistral (default), xAI (fallback), OpenAI (fallback)
 *
 * NEW: /agent-stream endpoint uses real LLM tool calling (no regex parsing)
 *   Backend defines tools → LLM decides → Backend executes → results sent back
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';
import {
  CANVAS_TOOLS,
  CANVAS_SYSTEM_PROMPT,
  getCanvasToolsForOpenAI,
} from '../lib/canvas-tool-definitions.js';
import {
  executeCanvasTool,
  cleanupSandbox,
  isBlockedCommand,
  execCommand,
  writeFilesToSandbox,
  readFilesFromSandbox,
  truncateOutput,
} from '../lib/canvas-tool-executor.js';
import { requireAuth, optionalAuth } from '../lib/auth-middleware.js';
import { requireAnyCanvasPlan } from '../lib/plan-middleware.js';
import { getSource } from '../lib/source-utils.js';
import prisma from '../lib/prisma.js';
import { jobQueue, JOB_TYPES } from '../lib/job-queue.js';
import { randomUUID } from 'crypto';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

const router = express.Router();

// Lazy initialization of AI clients
let openaiClient = null;
let mistralClient = null;
let xaiClient = null;

function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function getMistralClient() {
  if (!mistralClient && process.env.MISTRAL_API_KEY) {
    mistralClient = new OpenAI({
      apiKey: process.env.MISTRAL_API_KEY,
      baseURL: 'https://api.mistral.ai/v1',
    });
  }
  return mistralClient;
}

function getXAIClient() {
  if (!xaiClient && process.env.XAI_API_KEY) {
    xaiClient = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
  }
  return xaiClient;
}

/**
 * POST /api/canvas/agent-stream
 * ═══════════════════════════════════════════════════════════════════
 * NEW: Canvas agent with real LLM tool calling.
 *
 * Flow:
 *   1. Frontend sends user message + current project files
 *   2. Backend sends to LLM with CANVAS_TOOLS (OpenAI functions format)
 *   3. LLM decides which tools to call
 *   4. Backend executes tools via canvas-tool-executor
 *   5. Results fed back to LLM for next round (tool calling loop)
 *   6. All events streamed to frontend via SSE
 *
 * SSE Event Types:
 *   { token: string }           — streaming text chunk
 *   { tool_start: { name, input } }  — tool execution starting
 *   { tool_result: { name, result } } — tool execution completed
 *   { files: [...] }            — updated project files after tool execution
 *   { framework: string }      — framework changed
 *   { done: true, files: [...] } — stream complete with final file state
 *   { error: string }          — error occurred
 * ═══════════════════════════════════════════════════════════════════
 */
router.post(
  '/agent-stream',
  requireAuth,
  requireAnyCanvasPlan,
  // Normalize provider to lowercase before validation
  (req, _res, next) => {
    if (req.body?.provider) req.body.provider = req.body.provider.toLowerCase();
    next();
  },
  [
    body('prompt')
      .isLength({ min: 1, max: 10000 })
      .withMessage('Prompt must be 1-10000 characters'),
    body('provider')
      .isIn([
        'mistral',
        'xai',
        'openai',
      ])
      .withMessage('Invalid provider'),
    body('modelId').exists().withMessage('Model ID is required'),
    body('files').optional().isArray(),
    body('framework').optional().isString(),
  ],
  async (req, res) => {
    let sandboxDir = null;

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({
            success: false,
            error: 'Validation failed',
            details: errors.array(),
          });
      }

      const {
        prompt,
        provider,
        modelId,
        files: projectFiles = [],
        framework = 'html',
        editorContext,
        history = [],
        agentMode,
      } = req.body;

      const userId = req.userId;
      const projectId = req.body.projectId || null;
      const source = getSource(req) || req.body.source || null;

      console.log(
        `[CanvasAgent] Streaming with ${provider}/${modelId}: "${prompt.substring(0, 80)}..."`
      );
      console.log(
        `[CanvasAgent] Project: ${projectFiles.length} files, framework: ${framework}`
      );

      // ── SSE setup ──
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

      // ── Build system prompt with project context ──
      let systemPrompt = CANVAS_SYSTEM_PROMPT;

      if (editorContext) {
        systemPrompt += '\n\n## Current Editor Context';
        if (editorContext.activeFile) {
          systemPrompt += `\nActive file: ${editorContext.activeFile.path} (${editorContext.activeFile.language})`;
        }
        if (editorContext.cursor) {
          systemPrompt += `\nCursor at line ${editorContext.cursor.line}`;
        }
        if (editorContext.selection?.text) {
          systemPrompt += `\nSelected text: "${editorContext.selection.text.substring(0, 300)}"`;
        }
        if (editorContext.errors?.length > 0) {
          systemPrompt += `\nBuild errors:\n${editorContext.errors.map((e) => `  - ${e.file}: ${e.message}`).join('\n')}`;
        }
      }

      if (agentMode) {
        const MODES = {
          plan: '\n\n## Mode: Planning\nFocus on architecture. Break down tasks into steps before coding.',
          code: '\n\n## Mode: Coding\nProduce complete, working code. Separate HTML/CSS/JS when appropriate.',
          review:
            '\n\n## Mode: Review\nReview existing code for bugs, accessibility, and best practices. Use canvas_file_read first.',
          debug:
            '\n\n## Mode: Debug\nFind and fix bugs. Use canvas_file_read and canvas_search_files to diagnose, then canvas_file_edit to fix.',
        };
        systemPrompt += MODES[agentMode] || '';
      }

      // Include current file listing so LLM knows what exists
      if (projectFiles.length > 0) {
        systemPrompt += `\n\n## Current Project Files (${projectFiles.length} files)`;
        for (const f of projectFiles) {
          systemPrompt += `\n- ${f.path} (${(f.content || '').length} bytes, ${f.language || 'unknown'})`;
        }
      }

      // ── Build conversation messages ──
      const conversationMessages = [];

      // Add recent history
      if (history.length > 0) {
        const recent = history.slice(-6); // Last 6 messages
        for (const msg of recent) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            conversationMessages.push({
              role: msg.role,
              content: msg.content || msg.text || '',
            });
          }
        }
      }

      // Add current prompt
      conversationMessages.push({ role: 'user', content: prompt });

      // ── Provider Cascade — same as agent chat ──
      // If one provider fails, try the next one automatically
      const PROVIDER_CASCADE = [
        { name: 'mistral', model: 'mistral-large-latest' },
        { name: 'xai', model: 'grok-3-mini' },
        { name: 'openai', model: 'gpt-4o' },
      ];

      // Start with requested provider, then cascade
      let cascadeOrder = [...PROVIDER_CASCADE];
      const requestedIndex = cascadeOrder.findIndex(p => p.name === provider);
      if (requestedIndex > 0) {
        // Move requested provider to front
        const [requested] = cascadeOrder.splice(requestedIndex, 1);
        cascadeOrder.unshift(requested);
      }

      // ── Run the tool calling loop ──
      let currentFiles = [...projectFiles];
      let currentFramework = framework;
      const MAX_TOOL_ROUNDS = 10;
      let totalToolCalls = 0;
      let activeProvider = provider;
      let activeModel = modelId === 'auto' ? cascadeOrder[0].model : modelId;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        let streamResult;
        let lastError = null;

        // Try each provider in cascade until one succeeds
        for (const providerConfig of cascadeOrder) {
          const currentProvider = providerConfig.name;
          const currentModel = providerConfig.model;

          try {
            // All providers use OpenAI-compatible API
            streamResult = await streamOpenAIWithTools(
              currentProvider,
              currentModel,
              systemPrompt,
              conversationMessages,
              send
            );
            // Success! Update active provider and break cascade
            activeProvider = currentProvider;
            activeModel = currentModel;
            lastError = null;
            break;
          } catch (streamErr) {
            console.warn(
              `[CanvasAgent] ${currentProvider} failed, trying next:`,
              streamErr.message
            );
            lastError = streamErr;
            // Continue to next provider in cascade
          }
        }

        // If ALL providers failed, report error
        if (lastError) {
          console.error(
            `[CanvasAgent] All providers failed on round ${round}:`,
            lastError
          );
          send({ error: `All providers failed: ${lastError.message}` });
          break;
        }

        // No tool calls → response is complete
        if (!streamResult.toolCalls || streamResult.toolCalls.length === 0) {
          break;
        }

        // ═══════════════════════════════════════════════════════════
        // EXECUTE TOOL CALLS — Backend handles actual execution
        // ═══════════════════════════════════════════════════════════
        console.log(
          `[CanvasAgent] Round ${round}: ${streamResult.toolCalls.length} tool call(s)`
        );

        const executionContext = {
          files: currentFiles,
          framework: currentFramework,
          projectId: projectId || 'temp',
          userId: userId || 'anonymous',
          sandboxDir,
        };

        {
          // OpenAI format: assistant with tool_calls + tool role messages
          const assistantMsg = {
            role: 'assistant',
            content: streamResult.text || null,
            tool_calls: streamResult.toolCalls.map((tc) => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: JSON.stringify(tc.input) },
            })),
          };
          conversationMessages.push(assistantMsg);

          for (const tc of streamResult.toolCalls) {
            send({ tool_start: { name: tc.name, input: tc.input } });
            console.log(
              `[CanvasAgent] Executing ${tc.name}:`,
              JSON.stringify(tc.input).substring(0, 200)
            );

            const execResult = await executeCanvasTool(
              tc.name,
              tc.input,
              executionContext
            );
            totalToolCalls++;

            currentFiles = execResult.files || currentFiles;
            if (execResult.sandboxDir) sandboxDir = execResult.sandboxDir;
            if (execResult.frameworkChanged)
              currentFramework = execResult.frameworkChanged;

            const resultContent = JSON.stringify(execResult.result, null, 2);
            conversationMessages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content:
                resultContent.length > 10000
                  ? resultContent.substring(0, 10000) + '\n... [truncated]'
                  : resultContent,
            });

            send({ tool_result: { name: tc.name, result: execResult.result } });

            if (
              tc.name.startsWith('canvas_file_') ||
              tc.name === 'canvas_terminal_run' ||
              tc.name === 'canvas_project_add_dependency' ||
              tc.name === 'canvas_project_set_env'
            ) {
              send({ files: currentFiles });
            }
            if (execResult.frameworkChanged) {
              send({ framework: currentFramework });
            }
          }
        }
      }

      // ── Done ──
      send({
        done: true,
        files: currentFiles,
        framework: currentFramework,
        totalToolCalls,
      });
      res.end();

      // ── Persist agent stream results to DB (table-level isolation) ──
      // canvas-build → canvasBuildProject table (simple: files + chatHistory + metadata)
      // canvas-app   → canvasProject table      (full: files + pages + framework + builds etc.)
      try {
        if (userId && source) {
          const isBuild = source === 'canvas-build';
          const chatEntry = [
            { role: 'user', content: prompt, timestamp: new Date().toISOString() },
            { role: 'assistant', content: `[${totalToolCalls} tool calls completed]`, timestamp: new Date().toISOString() },
          ];

          if (projectId) {
            if (isBuild) {
              // canvas-build: update in canvas_build_projects
              const existing = await prisma.canvasBuildProject.findUnique({ where: { id: projectId } });
              if (existing && existing.userId === userId) {
                await prisma.canvasBuildProject.update({
                  where: { id: projectId },
                  data: {
                    files: currentFiles || [],
                    chatHistory: [...(Array.isArray(existing.chatHistory) ? existing.chatHistory : []), ...chatEntry].slice(-100),
                  },
                });
                console.log(`[CanvasAgent] Auto-saved to canvas-build project ${projectId}`);
              }
            } else {
              // canvas-app: update in canvas_projects
              const existing = await prisma.canvasProject.findUnique({ where: { id: projectId } });
              if (existing && existing.userId === userId) {
                await prisma.canvasProject.update({
                  where: { id: projectId },
                  data: {
                    files: currentFiles || [],
                    framework: currentFramework || 'html',
                    pages: [...(Array.isArray(existing.pages) ? existing.pages : []), ...chatEntry].slice(-100),
                  },
                });
                console.log(`[CanvasAgent] Auto-saved to canvas-app project ${projectId}`);
              }
            }
          } else if (currentFiles.length > 0) {
            if (isBuild) {
              // canvas-build: create in canvas_build_projects
              const newProject = await prisma.canvasBuildProject.create({
                data: {
                  userId,
                  name: prompt.substring(0, 100) || 'Untitled Project',
                  description: prompt.substring(0, 500),
                  files: currentFiles,
                  chatHistory: chatEntry,
                },
              });
              console.log(`[CanvasAgent] Auto-created canvas-build project ${newProject.id}`);
              try { res.write(`data: ${JSON.stringify({ projectId: newProject.id })}\n\n`); } catch { /* stream closed */ }
            } else {
              // canvas-app: create in canvas_projects
              const newProject = await prisma.canvasProject.create({
                data: {
                  userId,
                  name: prompt.substring(0, 100) || 'Untitled Project',
                  description: prompt.substring(0, 500),
                  files: currentFiles,
                  framework: currentFramework || 'html',
                  pages: chatEntry,
                },
              });
              console.log(`[CanvasAgent] Auto-created canvas-app project ${newProject.id}`);
              try { res.write(`data: ${JSON.stringify({ projectId: newProject.id })}\n\n`); } catch { /* stream closed */ }
            }
          }
        }
      } catch (persistErr) {
        console.warn('[CanvasAgent] Auto-save failed (non-blocking):', persistErr.message);
      }

      // Cleanup sandbox after response is sent
      if (sandboxDir) {
        cleanupSandbox(sandboxDir).catch(() => {});
      }
    } catch (error) {
      console.error('[CanvasAgent] Error:', error);
      try {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      } catch {
        /* already closed */
      }
      if (sandboxDir) cleanupSandbox(sandboxDir).catch(() => {});
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// STREAMING HELPERS — OpenAI-compatible tool calling streams
// ═══════════════════════════════════════════════════════════════════

/**
 * Stream from OpenAI-compatible providers with function calling support.
 */
async function streamOpenAIWithTools(
  providerName,
  modelId,
  systemPrompt,
  messages,
  send
) {
  let client;
  switch (providerName) {
    case 'mistral':
      client = getMistralClient();
      break;
    case 'xai':
      client = getXAIClient();
      break;
    case 'openai':
      client = getOpenAIClient();
      break;
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
  if (!client) throw new Error(`${providerName} not configured`);

  const tools = getCanvasToolsForOpenAI();

  const stream = await client.chat.completions.create({
    model: modelId,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 16000,
    temperature: 0.7,
    stream: true,
    tools,
    tool_choice: 'auto',
  });

  let collectedText = '';
  const toolCallAccumulators = {};
  let finishReason = 'stop';

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta;
    const finish = chunk.choices?.[0]?.finish_reason;

    // Text content
    if (delta?.content) {
      collectedText += delta.content;
      send({ token: delta.content });
    }

    // Tool calls — accumulate across chunks
    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index;
        if (!toolCallAccumulators[idx]) {
          toolCallAccumulators[idx] = { id: '', name: '', arguments: '' };
        }
        if (tc.id) toolCallAccumulators[idx].id = tc.id;
        if (tc.function?.name) {
          toolCallAccumulators[idx].name = tc.function.name;
          send({
            token: `\n\n🔧 *${formatToolName(tc.function.name)}...*\n\n`,
          });
        }
        if (tc.function?.arguments) {
          toolCallAccumulators[idx].arguments += tc.function.arguments;
        }
      }
    }

    if (finish) {
      finishReason = finish;
    }
  }

  // Collect completed tool calls
  const toolCalls = Object.values(toolCallAccumulators).map((tc) => {
    let input = {};
    try {
      input = JSON.parse(tc.arguments || '{}');
    } catch {}
    return { id: tc.id, name: tc.name, input };
  });

  return {
    text: collectedText,
    finishReason,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  };
}

/**
 * Format tool name for display (e.g. "canvas_file_create" → "Creating file")
 */
function formatToolName(name) {
  const MAP = {
    canvas_file_create: 'Creating file',
    canvas_file_edit: 'Editing file',
    canvas_file_delete: 'Deleting file',
    canvas_file_rename: 'Renaming file',
    canvas_file_read: 'Reading file',
    canvas_terminal_run: 'Running command',
    canvas_build_validate: 'Validating build',
    canvas_project_set_framework: 'Setting framework',
    canvas_project_add_dependency: 'Adding dependencies',
    canvas_project_set_env: 'Setting environment',
    canvas_search_files: 'Searching files',
    canvas_deploy: 'Deploying project',
  };
  return MAP[name] || name.replace('canvas_', '').replace(/_/g, ' ');
}

/**
 * GET /api/canvas/status
 * Check canvas generation service status
 */
router.get('/status', (req, res) => {
  const providers = {
    mistral: !!process.env.MISTRAL_API_KEY,
    xai: !!process.env.XAI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
  };

  const activeProviders = Object.entries(providers)
    .filter(([, active]) => active)
    .map(([name]) => name);

  res.json({
    success: true,
    status: 'operational',
    capabilities: {
      providers,
      activeProviders,
      supportedProviders: [
        'mistral',
        'xai',
        'openai',
      ],
      maxPromptLength: 5000,
      maxCodeLength: 8000,
      streaming: true,
    },
  });
});

// ============================================
// CANVAS CODE GENERATION ENDPOINT
// ============================================

const SYSTEM_INSTRUCTION = `You are a friendly, talented frontend developer who genuinely loves helping people build cool stuff!

**YOUR PERSONALITY:**
- Warm, casual, and fun - like chatting with a skilled friend who happens to be great at coding
- Match the user's energy - casual greetings get casual responses
- Show genuine enthusiasm for creative ideas
- Keep it real and conversational, not robotic

**CONVERSATION STYLE:**
- For casual hellos: Just be friendly! "Hey! What are we building today?"
- For vague ideas: Chat naturally - "That sounds cool! What vibe are you going for?"
- For clear requests: Get excited and code it!

**WHEN GENERATING CODE:**
1. Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>)
2. Use Lucide icons via CDN (<script src="https://unpkg.com/lucide@latest"></script>)
3. Create modern, beautiful, mobile-responsive designs
4. Include smooth animations and transitions
5. Output ONE complete, valid HTML file with <html>, <head>, <body>
6. Return ONLY the code - no markdown blocks, no explanations
7. Always return the FULL updated file
8. Use semantic HTML and ARIA labels for accessibility`;

function cleanCode(text) {
  return text
    .replaceAll(/```html/g, '')
    .replaceAll(/```/g, '')
    .trim();
}

// Generate with Mistral (default)
async function generateWithMistral(prompt, modelId, currentCode, history) {
  const client = getMistralClient();
  if (!client) {
    throw new Error('Mistral API key not configured');
  }

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
  ];

  if (currentCode) {
    messages.push({ role: 'user', content: `Current code:\n${currentCode}` });
  }

  if (history && history.length > 0) {
    history.forEach((msg) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    });
  }

  messages.push({ role: 'user', content: prompt });

  try {
    const completion = await client.chat.completions.create({
      model: modelId || 'mistral-large-latest',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    let generatedCode = completion.choices[0]?.message?.content || '';
    generatedCode = cleanCode(generatedCode);

    if (!generatedCode.includes('<html') && !generatedCode.includes('<!DOCTYPE')) {
      generatedCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
</head>
<body>
    ${generatedCode}
</body>
</html>`;
    }

    return generatedCode;
  } catch (error) {
    console.error('Mistral generation error:', error);
    throw new Error(`Mistral generation failed: ${error.message}`);
  }
}

// Generate with xAI (fallback)
async function generateWithXAI(prompt, modelId, currentCode, history) {
  const client = getXAIClient();
  if (!client) {
    throw new Error('xAI API key not configured');
  }

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
  ];

  if (currentCode) {
    messages.push({ role: 'user', content: `Current code:\n${currentCode}` });
  }

  if (history && history.length > 0) {
    history.forEach((msg) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    });
  }

  messages.push({ role: 'user', content: prompt });

  try {
    const completion = await client.chat.completions.create({
      model: modelId || 'grok-3-mini',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    let generatedCode = completion.choices[0]?.message?.content || '';
    generatedCode = cleanCode(generatedCode);

    if (!generatedCode.includes('<html') && !generatedCode.includes('<!DOCTYPE')) {
      generatedCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
</head>
<body>
    ${generatedCode}
</body>
</html>`;
    }

    return generatedCode;
  } catch (error) {
    console.error('xAI generation error:', error);
    throw new Error(`xAI generation failed: ${error.message}`);
  }
}

// Generate with OpenAI
async function generateWithOpenAI(prompt, modelId, currentCode, history) {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
  ];

  if (currentCode) {
    messages.push({ role: 'user', content: `Current code:\n${currentCode}` });
  }

  if (history && history.length > 0) {
    history.forEach((msg) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    });
  }

  messages.push({ role: 'user', content: prompt });

  try {
    const completion = await client.chat.completions.create({
      model: modelId || 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    let generatedCode = completion.choices[0]?.message?.content || '';
    generatedCode = cleanCode(generatedCode);

    // Ensure it's valid HTML
    if (!generatedCode.includes('<html') && !generatedCode.includes('<!DOCTYPE')) {
      generatedCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
</head>
<body>
    ${generatedCode}
</body>
</html>`;
    }

    return generatedCode;
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw new Error(`OpenAI generation failed: ${error.message}`);
  }
}

// Main generation endpoint — requires subscription
router.post('/generate', requireAuth, requireAnyCanvasPlan, async (req, res) => {
  try {
    const { prompt, modelId, currentCode, history, provider } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required',
      });
    }

    let generatedCode;

    // Provider priority: Mistral → xAI → OpenAI
    const targetProvider = provider || 'mistral';

    try {
      switch (targetProvider) {
        case 'mistral':
          generatedCode = await generateWithMistral(prompt, modelId, currentCode, history);
          break;
        case 'xai':
          generatedCode = await generateWithXAI(prompt, modelId, currentCode, history);
          break;
        case 'openai':
          generatedCode = await generateWithOpenAI(prompt, modelId, currentCode, history);
          break;
        default:
          // Fallback cascade: Mistral → xAI → OpenAI
          try {
            generatedCode = await generateWithMistral(prompt, modelId, currentCode, history);
          } catch (mistralError) {
            console.warn('Mistral failed, trying xAI:', mistralError.message);
            try {
              generatedCode = await generateWithXAI(prompt, modelId, currentCode, history);
            } catch (xaiError) {
              console.warn('xAI failed, trying OpenAI:', xaiError.message);
              generatedCode = await generateWithOpenAI(prompt, modelId, currentCode, history);
            }
          }
      }
    } catch (error) {
      console.error('All providers failed:', error);
      return res.status(500).json({
        success: false,
        message: 'All AI providers failed. Please try again later.',
        error: error.message,
      });
    }

    res.json({
      success: true,
      code: generatedCode,
      provider: targetProvider,
    });

  } catch (error) {
    console.error('Canvas generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate canvas code',
      error: error.message,
    });
  }
});

// =============================================================================
// POST /api/canvas/exec — Run a terminal command in a sandboxed environment
// =============================================================================

/**
 * POST /api/canvas/exec
 * Execute a shell command inside a temporary sandbox directory.
 * The frontend's canvas-build terminal panel calls this endpoint.
 *
 * Body:
 *   command  (string, required) — the shell command to run
 *   files    (array,  optional) — project files to write before executing
 *              Each entry: { path: string, content: string }
 *   cwd      (string, optional) — working dir inside sandbox (default: '/')
 *   timeout  (number, optional) — ms before killing the process (default: 30000, max: 60000)
 *
 * Response:
 *   { success, stdout, stderr, exitCode, files? }
 *   `files` is only returned when the command modifies the file system.
 */
router.post('/exec', requireAuth, requireAnyCanvasPlan, async (req, res) => {
  try {
    const { command, files = [], cwd = '/', timeout: rawTimeout = 30000 } = req.body;

    // --- Validation ---
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ success: false, error: 'command is required' });
    }

    const timeout = Math.min(Number(rawTimeout) || 30000, 60000);

    // --- Security: block dangerous commands ---
    const blocked = isBlockedCommand(command);
    if (blocked) {
      return res.status(403).json({
        success: false,
        error: `Command blocked for security: ${blocked}`,
        exitCode: 1,
      });
    }

    // --- Create sandbox ---
    const sandboxDir = path.join(
      os.tmpdir(),
      `canvas-exec-${randomUUID().slice(0, 8)}`
    );

    try {
      // Write project files into the sandbox
      if (Array.isArray(files) && files.length > 0) {
        await writeFilesToSandbox(files, sandboxDir);
      } else {
        await fs.mkdir(sandboxDir, { recursive: true });
      }

      // Resolve working directory
      const workDir = path.resolve(
        sandboxDir,
        cwd === '/' ? '.' : cwd.replace(/^\//, '')
      );
      await fs.mkdir(workDir, { recursive: true });

      // --- Execute ---
      const result = await execCommand(command, workDir, timeout);

      // If the command may have modified files, read them back
      const FILE_MODIFY_PATTERNS = [
        /npm\s+init/, /npm\s+install/, /npx\s+create/,
        /yarn\s+add/, /yarn\s+init/, /pnpm\s+add/,
        /mkdir/, /touch/, /mv\s/, /cp\s/, /echo\s.*>/, /sed\s+-i/, /tee\s/,
      ];
      const modified = FILE_MODIFY_PATTERNS.some((p) => p.test(command));

      const response = {
        success: true,
        stdout: truncateOutput(result.stdout),
        stderr: truncateOutput(result.stderr),
        exitCode: result.exitCode,
      };

      if (modified) {
        response.files = await readFilesFromSandbox(sandboxDir);
      }

      res.json(response);
    } finally {
      // Cleanup sandbox — fire and forget
      fs.rm(sandboxDir, { recursive: true, force: true }).catch(() => {});
    }
  } catch (error) {
    console.error('[Canvas] /exec error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute command',
      exitCode: 1,
    });
  }
});

// ============================================
// CANVAS-BUILD (universal-chat) BUILD PIPELINE
// Endpoints for the embedded canvas-build overlay.
// Uses CanvasBuildProject (canvas_build_projects table).
// ============================================

/**
 * GET /api/canvas/builds/:projectId — List builds for a canvas-build project
 */
router.get('/builds/:projectId', optionalAuth, async (req, res) => {
  try {
    const builds = await prisma.canvasBuild.findMany({
      where: { buildProjectId: req.params.projectId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, builds });
  } catch (error) {
    console.error('[CanvasBuild] List builds error:', error);
    res.status(500).json({ success: false, error: 'Failed to list builds' });
  }
});

/**
 * POST /api/canvas/builds — Start a new build for a canvas-build project
 */
router.post('/builds', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId is required' });
    }

    const project = await prisma.canvasBuildProject.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    if (project.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get latest build version
    const latestBuild = await prisma.canvasBuild.findFirst({
      where: { buildProjectId: project.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const newVersion = (latestBuild?.version || 0) + 1;

    // Create build record
    const build = await prisma.canvasBuild.create({
      data: {
        buildProjectId: project.id,
        version: newVersion,
        framework: 'html',
        status: 'pending',
      },
    });

    // Queue build job
    try {
      const jobRef = await jobQueue.add(JOB_TYPES.CANVAS_BUILD, {
        buildProjectId: project.id,
        buildId: build.id,
        userId: req.userId,
      }, { userId: req.userId });

      res.json({
        success: true,
        build: { id: build.id, version: newVersion, status: 'pending' },
        job: jobRef,
        message: `Build v${newVersion} queued`,
      });
    } catch (jobErr) {
      // Fallback: validate synchronously if queue unavailable
      console.warn('[CanvasBuild] Job queue unavailable, running sync:', jobErr.message);

      // Simple validation of project files
      const files = Array.isArray(project.files) ? project.files : [];
      const errors = [];
      const warnings = [];

      if (files.length === 0) errors.push('No files in project');

      const hasHtml = files.some((f) => f.path?.endsWith('.html') || f.name?.endsWith('.html'));
      const hasIndex = files.some((f) => f.path === 'index.html' || f.name === 'index.html');
      if (!hasHtml) warnings.push('No HTML file found');
      if (!hasIndex) warnings.push('No index.html entry point');

      for (const file of files) {
        if (!file.content || file.content.trim().length === 0) {
          warnings.push(`Empty file: ${file.path || file.name}`);
        }
      }

      const buildStatus = errors.length > 0 ? 'failed' : 'success';
      const logLines = [
        `Build v${newVersion} — ${files.length} file(s)`,
        '',
        ...files.map((f) => `✓ ${f.path || f.name} (${(f.content || '').length} bytes)`),
        '',
        ...warnings.map((w) => `⚠ ${w}`),
        ...errors.map((e) => `✗ ${e}`),
        '',
        buildStatus === 'success' ? '✓ Build completed successfully' : '✗ Build failed',
      ];

      await prisma.canvasBuild.update({
        where: { id: build.id },
        data: {
          status: buildStatus,
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 0,
          logs: logLines.join('\n'),
          ...(errors.length > 0 && { errorMessage: errors.join('; ') }),
        },
      });

      res.json({
        success: true,
        build: { id: build.id, version: newVersion, status: buildStatus },
        errors,
        warnings,
      });
    }
  } catch (error) {
    console.error('[CanvasBuild] Start build error:', error);
    res.status(500).json({ success: false, error: 'Failed to start build' });
  }
});

/**
 * GET /api/canvas/builds/:buildId/status — Get build status
 */
router.get('/builds/:buildId/status', optionalAuth, async (req, res) => {
  try {
    const build = await prisma.canvasBuild.findUnique({
      where: { id: req.params.buildId },
      include: { buildProject: { select: { userId: true } } },
    });
    if (!build) {
      return res.status(404).json({ success: false, error: 'Build not found' });
    }
    res.json({
      success: true,
      build: {
        id: build.id,
        version: build.version,
        status: build.status,
        duration: build.duration,
        createdAt: build.createdAt,
        startedAt: build.startedAt,
        completedAt: build.completedAt,
        errorMessage: build.errorMessage,
      },
    });
  } catch (error) {
    console.error('[CanvasBuild] Get status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get build status' });
  }
});

/**
 * GET /api/canvas/builds/:buildId/logs — Get/stream build logs
 */
router.get('/builds/:buildId/logs', optionalAuth, async (req, res) => {
  try {
    const build = await prisma.canvasBuild.findUnique({
      where: { id: req.params.buildId },
    });
    if (!build) {
      return res.status(404).json({ success: false, error: 'Build not found' });
    }

    // If build is still running, stream via SSE
    if (['pending', 'running'].includes(build.status)) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      if (build.logs) {
        for (const line of build.logs.split('\n')) {
          res.write(`data: ${JSON.stringify({ type: 'log', message: line })}\n\n`);
        }
      }

      const interval = setInterval(async () => {
        try {
          const updated = await prisma.canvasBuild.findUnique({ where: { id: build.id } });
          if (!updated || ['success', 'failed', 'cancelled'].includes(updated.status)) {
            // Send remaining logs
            if (updated?.logs) {
              for (const line of updated.logs.split('\n')) {
                res.write(`data: ${JSON.stringify({ type: 'log', message: line })}\n\n`);
              }
            }
            res.write(`data: ${JSON.stringify({ type: 'complete', status: updated?.status || 'failed', duration: updated?.duration })}\n\n`);
            clearInterval(interval);
            res.end();
          }
        } catch {
          clearInterval(interval);
          res.end();
        }
      }, 2000);

      req.on('close', () => clearInterval(interval));
    } else {
      const logs = build.logs ? build.logs.split('\n') : [];
      res.json({ success: true, logs });
    }
  } catch (error) {
    console.error('[CanvasBuild] Get logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get build logs' });
  }
});

/**
 * POST /api/canvas/builds/:buildId/cancel — Cancel a running build
 */
router.post('/builds/:buildId/cancel', requireAuth, async (req, res) => {
  try {
    const build = await prisma.canvasBuild.findUnique({
      where: { id: req.params.buildId },
      include: { buildProject: { select: { userId: true } } },
    });
    if (!build) {
      return res.status(404).json({ success: false, error: 'Build not found' });
    }
    if (build.buildProject?.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if (['success', 'failed', 'cancelled'].includes(build.status)) {
      return res.status(400).json({ success: false, error: 'Build is already finished' });
    }

    await prisma.canvasBuild.update({
      where: { id: build.id },
      data: { status: 'cancelled', completedAt: new Date() },
    });

    res.json({ success: true, message: 'Build cancelled' });
  } catch (error) {
    console.error('[CanvasBuild] Cancel build error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel build' });
  }
});

export default router;
