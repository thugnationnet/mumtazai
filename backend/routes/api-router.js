/**
 * MAIN BACKEND — MINIMAL API ROUTER (Hub Server)
 * 
 * All business routes have been moved to standalone backends:
 *   canvas-studio-backend  :3006  — canvas, builder, editor, video-editor, deploys
 *   universal-canvas-backend :3007  — universal-canvas features (embedded chat panel)
 *   universal-chat-backend :3008  — chat, studio, agent-chat-stream, agent-search
 *   ai-studio-demo-backend :3009  — demo + canvas + chat
 *   tools-backend          :3010  — tools, user-preferences
 *   community-backend      :3011  — community, suggestions, user
 *   live-support-backend   :3012  — Luna AI chat, support tickets
 *   lab-backend            :3013  — experiments, emotion-visualizer, story-weaver, battle-arena
 *
 * This hub only serves:
 *   /api/health, /api/version, /api/cookie-consent
 *   /health, /api/status, /api/status/stream, /api/status/analytics, /api/status/api-status
 *     (served directly from server-simple.js)
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

// ── Auth (this is the SINGLE auth authority for all backends) ──
import authRouter from './auth.js';
import pushRouter from './push.js';

const router = express.Router();

// ============================================
// RATE LIMITING
// ============================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'API rate limit exceeded, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for auth endpoints (login, signup, password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, module: 'auth', message: 'Too many authentication attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// HEALTH CHECK
// ============================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// VERSION INFO
// ============================================

router.get('/version', (req, res) => {
  res.json({
    success: true,
    version: '2.0.0',
    apiVersion: 'v2',
    buildDate: new Date().toISOString(),
    architecture: 'microservices',
    backends: {
      'canvas-studio':     { port: 3006, subdomain: 'studio.mumtaz.ai' },
      'universal-canvas':  { port: 3007, subdomain: 'chat.mumtaz.ai' },
      'universal-chat':   { port: 3008, subdomain: 'chat.mumtaz.ai' },
      'ai-studio-demo':   { port: 3009, subdomain: 'demo.mumtaz.ai' },
      'tools':            { port: 3010 },
      'community':        { port: 3011 },
      'live-support':     { port: 3012 },
      'lab':              { port: 3013 },
    },
  });
});

// ============================================
// AUTHENTICATION (single auth authority for all backends)
// ============================================
router.use('/auth', authLimiter);
router.use('/auth', authRouter);

// ============================================
// PUSH NOTIFICATIONS
// ============================================
router.use('/push', apiLimiter);
router.use('/push', pushRouter);

// ============================================
// COOKIE CONSENT (public — no auth required)
// ============================================

router.post('/cookie-consent', apiLimiter, (req, res) => {
  try {
    const { consent } = req.body;
    const isProduction = req.headers['x-forwarded-proto'] === 'https' ||
                        req.get('host')?.includes('mumtaz.ai');
    const cookieDomain = isProduction ? (process.env.APP_DOMAIN || '.mumtaz.ai') : undefined;
    const consentValue = typeof consent === 'object'
      ? JSON.stringify(consent)
      : String(consent || 'accepted');

    res.cookie('cookie_consent', consentValue, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: '/',
      domain: cookieDomain,
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
// 404 HANDLER
// ============================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found — routes have moved to standalone backends',
    path: req.originalUrl,
    method: req.method,
    hint: 'Check /api/version for backend routing info',
  });
});

// ============================================
// ERROR HANDLER
// ============================================

router.use((error, req, res, _next) => {
  console.error('API Error:', error);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

export default router;
