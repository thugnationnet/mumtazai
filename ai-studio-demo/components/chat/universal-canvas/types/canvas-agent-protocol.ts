/**
 * Canvas Agent Protocol
 * 
 * Structured, typed JSON action protocol replacing regex-parsed text blocks.
 * Defines the bidirectional communication between the AI agent and the editor:
 * 
 *   Agent → Editor: AgentAction (create/edit/delete files, run commands, etc.)
 *   Editor → Agent: EditorContext (current file, cursor, errors, project tree)
 * 
 * All agent commands are now typed JSON objects instead of ```agent:xxx``` text blocks.
 */

import type {
  ProjectPage,
  FileLanguage,
  ProjectFramework,
  DeployProvider,
  BuildError,
} from './canvas-types';

// =============================================================================
// 1. AGENT → EDITOR ACTIONS
// =============================================================================

/**
 * All possible actions the agent can perform on the editor.
 * Each action has a `type` discriminator and typed `payload`.
 */
export type AgentBridgeAction =
  // File System
  | { type: 'file.create'; payload: FileCreatePayload }
  | { type: 'file.edit'; payload: FileEditPayload }
  | { type: 'file.delete'; payload: FileDeletePayload }
  | { type: 'file.rename'; payload: FileRenamePayload }
  | { type: 'file.move'; payload: FileMovePayload }
  // Cursor & Selection
  | { type: 'cursor.set'; payload: CursorSetPayload }
  | { type: 'cursor.insert'; payload: CursorInsertPayload }
  | { type: 'selection.replace'; payload: SelectionReplacePayload }
  // Search
  | { type: 'search.files'; payload: SearchFilesPayload }
  | { type: 'search.open'; payload: SearchOpenPayload }
  // Diff & Safe Editing
  | { type: 'diff.show'; payload: DiffShowPayload }
  | { type: 'diff.apply'; payload: DiffApplyPayload }
  // Execution
  | { type: 'exec.run'; payload: ExecRunPayload }
  | { type: 'exec.test'; payload: ExecTestPayload }
  // Project
  | { type: 'project.setFramework'; payload: { framework: ProjectFramework } }
  | { type: 'project.addDependency'; payload: { packages: string[] } }
  | { type: 'project.setEnv'; payload: { vars: Record<string, string> } }
  | { type: 'project.createPage'; payload: ProjectPage }
  // Deploy
  | { type: 'deploy.start'; payload: DeployStartPayload }
  | { type: 'deploy.validate'; payload: Record<string, never> }
  // UI
  | { type: 'ui.message'; payload: UIMessagePayload }
  | { type: 'ui.ask'; payload: UIAskPayload }
  | { type: 'ui.requestApproval'; payload: ApprovalPayload }
  // Agent Control
  | { type: 'agent.setMode'; payload: { mode: AgentMode } }
  | { type: 'agent.log'; payload: { level: 'info' | 'warn' | 'error'; message: string } };

// --- File System Payloads ---

export interface FileCreatePayload {
  path: string;
  content: string;
  language?: FileLanguage;
  isEntryPoint?: boolean;
}

export interface FileEditPayload {
  path: string;
  /** Full file content replacement */
  content?: string;
  /** Language override */
  language?: FileLanguage;
  /** Targeted diff edit — preferred over full replacement */
  diff?: DiffHunk[];
}

export interface FileDeletePayload {
  path: string;
}

export interface FileRenamePayload {
  from: string;
  to: string;
}

export interface FileMovePayload {
  from: string;
  to: string;
}

// --- Cursor & Selection Payloads ---

export interface CursorSetPayload {
  file: string;
  line: number;
  column: number;
}

export interface CursorInsertPayload {
  text: string;
}

export interface SelectionReplacePayload {
  text: string;
}

// --- Search Payloads ---

export interface SearchFilesPayload {
  query: string;
  regex?: boolean;
  includePattern?: string;
}

export interface SearchOpenPayload {
  path: string;
  line?: number;
}

// --- Diff Payloads ---

export interface DiffHunk {
  /** Start line (1-based) in the original file */
  startLine: number;
  /** Number of lines to remove from the original */
  deleteCount: number;
  /** Lines to insert at startLine */
  insert: string[];
}

export interface DiffShowPayload {
  path: string;
  originalContent: string;
  modifiedContent: string;
  description?: string;
}

export interface DiffApplyPayload {
  path: string;
  /** Apply by hunks (preferred) */
  hunks?: DiffHunk[];
  /** Or full replacement */
  newContent?: string;
}

// --- Execution Payloads ---

export interface ExecRunPayload {
  command: string;
  cwd?: string;
  timeout?: number;  // ms, default 30_000
}

export interface ExecTestPayload {
  testFile?: string;
  framework?: 'jest' | 'vitest' | 'mocha' | 'pytest';
}

// --- Deploy Payloads ---

export interface DeployStartPayload {
  provider: DeployProvider;
  projectName: string;
  credentialId?: string;
  envVars?: Record<string, string>;
  autoFix?: boolean;
}

// --- UI Payloads ---

export interface UIMessagePayload {
  level: 'info' | 'success' | 'warning' | 'error';
  text: string;
  duration?: number; // ms, 0 = sticky
}

