import express from 'express';
import { isValidId } from '../lib/validation-utils.js';
import { body, param, validationResult } from 'express-validator';
import { ChatInteraction } from '../models/Analytics.js';
import User from '../models/User.js';
import { Agent } from '../models/index.js';
import ChatSession from '../models/ChatSession.js';
import ChatSettings from '../models/ChatSettings.js';
import ChatFeedback from '../models/ChatFeedback.js';
import ChatQuickAction from '../models/ChatQuickAction.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth as sharedRequireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

// ============================================
// MIDDLEWARE
// ============================================

// Authentication middleware — delegates to shared auth-middleware
// which checks JWT → central auth fallback (port 3005) → ensureLocalUser
const requireAuth = (req, res, next) => {
  sharedRequireAuth(req, res, (err) => {
    if (err) return next(err);
    // Map req.userId to req.user for backward compatibility
    if (req.userId && !req.user) {
      req.user = { _id: req.userId, id: req.userId };
    } else if (req.user && !req.user._id) {
      req.user._id = req.user.id;
    }
    next();
  });
};

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// ============================================
// CHAT SESSIONS ROUTES
// ============================================

// GET /api/chat/sessions - Get user's chat sessions
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { agentId, limit = 20, offset = 0, active = true } = req.query;

    const where = { userId };
    if (agentId) {
      where.agentId = agentId;
    }
    // Handle active filter - default to showing active sessions
    if (active !== undefined) {
      where.isActive = active === 'true' || active === true;
    } else {
      where.isActive = true; // Default to active sessions
    }

    const sessions = await prisma.chatSession.findMany({
      where,
      include: { 
        agent: true,
        _count: { select: { messages: true } }, // Get actual message count from database
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const sessionList = sessions.map((session) => ({
      id: session.sessionId,
      name: session.name,
      description: session.description,
      agentId: session.agent,
      agentName: session.agent?.name || 'Unknown Agent',
      tags: session.tags,
      isActive: session.isActive,
      isArchived: session.isArchived,
      messageCount: session._count?.messages || session.stats?.messageCount || 0, // Use actual count from DB
      totalTokens: session.stats?.totalTokens || 0,
      durationMs: session.stats?.durationMs || 0,
      lastMessageAt: session.stats?.lastMessageAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      settings: session.settings,
    }));

    res.json({
      success: true,
      sessions: sessionList,
      total: sessionList.length,
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat sessions',
    });
  }
});

// GET /api/chat/sessions/:sessionId - Get specific session with messages
router.get(
  '/sessions/:sessionId',
  requireAuth,
  [param('sessionId').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      // Import prisma for direct query
      // const { prisma } = await import('../lib/prisma.js');

      const session = await prisma.chatSession.findFirst({
        where: {
          sessionId,
          userId,
        },
        include: { agent: true },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }

      // Import prisma to get messages from PostgreSQL
      // const { prisma } = await import('../lib/prisma.js');

      // Get messages from ChatMessage table (PostgreSQL)
      const chatMessages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
      });

      // Also check ChatInteraction for legacy messages
      const interactions = await ChatInteraction.find({
        conversationId: sessionId,
        userId,
      }).sort({ createdAt: 1 });

      // Combine messages from both sources
      const interactionMessages = [];
      interactions.forEach((interaction) => {
        interactionMessages.push(...interaction.messages);
      });

      // Merge and deduplicate (prefer ChatMessage as source of truth)
      const allMessages = chatMessages.length > 0 
        ? chatMessages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            metadata: msg.metadata || {},
            isPinned: msg.isPinned || false,
            isSaved: msg.isSaved || false,
            createdAt: msg.createdAt,
          }))
        : interactionMessages.map(msg => ({
            id: msg._id?.toString() || `legacy-${Date.now()}-${Math.random()}`,
            role: msg.role,
            content: msg.content,
            metadata: {},
            isPinned: false,
            isSaved: false,
            createdAt: msg.createdAt,
          }));

      const sessionData = {
        id: session.sessionId,
        name: session.name,
        description: session.description,
        agentId: session.agentId,
        agentName: session.agentId?.name || 'Unknown Agent',
        tags: session.tags,
        isActive: session.isActive,
        isArchived: session.isArchived,
        messages: allMessages,
        messageCount: allMessages.length,
        totalTokens: session.stats?.totalTokens || 0,
        durationMs: session.stats?.durationMs || 0,
        lastMessageAt: session.stats?.lastMessageAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        settings: session.settings,
      };

      res.json({
        success: true,
        session: sessionData,
      });
    } catch (error) {
      console.error('Error fetching chat session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chat session',
      });
    }
  },
);

