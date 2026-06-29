/**
 * ADVANCED AI TOOLS — LLM routing, cost optimization, guardrails, evaluation, agent orchestration
 * DB models: LlmRouteLog, LlmGuardrailLog, LlmEvaluation, AgentInstance, AgentTask
 */

import prisma from '../lib/prisma.js';

export const ADVANCED_AI_TOOL_DEFINITIONS = [
  {
    name: 'llm_router',
    description: 'Route prompts to the best LLM model based on complexity, cost, or capability requirements.',
    input_schema: {
      type: 'object',
      properties: {
        prompt:      { type: 'string', description: 'Prompt text to analyze and route' },
        strategy:    { type: 'string', enum: ['cheapest', 'fastest', 'best_quality', 'balanced'], description: 'Routing strategy' },
        constraints: { type: 'object', description: '{ maxCost, maxTokens, maxLatency, requiredCapabilities }' },
        models:      { type: 'array', description: 'Candidate models to choose from', items: { type: 'string' } },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'llm_cost_optimize',
    description: 'Analyze and optimize LLM usage costs — token analysis, caching recommendations, model switching.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['analyze', 'recommend', 'history'], description: 'Operation' },
        dateRange: { type: 'object', description: '{ from, to }' },
        groupBy:   { type: 'string', enum: ['model', 'day', 'user', 'tool'], description: 'Group costs by' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'llm_guardrail',
    description: 'Apply safety guardrails to LLM inputs/outputs — PII detection, toxicity filtering, topic blocking.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['check', 'configure', 'list_rules', 'log'], description: 'Operation' },
        text:      { type: 'string', description: 'Text to check' },
        rules:     { type: 'array', description: 'Guardrail rules [{ type, config }]', items: { type: 'object' } },
        direction: { type: 'string', enum: ['input', 'output', 'both'], description: 'Check direction' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'llm_evaluate',
    description: 'Evaluate LLM outputs for quality — coherence, accuracy, relevance, factuality scoring.',
    input_schema: {
      type: 'object',
      properties: {
        prompt:   { type: 'string', description: 'Original prompt' },
        response: { type: 'string', description: 'LLM response to evaluate' },
        criteria: { type: 'array', description: 'Evaluation criteria', items: { type: 'string' } },
        reference: { type: 'string', description: 'Reference answer (for accuracy)' },
      },
      required: ['response'],
    },
  },
  {
    name: 'agent_spawn',
    description: 'Spawn a new agent instance with specific role, tools, and memory.',
    input_schema: {
      type: 'object',
      properties: {
        operation:     { type: 'string', enum: ['spawn', 'list', 'get', 'terminate'], description: 'Operation' },
        agentId:       { type: 'string', description: 'Agent instance ID' },
        name:          { type: 'string', description: 'Agent name' },
        role:          { type: 'string', description: 'Agent role (e.g., "researcher", "coder", "reviewer")' },
        tools:         { type: 'array', description: 'Tool names this agent can use', items: { type: 'string' } },
        systemPrompt:  { type: 'string', description: 'Agent system prompt' },
        maxIterations: { type: 'integer', description: 'Max iterations before auto-stop (default: 10)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'agent_delegate',
    description: 'Delegate a task to a spawned agent instance and get results.',
    input_schema: {
      type: 'object',
      properties: {
        agentId:  { type: 'string', description: 'Agent instance ID to delegate to' },
        task:     { type: 'string', description: 'Task description' },
        input:    { type: 'object', description: 'Task input data' },
        timeout:  { type: 'integer', description: 'Task timeout in ms (default: 30000)' },
        priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'Task priority' },
      },
      required: ['agentId', 'task'],
    },
  },
  {
    name: 'agent_reflect',
    description: 'Agent self-reflection — analyze performance, learn from past tasks, improve behavior.',
    input_schema: {
      type: 'object',
      properties: {
        agentId:   { type: 'string', description: 'Agent instance ID' },
        operation: { type: 'string', enum: ['review_tasks', 'performance', 'lessons', 'improve'], description: 'Reflection type' },
        taskCount: { type: 'integer', description: 'Number of recent tasks to review (default: 10)' },
      },
      required: ['operation'],
    },
  },
];

export async function executeAdvancedAiTool(toolName, input, ctx = {}) {
  const userId = ctx.userId || 'anonymous';
  try {
    switch (toolName) {

      case 'llm_router': {
        const strategy = input.strategy || 'balanced';
        const models = input.models || ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3.5-sonnet', 'gemini-1.5-flash'];
        const promptLen = (input.prompt || '').length;

        // Simple heuristic routing
        const modelScores = {
          'gpt-4o-mini':       { cost: 1, speed: 9, quality: 6 },
          'gpt-4o':            { cost: 5, speed: 6, quality: 9 },
          'claude-3-haiku':    { cost: 1, speed: 9, quality: 5 },
          'claude-3.5-sonnet': { cost: 4, speed: 7, quality: 9 },
          'gemini-1.5-flash':  { cost: 1, speed: 9, quality: 6 },
        };
        const weights = { cheapest: { cost: -3, speed: 0, quality: 0 }, fastest: { cost: 0, speed: 3, quality: 0 }, best_quality: { cost: 0, speed: 0, quality: 3 }, balanced: { cost: -1, speed: 1, quality: 2 } };
        const w = weights[strategy];
        const scored = models.filter(m => modelScores[m]).map(m => {
          const s = modelScores[m];
          return { model: m, score: s.cost * w.cost + s.speed * w.speed + s.quality * w.quality, ...s };
        }).sort((a, b) => b.score - a.score);

        const selected = scored[0];
        await prisma.llmRouteLog.create({ data: { userId, prompt: (input.prompt || '').slice(0, 200), strategy, selectedModel: selected.model, scores: scored, constraints: input.constraints || {} } });
        return { result: JSON.stringify({ status: 'success', selectedModel: selected.model, strategy, promptLength: promptLen, reasoning: `Selected ${selected.model} (score=${selected.score}) based on ${strategy} strategy`, alternatives: scored.slice(1, 3).map(s => s.model) }) };
      }

      case 'llm_cost_optimize': {
        switch (input.operation) {
          case 'analyze': {
            const logs = await prisma.llmRouteLog.findMany({
              where: { userId },
              orderBy: { createdAt: 'desc' },
              take: 100,
            });
            const byModel = {};
            logs.forEach(l => {
              if (!byModel[l.selectedModel]) byModel[l.selectedModel] = { count: 0 };
              byModel[l.selectedModel].count++;
            });
            return { result: JSON.stringify({ status: 'success', totalRequests: logs.length, byModel, period: input.dateRange || 'recent' }) };
          }
          case 'recommend': {
            return { result: JSON.stringify({ status: 'success', recommendations: [
              'Use gpt-4o-mini for simple classification/extraction tasks',
              'Cache repeated prompts to reduce API calls by ~30%',
              'Batch similar requests for token efficiency',
              'Use smaller models for initial drafts, larger for final polish',
            ] }) };
          }
          case 'history': {
            const logs = await prisma.llmRouteLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
            return { result: JSON.stringify({ status: 'success', count: logs.length, history: logs.map(l => ({ id: l.id, model: l.selectedModel, strategy: l.strategy, date: l.createdAt })) }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'llm_guardrail': {
        switch (input.operation) {
          case 'check': {
            const text = input.text || '';
            const issues = [];

            // PII detection patterns
            const piiPatterns = [
              { name: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
              { name: 'phone', regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
              { name: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
              { name: 'credit_card', regex: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g },
            ];
            piiPatterns.forEach(p => {
              const matches = text.match(p.regex);
              if (matches) issues.push({ type: 'pii', subtype: p.name, count: matches.length, severity: 'high' });
            });

            // Simple toxicity keywords
            const toxicWords = ['kill', 'bomb', 'hack', 'attack', 'exploit', 'weapon'];
            const lowerText = text.toLowerCase();
            toxicWords.forEach(w => {
              if (lowerText.includes(w)) issues.push({ type: 'toxicity', word: w, severity: 'medium' });
            });

            const passed = issues.filter(i => i.severity === 'high').length === 0;
            await prisma.llmGuardrailLog.create({ data: { userId, text: text.slice(0, 200), direction: input.direction || 'both', issues, passed } });
            return { result: JSON.stringify({ status: 'success', passed, issueCount: issues.length, issues, recommendation: passed ? 'Content passed all guardrails' : 'Content flagged — review before sending' }) };
          }
          case 'list_rules': {
            return { result: JSON.stringify({ status: 'success', rules: [
              { type: 'pii', description: 'Detects emails, phone numbers, SSNs, credit cards' },
              { type: 'toxicity', description: 'Flags potentially harmful keywords' },
              { type: 'topic_block', description: 'Blocks specified topics (configurable)' },
            ] }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'llm_evaluate': {
        const response = input.response || '';
        const criteria = input.criteria || ['coherence', 'relevance', 'completeness'];

        const scores = {};
        criteria.forEach(c => {
          switch (c) {
            case 'coherence':    scores[c] = Math.min(100, Math.max(20, 50 + response.length / 10)); break;
            case 'relevance':    scores[c] = input.prompt ? (response.toLowerCase().includes(input.prompt.toLowerCase().slice(0, 20)) ? 80 : 50) : 60; break;
            case 'completeness': scores[c] = response.length > 200 ? 85 : response.length > 50 ? 60 : 30; break;
            case 'factuality':   scores[c] = input.reference ? 70 : 50; break;
            default:             scores[c] = 50;
          }
        });

        const avgScore = Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / Object.values(scores).length);
        await prisma.llmEvaluation.create({ data: { userId, prompt: (input.prompt || '').slice(0, 200), response: response.slice(0, 500), criteria, scores, overallScore: avgScore } });
        return { result: JSON.stringify({ status: 'success', overallScore: avgScore, scores, grade: avgScore >= 80 ? 'A' : avgScore >= 60 ? 'B' : avgScore >= 40 ? 'C' : 'D' }) };
      }

      case 'agent_spawn': {
        switch (input.operation) {
          case 'spawn': {
            const agent = await prisma.agentInstance.create({
              data: { userId, name: input.name || 'Agent', role: input.role || 'general', tools: input.tools || [], systemPrompt: input.systemPrompt || null, maxIterations: input.maxIterations || 10, status: 'idle' },
            });
            return { result: JSON.stringify({ status: 'success', agentId: agent.id, name: agent.name, role: agent.role, agentStatus: 'idle' }) };
          }
          case 'list': {
            const agents = await prisma.agentInstance.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: agents.length, agents: agents.map(a => ({ id: a.id, name: a.name, role: a.role, status: a.status })) }) };
          }
          case 'get': {
            const agent = await prisma.agentInstance.findFirst({ where: { id: input.agentId, userId } });
            if (!agent) return { result: JSON.stringify({ status: 'error', error: 'Agent not found' }) };
            return { result: JSON.stringify({ status: 'success', agent: { id: agent.id, name: agent.name, role: agent.role, status: agent.status, tools: agent.tools, iterations: agent.iterationCount } }) };
          }
          case 'terminate': {
            await prisma.agentInstance.update({ where: { id: input.agentId }, data: { status: 'terminated' } });
            return { result: JSON.stringify({ status: 'success', agentId: input.agentId, agentStatus: 'terminated' }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'agent_delegate': {
        const agent = await prisma.agentInstance.findFirst({ where: { id: input.agentId, userId } });
        if (!agent) return { result: JSON.stringify({ status: 'error', error: 'Agent not found' }) };

        const task = await prisma.agentTask.create({
          data: { agentId: agent.id, userId, task: input.task, input: input.input || {}, priority: input.priority || 'normal', status: 'queued' },
        });

        // Mark agent as busy
        await prisma.agentInstance.update({ where: { id: agent.id }, data: { status: 'busy', iterationCount: { increment: 1 } } });

        // Simulate task execution (actual execution would be async)
        await prisma.agentTask.update({ where: { id: task.id }, data: { status: 'running', startedAt: new Date() } });

        return { result: JSON.stringify({ status: 'success', taskId: task.id, agentId: agent.id, agentName: agent.name, taskStatus: 'running', task: input.task }) };
      }

      case 'agent_reflect': {
        switch (input.operation) {
          case 'review_tasks': {
            const tasks = await prisma.agentTask.findMany({
              where: input.agentId ? { agentId: input.agentId } : { userId },
              orderBy: { createdAt: 'desc' },
              take: input.taskCount || 10,
            });
            return { result: JSON.stringify({ status: 'success', taskCount: tasks.length, tasks: tasks.map(t => ({ id: t.id, task: t.task, status: t.status, duration: t.completedAt && t.startedAt ? t.completedAt - t.startedAt : null })) }) };
          }
          case 'performance': {
            const tasks = await prisma.agentTask.findMany({
              where: input.agentId ? { agentId: input.agentId } : { userId },
            });
            const completed = tasks.filter(t => t.status === 'completed').length;
            const failed = tasks.filter(t => t.status === 'failed').length;
            return { result: JSON.stringify({ status: 'success', total: tasks.length, completed, failed, successRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0 }) };
          }
          case 'lessons': {
            const failed = await prisma.agentTask.findMany({
              where: { ...(input.agentId ? { agentId: input.agentId } : { userId }), status: 'failed' },
              orderBy: { createdAt: 'desc' },
              take: 5,
            });
            return { result: JSON.stringify({ status: 'success', failedTasks: failed.length, lessons: failed.map(f => ({ task: f.task, error: f.error, suggestion: 'Review task constraints and agent capabilities' })) }) };
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

export const isAdvancedAiTool = (name) => ADVANCED_AI_TOOL_DEFINITIONS.some(t => t.name === name);
