/**
 * Editor Bridge — Code ↔ File Tree Sync + Zustand Store
 *
 * Central bridge between the code string, file tree, and editor state.
 * Re-exports EditorSelection & EditorCursor types from types.ts for convenience.
 * Provides a Zustand store (useEditorStore) for component-level subscriptions.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { dbStorage } from './dbStorage';
import { FileNode, EditorSelection, EditorCursor } from '../types';

export type { EditorSelection, EditorCursor };

// ═══════════════════════════════════════════════════════════════════
// Internal File Map (single source of truth)
// ═══════════════════════════════════════════════════════════════════

/** Internal map: path → content */
const fileMap = new Map<string, string>();

/** Saved content snapshots for dirty tracking */
const savedMap = new Map<string, string>();

/** Current cursor position */
let cursorPos: EditorCursor = { line: 1, column: 1 };

/** Current selection */
let selectionState: EditorSelection | null = null;

/** Active file path */
let activeFile: string | null = null;

// ═══════════════════════════════════════════════════════════════════
// Event Callbacks
// ═══════════════════════════════════════════════════════════════════

type FileChangeCallback = (path: string, content: string) => void;
type CursorChangeCallback = (cursor: EditorCursor) => void;

const fileChangeListeners: FileChangeCallback[] = [];
const cursorChangeListeners: CursorChangeCallback[] = [];

function notifyFileChange(path: string, content: string) {
  for (const cb of fileChangeListeners) {
    try { cb(path, content); } catch { /* ignore */ }
  }
  // Sync to Zustand store
  useEditorStore.setState((s) => ({
    files: { ...s.files, [path]: content },
  }));
}

function notifyCursorChange(cursor: EditorCursor) {
  for (const cb of cursorChangeListeners) {
    try { cb(cursor); } catch { /* ignore */ }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Language Detection
// ═══════════════════════════════════════════════════════════════════

function detectLanguage(path: string): string {
  if (typeof path !== 'string') return 'plaintext';
  const ext = path.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    html: 'html', htm: 'html',
    css: 'css', scss: 'scss', sass: 'sass', less: 'less',
    js: 'javascript', mjs: 'javascript', cjs: 'javascript',
    jsx: 'javascriptreact',
    ts: 'typescript', mts: 'typescript', cts: 'typescript',
    tsx: 'typescriptreact',
    json: 'json', jsonc: 'jsonc',
    md: 'markdown', mdx: 'markdown',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    sh: 'shellscript', bash: 'shellscript', zsh: 'shellscript',
    sql: 'sql',
    yaml: 'yaml', yml: 'yaml',
    xml: 'xml', svg: 'xml',
    toml: 'toml',
    env: 'dotenv',
    dockerfile: 'dockerfile',
    prisma: 'prisma',
    graphql: 'graphql', gql: 'graphql',
  };
  return map[ext || ''] || 'plaintext';
}

// ═══════════════════════════════════════════════════════════════════
// File Tree Builder
// ═══════════════════════════════════════════════════════════════════

function buildFileTree(paths: string[]): FileNode[] {
  const root: FileNode[] = [];
  const folderMap = new Map<string, FileNode>();

  // Sort paths for consistent ordering
  const sorted = [...paths].sort();

  for (const filePath of sorted) {
    if (typeof filePath !== 'string' || !filePath) continue;
    const parts = filePath.replace(/^\//, '').split('/');
    let currentLevel = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath += '/' + part;
      const isFile = i === parts.length - 1;

      if (isFile) {
        currentLevel.push({
          name: part,
          path: currentPath,
          type: 'file',
          content: fileMap.get(filePath) || fileMap.get(currentPath) || '',
          language: detectLanguage(part),
        });
      } else {
        let folder = folderMap.get(currentPath);
        if (!folder) {
          folder = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
          };
          folderMap.set(currentPath, folder);
          currentLevel.push(folder);
        }
        currentLevel = folder.children!;
      }
    }
  }

  return root;
}

// ═══════════════════════════════════════════════════════════════════
// Code ↔ Files Conversion
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse a combined code string into individual files.
 * Supports common multi-file markers:
 *   // --- file: path/file.ext ---
 *   <!-- file: index.html -->
 *   # file: main.py
 */
