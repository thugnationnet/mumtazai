/**
 * VIDEO PROCESSING SERVICE
 *
 * 8 consolidated tools covering the full video processing pipeline:
 *
 *  1. video_transform  — trim, split, concat, speed, resize, crop_platform
 *  2. video_convert    — format, compress, gif, thumbnail, responsive
 *  3. video_analyze    — metadata, scenes, silence, validate
 *  4. video_overlay    — text, subtitle_burn, watermark, lower_third, hook
 *  5. video_filter     — color_correct, cinematic, brightness, contrast, blur_bg, speed_ramp
 *  6. video_audio      — extract, replace, volume, normalize, fade, remove_noise, mute
 *  7. video_ai         — describe, transcribe, highlights, smart_crop, caption, moderate
 *  8. video_batch      — process, pipeline
 *
 * Storage: Process → S3 → URL (no base64, no DB blobs)
 *
 * Dependencies:
 *   - fluent-ffmpeg (required) — core processing engine
 *   - @ffprobe-installer/ffprobe — metadata probing
 *   - OpenAI Whisper — transcription (for captions/subtitles)
 *   - GPT-4o vision — scene analysis, content moderation
 *   - AgentFile model — S3 file records
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import AgentFile from '../models/AgentFile.js';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import OpenAI from 'openai';
import {
  isAzureVisionAvailable,
  azureModerate,
} from './azure-vision-service.js';

// ═══════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════════

const S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || 'amzn-us-east-1-bucket';
const S3_REGION = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// FFmpeg lazy loader
let _ffmpeg = null;
async function getFFmpeg() {
  if (_ffmpeg) return _ffmpeg;
  try {
    const fluentFFmpeg = await import('fluent-ffmpeg');
    _ffmpeg = fluentFFmpeg.default || fluentFFmpeg;
    try {
      const ffprobeInstaller = await import('@ffprobe-installer/ffprobe');
      _ffmpeg.setFfprobePath(ffprobeInstaller.path);
    } catch {
      // Use system ffprobe
    }
    return _ffmpeg;
  } catch (error) {
    throw new Error('FFmpeg not available. Install: npm i fluent-ffmpeg');
  }
}

/** Upload buffer to S3, return URL */
async function uploadToS3(key, content, mimeType) {
  const buffer =
    typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  const url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
  console.log(`[VideoService][S3] Uploaded: ${key} (${buffer.length} bytes)`);
  return url;
}

/** Download file content from S3 */
async function downloadFromS3(key) {
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
  );
  const chunks = [];
  for await (const chunk of response.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/** Resolve video input → local temp file path. Handles AgentFile, URL, local path. */
async function resolveVideoInput(source, userId = 'default') {
  // Already a local file
  if (source.startsWith('/') && fs.existsSync(source))
    return { path: source, isTemp: false };

  // URL — download to temp
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`Failed to fetch video: ${resp.status}`);
    const buffer = Buffer.from(await resp.arrayBuffer());
    const ext = path.extname(new URL(source).pathname) || '.mp4';
    const tempPath = path.join(os.tmpdir(), `vid_${Date.now()}${ext}`);
    fs.writeFileSync(tempPath, buffer);
    return { path: tempPath, isTemp: true };
  }

  // AgentFile lookup
  const file = await AgentFile.findOne({
    userId,
    $or: [{ path: source }, { filename: source }],
    isDeleted: false,
  });

  if (!file) throw new Error(`Video not found: ${source}`);

  if (file.storageType === 's3' && file.s3Key) {
    const buffer = await downloadFromS3(file.s3Key);
    const ext = path.extname(file.filename) || '.mp4';
    const tempPath = path.join(os.tmpdir(), `vid_${Date.now()}${ext}`);
    fs.writeFileSync(tempPath, buffer);
    return { path: tempPath, isTemp: true };
  }

  if (file.content) {
    const buffer = Buffer.from(file.content, 'base64');
    const ext = path.extname(file.filename) || '.mp4';
    const tempPath = path.join(os.tmpdir(), `vid_${Date.now()}${ext}`);
    fs.writeFileSync(tempPath, buffer);
    return { path: tempPath, isTemp: true };
  }

  throw new Error(`Video has no content: ${source}`);
}

/** Save video result → S3 + AgentFile record */
async function saveVideoResult(
  buffer,
  filename,
  mimeType,
  userId,
  metadata = {}
) {
  const s3Key = `agent-files/${userId}/videos/${filename}`;
  const url = await uploadToS3(s3Key, buffer, mimeType);

  const newFile = new AgentFile({
    userId,
    agentId: 'video-tool',
    filename,
    folder: '/videos',
    path: `/videos/${filename}`,
    mimeType,
    size: buffer.length,
    storageType: 's3',
    s3Key,
    s3Url: url,
  });
  await newFile.save();

  return {
    success: true,
    filename,
    path: `/videos/${filename}`,
    size: buffer.length,
    url,
    s3Url: url,
    downloadUrl: `/api/agents/files/download?path=${encodeURIComponent(`/videos/${filename}`)}&userId=${userId}`,
    ...metadata,
  };
}

/** Clean up temp files */
function cleanup(...paths) {
  for (const p of paths) {
    if (p && p.includes(os.tmpdir())) {
      try {
        fs.unlinkSync(p);
      } catch {}
    }
  }
}

/** Parse timestamp string (HH:MM:SS or MM:SS or seconds) → number */
function parseTimestamp(ts) {
  if (typeof ts === 'number') return ts;
  const parts = String(ts).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseFloat(ts) || 0;
}

