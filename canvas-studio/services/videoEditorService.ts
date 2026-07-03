/**
 * videoEditorService — Video editor presets and type re-exports
 *
 * Provides the VIDEO_PRESETS constant used by VideoEditorPanel and
 * re-exports relevant types from the central types file.
 */

export type { VideoPreset, VideoToolCall, VideoToolName, VideoPlan, VideoProject } from '../types';

/** Built-in one-click preset pipelines (same as backend /api/video-editor/presets) */
export const VIDEO_PRESETS = [
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
