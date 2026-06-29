import {
  generateVisitorId,
  generateSessionId,
  trackVisitor,
  createSession,
  trackPageView,
  trackApiUsage,
  updateSession,
  detectDevice,
  detectBrowser,
  detectOS,
} from './analytics-tracker.js';

// Lazy-loaded geoip lookup
let geoLookup = null;
try {
  const geoip = await import('geoip-lite');
  geoLookup = geoip.default?.lookup || geoip.lookup;
} catch {
  // geoip-lite not installed — rely on Cloudflare headers only
}

function resolveGeo(req) {
  // Priority 1: Cloudflare headers
  const cfCountry = req.headers['cf-ipcountry'];
  const cfCity = req.headers['cf-ipcity'];
  if (cfCountry && cfCountry !== 'XX') {
    return { country: cfCountry, city: cfCity || 'Unknown' };
  }
  // Priority 2: geoip-lite offline lookup
  if (geoLookup) {
    const ip = req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()) || req.ip || req.socket?.remoteAddress;
    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
      const geo = geoLookup(ip.replace('::ffff:', ''));
      if (geo) {
        return { country: geo.country || 'Unknown', city: geo.city || 'Unknown' };
      }
    }
  }
  return { country: 'Unknown', city: 'Unknown' };
}

function initializeTracking(req, res, next) {
  try {
    let visitorId = req.cookies?.visitorId;
    if (!visitorId) {
      visitorId = generateVisitorId();
      res.cookie('visitorId', visitorId, {
        maxAge: 365 * 24 * 60 * 60 * 1e3,
        // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
    let sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      sessionId = generateSessionId();
      res.cookie('sessionId', sessionId, {
        maxAge: 30 * 60 * 1e3,
        // 30 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
    const userId = req.user?.id || req.session?.userId;
    // Real client IP: CF-Connecting-IP (Cloudflare) > X-Forwarded-For first entry > req.ip
    const ipAddress =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const device = detectDevice(userAgent);
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);
    // Resolve geolocation from Cloudflare headers or geoip-lite
    const { country, city } = resolveGeo(req);
    req.visitorId = visitorId;
    req.sessionId = sessionId;
    req.trackingData = {
      visitorId,
      sessionId,
      userId,
      ipAddress,
      userAgent,
      device,
      browser,
      os,
      country,
      city,
    };
    next();
  } catch (error) {
    console.error('Error in initializeTracking:', error);
    next();
  }
}
function trackVisitorMiddleware(req, res, next) {
  next();
  if (req.trackingData) {
    const {
      visitorId,
      sessionId,
      userId,
      ipAddress,
      userAgent,
      device,
      browser,
      os,
      country,
      city,
    } = req.trackingData;
    const referrer = req.headers.referer || req.headers.referrer;
    const landingPage = req.path;
    trackVisitor({
      visitorId,
      sessionId,
      userId,
      ipAddress,
      userAgent,
      referrer,
      landingPage,
      device,
      browser,
      os,
      country,
      city,
    }).catch((err) => console.error('Error tracking visitor:', err));
    createSession({
      sessionId,
      visitorId,
      userId,
      device,
      browser,
      ipAddress,
    }).catch((err) => console.error('Error creating session:', err));
  }
}
function trackPageViewMiddleware(req, res, next) {
  next();
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api/') &&
    !req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    if (req.trackingData) {
      const { visitorId, sessionId, userId } = req.trackingData;
      const referrer = req.headers.referer || req.headers.referrer;
      trackPageView({
        visitorId,
        sessionId,
        userId,
        url: req.path, // Changed from 'path' to 'url' to match PageView schema
        title: req.query.title,
        referrer,
      }).catch((err) => console.error('Error tracking page view:', err));
    }
  }
}
function trackApiMiddleware(req, res, next) {
  const startTime = Date.now();
  const originalEnd = res.end;
  res.end = function (chunk, encoding, callback) {
    const responseTime = Date.now() - startTime;
    if (req.trackingData) {
      const { visitorId, sessionId, userId, ipAddress, userAgent } =
        req.trackingData;
      trackApiUsage({
        visitorId,
        sessionId,
        userId,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        requestBody: req.body,
        error: res.statusCode >= 400 ? 'Error' : void 0,
        userAgent,
        ipAddress,
      }).catch((err) => console.error('Error tracking API usage:', err));
    }
    return originalEnd.call(this, chunk, encoding, callback);
  };
  next();
}
function updateSessionActivity(req, res, next) {
  next();
  if (req.sessionId) {
    updateSession(req.sessionId, {
      lastActivity: /* @__PURE__ */ new Date(),
    }).catch((err) => console.error('Error updating session:', err));
  }
}
function universalTrackingMiddleware(req, res, next) {
  initializeTracking(req, res, () => {
    trackVisitorMiddleware(req, res, () => {
      trackPageViewMiddleware(req, res, () => {
        trackApiMiddleware(req, res, () => {
          updateSessionActivity(req, res, next);
        });
      });
    });
  });
}
function getWebSocketTrackingData(socket) {
  const cookies = parseCookies(socket.handshake.headers.cookie || '');
  const visitorId = cookies.visitorId || generateVisitorId();
  const sessionId = cookies.sessionId || generateSessionId();
  const userAgent = socket.handshake.headers['user-agent'] || 'unknown';
  const ipAddress = socket.handshake.address || 'unknown';
  return {
    visitorId,
    sessionId,
    userAgent,
    ipAddress,
    device: detectDevice(userAgent),
    browser: detectBrowser(userAgent),
    os: detectOS(userAgent),
  };
}
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  return cookies;
}
function getTrackingData(req) {
  return req.trackingData || null;
}
export {
  getTrackingData,
  getWebSocketTrackingData,
  initializeTracking,
  trackApiMiddleware,
  trackPageViewMiddleware,
  trackVisitorMiddleware,
  universalTrackingMiddleware,
  updateSessionActivity,
};
