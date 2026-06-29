/**
 * ============================================================================
 * EDITOR BRIDGE SERVICE — ai-studio-demo-backend (port 3009)
 * ============================================================================
 *
 * Server-side editor state management for AI Studio Demo.
 * Uses CanvasBuildProject Prisma model (simpler: files JSON + chatHistory).
 *
 * Features:
 *   - Session lifecycle with DB-backed persistence
 *   - File CRUD with per-file version history (max 50)
 *   - Undo / redo per file
 *   - Editor state (active file, cursor, open tabs)
 *   - Cross-file search (regex support)
 *   - File tree builder
 *   - Change event system (subscribe / emit)
 *   - Idle session GC (30 min)
 */

import prisma from '../lib/prisma.js';

// ─── In-Memory Session Store ────────────────────────────────────
const sessions = new Map(); // key: `${userId}:${projectId}`

const MAX_HISTORY = 50;
const SESSION_TTL = 30 * 60 * 1000; // 30 min idle

function sessionKey(userId, projectId) {
  return `${userId}:${projectId}`;
}

// ─── Session Lifecycle ──────────────────────────────────────────

async function getSession(userId, projectId) {
  const key = sessionKey(userId, projectId);
  if (sessions.has(key)) {
    const s = sessions.get(key);
    s.lastAccess = Date.now();
    return s;
  }

  // Load from DB
  const project = await prisma.canvasBuildProject.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error(`Project ${projectId} not found`);
  if (project.userId !== userId) throw new Error('Access denied');

  const files = new Map();
  const rawFiles = Array.isArray(project.files) ? project.files : [];
  for (const f of rawFiles) {
    files.set(f.path || f.name, {
      path: f.path || f.name,
      content: f.content || '',
      language: f.language || detectLanguage(f.path || f.name),
      history: [{ content: f.content || '', ts: Date.now() }],
      historyIndex: 0,
    });
  }

  const session = {
    userId,
    projectId,
    files,
    activeFile: rawFiles[0]?.path || rawFiles[0]?.name || null,
    cursor: { line: 1, column: 1 },
    openTabs: rawFiles.slice(0, 5).map((f) => f.path || f.name),
    listeners: new Set(),
    lastAccess: Date.now(),
    dirty: false,
  };

  sessions.set(key, session);
  return session;
}

async function closeSession(userId, projectId) {
  const key = sessionKey(userId, projectId);
  const session = sessions.get(key);
  if (!session) return;
  if (session.dirty) await persistSession(session);
  session.listeners.clear();
  sessions.delete(key);
}

async function persistSession(session) {
  const filesArr = [];
  for (const [, f] of session.files) {
    filesArr.push({ path: f.path, content: f.content, language: f.language });
  }
  try {
    await prisma.canvasBuildProject.update({
      where: { id: session.projectId },
      data: { files: filesArr, updatedAt: new Date() },
    });
    session.dirty = false;
    return { success: true, fileCount: filesArr.length };
  } catch (err) {
    console.error('[EditorBridge] persist error:', err.message);
    return { success: false, error: err.message };
  }
}

async function saveSession(userId, projectId) {
  const key = sessionKey(userId, projectId);
  const session = sessions.get(key);
  if (!session) return { success: false, error: 'No active session' };
  return persistSession(session);
}

// ─── File CRUD ──────────────────────────────────────────────────

function createFile(session, filePath, content = '', source = 'user') {
  if (session.files.has(filePath)) {
    return { success: false, error: `File already exists: ${filePath}` };
  }
  const file = {
    path: filePath,
    content,
    language: detectLanguage(filePath),
    history: [{ content, ts: Date.now() }],
    historyIndex: 0,
  };
  session.files.set(filePath, file);
  session.dirty = true;
  emit(session, { type: 'file:created', path: filePath, source });
  return { success: true, path: filePath };
}

function readFile(session, filePath) {
  const file = session.files.get(filePath);
  if (!file) return { success: false, error: `File not found: ${filePath}` };
  return { success: true, path: file.path, content: file.content, language: file.language };
}

function updateFile(session, filePath, content, source = 'user') {
  const file = session.files.get(filePath);
  if (!file) return { success: false, error: `File not found: ${filePath}` };

  pushHistory(file, content);
  file.content = content;
  session.dirty = true;
  emit(session, { type: 'file:updated', path: filePath, source });
  return { success: true, path: filePath, version: file.historyIndex };
}

