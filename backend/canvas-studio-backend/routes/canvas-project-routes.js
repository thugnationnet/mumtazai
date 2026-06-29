/**
 * CANVAS PROJECT API ROUTES — Prisma-backed (CANVAS-BUILD ONLY)
 * Endpoints for managing canvas-build projects (inside universal-chat).
 *
 * Database Isolation:
 *   Uses the dedicated `canvas_build_projects` table (CanvasBuildProject model).
 *   Canvas-app has its own separate table (`canvas_projects` / CanvasProject).
 *   No source-column filtering needed — table-level separation enforces isolation.
 *
 * Field Mapping (frontend ↔ Prisma CanvasBuildProject):
 *   code        → files[0].content   (stored as JSON array of file objects)
 *   chatHistory → chatHistory         (native JSON column)
 *   metadata    → metadata            (native JSON column)
 *
 * Auth Gate:
 *   Write operations require authentication (requireAuth).
 *   Read operations use optionalAuth (guests can view own projects).
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { requireAuth, optionalAuth } from '../lib/auth-middleware.js';

const router = express.Router();

// ============================================
// HELPERS
// ============================================

/** Input validation middleware */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Convert a Prisma CanvasBuildProject row into the flat shape the
 * useCanvasProjects hook expects.
 */
function toFrontendProject(row) {
  const files = Array.isArray(row.files) ? row.files : [];
  const mainFile = files.find((f) => f.path === '/index.html') || files[0];

  return {
    id: row.id,
    projectId: row.id,
    name: row.name,
    description: row.description || '',
    code: mainFile?.content || '',
    chatHistory: Array.isArray(row.chatHistory) ? row.chatHistory : [],
    metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata
      : {},
    thumbnail: row.thumbnail || null,
    tags: row.tags || [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Build Prisma `data` object from frontend-supplied fields.
 */
function toPrismaData({ name, description, code, chatHistory, metadata, thumbnail, tags }) {
  const data = {};

  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (thumbnail !== undefined) data.thumbnail = thumbnail;
  if (tags !== undefined) data.tags = tags;

  // code → files JSON
  if (code !== undefined) {
    data.files = [{ path: '/index.html', name: 'index.html', content: code }];
  }

  // chatHistory → native chatHistory JSON column
  if (chatHistory !== undefined) {
    data.chatHistory = Array.isArray(chatHistory) ? chatHistory : [];
  }

  // metadata → native metadata JSON column
  if (metadata !== undefined) {
    data.metadata = metadata && typeof metadata === 'object' ? metadata : {};
  }

  return data;
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/canvas-projects
 * List canvas-build projects for the authenticated user.
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.json({ success: true, projects: [] });
    }

    const projects = await prisma.canvasBuildProject.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      projects: projects.map(toFrontendProject),
    });
  } catch (error) {
    console.error('[CanvasAPI] List projects error:', error);
    res.status(500).json({ success: false, error: 'Failed to list projects' });
  }
});

/**
 * POST /api/canvas-projects
 * Create or upsert a canvas-build project.
 */
router.post('/', requireAuth, [
  body('name').optional().isString().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('code').optional().isString(),
  body('thumbnail').optional().isString(),
  body('tags').optional().isArray(),
  body('metadata').optional().isObject(),
  body('chatHistory').optional().isArray(),
], validateRequest, async (req, res) => {
  try {
    const {
      id: clientId,
      name,
      description,
      code,
      thumbnail,
      tags,
      metadata,
      chatHistory,
    } = req.body;
    const userId = req.userId;

    const prismaFields = toPrismaData({
      name: name || 'Untitled Project',
      description: description || '',
      code: code || '',
      chatHistory,
      metadata,
      thumbnail,
      tags: tags || [],
    });

    let project;

    // If the frontend sends its own id, upsert so re-saves don't create duplicates
    if (clientId) {
      project = await prisma.canvasBuildProject.upsert({
        where: { id: clientId },
        update: prismaFields,
        create: { id: clientId, userId, ...prismaFields },
      });
    } else {
      project = await prisma.canvasBuildProject.create({
        data: { userId, ...prismaFields },
      });
    }

    res.json({
      success: true,
      projectId: project.id,
      message: 'Project saved successfully',
    });
  } catch (error) {
    console.error('[CanvasAPI] Save project error:', error);
    res.status(500).json({ success: false, error: 'Failed to save project' });
  }
});

