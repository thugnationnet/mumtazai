/**
 * Video Generation Router
 * 
 * API endpoints for AI video generation using RunwayML
 * Available to users with weekly/monthly subscriptions
 */

import express from 'express';
import {
  generateTextToVideo,
  generateImageToVideo,
  checkVideoStatus,
  cancelVideoGeneration,
  waitForVideo,
  getUsageInfo,
  VIDEO_MODELS,
  VIDEO_RATIOS,
  IMAGE_VIDEO_RATIOS,
} from '../services/video-generation-service.js';
import { rateLimiters } from '../lib/cache.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

/**
 * POST /api/video/generate
 * Generate a video from text prompt (story)
 * 
 * Body:
 *   - prompt: Text description/story for the video
 *   - ratio: Video aspect ratio (landscape, portrait, square, widescreen)
 *   - duration: Duration in seconds (5 or 10)
 */
router.post('/generate', requireAuth, rateLimiters.agent, async (req, res) => {
  try {
    const { prompt, ratio = 'widescreen', duration = 5, model, userId } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a text prompt for video generation',
      });
    }
    
    if (prompt.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is too short. Please provide more details for better results.',
      });
    }
    
    if (prompt.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is too long. Please keep it under 2000 characters.',
      });
    }
    
    const result = await generateTextToVideo({
      prompt,
      ratio,
      duration: parseInt(duration) || 5,
      model: model || undefined,
      userId: userId || req.userId || 'anonymous',
    });
    
    if (result.success) {
      res.json({
        success: true,
        taskId: result.taskId,
        status: 'PENDING',
        message: result.message,
        prompt: result.prompt,
        ratio: result.ratio,
        duration: result.duration,
        estimatedTime: result.estimatedTime,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[VideoRouter] Generate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start video generation',
    });
  }
});

/**
 * POST /api/video/generate-from-image
 * Generate a video from an image with text animation prompt
 * 
 * Body:
 *   - prompt: Animation description
 *   - imageUrl: URL of the source image
 *   - ratio: Video aspect ratio
 *   - duration: Duration in seconds (5 or 10)
 */
router.post('/generate-from-image', requireAuth, rateLimiters.agent, async (req, res) => {
  try {
    const { prompt, imageUrl, ratio = 'widescreen', duration = 5, model, userId } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a text prompt for video animation',
      });
    }
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide an image URL',
      });
    }
    
    const result = await generateImageToVideo({
      prompt,
      imageUrl,
      ratio,
      duration: parseInt(duration) || 5,
      model: model || undefined,
      userId: userId || req.userId || 'anonymous',
    });
    
    if (result.success) {
      res.json({
        success: true,
        taskId: result.taskId,
        status: 'PENDING',
        message: result.message,
        prompt: result.prompt,
        imageUrl: result.imageUrl,
        ratio: result.ratio,
        duration: result.duration,
        estimatedTime: result.estimatedTime,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[VideoRouter] Generate from image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start video generation from image',
    });
  }
});

/**
 * GET /api/video/status/:taskId
 * Check the status of a video generation task
 */
router.get('/status/:taskId', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }
    
    const result = await checkVideoStatus(taskId);

    // Map service status to RunwayML-style uppercase for frontend polling
    const STATUS_MAP = { completed: 'SUCCEEDED', failed: 'FAILED', cancelled: 'CANCELLED', processing: 'RUNNING' };
    const uiStatus = STATUS_MAP[result.status] || result.status?.toUpperCase() || 'RUNNING';

    res.json({
      success: result.success,
      taskId: result.taskId,
      status: uiStatus,
      videoUrl: result.videoUrl || null,
      progress: result.progress || 0,
      error: result.error || null,
      message: result.message,
    });
  } catch (error) {
    console.error('[VideoRouter] Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check video status',
    });
  }
});

/**
 * POST /api/video/wait/:taskId
 * Wait for video generation to complete (blocking call with timeout)
 * 
 * Query:
 *   - timeout: Max wait time in ms (default: 120000)
 */
router.post('/wait/:taskId', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { timeout = 120000 } = req.query;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }
    
    const result = await waitForVideo(
      taskId,
      Math.min(parseInt(timeout) || 120000, 300000), // Max 5 minutes
      5000 // Poll every 5 seconds
    );

    const STATUS_MAP = { completed: 'SUCCEEDED', failed: 'FAILED', cancelled: 'CANCELLED', processing: 'RUNNING' };
    const uiStatus = STATUS_MAP[result.status] || result.status?.toUpperCase() || 'RUNNING';

    res.json({
      success: result.success,
      taskId: result.taskId,
      status: uiStatus,
      videoUrl: result.videoUrl || null,
      error: result.error || null,
      message: result.message,
    });
  } catch (error) {
    console.error('[VideoRouter] Wait error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to wait for video',
    });
  }
});

/**
 * DELETE /api/video/cancel/:taskId
 * Cancel a video generation task
 */
router.delete('/cancel/:taskId', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }
    
    const result = await cancelVideoGeneration(taskId);
    
    res.json({
      success: result.success,
      message: result.message,
      error: result.error,
    });
  } catch (error) {
    console.error('[VideoRouter] Cancel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel video generation',
    });
  }
});

/**
 * GET /api/video/models
 * Get available video models
 */
router.get('/models', (req, res) => {
  res.json({
    success: true,
    data: {
      models: Object.values(VIDEO_MODELS),
      textToVideoRatios: Object.entries(VIDEO_RATIOS).map(([name, value]) => ({
        name,
        value,
        label: name.charAt(0).toUpperCase() + name.slice(1),
      })),
      imageToVideoRatios: Object.entries(IMAGE_VIDEO_RATIOS).map(([name, value]) => ({
        name,
        value,
        label: name.charAt(0).toUpperCase() + name.slice(1),
      })),
      // Keep backward compatible "ratios" key
      ratios: Object.entries(VIDEO_RATIOS).map(([name, value]) => ({
        name,
        value,
        label: name.charAt(0).toUpperCase() + name.slice(1),
      })),
      durations: Array.from({ length: 9 }, (_, i) => ({
        value: i + 2,
        label: `${i + 2} seconds`,
      })),
    },
  });
});

/**
 * GET /api/video/usage
 * Get video generation usage/credits info
 */
router.get('/usage', async (req, res) => {
  try {
    const result = await getUsageInfo();
    
    res.json({
      success: result.success,
      data: result.success ? {
        organization: result.organization,
        credits: result.credits,
      } : null,
      error: result.error,
    });
  } catch (error) {
    console.error('[VideoRouter] Usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage info',
    });
  }
});

export default router;
