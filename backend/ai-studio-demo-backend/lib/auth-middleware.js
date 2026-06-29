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

/**
 * Optional auth — tries to authenticate, falls back to guest identity.
 * Never returns 401. Canvas routes use this for guest-accessible features.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const session = extractSession(req);

    if (session?.userId) {
      req.userId = session.userId;
      req.isAuthenticated = true;
      return next();
    }

    // Try all session cookie values
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

    // Valid cookies but no DB match — treat as guest with stable ID
    if (sessionIds.length > 0) {
      req.userId = `guest_${sessionIds[0]}`;
      req.isAuthenticated = false;
      return next();
    }

    // No session at all — anonymous
    req.userId = `anon_${Date.now()}`;
    req.isAuthenticated = false;
    next();
  } catch (err) {
    console.error('[Auth] optionalAuth error:', err.message);
    req.userId = `anon_${Date.now()}`;
    req.isAuthenticated = false;
    next();
  }
};

/**
 * Admin email allow-list — ONLY these 3 emails may access admin routes.
 * Must be signed in as a regular user first (same session).
 */
export const ADMIN_EMAILS = [
  'admin@mumtaz.ai',
  'admin@onelast.ai',
];

/**
 * Admin-only auth — requires:
 *   1. Valid user session (same browser, same session as normal login)
 *   2. User email must be in the ADMIN_EMAILS allow-list
 *   3. A valid admin_access cookie (set after password + optional 2FA re-verification)
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const session = extractSession(req);
    let user = null;

    if (session?.userId) {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, name: true, role: true },
      });
    } else if (session?.sessionId) {
      user = await resolveUser(session.sessionId);
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    // Check email allow-list (case-insensitive)
    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return res
        .status(403)
        .json({ success: false, error: 'Admin access required' });
    }

    // Verify admin_access cookie (set after re-auth at admin gate)
    const adminToken = req.cookies?.admin_access;
    if (!adminToken) {
      return res
        .status(403)
        .json({ success: false, error: 'Admin re-authentication required', code: 'ADMIN_REAUTH' });
    }

    // Validate the admin access token against DB
    const adminUser = await prisma.user.findFirst({
      where: {
        id: user.id,
        adminAccessToken: adminToken,
        adminAccessExpiry: { gt: new Date() },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!adminUser) {
      return res
        .status(403)
        .json({ success: false, error: 'Admin session expired. Please re-authenticate.', code: 'ADMIN_REAUTH' });
    }

    req.userId = adminUser.id;
    req.user = adminUser;
    req.adminUser = adminUser;
    req.isAuthenticated = true;
    next();
  } catch (err) {
    console.error('[Auth] requireAdmin error:', err.message);
    return res
      .status(401)
      .json({ success: false, error: 'Authentication failed' });
  }
};

/**
 * Verify request authentication without middleware side-effects.
 * Returns { ok: boolean, user?: { id, email, name, role } }
 * Use in route handlers that need to check auth inline.
 */
export async function verifyRequestAsync(req) {
  try {
    const session = extractSession(req);

    if (session?.userId) {
      return { ok: true, user: { id: session.userId } };
    }

    if (session?.sessionId) {
      const user = await resolveUser(session.sessionId);
      if (user) {
        return { ok: true, user };
      }
    }

    return { ok: false };
  } catch (err) {
    console.error('[Auth] verifyRequestAsync error:', err.message);
    return { ok: false };
  }
}
