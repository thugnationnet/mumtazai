/**
 * PLAN / SUBSCRIPTION MIDDLEWARE — Canvas Build (build.mumtaz.ai)
 * Server-side enforcement of canvas subscription requirement.
 * Must run AFTER requireAuth so req.userId is set.
 *
 * The subscriptions table lives in the public schema (shiny-backend),
 * not in the canvas_studio schema, so we use a raw cross-schema query.
 */

import { prisma } from './prisma.js';

/**
 * Require an active 'canvas' subscription.
 * Returns 403 if the user has no active Canvas Build plan.
 */
export const requireCanvasPlan = async (req, res, next) => {
  if (!req.userId || !req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  try {
    // User IDs differ between canvas_studio and public schemas.
    // Look up by email (consistent across schemas) via a join.
    const email = req.user.email;
    const subs = await prisma.$queryRaw`
      SELECT s.id, s."userId", s."agentId", s.status, s."expiryDate"
      FROM public.subscriptions s
      JOIN public."User" u ON u.id = s."userId"
      WHERE u.email = ${email}
        AND s."agentId" IN ('canvas', 'gencraft-pro')
        AND s.status = 'active'
        AND s."expiryDate" > NOW()
      LIMIT 1
    `;

    if (!subs || subs.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Canvas Build subscription required. Purchase a plan to access this feature.',
        code: 'PLAN_REQUIRED',
        product: 'canvas',
      });
    }

    req.canvasPlan = subs[0];
    next();
  } catch (err) {
    console.error('[PlanMiddleware] requireCanvasPlan error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Subscription check failed',
    });
  }
};
