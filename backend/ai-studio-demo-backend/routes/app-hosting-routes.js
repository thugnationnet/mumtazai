/**
 * APP HOSTING ROUTES — Canvas-App SaaS Billing, Usage & Hosting Management
 *
 * GET  /api/apps/hosting/plan/:userId        — Get user's hosting plan + usage
 * POST /api/apps/hosting/plan                — Create/upgrade hosting plan
 * PUT  /api/apps/hosting/plan/:planId        — Update hosting plan (upgrade/downgrade)
 * DELETE /api/apps/hosting/plan/:planId      — Cancel hosting plan
 * GET  /api/apps/hosting/usage/:userId       — Get detailed usage breakdown
 * GET  /api/apps/hosting/billing/:userId     — Get billing history for apps
 * GET  /api/apps/hosting/dashboard/:userId   — Full dashboard data (plan + usage + apps + billing)
 * POST /api/apps/hosting/checkout            — Create Stripe checkout for hosting plan
 * POST /api/apps/hosting/verify-session      — Verify Stripe session after payment
 * GET  /api/apps/hosting/pricing             — Get available hosting plans/pricing
 */

import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { requireAuth, optionalAuth } from '../lib/auth-middleware.js';

const router = express.Router();

// ── Stripe lazy init ───────────────────────────────────────
let stripe = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }
  return stripe;
};

// ── Hosting tier definitions ───────────────────────────────
const HOSTING_TIERS = {
  free: {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    maxApps: 1,
    maxBandwidthMb: 100,
    maxRequestsPerMonth: 1000,
    maxStorageMb: 50,
    customDomain: false,
    sslIncluded: true,
    prioritySupport: false,
    features: [
      '1 app deployment',
      '100 MB bandwidth/mo',
      '1,000 requests/mo',
      '50 MB storage',
      'SSL included',
      'your-app.apps.mumtaz.ai subdomain',
    ],
  },
  starter: {
    name: 'Starter',
    price: { monthly: 7, yearly: 60 },
    maxApps: 3,
    maxBandwidthMb: 1024,
    maxRequestsPerMonth: 10000,
    maxStorageMb: 500,
    customDomain: false,
    sslIncluded: true,
    prioritySupport: false,
    features: [
      '3 app deployments',
      '1 GB bandwidth/mo',
      '10,000 requests/mo',
      '500 MB storage',
      'SSL included',
      'Build priority queue',
    ],
  },
  pro: {
    name: 'Pro',
    price: { monthly: 19, yearly: 168 },
    maxApps: 10,
    maxBandwidthMb: 10240,
    maxRequestsPerMonth: 100000,
    maxStorageMb: 5120,
    customDomain: true,
    sslIncluded: true,
    prioritySupport: true,
    features: [
      '10 app deployments',
      '10 GB bandwidth/mo',
      '100,000 requests/mo',
      '5 GB storage',
      'Custom domain support',
      'Priority support',
      'Advanced analytics',
    ],
  },
  business: {
    name: 'Business',
    price: { monthly: 49, yearly: 468 },
    maxApps: 50,
    maxBandwidthMb: 102400,
    maxRequestsPerMonth: 1000000,
    maxStorageMb: 51200,
    customDomain: true,
    sslIncluded: true,
    prioritySupport: true,
    features: [
      '50 app deployments',
      '100 GB bandwidth/mo',
      '1M requests/mo',
      '50 GB storage',
      'Custom domain support',
      'Priority support',
      'Team collaboration',
      'API access',
      'Webhooks',
    ],
  },
};

// Helper: format bytes
function formatBytes(mb) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

// Helper: get current billing period
function getCurrentPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

// ============================================
// 1. GET PRICING — Public
// ============================================
router.get('/pricing', (req, res) => {
  const plans = Object.entries(HOSTING_TIERS).map(([tier, config]) => ({
    tier,
    name: config.name,
    price: config.price,
    limits: {
      maxApps: config.maxApps,
      maxBandwidthMb: config.maxBandwidthMb,
      maxBandwidthFormatted: formatBytes(config.maxBandwidthMb),
      maxRequestsPerMonth: config.maxRequestsPerMonth,
      maxStorageMb: config.maxStorageMb,
      maxStorageFormatted: formatBytes(config.maxStorageMb),
      customDomain: config.customDomain,
      sslIncluded: config.sslIncluded,
      prioritySupport: config.prioritySupport,
    },
    features: config.features,
  }));

  res.json({ success: true, plans });
});

