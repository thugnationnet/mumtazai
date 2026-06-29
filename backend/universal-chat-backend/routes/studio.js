/**
 * STUDIO CHAT ROUTES
 * Backend implementation for AI studio chat functionality
 * Handles all AI provider integrations securely on the server
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for studio chat
const studioLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 messages per 15 min window
  message: {
    success: false,
    message: 'Studio chat rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
router.use(studioLimiter);

// =====================================================
// PROVIDERS — Mistral (primary) → xAI → OpenAI (fallback)
// =====================================================

function buildMessages(systemPrompt, conversationHistory, message) {
  const msgs = [];
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
  msgs.push(...conversationHistory.map(m => ({ role: m.role, content: m.content })));
  msgs.push({ role: 'user', content: message });
  return msgs;
}

async function callOpenAICompatible(apiUrl, apiKey, model, messages) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 4096, temperature: 0.7 }),
  });
  if (!response.ok) throw new Error(`${apiUrl} returned ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// Streaming version — sends SSE delta chunks to `res`
async function callOpenAICompatibleStream(apiUrl, apiKey, model, messages, res) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 4096, temperature: 0.7, stream: true }),
  });
  if (!response.ok) throw new Error(`${apiUrl} returned ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      } catch { /* skip malformed */ }
    }
  }
}

// Mistral PRIMARY
const mistralProvider = {
  name: 'mistral',
  callAPI: async (message, conversationHistory, systemPrompt) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error('Mistral API key not configured');
    return callOpenAICompatible(
      'https://api.mistral.ai/v1/chat/completions',
      apiKey,
      'mistral-large-latest',
      buildMessages(systemPrompt, conversationHistory, message)
    );
  },
};

// xAI Grok SECONDARY
const xaiProvider = {
  name: 'xai',
  callAPI: async (message, conversationHistory, systemPrompt) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error('xAI API key not configured');
    return callOpenAICompatible(
      'https://api.x.ai/v1/chat/completions',
      apiKey,
      'grok-3-fast',
      buildMessages(systemPrompt, conversationHistory, message)
    );
  },
};

// OpenAI FALLBACK
const openaiProvider = {
  name: 'openai',
  callAPI: async (message, conversationHistory, systemPrompt) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');
    return callOpenAICompatible(
      'https://api.openai.com/v1/chat/completions',
      apiKey,
      'gpt-4o',
      buildMessages(systemPrompt, conversationHistory, message)
    );
  },
};

// Provider registry — single source of truth
const providers = {
  mistral: mistralProvider,
  xai: xaiProvider,
  openai: openaiProvider,
};

// Cascade: try preferred → rest (non-streaming)
async function callWithCascade(message, conversationHistory, systemPrompt, preferredProvider = 'mistral') {
  const order = [preferredProvider, ...Object.keys(providers).filter(k => k !== preferredProvider)];
  for (const name of order) {
    try {
      return await providers[name].callAPI(message, conversationHistory, systemPrompt);
    } catch (err) {
      console.warn(`[studio] ${name} failed: ${err.message} — trying next provider`);
    }
  }
  throw new Error('All AI providers are temporarily unavailable');
}

// Provider stream configs
const providerStreamConfigs = {
  mistral: { url: 'https://api.mistral.ai/v1/chat/completions',    key: () => process.env.MISTRAL_API_KEY, model: 'mistral-large-latest' },
  xai:     { url: 'https://api.x.ai/v1/chat/completions',         key: () => process.env.XAI_API_KEY,     model: 'grok-3-fast' },
  openai:  { url: 'https://api.openai.com/v1/chat/completions',   key: () => process.env.OPENAI_API_KEY,  model: 'gpt-4o' },
};

// Cascade streaming — tries each provider until one succeeds
async function callWithCascadeStream(messages, preferredProvider = 'mistral', res) {
  const order = [preferredProvider, ...Object.keys(providerStreamConfigs).filter(k => k !== preferredProvider)];
  for (const name of order) {
    const cfg = providerStreamConfigs[name];
    const apiKey = cfg.key();
    if (!apiKey) continue;
    try {
      await callOpenAICompatibleStream(cfg.url, apiKey, cfg.model, messages, res);
      return; // success
    } catch (err) {
      console.warn(`[studio-stream] ${name} failed: ${err.message} — trying next`);
    }
  }
  res.write(`data: ${JSON.stringify({ error: 'All AI providers are temporarily unavailable' })}\n\n`);
  res.end();
}


