/**
 * LAB - STANDALONE BACKEND SERVER
 * PostgreSQL/Prisma Backend (port 3013)
 *
 * Serves: /api/lab/*, /api/analytics/*
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
import { rateLimiters, cache } from './lib/cache.js';

const app = express();
const PORT = process.env.PORT || 3013;

app.set('trust proxy', 1);
app.use(helmet());

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

app.use(initializeTracking);
app.use(trackVisitorMiddleware);
app.use(trackPageViewMiddleware);
app.use(trackApiMiddleware);

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
    service: 'lab-backend',
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
    service: 'lab-backend',
    port: PORT,
    uptime: Math.floor(process.uptime()),
    database: { connected: db.ok, latencyMs: db.latencyMs },
    system: { memoryUsedPct: +(((mem - free) / mem) * 100).toFixed(1), loadAvg: +os.loadavg()[0].toFixed(2) },
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[lab-backend] Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ──────────────────────────────────────────────────────

async function startServer() {
  try {
    await connectDatabase();
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('⚠️ PostgreSQL connection failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🧪 Lab Backend running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
  });
}

async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down lab-backend...`);
  try { await disconnectDatabase(); } catch {}
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => console.error('[lab-backend] Uncaught:', err));
process.on('unhandledRejection', (reason) => console.error('[lab-backend] Unhandled:', reason));

startServer();
