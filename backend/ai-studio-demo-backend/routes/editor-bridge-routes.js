/**
 * ============================================================================
 * EDITOR BRIDGE ROUTES — canvas-app-backend (port 3006)
 * ============================================================================
 *
 * REST API + SSE for real-time editor state management.
 * All routes require authentication (requireAuth middleware).
 *
 * Routes:
 *   POST   /api/editor/session/open     — Open/resume an editor session
 *   POST   /api/editor/session/close    — Close & persist a session
 *   POST   /api/editor/session/save     — Force-save session to DB
 *   GET    /api/editor/state             — Get full editor state snapshot
 *
 *   POST   /api/editor/file/create       — Create a file
 *   POST   /api/editor/file/update       — Update file content
 *   POST   /api/editor/file/diff         — Apply diff hunks to a file
 *   POST   /api/editor/file/delete       — Delete a file
 *   POST   /api/editor/file/rename       — Rename/move a file
 *   GET    /api/editor/file/read         — Read a file (?path=...)
 *   GET    /api/editor/file/list         — List all files
 *   POST   /api/editor/file/bulk         — Bulk-set files
 *
 *   POST   /api/editor/undo              — Undo last change to a file
 *   POST   /api/editor/redo              — Redo last undone change
 *   GET    /api/editor/history           — Get version history (?path=...)
 *
 *   POST   /api/editor/active-file       — Set active file
 *   POST   /api/editor/cursor            — Set cursor position
 *   POST   /api/editor/tab/open          — Open a tab
 *   POST   /api/editor/tab/close         — Close a tab
 *
 *   GET    /api/editor/search            — Search across files
 *   GET    /api/editor/tree              — Get file tree
 *
 *   GET    /api/editor/events            — SSE stream for real-time changes
 *
 *   GET    /api/editor/sessions          — List active sessions (admin)
 */

import { Router } from 'express';
import editorBridge from '../services/editor-bridge.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ═══════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Open or resume an editor session for a project.
 */
