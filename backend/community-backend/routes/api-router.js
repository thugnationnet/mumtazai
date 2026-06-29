/**
 * COMMUNITY BACKEND — API ROUTER (port 3011)
 * Mounts: community, suggestions, user
 * Auth is handled centrally by shiny-backend (port 3005)
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

// import authRouter from './auth.js';  // REMOVED — auth consolidated to port 3005
import communityRouter from './community.js';
import suggestionsRouter from './suggestions.js';
import userRouter from './user.js';

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'API rate limit exceeded, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Health ──────────────────────────────────────────────────────

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Community API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── Auth — handled by shiny-backend (port 3005) ────────────────
// All /api/auth/* requests are routed by nginx to port 3005

// ── Community ───────────────────────────────────────────────────

router.use('/community', apiLimiter);
router.use('/community', communityRouter);

// ── Suggestions ─────────────────────────────────────────────────

router.use('/suggestions', apiLimiter);
router.use('/suggestions', suggestionsRouter);

// ── User (profile endpoint) ─────────────────────────────────────

router.use('/user', apiLimiter);
router.use('/user', userRouter);

// ── 404 ─────────────────────────────────────────────────────────

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Community API endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// ── Error Handling ──────────────────────────────────────────────

router.use((error, req, res, _next) => {
  console.error('Community API Error:', error);
  if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Validation error' });
  if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token' });
  if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
  if (error.name?.startsWith('PrismaClient')) return res.status(500).json({ success: false, message: 'Database error' });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

export default router;
