/**
 * CHAT SESSIONS ROUTES (Supplementary)
 * Handles POST (create) and PUT (update) session operations.
 * 
 * NOTE: GET /, GET /:sessionId, and DELETE /:sessionId are handled by
 * chat.js (mounted at /api/chat which has /sessions sub-routes).
 * This router is mounted at /api/chat/sessions for the remaining CRUD ops.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

// Rate limiting for chat sessions
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 session operations per 15 min window
  message: {
    success: false,
    message: 'Chat session rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
router.use(chatLimiter);

// ── Use shared auth middleware (checks neural_link_session JWT first, no DB lookup needed) ──

// Check if user has active subscription for specific agent
async function checkAgentSubscription(userId, agentId) {
  try {
    const activeSubscription = await prisma.agentSubscription.findFirst({
      where: {
        userId: userId,
        agentId: agentId,
        status: 'active',
        expiryDate: { gt: new Date() }
      }
    });

    return !!activeSubscription;
  } catch (error) {
    console.error('Subscription check error:', error);
    return false;
  }
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// POST /api/chat/sessions - Create new session
// ============================================

router.post('/', requireAuth, async (req, res) => {
  try {
    const { agentId, title, initialMessage } = req.body;
    const userId = req.userId;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID is required',
      });
    }

    // Check subscription for paid agents
    const hasSubscription = await checkAgentSubscription(userId, agentId);
    if (!hasSubscription && !['free-agent', 'basic-agent'].includes(agentId)) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required for this agent',
      });
    }

    const sessionId = generateId();
    const session = await prisma.chatSession.create({
      data: {
        id: sessionId,
        userId,
        agentId,
        title: title || 'New Chat',
        isActive: true,
        messageCount: initialMessage ? 1 : 0,
      },
    });

    // Create initial message if provided
    if (initialMessage) {
      await prisma.chatMessage.create({
        data: {
          id: generateId(),
          sessionId,
          role: 'user',
          content: initialMessage,
          userId,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: session.id,
        agentId: session.agentId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messageCount,
        isActive: session.isActive,
      },
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
    });
  }
});

// ============================================
// PUT /api/chat/sessions/:sessionId - Update session
// ============================================

router.put('/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, isActive } = req.body;
    const userId = req.userId;

    const updateData = {};
    if (title !== undefined) updateData.name = title;
    if (isActive !== undefined) updateData.isActive = isActive;

    const session = await prisma.chatSession.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data: updateData,
    });

    if (session.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      message: 'Session updated successfully',
    });

  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
    });
  }
});

export default router;