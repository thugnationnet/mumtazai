/**
 * DEVICE TRACKING — SecureTrace System
 * 
 * Public endpoints (device → server):
 *   POST /api/tracking/register   — first install, returns device token
 *   POST /api/tracking/ping       — periodic GPS update (uses device token)
 *
 * Admin-only endpoints:
 *   GET  /api/admin/tracking/devices           — list all devices with last location
 *   GET  /api/admin/tracking/devices/:id       — single device + full location history
 *   POST /api/admin/tracking/devices/:id/lost  — mark device as lost
 *   POST /api/admin/tracking/devices/:id/unlock — mark location as paid/unlocked
 *   DELETE /api/admin/tracking/devices/:id     — remove device
 */

import express from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth-middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict rate limit for device pings (prevent abuse)
const pingLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,                   // max 10 pings/min per IP
  message: { success: false, message: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Helpers ──────────────────────────────────────────────────

function hashFingerprint(raw) {
  if (!raw) return null;
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function sanitizeIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim().slice(0, 45);
  return String(req.socket?.remoteAddress || '').slice(0, 45);
}

// ── PUBLIC: Device registration ───────────────────────────────

/**
 * POST /api/tracking/register
 * Called once on first install. Returns a secret deviceToken.
 * If same device fingerprint tries again → blocked with contact message.
 *
 * Body: { fingerprint, deviceName, deviceModel, deviceOS, deviceOSVersion, appVersion, ownerEmail, ownerPhone }
 */
router.post('/register', pingLimiter, async (req, res) => {
  try {
    const {
      fingerprint,
      deviceName,
      deviceModel,
      deviceOS,
      deviceOSVersion,
      appVersion,
      ownerEmail,
      ownerPhone,
    } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ success: false, message: 'Device fingerprint required.' });
    }

    const imeiHash = hashFingerprint(fingerprint);

    // Check if this device is already registered
    const existing = await prisma.trackedDevice.findUnique({ where: { imeiHash } });
    if (existing) {
      // Return 200 (not 409) so browser doesn't log a red console error
      return res.status(200).json({
        success: false,
        message: 'This device is already registered. Please contact the SecureTrace team.',
        contactEmail: process.env.SUPPORT_EMAIL || 'support@mumtaz.ai',
      });
    }

    const deviceToken = crypto.randomBytes(32).toString('hex');

    const device = await prisma.trackedDevice.create({
      data: {
        deviceToken,
        imeiHash,
        deviceName: deviceName ? String(deviceName).slice(0, 200) : null,
        deviceModel: deviceModel ? String(deviceModel).slice(0, 200) : null,
        deviceOS: deviceOS ? String(deviceOS).slice(0, 50) : null,
        deviceOSVersion: deviceOSVersion ? String(deviceOSVersion).slice(0, 50) : null,
        appVersion: appVersion ? String(appVersion).slice(0, 50) : null,
        ownerEmail: ownerEmail ? String(ownerEmail).slice(0, 255) : null,
        ownerPhone: ownerPhone ? String(ownerPhone).slice(0, 30) : null,
        registeredIp: sanitizeIp(req),
      },
    });

    return res.json({
      success: true,
      deviceToken,
      deviceId: device.id,
      message: 'Device registered successfully.',
    });
  } catch (err) {
    console.error('[device-tracking] register error:', err);
    return res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

// ── PUBLIC: Location ping ─────────────────────────────────────

/**
 * POST /api/tracking/ping
 * Periodic location update from device. Uses Authorization: Bearer <deviceToken>
 *
 * Body: { lat, lng, accuracy?, altitude?, speed?, heading?, battery?, network? }
 */
router.post('/ping', pingLimiter, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const deviceToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!deviceToken) {
      return res.status(401).json({ success: false, message: 'Device token required.' });
    }

    const device = await prisma.trackedDevice.findUnique({ where: { deviceToken } });
    if (!device || !device.isActive) {
      return res.status(401).json({ success: false, message: 'Unknown or inactive device.' });
    }

    const { lat, lng, accuracy, altitude, speed, heading, battery, network } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'lat and lng are required.' });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates.' });
    }

    const now = new Date();

    // Create ping + update device last-seen in parallel
    await Promise.all([
      prisma.deviceLocationPing.create({
        data: {
          deviceId: device.id,
          lat: latNum,
          lng: lngNum,
          accuracy: accuracy != null ? parseFloat(accuracy) : null,
          altitude: altitude != null ? parseFloat(altitude) : null,
          speed: speed != null ? parseFloat(speed) : null,
          heading: heading != null ? parseFloat(heading) : null,
          battery: battery != null ? parseInt(battery, 10) : null,
          network: network ? String(network).slice(0, 20) : null,
          ipAddress: sanitizeIp(req),
        },
      }),
      prisma.trackedDevice.update({
        where: { id: device.id },
        data: {
          lastSeenAt: now,
          lastLat: latNum,
          lastLng: lngNum,
          lastAccuracy: accuracy != null ? parseFloat(accuracy) : null,
          lastBattery: battery != null ? parseInt(battery, 10) : null,
          lastNetwork: network ? String(network).slice(0, 20) : null,
        },
      }),
    ]);

    return res.json({
      success: true,
      // If device is marked lost, tell it to ping more frequently
      pingIntervalMs: device.isLost ? 30000 : 300000,
    });
  } catch (err) {
    console.error('[device-tracking] ping error:', err);
    return res.status(500).json({ success: false, message: 'Ping failed.' });
  }
});

