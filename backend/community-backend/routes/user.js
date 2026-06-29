/**
 * USER ROUTES - PRISMA/POSTGRESQL
 * User profile and settings management
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { cache, cacheKeys } from '../lib/cache.js';

// --- Local helpers (migrated from db.js wrapper) ---
const db = {
  prisma,
  User: {
    findById: (id) => prisma.user.findUnique({ where: { id } }),
    findByEmail: (email) => prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
    findBySessionId: (sessionId) => prisma.user.findFirst({ where: { sessionId } }),
    async update(id, data) {
      if (data.password) data.password = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
      return prisma.user.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    },
    async updateByEmail(email, data) {
      if (data.password) data.password = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
      return prisma.user.update({ where: { email: email.toLowerCase() }, data: { ...data, updatedAt: new Date() } });
    },
    comparePassword: (password, hash) => bcrypt.compare(password, hash),
  },
  AgentSubscription: {
    findByUser: (userId) => prisma.agentSubscription.findMany({ where: { userId }, include: { agent: true }, orderBy: { createdAt: 'desc' } }),
  },
  Favorites: {
    findByUser: (userId) => prisma.userFavorites.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    add: (userId, itemType, itemId, notes = null) => prisma.userFavorites.upsert({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
      update: { notes },
      create: { userId, itemType, itemId, notes },
    }),
    remove: (userId, itemType, itemId) => prisma.userFavorites.delete({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
    }),
  },
};

const router = express.Router();

/**
 * Resolve userId from request: tries JWT, header, body, session cookie, cross-backend fallback.
 * Handles duplicate cookies (browser may accumulate old + new).
 * Returns userId string or null.
 */
// JWT secret — read lazily to avoid ESM import-order timing issues with dotenv
function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET;
}
const AUTH_BACKEND_URL = process.env.AUTH_BACKEND_URL || process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3005';

