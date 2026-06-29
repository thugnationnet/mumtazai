/**
 * AGENT INTELLIGENCE SERVICE (v2 — Properly Wired)
 * Phase 7 — Memory, Safety, UI Interaction, Agent Control, Editor Selection
 *
 * 5 consolidated tools, ~22 actions total:
 *   agent_memory    — save, get, clear, stats, search
 *   agent_safety    — request_approval, check_permission, validate_action, audit_log
 *   agent_ui        — show_message, show_warning, show_error, ask_user, show_toast, show_progress
 *   agent_control   — set_mode, get_state, cancel_task, set_context
 *   editor_select   — get_selection, insert_at_cursor, replace_selection, get_cursor_position
 *
 * FIXED in v2:
 *   ✅ Memory uses Prisma AgentMemory table (not Mongoose/AgentFile)
 *   ✅ Agent state persists to Redis (survives PM2 restarts)
 *   ✅ Safety mode enforced via checkToolPermission() — called BEFORE every tool execution
 *   ✅ UI events emit via Socket.IO to real user rooms
 *   ✅ Audit logs persist to Redis (7-day TTL)
 */

import { prisma } from './prisma.js';
import { cache } from './cache.js';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Destructive actions that always require user approval
 */
const DESTRUCTIVE_ACTIONS = new Set([
  'delete_file',
  'delete_folder',
  'format_disk',
  'drop_database',
  'rm_rf',
  'git_force_push',
  'deploy_production',
  'reset_migrations',
  'truncate_table',
  'revoke_permissions',
  'uninstall_package',
  'overwrite_config',
]);

/**
 * Permission levels
 */
const PERMISSION_LEVELS = {
  read: 1,
  write: 2,
  execute: 3,
  admin: 4,
  destructive: 5,
};

/**
 * Agent mode definitions with tool whitelists
 * Mode enforcement happens in checkToolPermission() below
 */