function parseCodeToFiles(
  code: string,
  _language?: string
): Record<string, string> {
  const fileMarker =
    /^(?:\/\/|<!--|#|\/\*)\s*(?:---\s*)?file:\s*(.+?)(?:\s*---)?(?:\s*-->|\s*\*\/)?\s*$/gm;
  const files: Record<string, string> = {};

  const markers: { path: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = fileMarker.exec(code)) !== null) {
    markers.push({
      path: match[1].trim().replace(/^\//, ''),
      index: match.index + match[0].length + 1, // +1 for the newline
    });
  }

  if (markers.length === 0) {
    // Single-file project — default name based on language
    const ext = _language === 'python' ? 'py'
      : _language === 'react' || _language === 'nextjs' ? 'jsx'
      : _language === 'typescript' ? 'tsx'
      : 'html';
    files[`/index.${ext}`] = code;
    return files;
  }

  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i + 1 < markers.length
      ? code.lastIndexOf('\n', markers[i + 1].index - markers[i + 1].path.length - 20)
      : code.length;
    const content = code.substring(start, end).trimEnd();
    const path = markers[i].path.startsWith('/') ? markers[i].path : `/${markers[i].path}`;
    files[path] = content;
  }

  return files;
}

/**
 * Merge all files into a single code string with file markers.
 */
