/**
 * AGENT SUBSCRIPTIONS ROUTES - PRISMA VERSION
 * PostgreSQL-based subscription management for Mumtaz AI
 */

import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { sendPlanPurchaseEmail } from '../services/email.js';

const router = express.Router();

// Lazy initialization of Stripe
let stripe = null;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }
  return stripe;
};

// Helper function to calculate expiry date
const calculateExpiryDate = (plan, startDate) => {
  const date = new Date(startDate);
  switch (plan) {
  case 'daily':
    date.setDate(date.getDate() + 1);
    break;
  case 'weekly':
    date.setDate(date.getDate() + 7);
    break;
  case 'monthly':
    date.setMonth(date.getMonth() + 1);
    break;
  case 'yearly':
    date.setFullYear(date.getFullYear() + 1);
    break;
  default:
    throw new Error(`Invalid plan: ${plan}`);
  }
  return date;
};

// GenCraft Pro pricing (canvas-studio) — recurring, 4 tiers
const GENCRAFT_PRICES = {
  daily: 10,
  weekly: 15,
  monthly: 30,
  yearly: 300,
};

// Canvas Build pricing — recurring, 4 tiers
const CANVAS_BUILD_PRICES = {
  daily: 10,
  weekly: 20,
  monthly: 50,
  yearly: 500,
};

// ============================================
// 1. Create/Subscribe to Agent
// ============================================
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, agentId, plan, email, userEmail, successUrl, cancelUrl } = req.body;

    if (!userId || !agentId || !plan) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, agentId, plan',
      });
    }

    // Normalize legacy agentIds to canonical product IDs.
    // `canvas-studio` & `canvas` now route to the dedicated Canvas Build product
    // (previously aliased to gencraft-pro).
    let normalizedAgentId = agentId;
    if (agentId === 'canvas-studio' || agentId === 'canvas') {
      normalizedAgentId = 'canvas-build';
    }

    // Determine prices based on agent
    const isGencraft = normalizedAgentId === 'gencraft-pro';
    const isCanvasBuild = normalizedAgentId === 'canvas-build';
    const prices = isGencraft
      ? GENCRAFT_PRICES
      : isCanvasBuild
        ? CANVAS_BUILD_PRICES
        : { daily: 5, weekly: 7, monthly: 30, yearly: 300 };

    if (!prices[plan]) {
      return res.status(400).json({
        success: false,
        error: `Invalid plan. Choose: ${Object.keys(prices).join(', ')}`,
      });
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.agentSubscription.findFirst({
      where: {
        userId,
        agentId: normalizedAgentId,
        status: 'active',
        expiryDate: { gt: new Date() },
      },
    });

    if (existingSubscription) {
      return res.status(409).json({
        success: false,
        alreadySubscribed: true,
        error: 'You already have an active plan! Enjoy building.',
        subscription: existingSubscription,
      });
    }

    // If Stripe is configured and we have success/cancel URLs, create a Stripe Checkout Session
    if (process.env.STRIPE_SECRET_KEY && successUrl && cancelUrl) {
      try {
        const stripeInstance = getStripe();

        // Look up Stripe price ID from env vars
        const envPrefix = normalizedAgentId.toUpperCase().replace(/-/g, '_');
        const envPrefixHyphen = normalizedAgentId.toUpperCase();
        const priceId = process.env[`STRIPE_PRICE_${envPrefix}_${plan.toUpperCase()}`]
          || process.env[`STRIPE_PRICE_${envPrefixHyphen}_${plan.toUpperCase()}`]
          || process.env[`STRIPE_PRICE_${plan.toUpperCase()}`]
          || null;

        if (priceId) {
          // Recurring subscription mode for gencraft-pro & canvas-build; one-time for per-agent
          const checkoutMode = (isGencraft || isCanvasBuild) ? 'subscription' : 'payment';
          const sessionMetadata = {
            userId,
            agentId: normalizedAgentId,
            agentName: isGencraft ? 'GenCraft Pro' : isCanvasBuild ? 'Canvas Build' : normalizedAgentId,
            plan,
          };
          const sessionConfig = {
            mode: checkoutMode,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: email || userEmail,
            client_reference_id: userId,
            metadata: sessionMetadata,
            success_url: successUrl,
            cancel_url: cancelUrl,
            allow_promotion_codes: true,
          };
          if (checkoutMode === 'subscription') {
            sessionConfig.subscription_data = { metadata: sessionMetadata };
          }
          // Create Stripe Checkout Session with existing price ID
          const session = await stripeInstance.checkout.sessions.create(sessionConfig);

          return res.json({
            success: true,
            url: session.url,
            sessionId: session.id,
          });
        }

        // No price ID configured — reject instead of creating dynamic prices
        console.error('[Stripe] No priceId configured for:', { agentId: normalizedAgentId, plan });
        return res.status(500).json({
          success: false,
          error: 'Subscription pricing not configured for this agent/plan. Please contact support.',
        });
      } catch (stripeError) {
        console.error('Stripe checkout creation failed:', stripeError.message);
        // Fall through to direct subscription creation
      }
    }

    // Fallback: Create subscription directly without Stripe (e.g. dev/testing)
    const startDate = new Date();
    const expiryDate = calculateExpiryDate(plan, startDate);

    const subscription = await prisma.agentSubscription.create({
      data: {
        userId,
        agentId: normalizedAgentId,
        plan,
        price: prices[plan],
        startDate,
        expiryDate,
        status: 'active',
      },
    });

    // Send plan purchase confirmation email (non-blocking)
    const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (userRecord?.email) {
      sendPlanPurchaseEmail(userRecord.email, userRecord.name, {
        planName: plan.charAt(0).toUpperCase() + plan.slice(1),
        agentName: isGencraft ? 'GenCraft Pro' : isCanvasBuild ? 'Canvas Build' : normalizedAgentId,
        price: prices[plan],
        currency: 'USD',
        expiryDate,
        transactionId: subscription.id,
      }).catch(err => console.error('[EMAIL] Plan purchase email failed:', err.message));
    }

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to create subscription' });
  }
});