// ============================================
// 2. GET USER'S HOSTING PLAN
// ============================================
router.get('/plan/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.userId; // Use auth token, not URL param

    let plan = await prisma.appHostingPlan.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-create free plan if none exists
    if (!plan) {
      const freeTier = HOSTING_TIERS.free;
      plan = await prisma.appHostingPlan.create({
        data: {
          userId,
          tier: 'free',
          status: 'active',
          price: 0,
          billingCycle: 'monthly',
          maxApps: freeTier.maxApps,
          maxBandwidthMb: freeTier.maxBandwidthMb,
          maxRequestsPerMonth: freeTier.maxRequestsPerMonth,
          maxStorageMb: freeTier.maxStorageMb,
          customDomain: freeTier.customDomain,
          sslIncluded: freeTier.sslIncluded,
          prioritySupport: freeTier.prioritySupport,
        },
      });
    }

    // Calculate days remaining
    let daysRemaining = null;
    if (plan.expiryDate) {
      daysRemaining = Math.ceil(
        (new Date(plan.expiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysRemaining < 0) daysRemaining = 0;
    }

    // Usage percentages
    const usagePercent = {
      bandwidth:
        plan.maxBandwidthMb > 0
          ? Math.round((plan.currentBandwidthMb / plan.maxBandwidthMb) * 100)
          : 0,
      requests:
        plan.maxRequestsPerMonth > 0
          ? Math.round((plan.currentRequests / plan.maxRequestsPerMonth) * 100)
          : 0,
      storage:
        plan.maxStorageMb > 0
          ? Math.round((plan.currentStorageMb / plan.maxStorageMb) * 100)
          : 0,
      apps:
        plan.maxApps > 0
          ? Math.round((plan.currentApps / plan.maxApps) * 100)
          : 0,
    };

    res.json({
      success: true,
      plan: {
        ...plan,
        daysRemaining,
        usagePercent,
        tierConfig: HOSTING_TIERS[plan.tier],
      },
    });
  } catch (error) {
    console.error('[Hosting] Get plan error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to get hosting plan' });
  }
});