router.post('/session/open', async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId is required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const state = editorBridge.getEditorState(session);

    res.json({ success: true, ...state });
  } catch (err) {
    const status = err.message.includes('not found') ? 404
      : err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

/**
 * Close a session (persists to DB).
 */
router.post('/session/close', async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId is required' });
    }

    await editorBridge.closeSession(req.user.id, projectId);
    res.json({ success: true, message: 'Session closed and saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Force-save session to DB without closing.
 */
router.post('/session/save', async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId is required' });
    }

    const result = await editorBridge.saveSession(req.user.id, projectId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Get full editor state snapshot.
 */
router.get('/state', async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId query param is required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const state = editorBridge.getEditorState(session);

    res.json({ success: true, ...state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// FILE CRUD
// ═══════════════════════════════════════════════════════════════════

router.post('/file/create', async (req, res) => {
  try {
    const { projectId, path: filePath, content, source } = req.body;
    if (!projectId || !filePath) {
      return res.status(400).json({ success: false, error: 'projectId and path are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.createFile(session, filePath, content || '', source || 'user');

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/file/update', async (req, res) => {
  try {
    const { projectId, path: filePath, content, source } = req.body;
    if (!projectId || !filePath) {
      return res.status(400).json({ success: false, error: 'projectId and path are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.updateFile(session, filePath, content || '', source || 'user');

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/file/diff', async (req, res) => {
  try {
    const { projectId, path: filePath, diff, source } = req.body;
    if (!projectId || !filePath || !diff) {
      return res.status(400).json({ success: false, error: 'projectId, path, and diff are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.applyDiff(session, filePath, diff, source || 'agent');

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/file/delete', async (req, res) => {
  try {
    const { projectId, path: filePath, source } = req.body;
    if (!projectId || !filePath) {
      return res.status(400).json({ success: false, error: 'projectId and path are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.deleteFile(session, filePath, source || 'user');

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/file/rename', async (req, res) => {
  try {
    const { projectId, from, to, source } = req.body;
    if (!projectId || !from || !to) {
      return res.status(400).json({ success: false, error: 'projectId, from, and to are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.renameFile(session, from, to, source || 'user');

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/file/read', async (req, res) => {
  try {
    const { projectId, path: filePath } = req.query;
    if (!projectId || !filePath) {
      return res.status(400).json({ success: false, error: 'projectId and path query params are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.readFile(session, filePath);

    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/file/list', async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId query param is required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const files = editorBridge.listFiles(session);

    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/file/bulk', async (req, res) => {
  try {
    const { projectId, files, source } = req.body;
    if (!projectId || !Array.isArray(files)) {
      return res.status(400).json({ success: false, error: 'projectId and files array are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    editorBridge.setFiles(session, files, source || 'user');

    res.json({ success: true, fileCount: files.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// VERSION HISTORY (undo/redo)
// ═══════════════════════════════════════════════════════════════════

router.post('/undo', async (req, res) => {
  try {
    const { projectId, path: filePath } = req.body;
    if (!projectId || !filePath) {
      return res.status(400).json({ success: false, error: 'projectId and path are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.undo(session, filePath);

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/redo', async (req, res) => {
  try {
    const { projectId, path: filePath } = req.body;
    if (!projectId || !filePath) {
      return res.status(400).json({ success: false, error: 'projectId and path are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.redo(session, filePath);

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { projectId, path: filePath } = req.query;
    if (!projectId || !filePath) {
      return res.status(400).json({ success: false, error: 'projectId and path query params are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.getHistory(session, filePath);

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// EDITOR STATE (cursor, tabs, active file)
// ═══════════════════════════════════════════════════════════════════

router.post('/active-file', async (req, res) => {
  try {
    const { projectId, path: filePath } = req.body;
    if (!projectId || !filePath) {
      return res.status(400).json({ success: false, error: 'projectId and path are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.setActiveFile(session, filePath);

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/cursor', async (req, res) => {
  try {
    const { projectId, line, column } = req.body;
    if (!projectId || !line) {
      return res.status(400).json({ success: false, error: 'projectId and line are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.setCursor(session, line, column || 1);

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tab/open', async (req, res) => {
  try {
    const { projectId, path: filePath } = req.body;
    if (!projectId || !filePath) {
      return res.status(400).json({ success: false, error: 'projectId and path are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.openTab(session, filePath);

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tab/close', async (req, res) => {
  try {
    const { projectId, path: filePath } = req.body;
    if (!projectId || !filePath) {
      return res.status(400).json({ success: false, error: 'projectId and path are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.closeTab(session, filePath);

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SEARCH & FILE TREE
// ═══════════════════════════════════════════════════════════════════

router.get('/search', async (req, res) => {
  try {
    const { projectId, query, isRegex, caseSensitive, maxResults } = req.query;
    if (!projectId || !query) {
      return res.status(400).json({ success: false, error: 'projectId and query are required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const result = editorBridge.searchFiles(session, query, {
      isRegex: isRegex === 'true',
      caseSensitive: caseSensitive === 'true',
      maxResults: parseInt(maxResults) || 100,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tree', async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId query param is required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);
    const tree = editorBridge.getFileTree(session);

    res.json({ success: true, tree });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SSE — REAL-TIME CHANGE EVENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * SSE endpoint: streams EditorChangeEvent objects as they happen.
 * Client connects with ?projectId=... and receives events in real-time.
 */
router.get('/events', async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId query param is required' });
    }

    const session = await editorBridge.getSession(req.user.id, projectId);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial state
    res.write(`data: ${JSON.stringify({ type: 'connected', ...editorBridge.getEditorState(session) })}\n\n`);

    // Subscribe to changes
    const unsubscribe = editorBridge.subscribe(session, (event) => {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch {
        // Client disconnected
      }
    });

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Clean up on disconnect
    req.on('close', () => {
      unsubscribe();
      clearInterval(heartbeat);
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN — ACTIVE SESSIONS
// ═══════════════════════════════════════════════════════════════════

router.get('/sessions', (req, res) => {
  try {
    const sessions = editorBridge.getActiveSessions();
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
