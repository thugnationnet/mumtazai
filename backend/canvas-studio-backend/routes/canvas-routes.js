/**
 * CANVAS GENERATION API ROUTES
 * Endpoints for AI-powered canvas content generation
 * Supports: xAI (default), Mistral (fallback), OpenAI (fallback)
 *
 * /agent-stream endpoint uses real LLM tool calling (no regex parsing)
 *   Backend defines tools → LLM decides → Backend executes → results sent back
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';
import {
  CANVAS_SYSTEM_PROMPT,
  getCanvasToolsForOpenAI,
  getCanvasToolsForPanelOpenAI,
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
import { randomUUID } from 'crypto';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

const router = express.Router();

// Lazy initialization of AI clients — Mistral (default), xAI (fallback), OpenAI (fallback)
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
      .optional()
      .isIn([
        'mistral',
        'xai',
        'openai',
      ])
      .withMessage('Invalid provider'),
    body('modelId').optional().isString(),
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
        provider = 'xai',
        modelId = 'auto',
        files: projectFiles = [],
        framework = 'html',
        editorContext,
        history = [],
        agentMode,
        panel = null,
      } = req.body;

      // Resolve panel-scoped tools once; falls back to full set if panel unknown
      const panelOpenAITools    = getCanvasToolsForPanelOpenAI(panel || 'workspace');

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

      // AbortController cancels AI provider streams when client disconnects
      // Prevents orphaned tool-calling loops that leak memory (root cause of 850 restarts)
      const abortController = new AbortController();
      const { signal } = abortController;
      let clientDisconnected = false;
      req.on('close', () => {
        clientDisconnected = true;
        abortController.abort();
        console.log('[CanvasAgent] Client disconnected — aborted provider stream');
      });

      const send = (data) => {
        if (!clientDisconnected) res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

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

      // ── Provider Cascade: xAI (default) → Mistral → OpenAI ──
      const PROVIDER_CASCADE = [
        { name: 'xai', model: process.env.XAI_DEFAULT_MODEL || 'grok-3-mini' },
        { name: 'mistral', model: process.env.MISTRAL_DEFAULT_MODEL || 'mistral-large-latest' },
        { name: 'openai', model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o' },
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
        if (signal.aborted) break;
        let streamResult;
        let lastError = null;

        // Try each provider in cascade until one succeeds
        for (const providerConfig of cascadeOrder) {
          if (signal.aborted) break;
          const currentProvider = providerConfig.name;
          const currentModel = providerConfig.model;

          try {
            // All providers use OpenAI-compatible API (mistral, xai, openai)
            streamResult = await streamOpenAIWithTools(
              currentProvider,
              currentModel,
              systemPrompt,
              conversationMessages,
              send,
              panelOpenAITools,
              signal
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
            // AbortError means client disconnected — stop cascade, don't try next provider
            if (streamErr.name === 'AbortError' || signal.aborted) {
              lastError = streamErr;
              break;
            }
            lastError = streamErr;
            // Continue to next provider in cascade
          }
        }

        // Client disconnected — stop entirely
        if (signal.aborted) break;

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
            if (signal.aborted) break;
            send({ tool_start: { name: tc.name, input: tc.input } });
            console.log(
              `[CanvasAgent] Executing ${tc.name}:`,
              JSON.stringify(tc.input).substring(0, 200)
            );

            const toolStartTime = Date.now();
            const execResult = await executeCanvasTool(
              tc.name,
              tc.input,
              executionContext
            );
            totalToolCalls++;
            const toolDurationMs = Date.now() - toolStartTime;

            // Persist to ToolUsage (fire-and-forget)
            prisma.toolUsage.create({
              data: {
                toolName: tc.name,
                userId: userId || undefined,
                command: tc.name,
                arguments: tc.input || {},
                inputPreview: JSON.stringify(tc.input || {}).slice(0, 2000),
                outputPreview: JSON.stringify(execResult.result).slice(0, 4000),
                latencyMs: toolDurationMs,
                status: execResult.result?.error ? 'failed' : 'completed',
                environment: 'canvas-studio',
                tags: [],
              },
            }).catch(err => console.error('[agent-stream] ToolUsage persist error:', err.message));

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

      // ── Done ──
      if (!clientDisconnected) {
        send({
          done: true,
          files: currentFiles,
          framework: currentFramework,
          totalToolCalls,
        });
      }
      if (!res.writableEnded) res.end();

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
      // AbortError is expected when client disconnects — not a real error
      if (error.name === 'AbortError' || clientDisconnected) {
        console.log('[CanvasAgent] Stream aborted (client disconnect)');
      } else {
        console.error('[CanvasAgent] Error:', error);
        try {
          if (!clientDisconnected) {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          }
        } catch { /* already closed */ }
      }
      if (!res.writableEnded) res.end();
      if (sandboxDir) cleanupSandbox(sandboxDir).catch(() => {});
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// STREAMING HELPERS — OpenAI-compatible tool calling streams
// ═══════════════════════════════════════════════════════════════════

