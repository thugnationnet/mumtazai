import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// GET /api/gamification/metrics/:userId
router.get('/metrics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const metrics = await prisma.gamificationMetrics.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Get gamification metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

// POST /api/gamification/metrics/:userId
router.post('/metrics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const metricsUpdate = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const current = await prisma.gamificationMetrics.findUnique({ where: { userId } });

    // Merge agentsUsed arrays (deduplicated)
    let agentsUsed = metricsUpdate.agentsUsed;
    if (current && Array.isArray(metricsUpdate.agentsUsed)) {
      const existing = Array.isArray(current.agentsUsed) ? current.agentsUsed : [];
      agentsUsed = [...new Set([...existing, ...metricsUpdate.agentsUsed])];
    }

    const allowedFields = {
      ...(metricsUpdate.username !== undefined && { username: metricsUpdate.username }),
      ...(metricsUpdate.totalMessagesEarned !== undefined && { totalMessagesEarned: metricsUpdate.totalMessagesEarned }),
      ...(metricsUpdate.perfectResponseCount !== undefined && { perfectResponseCount: metricsUpdate.perfectResponseCount }),
      ...(metricsUpdate.highScoreCount !== undefined && { highScoreCount: metricsUpdate.highScoreCount }),
      ...(agentsUsed !== undefined && { agentsUsed }),
      ...(metricsUpdate.agentUsageCount !== undefined && { agentUsageCount: metricsUpdate.agentUsageCount }),
      ...(metricsUpdate.longestConversation !== undefined && { longestConversation: metricsUpdate.longestConversation }),
      ...(metricsUpdate.totalConversationLength !== undefined && { totalConversationLength: metricsUpdate.totalConversationLength }),
      ...(metricsUpdate.conversationSessions !== undefined && { conversationSessions: metricsUpdate.conversationSessions }),
      ...(metricsUpdate.usageByHour !== undefined && { usageByHour: metricsUpdate.usageByHour }),
      ...(metricsUpdate.usageByDay !== undefined && { usageByDay: metricsUpdate.usageByDay }),
      ...(metricsUpdate.currentStreak !== undefined && { currentStreak: metricsUpdate.currentStreak }),
      ...(metricsUpdate.longestStreak !== undefined && { longestStreak: metricsUpdate.longestStreak }),
      ...(metricsUpdate.completedChallengesCount !== undefined && { completedChallengesCount: metricsUpdate.completedChallengesCount }),
      ...(metricsUpdate.averageResponseTime !== undefined && { averageResponseTime: metricsUpdate.averageResponseTime }),
      ...(metricsUpdate.averageConversationLength !== undefined && { averageConversationLength: metricsUpdate.averageConversationLength }),
      lastActivityTime: new Date(),
    };

    const updated = await prisma.gamificationMetrics.upsert({
      where: { userId },
      create: { userId, ...allowedFields },
      update: allowedFields,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update gamification metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to update metrics' });
  }
});

// POST /api/gamification/events/:userId
router.post('/events/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, data = {} } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ success: false, error: 'User ID and event type are required' });
    }

    // Get or create metrics row
    let metrics = await prisma.gamificationMetrics.upsert({
      where: { userId },
      create: { userId, username: data.username || 'User' },
      update: {},
    });

    const agentsUsed = Array.isArray(metrics.agentsUsed) ? [...metrics.agentsUsed] : [];
    const agentUsageCount = (metrics.agentUsageCount && typeof metrics.agentUsageCount === 'object') ? { ...metrics.agentUsageCount } : {};
    const updateData = {};

    switch (type) {
    case 'message-sent':
      updateData.totalMessagesEarned = metrics.totalMessagesEarned + 1;
      if (data.agentId) {
        agentUsageCount[data.agentId] = (agentUsageCount[data.agentId] || 0) + 1;
        if (!agentsUsed.includes(data.agentId)) {
          agentsUsed.push(data.agentId);
        }
        updateData.agentsUsed = agentsUsed;
        updateData.agentUsageCount = agentUsageCount;
      }
      break;

    case 'perfect-response':
      updateData.perfectResponseCount = metrics.perfectResponseCount + 1;
      break;

    case 'high-score':
      updateData.highScoreCount = metrics.highScoreCount + 1;
      break;

    case 'session-end':
      if (data.messageCount) {
        updateData.longestConversation = Math.max(metrics.longestConversation, data.messageCount);
        updateData.totalConversationLength = metrics.totalConversationLength + data.messageCount;
      }
      break;

    case 'streak-update':
      if (data.streakCount) {
        updateData.currentStreak = data.streakCount;
        updateData.longestStreak = Math.max(metrics.longestStreak, data.streakCount);
      }
      break;
    }

    updateData.lastActivityTime = new Date();

    metrics = await prisma.gamificationMetrics.update({
      where: { userId },
      data: updateData,
    });

    res.json({ success: true, data: { eventProcessed: true, type, metrics } });
  } catch (error) {
    console.error('Track gamification event error:', error);
    res.status(500).json({ success: false, error: 'Failed to track event' });
  }
});

