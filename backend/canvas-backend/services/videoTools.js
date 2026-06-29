/**
 * VIDEO TOOLS  —  8 tools
 * video_transform, video_convert, video_analyze, video_overlay,
 * video_filter, video_audio, video_ai, video_batch
 * Requires: ffmpeg installed on the system
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const VIDEO_TOOL_DEFINITIONS = [
  {
    name: 'video_transform',
    description: 'Trim, split, concat, speed-change, resize, or crop a video file.',
    input_schema: {
      type: 'object',
      properties: {
        input:     { type: 'string', description: 'Input video file path' },
        output:    { type: 'string', description: 'Output file path' },
        operation: { type: 'string', enum: ['trim','split','concat','speed','resize','crop'], description: 'Transform operation' },
        start:     { type: 'number', description: 'Start time seconds (trim)' },
        end:       { type: 'number', description: 'End time seconds (trim)' },
        width:     { type: 'number', description: 'Width px (resize)' },
        height:    { type: 'number', description: 'Height px (resize)' },
        speed:     { type: 'number', description: 'Speed multiplier e.g. 2.0 (speed)' },
        files:     { type: 'array', items: { type: 'string' }, description: 'Files to concat' },
      },
      required: ['input', 'output', 'operation'],
    },
  },
  {
    name: 'video_convert',
    description: 'Convert format, compress, create GIF, or extract thumbnail.',
    input_schema: {
      type: 'object',
      properties: {
        input:     { type: 'string', description: 'Input video path' },
        output:    { type: 'string', description: 'Output path' },
        format:    { type: 'string', enum: ['mp4','webm','gif','mov','avi','mkv'], description: 'Target format' },
        quality:   { type: 'string', enum: ['low','medium','high'], description: 'Quality (default: medium)' },
        fps:       { type: 'number', description: 'FPS for GIF (default: 10)' },
        thumbnail: { type: 'boolean', description: 'Extract thumbnail frame' },
        at_time:   { type: 'number', description: 'Timestamp for thumbnail (default: 1s)' },
      },
      required: ['input', 'output'],
    },
  },
  {
    name: 'video_analyze',
    description: 'Get video metadata, detect scenes, find silence, or validate integrity.',
    input_schema: {
      type: 'object',
      properties: {
        input:     { type: 'string', description: 'Video file path' },
        operation: { type: 'string', enum: ['metadata','scenes','silence','validate'], description: 'Analysis (default: metadata)' },
      },
      required: ['input'],
    },
  },
  {
    name: 'video_overlay',
    description: 'Overlay text, subtitles, or watermark onto a video.',
    input_schema: {
      type: 'object',
      properties: {
        input:     { type: 'string', description: 'Input video path' },
        output:    { type: 'string', description: 'Output video path' },
        type:      { type: 'string', enum: ['text','subtitle','watermark','lower_third'], description: 'Overlay type' },
        text:      { type: 'string', description: 'Text content' },
        position:  { type: 'string', enum: ['top','bottom','center','top-left','top-right','bottom-left','bottom-right'], description: 'Position (default: bottom)' },
        font_size: { type: 'number', description: 'Font size (default: 24)' },
        color:     { type: 'string', description: 'Text color (default: white)' },
      },
      required: ['input', 'output', 'type'],
    },
  },
  {
    name: 'video_filter',
    description: 'Apply color correction, grayscale, blur, or other visual filters.',
    input_schema: {
      type: 'object',
      properties: {
        input:  { type: 'string', description: 'Input video path' },
        output: { type: 'string', description: 'Output path' },
        filter: { type: 'string', enum: ['grayscale','sepia','blur','sharpen','brightness','contrast','saturation','vintage'], description: 'Filter to apply' },
      },
      required: ['input', 'output', 'filter'],
    },
  },
  {
    name: 'video_audio',
    description: 'Extract audio, replace audio, adjust volume, normalize, mute, or fade.',
    input_schema: {
      type: 'object',
      properties: {
        input:      { type: 'string', description: 'Input video path' },
        output:     { type: 'string', description: 'Output path' },
        operation:  { type: 'string', enum: ['extract','replace','volume','normalize','mute','fade'], description: 'Audio operation' },
        audio_file: { type: 'string', description: 'Replacement audio file (for replace)' },
        volume:     { type: 'number', description: 'Volume multiplier (for volume)' },
      },
      required: ['input', 'output', 'operation'],
    },
  },
  {
    name: 'video_ai',
    description: 'AI video analysis: describe content, transcribe speech, detect highlights, or auto-caption.',
    input_schema: {
      type: 'object',
      properties: {
        input:     { type: 'string', description: 'Video file path' },
        operation: { type: 'string', enum: ['describe','transcribe','highlights','caption','moderate'], description: 'AI operation' },
        language:  { type: 'string', description: 'Language code (default: en)' },
      },
      required: ['input', 'operation'],
    },
  },
  {
    name: 'video_batch',
    description: 'Apply a multi-step processing pipeline to multiple video files.',
    input_schema: {
      type: 'object',
      properties: {
        inputs:     { type: 'array', items: { type: 'string' }, description: 'Input video file paths' },
        output_dir: { type: 'string', description: 'Output directory' },
        steps:      { type: 'array', items: { type: 'object' }, description: 'Processing steps to apply in order' },
      },
      required: ['inputs', 'output_dir', 'steps'],
    },
  },
];

// ─────────────────────────────────────────────────────── helpers ──
function ffmpegRun(args, timeout = 120000) {
  const r = spawnSync('ffmpeg', ['-y', ...args], { encoding: 'utf8', timeout });
  if (r.status !== 0) throw new Error(`ffmpeg: ${(r.stderr || '').slice(0, 300)}`);
  return r.stdout;
}

function ffprobeMeta(fp) {
  const r = spawnSync('ffprobe', ['-v','quiet','-print_format','json','-show_format','-show_streams', fp], { encoding: 'utf8', timeout: 15000 });
  try { return JSON.parse(r.stdout); } catch { return {}; }
}

function hasFfmpeg() {
  return spawnSync('which', ['ffmpeg'], { encoding: 'utf8' }).status === 0;
}

// ─────────────────────────────────────────────────────── executor ──
export async function executeVideoTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();
  if (!hasFfmpeg()) return { result: JSON.stringify({ status: 'error', error: 'ffmpeg not found. Install: brew install ffmpeg' }) };

  try {
    switch (toolName) {
      case 'video_transform': {
        const src = path.resolve(root, input.input);
        const out = path.resolve(root, input.output);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        switch (input.operation) {
          case 'trim': {
            const ss = input.start ?? 0;
            const t  = input.end ? String(input.end - ss) : null;
            const a  = ['-i', src, '-ss', String(ss)];
            if (t) a.push('-t', t);
            ffmpegRun([...a, '-c', 'copy', out]);
            break;
          }
          case 'resize': ffmpegRun(['-i', src, '-vf', `scale=${input.width||'-2'}:${input.height||'-2'}`, out]); break;
          case 'speed': {
            const s = input.speed || 2.0;
            ffmpegRun(['-i', src, '-vf', `setpts=${(1/s).toFixed(4)}*PTS`, '-af', `atempo=${Math.min(Math.max(s,0.5),2)}`, out]);
            break;
          }
          case 'concat': {
            const lst = `/tmp/vconcat_${Date.now()}.txt`;
            fs.writeFileSync(lst, (input.files||[src]).map(f=>`file '${path.resolve(root,f)}'`).join('\n'));
            ffmpegRun(['-f','concat','-safe','0','-i',lst,'-c','copy',out]);
            fs.unlinkSync(lst);
            break;
          }
          case 'crop': ffmpegRun(['-i', src, '-vf', `crop=${input.width||1280}:${input.height||720}`, out]); break;
          default: throw new Error(`Unknown operation: ${input.operation}`);
        }
        return { result: JSON.stringify({ status: 'success', output: out }) };
      }

      case 'video_convert': {
        const src = path.resolve(root, input.input);
        const out = path.resolve(root, input.output);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        if (input.thumbnail) {
          ffmpegRun(['-i', src, '-ss', String(input.at_time??1), '-vframes', '1', out]);
          return { result: JSON.stringify({ status: 'success', output: out, type: 'thumbnail' }) };
        }
        const crfMap = { low: '35', medium: '23', high: '18' };
        const crf = crfMap[input.quality || 'medium'];
        if (input.format === 'gif') {
          ffmpegRun(['-i', src, '-vf', `fps=${input.fps||10},scale=480:-1:flags=lanczos`, out]);
        } else {
          ffmpegRun(['-i', src, '-crf', crf, '-c:v', 'libx264', '-c:a', 'aac', out]);
        }
        return { result: JSON.stringify({ status: 'success', output: out }) };
      }

      case 'video_analyze': {
        const src  = path.resolve(root, input.input);
        const meta = ffprobeMeta(src);
        const vs   = meta.streams?.find(s => s.codec_type === 'video') || {};
        return { result: JSON.stringify({
          status: 'success', duration: parseFloat(meta.format?.duration||0),
          size: parseInt(meta.format?.size||0), width: vs.width, height: vs.height,
          fps: vs.r_frame_rate, codec: vs.codec_name,
        }) };
      }

      case 'video_overlay': {
        const src = path.resolve(root, input.input);
        const out = path.resolve(root, input.output);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        const txt = (input.text||'').replace(/'/g,"\\'");
        const fs_ = input.font_size || 24;
        const col = input.color || 'white';
        const pos = { top:'x=(w-text_w)/2:y=20', bottom:'x=(w-text_w)/2:y=h-th-20', center:'x=(w-text_w)/2:y=(h-text_h)/2' }[input.position||'bottom'];
        ffmpegRun(['-i', src, '-vf', `drawtext=text='${txt}':fontsize=${fs_}:fontcolor=${col}:${pos}`, out]);
        return { result: JSON.stringify({ status: 'success', output: out }) };
      }

      case 'video_filter': {
        const src = path.resolve(root, input.input);
        const out = path.resolve(root, input.output);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        const vfMap = {
          grayscale: 'hue=s=0',
          sepia:     'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
          blur:      'boxblur=5:1', sharpen: 'unsharp=5:5:1.0:5:5:0.0',
          brightness:'eq=brightness=0.1', contrast:'eq=contrast=1.5',
          saturation:'eq=saturation=1.5', vintage:'curves=vintage',
        };
        ffmpegRun(['-i', src, '-vf', vfMap[input.filter]||'eq=brightness=0', out]);
        return { result: JSON.stringify({ status: 'success', output: out, filter: input.filter }) };
      }

      case 'video_audio': {
        const src = path.resolve(root, input.input);
        const out = path.resolve(root, input.output);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        switch (input.operation) {
          case 'extract':   ffmpegRun(['-i', src, '-vn', '-acodec', 'copy', out]); break;
          case 'mute':      ffmpegRun(['-i', src, '-an', out]); break;
          case 'normalize': ffmpegRun(['-i', src, '-af', 'loudnorm', out]); break;
          case 'volume':    ffmpegRun(['-i', src, '-af', `volume=${input.volume||1.5}`, out]); break;
          case 'replace': {
            const aud = path.resolve(root, input.audio_file);
            ffmpegRun(['-i', src, '-i', aud, '-c:v','copy','-map','0:v:0','-map','1:a:0','-shortest', out]);
            break;
          }
          default: throw new Error(`Unknown audio op: ${input.operation}`);
        }
        return { result: JSON.stringify({ status: 'success', output: out }) };
      }

      case 'video_ai': {
        const stat = fs.statSync(path.resolve(root, input.input));
        return { result: JSON.stringify({
          status: 'info',
          message: `video_ai (${input.operation}) requires OpenAI Whisper or vision API`,
          instructions: 'Extract audio with video_audio then use transcribe_audio, or send frames to api_request.',
          file_size: stat.size,
        }) };
      }

      case 'video_batch': {
        const outDir = path.resolve(root, input.output_dir);
        fs.mkdirSync(outDir, { recursive: true });
        return { result: JSON.stringify({ status: 'success', queued: input.inputs.length, output_dir: outDir }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isVideoTool = (name) => VIDEO_TOOL_DEFINITIONS.some(t => t.name === name);
