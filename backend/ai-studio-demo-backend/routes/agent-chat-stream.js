import express from 'express';
import { verifyRequestAsync } from '../lib/auth-middleware.js';
import { TOOL_DEFINITIONS, executeToolCall, getToolsForOpenAI } from '../lib/agent-tools-service.js';
import { STRICT_AGENT_PROMPTS, AGENT_TEMPERATURES } from '../lib/agent-strict-prompts.js';
import { buildAgentSystemMessage } from '../lib/personality-integration.js';

// ═══════════════════════════════════════════════════════════════════
// CORE TOOLS — Curated subset sent to AI models (~28 tools ≈ 5-7K tokens)
// The full TOOL_DEFINITIONS (292 tools ≈ 60K tokens) overwhelms model context
// and causes models to ignore tool capabilities entirely.
// All 292 tools still EXECUTE — only the advertised set is reduced.
// ═══════════════════════════════════════════════════════════════════
const CORE_TOOL_NAMES = new Set([
  // Essential utilities
  'web_search',
  'fetch_url',
  'execute_code',
  'calculate',
  'get_current_time',
  'get_weather',
  // Image generation & processing
  'generate_image',
  'image_create',
  'image_transform',
  'image_analyze',
  'image_background',
  // Video
  'generate_video',
  // File operations
  'create_file',
  'read_file',
  'write_file',
  'modify_file',
  'list_files',
  'delete_file',
  // Document parsing
  'parse_pdf',
  'parse_docx',
  'parse_csv',
  // Audio
  'transcribe_audio',
  // Developer tools
  'generate_code',
  'debug_code',
  'search_in_files',
  // Analysis & web
  'http_request',
  'summarize_file',
  'think_step_by_step',
  'data_visualize',
]);

const CORE_TOOLS = TOOL_DEFINITIONS.filter(t => CORE_TOOL_NAMES.has(t.name));
console.log(`[chat-stream] Core tools loaded: ${CORE_TOOLS.length} of ${TOOL_DEFINITIONS.length} total (saves ~55K tokens per request)`);

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════
// STRICT PROMPTS — LOCAL (self-contained, no cross-backend fetch)
// agent-strict-prompts.js + personality-integration.js are imported
// directly from ../lib/ — no dependency on port 3005
// ═══════════════════════════════════════════════════════════════════

// TOOL_CAPABILITIES_BLOCK removed — the 28 core tools are sent via the tools
// parameter directly. Listing 188 tools in text wasted ~2K tokens per request
// and confused models into ignoring the real tool definitions.

