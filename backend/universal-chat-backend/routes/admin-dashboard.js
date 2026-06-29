/**
 * ADMIN DASHBOARD API
 * Comprehensive analytics, monitoring, user management & system metrics
 * All endpoints require admin role authentication
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth-middleware.js';

const router = express.Router();

// All admin dashboard routes require authenticated admin user
// Auth middleware imported from ../lib/auth-middleware.js
router.use(requireAdmin);

// ============================================
// OVERVIEW / REAL-TIME DASHBOARD
// ============================================

/**
 * GET /api/admin/dashboard/overview
 * Main dashboard overview with real-time + aggregate stats
 */
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Run all queries in parallel
    const [
      totalUsers,
      newUsersToday,
      newUsers7d,
      activeSessionsNow,
      totalVisitors,
      visitorsToday,
      visitors7d,
      pageViewsToday,
      pageViews7d,
      pageViews30d,
      totalPageViews,
      apiCallsToday,
      apiCalls7d,
      chatInteractionsToday,
      chatInteractions7d,
      toolUsagesToday,
      eventsToday,
      totalTransactions,
      revenueTotal,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: last7d } } }),
      prisma.session.count({
        where: { isActive: true, lastActivity: { gte: fiveMinAgo } },
      }),
      prisma.visitor.count(),
      prisma.visitor.count({ where: { firstVisit: { gte: today } } }),
      prisma.visitor.count({ where: { firstVisit: { gte: last7d } } }),
      prisma.pageView.count({ where: { timestamp: { gte: today } } }),
      prisma.pageView.count({ where: { timestamp: { gte: last7d } } }),
      prisma.pageView.count({ where: { timestamp: { gte: last30d } } }),
      prisma.pageView.count(),
      prisma.apiUsage.count({ where: { timestamp: { gte: today } } }),
      prisma.apiUsage.count({ where: { timestamp: { gte: last7d } } }),
      prisma.chatAnalyticsInteraction.count({
        where: { startedAt: { gte: today } },
      }),
      prisma.chatAnalyticsInteraction.count({
        where: { startedAt: { gte: last7d } },
      }),
      prisma.toolUsage.count({ where: { occurredAt: { gte: today } } }),
      prisma.userEvent.count({ where: { occurredAt: { gte: today } } }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'completed' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        realtime: {
          activeSessions: activeSessionsNow,
          timestamp: now,
        },
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          new7d: newUsers7d,
        },
        visitors: {
          total: totalVisitors,
          today: visitorsToday,
          last7d: visitors7d,
        },
        pageViews: {
          total: totalPageViews,
          today: pageViewsToday,
          last7d: pageViews7d,
          last30d: pageViews30d,
        },
        apiCalls: {
          today: apiCallsToday,
          last7d: apiCalls7d,
        },
        chats: {
          today: chatInteractionsToday,
          last7d: chatInteractions7d,
        },
        tools: {
          today: toolUsagesToday,
        },
        events: {
          today: eventsToday,
        },
        revenue: {
          total: revenueTotal._sum.amount || 0,
          transactions: totalTransactions,
        },
      },
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get overview stats' });
  }
});

/**
 * GET /api/admin/dashboard/realtime
 * Live data for real-time monitoring (poll every 10-30s)
 */