// ── ADMIN: All routes below require admin auth ────────────────

/**
 * GET /api/admin/tracking/devices
 * Returns all tracked devices with last known location.
 */
router.get('/devices', requireAdmin, async (req, res) => {
  try {
    const devices = await prisma.trackedDevice.findMany({
      orderBy: { lastSeenAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        deviceModel: true,
        deviceOS: true,
        deviceOSVersion: true,
        ownerEmail: true,
        ownerPhone: true,
        registeredIp: true,
        isLost: true,
        isActive: true,
        lastSeenAt: true,
        lastLat: true,
        lastLng: true,
        lastAccuracy: true,
        lastBattery: true,
        lastNetwork: true,
        locationUnlocked: true,
        paymentRef: true,
        notes: true,
        createdAt: true,
      },
    });

    return res.json({ success: true, devices });
  } catch (err) {
    console.error('[device-tracking] admin list error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch devices.' });
  }
});

/**
 * GET /api/admin/tracking/devices/:id
 * Full device info + last 500 location pings.
 */
router.get('/devices/:id', requireAdmin, async (req, res) => {
  try {
    const device = await prisma.trackedDevice.findUnique({
      where: { id: req.params.id },
      include: {
        pings: {
          orderBy: { timestamp: 'desc' },
          take: 500,
        },
      },
    });

    if (!device) return res.status(404).json({ success: false, message: 'Device not found.' });

    return res.json({ success: true, device });
  } catch (err) {
    console.error('[device-tracking] admin single device error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch device.' });
  }
});

/**
 * POST /api/admin/tracking/devices/:id/lost
 * Mark device as lost (increases ping frequency from device).
 */
router.post('/devices/:id/lost', requireAdmin, async (req, res) => {
  try {
    const { isLost = true } = req.body;
    const device = await prisma.trackedDevice.update({
      where: { id: req.params.id },
      data: { isLost: Boolean(isLost) },
    });
    return res.json({ success: true, device });
  } catch (err) {
    console.error('[device-tracking] mark lost error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update device.' });
  }
});

/**
 * POST /api/admin/tracking/devices/:id/unlock
 * Mark location as paid/unlocked (owner has paid to see location).
 */
router.post('/devices/:id/unlock', requireAdmin, async (req, res) => {
  try {
    const { paymentRef } = req.body;
    const device = await prisma.trackedDevice.update({
      where: { id: req.params.id },
      data: {
        locationUnlocked: true,
        paymentRef: paymentRef ? String(paymentRef).slice(0, 255) : null,
      },
    });
    return res.json({ success: true, device });
  } catch (err) {
    console.error('[device-tracking] unlock error:', err);
    return res.status(500).json({ success: false, message: 'Failed to unlock device.' });
  }
});

/**
 * PATCH /api/admin/tracking/devices/:id
 * Update notes or admin fields on a device.
 */
router.patch('/devices/:id', requireAdmin, async (req, res) => {
  try {
    const { notes, isActive } = req.body;
    const data = {};
    if (notes !== undefined) data.notes = String(notes).slice(0, 1000);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const device = await prisma.trackedDevice.update({
      where: { id: req.params.id },
      data,
    });
    return res.json({ success: true, device });
  } catch (err) {
    console.error('[device-tracking] patch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update device.' });
  }
});

/**
 * DELETE /api/admin/tracking/devices/:id
 * Remove device and all its pings.
 */
router.delete('/devices/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.trackedDevice.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Device deleted.' });
  } catch (err) {
    console.error('[device-tracking] delete error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete device.' });
  }
});

export default router;
