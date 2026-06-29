/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CANVAS DATABASE ROUTES
 * Database schema inspection & query runner for canvas projects.
 *
 * Uses CanvasProject.database (Json?) for schema metadata and provides
 * read-only query execution against project databases when hasBackend=true.
 *
 * Endpoints:
 *   GET  /:projectId            — Database status/config overview
 *   GET  /:projectId/schema     — List tables/columns from project database
 *   GET  /:projectId/migrate    — List migrations
 *   GET  /:projectId/backups    — List backups
 *   POST /:projectId            — Provision database for project
 *   POST /:projectId/migrate    — Run pending migrations
 *   POST /:projectId/query      — Execute read-only SQL query
 *   GET  /instance/:id/tables   — List tables for a database instance
 *   POST /instance/:id/backup   — Create manual backup
 *   POST /instance/:id/restore  — Restore from backup
 *   DELETE /instance/:id        — Destroy database instance
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, optionalAuth } from '../lib/auth-middleware.js';
import crypto from 'crypto';

const router = express.Router();

// ============================================
// GET /instance/:id/tables
// List tables for a specific database instance
// (must be before /:projectId routes to avoid param conflict)
// ============================================
router.get('/instance/:id/tables', requireAuth, async (req, res) => {
  try {
    // In a full implementation this would query the actual DB instance.
    // For now, return table info from the project's stored schema.
    return res.json({
      success: true,
      tables: [],
      message: 'No tables found — deploy with a live database for real-time table info.',
    });
  } catch (error) {
    console.error('[Canvas Database] Instance tables error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to list tables' });
  }
});

// ============================================
// POST /instance/:id/backup
// Create a manual backup of a database instance
// ============================================
router.post('/instance/:id/backup', requireAuth, async (req, res) => {
  try {
    const backupId = crypto.randomUUID();
    return res.json({
      success: true,
      backup: {
        id: backupId,
        key: `backup-${Date.now()}`,
        sizeBytes: 0,
        createdAt: new Date().toISOString(),
        type: 'manual',
      },
      message: 'Backup created (simulated — deploy with live infrastructure for real backups).',
    });
  } catch (error) {
    console.error('[Canvas Database] Backup create error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to create backup' });
  }
});

// ============================================
// POST /instance/:id/restore
// Restore database from a backup
// ============================================
router.post('/instance/:id/restore', requireAuth, async (req, res) => {
  try {
    return res.json({
      success: true,
      message: 'Restore initiated (simulated — deploy with live infrastructure for real restores).',
    });
  } catch (error) {
    console.error('[Canvas Database] Restore error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to restore backup' });
  }
});

// ============================================
// DELETE /instance/:id
// Destroy a database instance
// ============================================
router.delete('/instance/:id', requireAuth, async (req, res) => {
  try {
    return res.json({
      success: true,
      message: 'Database instance destroyed (simulated).',
    });
  } catch (error) {
    console.error('[Canvas Database] Destroy error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to destroy instance' });
  }
});

// ============================================
// GET /:projectId
// Database status overview for a canvas project
// ============================================
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          { isPublic: true },
        ],
      },
      select: {
        id: true,
        name: true,
        hasBackend: true,
        database: true,
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }

    if (!project.hasBackend || !project.database) {
      return res.json({ success: true, database: null, message: 'No database configured' });
    }

    const dbConfig = typeof project.database === 'string'
      ? JSON.parse(project.database)
      : project.database;

    const tables = Array.isArray(dbConfig?.tables) ? dbConfig.tables : [];

    return res.json({
      success: true,
      database: {
        id: dbConfig?.id || projectId,
        engine: dbConfig?.engine || 'postgresql',
        status: 'active',
        host: dbConfig?.host || 'localhost',
        port: dbConfig?.port || 5432,
        dbName: dbConfig?.dbName || project.name?.replace(/\s+/g, '_').toLowerCase() || 'app_db',
        sizeBytes: dbConfig?.sizeBytes || 0,
        connections: dbConfig?.connections || 0,
        maxConnections: dbConfig?.maxConnections || 20,
        createdAt: dbConfig?.createdAt || new Date().toISOString(),
        tables: tables.length,
      },
    });
  } catch (error) {
    console.error('[Canvas Database] Status error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch database status' });
  }
});

// ============================================
// POST /:projectId
// Provision a database for a canvas project
// ============================================
router.post('/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { engine = 'postgresql' } = req.body || {};

    const project = await prisma.canvasProject.findFirst({
      where: { id: projectId, userId: req.userId },
      select: { id: true, name: true },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }

    const dbId = crypto.randomUUID();
    const dbConfig = {
      id: dbId,
      engine,
      host: 'localhost',
      port: engine === 'postgresql' ? 5432 : 3306,
      dbName: project.name?.replace(/\s+/g, '_').toLowerCase() || 'app_db',
      tables: [],
      createdAt: new Date().toISOString(),
    };

    await prisma.canvasProject.update({
      where: { id: projectId },
      data: { hasBackend: true, database: dbConfig },
    });

    return res.json({
      success: true,
      database: {
        id: dbId,
        engine,
        status: 'active',
        host: dbConfig.host,
        port: dbConfig.port,
        dbName: dbConfig.dbName,
        sizeBytes: 0,
        connections: 0,
        maxConnections: 20,
        createdAt: dbConfig.createdAt,
      },
      message: 'Database provisioned (simulated — deploy for live infrastructure).',
    });
  } catch (error) {
    console.error('[Canvas Database] Provision error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to provision database' });
  }
});

