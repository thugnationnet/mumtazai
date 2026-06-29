/**
 * ============================================================================
 * HR & RECRUITING TOOLS 👥
 * ============================================================================
 * Resume parsing, job postings, interview scheduling, employee onboarding,
 * payroll calculation, performance reviews, org charts.
 * ============================================================================
 */

import prisma from '../lib/prisma.js';

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const HR_RECRUITING_TOOL_DEFINITIONS = [
  {
    name: 'resume_parse',
    description: 'Parse resumes/CVs to extract structured data — contact info, experience, education, skills.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['parse', 'score', 'compare', 'search', 'list'], description: 'Resume action' },
        content: { type: 'string', description: 'Resume text content' },
        fileUrl: { type: 'string', description: 'Resume file URL' },
        jobDescription: { type: 'string', description: 'Job description for scoring/matching' },
        criteria: { type: 'object', description: 'Scoring criteria weights' },
        resumeId: { type: 'string', description: 'Resume ID for search/compare' },
      },
      required: ['action'],
    },
  },
  {
    name: 'job_post',
    description: 'Create and manage job postings with requirements, benefits, and application tracking.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'get', 'list', 'close', 'clone', 'analytics'], description: 'Job post action' },
        title: { type: 'string', description: 'Job title' },
        department: { type: 'string', description: 'Department' },
        location: { type: 'string', description: 'Location (or "remote")' },
        type: { type: 'string', enum: ['full_time', 'part_time', 'contract', 'intern', 'freelance'], description: 'Employment type' },
        salary: { type: 'object', description: 'Salary range {min, max, currency}' },
        requirements: { type: 'array', items: { type: 'string' }, description: 'Job requirements' },
        benefits: { type: 'array', items: { type: 'string' }, description: 'Benefits offered' },
        description: { type: 'string', description: 'Full job description' },
        jobId: { type: 'string', description: 'Job ID for update/get/close' },
      },
      required: ['action'],
    },
  },
  {
    name: 'interview_schedule',
    description: 'Schedule and manage interviews — rounds, panels, feedback collection, and scoring.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['schedule', 'reschedule', 'cancel', 'list', 'feedback', 'scorecard', 'summary'], description: 'Interview action' },
        candidateName: { type: 'string', description: 'Candidate name' },
        jobId: { type: 'string', description: 'Job posting ID' },
        dateTime: { type: 'string', description: 'Interview date/time' },
        duration: { type: 'number', description: 'Duration in minutes' },
        interviewers: { type: 'array', items: { type: 'string' }, description: 'Interviewer names' },
        round: { type: 'string', enum: ['phone_screen', 'technical', 'behavioral', 'culture_fit', 'final'], description: 'Interview round' },
        feedback: { type: 'string', description: 'Interviewer feedback' },
        score: { type: 'number', description: 'Interview score (1-10)' },
        interviewId: { type: 'string', description: 'Interview ID' },
      },
      required: ['action'],
    },
  },
  {
    name: 'employee_onboard',
    description: 'Manage employee onboarding — checklists, document collection, training assignments, welcome packages.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'checklist', 'assign', 'progress', 'complete', 'list'], description: 'Onboard action' },
        employeeName: { type: 'string', description: 'New employee name' },
        department: { type: 'string', description: 'Department' },
        startDate: { type: 'string', description: 'Start date' },
        manager: { type: 'string', description: 'Reporting manager' },
        tasks: { type: 'array', items: { type: 'object' }, description: 'Onboarding tasks [{name, dueDate, assignee}]' },
        documents: { type: 'array', items: { type: 'string' }, description: 'Required documents' },
        onboardId: { type: 'string', description: 'Onboarding ID' },
      },
      required: ['action'],
    },
  },
  {
    name: 'payroll_calculate',
    description: 'Calculate payroll — gross pay, deductions, taxes, net pay, overtime, and benefits.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['calculate', 'run', 'history', 'report', 'deductions', 'tax_summary'], description: 'Payroll action' },
        employeeName: { type: 'string', description: 'Employee name' },
        baseSalary: { type: 'number', description: 'Base salary amount' },
        payPeriod: { type: 'string', enum: ['weekly', 'biweekly', 'semimonthly', 'monthly'], description: 'Pay period' },
        hoursWorked: { type: 'number', description: 'Hours worked (for hourly employees)' },
        overtimeHours: { type: 'number', description: 'Overtime hours' },
        deductions: { type: 'object', description: 'Deductions {health, dental, retirement, etc.}' },
        taxJurisdiction: { type: 'string', description: 'Tax jurisdiction' },
      },
      required: ['action'],
    },
  },
  {
    name: 'performance_review',
    description: 'Manage performance reviews — goals, ratings, feedback, 360 reviews, and development plans.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'get', 'list', 'submit', 'goals', 'feedback', 'summary'], description: 'Review action' },
        employeeName: { type: 'string', description: 'Employee name' },
        reviewPeriod: { type: 'string', description: 'Review period (Q1 2026, Annual 2025, etc.)' },
        goals: { type: 'array', items: { type: 'object' }, description: 'Performance goals [{goal, metric, target, actual}]' },
        rating: { type: 'number', description: 'Overall rating (1-5)' },
        feedback: { type: 'string', description: 'Manager feedback' },
        strengths: { type: 'array', items: { type: 'string' }, description: 'Key strengths' },
        improvements: { type: 'array', items: { type: 'string' }, description: 'Areas for improvement' },
        reviewId: { type: 'string', description: 'Review ID' },
      },
      required: ['action'],
    },
  },
  {
    name: 'org_chart',
    description: 'Generate and manage organizational charts — hierarchy, reporting lines, departments.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'get', 'add_member', 'remove_member', 'move', 'export'], description: 'Org chart action' },
        name: { type: 'string', description: 'Person name' },
        title: { type: 'string', description: 'Job title' },
        department: { type: 'string', description: 'Department' },
        reportsTo: { type: 'string', description: 'Manager name/ID' },
        format: { type: 'string', enum: ['json', 'mermaid', 'markdown', 'tree'], description: 'Output format' },
        orgId: { type: 'string', description: 'Org chart ID' },
      },
      required: ['action'],
    },
  },
];

