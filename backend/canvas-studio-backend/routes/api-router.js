/**
 * CANVAS APP BACKEND — API ROUTER (Standalone, Canvas-Only)
 * 
 * This backend ONLY serves studio.mumtaz.ai (canvas-studio frontend).
 * Main-site routes (agents, chat, billing, etc.) are served by
 * universal-chat-backend on port 3008.
 * 
 * Routes kept here:
 *   - Canvas core: canvas, canvas-projects, canvas-builder, builds, monitoring,
 *     assets, video-editor, database, agent-ops, editor, apps, sandbox
 *   - Auth: session checks and logout (needed by canvas-studio login)
 *   - User: preferences and canvas-state persistence
 *   - Subscriptions: plan checks and Stripe flows for canvas-studio paywall
 *   - Analytics: error reporting from canvas-studio ErrorBoundary
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

// ── Auth is handled centrally by shiny-backend (port 3005) ──
import userPreferencesRouter from './user-preferences.js';

// ── Subscriptions (canvas-studio paywall) ──
import agentSubscriptionsRouter from './agentSubscriptions.js';

// ── Canvas routes (core purpose of this backend) ──
import canvasRouter from './canvas-routes.js';
import canvasProjectRouter from './canvas-project-routes.js';
import canvasBuilderRouter from './canvas-builder-routes.js';
import canvasDeployRouter from './canvas-deploy-routes.js';
import canvasMonitoringRouter from './canvas-monitoring-routes.js';
import canvasAssetRouter from './canvas-asset-routes.js';
import canvasBuildsRouter from './canvas-builds-routes.js';
import canvasVideoEditorRouter from './canvas-video-editor-routes.js';
import canvasDatabaseRouter from './canvas-database-routes.js';
import canvasAgentOpsRouter from './canvas-agent-ops-routes.js';

// ── Editor Bridge ──
import editorBridgeRouter from './editor-bridge-routes.js';

// ── Apps & Hosting ──
import appsRouter from './apps-routes.js';
import appHostingRouter from './app-hosting-routes.js';
import sandboxRouter from './sandbox-routes.js';

// ── Analytics (error reporting from canvas-studio) ──
import analyticsRouter from './analytics.js';

// ── Git snapshots (virtual git for canvas projects) ──
import canvasGitRouter from './canvas-git-routes.js';

// ── Environment variables (per-project, encrypted at rest) ──
import canvasEnvRouter from './canvas-env-routes.js';

// ── Image processing tools ──
import canvasImageRouter from './canvas-image-routes.js';

// ── Dependencies management (per-project package.json) ──
import canvasDepsRouter from './canvas-deps-routes.js';

const router = express.Router();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// HEALTH & VERSION
// ============================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Canvas Studio API is healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    backend: 'canvas-studio-backend',
  });
});

router.get('/version', (req, res) => {
  res.json({
    success: true,
    version: '2.0.0',
    apiVersion: 'v1',
    backend: 'canvas-studio-backend',
    buildDate: new Date().toISOString(),
    features: [
      'canvas',
      'canvas-builder',
      'canvas-projects',
      'video-editor',
      'sandbox',
      'monitoring',
      'database',
      'agent-ops',
      'deployment',
    ],
  });
});

// ============================================
// AUTHENTICATION — handled by shiny-backend (port 3005)
// All /api/auth/* requests are routed by nginx to port 3005
// ============================================

// ============================================
// USER ROUTES (canvas-studio preferences/state)
// ============================================
router.use('/user/preferences', apiLimiter);
router.use('/user/preferences', userPreferencesRouter);

// ============================================
// SUBSCRIPTIONS (canvas-studio paywall)
// ============================================
router.use('/agent/subscriptions', apiLimiter);
router.use('/agent/subscriptions', agentSubscriptionsRouter);
router.use('/subscriptions', apiLimiter);
router.use('/subscriptions', agentSubscriptionsRouter);

// ============================================
// COOKIE CONSENT
// ============================================
router.post('/cookie-consent', apiLimiter, (req, res) => {
  try {
    const { consent } = req.body;
    const isProduction = req.headers['x-forwarded-proto'] === 'https' || req.get('host')?.includes('mumtaz.ai');
    const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;
    const consentValue = typeof consent === 'object' ? JSON.stringify(consent) : String(consent || 'accepted');
    res.cookie('cookie_consent', consentValue, {
      httpOnly: false, secure: isProduction, sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', domain: cookieDomain,
    });
    res.json({ success: true, message: 'Cookie consent recorded' });
  } catch (error) {
    console.error('[cookie-consent] error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to record cookie consent' });
  }
});
router.get('/cookie-consent', apiLimiter, (req, res) => {
  const consent = req.cookies?.cookie_consent || null;
  res.json({ success: true, consent });
});

// ============================================
// CANVAS ROUTES (core purpose)
// ============================================
router.use('/canvas', apiLimiter);
router.use('/canvas', canvasRouter);
router.use('/canvas', canvasDeployRouter);
router.use('/canvas-projects', apiLimiter);
router.use('/canvas-projects', canvasProjectRouter);
router.use('/canvas-builder', apiLimiter);
router.use('/canvas-builder', canvasBuilderRouter);
router.use('/builds', apiLimiter);
router.use('/builds', canvasBuildsRouter);
// Also mount at /canvas/builds — frontend (universal-chat) calls /api/canvas/builds/*
router.use('/canvas/builds', apiLimiter);
router.use('/canvas/builds', canvasBuildsRouter);
router.use('/monitoring', apiLimiter);
router.use('/monitoring', canvasMonitoringRouter);
router.use('/assets', apiLimiter);
router.use('/assets', canvasAssetRouter);
router.use('/video-editor', apiLimiter);
router.use('/video-editor', canvasVideoEditorRouter);
router.use('/database', apiLimiter);
router.use('/database', canvasDatabaseRouter);
router.use('/agent-ops', apiLimiter);
router.use('/agent-ops', canvasAgentOpsRouter);
router.use('/editor', apiLimiter);
router.use('/editor', editorBridgeRouter);

// ============================================
// APPS & HOSTING
// ============================================
router.use('/apps', apiLimiter);
router.use('/apps', appsRouter);
router.use('/apps/hosting', apiLimiter);
router.use('/apps/hosting', appHostingRouter);
router.use('/sandbox', apiLimiter);
router.use('/sandbox', sandboxRouter);

// ============================================
// GIT SNAPSHOTS — virtual git for canvas projects
// ============================================
router.use('/canvas-git', apiLimiter);
router.use('/canvas-git', canvasGitRouter);

// ============================================
// ENVIRONMENT VARIABLES — per-project, encrypted
// ============================================
router.use('/canvas-env', apiLimiter);
router.use('/canvas-env', canvasEnvRouter);

// ============================================
// IMAGE TOOLS — sharp + AI image processing
// ============================================
router.use('/canvas-images', apiLimiter);
router.use('/canvas-images', canvasImageRouter);

// ============================================
// DEPENDENCIES — per-project package management
// ============================================
router.use('/canvas-deps', apiLimiter);
router.use('/canvas-deps', canvasDepsRouter);

// ============================================
// ANALYTICS (error reporting)
// ============================================
router.use('/analytics', apiLimiter);
router.use('/analytics', analyticsRouter);

// ============================================
// ERROR HANDLING
// ============================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Canvas API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    hint: 'This backend only serves canvas-specific routes. Main-site routes are at port 3008.',
  });
});

router.use((error, req, res, _next) => {
  console.error('Canvas API Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  if (
    error.name === 'PrismaClientKnownRequestError' ||
    error.name === 'PrismaClientValidationError'
  ) {
    return res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

export default router;
