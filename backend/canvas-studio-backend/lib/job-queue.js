/**
 * 🔄 Background Job Queue Service (BullMQ + Redis)
 * ─────────────────────────────────────────────────────────────────
 * Centralized job queue for heavy async work:
 *
 *   Queue Name          │ Purpose
 *   ────────────────────┼──────────────────────────────────────────
 *   image-generation    │ DALL-E / Stability AI image creation
 *   video-generation    │ RunwayML video creation
 *   email               │ Transactional & notification emails
 *   canvas-build        │ Project build pipeline
 *   canvas-deploy       │ Deployment to Vercel / Netlify / S3
 *   archive-processing  │ Bulk zip/tar ops, large extractions
 *   analytics           │ Heavy analytics roll-ups & reports
 *   cleanup             │ Stale session cleanup, S3 garbage collection
 *
 * Usage:
 *   import { jobQueue, JOB_TYPES } from '../lib/job-queue.js';
 *   const job = await jobQueue.add(JOB_TYPES.EMAIL, { to, subject, html }, { userId });
 *   // job.id → track progress via GET /api/jobs/:id
 *
 * Workers auto-start when server boots.
 * Real-time progress via Socket.IO events: 'job:progress', 'job:completed', 'job:failed'
 * ─────────────────────────────────────────────────────────────────
 */

import { Queue, Worker, QueueEvents, FlowProducer } from 'bullmq';
import IORedis from 'ioredis';

// ─── Suppress BullMQ eviction policy spam ──────────────────────
// Redis Cloud doesn't allow CONFIG SET; BullMQ logs this warning
// per connection (~30x). We deduplicate it to a single notice.
let _evictionWarned = false;
const _origWarn = console.warn.bind(console);
const _origError = console.error.bind(console);

console.warn = (...args) => {
  const msg = String(args[0] || '');
  if (msg.includes('Eviction policy') || msg.includes('maxmemory-policy') || msg.includes('noeviction')) {
    if (!_evictionWarned) {
      _evictionWarned = true;
      _origWarn('[JobQueue] ⚠️  Redis eviction policy is volatile-lru — change to "noeviction" in Redis Cloud dashboard for best BullMQ reliability.');
    }
    return;
  }
  _origWarn(...args);
};
console.error = (...args) => {
  const msg = String(args[0] || '');
  if (msg.includes('Eviction policy') || msg.includes('maxmemory-policy') || msg.includes('noeviction')) {
    if (!_evictionWarned) {
      _evictionWarned = true;
      _origWarn('[JobQueue] ⚠️  Redis eviction policy is volatile-lru — change to "noeviction" in Redis Cloud dashboard for best BullMQ reliability.');
    }
    return;
  }
  _origError(...args);
};

// ─── Redis Connection ──────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let connection = null;

function getConnection() {
  if (connection) return connection;
  connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 200, 5000),
  });
  connection.on('error', (err) => {
    console.warn('[JobQueue] Redis error:', err.message);
  });
  connection.on('connect', () => {
    console.log('[JobQueue] Redis connected');
  });
  return connection;
}

// ─── Job Types ─────────────────────────────────────────────────
export const JOB_TYPES = {
  // Media generation
  IMAGE_GENERATION: 'image-generation',
  VIDEO_GENERATION: 'video-generation',

  // Communication
  EMAIL: 'email',
  EMAIL_BULK: 'email-bulk',

  // Canvas pipeline
  CANVAS_BUILD: 'canvas-build',
  CANVAS_DEPLOY: 'canvas-deploy',

  // Archive / file processing
  ARCHIVE_PROCESS: 'archive-processing',
  FILE_CLEANUP: 'file-cleanup',

  // Analytics
  ANALYTICS_ROLLUP: 'analytics-rollup',
  ANALYTICS_EXPORT: 'analytics-export',

  // Maintenance
  SESSION_CLEANUP: 'session-cleanup',
  S3_GARBAGE_COLLECT: 's3-garbage-collect',
};

