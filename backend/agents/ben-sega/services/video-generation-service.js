/**
 * Video Generation Service
 *
 * Handles AI video generation via RunwayML Gen-4.
 * Requires RUNWAY_API_KEY in environment variables.
 */

const RUNWAY_API_BASE = process.env.RUNWAY_API_BASE || 'https://api.runwayml.com/v1';
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

// ── Constants ────────────────────────────────────────────────────────────────

export const VIDEO_MODELS = {
  GEN4_TURBO: 'gen4_turbo',
  GEN3A_TURBO: 'gen3a_turbo',
};

/** Aspect ratios for text-to-video */
export const VIDEO_RATIOS = {
  landscape: '1280:720',
  portrait: '720:1280',
  square: '960:960',
  widescreen: '1584:672',
};

/** Aspect ratios for image-to-video */
export const IMAGE_VIDEO_RATIOS = {
  landscape: '1280:720',
  portrait: '720:1280',
  square: '960:960',
  widescreen: '1584:672',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function notConfigured() {
  return {
    success: false,
    error: 'Video generation is not configured. Please set RUNWAY_API_KEY.',
  };
}

async function runwayRequest(path, options = {}) {
  const res = await fetch(`${RUNWAY_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${RUNWAY_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`RunwayML API error ${res.status}: ${text}`);
  }

  return res.json();
}

// ── Exported functions ───────────────────────────────────────────────────────

/**
 * Generate a video from a text prompt.
 */
export async function generateTextToVideo({ prompt, ratio = 'widescreen', duration = 5, model, userId }) {
  if (!RUNWAY_API_KEY) return notConfigured();

  try {
    const resolution = VIDEO_RATIOS[ratio] || VIDEO_RATIOS.widescreen;
    const data = await runwayRequest('/text_to_video', {
      method: 'POST',
      body: JSON.stringify({
        model: model || VIDEO_MODELS.GEN4_TURBO,
        promptText: prompt,
        ratio: resolution,
        duration,
      }),
    });

    return {
      success: true,
      taskId: data.id,
      message: 'Video generation started',
      prompt,
      ratio: resolution,
      duration,
      estimatedTime: duration === 5 ? 60 : 120,
    };
  } catch (err) {
    console.error('[VideoService] generateTextToVideo error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate a video from an image + animation prompt.
 */
export async function generateImageToVideo({ prompt, imageUrl, ratio = 'widescreen', duration = 5, model, userId }) {
  if (!RUNWAY_API_KEY) return notConfigured();

  try {
    const resolution = IMAGE_VIDEO_RATIOS[ratio] || IMAGE_VIDEO_RATIOS.widescreen;
    const data = await runwayRequest('/image_to_video', {
      method: 'POST',
      body: JSON.stringify({
        model: model || VIDEO_MODELS.GEN4_TURBO,
        promptImage: imageUrl,
        promptText: prompt,
        ratio: resolution,
        duration,
      }),
    });

    return {
      success: true,
      taskId: data.id,
      message: 'Image-to-video generation started',
      prompt,
      imageUrl,
      ratio: resolution,
      duration,
      estimatedTime: duration === 5 ? 60 : 120,
    };
  } catch (err) {
    console.error('[VideoService] generateImageToVideo error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check the status of an ongoing generation task.
 */
export async function checkVideoStatus(taskId) {
  if (!RUNWAY_API_KEY) return { ...notConfigured(), taskId, status: 'failed' };

  try {
    const data = await runwayRequest(`/tasks/${taskId}`);
    const statusMap = {
      SUCCEEDED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      RUNNING: 'processing',
      PENDING: 'processing',
    };

    return {
      success: true,
      taskId: data.id,
      status: statusMap[data.status] || 'processing',
      videoUrl: data.output?.[0] || null,
      progress: data.progress || 0,
      message: data.status,
    };
  } catch (err) {
    console.error('[VideoService] checkVideoStatus error:', err);
    return { success: false, taskId, status: 'failed', error: err.message };
  }
}

/**
 * Cancel an in-progress generation task.
 */
export async function cancelVideoGeneration(taskId) {
  if (!RUNWAY_API_KEY) return notConfigured();

  try {
    await runwayRequest(`/tasks/${taskId}/cancel`, { method: 'POST' });
    return { success: true, taskId, message: 'Cancelled' };
  } catch (err) {
    console.error('[VideoService] cancelVideoGeneration error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Poll until a task completes or the timeout is reached.
 */
export async function waitForVideo({ taskId, userId, timeout = 300000 }) {
  const pollInterval = 5000;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const status = await checkVideoStatus(taskId);
    if (!status.success) return status;
    if (status.status === 'completed') return { ...status, success: true };
    if (status.status === 'failed' || status.status === 'cancelled') {
      return { success: false, taskId, status: status.status, error: 'Generation failed or was cancelled' };
    }
    await new Promise((r) => setTimeout(r, pollInterval));
  }

  return { success: false, taskId, status: 'timeout', error: 'Timed out waiting for video' };
}

/**
 * Return video generation availability info.
 * RunwayML does not expose per-user quota via public API.
 * Returns real API availability status.
 */
export async function getUsageInfo() {
  if (!RUNWAY_API_KEY) {
    return {
      success: true,
      available: false,
      message: 'Video generation not configured — RUNWAY_API_KEY missing',
      credits: { remaining: 0, used: 0, total: 0 },
      organization: null,
    };
  }

  // Ping RunwayML to verify the key is valid
  try {
    const response = await fetch(`${RUNWAY_API_BASE}/tasks`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    return {
      success: true,
      available: response.ok,
      message: response.ok
        ? 'Video generation available — check RunwayML dashboard for quota details'
        : `RunwayML API returned ${response.status}`,
      credits: { remaining: null, used: null, total: null },
      organization: null,
    };
  } catch (error) {
    return {
      success: true,
      available: false,
      message: `RunwayML API unreachable: ${error.message}`,
      credits: { remaining: 0, used: 0, total: 0 },
      organization: null,
    };
  }
}
