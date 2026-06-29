/**
 * DRAMA-QUEEN — Dedicated Isolated Agent Backend
 *
 * This agent has its own:
 *   - Port 4004
 *   - .env (in this directory)
 *   - API keys (OpenAI PRIMARY + RunwayML for video)
 *   - Rate limits
 *   - Provider cascade
 *
 * Shares (via relative imports):
 *   - universal-chat-backend routes & lib
 *   - node_modules (symlinked from universal-chat-backend on server)
 *   - Database (PostgreSQL, queries filtered by agentId)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load this agent's own .env FIRST — must be before any imports that read process.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Shared route — reuses universal-chat-backend's handler
import agentChatStreamRouter from './routes/chat-stream.js';
import searchRouter from './routes/search.js';
import realtimeTokenRouter from './routes/realtime-token.js';

const AGENT_ID = 'drama-queen';
const PORT = process.env.PORT || 4004;
const config = { rateLimitPerIp: parseInt(process.env.RATE_LIMIT_PER_IP || '30') };

console.log(`[agent-${AGENT_ID}] Starting dedicated backend on port ${PORT}`);
console.log(`[agent-${AGENT_ID}] Config:`, JSON.stringify({
  primaryProvider: config.primaryProvider,
  providerCascade: process.env.AGENT_PROVIDER_CASCADE,
  rateLimit: config.rateLimitPerIp,
  temperature: config.temperature,
  tools: config.enabledTools?.length || 'all',
  runwayConfigured: !!process.env.RUNWAY_API_KEY,
}, null, 2));

// Trust proxy (behind nginx)
const app = express();
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS — drama-queen accepts requests from its own subdomain + main domains
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

if (!allowedOrigins.length) {
  allowedOrigins.push(
    'https://mumtaz.ai',
    'https://www.mumtaz.ai',
    'https://chat.mumtaz.ai',
    'https://drama-queen.mumtaz.ai',
  );
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: AGENT_ID,
    port: PORT,
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    providers: {
      cascade: process.env.AGENT_PROVIDER_CASCADE,
      chat: process.env.AGENT_PROVIDER_CHAT,
      code: process.env.AGENT_PROVIDER_CODE,
      images: process.env.AGENT_PROVIDER_IMAGES,
      search: process.env.AGENT_PROVIDER_SEARCH,
      video: process.env.AGENT_PROVIDER_VIDEO,
    },
    video: {
      runwayConfigured: !!process.env.RUNWAY_API_KEY,
    },
  });
});

// Per-agent rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = config.rateLimitPerIp || 30;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : req.headers['x-real-ip'] || 'unknown';
}

app.use('/api/agent/chat-stream', (req, res, next) => {
  const key = getClientIp(req);
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
  }

  entry.count++;
  next();
});

// Lock agentId to this agent — prevents spoofing other agents through this server
app.use('/api/agent/chat-stream', (req, res, next) => {
  req.body = req.body || {};
  req.body.agentId = AGENT_ID;
  next();
});

// Mount shared chat stream route
app.use('/api/agent/chat-stream', agentChatStreamRouter);
app.use('/api/agent/search', searchRouter);
app.use('/api/agent/realtime/token', realtimeTokenRouter);

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[agent-${AGENT_ID}] Listening on 127.0.0.1:${PORT}`);
});

export default app;
