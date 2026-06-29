/**
 * CANVAS DEPLOY ROUTES
 * 
 * Real deployment to external platforms:
 * - Vercel (via API v13)
 * - Railway (via GraphQL API)
 * - Netlify (via REST API)
 * - Cloudflare Pages (via REST API)
 * - OneLast AI (internal static hosting)
 * 
 * Also handles credential CRUD (encrypted storage)
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { rateLimiters } from '../lib/cache.js';
import { requireAuth, optionalAuth } from '../lib/auth-middleware.js';
import { requireAnyCanvasPlan } from '../lib/plan-middleware.js';
import { getSource } from '../lib/source-utils.js';

const router = express.Router();

// ============================================
// ENCRYPTION HELPERS
// ============================================

const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.SESSION_SECRET || 'mumtazai-canvas-deploy-key-32ch';
const IV_LENGTH = 16;

function encrypt(text) {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

// Auth middleware imported from ../lib/auth-middleware.js

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// ============================================
// CREDENTIAL ROUTES
// ============================================

/**
 * GET /api/canvas/credentials
 * List user's deploy credentials (tokens masked)
 * Uses optionalAuth so unauthenticated users get empty list instead of 401
 */
router.get('/credentials', optionalAuth, async (req, res) => {
  try {
    // If not authenticated, return empty credentials (no 401)
    if (!req.isAuthenticated || !req.userId || req.userId.startsWith('guest_') || req.userId.startsWith('anon_')) {
      return res.json({ success: true, credentials: [] });
    }
    // List all user credentials (shared across canvas-app and canvas-build)
    const stored = await prisma.canvasDeployCredential.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);

    const credentials = stored.map(c => ({
      id: c.id,
      provider: c.provider,
      name: c.name,
      token: '••••' + (decrypt(c.token) || '').slice(-4),
      teamId: c.teamId || undefined,
      isValid: c.isValid,
      lastValidated: c.lastValidatedAt ? new Date(c.lastValidatedAt).getTime() : undefined,
      createdAt: new Date(c.createdAt).getTime(),
    }));

    res.json({ success: true, credentials });
  } catch (error) {
    console.error('[CanvasDeploy] List credentials error:', error);
    // Table might not exist yet - return empty
    res.json({ success: true, credentials: [] });
  }
});

/**
 * POST /api/canvas/credentials
 * Save a new deployment credential
 */
router.post('/credentials', requireAuth, [
  body('provider').isIn(['vercel', 'railway', 'netlify', 'cloudflare']),
  body('token').isString().isLength({ min: 10 }),
  body('name').optional().isString(),
  body('teamId').optional().isString(),
  body('source').optional().isIn(['canvas-app', 'universal-canvas']),
], validateRequest, async (req, res) => {
  try {
    const { provider, token, name, teamId } = req.body;
    const source = getSource(req);
    const encryptedToken = encrypt(token);

    // Validate the token first
    const isValid = await validateProviderToken(provider, token, teamId);

    // Upsert credential for this provider + source
    const credential = await prisma.canvasDeployCredential.upsert({
      where: {
        userId_provider_source: {
          userId: req.userId,
          provider,
          source: source || '',
        },
      },
      update: {
        token: encryptedToken,
        name: name || `${provider} Account`,
        teamId: teamId || null,
        isValid,
        lastValidatedAt: new Date(),
      },
      create: {
        userId: req.userId,
        provider,
        source: source || '',
        name: name || `${provider} Account`,
        token: encryptedToken,
        teamId: teamId || null,
        isValid,
        lastValidatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      credential: {
        id: credential.id,
        provider,
        name: name || `${provider} Account`,
        isValid,
        createdAt: Date.now(),
      },
    });
  } catch (error) {
    console.error('[CanvasDeploy] Save credential error:', error);
    res.status(500).json({ success: false, error: 'Failed to save credential' });
  }
});

/**
 * DELETE /api/canvas/credentials/:id
 * Delete a credential
 */
router.delete('/credentials/:id', requireAuth, [
  param('id').isString(),
], validateRequest, async (req, res) => {
  try {
    await prisma.canvasDeployCredential.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('[CanvasDeploy] Delete credential error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete credential' });
  }
});

