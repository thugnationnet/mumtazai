/**
 * useEditorBridge Hook
 * 
 * The central bridge between the AI agent and the Monaco editor.
 * Captures the editor instance, provides all tools the agent needs:
 * 
 * - File System: read/write/create/delete/list/search files
 * - Cursor & Selection: get/set cursor, get/replace selection
 * - Search: full-text search across project files
 * - Diff & Review: show diffs, apply with approval, version history
 * - Execution: run commands (via backend sandbox)
 * - Project Context: snapshot for agent context injection
 * - Toasts & Approval: user-facing notifications and confirmation dialogs
 * - Agent Modes: plan/code/review/debug
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import type { ProjectFile, ProjectPage, FileLanguage, ProjectFramework, BuildError } from '../types/canvas-types';
import { getFileLanguage } from '../types/canvas-types';
import type {
  AgentBridgeAction,
  EditorContext,
  ActionResult,
  FileVersion,
  FileHistory,
  SearchMatch,
  SearchResult,
  ExecResult,
  Toast,
  PendingApproval,
  AgentMode,
} from '../types/canvas-agent-protocol';

// =============================================================================
// TYPES
// =============================================================================

interface UseEditorBridgeOptions {
  files: ProjectFile[];
  pages: ProjectPage[];
  framework: ProjectFramework;
  errors: BuildError[];
  onFilesChange: (files: ProjectFile[]) => void;
  onPagesChange: (pages: ProjectPage[]) => void;
  onFrameworkChange: (fw: ProjectFramework) => void;
  onPreviewUpdate: (html: string) => void;
  onSelectFile: (file: ProjectFile) => void;
}

export interface EditorBridgeAPI {
  // Monaco ref — attach to <MonacoEditor onMount={handleEditorMount} />
  editorRef: React.MutableRefObject<MonacoEditor.IStandaloneCodeEditor | null>;
  handleEditorMount: (editor: MonacoEditor.IStandaloneCodeEditor) => void;
  /** True once Monaco editor instance is mounted and ready */
  editorReady: boolean;

  // ─── File System ───
  getFile: (path: string) => ProjectFile | undefined;
  writeFile: (path: string, content: string, language?: FileLanguage) => ProjectFile;
  createFile: (path: string, content: string, language?: FileLanguage) => ProjectFile;
  deleteFile: (path: string) => boolean;
  renameFile: (from: string, to: string) => boolean;
  listFiles: (directory?: string) => ProjectFile[];
  getProjectTree: () => Array<{ path: string; language: FileLanguage; size: number }>;
  fileExists: (path: string) => boolean;

  // ─── Cursor & Selection ───
  getCursorPosition: () => { line: number; column: number } | null;
  setCursorPosition: (line: number, column: number) => void;
  getSelection: () => { text: string; startLine: number; startColumn: number; endLine: number; endColumn: number } | null;
  replaceSelection: (text: string) => void;
  insertAtCursor: (text: string) => void;

  // ─── Search ───
  searchInFiles: (query: string, options?: { regex?: boolean; includePattern?: string }) => SearchResult;
  findFileByName: (name: string) => ProjectFile | undefined;
  openFile: (path: string, line?: number) => void;

  // ─── Diff & Safe Editing ───
  showDiff: (path: string, originalContent: string, modifiedContent: string, description?: string) => void;
  applyDiff: (path: string, newContent: string) => boolean;
  diffState: DiffState | null;
  closeDiff: () => void;

  // ─── Version History ───
  getFileHistory: (path: string) => FileVersion[];
  revertFile: (path: string, versionId: string) => boolean;

  // ─── Execution ───
  runCommand: (command: string, cwd?: string) => Promise<ExecResult>;
  terminalHistory: ExecResult[];
  clearTerminal: () => void;

  // ─── Project Context (for agent injection) ───
  getEditorContext: () => EditorContext;

  // ─── Toasts ───
  toasts: Toast[];
  addToast: (level: Toast['level'], text: string, duration?: number) => void;
  dismissToast: (id: string) => void;

  // ─── Approval ───
  pendingApproval: PendingApproval | null;
  requestApproval: (approval: Omit<PendingApproval, 'timestamp' | 'status'>) => Promise<boolean>;
  resolveApproval: (approved: boolean) => void;

  // ─── Agent Mode ───
  agentMode: AgentMode;
  setAgentMode: (mode: AgentMode) => void;

  // ─── Master Action Executor ───
  executeAction: (action: AgentBridgeAction) => Promise<ActionResult>;
  executeActions: (actions: AgentBridgeAction[]) => Promise<ActionResult[]>;
}