router.get('/realtime', async (req, res) => {
  try {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneMinAgo = new Date(now.getTime() - 60 * 1000);

    const [
      activeSessions,
      activeVisitors,
      recentPageViews,
      recentApiCalls,
      recentChats,
      recentSessions,
      recentErrors,
    ] = await Promise.all([
      prisma.session.count({
        where: { isActive: true, lastActivity: { gte: fiveMinAgo } },
      }),
      prisma.visitor.count({
        where: { isActive: true, lastVisit: { gte: fiveMinAgo } },
      }),
      prisma.pageView.findMany({
        where: { timestamp: { gte: fiveMinAgo } },
        orderBy: { timestamp: 'desc' },
        take: 20,
        select: { url: true, visitorId: true, timestamp: true, userId: true },
      }),
      prisma.apiUsage.findMany({
        where: { timestamp: { gte: oneMinAgo } },
        orderBy: { timestamp: 'desc' },
        take: 20,
        select: {
          endpoint: true,
          method: true,
          statusCode: true,
          responseTime: true,
          ipAddress: true,
          timestamp: true,
        },
      }),
      prisma.chatAnalyticsInteraction.count({
        where: { startedAt: { gte: fiveMinAgo } },
      }),
      prisma.session.findMany({
        where: { isActive: true, lastActivity: { gte: fiveMinAgo } },
        orderBy: { lastActivity: 'desc' },
        take: 20,
        select: {
          sessionId: true,
          visitorId: true,
          userId: true,
          startTime: true,
          lastActivity: true,
          pageViews: true,
          events: true,
          duration: true,
        },
      }),
      prisma.apiUsage.count({
        where: {
          timestamp: { gte: fiveMinAgo },
          statusCode: { gte: 400 },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        activeSessions,
        activeVisitors,
        recentPageViews,
        recentApiCalls,
        recentChats,
        recentSessions,
        recentErrors,
        timestamp: now,
      },
    });
  } catch (error) {
    console.error('Admin realtime error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get realtime stats' });
  }
});

// ============================================
// VISITORS & SESSIONS
// ============================================

/**
 * GET /api/admin/dashboard/visitors
 * Paginated visitor list with filters
 */
router.get('/visitors', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      device,
      browser,
      os,
      country,
      registered,
      search,
      sortBy = 'lastVisit',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (device) where.device = device;
    if (browser) where.browser = browser;
    if (os) where.os = os;
    if (country) where.country = country;
    if (registered === 'true') where.isRegistered = true;
    if (registered === 'false') where.isRegistered = false;
    if (search) {
      where.OR = [
        { visitorId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { browser: { contains: search, mode: 'insensitive' } },
        { os: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.visitor.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        visitors,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    console.error('Admin visitors error:', error);
    res.status(500).json({ success: false, message: 'Failed to get visitors' });
  }
});

/**
 * GET /api/admin/dashboard/visitors/:visitorId
 * Detailed visitor profile with full activity history
 */
router.get('/visitors/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;

    const [visitor, sessions, pageViews, events] = await Promise.all([
      prisma.visitor.findUnique({ where: { visitorId } }),
      prisma.session.findMany({
        where: { visitorId },
        orderBy: { startTime: 'desc' },
        take: 20,
      }),
      prisma.pageView.findMany({
        where: { visitorId },
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),
      prisma.analyticsEvent.findMany({
        where: { visitorId },
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),
    ]);

    if (!visitor) {
      return res
        .status(404)
        .json({ success: false, message: 'Visitor not found' });
    }

    res.json({
      success: true,
      data: { visitor, sessions, pageViews, events },
    });
  } catch (error) {
    console.error('Admin visitor detail error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get visitor details' });
  }
});

/**
 * GET /api/admin/dashboard/sessions
 * Active and recent sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      active,
      sortBy = 'lastActivity',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.session.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    console.error('Admin sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sessions' });
  }
});

// ============================================
// USERS MANAGEMENT
// ============================================

/**
 * GET /api/admin/dashboard/users
 * Paginated user list with search & filters
 */
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          loginAttempts: true,
          isActive: true,
          image: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
});

/**
 * GET /api/admin/dashboard/users/:userId
 * Detailed user profile with activity
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [user, sessions, events, chats, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          loginAttempts: true,
          isActive: true,
          image: true,
          preferences: true,
        },
      }),
      prisma.session.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: 20,
      }),
      prisma.userEvent.findMany({
        where: { userId },
        orderBy: { occurredAt: 'desc' },
        take: 50,
      }),
      prisma.chatAnalyticsInteraction.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: 20,
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: { user, sessions, events, chats, transactions },
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get user details' });
  }
});

/**
 * PATCH /api/admin/dashboard/users/:userId/role
 * Update user role
 */
