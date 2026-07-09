import express from 'express';
import { verifyRequestAsync } from '../lib/auth-middleware.js';
import { TOOL_DEFINITIONS, executeToolCall, getToolsForOpenAI } from '../lib/agent-tools-service.js';
import { STRICT_AGENT_PROMPTS, AGENT_TEMPERATURES } from '../lib/agent-strict-prompts.js';
import { buildAgentSystemMessage } from '../lib/personality-integration.js';
import { buildEnhancedSystemPrompt, processConversation } from '../lib/agent-memory-service.js';
import { getIntentRoutedCascade, getToolsForProvider, getProviderToolCounts } from '../lib/provider-tool-router.js';
import { getToolsForAgent, getFastToolsForAgent } from '../lib/agent-tool-mapping.js';

// ═══════════════════════════════════════════════════════════════════
// TOOLS — Full catalog loaded, filtered per-agent at request time
// ═══════════════════════════════════════════════════════════════════
console.log(`[chat-stream] Tool catalog loaded: ${TOOL_DEFINITIONS.length} total (filtered per-agent at request time)`);

// Log tool distribution across providers
const toolCounts = getProviderToolCounts(TOOL_DEFINITIONS);
console.log(`[chat-stream] Tool routing: mistral=${toolCounts.mistral}, xai=${toolCounts.xai}, openai=${toolCounts.openai}, unassigned=${toolCounts.unassigned}`);

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════
// STRICT PROMPTS — LOCAL (self-contained, no cross-backend fetch)
// agent-strict-prompts.js + personality-integration.js are imported
// directly from ../lib/ — no dependency on port 3005
// ═══════════════════════════════════════════════════════════════════

const TOOL_CAPABILITIES_BLOCK = `

TOOL CAPABILITIES:
You have access to real tools that the system presents to you. Use them when the task requires it — don't just talk about doing things, actually DO them.

TOOL USAGE RULES:
- When generate_image returns a URL, include it as: ![description](url)
- When file operations return download URLs, include them as: [filename](url)
- You CAN create images, search the web, run code, manage files, query databases, hash data, parse documents, run tests, and much more — these are real capabilities, not pretend
- Never say "I can't do that" for tasks covered by your tools
- Never suggest external websites (Canva, Photoshop, etc.) for things your tools can do
- Use your tools proactively: database, security, API, AI/ML, developer, workflow, knowledge graph, growth, collaboration, business, project management, CRM, HR, legal, marketing, data visualization, geospatial, cloud — all are real and functional`;

// Build prompts data locally — same logic as main backend's /api/agent/prompts endpoint
function buildLocalAgentPrompts() {
  const data = {};
  for (const [agentId] of Object.entries(STRICT_AGENT_PROMPTS)) {
    const fullSystemPrompt = buildAgentSystemMessage(agentId, '');
    data[agentId] = {
      systemPrompt: fullSystemPrompt + TOOL_CAPABILITIES_BLOCK,
      temperature: AGENT_TEMPERATURES[agentId] || 0.7,
    };
  }
  return data;
}

// Cache the built prompts (rebuild every 5 minutes for hot-reload safety)
let cachedStrictPrompts = null;
let strictPromptsCacheTimestamp = 0;
const STRICT_PROMPTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getStrictAgentPrompts() {
  const now = Date.now();
  if (cachedStrictPrompts && now - strictPromptsCacheTimestamp < STRICT_PROMPTS_CACHE_TTL) {
    return cachedStrictPrompts;
  }
  cachedStrictPrompts = buildLocalAgentPrompts();
  strictPromptsCacheTimestamp = now;
  console.log('[chat-stream] Built STRICT_AGENT_PROMPTS locally (self-contained)');
  return cachedStrictPrompts;
}

function getStrictPromptForAgent(agentId) {
  const prompts = getStrictAgentPrompts();
  return prompts[agentId] || null;
}

// Helper function to get API keys at request time
// This ensures environment variables are read dynamically
function getApiKeys() {
  return {
    openai: process.env.OPENAI_API_KEY,
    openaiBackup: process.env.OPENAI_API_KEY_BACKUP,
    xai: process.env.XAI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
  };
}

// ============================================================================
// FAILED MODEL CACHE - Cache failed models for 5 minutes
// ============================================================================
// When a model fails (rate limit, overloaded, etc.), cache it to avoid retries
// Failed models are automatically removed after 5 minutes
// ============================================================================
const FAILED_MODEL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const failedModelCache = new Map(); // key: "provider:model", value: timestamp
const failedProviderCache = new Map(); // key: provider name, value: timestamp — account-level failures
const FAILED_PROVIDER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for account-level failures

// Check if a model is in the failed cache
function isModelFailed(provider, model) {
  const key = `${provider}:${model}`;
  const failedAt = failedModelCache.get(key);
  if (!failedAt) return false;

  // Check if cache has expired
  if (Date.now() - failedAt > FAILED_MODEL_CACHE_TTL) {
    failedModelCache.delete(key);
    return false;
  }
  return true;
}

// Check if entire provider is failed (account-level: no credits, deactivated, etc.)
function isProviderFailed(provider) {
  const failedAt = failedProviderCache.get(provider);
  if (!failedAt) return false;
  if (Date.now() - failedAt > FAILED_PROVIDER_CACHE_TTL) {
    failedProviderCache.delete(provider);
    return false;
  }
  return true;
}

// Mark a model as failed
function markModelFailed(provider, model) {
  const key = `${provider}:${model}`;
  failedModelCache.set(key, Date.now());
  console.log(`[chat-stream] Model ${model} marked as failed for 5 minutes`);
}

// Mark entire provider as failed (account-level errors skip all models)
function markProviderFailed(provider, reason) {
  failedProviderCache.set(provider, Date.now());
  console.log(`[chat-stream] Provider ${provider} marked as ACCOUNT-FAILED for 30 minutes: ${reason}`);
}

// Detect account-level errors that affect ALL models in a provider
function isAccountLevelError(errorStr) {
  const accountErrors = [
    'credit balance is too low',
    'account_deactivated',
    'account has been deactivated',
    'insufficient_quota',
    'billing',
    'payment required',
    'exceeded your current quota',
  ];
  const lower = (errorStr || '').toLowerCase();
  return accountErrors.some(e => lower.includes(e));
}

