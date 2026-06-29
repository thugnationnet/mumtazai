/**
 * TOOLS - STANDALONE BACKEND SERVER
 * PostgreSQL/Prisma Backend (port 3010)
 *
 * Serves: /api/tools/*, /api/user/preferences/tool-state/*
 */

import "dotenv/config";
import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import os from 'os';
import cookieParser from 'cookie-parser';

import { prisma, connectDatabase, disconnectDatabase } from './lib/prisma.js';
import {
  initializeTracking,
  trackVisitorMiddleware,
  trackPageViewMiddleware,
  trackApiMiddleware,
} from './lib/tracking-middleware.js';
import apiRouter from './routes/api-router.js';

const app = express();
const PORT = process.env.PORT || 3010;

// Trust proxy
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://mumtaz.ai',
    'https://www.mumtaz.ai',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Tracking middleware
app.use(initializeTracking);
app.use(trackVisitorMiddleware);
app.use(trackPageViewMiddleware);
app.use(trackApiMiddleware);

// ─── Lightweight Metrics ────────────────────────────────────────
const METRICS_WINDOW = 60;
const perSecBuckets = new Map();

function recordMetric(code, ms) {
  const sec = Math.floor(Date.now() / 1000);
  let b = perSecBuckets.get(sec);
  if (!b) { b = { count: 0, errors: 0, durations: [] }; perSecBuckets.set(sec, b); }
  b.count++; if (code >= 500) b.errors++; b.durations.push(ms);
  const cutoff = sec - METRICS_WINDOW;
  for (const k of perSecBuckets.keys()) if (k < cutoff) perSecBuckets.delete(k);
}

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    recordMetric(res.statusCode, Number(process.hrtime.bigint() - start) / 1e6);
  });
  next();
});

// ─── Health Checks ──────────────────────────────────────────────

async function checkDB() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, message: String(e?.message || e), latencyMs: Date.now() - start };
  }
}

app.get('/health', async (_req, res) => {
  const db = await checkDB();
  res.json({
    status: db.ok ? 'healthy' : 'degraded',
    service: 'tools-backend',
    database: 'postgresql',
    dbConnected: db.ok,
    latencyMs: db.latencyMs,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/health', async (_req, res) => {
  const db = await checkDB();
  res.json({
    status: db.ok ? 'healthy' : 'degraded',
    database: 'postgresql',
    latencyMs: db.latencyMs,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', async (_req, res) => {
  const db = await checkDB();
  const mem = os.totalmem();
  const free = os.freemem();
  res.json({
    status: db.ok ? 'operational' : 'degraded',
    service: 'tools-backend',
    port: PORT,
    uptime: Math.floor(process.uptime()),
    database: { connected: db.ok, latencyMs: db.latencyMs },
    system: {
      memoryUsedPct: +(((mem - free) / mem) * 100).toFixed(1),
      loadAvg: +os.loadavg()[0].toFixed(2),
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── Mount API Router ───────────────────────────────────────────

app.use('/api', apiRouter);

// ─── 404 Catch-all ──────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// ─── Global Error Handler ───────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('[tools-backend] Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Server Start ───────────────────────────────────────────────

async function startServer() {
  try {
    await connectDatabase();
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('⚠️ PostgreSQL connection failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🔧 Tools Backend running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
  });
}

// ─── Graceful Shutdown ──────────────────────────────────────────

async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down tools-backend...`);
  try { await disconnectDatabase(); } catch {}
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[tools-backend] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[tools-backend] Unhandled rejection:', reason);
});

startServer();