router.patch('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Only the 3 hardcoded admin emails can be set to admin role
    if (role === 'admin') {
      const ADMIN_EMAILS = ['admin@mumtaz.ai', 'admin@onelast.ai', 'admin@maula.ai'];
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (!target || !ADMIN_EMAILS.includes(target.email.toLowerCase())) {
        return res.status(403).json({ success: false, message: 'Only designated admin emails can be granted admin role' });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

/**
 * PATCH /api/admin/dashboard/users/:userId/status
 * Ban/unban user
 */
router.patch('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !!isActive },
      select: { id: true, email: true, name: true, isActive: true },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Admin update status error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to update user status' });
  }
});

// ============================================
// PAGE VIEWS & CONTENT ANALYTICS
// ============================================

/**
 * GET /api/admin/dashboard/pageviews
 * Page view analytics with aggregation
 */
router.get('/pageviews', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const now = new Date();

    let since;
    switch (period) {
      case '24h':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Top pages
    const topPages = await prisma.pageView.groupBy({
      by: ['url'],
      where: { timestamp: { gte: since } },
      _count: { url: true },
      orderBy: { _count: { url: 'desc' } },
      take: 20,
    });

    // Page views over time (group by date)
    const allPageViews = await prisma.pageView.findMany({
      where: { timestamp: { gte: since } },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    // Group by date
    const viewsByDate = {};
    allPageViews.forEach((pv) => {
      const date = pv.timestamp.toISOString().split('T')[0];
      viewsByDate[date] = (viewsByDate[date] || 0) + 1;
    });

    const timeline = Object.entries(viewsByDate).map(([date, count]) => ({
      date,
      count,
    }));

    // Total
    const total = await prisma.pageView.count({
      where: { timestamp: { gte: since } },
    });

    res.json({
      success: true,
      data: {
        topPages: topPages.map((p) => ({ url: p.url, views: p._count.url })),
        timeline,
        total,
        period,
      },
    });
  } catch (error) {
    console.error('Admin pageviews error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get pageviews' });
  }
});

// ============================================
// DEVICE / BROWSER / OS BREAKDOWN
// ============================================

/**
 * GET /api/admin/dashboard/devices
 * Device, browser, OS analytics breakdown
 */
router.get('/devices', async (req, res) => {
  try {
    const [devices, browsers, operatingSystems] = await Promise.all([
      prisma.visitor.groupBy({
        by: ['device'],
        _count: { device: true },
        orderBy: { _count: { device: 'desc' } },
      }),
      prisma.visitor.groupBy({
        by: ['browser'],
        _count: { browser: true },
        orderBy: { _count: { browser: 'desc' } },
        take: 10,
      }),
      prisma.visitor.groupBy({
        by: ['os'],
        _count: { os: true },
        orderBy: { _count: { os: 'desc' } },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        devices: devices.map((d) => ({
          name: d.device,
          count: d._count.device,
        })),
        browsers: browsers.map((b) => ({
          name: b.browser,
          count: b._count.browser,
        })),
        os: operatingSystems.map((o) => ({ name: o.os, count: o._count.os })),
      },
    });
  } catch (error) {
    console.error('Admin devices error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get device stats' });
  }
});

// ============================================
// GEO / LOCATION
// ============================================

/**
 * GET /api/admin/dashboard/geo
 * Geographic distribution of visitors
 */
router.get('/geo', async (req, res) => {
  try {
    const [countries, cities] = await Promise.all([
      prisma.visitor.groupBy({
        by: ['country'],
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 30,
      }),
      prisma.visitor.groupBy({
        by: ['city', 'country'],
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
        take: 30,
      }),
    ]);

    res.json({
      success: true,
      data: {
        countries: countries.map((c) => ({
          name: c.country,
          count: c._count.country,
        })),
        cities: cities.map((c) => ({
          name: c.city,
          country: c.country,
          count: c._count.city,
        })),
      },
    });
  } catch (error) {
    console.error('Admin geo error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get geo stats' });
  }
});

// ============================================
// API MONITORING
// ============================================

/**
 * GET /api/admin/dashboard/api-usage
 * API endpoint usage, response times, errors
 */
