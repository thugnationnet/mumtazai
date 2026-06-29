/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CANVAS ASSET ROUTES
 * Upload, list, serve, and delete project assets (images, fonts, documents, videos).
 *
 * Storage: AWS S3 (amzn-us-east-1-bucket) via lib/cloud-storage.js
 *   - Files go directly to S3 (multer memory storage — never touch disk)
 *   - cdnUrl stored in DB is a presigned URL (1-hour TTL)
 *   - GET list re-signs storagePath on every request so URLs are always fresh
 *   - GET /file/:filename redirects to a fresh presigned URL
 *   - DELETE removes the S3 object before the DB record
 *
 * Endpoints:
 *   GET    /:projectId         — List project assets (with fresh signed URLs)
 *   POST   /upload             — Upload file → S3 → DB record
 *   GET    /file/:s3key        — Redirect to fresh presigned S3 URL
 *   DELETE /:id                — Delete from S3 + DB
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';
import {
  uploadToCloud,
  deleteFromCloud,
  resignCloudUrl,
  cloudPrefix,
  isCloudConfigured,
} from '../lib/cloud-storage.js';

const router = express.Router();

// Max upload size: 50 MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIMES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
  'image/bmp', 'image/tiff',
  // Videos
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
  // Fonts
  'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
  'application/font-woff', 'application/font-woff2',
  // Documents / data
  'application/pdf', 'application/json', 'text/plain', 'text/css',
  'text/javascript', 'text/csv', 'application/xml',
  // Archives
  'application/zip', 'application/x-zip-compressed',
]);

// Multer: memory storage — buffer goes straight to S3, never touches disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    cb(null, ALLOWED_MIMES.has(file.mimetype));
  },
});

function classifyMime(mime = '') {
  if (mime.startsWith('image/'))  return 'image';
  if (mime.startsWith('video/'))  return 'video';
  if (mime.startsWith('audio/'))  return 'audio';
  if (mime.startsWith('font/') || mime.includes('font-woff')) return 'font';
  if (['application/pdf','application/json','text/plain','text/css','text/csv','application/xml'].includes(mime)) return 'document';
  if (mime.includes('zip')) return 'archive';
  return 'other';
}

// ════════════════════════════════════════════════
// GET /:projectId — list with fresh signed URLs
// ════════════════════════════════════════════════
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        OR: [{ userId: req.userId }, { isPublic: true }],
      },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }

    const assets = await prisma.canvasAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, originalName: true,
        originalSize: true, optimizedSize: true,
        storagePath: true, cdnUrl: true, thumbnailUrl: true,
        mimeType: true, createdAt: true,
      },
    });

    // Re-sign every S3 key so the caller always gets a valid URL
    const refreshed = await Promise.all(assets.map(async (a) => {
      if (a.storagePath && !a.storagePath.startsWith('/')) {
        try {
          const { url } = await resignCloudUrl(a.storagePath);
          return { ...a, cdnUrl: url };
        } catch { /* return as-is if key missing */ }
      }
      return a;
    }));

    return res.json({ success: true, assets: refreshed });
  } catch (error) {
    console.error('[Canvas Assets] List error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to list assets' });
  }
});

// ════════════════════════════════════════════════
// POST /upload — multipart → S3 → DB record
// ════════════════════════════════════════════════
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided or file type not allowed.' });
    }

    if (!isCloudConfigured()) {
      return res.status(503).json({ success: false, message: 'Cloud storage not configured on this server.' });
    }

    const { originalname, mimetype, buffer, size } = req.file;
    const projectId = req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }

    // Verify project ownership
    const project = await prisma.canvasProject.findFirst({
      where: { id: projectId, userId: req.userId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }

    const type = classifyMime(mimetype);
    const prefix = cloudPrefix(req.userId, `${type}s`);

    // Upload to S3 — returns a 1-hour presigned URL
    const { url, key } = await uploadToCloud(buffer, {
      prefix,
      mimeType: mimetype,
      metadata: { originalName: originalname, userId: req.userId, projectId },
    });

    const asset = await prisma.canvasAsset.create({
      data: {
        projectId,
        userId:       req.userId,
        type,
        originalName: originalname,
        originalSize: size,
        mimeType:     mimetype,
        storagePath:  key,   // S3 key stored here for re-signing later
        cdnUrl:       url,   // presigned URL (1-hour TTL)
        thumbnailUrl: type === 'image' ? url : null,
      },
      select: {
        id: true, type: true, originalName: true,
        originalSize: true, cdnUrl: true, thumbnailUrl: true,
        createdAt: true,
      },
    });

    return res.json({ success: true, asset });
  } catch (error) {
    console.error('[Canvas Assets] Upload error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to upload asset', detail: error.message });
  }
});

// ════════════════════════════════════════════════
// GET /file/:s3key — redirect to fresh presigned URL
// Accepts the S3 key (base64url-encoded to be URL-safe)
// ════════════════════════════════════════════════
router.get('/file/:encodedKey', async (req, res) => {
  try {
    // Key is passed as base64url to avoid path separator issues
    const key = Buffer.from(req.params.encodedKey, 'base64url').toString('utf-8');

    // Sanitize: must not contain .. traversal
    if (key.includes('..') || key.startsWith('/')) {
      return res.status(400).json({ success: false, message: 'Invalid key' });
    }

    const { url } = await resignCloudUrl(key, 300); // 5-min URL for direct browser use
    return res.redirect(302, url);
  } catch (error) {
    console.error('[Canvas Assets] File serve error:', error.message);
    return res.status(404).json({ success: false, message: 'Asset not found' });
  }
});

// ════════════════════════════════════════════════
// DELETE /:id — remove from S3 + DB
// ════════════════════════════════════════════════
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await prisma.canvasAsset.findFirst({
      where: { id },
      select: {
        id: true,
        storagePath: true,
        project: { select: { userId: true } },
      },
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    if (asset.project.userId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete from S3 first (best-effort — won't block DB delete)
    if (asset.storagePath && !asset.storagePath.startsWith('/')) {
      await deleteFromCloud(asset.storagePath);
    }

    await prisma.canvasAsset.delete({ where: { id } });

    return res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    console.error('[Canvas Assets] Delete error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to delete asset' });
  }
});

export default router;