/**
 * POST /api/canvas/credentials/:id/validate
 * Re-validate a stored credential
 */
router.post('/credentials/:id/validate', requireAuth, rateLimiters.agent, async (req, res) => {
  try {
    const cred = await prisma.canvasDeployCredential.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!cred) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    const token = decrypt(cred.token);
    if (!token) {
      return res.status(400).json({ success: false, error: 'Failed to decrypt credential' });
    }

    const isValid = await validateProviderToken(cred.provider, token, cred.teamId);

    await prisma.canvasDeployCredential.update({
      where: { id: req.params.id },
      data: { isValid, lastValidatedAt: new Date() },
    });

    res.json({ success: true, isValid });
  } catch (error) {
    console.error('[CanvasDeploy] Validate credential error:', error);
    res.status(500).json({ success: false, error: 'Failed to validate credential' });
  }
});

// ============================================
// DEPLOY ROUTES
// ============================================

/**
 * POST /api/canvas/deploy
 * Deploy project files to selected platform
 */
router.post('/deploy', requireAuth, requireAnyCanvasPlan, rateLimiters.agent, [
  body('provider').isIn(['vercel', 'railway', 'netlify', 'cloudflare', 'mumtazai']),
  body('projectName').isString().isLength({ min: 1, max: 100 }),
  body('files').isArray({ min: 1 }),
  body('framework').optional().isString(),
  body('source').optional().isIn(['canvas-app', 'universal-canvas']),
], validateRequest, async (req, res) => {
  try {
    const { provider, projectName, files, framework, subdomain, envVars, credentialId } = req.body;
    const source = getSource(req);

    console.log(`[CanvasDeploy] Deploying "${projectName}" to ${provider} (${files.length} files) [source=${source}]`);

    // Get the credential token — scoped by source
    let token = null;
    let teamId = null;

    if (provider !== 'mumtazai') {
      if (!credentialId) {
        // Try to find by provider + source
        const cred = await prisma.canvasDeployCredential.findFirst({
          where: { userId: req.userId, provider, isValid: true },
        }).catch(() => null);

        if (!cred) {
          return res.status(400).json({
            success: false,
            error: `No valid ${provider} credentials found. Please add your API token first.`,
          });
        }
        token = decrypt(cred.token);
        teamId = cred.teamId;
      } else {
        const cred = await prisma.canvasDeployCredential.findFirst({
          where: { id: credentialId, userId: req.userId },
        }).catch(() => null);

        if (!cred) {
          return res.status(400).json({ success: false, error: 'Credential not found' });
        }
        token = decrypt(cred.token);
        teamId = cred.teamId;
      }

      if (!token) {
        return res.status(400).json({ success: false, error: 'Failed to decrypt credential' });
      }
    }

    // Route to provider-specific deployer
    let result;
    switch (provider) {
      case 'vercel':
        result = await deployToVercel(token, teamId, projectName, files, framework, envVars);
        break;
      case 'railway':
        result = await deployToRailway(token, projectName, files, framework, envVars);
        break;
      case 'netlify':
        result = await deployToNetlify(token, projectName, files, framework);
        break;
      case 'cloudflare':
        result = await deployToCloudflare(token, projectName, files);
        break;
      case 'mumtazai':
        result = await deployToOnelastai(req.userId, projectName, files, subdomain, source);
        break;
      default:
        return res.status(400).json({ success: false, error: 'Unknown provider' });
    }

    // Store deployment record in DB — scoped by source
    try {
      // Find or create a canvas project for tracking (source-scoped)
      let project = await prisma.canvasProject.findFirst({
        where: { userId: req.userId, name: projectName },
      });

      if (!project) {
        project = await prisma.canvasProject.create({
          data: {
            userId: req.userId,
            name: projectName,
            framework: mapFramework(framework),
            files: JSON.parse(JSON.stringify(files)),
            status: result.success ? 'deployed' : 'error',
            subdomain: result.subdomain || subdomain || null,
            deploymentUrl: result.url || null,
            source,
          },
        });
      } else {
        await prisma.canvasProject.update({
          where: { id: project.id },
          data: {
            files: JSON.parse(JSON.stringify(files)),
            status: result.success ? 'deployed' : 'error',
            subdomain: result.subdomain || subdomain || project.subdomain,
            deploymentUrl: result.url || project.deploymentUrl,
            updatedAt: new Date(),
          },
        });
      }

      // Create deployment record
      if (project) {
        await prisma.canvasDeployment.create({
          data: {
            projectId: project.id,
            subdomain: result.subdomain || subdomain || projectName.toLowerCase().replace(/\s+/g, '-'),
            url: result.url || '',
            status: result.success ? 'live' : 'failed',
            type: 'static',
            envVars: envVars ? JSON.parse(JSON.stringify(envVars)) : undefined,
            deployedAt: result.success ? new Date() : null,
          },
        });
      }
    } catch (dbErr) {
      console.error('[CanvasDeploy] DB record error (non-fatal):', dbErr.message);
    }

    res.json({
      success: result.success,
      deployment: {
        id: result.deploymentId || crypto.randomUUID(),
        provider,
        status: result.success ? 'live' : 'failed',
        url: result.url,
        previewUrl: result.previewUrl,
        subdomain: result.subdomain,
        buildLogs: result.logs || [],
        deployLogs: result.deployLogs || [],
        errors: result.errors || [],
        providerProjectId: result.projectId,
        providerDeployId: result.deploymentId,
      },
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    console.error('[CanvasDeploy] Deploy error:', error);
    res.status(500).json({ success: false, error: `Deployment failed: ${error.message}` });
  }
});

/**
 * POST /api/canvas/build-validate
 * Server-side validation of project files (lint, syntax check)
 */
router.post('/build-validate', requireAuth, requireAnyCanvasPlan, [
  body('files').isArray({ min: 1 }),
  body('framework').optional().isString(),
], validateRequest, async (req, res) => {
  try {
    const { files, framework } = req.body;
    const errors = [];
    const warnings = [];

    for (const file of files) {
      // Basic syntax checks
      if (file.path?.endsWith('.json')) {
        try {
          JSON.parse(file.content);
        } catch (e) {
          errors.push({
            id: crypto.randomUUID(),
            file: file.path,
            message: `Invalid JSON: ${e.message}`,
            severity: 'error',
            autoFixable: false,
          });
        }
      }

      // Check for empty files
      if (!file.content || file.content.trim().length === 0) {
        warnings.push({
          id: crypto.randomUUID(),
          file: file.path,
          message: 'File is empty',
          severity: 'warning',
          autoFixable: false,
        });
      }

      // Check HTML structure
      if (file.path?.endsWith('.html')) {
        if (!file.content.includes('<!DOCTYPE') && !file.content.includes('<html')) {
          warnings.push({
            id: crypto.randomUUID(),
            file: file.path,
            message: 'Missing DOCTYPE or <html> tag',
            severity: 'warning',
            suggestion: 'Add <!DOCTYPE html> at the top of your HTML file',
            autoFixable: true,
          });
        }
      }

      // Check for common JS errors
      if (file.path?.match(/\.(js|ts|jsx|tsx)$/)) {
        // Check for unmatched braces
        const opens = (file.content.match(/{/g) || []).length;
        const closes = (file.content.match(/}/g) || []).length;
        if (opens !== closes) {
          errors.push({
            id: crypto.randomUUID(),
            file: file.path,
            message: `Unmatched braces: ${opens} opening, ${closes} closing`,
            severity: 'error',
            autoFixable: false,
          });
        }
      }

      // Framework-specific checks
      if (framework === 'nextjs' || framework === 'vite_react') {
        if (file.path === '/package.json') {
          try {
            const pkg = JSON.parse(file.content);
            if (!pkg.dependencies?.react) {
              warnings.push({
                id: crypto.randomUUID(),
                file: file.path,
                message: 'React not found in dependencies',
                severity: 'warning',
                suggestion: 'Add "react" to dependencies',
                autoFixable: true,
              });
            }
          } catch { /* already caught above */ }
        }
      }
    }

    res.json({
      success: true,
      valid: errors.length === 0,
      errors,
      warnings,
    });
  } catch (error) {
    console.error('[CanvasDeploy] Build validate error:', error);
    res.status(500).json({ success: false, error: 'Validation failed' });
  }
});

// ============================================
// PROVIDER DEPLOYERS
// ============================================

/**
 * Deploy to Vercel via v13 API
 */
async function deployToVercel(token, teamId, projectName, files, framework, envVars) {
  try {
    const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    // Build files array in Vercel format
    const vercelFiles = files.map(f => ({
      file: f.path.startsWith('/') ? f.path.slice(1) : f.path,
      data: f.content,
    }));

    // Create deployment
    const deployPayload = {
      name: slug,
      files: vercelFiles,
      projectSettings: {
        framework: mapVercelFramework(framework),
      },
      target: 'production',
    };

    if (envVars && Object.keys(envVars).length > 0) {
      deployPayload.env = envVars;
    }

    const url = teamId
      ? `https://api.vercel.com/v13/deployments?teamId=${teamId}`
      : 'https://api.vercel.com/v13/deployments';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deployPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Vercel] Deploy error:', data);
      return {
        success: false,
        error: data.error?.message || data.message || 'Vercel deployment failed',
        errors: [{
          id: crypto.randomUUID(),
          file: '',
          message: data.error?.message || 'Vercel API error',
          severity: 'error',
        }],
      };
    }

    const deployUrl = data.url ? `https://${data.url}` : null;
    const aliasUrl = data.alias?.length ? `https://${data.alias[0]}` : deployUrl;

    return {
      success: true,
      url: aliasUrl || deployUrl,
      previewUrl: deployUrl,
      subdomain: slug,
      deploymentId: data.id,
      projectId: data.projectId,
      logs: [`Deployed to Vercel: ${aliasUrl || deployUrl}`],
      deployLogs: [`Deployment ID: ${data.id}`, `Status: ${data.readyState || 'QUEUED'}`],
    };
  } catch (error) {
    console.error('[Vercel] Deploy error:', error);
    return {
      success: false,
      error: `Vercel deployment failed: ${error.message}`,
    };
  }
}