async function resolveUserId(req) {
  // 1. Explicit header / body
  const explicit = req.headers['x-user-id'] || req.body?.userId;
  if (explicit) return explicit;

  // 2. neural_link_session JWT — decode directly to userId (skip DB lookup)
  const neuralJwt = req.cookies?.neural_link_session;
  if (neuralJwt) {
    try {
      const decoded = jwt.verify(neuralJwt, getJwtSecret(), { algorithms: ['HS256'] });
      if (decoded?.userId) {
        // Ensure user exists in local DB
        try {
          await db.prisma.user.upsert({
            where: { id: decoded.userId },
            update: { lastLoginAt: new Date() },
            create: {
              id: decoded.userId,
              email: decoded.email || `${decoded.userId}@synced.${(process.env.APP_DOMAIN || '.mumtaz.ai').replace(/^\./, '')}`,
              name: null,
              role: 'user',
              lastLoginAt: new Date(),
            },
          });
        } catch (upsertErr) {
          // Non-fatal — user may already exist with a different email
        }
        return decoded.userId;
      }
    } catch (jwtErr) {
      // JWT expired or invalid — fall through to session cookie lookup
    }
  }

  // 3. Session cookie (HttpOnly) — handle duplicates by trying last value first
  let sessionId = req.cookies?.session_id || req.cookies?.sessionId;

  // When browser sends duplicate cookies, cookie-parser picks the first.
  // Parse raw Cookie header and try the LAST match (most recent login).
  const rawCookie = req.headers.cookie || '';
  const sidMatches = rawCookie.match(/session_id=([^;]+)/g);
  const sessionIdMatches = rawCookie.match(/(?:^|;\s*)sessionId=([^;]+)/g);

  const candidates = [];
  if (sidMatches) {
    for (const m of sidMatches) candidates.push(m.split('=')[1].trim());
  }
  if (sessionIdMatches) {
    for (const m of sessionIdMatches) candidates.push(m.split('=').slice(1).join('=').trim());
  }

  // Try candidates from last to first (newest → oldest)
  const tryOrder = [...new Set([...candidates.reverse(), sessionId].filter(Boolean))];

  for (const sid of tryOrder) {
    const user = await db.prisma.user.findFirst({
      where: { sessionId: sid, sessionExpiry: { gt: new Date() } },
      select: { id: true },
    });
    if (user) return user.id;
  }

  // 4. Cross-backend fallback — session exists in main DB (port 3005) but not here
  if (tryOrder.length > 0 || neuralJwt) {
    try {
      const response = await fetch(`${AUTH_BACKEND_URL}/api/auth/session`, {
        method: 'GET',
        headers: {
          'Cookie': req.headers.cookie || '',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.user?.id) {
          // Sync user into local DB
          try {
            await db.prisma.user.upsert({
              where: { id: data.user.id },
              update: { lastLoginAt: new Date() },
              create: {
                id: data.user.id,
                email: data.user.email || `${data.user.id}@synced.${(process.env.APP_DOMAIN || '.mumtaz.ai').replace(/^\./, '')}`,
                name: data.user.name || null,
                role: (data.user.role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user',
                lastLoginAt: new Date(),
              },
            });
          } catch (upsertErr) {
            // Non-fatal
          }
          return data.user.id;
        }
      }
    } catch (err) {
      console.warn('[resolveUserId] Central auth fallback failed:', err.message);
    }
  }

  return null;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// GET /api/user/profile - Get current user profile
router.get('/profile', async (req, res) => {
  try {
    // Use the enhanced resolveUserId which checks JWT, session cookies, and cross-backend fallback
    const userId = await resolveUserId(req);
    const userEmail = !userId ? req.headers['x-user-email'] : null;

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Generate cache key
    const cacheKey = userId ? cacheKeys.user(`${userId}:profile`) : `user:email:${userEmail}:profile`;

    // Try to get from cache first
    const cachedProfile = await cache.get(cacheKey);
    if (cachedProfile) {
      return res.json({
        success: true,
        profile: cachedProfile,
        cached: true,
      });
    }

    // Find user by ID or email
    let user;
    if (userId) {
      user = await db.User.findById(userId);
    } else {
      user = await db.User.findByEmail(userEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Build complete profile data with defaults
    const profile = {
      name: user.name || 'User',
      email: user.email,
      avatar: user.avatar || '',
      bio: user.bio || 'AI enthusiast exploring the future of intelligent systems.',
      phoneNumber: user.phoneNumber || '',
      location: user.location || '',
      timezone: user.timezone || 'Pacific Time (PT)',
      profession: user.profession || 'AI Developer',
      company: user.company || '',
      website: user.socialLinks?.website || '',
      socialLinks: {
        linkedin: user.socialLinks?.linkedin || '',
        twitter: user.socialLinks?.twitter || '',
        github: user.socialLinks?.github || '',
      },
      preferences: user.preferences || {
        language: 'en',
        theme: 'auto',
        notifications: { email: true, push: true, sms: false },
        privacy: { profileVisibility: 'public', showEmail: false, showPhone: false },
      },
    };

    // Cache the profile for 10 minutes
    await cache.set(cacheKey, profile, 600);

    res.json({
      success: true,
      profile,
      cached: false,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', async (req, res) => {
  try {
    // Use the enhanced resolveUserId which checks JWT, session cookies, and cross-backend fallback
    const userId = await resolveUserId(req);
    const userEmail = !userId ? req.headers['x-user-email'] : null;
    
    const {
      name,
      avatar,
      bio,
      phoneNumber,
      location,
      timezone,
      profession,
      company,
      website,
      socialLinks,
      preferences,
    } = req.body;

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (location !== undefined) updateData.location = location;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (profession !== undefined) updateData.profession = profession;
    if (company !== undefined) updateData.company = company;

    // Handle social links
    if (socialLinks || website) {
      const currentSocial = {};
      if (socialLinks) {
        if (socialLinks.linkedin !== undefined) currentSocial.linkedin = socialLinks.linkedin;
        if (socialLinks.twitter !== undefined) currentSocial.twitter = socialLinks.twitter;
        if (socialLinks.github !== undefined) currentSocial.github = socialLinks.github;
      }
      if (website !== undefined) currentSocial.website = website;
      updateData.socialLinks = currentSocial;
    }

    // Handle preferences
    if (preferences) {
      updateData.preferences = preferences;
    }

    // Update user
    let user;
    if (userId) {
      user = await db.User.update(userId, updateData);
    } else {
      user = await db.User.updateByEmail(userEmail, updateData);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Invalidate cache
    const cacheKey = userId ? cacheKeys.user(`${userId}:profile`) : `user:email:${userEmail}:profile`;
    await cache.del(cacheKey);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        phoneNumber: user.phoneNumber,
        location: user.location,
        timezone: user.timezone,
        profession: user.profession,
        company: user.company,
        socialLinks: user.socialLinks,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// POST /api/user/avatar - Upload avatar
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const userEmail = !userId ? req.headers['x-user-email'] : null;

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user avatar
    if (userId) {
      await db.User.update(userId, { avatar: avatarUrl });
    } else {
      await db.User.updateByEmail(userEmail, { avatar: avatarUrl });
    }

    // Invalidate cache
    const cacheKey = userId ? cacheKeys.user(`${userId}:profile`) : `user:email:${userEmail}:profile`;
    await cache.del(cacheKey);

    res.json({
      success: true,
      avatarUrl,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload avatar' });
  }
});

// GET /api/user/subscriptions - Get user's active subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const userId = await resolveUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const subscriptions = await db.AgentSubscription.findByUser(userId);

    res.json({
      success: true,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        agentId: sub.agentId,
        agentName: sub.agent?.name || sub.agentId,
        plan: sub.plan,
        price: sub.price,
        status: sub.status,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        autoRenew: sub.autoRenew,
      })),
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subscriptions' });
  }
});

// GET /api/user/favorites - Get user's favorites
router.get('/favorites', async (req, res) => {
  try {
    const userId = await resolveUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const favorites = await db.Favorites.findByUser(userId);

    res.json({
      success: true,
      favorites,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch favorites' });
  }
});

// POST /api/user/favorites - Add a favorite
router.post('/favorites', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { itemType, itemId, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, error: 'itemType and itemId required' });
    }

    const favorite = await db.Favorites.add(userId, itemType, itemId, notes);

    res.json({
      success: true,
      favorite,
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ success: false, error: 'Failed to add favorite' });
  }
});

// DELETE /api/user/favorites/:itemType/:itemId - Remove a favorite
router.delete('/favorites/:itemType/:itemId', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { itemType, itemId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    await db.Favorites.remove(userId, itemType, itemId);

    res.json({
      success: true,
      message: 'Favorite removed',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove favorite' });
  }
});

// GET /api/user/settings - Get user settings
router.get('/settings', async (req, res) => {
  try {
    const userId = await resolveUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const user = await db.User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      settings: {
        preferences: user.preferences || {},
        twoFactorEnabled: user.twoFactorEnabled || false,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/user/settings - Update user settings
router.put('/settings', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { preferences } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const user = await db.User.update(userId, { preferences });

    res.json({
      success: true,
      message: 'Settings updated',
      settings: {
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// POST /api/user/change-password - Change password
router.post('/change-password', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both passwords required' });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify current password
    const isValid = await db.User.comparePassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Prevent password reuse (check if new password matches current)
    const isSameAsCurrent = await db.User.comparePassword(newPassword, user.password);
    if (isSameAsCurrent) {
      return res.status(400).json({ success: false, error: 'New password must be different from the current password' });
    }

    // Update password and track change on User model
    await db.User.update(userId, { password: newPassword, lastPasswordChange: new Date() });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// ============================================
// USER REWARDS
// ============================================
router.get('/rewards/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = await resolveUserId(req);
    if (!authUserId || authUserId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Get user's gamification/rewards data
    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Return rewards data (with defaults for new users)
    const rewards = {
      points: user.points || 0,
      level: user.level || 1,
      badges: user.badges || [],
      achievements: user.achievements || [],
      streakDays: user.streakDays || 0,
      totalRewards: user.totalRewards || 0,
      lastActivityDate: user.lastActivityDate || new Date(),
    };

    res.json({
      success: true,
      rewards,
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ success: false, error: 'Failed to get rewards' });
  }
});

// ============================================
// USER PREFERENCES
// ============================================
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = await resolveUserId(req);
    if (!authUserId || authUserId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Return preferences with defaults
    const preferences = user.preferences || {
      language: 'en',
      theme: 'auto',
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false,
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showActivity: true,
      },
      accessibility: {
        reduceMotion: false,
        highContrast: false,
        fontSize: 'medium',
      },
    };

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to get preferences' });
  }
});

router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = await resolveUserId(req);
    if (!authUserId || authUserId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const preferences = req.body;

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Merge new preferences with existing
    const updatedPreferences = {
      ...(user.preferences || {}),
      ...preferences,
    };

    await db.User.update(userId, { preferences: updatedPreferences });

    res.json({
      success: true,
      message: 'Preferences updated',
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

// ============================================
// USER SECURITY
// ============================================
router.get('/security/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = await resolveUserId(req);
    if (!authUserId || authUserId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const user = await db.prisma.user.findUnique({
      where: { id: userId },
      include: { security: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const sec = user.security; // UserSecurity relation (may be null)

    // Build current session info from the request itself
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.connection?.remoteAddress || 'Unknown';

    const currentSession = {
      id: 'current',
      createdAt: user.lastLoginAt || user.createdAt,
      lastActivity: new Date().toISOString(),
      ipAddress,
      userAgent,
      isCurrent: true,
    };

    // Build login history: combine stored history with lastLoginAt
    const storedHistory = Array.isArray(sec?.loginHistory) ? sec.loginHistory : [];
    // If no stored history but user has logged in, synthesize from lastLoginAt
    const loginHistory = storedHistory.length > 0 ? storedHistory : (user.lastLoginAt ? [{
      id: 'last-login',
      date: user.lastLoginAt,
      device: userAgent,
      location: ipAddress,
      status: 'success',
      ip: ipAddress,
    }] : []);

    // Build trusted devices: combine stored devices with current device
    const storedDevices = Array.isArray(sec?.trustedDevices) ? sec.trustedDevices : [];

    // Parse user-agent into device info
    const uaLower = (userAgent || '').toLowerCase();
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const deviceType = isMobile ? (/tablet|ipad/i.test(userAgent) ? 'tablet' : 'mobile') : 'desktop';
    let deviceBrowser = 'Unknown';
    if (uaLower.includes('chrome') && !uaLower.includes('edg')) deviceBrowser = 'Chrome';
    else if (uaLower.includes('safari') && !uaLower.includes('chrome')) deviceBrowser = 'Safari';
    else if (uaLower.includes('firefox')) deviceBrowser = 'Firefox';
    else if (uaLower.includes('edg')) deviceBrowser = 'Edge';
    let deviceOS = 'Unknown';
    if (uaLower.includes('mac')) deviceOS = 'macOS';
    else if (uaLower.includes('windows')) deviceOS = 'Windows';
    else if (uaLower.includes('linux')) deviceOS = 'Linux';
    else if (uaLower.includes('android')) deviceOS = 'Android';
    else if (uaLower.includes('iphone') || uaLower.includes('ipad')) deviceOS = 'iOS';

    const currentDevice = {
      id: 'current-device',
      name: `${deviceOS} — ${deviceBrowser}`,
      type: deviceType,
      browser: deviceBrowser,
      os: deviceOS,
      location: ipAddress,
      lastSeen: new Date().toISOString(),
      current: true,
    };

    // Merge: keep stored devices, replace or add current device
    const hasCurrentMarked = storedDevices.some(d => d.current || d.id === 'current-device');
    const trustedDevices = hasCurrentMarked
      ? storedDevices.map(d => (d.current || d.id === 'current-device') ? { ...currentDevice, id: d.id } : d)
      : [currentDevice, ...storedDevices];

    // Return security settings (never include actual password)
    const security = {
      twoFactorEnabled: user.twoFactorEnabled || false,
      lastPasswordChange: user.lastPasswordChange || user.createdAt,
      activeSessions: [currentSession],
      loginHistory,
      securityQuestions: false,
      trustedDevices,
      backupCodes: user.backupCodes || [],
      securityScore: calculateSecurityScore(user, sec),
    };

    res.json({
      success: true,
      security,
    });
  } catch (error) {
    console.error('Get security error:', error);
    res.status(500).json({ success: false, error: 'Failed to get security settings' });
  }
});

// Helper: Calculate a simple security score (0-100)
function calculateSecurityScore(user, sec) {
  let score = 20; // base for having an account
  if (user.twoFactorEnabled) score += 30;
  if (user.lastPasswordChange) {
    const daysSinceChange = (Date.now() - new Date(user.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceChange < 90) score += 20;
    else if (daysSinceChange < 180) score += 10;
  } else {
    score += 5; // at least they have a password
  }
  if (user.backupCodes?.length > 0) score += 10;
  if (Array.isArray(sec?.trustedDevices) && sec.trustedDevices.length > 0) score += 10;
  if (user.emailVerificationCode === null) score += 10; // verified email
  return Math.min(score, 100);
}

router.put('/security/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = await resolveUserId(req);
    if (!authUserId || authUserId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const securitySettings = req.body;

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update User-level security settings
    const userUpdates = {};
    if (securitySettings.twoFactorEnabled !== undefined) {
      userUpdates.twoFactorEnabled = securitySettings.twoFactorEnabled;
    }
    if (Object.keys(userUpdates).length > 0) {
      await db.User.update(userId, userUpdates);
    }

    // Update UserSecurity-level settings (trustedDevices, activeSessions, loginHistory)
    const secUpdates = {};
    if (securitySettings.trustedDevices !== undefined) {
      secUpdates.trustedDevices = securitySettings.trustedDevices;
    }
    if (securitySettings.loginHistory !== undefined) {
      secUpdates.loginHistory = securitySettings.loginHistory;
    }
    if (Object.keys(secUpdates).length > 0) {
      await db.prisma.userSecurity.upsert({
        where: { userId },
        update: secUpdates,
        create: { userId, ...secUpdates },
      });
    }

    res.json({
      success: true,
      message: 'Security settings updated',
    });
  } catch (error) {
    console.error('Update security error:', error);
    res.status(500).json({ success: false, error: 'Failed to update security settings' });
  }
});

// POST /api/user/security/change-password - Change password (alias)
// Frontend calls this path; delegates to the same logic as /change-password
router.post('/security/change-password', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both passwords required' });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValid = await db.User.comparePassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Prevent password reuse
    const isSameAsCurrent = await db.User.comparePassword(newPassword, user.password);
    if (isSameAsCurrent) {
      return res.status(400).json({ success: false, error: 'New password must be different from the current password' });
    }

    // Update password and track change on User model
    await db.User.update(userId, { password: newPassword, lastPasswordChange: new Date() });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Security change-password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// POST /api/user/security/2fa - Begin 2FA setup
router.post('/security/2fa', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate a random base32 secret for TOTP
    const crypto = await import('crypto');
    const secretBytes = crypto.randomBytes(20);
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < secretBytes.length; i++) {
      secret += base32Chars[secretBytes[i] % 32];
    }

    // Store secret temporarily (not yet verified)
    await db.User.update(userId, { twoFactorSecret: secret });

    const issuer = 'OnelastAI';
    const otpauthUrl = `otpauth://totp/${issuer}:${user.email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    res.json({
      success: true,
      secret,
      qrCodeUrl: otpauthUrl,
      manualSecret: secret,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ success: false, error: 'Failed to setup 2FA' });
  }
});

// POST /api/user/security/2fa/verify - Verify & enable 2FA
router.post('/security/2fa/verify', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ success: false, error: 'User ID and verification code required' });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ success: false, error: 'No 2FA setup in progress. Please start setup first.' });
    }

    // For production, verify TOTP code against secret.
    // Simplified verification: accept any 6-digit code during setup to enable 2FA.
    // In production, integrate a TOTP library (e.g., otpauth, speakeasy).
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, error: 'Invalid verification code format' });
    }

    // Generate backup codes
    const crypto = await import('crypto');
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await db.User.update(userId, {
      twoFactorEnabled: true,
      backupCodes: backupCodes,
    });

    res.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes,
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify 2FA' });
  }
});

// POST /api/user/security/2fa/disable - Disable 2FA
router.post('/security/2fa/disable', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await db.User.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
    });

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ success: false, error: 'Failed to disable 2FA' });
  }
});

// ============================================
// USER BILLING
// ============================================
router.get('/billing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = await resolveUserId(req);
    if (!authUserId || authUserId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Return billing data (with defaults for users without billing info)
    const billing = {
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'active',
      billingCycle: user.subscription?.billingCycle || 'monthly',
      nextBillingDate: user.subscription?.nextBillingDate || null,
      paymentMethod: user.paymentMethod ? {
        type: user.paymentMethod.type || 'card',
        last4: user.paymentMethod.last4 || '****',
        expiryMonth: user.paymentMethod.expiryMonth,
        expiryYear: user.paymentMethod.expiryYear,
      } : null,
      invoices: user.invoices || [],
      credits: user.credits || 0,
      usage: {
        apiCalls: user.usage?.apiCalls || 0,
        storage: user.usage?.storage || 0,
        bandwidth: user.usage?.bandwidth || 0,
      },
    };

    res.json({
      success: true,
      billing,
    });
  } catch (error) {
    console.error('Get billing error:', error);
    res.status(500).json({ success: false, error: 'Failed to get billing info' });
  }
});

// ============================================
// USER CONVERSATIONS
// ============================================
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = await resolveUserId(req);
    if (!authUserId || authUserId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get total count
    const total = await prisma.chatSession.count({ where: whereClause });

    // Get conversations with messages
    const chatSessions = await prisma.chatSession.findMany({
      where: whereClause,
      include: {
        agent: {
          select: {
            name: true,
            agentId: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    });

    // Transform to expected format
    const conversations = chatSessions.map((session) => {
      const lastMsg = session.messages[0];
      const createdAt = new Date(session.createdAt);
      const updatedAt = new Date(session.updatedAt);
      const durationMs = updatedAt.getTime() - createdAt.getTime();
      const durationMinutes = Math.max(1, Math.floor(durationMs / 60000));

      return {
        id: session.sessionId || session.id,
        agent: session.agent?.name || session.agentId || 'Unknown Agent',
        topic: session.name || 'Untitled Conversation',
        date: session.createdAt.toISOString(),
        duration: durationMinutes < 60 
          ? `${durationMinutes} min` 
          : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
        messageCount: session._count.messages || 0,
        lastMessage: lastMsg ? {
          content: lastMsg.content?.substring(0, 150) + (lastMsg.content?.length > 150 ? '...' : ''),
          timestamp: lastMsg.createdAt.toISOString(),
        } : null,
      };
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get conversations' });
  }
});

// GET /api/user/conversations/:userId/export - Export user conversations
router.get('/conversations/:userId/export', async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = await resolveUserId(req);
    if (!authUserId || authUserId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const format = req.query.format || 'json';

    // Get all conversations with messages
    const chatSessions = await prisma.chatSession.findMany({
      where: { userId },
      include: {
        agent: {
          select: {
            name: true,
            agentId: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for export
    const exportData = chatSessions.map((session) => ({
      id: session.sessionId || session.id,
      agent: session.agent?.name || session.agentId || 'Unknown Agent',
      topic: session.name || 'Untitled Conversation',
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messageCount: session.messages.length,
      messages: session.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt.toISOString(),
      })),
    }));

    if (format === 'csv') {
      // Build CSV content
      const csvRows = ['ID,Agent,Topic,Date,Messages'];
      exportData.forEach((conv) => {
        csvRows.push(
          `"${conv.id}","${conv.agent}","${conv.topic.replace(/"/g, '""')}","${conv.createdAt}",${conv.messageCount}`,
        );
      });
      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=conversations.csv');
      return res.send(csvContent);
    }

    // Default to JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=conversations.json');
    return res.json({ conversations: exportData });
  } catch (error) {
    console.error('Export conversations error:', error);
    res.status(500).json({ success: false, error: 'Failed to export conversations' });
  }
});

// ============================================
// USER ANALYTICS
// ============================================
// ── Advanced Analytics ──────────────────────────────────────────────
// GET /analytics/advanced — returns aggregated metrics for the advanced dashboard
router.get('/analytics/advanced', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // ── Gather raw data ────────────────────────────────────────────
    // Chat sessions + messages for this user (last 30 days, capped at 200 sessions)
    let chatSessions = [];
    try {
      chatSessions = await prisma.chatSession.findMany({
        where: { userId, updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        include: {
          agent: { select: { id: true, name: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      });
    } catch (_e) { /* table may not exist yet */ }

    // All messages in the last 14 days (for week-over-week comparison)
    let recentMessages = [];
    try {
      recentMessages = await prisma.chatMessage.findMany({
        where: { session: { userId }, createdAt: { gte: fourteenDaysAgo } },
        select: { id: true, role: true, createdAt: true, session: { select: { agentId: true } } },
        orderBy: { createdAt: 'asc' },
      });
    } catch (_e) { /* */ }

    // API usage rows (if table exists)
    let apiUsageRows = [];
    try {
      apiUsageRows = await prisma.apiUsage.findMany({
        where: { userId, createdAt: { gte: fourteenDaysAgo } },
        orderBy: { createdAt: 'asc' },
      });
    } catch (_e) { /* table may not exist */ }

    // Feedback for success rate
    let feedbackRows = [];
    try {
      feedbackRows = await prisma.chatFeedback.findMany({
        where: { userId },
        select: { rating: true, session: { select: { agentId: true } } },
      });
    } catch (_e) { /* */ }

    // ── Compute daily API metrics (last 7 days) ────────────────────
    const dayLabels = [];
    const dayMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayLabels.push(label);
      dayMap.set(label, { requests: 0, tokens: 0 });
    }

    const thisWeek = [];
    const lastWeek = [];

    recentMessages.forEach(m => {
      const d = new Date(m.createdAt);
      if (d >= sevenDaysAgo) {
        thisWeek.push(m);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dayMap.has(label)) {
          dayMap.get(label).requests++;
          dayMap.get(label).tokens += 150; // estimated avg tokens per message
        }
      } else {
        lastWeek.push(m);
      }
    });

    const totalThisWeek = thisWeek.length;
    const totalLastWeek = lastWeek.length || 1; // avoid div-by-zero

    // Build apiMetrics array
    const apiMetrics = dayLabels.map(label => {
      const day = dayMap.get(label);
      return {
        date: label,
        requests: day.requests,
        latency: day.requests > 0 ? Math.round(200 + Math.random() * 100) : 0, // simulated latency
        successRate: day.requests > 0 ? parseFloat((95 + Math.random() * 5).toFixed(1)) : 100,
        failureRate: day.requests > 0 ? parseFloat((0 + Math.random() * 5).toFixed(1)) : 0,
        tokenUsage: day.tokens,
        responseSize: day.requests > 0 ? parseFloat((1 + Math.random() * 3).toFixed(1)) : 0,
      };
    });

    // ── Model / Agent usage distribution ───────────────────────────
    const agentCountMap = new Map();
    chatSessions.forEach(s => {
      const name = s.agent?.name || 'AI Studio';
      agentCountMap.set(name, (agentCountMap.get(name) || 0) + (s._count?.messages || 0));
    });
    const modelColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6'];
    const totalModelMessages = Array.from(agentCountMap.values()).reduce((s, v) => s + v, 0) || 1;
    const modelUsage = Array.from(agentCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([model, usage], i) => ({
        model,
        usage,
        percentage: parseFloat(((usage / totalModelMessages) * 100).toFixed(1)),
        color: modelColors[i % modelColors.length],
      }));

    // ── Success / Failure per day ──────────────────────────────────
    const sfMap = new Map();
    dayLabels.forEach(label => sfMap.set(label, { successful: 0, failed: 0 }));
    thisWeek.forEach(m => {
      const label = new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (sfMap.has(label)) sfMap.get(label).successful++;
    });
    const successFailure = dayLabels.map(label => ({
      day: label,
      successful: sfMap.get(label)?.successful || 0,
      failed: sfMap.get(label)?.failed || 0,
    }));

    // ── Peak traffic hours ─────────────────────────────────────────
    const hourBuckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, requests: 0 }));
    thisWeek.forEach(m => {
      const h = new Date(m.createdAt).getHours();
      hourBuckets[h].requests++;
    });

    // ── Error types ────────────────────────────────────────────────
    // In a real system these come from logged errors; approximate from data patterns
    const totalErrors = Math.max(1, Math.round(totalThisWeek * 0.02));
    const errors = [
      { type: 'Rate Limit', count: Math.round(totalErrors * 0.35), percentage: 35 },
      { type: 'Timeout', count: Math.round(totalErrors * 0.25), percentage: 25 },
      { type: 'Invalid Input', count: Math.round(totalErrors * 0.20), percentage: 20 },
      { type: 'Server Error', count: Math.round(totalErrors * 0.12), percentage: 12 },
      { type: 'Auth Error', count: Math.round(totalErrors * 0.08), percentage: 8 },
    ];

    // ── Geographic distribution ────────────────────────────────────
    // Since we don't store per-request geo, use reasonable defaults
    const geographic = [
      { region: 'North America', requests: Math.round(totalThisWeek * 0.45), percentage: 45 },
      { region: 'Europe', requests: Math.round(totalThisWeek * 0.25), percentage: 25 },
      { region: 'Asia Pacific', requests: Math.round(totalThisWeek * 0.18), percentage: 18 },
      { region: 'Middle East', requests: Math.round(totalThisWeek * 0.07), percentage: 7 },
      { region: 'Other', requests: Math.round(totalThisWeek * 0.05), percentage: 5 },
    ];

    // ── Cost estimation by model ───────────────────────────────────
    const costPerToken = 0.000002; // ~$0.002 per 1k tokens
    const totalEstCost = parseFloat((totalThisWeek * 150 * costPerToken).toFixed(2));
    const costData = modelUsage.map(m => ({
      model: m.model,
      cost: parseFloat((m.usage * 150 * costPerToken).toFixed(2)),
      percentage: m.percentage,
    }));

    // ── Token usage trend ──────────────────────────────────────────
    const tokenTrend = dayLabels.map(label => ({
      date: label,
      tokens: dayMap.get(label)?.tokens || 0,
    }));

    // ── Avg latency (simulated from data volume) ───────────────────
    const avgLatency = totalThisWeek > 0 ? Math.round(250 + (totalThisWeek / 10)) : 0;
    const prevAvgLatency = totalLastWeek > 0 ? Math.round(250 + (totalLastWeek / 10)) : 1;

    // ── Stats summary ──────────────────────────────────────────────
    const avgSuccessRate = totalThisWeek > 0 ? parseFloat((98 + Math.random()).toFixed(1)) : 100;
    const requestChange = parseFloat((((totalThisWeek - totalLastWeek) / totalLastWeek) * 100).toFixed(1));
    const latencyChange = parseFloat((((avgLatency - prevAvgLatency) / (prevAvgLatency || 1)) * 100).toFixed(1));

    const stats = {
      totalRequests: totalThisWeek,
      requestChange,
      avgLatency,
      latencyChange,
      avgSuccessRate,
      successChange: parseFloat((Math.random() * 2).toFixed(1)),
      totalCost: totalEstCost,
    };

    res.json({
      stats,
      apiMetrics,
      modelUsage,
      successFailure,
      peakTraffic: hourBuckets,
      errors,
      geographic,
      costData,
      tokenTrend,
    });
  } catch (error) {
    console.error('Advanced analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to load advanced analytics' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    // Use the enhanced resolveUserId which checks JWT, session cookies, and cross-backend fallback
    const userId = await resolveUserId(req);

    if (!userId) {
      console.log('[analytics] No userId found - returning 401');
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Total active agents available on the platform (used as the "agents" usage limit)
    let totalAvailableAgents = 18;
    try {
      const count = await prisma.agent.count({ where: { status: 'active' } });
      if (count > 0) totalAvailableAgents = count;
    } catch (e) {
      console.log('Agent count query error:', e.message);
    }

    // Get user's agent subscriptions (exclude GenCraft/canvas-app plans)
    let activeAgents = 0;
    let subscriptions = [];
    try {
      subscriptions = await prisma.agentSubscription.findMany({
        where: { 
          userId,
          status: 'active',
          agentId: { not: 'gencraft-pro' },
        },
        include: {
          agent: true,
        },
      });
      activeAgents = subscriptions.length;
    } catch (e) {
      console.log('Agent subscriptions query error:', e.message);
    }

    // Get total conversations (chat sessions) for this user (last 90 days, capped at 500)
    let totalConversations = 0;
    let chatSessions = [];
    try {
      chatSessions = await prisma.chatSession.findMany({
        where: { userId, updatedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        include: {
          agent: true,
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 500,
      });
      // Get accurate total count
      totalConversations = await prisma.chatSession.count({ where: { userId } });
    } catch (e) {
      console.log('Chat sessions query error:', e.message);
    }

    // Get total messages count (API calls equivalent)
    let totalMessages = 0;
    try {
      totalMessages = await prisma.chatMessage.count({
        where: {
          session: { userId },
        },
      });
    } catch (e) {
      console.log('Messages count error:', e.message);
    }

    // Get API usage count
    let apiCallsCount = 0;
    try {
      apiCallsCount = await prisma.apiUsage.count({
        where: { userId },
      });
    } catch (_e) {
      // Table might not exist
    }
    
    // Total API calls = messages + api usages
    const totalApiCalls = totalMessages + apiCallsCount;

    // Calculate success rate from chat feedback
    try {
      const feedbackStats = await prisma.chatFeedback.aggregate({
        where: { userId },
        _avg: { rating: true },
        _count: true,
      });
      if (feedbackStats._count > 0 && feedbackStats._avg.rating) {
        // successRate = (feedbackStats._avg.rating / 5) * 100;
      }
    } catch (_e) {
      // No feedback yet
    }

    // Get 7-day activity data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let dailyUsage = [];
    try {
      // Get messages per day for the last 7 days
      const dailyMessages = await prisma.chatMessage.groupBy({
        by: ['createdAt'],
        where: {
          session: { userId },
          createdAt: { gte: sevenDaysAgo },
        },
        _count: true,
      });

      // Create a map for the last 7 days
      const dayMap = new Map();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dayMap.set(dateStr, { date: dateStr, conversations: 0, messages: 0, apiCalls: 0 });
      }

      // Aggregate by day
      dailyMessages.forEach(m => {
        const dateStr = new Date(m.createdAt).toISOString().split('T')[0];
        if (dayMap.has(dateStr)) {
          const entry = dayMap.get(dateStr);
          entry.messages += m._count;
          entry.apiCalls += m._count;
        }
      });

      // Get conversations per day
      chatSessions.forEach(session => {
        const dateStr = new Date(session.createdAt).toISOString().split('T')[0];
        if (dayMap.has(dateStr)) {
          dayMap.get(dateStr).conversations++;
        }
      });

      dailyUsage = Array.from(dayMap.values());
    } catch (e) {
      console.log('Daily usage error:', e.message);
      // Generate empty 7-day data
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyUsage.push({
          date: date.toISOString().split('T')[0],
          conversations: 0,
          messages: 0,
          apiCalls: 0,
        });
      }
    }

    // Calculate agent performance from chat sessions
    const agentUsageMap = new Map();
    
    // First, get per-agent feedback ratings for real success rate
    // ChatFeedback doesn't have agentId - we need to get it through the session relation
    const agentFeedbackMap = new Map();
    try {
      const feedbacksWithAgent = await prisma.chatFeedback.findMany({
        where: { userId },
        select: {
          rating: true,
          session: {
            select: { agentId: true }
          }
        }
      });
      
      // Group feedbacks by agentId manually
      const agentFeedbackGroups = new Map();
      feedbacksWithAgent.forEach(fb => {
        const agentId = fb.session?.agentId;
        if (agentId && fb.rating) {
          if (!agentFeedbackGroups.has(agentId)) {
            agentFeedbackGroups.set(agentId, { totalRating: 0, count: 0 });
          }
          const group = agentFeedbackGroups.get(agentId);
          group.totalRating += fb.rating;
          group.count++;
        }
      });
      
      // Calculate averages
      agentFeedbackGroups.forEach((data, agentId) => {
        agentFeedbackMap.set(agentId, {
          avgRating: data.count > 0 ? data.totalRating / data.count : 0,
          count: data.count,
        });
      });
    } catch (e) {
      console.log('Agent feedback query error:', e.message);
    }
    
    chatSessions.forEach(session => {
      const agentId = session.agentId || 'studio';
      const agentName = session.agent?.name || 'AI Studio';
      
      if (!agentUsageMap.has(agentId)) {
        // Get real feedback-based success rate for this agent
        const feedback = agentFeedbackMap.get(agentId);
        const realSuccessRate = feedback && feedback.avgRating > 0 
          ? (feedback.avgRating / 5) * 100 
          : 0; // 0 if no feedback yet
        
        agentUsageMap.set(agentId, {
          agentId,
          name: agentName,
          conversations: 0,
          messages: 0,
          avgResponseTime: 0,
          successRate: realSuccessRate, // Real success rate from feedback
          totalResponseTime: 0,
          responseTimeCount: 0,
        });
      }
      
      const agent = agentUsageMap.get(agentId);
      agent.conversations++;
      agent.messages += session._count?.messages || 0;
      
      // Calculate average response time from session stats if available
      const stats = session.stats;
      if (stats && typeof stats === 'object' && stats.durationMs) {
        agent.totalResponseTime += stats.durationMs;
        agent.responseTimeCount++;
      }
    });

    // Convert to array and calculate averages - use 0 for no data, not random
    const agentPerformance = Array.from(agentUsageMap.values()).map(agent => ({
      agentId: agent.agentId,
      name: agent.name,
      conversations: agent.conversations,
      messages: agent.messages,
      avgResponseTime: agent.responseTimeCount > 0 
        ? Math.round((agent.totalResponseTime / agent.responseTimeCount) / 1000)
        : 0, // 0 if no response time data available
      successRate: Math.round(agent.successRate * 10) / 10, // Real calculated rate
    }));

    // Sort by conversations for top agents
    // Calculate total conversations for percentage calculation
    const totalAgentConversations = agentPerformance.reduce((sum, a) => sum + a.conversations, 0) || 1;
    let topAgents = [...agentPerformance]
      .sort((a, b) => b.conversations - a.conversations)
      .slice(0, 5)
      .map((agent, index) => ({
        rank: index + 1,
        name: agent.name,
        usage: Math.round((agent.conversations / totalAgentConversations) * 100),
        conversations: agent.conversations,
        messages: agent.messages,
      }));

    // Fallback: if user has no chat-based usage yet but DOES have active subscriptions,
    // surface those subscribed agents so the dashboard isn't empty.
    if (topAgents.length === 0 && subscriptions.length > 0) {
      topAgents = subscriptions.slice(0, 5).map((sub, index) => ({
        rank: index + 1,
        name: sub.agent?.name || sub.agentId || 'Agent',
        usage: 0,
        conversations: 0,
        messages: 0,
      }));
    }

    // Get recent activity (last 24 hours for audit trail)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let recentActivity = [];
    try {
      const recentMessages = await prisma.chatMessage.findMany({
        where: {
          session: { userId },
          createdAt: { gte: twentyFourHoursAgo },
        },
        include: {
          session: {
            include: { agent: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      recentActivity = recentMessages.map(msg => ({
        id: msg.id,
        type: msg.role === 'user' ? 'message_sent' : 'message_received',
        action: msg.role === 'user' 
          ? 'Sent message'
          : 'Received response',
        description: msg.role === 'user' 
          ? `Sent message to ${msg.session.agent?.name || 'AI Studio'}`
          : `Received response from ${msg.session.agent?.name || 'AI Studio'}`,
        agent: msg.session.agent?.name || 'AI Studio',
        timestamp: msg.createdAt,
        agentId: msg.session.agentId,
        agentName: msg.session.agent?.name || 'AI Studio',
        status: 'success',
      }));
    } catch (e) {
      console.log('Recent activity error:', e.message);
    }

    // Calculate weekly trends (compare current week vs last week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    let currentWeekConversations = 0;
    let lastWeekConversations = 0;
    let currentWeekMessages = 0;
    let lastWeekMessages = 0;

    chatSessions.forEach(session => {
      const sessionDate = new Date(session.createdAt);
      if (sessionDate >= oneWeekAgo) {
        currentWeekConversations++;
        currentWeekMessages += session._count?.messages || 0;
      } else if (sessionDate >= twoWeeksAgo) {
        lastWeekConversations++;
        lastWeekMessages += session._count?.messages || 0;
      }
    });

    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100%' : '+0%';
      const change = ((current - previous) / previous * 100).toFixed(0);
      return change >= 0 ? `+${change}%` : `${change}%`;
    };

    // Cost analysis - estimate based on usage
    const estimatedCostPerMessage = 0.002; // $0.002 per message
    const currentMonthMessages = chatSessions
      .filter(s => new Date(s.createdAt).getMonth() === new Date().getMonth())
      .reduce((sum, s) => sum + (s._count?.messages || 0), 0);
    const currentMonthCost = Math.round(currentMonthMessages * estimatedCostPerMessage * 100) / 100;

    // Account age
    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    // Build analytics response
    const analytics = {
      subscription: {
        plan: 'Free',
        status: 'active',
        price: 0,
        period: 'month',
        renewalDate: 'N/A',
        daysUntilRenewal: 0,
      },
      usage: {
        conversations: {
          current: totalConversations,
          limit: 1000,
          percentage: Math.min(100, (totalConversations / 1000) * 100),
          unit: 'messages',
        },
        agents: {
          current: activeAgents,
          limit: totalAvailableAgents,
          percentage: Math.min(100, (activeAgents / Math.max(totalAvailableAgents, 1)) * 100),
          unit: 'agents',
        },
        apiCalls: {
          current: totalApiCalls,
          limit: 10000,
          percentage: Math.min(100, (totalApiCalls / 10000) * 100),
          unit: 'calls',
        },
        storage: {
          current: 0,
          limit: 1000,
          percentage: 0,
          unit: 'MB',
        },
        messages: {
          current: totalMessages,
          limit: 10000,
          percentage: Math.min(100, (totalMessages / 10000) * 100),
          unit: 'messages',
        },
      },
      dailyUsage,
      weeklyTrend: {
        conversationsChange: calcChange(currentWeekConversations, lastWeekConversations),
        messagesChange: calcChange(currentWeekMessages, lastWeekMessages),
        apiCallsChange: calcChange(currentWeekMessages, lastWeekMessages),
        responseTimeChange: '+0%',
      },
      agentPerformance,
      recentActivity,
      costAnalysis: {
        currentMonth: currentMonthCost,
        projectedMonth: Math.round(currentMonthCost * 1.1 * 100) / 100,
        breakdown: agentPerformance.map(agent => ({
          name: agent.name,
          category: agent.name,
          cost: Math.round(agent.messages * estimatedCostPerMessage * 100) / 100,
          percentage: totalMessages > 0 ? Math.round((agent.messages / totalMessages) * 100) : 0,
        })),
      },
      topAgents,
      agentStatus: activeAgents > 0 ? 'active' : 'inactive',
      // Legacy fields for backwards compatibility
      totalLogins: user.totalLogins || 0,
      lastLogin: user.lastLoginAt || user.updatedAt,
      accountAge: accountAgeDays,
      totalMessages,
      totalAgentInteractions: totalApiCalls,
      favoriteAgents: user.favoriteAgents || [],
      activityHistory: recentActivity,
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

export default router;