// POST /api/chat/sessions - Create new session
router.post(
  '/sessions',
  requireAuth,
  [
    body('agentId').optional().isString(), // allow string ids or omit entirely
    body('name').optional().isString().isLength({ min: 1, max: 100 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('tags').optional().isArray(),
    body('settings').optional().isObject(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { agentId, name, description, tags, settings } = req.body;
      const userId = req.user._id;

      // Look up agent by agentId string (e.g., "chess-player", "julie-girlfriend")
      const agent = agentId ? await Agent.findOne({ agentId: agentId }) : null;

      // Generate session ID
      const sessionId = `session-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create chat session - use agentId string directly (not validated as ObjectId)
      const session = new ChatSession({
        sessionId,
        userId,
        agentId: agentId || undefined, // Store the string agentId like "chess-player"
        name:
          name || (agent?.name ? `Chat with ${agent.name}` : 'Chat session'),
        description: description || '',
        tags: tags || [],
        settings: settings || {},
        stats: {
          messageCount: 0,
          totalTokens: 0,
          durationMs: 0,
          lastMessageAt: null,
        },
      });

      await session.save();

      // Remove automatic welcome message creation - let frontend handle this
      // Create initial interaction with welcome message
      // const conversationId = sessionId; // align interactions with session id for retrieval
      // const welcomeInteraction = new ChatInteraction({
      //   conversationId,
      //   userId,
      //   agentId: agentId || undefined, // Store the string agentId
      //   messages: [
      //     {
      //       role: 'assistant',
      //       content:
      //         agent?.systemPrompt ||
      //         `Hello! I am ${
      //           agent?.name || 'your assistant'
      //         }. How can I help you today?`,
      //       createdAt: new Date(),
      //     },
      //   ],
      //   status: 'active',
      // });

      // await welcomeInteraction.save();

      res.status(201).json({
        success: true,
        session: {
          id: session.sessionId,
          name: session.name,
          description: session.description,
          agentId: session.agentId,
          agentName: agent?.name || 'Agent',
          tags: session.tags,
          isActive: session.isActive,
          messageCount: 0,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          settings: session.settings,
        },
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chat session',
      });
    }
  },
);

// POST /api/chat/sessions/:sessionId - Add message to session
router.post(
  '/sessions/:sessionId',
  requireAuth,
  [
    param('sessionId').isString().notEmpty(),
    body('role').isIn(['user', 'assistant', 'system']),
    body('content').isString().notEmpty(),
    body('agentId').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { role, content, agentId } = req.body;
      const userId = req.user._id;

      // Verify session belongs to user
      const session = await ChatSession.findOne({ sessionId, userId });
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }

      // Create the message in database
      const message = await prisma.chatMessage.create({
        data: {
          sessionId,
          role,
          content,
          metadata: agentId ? { agentId } : {},
          createdAt: new Date(),
          ...(req.body.latencyMs && role === 'assistant' ? { latencyMs: Math.round(req.body.latencyMs) } : {}),
        },
      });

      // Update session stats
      const currentStats = session.stats || { messageCount: 0, totalTokens: 0, durationMs: 0 };
      await ChatSession.updateOne(
        { sessionId },
        {
          $set: {
            'stats.messageCount': (currentStats.messageCount || 0) + 1,
            'stats.lastMessageAt': new Date(),
            updatedAt: new Date(),
          },
        }
      );

      res.status(201).json({
        success: true,
        message: {
          id: message.id,
          sessionId: message.sessionId,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        },
      });
    } catch (error) {
      console.error('Error saving message to session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save message',
      });
    }
  },
);

