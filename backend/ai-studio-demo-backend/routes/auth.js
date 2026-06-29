/**
 * AUTHENTICATION ROUTES
 * Backend implementation for user authentication
 * Handles login, signup, logout, password reset, 2FA, etc.
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { TOTP } from 'otplib';
import { prisma } from '../lib/prisma.js';
import { ADMIN_EMAILS } from '../lib/auth-middleware.js';
import { checkLockout, recordFailedAttempt, recordSuccessfulAuth } from '../lib/auth-lockout.js';
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendLoginOtpEmail,
  sendLoginAlertEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  parseLoginDetailsAsync,
  notifyAdminNewUser,
} from '../services/email.js';

// JWT secret for neural_link_session cookie — no fallback, must be set in environment
// JWT secret — read lazily to avoid ESM import-order timing issues with dotenv
function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET;
}

const router = express.Router();

// Helper: set session cookies for cross-subdomain sharing
// userData: { userId, email } — used to generate JWT for neural_link_session
function setSessionCookies(res, req, sessionId, userData = {}) {
  const isProduction = req.headers['x-forwarded-proto'] === 'https' ||
                      req.get('host')?.includes('mumtaz.ai');
  const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;

  // Clear any existing session cookies first (both domain-scoped and hostname-scoped)
  res.clearCookie('session_id', { path: '/', domain: cookieDomain });
  res.clearCookie('sessionId', { path: '/', domain: cookieDomain });
  res.clearCookie('neural_link_session', { path: '/', domain: cookieDomain });
  res.clearCookie('neural_token', { path: '/', domain: cookieDomain });
  // Also clear hostname-scoped cookies (set without domain by frontend proxy)
  if (cookieDomain) {
    res.clearCookie('session_id', { path: '/' });
    res.clearCookie('sessionId', { path: '/' });
    res.clearCookie('neural_link_session', { path: '/' });
    res.clearCookie('neural_token', { path: '/' });
  }

  const cookieOpts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    domain: cookieDomain,
  };

  res.cookie('session_id', sessionId, cookieOpts);
  res.cookie('sessionId', sessionId, cookieOpts);

  // neural_link_session — JWT auth token (7 day expiry, matches session)
  if (userData.userId) {
    const neuralToken = jwt.sign(
      {
        userId: userData.userId,
        sessionId,
        email: userData.email || '',
        iat: Math.floor(Date.now() / 1000),
      },
      getJwtSecret(),
      { expiresIn: '7d', algorithm: 'HS256' }
    );
    res.cookie('neural_link_session', neuralToken, cookieOpts);
  }

  // neural_token — backup auth token (session-level, no maxAge = browser session)
  const backupToken = crypto.randomBytes(24).toString('hex');
  res.cookie('neural_token', backupToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain,
    // No maxAge — session cookie, expires when browser closes
  });
}

// Helper: clear session cookies
function clearSessionCookies(res, req) {
  const isProduction = req.headers['x-forwarded-proto'] === 'https' ||
                      req.get('host')?.includes('mumtaz.ai');
  const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;

  res.clearCookie('session_id', { path: '/', domain: cookieDomain });
  res.clearCookie('sessionId', { path: '/', domain: cookieDomain });
  res.clearCookie('neural_link_session', { path: '/', domain: cookieDomain });
  res.clearCookie('neural_token', { path: '/', domain: cookieDomain });
  // Also clear hostname-scoped cookies (set without domain by frontend proxy)
  if (cookieDomain) {
    res.clearCookie('session_id', { path: '/' });
    res.clearCookie('sessionId', { path: '/' });
    res.clearCookie('neural_link_session', { path: '/' });
    res.clearCookie('neural_token', { path: '/' });
  }
}

// Helper: resolve session ID from cookies (handles duplicates)
function resolveSessionId(req) {
  let sessionId = req.cookies?.sessionId || req.cookies?.session_id;

  const rawCookie = req.headers.cookie || '';
  const sessionIdMatches = rawCookie.match(/sessionId=([^;]+)/g);
  const session_idMatches = rawCookie.match(/session_id=([^;]+)/g);

  if (sessionIdMatches && sessionIdMatches.length > 1) {
    sessionId = sessionIdMatches[sessionIdMatches.length - 1].split('=')[1];
  } else if (session_idMatches && session_idMatches.length > 1) {
    sessionId = session_idMatches[session_idMatches.length - 1].split('=')[1];
  }

  return sessionId;
}

// =====================================================
// LOGIN ENDPOINT
// =====================================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check if this email is locked out
    const lockStatus = await checkLockout(email);
    if (lockStatus.locked) {
      return res.status(423).json({
        success: false,
        message: lockStatus.message,
        locked: true,
        tier: lockStatus.tier,
        retryAfter: lockStatus.retryAfter,
      });
    }

    // Find user by email using Prisma
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      const lockResult = await recordFailedAttempt(email, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        ...(lockResult.attemptsRemaining !== undefined ? { attemptsRemaining: lockResult.attemptsRemaining } : {}),
        ...(lockResult.locked ? { locked: true, lockMessage: lockResult.message } : {}),
      });
    }

    // Check password
    const isPasswordValid = user.password
      ? await bcrypt.compare(password, user.password)
      : false;
    if (!isPasswordValid) {
      const lockResult = await recordFailedAttempt(email, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        ...(lockResult.attemptsRemaining !== undefined ? { attemptsRemaining: lockResult.attemptsRemaining } : {}),
        ...(lockResult.locked ? { locked: true, lockMessage: lockResult.message } : {}),
      });
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      const tempToken = crypto.randomBytes(32).toString('hex');
      const tempTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: { tempToken, tempTokenExpiry },
      });

      return res.json({
        success: true,
        requires2FA: true,
        tempToken,
        userId: user.id,
        message: '2FA verification required',
      });
    }

    // No 2FA — require email OTP verification
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempToken = crypto.randomBytes(32).toString('hex');
    const tempTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        tempToken,
        tempTokenExpiry,
        emailVerificationCode: otpCode,
        emailVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send login OTP email (non-blocking)
    sendLoginOtpEmail(user.email, user.name, otpCode).catch(err =>
      console.error('[EMAIL] Login OTP failed:', err.message)
    );

    // Successful password — reset lockout
    await recordSuccessfulAuth(email);

    return res.json({
      success: true,
      requiresEmailOTP: true,
      tempToken,
      userId: user.id,
      message: 'Email verification code sent. Check your inbox.',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// =====================================================
// SIGNUP ENDPOINT
// =====================================================

router.post('/signup', async (req, res) => {
  try {
    const { email, name, password, authMethod } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check if this email is locked out
    const lockStatus = await checkLockout(email);
    if (lockStatus.locked) {
      return res.status(423).json({
        success: false,
        message: lockStatus.message,
        locked: true,
        tier: lockStatus.tier,
        retryAfter: lockStatus.retryAfter,
      });
    }

    // Block reserved admin emails from public signup
    if (ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
      return res.status(409).json({
        success: false,
        message: 'This email address is reserved and cannot be used for signup.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        password: hashedPassword,
        authMethod: authMethod || 'password',
      }
    });

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Generate session for auto-login after signup
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update user with session + verification code
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        sessionId,
        sessionExpiry,
        lastLoginAt: new Date(),
        emailVerificationCode: verificationCode,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    setSessionCookies(res, req, sessionId, { userId: user.id, email: user.email });

    // Successful signup — reset any lockout
    await recordSuccessfulAuth(email);

    // Send verification code only (welcome email sent on first login)
    sendVerificationEmail(user.email, user.name || name, verificationCode).catch(err =>
      console.error('[EMAIL] Verification email failed:', err.message)
    );
    notifyAdminNewUser({ name: user.name || name, email: user.email }).catch(err =>
      console.error('[EMAIL] Admin new user notification failed:', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        authMethod: updatedUser.authMethod,
        createdAt: updatedUser.createdAt,
        lastLoginAt: updatedUser.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// =====================================================
// LOGOUT ENDPOINT
// =====================================================

router.post('/logout', async (req, res) => {
  try {
    const sessionId = resolveSessionId(req);

    // Clear server-side session
    if (sessionId) {
      const user = await prisma.user.findFirst({ where: { sessionId } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { sessionId: null, sessionExpiry: null },
        });
      }
    }

    clearSessionCookies(res, req);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    clearSessionCookies(res, req);
    res.json({ success: true });
  }
});

// =====================================================
// VERIFY 2FA DURING LOGIN
// =====================================================

router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, userId, code, isBackupCode } = req.body;

    if (!tempToken || !userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Token, user ID, and verification code are required',
      });
    }

    if (!isBackupCode && (code.length !== 6 || !/^\d+$/.test(code))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code format',
      });
    }

    // Find user with valid temp token
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tempToken,
        tempTokenExpiry: { gt: new Date() },
      },
      include: { security: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification session. Please login again.',
      });
    }

    let isValid = false;

    if (isBackupCode) {
      const backupCodes = user.backupCodes || [];
      const cleanCode = code.trim().toUpperCase();
      const codeIndex = backupCodes.findIndex(bc => bc.toUpperCase() === cleanCode);

      if (codeIndex !== -1) {
        isValid = true;
        const updatedCodes = [...backupCodes];
        updatedCodes.splice(codeIndex, 1);

        await prisma.user.update({
          where: { id: user.id },
          data: { backupCodes: updatedCodes },
        });
      }
    } else {
      // TOTP verification
      const twoFactorSecret = user.twoFactorSecret;

      if (!twoFactorSecret) {
        return res.status(400).json({
          success: false,
          message: '2FA is not properly configured. Please re-enable 2FA from security settings.',
        });
      }

      const totp = new TOTP();
      totp.options = { window: 2 };

      isValid = totp.verify({ token: code, secret: twoFactorSecret });
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code. Please try again.',
      });
    }

    // 2FA verified — create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        sessionId,
        sessionExpiry,
        lastLoginAt: new Date(),
        tempToken: null,
        tempTokenExpiry: null,
      },
    });

    setSessionCookies(res, req, sessionId, { userId: user.id, email: user.email });

    // Send login alert after 2FA verification (non-blocking)
    parseLoginDetailsAsync(req).then(loginDetails =>
      sendLoginAlertEmail(user.email, user.name, loginDetails)
    ).catch(err => console.error('[EMAIL] Login alert (2FA) failed:', err.message));

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA code',
    });
  }
});

// =====================================================
// VERIFY EMAIL OTP DURING LOGIN (for users without 2FA)
// =====================================================

router.post('/verify-login-otp', async (req, res) => {
  try {
    const { tempToken, userId, code } = req.body;

    if (!tempToken || !userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Token, user ID, and verification code are required',
      });
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code format',
      });
    }

    // Find user with valid temp token
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tempToken,
        tempTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification session. Please login again.',
      });
    }

    // Verify the email OTP code
    if (
      user.emailVerificationCode !== code ||
      !user.emailVerificationExpiry ||
      new Date(user.emailVerificationExpiry) < new Date()
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification code. Please try again or request a new code.',
      });
    }

    // Email OTP verified — create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        sessionId,
        sessionExpiry,
        lastLoginAt: new Date(),
        tempToken: null,
        tempTokenExpiry: null,
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      },
    });

    setSessionCookies(res, req, sessionId, { userId: user.id, email: user.email });

    // Send login alert email (non-blocking)
    parseLoginDetailsAsync(req).then(loginDetails =>
      sendLoginAlertEmail(user.email, user.name, loginDetails)
    ).catch(err => console.error('[EMAIL] Login alert (OTP) failed:', err.message));

    // Send welcome email on first ever login
    const timeSinceCreation = Date.now() - new Date(user.createdAt).getTime();
    if (timeSinceCreation < 24 * 60 * 60 * 1000 && (!user.lastLoginAt || new Date(user.lastLoginAt).getTime() === new Date(user.createdAt).getTime())) {
      sendWelcomeEmail(user.email, user.name).catch(err =>
        console.error('[EMAIL] Welcome email failed:', err.message)
      );
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        authMethod: user.authMethod,
        createdAt: user.createdAt,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Login OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify login code',
    });
  }
});

// =====================================================
// RESEND LOGIN OTP
// =====================================================

router.post('/resend-login-otp', async (req, res) => {
  try {
    const { tempToken, userId } = req.body;

    if (!tempToken || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Token and user ID are required',
      });
    }

    // Find user with valid temp token
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tempToken,
        tempTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please login again.',
      });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: otpCode,
        emailVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send new login OTP email
    sendLoginOtpEmail(user.email, user.name, otpCode).catch(err =>
      console.error('[EMAIL] Resend login OTP failed:', err.message)
    );

    res.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error) {
    console.error('Resend login OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code',
    });
  }
});

// =====================================================
// GET SESSION ENDPOINT
// =====================================================

router.get('/session', async (req, res) => {
  try {
    const sessionId = resolveSessionId(req);

    if (!sessionId) {
      return res.json({ success: true, user: null });
    }

    const user = await prisma.user.findFirst({
      where: {
        sessionId,
        sessionExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      clearSessionCookies(res, req);
      return res.json({ success: true, user: null });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        authMethod: user.authMethod,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    res.json({ success: true, user: null });
  }
});

// =====================================================
// VERIFY AUTH ENDPOINT (alias with { valid } field)
// Used by frontend AuthContext, secure-auth-storage
// =====================================================

const handleAuthVerify = async (req, res) => {
  try {
    const sessionId = resolveSessionId(req);

    if (!sessionId) {
      return res.json({ valid: false, success: true, user: null });
    }

    const user = await prisma.user.findFirst({
      where: {
        sessionId,
        sessionExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      clearSessionCookies(res, req);
      return res.json({ valid: false, success: true, user: null });
    }

    res.json({
      valid: true,
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    res.json({ valid: false, success: false, user: null });
  }
};

router.get('/verify', handleAuthVerify);
router.post('/verify', handleAuthVerify);

// =====================================================
// ADMIN ACCESS — CHECK IF CURRENT USER CAN ACCESS ADMIN
// Returns whether the logged-in user is on the admin allow-list
// and whether they have 2FA enabled (so frontend knows which form to show)
// =====================================================

router.post('/admin/check', async (req, res) => {
  try {
    const sessionId = resolveSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ success: false, message: 'Not signed in' });
    }

    const user = await prisma.user.findFirst({
      where: { sessionId, sessionExpiry: { gt: new Date() } },
      select: { id: true, email: true, name: true, twoFactorEnabled: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    }

    // Check email allow-list
    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'This account does not have admin access.',
      });
    }

    // Check if they already have a valid admin access token
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { adminAccessToken: true, adminAccessExpiry: true },
    });

    const hasValidAdminSession =
      fullUser?.adminAccessToken &&
      fullUser?.adminAccessExpiry &&
      fullUser.adminAccessExpiry > new Date() &&
      req.cookies?.admin_access === fullUser.adminAccessToken;

    res.json({
      success: true,
      allowed: true,
      user: { id: user.id, email: user.email, name: user.name },
      twoFactorEnabled: user.twoFactorEnabled,
      alreadyVerified: hasValidAdminSession,
    });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// =====================================================
// ADMIN ACCESS — VERIFY PASSWORD + OPTIONAL 2FA
// Sets admin_access cookie valid for 4 hours
// =====================================================

router.post('/admin/verify-access', async (req, res) => {
  try {
    const { password, totpCode } = req.body;
    const sessionId = resolveSessionId(req);

    if (!sessionId) {
      return res.status(401).json({ success: false, message: 'Not signed in' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    // Find the logged-in user
    const user = await prisma.user.findFirst({
      where: { sessionId, sessionExpiry: { gt: new Date() } },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    }

    // Check email allow-list
    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return res.status(403).json({ success: false, message: 'This account does not have admin access.' });
    }

    // Verify password
    const isPasswordValid = user.password
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    // If 2FA is enabled, verify TOTP code
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return res.status(400).json({
          success: false,
          message: '2FA code is required.',
          requires2FA: true,
        });
      }

      const twoFactorSecret = user.twoFactorSecret;
      if (!twoFactorSecret) {
        return res.status(400).json({
          success: false,
          message: '2FA is not properly configured. Please re-enable from security settings.',
        });
      }

      const totp = new TOTP();
      totp.options = { window: 2 };
      const isValidTotp = totp.verify({ token: totpCode, secret: twoFactorSecret });

      if (!isValidTotp) {
        // Check backup codes as fallback
        const backupCodes = user.backupCodes || [];
        const cleanCode = totpCode.trim().toUpperCase();
        const codeIndex = backupCodes.findIndex((bc) => bc.toUpperCase() === cleanCode);

        if (codeIndex === -1) {
          return res.status(401).json({ success: false, message: 'Invalid 2FA code.' });
        }

        // Consume the backup code
        const updatedCodes = [...backupCodes];
        updatedCodes.splice(codeIndex, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: { backupCodes: updatedCodes },
        });
      }
    }

    // Generate admin access token — valid for 4 hours
    const adminAccessToken = crypto.randomBytes(32).toString('hex');
    const adminAccessExpiry = new Date(Date.now() + 4 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { adminAccessToken, adminAccessExpiry },
    });

    // Set admin_access cookie
    const isProduction =
      req.headers['x-forwarded-proto'] === 'https' ||
      req.get('host')?.includes('mumtaz.ai');
    const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;

    res.cookie('admin_access', adminAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
      path: '/',
      domain: cookieDomain,
    });

    res.json({
      success: true,
      message: 'Admin access granted.',
      expiresAt: adminAccessExpiry.toISOString(),
    });
  } catch (error) {
    console.error('Admin verify-access error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// =====================================================
// ADMIN ACCESS — LOGOUT (clear admin_access cookie)
// =====================================================

router.post('/admin/logout', async (req, res) => {
  try {
    const sessionId = resolveSessionId(req);
    if (sessionId) {
      const user = await prisma.user.findFirst({ where: { sessionId } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { adminAccessToken: null, adminAccessExpiry: null },
        });
      }
    }

    const isProduction =
      req.headers['x-forwarded-proto'] === 'https' ||
      req.get('host')?.includes('mumtaz.ai');
    const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;

    res.clearCookie('admin_access', { path: '/', domain: cookieDomain });
    res.json({ success: true, message: 'Admin session ended.' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.json({ success: true });
  }
});

// =====================================================
// GOOGLE OAUTH — INITIATE
// =====================================================

router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ success: false, message: 'Google OAuth is not configured' });
  }

  const redirectUri = `${process.env.NEXTAUTH_URL || 'https://mumtaz.ai'}/api/auth/google/callback`;
  const state = crypto.randomBytes(16).toString('hex');

  // Store state in a short-lived cookie for CSRF protection
  const isProduction = req.headers['x-forwarded-proto'] === 'https' || req.get('host')?.includes('mumtaz.ai');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
    path: '/',
    domain: isProduction ? '.mumtaz.ai' : undefined,
  });

  // Preserve ?redirect= param through OAuth flow
  const redirect = req.query.redirect || '/dashboard/overview';
  res.cookie('oauth_redirect', redirect, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
    domain: isProduction ? '.mumtaz.ai' : undefined,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// =====================================================
// GOOGLE OAUTH — CALLBACK
// =====================================================

router.get('/google/callback', async (req, res) => {
  const BASE_URL = process.env.NEXTAUTH_URL || 'https://mumtaz.ai';

  try {
    const { code, state } = req.query;

    // Verify CSRF state
    const storedState = req.cookies?.oauth_state;
    if (!state || !storedState || state !== storedState) {
      console.error('Google OAuth: State mismatch', { received: state, stored: storedState });
      return res.redirect(`${BASE_URL}/auth/login?error=invalid_state`);
    }

    if (!code) {
      return res.redirect(`${BASE_URL}/auth/login?error=no_code`);
    }

    const redirectUri = `${BASE_URL}/api/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Google OAuth token error:', tokenData);
      return res.redirect(`${BASE_URL}/auth/login?error=token_exchange_failed`);
    }

    // Fetch Google user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();

    if (!profile.email) {
      return res.redirect(`${BASE_URL}/auth/login?error=no_email`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
    });

    let isNewUser = false;
    if (user) {
      // Existing user — update profile info from Google if missing
      const updates = {};
      if (!user.name && profile.name) updates.name = profile.name;
      if (!user.image && profile.picture) updates.image = profile.picture;
      if (!user.avatar && profile.picture) updates.avatar = profile.picture;
      if (!user.emailVerified) updates.emailVerified = new Date();
      // Only update authMethod if they originally signed up with Google
      // or if they have no password (pure OAuth user)
      if (!user.password) updates.authMethod = 'google';

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    } else {
      // New user — create account
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email: profile.email.toLowerCase(),
          name: profile.name || profile.email.split('@')[0],
          image: profile.picture || null,
          avatar: profile.picture || null,
          authMethod: 'google',
          emailVerified: new Date(),
          // No password — OAuth-only user
        },
      });
    }

    // Generate session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { sessionId, sessionExpiry, lastLoginAt: new Date() },
    });

    // Set session cookies
    setSessionCookies(res, req, sessionId, { userId: user.id, email: user.email });

    // Clear OAuth-specific cookies
    const isProduction = req.headers['x-forwarded-proto'] === 'https' || req.get('host')?.includes('mumtaz.ai');
    const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;
    res.clearCookie('oauth_state', { path: '/', domain: cookieDomain });

    // Redirect to the intended destination
    const redirectTo = req.cookies?.oauth_redirect || '/dashboard/overview';
    res.clearCookie('oauth_redirect', { path: '/', domain: cookieDomain });

    console.log(`✅ Google OAuth: ${user.email} logged in (${user.id})`);

    // Send login alert (and welcome if new user) — non-blocking
    parseLoginDetailsAsync(req).then(loginDetails =>
      sendLoginAlertEmail(user.email, user.name, loginDetails)
    ).catch(() => {});
    if (isNewUser) {
      sendWelcomeEmail(user.email, user.name).catch(() => {});
      notifyAdminNewUser({ name: user.name, email: user.email }).catch(() => {});
    }
    
    res.redirect(redirectTo.startsWith('/') ? `${BASE_URL}${redirectTo}` : redirectTo);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${BASE_URL}/auth/login?error=oauth_failed`);
  }
});

// =====================================================
// GITHUB OAUTH — INITIATE
// =====================================================

router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ success: false, message: 'GitHub OAuth is not configured' });
  }

  const redirectUri = `${process.env.NEXTAUTH_URL || 'https://mumtaz.ai'}/api/auth/github/callback`;
  const state = crypto.randomBytes(16).toString('hex');

  const isProduction = req.headers['x-forwarded-proto'] === 'https' || req.get('host')?.includes('mumtaz.ai');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
    domain: isProduction ? '.mumtaz.ai' : undefined,
  });

  const redirect = req.query.redirect || '/dashboard/overview';
  res.cookie('oauth_redirect', redirect, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
    domain: isProduction ? '.mumtaz.ai' : undefined,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user:email read:user',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// =====================================================
// GITHUB OAUTH — CALLBACK
// =====================================================

router.get('/github/callback', async (req, res) => {
  const BASE_URL = process.env.NEXTAUTH_URL || 'https://mumtaz.ai';

  try {
    const { code, state } = req.query;

    // Verify CSRF state
    const storedState = req.cookies?.oauth_state;
    if (!state || !storedState || state !== storedState) {
      console.error('GitHub OAuth: State mismatch', { received: state, stored: storedState });
      return res.redirect(`${BASE_URL}/auth/login?error=invalid_state`);
    }

    if (!code) {
      return res.redirect(`${BASE_URL}/auth/login?error=no_code`);
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${BASE_URL}/api/auth/github/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth token error:', tokenData);
      return res.redirect(`${BASE_URL}/auth/login?error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;

    // Fetch GitHub user profile
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'MumtazAI',
      },
    });

    const profile = await profileResponse.json();

    // GitHub may not return email in profile if it's private — fetch emails separately
    let email = profile.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'MumtazAI',
        },
      });
      const emails = await emailsResponse.json();
      // Prefer primary verified email
      const primaryEmail = emails.find((e) => e.primary && e.verified);
      const verifiedEmail = emails.find((e) => e.verified);
      email = primaryEmail?.email || verifiedEmail?.email || emails[0]?.email;
    }

    if (!email) {
      return res.redirect(`${BASE_URL}/auth/login?error=no_email`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    let isNewUser = false;
    if (user) {
      // Existing user — update profile from GitHub if missing
      const updates = {};
      if (!user.name && profile.name) updates.name = profile.name;
      if (!user.image && profile.avatar_url) updates.image = profile.avatar_url;
      if (!user.avatar && profile.avatar_url) updates.avatar = profile.avatar_url;
      if (!user.emailVerified) updates.emailVerified = new Date();
      if (!user.password) updates.authMethod = 'github';

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    } else {
      // New user — create account
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: profile.name || profile.login || email.split('@')[0],
          image: profile.avatar_url || null,
          avatar: profile.avatar_url || null,
          authMethod: 'github',
          emailVerified: new Date(),
        },
      });
    }

    // Generate session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { sessionId, sessionExpiry, lastLoginAt: new Date() },
    });

    // Set session cookies
    setSessionCookies(res, req, sessionId, { userId: user.id, email: user.email });

    // Clear OAuth-specific cookies
    const isProduction = req.headers['x-forwarded-proto'] === 'https' || req.get('host')?.includes('mumtaz.ai');
    const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;
    res.clearCookie('oauth_state', { path: '/', domain: cookieDomain });

    const redirectTo = req.cookies?.oauth_redirect || '/dashboard/overview';
    res.clearCookie('oauth_redirect', { path: '/', domain: cookieDomain });

    console.log(`✅ GitHub OAuth: ${user.email} logged in (${user.id})`);

    // Send login alert (and welcome if new user) — non-blocking
    parseLoginDetailsAsync(req).then(loginDetails =>
      sendLoginAlertEmail(user.email, user.name, loginDetails)
    ).catch(() => {});
    if (isNewUser) {
      sendWelcomeEmail(user.email, user.name).catch(() => {});
      notifyAdminNewUser({ name: user.name, email: user.email }).catch(() => {});
    }

    res.redirect(redirectTo.startsWith('/') ? `${BASE_URL}${redirectTo}` : redirectTo);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.redirect(`${BASE_URL}/auth/login?error=oauth_failed`);
  }
});

// =====================================================
// YAHOO OAUTH — INITIATE
// =====================================================

router.get('/yahoo', (req, res) => {
  const clientId = process.env.YAHOO_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ success: false, message: 'Yahoo OAuth is not configured' });
  }

  const redirectUri = `${process.env.NEXTAUTH_URL || 'https://mumtaz.ai'}/api/auth/yahoo/callback`;
  const state = crypto.randomBytes(16).toString('hex');

  const isProduction = req.headers['x-forwarded-proto'] === 'https' || req.get('host')?.includes('mumtaz.ai');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
    domain: isProduction ? '.mumtaz.ai' : undefined,
  });

  const redirect = req.query.redirect || '/dashboard/overview';
  res.cookie('oauth_redirect', redirect, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
    domain: isProduction ? '.mumtaz.ai' : undefined,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });

  res.redirect(`https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`);
});

// =====================================================
// YAHOO OAUTH — CALLBACK
// =====================================================

router.get('/yahoo/callback', async (req, res) => {
  const BASE_URL = process.env.NEXTAUTH_URL || 'https://mumtaz.ai';

  try {
    const { code, state } = req.query;

    // Verify CSRF state
    const storedState = req.cookies?.oauth_state;
    if (!state || !storedState || state !== storedState) {
      console.error('Yahoo OAuth: State mismatch', { received: state, stored: storedState });
      return res.redirect(`${BASE_URL}/auth/login?error=invalid_state`);
    }

    if (!code) {
      return res.redirect(`${BASE_URL}/auth/login?error=no_code`);
    }

    const redirectUri = `${BASE_URL}/api/auth/yahoo/callback`;

    // Yahoo requires Basic auth header for token exchange
    const credentials = Buffer.from(
      `${process.env.YAHOO_CLIENT_ID}:${process.env.YAHOO_CLIENT_SECRET}`
    ).toString('base64');

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Yahoo OAuth token error:', tokenData);
      return res.redirect(`${BASE_URL}/auth/login?error=token_exchange_failed`);
    }

    // Fetch Yahoo user profile via OpenID Connect userinfo endpoint
    const profileResponse = await fetch('https://api.login.yahoo.com/openid/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();

    const email = profile.email;
    if (!email) {
      return res.redirect(`${BASE_URL}/auth/login?error=no_email`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    let isNewUser = false;
    if (user) {
      const updates = {};
      if (!user.name && profile.name) updates.name = profile.name;
      if (!user.image && profile.picture) updates.image = profile.picture;
      if (!user.avatar && profile.picture) updates.avatar = profile.picture;
      if (!user.emailVerified) updates.emailVerified = new Date();
      if (!user.password) updates.authMethod = 'yahoo';

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    } else {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: profile.name || profile.given_name || email.split('@')[0],
          image: profile.picture || null,
          avatar: profile.picture || null,
          authMethod: 'yahoo',
          emailVerified: new Date(),
        },
      });
    }

    // Generate session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { sessionId, sessionExpiry, lastLoginAt: new Date() },
    });

    setSessionCookies(res, req, sessionId, { userId: user.id, email: user.email });

    // Clear OAuth-specific cookies
    const isProduction = req.headers['x-forwarded-proto'] === 'https' || req.get('host')?.includes('mumtaz.ai');
    const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;
    res.clearCookie('oauth_state', { path: '/', domain: cookieDomain });

    const redirectTo = req.cookies?.oauth_redirect || '/dashboard/overview';
    res.clearCookie('oauth_redirect', { path: '/', domain: cookieDomain });

    console.log(`✅ Yahoo OAuth: ${user.email} logged in (${user.id})`);

    // Send login alert (and welcome if new user) — non-blocking
    parseLoginDetailsAsync(req).then(loginDetails =>
      sendLoginAlertEmail(user.email, user.name, loginDetails)
    ).catch(() => {});
    if (isNewUser) {
      sendWelcomeEmail(user.email, user.name).catch(() => {});
      notifyAdminNewUser({ name: user.name, email: user.email }).catch(() => {});
    }

    res.redirect(redirectTo.startsWith('/') ? `${BASE_URL}${redirectTo}` : redirectTo);
  } catch (error) {
    console.error('Yahoo OAuth callback error:', error);
    res.redirect(`${BASE_URL}/auth/login?error=oauth_failed`);
  }
});

// =====================================================
// MICROSOFT OAUTH — INITIATE
// =====================================================

router.get('/microsoft', (req, res) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ success: false, message: 'Microsoft OAuth is not configured' });
  }

  const redirectUri = `${process.env.NEXTAUTH_URL || 'https://mumtaz.ai'}/api/auth/microsoft/callback`;
  const state = crypto.randomBytes(16).toString('hex');

  const isProduction = req.headers['x-forwarded-proto'] === 'https' || req.get('host')?.includes('mumtaz.ai');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
    domain: isProduction ? '.mumtaz.ai' : undefined,
  });

  const redirect = req.query.redirect || '/dashboard/overview';
  res.cookie('oauth_redirect', redirect, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
    domain: isProduction ? '.mumtaz.ai' : undefined,
  });

  // Microsoft uses "common" tenant for personal + work accounts
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile User.Read',
    state,
    response_mode: 'query',
  });

  res.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`);
});

// =====================================================
// MICROSOFT OAUTH — CALLBACK
// =====================================================

router.get('/microsoft/callback', async (req, res) => {
  const BASE_URL = process.env.NEXTAUTH_URL || 'https://mumtaz.ai';

  try {
    const { code, state } = req.query;

    // Verify CSRF state
    const storedState = req.cookies?.oauth_state;
    if (!state || !storedState || state !== storedState) {
      console.error('Microsoft OAuth: State mismatch', { received: state, stored: storedState });
      return res.redirect(`${BASE_URL}/auth/login?error=invalid_state`);
    }

    if (!code) {
      return res.redirect(`${BASE_URL}/auth/login?error=no_code`);
    }

    const redirectUri = `${BASE_URL}/api/auth/microsoft/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'openid email profile User.Read',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Microsoft OAuth token error:', tokenData);
      return res.redirect(`${BASE_URL}/auth/login?error=token_exchange_failed`);
    }

    // Fetch Microsoft user profile via Graph API
    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();

    // Microsoft Graph returns email in 'mail' or 'userPrincipalName'
    const email = profile.mail || profile.userPrincipalName;
    if (!email) {
      return res.redirect(`${BASE_URL}/auth/login?error=no_email`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    let isNewUser = false;
    if (user) {
      const updates = {};
      if (!user.name && profile.displayName) updates.name = profile.displayName;
      if (!user.emailVerified) updates.emailVerified = new Date();
      if (!user.password) updates.authMethod = 'microsoft';

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    } else {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: profile.displayName || profile.givenName || email.split('@')[0],
          authMethod: 'microsoft',
          emailVerified: new Date(),
        },
      });
    }

    // Generate session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { sessionId, sessionExpiry, lastLoginAt: new Date() },
    });

    setSessionCookies(res, req, sessionId, { userId: user.id, email: user.email });

    // Clear OAuth-specific cookies
    const isProduction = req.headers['x-forwarded-proto'] === 'https' || req.get('host')?.includes('mumtaz.ai');
    const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;
    res.clearCookie('oauth_state', { path: '/', domain: cookieDomain });

    const redirectTo = req.cookies?.oauth_redirect || '/dashboard/overview';
    res.clearCookie('oauth_redirect', { path: '/', domain: cookieDomain });

    console.log(`✅ Microsoft OAuth: ${user.email} logged in (${user.id})`);

    // Send login alert (and welcome if new user) — non-blocking
    parseLoginDetailsAsync(req).then(loginDetails =>
      sendLoginAlertEmail(user.email, user.name, loginDetails)
    ).catch(() => {});
    if (isNewUser) {
      sendWelcomeEmail(user.email, user.name).catch(() => {});
      notifyAdminNewUser({ name: user.name, email: user.email }).catch(() => {});
    }

    res.redirect(redirectTo.startsWith('/') ? `${BASE_URL}${redirectTo}` : redirectTo);
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    res.redirect(`${BASE_URL}/auth/login?error=oauth_failed`);
  }
});

// =====================================================
// FORGOT PASSWORD — send reset link
// =====================================================

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpiry,
        },
      });

      const BASE_URL = process.env.NEXTAUTH_URL || 'https://mumtaz.ai';
      const resetUrl = `${BASE_URL}/auth/reset-password/confirm?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

      sendPasswordResetEmail(user.email, user.name, resetUrl).catch(err =>
        console.error('[EMAIL] Password reset email failed:', err.message)
      );
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// =====================================================
// RESET PASSWORD — validate token and set new password
// =====================================================

router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ success: false, message: 'Token, email, and new password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.',
      });
    }

    // Hash new password and clear reset token
    const hashedPassword = await bcrypt.hash(password, 12);
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.socket?.remoteAddress || 'Unknown';

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        // Invalidate current session for security
        sessionId: null,
        sessionExpiry: null,
      },
    });

    // Send password changed confirmation (non-blocking)
    sendPasswordChangedEmail(user.email, user.name, { ip }).catch(err =>
      console.error('[EMAIL] Password changed alert failed:', err.message)
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// =====================================================
// VERIFY EMAIL — validate 6-digit code
// =====================================================

router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        emailVerificationCode: code.toString(),
        emailVerificationExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      },
    });

    res.json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// =====================================================
// RESEND VERIFICATION CODE
// =====================================================

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.emailVerified) {
      return res.json({ success: true, message: 'If the account exists and is unverified, a new code has been sent.' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    sendVerificationEmail(user.email, user.name, verificationCode).catch(err =>
      console.error('[EMAIL] Resend verification failed:', err.message)
    );

    res.json({ success: true, message: 'Verification code sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;