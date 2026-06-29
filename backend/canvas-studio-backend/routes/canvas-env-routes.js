/**
 * CANVAS ENV VAR ROUTES — /api/canvas-env
 *
 * Per-project environment variable persistence in the DB.
 * Secret values are AES-256-GCM encrypted at rest.
 *
 *   GET    /:projectId      — list env vars (secret values masked as "••••••••")
 *   PUT    /:projectId      — bulk replace all env vars for the project
 *   PATCH  /:projectId      — upsert a single env var
 *   DELETE /:projectId/:key — delete a single env var by key
 *   GET    /:projectId/export — export as .env file content (for download)
 */

import express from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

// ── Encryption helpers (AES-256-GCM) ────────────────────────────
const ENC_KEY_RAW = process.env.ENV_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'canvas-studio-env-encryption-key-default-32ch';
const ENC_KEY = crypto.createHash('sha256').update(ENC_KEY_RAW).digest(); // 32 bytes

function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(ciphertext) {
  try {
    const [ivHex, tagHex, encHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return ciphertext; // Return as-is if not encrypted (legacy)
  }
}

/** Check ownership and return project */
async function ownedProject(projectId, userId) {
  return prisma.canvasProject.findFirst({ where: { id: projectId, userId }, select: { id: true } });
}

/** Mask secret value for API responses */
function maskValue(value) {
  return '••••••••';
}

/** Shape a DB row → API response object */
function toPublic(row, reveal = false) {
  return {
    key: row.key,
    value: row.isSecret && !reveal ? maskValue(row.value) : (row.isSecret ? decrypt(row.value) : row.value),
    isSecret: row.isSecret,
    description: row.description || undefined,
    updatedAt: row.updatedAt?.toISOString(),
  };
}

// ── GET /:projectId ──────────────────────────────────────────────
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const project = await ownedProject(req.params.projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const rows = await prisma.canvasEnvVar.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { key: 'asc' },
    });

    res.json({ success: true, variables: rows.map((r) => toPublic(r)) });
  } catch (err) {
    console.error('[EnvRoutes] list error:', err);
    res.status(500).json({ success: false, error: 'Failed to load env vars' });
  }
});

// ── PUT /:projectId — bulk replace ───────────────────────────────
// Body: { variables: Array<{ key, value, isSecret, description? }> }
router.put('/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await ownedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { variables } = req.body;
    if (!Array.isArray(variables)) {
      return res.status(400).json({ success: false, error: 'variables array is required' });
    }

    // Validate keys
    const invalidKeys = variables.filter((v) => !v.key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(v.key));
    if (invalidKeys.length > 0) {
      return res.status(400).json({ success: false, error: `Invalid env var keys: ${invalidKeys.map((v) => v.key).join(', ')}` });
    }

    // Delete all existing vars, then re-create
    await prisma.canvasEnvVar.deleteMany({ where: { projectId } });

    if (variables.length > 0) {
      await prisma.canvasEnvVar.createMany({
        data: variables.map((v) => ({
          projectId,
          userId: req.userId,
          key: v.key.trim(),
          value: v.isSecret ? encrypt(String(v.value ?? '')) : String(v.value ?? ''),
          isSecret: Boolean(v.isSecret),
          description: v.description?.trim() || null,
        })),
        skipDuplicates: true,
      });
    }

    const saved = await prisma.canvasEnvVar.findMany({ where: { projectId }, orderBy: { key: 'asc' } });
    res.json({ success: true, variables: saved.map((r) => toPublic(r)), count: saved.length });
  } catch (err) {
    console.error('[EnvRoutes] bulk replace error:', err);
    res.status(500).json({ success: false, error: 'Failed to save env vars' });
  }
});

// ── PATCH /:projectId — upsert single var ────────────────────────
// Body: { key, value, isSecret?, description? }
router.patch('/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await ownedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { key, value, isSecret = false, description } = req.body;
    if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      return res.status(400).json({ success: false, error: 'Invalid env var key' });
    }

    const storedValue = isSecret ? encrypt(String(value ?? '')) : String(value ?? '');

    const row = await prisma.canvasEnvVar.upsert({
      where: { projectId_key: { projectId, key: key.trim() } },
      create: { projectId, userId: req.userId, key: key.trim(), value: storedValue, isSecret, description: description || null },
      update: { value: storedValue, isSecret, description: description || null },
    });

    res.json({ success: true, variable: toPublic(row) });
  } catch (err) {
    console.error('[EnvRoutes] upsert error:', err);
    res.status(500).json({ success: false, error: 'Failed to save env var' });
  }
});

// ── DELETE /:projectId/:key ──────────────────────────────────────
router.delete('/:projectId/:key', requireAuth, async (req, res) => {
  try {
    const { projectId, key } = req.params;
    const project = await ownedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    await prisma.canvasEnvVar.deleteMany({ where: { projectId, key } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete env var' });
  }
});

// ── GET /:projectId/export ───────────────────────────────────────
// Returns plain-text .env file content (decrypted)
router.get('/:projectId/export', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await ownedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const rows = await prisma.canvasEnvVar.findMany({ where: { projectId }, orderBy: { key: 'asc' } });
    const lines = rows.map((r) => {
      const val = r.isSecret ? decrypt(r.value) : r.value;
      return r.description ? `# ${r.description}\n${r.key}="${val}"` : `${r.key}="${val}"`;
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=".env"');
    res.send(lines.join('\n') + '\n');
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to export env vars' });
  }
});

export default router;
