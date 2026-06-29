/**
 * USER PREFERENCES ROUTES
 * Stores all client-side preferences in PostgreSQL:
 *   - Per-agent chat settings (temperature, maxTokens, mode, systemPrompt)
 *   - Per-agent chat themes
 *   - Site theme
 *   - Chat history (optional bulk sync)
 *
 * GET  /api/user/preferences         — load all preferences
 * PUT  /api/user/preferences         — save all preferences
 * PUT  /api/user/preferences/agent-settings/:agentId  — save settings for one agent
 * PUT  /api/user/preferences/agent-theme/:agentId     — save theme for one agent
 * PUT  /api/user/preferences/site-theme               — save global site theme
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

// ── Cookie helper — sets functional preference cookies ───────────
function setPreferenceCookie(res, req, name, value, maxAgeDays = 365) {
  const isProduction = req.headers['x-forwarded-proto'] === 'https' ||
                      req.get('host')?.includes('mumtaz.ai');
  const cookieDomain = isProduction ? (process.env.APP_DOMAIN || '.mumtaz.ai') : undefined;

  const cookieValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');

  res.cookie(name, cookieValue, {
    httpOnly: false, // readable by client JS for immediate UI use
    secure: isProduction,
    sameSite: 'lax',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    path: '/',
    domain: cookieDomain,
  });
}

// ── Use shared auth middleware (checks neural_link_session JWT first, no DB lookup needed) ──
router.use(requireAuth);

// Helper to safely parse JSON fields from DB
function safeJsonParse(val, fallback = {}) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

// ── GET /api/user/preferences ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    if (!prefs) {
      return res.json({
        success: true,
        data: {
          agentSettings: {},
          agentThemes: {},
          siteTheme: 'light',
          chatHistory: {},
          canvasMessages: {},
          uiFlags: {},
          messageFeedback: {},
        },
      });
    }

    const uiFlags = safeJsonParse(prefs.uiFlags, {});

    // Sync functional cookies from stored preferences
    setPreferenceCookie(res, req, 'theme_preference', prefs.siteTheme || 'light', 365);
    if (uiFlags.language) setPreferenceCookie(res, req, 'language', uiFlags.language, 365);
    if (uiFlags.favoriteAgents) setPreferenceCookie(res, req, 'agent_preferences', uiFlags.favoriteAgents, 180);
    if (uiFlags.voiceSettings) setPreferenceCookie(res, req, 'voice_settings', uiFlags.voiceSettings, 180);

    res.json({
      success: true,
      data: {
        agentSettings: safeJsonParse(prefs.agentSettings, {}),
        agentThemes: safeJsonParse(prefs.agentThemes, {}),
        siteTheme: prefs.siteTheme || 'light',
        chatHistory: safeJsonParse(prefs.chatHistory, {}),
        canvasMessages: safeJsonParse(prefs.canvasMessages, {}),
        uiFlags,
        messageFeedback: safeJsonParse(prefs.messageFeedback, {}),
      },
    });
  } catch (error) {
    console.error('[user-preferences] GET error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load preferences' });
  }
});

// ── PUT /api/user/preferences ───────────────────────────────────
// Full save — replaces everything
router.put('/', async (req, res) => {
  try {
    const { agentSettings, agentThemes, siteTheme, chatHistory } = req.body;

    const data = {
      agentSettings: JSON.stringify(agentSettings || {}),
      agentThemes: JSON.stringify(agentThemes || {}),
      siteTheme: String(siteTheme || 'light'),
      chatHistory: JSON.stringify(chatHistory || {}),
    };

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: data,
      create: { userId: req.userId, ...data },
    });

    res.json({ success: true, message: 'Preferences saved' });
  } catch (error) {
    console.error('[user-preferences] PUT error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save preferences' });
  }
});

// ── PUT /api/user/preferences/agent-settings/:agentId ───────────
// Partial update — merge settings for a single agent
router.put('/agent-settings/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const settings = req.body; // { temperature, maxTokens, mode, systemPrompt, provider, model }

    // Get existing prefs or create default
    let prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const currentSettings = prefs ? safeJsonParse(prefs.agentSettings, {}) : {};
    currentSettings[agentId] = { ...currentSettings[agentId], ...settings };

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { agentSettings: JSON.stringify(currentSettings) },
      create: {
        userId: req.userId,
        agentSettings: JSON.stringify(currentSettings),
      },
    });

    res.json({ success: true, message: 'Agent settings saved' });
  } catch (error) {
    console.error('[user-preferences] agent-settings error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save agent settings' });
  }
});

// ── PUT /api/user/preferences/agent-theme/:agentId ──────────────
router.put('/agent-theme/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { theme } = req.body; // "default" | "neural"

    let prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const currentThemes = prefs ? safeJsonParse(prefs.agentThemes, {}) : {};
    currentThemes[agentId] = theme || 'default';

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { agentThemes: JSON.stringify(currentThemes) },
      create: {
        userId: req.userId,
        agentThemes: JSON.stringify(currentThemes),
      },
    });

    res.json({ success: true, message: 'Theme saved' });
  } catch (error) {
    console.error('[user-preferences] agent-theme error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save theme' });
  }
});

// ── PUT /api/user/preferences/site-theme ────────────────────────
router.put('/site-theme', async (req, res) => {
  try {
    const { theme } = req.body; // "light" | "dark"

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { siteTheme: theme || 'light' },
      create: { userId: req.userId, siteTheme: theme || 'light' },
    });

    // Set theme_preference cookie (1 year) for client-side access
    setPreferenceCookie(res, req, 'theme_preference', theme || 'light', 365);

    res.json({ success: true, message: 'Site theme saved' });
  } catch (error) {
    console.error('[user-preferences] site-theme error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save site theme' });
  }
});

// ── PUT /api/user/preferences/language ──────────────────────────
// Save preferred language and set language cookie (1 year)
router.put('/language', async (req, res) => {
  try {
    const { language } = req.body; // e.g. "en", "th", "ar", "zh"

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const uiFlags = prefs ? safeJsonParse(prefs.uiFlags, {}) : {};
    uiFlags.language = language || 'en';

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { uiFlags: JSON.stringify(uiFlags) },
      create: { userId: req.userId, uiFlags: JSON.stringify(uiFlags) },
    });

    // Set language cookie (1 year)
    setPreferenceCookie(res, req, 'language', language || 'en', 365);

    res.json({ success: true, message: 'Language preference saved' });
  } catch (error) {
    console.error('[user-preferences] language error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save language preference' });
  }
});

// ── PUT /api/user/preferences/agent-preferences ─────────────────
// Save favorite agents list and set agent_preferences cookie (6 months)
router.put('/agent-preferences', async (req, res) => {
  try {
    const { favorites } = req.body; // array of agent IDs, e.g. ["comedy-king", "tech-wizard"]

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const uiFlags = prefs ? safeJsonParse(prefs.uiFlags, {}) : {};
    uiFlags.favoriteAgents = Array.isArray(favorites) ? favorites : [];

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { uiFlags: JSON.stringify(uiFlags) },
      create: { userId: req.userId, uiFlags: JSON.stringify(uiFlags) },
    });

    // Set agent_preferences cookie (6 months)
    setPreferenceCookie(res, req, 'agent_preferences', uiFlags.favoriteAgents, 180);

    res.json({ success: true, message: 'Agent preferences saved' });
  } catch (error) {
    console.error('[user-preferences] agent-preferences error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save agent preferences' });
  }
});

// ── PUT /api/user/preferences/voice-settings ────────────────────
// Save voice interaction preferences and set voice_settings cookie (6 months)
router.put('/voice-settings', async (req, res) => {
  try {
    const { voiceEnabled, voiceSpeed, voicePitch, voiceId, autoPlay } = req.body;

    const voiceSettings = {
      voiceEnabled: Boolean(voiceEnabled),
      voiceSpeed: Number(voiceSpeed) || 1.0,
      voicePitch: Number(voicePitch) || 1.0,
      voiceId: voiceId || 'default',
      autoPlay: Boolean(autoPlay),
    };

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const uiFlags = prefs ? safeJsonParse(prefs.uiFlags, {}) : {};
    uiFlags.voiceSettings = voiceSettings;

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { uiFlags: JSON.stringify(uiFlags) },
      create: { userId: req.userId, uiFlags: JSON.stringify(uiFlags) },
    });

    // Set voice_settings cookie (6 months)
    setPreferenceCookie(res, req, 'voice_settings', voiceSettings, 180);

    res.json({ success: true, message: 'Voice settings saved' });
  } catch (error) {
    console.error('[user-preferences] voice-settings error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save voice settings' });
  }
});

// ── GET /api/user/preferences/canvas-messages/:agentId ──────────
// Load canvas chat messages for a specific agent
router.get('/canvas-messages/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const all = prefs ? safeJsonParse(prefs.canvasMessages, {}) : {};
    res.json({ success: true, messages: all[agentId] || [] });
  } catch (error) {
    console.error('[user-preferences] canvas-messages GET error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load canvas messages' });
  }
});

// ── PUT /api/user/preferences/canvas-messages/:agentId ──────────
// Save canvas chat messages for a specific agent
router.put('/canvas-messages/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'messages must be an array' });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const current = prefs ? safeJsonParse(prefs.canvasMessages, {}) : {};
    current[agentId] = messages;

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { canvasMessages: JSON.stringify(current) },
      create: { userId: req.userId, canvasMessages: JSON.stringify(current) },
    });

    res.json({ success: true, message: 'Canvas messages saved' });
  } catch (error) {
    console.error('[user-preferences] canvas-messages PUT error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save canvas messages' });
  }
});

// ── PUT /api/user/preferences/ui-flags ──────────────────────────
// Merge UI state flags (sidebar animation, migration markers, etc.)
router.put('/ui-flags', async (req, res) => {
  try {
    const flags = req.body; // { key: value, ... }

    if (!flags || typeof flags !== 'object') {
      return res.status(400).json({ success: false, message: 'Body must be a JSON object' });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const current = prefs ? safeJsonParse(prefs.uiFlags, {}) : {};
    Object.assign(current, flags);

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { uiFlags: JSON.stringify(current) },
      create: { userId: req.userId, uiFlags: JSON.stringify(current) },
    });

    res.json({ success: true, message: 'UI flags saved' });
  } catch (error) {
    console.error('[user-preferences] ui-flags error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save UI flags' });
  }
});

// ── GET /api/user/preferences/tool-state/:toolName ──────────────
// Load all saved state for a specific tool (history, favorites, settings, etc.)
router.get('/tool-state/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    if (!toolName || typeof toolName !== 'string') {
      return res.status(400).json({ success: false, message: 'toolName is required' });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const uiFlags = prefs ? safeJsonParse(prefs.uiFlags, {}) : {};
    const toolState = uiFlags.toolState || {};
    const data = toolState[toolName] || {};

    res.json({ success: true, data });
  } catch (error) {
    console.error('[user-preferences] tool-state GET error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load tool state' });
  }
});

// ── PUT /api/user/preferences/tool-state/:toolName ──────────────
// Save / merge state for a specific tool. Body: { key: value, ... }
router.put('/tool-state/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const updates = req.body; // { history: [...], settings: {...}, etc. }

    if (!toolName || typeof toolName !== 'string') {
      return res.status(400).json({ success: false, message: 'toolName is required' });
    }
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Body must be a JSON object' });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const uiFlags = prefs ? safeJsonParse(prefs.uiFlags, {}) : {};
    if (!uiFlags.toolState) uiFlags.toolState = {};
    if (!uiFlags.toolState[toolName]) uiFlags.toolState[toolName] = {};
    Object.assign(uiFlags.toolState[toolName], updates);

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { uiFlags: JSON.stringify(uiFlags) },
      create: { userId: req.userId, uiFlags: JSON.stringify(uiFlags) },
    });

    res.json({ success: true, message: 'Tool state saved' });
  } catch (error) {
    console.error('[user-preferences] tool-state PUT error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save tool state' });
  }
});

// ── PUT /api/user/preferences/message-feedback ──────────────────
// Save thumbs up/down feedback per message: { messageId: 'up' | 'down' | null }
router.put('/message-feedback', async (req, res) => {
  try {
    const { messageId, feedback } = req.body; // feedback: 'up' | 'down' | null

    if (!messageId || typeof messageId !== 'string') {
      return res.status(400).json({ success: false, message: 'messageId is required' });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const current = prefs ? safeJsonParse(prefs.messageFeedback, {}) : {};

    if (feedback === null) {
      delete current[messageId];
    } else {
      current[messageId] = feedback;
    }

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { messageFeedback: JSON.stringify(current) },
      create: { userId: req.userId, messageFeedback: JSON.stringify(current) },
    });

    res.json({ success: true, message: 'Feedback saved' });
  } catch (error) {
    console.error('[user-preferences] message-feedback error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save feedback' });
  }
});

// ── GET /api/user/preferences/canvas-state ──────────────────────
// Returns all canvas-app store states at once (for initial hydration)
router.get('/canvas-state', async (req, res) => {
  try {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const canvasState = prefs ? safeJsonParse(prefs.canvasState, {}) : {};
    res.json({ success: true, data: canvasState });
  } catch (error) {
    console.error('[user-preferences] canvas-state GET all error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load canvas state' });
  }
});

// ── GET /api/user/preferences/canvas-state/:key ─────────────────
// Load a single canvas store's state by key
router.get('/canvas-state/:key', async (req, res) => {
  try {
    const { key } = req.params;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ success: false, message: 'key is required' });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const canvasState = prefs ? safeJsonParse(prefs.canvasState, {}) : {};
    const data = canvasState[key] ?? null;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[user-preferences] canvas-state GET error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load canvas state' });
  }
});

// ── PUT /api/user/preferences/canvas-state/:key ─────────────────
// Save / replace state for a single canvas store key
// Body: the full state object for that key (arbitrary JSON)
router.put('/canvas-state/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = req.body; // Zustand persist payload or any JSON

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ success: false, message: 'key is required' });
    }
    if (value === undefined || value === null) {
      return res.status(400).json({ success: false, message: 'Body must be a JSON value' });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const canvasState = prefs ? safeJsonParse(prefs.canvasState, {}) : {};
    canvasState[key] = value;

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { canvasState: JSON.stringify(canvasState) },
      create: { userId: req.userId, canvasState: JSON.stringify(canvasState) },
    });

    res.json({ success: true, message: 'Canvas state saved' });
  } catch (error) {
    console.error('[user-preferences] canvas-state PUT error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save canvas state' });
  }
});

// ── DELETE /api/user/preferences/canvas-state/:key ──────────────
// Remove a single canvas store key
router.delete('/canvas-state/:key', async (req, res) => {
  try {
    const { key } = req.params;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ success: false, message: 'key is required' });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    if (prefs) {
      const canvasState = safeJsonParse(prefs.canvasState, {});
      delete canvasState[key];

      await prisma.userPreferences.update({
        where: { userId: req.userId },
        data: { canvasState: JSON.stringify(canvasState) },
      });
    }

    res.json({ success: true, message: 'Canvas state removed' });
  } catch (error) {
    console.error('[user-preferences] canvas-state DELETE error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to remove canvas state' });
  }
});

// ── GET /api/user/preferences/tool-state/:toolId ─────────────────
// Load state for a specific tool (history, favorites, settings, etc.)
router.get('/tool-state/:toolId', async (req, res) => {
  try {
    const { toolId } = req.params;
    if (!toolId || typeof toolId !== 'string') {
      return res.status(400).json({ success: false, message: 'toolId is required' });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const toolState = prefs ? safeJsonParse(prefs.toolState, {}) : {};
    const data = toolState[toolId] || {};

    res.json({ success: true, data });
  } catch (error) {
    console.error('[user-preferences] tool-state GET error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load tool state' });
  }
});

// ── PUT /api/user/preferences/tool-state/:toolId ─────────────────
// Save state for a specific tool (merges with existing state)
router.put('/tool-state/:toolId', async (req, res) => {
  try {
    const { toolId } = req.params;
    if (!toolId || typeof toolId !== 'string') {
      return res.status(400).json({ success: false, message: 'toolId is required' });
    }

    const body = req.body || {};

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    const toolState = prefs ? safeJsonParse(prefs.toolState, {}) : {};
    const current = toolState[toolId] || {};

    // Merge new data into existing tool state
    toolState[toolId] = { ...current, ...body };

    await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: { toolState: JSON.stringify(toolState) },
      create: {
        userId: req.userId,
        toolState: JSON.stringify(toolState),
      },
    });

    res.json({ success: true, message: 'Tool state saved' });
  } catch (error) {
    console.error('[user-preferences] tool-state PUT error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save tool state' });
  }
});

export default router;
