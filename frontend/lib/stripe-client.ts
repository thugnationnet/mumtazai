/**
 * Stripe Client Library
 * Webhook signature verification only - checkout sessions are created by universal-chat-backend.
 */

import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid crashes when STRIPE_SECRET_KEY is not set at build time
let _stripe: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }
  return _stripe;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  try {
    return getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(
      `Webhook signature verification failed: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`
    );
  }
}

// Re-export getStripeClient for webhook route usage
export { getStripeClient };
