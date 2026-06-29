/**
 * MUMTAZ AI - PRODUCTION SERVER
 * PostgreSQL/Prisma Backend
 */

import "dotenv/config";
import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import cors from 'cors';
import helmet from 'helmet';
import os from 'os';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Prisma database connection
import { prisma, connectDatabase, disconnectDatabase } from './lib/prisma.js';

// Middleware and services
import {
  initializeTracking,
  trackVisitorMiddleware,
  trackPageViewMiddleware,
  trackApiMiddleware,
} from './lib/tracking-middleware.js';
import apiRouter from './routes/api-router.js';
import { rateLimiters, cache } from './lib/cache.js';
import { startSubscriptionExpirationCron } from './services/subscription-cron.js';
import { updateEditorState, setSocketIO } from './lib/agent-intelligence-service.js';
import { jobQueue } from './lib/job-queue.js';
import { registerAllWorkers } from './lib/job-workers.js';

const app = express();
const server = createServer(app);

// Parse ALLOWED_ORIGINS once — used for both HTTP CORS and Socket.IO
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
if (!allowedOrigins || allowedOrigins.length === 0) {
  console.warn('[server] WARNING: ALLOWED_ORIGINS env var not set — CORS will be restrictive');
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins || [],
    credentials: true,
  },
});
const PORT = process.env.PORT || 3005;

// Wire Socket.IO into agent intelligence service for real-time UI events
setSocketIO(io);

// Trust proxy - required for rate limiting behind nginx/load balancers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: allowedOrigins || [],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Tracking middleware - must be after cookieParser
app.use(initializeTracking);
app.use(trackVisitorMiddleware);
app.use(trackPageViewMiddleware);
app.use(trackApiMiddleware);

// ----------------------------
// Lightweight metrics tracker (enhanced with per-route, uptime, incidents)
// ----------------------------
const METRICS_WINDOW_SECONDS = 60;
const perSecondBuckets = new Map();
// Per-route metrics: Map<routeKey, Map<second, bucket>>
const perRouteBuckets = new Map();

// Real uptime tracking: count minutes the server was healthy
const uptimeTracker = {
  startTime: Date.now(),
  totalMinutes: 0,
  healthyMinutes: 0,
  lastMinuteCheck: Math.floor(Date.now() / 60000),
  // Hourly uptime for last 7 days (168 hours)
  hourlyUptime: new Map(), // hourKey → { total: N, healthy: N }
};

// Incident tracking: recent 5xx errors and outages
const incidentTracker = {
  incidents: [], // { id, type, message, route, statusCode, timestamp, resolved, resolvedAt }
  maxIncidents: 50,
};

function recordIncident(type, message, route, statusCode) {
  const incident = {
    id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type, // 'server_error', 'db_outage', 'provider_outage'
    message,
    route: route || 'unknown',
    statusCode: statusCode || 500,
    timestamp: new Date().toISOString(),
    resolved: false,
    resolvedAt: null,
  };
  incidentTracker.incidents.unshift(incident);
  if (incidentTracker.incidents.length > incidentTracker.maxIncidents) {
    incidentTracker.incidents.pop();
  }
  return incident;
}

// Uptime check runs every minute
setInterval(() => {
  const currentMin = Math.floor(Date.now() / 60000);
  if (currentMin === uptimeTracker.lastMinuteCheck) return;
  uptimeTracker.lastMinuteCheck = currentMin;
  uptimeTracker.totalMinutes++;
  // Consider healthy if error rate in last minute < 10%
  const snap = calcMetricsSnapshot();
  if (snap.errorRate < 10) {
    uptimeTracker.healthyMinutes++;
  }
  // Track hourly
  const hourKey = new Date().toISOString().slice(0, 13); // e.g. '2026-04-19T14'
  const hourEntry = uptimeTracker.hourlyUptime.get(hourKey) || { total: 0, healthy: 0 };
  hourEntry.total++;
  if (snap.errorRate < 10) hourEntry.healthy++;
  uptimeTracker.hourlyUptime.set(hourKey, hourEntry);
  // Prune entries older than 7 days (168 hours)
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  for (const [key] of uptimeTracker.hourlyUptime) {
    if (new Date(key + ':00:00Z') < cutoffDate) uptimeTracker.hourlyUptime.delete(key);
  }
}, 60000);

function recordMetric(statusCode, durationMs, routeKey) {
  const sec = Math.floor(Date.now() / 1000);
  // Global metrics
  let bucket = perSecondBuckets.get(sec);
  if (!bucket) {
    bucket = { count: 0, errors: 0, durations: [] };
    perSecondBuckets.set(sec, bucket);
  }
  bucket.count += 1;
  if (statusCode >= 500) bucket.errors += 1;
  bucket.durations.push(durationMs);
  const cutoff = sec - METRICS_WINDOW_SECONDS;
  for (const k of perSecondBuckets.keys()) {
    if (k < cutoff) perSecondBuckets.delete(k);
  }
  // Per-route metrics
  if (routeKey) {
    if (!perRouteBuckets.has(routeKey)) perRouteBuckets.set(routeKey, new Map());
    const routeMap = perRouteBuckets.get(routeKey);
    let rb = routeMap.get(sec);
    if (!rb) {
      rb = { count: 0, errors: 0, durations: [] };
      routeMap.set(sec, rb);
    }
    rb.count += 1;
    if (statusCode >= 500) rb.errors += 1;
    rb.durations.push(durationMs);
    for (const k of routeMap.keys()) {
      if (k < cutoff) routeMap.delete(k);
    }
  }
  // Track 5xx as incidents
  if (statusCode >= 500) {
    recordIncident('server_error', `HTTP ${statusCode} on ${routeKey || 'unknown'}`, routeKey, statusCode);
  }
}

