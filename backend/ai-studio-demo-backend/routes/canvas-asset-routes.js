/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CANVAS ASSET ROUTES
 * Upload, list, and delete project assets (images, fonts, documents, videos).
 *
 * Uses CanvasAsset Prisma model for metadata persistence and stores files
 * locally in /uploads/assets/ (or S3 in production via env config).
 *
 * Endpoints:
 *   GET    /:projectId       — List project assets
 *   POST   /upload           — Upload a file (multipart/form-data)
 *   DELETE /:id              — Delete an asset
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const router = express.Router();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'assets');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Max upload size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIMES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
  // Videos
  'video/mp4', 'video/webm', 'video/ogg',
  // Fonts
  'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
  'application/font-woff', 'application/font-woff2',
  // Documents
  'application/pdf', 'application/json', 'text/plain', 'text/css', 'text/javascript',
  'text/csv', 'application/xml',
]);

/**
 * Classify file type from MIME string
 */
function classifyMime(mime) {
  if (!mime) return 'other';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('font/') || mime.includes('font-woff')) return 'font';
  if (
    mime === 'application/pdf' ||
    mime === 'application/json' ||
    mime.startsWith('text/')
  ) return 'document';
  return 'other';
}

// ============================================
// GET /:projectId
// List all assets belonging to a project
// ============================================
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project ownership
    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        OR: [{ userId: req.userId }, { isPublic: true }],
      },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    const assets = await prisma.canvasAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        originalName: true,
        originalSize: true,
        optimizedSize: true,
        cdnUrl: true,
        thumbnailUrl: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      assets,
    });
  } catch (error) {
    console.error('[Canvas Assets] List error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to list assets',
    });
  }
});

// ============================================
// POST /upload
// Upload a single file via multipart/form-data
// Expects: file (blob), projectId (string)
// ============================================
router.post('/upload', requireAuth, async (req, res) => {
  try {
    // Collect raw body as multipart — we use a lightweight manual parser
    // since multer may not be installed. If multer is available, swap this.
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be multipart/form-data',
      });
    }

    // Parse multipart using built-in or busboy if available
    const chunks = [];
    let totalSize = 0;

    await new Promise((resolve, reject) => {
      req.on('data', (chunk) => {
        totalSize += chunk.length;
        if (totalSize > MAX_FILE_SIZE) {
          reject(new Error('File exceeds maximum size of 10MB'));
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', resolve);
      req.on('error', reject);
    });

    const body = Buffer.concat(chunks);

    // Extract boundary from content type
    const boundaryMatch = contentType.match(/boundary=(.+?)(?:;|$)/);
    if (!boundaryMatch) {
      return res.status(400).json({
        success: false,
        message: 'Missing multipart boundary',
      });
    }

    const boundary = boundaryMatch[1].trim();
    const parts = parseMultipart(body, boundary);

    const projectId = parts.fields?.projectId;
    const filePart = parts.files?.[0];

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required',
      });
    }

    if (!filePart) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    // Verify project ownership
    const project = await prisma.canvasProject.findFirst({
      where: { id: projectId, userId: req.userId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Validate MIME type
    const mime = filePart.contentType || 'application/octet-stream';
    if (!ALLOWED_MIMES.has(mime)) {
      return res.status(400).json({
        success: false,
        message: `File type '${mime}' is not allowed`,
      });
    }

    // Generate unique filename
    const ext = path.extname(filePart.filename) || '';
    const hash = crypto.randomBytes(16).toString('hex');
    const storedName = `${projectId}_${hash}${ext}`;
    const storagePath = path.join(UPLOAD_DIR, storedName);

    // Write file to disk
    fs.writeFileSync(storagePath, filePart.data);

    // Build CDN URL (local dev: relative path; production: S3/CDN)
    const cdnUrl = `/api/assets/file/${storedName}`;

    // Create DB record
    const asset = await prisma.canvasAsset.create({
      data: {
        projectId,
        userId: req.userId,
        type: classifyMime(mime),
        originalName: filePart.filename || 'untitled',
        originalSize: filePart.data.length,
        mimeType: mime,
        storagePath,
        cdnUrl,
        thumbnailUrl: classifyMime(mime) === 'image' ? cdnUrl : null,
      },
      select: {
        id: true,
        type: true,
        originalName: true,
        originalSize: true,
        cdnUrl: true,
        thumbnailUrl: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      asset,
    });
  } catch (error) {
    if (error.message?.includes('maximum size')) {
      return res.status(413).json({
        success: false,
        message: error.message,
      });
    }
    console.error('[Canvas Assets] Upload error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload asset',
    });
  }
});

// ============================================
// GET /file/:filename
// Serve uploaded asset files (local dev CDN)
// ============================================
router.get('/file/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    // Sanitize path to prevent directory traversal
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Set cache headers for asset serving
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  } catch (error) {
    console.error('[Canvas Assets] Serve error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to serve file' });
  }
});

// ============================================
// DELETE /:id
// Delete an asset by ID
// ============================================
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find asset and verify ownership
    const asset = await prisma.canvasAsset.findFirst({
      where: { id },
      select: {
        id: true,
        storagePath: true,
        project: { select: { userId: true } },
      },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    if (asset.project.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Delete file from disk
    try {
      if (asset.storagePath && fs.existsSync(asset.storagePath)) {
        fs.unlinkSync(asset.storagePath);
      }
    } catch (err) {
      console.error('[Canvas Assets] File delete error:', err.message);
      // Continue to delete DB record even if file removal fails
    }

    // Delete DB record
    await prisma.canvasAsset.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Asset deleted',
    });
  } catch (error) {
    console.error('[Canvas Assets] Delete error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete asset',
    });
  }
});

// ============================================
// Lightweight multipart/form-data parser
// ============================================
function parseMultipart(body, boundary) {
  const result = { fields: {}, files: [] };
  const sep = Buffer.from(`--${boundary}`);
  const end = Buffer.from(`--${boundary}--`);

  let start = 0;
  let idx = body.indexOf(sep, start);

  while (idx !== -1) {
    const partStart = idx + sep.length + 2; // skip \r\n after boundary
    const nextIdx = body.indexOf(sep, partStart);
    if (nextIdx === -1) break;

    const partEnd = nextIdx - 2; // remove trailing \r\n
    const part = body.slice(partStart, partEnd);

    // Split headers from body
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) { idx = nextIdx; continue; }

    const headerBlock = part.slice(0, headerEnd).toString('utf-8');
    const partBody = part.slice(headerEnd + 4);

    // Parse Content-Disposition
    const dispMatch = headerBlock.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i);
    if (!dispMatch) { idx = nextIdx; continue; }

    const fieldName = dispMatch[1];
    const filename = dispMatch[2];

    if (filename !== undefined) {
      // File part
      const ctMatch = headerBlock.match(/Content-Type:\s*(.+)/i);
      result.files.push({
        fieldName,
        filename: filename || 'untitled',
        contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
        data: partBody,
      });
    } else {
      // Text field
      result.fields[fieldName] = partBody.toString('utf-8');
    }

    idx = nextIdx;
  }

  return result;
}

export default router;