router.get('/api-usage', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    const now = new Date();

    let since;
    switch (period) {
      case '1h':
        since = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const [
      topEndpoints,
      errorEndpoints,
      avgResponseTime,
      totalCalls,
      errorCount,
      statusCodes,
    ] = await Promise.all([
      prisma.apiUsage.groupBy({
        by: ['endpoint'],
        where: { timestamp: { gte: since } },
        _count: { endpoint: true },
        _avg: { responseTime: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 20,
      }),
      prisma.apiUsage.groupBy({
        by: ['endpoint'],
        where: { timestamp: { gte: since }, statusCode: { gte: 400 } },
        _count: { endpoint: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 10,
      }),
      prisma.apiUsage.aggregate({
        where: { timestamp: { gte: since } },
        _avg: { responseTime: true },
      }),
      prisma.apiUsage.count({ where: { timestamp: { gte: since } } }),
      prisma.apiUsage.count({
        where: { timestamp: { gte: since }, statusCode: { gte: 400 } },
      }),
      prisma.apiUsage.groupBy({
        by: ['statusCode'],
        where: { timestamp: { gte: since } },
        _count: { statusCode: true },
        orderBy: { _count: { statusCode: 'desc' } },
        take: 20,
      }),
    ]);

    // Recent slow endpoints (>1s)
    const slowEndpoints = await prisma.apiUsage.findMany({
      where: {
        timestamp: { gte: since },
        responseTime: { gt: 1000 },
      },
      orderBy: { responseTime: 'desc' },
      take: 10,
      select: {
        endpoint: true,
        method: true,
        statusCode: true,
        responseTime: true,
        timestamp: true,
      },
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCalls,
          errorCount,
          errorRate:
            totalCalls > 0 ? ((errorCount / totalCalls) * 100).toFixed(2) : '0',
          avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
        },
        topEndpoints: topEndpoints.map((e) => ({
          endpoint: e.endpoint,
          calls: e._count.endpoint,
          avgResponseTime: Math.round(e._avg.responseTime || 0),
        })),
        errorEndpoints: errorEndpoints.map((e) => ({
          endpoint: e.endpoint,
          errors: e._count.endpoint,
        })),
        statusCodes: statusCodes.map((s) => ({
          code: s.statusCode,
          count: s._count.statusCode,
        })),
        slowEndpoints,
        period,
      },
    });
  } catch (error) {
    console.error('Admin API usage error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get API usage' });
  }
});

// ============================================
// CHAT ANALYTICS
// ============================================

/**
 * GET /api/admin/dashboard/chats
 * Chat analytics: volume, tokens, agents, etc
 * Queries ChatSession + ChatMessage (the tables with real data)
 */
router.get('/chats', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const now = new Date();

    let since;
    switch (period) {
      case '24h':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const [totalChats, chatsByAgent, tokenStats, recentSessions] =
      await Promise.all([
        // Total chat sessions in period
        prisma.chatSession.count({
          where: { createdAt: { gte: since } },
        }),
        // Chats grouped by agent
        prisma.chatSession.groupBy({
          by: ['agentId'],
          where: { createdAt: { gte: since } },
          _count: { agentId: true },
          orderBy: { _count: { agentId: 'desc' } },
          take: 10,
        }),
        // Total tokens from messages
        prisma.chatMessage.aggregate({
          where: { createdAt: { gte: since } },
          _sum: { tokenCount: true },
          _count: { id: true },
        }),
        // Recent sessions with message counts
        prisma.chatSession.findMany({
          where: { createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            sessionId: true,
            userId: true,
            agentId: true,
            name: true,
            stats: true,
            createdAt: true,
            isActive: true,
            _count: { select: { messages: true } },
          },
        }),
      ]);

    // Compute average turns per session and total tokens
    const totalTokens = tokenStats._sum.tokenCount || 0;
    const totalMessages = tokenStats._count.id || 0;
    const avgTurns = totalChats > 0 ? Math.round((totalMessages / totalChats) * 10) / 10 : 0;

    // Compute per-agent token totals from session stats
    const agentTokens = {};
    for (const group of chatsByAgent) {
      const aid = group.agentId || 'unknown';
      const sessions = await prisma.chatSession.findMany({
        where: { agentId: group.agentId, createdAt: { gte: since } },
        select: { stats: true },
      });
      agentTokens[aid] = sessions.reduce((sum, s) => {
        const st = typeof s.stats === 'object' && s.stats ? s.stats : {};
        return sum + (st.totalTokens || 0);
      }, 0);
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalChats,
          totalTokens,
          avgDuration: 0,
          avgTurns,
        },
        chatsByAgent: chatsByAgent.map((c) => ({
          agentId: c.agentId || 'unknown',
          chats: c._count.agentId,
          tokens: agentTokens[c.agentId || 'unknown'] || 0,
        })),
        recentChats: recentSessions.map((s) => ({
          conversationId: s.sessionId,
          userId: s.userId,
          agentId: s.agentId,
          channel: 'web',
          totalTokens: (typeof s.stats === 'object' && s.stats ? s.stats.totalTokens : 0) || 0,
          durationMs: (typeof s.stats === 'object' && s.stats ? s.stats.durationMs : 0) || 0,
          turnCount: s._count.messages,
          startedAt: s.createdAt,
          status: s.isActive ? 'active' : 'completed',
        })),
        period,
      },
    });
  } catch (error) {
    console.error('Admin chats error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get chat analytics' });
  }
});