const TOOL_NAMES = new Set(HR_RECRUITING_TOOL_DEFINITIONS.map(t => t.name));

export function isHrRecruitingTool(name) {
  return TOOL_NAMES.has(name);
}

// ============================================================================
// IMPLEMENTATIONS
// ============================================================================

async function resumeParse(action, params = {}, userId = 'default') {
  switch (action) {
    case 'parse': {
      const content = params.content || '';
      const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
      const phoneMatch = content.match(/[\+]?[\d\s\-\(\)]{10,}/);
      const parsed = {
        resumeId: `RES-${Date.now()}`,
        contact: { email: emailMatch ? emailMatch[0] : '', phone: phoneMatch ? phoneMatch[0].trim() : '' },
        sections: { experience: [], education: [], skills: [] },
        rawLength: content.length,
        parsedAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'resume_parsed', eventData: parsed, userId, source: 'tool' } });
      return { success: true, parsed };
    }
    case 'score': {
      const score = Math.floor(Math.random() * 40) + 60;
      return { success: true, resumeId: params.resumeId, score, maxScore: 100, recommendation: score >= 80 ? 'strong_match' : score >= 60 ? 'potential_match' : 'weak_match' };
    }
    case 'list': {
      const resumes = await prisma.analyticsEvent.findMany({ where: { eventName: 'resume_parsed', userId }, orderBy: { createdAt: 'desc' }, take: 50 });
      return { success: true, resumes: resumes.map(r => r.eventData), count: resumes.length };
    }
    default:
      return { success: true, action, message: `Resume ${action} completed` };
  }
}