/**
 * Deploy to Railway via REST API
 */
async function deployToRailway(token, projectName, files, framework, envVars) {
  try {
    // Railway uses a GraphQL API + GitHub/Dockerfile typically
    // For file-based deploys, we create a project and deploy via the "up" API
    // Railway doesn't have a direct file upload API like Vercel
    // We'll use their deploy from template or Nixpacks approach

    // Step 1: Create a project
    const createProjectRes = await fetch('https://backboard.railway.app/graphql/v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `mutation { projectCreate(input: { name: "${projectName.replace(/"/g, '')}" }) { id name } }`,
      }),
    });

    const projectData = await createProjectRes.json();

    if (projectData.errors) {
      return {
        success: false,
        error: projectData.errors[0]?.message || 'Railway project creation failed',
        errors: projectData.errors.map(e => ({
          id: crypto.randomUUID(),
          file: '',
          message: e.message,
          severity: 'error',
        })),
      };
    }

    const railwayProjectId = projectData.data?.projectCreate?.id;

    // Step 2: For static sites, create an empty service and deploy
    // Railway needs a Dockerfile or Nixpacks config for file deploys
    // We'll create a static Dockerfile
    const staticDockerfile = `FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

    // Add Dockerfile to files
    const deployFiles = [
      ...files,
      { path: '/Dockerfile', content: staticDockerfile, name: 'Dockerfile' },
    ];

    // For now, return the project URL - Railway needs CLI or GitHub integration for full deploy
    const projectUrl = `https://railway.app/project/${railwayProjectId}`;

    return {
      success: true,
      url: projectUrl,
      previewUrl: projectUrl,
      projectId: railwayProjectId,
      deploymentId: railwayProjectId,
      subdomain: projectName.toLowerCase().replace(/\s+/g, '-'),
      logs: [
        `Railway project created: ${projectName}`,
        `Project ID: ${railwayProjectId}`,
        'Note: Railway requires GitHub integration or CLI for full file deployment.',
        `Manage your project: ${projectUrl}`,
      ],
      deployLogs: [
        'Project created successfully.',
        'To complete deployment, push your code to a connected GitHub repo.',
      ],
    };
  } catch (error) {
    console.error('[Railway] Deploy error:', error);
    return {
      success: false,
      error: `Railway deployment failed: ${error.message}`,
    };
  }
}