// ─── Default Job Options per Type ──────────────────────────────
const DEFAULT_OPTIONS = {
  [JOB_TYPES.IMAGE_GENERATION]: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    timeout: 120_000, // 2 min
    removeOnComplete: { age: 86400, count: 500 }, // keep 1d / 500
    removeOnFail: { age: 604800, count: 200 },    // keep 7d / 200
  },
  [JOB_TYPES.VIDEO_GENERATION]: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
    timeout: 300_000, // 5 min
    removeOnComplete: { age: 86400, count: 200 },
    removeOnFail: { age: 604800, count: 100 },
  },
  [JOB_TYPES.EMAIL]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    timeout: 30_000,
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 604800, count: 500 },
    priority: 1, // emails are high priority
  },
  [JOB_TYPES.EMAIL_BULK]: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    timeout: 300_000,
    removeOnComplete: { age: 3600, count: 200 },
    removeOnFail: { age: 604800, count: 100 },
    priority: 5,
  },
  [JOB_TYPES.CANVAS_BUILD]: {
    attempts: 1,
    timeout: 180_000, // 3 min
    removeOnComplete: { age: 86400, count: 200 },
    removeOnFail: { age: 604800, count: 100 },
  },
  [JOB_TYPES.CANVAS_DEPLOY]: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    timeout: 300_000,
    removeOnComplete: { age: 86400, count: 200 },
    removeOnFail: { age: 604800, count: 100 },
  },
  [JOB_TYPES.ARCHIVE_PROCESS]: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    timeout: 180_000,
    removeOnComplete: { age: 3600, count: 300 },
    removeOnFail: { age: 86400, count: 100 },
  },
  [JOB_TYPES.ANALYTICS_ROLLUP]: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
    timeout: 120_000,
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 86400, count: 50 },
    priority: 10, // low priority
  },
  [JOB_TYPES.SESSION_CLEANUP]: {
    attempts: 1,
    timeout: 60_000,
    removeOnComplete: { age: 3600, count: 50 },
    removeOnFail: { age: 86400, count: 20 },
    priority: 10,
  },
};

