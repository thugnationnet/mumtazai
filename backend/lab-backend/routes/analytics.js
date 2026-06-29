/**
 * ANALYTICS API ENDPOINTS
 * Provides endpoints for tracking and retrieving analytics data
 * COMPLETE TRACKING: visitors, sessions, pageviews, events, tools, chat, lab
 */

import express from 'express';
import {
  trackVisitor,
  createSession,
  trackPageView,
  trackChatInteraction,
  trackToolUsage,
  trackUserEvent,
  updateChatFeedback,
  getVisitorStats,
  getSessionStats,
  getRealtimeStats,
  detectDevice,
  detectBrowser,
  detectOS,
} from '../lib/analytics-tracker.js';
import { getTrackingData } from '../lib/tracking-middleware.js';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// ============================================
// TRACK VISITOR (First visit)
// ============================================
router.post('/track/visitor', async (req, res) => {
  try {
    const { visitorId, sessionId, userId, referrer, landingPage, utmParams } =
      req.body;

    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      'unknown';

    const visitor = await trackVisitor({
      visitorId,
      sessionId,
      userId,
      ipAddress,
      userAgent,
      referrer,
      landingPage,
      device: detectDevice(userAgent),
      browser: detectBrowser(userAgent),
      os: detectOS(userAgent),
      utmParams,
    });

    // Also create/update session
    await createSession({
      sessionId,
      visitorId,
      userId,
      device: detectDevice(userAgent),
      browser: detectBrowser(userAgent),
      ipAddress,
    });

    res.json({
      success: true,
      visitorId: visitor?.visitorId,
      message: 'Visitor tracked',
    });
  } catch (error) {
    console.error('Error tracking visitor:', error);
    res.status(500).json({ error: 'Failed to track visitor' });
  }
});

