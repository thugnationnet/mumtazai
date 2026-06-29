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

// GenCraft Pro pricing (canvas-app)
const GENCRAFT_PRICES = {
  weekly: 7,
  monthly: 19,
  yearly: 120,
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

    // Normalize canvas-studio → gencraft-pro (same product, canonical ID)
    const normalizedAgentId = (agentId === 'canvas-studio') ? 'gencraft-pro' : agentId;

    // Determine prices based on agent
    const isGencraft = normalizedAgentId === 'gencraft-pro';
    const prices = isGencraft
      ? GENCRAFT_PRICES
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
        const priceId = process.env[`STRIPE_PRICE_${envPrefix}_${plan.toUpperCase()}`]
          || process.env[`STRIPE_PRICE_${plan.toUpperCase()}`]
          || null;

        if (priceId) {
          // Create Stripe Checkout Session in SUBSCRIPTION mode (auto-renew)
          const session = await stripeInstance.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: email || userEmail,
            client_reference_id: userId,
            metadata: { userId, agentId: normalizedAgentId, agentName: isGencraft ? 'GenCraft Pro' : normalizedAgentId, plan },
            subscription_data: {
              metadata: { userId, agentId: normalizedAgentId, agentName: isGencraft ? 'GenCraft Pro' : normalizedAgentId, plan },
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
            allow_promotion_codes: true,
          });

          return res.json({
            success: true,
            url: session.url,
            sessionId: session.id,
          });
        }

        // No price ID configured — create a dynamic recurring price in Stripe
        const intervalMap = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
        const session = await stripeInstance.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              recurring: { interval: intervalMap[plan] },
              product_data: {
                name: `${isGencraft ? 'GenCraft Pro' : normalizedAgentId} — ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              },
              unit_amount: prices[plan] * 100, // cents
            },
            quantity: 1,
          }],
          customer_email: email || userEmail,
          client_reference_id: userId,
          metadata: { userId, agentId: normalizedAgentId, agentName: isGencraft ? 'GenCraft Pro' : normalizedAgentId, plan },
          subscription_data: {
            metadata: { userId, agentId: normalizedAgentId, agentName: isGencraft ? 'GenCraft Pro' : normalizedAgentId, plan },
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
          allow_promotion_codes: true,
        });

        return res.json({
          success: true,
          url: session.url,
          sessionId: session.id,
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
        agentName: isGencraft ? 'GenCraft Pro' : normalizedAgentId,
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

    // Normalize canvas-studio → gencraft-pro (canonical ID)
    const normalizedId = (agentId === 'canvas-studio') ? 'gencraft-pro' : agentId;

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

// POST /check — accepts {userId, agentId} in body (frontend proxy compat)
router.post('/check', async (req, res) => {
  try {
    const { userId, agentId } = req.body;

    if (!userId || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'userId and agentId are required',
      });
    }

    const subscription = await prisma.agentSubscription.findFirst({
      where: {
        userId,
        agentId,
        status: 'active',
        expiryDate: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

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
        ? { ...subscription, daysRemaining }
        : null,
    });
  } catch (error) {
    console.error('Error checking subscription (POST):', error);
    res.status(500).json({
      error: 'Failed to check subscription',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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

    // Cancel the underlying Stripe subscription so it stops auto-billing.
    if (subscription.stripeSubscriptionId && subscription.stripeSubscriptionId.startsWith('sub_') && process.env.STRIPE_SECRET_KEY) {
      try {
        await getStripe().subscriptions.cancel(subscription.stripeSubscriptionId, { invoice_now: false, prorate: false });
      } catch (e) {
        if (e?.code !== 'resource_missing') {
          console.error('[cancel] Stripe cancel failed:', e.message);
        }
      }
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

    // Cancel the underlying Stripe subscription so it stops auto-billing.
    if (subscription.stripeSubscriptionId && subscription.stripeSubscriptionId.startsWith('sub_') && process.env.STRIPE_SECRET_KEY) {
      try {
        await getStripe().subscriptions.cancel(subscription.stripeSubscriptionId, { invoice_now: false, prorate: false });
      } catch (e) {
        if (e?.code !== 'resource_missing') {
          console.error('[cancel] Stripe cancel failed:', e.message);
        }
      }
    }

    // Mark as cancelled
    const updated = await prisma.agentSubscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled', autoRenew: false },
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

    // Ensure the agent record exists (FK: agentSubscription.agentId → Agent.agentId)
    // Special/external products like 'canvas', 'gencraft-pro' may not have a DB record yet
    await prisma.agent.upsert({
      where: { agentId },
      update: {}, // no-op if already exists
      create: {
        agentId,
        name: agentName || agentId,
        systemPrompt: '',
        welcomeMessage: `Welcome to ${agentName || agentId}`,
      },
    });

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

export default router;