export interface UIAskPayload {
  id: string;
  question: string;
  options?: string[];    // If provided, show as buttons
  defaultValue?: string;
}

export interface ApprovalPayload {
  id: string;
  title: string;
  description: string;
  actions: AgentBridgeAction[];  // The actions pending approval
  destructive?: boolean;
}

// --- Agent Control ---

export type AgentMode = 'chat' | 'plan' | 'code' | 'review' | 'debug';

// =============================================================================
// 2. EDITOR → AGENT CONTEXT (bidirectional)
// =============================================================================

/**
 * Context snapshot sent FROM the editor TO the agent before each request.
 * This gives the agent awareness of the current editor state.
 */
export interface EditorContext {
  // Current file
  activeFile?: {
    path: string;
    language: FileLanguage;
    content: string;
    lineCount: number;
  };

  // Cursor & selection
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    text: string;
  };

  // Visible errors (from build validation)
  errors: BuildError[];

  // Project tree summary
  projectTree: {
    totalFiles: number;
    files: Array<{ path: string; language: FileLanguage; size: number }>;
  };

  // Project context
  framework?: ProjectFramework;
  dependencies?: string[];
  envVars?: string[];  // Just keys, not values

  // Agent state
  mode: AgentMode;
}

// =============================================================================
// 3. ACTION RESULT (feedback from editor back to agent)
// =============================================================================

export interface ActionResult {
  actionType: AgentBridgeAction['type'];
  success: boolean;
  message?: string;
  data?: unknown;
}

// =============================================================================
// 4. FILE VERSION HISTORY
// =============================================================================

export interface FileVersion {
  id: string;
  path: string;
  content: string;
  timestamp: number;
  source: 'user' | 'agent';
  description?: string;  // e.g. "Added login form", "Fixed CSS bug"
}

export interface FileHistory {
  path: string;
  versions: FileVersion[];
  currentVersionId: string;
}

// =============================================================================
// 5. SEARCH RESULT
// =============================================================================

export interface SearchMatch {
  file: string;
  line: number;
  column: number;
  matchText: string;
  lineContent: string;
}

export interface SearchResult {
  query: string;
  totalMatches: number;
  matches: SearchMatch[];
}

// =============================================================================
// 6. TERMINAL / EXECUTION RESULT
// =============================================================================

export interface ExecResult {
  id: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;   // ms
  timedOut: boolean;
}

// =============================================================================
// 7. TOAST / NOTIFICATION
// =============================================================================

export interface Toast {
  id: string;
  level: 'info' | 'success' | 'warning' | 'error';
  text: string;
  duration: number;  // ms, 0 = sticky
  timestamp: number;
}

// =============================================================================
// 8. APPROVAL REQUEST
// =============================================================================

