/**
 * ============================================================================
 * EDITOR BRIDGE SERVICE — canvas-studio-backend (port 3006)
 * ============================================================================
 *
 * Server-side editor state management for the canvas-studio.
 * Bridges AI agent tool calls ↔ frontend editor state.
 *
 * Responsibilities:
 *  1. Per-file CRUD with DB persistence (CanvasProject.files)
 *  2. File version history (undo/redo per file, max 50 versions)
 *  3. Editor state tracking (active file, cursor, open tabs)
 *  4. Granular change events (delta-based, not full-project retransmission)
 *  5. Session-scoped state (one EditorSession per project per user)
 *
 * DB models used:
 *  - CanvasProject → files (JSON), framework, pages
 *  - ChatCanvasFile → per-file persistence with version
 *  - ChatCanvasHistory → action log
 */

import path from 'path';
import prisma from '../lib/prisma.js';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const MAX_VERSIONS_PER_FILE = 50;
const MAX_FILES_PER_PROJECT = 500;

// ═══════════════════════════════════════════════════════════════════
// IN-MEMORY SESSION STORE
// One session per (userId + projectId). GC'd after 30 min idle.
// ═══════════════════════════════════════════════════════════════════

/** @type {Map<string, EditorSession>} */
const sessions = new Map();

const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * @typedef {Object} FileVersion
 * @property {string} content
 * @property {string} timestamp
 * @property {string} [source] - 'user' | 'agent' | 'tool'
 */

/**
 * @typedef {Object} EditorSession
 * @property {string} userId
 * @property {string} projectId
 * @property {Map<string, object>} files - path → { content, language, size }
 * @property {Map<string, FileVersion[]>} history - path → version stack
 * @property {Map<string, number>} historyIdx - path → current index in history
 * @property {string|null} activeFile - current active file path
 * @property {{ line: number, column: number }} cursor
 * @property {string[]} openTabs
 * @property {Function[]} listeners - change event subscribers
 * @property {number} lastActivity
 * @property {boolean} dirty
 */

function sessionKey(userId, projectId) {
  return `${userId}:${projectId}`;
}

// Session GC — run every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (now - session.lastActivity > SESSION_IDLE_TIMEOUT) {
      // Auto-persist before eviction
      persistSession(session).catch(() => {});
      sessions.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════
// LANGUAGE DETECTION
// ═══════════════════════════════════════════════════════════════════

const LANG_MAP = {
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', sass: 'sass', less: 'less',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  jsx: 'javascriptreact',
  ts: 'typescript', mts: 'typescript', cts: 'typescript',
  tsx: 'typescriptreact',
  json: 'json', jsonc: 'jsonc',
  md: 'markdown', mdx: 'markdown',
  py: 'python',
  java: 'java', go: 'go', rs: 'rust', rb: 'ruby', php: 'php',
  sh: 'shellscript', bash: 'shellscript', zsh: 'shellscript',
  sql: 'sql',
  yaml: 'yaml', yml: 'yaml',
  xml: 'xml', svg: 'xml',
  toml: 'toml', env: 'dotenv',
  dockerfile: 'dockerfile',
  prisma: 'prisma',
  graphql: 'graphql', gql: 'graphql',
};

function detectLanguage(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return LANG_MAP[ext || ''] || 'plaintext';
}

function normalizePath(p) {
  if (!p) return '/';
  let normalized = p.startsWith('/') ? p : `/${p}`;
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

// ═══════════════════════════════════════════════════════════════════
// SESSION LIFECYCLE
// ═══════════════════════════════════════════════════════════════════

/**
 * Get or create an editor session for a user + project.
 * Loads from DB on first access.
 */
export async function getSession(userId, projectId) {
  const key = sessionKey(userId, projectId);
  let session = sessions.get(key);

  if (session) {
    session.lastActivity = Date.now();
    return session;
  }

  // Load project from DB
  const project = await prisma.canvasProject.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, files: true, framework: true },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  if (project.userId !== userId) {
    throw new Error('Access denied: project belongs to another user');
  }

  // Parse files JSON into Map
  const filesArr = Array.isArray(project.files) ? project.files : [];
  const filesMap = new Map();
  const historyMap = new Map();
  const historyIdxMap = new Map();

  for (const f of filesArr) {
    const p = normalizePath(f.path);
    filesMap.set(p, {
      content: f.content || '',
      language: f.language || detectLanguage(p),
      size: (f.content || '').length,
    });
    // Initialize version history with current state
    historyMap.set(p, [{ content: f.content || '', timestamp: new Date().toISOString(), source: 'load' }]);
    historyIdxMap.set(p, 0);
  }

  session = {
    userId,
    projectId,
    files: filesMap,
    history: historyMap,
    historyIdx: historyIdxMap,
    activeFile: filesArr.length > 0 ? normalizePath(filesArr[0].path) : null,
    cursor: { line: 1, column: 1 },
    openTabs: filesArr.length > 0 ? [normalizePath(filesArr[0].path)] : [],
    listeners: [],
    lastActivity: Date.now(),
    dirty: false,
  };

  sessions.set(key, session);
  return session;
}

