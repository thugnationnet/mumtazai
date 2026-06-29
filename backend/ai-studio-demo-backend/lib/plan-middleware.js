/**
 * PLAN / SUBSCRIPTION MIDDLEWARE — AI Studio Demo
 * Server-side enforcement of subscription requirement (demo version of Canvas Studio).
 *
 * Must run AFTER requireAuth so req.userId and req.isAuthenticated are set.
 *
 * Usage:
 *   router.post('/generate', requireAuth, requireCanvasStudioPlan, handler);
 */

import { prisma } from './prisma.js';

/**
 * Require an active canvas-studio subscription (agentId = 'canvas-studio').
 * Returns 403 if user has no active subscription.
 * Sets req.canvasStudioPlan to the active subscription row on success.
 */
export const requireCanvasStudioPlan = async (req, res, next) => {
  if (!req.isAuthenticated || !req.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  try {
    const sub = await prisma.agentSubscription.findFirst({
      where: {
        userId: req.userId,
        agentId: 'canvas-studio',
        status: 'active',
        expiryDate: { gt: new Date() },
      },
    });

    if (!sub) {
      return res.status(403).json({
        success: false,
        error: 'GenCraft subscription required. Purchase a plan to access this feature.',
        code: 'PLAN_REQUIRED',
        product: 'canvas-studio',
      });
    }

    req.canvasStudioPlan = sub;
    next();
  } catch (err) {
    console.error('[PlanMiddleware] requireCanvasStudioPlan error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Subscription check failed',
    });
  }
};

// Backward-compatible alias (used in existing route imports)
export const requireAnyCanvasPlan = requireCanvasStudioPlan;