// Build prompts data locally — same logic as main backend's /api/agent/prompts endpoint
function buildLocalAgentPrompts() {
  const data = {};
  for (const [agentId] of Object.entries(STRICT_AGENT_PROMPTS)) {
    const fullSystemPrompt = buildAgentSystemMessage(agentId, '');
    data[agentId] = {
      systemPrompt: fullSystemPrompt,
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
    openaiBackup: process.env.OPENAI_API_KEY_BACKUP, // Backup key for failover
    anthropic: process.env.ANTHROPIC_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    xai: process.env.XAI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    cerebras: process.env.CEREBRAS_API_KEY,
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
// PROVIDER CASCADE — Auto-fallback across ALL LLM providers
// ═══════════════════════════════════════════════════════════════════════════════
// Order: mistral → xai → groq → cerebras → anthropic → openai
// Working providers first; dead accounts (no credits/deactivated) auto-cached.
// Account-level failures skip entire provider for 30 minutes.
// ═══════════════════════════════════════════════════════════════════════════════

// ProviderConfig: { name, apiUrl, models[], maxTokens, supportsVision, isAnthropic? }

const PROVIDER_CASCADE = [
  // Prioritize providers with active accounts and best tool support
  {
    name: 'mistral',
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    models: [
      'mistral-large-latest',
      'mistral-small-latest',
      'codestral-latest',
    ],
    maxTokens: 16384,
    supportsVision: true,
  },
  {
    name: 'xai',
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    models: ['grok-3-mini-fast'],
    maxTokens: 32768,
    supportsVision: true,
  },
  {
    name: 'groq',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    maxTokens: 8192,
    supportsVision: false,
  },
  {
    name: 'cerebras',
    apiUrl: 'https://api.cerebras.ai/v1/chat/completions',
    models: ['llama-3.3-70b', 'llama3.1-8b'],
    maxTokens: 8192,
    supportsVision: false,
  },
  // Anthropic + OpenAI placed last — currently have account issues
  // When credits/accounts are restored, move them back to top
  {
    name: 'anthropic',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
    ],
    maxTokens: 8192,
    supportsVision: true,
    isAnthropic: true,
  },
  {
    name: 'openai',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    maxTokens: 16384,
    supportsVision: true,
  },
];

// Get API key for a provider (supports openai backup key)
function getProviderApiKey(providerName, apiKeys) {
  const keyMap = {
    anthropic: apiKeys.anthropic,
    openai: apiKeys.openai,
    mistral: apiKeys.mistral,
    xai: apiKeys.xai,
    groq: apiKeys.groq,
    cerebras: apiKeys.cerebras,
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
      provider = settings.provider || 'anthropic',
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

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Demo limit: max 20 messages per conversation (count user messages in history)
    const userMessageCount = conversationHistory.filter(m => m.role === 'user').length + 1;
    if (userMessageCount > 20) {
      return res.status(429).json({
        error: 'Demo conversation limit reached (20 messages). Start a new conversation to continue.',
      });
    }

    // Get API keys at request time
    const apiKeys = getApiKeys();

    // Log request details for debugging
    console.log(
      `[chat-stream] Request received - agentId: ${agentId}, provider: ${provider}, model: ${model}`
    );
    console.log(`[chat-stream] Settings from body:`, JSON.stringify(settings));
    console.log(
      `[chat-stream] Available providers: openai=${!!apiKeys.openai}, anthropic=${!!apiKeys.anthropic}, mistral=${!!apiKeys.mistral}, xai=${!!apiKeys.xai}, groq=${!!apiKeys.groq}, cerebras=${!!apiKeys.cerebras}`
    );

    // Create streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // AbortController cancels AI provider fetches when client disconnects
    // This prevents orphaned streams that leak memory (root cause of 950 restarts)
    const abortController = new AbortController();
    const { signal } = abortController;
    let clientDisconnected = false;
    req.on('close', () => {
      clientDisconnected = true;
      abortController.abort();
      console.log('[chat-stream] Client disconnected — aborted provider fetch');
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
            '\n- Any HTML outside of code blocks will be stripped and look broken to the user.',
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
        // Tries providers in order: mistral → xai → groq → cerebras → anthropic → openai
        // If a provider fails, automatically tries the next one.
        // If a response is truncated (token limit), the next provider CONTINUES
        // from where the previous left off — seamless to the user.
        // ═══════════════════════════════════════════════════════════════════

        // Convert OpenAI image format to Anthropic format
        function convertToAnthropicFormat(content) {
          if (typeof content === 'string') return content;
          if (!Array.isArray(content)) return content;
          return content.map((item) => {
            if (item.type === 'text') return item;
            if (item.type === 'image_url' && item.image_url?.url) {
              const url = item.image_url.url;
              if (url.startsWith('data:')) {
                const matches = url.match(
                  /^data:(image\/[^;]+);base64,(.+)$/
                );
                if (matches) {
                  return {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: matches[1],
                      data: matches[2],
                    },
                  };
                }
              }
              return { type: 'image', source: { type: 'url', url } };
            }
            return item;
          });
        }

        // Stream from Anthropic (custom API format) — with tool calling support
        // Returns: { success, text, finishReason, toolCalls? }
        async function streamAnthropic(
          apiKey,
          modelName,
          messagesToSend,
          providerMaxTokens,
          tools,
          signal
        ) {
          const systemMessage = messagesToSend.find(
            (m) => m.role === 'system'
          );
          const chatMessages = messagesToSend
            .filter((m) => m.role !== 'system')
            .filter((m) => {
              const content =
                typeof m.content === 'string'
                  ? m.content
                  : JSON.stringify(m.content);
              return content && content.trim().length > 0;
            });

          const requestBody = {
            model: modelName,
            max_tokens: providerMaxTokens,
            temperature,
            system:
              systemMessage?.content || 'You are a helpful AI assistant.',
            messages: chatMessages.map((m) => ({
              role: m.role,
              content: convertToAnthropicFormat(m.content),
            })),
            stream: true,
          };

          // Add tools if available — this is how the LLM knows what it can do
          if (tools && tools.length > 0) {
            requestBody.tools = tools;
          }

          const response = await fetch(
            'https://api.anthropic.com/v1/messages',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify(requestBody),
              signal,
            }
          );

          if (!response.ok) {
            const errorData = await response.text();
            console.error(
              `[cascade] Anthropic ${modelName} failed:`,
              errorData
            );
            throw new Error(`Anthropic API error: ${response.status} — ${errorData}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No reader available');

          const decoder = new TextDecoder();
          let buffer = '';
          let collectedText = '';
          let finishReason = 'stop';
          const toolCalls = [];
          let currentToolId = '';
          let currentToolName = '';
          let currentToolInputJson = '';
          let inToolUseBlock = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done || signal.aborted) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);

                  // Text content — stream to user
                  if (
                    parsed.type === 'content_block_delta' &&
                    parsed.delta?.text
                  ) {
                    const token = parsed.delta.text;
                    collectedText += token;
                    if (!clientDisconnected) {
                      res.write(`data: ${JSON.stringify({ token })}\n\n`);
                    }
                  }

                  // Tool use block start — LLM decided to call a tool
                  if (
                    parsed.type === 'content_block_start' &&
                    parsed.content_block?.type === 'tool_use'
                  ) {
                    inToolUseBlock = true;
                    currentToolId = parsed.content_block.id;
                    currentToolName = parsed.content_block.name;
                    currentToolInputJson = '';
                    // Tool usage runs silently in background — no visible token to user
                  }

                  // Tool input JSON delta — accumulate the tool arguments
                  if (
                    parsed.type === 'content_block_delta' &&
                    parsed.delta?.type === 'input_json_delta'
                  ) {
                    currentToolInputJson += parsed.delta.partial_json;
                  }

                  // Tool use block end — collect the complete tool call
                  if (
                    parsed.type === 'content_block_stop' &&
                    inToolUseBlock
                  ) {
                    try {
                      const toolInput = JSON.parse(
                        currentToolInputJson || '{}'
                      );
                      toolCalls.push({
                        id: currentToolId,
                        name: currentToolName,
                        input: toolInput,
                      });
                    } catch (parseErr) {
                      console.error(
                        '[tool-parse] Failed to parse tool input:',
                        currentToolInputJson
                      );
                    }
                    inToolUseBlock = false;
                  }

                  // Message stop reason
                  if (parsed.type === 'message_delta') {
                    if (parsed.delta?.stop_reason === 'tool_use') {
                      finishReason = 'tool_use';
                    } else if (parsed.delta?.stop_reason === 'max_tokens') {
                      finishReason = 'length';
                    } else if (parsed.delta?.stop_reason === 'end_turn') {
                      finishReason = 'stop';
                    }
                  }
                } catch (e) {
                  /* skip invalid JSON */
                }
              }
            }
          }
          return {
            success: true,
            text: collectedText,
            finishReason,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          };
        }

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
            signal,
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
            if (done || signal.aborted) break;
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
                    if (!clientDisconnected) {
                      res.write(`data: ${JSON.stringify({ token })}\n\n`);
                    }
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

        const cascadeOrder = [...PROVIDER_CASCADE];

        const totalCascadeTokens = cascadeOrder.reduce((sum, p) => sum + p.maxTokens, 0);
        console.log(
          `[cascade] Starting provider cascade (requested: ${provider}/${model}) — total capacity: ${totalCascadeTokens.toLocaleString()} tokens across ${cascadeOrder.length} providers`
        );

        for (const providerConfig of cascadeOrder) {
          if (isComplete || signal.aborted) break;

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

          // CORE TOOLS — curated ~28 tools instead of all 292 (saves ~55K tokens)
          // All 292 tools can still EXECUTE via executeToolCall if model calls them
          // but we only ADVERTISE the core set to keep context manageable
          const toolsForProvider = mode === 'code' ? [] : CORE_TOOLS;

          const keysToTry = apiKey ? [apiKey] : [];
          if (backupKey && !keysToTry.includes(backupKey))
            keysToTry.push(backupKey);

          let providerSucceeded = false;

          for (const currentKey of keysToTry) {
            if (providerSucceeded || isComplete) break;

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
                let roundMessages = providerConfig.isAnthropic
                  ? [...currentMessages]
                  : providerConfig.supportsVision
                    ? [...currentMessages]
                    : [...getTextOnlyMessages()];
                let lastResult = null;

                while (toolRound < MAX_TOOL_ROUNDS && !signal.aborted) {
                  toolRound++;

                  if (providerConfig.isAnthropic) {
                    lastResult = await streamAnthropic(
                      currentKey,
                      modelName,
                      roundMessages,
                      providerMaxTokens,
                      toolsForProvider,
                      signal
                    );
                  } else {
                    lastResult = await streamOpenAICompatible(
                      providerConfig.apiUrl,
                      currentKey,
                      modelName,
                      roundMessages,
                      providerMaxTokens,
                      toolsForProvider,
                      signal
                    );
                  }

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

                  if (providerConfig.isAnthropic) {
                    // Anthropic format: assistant content blocks + user tool_result
                    const assistantContent = [];
                    if (lastResult.text) {
                      assistantContent.push({
                        type: 'text',
                        text: lastResult.text,
                      });
                    }
                    for (const tc of lastResult.toolCalls) {
                      assistantContent.push({
                        type: 'tool_use',
                        id: tc.id,
                        name: tc.name,
                        input: tc.input,
                      });
                    }
                    roundMessages.push({
                      role: 'assistant',
                      content: assistantContent,
                    });

                    // Execute tools and build results
                    const toolResults = [];
                    for (const tc of lastResult.toolCalls) {
                      if (signal.aborted) break;
                      // Enforce per-tool call limits
                      toolCallCounts[tc.name] = (toolCallCounts[tc.name] || 0) + 1;
                      const limit = TOOL_CALL_LIMITS[tc.name];
                      if (limit && toolCallCounts[tc.name] > limit) {
                        console.log(`[tool-exec] ${tc.name} hit limit (${limit}), skipping`);
                        toolResults.push({
                          type: 'tool_result',
                          tool_use_id: tc.id,
                          content: `Error: Maximum ${limit} ${tc.name} calls reached per response. Please present the results you have so far.`,
                        });
                        continue;
                      }
                      // Emit structured tool_call event to frontend (strip content from file tools to keep SSE small)
                      if (!clientDisconnected) {
                        res.write(`data: ${JSON.stringify({ event: 'tool_call', tool_name: tc.name, tool_args: FILE_TOOLS.has(tc.name) ? { filename: tc.input?.filename, folder: tc.input?.folder } : tc.input })}

`);
                      }
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
                      // Emit structured tool_result event to frontend — include file_data for file ops
                      const fileDataAnth = buildFileData(tc.name, tc.input, toolResult);
                      if (!clientDisconnected) {
                        res.write(`data: ${JSON.stringify({ event: 'tool_result', tool_name: tc.name, success: toolResult.success, summary: resultContent.substring(0, 200), ...(fileDataAnth ? { file_data: fileDataAnth } : {}) })}

`);
                      }
                      // Track consecutive tool failures
                      if (!toolResult.success) {
                        toolFailureCounts[tc.name] = (toolFailureCounts[tc.name] || 0) + 1;
                        if (toolFailureCounts[tc.name] >= 2) {
                          resultContent = `Error: ${tc.name} has failed ${toolFailureCounts[tc.name]} consecutive times. Do NOT retry this tool. Present the content directly in your response instead.`;
                        }
                      } else {
                        toolFailureCounts[tc.name] = 0; // Reset on success
                      }
                      // Strip base64 data URLs from tool results — they cause token explosion
                      // Replace with placeholder so model knows to use the URL/downloadUrl instead
                      resultContent = resultContent.replace(
                        /data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]{100,}/g,
                        '[base64 image data — use the url or downloadUrl field instead]'
                      );
                      // Truncate very large results to prevent token overflow
                      if (resultContent.length > 10000) {
                        resultContent =
                          resultContent.substring(0, 10000) +
                          '\n... [truncated]';
                      }
                      toolResults.push({
                        type: 'tool_result',
                        tool_use_id: tc.id,
                        content: resultContent,
                      });
                    }
                    roundMessages.push({
                      role: 'user',
                      content: toolResults,
                    });
                  } else {
                    // OpenAI format: assistant with tool_calls + tool role messages
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
                      if (signal.aborted) break;
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
                      if (!clientDisconnected) {
                        res.write(`data: ${JSON.stringify({ event: 'tool_call', tool_name: tc.name, tool_args: FILE_TOOLS.has(tc.name) ? { filename: tc.input?.filename, folder: tc.input?.folder } : tc.input })}

`);
                      }
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
                      // Emit structured tool_result event to frontend — include file_data for file ops
                      const fileDataOAI = buildFileData(tc.name, tc.input, toolResult);
                      if (!clientDisconnected) {
                        res.write(`data: ${JSON.stringify({ event: 'tool_result', tool_name: tc.name, success: toolResult.success, summary: resultContent.substring(0, 200), ...(fileDataOAI ? { file_data: fileDataOAI } : {}) })}

`);
                      }
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
                // Abort errors mean client disconnected — stop entirely
                if (err.name === 'AbortError' || signal.aborted) {
                  console.log(`[cascade] Client disconnected during ${providerConfig.name}/${modelName} — stopping cascade`);
                  break;
                }
                // Detect account-level errors → skip ALL remaining models in this provider
                if (isAccountLevelError(errMsg)) {
                  markProviderFailed(providerConfig.name, errMsg);
                  break; // Break out of model loop — skip rest of this provider
                }
                continue;
              }
            }
          }
        }

        // If client disconnected, just clean up silently
        if (clientDisconnected) {
          console.log('[chat-stream] Stream ended — client already disconnected');
          if (!res.writableEnded) res.end();
          return;
        }

        // If nothing worked at all, send error
        if (!anyProviderWorked) {
          console.error(
            '[cascade] ALL providers exhausted — no response generated'
          );
          if (!clientDisconnected) {
            res.write(
              `data: ${JSON.stringify({ error: 'All AI providers are temporarily unavailable. Please try again in a few minutes.' })}\n\n`
            );
          }
        } else if (!isComplete) {
          console.log(
            `[cascade] Response may be partial (${accumulatedResponse.length} chars) — all providers exhausted or hit limits`
          );
        }

        // Send done signal
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }
        if (!res.writableEnded) res.end();
      } catch (error) {
        if (error.name === 'AbortError' || clientDisconnected) {
          console.log('[chat-stream] Stream aborted — client disconnected');
          if (!res.writableEnded) res.end();
          return;
        }
        console.error('Streaming error:', error);
        try {
          if (!clientDisconnected) {
            res.write(
              `data: ${JSON.stringify({ error: 'Streaming failed: ' + error.message })}\n\n`
            );
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          }
          if (!res.writableEnded) res.end();
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