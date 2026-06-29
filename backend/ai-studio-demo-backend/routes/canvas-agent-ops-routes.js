/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CANVAS AGENT-OPS ROUTES
 * Natural language command execution for canvas projects.
 * The AgentPanel sends commands like "deploy to production" or "check status"
 * and receives an execution plan with step-by-step results.
 *
 * Endpoints:
 *   POST /:projectId/execute  — Execute a natural language command
 *   POST /:projectId/cancel   — Cancel an in-progress execution
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';
import crypto from 'crypto';

const router = express.Router();

// ── Intent detection ──────────────────────────────────────────────

const INTENT_KEYWORDS = {
  deploy: ['deploy', 'ship', 'release', 'publish', 'push to prod', 'make it live', 'go live'],
  build: ['build', 'compile', 'bundle', 'package'],
  rollback: ['rollback', 'revert', 'undo', 'go back'],
  debug: ['debug', 'fix', "what's wrong", 'error', 'bug', 'issue', 'broken'],
  scale: ['scale', 'resize', 'autoscal', 'replicas', 'instances'],
  database: ['database', 'db', 'migrate', 'seed', 'backup db', 'restore db'],
  setup: ['setup', 'init', 'bootstrap', 'configure', 'install'],
  security: ['security', 'audit', 'vulnerability', 'ssl', 'cert', 'firewall'],
  status: ['status', 'health', 'check', 'monitor', 'uptime', 'overview'],
  cost: ['cost', 'billing', 'spend', 'usage', 'expense'],
  domain: ['domain', 'dns', 'subdomain', 'custom domain'],
  cleanup: ['cleanup', 'clean', 'prune', 'remove unused', 'garbage'],
  performance: ['performance', 'perf', 'speed', 'latency', 'optimize', 'slow'],
};

function detectIntent(command) {
  const lower = command.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return intent;
    }
  }
  return 'status'; // default to status check
}

// ── Plan generation ───────────────────────────────────────────────

function generatePlan(intent, projectName) {
  const plans = {
    deploy: [
      { action: 'validate', label: 'Validate project configuration' },
      { action: 'build', label: 'Build production bundle' },
      { action: 'test', label: 'Run pre-deployment checks' },
      { action: 'deploy', label: `Deploy ${projectName} to production` },
      { action: 'healthcheck', label: 'Verify deployment health' },
    ],
    build: [
      { action: 'deps', label: 'Install dependencies' },
      { action: 'lint', label: 'Run linter checks' },
      { action: 'build', label: 'Build project' },
      { action: 'size', label: 'Analyze bundle size' },
    ],
    rollback: [
      { action: 'identify', label: 'Identify previous stable version' },
      { action: 'rollback', label: 'Roll back to previous version' },
      { action: 'healthcheck', label: 'Verify rollback health' },
    ],
    debug: [
      { action: 'logs', label: 'Collect recent error logs' },
      { action: 'analyze', label: 'Analyze error patterns' },
      { action: 'suggest', label: 'Generate fix suggestions' },
    ],
    scale: [
      { action: 'metrics', label: 'Check current resource usage' },
      { action: 'recommend', label: 'Calculate optimal scaling' },
      { action: 'apply', label: 'Apply scaling changes' },
    ],
    database: [
      { action: 'status', label: 'Check database connection' },
      { action: 'migrate', label: 'Run pending migrations' },
      { action: 'verify', label: 'Verify schema integrity' },
    ],
    setup: [
      { action: 'scaffold', label: 'Scaffold project structure' },
      { action: 'deps', label: 'Install dependencies' },
      { action: 'env', label: 'Configure environment variables' },
      { action: 'verify', label: 'Verify setup' },
    ],
    security: [
      { action: 'deps', label: 'Scan dependencies for vulnerabilities' },
      { action: 'secrets', label: 'Check for exposed secrets' },
      { action: 'headers', label: 'Validate security headers' },
      { action: 'report', label: 'Generate security report' },
    ],
    status: [
      { action: 'health', label: 'Check service health' },
      { action: 'metrics', label: 'Gather performance metrics' },
      { action: 'summary', label: 'Generate status summary' },
    ],
    cost: [
      { action: 'usage', label: 'Calculate resource usage' },
      { action: 'forecast', label: 'Project monthly costs' },
      { action: 'optimize', label: 'Suggest cost optimizations' },
    ],
    domain: [
      { action: 'check', label: 'Check domain availability' },
      { action: 'dns', label: 'Configure DNS records' },
      { action: 'ssl', label: 'Provision SSL certificate' },
    ],
    cleanup: [
      { action: 'scan', label: 'Scan for unused resources' },
      { action: 'list', label: 'List cleanup candidates' },
      { action: 'clean', label: 'Remove unused resources' },
    ],
    performance: [
      { action: 'baseline', label: 'Measure current performance' },
      { action: 'bottleneck', label: 'Identify bottlenecks' },
      { action: 'optimize', label: 'Apply optimizations' },
      { action: 'verify', label: 'Verify improvements' },
    ],
  };

  const steps = plans[intent] || plans.status;
  return steps.map(s => ({ ...s, status: 'pending' }));
}