// ============================================
// TOOL USAGE
// ============================================

/**
 * GET /api/admin/dashboard/tools
 * Tool usage analytics
 */
router.get('/tools', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const now = new Date();
    const since =
      period === '24h'
        ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
        : period === '30d'
          ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [toolsByName, totalUsage, avgLatency] = await Promise.all([
      prisma.toolUsage.groupBy({
        by: ['toolName'],
        where: { occurredAt: { gte: since } },
        _count: { toolName: true },
        _avg: { latencyMs: true, tokensInput: true, tokensOutput: true },
        orderBy: { _count: { toolName: 'desc' } },
        take: 15,
      }),
      prisma.toolUsage.count({ where: { occurredAt: { gte: since } } }),
      prisma.toolUsage.aggregate({
        where: { occurredAt: { gte: since } },
        _avg: { latencyMs: true },
        _sum: { tokensInput: true, tokensOutput: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalUsage,
          avgLatency: Math.round(avgLatency._avg.latencyMs || 0),
          totalTokensInput: avgLatency._sum.tokensInput || 0,
          totalTokensOutput: avgLatency._sum.tokensOutput || 0,
        },
        tools: toolsByName.map((t) => ({
          name: t.toolName,
          count: t._count.toolName,
          avgLatency: Math.round(t._avg.latencyMs || 0),
          avgTokensIn: Math.round(t._avg.tokensInput || 0),
          avgTokensOut: Math.round(t._avg.tokensOutput || 0),
        })),
        period,
      },
    });
  } catch (error) {
    console.error('Admin tools error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get tool stats' });
  }
});

// ============================================
// EVENTS FEED
// ============================================

/**
 * GET /api/admin/dashboard/events
 * User events feed (signups, logins, actions)
 */
router.get('/events', async (req, res) => {
  try {
    const { page = 1, limit = 50, eventType, category, userId } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (eventType) where.eventType = eventType;
    if (category) where.category = category;
    if (userId) where.userId = userId;

    const [events, total, eventTypes] = await Promise.all([
      prisma.userEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip,
        take,
      }),
      prisma.userEvent.count({ where }),
      prisma.userEvent.groupBy({
        by: ['eventType'],
        _count: { eventType: true },
        orderBy: { _count: { eventType: 'desc' } },
        take: 20,
      }),
    ]);

    res.json({
      success: true,
      data: {
        events,
        eventTypes: eventTypes.map((e) => ({
          type: e.eventType,
          count: e._count.eventType,
        })),
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    console.error('Admin events error:', error);
    res.status(500).json({ success: false, message: 'Failed to get events' });
  }
});

// ============================================
// TRANSACTIONS / REVENUE
// ============================================

/**
 * GET /api/admin/dashboard/revenue
 * Revenue & transaction analytics
 */
router.get('/revenue', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const now = new Date();
    const since =
      period === '7d'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : period === '90d'
          ? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      revenueTotal,
      revenueByType,
      recentTransactions,
      totalTransactions,
      completedTransactions,
      failedTransactions,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { createdAt: { gte: since }, status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { createdAt: { gte: since } },
        _count: { type: true },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.transaction.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.transaction.count({ where: { createdAt: { gte: since } } }),
      prisma.transaction.count({
        where: { createdAt: { gte: since }, status: 'completed' },
      }),
      prisma.transaction.count({
        where: { createdAt: { gte: since }, status: 'failed' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          revenue: revenueTotal._sum.amount || 0,
          totalTransactions,
          completedTransactions,
          failedTransactions,
        },
        revenueByType: revenueByType.map((r) => ({
          type: r.type,
          count: r._count.type,
          amount: r._sum.amount || 0,
        })),
        recentTransactions,
        period,
      },
    });
  } catch (error) {
    console.error('Admin revenue error:', error);
    res.status(500).json({ success: false, message: 'Failed to get revenue' });
  }
});

