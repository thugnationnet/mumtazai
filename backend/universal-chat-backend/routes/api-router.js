/**
 * UNIVERSAL CHAT BACKEND — API ROUTER
 * Routes for 18 AI agent chat, subscriptions, Stripe payments, and related features.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

// ── Auth is handled centrally by shiny-backend (port 3005) ──
// import authRouter from './auth.js';  // REMOVED — auth consolidated
import userPreferencesRouter from './user-preferences.js';
import userMemoryRouter from './user-memory.js';

// ── Agents ──
import agentsRouter from './agents.js';
import agentSubscriptionsRouter from './agentSubscriptions.js';
import agentPerformanceRouter from './agent-performance.js';


// ── Chat & Studio ──
import chatRouter from './chat.js';
import chatSessionsRouter from './chat-sessions.js';
import studioRouter from './studio.js';

// ── Media & Uploads ──
import mediaRouter from './media-routes.js';
import uploadsRouter from './uploads.js';

// ── AI Core ──
import aiCoreRouter from './ai-core-routes.js';
import marketplaceRouter from './marketplace-routes.js';



// ── Business routes ──
import analyticsRouter from './analytics.js';
import billingRouter from './billing.js';
import gamificationRouter from './gamification.js';
import favoritesRouter from './favorites.js';
import newsletterRouter from './newsletter.js';
import careersRouter from './careers.js';
import webinarsRouter from './webinars.js';
import jobsRouter from './jobs.js';

// ── Admin ──
import adminDashboardRouter from './admin-dashboard.js';
import adminAnalyticsRouter from './admin-analytics.js';
import adminSupportTicketsRouter from './admin-support-tickets.js';

// ── Email Tracking ──
import { emailTrackingPixelRouter, emailTrackingAdminRouter } from './email-tracking.js';

// ── Device Tracking ──
import deviceTrackingRouter from './device-tracking.js';

// ── Stripe ──
import stripeRouter from './stripe-routes.js';

// ── Video (RunwayML) ──
import videoRouter from './video-router.js';

const router = express.Router();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// API-specific rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 API requests per windowMs
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// API VERSIONING & HEALTH CHECKS
// ============================================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API version info
router.get('/version', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    apiVersion: 'v1',
    buildDate: new Date().toISOString(),
    features: [
      'agents',
      'chat',
      'subscriptions',
      'stripe-payments',
      'agent-memory',
      'analytics',
    ],
  });
});

// ============================================
// AUTHENTICATION — handled by shiny-backend (port 3005)
// All /api/auth/* requests are routed by nginx to port 3005
// ============================================

// ============================================
// USER ROUTES
// ============================================
router.use('/user/memory', apiLimiter);
router.use('/user/memory', userMemoryRouter);
router.use('/user/preferences', apiLimiter);
router.use('/user/preferences', userPreferencesRouter);

// ============================================
// AGENT ROUTES
// ============================================
router.use('/agents', apiLimiter);
router.use('/agents', agentsRouter);
router.use('/agent/subscriptions', apiLimiter);
router.use('/agent/subscriptions', agentSubscriptionsRouter);
router.use('/agent/performance', apiLimiter);
router.use('/agent/performance', agentPerformanceRouter);

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
// CHAT & STUDIO ROUTES
// ============================================
router.use('/chat', apiLimiter);
router.use('/chat', chatRouter);
router.use('/chat/sessions', apiLimiter);
router.use('/chat/sessions', chatSessionsRouter);
router.use('/studio', apiLimiter);
router.use('/studio', studioRouter);

// ============================================
// MEDIA & UPLOADS ROUTES
// ============================================
router.use('/media', apiLimiter);
router.use('/media', mediaRouter);
router.use('/uploads', apiLimiter);
router.use('/uploads', uploadsRouter);

// ============================================
// AI CORE & MARKETPLACE ROUTES
// ============================================
router.use('/ai-core', apiLimiter);
router.use('/ai-core', aiCoreRouter);
router.use('/marketplace', apiLimiter);
router.use('/marketplace', marketplaceRouter);



// ============================================
// BUSINESS ROUTES
// ============================================
router.use('/analytics', apiLimiter);
router.use('/analytics', analyticsRouter);
router.use('/billing', apiLimiter);
router.use('/billing', billingRouter);
router.use('/stripe', apiLimiter);
router.use('/stripe', stripeRouter);
router.use('/gamification', apiLimiter);
router.use('/gamification', gamificationRouter);
router.use('/favorites', apiLimiter);
router.use('/favorites', favoritesRouter);
router.use('/newsletter', apiLimiter);
router.use('/newsletter', newsletterRouter);
router.use('/careers', apiLimiter);
router.use('/careers', careersRouter);
router.use('/webinars', apiLimiter);
router.use('/webinars', webinarsRouter);
router.use('/jobs', apiLimiter);
router.use('/jobs', jobsRouter);
router.use('/subscriptions', apiLimiter);
router.use('/subscriptions', agentSubscriptionsRouter);

// ============================================
// VIDEO GENERATION (RunwayML)
// ============================================
router.use('/video', apiLimiter);
router.use('/video', videoRouter);

// ============================================
// ELEVENLABS TTS — POST /api/tts/speak
// Body: { text, voice_id? }
// Returns: audio/mpeg stream
// ============================================
router.post('/tts/speak', apiLimiter, async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ success: false, error: 'ElevenLabs API key not configured' });
  }

  const { text, voice_id = 'EXAVITQu4vr4xnSDxMaL' } = req.body; // default: Rachel
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'text is required' });
  }
  if (text.length > 5000) {
    return res.status(400).json({ success: false, error: 'text too long (max 5000 chars)' });
  }
  // Sanitize voice_id — alphanumeric + hyphens only
  if (!/^[a-zA-Z0-9\-_]{1,50}$/.test(voice_id)) {
    return res.status(400).json({ success: false, error: 'invalid voice_id' });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[TTS] ElevenLabs error:', err);
      return res.status(response.status).json({ success: false, error: 'TTS generation failed' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    response.body.pipe(res);
  } catch (err) {
    console.error('[TTS] Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================
router.use('/admin/dashboard', apiLimiter);
router.use('/admin/dashboard', adminDashboardRouter);
router.use('/admin/analytics', apiLimiter);
router.use('/admin/analytics', adminAnalyticsRouter);

// Device tracking — public registration/ping + admin routes
router.use('/tracking', deviceTrackingRouter);
router.use('/admin/tracking', deviceTrackingRouter);

// Email tracking — public pixel + admin dashboard
router.use('/email-tracking', emailTrackingPixelRouter);
router.use('/admin/email-tracking', apiLimiter);
router.use('/admin/email-tracking', emailTrackingAdminRouter);

// Support tickets — admin dashboard
router.use('/admin/support-tickets', apiLimiter);
router.use('/admin/support-tickets', adminSupportTicketsRouter);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for API routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
router.use((error, req, res, _next) => {
  console.error('API Error:', error);

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  // Handle JWT errors
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

  // Handle Prisma/database errors
  if (
    error.name === 'PrismaClientKnownRequestError' ||
    error.name === 'PrismaClientValidationError'
  ) {
    return res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

export default router;