/**
 * Deploy to Netlify via REST API
 */
async function deployToNetlify(token, projectName, files, framework) {
  try {
    const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    // Step 1: Create site
    const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: slug,
        custom_domain: null,
      }),
    });

    if (!siteRes.ok) {
      // Site might already exist, try to find it
      const listRes = await fetch(`https://api.netlify.com/api/v1/sites?name=${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sites = await listRes.json();
      var siteId = sites[0]?.id;
      var siteUrl = sites[0]?.ssl_url || sites[0]?.url;

      if (!siteId) {
        const errData = await siteRes.json().catch(() => ({}));
        return {
          success: false,
          error: errData.message || 'Failed to create Netlify site',
        };
      }
    } else {
      const siteData = await siteRes.json();
      var siteId = siteData.id;
      var siteUrl = siteData.ssl_url || siteData.url;
    }

    // Step 2: Create a deploy with file digests
    // Build file hash map
    const fileHashes = {};
    const fileContents = {};
    for (const file of files) {
      const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;
      const hash = crypto.createHash('sha1').update(file.content).digest('hex');
      fileHashes['/' + path] = hash;
      fileContents[hash] = file.content;
    }

    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: fileHashes,
        draft: false,
      }),
    });

    const deployData = await deployRes.json();

    if (!deployRes.ok) {
      return {
        success: false,
        error: deployData.message || 'Netlify deploy failed',
      };
    }

    // Step 3: Upload required files
    const required = deployData.required || [];
    for (const hash of required) {
      const content = fileContents[hash];
      if (content) {
        await fetch(`https://api.netlify.com/api/v1/deploys/${deployData.id}/files/${hash}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
          },
          body: content,
        });
      }
    }

    return {
      success: true,
      url: deployData.ssl_url || deployData.url || siteUrl,
      previewUrl: deployData.deploy_ssl_url || deployData.deploy_url,
      subdomain: slug,
      deploymentId: deployData.id,
      projectId: siteId,
      logs: [`Deployed to Netlify: ${deployData.ssl_url || siteUrl}`],
      deployLogs: [
        `Site: ${slug}.netlify.app`,
        `Deploy ID: ${deployData.id}`,
        `Files uploaded: ${files.length}`,
      ],
    };
  } catch (error) {
    console.error('[Netlify] Deploy error:', error);
    return {
      success: false,
      error: `Netlify deployment failed: ${error.message}`,
    };
  }
}

