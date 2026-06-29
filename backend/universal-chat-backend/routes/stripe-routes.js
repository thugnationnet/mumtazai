/**
 * STRIPE ROUTES — Checkout & Webhook for Universal Chat Backend
 * Replaces the frontend Next.js API routes for Stripe operations.
 * Mounted at /api/stripe/* via api-router.js
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

// ============================================
// AGENT PRODUCTS MAP — reads from env vars
// ============================================

const AGENT_IDS = [
  'julie-girlfriend', 'emma-emotional', 'einstein', 'tech-wizard',
  'mrs-boss', 'comedy-king', 'chess-player', 'fitness-guru',
  'travel-buddy', 'drama-queen', 'chef-biew', 'professor-astrology',
  'nid-gaming', 'ben-sega', 'bishop-burger', 'knight-logic',
  'lazy-pawn', 'rook-jokey',
];

const PLANS = ['daily', 'weekly', 'monthly', 'yearly'];

function getAgentProducts() {
  const products = {};

  for (const agentId of AGENT_IDS) {
    const envKey = agentId.toUpperCase();
    products[agentId] = {};
    for (const plan of PLANS) {
      const planKey = plan.toUpperCase();
      products[agentId][plan] = {
        productId: process.env[`STRIPE_PRODUCT_${envKey}_${planKey}`] || null,
        priceId: process.env[`STRIPE_PRICE_${envKey}_${planKey}`] || null,
      };
    }
  }

  // GenCraft Pro — uses different env key pattern (now 4 plans incl. daily)
  products['gencraft-pro'] = {};
  for (const plan of ['daily', 'weekly', 'monthly', 'yearly']) {
    const planKey = plan.toUpperCase();
    products['gencraft-pro'][plan] = {
      productId: process.env['STRIPE_PRODUCT_GENCRAFT_PRO'] || process.env[`STRIPE_PRODUCT_GENCRAFT-PRO_${planKey}`] || null,
      priceId: process.env[`STRIPE_PRICE_GENCRAFT_PRO_${planKey}`] || process.env[`STRIPE_PRICE_GENCRAFT-PRO_${planKey}`] || null,
    };
  }

  // Canvas Build (now 4 plans incl. daily — recurring)
  products['canvas-build'] = {};
  for (const plan of ['daily', 'weekly', 'monthly', 'yearly']) {
    const planKey = plan.toUpperCase();
    products['canvas-build'][plan] = {
      productId: process.env['STRIPE_PRODUCT_CANVAS_BUILD'] || process.env['STRIPE_PRODUCT_CANVAS-BUILD'] || process.env[`STRIPE_PRODUCT_CANVAS-BUILD_${planKey}`] || null,
      priceId: process.env[`STRIPE_PRICE_CANVAS_BUILD_${planKey}`] || process.env[`STRIPE_PRICE_CANVAS-BUILD_${planKey}`] || null,
    };
  }

  return products;
}

// Pricing
const STANDARD_PRICES = { daily: 5, weekly: 7, monthly: 30, yearly: 300 };
const GENCRAFT_PRICES = { daily: 10, weekly: 15, monthly: 30, yearly: 300 };
const CANVAS_BUILD_PRICES = { daily: 10, weekly: 20, monthly: 50, yearly: 500 };

function getAgentSubscriptionPlan(agentId, plan) {
  const agentProducts = getAgentProducts();
  const agentData = agentProducts[agentId];

  if (!agentData || !agentData[plan]) {
    // Return empty priceId — caller will use inline price_data fallback
    return {
      name: `${agentId} ${plan.charAt(0).toUpperCase() + plan.slice(1)} Access`,
      price: STANDARD_PRICES[plan] || 15,
      interval: plan === 'daily' ? 'day' : plan === 'weekly' ? 'week' : plan === 'yearly' ? 'year' : 'month',
      productId: null,
      priceId: null,
    };
  }

  const planData = agentData[plan];
  const isGencraft = agentId === 'gencraft-pro';
  const isCanvasBuild = agentId === 'canvas-build';
  const prices = isGencraft ? GENCRAFT_PRICES : isCanvasBuild ? CANVAS_BUILD_PRICES : STANDARD_PRICES;

  return {
    name: `${agentId} ${plan.charAt(0).toUpperCase() + plan.slice(1)} Access`,
    price: prices[plan] || 15,
    interval: plan === 'daily' ? 'day' : plan === 'weekly' ? 'week' : plan === 'yearly' ? 'year' : 'month',
    productId: planData.productId,
    priceId: planData.priceId,
  };
}

// Helper: calculate expiry date
function calculateExpiryDate(plan, startDate) {
  const date = new Date(startDate);
  switch (plan) {
  case 'daily':   date.setDate(date.getDate() + 1); break;
  case 'weekly':  date.setDate(date.getDate() + 7); break;
  case 'monthly': date.setMonth(date.getMonth() + 1); break;
  case 'yearly':  date.setFullYear(date.getFullYear() + 1); break;
  }
  return date;
}

function safeDateFromUnix(seconds, plan) {
  const base = seconds ? new Date(seconds * 1000) : new Date();
  const date = isNaN(base.getTime()) ? new Date() : base;
  if (!plan) return date;
  return calculateExpiryDate(plan, date);
}

// ============================================
// POST /checkout — Create Stripe Checkout Session
// ============================================
router.post('/checkout', async (req, res) => {
  try {
    const { agentId, agentName, plan, userId, userEmail } = req.body;

    // Validate required fields
    if (!agentId || !agentName || !plan || !userId || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, agentName, plan, userId, userEmail',
      });
    }

    // Validate plan type
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan. Must be daily, weekly, monthly, or yearly',
      });
    }

    // Check if user already has active subscription for this agent
    const existingSubscription = await prisma.agentSubscription.findFirst({
      where: {
        userId,
        agentId,
        status: 'active',
        expiryDate: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingSubscription) {
      const daysRemaining = Math.ceil(
        (new Date(existingSubscription.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return res.status(400).json({
        success: false,
        error: `You already have an active ${existingSubscription.plan} subscription for ${agentName}`,
        alreadySubscribed: true,
        existingSubscription: {
          plan: existingSubscription.plan,
          expiryDate: existingSubscription.expiryDate,
          daysRemaining,
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mumtaz.ai';
    const stripeInstance = getStripe();

    // ── Canvas Build checkout ──
    if (agentId === 'canvas' || agentId === 'canvas-build') {
      const planKey = plan.toUpperCase();
      const storedPriceId =
        process.env[`STRIPE_PRICE_CANVAS-BUILD_${planKey}`] ||
        process.env[`STRIPE_PRICE_CANVAS_BUILD_${planKey}`] ||
        null;

      const successUrl = `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}&agent=${encodeURIComponent(agentName)}&slug=${agentId}`;
      const cancelUrl  = `${baseUrl}/overview/canvas-pricing?cancelled=true`;
      const metadata   = { userId, agentId, agentName, plan, priceType: 'recurring' };

      if (storedPriceId) {
        console.log('[Stripe] Canvas Build subscription checkout with stored priceId:', { agentId, plan, storedPriceId });
        const session = await stripeInstance.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          customer_email: userEmail,
          client_reference_id: userId,
          line_items: [{ price: storedPriceId, quantity: 1 }],
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata,
          subscription_data: { metadata },
          allow_promotion_codes: true,
        });
        return res.json({ success: true, url: session.url, sessionId: session.id });
      }

      // No stored price — reject instead of creating inline products
      console.error('[Stripe] No priceId for Canvas Build:', { agentId, plan });
      return res.status(500).json({
        success: false,
        error: 'Canvas Build pricing not configured for this plan. Please contact support.',
      });
    }

    // Get agent plan details
    const planDetails = getAgentSubscriptionPlan(agentId, plan);

    console.log('[Stripe Checkout] Creating session:', { agentId, agentName, plan, userId, userEmail, priceId: planDetails.priceId });

    // Build success and cancel URLs
    let successUrl, cancelUrl;

    if (agentId === 'gencraft-pro') {
      successUrl = `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}&agent=${encodeURIComponent(agentName)}&slug=${agentId}`;
      cancelUrl = `${baseUrl}/overview/pricing?cancelled=true`;
    } else {
      successUrl = `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}&agent=${encodeURIComponent(agentName)}&slug=${agentId}`;
      cancelUrl = `${baseUrl}/subscribe?agent=${encodeURIComponent(agentName)}&slug=${agentId}&plan=${plan}&cancelled=true`;
    }

    // When no stored Stripe price is configured, reject instead of creating inline products
    if (!planDetails.priceId) {
      console.error('[Stripe] No priceId configured for:', { agentId, plan });
      return res.status(500).json({
        success: false,
        error: 'Subscription pricing not configured for this agent/plan. Please contact support.',
      });
    }

    // Retrieve the price from Stripe to determine if it's one-time or recurring
    const stripePrice = await stripeInstance.prices.retrieve(planDetails.priceId);
    const isRecurring = stripePrice.type === 'recurring';

    let session;
    if (isRecurring) {
      session = await stripeInstance.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: userEmail,
        client_reference_id: userId,
        line_items: [{ price: planDetails.priceId, quantity: 1 }],
        subscription_data: {
          // Auto-renew enabled by default; user can cancel from the dashboard
          metadata: { userId, agentId, agentName, plan, autoRenew: 'true' },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId, agentId, agentName, plan },
        allow_promotion_codes: true,
      });
    } else {
      session = await stripeInstance.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: userEmail,
        client_reference_id: userId,
        line_items: [{ price: planDetails.priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId, agentId, agentName, plan, priceType: 'one_time' },
        allow_promotion_codes: true,
      });
    }

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    });
  }
});

// ============================================
// POST /webhook — Stripe Webhook Handler
// ============================================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('🔥 STRIPE WEBHOOK RECEIVED');

  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return res.status(400).json({ error: 'No signature' });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    let event;
    try {
      event = getStripe().webhooks.constructEvent(req.body, signature, webhookSecret);
      console.log('✅ Webhook signature verified');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log('🎯 Event:', { type: event.type, id: event.id });

    switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('💥 WEBHOOK HANDLER ERROR:', error.message);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// ============================================
// POST /verify-session — Proxy to agent subscriptions verify-session
// (already handled at /api/agent/subscriptions/verify-session,
//  but frontend might call /api/stripe/verify-session)
// ============================================
router.post('/verify-session', async (req, res) => {
  try {
    const { sessionId, userId: bodyUserId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    console.log('🔍 Verifying Stripe session:', sessionId);

    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Payment not completed' });
    }

    const agentId = session.metadata?.agentId;
    const plan = session.metadata?.plan;
    const agentName = session.metadata?.agentName || session.metadata?.agentId;
    const userId = session.metadata?.userId || bodyUserId || session.client_reference_id;

    if (!agentId || !plan || !userId) {
      return res.status(400).json({ success: false, error: 'Payment information missing' });
    }

    // Determine dates
    const subscriptionData = session.subscription;
    let startDate, expiryDate, stripeSubId;

    if (subscriptionData && typeof subscriptionData === 'object') {
      startDate = new Date(subscriptionData.current_period_start * 1000);
      expiryDate = new Date(subscriptionData.current_period_end * 1000);
      stripeSubId = subscriptionData.id;
    } else {
      startDate = new Date();
      expiryDate = calculateExpiryDate(plan, startDate);
      stripeSubId = session.id;
    }

    const price = session.amount_total ? session.amount_total / 100 : 0;

    // Check if already processed
    const existingByStripeId = await prisma.agentSubscription.findFirst({
      where: { stripeSubscriptionId: stripeSubId },
    });

    if (existingByStripeId) {
      const updated = await prisma.agentSubscription.update({
        where: { id: existingByStripeId.id },
        data: { status: 'active', startDate, expiryDate },
      });
      const daysRemaining = Math.ceil((updated.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return res.json({
        success: true,
        hasAccess: true,
        subscription: {
          id: updated.id, agentId: updated.agentId, plan: updated.plan,
          status: 'active', expiryDate: updated.expiryDate,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0, price: updated.price,
        },
      });
    }

    // Ensure agent record exists (FK: agentSubscription.agentId → Agent.agentId)
    await prisma.agent.upsert({
      where: { agentId },
      update: {},
      create: {
        agentId,
        name: agentName || agentId,
        systemPrompt: '',
        welcomeMessage: `Welcome to ${agentName || agentId}`,
      },
    });

    // Check existing by user+agent
    const existing = await prisma.agentSubscription.findFirst({
      where: { userId, agentId },
    });

    let subscriptionRecord;
    if (existing) {
      subscriptionRecord = await prisma.agentSubscription.update({
        where: { id: existing.id },
        data: { status: 'active', plan, price, startDate, expiryDate, stripeSubscriptionId: stripeSubId },
      });
    } else {
      subscriptionRecord = await prisma.agentSubscription.create({
        data: { userId, agentId, plan, price, status: 'active', startDate, expiryDate, stripeSubscriptionId: stripeSubId },
      });
    }

    res.json({
      success: true,
      hasAccess: true,
      subscription: {
        id: subscriptionRecord.id, agentId: subscriptionRecord.agentId,
        plan: subscriptionRecord.plan, status: subscriptionRecord.status,
        expiryDate: subscriptionRecord.expiryDate,
        daysRemaining: Math.ceil((subscriptionRecord.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        price: subscriptionRecord.price,
      },
    });
  } catch (error) {
    console.error('❌ Session verification error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Verification failed' });
  }
});

// ============================================
// Webhook Event Handlers
// ============================================

async function handleCheckoutSessionCompleted(session) {
  console.log('🛒 Processing checkout session completed:', session.id);

  const { client_reference_id: userId, customer_email: email, subscription: subscriptionId, payment_status: paymentStatus, mode } = session;
  const metadata = session.metadata;

  if (!metadata || !userId || !email) {
    console.error('❌ Missing required session data');
    return;
  }

  if (mode === 'payment' && paymentStatus !== 'paid') return;
  if (mode === 'subscription' && !subscriptionId) return;

  let stripeSubscriptionId;
  let subscription = null;

  if (mode === 'subscription' && subscriptionId) {
    subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    // Auto-renew is the default; we no longer force cancel_at_period_end
    stripeSubscriptionId = subscription.id;
  } else if (mode === 'payment') {
    stripeSubscriptionId = session.id;
  }

  // Check if already processed
  const existingByStripeId = await prisma.agentSubscription.findFirst({
    where: { stripeSubscriptionId },
  });
  if (existingByStripeId) return;

  const existingSubscription = await prisma.agentSubscription.findFirst({
    where: { userId: metadata?.userId, agentId: metadata?.agentId },
  });

  if (!existingSubscription && subscription) {
    let planType = 'monthly';
    const interval = subscription.items.data[0]?.price?.recurring?.interval;
    if (interval === 'day') planType = 'daily';
    else if (interval === 'week') planType = 'weekly';
    else if (interval === 'year') planType = 'yearly';

    const startDate = safeDateFromUnix(subscription.current_period_start);
    const expiryDate = safeDateFromUnix(subscription.current_period_end, planType);

    const agentSub = await prisma.agentSubscription.create({
      data: {
        userId: metadata?.userId,
        agentId: metadata?.agentId,
        plan: planType,
        price: subscription.items.data[0]?.price?.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
        status: subscription.status === 'active' ? 'active' : 'expired',
        startDate, expiryDate,
        autoRenew: !subscription.cancel_at_period_end,
        stripeSubscriptionId: subscription.id,
      },
    });
    console.log('✅ Agent subscription created:', agentSub.id);

    await prisma.transaction.create({
      data: {
        transactionId: `txn_${Date.now()}_${subscription.id}`,
        userId: metadata?.userId, type: 'subscription',
        item: { agentId: metadata?.agentId, agentName: metadata?.agentName, plan: planType },
        amount: agentSub.price, currency: 'USD', status: 'completed',
        stripeSubscriptionId: subscription.id,
      },
    });

    // Send email (non-blocking)
    const userRecord = await prisma.user.findUnique({ where: { id: metadata?.userId }, select: { email: true, name: true } });
    if (userRecord?.email) {
      sendPlanPurchaseEmail(userRecord.email, userRecord.name, {
        planName: planType.charAt(0).toUpperCase() + planType.slice(1),
        agentName: metadata?.agentName || metadata?.agentId,
        price: agentSub.price, currency: 'USD', expiryDate, transactionId: agentSub.id,
      }).catch(err => console.error('[EMAIL] Plan purchase email failed:', err.message));
    }
  } else if (!existingSubscription && mode === 'payment' && metadata?.priceType === 'one_time') {
    const planType = metadata?.plan || 'monthly';
    const startDate = new Date();
    const expiryDate = calculateExpiryDate(planType, startDate);
    const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

    const agentSub = await prisma.agentSubscription.create({
      data: {
        userId: metadata?.userId,
        agentId: metadata?.agentId,
        plan: planType, price: amountTotal,
        status: 'active', startDate, expiryDate,
        autoRenew: false, stripeSubscriptionId: session.id,
      },
    });
    console.log('✅ Agent subscription created (one-time payment):', agentSub.id);

    await prisma.transaction.create({
      data: {
        transactionId: `txn_${Date.now()}_${session.id}`,
        userId: metadata?.userId, type: 'subscription',
        item: { agentId: metadata?.agentId, agentName: metadata?.agentName, plan: planType },
        amount: amountTotal, currency: 'USD', status: 'completed',
        stripeSubscriptionId: session.id,
      },
    });
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log('🆕 Subscription created:', subscription.id);
  // Auto-renew is enabled by default — no forced cancellation.

  const existingByStripeId = await prisma.agentSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (existingByStripeId) return;

  const existing = await prisma.agentSubscription.findFirst({
    where: { userId: subscription.metadata?.userId, agentId: subscription.metadata?.agentId },
  });

  if (!existing) {
    let planType = 'monthly';
    const interval = subscription.items.data[0]?.price?.recurring?.interval;
    if (interval === 'day') planType = 'daily';
    else if (interval === 'week') planType = 'weekly';
    else if (interval === 'year') planType = 'yearly';

    const startDate = safeDateFromUnix(subscription.current_period_start);
    const expiryDate = safeDateFromUnix(subscription.current_period_end, planType);

    const agentSub = await prisma.agentSubscription.create({
      data: {
        userId: subscription.metadata?.userId,
        agentId: subscription.metadata?.agentId,
        plan: planType,
        price: subscription.items.data[0]?.price?.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
        status: subscription.status === 'active' ? 'active' : 'expired',
        startDate, expiryDate,
        autoRenew: !subscription.cancel_at_period_end,
        stripeSubscriptionId: subscription.id,
      },
    });
    console.log('✅ Agent subscription created:', agentSub.id);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  let planType = 'monthly';
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  if (interval === 'day') planType = 'daily';
  else if (interval === 'week') planType = 'weekly';
  else if (interval === 'year') planType = 'yearly';

  const existing = await prisma.agentSubscription.findFirst({
    where: { userId: subscription.metadata?.userId, agentId: subscription.metadata?.agentId },
  });

  if (!existing) {
    const startDate = safeDateFromUnix(subscription.current_period_start);
    const expiryDate = safeDateFromUnix(subscription.current_period_end, planType);

    await prisma.agentSubscription.create({
      data: {
        userId: subscription.metadata?.userId,
        agentId: subscription.metadata?.agentId,
        plan: planType,
        price: subscription.items.data[0]?.price?.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
        status: subscription.status === 'active' ? 'active' : 'expired',
        startDate, expiryDate,
        autoRenew: !subscription.cancel_at_period_end,
        stripeSubscriptionId: subscription.id,
      },
    });
  } else {
    await prisma.agentSubscription.update({
      where: { id: existing.id },
      data: {
        status: subscription.status === 'active' ? 'active' : 'expired',
        expiryDate: safeDateFromUnix(subscription.current_period_end, planType),
        autoRenew: !subscription.cancel_at_period_end,
      },
    });
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Subscription deleted:', subscription.id);

  const existing = await prisma.agentSubscription.findFirst({
    where: { userId: subscription.metadata?.userId, agentId: subscription.metadata?.agentId },
  });

  if (existing) {
    await prisma.agentSubscription.update({
      where: { id: existing.id },
      data: { status: 'cancelled' },
    });
  }
}

async function handleInvoicePaid(invoice) {
  console.log('💰 Invoice paid:', invoice.id);

  if (!invoice.subscription) return;

  const subscription = await getStripe().subscriptions.retrieve(invoice.subscription);
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  let planType = 'monthly';
  if (interval === 'day') planType = 'daily';
  else if (interval === 'week') planType = 'weekly';
  else if (interval === 'year') planType = 'yearly';

  // Extend the local expiryDate from Stripe's new current_period_end
  const newExpiry = safeDateFromUnix(subscription.current_period_end, planType);

  // Prefer lookup by stripeSubscriptionId so renewals find the right row
  let existing = await prisma.agentSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!existing) {
    existing = await prisma.agentSubscription.findFirst({
      where: { userId: subscription.metadata?.userId, agentId: subscription.metadata?.agentId },
    });
  }

  if (existing) {
    await prisma.agentSubscription.update({
      where: { id: existing.id },
      data: {
        status: 'active',
        expiryDate: newExpiry,
        autoRenew: !subscription.cancel_at_period_end,
        stripeSubscriptionId: subscription.id,
      },
    });
    console.log(`  ↻ Extended ${existing.id} to ${newExpiry.toISOString()}`);
  }

  // Record the renewal payment as a transaction (skip the very first invoice — covered by checkout)
  if (invoice.billing_reason && invoice.billing_reason !== 'subscription_create') {
    try {
      await prisma.transaction.create({
        data: {
          transactionId: `txn_${Date.now()}_${invoice.id}`,
          userId: subscription.metadata?.userId,
          type: 'subscription_renewal',
          item: { agentId: subscription.metadata?.agentId, plan: planType, invoiceId: invoice.id },
          amount: (invoice.amount_paid || 0) / 100,
          currency: (invoice.currency || 'usd').toUpperCase(),
          status: 'completed',
          stripeSubscriptionId: subscription.id,
        },
      });
    } catch (e) {
      console.error('  Failed to record renewal txn:', e.message);
    }
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('⚠️ Invoice payment failed:', invoice.id);

  if (invoice.subscription) {
    const subscription = await getStripe().subscriptions.retrieve(invoice.subscription);
    const existing = await prisma.agentSubscription.findFirst({
      where: { userId: subscription.metadata?.userId, agentId: subscription.metadata?.agentId },
    });

    if (existing) {
      await prisma.agentSubscription.update({
        where: { id: existing.id },
        data: { status: 'expired' },
      });
    }
  }
}

export default router;
