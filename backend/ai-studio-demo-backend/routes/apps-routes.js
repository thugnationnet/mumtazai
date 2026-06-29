/**
 * Apps Routes - Handles app deployment and hosting functionality
 *
 * POST /api/apps/deploy - Deploy a new app (uploads to S3 for subdomain hosting)
 * POST /api/apps/unpublish - Take down a deployed app
 * GET /api/apps/deployments - Get list of user's deployed apps
 * GET /api/apps/:subdomain - Get specific deployment info
 * GET /api/apps/check/:subdomain - Check subdomain availability
 * GET /api/apps/serve/:subdomain - Serve hosted app (fallback if NGINX not configured)
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { requireAuth, optionalAuth } from '../lib/auth-middleware.js';
import { getSource } from '../lib/source-utils.js';

const router = express.Router();
const prisma = new PrismaClient();

// ─── S3 Config for App Hosting ────────────────────────────────
const HOSTING_BUCKET =
  process.env.APP_HOSTING_S3_BUCKET ||
  process.env.AWS_S3_BUCKET ||
  'mumtaz-ai-bucket';
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-1';
const APP_DOMAIN = process.env.APP_DOMAIN || 'mumtaz.ai';

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// S3 key prefix for hosted apps
const S3_APPS_PREFIX = 'hosted-apps';

/**
 * Upload app files to S3 — source-namespaced
 * Structure: hosted-apps/{source}/{subdomain}/index.html
 *            hosted-apps/{source}/{subdomain}/metadata.json
 */
async function uploadAppToS3(subdomain, htmlContent, metadata, source) {
  const sourcePrefix = source || 'shared';
  const uploads = [];

  // Upload index.html
  uploads.push(
    s3.send(
      new PutObjectCommand({
        Bucket: HOSTING_BUCKET,
        Key: `${S3_APPS_PREFIX}/${sourcePrefix}/${subdomain}/index.html`,
        Body: Buffer.from(htmlContent, 'utf-8'),
        ContentType: 'text/html; charset=utf-8',
        CacheControl: 'public, max-age=300', // 5 min cache
      })
    )
  );

  // Upload metadata
  uploads.push(
    s3.send(
      new PutObjectCommand({
        Bucket: HOSTING_BUCKET,
        Key: `${S3_APPS_PREFIX}/${sourcePrefix}/${subdomain}/metadata.json`,
        Body: Buffer.from(JSON.stringify(metadata, null, 2), 'utf-8'),
        ContentType: 'application/json',
      })
    )
  );

  await Promise.all(uploads);
  console.log(
    `[Apps][S3] Uploaded ${subdomain} to s3://${HOSTING_BUCKET}/${S3_APPS_PREFIX}/${sourcePrefix}/${subdomain}/`
  );
}

/**
 * Delete app files from S3 — source-namespaced
 */
async function deleteAppFromS3(subdomain, source) {
  const sourcePrefix = source || 'shared';
  // List all objects under this subdomain prefix
  const listResult = await s3.send(
    new ListObjectsV2Command({
      Bucket: HOSTING_BUCKET,
      Prefix: `${S3_APPS_PREFIX}/${sourcePrefix}/${subdomain}/`,
    })
  );

  if (!listResult.Contents || listResult.Contents.length === 0) {
    // Fallback: try legacy path (no source prefix) for backward compat
    const legacyResult = await s3.send(
      new ListObjectsV2Command({
        Bucket: HOSTING_BUCKET,
        Prefix: `${S3_APPS_PREFIX}/${subdomain}/`,
      })
    );
    if (!legacyResult.Contents || legacyResult.Contents.length === 0) return;
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: HOSTING_BUCKET,
        Delete: {
          Objects: legacyResult.Contents.map((obj) => ({ Key: obj.Key })),
        },
      })
    );
    console.log(`[Apps][S3] Deleted ${subdomain} (legacy path, ${legacyResult.Contents.length} files)`);
    return;
  }

  await s3.send(
    new DeleteObjectsCommand({
      Bucket: HOSTING_BUCKET,
      Delete: {
        Objects: listResult.Contents.map((obj) => ({ Key: obj.Key })),
      },
    })
  );
  console.log(
    `[Apps][S3] Deleted ${sourcePrefix}/${subdomain} (${listResult.Contents.length} files)`
  );
}

/**
 * Get app metadata from S3 — tries source-namespaced path first, falls back to legacy
 */
async function getAppMetadata(subdomain, source) {
  const sourcePrefix = source || null;
  // Try source-namespaced path first
  if (sourcePrefix) {
    try {
      const result = await s3.send(
        new GetObjectCommand({
          Bucket: HOSTING_BUCKET,
          Key: `${S3_APPS_PREFIX}/${sourcePrefix}/${subdomain}/metadata.json`,
        })
      );
      const body = await result.Body.transformToString();
      return JSON.parse(body);
    } catch (err) {
      if (err.name !== 'NoSuchKey' && err.$metadata?.httpStatusCode !== 404) throw err;
      // Fall through to legacy path
    }
  }
  // Legacy path (no source prefix)
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: HOSTING_BUCKET,
        Key: `${S3_APPS_PREFIX}/${subdomain}/metadata.json`,
      })
    );
    const body = await result.Body.transformToString();
    return JSON.parse(body);
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404)
      return null;
    throw err;
  }
}