function applyDiff(session, filePath, diff, source = 'agent') {
  const file = session.files.get(filePath);
  if (!file) return { success: false, error: `File not found: ${filePath}` };

  let newContent = file.content;
  if (diff.search != null && diff.replace != null) {
    newContent = newContent.replace(diff.search, diff.replace);
  } else if (diff.lineStart != null && diff.newLines != null) {
    const lines = newContent.split('\n');
    const end = diff.lineEnd ?? diff.lineStart;
    lines.splice(diff.lineStart - 1, end - diff.lineStart + 1, ...diff.newLines);
    newContent = lines.join('\n');
  } else {
    return { success: false, error: 'Invalid diff format' };
  }

  pushHistory(file, newContent);
  file.content = newContent;
  session.dirty = true;
  emit(session, { type: 'file:diffApplied', path: filePath, source });
  return { success: true, path: filePath, version: file.historyIndex };
}

function deleteFile(session, filePath, source = 'user') {
  if (!session.files.has(filePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }
  session.files.delete(filePath);
  session.openTabs = session.openTabs.filter((t) => t !== filePath);
  if (session.activeFile === filePath) {
    session.activeFile = session.openTabs[0] || null;
  }
  session.dirty = true;
  emit(session, { type: 'file:deleted', path: filePath, source });
  return { success: true, path: filePath };
}

function renameFile(session, from, to, source = 'user') {
  const file = session.files.get(from);
  if (!file) return { success: false, error: `File not found: ${from}` };
  if (session.files.has(to)) return { success: false, error: `File already exists: ${to}` };

  session.files.delete(from);
  file.path = to;
  file.language = detectLanguage(to);
  session.files.set(to, file);
  session.openTabs = session.openTabs.map((t) => (t === from ? to : t));
  if (session.activeFile === from) session.activeFile = to;
  session.dirty = true;
  emit(session, { type: 'file:renamed', from, to, source });
  return { success: true, from, to };
}

function listFiles(session) {
  const list = [];
  for (const [, f] of session.files) {
    list.push({ path: f.path, language: f.language, size: f.content.length });
  }
  return list;
}

function getFilesArray(session) {
  const arr = [];
  for (const [, f] of session.files) {
    arr.push({ path: f.path, content: f.content, language: f.language });
  }
  return arr;
}

function setFiles(session, files, source = 'user') {
  session.files.clear();
  for (const f of files) {
    const path = f.path || f.name;
    session.files.set(path, {
      path,
      content: f.content || '',
      language: f.language || detectLanguage(path),
      history: [{ content: f.content || '', ts: Date.now() }],
      historyIndex: 0,
    });
  }
  session.dirty = true;
  emit(session, { type: 'files:set', count: files.length, source });
}

// ─── Version History ────────────────────────────────────────────

function pushHistory(file, newContent) {
  // Truncate forward history if we're not at the tip
  if (file.historyIndex < file.history.length - 1) {
    file.history = file.history.slice(0, file.historyIndex + 1);
  }
  file.history.push({ content: newContent, ts: Date.now() });
  if (file.history.length > MAX_HISTORY) file.history.shift();
  file.historyIndex = file.history.length - 1;
}

function undo(session, filePath) {
  const file = session.files.get(filePath);
  if (!file) return { success: false, error: `File not found: ${filePath}` };
  if (file.historyIndex <= 0) return { success: false, error: 'Nothing to undo' };
  file.historyIndex--;
  file.content = file.history[file.historyIndex].content;
  session.dirty = true;
  emit(session, { type: 'file:undo', path: filePath });
  return { success: true, path: filePath, version: file.historyIndex, content: file.content };
}

function redo(session, filePath) {
  const file = session.files.get(filePath);
  if (!file) return { success: false, error: `File not found: ${filePath}` };
  if (file.historyIndex >= file.history.length - 1) return { success: false, error: 'Nothing to redo' };
  file.historyIndex++;
  file.content = file.history[file.historyIndex].content;
  session.dirty = true;
  emit(session, { type: 'file:redo', path: filePath });
  return { success: true, path: filePath, version: file.historyIndex, content: file.content };
}

function getHistory(session, filePath) {
  const file = session.files.get(filePath);
  if (!file) return { success: false, error: `File not found: ${filePath}` };
  return {
    success: true,
    path: filePath,
    current: file.historyIndex,
    total: file.history.length,
    canUndo: file.historyIndex > 0,
    canRedo: file.historyIndex < file.history.length - 1,
  };
}

// ─── Editor State ───────────────────────────────────────────────

function getEditorState(session) {
  return {
    projectId: session.projectId,
    activeFile: session.activeFile,
    cursor: { ...session.cursor },
    openTabs: [...session.openTabs],
    fileCount: session.files.size,
    dirty: session.dirty,
  };
}

function setActiveFile(session, filePath) {
  if (!session.files.has(filePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }
  session.activeFile = filePath;
  if (!session.openTabs.includes(filePath)) session.openTabs.push(filePath);
  emit(session, { type: 'editor:activeFile', path: filePath });
  return { success: true, activeFile: filePath };
}

function setCursor(session, line, column) {
  session.cursor = { line, column };
  return { success: true, cursor: session.cursor };
}

function openTab(session, filePath) {
  if (!session.files.has(filePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }
  if (!session.openTabs.includes(filePath)) session.openTabs.push(filePath);
  return { success: true, openTabs: [...session.openTabs] };
}

function closeTab(session, filePath) {
  session.openTabs = session.openTabs.filter((t) => t !== filePath);
  if (session.activeFile === filePath) {
    session.activeFile = session.openTabs[0] || null;
  }
  return { success: true, openTabs: [...session.openTabs], activeFile: session.activeFile };
}

// ─── Search ─────────────────────────────────────────────────────

function searchFiles(session, query, opts = {}) {
  const { isRegex = false, caseSensitive = false, maxResults = 100 } = opts;
  const results = [];
  let pattern;
  try {
    pattern = isRegex
      ? new RegExp(query, caseSensitive ? 'g' : 'gi')
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
  } catch {
    return { success: false, error: 'Invalid search pattern' };
  }

  for (const [, file] of session.files) {
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length && results.length < maxResults; i++) {
      if (pattern.test(lines[i])) {
        results.push({ path: file.path, line: i + 1, text: lines[i].trim() });
        pattern.lastIndex = 0;
      }
    }
    if (results.length >= maxResults) break;
  }

  return { success: true, results, total: results.length };
}

// ─── File Tree ──────────────────────────────────────────────────

function getFileTree(session) {
  const root = { name: '/', children: {}, type: 'directory' };
  for (const [filePath] of session.files) {
    const parts = filePath.replace(/^\//, '').split('/');
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        node.children[part] = { name: part, type: 'file', path: filePath };
      } else {
        if (!node.children[part]) {
          node.children[part] = { name: part, type: 'directory', children: {} };
        }
        node = node.children[part];
      }
    }
  }
  return root;
}

// ─── Event System ───────────────────────────────────────────────

function subscribe(session, callback) {
  session.listeners.add(callback);
  return () => session.listeners.delete(callback);
}

function emit(session, event) {
  const enriched = { ...event, ts: Date.now(), projectId: session.projectId };
  for (const cb of session.listeners) {
    try { cb(enriched); } catch { /* swallow */ }
  }
}

// ─── Session GC ─────────────────────────────────────────────────

function getActiveSessions() {
  const list = [];
  for (const [key, s] of sessions) {
    list.push({
      key,
      projectId: s.projectId,
      userId: s.userId,
      files: s.files.size,
      dirty: s.dirty,
      idleMs: Date.now() - s.lastAccess,
    });
  }
  return list;
}

setInterval(async () => {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (now - session.lastAccess > SESSION_TTL) {
      if (session.dirty) {
        try { await persistSession(session); } catch { /* swallow */ }
      }
      session.listeners.clear();
      sessions.delete(key);
      console.log(`[EditorBridge] GC session ${key}`);
    }
  }
}, 5 * 60 * 1000);

// ─── Language Detection ─────────────────────────────────────────

function detectLanguage(filePath) {
  if (!filePath) return 'text';
  const ext = filePath.split('.').pop()?.toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
    html: 'html', css: 'css', scss: 'scss', less: 'less',
    json: 'json', yaml: 'yaml', yml: 'yaml', xml: 'xml',
    md: 'markdown', sql: 'sql', sh: 'shell', bash: 'shell',
    java: 'java', kt: 'kotlin', swift: 'swift', c: 'c', cpp: 'cpp',
    h: 'c', hpp: 'cpp', cs: 'csharp', php: 'php',
    vue: 'vue', svelte: 'svelte', toml: 'toml', env: 'dotenv',
  };
  return map[ext] || 'text';
}

// ─── Export ─────────────────────────────────────────────────────

export default {
  getSession,
  closeSession,
  saveSession,
  persistSession,
  getEditorState,
  createFile,
  readFile,
  updateFile,
  applyDiff,
  deleteFile,
  renameFile,
  listFiles,
  getFilesArray,
  setFiles,
  undo,
  redo,
  getHistory,
  setActiveFile,
  setCursor,
  openTab,
  closeTab,
  searchFiles,
  getFileTree,
  subscribe,
  getActiveSessions,
};
