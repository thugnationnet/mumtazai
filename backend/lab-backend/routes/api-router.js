/**
 * Lab Backend — API Router
 * Mounts all sub-routers under /api
 * Auth is handled centrally by shiny-backend (port 3005)
 */

import express from 'express';
// import authRouter from './auth.js';  // REMOVED — auth consolidated to port 3005
import analyticsRouter from './analytics.js';
import labExperimentsRouter from './lab-experiments.js';
import emotionVisualizerRouter from './lab-emotion-visualizer.js';
import storyWeaverRouter from './lab-story-weaver.js';
import battleArenaRouter from './lab-battle-arena.js';
import { rateLimiters } from '../lib/cache.js';

const router = express.Router();

// Health
router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'lab-backend', timestamp: new Date().toISOString() }));

// Auth — handled by shiny-backend (port 3005)
// All /api/auth/* requests are routed by nginx to port 3005

// Analytics
router.use('/analytics', rateLimiters.api, analyticsRouter);

// Lab — experiments (simple endpoints)
router.use('/lab', rateLimiters.api, labExperimentsRouter);

// Lab — emotion visualizer
router.use('/lab/emotion-visualizer', rateLimiters.api, emotionVisualizerRouter);

// Lab — story weaver
router.use('/lab/story-weaver', rateLimiters.api, storyWeaverRouter);

// Lab — battle arena
router.use('/lab/battle-arena', rateLimiters.api, battleArenaRouter);

export default router;
