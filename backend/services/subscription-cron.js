/**
 * Subscription Expiration Cron Job
 *
 * Automatically marks expired subscriptions as 'expired' status
 * Runs every hour to keep subscription statuses up to date
 */

import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';

/**
 * Start the subscription expiration cron job
 * Runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
 */
export function startSubscriptionExpirationCron() {
  // Schedule: '0 * * * *' means:
  // - minute: 0
  // - hour: * (every hour)
  // - day of month: * (every day)
  // - month: * (every month)
  // - day of week: * (every day of week)
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      // Find all active subscriptions that have passed their expiry date
      const result = await prisma.agentSubscription.updateMany({
        where: {
          status: 'active',
          expiryDate: { lt: now },
        },
        data: {
          status: 'expired',
        },
      });

      if (result.count > 0) {
        console.log(
          `[Cron] Marked ${result.count} subscription(s) as expired`,
        );
      }
    } catch (error) {
      console.error('[Cron] Error expiring subscriptions:', error);
    }
  });

  console.log(
    'Subscription expiration cron job started (runs hourly)',
  );
}

/**
 * Manual function to expire old subscriptions (useful for testing or manual runs)
 */
export async function expireOldSubscriptions() {
  try {
    const now = new Date();

    const result = await prisma.agentSubscription.updateMany({
      where: {
        status: 'active',
        expiryDate: { lt: now },
      },
      data: {
        status: 'expired',
      },
    });

    console.log(`Marked ${result.count} subscription(s) as expired`);
    return result;
  } catch (error) {
    console.error('Error expiring subscriptions:', error);
    throw error;
  }
}

export default { startSubscriptionExpirationCron, expireOldSubscriptions };