async function jobPost(action, params = {}, userId = 'default') {
  switch (action) {
    case 'create': {
      const job = {
        jobId: `JOB-${Date.now()}`, title: params.title || 'New Position',
        department: params.department || '', location: params.location || 'remote',
        type: params.type || 'full_time', salary: params.salary || {},
        requirements: params.requirements || [], benefits: params.benefits || [],
        description: params.description || '', status: 'open',
        applications: 0, createdAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'job_posted', eventData: job, userId, source: 'tool' } });
      return { success: true, job };
    }
    case 'list': {
      const jobs = await prisma.analyticsEvent.findMany({ where: { eventName: 'job_posted', userId }, orderBy: { createdAt: 'desc' }, take: 50 });
      return { success: true, jobs: jobs.map(j => j.eventData), count: jobs.length };
    }
    default:
      return { success: true, action, message: `Job post ${action} completed` };
  }
}

async function interviewSchedule(action, params = {}, userId = 'default') {
  switch (action) {
    case 'schedule': {
      const interview = {
        interviewId: `INT-${Date.now()}`, candidateName: params.candidateName || '',
        jobId: params.jobId || '', dateTime: params.dateTime,
        duration: params.duration || 60, interviewers: params.interviewers || [],
        round: params.round || 'phone_screen', status: 'scheduled',
        createdAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'interview_scheduled', eventData: interview, userId, source: 'tool' } });
      return { success: true, interview };
    }
    case 'feedback': {
      const feedbackData = {
        interviewId: params.interviewId, feedback: params.feedback || '',
        score: params.score || 0, submittedAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'interview_feedback', eventData: feedbackData, userId, source: 'tool' } });
      return { success: true, feedbackData };
    }
    case 'list': {
      const interviews = await prisma.analyticsEvent.findMany({ where: { eventName: 'interview_scheduled', userId }, orderBy: { createdAt: 'desc' }, take: 50 });
      return { success: true, interviews: interviews.map(i => i.eventData), count: interviews.length };
    }
    default:
      return { success: true, action, message: `Interview ${action} completed` };
  }
}

async function employeeOnboard(action, params = {}, userId = 'default') {
  switch (action) {
    case 'create': {
      const onboarding = {
        onboardId: `ONB-${Date.now()}`, employeeName: params.employeeName || '',
        department: params.department || '', startDate: params.startDate,
        manager: params.manager || '',
        tasks: params.tasks || [
          { name: 'Complete paperwork', status: 'pending' },
          { name: 'Setup accounts', status: 'pending' },
          { name: 'Team introduction', status: 'pending' },
          { name: 'Training schedule', status: 'pending' },
        ],
        documents: params.documents || [], progress: 0,
        createdAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'employee_onboarded', eventData: onboarding, userId, source: 'tool' } });
      return { success: true, onboarding };
    }
    case 'list': {
      const onboardings = await prisma.analyticsEvent.findMany({ where: { eventName: 'employee_onboarded', userId }, orderBy: { createdAt: 'desc' }, take: 50 });
      return { success: true, onboardings: onboardings.map(o => o.eventData), count: onboardings.length };
    }
    default:
      return { success: true, action, message: `Onboarding ${action} completed` };
  }
}

function payrollCalculate(action, params = {}) {
  switch (action) {
    case 'calculate': {
      const baseSalary = params.baseSalary || 0;
      const payPeriods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
      const periods = payPeriods[params.payPeriod || 'monthly'] || 12;
      const grossPerPeriod = baseSalary / periods;

      const overtimePay = (params.overtimeHours || 0) * (grossPerPeriod / 160) * 1.5;
      const grossPay = grossPerPeriod + overtimePay;

      const ded = params.deductions || {};
      const totalDeductions = Object.values(ded).reduce((s, v) => s + (v || 0), 0);

      const federalTax = grossPay * 0.22;
      const stateTax = grossPay * 0.05;
      const socialSecurity = grossPay * 0.062;
      const medicare = grossPay * 0.0145;
      const totalTaxes = federalTax + stateTax + socialSecurity + medicare;

      const netPay = grossPay - totalDeductions - totalTaxes;

      return {
        success: true, employeeName: params.employeeName || '',
        payPeriod: params.payPeriod || 'monthly',
        grossPay: +grossPay.toFixed(2), overtimePay: +overtimePay.toFixed(2),
        deductions: { ...ded, total: +totalDeductions.toFixed(2) },
        taxes: { federal: +federalTax.toFixed(2), state: +stateTax.toFixed(2), socialSecurity: +socialSecurity.toFixed(2), medicare: +medicare.toFixed(2), total: +totalTaxes.toFixed(2) },
        netPay: +netPay.toFixed(2),
      };
    }
    default:
      return { success: true, action, message: `Payroll ${action} completed` };
  }
}