// Simple in-memory session store (resets on server restart)
// This is intentional for Studio - sessions are temporary and per-browser
const sessionStore = new Map();
const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

// Generate a unique session key based on request (user-specific)
function getSessionKey(req) {
  // First try authenticated user's session
  const sessionId = req.headers['cookie']?.match(/session_id=([^;]+)/)?.[1] ||
                    req.headers['cookie']?.match(/sessionId=([^;]+)/)?.[1];
  if (sessionId) {
    return `studio_auth_${sessionId}`;
  }

  // Fallback: Use studio-specific session ID from cookie
  const studioSessionId = req.headers['cookie']?.match(/studio_session=([^;]+)/)?.[1];
  if (studioSessionId) {
    return `studio_guest_${studioSessionId}`;
  }

  // Generate a new studio session ID
  const newStudioSession = `${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  return `studio_guest_${newStudioSession}`;
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [key, session] of sessionStore.entries()) {
    if (now - session.createdAt > SESSION_EXPIRY) {
      sessionStore.delete(key);
    }
  }
}

// =====================================================
// STUDIO CHAT ENDPOINT
// =====================================================

router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      provider = 'mistral',
      conversationHistory = [],
      systemPrompt,
      sessionId,
      stream = false,
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const preferredProvider = providers[provider] ? provider : 'mistral';

    // ── STREAMING MODE ──────────────────────────────────────────
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const messages = buildMessages(systemPrompt, conversationHistory, message);
      await callWithCascadeStream(messages, preferredProvider, res);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // ── NON-STREAMING (existing) ─────────────────────────────────
    const response = await callWithCascade(message, conversationHistory, systemPrompt, preferredProvider);

    res.json({
      success: true,
      response,
      provider: preferredProvider,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Studio chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat request',
    });
  }
});

// =====================================================
// GET STUDIO SESSION
// =====================================================

router.get('/session', (req, res) => {
  try {
    cleanupExpiredSessions();
    const sessionKey = getSessionKey(req);
    const session = sessionStore.get(sessionKey);

    if (!session) {
      return res.json({
        success: true,
        data: {
          isNew: true,
          messages: [],
          messageCount: 0,
          expired: false,
        },
      });
    }

    const now = Date.now();
    const expired = now - session.createdAt > SESSION_EXPIRY;

    if (expired) {
      sessionStore.delete(sessionKey);
      return res.json({
        success: true,
        data: {
          isNew: false,
          expired: true,
          messages: [],
          messageCount: 0,
        },
      });
    }

    res.json({
      success: true,
      data: {
        isNew: false,
        expired: false,
        messages: session.messages,
        messageCount: session.messageCount,
      },
    });
  } catch (error) {
    console.error('Session GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
    });
  }
});

// =====================================================
// SAVE STUDIO SESSION
// =====================================================

router.post('/session', (req, res) => {
  try {
    const { messages, messageCount } = req.body;
    const sessionKey = getSessionKey(req);

    const existingSession = sessionStore.get(sessionKey);
    const createdAt = existingSession?.createdAt || Date.now();

    sessionStore.set(sessionKey, {
      messages: messages || [],
      messageCount: messageCount || 0,
      createdAt,
    });

    res.json({
      success: true,
      message: 'Session saved',
    });
  } catch (error) {
    console.error('Session POST error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save session',
    });
  }
});

// =====================================================
// CLEAR STUDIO SESSION
// =====================================================

router.delete('/session', (req, res) => {
  try {
    const sessionKey = getSessionKey(req);
    sessionStore.delete(sessionKey);

    res.json({
      success: true,
      message: 'Session cleared',
    });
  } catch (error) {
    console.error('Session DELETE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear session',
    });
  }
});

export default router;