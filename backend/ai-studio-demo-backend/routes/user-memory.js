/**
 * USER MEMORY ROUTES
 * Stores user memory profile + auto-extracted memories in PostgreSQL
 * GET  /api/user/memory — load memory settings
 * PUT  /api/user/memory — save memory settings
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// ── Auth middleware (same pattern as chat-sessions) ─────────────
async function authenticateUser(req, res, next) {
  try {
    const sessionId = req.cookies?.session_id || req.cookies?.sessionId;
    if (!sessionId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await prisma.user.findFirst({
      where: { sessionId, sessionExpiry: { gt: new Date() } },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    req.userId = user.id;
    next();
  } catch (error) {
    console.error('[user-memory] Auth error:', error.message);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
}

router.use(authenticateUser);

// ── GET /api/user/memory ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const profile = await prisma.userMemoryProfile.findUnique({
      where: { userId: req.userId },
    });

    if (!profile) {
      // Return default settings (not yet saved)
      return res.json({
        success: true,
        data: {
          enabled: false,
          userName: '',
          language: '',
          gender: '',
          dateOfBirth: '',
          memories: [],
        },
      });
    }

    // Parse memories JSON
    let memories = [];
    try {
      memories = typeof profile.memories === 'string'
        ? JSON.parse(profile.memories)
        : profile.memories;
    } catch {
      memories = [];
    }

    res.json({
      success: true,
      data: {
        enabled: profile.enabled,
        userName: profile.userName,
        language: profile.language,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        memories,
      },
    });
  } catch (error) {
    console.error('[user-memory] GET error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load memory settings' });
  }
});

// ── PUT /api/user/memory ────────────────────────────────────────
router.put('/', async (req, res) => {
  try {
    const { enabled, userName, language, gender, dateOfBirth, memories } = req.body;

    // Validate memories array (cap at 50)
    const safeMemories = Array.isArray(memories) ? memories.slice(-50) : [];

    const profile = await prisma.userMemoryProfile.upsert({
      where: { userId: req.userId },
      update: {
        enabled: Boolean(enabled),
        userName: String(userName || ''),
        language: String(language || ''),
        gender: String(gender || ''),
        dateOfBirth: String(dateOfBirth || ''),
        memories: JSON.stringify(safeMemories),
      },
      create: {
        userId: req.userId,
        enabled: Boolean(enabled),
        userName: String(userName || ''),
        language: String(language || ''),
        gender: String(gender || ''),
        dateOfBirth: String(dateOfBirth || ''),
        memories: JSON.stringify(safeMemories),
      },
    });

    res.json({
      success: true,
      message: 'Memory settings saved',
      data: {
        enabled: profile.enabled,
        userName: profile.userName,
        language: profile.language,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        memories: safeMemories,
      },
    });
  } catch (error) {
    console.error('[user-memory] PUT error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save memory settings' });
  }
});

export default router;
