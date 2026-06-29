// ═══════════════════════════════════════════════════════════════════════════════
// AGENT TOOL MAPPING — chess-player
// This file contains ONLY this agent's own tool set.
// (Slimmed from the shared registry — do not add other agents' data here.)
// ═══════════════════════════════════════════════════════════════════════════════

// Tools every agent needs regardless of specialty
const CORE_TOOLS = [
  'web_search', 'fetch_url', 'fetch_webpage', 'calculate', 'get_current_time',
  'think_step_by_step', 'generate_image', 'create_file', 'read_file', 'write_file',
  'agent_memory', 'save_context', 'recall_context',
];

// This agent's extra tools (added on top of CORE_TOOLS)
const AGENT_EXTRA_TOOLS = {
  'chess-player': [
    // Strategic — logic and analysis
    'execute_code', 'generate_code', 'data_visualize',
    'kg_create', 'kg_query', 'kg_reason',
  ],
};

// Pre-computed tool sets per agent (built once at startup)
const _agentToolSets = new Map();

function _buildToolSet(agentId) {
  const extra = AGENT_EXTRA_TOOLS[agentId] || [];
  return new Set([...CORE_TOOLS, ...extra]);
}

/**
 * Get filtered TOOL_DEFINITIONS for a specific agent.
 * Falls back to full tool list for unknown agents.
 * @param {string|null} agentId - The agent slug (e.g. 'einstein', 'tech-wizard')
 * @param {Array} allTools - Full TOOL_DEFINITIONS array
 * @returns {Array} Filtered tool definitions
 */
export function getToolsForAgent(agentId, allTools) {
  if (!agentId) return allTools; // No agent specified → full catalog

  // Check if this agent has a mapping
  if (!AGENT_EXTRA_TOOLS[agentId] && !CORE_TOOLS.length) return allTools;

  // Get or build cached tool set
  if (!_agentToolSets.has(agentId)) {
    if (!AGENT_EXTRA_TOOLS[agentId]) {
      // Unknown agent — give them core tools + common utilities
      _agentToolSets.set(agentId, new Set([
        ...CORE_TOOLS,
        'execute_code', 'generate_code', 'parse_pdf', 'parse_csv', 'parse_json',
        'image_create', 'data_visualize', 'summarize_file',
      ]));
    } else {
      _agentToolSets.set(agentId, _buildToolSet(agentId));
    }
  }

  const toolSet = _agentToolSets.get(agentId);
  return allTools.filter(t => toolSet.has(t.name));
}

/**
 * Get tool count for a specific agent (for logging).
 */
export function getAgentToolCount(agentId) {
  if (!agentId || !_agentToolSets.has(agentId)) {
    const set = agentId ? _buildToolSet(agentId) : null;
    return set ? set.size : null;
  }
  return _agentToolSets.get(agentId).size;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-INTENT FILTER — narrows heavy agents (>30 extras) by user message keywords.
// For light agents the array is empty → no narrowing, always full agent set.
// Each group: { match: RegExp, tools: extraToolNames[] } (CORE_TOOLS always added).
// ═══════════════════════════════════════════════════════════════════════════════
const SUB_INTENT_GROUPS = [];

function _applySubIntent(baseTools, userMessage) {
  if (!SUB_INTENT_GROUPS.length || !userMessage) return null;
  const lower = String(userMessage).toLowerCase();
  for (const group of SUB_INTENT_GROUPS) {
    if (group.match.test(lower)) {
      const allowed = new Set([...CORE_TOOLS, ...group.tools]);
      return baseTools.filter(t => allowed.has(t.name));
    }
  }
  return null;
}

const _stableAgentToolsCache = new Map();

/**
 * Fast path for chat-stream: returns the agent's tool array, optionally
 * narrowed by sub-intent (heavy agents only). The returned array reference is
 * stable across requests for the cache hit path so downstream WeakMap caches
 * for provider filtering and OpenAI-format conversion stay warm.
 */
export function getFastToolsForAgent(agentId, allTools, userMessage) {
  let baseTools = _stableAgentToolsCache.get(agentId);
  if (!baseTools) {
    baseTools = getToolsForAgent(agentId, allTools);
    _stableAgentToolsCache.set(agentId, baseTools);
  }
  const narrowed = _applySubIntent(baseTools, userMessage);
  return narrowed || baseTools;
}