// POST /api/chat/sessions/:sessionId/messages - Save multiple messages to session (bulk)
router.post(
  '/sessions/:sessionId/messages',
  requireAuth,
  [
    param('sessionId').isString().notEmpty(),
    body('messages').isArray().notEmpty(),
    body('messages.*.role').isIn(['user', 'assistant', 'system']),
    body('messages.*.content').isString().notEmpty(),
    body('messages.*.metadata').optional().isObject(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { messages } = req.body;
      const userId = req.user._id;

      // Verify session belongs to user
      const session = await ChatSession.findOne({ sessionId, userId });
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }

      // Create all messages in database
      const savedMessages = [];
      for (const msg of messages) {
        const savedMsg = await prisma.chatMessage.create({
          data: {
            sessionId,
            role: msg.role,
            content: msg.content,
            metadata: msg.metadata || {},
            createdAt: new Date(),
            ...(msg.latencyMs && msg.role === 'assistant' ? { latencyMs: Math.round(msg.latencyMs) } : {}),
          },
        });
        savedMessages.push(savedMsg);
      }

      // Update session stats
      const currentStats = session.stats || { messageCount: 0, totalTokens: 0, durationMs: 0 };
      await ChatSession.updateOne(
        { sessionId },
        {
          $set: {
            'stats.messageCount': (currentStats.messageCount || 0) + messages.length,
            'stats.lastMessageAt': new Date(),
            updatedAt: new Date(),
          },
        }
      );

      res.status(201).json({
        success: true,
        savedCount: savedMessages.length,
        messages: savedMessages.map(m => ({
          id: m.id,
          sessionId: m.sessionId,
          role: m.role,
          createdAt: m.createdAt,
        })),
      });
    } catch (error) {
      console.error('Error saving messages to session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save messages',
      });
    }
  },
);

// PATCH /api/chat/messages/:messageId/pin - Toggle pin on a message
router.patch(
  '/messages/:messageId/pin',
  requireAuth,
  [param('messageId').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user._id;

      // Find the message and verify ownership through session
      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: { session: true },
      });

      if (!message || message.session.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Message not found' });
      }

      const updated = await prisma.chatMessage.update({
        where: { id: messageId },
        data: { isPinned: !message.isPinned },
      });

      res.json({ success: true, messageId, isPinned: updated.isPinned });
    } catch (error) {
      console.error('Error toggling pin:', error);
      res.status(500).json({ success: false, error: 'Failed to toggle pin' });
    }
  },
);

// PATCH /api/chat/messages/:messageId/save - Toggle save on a message
router.patch(
  '/messages/:messageId/save',
  requireAuth,
  [param('messageId').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user._id;

      // Find the message and verify ownership through session
      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: { session: true },
      });

      if (!message || message.session.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Message not found' });
      }

      const updated = await prisma.chatMessage.update({
        where: { id: messageId },
        data: { isSaved: !message.isSaved },
      });

      res.json({ success: true, messageId, isSaved: updated.isSaved });
    } catch (error) {
      console.error('Error toggling save:', error);
      res.status(500).json({ success: false, error: 'Failed to toggle save' });
    }
  },
);

// DELETE /api/chat/sessions/:sessionId - Delete session (soft delete via archive)
router.delete(
  '/sessions/:sessionId',
  requireAuth,
  [param('sessionId').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      // Find the session in database
      const session = await prisma.chatSession.findFirst({
        where: { sessionId, userId },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }

      // Soft delete by archiving
      await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'Session deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete chat session',
      });
    }
  },
);

// ============================================
// CHAT INTERACTIONS ROUTES
// ============================================

// POST /api/chat/interactions - Save chat interaction
router.post(
  '/interactions',
  requireAuth,
  [
    body('conversationId').isString().notEmpty(),
    body('agentId').optional().isString(), // relax: accept string or omit
    body('messages').isArray().notEmpty(),
    body('messages.*.role').isIn(['user', 'assistant', 'system']),
    body('messages.*.content').isString().notEmpty(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { conversationId, agentId, messages, summary, metrics } = req.body;
      const userId = req.user._id;

      // Create interaction
      const interaction = new ChatInteraction({
        conversationId,
        userId,
        agentId: isValidId(agentId) ? agentId : undefined,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          createdAt: msg.timestamp || new Date(),
        })),
        summary,
        metrics,
        status: 'active',
      });

      await interaction.save();

      res.status(201).json({
        success: true,
        interaction: {
          id: interaction._id,
          conversationId: interaction.conversationId,
          messageCount: interaction.messages.length,
          createdAt: interaction.createdAt,
        },
      });
    } catch (error) {
      console.error('Error saving chat interaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save chat interaction',
      });
    }
  },
);

