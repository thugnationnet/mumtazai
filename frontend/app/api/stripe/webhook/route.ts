/**
 * Stripe Webhook Handler
 * Receives events from Stripe and saves subscriptions to PostgreSQL via Prisma
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { verifyWebhookSignature } from '../../../../lib/stripe-client';

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-11-17.clover' as any });
  return _stripe;
}

function safeDateFromUnix(
  seconds?: number | null,
  plan?: 'daily' | 'weekly' | 'monthly' | 'yearly'
) {
  const base = seconds ? new Date(seconds * 1000) : new Date();
  const date = isNaN(base.getTime()) ? new Date() : base;

  if (!plan) return date;

  const fallback = new Date(date);
  switch (plan) {
    case 'daily':
      fallback.setDate(fallback.getDate() + 1);
      break;
    case 'weekly':
      fallback.setDate(fallback.getDate() + 7);
      break;
    case 'yearly':
      fallback.setFullYear(fallback.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      fallback.setMonth(fallback.getMonth() + 1);
      break;
  }
  return fallback;
}

export async function POST(request: NextRequest) {
  console.log('🔥 STRIPE WEBHOOK RECEIVED - STARTING PROCESSING');

  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    console.log('📨 Webhook headers received:', {
      hasSignature: !!signature,
      contentType: headersList.get('content-type'),
      userAgent: headersList.get('user-agent'),
    });

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
      console.log('✅ Webhook signature verified successfully');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('🎯 Stripe webhook event received:', {
      type: event.type,
      id: event.id,
      created: event.created,
      livemode: event.livemode,
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('💥 WEBHOOK HANDLER ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  console.log('🛒 Processing checkout session completed:', {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    status: session.status,
  });

  const {
    client_reference_id: userId,
    customer_email: email,
    subscription: subscriptionId,
    payment_status: paymentStatus,
    mode,
  } = session;
  const metadata = session.metadata;

  console.log('👤 Session data extracted:', {
    userId,
    email,
    subscriptionId,
    paymentStatus,
    mode,
    metadata,
  });

  if (!metadata || !userId || !email) {
    console.error('❌ Missing required session data:', {
      userId,
      email,
      subscriptionId,
      paymentStatus,
      mode,
      metadata,
    });
    return;
  }

  // For payment mode, check if payment was successful
  if (mode === 'payment' && paymentStatus !== 'paid') {
    console.log('ℹ️ Payment not completed yet, status:', paymentStatus);
    return;
  }

  // For subscription mode, ensure subscription exists
  if (mode === 'subscription' && !subscriptionId) {
    console.error('❌ Missing subscription ID for subscription mode');
    return;
  }

  let stripeSubscriptionId: string | undefined;
  let subscription: Stripe.Subscription | null = null;

  if (mode === 'subscription' && subscriptionId) {
    // Get full subscription details from Stripe
    console.log(
      '🔍 Fetching subscription details from Stripe:',
      subscriptionId
    );
    subscription = await getStripe().subscriptions.retrieve(
      subscriptionId as string
    );
    console.log('✅ Subscription details retrieved:', {
      id: subscription.id,
      status: subscription.status,
      items: subscription.items.data.length,
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

    // ✅ CRITICAL: Set cancel_at_period_end = true for one-time purchase model
    if (!subscription.cancel_at_period_end) {
      console.log('🔧 Setting cancel_at_period_end for one-time purchase...');
      try {
        await getStripe().subscriptions.update(subscription.id, {
          cancel_at_period_end: true,
        });
        console.log(
          '✅ Subscription set to cancel at period end (no auto-renewal)'
        );
      } catch (error) {
        console.error('❌ Failed to set cancel_at_period_end:', error);
      }
    }
    stripeSubscriptionId = subscription.id;
  } else if (mode === 'payment') {
    // For payment mode, use session id as reference
    stripeSubscriptionId = session.id;
  }

  // Check if subscription already exists by Stripe ID (avoid duplicates)
  const existingByStripeId = await prisma.agentSubscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (existingByStripeId) {
    console.log(
      'ℹ️ Subscription already processed (Stripe ID):',
      stripeSubscriptionId
    );
    return;
  }

  // Check if agent subscription already exists
  const existingSubscription = await prisma.agentSubscription.findFirst({
    where: {
      userId: metadata?.userId,
      agentId: metadata?.agentId,
    },
  });

  if (!existingSubscription && subscription) {
    // Map Stripe interval to our plan types
    let planType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
    const interval = subscription.items.data[0]?.price?.recurring?.interval;
    if (interval === 'day') planType = 'daily';
    else if (interval === 'week') planType = 'weekly';
    else if (interval === 'year') planType = 'yearly';

    const subAny = subscription as any;
    const startDate = safeDateFromUnix(subAny.current_period_start);
    const expiryDate = safeDateFromUnix(
      subAny.current_period_end,
      planType
    );

    const agentSub = await prisma.agentSubscription.create({
      data: {
        userId: metadata?.userId as string,
        agentId: metadata?.agentId as string,
        plan: planType,
        price: subscription.items.data[0]?.price?.unit_amount
          ? subscription.items.data[0].price.unit_amount / 100
          : 0,
        status: subscription.status === 'active' ? 'active' : 'expired',
        startDate,
        expiryDate,
        autoRenew: false, // Always false for one-time purchase model
        stripeSubscriptionId: subscription.id,
      },
    });

    console.log('✅ Agent subscription created:', agentSub.id);

    // Create transaction record
    await prisma.transaction.create({
      data: {
        transactionId: `txn_${Date.now()}_${subscription.id}`,
        userId: metadata?.userId as string,
        type: 'subscription',
        item: {
          agentId: metadata?.agentId,
          agentName: metadata?.agentName,
          plan: planType,
        },
        amount: agentSub.price,
        currency: 'USD',
        status: 'completed',
        stripeSubscriptionId: subscription.id,
      },
    });
  } else if (!existingSubscription && mode === 'payment' && metadata?.priceType === 'one_time') {
    // One-time payment mode — create subscription record with calculated expiry
    const planType = (metadata?.plan as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly';
    const startDate = new Date();
    const expiryDate = safeDateFromUnix(undefined, planType);

    // Get amount from session
    const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

    const agentSub = await prisma.agentSubscription.create({
      data: {
        userId: metadata?.userId as string,
        agentId: metadata?.agentId as string,
        plan: planType,
        price: amountTotal,
        status: 'active',
        startDate,
        expiryDate,
        autoRenew: false,
        stripeSubscriptionId: session.id,
      },
    });

    console.log('✅ Agent subscription created (one-time payment):', agentSub.id);

    // Create transaction record
    await prisma.transaction.create({
      data: {
        transactionId: `txn_${Date.now()}_${session.id}`,
        userId: metadata?.userId as string,
        type: 'subscription',
        item: {
          agentId: metadata?.agentId,
          agentName: metadata?.agentName,
          plan: planType,
        },
        amount: amountTotal,
        currency: 'USD',
        status: 'completed',
        stripeSubscriptionId: session.id,
      },
    });
  } else {
    console.log('ℹ️ Agent subscription already exists, skipping creation');
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 Subscription created:', subscription.id);

  // ✅ CRITICAL: Set cancel_at_period_end = true for one-time purchase model
  if (
    subscription.metadata?.cancelAtPeriodEnd === 'true' &&
    !subscription.cancel_at_period_end
  ) {
    console.log('🔧 Setting cancel_at_period_end for one-time purchase...');
    try {
      await getStripe().subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });
      console.log(
        '✅ Subscription set to cancel at period end (no auto-renewal)'
      );
    } catch (error) {
      console.error('❌ Failed to set cancel_at_period_end:', error);
    }
  }

  // Check if subscription already exists by Stripe ID (avoid duplicates)
  const existingByStripeId = await prisma.agentSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (existingByStripeId) {
    console.log(
      'ℹ️ Subscription already processed (Stripe ID):',
      subscription.id
    );
    return;
  }

  const existingSubscription = await prisma.agentSubscription.findFirst({
    where: {
      userId: subscription.metadata?.userId,
      agentId: subscription.metadata?.agentId,
    },
  });

  if (!existingSubscription) {
    // Map Stripe interval to our plan types
    let planType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
    const interval = subscription.items.data[0]?.price?.recurring?.interval;
    if (interval === 'day') planType = 'daily';
    else if (interval === 'week') planType = 'weekly';
    else if (interval === 'year') planType = 'yearly';

    const subAny = subscription as any;
    const startDate = safeDateFromUnix(subAny.current_period_start);
    const expiryDate = safeDateFromUnix(
      subAny.current_period_end,
      planType
    );

    const agentSub = await prisma.agentSubscription.create({
      data: {
        userId: subscription.metadata?.userId as string,
        agentId: subscription.metadata?.agentId as string,
        plan: planType,
        price: subscription.items.data[0]?.price?.unit_amount
          ? subscription.items.data[0].price.unit_amount / 100
          : 0,
        status: subscription.status === 'active' ? 'active' : 'expired',
        startDate,
        expiryDate,
        autoRenew: false,
        stripeSubscriptionId: subscription.id,
      },
    });

    console.log('✅ Agent subscription created:', agentSub.id);
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  const existingSubscription = await prisma.agentSubscription.findFirst({
    where: {
      userId: subscription.metadata?.userId,
      agentId: subscription.metadata?.agentId,
    },
  });

  // Map Stripe interval to our plan types
  let planType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  if (interval === 'day') planType = 'daily';
  else if (interval === 'week') planType = 'weekly';
  else if (interval === 'year') planType = 'yearly';

  const subAny = subscription as any;

  if (!existingSubscription) {
    console.log(
      'Agent subscription not found in database, creating new record'
    );

    const startDate = safeDateFromUnix(subAny.current_period_start);
    const expiryDate = safeDateFromUnix(
      subAny.current_period_end,
      planType
    );

    const agentSub = await prisma.agentSubscription.create({
      data: {
        userId: subscription.metadata?.userId as string,
        agentId: subscription.metadata?.agentId as string,
        plan: planType,
        price: subscription.items.data[0]?.price?.unit_amount
          ? subscription.items.data[0].price.unit_amount / 100
          : 0,
        status: subscription.status === 'active' ? 'active' : 'expired',
        startDate,
        expiryDate,
        autoRenew: false,
        stripeSubscriptionId: subscription.id,
      },
    });

    console.log('✅ Agent subscription created:', agentSub.id);
  } else {
    // Update existing subscription
    await prisma.agentSubscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: subscription.status === 'active' ? 'active' : 'expired',
        expiryDate: safeDateFromUnix(
          subAny.current_period_end,
          planType
        ),
        autoRenew: false,
      },
    });

    console.log('✅ Agent subscription updated:', existingSubscription.id);
  }
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  const existingSubscription = await prisma.agentSubscription.findFirst({
    where: {
      userId: subscription.metadata?.userId,
      agentId: subscription.metadata?.agentId,
    },
  });

  if (existingSubscription) {
    await prisma.agentSubscription.update({
      where: { id: existingSubscription.id },
      data: { status: 'cancelled' },
    });
    console.log('Agent subscription marked as canceled in database');
  }
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Invoice paid:', invoice.id);

  const invoiceAny = invoice as any;
  if (invoiceAny.subscription) {
    // Get the subscription object from Stripe to access metadata
    const subscription = await getStripe().subscriptions.retrieve(
      invoiceAny.subscription as string
    );

    const existingSubscription = await prisma.agentSubscription.findFirst({
      where: {
        userId: subscription.metadata?.userId,
        agentId: subscription.metadata?.agentId,
      },
    });

    if (existingSubscription && existingSubscription.status !== 'active') {
      await prisma.agentSubscription.update({
        where: { id: existingSubscription.id },
        data: { status: 'active' },
      });
      console.log('Agent subscription reactivated after payment');
    }
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  const invoiceAny = invoice as any;
  if (invoiceAny.subscription) {
    // Get the subscription object from Stripe to access metadata
    const subscription = await getStripe().subscriptions.retrieve(
      invoiceAny.subscription as string
    );

    const existingSubscription = await prisma.agentSubscription.findFirst({
      where: {
        userId: subscription.metadata?.userId,
        agentId: subscription.metadata?.agentId,
      },
    });

    if (existingSubscription) {
      await prisma.agentSubscription.update({
        where: { id: existingSubscription.id },
        data: { status: 'expired' },
      });
      console.log('Agent subscription marked as expired due to payment failure');
    }
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
