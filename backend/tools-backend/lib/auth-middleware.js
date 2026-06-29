/**
 * SHARED AUTH MIDDLEWARE
 * Centralized session-cookie authentication for all routes.
 *
 * Exports:
 *   requireAuth        — returns 401 if no valid session found
 *   optionalAuth       — falls back to guest identity, never rejects
 *   requireAdmin       — extends requireAuth with role === 'admin' check
 *   verifyRequestAsync — inline auth check, returns { ok, user? }
 *
 * Always sets:
 *   req.userId          — user ID or guest ID string
 *   req.isAuthenticated — boolean
 *   req.user            — { id, email, name, role } when authenticated (optional on guest)
 */

import { prisma } from './prisma.js';
import jwt from 'jsonwebtoken';

// JWT secret must match the one in auth.js — no fallback, must be set in environment
// JWT secret — read lazily to avoid ESM import-order timing issues with dotenv
function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET;
}

// Central auth backend URL (shiny-backend on port 3005 has the main user/session DB)
const AUTH_BACKEND_URL = process.env.AUTH_BACKEND_URL || process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3005';

/**
 * Extract session identifier from request.
 * Handles express-session, passport, and raw cookies (with duplicate-cookie safety).
 * @returns {{ userId?: string, sessionId?: string }} or null
 */
function extractSession(req) {
  // 1. Express-session / passport
  if (req.session?.userId) return { userId: req.session.userId };
  if (req.user?.id) return { userId: req.user.id };

  // 2. neural_link_session JWT — decode directly to userId (skip DB session lookup)
  const neuralJwt = req.cookies?.neural_link_session;
  if (neuralJwt) {
    try {
      const decoded = jwt.verify(neuralJwt, getJwtSecret(), { algorithms: ['HS256'] });
      if (decoded?.userId) {
        return { userId: decoded.userId, sessionId: decoded.sessionId };
      }
    } catch (jwtErr) {
      // JWT expired or invalid — fall through to session cookie lookup
    }
  }

  // 3. Cookie lookup — collect ALL unique session cookie values
  //    (handles cases where one cookie is stale but another is valid)
  const cookieHeader = req.headers?.cookie || '';
  const sessionIds = new Set();

  for (const cookie of cookieHeader.split(';')) {
    const eqIdx = cookie.indexOf('=');
    if (eqIdx === -1) continue;
    const name = cookie.slice(0, eqIdx).trim();
    const value = cookie.slice(eqIdx + 1).trim();
    if (name === 'sessionId' || name === 'session_id' || name === 'canvas_session' || name === 'neural_token') {
      if (value) sessionIds.add(value);
    }
  }

  // 4. Fallback to express cookie-parser
  const parserCookies = [
    req.cookies?.sessionId,
    req.cookies?.session_id,
    req.cookies?.canvas_session,
    req.cookies?.neural_token,
  ].filter(Boolean);
  for (const v of parserCookies) sessionIds.add(v);

  const allIds = [...sessionIds];
  if (allIds.length > 0) {
    return { sessionIds: allIds, sessionId: allIds[0] };
  }

  return null;
}

/**
 * Resolve a sessionId to a real user via Prisma.
 * Returns user object or null.
 */
async function resolveUser(sessionId) {
  if (!sessionId) return null;
  try {
    return await prisma.user.findFirst({
      where: {
        sessionId,
        sessionExpiry: { gt: new Date() },
      },
      select: { id: true, email: true, name: true, role: true },
    });
  } catch (err) {
    console.error('[Auth] DB lookup error:', err.message);
    return null;
  }
}

/**
 * Cross-backend session verification fallback.
 * When the local DB doesn't have the session (different database),
 * call the central auth backend (shiny-backend:3005) which owns the session table.
 * On success, also sets a neural_link_session JWT cookie so future requests skip this.
 */