/**
 * Stream from OpenAI-compatible providers with function calling support.
 * All 3 providers (Mistral, xAI, OpenAI) use the OpenAI SDK format.
 */
async function streamOpenAIWithTools(
  providerName,
  modelId,
  systemPrompt,
  messages,
  send,
  tools,
  signal
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

  if (!tools) tools = getCanvasToolsForOpenAI();

  const TOOL_LIMITS = {
    xai: 200,
    openai: 128,
    mistral: 128,
  };
  const providerToolLimit = TOOL_LIMITS[providerName] || 128;
  if (Array.isArray(tools) && tools.length > providerToolLimit) {
    console.warn(
      `[CanvasAgent] ${providerName} tool limit ${providerToolLimit}; trimming from ${tools.length}`
    );
    tools = tools.slice(0, providerToolLimit);
  }

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
    if (signal?.aborted) break;
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
 * POST /api/canvas/chat
 * Pure conversational chat — no tool calling, no file editing.
 * Used by Chat Mode toggle in canvas-studio.
 */
router.post(
  '/chat',
  requireAuth,
  requireAnyCanvasPlan,
  [
    body('message').isLength({ min: 1, max: 5000 }).withMessage('Message must be 1-5000 characters'),
    body('conversationHistory').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
      }

      const { message, conversationHistory = [] } = req.body;

      // Build messages array for chat completion
      const messages = [
        {
          role: 'system',
          content:
            'You are a friendly, knowledgeable coding assistant for Canvas Studio — a web-based IDE. ' +
            'Answer questions about web development, coding patterns, architecture, debugging, and tools. ' +
            'Be concise, helpful, and conversational. Use markdown formatting for code snippets.',
        },
        ...conversationHistory.slice(-10).map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text || '',
        })),
        { role: 'user', content: message },
      ];

      // Try providers in order: xAI → Mistral → OpenAI
      const providers = [
        { get: getXAIClient, model: 'grok-3-mini' },
        { get: getMistralClient, model: 'mistral-medium-latest' },
        { get: getOpenAIClient, model: 'gpt-4o-mini' },
      ];

      let reply = null;
      for (const { get, model } of providers) {
        const client = get();
        if (!client) continue;
        try {
          const completion = await client.chat.completions.create({
            model,
            messages,
            max_tokens: 2048,
            temperature: 0.7,
          });
          reply = completion.choices?.[0]?.message?.content || '';
          break;
        } catch (providerErr) {
          console.warn(`[CanvasChat] Provider ${model} failed:`, providerErr.message);
        }
      }

      if (reply === null) {
        return res.status(503).json({ success: false, error: 'No AI provider available' });
      }

      res.json({ success: true, message: reply });
    } catch (err) {
      console.error('[CanvasChat] Error:', err.message);
      res.status(500).json({ success: false, error: 'Chat failed' });
    }
  }
);

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
      supportedProviders: ['xai', 'mistral', 'openai'],
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

