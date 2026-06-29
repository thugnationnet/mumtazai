/**
 * VIDEO ENGINE — FFmpeg-based video processing.
 * All functions shell out to ffmpeg/ffprobe via child_process.
 * Returns { success, outputPath|data|buffer, message } or { success: false, error }.
 */

import { execSync, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ── Helpers ─────────────────────────────────────────────────────────────────

function tmpPath(ext = '.mp4') {
  const dir = path.join(process.cwd(), 'uploads', 'video-tmp');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, crypto.randomBytes(12).toString('hex') + ext);
}

function hasFfmpeg() {
  try { execSync('which ffmpeg', { stdio: 'pipe' }); return true; } catch { return false; }
}

function hasFfprobe() {
  try { execSync('which ffprobe', { stdio: 'pipe' }); return true; } catch { return false; }
}

function ffmpeg(args, timeout = 120000) {
  return execFileSync('ffmpeg', args, { timeout, maxBuffer: 100 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
}

function ffprobe(args) {
  return execFileSync('ffprobe', args, { timeout: 30000, maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' });
}

function ensureInput(inputPath) {
  if (!inputPath) throw new Error('inputPath is required');
  if (!fs.existsSync(inputPath)) throw new Error(`Input file not found: ${inputPath}`);
}

// ── 1. TRIM ─────────────────────────────────────────────────────────────────

export async function trimVideo(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed on this server' };
    const { inputPath, startTime = '00:00:00', endTime, duration } = options;
    ensureInput(inputPath);

    const ext = path.extname(inputPath) || '.mp4';
    const outputPath = tmpPath(ext);
    const args = ['-y', '-i', inputPath, '-ss', startTime];
    if (endTime) args.push('-to', endTime);
    else if (duration) args.push('-t', String(duration));
    args.push('-c', 'copy', outputPath);

    ffmpeg(args);
    return { success: true, outputPath, message: `Trimmed video from ${startTime}${endTime ? ' to ' + endTime : ''}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 2. HIGHLIGHTS ───────────────────────────────────────────────────────────

export async function extractHighlights(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    const { inputPath, segments = [], segmentDuration = 10 } = options;
    ensureInput(inputPath);

    const outputs = [];
    if (segments.length > 0) {
      for (let i = 0; i < segments.length; i++) {
        const s = segments[i];
        const out = tmpPath('.mp4');
        ffmpeg(['-y', '-i', inputPath, '-ss', String(s.start || 0), '-t', String(s.duration || segmentDuration), '-c', 'copy', out]);
        outputs.push(out);
      }
    } else {
      // Extract first/middle/last segments as highlights
      const info = JSON.parse(ffprobe(['-v', 'quiet', '-print_format', 'json', '-show_format', inputPath]));
      const dur = parseFloat(info.format?.duration || 60);
      const points = [0, Math.max(0, dur / 2 - segmentDuration / 2), Math.max(0, dur - segmentDuration)];
      for (const pt of points) {
        const out = tmpPath('.mp4');
        ffmpeg(['-y', '-i', inputPath, '-ss', String(pt), '-t', String(segmentDuration), '-c', 'copy', out]);
        outputs.push(out);
      }
    }

    return { success: true, outputPaths: outputs, message: `Extracted ${outputs.length} highlight segments` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 3. RESIZE ───────────────────────────────────────────────────────────────

export async function resizeVideo(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    const { inputPath, width = 1280, height = 720, fit = 'scale' } = options;
    ensureInput(inputPath);

    const outputPath = tmpPath('.mp4');
    let vf;
    if (fit === 'crop') vf = `crop=${width}:${height}`;
    else if (fit === 'pad') vf = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
    else vf = `scale=${width}:${height}`;

    ffmpeg(['-y', '-i', inputPath, '-vf', vf, '-c:a', 'copy', outputPath]);
    return { success: true, outputPath, message: `Resized to ${width}x${height} (${fit})` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 4. SUBTITLES ────────────────────────────────────────────────────────────

export async function subtitleVideo(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    const { inputPath, subtitlePath, subtitleText, fontsize = 24, fontcolor = 'white', position = 'bottom' } = options;
    ensureInput(inputPath);

    const outputPath = tmpPath('.mp4');

    if (subtitlePath && fs.existsSync(subtitlePath)) {
      // Burn in SRT/ASS subtitle file
      ffmpeg(['-y', '-i', inputPath, '-vf', `subtitles=${subtitlePath}`, '-c:a', 'copy', outputPath]);
    } else if (subtitleText) {
      // Draw text overlay
      const y = position === 'top' ? '20' : position === 'center' ? '(h-text_h)/2' : 'h-th-20';
      const vf = `drawtext=text='${subtitleText.replace(/'/g, "\\'")}':fontsize=${fontsize}:fontcolor=${fontcolor}:x=(w-text_w)/2:y=${y}`;
      ffmpeg(['-y', '-i', inputPath, '-vf', vf, '-c:a', 'copy', outputPath]);
    } else {
      return { success: false, error: 'Provide subtitlePath (.srt/.ass) or subtitleText' };
    }

    return { success: true, outputPath, message: 'Added subtitles to video' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 5. STYLE ────────────────────────────────────────────────────────────────

export async function styleVideo(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    const { inputPath, style = 'grayscale' } = options;
    ensureInput(inputPath);

    const outputPath = tmpPath('.mp4');
    const styles = {
      grayscale: 'hue=s=0',
      sepia: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
      vintage: 'curves=vintage',
      blur: 'gblur=sigma=5',
      sharpen: 'unsharp=5:5:1.5',
      mirror: 'hflip',
      flip: 'vflip',
      negative: 'negate',
      brightness: 'eq=brightness=0.2',
      contrast: 'eq=contrast=1.5',
      saturate: 'eq=saturation=2.0',
      vignette: 'vignette',
      slow: 'setpts=2.0*PTS',
      fast: 'setpts=0.5*PTS',
    };

    const vf = styles[style] || styles.grayscale;
    const args = ['-y', '-i', inputPath, '-vf', vf];
    if (style === 'slow' || style === 'fast') args.push('-an'); // audio gets out of sync
    else args.push('-c:a', 'copy');
    args.push(outputPath);

    ffmpeg(args);
    return { success: true, outputPath, message: `Applied style: ${style}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 6. OVERLAY ──────────────────────────────────────────────────────────────

export async function overlayVideo(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    const { inputPath, overlayPath, x = 10, y = 10, opacity = 1.0 } = options;
    ensureInput(inputPath);
    if (!overlayPath || !fs.existsSync(overlayPath)) return { success: false, error: 'overlayPath required and must exist' };

    const outputPath = tmpPath('.mp4');
    const filter = opacity < 1
      ? `[1]format=rgba,colorchannelmixer=aa=${opacity}[ov];[0][ov]overlay=${x}:${y}`
      : `overlay=${x}:${y}`;
    ffmpeg(['-y', '-i', inputPath, '-i', overlayPath, '-filter_complex', filter, '-c:a', 'copy', outputPath]);
    return { success: true, outputPath, message: `Overlayed image at (${x}, ${y})` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 7. AUDIO ────────────────────────────────────────────────────────────────

export async function audioVideo(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    const { inputPath, action = 'extract', audioPath, volume = 1.0 } = options;
    ensureInput(inputPath);

    const outputPath = tmpPath(action === 'extract' ? '.mp3' : '.mp4');

    switch (action) {
      case 'extract':
        ffmpeg(['-y', '-i', inputPath, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', outputPath]);
        break;
      case 'remove':
        ffmpeg(['-y', '-i', inputPath, '-an', '-c:v', 'copy', outputPath]);
        break;
      case 'replace':
        if (!audioPath || !fs.existsSync(audioPath)) return { success: false, error: 'audioPath required for replace' };
        ffmpeg(['-y', '-i', inputPath, '-i', audioPath, '-c:v', 'copy', '-map', '0:v:0', '-map', '1:a:0', '-shortest', outputPath]);
        break;
      case 'volume':
        ffmpeg(['-y', '-i', inputPath, '-af', `volume=${volume}`, '-c:v', 'copy', outputPath]);
        break;
      case 'mix':
        if (!audioPath || !fs.existsSync(audioPath)) return { success: false, error: 'audioPath required for mix' };
        ffmpeg(['-y', '-i', inputPath, '-i', audioPath, '-filter_complex', `[0:a][1:a]amix=inputs=2:duration=first`, '-c:v', 'copy', outputPath]);
        break;
      default:
        return { success: false, error: `Unknown audio action: ${action}` };
    }

    return { success: true, outputPath, message: `Audio ${action} complete` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 8. FACES (thumbnail extraction at keyframes) ────────────────────────────

export async function facesVideo(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    const { inputPath, interval = 5, maxFrames = 10 } = options;
    ensureInput(inputPath);

    const dir = path.join(process.cwd(), 'uploads', 'video-tmp', 'frames-' + crypto.randomBytes(6).toString('hex'));
    fs.mkdirSync(dir, { recursive: true });

    // Extract frames at interval
    ffmpeg(['-y', '-i', inputPath, '-vf', `fps=1/${interval}`, '-frames:v', String(maxFrames), path.join(dir, 'frame_%03d.jpg')]);

    const frames = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).map(f => path.join(dir, f));
    return { success: true, frames, directory: dir, message: `Extracted ${frames.length} frames at ${interval}s interval` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 9. MODERATE (basic scene detection / frame sampling) ────────────────────

export async function moderateVideo(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    const { inputPath, sampleCount = 5 } = options;
    ensureInput(inputPath);

    // Get video duration
    const info = JSON.parse(ffprobe(['-v', 'quiet', '-print_format', 'json', '-show_format', inputPath]));
    const duration = parseFloat(info.format?.duration || 10);

    // Sample frames for moderation
    const dir = path.join(process.cwd(), 'uploads', 'video-tmp', 'mod-' + crypto.randomBytes(6).toString('hex'));
    fs.mkdirSync(dir, { recursive: true });

    const interval = Math.max(1, Math.floor(duration / sampleCount));
    ffmpeg(['-y', '-i', inputPath, '-vf', `fps=1/${interval}`, '-frames:v', String(sampleCount), path.join(dir, 'sample_%03d.jpg')]);

    const samples = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).map(f => path.join(dir, f));
    return {
      success: true,
      samples,
      duration,
      message: `Sampled ${samples.length} frames for moderation review. Use vision API to classify each frame.`,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 10. BATCH ───────────────────────────────────────────────────────────────

export async function batchVideo(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    const { inputPaths = [], operation = 'resize', operationOptions = {} } = options;

    if (inputPaths.length === 0) return { success: false, error: 'inputPaths array required' };

    const operations = { trimVideo, resizeVideo, styleVideo, convertVideo, filterVideo };
    const fn = operations[operation] || operations.resizeVideo;

    const results = [];
    for (const inp of inputPaths) {
      const result = await fn({ inputPath: inp, ...operationOptions });
      results.push({ input: inp, ...result });
    }

    const succeeded = results.filter(r => r.success).length;
    return { success: true, results, message: `Batch ${operation}: ${succeeded}/${inputPaths.length} succeeded` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 11. EXPORT ──────────────────────────────────────────────────────────────

export async function exportVideo(options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    const { inputPath, format = 'mp4', quality = 'medium', preset = 'fast' } = options;
    ensureInput(inputPath);

    const ext = '.' + format;
    const outputPath = tmpPath(ext);
    const crf = quality === 'high' ? '18' : quality === 'low' ? '28' : '23';

    if (format === 'gif') {
      ffmpeg(['-y', '-i', inputPath, '-vf', 'fps=15,scale=480:-1:flags=lanczos', '-loop', '0', outputPath]);
    } else if (format === 'webm') {
      ffmpeg(['-y', '-i', inputPath, '-c:v', 'libvpx-vp9', '-crf', crf, '-b:v', '0', '-c:a', 'libopus', outputPath]);
    } else {
      ffmpeg(['-y', '-i', inputPath, '-c:v', 'libx264', '-preset', preset, '-crf', crf, '-c:a', 'aac', outputPath]);
    }

    return { success: true, outputPath, format, message: `Exported as ${format} (quality: ${quality})` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 12. TRANSFORM ───────────────────────────────────────────────────────────

export async function transformVideo(inputPath, options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    ensureInput(inputPath);
    const { rotate = 0, speed = 1.0, reverse = false, loop = 1 } = options;

    const outputPath = tmpPath('.mp4');
    const filters = [];

    if (rotate) filters.push(`rotate=${rotate}*PI/180`);
    if (speed !== 1.0) filters.push(`setpts=${(1 / speed).toFixed(3)}*PTS`);
    if (reverse) filters.push('reverse');

    const args = ['-y'];
    if (loop > 1) args.push('-stream_loop', String(loop - 1));
    args.push('-i', inputPath);
    if (filters.length > 0) args.push('-vf', filters.join(','));
    if (speed !== 1.0) args.push('-an'); else args.push('-c:a', 'copy');
    args.push(outputPath);

    ffmpeg(args);
    return { success: true, outputPath, message: `Transformed: rotate=${rotate}° speed=${speed}x${reverse ? ' reverse' : ''}${loop > 1 ? ` loop=${loop}` : ''}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 13. CONVERT ─────────────────────────────────────────────────────────────

export async function convertVideo(inputPath, options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    ensureInput(inputPath);
    const { outputFormat = 'mp4', codec = 'auto' } = options;

    const outputPath = tmpPath('.' + outputFormat);
    const args = ['-y', '-i', inputPath];

    if (codec !== 'auto') {
      args.push('-c:v', codec);
    }
    args.push(outputPath);

    ffmpeg(args);
    return { success: true, outputPath, format: outputFormat, message: `Converted to ${outputFormat}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 14. ANALYZE ─────────────────────────────────────────────────────────────

export async function analyzeVideo(inputPath, options = {}) {
  try {
    if (!hasFfprobe()) return { success: false, error: 'FFprobe not installed' };
    ensureInput(inputPath);

    const raw = ffprobe(['-v', 'quiet', '-print_format', 'json', '-show_streams', '-show_format', inputPath]);
    const info = JSON.parse(raw);

    const videoStream = info.streams?.find(s => s.codec_type === 'video');
    const audioStream = info.streams?.find(s => s.codec_type === 'audio');

    const analysis = {
      format: info.format?.format_name,
      duration: parseFloat(info.format?.duration || 0),
      size: parseInt(info.format?.size || 0),
      bitrate: parseInt(info.format?.bit_rate || 0),
      video: videoStream ? {
        codec: videoStream.codec_name,
        width: videoStream.width,
        height: videoStream.height,
        fps: eval(videoStream.r_frame_rate || '0'),
        pixelFormat: videoStream.pix_fmt,
      } : null,
      audio: audioStream ? {
        codec: audioStream.codec_name,
        sampleRate: parseInt(audioStream.sample_rate || 0),
        channels: audioStream.channels,
        bitrate: parseInt(audioStream.bit_rate || 0),
      } : null,
    };

    return { success: true, data: analysis, message: `Analyzed: ${analysis.video?.width}x${analysis.video?.height} ${analysis.video?.codec} ${analysis.duration.toFixed(1)}s` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 15. FILTER ──────────────────────────────────────────────────────────────

export async function filterVideo(inputPath, options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    ensureInput(inputPath);
    const { filter = 'eq=brightness=0.1', complex = false } = options;

    const outputPath = tmpPath('.mp4');
    const args = ['-y', '-i', inputPath];

    if (complex) {
      args.push('-filter_complex', filter);
    } else {
      args.push('-vf', filter);
    }
    args.push('-c:a', 'copy', outputPath);

    ffmpeg(args);
    return { success: true, outputPath, message: `Applied filter: ${filter.slice(0, 60)}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 16. AI VIDEO (transcription + scene extraction) ─────────────────────────

export async function aiVideo(inputPath, options = {}) {
  try {
    if (!hasFfmpeg()) return { success: false, error: 'FFmpeg not installed' };
    ensureInput(inputPath);
    const { action = 'transcribe', language = 'en' } = options;

    switch (action) {
      case 'transcribe': {
        // Extract audio for transcription
        const audioOut = tmpPath('.wav');
        ffmpeg(['-y', '-i', inputPath, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', audioOut]);
        return {
          success: true,
          audioPath: audioOut,
          message: 'Extracted audio (16kHz mono WAV) for transcription. Send to Whisper API or speech-to-text service.',
          instruction: 'Use the extracted audio file with a speech-to-text API (e.g., OpenAI Whisper) to get the transcript.',
        };
      }

      case 'scenes': {
        // Scene detection via keyframe extraction
        const dir = path.join(process.cwd(), 'uploads', 'video-tmp', 'scenes-' + crypto.randomBytes(6).toString('hex'));
        fs.mkdirSync(dir, { recursive: true });
        ffmpeg(['-y', '-i', inputPath, '-vf', 'select=gt(scene\\,0.3),showinfo', '-vsync', 'vfr', '-frames:v', '20', path.join(dir, 'scene_%03d.jpg')]);
        const scenes = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).map(f => path.join(dir, f));
        return { success: true, scenes, directory: dir, message: `Detected ${scenes.length} scene changes` };
      }

      case 'thumbnail': {
        const outputPath = tmpPath('.jpg');
        // Get a representative frame (10% into video)
        const info = JSON.parse(ffprobe(['-v', 'quiet', '-print_format', 'json', '-show_format', inputPath]));
        const dur = parseFloat(info.format?.duration || 10);
        const seek = Math.min(dur * 0.1, 5);
        ffmpeg(['-y', '-ss', String(seek), '-i', inputPath, '-frames:v', '1', '-q:v', '2', outputPath]);
        return { success: true, outputPath, message: 'Generated thumbnail' };
      }

      default:
        return { success: false, error: `Unknown AI action: ${action}. Supported: transcribe, scenes, thumbnail` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── CAPABILITIES ────────────────────────────────────────────────────────────

export function getCapabilities() {
  const ffmpegAvailable = hasFfmpeg();
  const ffprobeAvailable = hasFfprobe();
  return {
    supported: ffmpegAvailable,
    message: ffmpegAvailable ? 'Video engine ready (FFmpeg available)' : 'FFmpeg not installed — install with: apt install ffmpeg',
    ffmpeg: ffmpegAvailable,
    ffprobe: ffprobeAvailable,
    formats: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'gif', 'mp3', 'wav'],
    maxDuration: 3600,
    operations: ['trim', 'highlights', 'resize', 'subtitle', 'style', 'overlay', 'audio', 'faces', 'moderate', 'batch', 'export', 'transform', 'convert', 'analyze', 'filter', 'ai'],
  };
}