// ============================================
// 2. Get User's Subscriptions
// ============================================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, agentId } = req.query;

    const where = { userId };
    if (status) where.status = status;
    if (agentId) where.agentId = agentId;

    const subscriptions = await prisma.agentSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          select: {
            name: true,
            avatarUrl: true,
            specialty: true,
          },
        },
      },
    });

    res.json({
      success: true,
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch subscriptions',
      subscriptions: [],
    });
  }
});

// ============================================
// 3. Check if User Has Active Subscription for Agent
// ============================================
router.get('/check/:userId/:agentId', async (req, res) => {
  try {
    const { userId, agentId } = req.params;

    // Normalize legacy aliases (canvas-studio / canvas) → canvas-build
    let normalizedId = agentId;
    if (agentId === 'canvas-studio' || agentId === 'canvas') {
      normalizedId = 'canvas-build';
    }

    const subscription = await prisma.agentSubscription.findFirst({
      where: {
        userId,
        agentId: normalizedId,
        status: 'active',
        expiryDate: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate days remaining if subscription exists
    let daysRemaining = 0;
    if (subscription && subscription.expiryDate) {
      daysRemaining = Math.ceil(
        (new Date(subscription.expiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
    }

    res.json({
      hasActiveSubscription: !!subscription,
      hasAccess: !!subscription,
      subscription: subscription
        ? {
          ...subscription,
          daysRemaining,
        }
        : null,
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ 
      error: 'Failed to check subscription',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// 4. Get All Active Subscriptions
// ============================================
router.get('/active', async (req, res) => {
  try {
    const subscriptions = await prisma.agentSubscription.findMany({
      where: {
        status: 'active',
        expiryDate: { gt: new Date() },
      },
      orderBy: { expiryDate: 'asc' },
    });

    res.json({
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    console.error('Error fetching active subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch active subscriptions' });
  }
});

// ============================================
// 5. Update Subscription (Cancel/Renew)
// ============================================
router.put('/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { status, autoRenew, plan } = req.body;

    const subscription = await prisma.agentSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updateData = {};

    // Update status if provided
    if (status) {
      updateData.status = status;
    }

    // Update auto-renew if provided
    if (typeof autoRenew === 'boolean') {
      updateData.autoRenew = autoRenew;
    }

    // Change plan if provided
    if (plan && plan !== subscription.plan) {
      const isGencraft = subscription.agentId === 'gencraft-pro';
      const prices = isGencraft
        ? GENCRAFT_PRICES
        : { daily: 5, weekly: 7, monthly: 30, yearly: 300 };
      updateData.plan = plan;
      updateData.price = prices[plan] || 15;
      updateData.expiryDate = calculateExpiryDate(plan, subscription.startDate);
    }

    const updated = await prisma.agentSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
    });

    res.json({
      message: 'Subscription updated successfully',
      subscription: updated,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// ============================================
// 6. Renew Subscription
// ============================================
router.post('/:subscriptionId/renew', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await prisma.agentSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Calculate new expiry date from current expiry
    const newExpiryDate = calculateExpiryDate(subscription.plan, subscription.expiryDate);

    const updated = await prisma.agentSubscription.update({
      where: { id: subscriptionId },
      data: {
        expiryDate: newExpiryDate,
        status: 'active',
      },
    });

    res.json({
      message: 'Subscription renewed successfully',
      subscription: updated,
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ error: 'Failed to renew subscription' });
  }
});

// ============================================
// 7. Cancel Subscription
// ============================================
router.delete('/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await prisma.agentSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updated = await prisma.agentSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        autoRenew: false,
      },
    });

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: updated,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// ============================================
// 8. Get Expiring Subscriptions (for auto-renewal job)
// ============================================
router.get('/expiring/soon', async (req, res) => {
  try {
    const { days = 1 } = req.query;
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + parseInt(days));

    const subscriptions = await prisma.agentSubscription.findMany({
      where: {
        status: 'active',
        autoRenew: true,
        expiryDate: {
          gte: new Date(),
          lte: expiryThreshold,
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    res.json({
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    console.error('Error fetching expiring subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch expiring subscriptions' });
  }
});

// ============================================
// 9. Get Subscription Stats (Admin)
// ============================================
router.get('/stats/overview', async (req, res) => {
  try {
    // Status breakdown
    const statusBreakdown = await prisma.agentSubscription.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { price: true },
    });

    // Plan breakdown for active subscriptions
    const planBreakdown = await prisma.agentSubscription.groupBy({
      by: ['plan'],
      where: { status: 'active' },
      _count: { plan: true },
    });

    // Agent popularity
    const agentPopularity = await prisma.agentSubscription.groupBy({
      by: ['agentId'],
      where: { status: 'active' },
      _count: { agentId: true },
      orderBy: {
        _count: { agentId: 'desc' },
      },
    });

    res.json({
      statusBreakdown: statusBreakdown.map(s => ({
        _id: s.status,
        count: s._count.status,
        totalRevenue: s._sum.price || 0,
      })),
      planBreakdown: planBreakdown.map(p => ({
        _id: p.plan,
        count: p._count.plan,
      })),
      agentPopularity: agentPopularity.map(a => ({
        _id: a.agentId,
        subscribers: a._count.agentId,
      })),
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({ error: 'Failed to fetch subscription stats' });
  }
});

// ============================================
// 10. Cancel Subscription by userId/agentId
// ============================================
router.post('/cancel', async (req, res) => {
  try {
    const { userId, agentId } = req.body;

    if (!userId || !agentId) {
      return res.status(400).json({
        error: 'Missing required fields: userId, agentId',
      });
    }

    // Find active subscription
    const subscription = await prisma.agentSubscription.findFirst({
      where: {
        userId,
        agentId,
        status: 'active',
      },
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'No active subscription found for this agent',
      });
    }

    // Mark as cancelled
    const updated = await prisma.agentSubscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled' },
    });

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: {
        id: updated.id,
        agentId: updated.agentId,
        plan: updated.plan,
        status: 'cancelled',
        wasExpiringOn: updated.expiryDate,
        cancelledAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// ============================================
// 11. Verify Stripe Session
// ============================================
router.post('/verify-session', async (req, res) => {
  try {
    const { sessionId, userId: bodyUserId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    console.log('🔍 Verifying Stripe session:', sessionId);

    // Retrieve the session from Stripe
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      console.error('❌ Session not found:', sessionId);
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      console.error('❌ Payment not completed:', session.payment_status);
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
      });
    }

    // Extract metadata from session (works for both payment and subscription mode)
    const agentId = session.metadata?.agentId;
    const agentName = session.metadata?.agentName;
    const plan = session.metadata?.plan;
    const userId = session.metadata?.userId || bodyUserId || session.client_reference_id;

    if (!agentId || !plan) {
      console.error('❌ Missing metadata:', { agentId, agentName, plan });
      return res.status(400).json({
        success: false,
        error: 'Payment information missing',
      });
    }

    if (!userId) {
      console.error('❌ Missing userId in session metadata');
      return res.status(400).json({
        success: false,
        error: 'User information missing',
      });
    }

    // Get customer email
    const customer = session.customer;
    const customerEmail = customer?.email || session.customer_email;

    // ✅ CRITICAL: Verify user exists before creating subscription
    let resolvedUserId = userId;
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      console.warn('⚠️ User not found by ID:', userId, '— trying email lookup:', customerEmail);
      // Fallback: look up user by email from Stripe session
      if (customerEmail) {
        const userByEmail = await prisma.user.findUnique({ where: { email: customerEmail } });
        if (userByEmail) {
          console.log('✅ Found user by email:', customerEmail, '→ id:', userByEmail.id);
          resolvedUserId = userByEmail.id;
        } else {
          console.error('❌ User not found by email either:', customerEmail);
          return res.status(400).json({
            success: false,
            error: 'User account not found. Please log in and try again.',
          });
        }
      } else {
        console.error('❌ User not found and no email available for fallback');
        return res.status(400).json({
          success: false,
          error: 'User account not found. Please log in and try again.',
        });
      }
    }

    // Determine dates — handle both subscription mode and one-time payment mode
    const subscriptionData = session.subscription;
    let startDate, expiryDate, stripeSubId;

    if (subscriptionData && typeof subscriptionData === 'object') {
      // Subscription mode — use subscription period dates
      startDate = new Date(subscriptionData.current_period_start * 1000);
      expiryDate = new Date(subscriptionData.current_period_end * 1000);
      stripeSubId = subscriptionData.id;
    } else {
      // One-time payment mode — calculate expiry from plan type
      startDate = new Date();
      expiryDate = calculateExpiryDate(plan, startDate);
      stripeSubId = session.id; // Use session ID as reference
    }

    const price = session.amount_total ? session.amount_total / 100 : 0;

    console.log('✅ Payment verified:', {
      sessionId,
      customerEmail,
      agentId,
      plan,
      price,
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
    });

    // Check if subscription already exists for this session/stripe reference
    const existingByStripeId = await prisma.agentSubscription.findFirst({
      where: { stripeSubscriptionId: stripeSubId },
    });

    if (existingByStripeId) {
      // Update existing subscription
      const updated = await prisma.agentSubscription.update({
        where: { id: existingByStripeId.id },
        data: {
          status: 'active',
          startDate,
          expiryDate,
          ...(existingByStripeId.userId ? {} : { userId: resolvedUserId }),
        },
      });

      const daysRemaining = Math.ceil(
        (updated.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      return res.json({
        success: true,
        hasAccess: true,
        subscription: {
          id: updated.id,
          agentId: updated.agentId,
          plan: updated.plan,
          status: 'active',
          expiryDate: updated.expiryDate,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          price: updated.price,
        },
      });
    }

    // Check if user already has subscription for this agent
    const existingSubscription = await prisma.agentSubscription.findFirst({
      where: { userId: resolvedUserId, agentId },
    });

    let subscriptionRecord;
    if (existingSubscription) {
      // Update existing record
      subscriptionRecord = await prisma.agentSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: 'active',
          plan,
          price,
          startDate,
          expiryDate,
          stripeSubscriptionId: stripeSubId,
        },
      });
    } else {
      // Create new subscription record
      subscriptionRecord = await prisma.agentSubscription.create({
        data: {
          userId: resolvedUserId,
          agentId,
          plan,
          price,
          status: 'active',
          startDate,
          expiryDate,
          stripeSubscriptionId: stripeSubId,
        },
      });
    }

    res.json({
      success: true,
      hasAccess: true,
      subscription: {
        id: subscriptionRecord.id,
        agentId: subscriptionRecord.agentId,
        plan: subscriptionRecord.plan,
        status: subscriptionRecord.status,
        expiryDate: subscriptionRecord.expiryDate,
        daysRemaining: Math.ceil(
          (subscriptionRecord.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
        price: subscriptionRecord.price,
      },
      session: {
        id: session.id,
        customerEmail,
        paymentStatus: session.payment_status,
      },
    });
  } catch (error) {
    console.error('❌ Session verification error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    });
  }
});

// ============================================
// INVOICE — Get details (JSON) + Download (HTML/PDF)
// Source-of-truth: AgentSubscription record (DB).
// If stripeSubscriptionId is present, also tries Stripe hosted invoice URL.
// ============================================
async function loadInvoiceData(invoiceId) {
  const sub = await prisma.agentSubscription.findUnique({
    where: { id: invoiceId },
    include: {
      user: { select: { email: true, fullName: true } },
      agent: { select: { name: true, agentId: true } },
    },
  });
  if (!sub) return null;

  // Try to enrich with Stripe hosted invoice URL when available
  let stripeInvoiceUrl = null;
  let stripePdfUrl = null;
  if (sub.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const s = getStripe();
      const list = await s.invoices.list({
        subscription: sub.stripeSubscriptionId,
        limit: 1,
      });
      const inv = list.data?.[0];
      if (inv) {
        stripeInvoiceUrl = inv.hosted_invoice_url || null;
        stripePdfUrl = inv.invoice_pdf || null;
      }
    } catch (e) {
      console.warn('[invoices] Stripe lookup failed:', e.message);
    }
  }

  return {
    id: sub.id,
    userId: sub.userId,
    customerName: sub.user?.fullName || 'Customer',
    customerEmail: sub.user?.email || '',
    agentId: sub.agentId,
    agentName: sub.agent?.name || sub.agentId,
    plan: sub.plan,
    price: sub.price,
    currency: 'USD',
    status: sub.status,
    startDate: sub.startDate,
    expiryDate: sub.expiryDate,
    createdAt: sub.createdAt,
    autoRenew: sub.autoRenew,
    stripeSubscriptionId: sub.stripeSubscriptionId,
    stripeInvoiceUrl,
    stripePdfUrl,
  };
}

// JSON details (used by InvoiceHistory "View Details" modal)
router.get('/invoice/:invoiceId', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const data = await loadInvoiceData(req.params.invoiceId);
    if (!data) return res.status(404).json({ success: false, error: 'Invoice not found' });
    if (userId && data.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    res.json({ success: true, invoice: data });
  } catch (error) {
    console.error('[invoices] details error:', error);
    res.status(500).json({ success: false, error: 'Failed to load invoice' });
  }
});

// HTML/PDF download (browser auto-prompts to save / print to PDF)
router.get('/invoice/:invoiceId/download', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const data = await loadInvoiceData(req.params.invoiceId);
    if (!data) return res.status(404).send('Invoice not found');
    if (userId && data.userId !== userId) return res.status(403).send('Forbidden');

    // Prefer Stripe-hosted PDF if available
    if (data.stripePdfUrl) {
      return res.redirect(data.stripePdfUrl);
    }

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD' }).format(n);
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>Invoice ${data.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#111;background:#fff;padding:48px;max-width:800px;margin:0 auto}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:24px;margin-bottom:32px}
  .brand{font-size:28px;font-weight:800;letter-spacing:-0.02em}
  .meta{text-align:right;font-size:13px;color:#555;line-height:1.6}
  .badge{display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em}
  .badge.paid{background:#dcfce7;color:#166534}
  .badge.expired{background:#e5e7eb;color:#374151}
  .badge.cancelled{background:#fee2e2;color:#991b1b}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px}
  .label{font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:6px}
  .value{font-size:14px;color:#111;line-height:1.5}
  table{width:100%;border-collapse:collapse;margin:24px 0}
  th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:13px}
  th{font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#888;font-weight:600}
  .total{display:flex;justify-content:flex-end;margin-top:24px}
  .total table{width:auto;min-width:280px}
  .total td{padding:6px 8px;border:none}
  .total .grand{font-size:18px;font-weight:800;border-top:2px solid #111;padding-top:12px}
  .footer{margin-top:48px;padding-top:24px;border-top:1px solid #e5e7eb;font-size:11px;color:#888;text-align:center}
  @media print { body { padding: 24px } }
</style></head>
<body>
  <div class="head">
    <div>
      <div class="brand">Mumtaz AI</div>
      <div style="font-size:12px;color:#555;margin-top:4px">Canvas Studio</div>
    </div>
    <div class="meta">
      <div><strong>Invoice</strong> #${data.id.slice(-12).toUpperCase()}</div>
      <div>Issued ${fmtDate(data.createdAt)}</div>
      <div style="margin-top:8px"><span class="badge ${data.status}">${data.status === 'active' ? 'paid' : data.status}</span></div>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="label">Billed To</div>
      <div class="value"><strong>${data.customerName}</strong><br/>${data.customerEmail}</div>
    </div>
    <div>
      <div class="label">Subscription Period</div>
      <div class="value">${fmtDate(data.startDate)} → ${fmtDate(data.expiryDate)}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Plan</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>${data.agentName}</strong><br/><span style="color:#888;font-size:12px">Subscription · ${data.plan}</span></td>
        <td style="text-align:right;text-transform:capitalize">${data.plan}</td>
        <td style="text-align:right">${fmt(data.price)}</td>
      </tr>
    </tbody>
  </table>

  <div class="total">
    <table>
      <tr><td>Subtotal</td><td style="text-align:right">${fmt(data.price)}</td></tr>
      <tr><td>Tax</td><td style="text-align:right">${fmt(0)}</td></tr>
      <tr class="grand"><td>Total</td><td style="text-align:right">${fmt(data.price)}</td></tr>
    </table>
  </div>

  <div class="footer">
    Thank you for your business. For questions about this invoice, contact support@mumtaz.ai
    ${data.stripeSubscriptionId ? `<br/>Reference: ${data.stripeSubscriptionId}` : ''}
  </div>
  <script>window.onload=()=>setTimeout(()=>window.print(),250);</script>
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${data.id}.html"`);
    res.send(html);
  } catch (error) {
    console.error('[invoices] download error:', error);
    res.status(500).send('Failed to generate invoice');
  }
});

export default router;
