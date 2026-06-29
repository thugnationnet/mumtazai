/**
 * UI INTERACTION TOOLS
 * Tools for agent ↔ user communication: approvals, questions, messages
 *
 * Architecture:
 *  - Fire-and-forget tools (show_message, show_warning, show_error) emit SSE events
 *    and return immediately.
 *  - Blocking tools (request_approval, ask_user) emit an SSE event then await a
 *    pending-interaction Promise that is resolved when the frontend POSTs to
 *    /api/canvas/agent-respond/:interactionId.
 *  - check_permission is server-side only.
 *
 * The ctx object MUST include `sseWrite(data)` for tools that need to push
 * events to the connected client during execution.
 */

import crypto from 'crypto';

// ============================================================================
// PENDING INTERACTIONS (blocking tool support)
// ============================================================================

const pendingInteractions = new Map(); // interactionId → { resolve, timer }

/**
 * Create a pending interaction and return a Promise that resolves when the
 * frontend responds via the HTTP callback endpoint.
 */
function createPendingInteraction(id, timeoutMs = 120_000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingInteractions.delete(id);
      resolve({ status: 'timeout' });
    }, timeoutMs);
    pendingInteractions.set(id, { resolve, timer });
  });
}

/**
 * Resolve a pending interaction from the HTTP callback endpoint.
 * Returns true if the interaction was found and resolved.
 */
export function resolveInteraction(id, data) {
  const pending = pendingInteractions.get(id);
  if (!pending) return false;
  clearTimeout(pending.timer);
  pendingInteractions.delete(id);
  pending.resolve(data);
  return true;
}

// ============================================================================
// PERMISSION RULES (server-side)
// ============================================================================

const BLOCKED_ACTIONS = new Set([
  'rm_rf', 'format_disk', 'drop_database', 'sudo',
]);

const RESTRICTED_PATHS = [
  /^\/etc\//,
  /^\/usr\//,
  /^\/sys\//,
  /^\/proc\//,
  /^\.\.\//,
  /node_modules/,
];

function checkPermissionRules(action, path) {
  if (BLOCKED_ACTIONS.has(action)) {
    return { allowed: false, reason: `Action "${action}" is blocked by server policy` };
  }
  if (path) {
    for (const pattern of RESTRICTED_PATHS) {
      if (pattern.test(path)) {
        return { allowed: false, reason: `Path "${path}" is restricted` };
      }
    }
  }
  return { allowed: true, reason: 'Permitted' };
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const UI_INTERACTION_TOOL_DEFINITIONS = [
  {
    name: 'show_message',
    description: 'Display an informational message to the user as a toast notification.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Message text to display' },
      },
      required: ['text'],
    },
  },
  {
    name: 'show_warning',
    description: 'Display a warning message to the user as a toast notification.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Warning text to display' },
      },
      required: ['text'],
    },
  },
  {
    name: 'show_error',
    description: 'Display an error message to the user as a toast notification.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Error text to display' },
      },
      required: ['text'],
    },
  },
  {
    name: 'request_approval',
    description: 'Ask the user for explicit approval before performing a destructive or important action. The agent will pause and wait for the users response before continuing.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Short name of the action needing approval' },
        details: { type: 'string', description: 'Explanation of what will happen and why approval is needed' },
      },
      required: ['action'],
    },
  },
  {
    name: 'check_permission',
    description: 'Check whether an action is allowed by server-side permission rules. Returns immediately without user interaction.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Action to check (e.g. "delete_file", "deploy")' },
        path: { type: 'string', description: 'Optional file path for path-based permission checks' },
      },
      required: ['action'],
    },
  },
  {
    name: 'ask_user',
    description: 'Ask the user a question and wait for their typed response. Use type "confirm" for yes/no questions and "prompt" for open-ended questions.',
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to ask the user' },
        type: { type: 'string', enum: ['confirm', 'prompt'], description: 'confirm = yes/no, prompt = free text' },
        defaultValue: { type: 'string', description: 'Default answer shown in the input field' },
      },
      required: ['question'],
    },
  },
];

const UI_TOOL_NAMES = new Set(UI_INTERACTION_TOOL_DEFINITIONS.map(t => t.name));

export function isUiInteractionTool(name) {
  return UI_TOOL_NAMES.has(name);
}

// ============================================================================
// TOOL EXECUTOR
// ============================================================================

export async function executeUiInteractionTool(toolName, input, ctx = {}) {
  const sseWrite = ctx.sseWrite || (() => {});

  switch (toolName) {
    // ── Fire-and-forget messages ──
    case 'show_message': {
      sseWrite({ type: 'agent_ui_toast', level: 'info', content: input.text });
      return { result: JSON.stringify({ status: 'success', delivered: true }) };
    }
    case 'show_warning': {
      sseWrite({ type: 'agent_ui_toast', level: 'warning', content: input.text });
      return { result: JSON.stringify({ status: 'success', delivered: true }) };
    }
    case 'show_error': {
      sseWrite({ type: 'agent_ui_toast', level: 'error', content: input.text });
      return { result: JSON.stringify({ status: 'success', delivered: true }) };
    }

    // ── Blocking: approval ──
    case 'request_approval': {
      const interactionId = crypto.randomUUID();
      sseWrite({
        type: 'agent_approval_request',
        interactionId,
        action: input.action,
        details: input.details || '',
        level: 'confirm',
      });
      const response = await createPendingInteraction(interactionId);
      if (response.status === 'timeout') {
        return { result: JSON.stringify({ status: 'timeout', approved: false, reason: 'User did not respond in time' }) };
      }
      return { result: JSON.stringify({ status: 'success', approved: !!response.approved }) };
    }

    // ── Server-side permission check ──
    case 'check_permission': {
      const perm = checkPermissionRules(input.action, input.path);
      return { result: JSON.stringify({ status: 'success', ...perm }) };
    }

    // ── Blocking: ask user ──
    case 'ask_user': {
      const interactionId = crypto.randomUUID();
      sseWrite({
        type: 'agent_ui_question',
        interactionId,
        question: input.question,
        questionType: input.type || 'prompt',
        defaultValue: input.defaultValue || '',
      });
      const response = await createPendingInteraction(interactionId);
      if (response.status === 'timeout') {
        return { result: JSON.stringify({ status: 'timeout', answer: null, reason: 'User did not respond in time' }) };
      }
      return { result: JSON.stringify({ status: 'success', answer: response.answer ?? null, confirmed: response.confirmed ?? null }) };
    }

    default:
      return { result: JSON.stringify({ status: 'error', error: `Unknown UI tool: ${toolName}` }) };
  }
}
