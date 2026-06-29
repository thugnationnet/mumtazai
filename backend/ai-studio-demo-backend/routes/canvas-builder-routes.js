/**
 * CANVAS BUILDER API ROUTES (CANVAS-APP ONLY)
 * Full CRUD API for AI-powered app builder projects.
 * Uses the dedicated `canvas_projects` table (CanvasProject model).
 * Canvas-build has its own separate table (`canvas_build_projects`).
 * No source-column filtering needed — table-level separation enforces isolation.
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { rateLimiters } from '../lib/cache.js';
import { requireAuth, optionalAuth } from '../lib/auth-middleware.js';
import {
  generateWithProvider,
  getDefaultProvider,
  getMultiFileSystemPrompt,
  parseFileActions,
} from '../lib/ai-canvas-provider.js';

// ============================================
// FRAMEWORK NORMALIZATION
// ============================================

// Frontend sends 'vite-react' (hyphen), Prisma enum expects 'vite_react' (underscore)
const FRAMEWORK_TO_PRISMA = {
  'vite-react': 'vite_react',
  'nextjs': 'nextjs',
  'html': 'html',
  'express': 'express',
  'fastapi': 'fastapi',
};

const FRAMEWORK_FROM_PRISMA = {
  'vite_react': 'vite-react',
  'nextjs': 'nextjs',
  'html': 'html',
  'express': 'express',
  'fastapi': 'fastapi',
};

function normalizeToPrisma(framework) {
  return FRAMEWORK_TO_PRISMA[framework] || framework?.replace(/-/g, '_') || 'vite_react';
}

function normalizeFromPrisma(framework) {
  return FRAMEWORK_FROM_PRISMA[framework] || framework?.replace(/_/g, '-') || 'vite-react';
}

// Normalize project framework when returning to frontend
function normalizeProject(project) {
  if (!project) return project;
  return {
    ...project,
    framework: normalizeFromPrisma(project.framework),
  };
}

function normalizeProjects(projects) {
  return projects.map(normalizeProject);
}

const router = express.Router();

// ============================================
// MIDDLEWARE
// ============================================

// Input validation middleware
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

// Auth middleware imported from ../lib/auth-middleware.js

// ============================================
// PROJECT ROUTES
// ============================================

/**
 * GET /api/canvas-builder/projects
 * List all projects for the authenticated user
 */
router.get('/projects', requireAuth, async (req, res) => {
  try {
    const projects = await prisma.canvasProject.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        framework: true,
        source: true,
        status: true,
        subdomain: true,
        deploymentUrl: true,
        thumbnail: true,
        tags: true,
        isPublic: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    res.json({ success: true, projects: normalizeProjects(projects) });
  } catch (error) {
    console.error('[CanvasBuilder] List projects error:', error);
    res.status(500).json({ success: false, error: 'Failed to list projects' });
  }
});

/**
 * POST /api/canvas-builder/projects
 * Create a new project
 */
