/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CANVAS MONITORING ROUTES
 * Real-time logs, error groups, and health status for canvas projects.
 *
 * Uses CanvasMonitoringLog and CanvasErrorGroup models for persistent storage,
 * and aggregates data from CanvasBuild and CanvasDeployment for health checks.
 *
 * Endpoints:
 *   GET  /logs/:projectId              — Paginated, filterable log stream
 *   GET  /errors/:projectId            — Error groups (open/resolved)
 *   GET  /health/:projectId            — Health composite from builds/deploys/sandbox
 *   POST /errors/:projectId/resolve    — Mark error group as resolved
 *   POST /logs/:projectId              — Ingest new log entry (internal/sandbox)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

// ============================================
// GET /logs/:projectId
// Retrieve monitoring logs with filtering & pagination
// ============================================
router.get('/logs/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { level, search, limit = '100', offset = '0' } = req.query;

    // Verify project ownership
    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        OR: [{ userId: req.userId }, { isPublic: true }],
      },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Build filter
    const where = { projectId };
    if (level && level !== 'all') {
      where.severity = level;
    }
    if (search) {
      where.message = { contains: search, mode: 'insensitive' };
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 100, 500);
    const parsedOffset = parseInt(offset, 10) || 0;

    // Fetch logs from monitoring table
    const logs = await prisma.canvasMonitoringLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
      skip: parsedOffset,
      select: {
        id: true,
        severity: true,
        message: true,
        source: true,
        metadata: true,
        createdAt: true,
      },
    });

    // If no persisted logs, aggregate from build logs as fallback
    if (logs.length === 0) {
      const builds = await prisma.canvasBuild.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          logs: true,
          errorMessage: true,
          createdAt: true,
        },
      });

      const buildLogs = [];
      for (const build of builds) {
        if (build.errorMessage) {
          buildLogs.push({
            id: `build-err-${build.id}`,
            severity: 'error',
            message: build.errorMessage,
            source: 'build',
            metadata: null,
            createdAt: build.createdAt,
          });
        }
        if (build.logs) {
          // Parse build log text into individual entries
          const lines = build.logs.split('\n').filter(Boolean).slice(-20);
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const severity = /error|fail/i.test(line) ? 'error'
              : /warn/i.test(line) ? 'warning'
              : 'info';
            buildLogs.push({
              id: `build-${build.id}-${i}`,
              severity,
              message: line.trim(),
              source: 'build',
              metadata: null,
              createdAt: build.createdAt,
            });
          }
        }
      }

      return res.json({
        success: true,
        logs: buildLogs.slice(0, parsedLimit),
        total: buildLogs.length,
        source: 'build-logs',
      });
    }

    return res.json({
      success: true,
      logs,
      total: logs.length,
      source: 'monitoring',
    });
  } catch (error) {
    console.error('[Canvas Monitoring] Logs error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs',
    });
  }
});

// ============================================
// GET /errors/:projectId
// Retrieve error groups for a project
// ============================================
router.get('/errors/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { resolved = 'false' } = req.query;

    // Verify ownership
    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        OR: [{ userId: req.userId }, { isPublic: true }],
      },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Query error groups from persistent table
    const showResolved = resolved === 'true';
    const groups = await prisma.canvasErrorGroup.findMany({
      where: {
        projectId,
        ...(showResolved ? {} : { resolved: false }),
      },
      orderBy: { lastSeen: 'desc' },
      take: 100,
    });

    // If no persisted error groups yet, aggregate from CanvasBuild errors
    if (groups.length === 0 && !showResolved) {
      const builds = await prisma.canvasBuild.findMany({
        where: {
          projectId,
          status: 'failed',
          errorMessage: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          errorMessage: true,
          errorStack: true,
          createdAt: true,
        },
      });

      // Create synthetic error groups from build failures
      const errorMap = new Map();
      for (const build of builds) {
        const fingerprint = hashString(build.errorMessage || 'unknown');
        if (errorMap.has(fingerprint)) {
          const existing = errorMap.get(fingerprint);
          existing.count += 1;
          if (new Date(build.createdAt) > new Date(existing.lastSeen)) {
            existing.lastSeen = build.createdAt;
          }
        } else {
          errorMap.set(fingerprint, {
            fingerprint,
            message: build.errorMessage,
            severity: 'error',
            count: 1,
            firstSeen: build.createdAt,
            lastSeen: build.createdAt,
            resolved: false,
          });
        }
      }

      return res.json({
        success: true,
        groups: Array.from(errorMap.values()),
        source: 'build-errors',
      });
    }

    return res.json({
      success: true,
      groups: groups.map(g => ({
        fingerprint: g.fingerprint,
        message: g.message,
        severity: g.severity,
        count: g.count,
        firstSeen: g.firstSeen,
        lastSeen: g.lastSeen,
        resolved: g.resolved,
      })),
      source: 'monitoring',
    });
  } catch (error) {
    console.error('[Canvas Monitoring] Errors error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve error groups',
    });
  }
});