// Classify route for per-route tracking
function classifyRoute(path) {
  if (path.startsWith('/api/status')) return null; // exclude status endpoints from metrics
  if (path.startsWith('/api/agent/chat-stream')) return '/api/agent/chat-stream';
  if (path.startsWith('/api/studio/chat')) return '/api/studio/chat';
  if (path.startsWith('/api/canvas/generate')) return '/api/canvas/generate';
  if (path.startsWith('/api/auth')) return '/api/auth';
  if (path.startsWith('/api/tools/')) return '/api/tools' + path.slice(10).split('?')[0];
  if (path.startsWith('/api/agents')) return '/api/agents';
  if (path.startsWith('/health') || path.startsWith('/api/health')) return '/api/health';
  return path.split('?')[0]; // generic
}

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    const routeKey = classifyRoute(req.path);
    if (routeKey !== null) { // null = excluded (status endpoints)
      recordMetric(res.statusCode, durationMs, routeKey);
    }
  });
  next();
});

function calcMetricsSnapshot(routeKey) {
  const nowSec = Math.floor(Date.now() / 1000);
  const bucketMap = routeKey ? (perRouteBuckets.get(routeKey) || new Map()) : perSecondBuckets;
  let total = 0;
  let errors = 0;
  let durations = [];
  for (const [sec, b] of bucketMap) {
    if (sec >= nowSec - METRICS_WINDOW_SECONDS) {
      total += b.count;
      errors += b.errors;
      durations = durations.concat(b.durations);
    }
  }
  const currentBucket = bucketMap.get(nowSec) || { count: 0 };
  const rps = currentBucket.count;
  const avgResponseMs = durations.length
    ? Math.round(durations.reduce((a, v) => a + v, 0) / durations.length)
    : 0;
  const errorRate = total ? +((errors * 100) / total).toFixed(2) : 0;
  return { rps, totalLastMinute: total, avgResponseMs, errorRate };
}

// Real uptime percentage
function getRealUptime() {
  if (uptimeTracker.totalMinutes === 0) return 100; // just started, assume healthy
  return +((uptimeTracker.healthyMinutes / uptimeTracker.totalMinutes) * 100).toFixed(2);
}

// Get recent incidents (last 24h, unresolved, or last 10)
function getRecentIncidents() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return incidentTracker.incidents
    .filter(i => i.timestamp >= dayAgo || !i.resolved)
    .slice(0, 10)
    .map(i => ({
      id: i.id,
      type: i.type,
      message: i.message,
      timestamp: i.timestamp,
      resolved: i.resolved,
      resolvedAt: i.resolvedAt,
    }));
}

// Check PostgreSQL connection
async function checkPostgresFast() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, message: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      message: String(e?.message || e),
      latencyMs: Date.now() - start,
    };
  }
}

// Helper functions

function buildCpuMem() {
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memUsed = memTotal - memFree;
  const memPct = +((memUsed / memTotal) * 100).toFixed(1);
  const load = os.loadavg()[0] || 0;
  return { memPct, load1: +load.toFixed(2) };
}

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

app.get('/health', async (req, res) => {
  const hasAIService = !!(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.COHERE_API_KEY
  );

  // Check Redis status
  let redisStatus = 'not_configured';
  let redisConnected = false;
  try {
    if (cache.client && cache.isConnected) {
      await cache.client.ping();
      redisStatus = 'connected';
      redisConnected = true;
    } else if (cache.memoryCache) {
      redisStatus = 'fallback_memory';
    }
  } catch {
    redisStatus = 'error';
  }

  // Check PostgreSQL status
  const dbCheck = await checkPostgresFast();
  const pgStatus = dbCheck.ok ? 'connected' : 'disconnected';

  // Check S3 status
  let s3Status = 'not_configured';
  let s3Connected = false;
  const s3Bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME;
  try {
    if (s3Bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-southeast-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      await s3Client.send(new HeadBucketCommand({ Bucket: s3Bucket }));
      s3Status = 'connected';
      s3Connected = true;
    }
  } catch {
    s3Status = s3Bucket ? 'error' : 'not_configured';
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '2.0.0',
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      googleTranslate: !!process.env.GOOGLE_TRANSLATE_API_KEY,
    },
    infrastructure: {
      redis: redisStatus,
      redisConnected,
      postgresql: pgStatus,
      postgresLatencyMs: dbCheck.latencyMs,
      s3: s3Status,
      s3Connected,
      s3Bucket: s3Bucket || null,
    },
    hasAIService,
  });
});

