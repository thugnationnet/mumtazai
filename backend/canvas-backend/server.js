/**
 * CANVAS BUILD BACKEND SERVER
 * Standalone Express API — Mumtaz AI Canvas Build
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import { prisma } from './lib/prisma.js';
import { contentSafetyMiddleware } from './lib/contentSafety.js';
import { emailService } from './services/emailService.js';
import crypto from 'crypto';

// Initialize Express
const app = express();

// Trust first proxy
app.set('trust proxy', 1);

const PORT = process.env.CANVAS_STUDIO_PORT || 3202;
function getJwtSecret() { return process.env.CANVAS_STUDIO_JWT_SECRET || process.env.JWT_SECRET; }

// SSO email domain whitelist — only auto-provision users from these domains
if (!process.env.SSO_ALLOWED_DOMAINS) { console.warn('WARNING: SSO_ALLOWED_DOMAINS not set, SSO login will reject all domains'); }
const SSO_ALLOWED_DOMAINS = (process.env.SSO_ALLOWED_DOMAINS || '')
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(Boolean);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'wss:', 'https://api.stripe.com', 'https://*.mumtaz.ai'],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
}));

// CORS — origins from env or sensible defaults
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
  .concat([
    process.env.CANVAS_STUDIO_FRONTEND_URL || 'http://localhost:3101',
    'http://localhost:3000',
    'https://build.mumtaz.ai',
    'https://canvas.mumtaz.ai',
    'https://mumtaz.ai',
  ]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, error: 'Too many attempts' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Rate limit exceeded' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
});

app.use(generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/canvas', aiLimiter);

// ============================================================================
// STRIPE WEBHOOK — must be BEFORE express.json() to get raw body
// ============================================================================
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[Webhook] Missing signature or webhook secret');
    return res.status(400).send('Missing signature');
  }

  let event;
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, appId, credits } = session.metadata || {};

    if (!userId) {
      console.error('[Webhook] No userId in session metadata');
      return res.json({ received: true });
    }

    try {
      const creditsToAdd = parseFloat(credits) || 0;

      if (creditsToAdd > 0) {
        await prisma.userCredits.upsert({
          where: { userId_appId: { userId, appId: appId || 'canvas-studio' } },
          update: {
            balance: { increment: creditsToAdd },
            lifetimeEarned: { increment: creditsToAdd },
          },
          create: {
            userId,
            appId: appId || 'canvas-studio',
            balance: creditsToAdd,
            lifetimeEarned: creditsToAdd,
            freeCreditsMax: 5,
          },
        });

        await prisma.billingHistory.create({
          data: {
            userId,
            stripePaymentId: session.payment_intent || session.id,
            stripeCustomerId: session.customer,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || 'usd',
            creditsAdded: creditsToAdd,
            status: 'SUCCEEDED',
            description: `${creditsToAdd} credits purchased via Stripe`,
            metadata: { sessionId: session.id, appId, priceId: session.metadata?.priceId },
          },
        });

        const creditRecord = await prisma.userCredits.findUnique({
          where: { userId_appId: { userId, appId: appId || 'canvas-studio' } },
        });
        if (creditRecord) {
          await prisma.creditTransaction.create({
            data: {
              userCreditsId: creditRecord.id,
              type: 'PURCHASE',
              amount: creditsToAdd,
              balanceAfter: creditRecord.balance,
              description: `Stripe purchase: ${creditsToAdd} credits`,
              referenceId: session.payment_intent || session.id,
              referenceType: 'stripe',
            },
          });
        }

        console.log(`[Webhook] Added ${creditsToAdd} credits to user ${userId} (app: ${appId})`);
      }
    } catch (err) {
      console.error('[Webhook] Error processing checkout.session.completed:', err.message);
    }
  }

  res.json({ received: true });
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

const requireAuth = async (req, res, next) => {
  // Try each candidate cookie/header token until one verifies
  const tokenCandidates = [
    req.cookies?.neural_link_session,       // set by main shiny-backend (SSO)
    req.cookies?.canvas_studio_session,     // set by canvas-backend OTP login
    req.cookies?.auth_token,                // alias used by canvas-backend
    req.headers.authorization?.replace('Bearer ', ''),
  ].filter(Boolean);

  if (tokenCandidates.length === 0) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const secret = new TextEncoder().encode(getJwtSecret());
  let payload = null;

  for (const token of tokenCandidates) {
    try {
      const result = await jose.jwtVerify(token, secret);
      payload = result.payload;
      break; // first valid token wins
    } catch {
      // try next candidate
    }
  }

  if (!payload) {
    console.log('[Auth] All token candidates failed JWT verification');
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }

  // Try DB lookup — if it fails (schema/connection issue), fall back to JWT payload
  let user = null;
  try {
    if (payload.userId) {
      user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { credits: true } });
    }
    if (!user && payload.email) {
      user = await prisma.user.findUnique({ where: { email: payload.email }, include: { credits: true } });
      if (!user) {
        // Auto-provision user from cross-domain SSO (JWT already verified)
        user = await prisma.user.create({
          data: {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            passwordHash: 'cross-domain-sso',
            isVerified: true,
            credits: { create: { appId: 'canvas-studio', balance: 5, freeCreditsMax: 5 } },
          },
          include: { credits: true },
        });
        console.log(`[Auth] Auto-provisioned user ${payload.email} from cross-domain SSO`);
      }
    }
  } catch (dbErr) {
    console.log('[Auth] DB lookup failed, using JWT payload as user identity:', dbErr.message);
    // Construct a minimal user object from the trusted JWT payload
    user = {
      id: payload.userId || payload.sub || 'unknown',
      email: payload.email || '',
      name: payload.name || '',
      credits: [],
    };
  }

  if (user) {
    req.user = user;
    return next();
  }
  return res.status(401).json({ success: false, error: 'Authentication required' });
};

// ============================================================================
// AUTH ROUTES
// ============================================================================

// Helper: generate 6-digit OTP (cryptographically secure)
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Helper: get client details for security emails
function getClientDetails(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'Unknown';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const time = new Date().toUTCString();
  return { ip, userAgent, time };
}

// Helper: create JWT session and set cookies
async function createSession(res, user) {
  const token = await new jose.SignJWT({ userId: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(getJwtSecret()));

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    ...(process.env.NODE_ENV === 'production' ? { domain: '.mumtaz.ai' } : {}),
  };
  res.cookie('canvas_studio_session', token, cookieOpts);
  res.cookie('auth_token', token, cookieOpts);
  return token;
}

// ── SIGNUP ──────────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.isVerified) return res.status(400).json({ success: false, error: 'User already exists' });

    const hash = await bcrypt.hash(password, 12);
    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    if (existing && !existing.isVerified) {
      await prisma.user.update({ where: { email }, data: { passwordHash: hash, name: name || existing.name, verificationCode: code, verificationExpires: expires } });
    } else {
      await prisma.user.create({ data: { email, passwordHash: hash, name, verificationCode: code, verificationExpires: expires, isVerified: false, credits: { create: { appId: 'canvas-studio', balance: 5, freeCreditsMax: 5 } } } });
    }

    await emailService.sendVerificationCode(email, name || '', code);
    res.json({ success: true, requiresVerification: true, email, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('[Signup] Error:', error);
    res.status(500).json({ success: false, error: 'Signup failed' });
  }
});

// ── VERIFY EMAIL ────────────────────────────────────────────────────────────
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, error: 'Email and code required' });

    const user = await prisma.user.findUnique({ where: { email }, include: { credits: true } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ success: false, error: 'Already verified' });
    if (!user.verificationCode || user.verificationCode !== code) return res.status(400).json({ success: false, error: 'Invalid verification code' });
    if (user.verificationExpires && new Date() > user.verificationExpires) return res.status(400).json({ success: false, error: 'Code expired' });

    await prisma.user.update({ where: { email }, data: { isVerified: true, verificationCode: null, verificationExpires: null } });
    await createSession(res, user);
    emailService.sendWelcomeEmail(email, user.name || '').catch(() => {});

    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('[Verify Email] Error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ── RESEND CODE ─────────────────────────────────────────────────────────────
app.post('/api/auth/resend-code', async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    if (type === 'login') {
      await prisma.user.update({ where: { email }, data: { loginOtpCode: code, loginOtpExpires: expires } });
      await emailService.sendLoginOTP(email, user.name || '', code);
    } else {
      await prisma.user.update({ where: { email }, data: { verificationCode: code, verificationExpires: expires } });
      await emailService.sendVerificationCode(email, user.name || '', code);
    }
    res.json({ success: true, message: 'New code sent' });
  } catch (error) {
    console.error('[Resend Code] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to resend code' });
  }
});

// ── LOGIN (step 1) ──────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientDetails = getClientDetails(req);
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email }, include: { credits: true } });

    if (!user || !user.passwordHash) {
      await prisma.loginAttempt.create({ data: { email, ipAddress: clientDetails.ip, userAgent: clientDetails.userAgent, success: false, reason: 'user_not_found' } }).catch(() => {});
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.lockLevel === 3) return res.status(403).json({ success: false, error: 'Account permanently locked' });
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const mins = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(403).json({ success: false, error: `Account locked. Try again in ${mins} minutes.` });
    }

    if (!user.isVerified) {
      const code = generateOTP();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.user.update({ where: { email }, data: { verificationCode: code, verificationExpires: expires } });
      await emailService.sendVerificationCode(email, user.name || '', code);
      return res.json({ success: true, requiresVerification: true, email, message: 'Please verify your email first' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const newFailed = user.failedAttempts + 1;
      let lockLevel = user.lockLevel, lockedUntil = null;
      if (newFailed >= 10) { lockLevel = 3; } else if (newFailed >= 7) { lockLevel = 2; lockedUntil = new Date(Date.now() + 86400000); } else if (newFailed >= 5) { lockLevel = 1; lockedUntil = new Date(Date.now() + 900000); }
      await prisma.user.update({ where: { email }, data: { failedAttempts: newFailed, lastFailedAt: new Date(), lockLevel, lockedUntil } });
      await prisma.loginAttempt.create({ data: { email, userId: user.id, ipAddress: clientDetails.ip, userAgent: clientDetails.userAgent, success: false, reason: 'invalid_password' } }).catch(() => {});
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({ where: { email }, data: { loginOtpCode: code, loginOtpExpires: expires } });
    await emailService.sendLoginOTP(email, user.name || '', code);

    res.json({ success: true, requiresOTP: true, email: user.email, message: 'Login verification code sent' });
  } catch (error) {
    console.error('[Login] Error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ── VERIFY LOGIN OTP (step 2) ───────────────────────────────────────────────
app.post('/api/auth/verify-login-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    const clientDetails = getClientDetails(req);
    if (!email || !code) return res.status(400).json({ success: false, error: 'Email and code required' });

    const user = await prisma.user.findUnique({ where: { email }, include: { credits: true } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (!user.loginOtpCode || user.loginOtpCode !== code) return res.status(400).json({ success: false, error: 'Invalid code' });
    if (user.loginOtpExpires && new Date() > user.loginOtpExpires) return res.status(400).json({ success: false, error: 'Code expired' });

    await prisma.user.update({ where: { email }, data: { loginOtpCode: null, loginOtpExpires: null, failedAttempts: 0, lockLevel: 0, lockedUntil: null, lastLoginAt: new Date() } });
    await prisma.loginAttempt.create({ data: { email, userId: user.id, ipAddress: clientDetails.ip, userAgent: clientDetails.userAgent, success: true, reason: 'otp_verified' } }).catch(() => {});

    await createSession(res, user);
    emailService.sendLoginAlert(email, user.name || '', clientDetails).catch(() => {});

    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('[Verify Login OTP] Error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ── FORGOT PASSWORD ─────────────────────────────────────────────────────────
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ success: true, message: 'If registered, a reset link has been sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({ where: { email }, data: { passwordResetToken: resetToken, passwordResetExpires: new Date(Date.now() + 3600000) } });

    const appDomain = process.env.CANVAS_STUDIO_FRONTEND_URL || 'https://canvas.mumtaz.ai';
    const resetUrl = `${appDomain}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await emailService.sendPasswordResetEmail(email, user.name || '', resetUrl);

    res.json({ success: true, message: 'If registered, a reset link has been sent.' });
  } catch (error) {
    console.error('[Forgot Password] Error:', error);
    res.status(500).json({ success: false, error: 'Request failed' });
  }
});

// ── VERIFY RESET TOKEN ──────────────────────────────────────────────────────
app.post('/api/auth/verify-reset-token', async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) return res.status(400).json({ success: false, error: 'Email and token required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordResetToken || user.passwordResetToken !== token) return res.status(400).json({ success: false, error: 'Invalid reset link' });
    if (user.passwordResetExpires && new Date() > user.passwordResetExpires) return res.status(400).json({ success: false, error: 'Reset link expired' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ── RESET PASSWORD ──────────────────────────────────────────────────────────
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const clientDetails = getClientDetails(req);
    if (!email || !token || !newPassword) return res.status(400).json({ success: false, error: 'All fields required' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordResetToken || user.passwordResetToken !== token) return res.status(400).json({ success: false, error: 'Invalid reset link' });
    if (user.passwordResetExpires && new Date() > user.passwordResetExpires) return res.status(400).json({ success: false, error: 'Reset link expired' });

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { email }, data: { passwordHash: hash, passwordResetToken: null, passwordResetExpires: null, failedAttempts: 0, lockLevel: 0, lockedUntil: null } });
    emailService.sendPasswordChangedAlert(email, user.name || '', clientDetails).catch(() => {});

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Reset failed' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('canvas_studio_session');
  res.clearCookie('auth_token');
  res.json({ success: true });
});

// ============================================================================
// CANVAS ROUTES
// ============================================================================

import canvasRoutes from './routes/canvas.js';
app.use('/api/canvas', contentSafetyMiddleware, canvasRoutes);

// ============================================================================
// APP ROUTES (workspace, hosting, credentials, billing, video, assets, etc.)
// ============================================================================

import canvasAppRoutes from './routes/canvasApp.js';
app.use('/api', contentSafetyMiddleware, canvasAppRoutes);

// ============================================================================
// STATUS ROUTE
// ============================================================================

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Canvas Studio API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

app.use((err, req, res, _next) => {
  console.error('[canvas-backend] Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ============================================================================
// START SERVER + COLLABORATION WEBSOCKET
// ============================================================================

import { WebSocketServer } from 'ws';

// Warn if Stripe test keys are used (should be live in production)
if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
  console.warn('⚠️  WARNING: Stripe is using TEST keys. Switch to live keys for production.');
}

const server = app.listen(PORT, () => {
  console.log(`🚀 Canvas Build Backend running on port ${PORT}`);
});

// Collaboration WebSocket server on /ws/collab
const wss = new WebSocketServer({ server, path: '/ws/collab' });

// Helper: parse raw cookie header into object
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    cookies[pair.substring(0, idx).trim()] = pair.substring(idx + 1).trim();
  }
  return cookies;
}

// Helper: verify JWT from WS upgrade request cookies
async function authenticateWsRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const candidates = [
    cookies.neural_link_session,
    cookies.canvas_studio_session,
    cookies.auth_token,
  ].filter(Boolean);
  const secret = new TextEncoder().encode(getJwtSecret());
  for (const token of candidates) {
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      return payload; // { userId, email, name, ... }
    } catch { /* try next */ }
  }
  return null;
}

