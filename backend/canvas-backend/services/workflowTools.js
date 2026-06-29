/**
 * WORKFLOW TOOLS — Create, execute, schedule, visualize, optimize multi-step pipelines
 * DB models: Workflow, WorkflowRun, WorkflowPipeline, WorkflowPipelineRun, ScheduledJob
 */

import prisma from '../lib/prisma.js';

export const WORKFLOW_TOOL_DEFINITIONS = [
  {
    name: 'workflow_create',
    description: 'Create a multi-step workflow pipeline with conditional/parallel steps.',
    input_schema: {
      type: 'object',
      properties: {
        name:        { type: 'string', description: 'Workflow name' },
        description: { type: 'string', description: 'What this workflow does' },
        steps:       { type: 'array', description: 'Array of step definitions [{ id, tool, input, dependsOn?, condition? }]', items: { type: 'object' } },
        trigger:     { type: 'string', enum: ['manual', 'cron', 'event'], description: 'How the workflow is triggered (default: manual)' },
        cronExpr:    { type: 'string', description: 'Cron expression (if trigger=cron), e.g. "0 9 * * 1"' },
      },
      required: ['name', 'steps'],
    },
  },
  {
    name: 'workflow_execute',
    description: 'Run a saved workflow with optional input data. Returns run status and step results.',
    input_schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID to execute' },
        inputData:  { type: 'object', description: 'Input data to pass to the workflow' },
        dryRun:     { type: 'boolean', description: 'If true, validate without executing' },
      },
      required: ['workflowId'],
    },
  },
  {
    name: 'workflow_schedule',
    description: 'Schedule a workflow to run on a cron or event-based trigger.',
    input_schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID to schedule' },
        schedule:   { type: 'string', enum: ['cron', 'one_time', 'recurring', 'event'], description: 'Schedule type' },
        cronExpr:   { type: 'string', description: 'Cron expression for recurring jobs' },
        runAt:      { type: 'string', description: 'ISO timestamp for one-time execution' },
        eventType:  { type: 'string', description: 'Event name to listen for (event trigger)' },
        enabled:    { type: 'boolean', description: 'Enable/disable the schedule (default: true)' },
      },
      required: ['workflowId', 'schedule'],
    },
  },
  {
    name: 'workflow_visualize',
    description: 'Generate a DAG visualization of a workflow\'s tool chain (Mermaid/JSON).',
    input_schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID to visualize' },
        format:     { type: 'string', enum: ['mermaid', 'json', 'ascii'], description: 'Output format (default: mermaid)' },
      },
      required: ['workflowId'],
    },
  },
  {
    name: 'workflow_optimize',
    description: 'Analyze a workflow and suggest optimizations (parallelism, caching, cheaper tools).',
    input_schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID to optimize' },
      },
      required: ['workflowId'],
    },
  },
];

// ─────────────────────────────────────────── executor ──

