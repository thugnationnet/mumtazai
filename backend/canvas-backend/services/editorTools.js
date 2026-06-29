/**
 * EDITOR TOOLS  —  cursor/selection/insert operations in the canvas editor
 * These tools communicate back to the frontend via SSE sideEffects.
 */

export const EDITOR_TOOL_DEFINITIONS = [
  {
    name: 'editor_select',
    description: 'Get or set cursor position, selected text, or make a selection range in the editor.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['get_cursor','get_selection','set_cursor','select_range','select_all','deselect'],
                     description: 'Editor operation' },
        line:      { type: 'number', description: 'Line number (1-based) for set_cursor' },
        column:    { type: 'number', description: 'Column number (1-based) for set_cursor' },
        start_line:   { type: 'number', description: 'Selection start line (for select_range)' },
        start_column: { type: 'number', description: 'Selection start column' },
        end_line:     { type: 'number', description: 'Selection end line (for select_range)' },
        end_column:   { type: 'number', description: 'Selection end column' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'editor_insert',
    description: 'Insert, replace, or append text in the editor at cursor or specified position.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['insert_at_cursor','replace_selection','append','prepend','insert_at_line'],
                     description: 'Insert operation' },
        content:   { type: 'string', description: 'Text to insert' },
        line:      { type: 'number', description: 'Line number for insert_at_line (1-based)' },
      },
      required: ['operation', 'content'],
    },
  },
  {
    name: 'editor_action',
    description: 'Trigger editor actions: undo, redo, format, find, fold/unfold, toggle comment.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['undo','redo','format','save','find','fold_all','unfold_all','toggle_comment','go_to_line'],
                  description: 'Action to perform' },
        query:  { type: 'string', description: 'Search query (for find)' },
        line:   { type: 'number', description: 'Target line (for go_to_line)' },
      },
      required: ['action'],
    },
  },
];

export async function executeEditorTool(toolName, input, ctx = {}) {
  // Editor tools work by sending sideEffects back to the frontend via SSE.
  // The editorContext in ctx contains current cursor/selection data from the client.
  const editorCtx = ctx.editorContext || {};
  const sseWrite  = ctx.sseWrite || (() => {});

  try {
    switch (toolName) {
      case 'editor_select': {
        switch (input.operation) {
          case 'get_cursor': {
            const cursor = editorCtx.cursor || { line: 1, column: 1 };
            return { result: JSON.stringify({ status: 'success', cursor }) };
          }
          case 'get_selection': {
            const selection = editorCtx.selection || null;
            const text      = editorCtx.selectedText || '';
            return { result: JSON.stringify({ status: 'success', selection, selected_text: text }) };
          }
          case 'set_cursor': {
            const cmd = { type: 'editor_command', command: 'set_cursor', line: input.line, column: input.column };
            sseWrite(cmd);
            return { result: JSON.stringify({ status: 'success', cursor: { line: input.line, column: input.column } }), sideEffects: cmd };
          }
          case 'select_range': {
            const cmd = { type: 'editor_command', command: 'select_range',
              start: { line: input.start_line, column: input.start_column },
              end:   { line: input.end_line,   column: input.end_column   } };
            sseWrite(cmd);
            return { result: JSON.stringify({ status: 'success' }), sideEffects: cmd };
          }
          case 'select_all': {
            const cmd = { type: 'editor_command', command: 'select_all' };
            sseWrite(cmd);
            return { result: JSON.stringify({ status: 'success' }), sideEffects: cmd };
          }
          case 'deselect': {
            const cmd = { type: 'editor_command', command: 'deselect' };
            sseWrite(cmd);
            return { result: JSON.stringify({ status: 'success' }), sideEffects: cmd };
          }
          default: throw new Error(`Unknown editor_select operation: ${input.operation}`);
        }
      }

      case 'editor_insert': {
        const cmd = { type: 'editor_command', command: input.operation, content: input.content, line: input.line };
        sseWrite(cmd);
        return { result: JSON.stringify({ status: 'success', operation: input.operation }), sideEffects: cmd };
      }

      case 'editor_action': {
        const cmd = { type: 'editor_command', command: input.action, query: input.query, line: input.line };
        sseWrite(cmd);
        return { result: JSON.stringify({ status: 'success', action: input.action }), sideEffects: cmd };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isEditorTool = (name) => EDITOR_TOOL_DEFINITIONS.some(t => t.name === name);