// ============================================
// TRACK PAGE VIEW
// ============================================
router.post('/track/pageview', async (req, res) => {
  try {
    const { visitorId, sessionId, userId, url, title, referrer, timeSpent } =
      req.body;

    if (!visitorId || !sessionId) {
      return res
        .status(400)
        .json({ error: 'visitorId and sessionId required' });
    }

    const pageView = await trackPageView({
      visitorId,
      sessionId,
      userId,
      url: url || '/',
      title,
      referrer,
      timeSpent: timeSpent || 0,
    });

    res.json({
      success: true,
      pageViewId: pageView?._id,
      message: 'Page view tracked',
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({ error: 'Failed to track page view' });
  }
});

// ============================================
// TRACK LAB EXPERIMENT
// ============================================
router.post('/track/lab', async (req, res) => {
  try {
    const {
      experimentType,
      userId,
      sessionId,
      input,
      output,
      status,
      processingTime,
      tokensUsed,
    } = req.body;

    const experiment = new LabExperiment({
      experimentId: `exp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      experimentType,
      userId,
      sessionId,
      input,
      output,
      status: status || 'completed',
      processingTime,
      tokensUsed,
      createdAt: new Date(),
      completedAt: status === 'completed' ? new Date() : null,
    });

    await experiment.save();

    res.json({
      success: true,
      experimentId: experiment.experimentId,
      message: 'Lab experiment tracked',
    });
  } catch (error) {
    console.error('Error tracking lab experiment:', error);
    res.status(500).json({ error: 'Failed to track lab experiment' });
  }
});

// ============================================
// GET LAB ANALYTICS STATS (Real-time)
// ============================================
router.get('/lab/stats', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Get platform-wide active sessions in last 5 minutes (Prisma)
    const platformActiveSessions = await prisma.session.count({
      where: {
        isActive: true,
        lastActivity: { gte: fiveMinutesAgo },
      },
    });

    // Get unique lab experiment sessions in last 5 minutes (Prisma)
    const labActiveSessions = await prisma.labExperiment.findMany({
      where: {
        createdAt: { gte: fiveMinutesAgo },
        sessionId: { not: null },
      },
      distinct: ['sessionId'],
      select: { sessionId: true },
    });

    // Get total tests today (Prisma)
    const testsToday = await prisma.labExperiment.count({
      where: {
        createdAt: { gte: today },
      },
    });

    // Get total tests all time (Prisma)
    const totalTestsAllTime = await prisma.labExperiment.count();

    // Get average session duration from recent experiments (Prisma)
    const avgDurationResult = await prisma.labExperiment.aggregate({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
        processingTime: { gt: 0 },
      },
      _avg: {
        processingTime: true,
      },
    });
    const avgSessionMs = avgDurationResult._avg?.processingTime || 0;
    const avgMinutes = Math.floor(avgSessionMs / 60000);
    const avgSeconds = Math.floor((avgSessionMs % 60000) / 1000);

    // Experiment types mapping
    const experimentTypes = [
      { id: 'image-playground', name: 'AI Image Playground', color: 'from-pink-500 to-rose-500' },
      { id: 'story-weaver', name: 'AI Story Weaver', color: 'from-green-500 to-emerald-500' },
      { id: 'neural-art', name: 'Neural Art Studio', color: 'from-orange-500 to-amber-500' },
      { id: 'voice-cloning', name: 'Voice Cloning Studio', color: 'from-purple-500 to-indigo-500' },
      { id: 'emotion-visualizer', name: 'Emotion Visualizer', color: 'from-red-500 to-pink-500' },
      { id: 'personality-mirror', name: 'Personality Mirror', color: 'from-teal-500 to-cyan-500' },
      { id: 'music-generator', name: 'AI Music Generator', color: 'from-blue-500 to-cyan-500' },
      { id: 'battle-arena', name: 'AI Battle Arena', color: 'from-yellow-500 to-orange-500' },
      { id: 'dream-interpreter', name: 'Dream Interpreter', color: 'from-violet-500 to-purple-500' },
      { id: 'future-predictor', name: 'Future Predictor', color: 'from-indigo-500 to-blue-500' },
    ];

    // Get stats for each experiment type using Prisma
    const experimentStats = await Promise.all(
      experimentTypes.map(async (exp) => {
        // Total tests all time
        const totalTests = await prisma.labExperiment.count({
          where: { experimentType: exp.id },
        });

        // Active users (unique sessions in last 5 min)
        const activeNow = await prisma.labExperiment.findMany({
          where: {
            experimentType: exp.id,
            createdAt: { gte: fiveMinutesAgo },
            sessionId: { not: null },
          },
          distinct: ['sessionId'],
          select: { sessionId: true },
        });

        // Average duration for this experiment
        const durationResult = await prisma.labExperiment.aggregate({
          where: {
            experimentType: exp.id,
            processingTime: { gt: 0 },
          },
          _avg: { processingTime: true },
        });
        const avgMs = durationResult._avg?.processingTime || 0;
        const mins = Math.floor(avgMs / 60000);
        const secs = Math.floor((avgMs % 60000) / 1000);

        // 24h trend calculation
        const last24h = await prisma.labExperiment.count({
          where: {
            experimentType: exp.id,
            createdAt: { gte: twentyFourHoursAgo },
          },
        });
        const prev24h = await prisma.labExperiment.count({
          where: {
            experimentType: exp.id,
            createdAt: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo },
          },
        });
        
        let trendValue = 0;
        let trend = 'stable';
        if (prev24h > 0) {
          trendValue = ((last24h - prev24h) / prev24h) * 100;
          trend = trendValue > 2 ? 'up' : trendValue < -2 ? 'down' : 'stable';
        } else if (last24h > 0) {
          trendValue = 100;
          trend = 'up';
        }

        return {
          id: exp.id,
          name: exp.name,
          tests: totalTests,
          activeUsers: activeNow.length,
          avgDuration: `${mins}m ${secs.toString().padStart(2, '0')}s`,
          trend,
          trendValue: parseFloat(trendValue.toFixed(1)),
          color: exp.color,
        };
      }),
    );

    // Sort by total tests descending
    experimentStats.sort((a, b) => b.tests - a.tests);

    res.json({
      success: true,
      data: {
        realtime: {
          totalUsers: platformActiveSessions, // Platform-wide active users
          labActiveUsers: labActiveSessions.length, // Lab-specific active users
          activeExperiments: 10,
          testsToday,
          totalTestsAllTime, // Total tests ever
          avgSessionTime: `${avgMinutes}m ${avgSeconds.toString().padStart(2, '0')}s`,
        },
        experiments: experimentStats,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting lab stats:', error);
    res.status(500).json({ error: 'Failed to get lab stats' });
  }
});

// ============================================
// GET RECENT LAB ACTIVITY (Live Feed)
// ============================================
router.get('/lab/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    // Get recent experiments using Prisma
    const recentExperiments = await prisma.labExperiment.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        experimentId: true,
        experimentType: true,
        sessionId: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Map experiment types to display names
    const nameMap = {
      'image-playground': { name: 'AI Image Playground', color: 'text-pink-400' },
      'story-weaver': { name: 'Story Weaver', color: 'text-green-400' },
      'neural-art': { name: 'Neural Art Studio', color: 'text-orange-400' },
      'voice-cloning': { name: 'Voice Cloning Studio', color: 'text-purple-400' },
      'emotion-visualizer': { name: 'Emotion Visualizer', color: 'text-red-400' },
      'personality-mirror': { name: 'Personality Mirror', color: 'text-teal-400' },
      'music-generator': { name: 'Music Generator', color: 'text-blue-400' },
      'battle-arena': { name: 'AI Battle Arena', color: 'text-yellow-400' },
      'debate-arena': { name: 'Debate Arena', color: 'text-yellow-400' },
      'dream-interpreter': { name: 'Dream Interpreter', color: 'text-violet-400' },
      'future-predictor': { name: 'Future Predictor', color: 'text-indigo-400' },
    };

    // Generate user identifier from session ID or experiment ID
    const activity = recentExperiments.map((exp, index) => {
      // Use session ID if available, otherwise use experiment ID for unique identification
      let userLabel;
      if (exp.sessionId) {
        userLabel = `SID-${exp.sessionId.slice(-8).toUpperCase()}`;
      } else if (exp.experimentId) {
        // Use last 6 chars of experimentId for a unique identifier
        userLabel = `EXP-${exp.experimentId.slice(-6).toUpperCase()}`;
      } else {
        userLabel = `User-${String(index + 1).padStart(3, '0')}`;
      }
      
      const info = nameMap[exp.experimentType] || { name: exp.experimentType, color: 'text-gray-400' };
      const action = exp.status === 'completed' ? 'completed' : exp.status === 'processing' ? 'started' : 'started';
      
      // Calculate time ago
      const seconds = Math.floor((Date.now() - new Date(exp.createdAt).getTime()) / 1000);
      let timeAgo;
      if (seconds < 60) timeAgo = seconds === 0 ? 'Just now' : `${seconds}s ago`;
      else if (seconds < 3600) timeAgo = `${Math.floor(seconds / 60)}m ago`;
      else if (seconds < 86400) timeAgo = `${Math.floor(seconds / 3600)}h ago`;
      else timeAgo = `${Math.floor(seconds / 86400)}d ago`;

      return {
        user: userLabel,
        action,
        experiment: info.name,
        time: timeAgo,
        color: info.color,
      };
    });

    res.json({
      success: true,
      data: activity,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting lab activity:', error);
    res.status(500).json({ error: 'Failed to get lab activity' });
  }
});

// ============================================
// TRACK CHAT INTERACTION
// ============================================
router.post('/track/chat', async (req, res) => {
  try {
    const trackingData = getTrackingData(req);
    if (!trackingData) {
      return res.status(400).json({ error: 'Tracking data not available' });
    }

    const {
      agentId,
      agentName,
      userMessage,
      aiResponse,
      responseTime,
      model,
      language,
    } = req.body;

    const interaction = await trackChatInteraction({
      visitorId: trackingData.visitorId,
      sessionId: trackingData.sessionId,
      userId: trackingData.userId,
      agentId,
      agentName,
      userMessage,
      aiResponse,
      responseTime,
      model,
      language,
    });

    res.json({
      success: true,
      interactionId: interaction?._id,
      message: 'Chat interaction tracked',
    });
  } catch (error) {
    console.error('Error tracking chat:', error);
    res.status(500).json({ error: 'Failed to track chat' });
  }
});

// ============================================
// UPDATE CHAT FEEDBACK
// ============================================
router.post('/track/chat/feedback', async (req, res) => {
  try {
    const { interactionId, satisfied, feedback } = req.body;

    await updateChatFeedback(interactionId, satisfied, feedback);

    res.json({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// ============================================
// TRACK TOOL USAGE
// ============================================
router.post('/track/tool', async (req, res) => {
  try {
    const trackingData = getTrackingData(req);
    if (!trackingData) {
      return res.status(400).json({ error: 'Tracking data not available' });
    }

    const {
      toolName,
      toolCategory,
      input,
      output,
      success,
      error,
      executionTime,
    } = req.body;

    const toolUsage = await trackToolUsage({
      visitorId: trackingData.visitorId,
      sessionId: trackingData.sessionId,
      userId: trackingData.userId,
      toolName,
      toolCategory,
      input,
      output,
      success,
      error,
      executionTime,
    });

    res.json({
      success: true,
      usageId: toolUsage?._id,
      message: 'Tool usage tracked',
    });
  } catch (error) {
    console.error('Error tracking tool:', error);
    res.status(500).json({ error: 'Failed to track tool usage' });
  }
});

// ============================================
// TRACK USER EVENT
// ============================================
router.post('/track/event', async (req, res) => {
  try {
    const trackingData = getTrackingData(req);
    if (!trackingData) {
      return res.status(400).json({ error: 'Tracking data not available' });
    }

    const { eventType, eventName, eventData, success, error } = req.body;

    const event = await trackUserEvent({
      visitorId: trackingData.visitorId,
      sessionId: trackingData.sessionId,
      userId: trackingData.userId,
      eventType,
      eventName,
      eventData,
      success,
      error,
    });

    res.json({
      success: true,
      eventId: event?._id,
      message: 'User event tracked',
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// ============================================
// GET VISITOR STATS
// ============================================
router.get('/analytics/visitor/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;
    const stats = await getVisitorStats(visitorId);

    if (!stats) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    res.status(500).json({ error: 'Failed to get visitor stats' });
  }
});

// ============================================
// GET SESSION STATS
// ============================================
router.get('/analytics/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const stats = await getSessionStats(sessionId);

    if (!stats) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting session stats:', error);
    res.status(500).json({ error: 'Failed to get session stats' });
  }
});

// ============================================
// GET REALTIME STATS
// ============================================
router.get('/analytics/realtime', async (req, res) => {
  try {
    const stats = await getRealtimeStats();

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting realtime stats:', error);
    res.status(500).json({ error: 'Failed to get realtime stats' });
  }
});

// ============================================
// GET CURRENT TRACKING DATA
// ============================================
router.get('/analytics/current', (req, res) => {
  const trackingData = getTrackingData(req);

  if (!trackingData) {
    return res.status(400).json({ error: 'Tracking data not available' });
  }

  res.json({
    success: true,
    data: {
      visitorId: trackingData.visitorId,
      sessionId: trackingData.sessionId,
      userId: trackingData.userId,
      device: trackingData.device,
      browser: trackingData.browser,
      os: trackingData.os,
    },
  });
});

export default router;
