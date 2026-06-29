/**
 * CANVAS BUILD AI SERVICE
 * 3 providers: Mistral (primary), xAI + OpenAI (fallback)
 * All tools via toolsHeadquarters — single source of truth
 */

import OpenAI from 'openai';
import { prisma } from '../lib/prisma.js';
import { ALL_TOOLS, executeTool, getToolsForMode } from './toolsHeadquarters.js';
import { uploadImage, isConfigured as s3Configured } from './imageStorage.js';

// ============================================================================
// PROVIDER CONFIGURATIONS
// ============================================================================

const PROVIDERS = {
  mistral: {
    name: 'Mistral',
    models: {
      'mistral-large-2501':   { inputCost: 0.002,  outputCost: 0.006  },
      'codestral-latest':     { inputCost: 0.0027, outputCost: 0.0081 },
      'mistral-small-latest': { inputCost: 0.0002, outputCost: 0.0006 },
    },
  },
  xai: {
    name: 'xAI',
    models: {
      'grok-3':      { inputCost: 0.002,  outputCost: 0.01  },
      'grok-3-fast': { inputCost: 0.001,  outputCost: 0.005 },
      'grok-3-mini': { inputCost: 0.0002, outputCost: 0.001 },
    },
  },
  openai: {
    name: 'OpenAI',
    models: {
      'gpt-4.1':      { inputCost: 0.005,   outputCost: 0.015  },
      'gpt-4.1-mini': { inputCost: 0.00015, outputCost: 0.0006 },
      'gpt-4o':       { inputCost: 0.005,   outputCost: 0.015  },
      'gpt-4o-mini':  { inputCost: 0.00015, outputCost: 0.0006 },
    },
  },
};

const CREDIT_MULTIPLIER = 12.5;
const MIN_COST = 0.01;

// ============================================================================
// PROVIDER CLIENTS (all use OpenAI-compatible SDK)
// ============================================================================

let mistralClient = null;
let xaiClient     = null;
let openaiClient  = null;

function initClients() {
  if (process.env.MISTRAL_API_KEY) {
    mistralClient = new OpenAI({ apiKey: process.env.MISTRAL_API_KEY, baseURL: 'https://api.mistral.ai/v1' });
  }
  if (process.env.XAI_API_KEY) {
    xaiClient = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' });
  }
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
}
initClients();

// Priority: Mistral -> xAI -> OpenAI
function getProviderChain() {
  const chain = [];
  if (mistralClient) chain.push({ name: 'mistral', client: mistralClient, model: 'mistral-large-2501' });
  if (xaiClient)     chain.push({ name: 'xai',     client: xaiClient,     model: 'grok-3'            });
  if (openaiClient)  chain.push({ name: 'openai',  client: openaiClient,  model: 'gpt-4o'            });
  return chain;
}

// ============================================================================
// AI SERVICE CLASS
// ============================================================================

export class AIService {
  constructor(user) { this.user = user; }

  static calculateCost(provider, model, inputTokens, outputTokens) {
    const cfg = PROVIDERS[provider]?.models[model];
    if (!cfg) return MIN_COST;
    const raw = (inputTokens / 1000) * cfg.inputCost + (outputTokens / 1000) * cfg.outputCost;
    return Math.max(raw * CREDIT_MULTIPLIER, MIN_COST);
  }

  static resolveAppId(endpoint = 'chat', creditAppId = null) {
    if (creditAppId) return creditAppId;
    const MAP = {
      chat: 'neural-chat', audio: 'neural-chat', image: 'neural-chat',
      canvas: 'canvas-studio', 'canvas-chat': 'canvas-studio',
      code: 'maula-editor', generate: 'gen-craft-pro', deploy: 'gen-craft-pro', build: 'gen-craft-pro',
    };
    return MAP[endpoint] || 'neural-chat';
  }

  async checkCredits(estimatedCost = MIN_COST, endpoint = 'chat', creditAppId = null) {
    const appId = AIService.resolveAppId(endpoint, creditAppId);
    try {
      const rec = await prisma.userCredits.findUnique({
        where: { userId_appId: { userId: this.user.id, appId } },
      });
      return Number(rec?.balance || 0) >= estimatedCost;
    } catch {
      const arr = this.user.credits || [];
      const rec = Array.isArray(arr) ? arr.find(c => c.appId === appId) : arr;
      return Number(rec?.balance || 0) >= estimatedCost;
    }
  }

