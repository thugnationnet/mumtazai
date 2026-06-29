/**
 * 📋 BACKGROUND JOBS API ROUTES
 * ─────────────────────────────────────────────────────────
 * REST API for managing background jobs via BullMQ.
 *
 *   GET  /api/jobs/stats           — All queue statistics
 *   GET  /api/jobs/stats/:queue    — Single queue stats
 *   GET  /api/jobs/:queue/:id      — Get job status
 *   POST /api/jobs                 — Add a new job
 *   POST /api/jobs/schedule        — Add a recurring job
 *   DELETE /api/jobs/:queue/:id    — Cancel a job
 * ─────────────────────────────────────────────────────────
 */

import express from 'express';
import { jobQueue, JOB_TYPES } from '../lib/job-queue.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

// ─── GET /stats — All queue statistics ────────────────────────
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await jobQueue.getAllStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('[Jobs] Stats error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch job stats' });
  }
});

// ─── GET /stats/:queue — Single queue statistics ─────────────
router.get('/stats/:queue', requireAuth, async (req, res) => {
  try {
    const stats = await jobQueue.getQueueStats(req.params.queue);
    if (!stats) {
      return res.status(404).json({ success: false, error: `Queue not found: ${req.params.queue}` });
    }
    res.json({ success: true, stats });
  } catch (error) {
    console.error('[Jobs] Queue stats error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch queue stats' });
  }
});

// ─── GET /types — List all available job types ────────────────
router.get('/types', requireAuth, (_req, res) => {
  res.json({ success: true, types: JOB_TYPES });
});

// ─── GET /:queue/:id — Get job status / details ──────────────
router.get('/:queue/:id', requireAuth, async (req, res) => {
  try {
    const job = await jobQueue.getJob(req.params.queue, req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Only allow users to see their own jobs (unless admin)
    const userId = req.userId || req.session?.userId;
    if (job.data?._meta?.userId && job.data._meta.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, job });
  } catch (error) {
    console.error('[Jobs] Get job error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch job' });
  }
});

// ─── POST / — Add a new background job ───────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { queue, data, priority, delay } = req.body;
    const userId = req.userId || req.session?.userId;

    if (!queue) {
      return res.status(400).json({ success: false, error: 'Queue name is required' });
    }

    // Validate queue exists
    const validQueues = Object.values(JOB_TYPES);
    if (!validQueues.includes(queue)) {
      return res.status(400).json({
        success: false,
        error: `Invalid queue: ${queue}. Valid: ${validQueues.join(', ')}`,
      });
    }

    const job = await jobQueue.add(queue, data || {}, {
      userId,
      priority,
      delay,
    });

    res.status(201).json({ success: true, job });
  } catch (error) {
    console.error('[Jobs] Add job error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to add job' });
  }
});

// ─── POST /schedule — Add a recurring job ────────────────────
router.post('/schedule', requireAuth, async (req, res) => {
  try {
    const { queue, data, cron, name } = req.body;
    const userId = req.userId || req.session?.userId;

    if (!queue || !cron) {
      return res.status(400).json({ success: false, error: 'Queue and cron pattern are required' });
    }

    const job = await jobQueue.addRepeatable(queue, data || {}, cron, {
      userId,
      name: name || queue,
    });

    res.json({ success: true, job });
  } catch (error) {
    console.error('[Jobs] Schedule job error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to schedule job' });
  }
});

export default router;