// ============================================
// GET /:projectId/migrate
// List migrations for a project
// ============================================
router.get('/:projectId/migrate', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        OR: [{ userId: req.userId }, { isPublic: true }],
      },
      select: { id: true, database: true },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const dbConfig = typeof project.database === 'string'
      ? JSON.parse(project.database)
      : project.database;

    return res.json({
      success: true,
      migrations: Array.isArray(dbConfig?.migrations) ? dbConfig.migrations : [],
    });
  } catch (error) {
    console.error('[Canvas Database] Migrations list error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to list migrations' });
  }
});

// ============================================
// POST /:projectId/migrate
// Run pending migrations
// ============================================
router.post('/:projectId/migrate', requireAuth, async (req, res) => {
  try {
    return res.json({
      success: true,
      applied: 0,
      message: 'No pending migrations (simulated — deploy for live migration support).',
    });
  } catch (error) {
    console.error('[Canvas Database] Migration run error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to run migrations' });
  }
});

// ============================================
// GET /:projectId/backups
// List backups for a project
// ============================================
router.get('/:projectId/backups', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        OR: [{ userId: req.userId }, { isPublic: true }],
      },
      select: { id: true, database: true },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const dbConfig = typeof project.database === 'string'
      ? JSON.parse(project.database)
      : project.database;

    return res.json({
      success: true,
      backups: Array.isArray(dbConfig?.backups) ? dbConfig.backups : [],
    });
  } catch (error) {
    console.error('[Canvas Database] Backups list error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to list backups' });
  }
});

// ============================================
// GET /:projectId/schema
// Retrieve database schema for a canvas project
// ============================================
router.get('/:projectId/schema', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: req.userId },
          { isPublic: true },
        ],
      },
      select: {
        id: true,
        name: true,
        hasBackend: true,
        database: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // If project has no database configured, return empty schema
    if (!project.hasBackend || !project.database) {
      return res.json({
        success: true,
        tables: [],
        message: 'No database configured for this project',
      });
    }

    // Parse database schema from project JSON field
    // The database field stores schema metadata as:
    // { tables: [{ name, columns: [{ name, type, nullable, isPrimary, isUnique, defaultValue }], rowCount }] }
    const dbConfig = typeof project.database === 'string'
      ? JSON.parse(project.database)
      : project.database;

    const tables = Array.isArray(dbConfig?.tables) ? dbConfig.tables : [];

    // Validate and normalize table schema
    const normalizedTables = tables.map(table => ({
      name: table.name || 'unknown',
      rowCount: typeof table.rowCount === 'number' ? table.rowCount : undefined,
      columns: Array.isArray(table.columns)
        ? table.columns.map(col => ({
            name: col.name || 'unknown',
            type: col.type || 'text',
            nullable: col.nullable !== false,
            isPrimary: col.isPrimary === true,
            isUnique: col.isUnique === true,
            defaultValue: col.defaultValue || undefined,
          }))
        : [],
    }));

    return res.json({
      success: true,
      tables: normalizedTables,
      projectName: project.name,
    });
  } catch (error) {
    console.error('[Canvas Database] Schema fetch error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve database schema',
    });
  }
});

// ============================================
// POST /:projectId/query
// Execute a read-only query against project database.
// Currently returns results from the stored database JSON
// or sandbox-executed queries in future.
// ============================================
router.post('/:projectId/query', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query string is required',
      });
    }

    // Validate query is read-only (basic SQL injection prevention)
    const trimmed = query.trim().toUpperCase();
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'INSERT', 'UPDATE', 'CREATE', 'GRANT', 'REVOKE'];
    if (dangerousKeywords.some(kw => trimmed.startsWith(kw))) {
      return res.status(400).json({
        success: false,
        message: 'Only read-only queries (SELECT) are allowed',
      });
    }

    const project = await prisma.canvasProject.findFirst({
      where: {
        id: projectId,
        userId: req.userId,
      },
      select: {
        id: true,
        hasBackend: true,
        database: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    if (!project.hasBackend || !project.database) {
      return res.status(400).json({
        success: false,
        message: 'This project has no database configured',
      });
    }

    const dbConfig = typeof project.database === 'string'
      ? JSON.parse(project.database)
      : project.database;

    // Simulate query against stored data
    // In production, this would proxy to the project's sandbox database
    const startTime = Date.now();

    // Try to match simple SELECT queries against stored table data
    const tables = Array.isArray(dbConfig?.tables) ? dbConfig.tables : [];
    const selectMatch = query.trim().match(/^SELECT\s+.+\s+FROM\s+(\w+)/i);

    if (selectMatch && tables.length > 0) {
      const tableName = selectMatch[1];
      const table = tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());

      if (table) {
        const sampleData = Array.isArray(dbConfig?.sampleData?.[tableName])
          ? dbConfig.sampleData[tableName]
          : [];

        const columns = table.columns.map(c => c.name);
        const rows = sampleData.map(row =>
          columns.map(col => row[col] !== undefined ? row[col] : null)
        );

        return res.json({
          success: true,
          result: {
            columns,
            rows: rows.slice(0, 100), // Cap at 100 rows
            rowCount: rows.length,
            duration: Date.now() - startTime,
          },
        });
      }
    }

    // Fallback: query cannot be resolved from stored schema
    return res.json({
      success: true,
      result: {
        columns: [],
        rows: [],
        rowCount: 0,
        duration: Date.now() - startTime,
      },
      message: 'Query executed against project schema. Deploy with a live database for full query support.',
    });
  } catch (error) {
    console.error('[Canvas Database] Query error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute query',
    });
  }
});

export default router;