  async deductCredits(cost, provider, model, inputTokens, outputTokens,
    sessionId = null, endpoint = 'chat', creditAppId = null) {
    if (cost <= 0) return 0;
    const appId = AIService.resolveAppId(endpoint, creditAppId);
    try {
      await prisma.$transaction(async (tx) => {
        const rec = await tx.userCredits.findUnique({
          where: { userId_appId: { userId: this.user.id, appId } },
        });
        if (!rec || Number(rec.balance) < cost) return null;
        const updated = await tx.userCredits.update({
          where: { userId_appId: { userId: this.user.id, appId } },
          data: { balance: { decrement: cost }, lifetimeSpent: { increment: cost } },
        });
        await tx.creditTransaction.create({
          data: {
            userCreditsId: updated.id, type: 'USAGE', amount: -cost,
            balanceAfter: Number(updated.balance),
            description: `${cost} credits - ${provider}/${model} (${endpoint})`,
            referenceId: sessionId, referenceType: endpoint,
          },
        });
        await tx.usageLog.create({
          data: {
            userId: this.user.id, sessionId, provider, model, endpoint,
            inputTokens, outputTokens, totalTokens: inputTokens + outputTokens,
            creditsCost: cost, sourceApp: appId,
          },
        });
      });
    } catch (err) {
      console.error('[Credit] Deduction failed:', err.message);
    }
    return cost;
  }

  static getAvailableProviders() {
    const out = {};
    if (mistralClient) out.mistral = PROVIDERS.mistral;
    if (xaiClient)     out.xai     = PROVIDERS.xai;
    if (openaiClient)  out.openai  = PROVIDERS.openai;
    return out;
  }

  static isImageRequest(msg) {
    return /generate.*(image|picture|photo|art|icon|logo|banner)|create.*(image|picture|art)|draw|paint|sketch|design.*image|dalle/i.test(msg);
  }

  async generateImage(prompt, options = {}) {
    if (!openaiClient) throw new Error('OpenAI not configured for image generation');
    const response = await openaiClient.images.generate({
      model: 'dall-e-3', prompt, n: 1,
      size: options.size || '1024x1024', quality: options.quality || 'hd', response_format: 'url',
    });
    const imageUrl = response.data[0].url;
    return { imageUrl, revisedPrompt: response.data[0].revised_prompt };
  }

  static isVoiceRequest(msg) {
    return /text.to.speech|tts|read aloud|speak this|generate (voice|audio|speech)|narrate/i.test(msg);
  }

