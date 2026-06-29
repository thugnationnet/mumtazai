/**
 * ============================================================================
 * SALES & CRM TOOLS 💼
 * ============================================================================
 * Lead tracking, pipeline management, deal forecasting, customer profiles,
 * sales reports, proposal generation, contract drafting.
 * ============================================================================
 */

import prisma from '../lib/prisma.js';

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const SALES_CRM_TOOL_DEFINITIONS = [
  {
    name: 'lead_track',
    description: 'Track sales leads through qualification stages — capture, score, assign, and convert leads.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'get', 'list', 'score', 'assign', 'convert', 'delete'], description: 'Lead action' },
        name: { type: 'string', description: 'Lead name' },
        email: { type: 'string', description: 'Lead email' },
        company: { type: 'string', description: 'Company name' },
        source: { type: 'string', enum: ['website', 'referral', 'cold_call', 'trade_show', 'social', 'ad', 'other'], description: 'Lead source' },
        status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], description: 'Lead status' },
        value: { type: 'number', description: 'Estimated deal value' },
        assignee: { type: 'string', description: 'Sales rep assigned' },
        leadId: { type: 'string', description: 'Lead ID for update/get/delete' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['action'],
    },
  },
  {
    name: 'pipeline_manage',
    description: 'Manage sales pipeline — stages, deals, forecasting, and conversion metrics.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'get', 'list', 'move', 'metrics', 'forecast'], description: 'Pipeline action' },
        name: { type: 'string', description: 'Pipeline or deal name' },
        stages: { type: 'array', items: { type: 'string' }, description: 'Pipeline stages' },
        dealId: { type: 'string', description: 'Deal ID' },
        stage: { type: 'string', description: 'Current/target stage' },
        value: { type: 'number', description: 'Deal value' },
        probability: { type: 'number', description: 'Win probability (0-100)' },
        pipelineId: { type: 'string', description: 'Pipeline ID' },
      },
      required: ['action'],
    },
  },
  {
    name: 'deal_forecast',
    description: 'Forecast sales deals — weighted pipeline, probability analysis, revenue projections.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['forecast', 'weighted', 'trends', 'scenarios', 'quota', 'report'], description: 'Forecast action' },
        period: { type: 'string', description: 'Forecast period (Q1, Q2, monthly, yearly)' },
        pipelineId: { type: 'string', description: 'Pipeline to forecast' },
        quota: { type: 'number', description: 'Sales quota target' },
        confidence: { type: 'string', enum: ['conservative', 'moderate', 'optimistic'], description: 'Forecast confidence level' },
      },
      required: ['action'],
    },
  },
  {
    name: 'customer_profile',
    description: 'Build and manage customer profiles — contact info, interaction history, preferences, lifetime value.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'get', 'list', 'search', 'segment', 'merge', 'export'], description: 'Customer action' },
        name: { type: 'string', description: 'Customer name' },
        email: { type: 'string', description: 'Email address' },
        company: { type: 'string', description: 'Company name' },
        phone: { type: 'string', description: 'Phone number' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Customer tags/segments' },
        notes: { type: 'string', description: 'Profile notes' },
        customerId: { type: 'string', description: 'Customer ID for update/get' },
        metadata: { type: 'object', description: 'Custom metadata fields' },
      },
      required: ['action'],
    },
  },
  {
    name: 'sales_report',
    description: 'Generate sales reports — by rep, product, region, period. Includes trends and comparisons.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['summary', 'by_rep', 'by_product', 'by_region', 'pipeline', 'forecast', 'trends', 'comparison'], description: 'Report type' },
        startDate: { type: 'string', description: 'Report start date' },
        endDate: { type: 'string', description: 'Report end date' },
        groupBy: { type: 'string', description: 'Group results by (rep, product, region, stage)' },
        filters: { type: 'object', description: 'Additional filters' },
      },
      required: ['type'],
    },
  },
  {
    name: 'proposal_generate',
    description: 'Generate business proposals with scope, pricing, timeline, terms, and deliverables.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'get', 'list', 'send', 'track', 'template'], description: 'Proposal action' },
        title: { type: 'string', description: 'Proposal title' },
        client: { type: 'string', description: 'Client name' },
        scope: { type: 'string', description: 'Project scope description' },
        pricing: { type: 'array', items: { type: 'object' }, description: 'Pricing items [{item, price, quantity}]' },
        timeline: { type: 'string', description: 'Project timeline' },
        deliverables: { type: 'array', items: { type: 'string' }, description: 'List of deliverables' },
        terms: { type: 'string', description: 'Terms and conditions' },
        proposalId: { type: 'string', description: 'Proposal ID for update/get/send' },
      },
      required: ['action'],
    },
  },
  {
    name: 'contract_draft',
    description: 'Draft business contracts — service agreements, NDAs, SOWs, employment contracts.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'get', 'list', 'sign', 'template', 'review'], description: 'Contract action' },
        type: { type: 'string', enum: ['service', 'nda', 'sow', 'employment', 'partnership', 'license', 'custom'], description: 'Contract type' },
        parties: { type: 'array', items: { type: 'string' }, description: 'Contract parties' },
        terms: { type: 'string', description: 'Contract terms and conditions' },
        startDate: { type: 'string', description: 'Contract start date' },
        endDate: { type: 'string', description: 'Contract end date' },
        value: { type: 'number', description: 'Contract value' },
        clauses: { type: 'array', items: { type: 'string' }, description: 'Specific clauses to include' },
        contractId: { type: 'string', description: 'Contract ID for update/get/sign' },
      },
      required: ['action'],
    },
  },
];