function filesToCode(): string {
  const paths = [...fileMap.keys()].sort();
  if (paths.length === 0) return '';
  if (paths.length === 1) {
    const [path] = paths;
    return fileMap.get(path) || '';
  }

  const parts: string[] = [];
  for (const path of paths) {
    const content = fileMap.get(path) || '';
    const cleanPath = path.replace(/^\//, '');
    parts.push(`// --- file: ${cleanPath} ---`);
    parts.push(content);
    parts.push('');
  }
  return parts.join('\n').trimEnd();
}

// ═══════════════════════════════════════════════════════════════════
// Zustand Store (useEditorStore)
// ═══════════════════════════════════════════════════════════════════

interface EditorStoreState {
  files: Record<string, string>;
  activeFilePath: string | null;
  cursor: EditorCursor;
  selection: EditorSelection | null;
}

interface EditorStoreActions {
  setFiles: (files: Record<string, string>) => void;
  setActiveFilePath: (path: string | null) => void;
  setCursor: (cursor: EditorCursor) => void;
  setSelection: (selection: EditorSelection | null) => void;
}

export const useEditorStore = create<EditorStoreState & EditorStoreActions>()(
  persist(
    (set) => ({
      files: {},
      activeFilePath: null,
      cursor: { line: 1, column: 1 },
      selection: null,
      setFiles: (files) => set({ files }),
      setActiveFilePath: (path) => set({ activeFilePath: path }),
      setCursor: (cursor) => set({ cursor }),
      setSelection: (selection) => set({ selection }),
    }),
    {
      name: 'canvas-editor-bridge',
      version: 1,
      storage: createJSONStorage(() => dbStorage),
      partialize: (state) => ({
        activeFilePath: state.activeFilePath,
      }),
    }
  )
);

// ═══════════════════════════════════════════════════════════════════
// Public API — editorBridge singleton
// ═══════════════════════════════════════════════════════════════════

export const editorBridge = {
  // ── File CRUD ──────────────────────────────────────────────

  createFile(path: string, content: string = ''): void {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    fileMap.set(normalizedPath, content);
    savedMap.set(normalizedPath, content);
    notifyFileChange(normalizedPath, content);
  },

  updateFile(path: string, content: string): void {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    fileMap.set(normalizedPath, content);
    notifyFileChange(normalizedPath, content);
  },

  deleteFile(path: string): void {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    fileMap.delete(normalizedPath);
    savedMap.delete(normalizedPath);
    // Remove from Zustand
    useEditorStore.setState((s) => {
      const { [normalizedPath]: _, ...rest } = s.files;
      return {
        files: rest,
        activeFilePath: s.activeFilePath === normalizedPath ? null : s.activeFilePath,
      };
    });
    notifyFileChange(normalizedPath, '');
  },

  renameFile(oldPath: string, newPath: string): void {
    const oldNorm = oldPath.startsWith('/') ? oldPath : `/${oldPath}`;
    const newNorm = newPath.startsWith('/') ? newPath : `/${newPath}`;
    const content = fileMap.get(oldNorm) || '';
    fileMap.delete(oldNorm);
    savedMap.delete(oldNorm);
    fileMap.set(newNorm, content);
    savedMap.set(newNorm, content);

    useEditorStore.setState((s) => {
      const { [oldNorm]: _, ...rest } = s.files;
      return {
        files: { ...rest, [newNorm]: content },
        activeFilePath: s.activeFilePath === oldNorm ? newNorm : s.activeFilePath,
      };
    });
    notifyFileChange(newNorm, content);
  },

  createFolder(path: string): void {
    // Folders are implicit — create a .gitkeep placeholder
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const gitkeep = `${normalizedPath}/.gitkeep`;
    if (!fileMap.has(gitkeep)) {
      fileMap.set(gitkeep, '');
      savedMap.set(gitkeep, '');
      notifyFileChange(gitkeep, '');
    }
  },

  // ── File Queries ───────────────────────────────────────────

  getFile(path: string): { content: string; language: string } | undefined {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const content = fileMap.get(normalizedPath);
    if (content === undefined) return undefined;
    return { content, language: detectLanguage(normalizedPath) };
  },

  getAllFilePaths(): string[] {
    return [...fileMap.keys()].sort();
  },

  getProjectTree(): FileNode[] {
    return buildFileTree([...fileMap.keys()]);
  },

  hasUnsavedChanges(): boolean {
    for (const [path, content] of fileMap.entries()) {
      if (savedMap.get(path) !== content) return true;
    }
    return false;
  },

  // ── Code ↔ Files ──────────────────────────────────────────

  loadFromCode(code: string, language?: string): void {
    const parsed = parseCodeToFiles(code, language);
    fileMap.clear();
    savedMap.clear();
    for (const [path, content] of Object.entries(parsed)) {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      fileMap.set(normalizedPath, content);
      savedMap.set(normalizedPath, content);
    }
    // Sync to Zustand
    const filesObj: Record<string, string> = {};
    for (const [k, v] of fileMap.entries()) filesObj[k] = v;
    useEditorStore.setState({ files: filesObj });
  },

  toCode(): string {
    return filesToCode();
  },

  // ── Cursor & Selection ────────────────────────────────────

  setCursor(cursor: EditorCursor): void {
    cursorPos = cursor;
    useEditorStore.setState({ cursor });
    notifyCursorChange(cursor);
  },

  getCursor(): EditorCursor {
    return cursorPos;
  },

  setSelection(selection: EditorSelection | null): void {
    selectionState = selection;
    useEditorStore.setState({ selection });
  },

  getSelection(): EditorSelection | null {
    return selectionState;
  },

  // ── Active File ───────────────────────────────────────────

  setActiveFile(path: string): void {
    activeFile = path;
    useEditorStore.setState({ activeFilePath: path });
  },

  getActiveFile(): string | null {
    return activeFile;
  },

  // ── Save Tracking ─────────────────────────────────────────

  markSaved(path: string): void {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const content = fileMap.get(normalizedPath);
    if (content !== undefined) {
      savedMap.set(normalizedPath, content);
    }
  },

  markAllSaved(): void {
    for (const [path, content] of fileMap.entries()) {
      savedMap.set(path, content);
    }
  },

  // ── Event Subscriptions ───────────────────────────────────

  onFileChange(callback: FileChangeCallback): () => void {
    fileChangeListeners.push(callback);
    return () => {
      const idx = fileChangeListeners.indexOf(callback);
      if (idx >= 0) fileChangeListeners.splice(idx, 1);
    };
  },

  onCursorChange(callback: CursorChangeCallback): () => void {
    cursorChangeListeners.push(callback);
    return () => {
      const idx = cursorChangeListeners.indexOf(callback);
      if (idx >= 0) cursorChangeListeners.splice(idx, 1);
    };
  },

  // ── Reset ─────────────────────────────────────────────────

  reset(): void {
    fileMap.clear();
    savedMap.clear();
    cursorPos = { line: 1, column: 1 };
    selectionState = null;
    activeFile = null;
    useEditorStore.setState({
      files: {},
      activeFilePath: null,
      cursor: { line: 1, column: 1 },
      selection: null,
    });
  },
};