/**
 * GET /api/canvas-projects/search
 * Search canvas-build projects by name or description.
 * NOTE: Must be registered BEFORE /:projectId
 */
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    const userId = req.userId;
    if (!userId) {
      return res.json({ success: true, projects: [] });
    }

    const projects = await prisma.canvasBuildProject.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      projects: projects.map(toFrontendProject),
    });
  } catch (error) {
    console.error('[CanvasAPI] Search projects error:', error);
    res.status(500).json({ success: false, error: 'Failed to search projects' });
  }
});

/**
 * GET /api/canvas-projects/:projectId
 * Load a specific canvas-build project.
 */
router.get('/:projectId', optionalAuth, [
  param('projectId').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.canvasBuildProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Ownership check (allow own projects only)
    if (project.userId !== req.userId) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({
      success: true,
      project: toFrontendProject(project),
    });
  } catch (error) {
    console.error('[CanvasAPI] Load project error:', error);
    res.status(500).json({ success: false, error: 'Failed to load project' });
  }
});

/**
 * PUT /api/canvas-projects/:projectId
 * Update a canvas-build project.
 */
router.put('/:projectId', requireAuth, [
  param('projectId').isString().isLength({ min: 1 }),
  body('name').optional().isString().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('code').optional().isString(),
  body('thumbnail').optional().isString(),
  body('tags').optional().isArray(),
  body('metadata').optional().isObject(),
  body('chatHistory').optional().isArray(),
], validateRequest, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    // Find and verify ownership
    const existing = await prisma.canvasBuildProject.findUnique({
      where: { id: projectId },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const { name, description, code, thumbnail, tags, metadata, chatHistory } = req.body;
    const prismaFields = toPrismaData({ name, description, code, chatHistory, metadata, thumbnail, tags });

    await prisma.canvasBuildProject.update({
      where: { id: projectId },
      data: prismaFields,
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('[CanvasAPI] Update project error:', error);
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

/**
 * DELETE /api/canvas-projects/:projectId
 * Delete a canvas-build project.
 */
router.delete('/:projectId', requireAuth, [
  param('projectId').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const existing = await prisma.canvasBuildProject.findUnique({
      where: { id: projectId },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    await prisma.canvasBuildProject.delete({ where: { id: projectId } });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('[CanvasAPI] Delete project error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

/**
 * POST /api/canvas-projects/:projectId/export
 * Export a canvas-build project as HTML or JSON.
 */
router.post('/:projectId/export', requireAuth, [
  param('projectId').isString().isLength({ min: 1 }),
  body('format').optional().isIn(['html', 'json']),
], validateRequest, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format = 'html' } = req.body;
    const userId = req.userId;

    const project = await prisma.canvasBuildProject.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const frontendProject = toFrontendProject(project);

    if (format === 'json') {
      res.json({
        success: true,
        data: frontendProject,
        fileName: `${frontendProject.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.json`,
        format: 'json',
        message: 'Project exported successfully',
      });
    } else {
      // HTML export — wrap code in a standalone HTML document
      const htmlContent = frontendProject.code.includes('<!DOCTYPE')
        ? frontendProject.code
        : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frontendProject.name}</title>
</head>
<body>
${frontendProject.code}
</body>
</html>`;

      res.json({
        success: true,
        data: htmlContent,
        fileName: `${frontendProject.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`,
        format: 'html',
        message: 'Project exported successfully',
      });
    }
  } catch (error) {
    console.error('[CanvasAPI] Export project error:', error);
    res.status(500).json({ success: false, error: 'Failed to export project' });
  }
});

export default router;