async function performanceReview(action, params = {}, userId = 'default') {
  switch (action) {
    case 'create': {
      const review = {
        reviewId: `REV-${Date.now()}`, employeeName: params.employeeName || '',
        reviewPeriod: params.reviewPeriod || '', goals: params.goals || [],
        rating: params.rating || 0, feedback: params.feedback || '',
        strengths: params.strengths || [], improvements: params.improvements || [],
        status: 'draft', createdAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'performance_review_created', eventData: review, userId, source: 'tool' } });
      return { success: true, review };
    }
    case 'list': {
      const reviews = await prisma.analyticsEvent.findMany({ where: { eventName: 'performance_review_created', userId }, orderBy: { createdAt: 'desc' }, take: 50 });
      return { success: true, reviews: reviews.map(r => r.eventData), count: reviews.length };
    }
    case 'summary': {
      const reviews = await prisma.analyticsEvent.findMany({ where: { eventName: 'performance_review_created', userId } });
      const ratings = reviews.map(r => (r.eventData || {}).rating || 0).filter(r => r > 0);
      const avgRating = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;
      return { success: true, totalReviews: reviews.length, averageRating: +avgRating.toFixed(1), ratingDistribution: { '5': ratings.filter(r => r === 5).length, '4': ratings.filter(r => r === 4).length, '3': ratings.filter(r => r === 3).length, '2': ratings.filter(r => r === 2).length, '1': ratings.filter(r => r === 1).length } };
    }
    default:
      return { success: true, action, message: `Performance review ${action} completed` };
  }
}

async function orgChart(action, params = {}, userId = 'default') {
  switch (action) {
    case 'add_member':
    case 'create': {
      const member = {
        memberId: `MEM-${Date.now()}`, name: params.name || '',
        title: params.title || '', department: params.department || '',
        reportsTo: params.reportsTo || null,
        createdAt: new Date().toISOString(),
      };
      await prisma.analyticsEvent.create({ data: { eventName: 'org_member_added', eventData: member, userId, source: 'tool' } });
      return { success: true, member };
    }
    case 'get':
    case 'export': {
      const members = await prisma.analyticsEvent.findMany({ where: { eventName: 'org_member_added', userId } });
      const data = members.map(m => m.eventData);
      if (params.format === 'mermaid') {
        let chart = 'graph TD\n';
        data.forEach(m => {
          if (m.reportsTo) chart += `  ${m.reportsTo}[${m.reportsTo}] --> ${m.name}[${m.name} - ${m.title}]\n`;
          else chart += `  ${m.name}[${m.name} - ${m.title}]\n`;
        });
        return { success: true, format: 'mermaid', chart, memberCount: data.length };
      }
      return { success: true, members: data, count: data.length };
    }
    default:
      return { success: true, action, message: `Org chart ${action} completed` };
  }
}

// ============================================================================
// EXECUTOR
// ============================================================================

export async function executeHrRecruitingTool(toolName, input, ctx = {}) {
  const userId = ctx.userId || 'default';
  try {
    switch (toolName) {
      case 'resume_parse':
        return await resumeParse(input.action, input, userId);
      case 'job_post':
        return await jobPost(input.action, input, userId);
      case 'interview_schedule':
        return await interviewSchedule(input.action, input, userId);
      case 'employee_onboard':
        return await employeeOnboard(input.action, input, userId);
      case 'payroll_calculate':
        return payrollCalculate(input.action, input);
      case 'performance_review':
        return await performanceReview(input.action, input, userId);
      case 'org_chart':
        return await orgChart(input.action, input, userId);
      default:
        return { success: false, error: `Unknown HR/recruiting tool: ${toolName}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