/**
 * Persist session state to DB (CanvasProject.files JSON).
 */
async function persistSession(session) {
  if (!session.dirty) return;

  const filesArr = [];
  for (const [filePath, file] of session.files) {
    filesArr.push({
      path: filePath,
      name: path.basename(filePath),
      content: file.content,
      language: file.language,
      size: file.size,
    });
  }

  await prisma.canvasProject.update({
    where: { id: session.projectId },
    data: {
      files: filesArr,
      updatedAt: new Date(),
    },
  });

  session.dirty = false;
}

/**
 * Close & persist a session.
 */
export async function closeSession(userId, projectId) {
  const key = sessionKey(userId, projectId);
  const session = sessions.get(key);
  if (!session) return;

  await persistSession(session);
  sessions.delete(key);
}

// ═══════════════════════════════════════════════════════════════════
// CHANGE EVENT SYSTEM
// ═══════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} EditorChangeEvent
 * @property {string} type - 'file_created'|'file_updated'|'file_deleted'|'file_renamed'|'cursor_moved'|'active_file_changed'
 * @property {string} [path]
 * @property {object} [data]
 * @property {string} source - 'user'|'agent'|'tool'
 * @property {string} timestamp
 */

function emit(session, event) {
  const ev = { ...event, timestamp: new Date().toISOString() };
  for (const listener of session.listeners) {
    try { listener(ev); } catch { /* ignore */ }
  }
}

/**
 * Subscribe to session change events.
 * @returns {Function} unsubscribe
 */
export function subscribe(session, callback) {
  session.listeners.push(callback);
  return () => {
    const idx = session.listeners.indexOf(callback);
    if (idx >= 0) session.listeners.splice(idx, 1);
  };
}

// ═══════════════════════════════════════════════════════════════════
// FILE CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a file in the session.
 */
export function createFile(session, filePath, content = '', source = 'user') {
  const p = normalizePath(filePath);

  if (session.files.size >= MAX_FILES_PER_PROJECT) {
    return { success: false, error: `Max files (${MAX_FILES_PER_PROJECT}) reached` };
  }

  const language = detectLanguage(p);
  const existed = session.files.has(p);

  session.files.set(p, {
    content,
    language,
    size: content.length,
  });

  // Version history
  if (!session.history.has(p)) {
    session.history.set(p, []);
    session.historyIdx.set(p, -1);
  }
  pushVersion(session, p, content, source);

  session.dirty = true;
  session.lastActivity = Date.now();

  emit(session, {
    type: existed ? 'file_updated' : 'file_created',
    path: p,
    data: { language, size: content.length, action: existed ? 'overwritten' : 'created' },
    source,
  });

  return { success: true, path: p, action: existed ? 'overwritten' : 'created', size: content.length };
}

/**
 * Update file content.
 */
export function updateFile(session, filePath, content, source = 'user') {
  const p = normalizePath(filePath);
  const existing = session.files.get(p);

  if (!existing) {
    // Auto-create if not exists
    return createFile(session, filePath, content, source);
  }

  existing.content = content;
  existing.size = content.length;
  session.files.set(p, existing);

  pushVersion(session, p, content, source);

  session.dirty = true;
  session.lastActivity = Date.now();

  emit(session, {
    type: 'file_updated',
    path: p,
    data: { size: content.length },
    source,
  });

  return { success: true, path: p, action: 'updated', size: content.length };
}

/**
 * Apply diff hunks to a file.
 */