/** Format seconds → HH:MM:SS */
function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0)
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Get metadata via ffprobe */
async function probeVideo(filePath) {
  const ff = await getFFmpeg();
  return new Promise((resolve, reject) => {
    ff.ffprobe(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

/** Run ffmpeg command → output file, return buffer */
function runFFmpeg(command, outputPath) {
  return new Promise((resolve, reject) => {
    command
      .output(outputPath)
      .on('end', () => {
        const buffer = fs.readFileSync(outputPath);
        resolve(buffer);
      })
      .on('error', (err) => reject(err))
      .run();
  });
}

/** Platform preset dimensions */
const PLATFORM_PRESETS = {
  'youtube-short': { width: 1080, height: 1920 },
  tiktok: { width: 1080, height: 1920 },
  'instagram-reel': { width: 1080, height: 1920 },
  'instagram-square': { width: 1080, height: 1080 },
  'instagram-landscape': { width: 1080, height: 566 },
  twitter: { width: 1280, height: 720 },
  linkedin: { width: 1920, height: 1080 },
  facebook: { width: 1280, height: 720 },
};

// ═══════════════════════════════════════════════════════════════════
// TOOL 1: video_transform
// ═══════════════════════════════════════════════════════════════════

/**
 * Geometry & temporal transformations.
 *
 * Actions:
 *   trim           — Cut between start/end timestamps
 *   split          — Split into segments at given timestamps
 *   concat         — Join multiple video files
 *   speed          — Change playback speed (0.25x–4x)
 *   resize         — Scale to specific dimensions
 *   crop_platform  — Smart crop/resize for platform (tiktok, youtube-short, etc.)
 */
export async function videoTransform(params, userId = 'default') {
  const { file, action = 'trim', options = {} } = params;
  const ff = await getFFmpeg();
  const ts = Date.now();

  try {
    switch (action) {
      // ── TRIM ──────────────────────────────────────────────────
      case 'trim': {
        const { start = 0, end } = options;
        if (!end)
          return {
            success: false,
            error: 'end timestamp is required for trim',
          };

        const input = await resolveVideoInput(file, userId);
        const outputFile = `trimmed-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const startSec = parseTimestamp(start);
        const endSec = parseTimestamp(end);
        const duration = endSec - startSec;

        const command = ff(input.path)
          .setStartTime(startSec)
          .setDuration(duration)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(command, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'trim',
          from: start,
          to: end,
          duration: formatDuration(duration),
          message: `Video trimmed from ${start} to ${end} (${formatDuration(duration)})`,
        });
      }

      // ── SPLIT ─────────────────────────────────────────────────
      case 'split': {
        const { timestamps } = options;
        if (
          !timestamps ||
          !Array.isArray(timestamps) ||
          timestamps.length === 0
        ) {
          return {
            success: false,
            error: 'timestamps array required for split',
          };
        }

        const input = await resolveVideoInput(file, userId);
        const meta = await probeVideo(input.path);
        const totalDuration = parseFloat(meta.format.duration);

        const points = [
          0,
          ...timestamps.map(parseTimestamp),
          totalDuration,
        ].sort((a, b) => a - b);
        const segments = [];

        for (let i = 0; i < points.length - 1; i++) {
          const segStart = points[i];
          const segDuration = points[i + 1] - segStart;
          const segFile = `split-${ts}-part${i + 1}.mp4`;
          const segPath = path.join(os.tmpdir(), segFile);

          const cmd = ff(input.path)
            .setStartTime(segStart)
            .setDuration(segDuration)
            .videoCodec('libx264')
            .audioCodec('aac');

          const buf = await runFFmpeg(cmd, segPath);
          const result = await saveVideoResult(
            buf,
            segFile,
            'video/mp4',
            userId,
            {}
          );
          segments.push({
            part: i + 1,
            start: formatDuration(segStart),
            end: formatDuration(points[i + 1]),
            url: result.url,
            filename: result.filename,
          });
          cleanup(segPath);
        }

        cleanup(input.isTemp ? input.path : null);
        return {
          success: true,
          action: 'split',
          segments,
          count: segments.length,
          message: `Video split into ${segments.length} segments`,
        };
      }

      // ── CONCAT ────────────────────────────────────────────────
      case 'concat': {
        const { files } = options;
        if (!files || !Array.isArray(files) || files.length < 2) {
          return {
            success: false,
            error: 'At least 2 files required for concat',
          };
        }

        const inputs = [];
        for (const f of files) {
          inputs.push(await resolveVideoInput(f, userId));
        }

        // Create concat list file
        const listFile = path.join(os.tmpdir(), `concat-${ts}.txt`);
        const listContent = inputs.map((i) => `file '${i.path}'`).join('\n');
        fs.writeFileSync(listFile, listContent);

        const outputFile = `concat-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const cmd = ff(listFile)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(
          listFile,
          outputPath,
          ...inputs.filter((i) => i.isTemp).map((i) => i.path)
        );

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'concat',
          inputCount: files.length,
          message: `${files.length} videos concatenated`,
        });
      }

      // ── SPEED ─────────────────────────────────────────────────
      case 'speed': {
        const { factor = 1.5 } = options;
        const clampedFactor = Math.max(0.25, Math.min(4, factor));

        const input = await resolveVideoInput(file, userId);
        const outputFile = `speed-${clampedFactor}x-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        // Video: setpts filter, Audio: atempo filter
        const vFilter = `setpts=${(1 / clampedFactor).toFixed(4)}*PTS`;
        let aFilter;
        // atempo only supports 0.5–2.0, chain for extremes
        if (clampedFactor <= 2) {
          aFilter = `atempo=${clampedFactor}`;
        } else {
          aFilter = `atempo=2.0,atempo=${(clampedFactor / 2).toFixed(4)}`;
        }

        const cmd = ff(input.path)
          .videoFilter(vFilter)
          .audioFilter(aFilter)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'speed',
          factor: clampedFactor,
          message: `Video speed changed to ${clampedFactor}x`,
        });
      }

      // ── RESIZE ────────────────────────────────────────────────
      case 'resize': {
        const { width, height } = options;
        if (!width && !height)
          return { success: false, error: 'width or height required' };

        const input = await resolveVideoInput(file, userId);
        const outputFile = `resized-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        // Use scale filter with -2 to maintain even dimensions
        const w = width || -2;
        const h = height || -2;

        const cmd = ff(input.path)
          .videoFilter(`scale=${w}:${h}`)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'resize',
          width: width || 'auto',
          height: height || 'auto',
          message: `Video resized to ${width || 'auto'}x${height || 'auto'}`,
        });
      }

      // ── CROP_PLATFORM ─────────────────────────────────────────
      case 'crop_platform': {
        const { platform = 'tiktok' } = options;
        const preset = PLATFORM_PRESETS[platform];
        if (!preset) {
          return {
            success: false,
            error: `Unknown platform. Supported: ${Object.keys(PLATFORM_PRESETS).join(', ')}`,
          };
        }

        const input = await resolveVideoInput(file, userId);
        const outputFile = `${platform}-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        // Crop center + scale to exact platform dimensions
        const cmd = ff(input.path)
          .videoFilter([
            `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=increase`,
            `crop=${preset.width}:${preset.height}`,
          ])
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'crop_platform',
          platform,
          dimensions: `${preset.width}x${preset.height}`,
          message: `Video cropped for ${platform} (${preset.width}x${preset.height})`,
        });
      }

      default:
        return {
          success: false,
          error: `Unknown transform action: ${action}. Supported: trim, split, concat, speed, resize, crop_platform`,
        };
    }
  } catch (error) {
    console.error(`[VideoService] Transform/${action} error:`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 2: video_convert
// ═══════════════════════════════════════════════════════════════════

/**
 * Format conversion, compression, GIF, thumbnails.
 *
 * Actions:
 *   format     — Convert to mp4/webm/avi/mov/mkv
 *   compress   — Reduce file size with CRF/bitrate target
 *   gif        — Convert video/clip to animated GIF
 *   thumbnail  — Extract single frame as image
 *   responsive — Generate multiple resolution variants
 */
export async function videoConvert(params, userId = 'default') {
  const { file, action = 'format', options = {} } = params;
  const ff = await getFFmpeg();
  const ts = Date.now();

  try {
    switch (action) {
      // ── FORMAT ────────────────────────────────────────────────
      case 'format': {
        const { format = 'mp4' } = options;
        const validFormats = ['mp4', 'webm', 'avi', 'mov', 'mkv'];
        const targetFormat = format.toLowerCase().replace('.', '');
        if (!validFormats.includes(targetFormat)) {
          return {
            success: false,
            error: `Supported formats: ${validFormats.join(', ')}`,
          };
        }

        const input = await resolveVideoInput(file, userId);
        const outputFile = `converted-${ts}.${targetFormat}`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        let cmd = ff(input.path);
        if (targetFormat === 'webm')
          cmd = cmd.videoCodec('libvpx-vp9').audioCodec('libopus');
        else if (targetFormat === 'mp4')
          cmd = cmd.videoCodec('libx264').audioCodec('aac');
        else cmd = cmd.videoCodec('copy').audioCodec('copy');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        const mimeType = `video/${targetFormat === 'mkv' ? 'x-matroska' : targetFormat}`;
        return saveVideoResult(buffer, outputFile, mimeType, userId, {
          action: 'format',
          format: targetFormat.toUpperCase(),
          message: `Video converted to ${targetFormat.toUpperCase()}`,
        });
      }

      // ── COMPRESS ──────────────────────────────────────────────
      case 'compress': {
        const { quality = 'medium', max_size_mb, crf } = options;
        const input = await resolveVideoInput(file, userId);
        const outputFile = `compressed-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        // CRF: 18=high, 23=medium, 28=low, 35=very low
        const crfMap = { high: 18, medium: 23, low: 28, tiny: 35 };
        const crfValue = crf || crfMap[quality] || 23;

        let cmd = ff(input.path)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([`-crf ${crfValue}`, '-preset medium']);

        if (max_size_mb) {
          const meta = await probeVideo(input.path);
          const duration = parseFloat(meta.format.duration);
          const targetBitrate = Math.floor((max_size_mb * 8192) / duration); // kbps
          cmd = cmd.videoBitrate(`${targetBitrate}k`);
        }

        const buffer = await runFFmpeg(cmd, outputPath);
        const origSize = fs.statSync(input.path).size;
        cleanup(input.isTemp ? input.path : null, outputPath);

        const ratio = ((1 - buffer.length / origSize) * 100).toFixed(1);
        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'compress',
          originalSize: origSize,
          compressedSize: buffer.length,
          reduction: `${ratio}%`,
          crf: crfValue,
          message: `Video compressed (${ratio}% smaller, CRF ${crfValue})`,
        });
      }

      // ── GIF ───────────────────────────────────────────────────
      case 'gif': {
        const { start = 0, duration = 5, width = 480, fps = 10 } = options;

        const input = await resolveVideoInput(file, userId);
        const outputFile = `gif-${ts}.gif`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const cmd = ff(input.path)
          .setStartTime(parseTimestamp(start))
          .setDuration(duration)
          .noAudio()
          .videoFilter(`fps=${fps},scale=${width}:-1:flags=lanczos`)
          .outputOptions(['-gifflags', '+transdiff']);

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'image/gif', userId, {
          action: 'gif',
          duration,
          fps,
          width,
          message: `GIF created (${duration}s at ${fps}fps, ${width}px wide)`,
        });
      }

      // ── THUMBNAIL ─────────────────────────────────────────────
      case 'thumbnail': {
        const { timestamp = '00:00:01', width = 640, format = 'png' } = options;

        const input = await resolveVideoInput(file, userId);
        const ext = format === 'jpg' || format === 'jpeg' ? 'jpg' : 'png';
        const outputFile = `thumb-${ts}.${ext}`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const cmd = ff(input.path)
          .seekInput(parseTimestamp(timestamp))
          .frames(1)
          .size(`${width}x?`);

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        const mimeType = ext === 'jpg' ? 'image/jpeg' : 'image/png';
        // Save as image, not video
        const s3Key = `agent-files/${userId}/images/${outputFile}`;
        const url = await uploadToS3(s3Key, buffer, mimeType);

        const newFile = new AgentFile({
          userId,
          agentId: 'video-tool',
          filename: outputFile,
          folder: '/images',
          path: `/images/${outputFile}`,
          mimeType,
          size: buffer.length,
          storageType: 's3',
          s3Key,
          s3Url: url,
        });
        await newFile.save();

        return {
          success: true,
          filename: outputFile,
          url,
          s3Url: url,
          size: buffer.length,
          action: 'thumbnail',
          timestamp,
          message: `Thumbnail extracted at ${timestamp}`,
        };
      }

      // ── RESPONSIVE ────────────────────────────────────────────
      case 'responsive': {
        const {
          sizes = [
            { height: 360, label: '360p' },
            { height: 480, label: '480p' },
            { height: 720, label: '720p' },
            { height: 1080, label: '1080p' },
          ],
          format = 'mp4',
        } = options;

        const input = await resolveVideoInput(file, userId);
        const variants = [];

        for (const size of sizes) {
          const varFile = `${size.label}-${ts}.${format}`;
          const varPath = path.join(os.tmpdir(), varFile);

          const cmd = ff(input.path)
            .videoFilter(`scale=-2:${size.height}`)
            .videoCodec('libx264')
            .audioCodec('aac');

          try {
            const buf = await runFFmpeg(cmd, varPath);
            const result = await saveVideoResult(
              buf,
              varFile,
              `video/${format}`,
              userId,
              {}
            );
            variants.push({
              label: size.label,
              height: size.height,
              url: result.url,
              filename: result.filename,
              size: buf.length,
            });
            cleanup(varPath);
          } catch (err) {
            // Skip variants that fail (e.g., upscaling beyond source)
            console.warn(
              `[VideoService] Responsive ${size.label} skipped:`,
              err.message
            );
          }
        }

        cleanup(input.isTemp ? input.path : null);
        return {
          success: true,
          action: 'responsive',
          variants,
          count: variants.length,
          message: `${variants.length} responsive variants generated`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown convert action: ${action}. Supported: format, compress, gif, thumbnail, responsive`,
        };
    }
  } catch (error) {
    console.error(`[VideoService] Convert/${action} error:`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 3: video_analyze
// ═══════════════════════════════════════════════════════════════════

/**
 * Video analysis and validation.
 *
 * Actions:
 *   metadata  — Full technical metadata (codecs, resolution, fps, bitrate, audio)
 *   scenes    — Detect scene changes (returns timestamps)
 *   silence   — Detect silent segments
 *   validate  — Check against constraints (max duration, resolution, file size, format)
 */
export async function videoAnalyze(params, userId = 'default') {
  const { file, action = 'metadata', options = {} } = params;
  const ff = await getFFmpeg();

  try {
    const input = await resolveVideoInput(file, userId);

    switch (action) {
      // ── METADATA ──────────────────────────────────────────────
      case 'metadata': {
        const meta = await probeVideo(input.path);
        cleanup(input.isTemp ? input.path : null);

        const videoStream = meta.streams?.find((s) => s.codec_type === 'video');
        const audioStream = meta.streams?.find((s) => s.codec_type === 'audio');

        return {
          success: true,
          action: 'metadata',
          format: meta.format?.format_name,
          duration: parseFloat(meta.format?.duration || 0),
          durationFormatted: formatDuration(
            parseFloat(meta.format?.duration || 0)
          ),
          size: parseInt(meta.format?.size || 0),
          bitrate: parseInt(meta.format?.bit_rate || 0),
          video: videoStream
            ? {
                codec: videoStream.codec_name,
                profile: videoStream.profile,
                width: videoStream.width,
                height: videoStream.height,
                fps: eval(videoStream.r_frame_rate || '0'),
                aspectRatio: videoStream.display_aspect_ratio,
                bitrate: parseInt(videoStream.bit_rate || 0),
                pixelFormat: videoStream.pix_fmt,
              }
            : null,
          audio: audioStream
            ? {
                codec: audioStream.codec_name,
                channels: audioStream.channels,
                channelLayout: audioStream.channel_layout,
                sampleRate: parseInt(audioStream.sample_rate || 0),
                bitrate: parseInt(audioStream.bit_rate || 0),
              }
            : null,
          streamCount: meta.streams?.length || 0,
          message: `Video: ${videoStream?.width}x${videoStream?.height} ${videoStream?.codec_name} ${formatDuration(parseFloat(meta.format?.duration || 0))}`,
        };
      }

      // ── SCENES ────────────────────────────────────────────────
      case 'scenes': {
        const { threshold = 0.3 } = options;
        const outputFile = path.join(os.tmpdir(), `scenes-${Date.now()}.txt`);

        // Use ffmpeg select filter to detect scene changes
        await new Promise((resolve, reject) => {
          ff(input.path)
            .videoFilter(`select='gt(scene,${threshold})',showinfo`)
            .outputOptions(['-f', 'null'])
            .output('/dev/null')
            .on('stderr', (line) => {
              // Parse scene change timestamps from showinfo output
              fs.appendFileSync(outputFile, line + '\n');
            })
            .on('end', resolve)
            .on('error', reject)
            .run();
        });

        // Parse timestamps from showinfo output
        const scenes = [];
        if (fs.existsSync(outputFile)) {
          const output = fs.readFileSync(outputFile, 'utf-8');
          const ptsRegex = /pts_time:([0-9.]+)/g;
          let m;
          while ((m = ptsRegex.exec(output)) !== null) {
            scenes.push({
              timestamp: parseFloat(m[1]),
              formatted: formatDuration(parseFloat(m[1])),
            });
          }
          cleanup(outputFile);
        }

        cleanup(input.isTemp ? input.path : null);
        return {
          success: true,
          action: 'scenes',
          scenes,
          count: scenes.length,
          threshold,
          message: `Detected ${scenes.length} scene changes`,
        };
      }

      // ── SILENCE ───────────────────────────────────────────────
      case 'silence': {
        const { noise_db = -30, min_duration = 1 } = options;

        const silentSegments = [];
        await new Promise((resolve, reject) => {
          ff(input.path)
            .audioFilter(`silencedetect=noise=${noise_db}dB:d=${min_duration}`)
            .outputOptions(['-f', 'null'])
            .output('/dev/null')
            .on('stderr', (line) => {
              const startMatch = line.match(/silence_start: ([0-9.]+)/);
              const endMatch = line.match(/silence_end: ([0-9.]+)/);
              if (startMatch)
                silentSegments.push({ start: parseFloat(startMatch[1]) });
              if (endMatch && silentSegments.length > 0) {
                const last = silentSegments[silentSegments.length - 1];
                if (!last.end) {
                  last.end = parseFloat(endMatch[1]);
                  last.duration = last.end - last.start;
                  last.startFormatted = formatDuration(last.start);
                  last.endFormatted = formatDuration(last.end);
                }
              }
            })
            .on('end', resolve)
            .on('error', reject)
            .run();
        });

        cleanup(input.isTemp ? input.path : null);
        return {
          success: true,
          action: 'silence',
          segments: silentSegments,
          count: silentSegments.length,
          settings: { noise_db, min_duration },
          message: `Found ${silentSegments.length} silent segments`,
        };
      }

      // ── VALIDATE ──────────────────────────────────────────────
      case 'validate': {
        const {
          max_duration,
          max_size_mb,
          max_width,
          max_height,
          min_fps,
          allowed_formats,
          required_audio,
        } = options;

        const meta = await probeVideo(input.path);
        cleanup(input.isTemp ? input.path : null);

        const videoStream = meta.streams?.find((s) => s.codec_type === 'video');
        const audioStream = meta.streams?.find((s) => s.codec_type === 'audio');
        const duration = parseFloat(meta.format?.duration || 0);
        const sizeMB = parseInt(meta.format?.size || 0) / (1024 * 1024);
        const fps = videoStream ? eval(videoStream.r_frame_rate || '0') : 0;

        const errors = [];
        if (max_duration && duration > max_duration)
          errors.push(
            `Duration ${formatDuration(duration)} exceeds max ${formatDuration(max_duration)}`
          );
        if (max_size_mb && sizeMB > max_size_mb)
          errors.push(
            `Size ${sizeMB.toFixed(1)}MB exceeds max ${max_size_mb}MB`
          );
        if (max_width && videoStream?.width > max_width)
          errors.push(`Width ${videoStream.width} exceeds max ${max_width}`);
        if (max_height && videoStream?.height > max_height)
          errors.push(`Height ${videoStream.height} exceeds max ${max_height}`);
        if (min_fps && fps < min_fps)
          errors.push(`FPS ${fps} below minimum ${min_fps}`);
        if (
          allowed_formats &&
          !allowed_formats.includes(meta.format?.format_name)
        )
          errors.push(
            `Format ${meta.format.format_name} not in allowed: ${allowed_formats.join(', ')}`
          );
        if (required_audio && !audioStream)
          errors.push('No audio stream found');

        return {
          success: true,
          action: 'validate',
          valid: errors.length === 0,
          errors,
          details: {
            duration,
            sizeMB: parseFloat(sizeMB.toFixed(2)),
            width: videoStream?.width,
            height: videoStream?.height,
            fps,
            format: meta.format?.format_name,
            hasAudio: !!audioStream,
          },
          message:
            errors.length === 0
              ? 'Video passes all validation checks'
              : `Validation failed: ${errors.join('; ')}`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown analyze action: ${action}. Supported: metadata, scenes, silence, validate`,
        };
    }
  } catch (error) {
    console.error(`[VideoService] Analyze/${action} error:`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 4: video_overlay
// ═══════════════════════════════════════════════════════════════════

/**
 * Text overlays, subtitles, watermarks on video.
 *
 * Actions:
 *   text           — Add text overlay (with position, font size, color, timing)
 *   subtitle_burn  — Burn SRT/VTT subtitles into video
 *   watermark      — Add image watermark (with position, opacity)
 *   lower_third    — Add lower-third title bar
 *   hook           — Add hook text in first N seconds
 */
export async function videoOverlay(params, userId = 'default') {
  const { file, action = 'text', options = {} } = params;
  const ff = await getFFmpeg();
  const ts = Date.now();

  try {
    const input = await resolveVideoInput(file, userId);

    switch (action) {
      // ── TEXT ───────────────────────────────────────────────────
      case 'text': {
        const {
          text = 'Hello',
          x = '(w-text_w)/2',
          y = '(h-text_h)/2',
          font_size = 48,
          font_color = 'white',
          bg_color = 'black@0.5',
          start_time,
          end_time,
        } = options;

        const outputFile = `text-overlay-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        let drawtext = `drawtext=text='${text.replace(/'/g, "\\'")}':fontsize=${font_size}:fontcolor=${font_color}:x=${x}:y=${y}:box=1:boxcolor=${bg_color}:boxborderw=8`;

        if (start_time !== undefined)
          drawtext += `:enable='between(t,${parseTimestamp(start_time)},${end_time ? parseTimestamp(end_time) : 9999})'`;

        const cmd = ff(input.path)
          .videoFilter(drawtext)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'text',
          text,
          message: `Text overlay added: "${text}"`,
        });
      }

      // ── SUBTITLE_BURN ─────────────────────────────────────────
      case 'subtitle_burn': {
        const { subtitle_file, style = '' } = options;
        if (!subtitle_file)
          return { success: false, error: 'subtitle_file is required' };

        // Resolve subtitle file
        const subInput = await resolveVideoInput(subtitle_file, userId);
        const outputFile = `subtitled-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const subtitleFilter = style
          ? `subtitles=${subInput.path}:force_style='${style}'`
          : `subtitles=${subInput.path}`;

        const cmd = ff(input.path)
          .videoFilter(subtitleFilter)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(
          input.isTemp ? input.path : null,
          subInput.isTemp ? subInput.path : null,
          outputPath
        );

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'subtitle_burn',
          message: 'Subtitles burned into video',
        });
      }

      // ── WATERMARK ─────────────────────────────────────────────
      case 'watermark': {
        const {
          image,
          position = 'bottom-right',
          opacity = 0.5,
          scale = 0.15,
        } = options;

        if (!image)
          return { success: false, error: 'watermark image path/URL required' };

        const wmInput = await resolveVideoInput(image, userId);
        const outputFile = `watermarked-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        // Position mapping
        const posMap = {
          'top-left': '10:10',
          'top-right': 'W-w-10:10',
          'bottom-left': '10:H-h-10',
          'bottom-right': 'W-w-10:H-h-10',
          center: '(W-w)/2:(H-h)/2',
        };
        const pos = posMap[position] || posMap['bottom-right'];

        const cmd = ff(input.path)
          .input(wmInput.path)
          .complexFilter([
            `[1:v]scale=iw*${scale}:-1,format=rgba,colorchannelmixer=aa=${opacity}[wm]`,
            `[0:v][wm]overlay=${pos}[out]`,
          ])
          .outputOptions(['-map', '[out]', '-map', '0:a?'])
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(
          input.isTemp ? input.path : null,
          wmInput.isTemp ? wmInput.path : null,
          outputPath
        );

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'watermark',
          position,
          opacity,
          message: `Watermark added (${position}, ${Math.round(opacity * 100)}% opacity)`,
        });
      }

      // ── LOWER_THIRD ───────────────────────────────────────────
      case 'lower_third': {
        const {
          title = '',
          subtitle = '',
          bg_color = 'black@0.7',
          text_color = 'white',
          duration: showDuration = 5,
          start = 0,
        } = options;

        const outputFile = `lower-third-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);
        const startSec = parseTimestamp(start);
        const endSec = startSec + showDuration;

        const filters = [];
        // Title text
        filters.push(
          `drawtext=text='${title.replace(/'/g, "\\'")}':fontsize=36:fontcolor=${text_color}:x=40:y=h-120:box=1:boxcolor=${bg_color}:boxborderw=12:enable='between(t,${startSec},${endSec})'`
        );
        // Subtitle text
        if (subtitle) {
          filters.push(
            `drawtext=text='${subtitle.replace(/'/g, "\\'")}':fontsize=24:fontcolor=${text_color}@0.8:x=40:y=h-72:enable='between(t,${startSec},${endSec})'`
          );
        }

        const cmd = ff(input.path)
          .videoFilter(filters)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'lower_third',
          title,
          subtitle,
          message: `Lower third added: "${title}"`,
        });
      }

      // ── HOOK ──────────────────────────────────────────────────
      case 'hook': {
        const {
          text = '',
          duration: hookDuration = 3,
          font_size = 56,
          font_color = 'white',
          bg_color = 'black@0.6',
          position = 'center',
        } = options;

        const outputFile = `hook-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const posY =
          position === 'top'
            ? '60'
            : position === 'bottom'
              ? 'h-80'
              : '(h-text_h)/2';

        const drawtext = `drawtext=text='${text.replace(/'/g, "\\'")}':fontsize=${font_size}:fontcolor=${font_color}:x=(w-text_w)/2:y=${posY}:box=1:boxcolor=${bg_color}:boxborderw=10:enable='between(t,0,${hookDuration})'`;

        const cmd = ff(input.path)
          .videoFilter(drawtext)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'hook',
          text,
          duration: hookDuration,
          message: `Hook text added for first ${hookDuration}s: "${text}"`,
        });
      }

      default:
        return {
          success: false,
          error: `Unknown overlay action: ${action}. Supported: text, subtitle_burn, watermark, lower_third, hook`,
        };
    }
  } catch (error) {
    console.error(`[VideoService] Overlay/${action} error:`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 5: video_filter
// ═══════════════════════════════════════════════════════════════════

/**
 * Visual filters and color adjustments.
 *
 * Actions:
 *   color_correct — Adjust brightness, contrast, saturation, gamma
 *   cinematic     — Apply cinematic look (letterbox + color grade)
 *   brightness    — Adjust brightness (-1 to 1)
 *   contrast      — Adjust contrast (0 to 2)
 *   blur_bg       — Blur background with center focus
 *   speed_ramp    — Variable speed within video (slow-mo → normal)
 *   stabilize     — Video stabilization (2-pass)
 */
export async function videoFilter(params, userId = 'default') {
  const { file, action = 'color_correct', options = {} } = params;
  const ff = await getFFmpeg();
  const ts = Date.now();

  try {
    const input = await resolveVideoInput(file, userId);

    switch (action) {
      // ── COLOR_CORRECT ─────────────────────────────────────────
      case 'color_correct': {
        const {
          brightness = 0,
          contrast = 1,
          saturation = 1,
          gamma = 1,
        } = options;

        const outputFile = `color-corrected-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const cmd = ff(input.path)
          .videoFilter(
            `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}:gamma=${gamma}`
          )
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'color_correct',
          settings: { brightness, contrast, saturation, gamma },
          message: `Color correction applied`,
        });
      }

      // ── CINEMATIC ─────────────────────────────────────────────
      case 'cinematic': {
        const {
          letterbox = true,
          bar_height = 60,
          warmth = 0.1,
          saturation = 0.85,
          contrast = 1.1,
        } = options;

        const outputFile = `cinematic-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const filters = [
          `eq=contrast=${contrast}:saturation=${saturation}:gamma=0.95`,
          `colorbalance=rs=${warmth}:gs=0:bs=-${warmth * 0.5}`,
        ];

        if (letterbox) {
          filters.push(
            `drawbox=x=0:y=0:w=iw:h=${bar_height}:color=black:t=fill`
          );
          filters.push(
            `drawbox=x=0:y=ih-${bar_height}:w=iw:h=${bar_height}:color=black:t=fill`
          );
        }

        const cmd = ff(input.path)
          .videoFilter(filters)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'cinematic',
          letterbox,
          message: 'Cinematic look applied',
        });
      }

      // ── BRIGHTNESS ────────────────────────────────────────────
      case 'brightness': {
        const { value = 0.1 } = options;
        const outputFile = `brightness-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const cmd = ff(input.path)
          .videoFilter(`eq=brightness=${value}`)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'brightness',
          value,
          message: `Brightness adjusted to ${value}`,
        });
      }

      // ── CONTRAST ──────────────────────────────────────────────
      case 'contrast': {
        const { value = 1.2 } = options;
        const outputFile = `contrast-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const cmd = ff(input.path)
          .videoFilter(`eq=contrast=${value}`)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'contrast',
          value,
          message: `Contrast adjusted to ${value}`,
        });
      }

      // ── BLUR_BG ───────────────────────────────────────────────
      case 'blur_bg': {
        const {
          blur_strength = 20,
          focus_width = 0.5,
          focus_height = 0.7,
        } = options;
        const outputFile = `blur-bg-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        // Create blurred bg, then overlay sharp center crop
        const fw = Math.round(focus_width * 100);
        const fh = Math.round(focus_height * 100);
        const cmd = ff(input.path)
          .complexFilter([
            `[0:v]boxblur=${blur_strength}[bg]`,
            `[0:v]crop=iw*${focus_width}:ih*${focus_height}[fg]`,
            `[bg][fg]overlay=(W-w)/2:(H-h)/2[out]`,
          ])
          .outputOptions(['-map', '[out]', '-map', '0:a?'])
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'blur_bg',
          blur_strength,
          message: 'Background blur applied',
        });
      }

      // ── SPEED_RAMP ────────────────────────────────────────────
      case 'speed_ramp': {
        const {
          segments = [
            { start: 0, end: 2, speed: 0.5 },
            { start: 2, end: -1, speed: 1.0 },
          ],
        } = options;

        const outputFile = `speed-ramp-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);
        const meta = await probeVideo(input.path);
        const totalDuration = parseFloat(meta.format.duration);

        // Process segments sequentially, then concat
        const segFiles = [];
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          const start = parseTimestamp(seg.start);
          const end = seg.end === -1 ? totalDuration : parseTimestamp(seg.end);
          const speed = Math.max(0.25, Math.min(4, seg.speed));

          const segFile = path.join(os.tmpdir(), `ramp-seg-${ts}-${i}.mp4`);

          const vFilter = `setpts=${(1 / speed).toFixed(4)}*PTS`;
          const aFilter =
            speed <= 2
              ? `atempo=${speed}`
              : `atempo=2.0,atempo=${(speed / 2).toFixed(4)}`;

          await new Promise((resolve, reject) => {
            ff(input.path)
              .setStartTime(start)
              .setDuration(end - start)
              .videoFilter(vFilter)
              .audioFilter(aFilter)
              .videoCodec('libx264')
              .audioCodec('aac')
              .output(segFile)
              .on('end', resolve)
              .on('error', reject)
              .run();
          });
          segFiles.push(segFile);
        }

        // Concat segments
        const listFile = path.join(os.tmpdir(), `ramp-list-${ts}.txt`);
        fs.writeFileSync(
          listFile,
          segFiles.map((f) => `file '${f}'`).join('\n')
        );

        const concatCmd = ff(listFile)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(concatCmd, outputPath);
        cleanup(
          input.isTemp ? input.path : null,
          outputPath,
          listFile,
          ...segFiles
        );

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'speed_ramp',
          segments: segments.length,
          message: `Speed ramp applied (${segments.length} segments)`,
        });
      }

      // ── STABILIZE ─────────────────────────────────────────────
      case 'stabilize': {
        const { shakiness = 5, accuracy = 15 } = options;
        const outputFile = `stabilized-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);
        const transformFile = path.join(os.tmpdir(), `transform-${ts}.trf`);

        // Pass 1: Analyze
        await new Promise((resolve, reject) => {
          ff(input.path)
            .videoFilter(
              `vidstabdetect=shakiness=${shakiness}:accuracy=${accuracy}:result=${transformFile}`
            )
            .outputOptions(['-f', 'null'])
            .output('/dev/null')
            .on('end', resolve)
            .on('error', reject)
            .run();
        });

        // Pass 2: Transform
        const cmd = ff(input.path)
          .videoFilter(
            `vidstabtransform=input=${transformFile}:smoothing=10,unsharp=5:5:0.8:3:3:0.4`
          )
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath, transformFile);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'stabilize',
          message: 'Video stabilized',
        });
      }

      default:
        return {
          success: false,
          error: `Unknown filter action: ${action}. Supported: color_correct, cinematic, brightness, contrast, blur_bg, speed_ramp, stabilize`,
        };
    }
  } catch (error) {
    console.error(`[VideoService] Filter/${action} error:`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 6: video_audio
// ═══════════════════════════════════════════════════════════════════

/**
 * Audio track manipulation within video.
 *
 * Actions:
 *   extract      — Extract audio track to separate file (mp3/wav/aac)
 *   replace      — Replace audio track with new audio file
 *   volume       — Adjust audio volume
 *   normalize    — Normalize audio levels
 *   fade         — Add fade in/out to audio
 *   remove_noise — Reduce background noise
 *   mute         — Remove audio entirely
 */
export async function videoAudio(params, userId = 'default') {
  const { file, action = 'extract', options = {} } = params;
  const ff = await getFFmpeg();
  const ts = Date.now();

  try {
    const input = await resolveVideoInput(file, userId);

    switch (action) {
      // ── EXTRACT ───────────────────────────────────────────────
      case 'extract': {
        const { format = 'mp3' } = options;
        const validFormats = ['mp3', 'wav', 'aac', 'ogg', 'flac'];
        const targetFormat = format.toLowerCase();
        if (!validFormats.includes(targetFormat)) {
          return {
            success: false,
            error: `Supported audio formats: ${validFormats.join(', ')}`,
          };
        }

        const outputFile = `audio-extracted-${ts}.${targetFormat}`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const cmd = ff(input.path).noVideo();
        if (targetFormat === 'mp3')
          cmd.audioCodec('libmp3lame').audioBitrate('192k');
        else if (targetFormat === 'wav') cmd.audioCodec('pcm_s16le');
        else if (targetFormat === 'aac') cmd.audioCodec('aac');
        else if (targetFormat === 'ogg') cmd.audioCodec('libvorbis');
        else if (targetFormat === 'flac') cmd.audioCodec('flac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        const mimeType = `audio/${targetFormat === 'mp3' ? 'mpeg' : targetFormat}`;
        const s3Key = `agent-files/${userId}/audio/${outputFile}`;
        const url = await uploadToS3(s3Key, buffer, mimeType);

        const newFile = new AgentFile({
          userId,
          agentId: 'video-tool',
          filename: outputFile,
          folder: '/audio',
          path: `/audio/${outputFile}`,
          mimeType,
          size: buffer.length,
          storageType: 's3',
          s3Key,
          s3Url: url,
        });
        await newFile.save();

        return {
          success: true,
          filename: outputFile,
          url,
          s3Url: url,
          size: buffer.length,
          format: targetFormat,
          action: 'extract',
          message: `Audio extracted as ${targetFormat.toUpperCase()}`,
        };
      }

      // ── REPLACE ───────────────────────────────────────────────
      case 'replace': {
        const { audio_file } = options;
        if (!audio_file)
          return { success: false, error: 'audio_file path required' };

        const audioInput = await resolveVideoInput(audio_file, userId);
        const outputFile = `audio-replaced-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const cmd = ff(input.path)
          .input(audioInput.path)
          .outputOptions(['-map', '0:v', '-map', '1:a', '-shortest'])
          .videoCodec('copy')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(
          input.isTemp ? input.path : null,
          audioInput.isTemp ? audioInput.path : null,
          outputPath
        );

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'replace',
          message: 'Audio track replaced',
        });
      }

      // ── VOLUME ────────────────────────────────────────────────
      case 'volume': {
        const { level = 1.5 } = options;
        const outputFile = `volume-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        // level: 0.5 = half, 1.0 = same, 2.0 = double, or dB like "3dB"
        const volumeValue = typeof level === 'string' ? level : `${level}`;

        const cmd = ff(input.path)
          .audioFilter(`volume=${volumeValue}`)
          .videoCodec('copy')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'volume',
          level,
          message: `Audio volume adjusted to ${level}`,
        });
      }

      // ── NORMALIZE ─────────────────────────────────────────────
      case 'normalize': {
        const outputFile = `normalized-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const cmd = ff(input.path)
          .audioFilter('loudnorm=I=-16:TP=-1.5:LRA=11')
          .videoCodec('copy')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'normalize',
          target: '-16 LUFS',
          message: 'Audio normalized to broadcast standard (-16 LUFS)',
        });
      }

      // ── FADE ──────────────────────────────────────────────────
      case 'fade': {
        const { fade_in = 1, fade_out = 1 } = options;
        const outputFile = `audio-fade-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const meta = await probeVideo(input.path);
        const duration = parseFloat(meta.format.duration);

        const filters = [];
        if (fade_in > 0) filters.push(`afade=t=in:st=0:d=${fade_in}`);
        if (fade_out > 0)
          filters.push(`afade=t=out:st=${duration - fade_out}:d=${fade_out}`);

        const cmd = ff(input.path)
          .audioFilter(filters.join(','))
          .videoCodec('copy')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'fade',
          fade_in,
          fade_out,
          message: `Audio fade applied (in: ${fade_in}s, out: ${fade_out}s)`,
        });
      }

      // ── REMOVE_NOISE ──────────────────────────────────────────
      case 'remove_noise': {
        const { strength = 'medium' } = options;
        const outputFile = `denoised-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        // afftdn = FFT-based noise reduction
        const nrMap = { light: 12, medium: 20, heavy: 35 };
        const nrValue = nrMap[strength] || 20;

        const cmd = ff(input.path)
          .audioFilter(`afftdn=nf=-${nrValue}`)
          .videoCodec('copy')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'remove_noise',
          strength,
          message: `Audio noise reduced (${strength})`,
        });
      }

      // ── MUTE ──────────────────────────────────────────────────
      case 'mute': {
        const outputFile = `muted-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const cmd = ff(input.path).noAudio().videoCodec('copy');
        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'mute',
          message: 'Audio removed from video',
        });
      }

      default:
        return {
          success: false,
          error: `Unknown audio action: ${action}. Supported: extract, replace, volume, normalize, fade, remove_noise, mute`,
        };
    }
  } catch (error) {
    console.error(`[VideoService] Audio/${action} error:`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 7: video_ai
// ═══════════════════════════════════════════════════════════════════

/**
 * AI-powered video intelligence.
 *
 * Actions:
 *   describe    — AI description of video content (samples frames → GPT-4o vision)
 *   transcribe  — Speech-to-text via Whisper with timestamps
 *   highlights  — Auto-detect highlight moments (scene analysis)
 *   smart_crop  — AI-guided crop for subject tracking
 *   caption     — Generate SRT/VTT captions from speech
 *   moderate    — Content moderation scan (NSFW, violence, etc.)
 */
export async function videoAI(params, userId = 'default') {
  const { file, action = 'describe', options = {} } = params;
  const ff = await getFFmpeg();
  const ts = Date.now();

  try {
    switch (action) {
      // ── DESCRIBE ──────────────────────────────────────────────
      case 'describe': {
        const { detail = 'full', frame_count = 6 } = options;
        const input = await resolveVideoInput(file, userId);
        const meta = await probeVideo(input.path);
        const duration = parseFloat(meta.format.duration);

        // Sample frames evenly
        const frames = [];
        for (let i = 0; i < frame_count; i++) {
          const timestamp = (duration / (frame_count + 1)) * (i + 1);
          const framePath = path.join(os.tmpdir(), `desc-frame-${ts}-${i}.png`);

          await new Promise((resolve, reject) => {
            ff(input.path)
              .seekInput(timestamp)
              .frames(1)
              .output(framePath)
              .on('end', resolve)
              .on('error', reject)
              .run();
          });

          if (fs.existsSync(framePath)) {
            const frameBuffer = fs.readFileSync(framePath);
            frames.push({
              timestamp: formatDuration(timestamp),
              base64: frameBuffer.toString('base64'),
            });
            cleanup(framePath);
          }
        }

        cleanup(input.isTemp ? input.path : null);

        if (frames.length === 0)
          return { success: false, error: 'Could not extract frames' };

        // Send to GPT-4o vision
        if (!process.env.OPENAI_API_KEY)
          return {
            success: false,
            error: 'OpenAI API key required for video AI',
          };

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const content = [
          {
            type: 'text',
            text:
              detail === 'brief'
                ? `Briefly describe this video based on these ${frames.length} sampled frames. One sentence summary.`
                : `Analyze this video in detail based on these ${frames.length} sampled frames taken at regular intervals. Describe: the overall content/story, visual style, main subjects, actions happening, setting/location, mood/tone, and any text visible. Timestamps: ${frames.map((f) => f.timestamp).join(', ')}`,
          },
          ...frames.map((f) => ({
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${f.base64}`,
              detail: 'low',
            },
          })),
        ];

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content }],
          max_tokens: detail === 'brief' ? 200 : 1000,
        });

        return {
          success: true,
          action: 'describe',
          description: response.choices[0].message.content,
          framesAnalyzed: frames.length,
          duration: formatDuration(duration),
          model: 'gpt-4o',
          message: `Video described using ${frames.length} sampled frames`,
        };
      }

      // ── TRANSCRIBE ────────────────────────────────────────────
      case 'transcribe': {
        const { language = 'en' } = options;
        const input = await resolveVideoInput(file, userId);

        // Extract audio first
        const audioPath = path.join(os.tmpdir(), `transcribe-audio-${ts}.mp3`);
        await new Promise((resolve, reject) => {
          ff(input.path)
            .noVideo()
            .audioCodec('libmp3lame')
            .audioBitrate('128k')
            .output(audioPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
        });

        cleanup(input.isTemp ? input.path : null);

        if (!process.env.OPENAI_API_KEY) {
          cleanup(audioPath);
          return {
            success: false,
            error: 'OpenAI API key required for transcription',
          };
        }

        const audioBuffer = fs.readFileSync(audioPath);
        cleanup(audioPath);

        // Send to Whisper
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('file', audioBuffer, {
          filename: 'audio.mp3',
          contentType: 'audio/mpeg',
        });
        formData.append('model', 'whisper-1');
        if (language && language !== 'auto')
          formData.append('language', language);
        formData.append('response_format', 'verbose_json');
        formData.append('timestamp_granularities[]', 'segment');

        const response = await fetch(
          'https://api.openai.com/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              ...formData.getHeaders(),
            },
            body: formData,
          }
        );

        if (!response.ok) {
          return {
            success: false,
            error: `Whisper API error: ${response.status}`,
          };
        }

        const result = await response.json();

        // Save transcript
        const transcriptFile = `transcript-${ts}.txt`;
        const s3Key = `agent-files/${userId}/transcripts/${transcriptFile}`;
        await uploadToS3(s3Key, result.text, 'text/plain');

        const txFile = new AgentFile({
          userId,
          agentId: 'video-tool',
          filename: transcriptFile,
          folder: '/transcripts',
          path: `/transcripts/${transcriptFile}`,
          mimeType: 'text/plain',
          size: result.text.length,
          storageType: 's3',
          s3Key,
        });
        await txFile.save();

        return {
          success: true,
          action: 'transcribe',
          text: result.text,
          language: result.language || language,
          duration: result.duration,
          segments: result.segments?.map((s) => ({
            start: formatDuration(s.start),
            end: formatDuration(s.end),
            text: s.text,
          })),
          words: result.text.split(/\s+/).length,
          transcriptFile,
          message: `Transcribed ${Math.round(result.duration || 0)}s of speech (${result.text.split(/\s+/).length} words)`,
        };
      }

      // ── HIGHLIGHTS ────────────────────────────────────────────
      case 'highlights': {
        const {
          max_highlights = 5,
          min_duration = 3,
          max_duration = 15,
        } = options;
        const input = await resolveVideoInput(file, userId);
        const meta = await probeVideo(input.path);
        const duration = parseFloat(meta.format.duration);

        // Sample more frames for highlight detection
        const frameCount = Math.min(20, Math.ceil(duration / 2));
        const frames = [];

        for (let i = 0; i < frameCount; i++) {
          const timestamp = (duration / (frameCount + 1)) * (i + 1);
          const framePath = path.join(os.tmpdir(), `hl-frame-${ts}-${i}.png`);

          await new Promise((resolve, reject) => {
            ff(input.path)
              .seekInput(timestamp)
              .frames(1)
              .size('320x?')
              .output(framePath)
              .on('end', resolve)
              .on('error', reject)
              .run();
          });

          if (fs.existsSync(framePath)) {
            frames.push({
              index: i,
              timestamp,
              formatted: formatDuration(timestamp),
              base64: fs.readFileSync(framePath).toString('base64'),
            });
            cleanup(framePath);
          }
        }

        cleanup(input.isTemp ? input.path : null);

        if (!process.env.OPENAI_API_KEY)
          return { success: false, error: 'OpenAI API key required' };

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const content = [
          {
            type: 'text',
            text: `You are a video editor AI. Analyze these ${frames.length} frames from a ${formatDuration(duration)} video and identify the top ${max_highlights} most interesting/engaging moments. For each highlight, provide a JSON array: [{"start": seconds, "end": seconds, "reason": "why this is a highlight", "title": "short title"}]. Each highlight should be ${min_duration}-${max_duration} seconds. Frame timestamps: ${frames.map((f) => `${f.index}=${f.formatted}`).join(', ')}. Return ONLY the JSON array.`,
          },
          ...frames.map((f) => ({
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${f.base64}`,
              detail: 'low',
            },
          })),
        ];

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content }],
          max_tokens: 1000,
        });

        let highlights = [];
        try {
          const text = response.choices[0].message.content;
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) highlights = JSON.parse(jsonMatch[0]);
        } catch {
          highlights = [
            {
              error: 'Could not parse highlights',
              raw: response.choices[0].message.content,
            },
          ];
        }

        return {
          success: true,
          action: 'highlights',
          highlights,
          videoDuration: formatDuration(duration),
          framesAnalyzed: frames.length,
          message: `Identified ${highlights.length} highlight moments`,
        };
      }

      // ── CAPTION ───────────────────────────────────────────────
      case 'caption': {
        const { language = 'en', format = 'srt' } = options;

        // First transcribe
        const transcribeResult = await videoAI(
          { file, action: 'transcribe', options: { language } },
          userId
        );
        if (!transcribeResult.success) return transcribeResult;

        // Convert segments to SRT/VTT
        const segments = transcribeResult.segments || [];
        let captionContent;

        if (format === 'vtt') {
          captionContent = 'WEBVTT\n\n';
          segments.forEach((seg, i) => {
            captionContent += `${i + 1}\n`;
            captionContent += `${seg.start.replace(/^(\d):/, '0$1:')} --> ${seg.end.replace(/^(\d):/, '0$1:')}\n`;
            captionContent += `${seg.text.trim()}\n\n`;
          });
        } else {
          captionContent = '';
          segments.forEach((seg, i) => {
            captionContent += `${i + 1}\n`;
            captionContent += `${seg.start},000 --> ${seg.end},000\n`;
            captionContent += `${seg.text.trim()}\n\n`;
          });
        }

        // Save caption file
        const captionFile = `captions-${ts}.${format}`;
        const s3Key = `agent-files/${userId}/captions/${captionFile}`;
        const mimeType = format === 'vtt' ? 'text/vtt' : 'application/x-subrip';
        const url = await uploadToS3(s3Key, captionContent, mimeType);

        const capFile = new AgentFile({
          userId,
          agentId: 'video-tool',
          filename: captionFile,
          folder: '/captions',
          path: `/captions/${captionFile}`,
          mimeType,
          size: captionContent.length,
          storageType: 's3',
          s3Key,
          s3Url: url,
        });
        await capFile.save();

        return {
          success: true,
          action: 'caption',
          format,
          filename: captionFile,
          url,
          s3Url: url,
          segmentCount: segments.length,
          language,
          preview: captionContent.substring(0, 500),
          message: `${format.toUpperCase()} captions generated (${segments.length} segments)`,
        };
      }

      // ── MODERATE ──────────────────────────────────────────────
      case 'moderate': {
        const { frame_count = 8 } = options;
        const input = await resolveVideoInput(file, userId);
        const meta = await probeVideo(input.path);
        const duration = parseFloat(meta.format.duration);

        const frames = [];
        for (let i = 0; i < frame_count; i++) {
          const timestamp = (duration / (frame_count + 1)) * (i + 1);
          const framePath = path.join(os.tmpdir(), `mod-frame-${ts}-${i}.png`);

          await new Promise((resolve, reject) => {
            ff(input.path)
              .seekInput(timestamp)
              .frames(1)
              .size('512x?')
              .output(framePath)
              .on('end', resolve)
              .on('error', reject)
              .run();
          });

          if (fs.existsSync(framePath)) {
            frames.push({
              timestamp: formatDuration(timestamp),
              buffer: fs.readFileSync(framePath),
              base64: fs.readFileSync(framePath).toString('base64'),
            });
            cleanup(framePath);
          }
        }

        cleanup(input.isTemp ? input.path : null);

        // ── AZURE CONTENT SAFETY (primary — purpose-built) ──────
        if (isAzureVisionAvailable() && frames.length > 0) {
          try {
            const frameResults = [];
            let worstRating = 'safe';
            let worstSeverity = 0;
            const allCategories = {};
            const flaggedTimestamps = [];

            for (const frame of frames) {
              const modResult = await azureModerate(frame.buffer);
              if (modResult.success) {
                frameResults.push({
                  timestamp: frame.timestamp,
                  ...modResult,
                });
                if (modResult.maxSeverity > worstSeverity) {
                  worstSeverity = modResult.maxSeverity;
                  worstRating = modResult.rating;
                }
                if (!modResult.safe) flaggedTimestamps.push(frame.timestamp);
                for (const [cat, val] of Object.entries(
                  modResult.categories || {}
                )) {
                  if (
                    !allCategories[cat] ||
                    val.severity > allCategories[cat].severity
                  ) {
                    allCategories[cat] = val;
                  }
                }
              }
            }

            if (frameResults.length > 0) {
              return {
                success: true,
                action: 'moderate',
                safe: worstSeverity < 2,
                rating: worstRating,
                categories: allCategories,
                flagged_timestamps: flaggedTimestamps,
                framesChecked: frameResults.length,
                model: 'azure-content-safety',
                message: `Content moderation: ${worstRating} (${frameResults.length} frames via Azure)`,
              };
            }
          } catch (e) {
            console.warn(
              '[VideoService] Azure moderation failed, falling back to GPT-4o:',
              e.message
            );
          }
        }

        // ── GPT-4O FALLBACK ─────────────────────────────────────
        if (!process.env.OPENAI_API_KEY)
          return { success: false, error: 'No moderation provider available' };

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const content = [
          {
            type: 'text',
            text: `Content moderation analysis. Review these ${frames.length} video frames for: NSFW/sexual content, violence/gore, hate symbols, drug use, dangerous activities, self-harm. Return JSON: {"safe": true/false, "rating": "safe"|"mild"|"moderate"|"severe", "flags": ["category"], "details": "explanation", "flagged_timestamps": ["HH:MM:SS"]}. Return ONLY the JSON.`,
          },
          ...frames.map((f) => ({
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${f.base64}`,
              detail: 'low',
            },
          })),
        ];

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content }],
          max_tokens: 500,
        });

        let modResult = {};
        try {
          const text = response.choices[0].message.content;
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) modResult = JSON.parse(jsonMatch[0]);
        } catch {
          modResult = {
            safe: true,
            rating: 'unknown',
            raw: response.choices[0].message.content,
          };
        }

        return {
          success: true,
          action: 'moderate',
          ...modResult,
          framesChecked: frames.length,
          model: 'gpt-4o',
          message: `Content moderation: ${modResult.rating || 'analyzed'}`,
        };
      }

      // ── SMART_CROP ────────────────────────────────────────────
      case 'smart_crop': {
        const { target_ratio = '9:16', subject = 'center' } = options;
        const input = await resolveVideoInput(file, userId);
        const meta = await probeVideo(input.path);
        const videoStream = meta.streams?.find((s) => s.codec_type === 'video');

        if (!videoStream) {
          cleanup(input.isTemp ? input.path : null);
          return { success: false, error: 'No video stream found' };
        }

        const [ratioW, ratioH] = target_ratio.split(':').map(Number);
        const srcW = videoStream.width;
        const srcH = videoStream.height;

        // Calculate crop dimensions
        let cropW, cropH;
        if (srcW / srcH > ratioW / ratioH) {
          cropH = srcH;
          cropW = Math.floor(srcH * (ratioW / ratioH));
        } else {
          cropW = srcW;
          cropH = Math.floor(srcW * (ratioH / ratioW));
        }
        // Ensure even numbers
        cropW = cropW - (cropW % 2);
        cropH = cropH - (cropH % 2);

        const outputFile = `smart-crop-${ts}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFile);

        const x =
          subject === 'left'
            ? 0
            : subject === 'right'
              ? `iw-${cropW}`
              : `(iw-${cropW})/2`;
        const y =
          subject === 'top'
            ? 0
            : subject === 'bottom'
              ? `ih-${cropH}`
              : `(ih-${cropH})/2`;

        const cmd = ff(input.path)
          .videoFilter(`crop=${cropW}:${cropH}:${x}:${y}`)
          .videoCodec('libx264')
          .audioCodec('aac');

        const buffer = await runFFmpeg(cmd, outputPath);
        cleanup(input.isTemp ? input.path : null, outputPath);

        return saveVideoResult(buffer, outputFile, 'video/mp4', userId, {
          action: 'smart_crop',
          targetRatio: target_ratio,
          cropDimensions: `${cropW}x${cropH}`,
          message: `Video smart-cropped to ${target_ratio} (${cropW}x${cropH})`,
        });
      }

      default:
        return {
          success: false,
          error: `Unknown AI action: ${action}. Supported: describe, transcribe, highlights, smart_crop, caption, moderate`,
        };
    }
  } catch (error) {
    console.error(`[VideoService] AI/${action} error:`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 8: video_batch
// ═══════════════════════════════════════════════════════════════════

/**
 * Bulk video processing pipeline.
 *
 * Actions:
 *   process  — Apply same operations to multiple videos
 *   pipeline — Chain multiple operations on one video
 */
export async function videoBatch(params, userId = 'default') {
  const { action = 'process', files, operations, options = {} } = params;

  const toolMap = {
    video_transform: videoTransform,
    video_convert: videoConvert,
    video_analyze: videoAnalyze,
    video_overlay: videoOverlay,
    video_filter: videoFilter,
    video_audio: videoAudio,
    video_ai: videoAI,
  };

  try {
    switch (action) {
      // ── PROCESS (same ops → multiple files) ───────────────────
      case 'process': {
        if (!files || !Array.isArray(files) || files.length === 0) {
          return { success: false, error: 'files array required' };
        }
        if (
          !operations ||
          !Array.isArray(operations) ||
          operations.length === 0
        ) {
          return { success: false, error: 'operations array required' };
        }

        const { fail_mode = 'continue' } = options;
        const results = [];

        for (const file of files) {
          let currentFile = file;
          let fileResults = { input: file, steps: [] };

          for (const op of operations) {
            const handler = toolMap[op.tool];
            if (!handler) {
              fileResults.steps.push({ tool: op.tool, error: 'Unknown tool' });
              if (fail_mode === 'stop') break;
              continue;
            }

            try {
              const result = await handler(
                {
                  file: currentFile,
                  action: op.action,
                  options: op.options || {},
                },
                userId
              );
              fileResults.steps.push({
                tool: op.tool,
                action: op.action,
                success: result.success,
                url: result.url,
                filename: result.filename,
              });
              // Chain: use output as next input
              if (result.success && result.filename) {
                currentFile = result.filename;
              }
            } catch (err) {
              fileResults.steps.push({
                tool: op.tool,
                action: op.action,
                error: err.message,
              });
              if (fail_mode === 'stop') break;
            }
          }

          results.push(fileResults);
        }

        return {
          success: true,
          action: 'process',
          results,
          filesProcessed: results.length,
          message: `Batch processed ${results.length} files with ${operations.length} operations each`,
        };
      }

      // ── PIPELINE (chain ops → one file) ───────────────────────
      case 'pipeline': {
        const { file } = params;
        if (!file)
          return { success: false, error: 'file required for pipeline' };
        if (
          !operations ||
          !Array.isArray(operations) ||
          operations.length === 0
        ) {
          return { success: false, error: 'operations array required' };
        }

        let currentFile = file;
        const steps = [];

        for (const op of operations) {
          const handler = toolMap[op.tool];
          if (!handler) {
            steps.push({ tool: op.tool, error: 'Unknown tool' });
            continue;
          }

          const result = await handler(
            { file: currentFile, action: op.action, options: op.options || {} },
            userId
          );

          steps.push({
            tool: op.tool,
            action: op.action,
            success: result.success,
            url: result.url,
            filename: result.filename,
          });

          if (result.success && result.filename) {
            currentFile = result.filename;
          } else {
            return {
              success: false,
              action: 'pipeline',
              steps,
              error: `Pipeline failed at step: ${op.tool}/${op.action}`,
            };
          }
        }

        return {
          success: true,
          action: 'pipeline',
          steps,
          finalUrl: steps[steps.length - 1]?.url,
          finalFilename: steps[steps.length - 1]?.filename,
          message: `Pipeline completed: ${steps.length} steps`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown batch action: ${action}. Supported: process, pipeline`,
        };
    }
  } catch (error) {
    console.error(`[VideoService] Batch/${action} error:`, error);
    return { success: false, error: error.message };
  }
}
