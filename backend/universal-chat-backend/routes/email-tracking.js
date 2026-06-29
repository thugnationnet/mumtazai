/**
 * EMAIL TRACKING ROUTES
 * 1. Tracking pixel endpoint (public) — records email opens
 * 2. Admin API endpoints — query email tracking data
 *
 * Mounted at /api/email-tracking (pixel) and /api/admin/email-tracking (admin)
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth-middleware.js';

// ============================================
// PUBLIC: Tracking Pixel
// ============================================

const pixelRouter = express.Router();

// 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * GET /api/email-tracking/pixel/:trackingId
 * Returns a 1x1 transparent GIF and records the open event
 */
pixelRouter.get('/pixel/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    // Always return the image immediately (non-blocking DB update)
    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_GIF.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
    res.end(TRANSPARENT_GIF);

    // Record the open asynchronously
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      null;

    await prisma.emailTracking.update({
      where: { trackingId },
      data: {
        opened: true,
        openedAt: new Date(),
        openCount: { increment: 1 },
        userAgent,
        ipAddress,
      },
    }).catch(() => {
      // Silently ignore — invalid trackingId or DB error
    });
  } catch {
    // Still return the pixel even if something fails
    if (!res.headersSent) {
      res.set('Content-Type', 'image/gif');
      res.end(TRANSPARENT_GIF);
    }
  }
});

// ============================================
// ADMIN: Email Tracking Dashboard API
// ============================================

const adminRouter = express.Router();
adminRouter.use(requireAdmin);

/**
 * GET /api/admin/email-tracking/overview
 * Aggregate stats for the email tracking dashboard
 */
adminRouter.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalSent,
      totalDelivered,
      totalFailed,
      totalOpened,
      sentToday,
      deliveredToday,
      failedToday,
      openedToday,
      sent7d,
      delivered7d,
      failed7d,
      opened7d,
      sent30d,
      delivered30d,
      failed30d,
      opened30d,
      byType,
    ] = await Promise.all([
      prisma.emailTracking.count(),
      prisma.emailTracking.count({ where: { delivered: true } }),
      prisma.emailTracking.count({ where: { failed: true } }),
      prisma.emailTracking.count({ where: { opened: true } }),
      prisma.emailTracking.count({ where: { sentAt: { gte: today } } }),
      prisma.emailTracking.count({ where: { delivered: true, sentAt: { gte: today } } }),
      prisma.emailTracking.count({ where: { failed: true, sentAt: { gte: today } } }),
      prisma.emailTracking.count({ where: { opened: true, sentAt: { gte: today } } }),
      prisma.emailTracking.count({ where: { sentAt: { gte: last7d } } }),
      prisma.emailTracking.count({ where: { delivered: true, sentAt: { gte: last7d } } }),
      prisma.emailTracking.count({ where: { failed: true, sentAt: { gte: last7d } } }),
      prisma.emailTracking.count({ where: { opened: true, sentAt: { gte: last7d } } }),
      prisma.emailTracking.count({ where: { sentAt: { gte: last30d } } }),
      prisma.emailTracking.count({ where: { delivered: true, sentAt: { gte: last30d } } }),
      prisma.emailTracking.count({ where: { failed: true, sentAt: { gte: last30d } } }),
      prisma.emailTracking.count({ where: { opened: true, sentAt: { gte: last30d } } }),
      prisma.emailTracking.groupBy({
        by: ['emailType'],
        _count: { id: true },
        _sum: { openCount: true },
        where: { sentAt: { gte: last30d } },
      }),
    ]);

    // Calculate open/delivery rates by type
    const typeStats = await Promise.all(
      byType.map(async (t) => {
        const [openedCount, deliveredCount, failedCount] = await Promise.all([
          prisma.emailTracking.count({ where: { emailType: t.emailType, opened: true, sentAt: { gte: last30d } } }),
          prisma.emailTracking.count({ where: { emailType: t.emailType, delivered: true, sentAt: { gte: last30d } } }),
          prisma.emailTracking.count({ where: { emailType: t.emailType, failed: true, sentAt: { gte: last30d } } }),
        ]);
        return {
          emailType: t.emailType,
          sent: t._count.id,
          delivered: deliveredCount,
          failed: failedCount,
          opened: openedCount,
          totalOpens: t._sum.openCount || 0,
          openRate: t._count.id > 0 ? ((openedCount / t._count.id) * 100).toFixed(1) : '0.0',
          deliveryRate: t._count.id > 0 ? ((deliveredCount / t._count.id) * 100).toFixed(1) : '0.0',
        };
      })
    );

    const mkStats = (sent, delivered, failed, opened) => ({
      sent, delivered, failed, opened,
      openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0.0',
      deliveryRate: sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0.0',
    });

    res.json({
      success: true,
      overview: {
        total: mkStats(totalSent, totalDelivered, totalFailed, totalOpened),
        today: mkStats(sentToday, deliveredToday, failedToday, openedToday),
        last7d: mkStats(sent7d, delivered7d, failed7d, opened7d),
        last30d: mkStats(sent30d, delivered30d, failed30d, opened30d),
        byType: typeStats,
      },
    });
  } catch (error) {
    console.error('[Email Tracking] Overview error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch overview' });
  }
});

/**
 * GET /api/admin/email-tracking/emails
 * Paginated list of tracked emails with filters
 */
adminRouter.get('/emails', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const { type, status, search, sort } = req.query;

    const where = {};
    if (type) where.emailType = type;
    if (status === 'opened') where.opened = true;
    if (status === 'unopened') where.opened = false;
    if (status === 'delivered') where.delivered = true;
    if (status === 'failed') where.failed = true;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sort === 'opened' ? { openedAt: 'desc' } : { sentAt: 'desc' };

    const [emails, total] = await Promise.all([
      prisma.emailTracking.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          email: true,
          emailType: true,
          subject: true,
          sentAt: true,
          delivered: true,
          deliveredAt: true,
          failed: true,
          failedAt: true,
          failedReason: true,
          opened: true,
          openedAt: true,
          openCount: true,
          userAgent: true,
          ipAddress: true,
          metadata: true,
        },
      }),
      prisma.emailTracking.count({ where }),
    ]);

    res.json({
      success: true,
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Email Tracking] List error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch emails' });
  }
});

/**
 * GET /api/admin/email-tracking/chart
 * Daily send/open counts for chart
 */
adminRouter.get('/chart', async (req, res) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const sent = await prisma.$queryRaw`
      SELECT DATE("sentAt") as date, COUNT(*)::int as count
      FROM email_tracking
      WHERE "sentAt" >= ${since}
      GROUP BY DATE("sentAt")
      ORDER BY date ASC
    `;

    const opened = await prisma.$queryRaw`
      SELECT DATE("openedAt") as date, COUNT(*)::int as count
      FROM email_tracking
      WHERE "openedAt" IS NOT NULL AND "openedAt" >= ${since}
      GROUP BY DATE("openedAt")
      ORDER BY date ASC
    `;

    res.json({ success: true, chart: { sent, opened } });
  } catch (error) {
    console.error('[Email Tracking] Chart error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch chart data' });
  }
});

export { pixelRouter as emailTrackingPixelRouter, adminRouter as emailTrackingAdminRouter };
