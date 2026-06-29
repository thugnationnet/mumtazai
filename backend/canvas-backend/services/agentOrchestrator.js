/**
 * CANVAS AGENT ORCHESTRATOR
 * Single agent with 3-provider fallback: Mistral -> xAI -> OpenAI
 * All use OpenAI-compatible API — identical code path
 */

import OpenAI from 'openai';
import { executeTool, getToolsForMode, getToolsForPanel } from './toolsHeadquarters.js';

// ============================================================================
// AGENT SYSTEM PROMPT
// ============================================================================

const AGENT_SYSTEM = `You are Professor Johnny, an elite AI engineer powered by Onelastai.
You build production-quality code — React, TypeScript, Node.js, CSS, APIs.

IDENTITY RULES:
- Always identify as Professor Johnny powered by Onelastai
- NEVER mention Mistral, xAI, OpenAI, Grok, GPT, or any provider/model name

MISSION: Build complete, working, beautiful applications.
- Write full implementations — no placeholders, no TODOs
- Production-quality code with best practices
- Use tools to read/write files, execute commands, search docs
- Keep working until the application is complete and functional

TOOL EFFICIENCY:
- Plan before acting — think through what needs to be built
- Use the fewest tool calls possible to maximize value
- Every tool call costs credits — be deliberate and efficient`;

// ============================================================================
// PROVIDER CHAIN SETUP
// ============================================================================

function buildChain() {
  const chain = [];
  if (process.env.MISTRAL_API_KEY) {
    chain.push({
      name:   'mistral',
      client: new OpenAI({ apiKey: process.env.MISTRAL_API_KEY, baseURL: 'https://api.mistral.ai/v1' }),
      model:  'codestral-latest',
    });
  }
  if (process.env.XAI_API_KEY) {
    chain.push({
      name:   'xai',
      client: new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' }),
      model:  'grok-3',
    });
  }
  if (process.env.OPENAI_API_KEY) {
    chain.push({
      name:   'openai',
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      model:  'gpt-4o',
    });
  }
  return chain;
}

// ============================================================================
// AGENT ORCHESTRATOR
// ============================================================================

export class AgentOrchestrator {
  constructor(user, options = {}) {
    this.user    = user;
    this.options = options;
    this.chain   = buildChain();
    this.sseWrite = options.sseWrite || (() => {});
  }

  /**
   * Main entry point — tries each provider in order until one succeeds
   */
  async *processUserMessage(messages, streamCallback = null) {
    if (!this.chain.length) throw new Error('No AI providers configured');

    let lastError = null;
    for (const provider of this.chain) {
      try {
        yield* this._runLoop(messages, provider, streamCallback);
        return;
      } catch (err) {
        lastError = err;
        console.error(`[Agent] ${provider.name} failed: ${err.message}`);
      }
    }
    throw new Error(`All providers failed. Last: ${lastError?.message}`);
  }

  /**
   * Single-provider agentic loop with tool calling
   * Runs until the agent reaches a final answer — no round cap.
   */
  async *_runLoop(messages, provider, streamCallback) {
    const maxRounds  = 50;
    const modeTools  = this.options.panel
      ? getToolsForPanel(this.options.panel)
      : getToolsForMode(this.options.chatMode || 'Agent');
    const openAIFns  = modeTools.map(t => ({
      type:     'function',
      function: { name: t.name, description: t.description, parameters: t.input_schema },
    }));

    const toolDeps = {
      userId:        this.user?.id || null,
      sessionId:     this.options.sessionId,
      creditAppId:   this.options.creditAppId,
      workspaceRoot: this.options.workspaceRoot || process.cwd(),
      sseWrite:      this.sseWrite,
    };

    let conversation = [
      { role: 'system', content: AGENT_SYSTEM },
      ...messages.map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
    ];

    let totalIn    = 0;
    let totalOut   = 0;
    let toolsUsed  = [];
    let fullOutput = '';

    for (let round = 0; round < maxRounds; round++) {
      const isLastRound = round === maxRounds - 1;

      const response = await provider.client.chat.completions.create({
        model:      provider.model,
        max_tokens: 32768,
        messages:   conversation,
        tools:      isLastRound ? undefined : openAIFns,
        stream:     false,
      });

      const msg     = response.choices[0].message;
      const usage   = response.usage || {};
      totalIn  += usage.prompt_tokens     || 0;
      totalOut += usage.completion_tokens || 0;

      // No tool calls — this is the final answer
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        const content = msg.content || '';
        fullOutput += content;
        yield { type: 'text', content };
        break;
      }

      // Process tool calls
      const toolMsgs = [];
      for (const tc of msg.tool_calls) {
        const toolName = tc.function.name;
        let toolInput  = {};
        try { toolInput = JSON.parse(tc.function.arguments || '{}'); } catch { /* ignore */ }

        yield { type: 'tool_use', tool: toolName, input: toolInput };
        toolsUsed.push(toolName);

        if (streamCallback) streamCallback({ type: 'tool_use', tool: toolName, input: toolInput });

        const { result, sideEffects } = await executeTool(toolName, toolInput, toolDeps);
        if (sideEffects) yield { type: 'tool_side_effect', ...sideEffects };

        // Emit file artifacts when files are created
        if ((toolName === 'create_file' || toolName === 'write_file') && toolInput?.content) {
          try {
            const r = typeof result === 'string' ? JSON.parse(result) : result;
            if (r.status === 'success') {
              yield {
                type:     'file_artifact',
                filename: toolInput.path,
                content:  toolInput.content,
                size:     toolInput.content.length,
              };
            }
          } catch { /* non-JSON result */ }
        }

        toolMsgs.push({
          role:         'tool',
          tool_call_id: tc.id,
          content:      typeof result === 'string' ? result : JSON.stringify(result),
        });
      }

      // Add assistant + tool results to conversation, continue loop
      conversation = [
        ...conversation,
        {
          role:       'assistant',
          content:    msg.content || null,
          tool_calls: msg.tool_calls,
        },
        ...toolMsgs,
      ];
    }

    yield {
      type:        'done',
      content:     fullOutput,
      provider:    provider.name,
      model:       provider.model,
      inputTokens: totalIn,
      outputTokens: totalOut,
      totalTokens: totalIn + totalOut,
      toolsUsed,
    };
  }
}

export default AgentOrchestrator;