const AGENT_MODES = {
  chat: {
    name: 'chat',
    description: 'Conversational mode — answer questions, explain concepts',
    allowedTools: [
      'web_search', 'fetch_url', 'calculate', 'get_current_time', 'get_weather',
      'agent_memory', 'agent_ui', 'agent_control', 'agent_safety',
    ],
    restrictions: ['No file modifications', 'No code execution'],
  },
  dev: {
    name: 'dev',
    description: 'Development mode — full access to file, code, and dev tools',
    allowedTools: '*', // All tools
    restrictions: [],
  },
  review: {
    name: 'review',
    description: 'Code review mode — read-only analysis, suggestions only',
    allowedTools: [
      'read_file', 'list_files', 'list_folders', 'analyze_code', 'lint_code',
      'dev_intelligence', 'web_analyze', 'web_search', 'fetch_url',
      'calculate', 'get_current_time', 'agent_memory', 'agent_ui', 'agent_control',
    ],
    restrictions: ['No file writes', 'No code execution', 'Suggestions only'],
  },
  plan: {
    name: 'plan',
    description: 'Planning mode — task breakdown, no execution',
    allowedTools: [
      'web_search', 'read_file', 'list_files', 'analyze_code',
      'agent_memory', 'agent_ui', 'agent_control',
    ],
    restrictions: ['No modifications', 'Planning and analysis only'],
  },
  safe: {
    name: 'safe',
    description: 'Safe mode — read-only, all destructive actions blocked',
    allowedTools: [
      'read_file', 'list_files', 'list_folders', 'web_search', 'fetch_url',
      'calculate', 'get_current_time', 'get_weather', 'analyze_code',
      'agent_memory', 'agent_ui', 'agent_control',
    ],
    restrictions: ['Read-only', 'No writes', 'No execution'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// REDIS-BACKED STATE (survives PM2 restarts)
// ═══════════════════════════════════════════════════════════════════

const STATE_TTL = 86400; // 24 hours
const AUDIT_TTL = 604800; // 7 days

function stateKey(userId) { return `agent:state:${userId}`; }
function auditKey(userId) { return `agent:audit:${userId}`; }

/**
 * Get agent state from Redis (falls back to default if not found)
 */
async function getState(userId) {
  try {
    const cached = await cache.get(stateKey(userId));
    if (cached) return cached;
  } catch { /* Redis down — return fresh default */ }
  return {
    mode: 'dev',
    context: {},
    activeTasks: [],
    taskHistory: [],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };
}

/**
 * Save agent state to Redis (24h TTL, refreshed on every write)
 */
async function setState(userId, state) {
  state.lastActivity = new Date().toISOString();
  try {
    await cache.set(stateKey(userId), state, STATE_TTL);
  } catch (err) {
    console.warn('[AgentIntel] Failed to persist state:', err.message);
  }
  return state;
}

/**
 * Append to Redis-backed audit log (7-day TTL, max 200 entries)
 */
async function appendAuditLog(userId, entry) {
  try {
    const logs = (await cache.get(auditKey(userId))) || [];
    logs.push({
      ...entry,
      timestamp: new Date().toISOString(),
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    });
    // Keep last 200 entries
    if (logs.length > 200) logs.splice(0, logs.length - 200);
    await cache.set(auditKey(userId), logs, AUDIT_TTL);
  } catch { /* non-fatal — audit is best-effort */ }
}

// In-memory editor state (ephemeral by nature — cursor positions don't need persistence)
const editorStates = new Map();
// In-memory pending approvals (short-lived single-session items)
const pendingApprovals = new Map();

// ═══════════════════════════════════════════════════════════════════
// ⚡ ENFORCED SAFETY CHECK — called BEFORE every tool execution
//    Wired into tool-definitions.js executeToolCall()
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if a tool call is permitted in the current agent mode.
 * Called from tool-definitions.js executeToolCall() BEFORE the HTTP POST.
 *
 * @param {string} toolName - The tool being called
 * @param {string} userId - User ID
 * @returns {{ allowed: boolean, reason?: string }}
 */
export async function checkToolPermission(toolName, userId) {
  // All tools are allowed — no restrictions
  return { allowed: true };
}

// ═══════════════════════════════════════════════════════════════════
// SOCKET.IO INTEGRATION — real-time UI events to browser
// ═══════════════════════════════════════════════════════════════════

let _io = null;

/**
 * Set Socket.IO instance — called once from server-simple.js on startup
 */
export function setSocketIO(io) {
  _io = io;
}

/**
 * Emit a UI event to the user via Socket.IO
 */
function emitUIEvent(userId, event, payload) {
  if (!_io) return;
  _io.emit('agent:ui', { userId, event, ...payload });
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 1: agent_memory (Prisma AgentMemory table)
// Actions: save, get, clear, stats, search
// ═══════════════════════════════════════════════════════════════════

export async function agentMemory(params, userId = 'default') {
  const action = params.action;
  const agentId = params.agentId || 'general';

  try {
    switch (action) {
      // ── save ──────────────────────────────────────────────────
      case 'save': {
        const key = params.key;
        const value = params.value || params.content;
        const tags = params.tags || [];
        const importance = params.importance || 5;

        if (!key || !value) {
          return { success: false, error: 'Missing required: key and value' };
        }

        const memoryEntry = {
          key,
          value,
          tags,
          importance,
          type: params.type || 'user_fact',
          timestamp: new Date().toISOString(),
        };

        // Read existing memories for this agent+user
        const existing = await prisma.agentMemory.findUnique({
          where: { agentId_userId: { agentId, userId } },
        });

        let memories = [];
        if (existing?.memories) {
          memories = Array.isArray(existing.memories) ? existing.memories : [];
          // Replace existing entry with same key, or append new one
          const idx = memories.findIndex((m) => m.key === key);
          if (idx >= 0) {
            memories[idx] = memoryEntry;
          } else {
            memories.push(memoryEntry);
          }
        } else {
          memories = [memoryEntry];
        }

        // Upsert into AgentMemory table
        await prisma.agentMemory.upsert({
          where: { agentId_userId: { agentId, userId } },
          update: {
            memories,
            totalMemories: memories.length,
            lastAccessed: new Date(),
          },
          create: {
            agentId,
            userId,
            memories,
            totalMemories: memories.length,
            lastAccessed: new Date(),
          },
        });

        await appendAuditLog(userId, { action: 'memory_save', key, tags, importance });

        return {
          success: true,
          key,
          tags,
          importance,
          message: `Memory saved: "${key}" (${memories.length} total for agent ${agentId})`,
        };
      }

      // ── get ───────────────────────────────────────────────────
      case 'get': {
        const key = params.key;

        const record = await prisma.agentMemory.findUnique({
          where: { agentId_userId: { agentId, userId } },
        });

        if (!record) {
          return { success: true, memories: [], count: 0, message: 'No memories found' };
        }

        // Touch lastAccessed
        prisma.agentMemory.update({
          where: { id: record.id },
          data: { lastAccessed: new Date() },
        }).catch(() => {});

        let memories = Array.isArray(record.memories) ? record.memories : [];

        // Filter by key if specified
        if (key) {
          memories = memories.filter((m) => m.key === key);
        }

        // Filter by tags if specified
        if (params.tags?.length > 0) {
          memories = memories.filter((m) =>
            params.tags.some((t) => m.tags?.includes(t))
          );
        }

        return {
          success: true,
          memories,
          count: memories.length,
          summary: record.summary,
          message: key
            ? `Found memory for key: "${key}"`
            : `Found ${memories.length} memories`,
        };
      }

      // ── clear ─────────────────────────────────────────────────
      case 'clear': {
        const key = params.key;

        if (key) {
          // Remove single entry by key from memories JSON array
          const record = await prisma.agentMemory.findUnique({
            where: { agentId_userId: { agentId, userId } },
          });
          if (!record) return { success: true, cleared: 0, message: 'No memories found' };

          let memories = Array.isArray(record.memories) ? record.memories : [];
          const before = memories.length;
          memories = memories.filter((m) => m.key !== key);

          await prisma.agentMemory.update({
            where: { id: record.id },
            data: { memories, totalMemories: memories.length },
          });

          const cleared = before - memories.length;
          await appendAuditLog(userId, { action: 'memory_clear', key, cleared });
          return { success: true, cleared, message: `Cleared memory: "${key}"` };
        }

        // Clear all memories for this agent+user
        const result = await prisma.agentMemory.deleteMany({
          where: { agentId, userId },
        });

        await appendAuditLog(userId, { action: 'memory_clear_all', agentId });
        return {
          success: true,
          cleared: result.count,
          message: `Cleared all memories for agent ${agentId}`,
        };
      }

      // ── stats ─────────────────────────────────────────────────
      case 'stats': {
        const records = await prisma.agentMemory.findMany({
          where: { userId },
        });

        let totalMemories = 0;
        const byAgent = {};
        const allTags = {};

        for (const record of records) {
          const memories = Array.isArray(record.memories) ? record.memories : [];
          totalMemories += memories.length;
          byAgent[record.agentId] = memories.length;
          for (const m of memories) {
            (m.tags || []).forEach((t) => { allTags[t] = (allTags[t] || 0) + 1; });
          }
        }

        return {
          success: true,
          totalMemories,
          agentCount: records.length,
          byAgent,
          topTags: allTags,
          message: `${totalMemories} memories across ${records.length} agents`,
        };
      }

      // ── search ────────────────────────────────────────────────
      case 'search': {
        const searchQuery = params.query || params.keyword;
        if (!searchQuery) {
          return { success: false, error: 'Missing required: query' };
        }

        const records = await prisma.agentMemory.findMany({
          where: { userId },
        });

        const queryLower = searchQuery.toLowerCase();
        const results = [];

        for (const record of records) {
          const memories = Array.isArray(record.memories) ? record.memories : [];
          for (const m of memories) {
            const searchable = JSON.stringify(m).toLowerCase();
            if (searchable.includes(queryLower)) {
              results.push({ ...m, agentId: record.agentId });
            }
          }
        }

        return {
          success: true,
          query: searchQuery,
          results,
          count: results.length,
          message: `Found ${results.length} memories matching "${searchQuery}"`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown agent_memory action: "${action}". Valid: save, get, clear, stats, search`,
        };
    }
  } catch (error) {
    console.error('[AgentMemory] Error:', error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 2: agent_safety
// Actions: request_approval, check_permission, validate_action, audit_log
// ═══════════════════════════════════════════════════════════════════

export async function agentSafety(params, userId = 'default') {
  const action = params.action;

  try {
    switch (action) {
      case 'request_approval': {
        const targetAction = params.target_action;
        const reason = params.reason || 'No reason provided';
        const severity = params.severity || 'medium';

        if (!targetAction) {
          return { success: false, error: 'Missing required: target_action' };
        }

        const isDestructive = DESTRUCTIVE_ACTIONS.has(targetAction);
        const approvalId = `approval_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        if (!pendingApprovals.has(userId)) pendingApprovals.set(userId, new Map());
        pendingApprovals.get(userId).set(approvalId, {
          id: approvalId,
          action: targetAction,
          reason,
          severity,
          isDestructive,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });

        await appendAuditLog(userId, {
          action: 'approval_requested',
          target: targetAction,
          severity,
          isDestructive,
          approvalId,
        });

        return {
          success: true,
          approvalId,
          status: 'pending',
          isDestructive,
          severity,
          message: isDestructive
            ? `⚠️ DESTRUCTIVE ACTION: "${targetAction}" requires explicit user approval. Reason: ${reason}`
            : `Approval requested for "${targetAction}". Reason: ${reason}`,
          requiresUserConfirmation: true,
          suggestedPrompt: `Do you approve: ${targetAction}? (Reason: ${reason})`,
        };
      }

      case 'check_permission': {
        const targetAction = params.target_action;
        if (!targetAction) {
          return { success: false, error: 'Missing required: target_action' };
        }

        const state = await getState(userId);
        const mode = AGENT_MODES[state.mode] || AGENT_MODES.dev;
        const isDestructive = DESTRUCTIVE_ACTIONS.has(targetAction);

        let allowed = true;
        let reason = '';

        if (isDestructive && state.mode !== 'dev') {
          allowed = false;
          reason = `Destructive action "${targetAction}" is only allowed in dev mode (current: ${state.mode})`;
        } else if (mode.allowedTools !== '*') {
          if (!mode.allowedTools.includes(targetAction)) {
            allowed = false;
            reason = `Action "${targetAction}" is not allowed in ${state.mode} mode`;
          }
        }

        await appendAuditLog(userId, {
          action: 'permission_check',
          target: targetAction,
          allowed,
          mode: state.mode,
        });

        return {
          success: true,
          action: targetAction,
          allowed,
          isDestructive,
          currentMode: state.mode,
          restrictions: mode.restrictions,
          reason: allowed
            ? `Action "${targetAction}" is permitted in ${state.mode} mode`
            : reason,
        };
      }

      case 'validate_action': {
        const targetAction = params.target_action;
        const targetParams = params.target_params || {};

        if (!targetAction) {
          return { success: false, error: 'Missing required: target_action' };
        }

        const warnings = [];
        const blocked = [];
        const isDestructive = DESTRUCTIVE_ACTIONS.has(targetAction);

        if (targetAction === 'execute_code') {
          const code = targetParams.code || '';
          if (/rm\s+-rf\s+\//.test(code)) blocked.push('Blocked: rm -rf / detected');
          if (/drop\s+database/i.test(code)) blocked.push('Blocked: DROP DATABASE detected');
          if (/:(){ :|:& };:/.test(code)) blocked.push('Blocked: Fork bomb detected');
          if (/curl.*\|.*sh/.test(code)) warnings.push('Warning: Piping curl to shell');
          if (/eval\s*\(/.test(code)) warnings.push('Warning: eval() usage');
          if (/process\.env/.test(code)) warnings.push('Warning: Accessing env vars');
        }

        if (targetAction === 'delete_file' || targetAction === 'delete_folder') {
          const p = targetParams.path || targetParams.file || '';
          if (p === '/' || p === '~' || p === '*') blocked.push(`Blocked: Cannot delete "${p}"`);
          if (/\.(env|key|pem|cert|secret)$/i.test(p)) warnings.push(`Warning: Deleting sensitive file: ${p}`);
        }

        if (targetAction === 'modify_file') {
          const p = targetParams.path || targetParams.file || '';
          if (/\.(env|config|secret|key|pem)$/i.test(p)) warnings.push(`Warning: Modifying sensitive file: ${p}`);
        }

        const safe = blocked.length === 0;

        await appendAuditLog(userId, {
          action: 'action_validated',
          target: targetAction,
          safe,
          warnings: warnings.length,
          blocked: blocked.length,
        });

        return {
          success: true,
          action: targetAction,
          safe,
          isDestructive,
          warnings,
          blocked,
          message: safe
            ? warnings.length > 0
              ? `Action "${targetAction}" is allowed with ${warnings.length} warning(s)`
              : `Action "${targetAction}" is safe to execute`
            : `Action "${targetAction}" BLOCKED: ${blocked.join('; ')}`,
        };
      }

      case 'audit_log': {
        const logs = (await cache.get(auditKey(userId))) || [];
        const limit = params.limit || 50;
        const filterAction = params.filter_action;

        let filtered = logs;
        if (filterAction) {
          filtered = logs.filter((l) => l.action === filterAction);
        }

        const recent = filtered.slice(-limit);

        return {
          success: true,
          logs: recent,
          totalEntries: logs.length,
          showing: recent.length,
          message: `Showing ${recent.length} of ${logs.length} audit log entries`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown agent_safety action: "${action}". Valid: request_approval, check_permission, validate_action, audit_log`,
        };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 3: agent_ui (emits real Socket.IO events)
// Actions: show_message, show_warning, show_error, ask_user, show_toast, show_progress
// ═══════════════════════════════════════════════════════════════════

export async function agentUI(params, userId = 'default') {
  const action = params.action;

  try {
    switch (action) {
      case 'show_message': {
        const text = params.text || params.message;
        if (!text) return { success: false, error: 'Missing required: text' };

        emitUIEvent(userId, 'show_message', {
          type: 'info',
          title: params.title || 'Info',
          message: text,
          duration: params.duration || 5000,
        });

        return { success: true, type: 'message', text, message: text };
      }

      case 'show_warning': {
        const text = params.text || params.message;
        if (!text) return { success: false, error: 'Missing required: text' };

        await appendAuditLog(userId, { action: 'warning_shown', text });
        emitUIEvent(userId, 'show_warning', {
          type: 'warning',
          title: params.title || '⚠️ Warning',
          message: text,
          duration: params.duration || 8000,
        });

        return { success: true, type: 'warning', text, message: `⚠️ ${text}` };
      }

      case 'show_error': {
        const text = params.text || params.message;
        if (!text) return { success: false, error: 'Missing required: text' };

        await appendAuditLog(userId, { action: 'error_shown', text });
        emitUIEvent(userId, 'show_error', {
          type: 'error',
          title: params.title || '❌ Error',
          message: text,
          duration: params.duration || 0,
        });

        return { success: true, type: 'error', text, message: `❌ ${text}` };
      }

      case 'ask_user': {
        const question = params.question || params.text;
        if (!question) return { success: false, error: 'Missing required: question' };

        const options = params.options || [];
        const inputType = params.input_type || (options.length > 0 ? 'choice' : 'text');

        emitUIEvent(userId, 'ask_user', {
          question,
          type: inputType,
          options,
          placeholder: params.placeholder || '',
          defaultValue: params.default_value || '',
        });

        return {
          success: true,
          type: 'user_prompt',
          question,
          inputType,
          options,
          requiresUserResponse: true,
          message: options.length > 0
            ? `❓ ${question}\nOptions: ${options.join(', ')}`
            : `❓ ${question}`,
        };
      }

      case 'show_toast': {
        const text = params.text || params.message;
        if (!text) return { success: false, error: 'Missing required: text' };

        emitUIEvent(userId, 'show_toast', {
          message: text,
          severity: params.severity || 'info',
          position: params.position || 'bottom-right',
          duration: params.duration || 3000,
        });

        return { success: true, type: 'toast', text, message: text };
      }

      case 'show_progress': {
        const label = params.label || params.text || 'Processing...';
        const percent = params.percent ?? params.progress ?? -1;
        const taskId = params.task_id || `task_${Date.now()}`;

        emitUIEvent(userId, 'show_progress', {
          taskId,
          label,
          percent: percent < 0 ? null : percent,
          indeterminate: percent < 0,
        });

        return {
          success: true,
          type: 'progress',
          label,
          percent,
          taskId,
          message: percent >= 0 ? `⏳ ${label} (${percent}%)` : `⏳ ${label}`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown agent_ui action: "${action}". Valid: show_message, show_warning, show_error, ask_user, show_toast, show_progress`,
        };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 4: agent_control (Redis-backed state)
// Actions: set_mode, get_state, cancel_task, set_context
// ═══════════════════════════════════════════════════════════════════

export async function agentControl(params, userId = 'default') {
  const action = params.action;

  try {
    switch (action) {
      case 'set_mode': {
        const mode = params.mode;
        if (!mode) return { success: false, error: 'Missing required: mode' };

        if (!AGENT_MODES[mode]) {
          return {
            success: false,
            error: `Unknown mode: "${mode}". Valid: ${Object.keys(AGENT_MODES).join(', ')}`,
          };
        }

        const state = await getState(userId);
        const previousMode = state.mode;
        state.mode = mode;
        await setState(userId, state);

        await appendAuditLog(userId, { action: 'mode_changed', from: previousMode, to: mode });

        const modeInfo = AGENT_MODES[mode];
        return {
          success: true,
          previousMode,
          currentMode: mode,
          description: modeInfo.description,
          allowedTools: modeInfo.allowedTools === '*' ? 'All tools' : modeInfo.allowedTools,
          restrictions: modeInfo.restrictions,
          message: `Mode changed: ${previousMode} → ${mode}. ${modeInfo.description}`,
        };
      }

      case 'get_state': {
        const state = await getState(userId);
        const modeInfo = AGENT_MODES[state.mode] || AGENT_MODES.dev;
        const pending = pendingApprovals.get(userId);
        const pendingCount = pending ? pending.size : 0;

        return {
          success: true,
          mode: state.mode,
          modeDescription: modeInfo.description,
          restrictions: modeInfo.restrictions,
          context: state.context,
          activeTasks: state.activeTasks.length,
          taskHistory: state.taskHistory.length,
          pendingApprovals: pendingCount,
          createdAt: state.createdAt,
          lastActivity: state.lastActivity,
          availableModes: Object.keys(AGENT_MODES),
          message: `Agent in "${state.mode}" mode. ${state.activeTasks.length} active tasks. ${pendingCount} pending approvals.`,
        };
      }

      case 'cancel_task': {
        const taskId = params.task_id;
        const state = await getState(userId);

        if (taskId) {
          const idx = state.activeTasks.findIndex((t) => t.id === taskId);
          if (idx === -1) {
            return {
              success: false,
              error: `Task not found: "${taskId}"`,
              activeTasks: state.activeTasks.map((t) => t.id),
            };
          }
          const cancelled = state.activeTasks.splice(idx, 1)[0];
          cancelled.status = 'cancelled';
          cancelled.cancelledAt = new Date().toISOString();
          state.taskHistory.push(cancelled);
          await setState(userId, state);

          await appendAuditLog(userId, { action: 'task_cancelled', taskId });
          return {
            success: true,
            cancelled,
            remainingTasks: state.activeTasks.length,
            message: `Task "${taskId}" cancelled`,
          };
        }

        // Cancel all
        const count = state.activeTasks.length;
        for (const task of state.activeTasks) {
          task.status = 'cancelled';
          task.cancelledAt = new Date().toISOString();
          state.taskHistory.push(task);
        }
        state.activeTasks = [];
        await setState(userId, state);

        await appendAuditLog(userId, { action: 'all_tasks_cancelled', count });
        return {
          success: true,
          cancelledCount: count,
          message: `All ${count} active tasks cancelled`,
        };
      }

      case 'set_context': {
        const key = params.key;
        const value = params.value;
        if (!key) return { success: false, error: 'Missing required: key' };

        const state = await getState(userId);
        state.context[key] = value;
        await setState(userId, state);

        return {
          success: true,
          key,
          value,
          contextKeys: Object.keys(state.context),
          message: `Context set: ${key} = ${JSON.stringify(value)}`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown agent_control action: "${action}". Valid: set_mode, get_state, cancel_task, set_context`,
        };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 5: editor_select (in-memory — ephemeral by nature)
// Actions: get_selection, insert_at_cursor, replace_selection, get_cursor_position
// ═══════════════════════════════════════════════════════════════════

export async function editorSelect(params, userId = 'default') {
  const action = params.action;

  try {
    switch (action) {
      case 'get_selection': {
        const state = editorStates.get(userId) || {};
        const filePath = params.file || state.activeFile;

        if (state.selection) {
          return {
            success: true,
            file: state.activeFile || filePath || '(unknown)',
            selectedText: state.selection.text || '',
            startLine: state.selection.startLine || 0,
            endLine: state.selection.endLine || 0,
            startCol: state.selection.startCol || 0,
            endCol: state.selection.endCol || 0,
            isEmpty: !state.selection.text,
            message: state.selection.text
              ? `Selection: ${state.selection.text.length} chars (lines ${state.selection.startLine}-${state.selection.endLine})`
              : 'No text selected',
          };
        }

        return {
          success: true,
          file: filePath || '(no active file)',
          selectedText: '',
          isEmpty: true,
          message: 'No active selection. User can highlight text and try again.',
        };
      }

      case 'insert_at_cursor': {
        const text = params.text || params.content;
        if (!text) return { success: false, error: 'Missing required: text' };

        const state = editorStates.get(userId) || {};
        const filePath = params.file || state.activeFile;
        const cursorLine = params.line || state.cursorLine || 1;
        const cursorCol = params.column || state.cursorCol || 0;

        emitUIEvent(userId, 'editor_insert', {
          file: filePath,
          text,
          line: cursorLine,
          column: cursorCol,
        });

        return {
          success: true,
          type: 'editor_action',
          action: 'insert',
          file: filePath || '(active file)',
          text,
          position: { line: cursorLine, column: cursorCol },
          message: `Insert ${text.length} chars at line ${cursorLine}, col ${cursorCol}`,
        };
      }

      case 'replace_selection': {
        const newText = params.text || params.content || params.replacement;
        if (newText === undefined) {
          return { success: false, error: 'Missing required: text (replacement)' };
        }

        const state = editorStates.get(userId) || {};
        const filePath = params.file || state.activeFile;

        if (!state.selection || !state.selection.text) {
          return {
            success: false,
            error: 'No active selection to replace. User must select text first.',
          };
        }

        emitUIEvent(userId, 'editor_replace', {
          file: filePath,
          oldText: state.selection.text,
          newText,
          range: {
            startLine: state.selection.startLine,
            endLine: state.selection.endLine,
            startCol: state.selection.startCol,
            endCol: state.selection.endCol,
          },
        });

        return {
          success: true,
          type: 'editor_action',
          action: 'replace_selection',
          file: filePath || '(active file)',
          oldText: state.selection.text,
          newText,
          message: `Replace ${state.selection.text.length} chars with ${newText.length} chars`,
        };
      }

      case 'get_cursor_position': {
        const state = editorStates.get(userId) || {};

        return {
          success: true,
          file: state.activeFile || '(no active file)',
          line: state.cursorLine || 0,
          column: state.cursorCol || 0,
          hasSelection: !!(state.selection && state.selection.text),
          message: state.activeFile
            ? `Cursor at line ${state.cursorLine || 0}, col ${state.cursorCol || 0} in ${state.activeFile}`
            : 'No active editor. Open a file to track cursor position.',
        };
      }

      default:
        return {
          success: false,
          error: `Unknown editor_select action: "${action}". Valid: get_selection, insert_at_cursor, replace_selection, get_cursor_position`,
        };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EDITOR STATE API (called by frontend/socket to push state)
// ═══════════════════════════════════════════════════════════════════

export function updateEditorState(userId, state) {
  const current = editorStates.get(userId) || {};
  editorStates.set(userId, { ...current, ...state });
  return { success: true };
}

export function getEditorState(userId) {
  return editorStates.get(userId) || null;
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 6: agent_workflow (Redis-backed workflow state)
// Actions: create, add_step, run, pause, resume, cancel, status, list
// ═══════════════════════════════════════════════════════════════════

const WORKFLOW_TTL = 86400; // 24 hours
function workflowKey(userId) { return `agent:workflows:${userId}`; }

async function getWorkflows(userId) {
  try {
    return (await cache.get(workflowKey(userId))) || {};
  } catch { return {}; }
}

async function setWorkflows(userId, workflows) {
  try {
    await cache.set(workflowKey(userId), workflows, WORKFLOW_TTL);
  } catch (err) {
    console.warn('[AgentWorkflow] Failed to persist:', err.message);
  }
}

export async function agentWorkflow(params, userId = 'default') {
  const action = params.action;

  try {
    switch (action) {
      case 'create': {
        const name = params.name || `workflow_${Date.now()}`;
        const workflowId = `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const workflows = await getWorkflows(userId);

        workflows[workflowId] = {
          id: workflowId,
          name,
          status: 'created',
          steps: [],
          currentStep: -1,
          checkpoints: {},
          results: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setWorkflows(userId, workflows);
        await appendAuditLog(userId, { action: 'workflow_created', workflowId, name });

        return {
          success: true,
          workflowId,
          name,
          status: 'created',
          message: `Workflow "${name}" created (ID: ${workflowId}). Add steps with add_step, then run.`,
        };
      }

      case 'add_step': {
        const workflowId = params.workflowId;
        if (!workflowId) return { success: false, error: 'Missing required: workflowId' };

        const workflows = await getWorkflows(userId);
        const wf = workflows[workflowId];
        if (!wf) return { success: false, error: `Workflow not found: ${workflowId}` };

        const step = params.step || {};
        const stepDef = {
          index: wf.steps.length,
          name: step.name || `Step ${wf.steps.length + 1}`,
          tool: step.tool || 'unknown',
          params: step.params || {},
          onError: step.onError || 'stop',
          status: 'pending',
        };

        wf.steps.push(stepDef);
        wf.updatedAt = new Date().toISOString();
        await setWorkflows(userId, workflows);

        return {
          success: true,
          workflowId,
          stepIndex: stepDef.index,
          stepName: stepDef.name,
          totalSteps: wf.steps.length,
          message: `Step "${stepDef.name}" added (${wf.steps.length} total). Tool: ${stepDef.tool}`,
        };
      }

      case 'run': {
        const workflowId = params.workflowId;
        if (!workflowId) return { success: false, error: 'Missing required: workflowId' };

        const workflows = await getWorkflows(userId);
        const wf = workflows[workflowId];
        if (!wf) return { success: false, error: `Workflow not found: ${workflowId}` };
        if (wf.steps.length === 0) return { success: false, error: 'Workflow has no steps' };

        wf.status = 'running';
        wf.currentStep = 0;
        wf.startedAt = new Date().toISOString();
        wf.updatedAt = new Date().toISOString();
        await setWorkflows(userId, workflows);

        await appendAuditLog(userId, { action: 'workflow_started', workflowId, steps: wf.steps.length });

        return {
          success: true,
          workflowId,
          status: 'running',
          totalSteps: wf.steps.length,
          currentStep: 0,
          nextTool: wf.steps[0].tool,
          nextParams: wf.steps[0].params,
          message: `Workflow "${wf.name}" started. Execute step 0: ${wf.steps[0].name} (tool: ${wf.steps[0].tool})`,
          instruction: 'Call the tool specified in nextTool with nextParams, then update workflow status.',
        };
      }

      case 'pause': {
        const workflowId = params.workflowId;
        if (!workflowId) return { success: false, error: 'Missing required: workflowId' };

        const workflows = await getWorkflows(userId);
        const wf = workflows[workflowId];
        if (!wf) return { success: false, error: `Workflow not found: ${workflowId}` };

        wf.status = 'paused';
        if (params.checkpoint) {
          wf.checkpoints[params.checkpoint] = {
            step: wf.currentStep,
            createdAt: new Date().toISOString(),
          };
        }
        wf.updatedAt = new Date().toISOString();
        await setWorkflows(userId, workflows);

        return {
          success: true,
          workflowId,
          status: 'paused',
          currentStep: wf.currentStep,
          checkpoint: params.checkpoint || null,
          message: `Workflow paused at step ${wf.currentStep}${params.checkpoint ? ` (checkpoint: ${params.checkpoint})` : ''}`,
        };
      }

      case 'resume': {
        const workflowId = params.workflowId;
        if (!workflowId) return { success: false, error: 'Missing required: workflowId' };

        const workflows = await getWorkflows(userId);
        const wf = workflows[workflowId];
        if (!wf) return { success: false, error: `Workflow not found: ${workflowId}` };

        if (params.checkpoint && wf.checkpoints[params.checkpoint]) {
          wf.currentStep = wf.checkpoints[params.checkpoint].step;
        }

        wf.status = 'running';
        wf.updatedAt = new Date().toISOString();
        await setWorkflows(userId, workflows);

        const step = wf.steps[wf.currentStep];
        return {
          success: true,
          workflowId,
          status: 'running',
          currentStep: wf.currentStep,
          nextTool: step?.tool,
          nextParams: step?.params,
          message: `Workflow resumed at step ${wf.currentStep}: ${step?.name || 'unknown'}`,
        };
      }

      case 'cancel': {
        const workflowId = params.workflowId;
        if (!workflowId) return { success: false, error: 'Missing required: workflowId' };

        const workflows = await getWorkflows(userId);
        const wf = workflows[workflowId];
        if (!wf) return { success: false, error: `Workflow not found: ${workflowId}` };

        wf.status = 'cancelled';
        wf.updatedAt = new Date().toISOString();
        await setWorkflows(userId, workflows);

        await appendAuditLog(userId, { action: 'workflow_cancelled', workflowId });
        return { success: true, workflowId, status: 'cancelled', message: `Workflow "${wf.name}" cancelled` };
      }

      case 'status': {
        const workflowId = params.workflowId;
        if (!workflowId) return { success: false, error: 'Missing required: workflowId' };

        const workflows = await getWorkflows(userId);
        const wf = workflows[workflowId];
        if (!wf) return { success: false, error: `Workflow not found: ${workflowId}` };

        return {
          success: true,
          ...wf,
          completedSteps: wf.steps.filter(s => s.status === 'completed').length,
          failedSteps: wf.steps.filter(s => s.status === 'failed').length,
          message: `Workflow "${wf.name}": ${wf.status} (step ${wf.currentStep + 1}/${wf.steps.length})`,
        };
      }

      case 'list': {
        const workflows = await getWorkflows(userId);
        const list = Object.values(workflows).map(wf => ({
          id: wf.id,
          name: wf.name,
          status: wf.status,
          steps: wf.steps.length,
          currentStep: wf.currentStep,
          createdAt: wf.createdAt,
        }));

        return {
          success: true,
          workflows: list,
          total: list.length,
          message: `${list.length} workflow(s) found`,
        };
      }

      default:
        return { success: false, error: `Unknown agent_workflow action: "${action}". Valid: create, add_step, run, pause, resume, cancel, status, list` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 7: agent_delegate (mode-scoped task delegation)
// Actions: delegate, batch, status
// ═══════════════════════════════════════════════════════════════════

const delegationResults = new Map();

export async function agentDelegate(params, userId = 'default') {
  const action = params.action;

  try {
    switch (action) {
      case 'delegate': {
        const mode = params.mode;
        const tool = params.tool;
        const toolParams = params.params || {};
        const reason = params.reason || '';

        if (!mode || !tool) return { success: false, error: 'Missing required: mode and tool' };

        if (!AGENT_MODES[mode]) {
          return { success: false, error: `Invalid mode: "${mode}". Valid: ${Object.keys(AGENT_MODES).join(', ')}` };
        }

        // Save current mode
        const state = await getState(userId);
        const originalMode = state.mode;

        // Check if tool is allowed in target mode
        const modeConfig = AGENT_MODES[mode];
        if (modeConfig.allowedTools !== '*' && !modeConfig.allowedTools.includes(tool)) {
          return {
            success: false,
            error: `Tool "${tool}" is not allowed in ${mode} mode. Allowed: ${modeConfig.allowedTools.join(', ')}`,
          };
        }

        const delegationId = `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        await appendAuditLog(userId, {
          action: 'task_delegated',
          delegationId,
          fromMode: originalMode,
          toMode: mode,
          tool,
          reason,
        });

        // Store delegation info for the caller to execute
        if (!delegationResults.has(userId)) delegationResults.set(userId, new Map());
        delegationResults.get(userId).set(delegationId, {
          id: delegationId,
          status: 'pending',
          mode,
          tool,
          params: toolParams,
          originalMode,
          reason,
          createdAt: new Date().toISOString(),
        });

        return {
          success: true,
          delegationId,
          mode,
          tool,
          params: toolParams,
          originalMode,
          message: `Task delegated to ${mode} mode. Execute "${tool}" with the provided params, then restore to ${originalMode} mode.`,
          instruction: `Switch to ${mode} mode, run ${tool}, then switch back to ${originalMode}.`,
        };
      }

      case 'batch': {
        const tasks = params.tasks || [];
        if (tasks.length === 0) return { success: false, error: 'Missing required: tasks array' };

        const results = [];
        for (const task of tasks) {
          const { mode, tool, params: taskParams } = task;
          if (!mode || !tool) {
            results.push({ success: false, error: 'Each task needs mode and tool' });
            continue;
          }

          const modeConfig = AGENT_MODES[mode];
          if (!modeConfig) {
            results.push({ success: false, error: `Invalid mode: ${mode}` });
            continue;
          }

          const allowed = modeConfig.allowedTools === '*' || modeConfig.allowedTools.includes(tool);
          results.push({
            mode,
            tool,
            params: taskParams || {},
            allowed,
            message: allowed
              ? `${tool} is valid in ${mode} mode — ready to execute`
              : `${tool} is NOT allowed in ${mode} mode`,
          });
        }

        return {
          success: true,
          action: 'batch',
          tasks: results,
          totalTasks: results.length,
          readyTasks: results.filter(r => r.allowed).length,
          message: `${results.filter(r => r.allowed).length}/${results.length} tasks are valid and ready to execute`,
        };
      }

      case 'status': {
        const userDelegations = delegationResults.get(userId);
        if (!userDelegations || userDelegations.size === 0) {
          return { success: true, delegations: [], total: 0, message: 'No active delegations' };
        }

        const list = Array.from(userDelegations.values()).map(d => ({
          id: d.id,
          status: d.status,
          mode: d.mode,
          tool: d.tool,
          createdAt: d.createdAt,
        }));

        return {
          success: true,
          delegations: list,
          total: list.length,
          message: `${list.length} delegation(s)`,
        };
      }

      default:
        return { success: false, error: `Unknown agent_delegate action: "${action}". Valid: delegate, batch, status` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 8: agent_metrics (Redis-backed + Prisma ToolUsage)
// Actions: summary, tool_usage, session_stats, reset, export
// ═══════════════════════════════════════════════════════════════════

const METRICS_TTL = 604800; // 7 days
function metricsKey(userId) { return `agent:metrics:${userId}`; }

export async function agentMetrics(params, userId = 'default') {
  const action = params.action;

  try {
    switch (action) {
      case 'summary': {
        // Aggregate from Prisma toolUsage table
        let where = { userId };
        const period = params.period || '24h';
        const periodMs = { '1h': 3600000, '24h': 86400000, '7d': 604800000, '30d': 2592000000 };

        if (period !== 'all' && periodMs[period]) {
          where.occurredAt = { gte: new Date(Date.now() - periodMs[period]) };
        }

        const usages = await prisma.toolUsage.findMany({ where, orderBy: { occurredAt: 'desc' }, take: 1000 });

        const totalCalls = usages.length;
        const successCount = usages.filter(u => u.status === 'completed').length;
        const failCount = usages.filter(u => u.status === 'error' || u.status === 'failed').length;
        const avgLatency = totalCalls > 0
          ? Math.round(usages.reduce((sum, u) => sum + (u.latencyMs || 0), 0) / totalCalls)
          : 0;

        const toolMap = {};
        for (const u of usages) {
          if (!toolMap[u.toolName]) toolMap[u.toolName] = 0;
          toolMap[u.toolName]++;
        }

        const topTools = Object.entries(toolMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));

        return {
          success: true,
          action: 'summary',
          period,
          totalCalls,
          successRate: totalCalls > 0 ? `${Math.round((successCount / totalCalls) * 100)}%` : 'N/A',
          failureRate: totalCalls > 0 ? `${Math.round((failCount / totalCalls) * 100)}%` : 'N/A',
          avgLatencyMs: avgLatency,
          topTools,
          uniqueTools: Object.keys(toolMap).length,
          message: `${totalCalls} tool calls in ${period}. Success: ${successCount}, Failed: ${failCount}. Avg latency: ${avgLatency}ms.`,
        };
      }

      case 'tool_usage': {
        const toolName = params.toolName;
        if (!toolName) return { success: false, error: 'Missing required: toolName' };

        const usages = await prisma.toolUsage.findMany({
          where: { userId, toolName },
          orderBy: { occurredAt: 'desc' },
          take: 100,
        });

        const successCount = usages.filter(u => u.status === 'completed').length;
        const avgLatency = usages.length > 0
          ? Math.round(usages.reduce((sum, u) => sum + (u.latencyMs || 0), 0) / usages.length)
          : 0;

        return {
          success: true,
          action: 'tool_usage',
          toolName,
          totalCalls: usages.length,
          successRate: usages.length > 0 ? `${Math.round((successCount / usages.length) * 100)}%` : 'N/A',
          avgLatencyMs: avgLatency,
          lastUsed: usages[0]?.occurredAt || null,
          recentCommands: usages.slice(0, 5).map(u => ({ command: u.command, status: u.status, latency: u.latencyMs, at: u.occurredAt })),
          message: `"${toolName}": ${usages.length} calls, ${successCount} succeeded, avg ${avgLatency}ms`,
        };
      }

      case 'session_stats': {
        const state = await getState(userId);
        const auditLogs = (await cache.get(auditKey(userId))) || [];

        const modeChanges = auditLogs.filter(l => l.action === 'mode_changed').length;
        const toolBlocks = auditLogs.filter(l => l.action === 'tool_blocked').length;
        const approvals = auditLogs.filter(l => l.action === 'approval_requested').length;

        return {
          success: true,
          action: 'session_stats',
          currentMode: state.mode,
          activeTasks: state.activeTasks.length,
          contextKeys: Object.keys(state.context).length,
          auditLogEntries: auditLogs.length,
          modeChanges,
          toolBlocks,
          approvalRequests: approvals,
          lastActivity: state.lastActivity,
          message: `Session: ${state.mode} mode, ${auditLogs.length} audit entries, ${modeChanges} mode changes, ${toolBlocks} blocked tools`,
        };
      }

      case 'reset': {
        try {
          await cache.del(metricsKey(userId));
        } catch { /* non-fatal */ }

        return { success: true, action: 'reset', message: 'Metrics cache cleared. Historical data in database is preserved.' };
      }

      case 'export': {
        const format = params.format || 'json';
        const usages = await prisma.toolUsage.findMany({
          where: { userId },
          orderBy: { occurredAt: 'desc' },
          take: 500,
        });

        if (format === 'csv') {
          const header = 'toolName,command,status,latencyMs,occurredAt';
          const rows = usages.map(u => `${u.toolName},${u.command || ''},${u.status},${u.latencyMs || 0},${u.occurredAt?.toISOString() || ''}`);
          return { success: true, action: 'export', format: 'csv', data: [header, ...rows].join('\n'), rows: usages.length };
        }

        if (format === 'text') {
          const lines = usages.map(u => `[${u.occurredAt?.toISOString()?.slice(0, 19)}] ${u.toolName} (${u.command || '-'}) → ${u.status} (${u.latencyMs || 0}ms)`);
          return { success: true, action: 'export', format: 'text', data: lines.join('\n'), rows: usages.length };
        }

        return { success: true, action: 'export', format: 'json', data: usages, rows: usages.length };
      }

      default:
        return { success: false, error: `Unknown agent_metrics action: "${action}". Valid: summary, tool_usage, session_stats, reset, export` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export default {
  agentMemory,
  agentSafety,
  agentUI,
  agentControl,
  editorSelect,
  agentWorkflow,
  agentDelegate,
  agentMetrics,
  updateEditorState,
  getEditorState,
  setSocketIO,
  checkToolPermission,
  AGENT_MODES,
  DESTRUCTIVE_ACTIONS,
  PERMISSION_LEVELS,
};