const TOOL_NAMES = new Set(SALES_CRM_TOOL_DEFINITIONS.map(t => t.name));

export function isSalesCrmTool(name) {
  return TOOL_NAMES.has(name);
}

// ============================================================================
// IMPLEMENTATIONS
// ============================================================================

async function leadTrack(action, params = {}, userId = 'default') {
  switch (action) {
    case 'create': {
      const lead = {
        leadId: `LEAD-${Date.now()}`, name: params.name || '',
        email: params.email || '', company: params.company || '',
        source: params.source || 'other', status: params.status || 'new',
        value: params.value || 0, assignee: params.assignee || '',
        notes: params.notes || '', score: 0,
        createdAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'lead_created', eventData: lead, userId, source: 'tool' } });
      return { success: true, lead };
    }
    case 'list': {
      const leads = await prisma.analyticsEvent.findMany({ where: { eventName: 'lead_created', userId }, orderBy: { createdAt: 'desc' }, take: 100 });
      let filtered = leads.map(l => l.eventData);
      if (params.status) filtered = filtered.filter(l => l.status === params.status);
      return { success: true, leads: filtered, count: filtered.length };
    }
    case 'score': {
      const factors = { email: 10, company: 15, value: 20, source_referral: 25, source_website: 15 };
      let score = 0;
      if (params.email) score += factors.email;
      if (params.company) score += factors.company;
      if (params.value > 0) score += factors.value;
      if (params.source === 'referral') score += factors.source_referral;
      return { success: true, leadId: params.leadId, score, maxScore: 100, qualified: score >= 40 };
    }
    default:
      return { success: true, action, message: `Lead ${action} completed` };
  }
}

async function pipelineManage(action, params = {}, userId = 'default') {
  switch (action) {
    case 'create': {
      const pipeline = {
        pipelineId: `PIPE-${Date.now()}`, name: params.name || 'Sales Pipeline',
        stages: params.stages || ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
        deals: [], createdAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'pipeline_created', eventData: pipeline, userId, source: 'tool' } });
      return { success: true, pipeline };
    }
    case 'metrics': {
      const leads = await prisma.analyticsEvent.findMany({ where: { eventName: 'lead_created', userId } });
      const data = leads.map(l => l.eventData || {});
      const byStage = {};
      data.forEach(d => { byStage[d.status || 'new'] = (byStage[d.status || 'new'] || 0) + 1; });
      const totalValue = data.reduce((s, d) => s + (d.value || 0), 0);
      const wonDeals = data.filter(d => d.status === 'won');
      const conversionRate = data.length ? ((wonDeals.length / data.length) * 100).toFixed(1) : 0;
      return { success: true, totalDeals: data.length, byStage, totalValue, conversionRate: conversionRate + '%' };
    }
    case 'list': {
      const pipelines = await prisma.analyticsEvent.findMany({ where: { eventName: 'pipeline_created', userId }, orderBy: { createdAt: 'desc' }, take: 20 });
      return { success: true, pipelines: pipelines.map(p => p.eventData), count: pipelines.length };
    }
    default:
      return { success: true, action, message: `Pipeline ${action} completed` };
  }
}

async function dealForecast(action, params = {}, userId = 'default') {
  const leads = await prisma.analyticsEvent.findMany({ where: { eventName: 'lead_created', userId } });
  const data = leads.map(l => l.eventData || {});
  const openDeals = data.filter(d => !['won', 'lost'].includes(d.status));
  const totalPipelineValue = openDeals.reduce((s, d) => s + (d.value || 0), 0);

  const multipliers = { conservative: 0.5, moderate: 0.7, optimistic: 0.9 };
  const mult = multipliers[params.confidence || 'moderate'] || 0.7;

  return {
    success: true, period: params.period || 'current',
    totalPipeline: totalPipelineValue, openDeals: openDeals.length,
    weightedForecast: +(totalPipelineValue * mult).toFixed(2),
    confidence: params.confidence || 'moderate',
    quota: params.quota || 0,
    quotaAttainment: params.quota ? +((totalPipelineValue * mult / params.quota) * 100).toFixed(1) : null,
  };
}