/**
 * Get app HTML from S3 — tries source-namespaced path first, falls back to legacy
 */
async function getAppHtml(subdomain, source) {
  const sourcePrefix = source || null;
  if (sourcePrefix) {
    try {
      const result = await s3.send(
        new GetObjectCommand({
          Bucket: HOSTING_BUCKET,
          Key: `${S3_APPS_PREFIX}/${sourcePrefix}/${subdomain}/index.html`,
        })
      );
      return await result.Body.transformToString();
    } catch (err) {
      if (err.name !== 'NoSuchKey' && err.$metadata?.httpStatusCode !== 404) throw err;
    }
  }
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: HOSTING_BUCKET,
        Key: `${S3_APPS_PREFIX}/${subdomain}/index.html`,
      })
    );
    return await result.Body.transformToString();
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404)
      return null;
    throw err;
  }
}

/**
 * List deployed apps from S3 — source-scoped
 * If source provided, only lists from that source prefix.
 * If no source, lists from all source prefixes + legacy root.
 */
async function listDeployedApps(source, userId) {
  const apps = [];
  const prefixes = source
    ? [`${S3_APPS_PREFIX}/${source}/`]
    : [`${S3_APPS_PREFIX}/canvas-app/`, `${S3_APPS_PREFIX}/canvas-build/`, `${S3_APPS_PREFIX}/shared/`, `${S3_APPS_PREFIX}/`];

  for (const prefix of prefixes) {
    try {
      const listResult = await s3.send(
        new ListObjectsV2Command({
          Bucket: HOSTING_BUCKET,
          Prefix: prefix,
          Delimiter: '/',
        })
      );

      if (!listResult.CommonPrefixes) continue;

      const metadataPromises = listResult.CommonPrefixes.map(async (pfx) => {
        const subdomain = pfx.Prefix.replace(prefix, '').replace('/', '');
        if (!subdomain || ['canvas-app', 'canvas-build', 'shared'].includes(subdomain)) return null;
        try {
          const metadata = await getAppMetadata(subdomain, source);
          if (metadata) {
            // Filter by userId if provided
            if (userId && metadata.userId && metadata.userId !== userId) return null;
            return { ...metadata, fullUrl: `https://${subdomain}.${APP_DOMAIN}` };
          }
        } catch { /* skip */ }
        return null;
      });

      const results = await Promise.all(metadataPromises);
      apps.push(...results.filter(Boolean));
    } catch { /* skip prefix */ }
  }

  return apps.sort((a, b) => (b.deployedAt || 0) - (a.deployedAt || 0));
}

// Reserved subdomains that can't be used
const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'app',
  'admin',
  'dashboard',
  'mail',
  'email',
  'ftp',
  'smtp',
  'pop',
  'imap',
  'test',
  'staging',
  'dev',
  'auth',
  'login',
  'signup',
  'register',
  'cdn',
  'assets',
  'static',
  'media',
  'images',
  'files',
  'docs',
  'help',
  'support',
  'status',
  'blog',
  'news',
  'shop',
  'store',
  'billing',
  'payment',
  'checkout',
  'cart',
  'account',
];

// Validate subdomain format
function isValidSubdomain(subdomain) {
  if (!subdomain || typeof subdomain !== 'string') return false;
  if (subdomain.length < 3 || subdomain.length > 30) return false;
  if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) return false;
  return (
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) ||
    /^[a-z0-9]{3,}$/.test(subdomain)
  );
}

// Generate unique deployment ID
function generateDeploymentId() {
  return `dep_${crypto.randomBytes(12).toString('hex')}`;
}

/**
 * POST /api/apps/deploy
 * Deploy or update an app — uploads to S3 for subdomain hosting
 * REQUIRES AUTH — uses req.userId from token, not req.body
 */
