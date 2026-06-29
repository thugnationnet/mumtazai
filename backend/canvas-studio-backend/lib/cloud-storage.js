/**
 * CLOUD STORAGE — Shared S3 utility for canvas-studio-backend
 *
 * Single source of truth for all S3 operations:
 *   - uploadToCloud()   — buffer → S3 key → presigned download URL
 *   - downloadFromCloud() — S3 key → Buffer
 *   - deleteFromCloud()   — S3 key → void
 *   - resignCloudUrl()    — S3 key → fresh presigned URL (use to refresh expired URLs)
 *   - isCloudConfigured() — boolean guard before any S3 call
 *
 * Config (all from .env):
 *   AWS_ACCESS_KEY_ID     required
 *   AWS_SECRET_ACCESS_KEY required
 *   AWS_S3_BUCKET         required  (amzn-us-east-1-bucket)
 *   AWS_REGION            optional  (default: us-east-1)
 *   CLOUD_URL_TTL         optional  signed URL TTL in seconds (default: 3600 = 1 hour)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// ─── Config ────────────────────────────────────────────────────────────────

export const S3_BUCKET  = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || 'amzn-us-east-1-bucket';
export const S3_REGION  = process.env.AWS_REGION    || 'us-east-1';
export const URL_TTL    = parseInt(process.env.CLOUD_URL_TTL || '3600', 10); // 1 hour

// ─── S3 Client (lazy singleton) ─────────────────────────────────────────────

let _s3 = null;
function getS3() {
  if (!_s3) {
    _s3 = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return _s3;
}

// ─── MIME → extension ────────────────────────────────────────────────────────

const MIME_EXT = {
  'image/jpeg':       'jpg',
  'image/jpg':        'jpg',
  'image/png':        'png',
  'image/gif':        'gif',
  'image/webp':       'webp',
  'image/avif':       'avif',
  'image/svg+xml':    'svg',
  'image/tiff':       'tif',
  'image/bmp':        'bmp',
  'image/ico':        'ico',
  'video/mp4':        'mp4',
  'video/webm':       'webm',
  'video/ogg':        'ogv',
  'video/quicktime':  'mov',
  'audio/mpeg':       'm4a',
  'audio/wav':        'wav',
  'application/pdf':  'pdf',
  'application/zip':  'zip',
  'application/json': 'json',
  'text/plain':       'txt',
  'text/css':         'css',
  'font/woff':        'woff',
  'font/woff2':       'woff2',
  'font/ttf':         'ttf',
  'font/otf':         'otf',
};

function extFromMime(mime = '') {
  return MIME_EXT[mime.toLowerCase()] || 'bin';
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Check whether AWS credentials + bucket env vars are present.
 * Call this before any S3 operation to give a clear error early.
 */
export function isCloudConfigured() {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    S3_BUCKET
  );
}

/**
 * Upload a Buffer to S3 and return a presigned download URL.
 *
 * @param {Buffer}  buffer
 * @param {object}  opts
 * @param {string}  opts.prefix    - S3 key prefix  e.g. 'assets/userId123'
 * @param {string}  opts.mimeType  - MIME type       e.g. 'image/png'
 * @param {string}  [opts.filename]- Optional custom filename (without prefix)
 * @param {number}  [opts.ttl]     - Signed URL TTL in seconds (default: URL_TTL)
 * @param {object}  [opts.metadata]- Extra S3 metadata tags
 * @returns {Promise<{ url: string, key: string, bucket: string, expiresAt: string }>}
 */
export async function uploadToCloud(buffer, opts = {}) {
  const {
    prefix    = 'uploads',
    mimeType  = 'application/octet-stream',
    filename  = null,
    ttl       = URL_TTL,
    metadata  = {},
  } = opts;

  const ext = extFromMime(mimeType);
  const id  = crypto.randomBytes(12).toString('hex');
  const key = filename
    ? `${prefix}/${filename}`
    : `${prefix}/${Date.now()}-${id}.${ext}`;

  await getS3().send(new PutObjectCommand({
    Bucket:       S3_BUCKET,
    Key:          key,
    Body:         buffer,
    ContentType:  mimeType,
    CacheControl: 'public, max-age=86400',
    Metadata: {
      ...metadata,
      uploadedAt: new Date().toISOString(),
    },
  }));

  const url = await getSignedUrl(
    getS3(),
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    { expiresIn: ttl }
  );

  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  console.log(`[CloudStorage] Uploaded ${key} (${(buffer.length / 1024).toFixed(1)} KB) TTL=${ttl}s`);

  return { url, key, bucket: S3_BUCKET, expiresAt };
}

/**
 * Download a file buffer from S3.
 *
 * @param {string} key - S3 object key
 * @returns {Promise<Buffer>}
 */
export async function downloadFromCloud(key) {
  const response = await getS3().send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
  );
  const chunks = [];
  for await (const chunk of response.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/**
 * Delete a file from S3 (best-effort — never throws).
 *
 * @param {string} key - S3 object key
 */
export async function deleteFromCloud(key) {
  try {
    await getS3().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    console.log(`[CloudStorage] Deleted ${key}`);
  } catch (err) {
    console.warn(`[CloudStorage] Delete warning for ${key}:`, err.message);
  }
}

/**
 * Generate a fresh presigned URL for an existing S3 key.
 * Use this to refresh an expired URL stored in the database.
 *
 * @param {string} key  - S3 object key
 * @param {number} [ttl] - TTL in seconds (default: URL_TTL)
 * @returns {Promise<{ url: string, expiresAt: string }>}
 */
export async function resignCloudUrl(key, ttl = URL_TTL) {
  const url = await getSignedUrl(
    getS3(),
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    { expiresIn: ttl }
  );
  return { url, expiresAt: new Date(Date.now() + ttl * 1000).toISOString() };
}

/**
 * Check whether an S3 key exists (HEAD request).
 *
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export async function existsInCloud(key) {
  try {
    await getS3().send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Build the canonical S3 prefix for a user + resource type.
 * e.g. cloudPrefix('abc123', 'images') → 'assets/abc123/images'
 */
export function cloudPrefix(userId, type = 'files') {
  return `assets/${userId}/${type}`;
}