export interface DiffState {
  path: string;
  originalContent: string;
  modifiedContent: string;
  description?: string;
}

// =============================================================================
// HOOK
// =============================================================================

export function useEditorBridge(options: UseEditorBridgeOptions): EditorBridgeAPI {
  const {
    files,
    pages,
    framework,
    errors,
    onFilesChange,
    onPagesChange,
    onFrameworkChange,
    onPreviewUpdate,
    onSelectFile,
  } = options;

  // ─── Refs ───
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  // ─── State ───
  const [editorReady, setEditorReady] = useState(false);
  const [fileHistories, setFileHistories] = useState<Map<string, FileVersion[]>>(new Map());
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<ExecResult[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [agentMode, setAgentMode] = useState<AgentMode>('code');
  const [diffState, setDiffState] = useState<DiffState | null>(null);
  const approvalResolverRef = useRef<((approved: boolean) => void) | null>(null);

  // ─── Monaco Mount Handler ───
  const handleEditorMount = useCallback((editor: MonacoEditor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setEditorReady(true);
  }, []);

  // ─── Version History Helper ───
  const saveVersion = useCallback((path: string, content: string, source: 'user' | 'agent', description?: string) => {
    const version: FileVersion = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      path,
      content,
      timestamp: Date.now(),
      source,
      description,
    };

    setFileHistories(prev => {
      const next = new Map(prev);
      const existing = next.get(path) || [];
      // Keep last 50 versions per file
      const updated = [...existing, version].slice(-50);
      next.set(path, updated);
      return next;
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // FILE SYSTEM
  // ═══════════════════════════════════════════════════════════════

  const getFile = useCallback((path: string): ProjectFile | undefined => {
    return files.find(f => f.path === path);
  }, [files]);

  const writeFile = useCallback((path: string, content: string, language?: FileLanguage): ProjectFile => {
    const now = Date.now();
    const existing = files.find(f => f.path === path);

    if (existing) {
      // Save version before overwrite
      saveVersion(path, existing.content, 'agent', `Overwritten`);

      const updated = files.map(f =>
        f.path === path
          ? {
              ...f,
              content,
              language: language || f.language,
              size: new Blob([content]).size,
              updatedAt: now,
              isModified: true,
            }
          : f
      );
      onFilesChange(updated);
      return updated.find(f => f.path === path)!;
    } else {
      return createFile(path, content, language);
    }
  }, [files, onFilesChange, saveVersion]);

  const createFile = useCallback((path: string, content: string, language?: FileLanguage): ProjectFile => {
    const now = Date.now();
    const lang = language || getFileLanguage(path);
    const newFile: ProjectFile = {
      id: `file-${now}-${Math.random().toString(36).slice(2, 8)}`,
      name: path.split('/').pop() || 'untitled',
      path,
      language: lang,
      content,
      size: new Blob([content]).size,
      isEntryPoint: path === '/index.html' || path === '/src/main.tsx' || path === '/src/App.tsx',
      createdAt: now,
      updatedAt: now,
    };

    // Check for duplicate
    const existingIdx = files.findIndex(f => f.path === path);
    if (existingIdx >= 0) {
      saveVersion(path, files[existingIdx].content, 'agent', 'Before create overwrite');
      const updated = [...files];
      updated[existingIdx] = { ...newFile, id: files[existingIdx].id, createdAt: files[existingIdx].createdAt };
      onFilesChange(updated);
      return updated[existingIdx];
    }

    saveVersion(path, content, 'agent', 'Created');
    onFilesChange([...files, newFile]);
    return newFile;
  }, [files, onFilesChange, saveVersion]);

  const deleteFile = useCallback((path: string): boolean => {
    const idx = files.findIndex(f => f.path === path);
    if (idx < 0) return false;
    saveVersion(path, files[idx].content, 'agent', 'Deleted');
    onFilesChange(files.filter(f => f.path !== path));
    return true;
  }, [files, onFilesChange, saveVersion]);

  const renameFile = useCallback((from: string, to: string): boolean => {
    const idx = files.findIndex(f => f.path === from);
    if (idx < 0) return false;
    const updated = files.map(f =>
      f.path === from
        ? {
            ...f,
            path: to,
            name: to.split('/').pop() || f.name,
            language: getFileLanguage(to),
            updatedAt: Date.now(),
          }
        : f
    );
    onFilesChange(updated);
    return true;
  }, [files, onFilesChange]);

  const listFiles = useCallback((directory?: string): ProjectFile[] => {
    if (!directory) return files;
    const dir = directory.endsWith('/') ? directory : directory + '/';
    return files.filter(f => f.path.startsWith(dir));
  }, [files]);

  const getProjectTree = useCallback(() => {
    return files.map(f => ({ path: f.path, language: f.language, size: f.size }));
  }, [files]);

  const fileExists = useCallback((path: string): boolean => {
    return files.some(f => f.path === path);
  }, [files]);

  // ═══════════════════════════════════════════════════════════════
  // CURSOR & SELECTION
  // ═══════════════════════════════════════════════════════════════

  const getCursorPosition = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return null;
    const pos = editor.getPosition();
    if (!pos) return null;
    return { line: pos.lineNumber, column: pos.column };
  }, []);

  const setCursorPosition = useCallback((line: number, column: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.setPosition({ lineNumber: line, column });
    editor.revealLineInCenter(line);
    editor.focus();
  }, []);

  const getSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return null;
    const sel = editor.getSelection();
    if (!sel || sel.isEmpty()) return null;
    const model = editor.getModel();
    if (!model) return null;
    return {
      text: model.getValueInRange(sel),
      startLine: sel.startLineNumber,
      startColumn: sel.startColumn,
      endLine: sel.endLineNumber,
      endColumn: sel.endColumn,
    };
  }, []);

  const replaceSelection = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = editor.getSelection();
    if (!sel) return;
    editor.executeEdits('agent-bridge', [{
      range: sel,
      text,
      forceMoveMarkers: true,
    }]);
  }, []);

  const insertAtCursor = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const pos = editor.getPosition();
    if (!pos) return;
    editor.executeEdits('agent-bridge', [{
      range: {
        startLineNumber: pos.lineNumber,
        startColumn: pos.column,
        endLineNumber: pos.lineNumber,
        endColumn: pos.column,
      },
      text,
      forceMoveMarkers: true,
    }]);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════

  const searchInFiles = useCallback((query: string, searchOptions?: { regex?: boolean; includePattern?: string }): SearchResult => {
    const matches: SearchMatch[] = [];

    for (const file of files) {
      if (searchOptions?.includePattern) {
        const pattern = new RegExp(searchOptions.includePattern.replace(/\*/g, '.*'));
        if (!pattern.test(file.path)) continue;
      }

      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let matchIdx = -1;

        if (searchOptions?.regex) {
          try {
            const re = new RegExp(query, 'gi');
            const m = re.exec(line);
            if (m) matchIdx = m.index;
          } catch {
            // Invalid regex
          }
        } else {
          matchIdx = line.toLowerCase().indexOf(query.toLowerCase());
        }

        if (matchIdx >= 0) {
          matches.push({
            file: file.path,
            line: i + 1,
            column: matchIdx + 1,
            matchText: query,
            lineContent: line.trim(),
          });
        }
      }
    }

    const result: SearchResult = {
      query,
      totalMatches: matches.length,
      matches,
    };
    setSearchResults(result);
    return result;
  }, [files]);

  const findFileByName = useCallback((name: string): ProjectFile | undefined => {
    return files.find(f => f.name === name || f.path.endsWith('/' + name) || f.path === name);
  }, [files]);

  const openFile = useCallback((path: string, line?: number) => {
    const file = files.find(f => f.path === path);
    if (file) {
      onSelectFile(file);
      if (line) {
        // Set cursor after file loads (small delay for Monaco)
        setTimeout(() => setCursorPosition(line, 1), 100);
      }
    }
  }, [files, onSelectFile, setCursorPosition]);

  // ═══════════════════════════════════════════════════════════════
  // DIFF & SAFE EDITING
  // ═══════════════════════════════════════════════════════════════

  const showDiff = useCallback((path: string, originalContent: string, modifiedContent: string, description?: string) => {
    // If original is empty, try to get from current file
    const actual = originalContent || (files.find(f => f.path === path)?.content || '');
    setDiffState({ path, originalContent: actual, modifiedContent, description });
  }, [files]);

  const applyDiff = useCallback((path: string, newContent: string): boolean => {
    const existing = files.find(f => f.path === path);
    if (existing) {
      saveVersion(path, existing.content, 'agent', 'Before diff apply');
      writeFile(path, newContent);
    } else {
      createFile(path, newContent);
    }
    setDiffState(null);
    return true;
  }, [files, writeFile, createFile, saveVersion]);

  const closeDiff = useCallback(() => setDiffState(null), []);

  // ═══════════════════════════════════════════════════════════════
  // VERSION HISTORY
  // ═══════════════════════════════════════════════════════════════

  const getFileHistory = useCallback((path: string): FileVersion[] => {
    return fileHistories.get(path) || [];
  }, [fileHistories]);

  const revertFile = useCallback((path: string, versionId: string): boolean => {
    const versions = fileHistories.get(path);
    if (!versions) return false;
    const version = versions.find(v => v.id === versionId);
    if (!version) return false;

    saveVersion(path, files.find(f => f.path === path)?.content || '', 'user', 'Before revert');
    writeFile(path, version.content);
    return true;
  }, [fileHistories, files, writeFile, saveVersion]);

  // ═══════════════════════════════════════════════════════════════
  // EXECUTION (via backend sandbox)
  // ═══════════════════════════════════════════════════════════════

  const runCommand = useCallback(async (command: string, cwd?: string): Promise<ExecResult> => {
    const startTime = Date.now();
    try {
      const response = await fetch('/api/canvas/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ command, cwd, timeout: 30000 }),
      });

      const data = await response.json();
      const result: ExecResult = {
        id: `exec-${Date.now()}`,
        command,
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode ?? (response.ok ? 0 : 1),
        duration: Date.now() - startTime,
        timedOut: data.timedOut || false,
      };

      setTerminalHistory(prev => [...prev, result]);
      return result;
    } catch (error) {
      const result: ExecResult = {
        id: `exec-${Date.now()}`,
        command,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Command execution failed',
        exitCode: 1,
        duration: Date.now() - startTime,
        timedOut: false,
      };
      setTerminalHistory(prev => [...prev, result]);
      return result;
    }
  }, []);

  const clearTerminal = useCallback(() => setTerminalHistory([]), []);

  // ═══════════════════════════════════════════════════════════════
  // PROJECT CONTEXT (for agent injection)
  // ═══════════════════════════════════════════════════════════════

  const getEditorContext = useCallback((): EditorContext => {
    const activeFile = files.length > 0 ? files[0] : undefined;
    const editor = editorRef.current;
    let cursor: EditorContext['cursor'];
    let selection: EditorContext['selection'];

    if (editor) {
      const pos = editor.getPosition();
      if (pos) cursor = { line: pos.lineNumber, column: pos.column };

      const sel = editor.getSelection();
      const model = editor.getModel();
      if (sel && model && !sel.isEmpty()) {
        selection = {
          startLine: sel.startLineNumber,
          startColumn: sel.startColumn,
          endLine: sel.endLineNumber,
          endColumn: sel.endColumn,
          text: model.getValueInRange(sel),
        };
      }
    }

    return {
      activeFile: activeFile ? {
        path: activeFile.path,
        language: activeFile.language,
        content: activeFile.content,
        lineCount: activeFile.content.split('\n').length,
      } : undefined,
      cursor,
      selection,
      errors,
      projectTree: {
        totalFiles: files.length,
        files: files.map(f => ({ path: f.path, language: f.language, size: f.size })),
      },
      framework,
      mode: agentMode,
    };
  }, [files, errors, framework, agentMode]);

  // ═══════════════════════════════════════════════════════════════
  // TOASTS
  // ═══════════════════════════════════════════════════════════════

  const addToast = useCallback((level: Toast['level'], text: string, duration = 5000) => {
    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      level,
      text,
      duration,
      timestamp: Date.now(),
    };
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // APPROVAL
  // ═══════════════════════════════════════════════════════════════

  const requestApproval = useCallback((approval: Omit<PendingApproval, 'timestamp' | 'status'>): Promise<boolean> => {
    return new Promise(resolve => {
      const pending: PendingApproval = {
        ...approval,
        timestamp: Date.now(),
        status: 'pending',
      };
      setPendingApproval(pending);
      approvalResolverRef.current = (approved: boolean) => {
        setPendingApproval(null);
        approvalResolverRef.current = null;
        resolve(approved);
      };
    });
  }, []);

  const resolveApproval = useCallback((approved: boolean) => {
    if (approvalResolverRef.current) {
      approvalResolverRef.current(approved);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // MASTER ACTION EXECUTOR
  // ═══════════════════════════════════════════════════════════════

  const executeAction = useCallback(async (action: AgentBridgeAction): Promise<ActionResult> => {
    try {
      switch (action.type) {
        // ── File System ──
        case 'file.create': {
          const f = createFile(action.payload.path, action.payload.content, action.payload.language);
          return { actionType: action.type, success: true, message: `Created ${f.path}` };
        }
        case 'file.edit': {
          if (action.payload.content !== undefined) {
            writeFile(action.payload.path, action.payload.content);
            return { actionType: action.type, success: true, message: `Updated ${action.payload.path}` };
          }
          return { actionType: action.type, success: false, message: 'No content provided' };
        }
        case 'file.delete': {
          const ok = deleteFile(action.payload.path);
          return { actionType: action.type, success: ok, message: ok ? `Deleted ${action.payload.path}` : 'File not found' };
        }
        case 'file.rename': {
          const ok = renameFile(action.payload.from, action.payload.to);
          return { actionType: action.type, success: ok, message: ok ? `Renamed ${action.payload.from} → ${action.payload.to}` : 'File not found' };
        }
        case 'file.move': {
          const ok = renameFile(action.payload.from, action.payload.to);
          return { actionType: action.type, success: ok, message: ok ? `Moved ${action.payload.from} → ${action.payload.to}` : 'File not found' };
        }

        // ── Cursor & Selection ──
        case 'cursor.set':
          setCursorPosition(action.payload.line, action.payload.column);
          openFile(action.payload.file, action.payload.line);
          return { actionType: action.type, success: true };
        case 'cursor.insert':
          insertAtCursor(action.payload.text);
          return { actionType: action.type, success: true };
        case 'selection.replace':
          replaceSelection(action.payload.text);
          return { actionType: action.type, success: true };

        // ── Search ──
        case 'search.files': {
          const result = searchInFiles(action.payload.query, {
            regex: action.payload.regex,
            includePattern: action.payload.includePattern,
          });
          return { actionType: action.type, success: true, data: result };
        }
        case 'search.open':
          openFile(action.payload.path, action.payload.line);
          return { actionType: action.type, success: true };

        // ── Diff ──
        case 'diff.show':
          showDiff(action.payload.path, action.payload.originalContent, action.payload.modifiedContent, action.payload.description);
          return { actionType: action.type, success: true };
        case 'diff.apply':
          if (action.payload.newContent) {
            const ok = applyDiff(action.payload.path, action.payload.newContent);
            return { actionType: action.type, success: ok };
          }
          return { actionType: action.type, success: false, message: 'No new content' };

        // ── Execution ──
        case 'exec.run': {
          const result = await runCommand(action.payload.command, action.payload.cwd);
          return { actionType: action.type, success: result.exitCode === 0, data: result };
        }
        case 'exec.test':
          return { actionType: action.type, success: false, message: 'Tests not yet implemented' };

        // ── Project ──
        case 'project.setFramework':
          onFrameworkChange(action.payload.framework);
          return { actionType: action.type, success: true };
        case 'project.addDependency':
          addToast('info', `Dependencies: ${action.payload.packages.join(', ')}`);
          return { actionType: action.type, success: true };
        case 'project.setEnv':
          addToast('info', `Set ${Object.keys(action.payload.vars).length} env vars`);
          return { actionType: action.type, success: true };
        case 'project.createPage': {
          onPagesChange([...pages, action.payload]);
          return { actionType: action.type, success: true, message: `Page "${action.payload.name}" created` };
        }

        // ── Deploy ──
        case 'deploy.start':
          addToast('info', `Deploy to ${action.payload.provider} requested`);
          return { actionType: action.type, success: true };
        case 'deploy.validate':
          return { actionType: action.type, success: true };

        // ── UI ──
        case 'ui.message':
          addToast(action.payload.level, action.payload.text, action.payload.duration);
          return { actionType: action.type, success: true };
        case 'ui.ask':
          // For now, show as toast — full interactive ask requires UI component
          addToast('info', `❓ ${action.payload.question}`, 0);
          return { actionType: action.type, success: true };
        case 'ui.requestApproval': {
          const approved = await requestApproval({
            id: action.payload.id,
            title: action.payload.title,
            description: action.payload.description,
            actions: action.payload.actions,
            destructive: action.payload.destructive || false,
          });
          return { actionType: action.type, success: approved, message: approved ? 'Approved' : 'Rejected' };
        }

        // ── Agent Control ──
        case 'agent.setMode':
          setAgentMode(action.payload.mode);
          return { actionType: action.type, success: true };
        case 'agent.log':
          console.log(`[Agent ${action.payload.level}]`, action.payload.message);
          return { actionType: action.type, success: true };

        default:
          return { actionType: (action as AgentBridgeAction).type, success: false, message: 'Unknown action type' };
      }
    } catch (error) {
      return {
        actionType: action.type,
        success: false,
        message: error instanceof Error ? error.message : 'Action failed',
      };
    }
  }, [
    createFile, writeFile, deleteFile, renameFile,
    setCursorPosition, insertAtCursor, replaceSelection,
    searchInFiles, openFile, showDiff, applyDiff,
    runCommand, onFrameworkChange, onPagesChange, pages,
    addToast, requestApproval, setAgentMode,
  ]);

  const executeActions = useCallback(async (actions: AgentBridgeAction[]): Promise<ActionResult[]> => {
    const results: ActionResult[] = [];
    for (const action of actions) {
      const result = await executeAction(action);
      results.push(result);
      // Stop on approval rejection
      if (action.type === 'ui.requestApproval' && !result.success) {
        break;
      }
    }
    return results;
  }, [executeAction]);

  // ═══════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════

  return {
    editorRef,
    handleEditorMount,
    editorReady,

    // File System
    getFile,
    writeFile,
    createFile,
    deleteFile,
    renameFile,
    listFiles,
    getProjectTree,
    fileExists,

    // Cursor & Selection
    getCursorPosition,
    setCursorPosition,
    getSelection,
    replaceSelection,
    insertAtCursor,

    // Search
    searchInFiles,
    findFileByName,
    openFile,

    // Diff & Safe Editing
    showDiff,
    applyDiff,
    diffState,
    closeDiff,

    // Version History
    getFileHistory,
    revertFile,

    // Execution
    runCommand,
    terminalHistory,
    clearTerminal,

    // Project Context
    getEditorContext,

    // Toasts
    toasts,
    addToast,
    dismissToast,

    // Approval
    pendingApproval,
    requestApproval,
    resolveApproval,

    // Agent Mode
    agentMode,
    setAgentMode,

    // Master Executor
    executeAction,
    executeActions,
  };
}