// ============================================
// GET /health/:projectId
// Composite health check from builds, deployments, sandboxes
// ============================================
router.get('/health/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        OR: [{ userId: req.userId }, { isPublic: true }],
      },
      select: {
        id: true,
        name: true,
        status: true,
        lastBuildStatus: true,
        lastBuildAt: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Get active deployments
    const deployments = await prisma.canvasDeployment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        url: true,
        status: true,
        healthCheckUrl: true,
        requestCount: true,
        bandwidthUsed: true,
        lastAccessedAt: true,
        deployedAt: true,
      },
    });

    // Check deployment health
    const deploymentHealth = deployments.map(dep => ({
      id: dep.id,
      url: dep.url,
      healthy: dep.status === 'live',
      status: dep.status,
      requestCount: dep.requestCount,
      bandwidthUsed: Number(dep.bandwidthUsed),
      lastAccessed: dep.lastAccessedAt,
    }));

    // Get recent builds for sandbox health estimation
    const recentBuilds = await prisma.canvasBuild.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Sandbox health derived from build status
    const sandboxes = recentBuilds
      .filter(b => b.status === 'building' || b.status === 'completed')
      .map(b => ({
        id: b.id,
        healthy: b.status === 'completed',
      }));

    // Aggregate recent log events
    const recentEvents = await prisma.canvasMonitoringLog.findMany({
      where: { projectId, severity: { in: ['error', 'critical', 'warning'] } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        severity: true,
        message: true,
        createdAt: true,
      },
    });

    // Overall health: healthy if at least one live deployment and no critical errors
    const hasLiveDeployment = deploymentHealth.some(d => d.healthy);
    const hasCriticalErrors = recentEvents.some(e => e.severity === 'critical');
    const overallStatus = hasCriticalErrors ? 'unhealthy'
      : hasLiveDeployment ? 'healthy'
      : deployments.length === 0 ? 'healthy' // No deployments yet is fine
      : 'unhealthy';

    return res.json({
      success: true,
      status: overallStatus,
      sandboxes,
      deployments: deploymentHealth,
      recentEvents,
      lastBuild: {
        status: project.lastBuildStatus,
        at: project.lastBuildAt,
      },
    });
  } catch (error) {
    console.error('[Canvas Monitoring] Health error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve health status',
    });
  }
});

// ============================================
// POST /errors/:projectId/resolve
// Mark an error group as resolved
// ============================================
router.post('/errors/:projectId/resolve', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { fingerprint } = req.body;

    if (!fingerprint) {
      return res.status(400).json({
        success: false,
        message: 'Error fingerprint is required',
      });
    }

    // Verify ownership
    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        userId: req.userId,
      },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Try to resolve in the persistent error group table
    try {
      await prisma.canvasErrorGroup.updateMany({
        where: {
          projectId,
          fingerprint,
          resolved: false,
        },
        data: {
          resolved: true,
          resolvedAt: new Date(),
        },
      });
    } catch {
      // Table might not have entries yet (synthetic groups from builds)
      // This is acceptable — the frontend already removes it from the list
    }

    return res.json({
      success: true,
      message: 'Error resolved',
    });
  } catch (error) {
    console.error('[Canvas Monitoring] Resolve error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve error',
    });
  }
});

// ============================================
// POST /logs/:projectId
// Ingest a new log entry (from sandbox, build pipeline, etc.)
// ============================================
router.post('/logs/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { severity = 'info', message, source, metadata } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Log message is required',
      });
    }

    const validSeverities = ['critical', 'error', 'warning', 'info', 'debug'];
    const safeSeverity = validSeverities.includes(severity) ? severity : 'info';

    // Verify ownership
    const project = await prisma.canvasProject.findFirst({
      where: { id: projectId, userId: req.userId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    const log = await prisma.canvasMonitoringLog.create({
      data: {
        projectId,
        severity: safeSeverity,
        message: message.slice(0, 10000), // Cap message length
        source: source || null,
        metadata: metadata || null,
      },
    });

    // If this is an error or critical log, upsert an error group
    if (safeSeverity === 'error' || safeSeverity === 'critical') {
      const fp = hashString(message);
      try {
        const existing = await prisma.canvasErrorGroup.findUnique({
          where: { projectId_fingerprint: { projectId, fingerprint: fp } },
        });

        if (existing) {
          await prisma.canvasErrorGroup.update({
            where: { id: existing.id },
            data: {
              count: { increment: 1 },
              lastSeen: new Date(),
              resolved: false, // Re-open on new occurrence
              resolvedAt: null,
            },
          });
        } else {
          await prisma.canvasErrorGroup.create({
            data: {
              projectId,
              fingerprint: fp,
              message: message.slice(0, 2000),
              severity: safeSeverity,
            },
          });
        }
      } catch (err) {
        console.error('[Canvas Monitoring] Error group upsert failed:', err.message);
      }
    }

    return res.json({
      success: true,
      log: { id: log.id, severity: log.severity, message: log.message, createdAt: log.createdAt },
    });
  } catch (error) {
    console.error('[Canvas Monitoring] Log ingest error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to ingest log',
    });
  }
});

// ============================================
// Utility: Simple string hash for error fingerprinting
// ============================================
function hashString(str) {
  let hash = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0; // Convert to 32-bit int
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

export default router;