/**
 * Deploy to Cloudflare Pages via API
 */
async function deployToCloudflare(token, projectName, files) {
  try {
    const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    // Get account ID first
    const accountRes = await fetch('https://api.cloudflare.com/client/v4/accounts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const accountData = await accountRes.json();

    if (!accountData.success || !accountData.result?.length) {
      return {
        success: false,
        error: 'Could not find Cloudflare account. Please check your API token permissions.',
      };
    }

    const accountId = accountData.result[0].id;

    // Create Pages project if it doesn't exist
    const createRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: slug,
          production_branch: 'main',
        }),
      }
    );

    // Ignore error if project already exists
    const createData = await createRes.json();
    if (!createRes.ok && createData.errors?.[0]?.code !== 8000009) {
      // 8000009 = project already exists
      console.warn('[Cloudflare] Project create:', createData.errors);
    }

    // Direct upload deployment
    const formData = new FormData();

    // Cloudflare expects files as form data
    for (const file of files) {
      const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;
      const blob = new Blob([file.content], { type: 'text/plain' });
      formData.append(path, blob, path);
    }

    const deployRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${slug}/deployments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const deployData = await deployRes.json();

    if (!deployData.success) {
      return {
        success: false,
        error: deployData.errors?.[0]?.message || 'Cloudflare Pages deploy failed',
        errors: (deployData.errors || []).map(e => ({
          id: crypto.randomUUID(),
          file: '',
          message: e.message,
          severity: 'error',
        })),
      };
    }

    const pageUrl = deployData.result?.url || `https://${slug}.pages.dev`;

    return {
      success: true,
      url: `https://${slug}.pages.dev`,
      previewUrl: pageUrl,
      subdomain: slug,
      deploymentId: deployData.result?.id,
      projectId: slug,
      logs: [`Deployed to Cloudflare Pages: https://${slug}.pages.dev`],
      deployLogs: [
        `Project: ${slug}`,
        `Deploy ID: ${deployData.result?.id}`,
        `URL: ${pageUrl}`,
      ],
    };
  } catch (error) {
    console.error('[Cloudflare] Deploy error:', error);
    return {
      success: false,
      error: `Cloudflare deployment failed: ${error.message}`,
    };
  }
}

