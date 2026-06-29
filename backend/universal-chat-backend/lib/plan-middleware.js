/**
 * PLAN / SUBSCRIPTION MIDDLEWARE — Universal Chat
 * Server-side enforcement of per-agent subscription requirement.
 *
 * Universal Chat has 18 agents, each requiring its own subscription.
 * The agentId comes from the request body/query/headers.
 *
 * Must run AFTER requireAuth so req.userId and req.isAuthenticated are set.
 *
 * Usage:
 *   router.post('/agent-stream', requireAuth, requireAgentPlan, handler);
 */

import { prisma } from './prisma.js';

/**
 * Require an active subscription for the specific agent in the request.
 * Reads agentId from req.body, req.query, or x-agent-id header.
 * Returns 403 if user has no active subscription for that agent.
 * Sets req.agentPlan to the active subscription row on success.
 */
export const requireAgentPlan = async (req, res, next) => {
  if (!req.isAuthenticated || !req.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  const agentId =
    req.body?.agentId ||
    req.query?.agentId ||
    req.headers?.['x-agent-id'];

  if (!agentId) {
    return res.status(400).json({
      success: false,
      error: 'Agent ID required for subscription check',
      code: 'AGENT_ID_MISSING',
    });
  }

  try {
    const sub = await prisma.agentSubscription.findFirst({
      where: {
        userId: req.userId,
        agentId,
        status: 'active',
        expiryDate: { gt: new Date() },
      },
    });

    if (!sub) {
      return res.status(403).json({
        success: false,
        error: `Subscription required for agent "${agentId}". Purchase a plan to access this feature.`,
        code: 'PLAN_REQUIRED',
        product: 'universal-chat',
        agentId,
      });
    }

    req.agentPlan = sub;
    next();
  } catch (err) {
    console.error('[PlanMiddleware] requireAgentPlan error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Subscription check failed',
    });
  }
};