// ─── Queue Manager (Singleton) ─────────────────────────────────
class JobQueueManager {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.events = new Map();
    this.processors = new Map();
    this.io = null; // Socket.IO instance, set via init()
    this.initialized = false;
  }

  /**
   * Initialize queues and workers. Call once at server startup.
   * @param {object} io - Socket.IO server instance for real-time events
   */
  init(io = null) {
    if (this.initialized) return;
    this.io = io;

    const conn = getConnection();

    // Create one queue per job type
    for (const [, queueName] of Object.entries(JOB_TYPES)) {
      if (this.queues.has(queueName)) continue;

      const queue = new Queue(queueName, { connection: conn });
      this.queues.set(queueName, queue);

      // Queue-level events (for Socket.IO real-time)
      const queueEvents = new QueueEvents(queueName, { connection: conn });
      this.events.set(queueName, queueEvents);

      queueEvents.on('completed', ({ jobId, returnvalue }) => {
        this._emit('job:completed', { jobId, queue: queueName, result: returnvalue });
        console.log(`[JobQueue] ✅ ${queueName}:${jobId} completed`);
      });

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        this._emit('job:failed', { jobId, queue: queueName, error: failedReason });
        console.error(`[JobQueue] ❌ ${queueName}:${jobId} failed: ${failedReason}`);
      });

      queueEvents.on('progress', ({ jobId, data }) => {
        this._emit('job:progress', { jobId, queue: queueName, progress: data });
      });
    }

    this.initialized = true;
    console.log(`[JobQueue] ✅ Initialized ${this.queues.size} queues`);
  }

  /**
   * Register a processor function for a queue.
   * @param {string} queueName - One of JOB_TYPES values
   * @param {Function} processorFn - async (job) => result
   * @param {object} opts - Worker options (concurrency, limiter, etc.)
   */
  registerWorker(queueName, processorFn, opts = {}) {
    if (this.workers.has(queueName)) {
      console.warn(`[JobQueue] Worker already registered for ${queueName}`);
      return;
    }

    const conn = getConnection();
    const concurrency = opts.concurrency || 3;

    const worker = new Worker(queueName, processorFn, {
      connection: conn,
      concurrency,
      limiter: opts.limiter || undefined,
      ...opts,
    });

    worker.on('completed', (job) => {
      console.log(`[Worker:${queueName}] Job ${job.id} completed in ${Date.now() - job.timestamp}ms`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[Worker:${queueName}] Job ${job?.id} failed:`, err.message);
    });

    worker.on('error', (err) => {
      console.error(`[Worker:${queueName}] Error:`, err.message);
    });

    this.workers.set(queueName, worker);
    console.log(`[JobQueue] 🔧 Worker registered: ${queueName} (concurrency: ${concurrency})`);
  }

  /**
   * Add a job to a queue.
   * @param {string} queueName - One of JOB_TYPES values
   * @param {object} data - Job payload
   * @param {object} meta - Additional metadata: { userId, agentId, priority, delay }
   * @returns {Promise<{id, queue}>} - Job ID for tracking
   */
  async add(queueName, data, meta = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}. Did you call init()?`);
    }

    const defaults = DEFAULT_OPTIONS[queueName] || {};
    const jobName = meta.name || queueName;

    const job = await queue.add(jobName, {
      ...data,
      _meta: {
        userId: meta.userId || null,
        agentId: meta.agentId || null,
        createdAt: new Date().toISOString(),
      },
    }, {
      ...defaults,
      priority: meta.priority ?? defaults.priority ?? 5,
      delay: meta.delay ?? 0,
      jobId: meta.jobId || undefined,
    });

    console.log(`[JobQueue] 📋 Added job ${queueName}:${job.id}`);
    return { id: job.id, queue: queueName };
  }

  /**
   * Add a scheduled/recurring job.
   */
  async addRepeatable(queueName, data, pattern, meta = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue not found: ${queueName}`);

    const job = await queue.add(meta.name || queueName, data, {
      ...DEFAULT_OPTIONS[queueName],
      repeat: { pattern }, // cron pattern
    });

    console.log(`[JobQueue] 🔁 Repeatable job ${queueName}:${job.id} (${pattern})`);
    return { id: job.id, queue: queueName };
  }

  /**
   * Get job status and details.
   */
  async getJob(queueName, jobId) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const job = await queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return {
      id: job.id,
      queue: queueName,
      name: job.name,
      state,
      progress: job.progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      duration: job.finishedOn ? job.finishedOn - job.processedOn : null,
    };
  }

  /**
   * Get queue health / counts.
   */
  async getQueueStats(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { queue: queueName, waiting, active, completed, failed, delayed };
  }

  /**
   * Get stats for ALL queues.
   */
  async getAllStats() {
    const stats = {};
    for (const [name] of this.queues) {
      stats[name] = await this.getQueueStats(name);
    }
    return stats;
  }

  /**
   * Emit event via Socket.IO to user rooms.
   */
  _emit(event, data) {
    if (this.io && data) {
      // Emit to user room if userId is in the job data
      const userId = data?.result?._meta?.userId || data?.progress?._meta?.userId;
      if (userId) {
        this.io.to(`user:${userId}`).emit(event, data);
      }
      // Also emit to admin channel
      this.io.to('admin:jobs').emit(event, data);
    }
  }

  /**
   * Graceful shutdown — close all workers and queues.
   */
  async shutdown() {
    console.log('[JobQueue] Shutting down...');
    const closeOps = [];

    for (const [name, worker] of this.workers) {
      closeOps.push(worker.close().then(() => console.log(`[JobQueue] Worker ${name} closed`)));
    }
    for (const [name, events] of this.events) {
      closeOps.push(events.close().then(() => console.log(`[JobQueue] Events ${name} closed`)));
    }
    for (const [name, queue] of this.queues) {
      closeOps.push(queue.close().then(() => console.log(`[JobQueue] Queue ${name} closed`)));
    }

    await Promise.allSettled(closeOps);

    if (connection) {
      connection.disconnect();
      connection = null;
    }

    this.initialized = false;
    console.log('[JobQueue] ✅ Shutdown complete');
  }
}

// Export singleton
export const jobQueue = new JobQueueManager();
export default jobQueue;
