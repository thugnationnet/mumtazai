import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

const AGENT_MAP = {
  einstein: { name: 'Einstein', type: 'Physics & Science', avatar: '🧠' },
  'tech-wizard': {
    name: 'Tech Wizard',
    type: 'Technology & Programming',
    avatar: '🧙‍♂️',
  },
  'comedy-king': {
    name: 'Comedy King',
    type: 'Entertainment & Humor',
    avatar: '😄',
  },
  'chef-biew': { name: 'Chef Biew', type: 'Cooking & Recipes', avatar: '👨‍🍳' },
  'ben-sega': {
    name: 'Ben Sega',
    type: 'Gaming & Entertainment',
    avatar: '🎮',
  },
  'chess-player': {
    name: 'Chess Player',
    type: 'Strategy & Games',
    avatar: '♟️',
  },
  default: { name: 'AI Assistant', type: 'General Purpose', avatar: '🤖' },
};

function resolveAgent(agentId) {
  if (!agentId) {
    return AGENT_MAP.default;
  }
  return AGENT_MAP[agentId] || AGENT_MAP.default;
}

function calculateTrend(current, previous) {
  if (previous === 0) {
    return { change: '+100%', trend: 'up' };
  }
  const percentChange = ((current - previous) / previous) * 100;
  const change = `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
  return {
    change,
    trend: percentChange >= 0 ? 'up' : 'down',
  };
}

router.get('/:agentId', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const agentIdParam = req.params.agentId;
    const timeRange = req.query.timeRange || '7d';
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const previousPeriodStart = new Date(
      startDate.getTime() - (now.getTime() - startDate.getTime())
    );

    const agentInfo = resolveAgent(agentIdParam);

    // Build the where clause - for 'default', show ALL user sessions
    // For specific agents, filter by agentId or session name
    const baseWhere = {
      userId,
      createdAt: { gte: startDate },
    };

    // Get current period chat sessions for THIS USER
    const currentSessions = await prisma.chatSession.findMany({
      where: agentIdParam === 'default' 
        ? baseWhere
        : {
            ...baseWhere,
            OR: [
              { agentId: { contains: agentIdParam, mode: 'insensitive' } },
              { name: { contains: agentInfo.name, mode: 'insensitive' } }
            ]
          },
      include: {
        messages: true,
        agent: true
      }
    });

    console.log(`[Agent Performance] User: ${userId}, Agent: ${agentIdParam}, Sessions found: ${currentSessions.length}`);

    // Calculate stats from actual chat sessions
    const totalConversations = currentSessions.length;
    let totalMessages = 0;
    let totalDurationMs = 0;

    currentSessions.forEach((session) => {
      totalMessages += session.messages?.length || 0;
      // Get duration from stats if available
      const stats = session.stats;
      if (stats?.durationMs) {
        totalDurationMs += stats.durationMs;
      } else {
        // Estimate based on message count
        totalDurationMs += (session.messages?.length || 0) * 2000;
      }
    });

    const avgResponseTime = totalConversations > 0 
      ? totalDurationMs / totalConversations / 1000 // Convert to seconds
      : 1.2;

    // Build previous period where clause
    const prevBaseWhere = {
      userId,
      createdAt: { gte: previousPeriodStart, lt: startDate },
    };

    // Get previous period stats for comparison
    const previousSessions = await prisma.chatSession.findMany({
      where: agentIdParam === 'default'
        ? prevBaseWhere
        : {
            ...prevBaseWhere,
            OR: [
              { agentId: { contains: agentIdParam, mode: 'insensitive' } },
              { name: { contains: agentInfo.name, mode: 'insensitive' } }
            ]
          },
      include: {
        messages: true
      }
    });

    const prevTotalConversations = previousSessions.length;
    let prevTotalMessages = 0;
    let prevTotalDurationMs = 0;

    previousSessions.forEach((session) => {
      prevTotalMessages += session.messages?.length || 0;
      const stats = session.stats;
      if (stats?.durationMs) {
        prevTotalDurationMs += stats.durationMs;
      } else {
        prevTotalDurationMs += (session.messages?.length || 0) * 2000;
      }
    });

    const prevAvgResponseTime = prevTotalConversations > 0 
      ? prevTotalDurationMs / prevTotalConversations / 1000
      : 1.2;

    const conversationTrend = calculateTrend(totalConversations, prevTotalConversations);
    const messageTrend = calculateTrend(totalMessages, prevTotalMessages);
    // For response time, lower is better, so we reverse the comparison
    const responseTimeTrend = calculateTrend(prevAvgResponseTime, avgResponseTime);

    // Get recent activity from chat sessions
    const recentSessions = await prisma.chatSession.findMany({
      where: agentIdParam === 'default'
        ? baseWhere
        : {
            ...baseWhere,
            OR: [
              { agentId: { contains: agentIdParam, mode: 'insensitive' } },
              { name: { contains: agentInfo.name, mode: 'insensitive' } }
            ]
          },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        agent: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    const transformedActivity = recentSessions.map((session) => {
      const lastUpdate = session.updatedAt || session.createdAt;
      const minutesAgo = Math.floor(
        (now.getTime() - lastUpdate.getTime()) / (1000 * 60)
      );
      
      let timeAgo;
      if (minutesAgo < 1) {
        timeAgo = 'Just now';
      } else if (minutesAgo < 60) {
        timeAgo = `${minutesAgo} min ago`;
      } else if (minutesAgo < 1440) {
        timeAgo = `${Math.floor(minutesAgo / 60)} hours ago`;
      } else {
        timeAgo = `${Math.floor(minutesAgo / 1440)} days ago`;
      }

      const lastMessage = session.messages?.[0];
      const description = lastMessage?.content
        ? `${lastMessage.content.substring(0, 60)}${
            lastMessage.content.length > 60 ? '...' : ''
          }`
        : session.name || 'Conversation started';

      return {
        timestamp: timeAgo,
        type: 'conversation',
        description,
        user: 'You',
      };
    });

    // Calculate satisfaction score based on activity
    const satisfactionScore = Math.min(
      5,
      4 + (totalConversations / 50) * 0.5 + (totalMessages / 200) * 0.3
    );

    // Determine agent status
    const hasRecentActivity = currentSessions.some(s => {
      const lastUpdate = s.updatedAt || s.createdAt;
      return (now.getTime() - lastUpdate.getTime()) < 30 * 60 * 1000; // 30 minutes
    });

    const performanceData = {
      agent: {
        name: agentInfo.name,
        type: agentInfo.type,
        avatar: agentInfo.avatar,
        status: hasRecentActivity ? 'active' : (totalConversations > 0 ? 'idle' : 'idle'),
      },
      metrics: {
        totalConversations,
        totalMessages,
        averageResponseTime: Math.round(avgResponseTime * 10) / 10,
        satisfactionScore: Math.round(satisfactionScore * 10) / 10,
        activeUsers: totalConversations > 0 ? 1 : 0, // For individual user dashboard
        uptime: 99.9,
      },
      trends: {
        conversations: {
          value: totalConversations,
          change: conversationTrend.change,
          trend: conversationTrend.trend,
        },
        messages: {
          value: totalMessages,
          change: messageTrend.change,
          trend: messageTrend.trend,
        },
        responseTime: {
          value: Math.round(avgResponseTime * 10) / 10,
          change: responseTimeTrend.change,
          trend: responseTimeTrend.trend,
        },
        satisfaction: {
          value: Math.round(satisfactionScore * 10) / 10,
          change: '+0.1',
          trend: 'up',
        },
      },
      recentActivity: transformedActivity,
      timeRange,
      conversationsInWindow: `${totalConversations} conversations in this window`,
      dataRefreshed: new Date().toISOString(),
    };

    res.json({ success: true, data: performanceData });
  } catch (error) {
    console.error('Agent performance error:', error);
    res.status(500).json(
      { message: 'Internal server error', error: String(error) }
    );
  }
});

// GET /api/agent/performance/overview — aggregate metrics across all agents
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate sessions across all agents for this user
    const sessions = await prisma.chatSession.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: {
        agentId: true,
        createdAt: true,
        stats: true,
        messages: { select: { role: true } },
      },
    });

    // Group by agent
    const agentStats = {};
    for (const session of sessions) {
      const aid = session.agentId || 'default';
      if (!agentStats[aid]) {
        agentStats[aid] = { total: 0, responseTimes: [], messages: 0 };
      }
      agentStats[aid].total += 1;
      const durationMs = session.stats?.durationMs;
      if (durationMs) agentStats[aid].responseTimes.push(durationMs / 1000);
      agentStats[aid].messages += (session.messages?.length || 0);
    }

    const agents = Object.entries(agentStats).map(([agentId, stats]) => {
      const meta = resolveAgent(agentId);
      const avgResponse = stats.responseTimes.length
        ? (stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length).toFixed(1)
        : '—';
      return {
        agentId,
        name: meta.name,
        type: meta.type,
        avatar: meta.avatar,
        conversations: stats.total,
        avgResponseTime: avgResponse !== '—' ? `${avgResponse}s` : '—',
        satisfaction: '—',
        messages: stats.messages,
      };
    });

    // Global aggregates
    const allResponseTimes = sessions
      .filter(s => s.stats?.durationMs)
      .map(s => s.stats.durationMs / 1000);

    const overview = {
      totalConversations: sessions.length,
      totalAgents: Object.keys(agentStats).length,
      avgResponseTime: allResponseTimes.length
        ? `${(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length).toFixed(1)}s`
        : '—',
      avgSatisfaction: '—',
      agents,
      dataRefreshed: new Date().toISOString(),
    };

    res.json({ success: true, data: overview });
  } catch (error) {
    console.error('Agent performance overview error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;