// Clean up expired cache entries periodically
function cleanupFailedCache() {
  const now = Date.now();
  for (const [key, timestamp] of failedModelCache.entries()) {
    if (now - timestamp > FAILED_MODEL_CACHE_TTL) {
      failedModelCache.delete(key);
    }
  }
  for (const [key, timestamp] of failedProviderCache.entries()) {
    if (now - timestamp > FAILED_PROVIDER_CACHE_TTL) {
      failedProviderCache.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupFailedCache, 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER CASCADE — Auto-fallback across 3 LLM providers
// ═══════════════════════════════════════════════════════════════════════════════
// Order driven by AGENT_PROVIDER_CASCADE env var (e.g. "openai,xai,mistral" for comedy-king).
// Falls back to mistral→xai→openai if env not set (shared backend default).
// Account-level failures skip entire provider for 30 minutes.
// ═══════════════════════════════════════════════════════════════════════════════

// ProviderConfig: { name, apiUrl, models[], maxTokens, supportsVision }

// All 3 provider definitions — order is determined dynamically from env
const ALL_PROVIDER_CONFIGS = {
  openai: {
    name: 'openai',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini'],
    maxTokens: 16384,
    supportsVision: true,
  },
  xai: {
    name: 'xai',
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    models: ['grok-3-mini-fast', 'grok-3-fast', 'grok-2-1212'],
    maxTokens: 32768,
    supportsVision: true,
  },
  mistral: {
    name: 'mistral',
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    models: ['mistral-small-latest', 'mistral-large-latest', 'codestral-latest'],
    maxTokens: 16384,
    supportsVision: true,
  },
};

// Build cascade from AGENT_PROVIDER_CASCADE env var — read lazily at request time
// so dotenv has already injected the per-agent .env before the value is resolved.
// comedy-king.env sets "openai,xai,mistral" → openai is primary for this agent.
// Shared backend (no env set) defaults to "mistral,xai,openai".
function getProviderCascade() {
  const cascadeEnv = (process.env.AGENT_PROVIDER_CASCADE || 'mistral,xai,openai')
    .split(',').map(s => s.trim()).filter(Boolean);
  return cascadeEnv.map(name => ALL_PROVIDER_CONFIGS[name]).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODE-SPECIFIC PROVIDER PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════════
// Each chat mode can reorder the cascade to prefer providers best suited for
// that task. The full cascade still applies as fallback.
// ═══════════════════════════════════════════════════════════════════════════════
const MODE_PREFERRED_PROVIDERS = {
  // Code mode: Mistral codestral-latest is purpose-built for code generation
  // then OpenAI gpt-4o for complex tasks, xAI as last resort
  code: ['mistral', 'openai', 'xai'],
  // Images mode: OpenAI DALL-E / generate_image is an OPENAI_TOOL → must be primary
  // Mistral as fallback for text synthesis after image URL is returned
  images: ['openai', 'mistral', 'xai'],
  // Search mode: xAI Grok excels at real-time synthesis and current events reasoning
  // OpenAI as strong fallback for structured synthesis
  search: ['xai', 'openai', 'mistral'],
  // Video mode: generate_video is an OPENAI_TOOL → OpenAI primary
  video: ['openai', 'xai', 'mistral'],
  // Default chat: empty = use PROVIDER_CASCADE as-is (openai-first for comedy-king via env)
  chat: [],
};

// Reorder cascade based on mode preferences.
// Per-agent dedicated order: check AGENT_PROVIDER_<MODE> env var first (e.g. AGENT_PROVIDER_CODE).
// Falls back to hardcoded MODE_PREFERRED_PROVIDERS, then the base cascade.
function getCascadeForMode(mode) {
  // Check for a per-agent per-mode env var (set in ecosystem.config.cjs per agent)
  const modeEnvKey = `AGENT_PROVIDER_${mode.toUpperCase()}`;
  const modeEnvVal = process.env[modeEnvKey];
  if (modeEnvVal) {
    const order = modeEnvVal.split(',').map(s => s.trim()).filter(Boolean);
    const resolved = order.map(name => ALL_PROVIDER_CONFIGS[name]).filter(Boolean);
    if (resolved.length > 0) return resolved;
  }

  // Read cascade fresh from env (lazy — dotenv has already run by now)
  const PROVIDER_CASCADE = getProviderCascade();

  // Fall back to hardcoded per-mode preference table
  const preferred = MODE_PREFERRED_PROVIDERS[mode] || [];
  if (preferred.length === 0) return [...PROVIDER_CASCADE];

  const cascade = [...PROVIDER_CASCADE];
  const prioritized = [];
  const remaining = [];
  for (const provider of cascade) {
    if (preferred.includes(provider.name)) {
      prioritized.push(provider);
    } else {
      remaining.push(provider);
    }
  }
  prioritized.sort((a, b) => preferred.indexOf(a.name) - preferred.indexOf(b.name));
  return [...prioritized, ...remaining];
}

// Get API key for a provider
function getProviderApiKey(providerName, apiKeys) {
  const keyMap = {
    openai: apiKeys.openai,
    xai: apiKeys.xai,
    mistral: apiKeys.mistral,
  };
  return keyMap[providerName] || null;
}

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_MESSAGES = 200; // 200 messages per hour - increased for better UX

function getRateLimitKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? forwarded.split(',')[0]
    : req.headers['x-real-ip'] || 'unknown';
  return `agent-stream-${ip}`;
}

function checkRateLimit(key) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(key);

  if (!userLimit || now > userLimit.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: RATE_LIMIT_MAX_MESSAGES - 1 };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_MESSAGES) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_MESSAGES - userLimit.count,
  };
}

// Attachment: { name?, type?, url?, data? }

