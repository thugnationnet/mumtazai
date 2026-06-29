import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth-middleware.js';

const router = express.Router();

// All admin analytics routes require admin authentication
router.use(requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeUsers, totalPageViews, totalEvents, signupEvents, loginEvents] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: last7Days } } }),
      prisma.pageView.count(),
      prisma.userEvent.count(),
      prisma.userEvent.count({ where: { eventType: 'signup' } }),
      prisma.userEvent.count({ where: { eventType: 'login' } }),
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        pageViews: { total: totalPageViews },
        events: { total: totalEvents, signups: signupEvents, logins: loginEvents },
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: { users } });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

export default router;