// ============================================
// CHAT SETTINGS ROUTES
// ============================================

// GET /api/chat/settings - Get user chat settings
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    let settings = await ChatSettings.findOne({ userId });

    // Create default settings if none exist
    if (!settings) {
      settings = new ChatSettings({
        userId,
        theme: 'auto',
        fontSize: 'medium',
        notifications: {
          messageReceived: true,
          agentResponses: true,
          systemUpdates: false,
        },
        autoSave: true,
        quickActions: {
          enabled: true,
          favorites: ['explain', 'summarize', 'code'],
        },
        privacy: {
          saveHistory: true,
          allowAnalytics: true,
          shareConversations: false,
        },
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          screenReader: false,
        },
      });
      await settings.save();
    }

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching chat settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat settings',
    });
  }
});

// PUT /api/chat/settings - Update user chat settings
router.put(
  '/settings',
  requireAuth,
  [
    body('theme').optional().isIn(['light', 'dark', 'auto', 'neural']),
    body('fontSize').optional().isIn(['small', 'medium', 'large']),
    body('notifications').optional().isObject(),
    body('autoSave').optional().isBoolean(),
    body('defaultAgent').optional().isString(),
    body('quickActions').optional().isObject(),
    body('privacy').optional().isObject(),
    body('accessibility').optional().isObject(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const updates = req.body;

      // Verify defaultAgent exists if provided
      if (updates.defaultAgent) {
        const agent = await Agent.findById(updates.defaultAgent);
        if (!agent) {
          return res.status(404).json({
            success: false,
            error: 'Default agent not found',
          });
        }
      }

      const settings = await ChatSettings.findOneAndUpdate(
        { userId },
        { ...updates, userId },
        { upsert: true, new: true },
      );

      res.json({
        success: true,
        message: 'Settings updated successfully',
        settings,
      });
    } catch (error) {
      console.error('Error updating chat settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update chat settings',
      });
    }
  },
);

// ============================================
// CHAT FEEDBACK ROUTES
// ============================================

// POST /api/chat/feedback - Submit feedback
router.post(
  '/feedback',
  requireAuth,
  [
    body('conversationId').isString().notEmpty(),
    body('feedbackType').isIn(['message', 'conversation', 'agent']),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString().isLength({ max: 1000 }),
    body('category')
      .optional()
      .isIn([
        'accuracy',
        'helpfulness',
        'speed',
        'tone',
        'creativity',
        'technical',
      ]),
    body('messageId').optional().isString(),
    body('agentId').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        conversationId,
        messageId,
        agentId,
        feedbackType,
        rating,
        comment,
        category,
        tags,
      } = req.body;
      const userId = req.user._id;

      // Verify agent exists if provided
      if (agentId) {
        const agent = await Agent.findById(agentId);
        if (!agent) {
          return res.status(404).json({
            success: false,
            error: 'Agent not found',
          });
        }
      }

      const feedback = new ChatFeedback({
        conversationId,
        messageId,
        userId,
        agentId,
        feedbackType,
        rating,
        comment,
        category,
        tags: tags || [],
      });

      await feedback.save();

      res.status(201).json({
        success: true,
        feedback: {
          id: feedback._id,
          conversationId: feedback.conversationId,
          feedbackType: feedback.feedbackType,
          rating: feedback.rating,
          createdAt: feedback.createdAt,
        },
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit feedback',
      });
    }
  },
);

// ============================================
// CHAT QUICK ACTIONS ROUTES
// ============================================

// GET /api/chat/quick-actions - Get available quick actions
router.get('/quick-actions', requireAuth, async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;

    const query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const actions = await ChatQuickAction.find(query)
      .sort({ usageCount: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      actions,
    });
  } catch (error) {
    console.error('Error fetching quick actions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quick actions',
    });
  }
});

// POST /api/chat/quick-actions/:actionId/use - Track usage of quick action
router.post(
  '/quick-actions/:actionId/use',
  requireAuth,
  [param('actionId').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const { actionId } = req.params;

      await ChatQuickAction.findOneAndUpdate(
        { actionId },
        { $inc: { usageCount: 1 } },
      );

      res.json({
        success: true,
        message: 'Usage tracked successfully',
      });
    } catch (error) {
      console.error('Error tracking quick action usage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track usage',
      });
    }
  },
);

export default router;