export interface PendingApproval {
  id: string;
  title: string;
  description: string;
  actions: AgentBridgeAction[];
  destructive: boolean;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

// =============================================================================
// 9. PARSE HELPERS — Bridge between old text protocol and new structured protocol
// =============================================================================

/**
 * Parse the old ```agent:xxx``` text blocks into structured AgentBridgeActions.
 * This is the compatibility layer so existing agent prompts still work
 * while we transition to native JSON tool calls.
 */
export function parseTextToActions(fullResponse: string): {
  actions: AgentBridgeAction[];
  cleanMessage: string;
} {
  const actions: AgentBridgeAction[] = [];
  let message = fullResponse;

  // Parse ```agent:command params\n...body...\n``` blocks
  const agentBlockRegex = /```agent:(\w+)([^\n]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = agentBlockRegex.exec(fullResponse)) !== null) {
    const command = match[1];
    const params = match[2].trim();
    const body = match[3].trim();

    // Remove block from display message
    message = message.replace(match[0], '').trim();

    // Parse key="value" params
    const paramMap: Record<string, string> = {};
    const paramRegex = /(\w+)="([^"]*)"/g;
    let pm;
    while ((pm = paramRegex.exec(params)) !== null) {
      paramMap[pm[1]] = pm[2];
    }

    switch (command) {
      case 'create_file':
        actions.push({
          type: 'file.create',
          payload: {
            path: paramMap.path || '/untitled',
            content: body,
            language: paramMap.language as FileLanguage | undefined,
            isEntryPoint: paramMap.entry === 'true',
          },
        });
        break;

      case 'edit_file':
        actions.push({
          type: 'file.edit',
          payload: {
            path: paramMap.path || '',
            content: body,
          },
        });
        break;

      case 'delete_file':
        actions.push({
          type: 'file.delete',
          payload: { path: paramMap.path || body },
        });
        break;

      case 'rename_file':
        actions.push({
          type: 'file.rename',
          payload: {
            from: paramMap.from || '',
            to: paramMap.to || '',
          },
        });
        break;

      case 'create_page':
        actions.push({
          type: 'project.createPage',
          payload: {
            id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: paramMap.name || 'Untitled Page',
            route: paramMap.route || '/',
            title: paramMap.title || paramMap.name || 'Untitled',
            description: paramMap.description,
            fileId: paramMap.fileId || '',
            isIndex: paramMap.route === '/',
          },
        });
        break;

      case 'deploy':
        actions.push({
          type: 'deploy.start',
          payload: {
            provider: (paramMap.provider as DeployProvider) || 'onelastai',
            projectName: paramMap.projectName || 'canvas-project',
            autoFix: paramMap.autoFix === 'true',
          },
        });
        break;

      case 'env':
        const vars: Record<string, string> = {};
        body.split('\n').forEach(line => {
          const eqIdx = line.indexOf('=');
          if (eqIdx > 0) {
            vars[line.slice(0, eqIdx).trim()] = line.slice(eqIdx + 1).trim();
          }
        });
        actions.push({
          type: 'project.setEnv',
          payload: { vars },
        });
        break;

      case 'framework':
        actions.push({
          type: 'project.setFramework',
          payload: { framework: body.trim() as ProjectFramework },
        });
        break;

      case 'dependency':
        actions.push({
          type: 'project.addDependency',
          payload: {
            packages: body.split('\n').map(d => d.trim()).filter(Boolean),
          },
        });
        break;

      case 'run':
        actions.push({
          type: 'exec.run',
          payload: { command: body },
        });
        break;

      case 'search':
        actions.push({
          type: 'search.files',
          payload: {
            query: body || paramMap.query || '',
            regex: paramMap.regex === 'true',
          },
        });
        break;

      case 'message':
        actions.push({
          type: 'ui.message',
          payload: {
            level: (paramMap.level as 'info' | 'success' | 'warning' | 'error') || 'info',
            text: body,
          },
        });
        break;

      case 'ask':
        actions.push({
          type: 'ui.ask',
          payload: {
            id: `ask-${Date.now()}`,
            question: body,
            options: paramMap.options ? paramMap.options.split(',').map(o => o.trim()) : undefined,
          },
        });
        break;

      case 'diff':
        // ```agent:diff path="/src/App.tsx"
        // -old line
        // +new line
        actions.push({
          type: 'diff.show',
          payload: {
            path: paramMap.path || '',
            originalContent: '',  // Will be filled from current file
            modifiedContent: body,
            description: paramMap.description,
          },
        });
        break;
    }
  }

  // Backward compat: detect raw HTML responses
  if (actions.length === 0) {
    const htmlBlockMatch = message.match(/```html\s*([\s\S]*?)```/i);
    if (htmlBlockMatch) {
      const html = htmlBlockMatch[1].trim();
      if (html.includes('<!DOCTYPE') || html.includes('<html') || html.includes('<body')) {
        actions.push({
          type: 'file.create',
          payload: {
            path: '/index.html',
            content: html,
            language: 'html',
            isEntryPoint: true,
          },
        });
        message = message.replace(htmlBlockMatch[0], '').trim();
      }
    }

    // Detect raw HTML not in code blocks
    const trimmed = message.trim();
    const doctypeIdx = trimmed.toLowerCase().indexOf('<!doctype html');
    const htmlIdx = trimmed.toLowerCase().indexOf('<html');
    const startIdx = doctypeIdx >= 0 ? (htmlIdx >= 0 ? Math.min(doctypeIdx, htmlIdx) : doctypeIdx) : htmlIdx;

    if (startIdx >= 0) {
      const explanation = trimmed.substring(0, startIdx).trim();
      const html = trimmed.substring(startIdx).trim();
      if (html.includes('</html>') || html.includes('</body>')) {
        actions.push({
          type: 'file.create',
          payload: {
            path: '/index.html',
            content: html,
            language: 'html',
            isEntryPoint: true,
          },
        });
        message = explanation || '✨ Done! Check the preview.';
      }
    }
  }

  return {
    actions,
    cleanMessage: message.trim() || '✨ Done! Check the preview.',
  };
}

/**
 * Try to parse a JSON action block from the agent's response.
 * If the agent returns ```json\n{"actions": [...]}```, parse it directly.
 */
export function parseJsonActions(fullResponse: string): {
  actions: AgentBridgeAction[];
  cleanMessage: string;
} | null {
  const jsonBlockMatch = fullResponse.match(/```json\s*\n(\{[\s\S]*?"actions"\s*:[\s\S]*?\})\s*\n```/);
  if (!jsonBlockMatch) return null;

  try {
    const parsed = JSON.parse(jsonBlockMatch[1]);
    if (Array.isArray(parsed.actions)) {
      const message = fullResponse.replace(jsonBlockMatch[0], '').trim();
      return {
        actions: parsed.actions as AgentBridgeAction[],
        cleanMessage: message || parsed.message || '✨ Done!',
      };
    }
  } catch {
    // Not valid JSON
  }
  return null;
}

/**
 * Master parser — tries JSON first, falls back to text blocks.
 */
export function parseAgentActions(fullResponse: string): {
  actions: AgentBridgeAction[];
  cleanMessage: string;
} {
  // Try structured JSON first
  const jsonResult = parseJsonActions(fullResponse);
  if (jsonResult && jsonResult.actions.length > 0) {
    return jsonResult;
  }

  // Fall back to text-block parsing (backward compat)
  return parseTextToActions(fullResponse);
}