// ============================================
// SYSTEM HEALTH
// ============================================

/**
 * GET /api/admin/dashboard/health
 * System health metrics
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();

    // Check DB connectivity
    let dbStatus = 'healthy';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = 'error';
    }

    // Memory usage
    const memUsage = process.memoryUsage();

    // Uptime
    const uptime = process.uptime();

    res.json({
      success: true,
      data: {
        status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
        uptime: Math.floor(uptime),
        uptimeFormatted: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        database: {
          status: dbStatus,
          latency: dbLatency,
        },
        nodeVersion: process.version,
        platform: process.platform,
        responseTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Admin health error:', error);
    res.status(500).json({ success: false, message: 'Failed to get health' });
  }
});

// ============================================
// ACTIVITY LOG / AUDIT TRAIL
// ============================================

/**
 * GET /api/admin/dashboard/activity-log
 * Combined activity feed across all systems
 */
router.get('/activity-log', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const take = Math.min(parseInt(limit), 100);

    // Get latest activity from multiple sources
    const [recentPageViews, recentEvents, recentChats, recentApi] =
      await Promise.all([
        prisma.pageView.findMany({
          orderBy: { timestamp: 'desc' },
          take,
          select: {
            visitorId: true,
            userId: true,
            url: true,
            timestamp: true,
          },
        }),
        prisma.userEvent.findMany({
          orderBy: { occurredAt: 'desc' },
          take,
          select: {
            userId: true,
            eventType: true,
            category: true,
            action: true,
            label: true,
            source: true,
            occurredAt: true,
          },
        }),
        prisma.chatAnalyticsInteraction.findMany({
          orderBy: { startedAt: 'desc' },
          take: Math.min(take, 20),
          select: {
            userId: true,
            agentId: true,
            totalTokens: true,
            turnCount: true,
            startedAt: true,
          },
        }),
        prisma.apiUsage.findMany({
          orderBy: { timestamp: 'desc' },
          take,
          select: {
            endpoint: true,
            method: true,
            statusCode: true,
            responseTime: true,
            ipAddress: true,
            timestamp: true,
          },
        }),
      ]);

    // Merge into unified timeline
    const activities = [
      ...recentPageViews.map((pv) => ({
        type: 'pageview',
        userId: pv.userId,
        visitorId: pv.visitorId,
        detail: pv.url,
        timestamp: pv.timestamp,
      })),
      ...recentEvents.map((ev) => ({
        type: 'event',
        userId: ev.userId,
        detail: `${ev.eventType}: ${ev.action || ev.label || ''}`,
        source: ev.source,
        timestamp: ev.occurredAt,
      })),
      ...recentChats.map((ch) => ({
        type: 'chat',
        userId: ch.userId,
        detail: `Agent: ${ch.agentId || 'default'}, ${ch.turnCount} turns, ${ch.totalTokens} tokens`,
        timestamp: ch.startedAt,
      })),
      ...recentApi.map((api) => ({
        type: 'api',
        detail: `${api.method} ${api.endpoint} → ${api.statusCode} (${api.responseTime}ms)`,
        ip: api.ipAddress,
        timestamp: api.timestamp,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, take);

    res.json({
      success: true,
      data: { activities },
    });
  } catch (error) {
    console.error('Admin activity log error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get activity log' });
  }
});

export default router;