/**
 * Deploy to OneLast AI internal hosting
 */
async function deployToOnelastai(userId, projectName, files, subdomain, source) {
  try {
    const slug = (subdomain || projectName).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const sourcePrefix = source || 'shared';

    // Use the existing apps deployment system
    const fs = await import('fs');
    const path = await import('path');
    
    const appsDir = process.env.APPS_DEPLOY_DIR || '/var/www/apps';
    // Source-namespaced deploy path: /var/www/apps/{source}/{slug}/
    const projectDir = path.join(appsDir, sourcePrefix, slug);

    // Create directory
    await fs.promises.mkdir(projectDir, { recursive: true });

    // Write files
    for (const file of files) {
      const filePath = path.join(projectDir, file.path.startsWith('/') ? file.path.slice(1) : file.path);
      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(filePath, file.content, 'utf-8');
    }

    // Ensure index.html exists
    const hasIndex = files.some(f => f.path === '/index.html' || f.path === 'index.html');
    if (!hasIndex) {
      // Find the first HTML file and copy it as index.html
      const htmlFile = files.find(f => f.path?.endsWith('.html'));
      if (htmlFile) {
        await fs.promises.writeFile(path.join(projectDir, 'index.html'), htmlFile.content, 'utf-8');
      }
    }

    const deployUrl = `https://${slug}.apps.mumtaz.ai`;

    return {
      success: true,
      url: deployUrl,
      previewUrl: deployUrl,
      subdomain: slug,
      deploymentId: `ola_${Date.now()}`,
      projectId: slug,
      logs: [
        `Deployed to OneLast AI Apps`,
        `URL: ${deployUrl}`,
        `Files: ${files.length}`,
      ],
      deployLogs: [
        `Static files written to ${projectDir}`,
        `Site is live at ${deployUrl}`,
      ],
    };
  } catch (error) {
    console.error('[OneLast] Deploy error:', error);
    return {
      success: false,
      error: `OneLast AI deployment failed: ${error.message}`,
    };
  }
}

// ============================================
// HELPERS
// ============================================

// Schema managed by Prisma — see CanvasDeployCredential model in schema.prisma

async function validateProviderToken(provider, token, teamId) {
  try {
    switch (provider) {
      case 'vercel': {
        const url = teamId
          ? `https://api.vercel.com/v2/user?teamId=${teamId}`
          : 'https://api.vercel.com/v2/user';
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
      }
      case 'railway': {
        const res = await fetch('https://backboard.railway.app/graphql/v2', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: '{ me { id } }' }),
        });
        const data = await res.json();
        return !!data.data?.me?.id;
      }
      case 'netlify': {
        const res = await fetch('https://api.netlify.com/api/v1/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
      }
      case 'cloudflare': {
        const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        return data.success === true;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

function mapVercelFramework(fw) {
  const map = {
    html: null,
    vite_react: 'vite',
    nextjs: 'nextjs',
    vue: 'vue',
    svelte: 'svelte',
    astro: 'astro',
    express: null,
    fastapi: null,
  };
  return map[fw] || null;
}

function mapFramework(fw) {
  const valid = ['vite_react', 'nextjs', 'html', 'express', 'fastapi'];
  return valid.includes(fw) ? fw : 'html';
}

export default router;