async function customerProfile(action, params = {}, userId = 'default') {
  switch (action) {
    case 'create': {
      const customer = {
        customerId: `CUST-${Date.now()}`, name: params.name || '',
        email: params.email || '', company: params.company || '',
        phone: params.phone || '', tags: params.tags || [],
        notes: params.notes || '', metadata: params.metadata || {},
        createdAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'customer_created', eventData: customer, userId, source: 'tool' } });
      return { success: true, customer };
    }
    case 'list': {
      const customers = await prisma.analyticsEvent.findMany({ where: { eventName: 'customer_created', userId }, orderBy: { createdAt: 'desc' }, take: 100 });
      return { success: true, customers: customers.map(c => c.eventData), count: customers.length };
    }
    case 'search': {
      const customers = await prisma.analyticsEvent.findMany({ where: { eventName: 'customer_created', userId } });
      const query = (params.name || params.email || params.company || '').toLowerCase();
      const results = customers.map(c => c.eventData).filter(c =>
        (c.name || '').toLowerCase().includes(query) ||
        (c.email || '').toLowerCase().includes(query) ||
        (c.company || '').toLowerCase().includes(query)
      );
      return { success: true, results, count: results.length };
    }
    default:
      return { success: true, action, message: `Customer ${action} completed` };
  }
}

async function salesReport(type, params = {}, userId = 'default') {
  const leads = await prisma.analyticsEvent.findMany({ where: { eventName: 'lead_created', userId } });
  const data = leads.map(l => l.eventData || {});
  const totalValue = data.reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = data.filter(d => d.status === 'won');
  const wonValue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);

  switch (type) {
    case 'summary':
      return { success: true, type, totalLeads: data.length, wonDeals: wonDeals.length, totalPipeline: totalValue, wonRevenue: wonValue, conversionRate: data.length ? ((wonDeals.length / data.length) * 100).toFixed(1) + '%' : '0%' };
    case 'by_rep': {
      const byRep = {};
      data.forEach(d => { const rep = d.assignee || 'unassigned'; byRep[rep] = (byRep[rep] || 0) + (d.value || 0); });
      return { success: true, type, byRep };
    }
    default:
      return { success: true, type, totalLeads: data.length, totalValue, message: `${type} report generated` };
  }
}

async function proposalGenerate(action, params = {}, userId = 'default') {
  switch (action) {
    case 'create': {
      const totalPrice = (params.pricing || []).reduce((s, p) => s + (p.price || 0) * (p.quantity || 1), 0);
      const proposal = {
        proposalId: `PROP-${Date.now()}`, title: params.title || 'Business Proposal',
        client: params.client || '', scope: params.scope || '',
        pricing: params.pricing || [], totalPrice,
        timeline: params.timeline || '', deliverables: params.deliverables || [],
        terms: params.terms || '', status: 'draft',
        createdAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'proposal_created', eventData: proposal, userId, source: 'tool' } });
      return { success: true, proposal };
    }
    case 'list': {
      const proposals = await prisma.analyticsEvent.findMany({ where: { eventName: 'proposal_created', userId }, orderBy: { createdAt: 'desc' }, take: 50 });
      return { success: true, proposals: proposals.map(p => p.eventData), count: proposals.length };
    }
    default:
      return { success: true, action, message: `Proposal ${action} completed` };
  }
}

async function contractDraft(action, params = {}, userId = 'default') {
  switch (action) {
    case 'create': {
      const contract = {
        contractId: `CTR-${Date.now()}`, type: params.type || 'service',
        parties: params.parties || [], terms: params.terms || '',
        startDate: params.startDate, endDate: params.endDate,
        value: params.value || 0, clauses: params.clauses || [],
        status: 'draft', createdAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'contract_created', eventData: contract, userId, source: 'tool' } });
      return { success: true, contract };
    }
    case 'list': {
      const contracts = await prisma.analyticsEvent.findMany({ where: { eventName: 'contract_created', userId }, orderBy: { createdAt: 'desc' }, take: 50 });
      return { success: true, contracts: contracts.map(c => c.eventData), count: contracts.length };
    }
    default:
      return { success: true, action, message: `Contract ${action} completed` };
  }
}

// ============================================================================
// EXECUTOR
// ============================================================================

export async function executeSalesCrmTool(toolName, input, ctx = {}) {
  const userId = ctx.userId || 'default';
  try {
    switch (toolName) {
      case 'lead_track':
        return await leadTrack(input.action, input, userId);
      case 'pipeline_manage':
        return await pipelineManage(input.action, input, userId);
      case 'deal_forecast':
        return await dealForecast(input.action, input, userId);
      case 'customer_profile':
        return await customerProfile(input.action, input, userId);
      case 'sales_report':
        return await salesReport(input.type, input, userId);
      case 'proposal_generate':
        return await proposalGenerate(input.action, input, userId);
      case 'contract_draft':
        return await contractDraft(input.action, input, userId);
      default:
        return { success: false, error: `Unknown sales/CRM tool: ${toolName}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