router.post('/deploy', requireAuth, async (req, res) => {
  try {
    const {
      appId,
      name,
      code,
      subdomain,
      hostingType = 'static',
      enableBackend = false,
    } = req.body;
    const source = getSource(req);
    const userId = req.userId; // from auth middleware, NOT req.body

    // Validate required fields
    if (!appId || !code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: appId and code are required',
      });
    }

    // Validate subdomain
    const finalSubdomain = subdomain || `app-${Date.now().toString(36)}`;
    if (!isValidSubdomain(finalSubdomain)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid subdomain. Use 3-30 lowercase letters, numbers, and hyphens. Cannot start/end with hyphen.',
      });
    }

    // Check if subdomain is reserved
    if (RESERVED_SUBDOMAINS.includes(finalSubdomain.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Subdomain "${finalSubdomain}" is reserved. Please choose a different one.`,
      });
    }

    // Check if subdomain is taken by another user
    const existingMeta = await getAppMetadata(finalSubdomain, source);
    if (
      existingMeta &&
      existingMeta.userId &&
      existingMeta.userId !== userId
    ) {
      return res.status(409).json({
        success: false,
        error: 'This subdomain is already taken by another user.',
      });
    }

    // Generate deployment ID
    const deploymentId = generateDeploymentId();
    const timestamp = Date.now();

    const metadata = {
      deploymentId,
      appId,
      userId,
      source: source || null,
      name: name || 'Untitled App',
      subdomain: finalSubdomain,
      hostingType,
      enableBackend,
      deployedAt: timestamp,
      lastUpdated: timestamp,
      status: 'live',
      codeSize: code.length,
    };

    // Upload to S3 — source-namespaced path
    await uploadAppToS3(finalSubdomain, code, metadata, source);

    const fullUrl = `https://${finalSubdomain}.${APP_DOMAIN}`;

    console.log(
      `[Apps] Deployed app ${appId} to ${fullUrl} (S3: ${HOSTING_BUCKET}, source: ${source})`
    );

    res.json({
      success: true,
      deploymentId,
      url: fullUrl,
      subdomain: finalSubdomain,
      status: 'live',
      deployedAt: timestamp,
      message: `App deployed successfully to ${fullUrl}`,
    });
  } catch (error) {
    console.error('[Apps] Deploy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy app. Please try again.',
    });
  }
});

/**
 * POST /api/apps/unpublish
 * Take down a deployed app — removes from S3
 */
router.post('/unpublish', requireAuth, async (req, res) => {
  try {
    const { deploymentId, subdomain } = req.body;
    const source = getSource(req);

    if (!deploymentId && !subdomain) {
      return res.status(400).json({
        success: false,
        error: 'Missing deploymentId or subdomain',
      });
    }

    let targetSubdomain = subdomain;

    // If only deploymentId provided, find subdomain from S3 listings
    if (!targetSubdomain && deploymentId) {
      const apps = await listDeployedApps(source, req.userId);
      const match = apps.find((a) => a.deploymentId === deploymentId);
      if (match) targetSubdomain = match.subdomain;
    }

    if (!targetSubdomain) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found',
      });
    }

    // Verify ownership before deleting
    const meta = await getAppMetadata(targetSubdomain, source);
    if (meta && meta.userId && meta.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Delete from S3 — source-scoped
    await deleteAppFromS3(targetSubdomain, source);

    console.log(`[Apps] Unpublished app at ${targetSubdomain}.${APP_DOMAIN}`);

    res.json({
      success: true,
      message: 'App unpublished successfully',
    });
  } catch (error) {
    console.error('[Apps] Unpublish error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unpublish app',
    });
  }
});

/**
 * GET /api/apps/deployments
 * Get list of deployed apps — filtered by authenticated user and source
 */
router.get('/deployments', requireAuth, async (req, res) => {
  try {
    const source = getSource(req);
    const deployments = await listDeployedApps(source, req.userId);

    res.json({
      success: true,
      deployments,
      count: deployments.length,
    });
  } catch (error) {
    console.error('[Apps] Get deployments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deployments',
    });
  }
});

/**
 * GET /api/apps/check/:subdomain
 * Check if subdomain is available
 */
router.get('/check/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const source = getSource(req);

    if (!isValidSubdomain(subdomain)) {
      return res.json({
        success: true,
        available: false,
        reason: 'Invalid subdomain format',
      });
    }

    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return res.json({
        success: true,
        available: false,
        reason: 'This subdomain is reserved',
      });
    }

    // Check S3 for existing deployment (source-scoped)
    const metadata = await getAppMetadata(subdomain, source);
    if (metadata) {
      return res.json({
        success: true,
        available: false,
        reason: 'This subdomain is already taken',
      });
    }

    return res.json({
      success: true,
      available: true,
    });
  } catch (error) {
    console.error('[Apps] Check subdomain error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check subdomain availability',
    });
  }
});

/**
 * GET /api/apps/serve/:subdomain
 * Serve a hosted app — NGINX reverse-proxies *.mumtaz.ai here,
 * or can be hit directly for testing
 */
router.get('/serve/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    // Serving is public — try all source prefixes
    const html = await getAppHtml(subdomain, null);
    if (!html) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html><head><title>App Not Found</title>
        <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff;}
        .c{text-align:center;}.c h1{font-size:3rem;margin-bottom:1rem;}.c p{color:#888;}.c a{color:#6366f1;}</style></head>
        <body><div class="c"><h1>404</h1><p>This app doesn't exist or has been unpublished.</p><p><a href="https://${APP_DOMAIN}">Go to ${APP_DOMAIN}</a></p></div></body></html>
      `);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(html);
  } catch (error) {
    console.error('[Apps] Serve error:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * GET /api/apps/:subdomain
 * Get specific deployment info
 */
router.get('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const source = getSource(req);

    const metadata = await getAppMetadata(subdomain, source);
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found',
      });
    }

    res.json({
      success: true,
      deployment: {
        ...metadata,
        fullUrl: `https://${metadata.subdomain}.${APP_DOMAIN}`,
      },
    });
  } catch (error) {
    console.error('[Apps] Get deployment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deployment info',
    });
  }
});

export default router;
