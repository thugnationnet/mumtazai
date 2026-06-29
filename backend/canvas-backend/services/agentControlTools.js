/**
 * AGENT CONTROL TOOLS
 * Mode switching, state management, planning, context
 */

export const AGENT_CONTROL_TOOL_DEFINITIONS = [
  {
    name: 'agent_control',
    description: 'Switch agent modes, get current state, cancel tasks, or set context.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['get_state', 'set_mode', 'cancel', 'set_context', 'get_context'],
                     description: 'Control operation' },
        mode:    { type: 'string', description: 'Mode to switch to (for set_mode)' },
        context: { type: 'object', description: 'Context data to set (for set_context)' },
      },
      required: ['operation'],
    },
  },
];

export const AGENT_MODES = ['Chat', 'Agent', 'Code', 'Canvas', 'Research'];

const _agentState = { mode: 'Chat', context: {}, history: [] };

export function getAgentState() { return { ..._agentState }; }

export async function executeAgentControlTool(toolName, input, ctx = {}) {
  switch (toolName) {
    case 'agent_control': {
      switch (input.operation) {
        case 'get_state':  return { result: JSON.stringify({ status: 'success', state: _agentState }) };
        case 'set_mode':   { _agentState.mode = input.mode; return { result: JSON.stringify({ status: 'success', mode: input.mode }) }; }
        case 'set_context':{ Object.assign(_agentState.context, input.context || {}); return { result: JSON.stringify({ status: 'success' }) }; }
        case 'get_context':return { result: JSON.stringify({ status: 'success', context: _agentState.context }) };
        default: return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
      }
    }
    default: return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
  }
}

export const isAgentControlTool = (name) => AGENT_CONTROL_TOOL_DEFINITIONS.some(t => t.name === name);