router.post('/projects', requireAuth, [
  body('name').isString().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('framework').optional().isString(),
], validateRequest, async (req, res) => {
  try {
    const { name, description, files = [], pages = [], languages = ['en'] } = req.body;
    const framework = normalizeToPrisma(req.body.framework || 'vite-react');
    
    const project = await prisma.canvasProject.create({
      data: {
        userId: req.userId,
        name,
        description,
        framework,
        files,
        pages,
        languages,
        defaultLanguage: languages[0] || 'en',
      },
    });
    
    res.json({ success: true, project: normalizeProject(project) });
  } catch (error) {
    console.error('[CanvasBuilder] Create project error:', error);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

/**
 * GET /api/canvas-builder/projects/:projectId
 * Get a specific project
 */
router.get('/projects/:projectId', optionalAuth, [
  param('projectId').isString(),
], validateRequest, async (req, res) => {
  try {
    const project = await prisma.canvasProject.findUnique({
      where: { id: req.params.projectId },
      include: {
        builds: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            version: true,
            status: true,
            duration: true,
            createdAt: true,
            completedAt: true,
          },
        },
        deployments: {
          where: { status: 'live' },
          take: 1,
        },
      },
    });
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // Check access
    if (project.userId !== req.userId && !project.isPublic) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Increment view count for public projects
    if (project.isPublic && project.userId !== req.userId) {
      await prisma.canvasProject.update({
        where: { id: project.id },
        data: { viewCount: { increment: 1 } },
      });
    }
    
    res.json({ success: true, project: normalizeProject(project) });
  } catch (error) {
    console.error('[CanvasBuilder] Get project error:', error);
    res.status(500).json({ success: false, error: 'Failed to get project' });
  }
});

/**
 * PUT /api/canvas-builder/projects/:projectId
 * Update a project
 */
router.put('/projects/:projectId', requireAuth, [
  param('projectId').isString(),
], validateRequest, async (req, res) => {
  try {
    // Verify ownership
    const existing = await prisma.canvasProject.findUnique({
      where: { id: req.params.projectId },
      select: { userId: true },
    });
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    if (existing.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const {
      name, description, framework, files, pages, routes, apiRoutes,
      languages, defaultLanguage, translations, hasBackend, database,
      subdomain, tags, isPublic,
    } = req.body;
    
    const project = await prisma.canvasProject.update({
      where: { id: req.params.projectId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(framework && { framework: normalizeToPrisma(framework) }),
        ...(files && { files }),
        ...(pages && { pages }),
        ...(routes && { routes }),
        ...(apiRoutes && { apiRoutes }),
        ...(languages && { languages }),
        ...(defaultLanguage && { defaultLanguage }),
        ...(translations && { translations }),
        ...(hasBackend !== undefined && { hasBackend }),
        ...(database !== undefined && { database }),
        ...(subdomain && { subdomain }),
        ...(tags && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });
    
    res.json({ success: true, project: normalizeProject(project) });
  } catch (error) {
    console.error('[CanvasBuilder] Update project error:', error);
    
    // Handle unique constraint on subdomain
    if (error.code === 'P2002' && error.meta?.target?.includes('subdomain')) {
      return res.status(400).json({ success: false, error: 'Subdomain already taken' });
    }
    
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

/**
 * DELETE /api/canvas-builder/projects/:projectId
 * Delete a project
 */
router.delete('/projects/:projectId', requireAuth, [
  param('projectId').isString(),
], validateRequest, async (req, res) => {
  try {
    // Verify ownership
    const project = await prisma.canvasProject.findUnique({
      where: { id: req.params.projectId },
      select: { userId: true },
    });
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    if (project.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    await prisma.canvasProject.delete({
      where: { id: req.params.projectId },
    });
    
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('[CanvasBuilder] Delete project error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

// ============================================
// SUBDOMAIN ROUTES
// ============================================

/**
 * GET /api/canvas-builder/subdomains/check
 * Check if a subdomain is available
 */
router.get('/subdomains/check', [
  query('subdomain').isString().isLength({ min: 3, max: 30 }).matches(/^[a-z0-9-]+$/),
], validateRequest, async (req, res) => {
  try {
    const { subdomain } = req.query;
    
    // Reserved subdomains
    const reserved = ['www', 'api', 'app', 'admin', 'mail', 'ftp', 'static', 'cdn', 'assets'];
    if (reserved.includes(subdomain.toLowerCase())) {
      return res.json({
        success: true,
        available: false,
        suggestion: `${subdomain}-app`,
      });
    }
    
    const existing = await prisma.canvasProject.findUnique({
      where: { subdomain },
      select: { id: true },
    });
    
    if (existing) {
      // Generate suggestion
      const suggestion = `${subdomain}-${Math.random().toString(36).slice(2, 6)}`;
      return res.json({
        success: true,
        available: false,
        suggestion,
      });
    }
    
    res.json({ success: true, available: true });
  } catch (error) {
    console.error('[CanvasBuilder] Check subdomain error:', error);
    res.status(500).json({ success: false, error: 'Failed to check subdomain' });
  }
});

// ============================================
// DEPLOY ROUTES
// ============================================

/**
 * POST /api/canvas-builder/deploy/:projectId
 * Deploy a project
 */
router.post('/deploy/:projectId', requireAuth, rateLimiters.agent, [
  param('projectId').isString(),
  body('subdomain').isString().isLength({ min: 3, max: 30 }).matches(/^[a-z0-9-]+$/),
], validateRequest, async (req, res) => {
  try {
    const { subdomain } = req.body;
    
    // Verify ownership
    const project = await prisma.canvasProject.findUnique({
      where: { id: req.params.projectId },
    });
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    if (project.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Check subdomain availability
    const existing = await prisma.canvasProject.findFirst({
      where: {
        subdomain,
        id: { not: project.id },
      },
    });
    
    if (existing) {
      return res.status(400).json({ success: false, error: 'Subdomain already taken' });
    }
    
    // Create deployment record
    const deployment = await prisma.canvasDeployment.create({
      data: {
        projectId: project.id,
        buildId: project.lastBuildId,
        subdomain,
        url: `https://${subdomain}.apps.mumtaz.ai`,
        status: 'deploying',
        type: project.hasBackend ? 'container' : 'static',
      },
    });
    
    // Update project
    await prisma.canvasProject.update({
      where: { id: project.id },
      data: {
        subdomain,
        deploymentUrl: deployment.url,
        status: 'building',
      },
    });
    
    // NOTE: Real deployment infrastructure (static file serving, container orchestration)
    // is not yet implemented. For now, mark deployment as live synchronously.
    // Future: integrate with canvas-deploy-routes.js providers (Vercel, Netlify, etc.)
    try {
      await prisma.canvasDeployment.update({
        where: { id: deployment.id },
        data: {
          status: 'live',
          deployedAt: new Date(),
        },
      });

      await prisma.canvasProject.update({
        where: { id: project.id },
        data: { status: 'deployed' },
      });
    } catch (err) {
      console.error('[CanvasBuilder] Deploy completion error:', err);
      await prisma.canvasDeployment.update({
        where: { id: deployment.id },
        data: { status: 'failed' },
      }).catch(() => {});
      await prisma.canvasProject.update({
        where: { id: project.id },
        data: { status: 'draft' },
      }).catch(() => {});
    }

    res.json({
      success: true,
      deployment: {
        id: deployment.id,
        url: deployment.url,
        status: deployment.status,
      },
    });
  } catch (error) {
    console.error('[CanvasBuilder] Deploy error:', error);
    res.status(500).json({ success: false, error: 'Failed to deploy project' });
  }
});

/**
 * GET /api/canvas-builder/deploy/:projectId/status
 * Get deployment status
 */
router.get('/deploy/:projectId/status', optionalAuth, [
  param('projectId').isString(),
], validateRequest, async (req, res) => {
  try {
    const deployment = await prisma.canvasDeployment.findFirst({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { userId: true, isPublic: true },
        },
      },
    });
    
    if (!deployment) {
      return res.json({ success: true, deployment: null });
    }
    
    // Check access
    if (deployment.project.userId !== req.userId && !deployment.project.isPublic) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    res.json({
      success: true,
      deployment: {
        id: deployment.id,
        subdomain: deployment.subdomain,
        url: deployment.url,
        status: deployment.status,
        type: deployment.type,
        deployedAt: deployment.deployedAt,
        requestCount: deployment.requestCount,
      },
    });
  } catch (error) {
    console.error('[CanvasBuilder] Get deployment status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get deployment status' });
  }
});

/**
 * DELETE /api/canvas-builder/deploy/:projectId
 * Undeploy a project
 */
router.delete('/deploy/:projectId', requireAuth, [
  param('projectId').isString(),
], validateRequest, async (req, res) => {
  try {
    const project = await prisma.canvasProject.findUnique({
      where: { id: req.params.projectId },
    });
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    if (project.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Update deployment status
    await prisma.canvasDeployment.updateMany({
      where: { projectId: project.id, status: 'live' },
      data: { status: 'stopped' },
    });
    
    // Update project
    await prisma.canvasProject.update({
      where: { id: project.id },
      data: {
        status: 'draft',
        subdomain: null,
        deploymentUrl: null,
      },
    });
    
    res.json({ success: true, message: 'Project undeployed' });
  } catch (error) {
    console.error('[CanvasBuilder] Undeploy error:', error);
    res.status(500).json({ success: false, error: 'Failed to undeploy project' });
  }
});

// ============================================
// TEMPLATE ROUTES
// ============================================

/**
 * GET /api/canvas-builder/templates
 * List available templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { category, framework } = req.query;
    
    const templates = await prisma.canvasTemplate.findMany({
      where: {
        ...(category && { category }),
        ...(framework && { framework }),
      },
      orderBy: { usageCount: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        framework: true,
        thumbnail: true,
        previewUrl: true,
        features: true,
        tags: true,
        isPremium: true,
        price: true,
        usageCount: true,
        rating: true,
      },
    });
    
    res.json({ success: true, templates });
  } catch (error) {
    console.error('[CanvasBuilder] List templates error:', error);
    res.status(500).json({ success: false, error: 'Failed to list templates' });
  }
});

/**
 * GET /api/canvas-builder/templates/:templateId
 * Get template details
 */
router.get('/templates/:templateId', [
  param('templateId').isString(),
], validateRequest, async (req, res) => {
  try {
    const template = await prisma.canvasTemplate.findUnique({
      where: { id: req.params.templateId },
    });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, template });
  } catch (error) {
    console.error('[CanvasBuilder] Get template error:', error);
    res.status(500).json({ success: false, error: 'Failed to get template' });
  }
});

/**
 * GET /api/canvas-builder/projects/:projectId/export
 * Export project files as JSON download
 */
router.get('/projects/:projectId/export', optionalAuth, [
  param('projectId').isString(),
], validateRequest, async (req, res) => {
  try {
    const project = await prisma.canvasProject.findUnique({
      where: { id: req.params.projectId },
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check access
    if (project.userId !== req.userId && !project.isPublic) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const format = req.query.format || 'json';

    if (format === 'json') {
      const exportData = {
        name: project.name,
        description: project.description,
        framework: project.framework,
        files: project.files || [],
        pages: project.pages || [],
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '-')}-export.json"`);
      return res.json(exportData);
    }

    // ZIP format — serialize files as a simple archive JSON
    const files = (project.files || []).map(f => ({
      path: f.path,
      content: f.content,
    }));

    const zipData = JSON.stringify({ files, name: project.name }, null, 2);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '-')}-export.zip"`);
    res.send(zipData);
  } catch (error) {
    console.error('[CanvasBuilder] Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export project' });
  }
});

/**
 * POST /api/canvas-builder/projects/from-template
 * Create project from template
 */
router.post('/projects/from-template', requireAuth, [
  body('templateId').isString(),
  body('name').isString().isLength({ min: 1, max: 200 }),
], validateRequest, async (req, res) => {
  try {
    const { templateId, name } = req.body;
    
    const template = await prisma.canvasTemplate.findUnique({
      where: { id: templateId },
    });
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    // Increment usage count
    await prisma.canvasTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });
    
    // Create project from template
    const project = await prisma.canvasProject.create({
      data: {
        userId: req.userId,
        name,
        description: template.description,
        framework: template.framework,
        files: template.files,
        pages: template.pages,
        tags: template.tags,
      },
    });
    
    res.json({ success: true, project });
  } catch (error) {
    console.error('[CanvasBuilder] Create from template error:', error);
    res.status(500).json({ success: false, error: 'Failed to create from template' });
  }
});

// ============================================
// PUBLIC GALLERY
// ============================================

/**
 * GET /api/canvas-builder/gallery
 * List public projects
 */
router.get('/gallery', async (req, res) => {
  try {
    const { limit = 20, offset = 0, sort = 'popular' } = req.query;
    
    const orderBy = sort === 'popular' 
      ? { viewCount: 'desc' }
      : sort === 'recent'
        ? { createdAt: 'desc' }
        : { viewCount: 'desc' };
    
    const projects = await prisma.canvasProject.findMany({
      where: { isPublic: true, status: 'deployed' },
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        description: true,
        framework: true,
        thumbnail: true,
        subdomain: true,
        deploymentUrl: true,
        tags: true,
        viewCount: true,
        forkCount: true,
        createdAt: true,
        user: {
          select: { name: true, avatar: true },
        },
      },
    });
    
    res.json({ success: true, projects });
  } catch (error) {
    console.error('[CanvasBuilder] Gallery error:', error);
    res.status(500).json({ success: false, error: 'Failed to load gallery' });
  }
});

/**
 * POST /api/canvas-builder/projects/:projectId/fork
 * Fork a public project
 */
router.post('/projects/:projectId/fork', requireAuth, [
  param('projectId').isString(),
], validateRequest, async (req, res) => {
  try {
    const original = await prisma.canvasProject.findUnique({
      where: { id: req.params.projectId },
    });
    
    if (!original) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    if (!original.isPublic && original.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Cannot fork private project' });
    }
    
    // Increment fork count
    await prisma.canvasProject.update({
      where: { id: original.id },
      data: { forkCount: { increment: 1 } },
    });
    
    // Create forked project
    const forked = await prisma.canvasProject.create({
      data: {
        userId: req.userId,
        name: `${original.name} (Fork)`,
        description: original.description,
        framework: original.framework,
        files: original.files,
        pages: original.pages,
        routes: original.routes,
        languages: original.languages,
        defaultLanguage: original.defaultLanguage,
        translations: original.translations,
        tags: original.tags,
        forkedFromId: original.id,
      },
    });
    
    res.json({ success: true, project: forked });
  } catch (error) {
    console.error('[CanvasBuilder] Fork error:', error);
    res.status(500).json({ success: false, error: 'Failed to fork project' });
  }
});
// ============================================
// AI GENERATION ROUTES
// ============================================

/**
 * POST /api/canvas-builder/generate
 * Generate multi-file project scaffold using AI
 * This is the CRITICAL endpoint that makes Builder Mode functional
 */
router.post('/generate', requireAuth, [
  body('prompt').isString().isLength({ min: 1, max: 10000 }).withMessage('Prompt required (max 10000 chars)'),
  body('mode').optional().isIn(['create', 'modify', 'add-page', 'add-feature', 'translate', 'add-api']),
  body('model').optional().isString(),
  body('projectId').optional().isString(),
], validateRequest, async (req, res) => {
  try {
    const { prompt, mode = 'create', model: requestedModel, projectId, context = {} } = req.body;
    
    // Load existing project if provided
    let existingProject = null;
    let existingFiles = [];
    let framework = normalizeToPrisma(context.framework || 'vite-react');
    
    if (projectId) {
      existingProject = await prisma.canvasProject.findUnique({
        where: { id: projectId },
      });
      
      if (existingProject) {
        if (existingProject.userId !== req.userId) {
          return res.status(403).json({ success: false, error: 'Access denied' });
        }
        existingFiles = existingProject.files || [];
        framework = existingProject.framework;
      }
    }
    
    // Determine AI provider + model
    let provider, modelId;
    if (requestedModel && requestedModel.includes('/')) {
      [provider, modelId] = requestedModel.split('/');
    } else {
      const defaults = getDefaultProvider();
      provider = defaults.provider;
      modelId = requestedModel || defaults.model;
    }
    
    console.log(`[CanvasBuilder] Generating with ${provider}/${modelId} | mode=${mode} | framework=${framework} | prompt="${prompt.substring(0, 80)}..."`);
    
    // Build system prompt
    const systemPrompt = getMultiFileSystemPrompt(framework, existingFiles, mode);
    
    // Call AI
    const rawResponse = await generateWithProvider(provider, modelId, prompt, systemPrompt);
    
    // Parse structured file actions from AI response
    const { actions, message } = parseFileActions(rawResponse);
    
    if (actions.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'AI did not return any file actions. Please try rephrasing your request.',
        rawResponse: rawResponse.substring(0, 500),
      });
    }
    
    // Convert actions to ProjectFile format
    const now = new Date().toISOString();
    const generatedFiles = [];
    const editedPaths = [];
    
    // Build a map of existing files by path for edits
    const existingFileMap = {};
    for (const f of existingFiles) {
      existingFileMap[f.path] = f;
    }
    
    for (const action of actions) {
      const { type, payload } = action;
      
      if (type === 'file.create') {
        const path = payload.path?.replace(/^\//, '') || 'untitled.txt'; // strip leading /
        const name = path.split('/').pop();
        const ext = name.split('.').pop()?.toLowerCase() || 'txt';
        const langMap = {
          ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
          css: 'css', html: 'html', json: 'json', py: 'python', md: 'markdown',
          prisma: 'prisma', sql: 'typescript', yaml: 'typescript', yml: 'typescript',
        };
        
        generatedFiles.push({
          id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          path,
          name,
          content: payload.content || '',
          language: payload.language || langMap[ext] || 'typescript',
          isGenerated: true,
          isModified: false,
          createdAt: now,
          updatedAt: now,
        });
      } else if (type === 'file.edit') {
        const path = payload.path?.replace(/^\//, '') || '';
        editedPaths.push(path);
        
        // Find the existing file and update it
        if (existingFileMap[path]) {
          generatedFiles.push({
            ...existingFileMap[path],
            content: payload.content || existingFileMap[path].content,
            isModified: true,
            updatedAt: now,
          });
        } else {
          // File doesn't exist yet, treat as create
          const name = path.split('/').pop();
          generatedFiles.push({
            id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            path,
            name,
            content: payload.content || '',
            language: payload.language || 'typescript',
            isGenerated: true,
            isModified: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      } else if (type === 'file.delete') {
        const path = payload.path?.replace(/^\//, '') || '';
        delete existingFileMap[path];
      }
    }
    
    // Merge: keep existing files that weren't edited or deleted, add new/edited files
    const mergedFiles = [
      ...existingFiles.filter(f => !editedPaths.includes(f.path) && existingFileMap[f.path]),
      ...generatedFiles,
    ];
    
    // Update project in database if we have a projectId
    if (projectId && existingProject) {
      await prisma.canvasProject.update({
        where: { id: projectId },
        data: {
          files: mergedFiles,
          updatedAt: new Date(),
        },
      });
    }
    
    console.log(`[CanvasBuilder] Generated ${generatedFiles.length} files, ${editedPaths.length} edits`);
    
    res.json({
      success: true,
      files: mergedFiles,
      generated: generatedFiles.length,
      edited: editedPaths.length,
      message: message || `Generated ${generatedFiles.length} file(s)`,
      provider,
      modelId,
    });
    
  } catch (error) {
    console.error('[CanvasBuilder] Generate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate project files',
    });
  }
});

// ============================================
// MY APPS — Simplified CRUD for canvasAppsService.ts
// (Canvas-app "My Apps" view — lightweight project management)
// ============================================

/**
 * Convert a CanvasProject row → simplified app shape
 * that canvasAppsService.ts / normalizeApp() expects.
 *
 * Field mapping:
 *   code        → files[0].content
 *   chatHistory → pages (JSON array)
 *   metadata    → translations (JSON object)
 */
function toSimpleApp(row) {
  const files = Array.isArray(row.files) ? row.files : [];
  const mainFile = files.find(f => f.path === '/index.html') || files[0];
  const meta = row.translations && typeof row.translations === 'object' && !Array.isArray(row.translations) ? row.translations : {};

  return {
    id: row.id,
    projectId: row.id,
    name: row.name,
    description: row.description || '',
    code: mainFile?.content || '',
    chatHistory: Array.isArray(row.pages) ? row.pages : [],
    metadata: meta,
    thumbnail: row.thumbnail || null,
    tags: row.tags || [],
    files,
    language: meta.language || 'html',
    provider: meta.provider,
    modelId: meta.modelId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * GET /api/canvas-builder/my-apps
 * List user's canvas-app projects in simplified format
 */
router.get('/my-apps', requireAuth, async (req, res) => {
  try {
    const projects = await prisma.canvasProject.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, projects: projects.map(toSimpleApp) });
  } catch (error) {
    console.error('[CanvasBuilder] List my-apps error:', error);
    res.status(500).json({ success: false, error: 'Failed to list apps' });
  }
});

/**
 * POST /api/canvas-builder/my-apps
 * Save a new app
 */
router.post('/my-apps', requireAuth, [
  body('name').optional().isString().isLength({ max: 200 }),
], validateRequest, async (req, res) => {
  try {
    const { name, code, prompt, language, provider, modelId, files, history } = req.body;

    const project = await prisma.canvasProject.create({
      data: {
        userId: req.userId,
        name: name || 'Untitled',
        description: prompt || '',
        files: files || (code ? [{ path: '/index.html', name: 'index.html', content: code }] : []),
        pages: Array.isArray(history) ? history : [],
        translations: { language: language || 'html', provider, modelId },
      },
    });

    res.json({ success: true, project: toSimpleApp(project) });
  } catch (error) {
    console.error('[CanvasBuilder] Save my-app error:', error);
    res.status(500).json({ success: false, error: 'Failed to save app' });
  }
});

/**
 * PUT /api/canvas-builder/my-apps/:id
 * Update an existing app. If the ID is not found (e.g. stale timestamp ID),
 * creates a new record instead and returns the new server-assigned ID.
 */
router.put('/my-apps/:id', requireAuth, [
  param('id').isString(),
], validateRequest, async (req, res) => {
  try {
    const existing = await prisma.canvasProject.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });

    const { name, code, prompt, language, provider, modelId, files, history } = req.body;

    // If app not found, create a new one (handles stale/timestamp IDs)
    if (!existing) {
      console.warn(`[CanvasBuilder] PUT /my-apps/${req.params.id} not found — creating new app`);
      const project = await prisma.canvasProject.create({
        data: {
          userId: req.userId,
          name: name || 'Untitled',
          description: prompt || '',
          files: files || (code ? [{ path: '/index.html', name: 'index.html', content: code }] : []),
          pages: Array.isArray(history) ? history : [],
          translations: { language: language || 'html', provider, modelId },
        },
      });
      return res.json({ success: true, project: toSimpleApp(project), created: true });
    }

    if (existing.userId !== req.userId) {
      return res.status(404).json({ success: false, error: 'App not found' });
    }

    const data = {};

    if (name !== undefined) data.name = name;
    if (prompt !== undefined) data.description = prompt;
    if (files !== undefined) {
      data.files = files;
    } else if (code !== undefined) {
      data.files = [{ path: '/index.html', name: 'index.html', content: code }];
    }
    if (history !== undefined) data.pages = Array.isArray(history) ? history : [];
    if (language !== undefined || provider !== undefined || modelId !== undefined) {
      data.translations = { language, provider, modelId };
    }

    const project = await prisma.canvasProject.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, project: toSimpleApp(project) });
  } catch (error) {
    console.error('[CanvasBuilder] Update my-app error:', error);
    res.status(500).json({ success: false, error: 'Failed to update app' });
  }
});

/**
 * DELETE /api/canvas-builder/my-apps/:id
 * Delete an app
 */
router.delete('/my-apps/:id', requireAuth, [
  param('id').isString(),
], validateRequest, async (req, res) => {
  try {
    const existing = await prisma.canvasProject.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ success: false, error: 'App not found' });
    }

    await prisma.canvasProject.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'App deleted' });
  } catch (error) {
    console.error('[CanvasBuilder] Delete my-app error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete app' });
  }
});

export default router;