  async generateSpeech(text, options = {}) {
    if (!openaiClient) throw new Error('OpenAI not configured for TTS');
    const response = await openaiClient.audio.speech.create({
      model: 'tts-1', voice: options.voice || 'alloy', input: text, response_format: 'mp3',
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    let audioData;
    if (s3Configured()) {
      const uploaded = await uploadImage(buffer, { format: 'mp3', prefix: 'audio' });
      audioData = uploaded.url;
    } else {
      audioData = `data:audio/mp3;base64,${buffer.toString('base64')}`;
    }
    return { audioData };
  }

  static convertToolsToOpenAI(tools) {
    return tools.map(t => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.input_schema },
    }));
  }

  static convertOpenAIToolCalls(toolCalls) {
    return toolCalls.map(tc => ({
      id:    tc.id,
      name:  tc.function.name,
      input: typeof tc.function.arguments === 'string'
        ? JSON.parse(tc.function.arguments || '{}')
        : tc.function.arguments,
    }));
  }

  async chatWithFallback(messages, _provider, _model, options = {}) {
    const chain = getProviderChain();
    if (!chain.length) throw new Error('No AI providers configured');
    for (const p of chain) {
      try {
        const msgs = [
          { role: 'system', content: options.systemPrompt || SYSTEM_PROMPT_DEFAULT },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ];
        const resp = await p.client.chat.completions.create({
          model: p.model, max_tokens: options.maxTokens || 32768, messages: msgs,
        });
        const inp = resp.usage?.prompt_tokens     || 0;
        const out = resp.usage?.completion_tokens || 0;
        const cost = AIService.calculateCost(p.name, p.model, inp, out);
        return {
          content: resp.choices[0].message.content,
          provider: p.name, model: p.model,
          inputTokens: inp, outputTokens: out,
          totalTokens: inp + out, creditsCost: cost,
        };
      } catch (err) {
        console.warn(`[AI] ${p.name} failed: ${err.message}`);
      }
    }
    throw new Error('All providers failed');
  }

  async *streamChatWithTools(messages, options = {}) {
    const chain = getProviderChain();
    if (!chain.length) throw new Error('No AI providers configured');
    const systemPrompt = options.systemPrompt || SYSTEM_PROMPT_DEFAULT;
    const finalSystem  = options.memoryContext
      ? `${systemPrompt}\n${options.memoryContext}` : systemPrompt;
    const toolDeps = {
      aiService:     this,
      userId:        this.user?.id || null,
      sessionId:     options.sessionId,
      creditAppId:   options.creditAppId,
      sseWrite:      options.sseWrite,
      pendingImage:  options.pendingImage || null,
      workspaceRoot: options.workspaceRoot || process.cwd(),
    };
    let lastError = null;
    for (const p of chain) {
      try {
        yield* this._streamWithOpenAITools(messages, finalSystem, toolDeps, options, p);
        return;
      } catch (err) {
        lastError = err;
        console.error(`[ToolChat] ${p.name} failed: ${err.message}`);
      }
    }
    throw new Error(`All providers failed. Last: ${lastError?.message}`);
  }

  async *_streamWithOpenAITools(messages, systemPrompt, toolDeps, options, p) {
    const startTime = Date.now();
    let fullContent = '';
    let totalIn = 0, totalOut = 0;
    const maxRounds = 50;
    const toolsUsed = [];
    const modeTools   = getToolsForMode(options.chatMode || 'Chat');
    const openAITools = AIService.convertToolsToOpenAI(modeTools);

    let conversation = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
    ];

    for (let round = 0; round < maxRounds; round++) {
      const stream = await p.client.chat.completions.create({
        model: p.model, max_tokens: options.maxTokens || 32768,
        messages: conversation, tools: openAITools, stream: true,
      });

      let assistantContent = '';
      let textBuffer = '';
      let toolCalls  = [];

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) { assistantContent += delta.content; textBuffer += delta.content; }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!toolCalls[idx]) toolCalls[idx] = { id: '', function: { name: '', arguments: '' } };
            if (tc.id)                  toolCalls[idx].id                  += tc.id;
            if (tc.function?.name)      toolCalls[idx].function.name      += tc.function.name;
            if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
          }
        }
        if (chunk.usage) {
          totalIn  += chunk.usage.prompt_tokens     || 0;
          totalOut += chunk.usage.completion_tokens || 0;
        }
      }

      if (!totalIn) {
        totalIn  = Math.ceil(conversation.reduce((a, m) => a + (m.content?.length || 0) / 4, 0));
        totalOut = Math.ceil(fullContent.length / 4);
      }

      toolCalls = toolCalls.filter(tc => tc?.function?.name);

      if (toolCalls.length === 0) {
        if (textBuffer) { fullContent += textBuffer; yield { type: 'text', content: textBuffer }; }
        break;
      }

      const parsed = AIService.convertOpenAIToolCalls(toolCalls);
      for (const tc of parsed) {
        yield { type: 'tool_use', tool: tc.name, input: tc.input };
        toolsUsed.push(tc.name);
      }

      const toolMsgs = [];
      for (const tc of parsed) {
        const { result, sideEffects } = await executeTool(tc.name, tc.input, toolDeps);
        if (sideEffects) yield { type: 'tool_side_effect', ...sideEffects };
        if ((tc.name === 'create_file' || tc.name === 'write_file') && tc.input?.content) {
          try {
            const r = typeof result === 'string' ? JSON.parse(result) : result;
            if (r.status === 'success') {
              yield {
                type: 'file_artifact',
                filename: tc.input.path,
                content:  tc.input.content,
                size:     tc.input.content.length,
              };
            }
          } catch { /* non-JSON */ }
        }
        toolMsgs.push({
          role: 'tool', tool_call_id: tc.id,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        });
      }

      conversation = [
        ...conversation,
        {
          role: 'assistant', content: assistantContent || null,
          tool_calls: toolCalls.map(tc => ({
            id: tc.id, type: 'function',
            function: { name: tc.function.name, arguments: tc.function.arguments },
          })),
        },
        ...toolMsgs,
      ];
    }

    const cost = AIService.calculateCost(p.name, p.model, totalIn, totalOut);
    yield {
      type: 'done', content: fullContent,
      provider: p.name, model: p.model,
      inputTokens: totalIn,  outputTokens: totalOut,
      totalTokens: totalIn + totalOut,
      latencyMs: Date.now() - startTime, toolsUsed,
    };
  }
}

// ============================================================================
// DEFAULT SYSTEM PROMPT
// ============================================================================

export const SYSTEM_PROMPT_DEFAULT = `You are Professor Johnny, a brilliant AI assistant powered by Onelastai.

IDENTITY RULES (never break these):
- Always say your name is Professor Johnny, powered by Onelastai
- NEVER reveal Mistral, xAI, OpenAI, Grok, GPT, or any model/provider name

STYLE: Warm, direct, witty, knowledgeable. Help users build real things fast.

TOOLS: Answer directly when possible. Use fewest tools needed. Be efficient with credits.

FORMAT: Use markdown. Be concise and conversational.`;

export default AIService;