// Generate with Mistral
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
      model: modelId || process.env.MISTRAL_DEFAULT_MODEL || 'mistral-large-latest',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    let generatedCode = completion.choices[0]?.message?.content || '';
    generatedCode = cleanCode(generatedCode);

    if (!generatedCode.includes('<html') && !generatedCode.includes('<!DOCTYPE')) {
      generatedCode = `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Generated App</title>\n    <script src="https://cdn.tailwindcss.com"></script>\n    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>\n</head>\n<body>\n    ${generatedCode}\n</body>\n</html>`;
    }

    return generatedCode;
  } catch (error) {
    console.error('Mistral generation error:', error);
    throw new Error(`Mistral generation failed: ${error.message}`);
  }
}

// Generate with xAI
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
      model: modelId || process.env.XAI_DEFAULT_MODEL || 'grok-3-mini',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    let generatedCode = completion.choices[0]?.message?.content || '';
    generatedCode = cleanCode(generatedCode);

    if (!generatedCode.includes('<html') && !generatedCode.includes('<!DOCTYPE')) {
      generatedCode = `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Generated App</title>\n    <script src="https://cdn.tailwindcss.com"></script>\n    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>\n</head>\n<body>\n    ${generatedCode}\n</body>\n</html>`;
    }

    return generatedCode;
  } catch (error) {
    console.error('xAI generation error:', error);
    throw new Error(`xAI generation failed: ${error.message}`);
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

    // Provider priority: xAI → Mistral → OpenAI
    const targetProvider = provider || 'xai';

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
          // Fallback cascade: xAI → Mistral → OpenAI
          try {
            generatedCode = await generateWithXAI(prompt, modelId, currentCode, history);
          } catch (xaiError) {
            console.warn('xAI failed, trying Mistral:', xaiError.message);
            try {
              generatedCode = await generateWithMistral(prompt, modelId, currentCode, history);
            } catch (mistralError) {
              console.warn('Mistral failed, trying OpenAI:', mistralError.message);
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

// ── Image to Code ──
router.post('/image-to-code', requireAuth, requireAnyCanvasPlan, async (req, res) => {
  try {
    const { image, mimeType, language } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    const client = getOpenAIClient();
    if (!client) {
      return res.status(503).json({ success: false, error: 'AI service not configured' });
    }

    const langPrompt = language === 'html'
      ? 'Generate a complete, self-contained HTML file with embedded CSS and JavaScript.'
      : language === 'react'
        ? 'Generate a React component with Tailwind CSS.'
        : `Generate code in ${language || 'HTML'}.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/png'};base64,${image}`,
              },
            },
            {
              type: 'text',
              text: `Convert this UI design/mockup into clean, production-ready code. ${langPrompt} Match the layout, spacing, colors, and typography as closely as possible. Only output the code, no explanation.`,
            },
          ],
        },
      ],
    });

    const code = completion.choices[0]?.message?.content || '';
    // Strip markdown code fences if present
    const cleaned = code.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');

    res.json({ success: true, code: cleaned });
  } catch (error) {
    console.error('[ImageToCode] Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to convert image to code' });
  }
});

// ── Shell Exec (Terminal.tsx real execution) ──────────────────────
router.post('/shell/exec', requireAuth, requireAnyCanvasPlan, async (req, res) => {
  try {
    const { command, sessionId } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ success: false, error: 'command is required' });
    }

    const cmd = command.trim();
    if (!cmd) return res.json({ success: true, stdout: '', stderr: '', exitCode: 0 });

    const blocked = isBlockedCommand(cmd);
    if (blocked) {
      return res.json({ success: false, stdout: '', stderr: `Command blocked: ${blocked}`, exitCode: 1 });
    }

    const workDir = process.env.SANDBOX_WORKDIR || '/tmp';
    const result = await execCommand(cmd, workDir, 15000);
    return res.json({
      success: true,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode ?? result.code ?? 0,
    });
  } catch (error) {
    console.error('[shell/exec] Error:', error.message);
    return res.json({
      success: false,
      stdout: '',
      stderr: error.message,
      exitCode: 1,
    });
  }
});

