/**
 * CANVAS GIT ROUTES — /api/canvas-git
 *
 * Virtual git for canvas-studio projects. Project files live in the DB as JSON,
 * so this implements a snapshot-based commit history without requiring a real git binary.
 *
 *   GET  /:projectId/status               — list current files vs. last snapshot (changed/untracked)
 *   GET  /:projectId/log                  — list all snapshots (commits) for this project
 *   POST /:projectId/commit               — save a new snapshot (commit)
 *   POST /:projectId/checkout/:snapshotId — restore project files to a previous snapshot
 *   POST /:projectId/push                 — push to linked GitHub repo (requires OAuth)
 *   POST /:projectId/pull                 — pull from linked GitHub repo (requires OAuth)
 *   GET  /:projectId/branches             — list branches (currently just "main")
 */

import express from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

/** Short hash like git (8 hex chars) */
function makeHash() {
  return crypto.randomBytes(4).toString('hex');
}

/** Ensure caller owns the project */
async function getOwnedProject(projectId, userId) {
  return prisma.canvasProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true, name: true, files: true },
  });
}

// ── GET /:projectId/status ───────────────────────────────────────
// Compare current project files against the last snapshot to produce
// a git-style status list (modified / added / deleted / untracked).
router.get('/:projectId/status', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await getOwnedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    // Latest snapshot
    const lastSnapshot = await prisma.canvasGitSnapshot.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { files: true, hash: true, message: true, createdAt: true },
    });

    const currentFiles = Array.isArray(project.files) ? project.files : [];
    const snapshotFiles = lastSnapshot ? (Array.isArray(lastSnapshot.files) ? lastSnapshot.files : []) : [];

    const snapshotMap = new Map(snapshotFiles.map((f) => [f.path, f.content]));
    const currentMap = new Map(currentFiles.map((f) => [f.path, f.content]));

    const statusFiles = [];

    // Modified / untracked (in current, may differ from snapshot)
    for (const [path, content] of currentMap) {
      if (!snapshotMap.has(path)) {
        statusFiles.push({ path, status: lastSnapshot ? 'untracked' : 'added', staged: false });
      } else if (snapshotMap.get(path) !== content) {
        statusFiles.push({ path, status: 'modified', staged: false });
      }
    }

    // Deleted (in snapshot but not in current)
    for (const [path] of snapshotMap) {
      if (!currentMap.has(path)) {
        statusFiles.push({ path, status: 'deleted', staged: false });
      }
    }

    res.json({
      success: true,
      branch: 'main',
      clean: statusFiles.length === 0,
      files: statusFiles,
      lastCommit: lastSnapshot
        ? { hash: lastSnapshot.hash, message: lastSnapshot.message, date: lastSnapshot.createdAt }
        : null,
    });
  } catch (err) {
    console.error('[GitRoutes] status error:', err);
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

// ── GET /:projectId/log ──────────────────────────────────────────
router.get('/:projectId/log', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await getOwnedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const snapshots = await prisma.canvasGitSnapshot.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, hash: true, message: true, author: true, branch: true, fileCount: true, createdAt: true },
    });

    // Shape to match GitCommitEntry interface
    const commits = snapshots.map((s) => ({
      id: s.id,
      hash: s.hash,
      message: s.message,
      author: s.author || 'Unknown',
      date: s.createdAt.toISOString(),
      branch: s.branch,
      fileCount: s.fileCount,
    }));

    res.json({ success: true, commits, branch: 'main' });
  } catch (err) {
    console.error('[GitRoutes] log error:', err);
    res.status(500).json({ success: false, error: 'Failed to get commit log' });
  }
});

// ── GET /:projectId/branches ─────────────────────────────────────
router.get('/:projectId/branches', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await getOwnedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    // Virtual branches from snapshots (distinct branch names)
    const rows = await prisma.canvasGitSnapshot.findMany({
      where: { projectId },
      distinct: ['branch'],
      select: { branch: true },
    });

    const branches = rows.length > 0 ? rows.map((r) => r.branch) : ['main'];
    res.json({ success: true, branches, current: 'main' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get branches' });
  }
});