async function resolveUserViaCentralAuth(cookieHeader, res) {
  if (!cookieHeader) return null;
  try {
    const response = await fetch(`${AUTH_BACKEND_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.success || !data?.user?.id) return null;

    const user = data.user;

    // Set neural_link_session JWT cookie so future requests use JWT path (no cross-backend call)
    if (res && !res.headersSent) {
      try {
        const neuralToken = jwt.sign(
          {
            userId: user.id,
            email: user.email || '',
            iat: Math.floor(Date.now() / 1000),
          },
          getJwtSecret(),
          { expiresIn: '7d', algorithm: 'HS256' }
        );
        res.cookie('neural_link_session', neuralToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
          domain: '.mumtaz.ai',
        });
      } catch (jwtErr) {
        // Non-fatal — auth still works, just won't cache the JWT
        console.warn('[Auth] Failed to set JWT cookie:', jwtErr.message);
      }
    }

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch (err) {
    // Network error or timeout — non-fatal, just means central auth is unavailable
    console.warn('[Auth] Central auth fallback failed:', err.message);
    return null;
  }
}

/**
 * Ensure the authenticated user exists in the LOCAL database.
 * After cross-backend auth or JWT decode, the userId comes from the central DB
 * but may not exist in this backend's separate database. Without a local user row,
 * FK-constrained tables (user_preferences, subscriptions, etc.) will fail.
 *
 * This does a lightweight upsert — creates if missing, updates lastLoginAt if exists.
 */
async function ensureLocalUser(user) {
  if (!user?.id) return;
  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { lastLoginAt: new Date() },
      create: {
        id: user.id,
        email: user.email || `${user.id}@synced.mumtaz.ai`,
        name: user.name || null,
        role: (user.role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user',
        lastLoginAt: new Date(),
      },
    });
  } catch (err) {
    // If email conflicts (user exists with different id but same email), try by email
    if (err.code === 'P2002' && user.email) {
      try {
        await prisma.user.update({
          where: { email: user.email },
          data: { lastLoginAt: new Date() },
        });
      } catch (retryErr) {
        console.warn('[Auth] ensureLocalUser retry failed:', retryErr.message);
      }
      return;
    }
    console.warn('[Auth] ensureLocalUser failed:', err.message);
  }
}

/**
 * Strict auth — returns 401 if no valid authenticated session.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const session = extractSession(req);

    // Debug: log auth attempts for canvas routes
    if (req.path?.includes('canvas') || req.path?.includes('orchestrate')) {
      const cookieHeader = req.headers?.cookie || '';
      const allSessionCookies = {};
      for (const cookie of cookieHeader.split(';')) {
        const eqIdx = cookie.indexOf('=');
        if (eqIdx === -1) continue;
        const name = cookie.slice(0, eqIdx).trim();
        const value = cookie.slice(eqIdx + 1).trim();
        if (['sessionId', 'session_id', 'canvas_session', 'neural_token', 'neural_link_session'].includes(name)) {
          allSessionCookies[name] = value.substring(0, 20) + '...';
        }
      }
      console.log('[Auth Debug]', req.method, req.path, {
        hasSession: !!session,
        sessionUserId: session?.userId,
        sessionId: session?.sessionId ? session.sessionId.substring(0, 12) + '...' : null,
        cookies: Object.keys(req.cookies || {}),
        sessionCookieValues: allSessionCookies,
        hasCookieHeader: !!req.headers?.cookie,
      });
    }

    if (session?.userId) {
      // Ensure user exists in local DB (JWT gives userId from central DB)
      await ensureLocalUser({ id: session.userId, email: session.email });
      req.userId = session.userId;
      req.isAuthenticated = true;
      return next();
    }

    // Try all session cookie values (handles stale cookies from different auth flows)
    const sessionIds = session?.sessionIds || (session?.sessionId ? [session.sessionId] : []);
    for (const sid of sessionIds) {
      const user = await resolveUser(sid);
      if (user) {
        req.userId = user.id;
        req.user = user;
        req.isAuthenticated = true;
        return next();
      }
    }

    // Fallback: session cookies exist but local DB has no match (cross-database scenario).
    // Call the central auth backend which owns the session table.
    if (sessionIds.length > 0) {
      const centralUser = await resolveUserViaCentralAuth(req.headers?.cookie, res);
      if (centralUser) {
        // Sync user into local DB so FK-constrained writes work
        await ensureLocalUser(centralUser);
        req.userId = centralUser.id;
        req.user = centralUser;
        req.isAuthenticated = true;
        return next();
      }
    }

    return res
      .status(401)
      .json({ success: false, error: 'Authentication required' });
  } catch (err) {
    console.error('[Auth] requireAuth error:', err.message);
    return res
      .status(401)
      .json({ success: false, error: 'Authentication failed' });
  }
};