export function applyDiff(session, filePath, diff, source = 'agent') {
  const p = normalizePath(filePath);
  const existing = session.files.get(p);

  if (!existing) {
    return { success: false, error: `File not found: ${p}` };
  }

  if (!Array.isArray(diff) || diff.length === 0) {
    return { success: false, error: 'Invalid diff: must be a non-empty array of hunks' };
  }

  const lines = existing.content.split('\n');

  // Apply hunks in reverse order so line numbers stay valid
  const sorted = [...diff].sort((a, b) => b.startLine - a.startLine);
  for (const hunk of sorted) {
    const startIdx = (hunk.startLine || 1) - 1;
    const deleteCount = hunk.deleteCount || 0;
    const insertLines = hunk.insert || [];
    lines.splice(startIdx, deleteCount, ...insertLines);
  }

  const newContent = lines.join('\n');
  existing.content = newContent;
  existing.size = newContent.length;
  session.files.set(p, existing);

  pushVersion(session, p, newContent, source);

  session.dirty = true;
  session.lastActivity = Date.now();

  emit(session, {
    type: 'file_updated',
    path: p,
    data: { action: 'diff_applied', hunks: diff.length, size: newContent.length },
    source,
  });

  return { success: true, path: p, action: 'diff_applied', hunks: diff.length, size: newContent.length };
}

/**
 * Delete a file.
 */
export function deleteFile(session, filePath, source = 'user') {
  const p = normalizePath(filePath);

  if (!session.files.has(p)) {
    return { success: false, error: `File not found: ${p}` };
  }

  session.files.delete(p);
  session.history.delete(p);
  session.historyIdx.delete(p);

  // Remove from open tabs
  session.openTabs = session.openTabs.filter(t => t !== p);
  if (session.activeFile === p) {
    session.activeFile = session.openTabs[0] || null;
  }

  session.dirty = true;
  session.lastActivity = Date.now();

  emit(session, {
    type: 'file_deleted',
    path: p,
    source,
  });

  return { success: true, path: p, action: 'deleted' };
}

/**
 * Rename / move a file.
 */
export function renameFile(session, oldPath, newPath, source = 'user') {
  const op = normalizePath(oldPath);
  const np = normalizePath(newPath);

  const existing = session.files.get(op);
  if (!existing) {
    return { success: false, error: `File not found: ${op}` };
  }

  if (session.files.has(np)) {
    return { success: false, error: `Target already exists: ${np}` };
  }

  // Move file data
  session.files.delete(op);
  existing.language = detectLanguage(np);
  session.files.set(np, existing);

  // Move version history
  const hist = session.history.get(op);
  const histIdx = session.historyIdx.get(op);
  session.history.delete(op);
  session.historyIdx.delete(op);
  if (hist) {
    session.history.set(np, hist);
    session.historyIdx.set(np, histIdx || 0);
  }

  // Update open tabs
  session.openTabs = session.openTabs.map(t => t === op ? np : t);
  if (session.activeFile === op) {
    session.activeFile = np;
  }

  session.dirty = true;
  session.lastActivity = Date.now();

  emit(session, {
    type: 'file_renamed',
    path: np,
    data: { from: op, to: np },
    source,
  });

  return { success: true, from: op, to: np, action: 'renamed' };
}

/**
 * Read a file.
 */
export function readFile(session, filePath) {
  const p = normalizePath(filePath);
  const file = session.files.get(p);

  if (!file) {
    return { success: false, error: `File not found: ${p}` };
  }

  return {
    success: true,
    path: p,
    content: file.content,
    language: file.language,
    size: file.size,
  };
}

/**
 * List all files in the session.
 */