// ── POST /:projectId/commit ──────────────────────────────────────
// Body: { message: string, author?: string, branch?: string }
router.post('/:projectId/commit', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message, author, branch = 'main' } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'Commit message is required' });
    }

    const project = await getOwnedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const currentFiles = Array.isArray(project.files) ? project.files : [];

    const snapshot = await prisma.canvasGitSnapshot.create({
      data: {
        projectId,
        userId: req.userId,
        message: message.trim(),
        files: currentFiles,
        fileCount: currentFiles.length,
        hash: makeHash(),
        branch,
        author: author || null,
      },
    });

    res.json({
      success: true,
      commit: {
        id: snapshot.id,
        hash: snapshot.hash,
        message: snapshot.message,
        author: snapshot.author,
        date: snapshot.createdAt.toISOString(),
        branch: snapshot.branch,
        fileCount: snapshot.fileCount,
      },
    });
  } catch (err) {
    console.error('[GitRoutes] commit error:', err);
    res.status(500).json({ success: false, error: 'Failed to create commit' });
  }
});

// ── POST /:projectId/checkout/:snapshotId ────────────────────────
// Restore project files to a previous snapshot. Creates an auto-commit
// of current state first so nothing is lost.
router.post('/:projectId/checkout/:snapshotId', requireAuth, async (req, res) => {
  try {
    const { projectId, snapshotId } = req.params;
    const project = await getOwnedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const target = await prisma.canvasGitSnapshot.findFirst({
      where: { id: snapshotId, projectId },
    });
    if (!target) return res.status(404).json({ success: false, error: 'Snapshot not found' });

    // Auto-save current state before checkout
    const currentFiles = Array.isArray(project.files) ? project.files : [];
    if (currentFiles.length > 0) {
      await prisma.canvasGitSnapshot.create({
        data: {
          projectId,
          userId: req.userId,
          message: `Auto-save before checkout to ${target.hash}`,
          files: currentFiles,
          fileCount: currentFiles.length,
          hash: makeHash(),
          branch: 'main',
        },
      });
    }

    // Restore project files from snapshot
    await prisma.canvasProject.update({
      where: { id: projectId },
      data: { files: target.files },
    });

    res.json({ success: true, message: `Restored to commit ${target.hash}: ${target.message}`, files: target.files });
  } catch (err) {
    console.error('[GitRoutes] checkout error:', err);
    res.status(500).json({ success: false, error: 'Failed to checkout snapshot' });
  }
});

// ── POST /:projectId/push ────────────────────────────────────────
// Push: requires GitHub integration (OAuth). Returns actionable status.
router.post('/:projectId/push', requireAuth, async (req, res) => {
  const project = await getOwnedProject(req.params.projectId, req.userId);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  // Check if project has a linked remote
  const metadata = typeof project.files === 'object' && !Array.isArray(project.files)
    ? project.files : {};
  const hasRemote = !!metadata?.gitRemote;

  if (!hasRemote) {
    return res.status(422).json({
      success: false,
      status: 'not_configured',
      message: 'No remote repository linked. Connect your GitHub account in Project Settings to push code.',
      action: 'connect_github',
    });
  }

  // Future: push via GitHub API
  res.json({
    success: true,
    message: 'Push to remote: GitHub integration coming soon.',
    status: 'not_configured',
  });
});

// ── POST /:projectId/pull ────────────────────────────────────────
// Pull: requires GitHub integration (OAuth). Returns actionable status.
router.post('/:projectId/pull', requireAuth, async (req, res) => {
  const project = await getOwnedProject(req.params.projectId, req.userId);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const metadata = typeof project.files === 'object' && !Array.isArray(project.files)
    ? project.files : {};
  const hasRemote = !!metadata?.gitRemote;

  if (!hasRemote) {
    return res.status(422).json({
      success: false,
      status: 'not_configured',
      message: 'No remote repository linked. Connect your GitHub account in Project Settings to pull code.',
      action: 'connect_github',
    });
  }

  res.json({
    success: true,
    message: 'Pull from remote: GitHub integration coming soon.',
    status: 'not_configured',
  });
});

export default router;
