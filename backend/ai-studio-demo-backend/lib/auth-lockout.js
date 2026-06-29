/**
 * ═══════════════════════════════════════════════════════════════════
 * PROGRESSIVE AUTH LOCKOUT SYSTEM — PER EMAIL
 * ═══════════════════════════════════════════════════════════════════
 *
 * Tier 0 (initial):    3 failed attempts → locked 15 minutes
 * Tier 1 (escalated):  3 failed attempts → locked 24 hours
 * Tier 2 (final):      3 failed attempts → permanently locked
 *                       → must contact support to unlock
 *
 * Tracks per EMAIL address (not IP). Any IP/browser/device
 * that fails on the same email contributes to the same counter.
 * Successful login resets everything.
 *
 * ═══════════════════════════════════════════════════════════════════
 */

import { prisma } from './prisma.js';

const LOCKOUT_CONFIG = {
  maxAttempts: 3,
  tiers: [
    { duration: 15 * 60 * 1000 },        // Tier 0 → 15 minutes
    { duration: 24 * 60 * 60 * 1000 },    // Tier 1 → 24 hours
    { duration: null },                     // Tier 2 → permanent
  ],
};

/**
 * Get client IP from request (for logging only).
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * Check if an email is currently locked out.
 * Returns { locked: boolean, message: string, retryAfter?: string }
 */
export async function checkLockout(email) {
  if (!email) return { locked: false };

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const record = await prisma.authLockout.findUnique({
      where: { email: normalizedEmail },
    });

    if (!record) {
      return { locked: false };
    }

    // Permanently locked
    if (record.permanentlyLocked) {
      return {
        locked: true,
        message: 'This account has been permanently locked due to repeated failed attempts. Please contact support at support@mumtaz.ai to unlock your account.',
        retryAfter: 'permanent',
        tier: 2,
      };
    }

    // Check if there's an active time-based lock
    if (record.lockedUntil) {
      const now = new Date();
      if (now < record.lockedUntil) {
        const remainingMs = record.lockedUntil.getTime() - now.getTime();
        const remainingMin = Math.ceil(remainingMs / 60000);
        const remainingHours = Math.ceil(remainingMs / 3600000);

        const retryAfter = record.lockoutTier === 0
          ? `${remainingMin} minute${remainingMin !== 1 ? 's' : ''}`
          : `${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;

        const message = record.lockoutTier === 0
          ? `Too many failed attempts. This account is locked for ${retryAfter}. Please try again later.`
          : `Too many repeated failed attempts. This account is locked for ${retryAfter}. Next failure tier will result in permanent lock.`;

        return {
          locked: true,
          message,
          retryAfter,
          tier: record.lockoutTier,
        };
      }
      // Lock has expired — allow the attempt
    }

    return { locked: false };
  } catch (error) {
    console.error('[auth-lockout] Error checking lockout:', error);
    return { locked: false }; // Fail open
  }
}

/**
 * Record a failed authentication attempt for an email.
 * Escalates lockout tier when maxAttempts is reached.
 */
export async function recordFailedAttempt(email, req) {
  if (!email) return { locked: false };

  const normalizedEmail = email.toLowerCase().trim();
  const ip = getClientIp(req);

  try {
    let record = await prisma.authLockout.findUnique({
      where: { email: normalizedEmail },
    });

    if (!record) {
      record = await prisma.authLockout.create({
        data: {
          email: normalizedEmail,
          failedAttempts: 1,
          lockoutTier: 0,
          lastFailedAt: new Date(),
          lastFailedIp: ip,
        },
      });
    } else {
      const now = new Date();
      let newTier = record.lockoutTier;
      let newAttempts = record.failedAttempts + 1;

      // If previously locked and lock has expired, escalate tier
      if (record.lockedUntil && now >= record.lockedUntil) {
        newTier = Math.min(record.lockoutTier + 1, 2);
        newAttempts = 1;
      }

      record = await prisma.authLockout.update({
        where: { email: normalizedEmail },
        data: {
          failedAttempts: newAttempts,
          lockoutTier: newTier,
          lastFailedAt: new Date(),
          lastFailedIp: ip,
          ...(record.lockedUntil && now >= record.lockedUntil ? { lockedUntil: null } : {}),
        },
      });
    }

    // Check if threshold is hit
    if (record.failedAttempts >= LOCKOUT_CONFIG.maxAttempts) {
      const tier = record.lockoutTier;
      const tierConfig = LOCKOUT_CONFIG.tiers[tier];

      if (!tierConfig || tierConfig.duration === null) {
        // Permanent lock
        await prisma.authLockout.update({
          where: { email: normalizedEmail },
          data: { permanentlyLocked: true, lockedUntil: null },
        });
        console.warn(`[auth-lockout] PERMANENT LOCK — email: ${normalizedEmail}, last IP: ${ip}`);
        return {
          locked: true,
          message: 'This account has been permanently locked due to repeated failed attempts. Please contact support at support@mumtaz.ai to unlock your account.',
          tier: 2,
        };
      }

      // Time-based lock
      const lockedUntil = new Date(Date.now() + tierConfig.duration);
      await prisma.authLockout.update({
        where: { email: normalizedEmail },
        data: { lockedUntil, failedAttempts: 0 },
      });

      const lockDuration = tier === 0 ? '15 minutes' : '24 hours';
      const nextWarning = tier === 0
        ? ' Next failure tier will lock this account for 24 hours.'
        : ' Next failure tier will lock this account permanently.';

      console.warn(`[auth-lockout] Tier ${tier} lock — email: ${normalizedEmail}, IP: ${ip}, locked for ${lockDuration}`);
      return {
        locked: true,
        message: `Too many failed attempts. This account is locked for ${lockDuration}.${nextWarning}`,
        tier,
      };
    }

    const remaining = LOCKOUT_CONFIG.maxAttempts - record.failedAttempts;
    return { locked: false, attemptsRemaining: remaining };
  } catch (error) {
    console.error('[auth-lockout] Error recording failed attempt:', error);
    return { locked: false };
  }
}

/**
 * Record a successful authentication — resets all lockout state for the email.
 */
export async function recordSuccessfulAuth(email) {
  if (!email) return;

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const record = await prisma.authLockout.findUnique({
      where: { email: normalizedEmail },
    });
    if (record) {
      await prisma.authLockout.update({
        where: { email: normalizedEmail },
        data: {
          failedAttempts: 0,
          lockoutTier: 0,
          lockedUntil: null,
          permanentlyLocked: false,
        },
      });
    }
  } catch (error) {
    console.error('[auth-lockout] Error recording success:', error);
  }
}