// Compatibility alias
app.get('/api/health', async (req, res) => {
  const dbCheck = await checkPostgresFast();
  res.json({
    status: dbCheck.ok ? 'healthy' : 'degraded',
    database: 'postgresql',
    latencyMs: dbCheck.latencyMs,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// STATUS ENDPOINT - Enhanced with real-time monitoring
// ============================================

// Helper to check AI provider connectivity with real latency measurement
async function checkAIProviders() {
  const providerConfigs = [
    { key: 'CEREBRAS_API_KEY', name: 'Cerebras (Llama 3.3-70B)', model: 'llama-3.3-70b', url: 'https://api.cerebras.ai/v1/models', authHeader: 'Bearer' },
    { key: 'GROQ_API_KEY', name: 'Groq (Llama 3.3-70B)', model: 'llama-3.3-70b-versatile', url: 'https://api.groq.com/openai/v1/models', authHeader: 'Bearer' },
    { key: 'OPENAI_API_KEY', name: 'OpenAI (GPT-4)', model: 'gpt-4', url: 'https://api.openai.com/v1/models', authHeader: 'Bearer' },
    { key: 'ANTHROPIC_API_KEY', name: 'Anthropic (Claude 3)', model: 'claude-3', url: 'https://api.anthropic.com/v1/messages', authHeader: 'x-api-key' },
    { key: 'GEMINI_API_KEY', name: 'Google Gemini', model: 'gemini-2.0-flash', url: null },
  ];

  const checks = providerConfigs
    .filter(p => process.env[p.key])
    .map(async (p) => {
      const start = Date.now();
      let status = 'operational';
      let responseTime = 0;
      try {
        if (p.url) {
          const headers = {};
          if (p.authHeader === 'Bearer') headers['Authorization'] = `Bearer ${process.env[p.key]}`;
          else if (p.authHeader === 'x-api-key') headers['x-api-key'] = process.env[p.key];
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const resp = await fetch(p.url, { method: p.key === 'ANTHROPIC_API_KEY' ? 'OPTIONS' : 'GET', headers, signal: controller.signal }).catch(() => null);
          clearTimeout(timeout);
          responseTime = Date.now() - start;
          if (!resp || resp.status >= 500) status = 'outage';
          else if (resp.status >= 400 && resp.status !== 401) status = 'degraded';
        } else {
          // Gemini — use key-based URL
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env[p.key]}`, { signal: controller.signal }).catch(() => null);
          clearTimeout(timeout);
          responseTime = Date.now() - start;
          if (!resp || resp.status >= 500) status = 'outage';
          else if (resp.status >= 400) status = 'degraded';
        }
      } catch {
        responseTime = Date.now() - start;
        status = 'outage';
      }
      return { name: p.name, status, model: p.model, configured: true, responseTime };
    });

  return Promise.all(checks);
}

// Helper to check Redis
async function checkRedis() {
  try {
    if (cache.client && cache.isConnected) {
      const start = Date.now();
      await cache.client.ping();
      return { 
        status: 'operational', 
        type: 'redis',
        responseTime: Date.now() - start,
        connected: true 
      };
    } else if (cache.memoryCache) {
      return { 
        status: 'operational', 
        type: 'memory-fallback',
        responseTime: 1,
        connected: true 
      };
    }
    return { status: 'degraded', type: 'none', responseTime: 0, connected: false };
  } catch (e) {
    return { status: 'outage', type: 'error', responseTime: 0, connected: false, error: e.message };
  }
}

// Real endpoint health probes — actually hit the endpoints
async function probeEndpoint(path, method = 'GET', timeoutMs = 5000) {
  const start = Date.now();
  try {
    const url = `http://127.0.0.1:${PORT}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, { method, signal: controller.signal, headers: { 'X-Probe': '1' } }).catch(() => null);
    clearTimeout(timeout);
    const responseTime = Date.now() - start;
    if (!resp) return { status: 'outage', responseTime, errorRate: 100 };
    if (resp.status >= 500) return { status: 'outage', responseTime, errorRate: 100 };
    if (resp.status >= 400) return { status: 'degraded', responseTime, errorRate: 50 };
    return { status: 'operational', responseTime, errorRate: 0 };
  } catch {
    return { status: 'outage', responseTime: Date.now() - start, errorRate: 100 };
  }
}

app.get('/api/status', cache.middleware(30), async (req, res) => {
  try {
    const metrics = calcMetricsSnapshot();
    const dbCheck = await checkPostgresFast();
    const redisCheck = await checkRedis();
    const aiProviders = await checkAIProviders();
    
    const dbStatus = dbCheck.ok ? 'operational' : 'outage';
    const apiStatus = dbCheck.ok && metrics.errorRate < 5 ? 'operational' : 'degraded';
    const platformStatus = apiStatus === 'operational' && dbCheck.ok && redisCheck.connected ? 'operational' : 'degraded';
    const realUptime = getRealUptime();

    // Get real agent data from PostgreSQL
    const agents = await prisma.agent.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });

    // Get subscription counts per agent
    const subscriptionCounts = await prisma.agentSubscription.groupBy({
      by: ['agentId'],
      where: { status: 'active' },
      _count: { id: true },
    });
    const subscriptionMap = new Map(
      subscriptionCounts.map(s => [s.agentId, s._count.id]),
    );

    // Get per-agent latency from real chat messages (last 24h)
    const agentChatSessions = await prisma.chatSession.findMany({
      where: { agentId: { not: null }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { sessionId: true, agentId: true },
    });
    const sessionToAgent = new Map(agentChatSessions.map(s => [s.sessionId, s.agentId]));
    const agentMsgLatencies = await prisma.chatMessage.groupBy({
      by: ['sessionId'],
      _avg: { latencyMs: true },
      _count: { id: true },
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, role: 'assistant', latencyMs: { not: null } },
    });
    const agentLatencyMap = new Map();
    for (const m of agentMsgLatencies) {
      const agentId = sessionToAgent.get(m.sessionId);
      if (!agentId) continue;
      const existing = agentLatencyMap.get(agentId) || { totalLatency: 0, count: 0 };
      existing.totalLatency += (m._avg.latencyMs || 0) * m._count.id;
      existing.count += m._count.id;
      agentLatencyMap.set(agentId, existing);
    }

    const agentsData = agents.map(agent => {
      const latData = agentLatencyMap.get(agent.agentId);
      const avgLat = latData && latData.count > 0 ? Math.round(latData.totalLatency / latData.count) : 0;
      return {
        name: agent.name,
        slug: agent.agentId,
        status: agent.status === 'active' ? 'operational' : 'degraded',
        responseTime: avgLat,
        activeUsers: subscriptionMap.get(agent.agentId) || 0,
        totalUsers: agent.totalUsers || 0,
        totalSessions: agent.totalSessions || 0,
        averageRating: agent.averageRating || 0,
        aiProvider: agent.aiProvider?.model || 'gpt-4',
      };
    });

    // Get analytics summary
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [sessionsToday, pageViewsToday, activeUsers] = await Promise.all([
      prisma.session.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.pageView.count({ where: { timestamp: { gte: startOfDay } } }),
      prisma.session.count({
        where: {
          lastActivity: { gte: new Date(Date.now() - 15 * 60 * 1000) },
          isActive: true,
        },
      }),
    ]);

    // Get system metrics
    const cpuMem = buildCpuMem();
    const loadAvg = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const numCpus = os.cpus().length;
    const serverUptime = process.uptime();
    const uptimeHours = Math.floor(serverUptime / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);

    // Real connection pool from DATABASE_URL or Prisma default
    const dbUrl = process.env.DATABASE_URL || '';
    const poolMatch = dbUrl.match(/connection_limit=(\d+)/);
    const connectionPool = poolMatch ? parseInt(poolMatch[1], 10) : 5;

    res.json({
      success: true,
      data: {
        system: {
          cpuPercent: Math.round(loadAvg[0] / numCpus * 100),
          memoryPercent: cpuMem.memPct,
          totalMem: Math.round(totalMem / (1024 * 1024 * 1024) * 100) / 100,
          freeMem: Math.round(freeMem / (1024 * 1024 * 1024) * 100) / 100,
          usedMem: Math.round(usedMem / (1024 * 1024 * 1024) * 100) / 100,
          load1: loadAvg[0]?.toFixed(2) || 0,
          load5: loadAvg[1]?.toFixed(2) || 0,
          load15: loadAvg[2]?.toFixed(2) || 0,
          cores: numCpus,
          uptimeSeconds: serverUptime,
          uptimeFormatted: uptimeDays > 0 ? `${uptimeDays}d ${uptimeHours % 24}h` : `${uptimeHours}h ${Math.floor((serverUptime % 3600) / 60)}m`,
        },
        platform: {
          status: platformStatus,
          uptime: realUptime,
          lastUpdated: new Date().toISOString(),
          version: process.env.APP_VERSION || '2.0.0',
          environment: process.env.NODE_ENV || 'production',
        },
        api: {
          status: apiStatus,
          responseTime: metrics.avgResponseMs,
          uptime: realUptime,
          requestsToday: sessionsToday + pageViewsToday,
          requestsPerMinute: metrics.totalLastMinute > 0 ? +(metrics.totalLastMinute / 1).toFixed(1) : 0,
          errorRate: metrics.errorRate,
          errorsToday: Math.round(metrics.errorRate * (sessionsToday + pageViewsToday) / 100),
          totalLastMinute: metrics.totalLastMinute,
        },
        database: {
          status: dbStatus,
          type: 'PostgreSQL',
          connectionPool,
          responseTime: dbCheck.latencyMs,
          uptime: realUptime,
        },
        cache: {
          status: redisCheck.status,
          type: redisCheck.type,
          responseTime: redisCheck.responseTime,
          connected: redisCheck.connected,
        },
        aiServices: aiProviders,
        agents: agentsData,
        // Real tool usage data — no fake fallbacks
        tools: await (async () => {
          const toolStats = await prisma.toolUsage.groupBy({
            by: ['toolName'],
            _count: { id: true },
            _avg: { latencyMs: true },
            where: { occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          });
          const failedCounts = await prisma.toolUsage.groupBy({
            by: ['toolName'],
            _count: { id: true },
            where: { status: 'failed', occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          });
          const failedMap = new Map(failedCounts.map(f => [f.toolName, f._count.id]));
          if (toolStats.length > 0) {
            return toolStats.map(t => ({
              name: t.toolName,
              status: (failedMap.get(t.toolName) || 0) / t._count.id > 0.5 ? 'degraded' : 'operational',
              responseTime: Math.round(t._avg.latencyMs || 0),
              usageCount: t._count.id,
            }));
          }
          return []; // No tools used yet — empty, not fake
        })(),
        analytics: {
          sessionsToday,
          pageViewsToday,
          activeUsers,
        },
        // Historical data from real database + real uptime tracking
        historical: await (async () => {
          const historicalData = [];
          for (let i = 6; i >= 0; i--) {
            const dayStart = new Date();
            dayStart.setDate(dayStart.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);
            
            const [sessionCount, pageViewCount, msgLatencies] = await Promise.all([
              prisma.session.count({
                where: { createdAt: { gte: dayStart, lte: dayEnd } }
              }),
              prisma.pageView.count({
                where: { timestamp: { gte: dayStart, lte: dayEnd } }
              }),
              prisma.chatMessage.aggregate({
                _avg: { latencyMs: true },
                where: { createdAt: { gte: dayStart, lte: dayEnd }, latencyMs: { not: null } },
              }),
            ]);

            const totalActivity = sessionCount + pageViewCount;
            // Real uptime from hourly tracker for this day (if tracked), else derive from process uptime
            let dayUptime = 0;
            const dayDateStr = dayStart.toISOString().slice(0, 10); // e.g. '2026-04-19'
            let dayHealthy = 0, dayTotal = 0;
            for (const [hourKey, hourData] of uptimeTracker.hourlyUptime) {
              if (hourKey.startsWith(dayDateStr)) {
                dayHealthy += hourData.healthy;
                dayTotal += hourData.total;
              }
            }
            if (dayTotal > 0) {
              dayUptime = +((dayHealthy / dayTotal) * 100).toFixed(2);
            } else if (i === 0) {
              dayUptime = realUptime; // today: use overall uptime
            } else {
              dayUptime = totalActivity > 0 ? -1 : 0; // -1 = not tracked (server wasn't running)
            }
            
            historicalData.push({
              date: dayStart.toISOString().split('T')[0],
              uptime: dayUptime,
              requests: totalActivity,
              avgResponseTime: Math.round(msgLatencies._avg.latencyMs || 0),
              tracked: dayTotal > 0 || i === 0, // whether uptime was actually measured
            });
          }
          return historicalData;
        })(),
        incidents: getRecentIncidents(),
        totalActiveUsers: activeUsers,
      },
    });
  } catch (error) {
    console.error('Status endpoint error:', error);
    recordIncident('server_error', 'Status endpoint crashed: ' + (error.message || 'unknown'), '/api/status', 500);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status',
    });
  }
});

// ============================================
// STATUS STREAM ENDPOINT (SSE)
// ============================================

app.get('/api/status/stream', (req, res) => {

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': allowedOrigins?.[0] || '*',
    'Access-Control-Allow-Credentials': 'true',
  });

  // Send initial status data
  const sendStatusUpdate = async () => {
    try {
      const metrics = calcMetricsSnapshot();
      const dbCheck = await checkPostgresFast();

      const dbStatus = dbCheck.ok ? 'operational' : 'outage';
      const apiStatus = dbCheck.ok && metrics.errorRate < 5 ? 'operational' : 'degraded';
      const platformStatus = apiStatus === 'operational' && dbCheck.ok ? 'operational' : 'degraded';
      const realUptime = getRealUptime();

      // Get real agent data from PostgreSQL
      const agents = await prisma.agent.findMany({
        where: { status: 'active' },
        orderBy: { name: 'asc' },
      });

      // Get subscription counts per agent
      const subscriptionCounts = await prisma.agentSubscription.groupBy({
        by: ['agentId'],
        where: { status: 'active' },
        _count: { id: true },
      });

      const subscriptionMap = new Map(
        subscriptionCounts.map(s => [s.agentId, s._count.id]),
      );

      const agentsData = agents.map(agent => ({
        name: agent.name,
        slug: agent.agentId,
        status: agent.status === 'active' ? 'operational' : 'degraded',
        responseTime: 0,
        activeUsers: subscriptionMap.get(agent.agentId) || 0,
        totalUsers: agent.totalUsers || 0,
        totalSessions: agent.totalSessions || 0,
        averageRating: agent.averageRating || 0,
        aiProvider: agent.aiProvider?.model || 'gpt-4',
      }));

      // Get analytics summary
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [todaySessions, todayPageViews, activeUsers] = await Promise.all([
        prisma.session.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.pageView.count({ where: { timestamp: { gte: startOfDay } } }),
        prisma.session.count({
          where: {
            lastActivity: { gte: new Date(Date.now() - 15 * 60 * 1000) },
            isActive: true,
          },
        }),
      ]);

      const cpuMem = buildCpuMem();
      const loadAvg = os.loadavg();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const numCpus = os.cpus().length;

      // Real connection pool
      const dbUrl = process.env.DATABASE_URL || '';
      const poolMatch = dbUrl.match(/connection_limit=(\d+)/);
      const connectionPool = poolMatch ? parseInt(poolMatch[1], 10) : 5;

      const statusData = {
        status: 'success',
        data: {
          system: {
            cpuPercent: Math.round(loadAvg[0] / numCpus * 100),
            memoryPercent: cpuMem.memPct,
            totalMem: Math.round(totalMem / (1024 * 1024 * 1024) * 100) / 100,
            freeMem: Math.round(freeMem / (1024 * 1024 * 1024) * 100) / 100,
            usedMem: Math.round(usedMem / (1024 * 1024 * 1024) * 100) / 100,
            load1: loadAvg[0]?.toFixed(2) || 0,
            load5: loadAvg[1]?.toFixed(2) || 0,
            load15: loadAvg[2]?.toFixed(2) || 0,
            cores: numCpus,
          },
          platform: {
            status: platformStatus,
            uptime: realUptime,
            lastUpdated: new Date().toISOString(),
            version: process.env.APP_VERSION || '2.0.0',
          },
          api: {
            status: apiStatus,
            responseTime: metrics.avgResponseMs,
            uptime: realUptime,
            requestsToday: todaySessions + todayPageViews,
            requestsPerMinute: metrics.totalLastMinute > 0 ? +(metrics.totalLastMinute / 1).toFixed(1) : 0,
            errorRate: metrics.errorRate,
            errorsToday: Math.round(metrics.errorRate * (todaySessions + todayPageViews) / 100),
          },
          database: {
            status: dbStatus,
            connectionPool,
            responseTime: dbCheck.latencyMs,
            uptime: realUptime,
          },
          aiServices: await checkAIProviders(),
          agents: agentsData,
          tools: await (async () => {
            const toolStats = await prisma.toolUsage.groupBy({
              by: ['toolName'],
              _count: { id: true },
              _avg: { latencyMs: true },
              where: { occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            });
            if (toolStats.length > 0) {
              return toolStats.map(t => ({ name: t.toolName, status: 'operational', responseTime: Math.round(t._avg.latencyMs || 0), usageCount: t._count.id }));
            }
            return []; // No tools used — empty, not fake
          })(),
          incidents: getRecentIncidents(),
          totalActiveUsers: activeUsers,
        },
      };

      // Send SSE event
      res.write(`data: ${JSON.stringify(statusData)}\n\n`);

    } catch (error) {
      console.error('Status stream error:', error);
      // Send error event
      res.write(`data: ${JSON.stringify({
        status: 'error',
        error: 'Failed to fetch status stream',
      })}\n\n`);
    }
  };

  // Send initial update
  sendStatusUpdate();

  // Send updates every 5 seconds
  const interval = setInterval(sendStatusUpdate, 5000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });

  // Handle connection errors
  req.on('error', (error) => {
    console.error('Status stream connection error:', error);
    clearInterval(interval);
    res.end();
  });
});

// ============================================
// STATUS ANALYTICS ENDPOINT
// ============================================

app.get('/api/status/analytics', cache.middleware(60), async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate, previousStartDate, previousEndDate;

    switch (timeRange) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      previousEndDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      previousEndDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get current period data
    const [
      currentSessions,
      currentPageViews,
      currentActiveUsers,
    ] = await Promise.all([
      prisma.session.count({ where: { createdAt: { gte: startDate } } }),
      prisma.pageView.count({ where: { timestamp: { gte: startDate } } }),
      prisma.session.count({
        where: {
          lastActivity: { gte: new Date(Date.now() - 15 * 60 * 1000) },
          isActive: true,
        },
      }),
    ]);

    // Get previous period data for growth calculation
    const [
      previousSessions,
      previousPageViews,
    ] = await Promise.all([
      prisma.session.count({ where: { createdAt: { gte: previousStartDate, lt: previousEndDate } } }),
      prisma.pageView.count({ where: { timestamp: { gte: previousStartDate, lt: previousEndDate } } }),
    ]);

    // Calculate growth percentages (compare sessions, not active users)
    const requestsGrowth = previousSessions > 0 ? ((currentSessions - previousSessions) / previousSessions) * 100 : (currentSessions > 0 ? 100 : 0);
    const usersGrowth = previousPageViews > 0 ? ((currentPageViews - previousPageViews) / previousPageViews) * 100 : (currentPageViews > 0 ? 100 : 0);

    // Get agent performance data with subscriptions
    const agents = await prisma.agent.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });

    // Get subscription counts per agent
    const subscriptionCounts = await prisma.agentSubscription.groupBy({
      by: ['agentId'],
      where: { status: 'active' },
      _count: { id: true },
    });

    const subscriptionMap = new Map(
      subscriptionCounts.map(s => [s.agentId, s._count.id]),
    );

    // Get real chat message counts and latencies per agent
    const agentMessageStats = await prisma.chatMessage.groupBy({
      by: ['sessionId'],
      _count: { id: true },
      _avg: { latencyMs: true },
      where: { createdAt: { gte: startDate }, role: 'assistant', latencyMs: { not: null } },
    });
    // Map sessionId → agentId via chatSessions
    const agentChatSessions = await prisma.chatSession.findMany({
      where: { agentId: { not: null }, createdAt: { gte: startDate } },
      select: { sessionId: true, agentId: true },
    });
    const sessionAgentMap = new Map(agentChatSessions.map(s => [s.sessionId, s.agentId]));
    // Aggregate per agent
    const agentAggregated = new Map(); // agentId → { requests, totalLatency, latencyCount, feedbackTotal, feedbackCount }
    for (const stat of agentMessageStats) {
      const agentId = sessionAgentMap.get(stat.sessionId);
      if (!agentId) continue;
      const existing = agentAggregated.get(agentId) || { requests: 0, totalLatency: 0, latencyCount: 0 };
      existing.requests += stat._count.id;
      if (stat._avg.latencyMs) { existing.totalLatency += stat._avg.latencyMs * stat._count.id; existing.latencyCount += stat._count.id; }
      agentAggregated.set(agentId, existing);
    }

    // Get feedback ratings per agent for success rate
    const agentFeedback = await prisma.chatFeedback.groupBy({
      by: ['sessionId'],
      _count: { id: true },
      _avg: { rating: true },
      where: { createdAt: { gte: startDate } },
    });
    for (const fb of agentFeedback) {
      const agentId = sessionAgentMap.get(fb.sessionId);
      if (!agentId) continue;
      const existing = agentAggregated.get(agentId) || { requests: 0, totalLatency: 0, latencyCount: 0 };
      existing.feedbackAvg = fb._avg.rating;
      existing.feedbackCount = fb._count.id;
      agentAggregated.set(agentId, existing);
    }

    // Get previous period agent messages for trend
    const prevAgentSessions = await prisma.chatSession.findMany({
      where: { agentId: { not: null }, createdAt: { gte: previousStartDate, lt: previousEndDate } },
      select: { sessionId: true, agentId: true },
    });
    const prevSessionAgentMap = new Map(prevAgentSessions.map(s => [s.sessionId, s.agentId]));
    const prevAgentMsgCounts = await prisma.chatMessage.groupBy({
      by: ['sessionId'],
      _count: { id: true },
      where: { createdAt: { gte: previousStartDate, lt: previousEndDate }, role: 'assistant' },
    });
    const prevAgentRequests = new Map();
    for (const stat of prevAgentMsgCounts) {
      const agentId = prevSessionAgentMap.get(stat.sessionId);
      if (!agentId) continue;
      prevAgentRequests.set(agentId, (prevAgentRequests.get(agentId) || 0) + stat._count.id);
    }

    const agentsData = agents.map(agent => {
      const users = subscriptionMap.get(agent.agentId) || 0;
      const agg = agentAggregated.get(agent.agentId) || { requests: 0, totalLatency: 0, latencyCount: 0 };
      const prevReq = prevAgentRequests.get(agent.agentId) || 0;
      const trend = agg.requests > prevReq ? 'up' : agg.requests < prevReq ? 'down' : 'stable';
      const avgResponseTime = agg.latencyCount > 0 ? Math.round(agg.totalLatency / agg.latencyCount) : 0;
      // Success rate: if feedback exists, use rating (1-5) → percentage; else derive from error rate
      // Use calcMetricsSnapshot inline to avoid TDZ — metrics const declared later
      const currentErrorRate = calcMetricsSnapshot().errorRate;
      const successRate = agg.feedbackCount > 0
        ? Math.round((agg.feedbackAvg / 5) * 100)
        : (agg.requests > 0 ? Math.round(Math.max(0, 100 - currentErrorRate)) : 100);

      return {
        name: agent.name,
        requests: agg.requests,
        users,
        avgResponseTime,
        successRate,
        trend,
      };
    });

    // Real tool usage data from database
    const metrics = calcMetricsSnapshot();
    const toolUsageStats = await prisma.toolUsage.groupBy({
      by: ['toolName'],
      _count: { id: true },
      _avg: { latencyMs: true },
      where: { occurredAt: { gte: startDate } },
    });
    const prevToolUsageStats = await prisma.toolUsage.groupBy({
      by: ['toolName'],
      _count: { id: true },
      where: { occurredAt: { gte: previousStartDate, lt: previousEndDate } },
    });
    const prevToolMap = new Map(prevToolUsageStats.map(t => [t.toolName, t._count.id]));
    const toolUserCounts = await prisma.toolUsage.groupBy({
      by: ['toolName', 'userId'],
      where: { occurredAt: { gte: startDate }, userId: { not: null } },
    });
    const toolUniqueUsers = new Map();
    for (const tu of toolUserCounts) {
      toolUniqueUsers.set(tu.toolName, (toolUniqueUsers.get(tu.toolName) || 0) + 1);
    }

    let toolsData;
    if (toolUsageStats.length > 0) {
      toolsData = toolUsageStats.map(t => {
        const prevCount = prevToolMap.get(t.toolName) || 0;
        const trend = t._count.id > prevCount ? 'up' : t._count.id < prevCount ? 'down' : 'stable';
        return {
          name: t.toolName,
          usage: t._count.id,
          users: toolUniqueUsers.get(t.toolName) || 0,
          avgDuration: Math.round(t._avg.latencyMs || 0),
          trend,
        };
      });
    } else {
      toolsData = []; // No tools used yet — empty, not fake
    }

    // Generate hourly data for the last 24 hours
    const hourlyData = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const [hourSessions, hourPageViews] = await Promise.all([
        prisma.session.count({ where: { createdAt: { gte: hourStart, lt: hourEnd } } }),
        prisma.pageView.count({ where: { timestamp: { gte: hourStart, lt: hourEnd } } }),
      ]);

      hourlyData.push({
        hour: hourStart.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false }),
        requests: hourSessions + hourPageViews,
        users: hourSessions,
      });
    }

    // Calculate top agents by users (subscribers)
    const topAgents = agentsData
      .sort((a, b) => b.users - a.users)
      .slice(0, 5)
      .map((agent) => {
        const maxUsers = Math.max(...agentsData.map(a => a.users), 1);
        return {
          name: agent.name,
          requests: agent.requests,
          users: agent.users,
          percentage: (agent.users / maxUsers) * 100,
        };
      });

    // Calculate overview metrics from real data
    const totalRequests = currentSessions + currentPageViews;
    // Real avg response time from chat messages in this period
    const overviewLatency = await prisma.chatMessage.aggregate({
      _avg: { latencyMs: true },
      where: { createdAt: { gte: startDate }, latencyMs: { not: null } },
    });
    const avgResponseTime = Math.round(overviewLatency._avg.latencyMs || 0);
    // Real success rate from metrics error rate
    const successRate = Math.round(Math.max(0, 100 - metrics.errorRate));

    res.json({
      overview: {
        totalRequests,
        activeUsers: currentActiveUsers,
        avgResponseTime,
        successRate,
        requestsGrowth: Math.round(requestsGrowth * 10) / 10,
        usersGrowth: Math.round(usersGrowth * 10) / 10,
      },
      agents: agentsData,
      tools: toolsData,
      hourlyData,
      topAgents,
    });
  } catch (error) {
    console.error('Status analytics endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

// ============================================
// STATUS API-STATUS ENDPOINT
// ============================================

app.get('/api/status/api-status', cache.middleware(30), async (req, res) => {
  try {
    const metrics = calcMetricsSnapshot();
    const dbCheck = await checkPostgresFast();
    const now = new Date().toISOString();
    const realUptime = getRealUptime();

    // Real endpoint probes — actually hit each endpoint
    const [healthProbe, chatProbe] = await Promise.all([
      probeEndpoint('/api/health', 'GET', 3000),
      // Chat endpoint needs POST, but we probe with GET to avoid side effects — check per-route metrics instead
      (async () => {
        const chatMetrics = calcMetricsSnapshot('/api/agent/chat-stream');
        const chatLatency = await prisma.chatMessage.aggregate({
          _avg: { latencyMs: true },
          where: { createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, role: 'assistant', latencyMs: { not: null } },
        });
        const avgLat = Math.round(chatLatency._avg.latencyMs || 0);
        return {
          status: chatMetrics.errorRate > 10 ? 'degraded' : (avgLat > 0 ? 'operational' : 'operational'),
          responseTime: avgLat,
          errorRate: chatMetrics.errorRate,
        };
      })(),
    ]);

    // Auth per-route metrics
    const authMetrics = calcMetricsSnapshot('/api/auth');
    // Canvas per-route metrics
    const canvasMetrics = calcMetricsSnapshot('/api/canvas/generate');

    const endpoints = [
      {
        name: 'Health Check',
        endpoint: '/api/health',
        method: 'GET',
        status: healthProbe.status,
        responseTime: healthProbe.responseTime,
        uptime: realUptime,
        lastChecked: now,
        errorRate: healthProbe.errorRate,
      },
      {
        name: 'Authentication',
        endpoint: '/api/auth/verify',
        method: 'GET',
        status: authMetrics.errorRate > 10 ? 'degraded' : 'operational',
        responseTime: authMetrics.avgResponseMs,
        uptime: realUptime,
        lastChecked: now,
        errorRate: authMetrics.errorRate,
      },
      {
        name: 'Chat Completions',
        endpoint: '/api/agent/chat-stream',
        method: 'POST',
        status: chatProbe.status,
        responseTime: chatProbe.responseTime,
        uptime: realUptime,
        lastChecked: now,
        errorRate: chatProbe.errorRate,
      },
      {
        name: 'Canvas Generate',
        endpoint: '/api/canvas/generate',
        method: 'POST',
        status: canvasMetrics.errorRate > 10 ? 'degraded' : 'operational',
        responseTime: canvasMetrics.avgResponseMs,
        uptime: realUptime,
        lastChecked: now,
        errorRate: canvasMetrics.errorRate,
      },
    ];

    // Get real agents from database with real response times
    const dbAgents = await prisma.agent.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });

    // Get real agent latencies from chat messages
    const agentChatSessions = await prisma.chatSession.findMany({
      where: { agentId: { not: null }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { sessionId: true, agentId: true },
    });
    const sessionToAgent = new Map(agentChatSessions.map(s => [s.sessionId, s.agentId]));
    const agentMsgLatencies = await prisma.chatMessage.groupBy({
      by: ['sessionId'],
      _avg: { latencyMs: true },
      _count: { id: true },
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, role: 'assistant', latencyMs: { not: null } },
    });
    const agentLatencyMap = new Map();
    const agentMsgCountMap = new Map();
    for (const m of agentMsgLatencies) {
      const agentId = sessionToAgent.get(m.sessionId);
      if (!agentId) continue;
      const existing = agentLatencyMap.get(agentId) || { totalLatency: 0, count: 0 };
      existing.totalLatency += (m._avg.latencyMs || 0) * m._count.id;
      existing.count += m._count.id;
      agentLatencyMap.set(agentId, existing);
      agentMsgCountMap.set(agentId, (agentMsgCountMap.get(agentId) || 0) + m._count.id);
    }

    const agents = dbAgents.map(agent => {
      const latData = agentLatencyMap.get(agent.agentId);
      const avgLat = latData && latData.count > 0 ? Math.round(latData.totalLatency / latData.count) : 0;
      const msgCount = agentMsgCountMap.get(agent.agentId) || 0;
      return {
        name: agent.name,
        apiEndpoint: `/api/agents/${agent.agentId}`,
        status: agent.status === 'active' ? 'operational' : 'degraded',
        responseTime: avgLat,
        requestsPerMinute: msgCount > 0 ? +((msgCount / (24 * 60)).toFixed(2)) : 0,
      };
    });

    // Tools APIs from real usage data — no fake fallbacks
    const toolStats = await prisma.toolUsage.groupBy({
      by: ['toolName'],
      _count: { id: true },
      _avg: { latencyMs: true },
      where: { occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    const failedToolStats = await prisma.toolUsage.groupBy({
      by: ['toolName'],
      _count: { id: true },
      where: { status: 'failed', occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    const failedToolMap = new Map(failedToolStats.map(f => [f.toolName, f._count.id]));

    let tools;
    if (toolStats.length > 0) {
      tools = toolStats.map(t => ({
        name: t.toolName,
        apiEndpoint: `/api/tools/${t.toolName.toLowerCase().replace(/\s+/g, '-')}`,
        status: (failedToolMap.get(t.toolName) || 0) / t._count.id > 0.5 ? 'degraded' : 'operational',
        responseTime: Math.round(t._avg.latencyMs || 0),
        requestsPerMinute: +((t._count.id / (24 * 60)).toFixed(2)),
      }));
    } else {
      tools = []; // No tools used yet — empty, not fake
    }

    // AI Service APIs — use real provider check data
    const aiProviders = await checkAIProviders();
    const aiServices = aiProviders.map(p => ({
      name: p.name,
      provider: p.name.split('(')[0].trim().split(' ')[0],
      status: p.status,
      responseTime: p.responseTime,
    }));

    res.json({
      success: true,
      endpoints,
      categories: {
        agents,
        tools,
        aiServices,
      },
      summary: {
        api: {
          status: dbCheck.ok && metrics.errorRate < 5 ? 'operational' : 'degraded',
          responseTime: metrics.avgResponseMs || 0,
          requestsPerMinute: metrics.totalLastMinute > 0 ? +(metrics.totalLastMinute / 1).toFixed(1) : 0,
          errorRate: metrics.errorRate,
          uptime: realUptime,
        },
        database: {
          status: dbCheck.ok ? 'operational' : 'outage',
          responseTime: dbCheck.latencyMs,
          message: dbCheck.message,
        },
      },
      timestamp: now,
    });
  } catch (error) {
    console.error('API status endpoint error:', error);
    recordIncident('server_error', 'API status endpoint crashed: ' + (error.message || 'unknown'), '/api/status/api-status', 500);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API status',
    });
  }
});

// ============================================
// MOUNT ROUTERS
// ============================================

app.use('/api', apiRouter);

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// ============================================
// SOCKET.IO
// ============================================

const activeRooms = new Map();

io.on('connection', (socket) => {

  socket.on('join-room', (data) => {
    const { roomId, userId, username } = data;
    socket.join(roomId);

    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Set());
    }
    activeRooms.get(roomId).add({ userId, username, socketId: socket.id });

    socket.to(roomId).emit('user-joined', { userId, username });

    const roomUsers = Array.from(activeRooms.get(roomId)).map((user) => ({
      userId: user.userId,
      username: user.username,
    }));
    socket.emit('room-state', { users: roomUsers });
  });

  socket.on('cursor-move', (data) => {
    const { roomId, userId, username, position } = data;
    socket.to(roomId).emit('cursor-update', {
      userId,
      username,
      position,
      timestamp: Date.now(),
    });
  });

  socket.on('content-change', (data) => {
    const { roomId, userId, username, content, position } = data;
    socket.to(roomId).emit('content-update', {
      userId,
      username,
      content,
      position,
      timestamp: Date.now(),
    });
  });

  // ── Editor state sync for agent editor_select tool ──
  // Frontend pushes cursor/selection state so the AI agent can read it
  socket.on('editor-state', (data) => {
    const { userId, activeFile, cursorLine, cursorCol, selection } = data || {};
    if (!userId) return;
    const state = {};
    if (activeFile !== undefined) state.activeFile = activeFile;
    if (cursorLine !== undefined) state.cursorLine = cursorLine;
    if (cursorCol !== undefined) state.cursorCol = cursorCol;
    if (selection !== undefined) state.selection = selection;
    updateEditorState(userId, state);
  });

  socket.on('typing-start', (data) => {
    const { roomId, userId, username } = data;
    socket.to(roomId).emit('user-typing', { userId, username });
  });

  socket.on('typing-stop', (data) => {
    const { roomId, userId } = data;
    socket.to(roomId).emit('user-stopped-typing', { userId });
  });

  socket.on('disconnect', () => {

    for (const [roomId, users] of activeRooms.entries()) {
      for (const user of users) {
        if (user.socketId === socket.id) {
          users.delete(user);
          socket.to(roomId).emit('user-left', {
            userId: user.userId,
            username: user.username,
          });

          if (users.size === 0) {
            activeRooms.delete(roomId);
          }
          break;
        }
      }
    }
  });
});

// ============================================
// START SERVER
// ============================================

const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

async function initializeServer() {
  try {
    console.log('[server] Initializing Mumtaz AI Server...');
    console.log('[server] Database: PostgreSQL via Prisma');

    // Connect to PostgreSQL
    console.log('[server] Connecting to PostgreSQL...');
    await connectDatabase();

    // Start subscription cron job
    startSubscriptionExpirationCron();

    // Initialize background job queue (BullMQ + Redis)
    try {
      jobQueue.init(io);
      registerAllWorkers();
      console.log('[server] Background job queue initialized');

      // Schedule recurring maintenance jobs
      await jobQueue.addRepeatable('session-cleanup', { maxAge: 30 }, '0 3 * * *', { name: 'daily-session-cleanup' }).catch(() => {});
      await jobQueue.addRepeatable('analytics-rollup', { type: 'daily' }, '0 4 * * *', { name: 'daily-analytics' }).catch(() => {});
    } catch (err) {
      console.warn('⚠️  Job queue init failed (non-fatal):', err.message);
    }

    // Start server
    server.listen(PORT, host, () => {
      console.log(`[server] Mumtaz AI Backend running on ${host}:${PORT}`);
      console.log(`[server] Health check: http://${host}:${PORT}/health`);

      const hasAIService = !!(
        process.env.OPENAI_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.COHERE_API_KEY
      );

      if (hasAIService) {
        console.log('[server] AI services configured');
      } else {
        console.log('[server] No AI services configured');
      }

      console.log('[server] Started successfully');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[server] ${signal} received — draining connections...`);

  // Force exit after 15s if graceful shutdown hangs
  const forceTimer = setTimeout(() => {
    console.error('[server] Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 15_000);
  forceTimer.unref();

  try {
    // 1. Stop accepting new HTTP connections
    server.close(() => console.log('[server] HTTP server closed'));
    // 2. Close all Socket.IO connections
    io.close(() => console.log('[server] Socket.IO closed'));
    // 3. Shutdown job queue (drain in-flight jobs)
    await jobQueue.shutdown().catch(() => {});
    // 4. Disconnect database
    await disconnectDatabase();
    console.log('[server] Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('[server] Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Prevent unhandled async errors from crashing the entire process
process.on('unhandledRejection', (reason, promise) => {
  console.error('[server] Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
  // Give in-flight requests a moment to drain, then exit so PM2 restarts cleanly
  setTimeout(() => process.exit(1), 500);
});

// Start
initializeServer();
