/**
 * CANVAS VIDEO EDITOR ROUTES
 *
 * Dedicated REST endpoints for the AI Video Editor (canvas-app).
 * Wraps the 8 consolidated video tools from agent-tools-service.js
 * and provides upload, metadata, AI planning, tool execution, and export.
 *
 * Endpoints:
 *   POST /upload           — Upload a video file (multipart)
 *   POST /metadata         — Analyse a video file to get metadata
 *   POST /plan             — AI-plan a sequence of edits from a prompt
 *   POST /execute-tool     — Execute a single video tool step
 *   POST /execute-plan     — Execute an entire plan (step-by-step)
 *   POST /export           — Export the final video (format conversion)
 *   GET  /presets           — List built-in preset pipelines
 *
 * Mounted at /api/video-editor  (see api-router.js)
 */

import express from 'express';
import { requireAuth, optionalAuth } from '../lib/auth-middleware.js';
import { executeToolCall } from '../lib/agent-tools-service.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ============================================
// FILE UPLOAD CONFIG
// ============================================

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'video-editor');

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /video\/(mp4|webm|quicktime|x-msvideo|x-matroska|mpeg|ogg)/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported video type: ${file.mimetype}`));
    }
  },
});

// ============================================
// PRESETS (static data — matches videoEditorService)
// ============================================

const VIDEO_PRESETS = [
  {
    id: 'podcast-to-shorts',
    name: 'Podcast → Shorts',
    description: 'Extract best moments, crop 9:16, add captions',
    icon: '🎙️',
    steps: [
      { tool: 'video_ai', action: 'highlights', options: { count: 5 } },
      { tool: 'video_transform', action: 'crop_platform', options: { platform: 'tiktok' } },
      { tool: 'video_ai', action: 'caption', options: { style: 'bold' } },
      { tool: 'video_overlay', action: 'subtitle_burn', options: {} },
      { tool: 'video_overlay', action: 'hook', options: { text: '' } },
    ],
  },
  {
    id: 'cinematic-look',
    name: 'Cinematic Look',
    description: 'Film grade, letterbox, warm tones, subtle grain',
    icon: '🎬',
    steps: [
      { tool: 'video_filter', action: 'cinematic', options: { letterbox: true, color_temp: 'warm' } },
      { tool: 'video_filter', action: 'stabilize', options: { shakiness: 5 } },
      { tool: 'video_audio', action: 'fade', options: { fadeIn: 1, fadeOut: 2 } },
    ],
  },
  {
    id: 'youtube-ready',
    name: 'YouTube Ready',
    description: 'Optimize for YouTube: intro hook, captions, thumbnail',
    icon: '▶️',
    steps: [
      { tool: 'video_overlay', action: 'hook', options: { text: '', duration: 3 } },
      { tool: 'video_ai', action: 'caption', options: { style: 'default' } },
      { tool: 'video_overlay', action: 'subtitle_burn', options: {} },
      { tool: 'video_transform', action: 'crop_platform', options: { platform: 'youtube' } },
      { tool: 'video_convert', action: 'thumbnail', options: {} },
    ],
  },
  {
    id: 'clean-audio',
    name: 'Clean Audio',
    description: 'Remove noise, normalize levels, auto-fade',
    icon: '🔊',
    steps: [
      { tool: 'video_audio', action: 'remove_noise', options: {} },
      { tool: 'video_audio', action: 'normalize', options: {} },
      { tool: 'video_audio', action: 'fade', options: { fadeIn: 0.5, fadeOut: 1 } },
    ],
  },
  {
    id: 'tiktok-viral',
    name: 'TikTok Viral',
    description: 'Crop 9:16, bold captions, speed ramp, hook text',
    icon: '🎵',
    steps: [
      { tool: 'video_transform', action: 'crop_platform', options: { platform: 'tiktok' } },
      { tool: 'video_overlay', action: 'hook', options: { text: '', duration: 3 } },
      { tool: 'video_ai', action: 'caption', options: { style: 'bold' } },
      { tool: 'video_overlay', action: 'subtitle_burn', options: {} },
    ],
  },
  {
    id: 'auto-subtitles',
    name: 'Auto Subtitles',
    description: 'Transcribe speech, generate captions, burn in',
    icon: '💬',
    steps: [
      { tool: 'video_ai', action: 'transcribe', options: { language: 'en' } },
      { tool: 'video_ai', action: 'caption', options: { style: 'default' } },
      { tool: 'video_overlay', action: 'subtitle_burn', options: {} },
    ],
  },
];

// ============================================
// ENDPOINTS
// ============================================

/**
 * POST /api/video-editor/upload
 * Upload a video file. Returns { url, filename, size }.
 */
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const fileUrl = `/uploads/video-editor/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('[VideoEditor] Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/video-editor/metadata
 * Get video metadata (duration, dimensions, codec, fps, etc.)
 * Body: { file: "<url or path>" }
 */
router.post('/metadata', requireAuth, async (req, res) => {
  try {
    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ success: false, message: 'file is required' });
    }

    const result = await executeToolCall('video_analyze', {
      file,
      action: 'metadata',
    }, req.userId, null);

    res.json({ success: result.success, data: result.data, ...(result.error ? { error: result.error } : {}) });
  } catch (error) {
    console.error('[VideoEditor] Metadata error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/video-editor/plan
 * AI-plan a video editing sequence from a natural language prompt.
 * Body: { prompt, videoFile, metadata? }
 * Returns: { interpretation, steps: [{ tool, action, options }] }
 */
router.post('/plan', requireAuth, async (req, res) => {
  try {
    const { prompt, videoFile, metadata } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'prompt is required' });
    }

    // Use the agent orchestrator tool to plan
    const result = await executeToolCall('agent_orchestrator', {
      prompt: buildPlanningPrompt(prompt, videoFile, metadata),
    }, req.userId, null);

    // Parse AI response into structured plan
    const resultData = result?.data || result;
    const text = resultData?.response || resultData?.text || JSON.stringify(resultData);
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.json({
        success: true,
        data: {
          interpretation: 'Could not parse AI plan. Please try a more specific request.',
          steps: [],
        },
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json({
      success: true,
      data: {
        interpretation: parsed.interpretation || 'AI plan generated',
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      },
    });
  } catch (error) {
    console.error('[VideoEditor] Plan error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/video-editor/execute-tool
 * Execute a single video tool step.
 * Body: { tool, action, params }
 */
router.post('/execute-tool', requireAuth, async (req, res) => {
  try {
    const { tool, action, params } = req.body;
    if (!tool) {
      return res.status(400).json({ success: false, message: 'tool is required' });
    }

    const toolParams = {
      ...(params || {}),
      action: action || params?.action,
    };

    const result = await executeToolCall(tool, toolParams, req.userId, null);
    res.json({ success: result.success, data: result.data, ...(result.error ? { error: result.error } : {}) });
  } catch (error) {
    console.error('[VideoEditor] Execute-tool error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/video-editor/execute-plan
 * Execute a full plan step-by-step, chaining outputs.
 * Body: { steps: [{ tool, action, params }] }
 * Returns: { results: [{ stepIndex, status, data }] }
 */
router.post('/execute-plan', requireAuth, async (req, res) => {
  try {
    const { steps } = req.body;
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ success: false, message: 'steps array is required' });
    }

    const results = [];
    let currentFile = steps[0]?.params?.file || '';

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        const toolParams = {
          file: currentFile,
          action: step.action,
          ...(step.params || {}),
          options: step.options || step.params?.options || {},
        };

        if (step.tool === 'video_batch') {
          delete toolParams.file;
        }

        const result = await executeToolCall(step.tool, toolParams, req.userId, null);
        const stepData = result?.data || result;

        // Chain outputs
        const outputUrl = stepData?.url || stepData?.s3Url || stepData?.outputUrl || stepData?.filename;
        if (outputUrl && i < steps.length - 1) {
          currentFile = outputUrl;
        }

        results.push({ stepIndex: i, status: result?.success !== false ? 'completed' : 'failed', data: stepData });
      } catch (stepError) {
        results.push({ stepIndex: i, status: 'failed', error: stepError.message });
      }
    }

    const anyFailed = results.some((r) => r.status === 'failed');
    res.json({
      success: true,
      data: {
        status: anyFailed ? 'partial' : 'completed',
        results,
      },
    });
  } catch (error) {
    console.error('[VideoEditor] Execute-plan error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/video-editor/export
 * Export / convert the final video.
 * Body: { file, format?, quality?, compress? }
 */
router.post('/export', requireAuth, async (req, res) => {
  try {
    const { file, format, quality, compress } = req.body;
    if (!file) {
      return res.status(400).json({ success: false, message: 'file is required' });
    }

    const action = compress ? 'compress' : 'format';
    const result = await executeToolCall('video_convert', {
      file,
      action,
      options: { format: format || 'mp4', quality: quality || 'high' },
    }, req.userId, null);

    res.json({ success: result.success, data: result.data, ...(result.error ? { error: result.error } : {}) });
  } catch (error) {
    console.error('[VideoEditor] Export error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/video-editor/presets
 * Return built-in preset pipelines.
 */
router.get('/presets', optionalAuth, (_req, res) => {
  res.json({ success: true, data: VIDEO_PRESETS });
});

// ============================================
// HELPERS
// ============================================

function buildPlanningPrompt(prompt, videoFile, metadata) {
  return `You are an expert AI video editor agent. Plan a sequence of video tool calls.
The user has a video file: "${videoFile || 'uploaded video'}".
Video metadata: ${JSON.stringify(metadata || {})}.

Available tools: video_transform, video_convert, video_analyze, video_filter, video_overlay, video_audio, video_ai, video_batch.

Rules:
1. Analyze FIRST when you need video info before editing
2. Transform/filter in MIDDLE
3. Overlay/audio LATE
4. Convert/export LAST
5. Minimal steps — only what the user needs

Respond with ONLY a JSON object:
{
  "interpretation": "brief explanation",
  "steps": [{ "tool": "video_filter", "action": "cinematic", "options": {} }]
}

User request: "${prompt}"`;
}

export default router;