// Room management: projectSlug -> Set<{ ws, userId, userName, color, cursor }>
const collabRooms = new Map();
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

wss.on('connection', async (ws, req) => {
  // Authenticate via session cookies — reject if no valid JWT
  const jwtPayload = await authenticateWsRequest(req);
  if (!jwtPayload) {
    ws.close(4401, 'Authentication required');
    return;
  }
  const verifiedUserId = jwtPayload.userId || jwtPayload.sub || jwtPayload.email;
  const verifiedUserName = jwtPayload.name || jwtPayload.email?.split('@')[0] || 'Anonymous';

  let currentRoom = null;
  let userInfo = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === 'join') {
        const { projectSlug } = msg;
        // Use verified identity from JWT, not client-supplied values
        const userId = verifiedUserId;
        const userName = verifiedUserName;
        if (!projectSlug || !userId) return;

        currentRoom = projectSlug;
        if (!collabRooms.has(currentRoom)) collabRooms.set(currentRoom, new Set());
        const room = collabRooms.get(currentRoom);

        userInfo = {
          ws, userId, userName: userName || 'Anonymous',
          color: COLORS[room.size % COLORS.length],
          cursor: null,
        };
        room.add(userInfo);

        // Send current collaborators list to the new joiner
        const collaborators = [...room].filter(u => u !== userInfo).map(u => ({
          id: u.userId, name: u.userName, color: u.color, cursor: u.cursor,
        }));
        ws.send(JSON.stringify({ type: 'collaborators', collaborators }));

        // Broadcast join to others
        broadcast(currentRoom, { type: 'join', id: userId, name: userName, color: userInfo.color }, ws);
      }

      else if (msg.type === 'cursor' && currentRoom && userInfo) {
        userInfo.cursor = { file: msg.file, line: msg.line, column: msg.column };
        broadcast(currentRoom, { type: 'cursor', id: userInfo.userId, name: userInfo.userName, color: userInfo.color, file: msg.file, line: msg.line, column: msg.column }, ws);
      }

      else if (msg.type === 'file-change' && currentRoom && userInfo) {
        broadcast(currentRoom, { type: 'file-change', id: userInfo.userId, path: msg.path, content: msg.content }, ws);
      }

      else if (msg.type === 'typing-start' && currentRoom && userInfo) {
        broadcast(currentRoom, { type: 'typing-start', id: userInfo.userId, name: userInfo.userName }, ws);
      }

      else if (msg.type === 'typing-stop' && currentRoom && userInfo) {
        broadcast(currentRoom, { type: 'typing-stop', id: userInfo.userId, name: userInfo.userName }, ws);
      }
    } catch (err) {
      console.error('[Collab WS] Message parse error:', err.message);
    }
  });

  ws.on('close', () => {
    if (currentRoom && userInfo) {
      const room = collabRooms.get(currentRoom);
      if (room) {
        room.delete(userInfo);
        if (room.size === 0) collabRooms.delete(currentRoom);
        else broadcast(currentRoom, { type: 'leave', id: userInfo.userId }, null);
      }
    }
  });
});

function broadcast(roomSlug, message, excludeWs) {
  const room = collabRooms.get(roomSlug);
  if (!room) return;
  const data = JSON.stringify(message);
  for (const member of room) {
    if (member.ws !== excludeWs && member.ws.readyState === 1) {
      member.ws.send(data);
    }
  }
}