// ============================================
// 3. FULL DASHBOARD DATA
// ============================================
router.get('/dashboard/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.userId; // Use auth token, not URL param
    const { start, end } = getCurrentPeriod();

    // Fetch everything in parallel
    const [plan, projects, deployments, usageRecords, subscriptions] =
      await Promise.all([
        // Hosting plan (or create free)
        prisma.appHostingPlan.findFirst({
          where: { userId, status: 'active' },
          orderBy: { createdAt: 'desc' },
        }),
        // User's canvas projects
        prisma.canvasProject.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          include: {
            deployments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            builds: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
        // Deployments for user's projects
        prisma.canvasDeployment.findMany({
          where: {
            project: { userId },
          },
          orderBy: { createdAt: 'desc' },
        }),
        // Usage records for current period
        prisma.appUsageRecord.findMany({
          where: {
            userId,
            createdAt: { gte: start, lte: end },
          },
          orderBy: { createdAt: 'desc' },
        }),
        // Canvas & GenCraft subscriptions (canvas = Canvas Build, gencraft-pro = GenCraft Pro IDE)
        prisma.agentSubscription.findMany({
          where: {
            userId,
            agentId: { in: ['canvas', 'gencraft-pro', 'app-hosting'] },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    // Auto-create free plan if none (upsert to avoid unique constraint race)
    let hostingPlan = plan;
    if (!hostingPlan) {
      const freeTier = HOSTING_TIERS.free;
      hostingPlan = await prisma.appHostingPlan.upsert({
        where: {
          userId_tier: { userId, tier: 'free' },
        },
        update: {},
        create: {
          userId,
          tier: 'free',
          status: 'active',
          price: 0,
          billingCycle: 'monthly',
          maxApps: freeTier.maxApps,
          maxBandwidthMb: freeTier.maxBandwidthMb,
          maxRequestsPerMonth: freeTier.maxRequestsPerMonth,
          maxStorageMb: freeTier.maxStorageMb,
          customDomain: freeTier.customDomain,
          sslIncluded: freeTier.sslIncluded,
          prioritySupport: freeTier.prioritySupport,
        },
      });
    }

    // Compute usage percentages
    const usagePercent = {
      bandwidth:
        hostingPlan.maxBandwidthMb > 0
          ? Math.min(
              100,
              Math.round(
                (hostingPlan.currentBandwidthMb / hostingPlan.maxBandwidthMb) *
                  100
              )
            )
          : 0,
      requests:
        hostingPlan.maxRequestsPerMonth > 0
          ? Math.min(
              100,
              Math.round(
                (hostingPlan.currentRequests /
                  hostingPlan.maxRequestsPerMonth) *
                  100
              )
            )
          : 0,
      storage:
        hostingPlan.maxStorageMb > 0
          ? Math.min(
              100,
              Math.round(
                (hostingPlan.currentStorageMb / hostingPlan.maxStorageMb) * 100
              )
            )
          : 0,
      apps:
        hostingPlan.maxApps > 0
          ? Math.min(
              100,
              Math.round((hostingPlan.currentApps / hostingPlan.maxApps) * 100)
            )
          : 0,
    };

    // Aggregate usage by type for current period
    const usageByType = {};
    usageRecords.forEach((r) => {
      if (!usageByType[r.eventType]) usageByType[r.eventType] = 0;
      usageByType[r.eventType] += r.value;
    });

    // Deployment summary
    const liveDeployments = deployments.filter((d) => d.status === 'live');
    const totalRequests = deployments.reduce(
      (sum, d) => sum + d.requestCount,
      0
    );
    const totalBandwidth = deployments.reduce(
      (sum, d) => sum + Number(d.bandwidthUsed || 0),
      0
    );

    // Project summary
    const projectStats = {
      total: projects.length,
      deployed: projects.filter((p) => p.status === 'deployed').length,
      draft: projects.filter((p) => p.status === 'draft').length,
      building: projects.filter((p) => p.status === 'building').length,
      error: projects.filter((p) => p.status === 'error').length,
    };

    // Days remaining on plan
    let daysRemaining = null;
    if (hostingPlan.expiryDate) {
      daysRemaining = Math.ceil(
        (new Date(hostingPlan.expiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysRemaining < 0) daysRemaining = 0;
    }

    // Billing summary — separate canvas and gencraft-pro subscriptions
    const activeGencraftSub =
      subscriptions.find(
        (s) =>
          s.agentId === 'gencraft-pro' &&
          s.status === 'active' &&
          new Date(s.expiryDate) > new Date()
      ) || null;
    const activeCanvasSub =
      subscriptions.find(
        (s) =>
          s.agentId === 'canvas' &&
          s.status === 'active' &&
          new Date(s.expiryDate) > new Date()
      ) || null;
    const totalSpent = subscriptions
      .filter((s) => s.status === 'active' || s.status === 'expired')
      .reduce((sum, s) => sum + s.price, 0);

    res.json({
      success: true,
      dashboard: {
        // Current hosting plan
        plan: {
          ...hostingPlan,
          daysRemaining,
          usagePercent,
          tierConfig: HOSTING_TIERS[hostingPlan.tier],
        },
        // Project data
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          framework: p.framework,
          status: p.status,
          subdomain: p.subdomain,
          deploymentUrl: p.deploymentUrl,
          tags: p.tags,
          isPublic: p.isPublic,
          viewCount: p.viewCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          latestDeployment: p.deployments[0] || null,
          latestBuild: p.builds[0] || null,
        })),
        projectStats,
        // Deployment data
        deployments: {
          total: deployments.length,
          live: liveDeployments.length,
          totalRequests,
          totalBandwidthBytes: totalBandwidth,
          totalBandwidthFormatted: formatBytes(totalBandwidth / (1024 * 1024)),
          items: deployments.slice(0, 10),
        },
        // Usage data
        usage: {
          currentPeriod: { start, end },
          byType: usageByType,
          records: usageRecords.slice(0, 20),
          bandwidth: {
            used: hostingPlan.currentBandwidthMb,
            limit: hostingPlan.maxBandwidthMb,
            usedFormatted: formatBytes(hostingPlan.currentBandwidthMb),
            limitFormatted: formatBytes(hostingPlan.maxBandwidthMb),
            percent: usagePercent.bandwidth,
          },
          requests: {
            used: hostingPlan.currentRequests,
            limit: hostingPlan.maxRequestsPerMonth,
            percent: usagePercent.requests,
          },
          storage: {
            used: hostingPlan.currentStorageMb,
            limit: hostingPlan.maxStorageMb,
            usedFormatted: formatBytes(hostingPlan.currentStorageMb),
            limitFormatted: formatBytes(hostingPlan.maxStorageMb),
            percent: usagePercent.storage,
          },
          apps: {
            used: hostingPlan.currentApps,
            limit: hostingPlan.maxApps,
            percent: usagePercent.apps,
          },
        },
        // Billing data
        billing: {
          currentPlan: hostingPlan.tier,
          monthlyPrice: hostingPlan.price,
          billingCycle: hostingPlan.billingCycle,
          gencraftSubscription: activeGencraftSub || null,
          canvasSubscription: activeCanvasSub || null,
          hasActiveSubscription: !!(activeGencraftSub || activeCanvasSub),
          totalSpent,
          subscriptionHistory: subscriptions.map((s) => ({
            id: s.id,
            agentId: s.agentId,
            plan: s.plan,
            price: s.price,
            status: s.status,
            startDate: s.startDate,
            expiryDate: s.expiryDate,
          })),
        },
      },
    });
  } catch (error) {
    console.error('[Hosting] Dashboard error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to load dashboard data' });
  }
});

// ============================================
// 4. GET USAGE BREAKDOWN
// ============================================
router.get('/usage/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.userId; // Use auth token
    const { period = 'current' } = req.query;

    let periodStart, periodEnd;
    if (period === 'current') {
      const { start, end } = getCurrentPeriod();
      periodStart = start;
      periodEnd = end;
    } else if (period === 'last') {
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else {
      periodStart = new Date(0);
      periodEnd = new Date();
    }

    const records = await prisma.appUsageRecord.findMany({
      where: {
        userId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by event type
    const byType = {};
    records.forEach((r) => {
      if (!byType[r.eventType]) {
        byType[r.eventType] = { total: 0, count: 0, records: [] };
      }
      byType[r.eventType].total += r.value;
      byType[r.eventType].count += 1;
      byType[r.eventType].records.push(r);
    });

    // Group by day for charts
    const byDay = {};
    records.forEach((r) => {
      const day = new Date(r.createdAt).toISOString().split('T')[0];
      if (!byDay[day])
        byDay[day] = { requests: 0, bandwidth: 0, deploys: 0, builds: 0 };
      if (r.eventType === 'request') byDay[day].requests += r.value;
      if (r.eventType === 'bandwidth') byDay[day].bandwidth += r.value;
      if (r.eventType === 'deploy') byDay[day].deploys += r.value;
      if (r.eventType === 'build') byDay[day].builds += r.value;
    });

    res.json({
      success: true,
      usage: {
        period: { start: periodStart, end: periodEnd },
        byType,
        byDay: Object.entries(byDay)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        totalRecords: records.length,
      },
    });
  } catch (error) {
    console.error('[Hosting] Usage error:', error);
    res.status(500).json({ success: false, error: 'Failed to get usage data' });
  }
});

// ============================================
// 5. GET BILLING HISTORY
// ============================================
router.get('/billing/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // Get all GenCraft/hosting subscriptions
    const subscriptions = await prisma.agentSubscription.findMany({
      where: {
        userId,
        agentId: { in: ['gencraft-pro', 'app-hosting'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get hosting plan history
    const plans = await prisma.appHostingPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Total spent
    const totalSpent = subscriptions
      .filter((s) => s.status !== 'cancelled')
      .reduce((sum, s) => sum + s.price, 0);

    // Add plan costs
    const planCosts = plans
      .filter((p) => p.price > 0)
      .reduce((sum, p) => sum + p.price, 0);

    res.json({
      success: true,
      billing: {
        totalSpent: totalSpent + planCosts,
        subscriptions: subscriptions.map((s) => ({
          id: s.id,
          agentId: s.agentId,
          plan: s.plan,
          price: s.price,
          status: s.status,
          startDate: s.startDate,
          expiryDate: s.expiryDate,
          stripeSubscriptionId: s.stripeSubscriptionId,
        })),
        hostingPlans: plans.map((p) => ({
          id: p.id,
          tier: p.tier,
          price: p.price,
          billingCycle: p.billingCycle,
          status: p.status,
          startDate: p.startDate,
          expiryDate: p.expiryDate,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('[Hosting] Billing error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to get billing data' });
  }
});

// ============================================
// 6. CREATE HOSTING PLAN (direct / dev)
// ============================================
router.post('/plan', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { tier = 'free', billingCycle = 'monthly' } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: 'userId is required' });
    }

    const tierConfig = HOSTING_TIERS[tier];
    if (!tierConfig) {
      return res
        .status(400)
        .json({
          success: false,
          error: `Invalid tier: ${tier}. Options: ${Object.keys(HOSTING_TIERS).join(', ')}`,
        });
    }

    // Check if user already has an active plan
    const existing = await prisma.appHostingPlan.findFirst({
      where: { userId, status: 'active' },
    });

    if (existing && existing.tier === tier) {
      return res.status(409).json({
        success: false,
        error: 'You already have this plan active',
        plan: existing,
      });
    }

    // Cancel old plan if upgrading
    if (existing) {
      await prisma.appHostingPlan.update({
        where: { id: existing.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
    }

    // Calculate expiry
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    if (billingCycle === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    const price = tierConfig.price[billingCycle] || tierConfig.price.monthly;

    const plan = await prisma.appHostingPlan.create({
      data: {
        userId,
        tier,
        status: 'active',
        price,
        billingCycle,
        maxApps: tierConfig.maxApps,
        maxBandwidthMb: tierConfig.maxBandwidthMb,
        maxRequestsPerMonth: tierConfig.maxRequestsPerMonth,
        maxStorageMb: tierConfig.maxStorageMb,
        customDomain: tierConfig.customDomain,
        sslIncluded: tierConfig.sslIncluded,
        prioritySupport: tierConfig.prioritySupport,
        startDate,
        expiryDate: tier === 'free' ? null : expiryDate,
      },
    });

    res.status(201).json({
      success: true,
      message: `${tierConfig.name} plan activated`,
      plan,
    });
  } catch (error) {
    console.error('[Hosting] Create plan error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create hosting plan' });
  }
});

// ============================================
// 7. UPDATE PLAN (upgrade/downgrade)
// ============================================
router.put('/plan/:planId', requireAuth, async (req, res) => {
  try {
    const { planId } = req.params;
    const { tier, billingCycle } = req.body;

    const existing = await prisma.appHostingPlan.findUnique({
      where: { id: planId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const updateData = {};

    if (tier && HOSTING_TIERS[tier]) {
      const tierConfig = HOSTING_TIERS[tier];
      const cycle = billingCycle || existing.billingCycle;
      updateData.tier = tier;
      updateData.price = tierConfig.price[cycle] || tierConfig.price.monthly;
      updateData.maxApps = tierConfig.maxApps;
      updateData.maxBandwidthMb = tierConfig.maxBandwidthMb;
      updateData.maxRequestsPerMonth = tierConfig.maxRequestsPerMonth;
      updateData.maxStorageMb = tierConfig.maxStorageMb;
      updateData.customDomain = tierConfig.customDomain;
      updateData.prioritySupport = tierConfig.prioritySupport;
    }

    if (billingCycle) {
      updateData.billingCycle = billingCycle;
      const t = tier || existing.tier;
      if (HOSTING_TIERS[t]) {
        updateData.price =
          HOSTING_TIERS[t].price[billingCycle] ||
          HOSTING_TIERS[t].price.monthly;
      }
    }

    const updated = await prisma.appHostingPlan.update({
      where: { id: planId },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Plan updated successfully',
      plan: updated,
    });
  } catch (error) {
    console.error('[Hosting] Update plan error:', error);
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

// ============================================
// 8. CANCEL PLAN
// ============================================
// ============================================
// 8. CANCEL PLAN
// ============================================
router.delete('/plan/:planId', requireAuth, async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await prisma.appHostingPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Downgrade to free instead of deleting
    const freeTier = HOSTING_TIERS.free;
    const updated = await prisma.appHostingPlan.update({
      where: { id: planId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    // Create or reactivate the free plan (user may already have one from a prior cancellation)
    const freePlan = await prisma.appHostingPlan.upsert({
      where: { userId_tier: { userId: plan.userId, tier: 'free' } },
      update: {
        status: 'active',
        price: 0,
        billingCycle: 'monthly',
        maxApps: freeTier.maxApps,
        maxBandwidthMb: freeTier.maxBandwidthMb,
        maxRequestsPerMonth: freeTier.maxRequestsPerMonth,
        maxStorageMb: freeTier.maxStorageMb,
        customDomain: freeTier.customDomain,
        sslIncluded: freeTier.sslIncluded,
        prioritySupport: freeTier.prioritySupport,
        cancelledAt: null,
      },
      create: {
        userId: plan.userId,
        tier: 'free',
        status: 'active',
        price: 0,
        billingCycle: 'monthly',
        maxApps: freeTier.maxApps,
        maxBandwidthMb: freeTier.maxBandwidthMb,
        maxRequestsPerMonth: freeTier.maxRequestsPerMonth,
        maxStorageMb: freeTier.maxStorageMb,
        customDomain: freeTier.customDomain,
        sslIncluded: freeTier.sslIncluded,
        prioritySupport: freeTier.prioritySupport,
      },
    });

    res.json({
      success: true,
      message: 'Plan cancelled. Downgraded to Free tier.',
      cancelledPlan: updated,
      newPlan: freePlan,
    });
  } catch (error) {
    console.error('[Hosting] Cancel plan error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel plan' });
  }
});

// ============================================
// 9. STRIPE CHECKOUT FOR HOSTING
// ============================================
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      tier,
      billingCycle = 'monthly',
      email,
      successUrl,
      cancelUrl,
    } = req.body;

    if (!userId || !tier) {
      return res
        .status(400)
        .json({ success: false, error: 'userId and tier are required' });
    }

    const tierConfig = HOSTING_TIERS[tier];
    if (!tierConfig || tier === 'free') {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid tier for checkout' });
    }

    const stripeInstance = getStripe();
    if (!stripeInstance) {
      // Fallback: create plan directly without Stripe
      return res
        .status(400)
        .json({
          success: false,
          error:
            'Stripe not configured. Use POST /plan for direct plan creation.',
        });
    }

    const price = tierConfig.price[billingCycle] || tierConfig.price.monthly;
    const periodLabel = billingCycle === 'yearly' ? '1 year' : '1 month';

    const session = await stripeInstance.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `GenCraft ${tierConfig.name} — ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}`,
              description: `${periodLabel} of ${tierConfig.name} app hosting (${tierConfig.maxApps} apps, ${formatBytes(tierConfig.maxBandwidthMb)} bandwidth)`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      client_reference_id: userId,
      metadata: { userId, tier, billingCycle, type: 'app-hosting' },
      success_url:
        successUrl ||
        `${process.env.FRONTEND_URL || 'https://www.mumtaz.ai'}/dashboard/apps?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ||
        `${process.env.FRONTEND_URL || 'https://www.mumtaz.ai'}/dashboard/apps`,
      allow_promotion_codes: true,
    });

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('[Hosting] Checkout error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create checkout session' });
  }
});

// ============================================
// 10. VERIFY STRIPE SESSION
// ============================================
router.post('/verify-session', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, error: 'sessionId is required' });
    }

    const stripeInstance = getStripe();
    if (!stripeInstance) {
      return res
        .status(400)
        .json({ success: false, error: 'Stripe not configured' });
    }

    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res
        .status(400)
        .json({ success: false, error: 'Payment not completed' });
    }

    const { userId, tier, billingCycle } = session.metadata;
    const tierConfig = HOSTING_TIERS[tier];

    if (!tierConfig) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid tier in session metadata' });
    }

    // Cancel existing active plan
    await prisma.appHostingPlan.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    // Create new plan
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    if (billingCycle === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    const price = tierConfig.price[billingCycle] || tierConfig.price.monthly;

    const plan = await prisma.appHostingPlan.create({
      data: {
        userId,
        tier,
        status: 'active',
        price,
        billingCycle,
        maxApps: tierConfig.maxApps,
        maxBandwidthMb: tierConfig.maxBandwidthMb,
        maxRequestsPerMonth: tierConfig.maxRequestsPerMonth,
        maxStorageMb: tierConfig.maxStorageMb,
        customDomain: tierConfig.customDomain,
        sslIncluded: tierConfig.sslIncluded,
        prioritySupport: tierConfig.prioritySupport,
        stripeSubscriptionId: session.id,
        stripeCustomerId: session.customer,
        startDate,
        expiryDate,
      },
    });

    res.json({
      success: true,
      message: `${tierConfig.name} plan activated!`,
      plan,
    });
  } catch (error) {
    console.error('[Hosting] Verify session error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Session verification failed' });
  }
});

export default router;