export async function executeWorkflowTool(toolName, input, ctx = {}) {
  const userId = ctx.userId || 'anonymous';
  try {
    switch (toolName) {

      case 'workflow_create': {
        const wf = await prisma.workflow.create({
          data: {
            userId,
            name: input.name,
            description: input.description || null,
            steps: input.steps || [],
            trigger: input.trigger || 'manual',
            cronExpr: input.cronExpr || null,
            status: 'active',
          },
        });
        return { result: JSON.stringify({ status: 'success', workflowId: wf.id, name: wf.name, stepCount: (input.steps || []).length }) };
      }

      case 'workflow_execute': {
        const wf = await prisma.workflow.findFirst({ where: { id: input.workflowId, userId } });
        if (!wf) return { result: JSON.stringify({ status: 'error', error: 'Workflow not found' }) };

        if (input.dryRun) {
          const steps = wf.steps || [];
          return { result: JSON.stringify({ status: 'success', dryRun: true, stepCount: steps.length, steps: steps.map((s, i) => ({ order: i + 1, id: s.id, tool: s.tool })) }) };
        }

        // Create a run record
        const runCount = await prisma.workflowRun.count({ where: { workflowId: wf.id } });
        const run = await prisma.workflowRun.create({
          data: {
            workflowId: wf.id,
            runNumber: runCount + 1,
            inputData: input.inputData || {},
            status: 'running',
          },
        });

        // Execute steps sequentially (simplified — real impl would support parallel/conditional)
        const steps = wf.steps || [];
        const stepResults = [];
        let currentData = input.inputData || {};

        for (const step of steps) {
          const start = Date.now();
          try {
            // Check condition if present
            if (step.condition) {
              const conditionMet = evaluateCondition(step.condition, currentData);
              if (!conditionMet) {
                stepResults.push({ id: step.id, tool: step.tool, status: 'skipped', reason: 'Condition not met', durationMs: 0 });
                continue;
              }
            }

            // Execute via the headquarters (recursive tool call)
            const toolInput = resolveTemplateInput(step.input || {}, currentData);
            let toolResult;
            if (ctx.executeTool) {
              toolResult = await ctx.executeTool(step.tool, toolInput, ctx);
            } else {
              toolResult = { result: JSON.stringify({ status: 'success', message: `Tool ${step.tool} executed (no executor in context)` }) };
            }

            const parsed = (() => { try { return JSON.parse(toolResult.result); } catch { return { raw: toolResult.result }; } })();
            stepResults.push({ id: step.id, tool: step.tool, status: 'success', output: parsed, durationMs: Date.now() - start });
            currentData = { ...currentData, [`step_${step.id}`]: parsed };
          } catch (err) {
            stepResults.push({ id: step.id, tool: step.tool, status: 'error', error: err.message, durationMs: Date.now() - start });
            break;
          }
        }

        const allSuccess = stepResults.every(s => s.status === 'success' || s.status === 'skipped');
        await prisma.workflowRun.update({
          where: { id: run.id },
          data: { status: allSuccess ? 'completed' : 'failed', stepResults, outputData: currentData },
        });

        return { result: JSON.stringify({ status: 'success', runId: run.id, runNumber: run.runNumber, overallStatus: allSuccess ? 'completed' : 'failed', stepResults }) };
      }

      case 'workflow_schedule': {
        const wf = await prisma.workflow.findFirst({ where: { id: input.workflowId, userId } });
        if (!wf) return { result: JSON.stringify({ status: 'error', error: 'Workflow not found' }) };

        const job = await prisma.scheduledJob.create({
          data: {
            userId,
            name: `Schedule: ${wf.name}`,
            jobType: input.schedule,
            cronExpression: input.cronExpr || null,
            nextRunAt: input.runAt ? new Date(input.runAt) : null,
            config: { workflowId: wf.id, eventType: input.eventType || null },
            isActive: input.enabled !== false,
          },
        });

        return { result: JSON.stringify({ status: 'success', jobId: job.id, schedule: input.schedule, enabled: job.isActive }) };
      }

      case 'workflow_visualize': {
        const wf = await prisma.workflow.findFirst({ where: { id: input.workflowId, userId } });
        if (!wf) return { result: JSON.stringify({ status: 'error', error: 'Workflow not found' }) };

        const steps = wf.steps || [];
        const format = input.format || 'mermaid';

        if (format === 'mermaid') {
          let mermaid = 'graph TD\n';
          mermaid += '  START([Start]) --> ' + (steps[0]?.id || 'END') + '\n';
          for (const step of steps) {
            const label = `${step.id}["${step.tool}"]`;
            mermaid += `  ${label}\n`;
            if (step.dependsOn && step.dependsOn.length > 0) {
              for (const dep of step.dependsOn) {
                mermaid += `  ${dep} --> ${step.id}\n`;
              }
            }
          }
          // Find terminal nodes (not depended on by anyone)
          const depTargets = new Set(steps.flatMap(s => s.dependsOn || []));
          const terminals = steps.filter(s => !steps.some(other => (other.dependsOn || []).includes(s.id)) || steps.indexOf(s) === steps.length - 1);
          for (const t of terminals) {
            mermaid += `  ${t.id} --> END([End])\n`;
          }
          return { result: JSON.stringify({ status: 'success', format: 'mermaid', diagram: mermaid }) };
        }

        if (format === 'ascii') {
          const lines = steps.map((s, i) => `  ${i === 0 ? '┌' : '├'}── [${s.id}] ${s.tool}${s.condition ? ' (conditional)' : ''}`);
          lines.push('  └── [END]');
          return { result: JSON.stringify({ status: 'success', format: 'ascii', diagram: lines.join('\n') }) };
        }

        // JSON format
        return { result: JSON.stringify({ status: 'success', format: 'json', nodes: steps.map(s => ({ id: s.id, tool: s.tool, dependsOn: s.dependsOn || [] })) }) };
      }

      case 'workflow_optimize': {
        const wf = await prisma.workflow.findFirst({ where: { id: input.workflowId, userId } });
        if (!wf) return { result: JSON.stringify({ status: 'error', error: 'Workflow not found' }) };

        const steps = wf.steps || [];
        const suggestions = [];

        // Find parallelizable steps (no mutual dependencies)
        const depMap = new Map();
        steps.forEach(s => depMap.set(s.id, new Set(s.dependsOn || [])));
        const groups = [];
        const assigned = new Set();
        while (assigned.size < steps.length) {
          const group = steps.filter(s => !assigned.has(s.id) && [...(s.dependsOn || [])].every(d => assigned.has(d)));
          if (group.length === 0) break;
          groups.push(group.map(s => s.id));
          group.forEach(s => assigned.add(s.id));
        }
        if (groups.some(g => g.length > 1)) {
          suggestions.push({ type: 'parallelism', message: `Steps can be parallelized: ${groups.filter(g => g.length > 1).map(g => g.join(', ')).join(' | ')}` });
        }

        // Detect duplicate tools
        const toolCount = {};
        steps.forEach(s => { toolCount[s.tool] = (toolCount[s.tool] || 0) + 1; });
        Object.entries(toolCount).filter(([, c]) => c > 1).forEach(([tool, count]) => {
          suggestions.push({ type: 'dedup', message: `Tool "${tool}" used ${count} times — consider caching results` });
        });

        // Detect long chains
        if (steps.length > 10) {
          suggestions.push({ type: 'complexity', message: `Workflow has ${steps.length} steps — consider splitting into sub-workflows` });
        }

        if (suggestions.length === 0) {
          suggestions.push({ type: 'optimal', message: 'Workflow looks well-optimized' });
        }

        return { result: JSON.stringify({ status: 'success', stepCount: steps.length, parallelGroups: groups, suggestions }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

// Helpers
function evaluateCondition(condition, data) {
  try {
    if (typeof condition === 'string') {
      // Simple key check: "step_1.status === 'success'"
      const fn = new Function('data', `with(data) { return ${condition}; }`);
      return fn(data);
    }
    return true;
  } catch { return true; }
}

function resolveTemplateInput(template, data) {
  const resolved = {};
  for (const [key, value] of Object.entries(template)) {
    if (typeof value === 'string' && value.startsWith('$')) {
      const path = value.slice(1).split('.');
      let val = data;
      for (const p of path) { val = val?.[p]; }
      resolved[key] = val;
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

export const isWorkflowTool = (name) => WORKFLOW_TOOL_DEFINITIONS.some(t => t.name === name);
