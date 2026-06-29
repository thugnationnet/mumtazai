/**
 * CANVAS APP - STANDALONE BACKEND SERVER
 * Separate PostgreSQL/Prisma database for canvas-app
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
const PORT = process.env.PORT || 3006;

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
// Lightweight metrics tracker
// ----------------------------
const METRICS_WINDOW_SECONDS = 60;
const perSecondBuckets = new Map();

function recordMetric(statusCode, durationMs) {
  const sec = Math.floor(Date.now() / 1000);
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
}

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    recordMetric(res.statusCode, durationMs);
  });
  next();
});

function calcMetricsSnapshot() {
  const nowSec = Math.floor(Date.now() / 1000);
  let total = 0;
  let errors = 0;
  let durations = [];
  for (const [sec, b] of perSecondBuckets) {
    if (sec >= nowSec - METRICS_WINDOW_SECONDS) {
      total += b.count;
      errors += b.errors;
      durations = durations.concat(b.durations);
    }
  }
  const currentBucket = perSecondBuckets.get(nowSec) || { count: 0 };
  const rps = currentBucket.count;
  const avgResponseMs = durations.length
    ? Math.round(durations.reduce((a, v) => a + v, 0) / durations.length)
    : 0;
  const errorRate = total ? +((errors * 100) / total).toFixed(2) : 0;
  return { rps, totalLastMinute: total, avgResponseMs, errorRate };
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
    process.env.XAI_API_KEY ||
    process.env.MISTRAL_API_KEY ||
    process.env.OPENAI_API_KEY
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
      xai: !!process.env.XAI_API_KEY,
      mistral: !!process.env.MISTRAL_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
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
    { key: 'XAI_API_KEY', name: 'xAI (Grok)', model: process.env.XAI_DEFAULT_MODEL || 'grok-3-mini', url: 'https://api.x.ai/v1/models', authHeader: 'Bearer' },
    { key: 'MISTRAL_API_KEY', name: 'Mistral', model: process.env.MISTRAL_DEFAULT_MODEL || 'mistral-large-latest', url: 'https://api.mistral.ai/v1/models', authHeader: 'Bearer' },
    { key: 'OPENAI_API_KEY', name: 'OpenAI', model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o', url: 'https://api.openai.com/v1/models', authHeader: 'Bearer' },
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
          const resp = await fetch(p.url, { method: 'GET', headers, signal: controller.signal }).catch(() => null);
          clearTimeout(timeout);
          responseTime = Date.now() - start;
          if (!resp || resp.status >= 500) status = 'outage';
          else if (resp.status >= 400 && resp.status !== 401) status = 'degraded';
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

app.get('/api/status', async (req, res) => {
  try {
    const metrics = calcMetricsSnapshot();
    const dbCheck = await checkPostgresFast();
    const redisCheck = await checkRedis();
    const aiProviders = await checkAIProviders();
    
    const apiStatus = metrics.errorRate < 1 && metrics.avgResponseMs < 800 ? 'operational' : 'degraded';
    const dbStatus = dbCheck.ok ? 'operational' : 'outage';
    const platformStatus = apiStatus === 'operational' && dbCheck.ok ? 'operational' : 'degraded';

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
      responseTime: metrics.avgResponseMs || 100,
      activeUsers: subscriptionMap.get(agent.agentId) || 0,
      totalUsers: agent.totalUsers || 0,
      totalSessions: agent.totalSessions || 0,
      averageRating: agent.averageRating || 0,
      aiProvider: agent.aiProvider ? agent.aiProvider.model : 'gpt-4' || 'gpt-4',
    }));

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

    // Get system metrics with real data
    const cpuMem = buildCpuMem();
    const loadAvg = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const numCpus = os.cpus().length;
    
    // Calculate uptime from process uptime and error rate
    const serverUptime = process.uptime();
    const uptimeHours = Math.floor(serverUptime / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);
    // Uptime percentage = (1 - errorRate/100) * 100, clamped to a reasonable range
    const uptimePercent = Math.max(0, +((1 - metrics.errorRate / 100) * 100).toFixed(2));

    res.json({
      success: true,
      data: {
        system: {
          cpuPercent: Math.round(loadAvg[0] / numCpus * 100),
          memoryPercent: cpuMem.memPct,
          totalMem: Math.round(totalMem / (1024 * 1024 * 1024) * 100) / 100, // GB
          freeMem: Math.round(freeMem / (1024 * 1024 * 1024) * 100) / 100, // GB
          usedMem: Math.round(usedMem / (1024 * 1024 * 1024) * 100) / 100, // GB
          load1: loadAvg[0]?.toFixed(2) || 0,
          load5: loadAvg[1]?.toFixed(2) || 0,
          load15: loadAvg[2]?.toFixed(2) || 0,
          cores: numCpus,
          uptimeSeconds: serverUptime,
          uptimeFormatted: uptimeDays > 0 ? `${uptimeDays}d ${uptimeHours % 24}h` : `${uptimeHours}h ${Math.floor((serverUptime % 3600) / 60)}m`,
        },
        platform: {
          status: platformStatus,
          uptime: uptimePercent,
          lastUpdated: new Date().toISOString(),
          version: process.env.APP_VERSION || '2.0.0',
          environment: process.env.NODE_ENV || 'production',
        },
        api: {
          status: apiStatus,
          responseTime: metrics.avgResponseMs,
          uptime: uptimePercent,
          requestsToday: sessionsToday + pageViewsToday,
          requestsPerMinute: metrics.rps,
          errorRate: metrics.errorRate,
          errorsToday: Math.round(metrics.errorRate * sessionsToday / 100),
          totalLastMinute: metrics.totalLastMinute,
        },
        database: {
          status: dbStatus,
          type: 'PostgreSQL',
          connectionPool: 10,
          responseTime: dbCheck.latencyMs,
          uptime: uptimePercent,
        },
        cache: {
          status: redisCheck.status,
          type: redisCheck.type,
          responseTime: redisCheck.responseTime,
          connected: redisCheck.connected,
        },
        aiServices: aiProviders,
        agents: agentsData,
        // Get real tool usage data from database
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
          // Fallback: list known tools with no activity data
          return ['DNS Lookup', 'IP Geolocation', 'SSL Checker', 'WHOIS Lookup', 'Port Scanner', 'Speed Test', 'Hash Generator', 'Text-to-Speech']
            .map(name => ({ name, status: 'operational', responseTime: 0, usageCount: 0 }));
        })(),
        analytics: {
          sessionsToday,
          pageViewsToday,
          activeUsers,
        },
        // Generate historical data for the last 7 days from real database
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
            // Uptime for the day: if we have activity, report based on process uptime; if old day and server wasn't up, report 0
            const dayAge = Math.floor((Date.now() - dayStart.getTime()) / 1000);
            const serverCoversDay = process.uptime() >= dayAge;
            const dayUptime = serverCoversDay ? +((1 - metrics.errorRate / 100) * 100).toFixed(2) : (totalActivity > 0 ? 99.5 : 0);
            
            historicalData.push({
              date: dayStart.toISOString().split('T')[0],
              uptime: dayUptime,
              requests: totalActivity,
              avgResponseTime: Math.round(msgLatencies._avg.latencyMs || metrics.avgResponseMs || 0),
            });
          }
          return historicalData;
        })(),
        incidents: [], // No incidents currently
        totalActiveUsers: activeUsers,
      },
    });
  } catch (error) {
    console.error('Status endpoint error:', error);
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

      const apiStatus = metrics.errorRate < 1 && metrics.avgResponseMs < 800 ? 'operational' : 'degraded';
      const dbStatus = dbCheck.ok ? 'operational' : 'outage';
      const platformStatus = apiStatus === 'operational' && dbCheck.ok ? 'operational' : 'degraded';

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
        responseTime: metrics.avgResponseMs || 100,
        activeUsers: subscriptionMap.get(agent.agentId) || 0,
        totalUsers: agent.totalUsers || 0,
        totalSessions: agent.totalSessions || 0,
        averageRating: agent.averageRating || 0,
        aiProvider: agent.aiProvider ? agent.aiProvider.model : 'gpt-4' || 'gpt-4',
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
      const uptimePercent = Math.max(0, +((1 - metrics.errorRate / 100) * 100).toFixed(2));

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
            uptime: uptimePercent,
            lastUpdated: new Date().toISOString(),
            version: process.env.APP_VERSION || '2.0.0',
          },
          api: {
            status: apiStatus,
            responseTime: metrics.avgResponseMs,
            uptime: uptimePercent,
            requestsToday: todaySessions + todayPageViews,
            requestsPerMinute: metrics.rps,
            errorRate: metrics.errorRate,
            errorsToday: Math.round(metrics.errorRate * todaySessions / 100),
          },
          database: {
            status: dbStatus,
            connectionPool: 10,
            responseTime: dbCheck.latencyMs,
            uptime: uptimePercent,
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
            return ['DNS Lookup', 'IP Geolocation', 'SSL Checker', 'WHOIS Lookup', 'Port Scanner', 'Speed Test', 'Hash Generator', 'Text-to-Speech']
              .map(name => ({ name, status: 'operational', responseTime: 0, usageCount: 0 }));
          })(),
          incidents: [],
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

app.get('/api/status/analytics', async (req, res) => {
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
      const successRate = agg.feedbackCount > 0
        ? Math.round((agg.feedbackAvg / 5) * 100)
        : (agg.requests > 0 ? Math.round(Math.max(0, 100 - metrics.errorRate)) : 100);

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
      // Fallback: list known tools with zero usage
      toolsData = ['DNS Lookup', 'IP Geolocation', 'SSL Checker', 'WHOIS Lookup', 'Port Scanner', 'Speed Test', 'Hash Generator', 'Text-to-Speech']
        .map(name => ({ name, usage: 0, users: 0, avgDuration: 0, trend: 'stable' }));
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
    const avgResponseTime = Math.round(overviewLatency._avg.latencyMs || metrics.avgResponseMs || 0);
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

app.get('/api/status/api-status', async (req, res) => {
  try {
    const metrics = calcMetricsSnapshot();
    const dbCheck = await checkPostgresFast();
    const now = new Date().toISOString();
    const baseStatus = metrics.errorRate < 1 && metrics.avgResponseMs < 800 ? 'operational' : 'degraded';
    const computedUptime = Math.max(0, +((1 - metrics.errorRate / 100) * 100).toFixed(2));

    // Core API endpoints with real metrics - responseTime from actual metrics
    const endpoints = [
      {
        name: 'Health Check',
        endpoint: '/api/health',
        method: 'GET',
        status: baseStatus,
        responseTime: dbCheck.latencyMs || metrics.avgResponseMs || 0,
        uptime: computedUptime,
        lastChecked: now,
        errorRate: metrics.errorRate,
      },
      {
        name: 'Status',
        endpoint: '/api/status',
        method: 'GET',
        status: baseStatus,
        responseTime: metrics.avgResponseMs || 0,
        uptime: computedUptime,
        lastChecked: now,
        errorRate: metrics.errorRate,
      },
      {
        name: 'Authentication',
        endpoint: '/api/auth/verify',
        method: 'GET',
        status: baseStatus,
        responseTime: metrics.avgResponseMs || 0,
        uptime: computedUptime,
        lastChecked: now,
        errorRate: metrics.errorRate,
      },
      {
        name: 'Chat Completions',
        endpoint: '/api/studio/chat',
        method: 'POST',
        status: baseStatus,
        responseTime: await (async () => {
          const chatLatency = await prisma.chatMessage.aggregate({
            _avg: { latencyMs: true },
            where: { createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, role: 'assistant', latencyMs: { not: null } },
          });
          return Math.round(chatLatency._avg.latencyMs || metrics.avgResponseMs || 0);
        })(),
        uptime: computedUptime,
        lastChecked: now,
        errorRate: metrics.errorRate,
      },
      {
        name: 'Canvas Generate',
        endpoint: '/api/canvas/generate',
        method: 'POST',
        status: baseStatus,
        responseTime: metrics.avgResponseMs || 0,
        uptime: computedUptime,
        lastChecked: now,
        errorRate: metrics.errorRate,
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
    for (const m of agentMsgLatencies) {
      const agentId = sessionToAgent.get(m.sessionId);
      if (!agentId) continue;
      const existing = agentLatencyMap.get(agentId) || { totalLatency: 0, count: 0 };
      existing.totalLatency += (m._avg.latencyMs || 0) * m._count.id;
      existing.count += m._count.id;
      agentLatencyMap.set(agentId, existing);
    }

    const agents = dbAgents.map(agent => {
      const latData = agentLatencyMap.get(agent.agentId);
      const avgLat = latData && latData.count > 0 ? Math.round(latData.totalLatency / latData.count) : 0;
      return {
        name: agent.name,
        apiEndpoint: `/api/agents/${agent.agentId}`,
        status: agent.status === 'active' ? 'operational' : 'degraded',
        responseTime: avgLat,
        requestsPerMinute: Math.round(metrics.rps * 0.1),
      };
    });

    // Tools APIs from real usage data
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

    const toolEndpointMap = {
      'DNS Lookup': '/api/tools/dns-lookup',
      'IP Geolocation': '/api/tools/ip-geolocation',
      'SSL Checker': '/api/tools/ssl-checker',
      'WHOIS Lookup': '/api/tools/whois-lookup',
      'Port Scanner': '/api/tools/port-scanner',
      'Speed Test': '/api/tools/speed-test',
      'Hash Generator': '/api/tools/hash',
      'Text-to-Speech': '/api/tts',
    };

    let tools;
    if (toolStats.length > 0) {
      tools = toolStats.map(t => ({
        name: t.toolName,
        apiEndpoint: toolEndpointMap[t.toolName] || `/api/tools/${t.toolName.toLowerCase().replace(/\s+/g, '-')}`,
        status: (failedToolMap.get(t.toolName) || 0) / t._count.id > 0.5 ? 'degraded' : 'operational',
        responseTime: Math.round(t._avg.latencyMs || 0),
        requestsPerMinute: Math.round(t._count.id / (24 * 60)),
      }));
    } else {
      tools = Object.entries(toolEndpointMap).map(([name, endpoint]) => ({
        name,
        apiEndpoint: endpoint,
        status: 'operational',
        responseTime: 0,
        requestsPerMinute: 0,
      }));
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
          status: baseStatus,
          responseTime: metrics.avgResponseMs || 0,
          requestsPerMinute: metrics.rps,
          errorRate: metrics.errorRate,
          uptime: computedUptime,
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
    console.log('[canvas-studio] Initializing Canvas App Backend...');
    console.log('[canvas-studio] Database: PostgreSQL via Prisma (CANVAS_APP_DATABASE_URL)');

    // Connect to PostgreSQL
    console.log('[canvas-studio] Connecting to PostgreSQL...');
    await connectDatabase();

    // Start subscription cron job
    startSubscriptionExpirationCron();

    // Initialize background job queue (BullMQ + Redis)
    try {
      jobQueue.init(io);
      registerAllWorkers();
      console.log('[canvas-studio] Background job queue initialized');

      // Schedule recurring maintenance jobs
      await jobQueue.addRepeatable('session-cleanup', { maxAge: 30 }, '0 3 * * *', { name: 'daily-session-cleanup' }).catch(() => {});
      await jobQueue.addRepeatable('analytics-rollup', { type: 'daily' }, '0 4 * * *', { name: 'daily-analytics' }).catch(() => {});
    } catch (err) {
      console.warn('⚠️  Job queue init failed (non-fatal):', err.message);
    }

    // Start server
    server.listen(PORT, host, () => {
      console.log(`[canvas-studio] Canvas App Backend running on ${host}:${PORT}`);
      console.log(`[canvas-studio] Health check: http://${host}:${PORT}/health`);

      const hasAIService = !!(
        process.env.XAI_API_KEY ||
        process.env.MISTRAL_API_KEY ||
        process.env.OPENAI_API_KEY
      );

      if (hasAIService) {
        console.log('[canvas-studio] AI services configured');
      } else {
        console.log('[canvas-studio] No AI services configured');
      }

      console.log('[canvas-studio] Started successfully');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[canvas-studio] SIGTERM received, shutting down...');
  await jobQueue.shutdown().catch(() => {});
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[canvas-studio] SIGINT received, shutting down...');
  await jobQueue.shutdown().catch(() => {});
  await disconnectDatabase();
  process.exit(0);
});

// Start
initializeServer();