router.post('/', async (req, res) => {
  try {
    const rateLimitKey = getRateLimitKey(req);
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
      });
    }

    const body = req.body;

    // ═══════════════════════════════════════════════════════════════════
    // AUTH — Extract userId from session cookie, NEVER trust body.userId
    // Guests get an IP-based anonymous ID. Authenticated users get their
    // real DB userId. This prevents userId spoofing attacks.
    // ═══════════════════════════════════════════════════════════════════
    let authenticatedUserId = null;
    try {
      const authResult = await verifyRequestAsync(req);
      if (authResult.ok && authResult.user?.id) {
        authenticatedUserId = authResult.user.id;
      }
    } catch {
      // Auth verification failed — treat as guest
    }
    // For guests, use IP-based stable ID (never from body)
    const guestId = `anon_${rateLimitKey}`;
    const resolvedUserId = authenticatedUserId || guestId;

    // Extract settings from nested object if provided (from UniversalAgentChat)
    // or from top-level properties for backwards compatibility
    const settings = body.settings || {};
    const {
      message,
      conversationHistory = [],
      provider = settings.provider || 'xai',
      model = settings.model,
      temperature: requestedTemperature = settings.temperature || 0.7,
      maxTokens = settings.maxTokens || 4096,
      systemPrompt: requestedSystemPrompt = settings.systemPrompt,
      attachments = [],
      agentId,
      mode, // 'chat' (default) | 'code' | etc.
    } = body;

    // ═══════════════════════════════════════════════════════════════════
    // STRICT PROMPTS - Backend agent-strict-prompts.js is the ONLY source
    // Frontend systemPrompt is IGNORED when backend prompt is available
    // ═══════════════════════════════════════════════════════════════════
    let systemPrompt = requestedSystemPrompt;
    let temperature = requestedTemperature;
    if (agentId) {
      const strictConfig = await getStrictPromptForAgent(agentId);
      if (strictConfig) {
        systemPrompt = strictConfig.systemPrompt;
        temperature = strictConfig.temperature || temperature;
        console.log(`[chat-stream] Using STRICT_AGENT_PROMPT for ${agentId}`);
      } else {
        console.log(
          `[chat-stream] No strict prompt for ${agentId}, using frontend fallback`
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════
    // MODE OVERRIDES — Adjust system prompt and temperature per mode.
    // All modes still use the full streaming pipeline with history,
    // attachments, DB sessions, and memory extraction.
    // ═══════════════════════════════════════════════════════════════════
    if (mode === 'code') {
      systemPrompt = `You are an expert code-focused AI assistant. Your primary purpose is to write clean, efficient, production-ready code.

RULES:
- Always respond with code in properly formatted markdown code blocks (\`\`\`language ... \`\`\`)
- Include clear comments explaining the logic
- Follow best practices and idiomatic patterns for the language
- If the user doesn't specify a language, use the most appropriate one
- Provide complete, runnable code — not snippets or pseudocode
- If multiple files are needed, clearly label each one
- After the code, give a brief explanation of how it works
- Do NOT use any tools — respond directly with code in your message`;
      temperature = 0.3;
      console.log(`[chat-stream] Code mode activated — using code-focused system prompt`);
    }

    if (mode === 'images') {
      // The frontend pre-generates the image via /api/media/generate-image
      // and includes the result in the message body within [IMAGE_GENERATED] tags.
      // The AI should present the image beautifully and offer creative follow-ups.
      const basePrompt = systemPrompt || '';
      systemPrompt = `${basePrompt}

IMAGE MODE INSTRUCTIONS:
You are a creative image assistant. The user's message may contain [IMAGE_GENERATED] tags with a generated image URL and prompt details.
- Display the image using markdown: ![description](url)
- Describe the generated image in vivid detail.
- Suggest creative variations, edits, or follow-up prompts.
- If the image generation failed (see [IMAGE_GENERATION_FAILED] tags), explain the issue and suggest how to fix the prompt.
- You can still answer general questions — image mode is the user's preference, not a strict limitation.
- Keep the conversation natural and reference previous messages when relevant.`;
      console.log(`[chat-stream] Images mode activated — using image-aware system prompt`);
    }

    if (mode === 'search') {
      // The frontend pre-fetches web search results via /api/agent/search
      // and includes them in the message body within [SEARCH_RESULTS] tags.
      // The AI should synthesize the results with full conversation context.
      const basePrompt = systemPrompt || '';
      systemPrompt = `${basePrompt}

SEARCH MODE INSTRUCTIONS:
You are a search-augmented AI assistant. The user's message may contain [SEARCH_RESULTS] tags with fresh web search data.
- Synthesize the search results into a clear, comprehensive answer.
- Cite sources with linked references where relevant.
- Add your own analysis and insights beyond what the search returned.
- Reference previous conversation context when it helps provide a better answer.
- If the search failed (see [SEARCH_FAILED] tags), answer from your own knowledge and suggest better search terms.
- You can still handle general questions — search mode is the user's preference, not a strict limitation.`;
      console.log(`[chat-stream] Search mode activated — using search-aware system prompt`);
    }

    if (mode === 'video') {
      const basePrompt = systemPrompt || '';
      systemPrompt = `${basePrompt}

VIDEO MODE INSTRUCTIONS:
You are a video creation assistant with access to the generate_video tool (RunwayML) and video processing tools (video_transform, video_convert, video_analyze, video_overlay, video_filter, video_audio, video_ai, video_batch).
- When the user asks to generate or create a video, call generate_video with a vivid, detailed prompt.
- When the user uploads a video and asks to edit/process it, use the appropriate video_* tool.
- After generating a video, describe what was created. The UI will render the video player automatically.
- Suggest creative variations and follow-up ideas.
- Never output raw video URLs in your text — the UI handles video display automatically.`;
      console.log(`[chat-stream] Video mode activated`);
    }

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get API keys at request time
    const apiKeys = getApiKeys();

    // Log request details for debugging
    console.log(
      `[chat-stream] Request received - agentId: ${agentId}, provider: ${provider}, model: ${model}`
    );
    console.log(`[chat-stream] Settings from body:`, JSON.stringify(settings));
    console.log(
      `[chat-stream] Available providers: mistral=${!!apiKeys.mistral}, xai=${!!apiKeys.xai}, openai=${!!apiKeys.openai}`
    );

    // Inject user memories into system prompt (only for authenticated users)
    if (authenticatedUserId) {
      systemPrompt = await buildEnhancedSystemPrompt(authenticatedUserId, agentId, systemPrompt || '');
    }

    // Create streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // AbortController — abort AI fetch calls when client disconnects
    const streamAbort = new AbortController();
    let clientDisconnected = false;
    let heartbeatRef = null; // set inside stream(), cleared on disconnect
    req.on('close', () => {
      clientDisconnected = true;
      streamAbort.abort();
      if (heartbeatRef) clearInterval(heartbeatRef);
      console.log('[cascade] Client disconnected — cleanup done');
    });

    const stream = async () => {
      try {
        // Build messages array
        const messages = [];

        // System prompt — tools are provided via the tools parameter
        // No fake capability injection. The LLM sees real tools and decides when to use them.
        const finalSystemPrompt =
          systemPrompt || 'You are a helpful AI assistant.';
        messages.push({
          role: 'system',
          content:
            finalSystemPrompt +
            '\n\nYou have access to tools that you can use when appropriate. After file/image tools run, the UI AUTOMATICALLY renders download buttons. Do NOT include any download URLs or links in your text response — just describe what was created.' +
            '\n\nCRITICAL — CODE REQUESTS:' +
            '\n- When a user asks you to "write code", "show code", "give me code", or similar, ALWAYS write the code DIRECTLY in your chat response using markdown code blocks (```language ... ```). Do NOT use the create_file tool.' +
            '\n- Only use create_file when the user EXPLICITLY asks to "save a file", "create a file", "download a file", or "make me a file I can download".' +
            '\n- If the user asks "write me a car racing game" or "write the codes", respond with the FULL code in a code block in your message. Do NOT call create_file.' +
            '\n\nIMPORTANT RULES FOR IMAGE GENERATION:' +
            '\n- Generate at most 2 images per response unless the user explicitly asks for more.' +
            '\n- NEVER embed base64 data (data:image/...) in your response.' +
            '\n- After generating an image, the UI will AUTOMATICALLY display it with preview and download buttons. You do NOT need to include the image URL, markdown image, download link, or any URL in your text response.' +
            '\n- NEVER output any URL starting with https:// in your response text when discussing generated images. The UI handles all image/file display.' +
            '\n- Just write a brief 1-2 sentence description of what you created. Example: "Here is your logo featuring the company name in bold modern typography with a gradient blue background."' +
            '\n\nCRITICAL RESPONSE RULES:' +
            '\n- When presenting tool results (images, files, calculations, etc.), be PROFESSIONAL and CONCISE.' +
            '\n- Do NOT include roleplay actions like *gasps*, *throws hands*, *strikes a pose*, *flourishes cape*, etc.' +
            '\n- Do NOT repeat raw URLs, prompt text, style names, or dimensions from tool results.' +
            '\n- NEVER output long URLs or links for generated images — the frontend renders images automatically.' +
            '\n- Focus on UNDERSTANDING the user\'s actual request and delivering exactly what they asked for.' +
            '\n- If the user asks to create a logo, create a logo. If they ask for a website design, create that.' +
            '\n- NEVER wrap action descriptions in asterisks (*). Express personality through words and tone only.' +
            '\n\nCRITICAL — NO RAW HTML:' +
            '\n- NEVER output raw HTML tags like <div>, <style>, <script>, <button>, <span>, <table>, <iframe> etc.' +
            '\n- NEVER output inline CSS styles or style attributes.' +
            '\n- Use ONLY standard Markdown for formatting: headers (#), bold (**), italic (*), lists (-), code blocks (```), tables (|), links, etc.' +
            '\n- If asked to create a widget, calendar, app, or interactive element, provide the code INSIDE a markdown code block (```html ... ```) so users can copy it — NEVER render raw HTML directly in your response.' +
            '\n- Any HTML outside of code blocks will be stripped and look broken to the user.' +
            '\n\n🌐 PLATFORM KNOWLEDGE — MUMTAZ AI:' +
            '\nYou are part of the Mumtaz AI platform (mumtaz.ai). Know these facts:' +
            '\n- **Main site**: https://mumtaz.ai — dashboard, billing, account management' +
            '\n- **Chat app** (this site): https://chat.mumtaz.ai — AI agent conversations with 18+ unique agents' +
            '\n- **Canvas App**: https://build.mumtaz.ai — AI-powered code generation with live preview, build full apps' +
            '\n- **Canvas Studio**: https://studio.mumtaz.ai — visual design studio with AI assistance' +
            '\n- **Features**: AI chat with multiple providers (Mistral, xAI, OpenAI), image generation, code execution, file operations, web search, document parsing (PDF/DOCX/CSV), audio transcription, video generation, data visualization' +
            '\n- **Agents**: 18+ AI personalities — each with unique character and expertise' +
            '\n- **Pricing**: One-time purchase plans (daily $1, weekly $5, monthly $15, yearly $150) — no auto-renewal, no subscriptions' +
            '\n- **Memory**: You have persistent memory via the agent_memory tool. Use it to remember user preferences, past conversations, and important facts.' +
            '\n- When users ask about pricing, features, or how the platform works, answer confidently with this knowledge.' +
            '\n- When users share preferences or important info, save it to memory using agent_memory tool with action "save".' +
            '\n- At the start of conversations, try to recall relevant memories using agent_memory with action "get".',
        });

        // Add conversation history - but filter out base64 image data to prevent token overflow
        for (const msg of conversationHistory) {
          let content = msg.content;

          // Strip base64 image data URLs from content (they can be 2MB+ and cause token limit errors)
          // Replace with a placeholder so the AI knows an image was there
          if (content && typeof content === 'string') {
            // Match markdown images with base64 data URLs: ![alt](data:image/...)
            content = content.replace(
              /!\[([^\]]*)\]\(data:image\/[^)]+\)/g,
              '[Generated Image: $1]'
            );
            // Also match standalone base64 data URLs
            content = content.replace(
              /data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]{100,}/g,
              '[base64 image data removed]'
            );
          }

          messages.push({
            role: msg.role,
            content: content,
          });
        }

        // Build user message content
        const userContent = [{ type: 'text', text: message }];

        // Add image attachments
        if (attachments && attachments.length > 0) {
          for (const attachment of attachments) {
            if (attachment.type?.startsWith('image/')) {
              if (attachment.url) {
                userContent.push({
                  type: 'image_url',
                  image_url: { url: attachment.url, detail: 'auto' },
                });
              } else if (attachment.data) {
                const base64Data = attachment.data.includes('base64,')
                  ? attachment.data
                  : `data:${attachment.type};base64,${attachment.data}`;
                userContent.push({
                  type: 'image_url',
                  image_url: { url: base64Data, detail: 'auto' },
                });
              }
            }
          }
        }

        messages.push({
          role: 'user',
          content: userContent.length === 1 ? message : userContent,
        });

        // Helper function to convert messages to text-only (for providers that don't support images)
        function getTextOnlyMessages() {
          return messages.map((m) => {
            if (typeof m.content === 'string') return m;
            if (Array.isArray(m.content)) {
              // Extract only text content, describe images
              const textParts = m.content
                .filter((item) => item.type === 'text')
                .map((item) => item.text);
              const imageCount = m.content.filter(
                (item) =>
                  item.type === 'image_url' || item.type === 'image'
              ).length;
              if (imageCount > 0) {
                textParts.push(
                  `[User attached ${imageCount} image(s) - Note: This model does not support image analysis]`
                );
              }
              return { ...m, content: textParts.join('\n') };
            }
            return m;
          });
        }

        // ═══════════════════════════════════════════════════════════════════
        // CASCADE STREAMING ENGINE
        // ═══════════════════════════════════════════════════════════════════
        // Tries providers in order: mistral → xai → openai
        // If a provider fails, automatically tries the next one.
        // If a response is truncated (token limit), the next provider CONTINUES
        // from where the previous left off — seamless to the user.
        // ═══════════════════════════════════════════════════════════════════

        // Stream from OpenAI-compatible provider — with tool calling support
        // Returns: { success, text, finishReason, toolCalls? }
        async function streamOpenAICompatible(
          apiUrl,
          apiKey,
          modelName,
          messagesToSend,
          providerMaxTokens,
          tools,
          signal
        ) {
          const requestBody = {
            model: modelName,
            messages: messagesToSend,
            temperature,
            max_tokens: providerMaxTokens,
            stream: true,
          };

          // Add tools in OpenAI format
          if (tools && tools.length > 0) {
            requestBody.tools = getToolsForOpenAI(tools);
          }

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
            signal, // abort when client disconnects
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error(`[cascade] ${modelName} failed:`, errorData);
            throw new Error(`API error: ${response.status} — ${errorData}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No reader available');

          const decoder = new TextDecoder();
          let buffer = '';
          let collectedText = '';
          let finishReason = 'stop';
          const toolCallBuffers = new Map();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);

                  // Regular text content
                  const token = parsed.choices?.[0]?.delta?.content;
                  if (token) {
                    collectedText += token;
                    res.write(`data: ${JSON.stringify({ token })}\n\n`);
                  }

                  // Tool calls in delta — LLM decided to call a function
                  const deltaToolCalls =
                    parsed.choices?.[0]?.delta?.tool_calls;
                  if (deltaToolCalls) {
                    for (const tc of deltaToolCalls) {
                      const idx = tc.index ?? 0;
                      if (!toolCallBuffers.has(idx)) {
                        toolCallBuffers.set(idx, {
                          id: tc.id || '',
                          name: '',
                          arguments: '',
                        });
                        // Tool usage runs silently in background — no visible token to user
                      }
                      const buf = toolCallBuffers.get(idx);
                      if (tc.id) buf.id = tc.id;
                      if (tc.function?.name) {
                        // Only accept clean tool names (no spaces, max 50 chars)
                        const name = tc.function.name;
                        if (name.length <= 50 && /^[a-z_]+$/.test(name)) {
                          buf.name = name;
                        }
                      }
                      if (tc.function?.arguments)
                        buf.arguments += tc.function.arguments;
                    }
                  }

                  // Detect finish reason
                  const fr = parsed.choices?.[0]?.finish_reason;
                  if (fr === 'tool_calls') finishReason = 'tool_calls';
                  if (fr === 'length') finishReason = 'length';
                  if (fr === 'stop') finishReason = 'stop';
                } catch (e) {
                  /* skip invalid JSON */
                }
              }
            }
          }

          // Convert collected tool call buffers to tool calls
          // Validate tool names — Mistral/other providers can garble tool calls
          const VALID_TOOL_NAMES = new Set(TOOL_DEFINITIONS.map(t => t.name));
          const toolCalls = [];
          for (const [, buf] of toolCallBuffers) {
            // Reject tool calls with invalid names (garbled by model)
            if (!buf.name || !VALID_TOOL_NAMES.has(buf.name)) {
              console.warn(
                `[tool-parse] Rejected invalid tool name: "${(buf.name || '').substring(0, 80)}..."`
              );
              continue;
            }
            try {
              toolCalls.push({
                id: buf.id,
                name: buf.name,
                input: JSON.parse(buf.arguments || '{}'),
              });
            } catch (parseErr) {
              console.error(
                '[tool-parse] Failed to parse tool arguments:',
                buf.arguments?.substring(0, 200)
              );
            }
          }

          return {
            success: true,
            text: collectedText,
            finishReason,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          };
        }

        // ═══════════════════════════════════════════════════════════════════
        // Helper: Build file_data for file tool preview panels on frontend
        const FILE_TOOLS = new Set(['create_file', 'write_file', 'modify_file', 'read_file']);
        function buildFileData(toolName, toolArgs, toolResult) {
          if (!FILE_TOOLS.has(toolName) || !toolResult.success) return undefined;
          try {
            // For create/write/modify, content comes from args; for read, from result
            let content, filename, path, folder;
            if (toolName === 'read_file') {
              const data = typeof toolResult.data === 'string' ? JSON.parse(toolResult.data) : toolResult.data;
              content = data?.content || '';
              filename = data?.filename || toolArgs?.filename || 'file';
              path = data?.path || undefined;
            } else {
              content = toolArgs?.content || '';
              filename = toolArgs?.filename || 'file';
              path = toolArgs?.folder ? `${toolArgs.folder}/${filename}` : `/${filename}`;
              folder = toolArgs?.folder || '';
            }
            // Truncate content for SSE (max 50KB to avoid SSE payload issues)
            if (content && content.length > 50000) content = content.substring(0, 50000) + '\n... [truncated]';
            return { filename, path, folder, content, tool: toolName };
          } catch (e) {
            console.warn('[buildFileData] Failed to extract file data:', e.message);
            return undefined;
          }
        }

        // ═══════════════════════════════════════════════════════════════════
        // Helper: Build web_data for Research Panel on frontend
        const WEB_TOOLS = new Set(['fetch_url', 'fetch_webpage', 'web_scrape', 'web_search', 'http_request', 'web_analyze']);
        function buildWebData(toolName, toolArgs, toolResult) {
          if (!WEB_TOOLS.has(toolName) || !toolResult.success) return undefined;
          try {
            let content = '';
            const d = toolResult.data;
            
            // Extract meaningful text based on tool type
            if (toolName === 'web_search' && d.results && Array.isArray(d.results)) {
              // Format search results as readable text (not JSON)
              const formatted = d.results.map((r, i) => {
                const parts = [];
                if (r.title) parts.push(`${i + 1}. ${r.title}`);
                if (r.link || r.url) parts.push(`   ${r.link || r.url}`);
                if (r.snippet || r.description) parts.push(`   ${r.snippet || r.description}`);
                return parts.join('\n');
              }).join('\n\n');
              content = formatted;
            } else if ((toolName === 'fetch_webpage' || toolName === 'web_scrape') && typeof d === 'string') {
              // Already extracted text
              content = d;
            } else if ((toolName === 'fetch_webpage' || toolName === 'web_scrape') && d.text) {
              // Extracted text in text field
              content = d.text;
            } else if ((toolName === 'fetch_webpage' || toolName === 'web_scrape') && d.content) {
              // Extracted content field
              content = d.content;
            } else if (typeof d === 'string') {
              // Already a string
              content = d;
            } else {
              // Last resort: format as readable JSON for structured data
              content = JSON.stringify(d, null, 2);
            }
            
            const url = toolArgs?.url || toolArgs?.query || '';
            const title = toolArgs?.url ? new URL(toolArgs.url).hostname : (toolArgs?.query || toolName);
            // Truncate for SSE (max 30KB)
            const finalContent = content.length > 30000 ? content.substring(0, 30000) + '\n... [truncated]' : content;
            return { url, title, content: finalContent, tool: toolName };
          } catch (e) {
            // URL parsing may fail for search queries or other errors
            let fallbackContent = '';
            if (typeof toolResult.data === 'string') {
              fallbackContent = toolResult.data;
            } else if (toolResult.data?.results && Array.isArray(toolResult.data.results)) {
              // Try to extract search results even on error
              fallbackContent = toolResult.data.results.map((r, i) => {
                const parts = [];
                if (r.title) parts.push(`${i + 1}. ${r.title}`);
                if (r.link || r.url) parts.push(`   ${r.link || r.url}`);
                if (r.snippet || r.description) parts.push(`   ${r.snippet || r.description}`);
                return parts.join('\n');
              }).join('\n\n');
            } else {
              fallbackContent = JSON.stringify(toolResult.data);
            }
            return { url: toolArgs?.url || toolArgs?.query || '', title: toolArgs?.url || toolArgs?.query || toolName, content: fallbackContent.substring(0, 30000), tool: toolName };
          }
        }

        // ═══════════════════════════════════════════════════════════════════
        // Helper: Build geo_data for Map Panel on frontend (separate from web_data)
        const GEO_TOOLS = new Set(['geo_geocode', 'geo_route', 'geo_distance', 'geo_search', 'geo_fence', 'geo_timezone', 'geo_elevation', 'geo_ip', 'geo_cluster', 'geo_transform']);
        function buildGeoData(toolName, toolArgs, toolResult) {
          if (!GEO_TOOLS.has(toolName) || !toolResult.success) return undefined;
          try {
            const d = toolResult.data;
            const locations = [];
            let route = undefined;
            let type = 'location';
            let title = toolName;

            // geo_geocode — single or batch locations
            if (toolName === 'geo_geocode') {
              title = toolArgs?.address || 'Geocode';
              if (d.lat !== undefined && d.lng !== undefined) {
                locations.push({ lat: d.lat, lng: d.lng, name: d.address || toolArgs?.address, address: d.formattedAddress || d.address || toolArgs?.address, placeId: d.placeId });
              }
              if (d.results && Array.isArray(d.results)) {
                for (const r of d.results) {
                  if (r.lat !== undefined && r.lng !== undefined) {
                    locations.push({ lat: r.lat, lng: r.lng, name: r.address || r.formattedAddress, address: r.formattedAddress || r.address, placeId: r.placeId });
                  }
                }
              }
            }

            // geo_route — directions with origin/destination
            if (toolName === 'geo_route') {
              type = 'route';
              title = 'Route';
              const orig = toolArgs?.origin || {};
              const dest = toolArgs?.destination || {};
              if (orig.lat && orig.lng) locations.push({ lat: orig.lat, lng: orig.lng, name: orig.address || 'Origin' });
              if (dest.lat && dest.lng) locations.push({ lat: dest.lat, lng: dest.lng, name: dest.address || 'Destination' });
              route = {
                distance: d.distance || 'N/A',
                duration: d.duration || 'N/A',
                steps: d.steps || [],
                origin: { lat: orig.lat, lng: orig.lng, name: orig.address || 'Origin', address: orig.address },
                destination: { lat: dest.lat, lng: dest.lng, name: dest.address || 'Destination', address: dest.address },
                waypoints: (toolArgs?.waypoints || []).filter(w => w.lat && w.lng),
                mode: toolArgs?.mode || 'driving',
              };
            }

            // geo_search — nearby places
            if (toolName === 'geo_search') {
              type = 'places';
              title = toolArgs?.query || toolArgs?.category || 'Places';
              if (d.places && Array.isArray(d.places)) {
                for (const p of d.places) {
                  if (p.lat !== undefined && p.lng !== undefined) {
                    locations.push({ lat: p.lat, lng: p.lng, name: p.name, type: p.type || toolArgs?.category, placeId: p.placeId });
                  }
                }
              }
              // Also add the search center if provided
              if (toolArgs?.location?.lat && toolArgs?.location?.lng && locations.length === 0) {
                locations.push({ lat: toolArgs.location.lat, lng: toolArgs.location.lng, name: 'Search center' });
              }
            }

            // geo_distance — show the two points
            if (toolName === 'geo_distance') {
              title = `Distance: ${d.distance || 'N/A'} ${d.unit || 'km'}`;
              if (toolArgs?.point1?.lat && toolArgs?.point1?.lng) locations.push({ lat: toolArgs.point1.lat, lng: toolArgs.point1.lng, name: 'Point A' });
              if (toolArgs?.point2?.lat && toolArgs?.point2?.lng) locations.push({ lat: toolArgs.point2.lat, lng: toolArgs.point2.lng, name: 'Point B' });
            }

            // geo_fence — show the fence center/vertices
            if (toolName === 'geo_fence') {
              title = d.name || toolArgs?.name || 'Geofence';
              if (d.center?.lat && d.center?.lng) locations.push({ lat: d.center.lat, lng: d.center.lng, name: d.name || 'Fence center' });
              if (toolArgs?.center?.lat && toolArgs?.center?.lng && locations.length === 0) {
                locations.push({ lat: toolArgs.center.lat, lng: toolArgs.center.lng, name: toolArgs.name || 'Fence' });
              }
            }

            // geo_ip — show IP location
            if (toolName === 'geo_ip') {
              title = toolArgs?.ip || 'IP Location';
              if (d.lat !== undefined && d.lng !== undefined) {
                locations.push({ lat: d.lat, lng: d.lng, name: d.city || d.region || toolArgs?.ip, address: [d.city, d.region, d.country].filter(Boolean).join(', ') });
              }
            }

            // geo_elevation — show the point
            if (toolName === 'geo_elevation') {
              title = `Elevation: ${d.elevation || 'N/A'}m`;
              if (toolArgs?.lat !== undefined && toolArgs?.lng !== undefined) {
                locations.push({ lat: toolArgs.lat, lng: toolArgs.lng, name: `Elevation: ${d.elevation || '?'}m` });
              }
            }

            // If no locations extracted, skip
            if (locations.length === 0) return undefined;

            const rawData = typeof d === 'string' ? d : JSON.stringify(d, null, 2);

            return { type, title, locations, route, rawData: rawData.substring(0, 15000), tool: toolName };
          } catch (e) {
            console.warn('[buildGeoData] Failed to extract geo data:', e.message);
            return undefined;
          }
        }

        // CASCADE EXECUTION — Never fail, exhaust ALL providers
        // With tool calling loop: model calls tools → backend executes → results fed back
        // ═══════════════════════════════════════════════════════════════════
        const MAX_TOOL_ROUNDS = 3; // Reduced from 5 to prevent long waits on persistent failures
        // CORE TOOLS (~28) sent to models instead of full 292 — saves ~55K tokens per request
        // If a provider doesn't support tools, it errors and cascade continues to next
        const userId = resolvedUserId;
        // Track per-tool call counts to prevent over-generation
        const toolCallCounts = {};
        const TOOL_CALL_LIMITS = {
          generate_image: 3,
          generate_video: 2,
        };
        // Track consecutive failures per tool — break loop after 2 failures of same tool
        const toolFailureCounts = {};

        let accumulatedResponse = '';
        let isComplete = false;
        let anyProviderWorked = false;

        // SSE heartbeat — keeps Cloudflare (524 timeout = 100s) alive during long tool calls
        const heartbeatInterval = setInterval(() => {
          try { if (!clientDisconnected) res.write(': heartbeat\n\n'); } catch (_) { /* connection closed */ }
        }, 15000); // every 15 seconds
        heartbeatRef = heartbeatInterval;

        const cascadeOrder = getCascadeForMode(mode || 'chat');

        // ═══════════════════════════════════════════════════════════════
        // INTENT-BASED PROVIDER ROUTING
        // Analyze user message → route to provider whose tools match best
        // Each provider only sees its specialized tool subset
        // Fallback providers get ALL tools to ensure nothing is missed
        // ═══════════════════════════════════════════════════════════════
        const intentCascade = getIntentRoutedCascade(cascadeOrder, message);

        // ═══════════════════════════════════════════════════════════════
        // AGENT-FILTERED TOOLS — Only send tools relevant to this agent.
        // Heavy agents (tech-wizard, mrs-boss) further narrow by sub-intent
        // keywords in the user message — see SUB_INTENT_GROUPS in
        // agent-tool-mapping.js. Reference is stable across repeat requests
        // so provider-filter and OpenAI-format WeakMap caches stay warm.
        // ═══════════════════════════════════════════════════════════════
        const agentTools = getFastToolsForAgent(agentId, TOOL_DEFINITIONS, message);
        console.log(`[cascade] Agent "${agentId || 'unknown'}" gets ${agentTools.length}/${TOOL_DEFINITIONS.length} tools`);

        const totalCascadeTokens = intentCascade.reduce((sum, p) => sum + p.maxTokens, 0);
        console.log(
          `[cascade] Starting provider cascade (requested: ${provider}/${model}) — total capacity: ${totalCascadeTokens.toLocaleString()} tokens across ${intentCascade.length} providers, order: ${intentCascade.map(p => p.name).join(' → ')}`
        );

        let isFirstProvider = true;
        for (const providerConfig of intentCascade) {
          if (isComplete || clientDisconnected) break;

          const apiKey = getProviderApiKey(providerConfig.name, apiKeys);
          const backupKey =
            providerConfig.name === 'openai' ? apiKeys.openaiBackup : null;

          if (!apiKey && !backupKey) {
            console.log(
              `[cascade] Skipping ${providerConfig.name} — no API key`
            );
            continue;
          }

          // Skip entire provider if marked as account-failed (no credits, deactivated, etc.)
          if (isProviderFailed(providerConfig.name)) {
            console.log(
              `[cascade] Skipping ${providerConfig.name} — account-level failure (cached)`
            );
            continue;
          }

          let currentMessages = [...messages];
          if (accumulatedResponse) {
            currentMessages.push({
              role: 'assistant',
              content: accumulatedResponse,
            });
            currentMessages.push({
              role: 'user',
              content:
                'Continue exactly from where you left off. Do not repeat any previous content. Continue seamlessly.',
            });
          }

          // Use provider's FULL token capacity — not capped by frontend settings
          // Cascade math: 8192 + 16384 + 16384 + 32768 + 8192 + 8192 = 90,112 total
          // AI stops naturally at end_turn; maxTokens is just the ceiling
          const providerMaxTokens = providerConfig.maxTokens;

          // PROVIDER-SPECIFIC TOOLS — first provider gets its specialized subset,
          // fallback providers get agent-filtered tools (not full 287 catalog)
          const toolsForProvider = mode === 'code' ? [] : (
            isFirstProvider
              ? getToolsForProvider(providerConfig.name, agentTools)
              : agentTools
          );
          if (isFirstProvider) {
            console.log(`[cascade] ${providerConfig.name} (primary) gets ${toolsForProvider.length} specialized tools`);
          }

          const keysToTry = apiKey ? [apiKey] : [];
          if (backupKey && !keysToTry.includes(backupKey))
            keysToTry.push(backupKey);

          let providerSucceeded = false;

          for (const currentKey of keysToTry) {
            if (providerSucceeded || isComplete || clientDisconnected) break;

            for (const modelName of providerConfig.models) {
              if (isModelFailed(providerConfig.name, modelName)) {
                console.log(
                  `[cascade] Skipping ${providerConfig.name}/${modelName} — in failed cache`
                );
                continue;
              }

              console.log(
                `[cascade] Trying ${providerConfig.name}/${modelName}...`
              );

              try {
                // ═══════════════════════════════════════════════════════════
                // TOOL CALLING LOOP
                // Model may call tools multiple times before giving final response
                // Max rounds prevents infinite loops
                // ═══════════════════════════════════════════════════════════
                let toolRound = 0;
                let roundMessages = providerConfig.supportsVision
                  ? [...currentMessages]
                  : [...getTextOnlyMessages()];
                let lastResult = null;

                while (toolRound < MAX_TOOL_ROUNDS) {
                  if (clientDisconnected) { console.log('[cascade] Client disconnected — aborting tool loop'); break; }
                  toolRound++;

                  lastResult = await streamOpenAICompatible(
                    providerConfig.apiUrl,
                    currentKey,
                    modelName,
                    roundMessages,
                    providerMaxTokens,
                    toolsForProvider,
                    streamAbort.signal
                  );

                  if (!lastResult.success) break;

                  // No tool calls — response is complete
                  if (
                    !lastResult.toolCalls ||
                    lastResult.toolCalls.length === 0
                  ) {
                    break;
                  }

                  // ═══════════════════════════════════════════════════════
                  // EXECUTE TOOL CALLS — Backend handles actual execution
                  // ═══════════════════════════════════════════════════════
                  console.log(
                    `[tool-loop] Round ${toolRound}: ${lastResult.toolCalls.length} tool call(s)`
                  );

                  // OpenAI format: assistant with tool_calls + tool role messages
                  {
                    const assistantMsg = {
                      role: 'assistant',
                      content: lastResult.text || null,
                      tool_calls: lastResult.toolCalls.map((tc) => ({
                        id: tc.id,
                        type: 'function',
                        function: {
                          name: tc.name,
                          arguments: JSON.stringify(tc.input),
                        },
                      })),
                    };
                    roundMessages.push(assistantMsg);

                    for (const tc of lastResult.toolCalls) {
                      // Enforce per-tool call limits
                      toolCallCounts[tc.name] = (toolCallCounts[tc.name] || 0) + 1;
                      const limit = TOOL_CALL_LIMITS[tc.name];
                      if (limit && toolCallCounts[tc.name] > limit) {
                        console.log(`[tool-exec] ${tc.name} hit limit (${limit}), skipping`);
                        roundMessages.push({
                          role: 'tool',
                          tool_call_id: tc.id,
                          content: `Error: Maximum ${limit} ${tc.name} calls reached per response. Please present the results you have so far.`,
                        });
                        continue;
                      }
                      // Emit structured tool_call event to frontend (strip content from file tools to keep SSE small)
                      res.write(`data: ${JSON.stringify({ event: 'tool_call', tool_name: tc.name, tool_args: FILE_TOOLS.has(tc.name) ? { filename: tc.input?.filename, folder: tc.input?.folder } : tc.input })}

`);
                      console.log(
                        `[tool-exec] Executing ${tc.name}:`,
                        JSON.stringify(tc.input).substring(0, 200)
                      );
                      const toolResult = await executeToolCall(
                        tc.name,
                        tc.input,
                        userId,
                        agentId
                      );
                      let resultContent = toolResult.success
                        ? typeof toolResult.data === 'string'
                          ? toolResult.data
                          : JSON.stringify(toolResult.data, null, 2)
                        : `Error: ${toolResult.error}`;
                      // Emit structured tool_result event to frontend — include file_data for file ops + web_data for research panel + geo_data for map panel
                      const fileDataOAI = buildFileData(tc.name, tc.input, toolResult);
                      const webDataOAI = buildWebData(tc.name, tc.input, toolResult);
                      const geoDataOAI = buildGeoData(tc.name, tc.input, toolResult);
                      res.write(`data: ${JSON.stringify({ event: 'tool_result', tool_name: tc.name, success: toolResult.success, summary: resultContent.substring(0, 200), ...(fileDataOAI ? { file_data: fileDataOAI } : {}), ...(webDataOAI ? { web_data: webDataOAI } : {}), ...(geoDataOAI ? { geo_data: geoDataOAI } : {}) })}

`);
                      // Track consecutive tool failures
                      if (!toolResult.success) {
                        toolFailureCounts[tc.name] = (toolFailureCounts[tc.name] || 0) + 1;
                        if (toolFailureCounts[tc.name] >= 2) {
                          resultContent = `Error: ${tc.name} has failed ${toolFailureCounts[tc.name]} consecutive times. Do NOT retry this tool. Present the content directly in your response instead.`;
                        }
                      } else {
                        toolFailureCounts[tc.name] = 0; // Reset on success
                      }
                      // Strip base64 data URLs from tool results
                      resultContent = resultContent.replace(
                        /data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]{100,}/g,
                        '[base64 image data — use the url or downloadUrl field instead]'
                      );
                      if (resultContent.length > 10000) {
                        resultContent =
                          resultContent.substring(0, 10000) +
                          '\n... [truncated]';
                      }
                      roundMessages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: resultContent,
                      });
                    }
                  }
                  // Loop continues — model processes tool results
                }

                // Process final result
                if (
                  lastResult &&
                  (lastResult.text.length > 0 || lastResult.toolCalls)
                ) {
                  anyProviderWorked = true;
                  accumulatedResponse += lastResult.text;
                  providerSucceeded = true;

                  if (
                    lastResult.finishReason === 'stop' ||
                    lastResult.finishReason === 'end_turn'
                  ) {
                    isComplete = true;
                    console.log(
                      `[cascade] ✅ Complete! ${providerConfig.name}/${modelName} finished normally`
                    );
                  } else if (lastResult.finishReason === 'length') {
                    console.log(
                      `[cascade] ⚡ ${providerConfig.name}/${modelName} hit token limit (${accumulatedResponse.length} chars so far) — continuing with next provider`
                    );
                  }
                  break;
                }
              } catch (err) {
                const errMsg = err.message || String(err);
                console.error(
                  `[cascade] ${providerConfig.name}/${modelName} error:`,
                  errMsg
                );
                markModelFailed(providerConfig.name, modelName);
                // Detect account-level errors → skip ALL remaining models in this provider
                if (isAccountLevelError(errMsg)) {
                  markProviderFailed(providerConfig.name, errMsg);
                  break; // Break out of model loop — skip rest of this provider
                }
                continue;
              }
            }
          }
          isFirstProvider = false;
        }

        // If nothing worked at all, send error
        if (!anyProviderWorked && !clientDisconnected) {
          console.error(
            '[cascade] ALL providers exhausted — no response generated'
          );
          res.write(
            `data: ${JSON.stringify({ error: 'All AI providers are temporarily unavailable. Please try again in a few minutes.' })}\n\n`
          );
        } else if (!isComplete && !clientDisconnected) {
          console.log(
            `[cascade] Response may be partial (${accumulatedResponse.length} chars) — all providers exhausted or hit limits`
          );
        }

        // Send done signal
        clearInterval(heartbeatInterval);
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }

        // Fire-and-forget: extract and store memory facts from this message
        if (authenticatedUserId) {
          processConversation(
            authenticatedUserId,
            agentId,
            [{ role: 'user', content: message }],
            resolvedUserId,
          ).catch((err) => console.error('[memory] processConversation failed:', err.message));
        }

        if (!clientDisconnected) res.end();
      } catch (error) {
        clearInterval(heartbeatInterval);
        // AbortError is expected when client disconnects — don't log as error
        if (error.name === 'AbortError' || clientDisconnected) {
          console.log('[cascade] Stream aborted (client disconnect)');
          return;
        }
        console.error('Streaming error:', error);
        try {
          if (!clientDisconnected) {
            res.write(
              `data: ${JSON.stringify({ error: 'Streaming failed: ' + error.message })}\n\n`
            );
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
          }
        } catch (closeError) {
          // Response already ended, ignore
        }
      }
    };

    stream();
  } catch (error) {
    console.error('Stream API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;