// GET /api/gamification/sync/:userId
router.get('/sync/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const metrics = await prisma.gamificationMetrics.findUnique({ where: { userId } });

    res.json({
      success: true,
      data: {
        metrics: metrics || null,
        pendingEvents: [],
        lastSyncTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Gamification sync error:', error);
    res.status(500).json({ success: false, error: 'Failed to sync data' });
  }
});

// POST /api/gamification/bulk-sync/:userId
router.post('/bulk-sync/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { metrics, events = [] } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    if (metrics) {
      const allowedFields = {
        ...(metrics.username !== undefined && { username: metrics.username }),
        ...(metrics.totalMessagesEarned !== undefined && { totalMessagesEarned: metrics.totalMessagesEarned }),
        ...(metrics.perfectResponseCount !== undefined && { perfectResponseCount: metrics.perfectResponseCount }),
        ...(metrics.highScoreCount !== undefined && { highScoreCount: metrics.highScoreCount }),
        ...(metrics.agentsUsed !== undefined && { agentsUsed: metrics.agentsUsed }),
        ...(metrics.agentUsageCount !== undefined && { agentUsageCount: metrics.agentUsageCount }),
        ...(metrics.longestConversation !== undefined && { longestConversation: metrics.longestConversation }),
        ...(metrics.totalConversationLength !== undefined && { totalConversationLength: metrics.totalConversationLength }),
        ...(metrics.conversationSessions !== undefined && { conversationSessions: metrics.conversationSessions }),
        ...(metrics.usageByHour !== undefined && { usageByHour: metrics.usageByHour }),
        ...(metrics.usageByDay !== undefined && { usageByDay: metrics.usageByDay }),
        ...(metrics.currentStreak !== undefined && { currentStreak: metrics.currentStreak }),
        ...(metrics.longestStreak !== undefined && { longestStreak: metrics.longestStreak }),
        ...(metrics.completedChallengesCount !== undefined && { completedChallengesCount: metrics.completedChallengesCount }),
        ...(metrics.averageResponseTime !== undefined && { averageResponseTime: metrics.averageResponseTime }),
        ...(metrics.averageConversationLength !== undefined && { averageConversationLength: metrics.averageConversationLength }),
        lastActivityTime: new Date(),
      };

      await prisma.gamificationMetrics.upsert({
        where: { userId },
        create: { userId, ...allowedFields },
        update: allowedFields,
      });
    }

    // Process events against the DB
    let processedEvents = 0;
    for (const event of events) {
      if (!event.type) continue;
      const current = await prisma.gamificationMetrics.findUnique({ where: { userId } });
      if (!current) continue;

      const evUpdate = {};
      switch (event.type) {
      case 'message-sent':
        evUpdate.totalMessagesEarned = current.totalMessagesEarned + 1;
        break;
      case 'perfect-response':
        evUpdate.perfectResponseCount = current.perfectResponseCount + 1;
        break;
      case 'high-score':
        evUpdate.highScoreCount = current.highScoreCount + 1;
        break;
      case 'session-end':
        if (event.data?.messageCount) {
          evUpdate.longestConversation = Math.max(current.longestConversation, event.data.messageCount);
          evUpdate.totalConversationLength = current.totalConversationLength + event.data.messageCount;
        }
        break;
      case 'streak-update':
        if (event.data?.streakCount) {
          evUpdate.currentStreak = event.data.streakCount;
          evUpdate.longestStreak = Math.max(current.longestStreak, event.data.streakCount);
        }
        break;
      }

      if (Object.keys(evUpdate).length > 0) {
        evUpdate.lastActivityTime = new Date();
        await prisma.gamificationMetrics.update({ where: { userId }, data: evUpdate });
        processedEvents++;
      }
    }

    res.json({
      success: true,
      data: {
        metricsUpdated: !!metrics,
        eventsProcessed: processedEvents,
        syncTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Bulk gamification sync error:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk sync' });
  }
});

export default router;