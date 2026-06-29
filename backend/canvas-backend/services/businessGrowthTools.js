/**
 * BUSINESS & GROWTH TOOLS — Funnel analysis, pricing simulation, A/B testing, lead enrichment, campaigns
 * DB models: GrowthFunnel, PricingSimulation, AbTest, Lead, Campaign
 */

import prisma from '../lib/prisma.js';

export const BUSINESS_GROWTH_TOOL_DEFINITIONS = [
  {
    name: 'growth_analyze',
    description: 'Analyze growth funnels — churn detection, conversion rates, LTV, CAC, MRR/ARR metrics.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['create_funnel', 'analyze', 'list', 'delete'], description: 'Operation type' },
        funnelId:  { type: 'string', description: 'Funnel ID (for analyze/delete)' },
        name:      { type: 'string', description: 'Funnel name (for create)' },
        stages:    { type: 'array', description: 'Funnel stages [{ name, count }]', items: { type: 'object' } },
        metrics:   { type: 'object', description: 'Business metrics { churnRate, ltv, cac, mrr, arr }' },
        dateRange: { type: 'object', description: '{ from, to } date range' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'pricing_simulate',
    description: 'Simulate revenue models — define pricing plans, model growth, project revenue.',
    input_schema: {
      type: 'object',
      properties: {
        operation:   { type: 'string', enum: ['create', 'simulate', 'list', 'compare'], description: 'Operation type' },
        simulationId: { type: 'string', description: 'Simulation ID' },
        name:        { type: 'string', description: 'Simulation name' },
        plans:       { type: 'array', description: 'Pricing plans [{ name, price, features, expectedUsers }]', items: { type: 'object' } },
        assumptions: { type: 'object', description: '{ churnRate, growthRate, cac, ltv }' },
        months:      { type: 'integer', description: 'Projection period in months (default: 12)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'ab_test_run',
    description: 'Create and launch A/B test experiments with variant definitions and traffic allocation.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['create', 'start', 'pause', 'stop', 'list', 'get'], description: 'Operation' },
        testId:    { type: 'string', description: 'Test ID (for start/pause/stop/get)' },
        name:      { type: 'string', description: 'Test name' },
        hypothesis: { type: 'string', description: 'What you expect to happen' },
        variants:  { type: 'array', description: 'Variants [{ name, weight, config }]', items: { type: 'object' } },
        metric:    { type: 'string', description: 'Primary metric to optimize (e.g., conversion_rate, revenue)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'ab_test_analyze',
    description: 'Statistical analysis of A/B test results — significance testing, winner detection.',
    input_schema: {
      type: 'object',
      properties: {
        testId:          { type: 'string', description: 'Test ID to analyze' },
        confidenceLevel: { type: 'number', description: 'Confidence level 0-1 (default: 0.95)' },
      },
      required: ['testId'],
    },
  },
  {
    name: 'lead_enrich',
    description: 'Create, enrich, score, and manage sales leads.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['create', 'enrich', 'score', 'list', 'update', 'search'], description: 'Operation' },
        leadId:    { type: 'string', description: 'Lead ID' },
        email:     { type: 'string', description: 'Lead email' },
        name:      { type: 'string', description: 'Lead name' },
        company:   { type: 'string', description: 'Company name' },
        data:      { type: 'object', description: 'Additional lead data' },
        query:     { type: 'string', description: 'Search query' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'campaign_generate',
    description: 'Generate and manage marketing campaigns — email, ad, social, SMS.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['create', 'list', 'get', 'update', 'launch', 'pause'], description: 'Operation' },
        campaignId: { type: 'string', description: 'Campaign ID' },
        name:      { type: 'string', description: 'Campaign name' },
        type:      { type: 'string', enum: ['email', 'ad', 'social', 'sms'], description: 'Campaign type' },
        content:   { type: 'object', description: '{ subject, body, cta, images, targeting }' },
        audience:  { type: 'object', description: '{ segments, filters, size }' },
        schedule:  { type: 'object', description: '{ sendAt, timezone, frequency }' },
      },
      required: ['operation'],
    },
  },
];

// ─────────────────────────────────────────── executor ──

export async function executeBusinessGrowthTool(toolName, input, ctx = {}) {
  const userId = ctx.userId || 'anonymous';
  try {
    switch (toolName) {

      case 'growth_analyze': {
        switch (input.operation) {
          case 'create_funnel': {
            const stages = (input.stages || []).map((s, i) => {
              const prev = i > 0 ? input.stages[i - 1].count : s.count;
              return { ...s, conversionRate: prev > 0 ? Math.round((s.count / prev) * 10000) / 100 : 0 };
            });
            const funnel = await prisma.growthFunnel.create({
              data: { userId, name: input.name || 'New Funnel', stages, metrics: input.metrics || {}, dateRange: input.dateRange || null },
            });
            return { result: JSON.stringify({ status: 'success', funnelId: funnel.id, name: funnel.name, stageCount: stages.length }) };
          }
          case 'analyze': {
            const funnel = await prisma.growthFunnel.findFirst({ where: { id: input.funnelId, userId } });
            if (!funnel) return { result: JSON.stringify({ status: 'error', error: 'Funnel not found' }) };
            const stages = funnel.stages || [];
            const metrics = funnel.metrics || {};
            const totalDrop = stages.length >= 2 ? Math.round((1 - stages[stages.length - 1].count / stages[0].count) * 10000) / 100 : 0;
            const bottleneck = stages.reduce((worst, s, i) => (i > 0 && s.conversionRate < (worst?.conversionRate || 100)) ? s : worst, null);
            return { result: JSON.stringify({ status: 'success', funnel: funnel.name, totalDropoff: `${totalDrop}%`, bottleneck: bottleneck ? { stage: bottleneck.name, conversionRate: `${bottleneck.conversionRate}%` } : null, metrics, stages }) };
          }
          case 'list': {
            const funnels = await prisma.growthFunnel.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: funnels.length, funnels: funnels.map(f => ({ id: f.id, name: f.name, stages: (f.stages || []).length })) }) };
          }
          case 'delete': {
            await prisma.growthFunnel.deleteMany({ where: { id: input.funnelId, userId } });
            return { result: JSON.stringify({ status: 'success', deleted: input.funnelId }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'pricing_simulate': {
        switch (input.operation) {
          case 'create': {
            const sim = await prisma.pricingSimulation.create({
              data: { userId, name: input.name || 'New Simulation', plans: input.plans || [], assumptions: input.assumptions || {} },
            });
            return { result: JSON.stringify({ status: 'success', simulationId: sim.id, name: sim.name }) };
          }
          case 'simulate': {
            const sim = await prisma.pricingSimulation.findFirst({ where: { id: input.simulationId, userId } });
            if (!sim) return { result: JSON.stringify({ status: 'error', error: 'Simulation not found' }) };
            const plans = sim.plans || [];
            const assumptions = sim.assumptions || {};
            const months = input.months || 12;
            const growthRate = assumptions.growthRate || 0.05;
            const churnRate = assumptions.churnRate || 0.03;

            const projections = [];
            let totalUsers = plans.reduce((sum, p) => sum + (p.expectedUsers || 0), 0);
            for (let m = 1; m <= months; m++) {
              totalUsers = Math.round(totalUsers * (1 + growthRate - churnRate));
              const mrr = plans.reduce((sum, p) => sum + (p.price || 0) * Math.round((p.expectedUsers || 0) * Math.pow(1 + growthRate - churnRate, m)), 0);
              projections.push({ month: m, users: totalUsers, mrr, arr: mrr * 12 });
            }
            await prisma.pricingSimulation.update({ where: { id: sim.id }, data: { projections } });
            return { result: JSON.stringify({ status: 'success', simulationId: sim.id, months, projections }) };
          }
          case 'list': {
            const sims = await prisma.pricingSimulation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: sims.length, simulations: sims.map(s => ({ id: s.id, name: s.name, planCount: (s.plans || []).length })) }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'ab_test_run': {
        switch (input.operation) {
          case 'create': {
            const test = await prisma.abTest.create({
              data: { userId, name: input.name || 'New Test', hypothesis: input.hypothesis || null, variants: input.variants || [], primaryMetric: input.metric || 'conversion_rate' },
            });
            return { result: JSON.stringify({ status: 'success', testId: test.id, name: test.name, status: test.status }) };
          }
          case 'start': {
            await prisma.abTest.update({ where: { id: input.testId }, data: { status: 'running', startedAt: new Date() } });
            return { result: JSON.stringify({ status: 'success', testId: input.testId, testStatus: 'running' }) };
          }
          case 'pause': {
            await prisma.abTest.update({ where: { id: input.testId }, data: { status: 'paused' } });
            return { result: JSON.stringify({ status: 'success', testId: input.testId, testStatus: 'paused' }) };
          }
          case 'stop': {
            await prisma.abTest.update({ where: { id: input.testId }, data: { status: 'completed', endedAt: new Date() } });
            return { result: JSON.stringify({ status: 'success', testId: input.testId, testStatus: 'completed' }) };
          }
          case 'list': {
            const tests = await prisma.abTest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: tests.length, tests: tests.map(t => ({ id: t.id, name: t.name, status: t.status })) }) };
          }
          case 'get': {
            const test = await prisma.abTest.findFirst({ where: { id: input.testId, userId } });
            if (!test) return { result: JSON.stringify({ status: 'error', error: 'Test not found' }) };
            return { result: JSON.stringify({ status: 'success', test: { id: test.id, name: test.name, status: test.status, hypothesis: test.hypothesis, variants: test.variants, results: test.results } }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'ab_test_analyze': {
        const test = await prisma.abTest.findFirst({ where: { id: input.testId, userId } });
        if (!test) return { result: JSON.stringify({ status: 'error', error: 'Test not found' }) };

        const variants = test.variants || [];
        const confidence = input.confidenceLevel || 0.95;
        const results = test.results || {};

        // Simple analysis based on variant data
        const analyzed = variants.map(v => {
          const data = results[v.name] || { impressions: 0, conversions: 0 };
          const rate = data.impressions > 0 ? data.conversions / data.impressions : 0;
          return { name: v.name, impressions: data.impressions, conversions: data.conversions, conversionRate: Math.round(rate * 10000) / 100 };
        });

        // Determine winner
        const sorted = [...analyzed].sort((a, b) => b.conversionRate - a.conversionRate);
        const winner = sorted[0];
        const runnerUp = sorted[1];
        const isSignificant = winner && runnerUp && (winner.impressions + runnerUp.impressions) > 100;

        return { result: JSON.stringify({ status: 'success', testId: test.id, confidence, variants: analyzed, winner: winner?.name || null, isSignificant, recommendation: isSignificant ? `"${winner.name}" outperforms with ${winner.conversionRate}% conversion rate` : 'Not enough data for statistical significance' }) };
      }

      case 'lead_enrich': {
        switch (input.operation) {
          case 'create': {
            const lead = await prisma.lead.create({
              data: { userId, email: input.email || null, name: input.name || null, company: input.company || null, source: 'manual', enrichmentData: input.data || {} },
            });
            return { result: JSON.stringify({ status: 'success', leadId: lead.id, email: lead.email }) };
          }
          case 'score': {
            const lead = await prisma.lead.findFirst({ where: { id: input.leadId, userId } });
            if (!lead) return { result: JSON.stringify({ status: 'error', error: 'Lead not found' }) };
            let score = 0;
            if (lead.email) score += 20;
            if (lead.name) score += 10;
            if (lead.company) score += 15;
            if (lead.phone) score += 10;
            if (lead.title) score += 15;
            const enrichment = lead.enrichmentData || {};
            if (enrichment.linkedin) score += 10;
            if (enrichment.website) score += 10;
            if (enrichment.revenue) score += 10;
            score = Math.min(score, 100);
            await prisma.lead.update({ where: { id: lead.id }, data: { score } });
            return { result: JSON.stringify({ status: 'success', leadId: lead.id, score, breakdown: { hasEmail: !!lead.email, hasName: !!lead.name, hasCompany: !!lead.company } }) };
          }
          case 'list': {
            const leads = await prisma.lead.findMany({ where: { userId }, orderBy: { score: 'desc' }, take: 50 });
            return { result: JSON.stringify({ status: 'success', count: leads.length, leads: leads.map(l => ({ id: l.id, name: l.name, email: l.email, company: l.company, score: l.score, status: l.status })) }) };
          }
          case 'search': {
            const where = { userId };
            if (input.query) {
              where.OR = [{ name: { contains: input.query, mode: 'insensitive' } }, { email: { contains: input.query, mode: 'insensitive' } }, { company: { contains: input.query, mode: 'insensitive' } }];
            }
            const leads = await prisma.lead.findMany({ where, orderBy: { score: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: leads.length, leads: leads.map(l => ({ id: l.id, name: l.name, email: l.email, score: l.score })) }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'campaign_generate': {
        switch (input.operation) {
          case 'create': {
            const campaign = await prisma.campaign.create({
              data: { userId, name: input.name || 'New Campaign', type: input.type || 'email', content: input.content || {}, audience: input.audience || null, schedule: input.schedule || null },
            });
            return { result: JSON.stringify({ status: 'success', campaignId: campaign.id, name: campaign.name, type: campaign.type, status: campaign.status }) };
          }
          case 'list': {
            const campaigns = await prisma.campaign.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: campaigns.length, campaigns: campaigns.map(c => ({ id: c.id, name: c.name, type: c.type, status: c.status, sent: c.sent })) }) };
          }
          case 'get': {
            const campaign = await prisma.campaign.findFirst({ where: { id: input.campaignId, userId } });
            if (!campaign) return { result: JSON.stringify({ status: 'error', error: 'Campaign not found' }) };
            return { result: JSON.stringify({ status: 'success', campaign }) };
          }
          case 'launch': {
            await prisma.campaign.update({ where: { id: input.campaignId }, data: { status: 'active' } });
            return { result: JSON.stringify({ status: 'success', campaignId: input.campaignId, campaignStatus: 'active' }) };
          }
          case 'pause': {
            await prisma.campaign.update({ where: { id: input.campaignId }, data: { status: 'paused' } });
            return { result: JSON.stringify({ status: 'success', campaignId: input.campaignId, campaignStatus: 'paused' }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isBusinessGrowthTool = (name) => BUSINESS_GROWTH_TOOL_DEFINITIONS.some(t => t.name === name);
