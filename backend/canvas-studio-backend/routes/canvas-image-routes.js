/**
 * CANVAS IMAGE ROUTES — /api/canvas-images
 *
 * Exposes the image-processing-service to the canvas-studio UI.
 * Works with CanvasAsset URLs (S3) or base64 data URIs.
 *
 *   POST /:projectId/analyze    — metadata, dominant colors, stats, EXIF
 *   POST /:projectId/transform  — resize, crop, rotate, flip, extend
 *   POST /:projectId/filter     — blur, sharpen, grayscale, sepia, vintage, etc.
 *   POST /:projectId/background — remove or blur background
 *   POST /:projectId/compose    — text overlay, watermark, merge images
 *   POST /:projectId/ai         — AI describe, OCR, classify, Q&A
 *   GET  /:projectId/assets     — list image assets for this project (convenience)
 */

import express from 'express';
import { requireAuth, optionalAuth } from '../lib/auth-middleware.js';
import { prisma } from '../lib/prisma.js';
import {
  imageAnalyze,
  imageTransform,
  imageFilter,
  imageBackground,
  imageCompose,
  imageAI,
  imageConvert,
} from '../lib/image-processing-service.js';

const router = express.Router();

/** Verify caller owns the project */
async function ownedProject(projectId, userId) {
  return prisma.canvasProject.findFirst({ where: { id: projectId, userId }, select: { id: true } });
}

const TOOL_MAP = {
  image_analyze: imageAnalyze,
  image_transform: imageTransform,
  image_filter: imageFilter,
  image_background: imageBackground,
  image_compose: imageCompose,
  image_ai: imageAI,
  image_convert: imageConvert,
};

/** Wrap image-processing-service calls with standardised error handling */
async function runTool(toolName, params, res, userId = 'default') {
  try {
    const fn = TOOL_MAP[toolName];
    if (!fn) return res.status(400).json({ success: false, error: `Unknown tool: ${toolName}` });
    const result = await fn(params, userId);
    if (result?.success === false) {
      return res.status(400).json({ success: false, error: result.error || 'Image processing failed' });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(`[ImageRoutes] ${toolName} error:`, err.message);
    res.status(500).json({ success: false, error: err.message || 'Image processing error' });
  }
}

// ── GET /:projectId/assets ───────────────────────────────────────
// List all image assets for this project
router.get('/:projectId/assets', requireAuth, async (req, res) => {
  try {
    const project = await ownedProject(req.params.projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const assets = await prisma.canvasAsset.findMany({
      where: {
        projectId: req.params.projectId,
        mimeType: { startsWith: 'image/' },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, url: true, mimeType: true, size: true, width: true, height: true, createdAt: true },
    });

    res.json({ success: true, assets });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list assets' });
  }
});

// ── POST /:projectId/analyze ─────────────────────────────────────
// Body: { url: string }  — S3 URL or data URI
router.post('/:projectId/analyze', requireAuth, async (req, res) => {
  const project = await ownedProject(req.params.projectId, req.userId);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const { url, operation = 'metadata' } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'url is required' });

  await runTool('image_analyze', { operation, input: { url } }, res);
});

// ── POST /:projectId/transform ───────────────────────────────────
// Body: { url, operation: 'resize'|'crop'|'rotate'|'flip'|'extend'|'trim', ...params }
router.post('/:projectId/transform', requireAuth, async (req, res) => {
  const project = await ownedProject(req.params.projectId, req.userId);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const { url, operation = 'resize', width, height, angle, direction, top, left, bottom, right, fit, background } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'url is required' });

  await runTool('image_transform', {
    operation,
    input: { url },
    params: { width, height, angle, direction, top, left, bottom, right, fit, background },
  }, res);
});

// ── POST /:projectId/filter ──────────────────────────────────────
// Body: { url, filter: 'blur'|'sharpen'|'grayscale'|'sepia'|'vintage'|... , intensity? }
router.post('/:projectId/filter', requireAuth, async (req, res) => {
  const project = await ownedProject(req.params.projectId, req.userId);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const { url, filter, intensity, sigma, amount, threshold, mid, ...rest } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'url is required' });
  if (!filter) return res.status(400).json({ success: false, error: 'filter is required' });

  await runTool('image_filter', {
    operation: filter,
    input: { url },
    params: { intensity, sigma, amount, threshold, mid, ...rest },
  }, res);
});

// ── POST /:projectId/background ──────────────────────────────────
// Body: { url, operation: 'remove'|'blur'|'replace', replacement?: string }
router.post('/:projectId/background', requireAuth, async (req, res) => {
  const project = await ownedProject(req.params.projectId, req.userId);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const { url, operation = 'blur', replacement, sigma } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'url is required' });

  await runTool('image_background', {
    operation,
    input: { url },
    params: { replacement, sigma },
  }, res);
});

// ── POST /:projectId/compose ─────────────────────────────────────
// Body: { url, operation: 'text_overlay'|'watermark'|'composite'|'merge', ...layerParams }
router.post('/:projectId/compose', requireAuth, async (req, res) => {
  const project = await ownedProject(req.params.projectId, req.userId);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const { url, operation = 'text_overlay', text, overlayUrl, gravity, opacity, offsetX, offsetY, font, fontSize, color } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'url is required' });

  await runTool('image_compose', {
    operation,
    input: { url },
    params: { text, overlayUrl, gravity, opacity, offsetX, offsetY, font, fontSize, color },
  }, res);
});

// ── POST /:projectId/ai ──────────────────────────────────────────
// Body: { url, operation: 'describe'|'ocr'|'classify'|'qa'|'compare', question? }
router.post('/:projectId/ai', requireAuth, async (req, res) => {
  const project = await ownedProject(req.params.projectId, req.userId);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const { url, operation = 'describe', question, compareUrl } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'url is required' });

  await runTool('image_ai', {
    operation,
    input: { url },
    params: { question, compareUrl },
  }, res);
});

// ── POST /:projectId/convert ─────────────────────────────────────
// Body: { url, format: 'webp'|'png'|'jpeg'|'avif', quality? }
router.post('/:projectId/convert', requireAuth, async (req, res) => {
  const project = await ownedProject(req.params.projectId, req.userId);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const { url, format = 'webp', quality } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'url is required' });

  await runTool('image_convert', {
    operation: 'format',
    input: { url },
    params: { format, quality },
  }, res);
});

export default router;
