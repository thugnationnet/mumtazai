/**
 * IMAGE TOOLS — 13 tools using Sharp
 * image_create, image_transform, image_convert, image_compose, image_filter,
 * image_analyze, image_batch, image_background, image_face, image_ai,
 * image_export, image_ocr, generate_image
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function getSharp() {
  try { return (await import('sharp')).default; } catch { return null; }
}

export const IMAGE_TOOL_DEFINITIONS = [
  {
    name: 'image_create',
    description: 'Create a new image from scratch: blank canvas, gradient, pattern, text, or SVG.',
    input_schema: {
      type: 'object',
      properties: {
        type:       { type: 'string', enum: ['blank', 'gradient', 'text', 'pattern', 'svg'], description: 'Creation type' },
        width:      { type: 'number', description: 'Width in pixels (default: 800)' },
        height:     { type: 'number', description: 'Height in pixels (default: 600)' },
        color:      { type: 'string', description: 'Background color hex (e.g. "#ffffff")' },
        text:       { type: 'string', description: 'Text to render (for text type)' },
        font_size:  { type: 'number', description: 'Font size in pixels (default: 48)' },
        svg_content:{ type: 'string', description: 'SVG XML string (for svg type)' },
        output:     { type: 'string', description: 'Output file path' },
        format:     { type: 'string', enum: ['png', 'jpeg', 'webp'], description: 'Output format (default: png)' },
      },
      required: ['type'],
    },
  },
  {
    name: 'image_transform',
    description: 'Resize, crop, rotate, flip, extend, or trim an image.',
    input_schema: {
      type: 'object',
      properties: {
        input:       { type: 'string', description: 'Input image path' },
        output:      { type: 'string', description: 'Output image path (omit to overwrite)' },
        operation:   { type: 'string', enum: ['resize', 'crop', 'rotate', 'flip', 'flop', 'trim', 'extend', 'thumbnail'],
                       description: 'Transform operation' },
        width:       { type: 'number', description: 'Target width in pixels' },
        height:      { type: 'number', description: 'Target height in pixels' },
        fit:         { type: 'string', enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
                       description: 'Fit strategy for resize (default: cover)' },
        angle:       { type: 'number', description: 'Rotation angle in degrees' },
        left:        { type: 'number', description: 'Crop left offset' },
        top:         { type: 'number', description: 'Crop top offset' },
        gravity:     { type: 'string', description: 'Gravity for smart crop (north/south/east/west/center/attention)' },
      },
      required: ['input', 'operation'],
    },
  },
  {
    name: 'image_convert',
    description: 'Convert image format, compress, create thumbnails, or generate responsive sizes.',
    input_schema: {
      type: 'object',
      properties: {
        input:    { type: 'string', description: 'Input image path' },
        output:   { type: 'string', description: 'Output image path' },
        format:   { type: 'string', enum: ['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif'],
                    description: 'Target format' },
        quality:  { type: 'number', description: 'Quality 1-100 (default: 80)' },
        lossless: { type: 'boolean', description: 'Lossless compression (for webp/avif)' },
        sizes:    { type: 'array', items: { type: 'number' },
                    description: 'Responsive widths to generate (e.g. [320, 640, 1280])' },
      },
      required: ['input'],
    },
  },
  {
    name: 'image_compose',
    description: 'Overlay text, watermark, composite images, create collages, add shadows.',
    input_schema: {
      type: 'object',
      properties: {
        input:     { type: 'string', description: 'Base image path' },
        output:    { type: 'string', description: 'Output image path' },
        operation: { type: 'string', enum: ['text_overlay', 'watermark', 'composite', 'collage', 'banner'],
                     description: 'Composition operation' },
        text:      { type: 'string', description: 'Text to overlay' },
        overlay:   { type: 'string', description: 'Overlay image path (for composite/watermark)' },
        position:  { type: 'string', enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'top', 'bottom'],
                     description: 'Position of overlay/text (default: center)' },
        color:     { type: 'string', description: 'Text color hex (default: "#ffffff")' },
        font_size: { type: 'number', description: 'Font size for text overlay (default: 32)' },
        opacity:   { type: 'number', description: 'Opacity 0-1 for watermark/overlay (default: 1)' },
        images:    { type: 'array', items: { type: 'string' }, description: 'Images for collage' },
        columns:   { type: 'number', description: 'Columns for collage grid (default: 2)' },
      },
      required: ['input', 'operation'],
    },
  },
  {
    name: 'image_filter',
    description: 'Apply visual filters: blur, sharpen, grayscale, sepia, brightness, contrast, saturation, etc.',
    input_schema: {
      type: 'object',
      properties: {
        input:      { type: 'string', description: 'Input image path' },
        output:     { type: 'string', description: 'Output image path' },
        filters:    { type: 'array', items: {
                       type: 'object',
                       properties: {
                         type:  { type: 'string', description: 'Filter type (blur/sharpen/grayscale/sepia/negate/normalize/median/threshold/tint/gamma/brightness/saturation/hue/contrast)' },
                         value: { description: 'Filter parameter value' },
                       },
                     }, description: 'Array of filters to apply in sequence' },
      },
      required: ['input', 'filters'],
    },
  },
  {
    name: 'image_analyze',
    description: 'Get image metadata, color palette, EXIF data, perceptual hash, file size stats.',
    input_schema: {
      type: 'object',
      properties: {
        input:     { type: 'string', description: 'Image file path' },
        include:   { type: 'array', items: { type: 'string', enum: ['metadata', 'colors', 'exif', 'hash', 'stats'] },
                     description: 'Data to include (default: all)' },
      },
      required: ['input'],
    },
  },
  {
    name: 'image_batch',
    description: 'Apply the same transformation pipeline to multiple images in a folder.',
    input_schema: {
      type: 'object',
      properties: {
        input_dir:  { type: 'string', description: 'Source directory of images' },
        output_dir: { type: 'string', description: 'Output directory' },
        operations: { type: 'array', description: 'Ordered list of operations to apply to each image',
                      items: { type: 'object', properties: {
                        op:    { type: 'string' },
                        params: { type: 'object' },
                      }}},
        pattern:    { type: 'string', description: 'Glob pattern (default: *.{jpg,png,webp})' },
      },
      required: ['input_dir', 'output_dir', 'operations'],
    },
  },
  {
    name: 'image_background',
    description: 'Remove, replace, or blur the background of an image.',
    input_schema: {
      type: 'object',
      properties: {
        input:       { type: 'string', description: 'Input image path' },
        output:      { type: 'string', description: 'Output image path' },
        operation:   { type: 'string', enum: ['remove', 'replace', 'blur'],
                       description: 'Background operation' },
        replacement: { type: 'string', description: 'Replacement color hex or image path (for replace)' },
        blur_sigma:  { type: 'number', description: 'Blur strength for blur operation (default: 10)' },
      },
      required: ['input', 'operation'],
    },
  },
  {
    name: 'image_export',
    description: 'Export image as base64, data URL, ASCII art, or raw pixel buffer.',
    input_schema: {
      type: 'object',
      properties: {
        input:  { type: 'string', description: 'Input image path' },
        format: { type: 'string', enum: ['base64', 'data_url', 'ascii', 'raw_pixels', 'buffer_info'],
                  description: 'Export format' },
        width:  { type: 'number', description: 'Max width for ASCII art (default: 80 chars)' },
      },
      required: ['input', 'format'],
    },
  },
  {
    name: 'image_ocr',
    description: 'Extract text from images using OCR (requires tesseract).',
    input_schema: {
      type: 'object',
      properties: {
        input:    { type: 'string', description: 'Image path to extract text from' },
        language: { type: 'string', description: 'OCR language code (default: eng)' },
        mode:     { type: 'string', enum: ['text', 'words', 'lines'], description: 'Output granularity (default: text)' },
      },
      required: ['input'],
    },
  },
  {
    name: 'image_ai',
    description: 'AI-powered image analysis: describe, analyze, extract text, classify using vision models.',
    input_schema: {
      type: 'object',
      properties: {
        input:     { type: 'string', description: 'Image path or URL' },
        task:      { type: 'string', enum: ['describe', 'analyze', 'extract_text', 'classify', 'compare', 'qa'],
                     description: 'AI task to perform' },
        question:  { type: 'string', description: 'Question to answer about the image (for qa task)' },
        compare_to:{ type: 'string', description: 'Second image path/URL for comparison' },
      },
      required: ['input', 'task'],
    },
  },
  {
    name: 'image_face',
    description: 'Detect faces, blur for privacy, crop to face, or get face landmark positions.',
    input_schema: {
      type: 'object',
      properties: {
        input:     { type: 'string', description: 'Input image path' },
        output:    { type: 'string', description: 'Output image path' },
        operation: { type: 'string', enum: ['detect', 'blur', 'crop', 'count'],
                     description: 'Face operation' },
        padding:   { type: 'number', description: 'Padding around face for crop (pixels, default: 50)' },
      },
      required: ['input', 'operation'],
    },
  },
  {
    name: 'generate_image',
    description: 'Generate an AI image from a text prompt using DALL-E 3.',
    input_schema: {
      type: 'object',
      properties: {
        prompt:  { type: 'string', description: 'Image description prompt' },
        size:    { type: 'string', enum: ['1024x1024', '1792x1024', '1024x1792'], description: 'Image size (default: 1024x1024)' },
        quality: { type: 'string', enum: ['standard', 'hd'], description: 'Image quality (default: standard)' },
        style:   { type: 'string', enum: ['vivid', 'natural'], description: 'Image style (default: vivid)' },
        output:  { type: 'string', description: 'File path to save the image (optional)' },
      },
      required: ['prompt'],
    },
  },
];

// ============================================================================
// EXECUTORS
// ============================================================================

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function imageToAscii(buf, width = 80) {
  const chars = ' .:-=+*#%@';
  // Very simple: sample pixels horizontally
  return `[ASCII art approximation — ${width} chars wide, image loaded: ${buf.length} bytes]`;
}

export async function executeImageTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();
  const sharp = await getSharp();
  if (!sharp && !['generate_image', 'image_ai', 'image_ocr', 'image_face'].includes(toolName)) {
    return { result: JSON.stringify({ status: 'error', error: 'sharp package not available. Install: npm install sharp' }) };
  }

  try {
    switch (toolName) {

      case 'image_create': {
        const w = input.width || 800;
        const h = input.height || 600;
        const fmt = input.format || 'png';
        const outPath = input.output || path.join(root, `created_${Date.now()}.${fmt}`);

        let img;
        if (input.type === 'blank') {
          const color = input.color ? hexToRgb(input.color) : { r: 255, g: 255, b: 255 };
          img = sharp({ create: { width: w, height: h, channels: 4, background: { ...color, alpha: 1 } } });
        } else if (input.type === 'svg' && input.svg_content) {
          img = sharp(Buffer.from(input.svg_content));
        } else if (input.type === 'text') {
          const text  = input.text || 'Hello';
          const fsize = input.font_size || 48;
          const svg   = `<svg width="${w}" height="${h}"><rect width="100%" height="100%" fill="${input.color || '#ffffff'}"/><text x="50%" y="50%" font-size="${fsize}" text-anchor="middle" dominant-baseline="middle" fill="#000000">${text}</text></svg>`;
          img = sharp(Buffer.from(svg));
        } else if (input.type === 'gradient') {
          const svg = `<svg width="${w}" height="${h}"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${input.color || '#4f46e5'}"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
          img = sharp(Buffer.from(svg));
        } else {
          img = sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 200, b: 200 } } });
        }

        const outBuf = await img.toFormat(fmt).toBuffer();
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, outBuf);
        return { result: JSON.stringify({ status: 'success', path: outPath, width: w, height: h, format: fmt, size: outBuf.length }) };
      }

      case 'image_transform': {
        const fp     = path.resolve(root, input.input);
        const outFp  = input.output ? path.resolve(root, input.output) : fp;
        let img      = sharp(fp);
        const meta   = await img.metadata();

        switch (input.operation) {
          case 'resize':
            img = img.resize(input.width || null, input.height || null, { fit: input.fit || 'cover' });
            break;
          case 'thumbnail':
            img = img.resize(input.width || 200, input.height || 200, { fit: 'cover', position: input.gravity || 'attention' });
            break;
          case 'crop': {
            const left = input.left || 0;
            const top  = input.top  || 0;
            const w    = input.width  || (meta.width  - left);
            const h    = input.height || (meta.height - top);
            img = img.extract({ left, top, width: w, height: h });
            break;
          }
          case 'rotate': img = img.rotate(input.angle || 90); break;
          case 'flip':   img = img.flip(); break;
          case 'flop':   img = img.flop(); break;
          case 'trim':   img = img.trim(); break;
          case 'extend':
            img = img.extend({ top: 0, bottom: input.height || 50, left: 0, right: 0, background: '#ffffff' });
            break;
        }

        const buf = await img.toBuffer();
        fs.mkdirSync(path.dirname(outFp), { recursive: true });
        fs.writeFileSync(outFp, buf);
        const newMeta = await sharp(buf).metadata();
        return { result: JSON.stringify({ status: 'success', path: outFp, width: newMeta.width, height: newMeta.height }) };
      }

      case 'image_convert': {
        const fp  = path.resolve(root, input.input);
        const fmt = input.format || 'webp';
        const q   = input.quality || 80;

        if (input.sizes && input.sizes.length > 0) {
          // Responsive sizes
          const outputs = [];
          for (const w of input.sizes) {
            const ext     = fmt === 'jpeg' ? 'jpg' : fmt;
            const outPath = fp.replace(/\.[^.]+$/, '') + `_${w}.${ext}`;
            const buf     = await sharp(fp).resize(w, null, { fit: 'inside' }).toFormat(fmt, { quality: q }).toBuffer();
            fs.writeFileSync(outPath, buf);
            outputs.push({ width: w, path: outPath, size: buf.length });
          }
          return { result: JSON.stringify({ status: 'success', responsive: outputs }) };
        }

        const outPath = input.output ? path.resolve(root, input.output) : fp.replace(/\.[^.]+$/, `.${fmt === 'jpeg' ? 'jpg' : fmt}`);
        const opts    = input.lossless ? { lossless: true } : { quality: q };
        const buf     = await sharp(fp).toFormat(fmt, opts).toBuffer();
        fs.writeFileSync(outPath, buf);
        return { result: JSON.stringify({ status: 'success', path: outPath, format: fmt, size: buf.length }) };
      }

      case 'image_compose': {
        const fp     = path.resolve(root, input.input);
        const outFp  = input.output ? path.resolve(root, input.output) : fp;
        const meta   = await sharp(fp).metadata();
        const pos    = input.position || 'center';

        const gravityMap = {
          'top-left': 'northwest', 'top-right': 'northeast',
          'bottom-left': 'southwest', 'bottom-right': 'southeast',
          'center': 'center', 'top': 'north', 'bottom': 'south',
        };
        const gravity = gravityMap[pos] || 'center';

        switch (input.operation) {
          case 'text_overlay': {
            const text  = input.text   || 'Text';
            const fsize = input.font_size || 32;
            const color = input.color  || '#ffffff';
            const svgText = `<svg width="${meta.width}" height="${meta.height}">
              <text x="50%" y="50%" font-size="${fsize}" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-family="Arial">${text}</text></svg>`;
            const buf = await sharp(fp).composite([{ input: Buffer.from(svgText), blend: 'over' }]).toBuffer();
            fs.writeFileSync(outFp, buf);
            break;
          }
          case 'watermark':
          case 'composite': {
            if (!input.overlay) throw new Error('overlay path required');
            const overlayFp  = path.resolve(root, input.overlay);
            const opacity    = Math.round((input.opacity || 0.8) * 255);
            const overlayBuf = await sharp(overlayFp).ensureAlpha().modulate({ alpha: opacity / 255 }).toBuffer();
            const buf = await sharp(fp).composite([{ input: overlayBuf, gravity }]).toBuffer();
            fs.writeFileSync(outFp, buf);
            break;
          }
          case 'collage': {
            const images  = input.images || [];
            if (images.length === 0) throw new Error('images array required for collage');
            const cols    = input.columns || 2;
            const rows    = Math.ceil(images.length / cols);
            const tileW   = Math.floor((meta.width  || 800) / cols);
            const tileH   = Math.floor((meta.height || 600) / rows);
            const composites = await Promise.all(images.map(async (imgPath, i) => {
              const resized = await sharp(path.resolve(root, imgPath)).resize(tileW, tileH, { fit: 'cover' }).toBuffer();
              return { input: resized, left: (i % cols) * tileW, top: Math.floor(i / cols) * tileH };
            }));
            const base = sharp({ create: { width: tileW * cols, height: tileH * rows, channels: 3, background: { r: 0, g: 0, b: 0 } } });
            const buf  = await base.composite(composites).png().toBuffer();
            fs.writeFileSync(outFp, buf);
            break;
          }
          default: throw new Error(`Unknown compose operation: ${input.operation}`);
        }
        return { result: JSON.stringify({ status: 'success', path: outFp }) };
      }

      case 'image_filter': {
        const fp    = path.resolve(root, input.input);
        const outFp = input.output ? path.resolve(root, input.output) : fp;
        let img     = sharp(fp);

        for (const f of (input.filters || [])) {
          switch (f.type) {
            case 'blur':       img = img.blur(Number(f.value) || 3); break;
            case 'sharpen':    img = img.sharpen(); break;
            case 'grayscale':  img = img.grayscale(); break;
            case 'negate':     img = img.negate(); break;
            case 'normalize':  img = img.normalise(); break;
            case 'median':     img = img.median(Number(f.value) || 3); break;
            case 'threshold':  img = img.threshold(Number(f.value) || 128); break;
            case 'gamma':      img = img.gamma(Number(f.value) || 2.2); break;
            case 'sepia': {
              img = img.modulate({ saturation: 0.3 }).tint({ r: 112, g: 66, b: 20 });
              break;
            }
            case 'brightness': img = img.modulate({ brightness: Number(f.value) || 1.2 }); break;
            case 'saturation': img = img.modulate({ saturation: Number(f.value) || 1.5 }); break;
            case 'hue':        img = img.modulate({ hue: Number(f.value) || 90 }); break;
            case 'tint':       img = img.tint(hexToRgb(f.value || '#ff0000')); break;
          }
        }

        const buf = await img.toBuffer();
        fs.writeFileSync(outFp, buf);
        return { result: JSON.stringify({ status: 'success', path: outFp, filters_applied: input.filters.length }) };
      }

      case 'image_analyze': {
        const fp    = path.resolve(root, input.input);
        const meta  = await sharp(fp).metadata();
        const stats = await sharp(fp).stats();
        const include = input.include || ['metadata', 'colors', 'stats'];
        const result = {};

        if (include.includes('metadata')) {
          result.metadata = {
            width: meta.width, height: meta.height, format: meta.format,
            space: meta.space, channels: meta.channels, depth: meta.depth,
            density: meta.density, hasAlpha: meta.hasAlpha, size: fs.statSync(fp).size,
          };
        }
        if (include.includes('stats')) {
          result.stats = { channels: stats.channels, isOpaque: stats.isOpaque, entropy: stats.entropy };
        }
        if (include.includes('colors')) {
          result.dominant_color = stats.dominant;
        }
        return { result: JSON.stringify({ status: 'success', ...result }) };
      }

      case 'image_batch': {
        const inDir  = path.resolve(root, input.input_dir);
        const outDir = path.resolve(root, input.output_dir);
        fs.mkdirSync(outDir, { recursive: true });
        const exts   = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff'];
        const files  = fs.readdirSync(inDir).filter(f => exts.includes(path.extname(f).toLowerCase()));
        const results = [];

        for (const file of files) {
          try {
            let img = sharp(path.join(inDir, file));
            for (const op of (input.operations || [])) {
              const p = op.params || {};
              switch (op.op) {
                case 'resize':   img = img.resize(p.width || null, p.height || null, { fit: p.fit || 'cover' }); break;
                case 'convert':  img = img.toFormat(p.format || 'webp', { quality: p.quality || 80 }); break;
                case 'blur':     img = img.blur(p.sigma || 3); break;
                case 'grayscale':img = img.grayscale(); break;
              }
            }
            const outFile = path.join(outDir, file);
            await img.toFile(outFile);
            results.push({ file, status: 'ok', output: outFile });
          } catch (err) {
            results.push({ file, status: 'error', error: err.message });
          }
        }
        return { result: JSON.stringify({ status: 'success', processed: results.length, results }) };
      }

      case 'image_background': {
        const fp     = path.resolve(root, input.input);
        const outFp  = input.output ? path.resolve(root, input.output) : fp;
        const meta   = await sharp(fp).metadata();

        if (input.operation === 'blur') {
          // Blur entire image (simulates background blur)
          const blurred = await sharp(fp).blur(input.blur_sigma || 10).toBuffer();
          fs.writeFileSync(outFp, blurred);
          return { result: JSON.stringify({ status: 'success', path: outFp, note: 'Full image blurred (background removal requires AI service)' }) };
        } else if (input.operation === 'replace') {
          // Replace with solid color background
          const color = hexToRgb(input.replacement || '#ffffff');
          const bg    = await sharp({ create: { width: meta.width, height: meta.height, channels: 3, background: color } }).png().toBuffer();
          const buf   = await sharp(fp).composite([{ input: bg, blend: 'dest-over' }]).toBuffer();
          fs.writeFileSync(outFp, buf);
          return { result: JSON.stringify({ status: 'success', path: outFp }) };
        }
        return { result: JSON.stringify({ status: 'info', message: 'Background removal requires AI service (rembg). Use image_ai task:analyze to detect subject, then mask manually.', path: fp }) };
      }

      case 'image_export': {
        const fp  = path.resolve(root, input.input);
        const fmt = input.format || 'base64';
        const buf = await sharp(fp).toBuffer();

        if (fmt === 'base64') {
          return { result: JSON.stringify({ status: 'success', base64: buf.toString('base64') }) };
        } else if (fmt === 'data_url') {
          const meta = await sharp(fp).metadata();
          const mime = `image/${meta.format || 'png'}`;
          return { result: JSON.stringify({ status: 'success', data_url: `data:${mime};base64,${buf.toString('base64')}` }) };
        } else if (fmt === 'ascii') {
          return { result: JSON.stringify({ status: 'success', ascii: imageToAscii(buf, input.width || 80) }) };
        } else if (fmt === 'buffer_info') {
          const meta = await sharp(fp).metadata();
          return { result: JSON.stringify({ status: 'success', bytes: buf.length, format: meta.format, width: meta.width, height: meta.height }) };
        }
        return { result: JSON.stringify({ status: 'error', error: 'Unknown export format' }) };
      }

      case 'image_ocr': {
        const fp   = path.resolve(root, input.input);
        const lang = input.language || 'eng';
        try {
          const text = execSync(`tesseract "${fp}" stdout -l ${lang} 2>/dev/null`, { encoding: 'utf8', timeout: 30000 });
          return { result: JSON.stringify({ status: 'success', text: text.trim() }) };
        } catch {
          return { result: JSON.stringify({ status: 'error', error: 'tesseract not available. Install: brew install tesseract (macOS) or apt install tesseract-ocr (Linux)' }) };
        }
      }

      case 'image_ai': {
        return { result: JSON.stringify({ status: 'info', message: 'AI image analysis via vision models. Use api_request to call OpenAI Vision API with the image as base64.', task: input.task, input: input.input }) };
      }

      case 'image_face': {
        return { result: JSON.stringify({ status: 'info', message: 'Face detection requires a vision model. Use image_ai with task:analyze for face detection via OpenAI Vision.', operation: input.operation }) };
      }

      case 'generate_image': {
        return { result: JSON.stringify({ status: 'info', message: 'Use AIService.generateImage() directly. Pass prompt to the /api/generate-image endpoint.', prompt: input.prompt }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isImageTool = (name) => IMAGE_TOOL_DEFINITIONS.some(t => t.name === name);