export function listFiles(session) {
  const files = [];
  for (const [filePath, file] of session.files) {
    files.push({
      path: filePath,
      name: path.basename(filePath),
      language: file.language,
      size: file.size,
    });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Get the full files array (for backward-compat with canvas-tool-executor).
 */
export function getFilesArray(session) {
  const arr = [];
  for (const [filePath, file] of session.files) {
    arr.push({
      path: filePath,
      name: path.basename(filePath),
      content: file.content,
      language: file.language,
      size: file.size,
    });
  }
  return arr;
}

/**
 * Bulk-set files (import from frontend or tool result).
 */
export function setFiles(session, filesArr, source = 'user') {
  session.files.clear();
  session.history.clear();
  session.historyIdx.clear();

  for (const f of filesArr) {
    const p = normalizePath(f.path);
    session.files.set(p, {
      content: f.content || '',
      language: f.language || detectLanguage(p),
      size: (f.content || '').length,
    });
    session.history.set(p, [{ content: f.content || '', timestamp: new Date().toISOString(), source }]);
    session.historyIdx.set(p, 0);
  }

  session.dirty = true;
  session.lastActivity = Date.now();

  emit(session, {
    type: 'files_replaced',
    data: { count: filesArr.length },
    source,
  });
}

// ═══════════════════════════════════════════════════════════════════
// VERSION HISTORY (per-file undo/redo)
// ═══════════════════════════════════════════════════════════════════

function pushVersion(session, filePath, content, source) {
  let versions = session.history.get(filePath);
  if (!versions) {
    versions = [];
    session.history.set(filePath, versions);
  }

  let idx = session.historyIdx.get(filePath) ?? -1;

  // Truncate future versions (discard redo stack on new edit)
  if (idx < versions.length - 1) {
    versions.splice(idx + 1);
  }

  versions.push({ content, timestamp: new Date().toISOString(), source });

  // Cap at max versions
  if (versions.length > MAX_VERSIONS_PER_FILE) {
    versions.shift();
  }

  session.historyIdx.set(filePath, versions.length - 1);
}

/**
 * Undo the last change to a file.
 */
export function undo(session, filePath) {
  const p = normalizePath(filePath);
  const versions = session.history.get(p);
  let idx = session.historyIdx.get(p);

  if (!versions || idx === undefined || idx <= 0) {
    return { success: false, error: 'Nothing to undo' };
  }

  idx -= 1;
  session.historyIdx.set(p, idx);

  const version = versions[idx];
  const file = session.files.get(p);
  if (file) {
    file.content = version.content;
    file.size = version.content.length;
  }

  session.dirty = true;
  session.lastActivity = Date.now();

  emit(session, {
    type: 'file_updated',
    path: p,
    data: { action: 'undo', versionIndex: idx },
    source: 'user',
  });

  return { success: true, path: p, action: 'undo', versionIndex: idx, content: version.content };
}

/**
 * Redo an undone change.
 */
export function redo(session, filePath) {
  const p = normalizePath(filePath);
  const versions = session.history.get(p);
  let idx = session.historyIdx.get(p);

  if (!versions || idx === undefined || idx >= versions.length - 1) {
    return { success: false, error: 'Nothing to redo' };
  }

  idx += 1;
  session.historyIdx.set(p, idx);

  const version = versions[idx];
  const file = session.files.get(p);
  if (file) {
    file.content = version.content;
    file.size = version.content.length;
  }

  session.dirty = true;
  session.lastActivity = Date.now();

  emit(session, {
    type: 'file_updated',
    path: p,
    data: { action: 'redo', versionIndex: idx },
    source: 'user',
  });

  return { success: true, path: p, action: 'redo', versionIndex: idx, content: version.content };
}

/**
 * Get version history for a file.
 */
export function getHistory(session, filePath) {
  const p = normalizePath(filePath);
  const versions = session.history.get(p);
  const idx = session.historyIdx.get(p);

  if (!versions) {
    return { success: false, error: `No history for ${p}` };
  }

  return {
    success: true,
    path: p,
    currentIndex: idx,
    totalVersions: versions.length,
    canUndo: idx > 0,
    canRedo: idx < versions.length - 1,
    versions: versions.map((v, i) => ({
      index: i,
      timestamp: v.timestamp,
      source: v.source,
      size: v.content.length,
      current: i === idx,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════
// EDITOR STATE (cursor, active file, tabs)
// ═══════════════════════════════════════════════════════════════════

export function setActiveFile(session, filePath) {
  const p = normalizePath(filePath);
  if (!session.files.has(p)) {
    return { success: false, error: `File not found: ${p}` };
  }

  session.activeFile = p;
  if (!session.openTabs.includes(p)) {
    session.openTabs.push(p);
  }
  session.lastActivity = Date.now();

  emit(session, {
    type: 'active_file_changed',
    path: p,
    source: 'user',
  });

  return { success: true, activeFile: p };
}

export function setCursor(session, line, column) {
  session.cursor = { line, column };
  session.lastActivity = Date.now();

  emit(session, {
    type: 'cursor_moved',
    data: { line, column },
    source: 'user',
  });

  return { success: true, cursor: { line, column } };
}

export function openTab(session, filePath) {
  const p = normalizePath(filePath);
  if (!session.openTabs.includes(p)) {
    session.openTabs.push(p);
  }
  session.lastActivity = Date.now();
  return { success: true, openTabs: [...session.openTabs] };
}

export function closeTab(session, filePath) {
  const p = normalizePath(filePath);
  session.openTabs = session.openTabs.filter(t => t !== p);
  if (session.activeFile === p) {
    session.activeFile = session.openTabs[0] || null;
  }
  session.lastActivity = Date.now();
  return { success: true, openTabs: [...session.openTabs], activeFile: session.activeFile };
}

/**
 * Get full editor state snapshot.
 */
export function getEditorState(session) {
  return {
    projectId: session.projectId,
    activeFile: session.activeFile,
    cursor: { ...session.cursor },
    openTabs: [...session.openTabs],
    fileCount: session.files.size,
    dirty: session.dirty,
    files: listFiles(session),
  };
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════

/**
 * Search across all files in the session.
 */
export function searchFiles(session, query, options = {}) {
  const { isRegex = false, caseSensitive = false, maxResults = 100 } = options;
  const results = [];

  let regex;
  try {
    regex = new RegExp(
      isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      caseSensitive ? 'g' : 'gi'
    );
  } catch {
    return { success: false, error: 'Invalid search pattern' };
  }

  for (const [filePath, file] of session.files) {
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length && results.length < maxResults; i++) {
      const line = lines[i];
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(line)) !== null && results.length < maxResults) {
        results.push({
          path: filePath,
          line: i + 1,
          column: match.index + 1,
          match: match[0],
          context: line.trim(),
        });
        if (!regex.global) break;
      }
    }
  }

  return { success: true, query, results, totalMatches: results.length };
}

// ═══════════════════════════════════════════════════════════════════
// FILE TREE BUILDER
// ═══════════════════════════════════════════════════════════════════

/**
 * Build a file tree from the session's files.
 */
export function getFileTree(session) {
  const root = [];
  const folderMap = new Map();
  const paths = [...session.files.keys()].sort();

  for (const filePath of paths) {
    const parts = filePath.replace(/^\//, '').split('/');
    let currentLevel = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath += '/' + part;
      const isFile = i === parts.length - 1;

      if (isFile) {
        const file = session.files.get(filePath);
        currentLevel.push({
          name: part,
          path: currentPath,
          type: 'file',
          language: file?.language || detectLanguage(currentPath),
          size: file?.size || 0,
        });
      } else {
        let folder = folderMap.get(currentPath);
        if (!folder) {
          folder = { name: part, path: currentPath, type: 'folder', children: [] };
          folderMap.set(currentPath, folder);
          currentLevel.push(folder);
        }
        currentLevel = folder.children;
      }
    }
  }

  return root;
}

// ═══════════════════════════════════════════════════════════════════
// PERSISTENCE HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Force-save session to DB.
 */
export async function saveSession(userId, projectId) {
  const key = sessionKey(userId, projectId);
  const session = sessions.get(key);
  if (!session) {
    return { success: false, error: 'No active session' };
  }

  await persistSession(session);
  return { success: true, fileCount: session.files.size };
}

/**
 * Log an action to ChatCanvasHistory (if sessionId is provided).
 */
export async function logAction(sessionId, action, data) {
  if (!sessionId) return;
  try {
    await prisma.chatCanvasHistory.create({
      data: { sessionId, action, data },
    });
  } catch {
    // Non-critical — don't throw
  }
}

// ═══════════════════════════════════════════════════════════════════
// ACTIVE SESSIONS INFO (for admin/monitoring)
// ═══════════════════════════════════════════════════════════════════

export function getActiveSessions() {
  const result = [];
  for (const [key, session] of sessions) {
    result.push({
      key,
      userId: session.userId,
      projectId: session.projectId,
      fileCount: session.files.size,
      dirty: session.dirty,
      lastActivity: new Date(session.lastActivity).toISOString(),
      idleMinutes: Math.round((Date.now() - session.lastActivity) / 60000),
    });
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT EXPORT — EditorBridge service singleton
// ═══════════════════════════════════════════════════════════════════

const editorBridge = {
  // Session lifecycle
  getSession,
  closeSession,
  saveSession,

  // File CRUD
  createFile,
  readFile,
  updateFile,
  applyDiff,
  deleteFile,
  renameFile,
  listFiles,
  getFilesArray,
  setFiles,

  // Version history
  undo,
  redo,
  getHistory,

  // Editor state
  setActiveFile,
  setCursor,
  openTab,
  closeTab,
  getEditorState,

  // Search & tree
  searchFiles,
  getFileTree,

  // Events
  subscribe,

  // Persistence
  logAction,

  // Admin
  getActiveSessions,
};

export default editorBridge;
