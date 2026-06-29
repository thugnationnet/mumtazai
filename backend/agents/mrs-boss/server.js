/**
 * MRS-BOSS — Dedicated Isolated Agent Backend
 * Port 4008 | OpenAI PRIMARY
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import agentChatStreamRouter from './routes/chat-stream.js';
import searchRouter from './routes/search.js';
import realtimeTokenRouter from './routes/realtime-token.js';

const AGENT_ID = 'mrs-boss';
const PORT = process.env.PORT || 4008;
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

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

if (!allowedOrigins.length) {
  allowedOrigins.push(
    'https://mumtaz.ai',
    'https://www.mumtaz.ai',
    'https://chat.mumtaz.ai',
    `https://mrs-boss.mumtaz.ai`,
  );
}

app.use(cors({ origin: allowedOrigins, credentials: true, optionsSuccessStatus: 200 }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

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
    video: { runwayConfigured: !!process.env.RUNWAY_API_KEY },
  });
});

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
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
    return res.status(429).json({ error: 'Rate limit exceeded', retryAfter: Math.ceil((entry.resetTime - now) / 1000) });
  }
  entry.count++;
  next();
});

app.use('/api/agent/chat-stream', (req, res, next) => {
  req.body = req.body || {};
  req.body.agentId = AGENT_ID;
  next();
});

app.use('/api/agent/chat-stream', agentChatStreamRouter);
app.use('/api/agent/search', searchRouter);
app.use('/api/agent/realtime/token', realtimeTokenRouter);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[agent-${AGENT_ID}] Listening on 127.0.0.1:${PORT}`);
});

export default app;