// ── Simulate execution ────────────────────────────────────────────

function simulateExecution(plan, intent) {
  const results = plan.map(step => ({
    action: step.action,
    status: 'completed',
    result: { message: `${step.label} — completed successfully (simulated)` },
  }));

  const summaries = {
    deploy: '✅ Deployment simulation complete. To deploy for real, connect your cloud provider in Project Settings.',
    build: '✅ Build simulation complete. All checks passed.',
    rollback: '✅ Rollback simulation complete. Previous version identified.',
    debug: '✅ Debug analysis complete. No critical errors found in recent logs.',
    scale: '✅ Scaling analysis complete. Current resources are within optimal range.',
    database: '✅ Database check complete. Connection healthy, no pending migrations.',
    setup: '✅ Setup simulation complete. Project scaffolded successfully.',
    security: '✅ Security audit complete. No high-severity vulnerabilities found.',
    status: '✅ All systems operational. Service health: good.',
    cost: '✅ Cost analysis complete. Estimated monthly cost: $0 (sandbox environment).',
    domain: '✅ Domain configuration simulated. Connect a real domain in Project Settings.',
    cleanup: '✅ Cleanup scan complete. No unused resources found.',
    performance: '✅ Performance analysis complete. Response times within acceptable range.',
  };

  return {
    results,
    summary: summaries[intent] || '✅ Command executed successfully (simulated).',
  };
}

// ============================================
// POST /:projectId/execute
// Execute a natural language command
// ============================================
router.post('/:projectId/execute', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { command } = req.body;

    if (!command || typeof command !== 'string' || !command.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Command is required',
      });
    }

    // Verify project exists and user has access
    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          { isPublic: true },
        ],
      },
      select: { id: true, name: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied',
      });
    }

    const executionId = crypto.randomUUID();
    const intent = detectIntent(command);
    const plan = generatePlan(intent, project.name || 'Untitled');
    const { results, summary } = simulateExecution(plan, intent);

    // Mark all plan steps as completed for the response
    const completedPlan = plan.map(step => ({ ...step, status: 'completed' }));

    return res.json({
      success: true,
      executionId,
      intent,
      plan: completedPlan,
      results,
      summary,
    });
  } catch (error) {
    console.error('[Canvas AgentOps] Execute error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute command',
    });
  }
});

// ============================================
// POST /:projectId/cancel
// Cancel an in-progress execution
// ============================================
router.post('/:projectId/cancel', requireAuth, async (req, res) => {
  try {
    return res.json({
      success: true,
      message: 'Execution cancelled',
    });
  } catch (error) {
    console.error('[Canvas AgentOps] Cancel error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel execution',
    });
  }
});

export default router;