// ── Dependency Security Scan ───────────────────────────────────────
router.post('/deps/security-scan', requireAuth, requireAnyCanvasPlan, async (req, res) => {
  try {
    const { projectId, packages } = req.body;
    if (!Array.isArray(packages)) {
      return res.status(400).json({ success: false, error: 'packages array required' });
    }

    // Run npm audit for the package list by writing a minimal package.json
    const os = await import('os');
    const path = await import('path');
    const fs = await import('fs');
    const tmpDir = path.join(os.default.tmpdir(), `audit-${Date.now()}`);
    fs.default.mkdirSync(tmpDir, { recursive: true });

    const pkgJson = { name: 'audit-scan', version: '1.0.0', dependencies: {} };
    for (const pkg of packages) {
      if (pkg && pkg.name) pkgJson.dependencies[pkg.name] = pkg.version || '*';
    }
    fs.default.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkgJson));

    let vulnerabilities = {};
    try {
      const auditResult = await execCommand(
        'npm install --package-lock-only --ignore-scripts 2>/dev/null && npm audit --json 2>/dev/null || echo "{}"',
        tmpDir,
        30000
      );
      const raw = auditResult.stdout.trim();
      const lastJson = raw.slice(raw.lastIndexOf('{'));
      const auditData = JSON.parse(lastJson || '{}');
      const vulns = auditData.vulnerabilities || {};
      for (const [name, info] of Object.entries(vulns)) {
        const sev = (info.severity || 'low').toLowerCase();
        if (!vulnerabilities[name]) vulnerabilities[name] = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
        vulnerabilities[name][sev] = (vulnerabilities[name][sev] || 0) + 1;
      }
    } catch (_) {
      // audit failed gracefully — return empty
    } finally {
      fs.default.rmSync(tmpDir, { recursive: true, force: true });
    }

    return res.json({ success: true, vulnerabilities });
  } catch (error) {
    console.error('[deps/security-scan] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CODE EXECUTION — CodeRunner.tsx backend
// POST /api/canvas/execute
// Runs code in a temp sandbox for server-side languages
// ============================================

const LANG_COMMANDS = {
  python: (f) => `python3 ${f}`,
  javascript: (f) => `node ${f}`,
  typescript: (f) => `npx tsx ${f}`,
  java: (f) => {
    const cls = f.replace('.java', '');
    return `javac ${f} && java ${cls}`;
  },
  go: (f) => `go run ${f}`,
  rust: (f) => {
    const out = f.replace('.rs', '');
    return `rustc ${f} -o ${out} && ./${out}`;
  },
  c: (f) => `gcc ${f} -o a.out -lm && ./a.out`,
  cpp: (f) => `g++ -std=c++20 ${f} -o a.out && ./a.out`,
  'c++': (f) => `g++ -std=c++20 ${f} -o a.out && ./a.out`,
  php: (f) => `php ${f}`,
  ruby: (f) => `ruby ${f}`,
  swift: (f) => `swift ${f}`,
  kotlin: (f) => {
    const jar = f.replace('.kt', '.jar');
    return `kotlinc ${f} -include-runtime -d ${jar} 2>/dev/null && java -jar ${jar}`;
  },
  csharp: (f) => `dotnet-script ${f} 2>/dev/null || csharp ${f}`,
  'c#': (f) => `dotnet-script ${f} 2>/dev/null || csharp ${f}`,
  sql: (f) => `sqlite3 :memory: < ${f}`,
  shell: (f) => `bash ${f}`,
  bash: (f) => `bash ${f}`,
};

const LANG_EXTENSIONS = {
  python: '.py',
  javascript: '.js',
  typescript: '.ts',
  java: '.java',
  go: '.go',
  rust: '.rs',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  php: '.php',
  ruby: '.rb',
  swift: '.swift',
  kotlin: '.kt',
  csharp: '.cs',
  'c#': '.cs',
  sql: '.sql',
  shell: '.sh',
  bash: '.sh',
};

router.post('/execute', requireAuth, requireAnyCanvasPlan, async (req, res) => {
  const start = Date.now();
  try {
    const { code, language, files: extraFiles } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, stdout: '', stderr: 'code is required', exitCode: 1, executionTime: 0, language });
    }
    if (!language || !LANG_COMMANDS[language]) {
      return res.status(400).json({ success: false, stdout: '', stderr: `Unsupported language: ${language}`, exitCode: 1, executionTime: 0, language });
    }

    // Security: block dangerous code patterns
    if (isBlockedCommand(code)) {
      return res.status(403).json({ success: false, stdout: '', stderr: 'Code contains blocked patterns', exitCode: 1, executionTime: 0, language });
    }

    const ext = LANG_EXTENSIONS[language];
    const mainFile = language === 'java' ? 'Main.java' : `main${ext}`;

    // Create temp sandbox
    const sandboxDir = path.join(os.tmpdir(), `canvas-run-${randomUUID().slice(0, 8)}`);
    await fs.mkdir(sandboxDir, { recursive: true });

    try {
      // Write main source file
      let sourceCode = code;
      // For Java, ensure class name matches filename
      if (language === 'java' && !code.includes('class Main')) {
        sourceCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
      }
      await fs.writeFile(path.join(sandboxDir, mainFile), sourceCode);

      // Write extra files if provided
      if (extraFiles && typeof extraFiles === 'object') {
        for (const [filePath, content] of Object.entries(extraFiles)) {
          if (typeof content !== 'string') continue;
          const safePath = path.basename(filePath); // prevent directory traversal
          await fs.writeFile(path.join(sandboxDir, safePath), content);
        }
      }

      // Execute
      const cmd = LANG_COMMANDS[language](mainFile);
      const result = await execCommand(cmd, sandboxDir, 30000);

      res.json({
        success: result.exitCode === 0,
        stdout: truncateOutput(result.stdout, 8192),
        stderr: truncateOutput(result.stderr, 8192),
        exitCode: result.exitCode,
        executionTime: Date.now() - start,
        language,
      });
    } finally {
      fs.rm(sandboxDir, { recursive: true, force: true }).catch(() => {});
    }
  } catch (error) {
    console.error('[Canvas] /execute error:', error);
    res.status(500).json({
      success: false,
      stdout: '',
      stderr: error.message || 'Execution failed',
      exitCode: 1,
      executionTime: Date.now() - start,
      language: req.body?.language || 'unknown',
    });
  }
});

// ============================================
// DEPLOYMENT ROLLBACK
// POST /api/canvas/deployments/:id/rollback
// ============================================

router.post('/deployments/:id/rollback', requireAuth, requireAnyCanvasPlan, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the deployment to rollback to
    const deployment = await prisma.canvasDeployment.findUnique({ where: { id } });
    if (!deployment) {
      return res.status(404).json({ success: false, error: 'Deployment not found' });
    }

    // Mark all deployments in the same project as stopped, then activate the target
    await prisma.canvasDeployment.updateMany({
      where: { projectId: deployment.projectId },
      data: { status: 'stopped' },
    });

    await prisma.canvasDeployment.update({
      where: { id },
      data: { status: 'live', deployedAt: new Date() },
    });

    // Update project to point to this deployment's URL
    await prisma.canvasProject.update({
      where: { id: deployment.projectId },
      data: {
        status: 'deployed',
        deploymentUrl: deployment.url,
        subdomain: deployment.subdomain,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, message: 'Rollback successful', deploymentId: id });
  } catch (error) {
    console.error('[Canvas] /deployments/:id/rollback error:', error);
    res.status(500).json({ success: false, error: 'Rollback failed' });
  }
});

export default router;
