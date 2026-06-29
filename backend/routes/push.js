/**
 * PUSH NOTIFICATION ROUTES
 * 
 * Endpoints:
 *   POST /api/push/subscribe     — Register a push subscription
 *   POST /api/push/unsubscribe   — Remove a push subscription
 *   POST /api/push/send          — Send push notification (admin only)
 *   GET  /api/push/status        — Check subscription status for current user
 */

import express from 'express';
import webpush from 'web-push';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../lib/auth-middleware.js';

const router = express.Router();

// ============================================
// VAPID CONFIGURATION
// ============================================

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@mumtaz.ai';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[Push] VAPID keys configured');
} else {
  console.warn('[Push] VAPID keys not configured — push notifications disabled');
}

// ============================================
// POST /subscribe — Register push subscription
// ============================================
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid push subscription: missing endpoint or keys',
      });
    }

    // Upsert — if endpoint already exists, update keys
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        userId: req.userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        userAgent: req.headers['user-agent'] || null,
      },
      update: {
        userId: req.userId,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        userAgent: req.headers['user-agent'] || null,
        updatedAt: new Date(),
      },
    });

    console.log(`[Push] Subscription registered for user ${req.userId}: ${sub.id}`);

    res.json({ success: true, message: 'Push subscription registered', id: sub.id });
  } catch (error) {
    console.error('[Push] Subscribe error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to register push subscription' });
  }
});

// ============================================
// POST /unsubscribe — Remove push subscription
// ============================================
router.post('/unsubscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Missing endpoint' });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: req.userId,
      },
    });

    console.log(`[Push] Subscription removed for user ${req.userId}`);

    res.json({ success: true, message: 'Push subscription removed' });
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to remove push subscription' });
  }
});

// ============================================
// GET /status — Check if current user is subscribed
// ============================================
router.get('/status', requireAuth, async (req, res) => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: req.userId },
      select: { id: true, endpoint: true, createdAt: true, userAgent: true },
    });

    res.json({
      success: true,
      isSubscribed: subscriptions.length > 0,
      subscriptionCount: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    console.error('[Push] Status error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch push status' });
  }
});

// ============================================
// POST /send — Send push notification (admin or system)
// ============================================
router.post('/send', requireAdmin, async (req, res) => {
  try {
    const { userId, title, body, url, tag, icon, actions } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Missing title or body' });
    }

    const payload = JSON.stringify({
      title: title || 'Mumtaz AI',
      body,
      icon: icon || '/icon-192x192.png',
      badge: '/favicon-48x48.png',
      tag: tag || 'system',
      url: url || '/',
      actions: actions || [],
    });

    // Get target subscriptions
    const where = userId ? { userId } : {};
    const subscriptions = await prisma.pushSubscription.findMany({ where });

    if (subscriptions.length === 0) {
      return res.json({ success: true, message: 'No subscriptions to send to', sent: 0 });
    }

    let sent = 0;
    let failed = 0;
    const staleEndpoints = [];

    // Send to all subscriptions
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload,
            { TTL: 86400 } // 24 hours
          );
          sent++;
        } catch (err) {
          failed++;
          // 404 or 410 = subscription expired, clean up
          if (err.statusCode === 404 || err.statusCode === 410) {
            staleEndpoints.push(sub.endpoint);
          }
          console.error(`[Push] Failed to send to ${sub.endpoint}:`, err.statusCode || err.message);
        }
      })
    );

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: staleEndpoints } },
      });
      console.log(`[Push] Cleaned up ${staleEndpoints.length} stale subscriptions`);
    }

    res.json({
      success: true,
      message: `Push sent to ${sent} devices`,
      sent,
      failed,
      cleaned: staleEndpoints.length,
    });
  } catch (error) {
    console.error('[Push] Send error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send push notification' });
  }
});

// ============================================
// POST /send-to-user — Send to specific user (internal use)
// ============================================
export async function sendPushToUser(userId, notification) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID not configured, skipping push');
    return { sent: 0, failed: 0 };
  }

  const payload = JSON.stringify({
    title: notification.title || 'Mumtaz AI',
    body: notification.body,
    icon: notification.icon || '/icon-192x192.png',
    badge: '/favicon-48x48.png',
    tag: notification.tag || 'system',
    url: notification.url || '/',
    actions: notification.actions || [],
  });

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
          { TTL: 86400 }
        );
        sent++;
      } catch (err) {
        failed++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );

  return { sent, failed };
}

export default router;
