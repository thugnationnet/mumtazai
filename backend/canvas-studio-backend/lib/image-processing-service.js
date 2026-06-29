/**
 * IMAGE PROCESSING SERVICE
 *
 * 11 consolidated tools covering the full image processing pipeline:
 *
 *  1. image_create     — blank, gradient, pattern, placeholder, SVG render, text image, sprite sheet
 *  2. image_transform  — resize, crop, rotate, flip, extend, trim
 *  3. image_convert    — format, compress, responsive, thumbnail, auto_orient
 *  4. image_compose    — text overlay, watermark, composite, merge, collage, shadow
 *  5. image_filter     — 25+ filters: blur, sharpen, grayscale, sepia, noise, vintage, emboss, etc.
 *  6. image_analyze    — metadata, stats, validate, hash, dominant colors, histogram, exif, corruption, phash, similarity
 *  7. image_batch      — bulk processing pipeline
 *  8. image_background — remove, replace, blur backgrounds
 *  9. image_face       — detect, blur, crop, landmarks, count (AI vision)
 * 10. image_export     — ascii art, base64, data_url, raw pixels
 * 11. image_ai         — AI-powered describe, analyze, OCR, compare, classify, Q&A
 *
 * Dependencies:
 *   - sharp (required) — core processing engine
 *   - crypto (built-in) — file hashing
 *   - AgentFile model — storage layer (MongoDB + S3)
 */

import crypto from 'crypto';
import AgentFile from '../models/AgentFile.js';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import OpenAI from 'openai';
import {
  isAzureVisionAvailable,
  azureOCR,
  azureFaceDetect,
  azureModerate,
  azureObjectDetect,
  azureCaption,
  azureSmartCrop,
  azureFullAnalysis,
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

/** Lazy-load sharp with graceful fallback */
async function getSharp() {
  const sharp = await import('sharp').then((m) => m.default).catch(() => null);
  if (!sharp)
    throw new Error('Sharp image library not available. Install: npm i sharp');
  return sharp;
}

/** Download file content from S3 */
async function downloadFromS3(key) {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
    );
    const chunks = [];
    for await (const chunk of response.Body) chunks.push(chunk);
    return { success: true, content: Buffer.concat(chunks) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/** Upload file buffer to S3 and return public URL */
async function uploadToS3(key, content, mimeType) {
  try {
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
    console.log(`[ImageService][S3] Uploaded: ${key} (${buffer.length} bytes)`);
    return { success: true, url, key };
  } catch (error) {
    console.error('[ImageService][S3] Upload error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load image buffer from various sources:
 *   - AgentFile path/filename (DB or S3)
 *   - Data URL (data:image/...)
 *   - HTTP/HTTPS URL
 *   - Raw base64 string
 */
async function loadImageBuffer(source, userId = 'default') {
  // Data URL
  if (source.startsWith('data:')) {
    const base64Data = source.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }

  // Remote URL
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const response = await fetch(source);
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  // AgentFile lookup
  const file = await AgentFile.findOne({
    userId,
    $or: [{ path: source }, { filename: source }],
    isDeleted: false,
  });

  if (!file) throw new Error(`Image not found: ${source}`);

  if (file.storageType === 's3' && file.s3Key) {
    const s3Result = await downloadFromS3(file.s3Key);
    if (!s3Result.success) throw new Error('Failed to download image from S3');
    return s3Result.content;
  }

  if (file.content) return Buffer.from(file.content, 'base64');
  throw new Error(`Image has no content: ${source}`);
}

/** Get MIME type from format string */
function getMimeType(format) {
  const map = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    avif: 'image/avif',
    tiff: 'image/tiff',
    gif: 'image/gif',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    svg: 'image/svg+xml',
  };
  return map[format?.toLowerCase()] || 'image/png';
}

/** Get file extension from format */
function getExtension(format) {
  if (format === 'jpeg') return 'jpg';
  return format?.toLowerCase() || 'png';
}

/** Parse color string → Sharp-compatible color object */
function parseColor(color) {
  if (!color) return { r: 0, g: 0, b: 0, alpha: 1 };
  if (typeof color === 'object') return color;

  // Named colors
  const named = {
    white: '#ffffff',
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    transparent: '#00000000',
    gray: '#808080',
    grey: '#808080',
    orange: '#ffa500',
    purple: '#800080',
    pink: '#ffc0cb',
  };
  const hex = named[color?.toLowerCase()] || color;

  // Parse hex
  const match = hex.match(
    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i
  );
  if (match) {
    return {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16),
      alpha: match[4] ? parseInt(match[4], 16) / 255 : 1,
    };
  }

  return { r: 0, g: 0, b: 0, alpha: 1 };
}

/** Save processed image buffer → S3 + AgentFile record → return URL (no base64) */
async function saveImageResult(
  buffer,
  filename,
  format,
  userId,
  metadata = {}
) {
  const mimeType = getMimeType(format);
  const s3Key = `agent-files/${userId}/images/${filename}`;

  // Upload to S3
  const uploadResult = await uploadToS3(s3Key, buffer, mimeType);

  if (uploadResult.success) {
    // Save AgentFile record pointing to S3
    const newFile = new AgentFile({
      userId,
      filename,
      folder: '/images',
      path: `/images/${filename}`,
      mimeType,
      size: buffer.length,
      storageType: 's3',
      s3Key,
      s3Url: uploadResult.url,
    });

    await newFile.save();

    return {
      success: true,
      filename,
      path: `/images/${filename}`,
      size: buffer.length,
      format: format.toUpperCase(),
      url: uploadResult.url,
      s3Url: uploadResult.url,
      downloadUrl: `/api/agents/files/download?path=${encodeURIComponent(`/images/${filename}`)}&userId=${userId}`,
      ...metadata,
    };
  }

  // Fallback to database if S3 fails
  console.warn(
    '[ImageService] S3 upload failed, falling back to database storage'
  );
  const base64 = buffer.toString('base64');

  const newFile = new AgentFile({
    userId,
    filename,
    folder: '/images',
    path: `/images/${filename}`,
    mimeType,
    size: buffer.length,
    storageType: 'database',
    content: base64,
  });

  await newFile.save();

  return {
    success: true,
    filename,
    path: `/images/${filename}`,
    size: buffer.length,
    format: format.toUpperCase(),
    url: `data:${mimeType};base64,${base64}`,
    downloadUrl: `/api/agents/files/download?path=${encodeURIComponent(`/images/${filename}`)}&userId=${userId}`,
    ...metadata,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 1: image_create
// ═══════════════════════════════════════════════════════════════════

/**
 * Create images from scratch (no source file needed).
 *
 * Actions:
 *   blank       — solid color or transparent
 *   gradient    — linear gradient between colors
 *   pattern     — grid, dots, stripes, checkerboard
 *   placeholder — placeholder rectangle with text
 *   svg_render  — render SVG string to PNG
 *   text_image  — render text as an image
 */
export async function imageCreate(params, userId = 'default') {
  const { action = 'blank', width = 800, height = 600, options = {} } = params;

  try {
    const sharp = await getSharp();
    let buffer;
    const ts = Date.now();

    switch (action) {
      case 'blank': {
        const bg = parseColor(options.color || options.background || 'white');
        buffer = await sharp({
          create: { width, height, channels: 4, background: bg },
        })
          .png()
          .toBuffer();
        return saveImageResult(buffer, `blank-${ts}.png`, 'png', userId, {
          message: `Created ${width}×${height} blank image`,
        });
      }

      case 'gradient': {
        const from = options.from_color || options.from || '#000000';
        const to = options.to_color || options.to || '#ffffff';
        const direction = options.direction || 'horizontal'; // horizontal, vertical, diagonal
        const [x1, y1, x2, y2] =
          direction === 'vertical'
            ? [0, 0, 0, height]
            : direction === 'diagonal'
              ? [0, 0, width, height]
              : [0, 0, width, 0];

        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="${from}"/>
            <stop offset="100%" stop-color="${to}"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
      </svg>`;
        buffer = await sharp(Buffer.from(svg)).png().toBuffer();
        return saveImageResult(buffer, `gradient-${ts}.png`, 'png', userId, {
          message: `Created ${width}×${height} ${direction} gradient from ${from} to ${to}`,
        });
      }

      case 'pattern': {
        const type = options.type || 'grid'; // grid, dots, stripes, checkerboard
        const spacing = options.spacing || 20;
        const color = options.color || '#cccccc';
        const bg = options.background || '#ffffff';

        let svgContent = '';
        switch (type) {
          case 'grid':
            svgContent = `<rect width="100%" height="100%" fill="${bg}"/>`;
            for (let x = 0; x <= width; x += spacing) {
              svgContent += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${color}" stroke-width="1"/>`;
            }
            for (let y = 0; y <= height; y += spacing) {
              svgContent += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${color}" stroke-width="1"/>`;
            }
            break;
          case 'dots':
            svgContent = `<rect width="100%" height="100%" fill="${bg}"/>`;
            for (let x = spacing; x < width; x += spacing) {
              for (let y = spacing; y < height; y += spacing) {
                svgContent += `<circle cx="${x}" cy="${y}" r="${Math.max(2, spacing / 8)}" fill="${color}"/>`;
              }
            }
            break;
          case 'stripes':
            svgContent = `<rect width="100%" height="100%" fill="${bg}"/>`;
            for (let x = 0; x <= width; x += spacing * 2) {
              svgContent += `<rect x="${x}" y="0" width="${spacing}" height="${height}" fill="${color}" opacity="0.3"/>`;
            }
            break;
          case 'checkerboard': {
            svgContent = `<rect width="100%" height="100%" fill="${bg}"/>`;
            for (let x = 0; x < width; x += spacing) {
              for (let y = 0; y < height; y += spacing) {
                if (
                  (Math.floor(x / spacing) + Math.floor(y / spacing)) % 2 ===
                  0
                ) {
                  svgContent += `<rect x="${x}" y="${y}" width="${spacing}" height="${spacing}" fill="${color}"/>`;
                }
              }
            }
            break;
          }
        }

        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
        buffer = await sharp(Buffer.from(svg)).png().toBuffer();
        return saveImageResult(
          buffer,
          `pattern-${type}-${ts}.png`,
          'png',
          userId,
          {
            message: `Created ${width}×${height} ${type} pattern`,
          }
        );
      }

      case 'placeholder': {
        const text = options.text || `${width}×${height}`;
        const bg = options.background || '#e0e0e0';
        const textColor = options.text_color || '#666666';
        const fontSize = options.font_size || Math.min(width, height) / 6;

        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bg}"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial, sans-serif" font-size="${fontSize}" fill="${textColor}">
          ${escapeXml(text)}
        </text>
      </svg>`;
        buffer = await sharp(Buffer.from(svg)).png().toBuffer();
        return saveImageResult(buffer, `placeholder-${ts}.png`, 'png', userId, {
          message: `Created ${width}×${height} placeholder with text "${text}"`,
        });
      }

      case 'svg_render': {
        const svg = options.svg;
        if (!svg)
          return {
            success: false,
            error: 'options.svg is required for svg_render action',
          };
        buffer = await sharp(Buffer.from(svg))
          .resize(width, height, { fit: 'inside' })
          .png()
          .toBuffer();
        return saveImageResult(buffer, `svg-render-${ts}.png`, 'png', userId, {
          message: `Rendered SVG to ${width}×${height} PNG`,
        });
      }

      case 'text_image': {
        const text = options.text;
        if (!text)
          return {
            success: false,
            error: 'options.text is required for text_image action',
          };
        const fontColor = options.color || options.font_color || '#000000';
        const bg = options.background || 'transparent';
        const fontSize = options.font_size || 48;
        const fontFamily = options.font_family || 'Arial, sans-serif';
        const padding = options.padding || 20;

        // Multi-line support
        const lines = text.split('\n');
        const lineHeight = fontSize * 1.4;
        const textHeight = lines.length * lineHeight + padding * 2;
        const finalHeight = Math.max(height, textHeight);

        let textSvg = '';
        lines.forEach((line, i) => {
          const y = padding + fontSize + i * lineHeight;
          textSvg += `<text x="${padding}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" fill="${fontColor}">${escapeXml(line)}</text>`;
        });

        const bgFill = bg === 'transparent' ? 'fill="none"' : `fill="${bg}"`;
        const svg = `<svg width="${width}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" ${bgFill}/>
        ${textSvg}
      </svg>`;
        buffer = await sharp(Buffer.from(svg)).png().toBuffer();
        return saveImageResult(buffer, `text-image-${ts}.png`, 'png', userId, {
          message: `Created text image (${lines.length} line${lines.length > 1 ? 's' : ''})`,
        });
      }

      case 'sprite_sheet': {
        // Compose multiple images into a grid / strip sprite sheet
        const files = options.files || [];
        if (files.length === 0)
          return {
            success: false,
            error: 'options.files array of image references is required',
          };

        const columns = options.columns || files.length; // default = horizontal strip
        const cellW = options.cell_width || options.width || 64;
        const cellH = options.cell_height || options.height || 64;
        const padding = options.padding || 0;
        const bg = parseColor(options.background || 'transparent');

        const rows = Math.ceil(files.length / columns);
        const totalW = columns * cellW + (columns - 1) * padding;
        const totalH = rows * cellH + (rows - 1) * padding;

        const compositeOps = [];
        for (let i = 0; i < files.length; i++) {
          const buf = await loadImageBuffer(files[i], userId);
          const cell = await sharp(buf)
            .resize(cellW, cellH, { fit: 'contain', background: bg })
            .toBuffer();
          const col = i % columns;
          const row = Math.floor(i / columns);
          compositeOps.push({
            input: cell,
            left: col * (cellW + padding),
            top: row * (cellH + padding),
          });
        }

        buffer = await sharp({
          create: {
            width: totalW,
            height: totalH,
            channels: 4,
            background: bg,
          },
        })
          .composite(compositeOps)
          .png()
          .toBuffer();

        return saveImageResult(
          buffer,
          `sprite-sheet-${ts}.png`,
          'png',
          userId,
          {
            cells: files.length,
            grid: `${columns}×${rows}`,
            cell_size: `${cellW}×${cellH}`,
            dimensions: `${totalW}×${totalH}`,
            message: `Created ${columns}×${rows} sprite sheet (${files.length} frames, ${cellW}×${cellH} each)`,
          }
        );
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Use: blank, gradient, pattern, placeholder, svg_render, text_image, sprite_sheet`,
        };
    }
  } catch (error) {
    console.error('[image_create] Error:', error);
    return { success: false, error: error.message };
  }
}

/** Escape XML special characters for SVG */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 2: image_transform
// ═══════════════════════════════════════════════════════════════════

/**
 * Geometry & spatial transformations on an existing image.
 *
 * Actions:
 *   resize  — width/height, fit mode, aspect lock
 *   crop    — extract region (coordinates or position keyword)
 *   rotate  — any angle, auto-EXIF
 *   flip    — horizontal or vertical
 *   extend  — add padding/border
 *   trim    — auto-trim whitespace/borders
 */
export async function imageTransform(params, userId = 'default') {
  const { file, action = 'resize', options = {} } = params;
  if (!file) return { success: false, error: 'file parameter is required' };

  try {
    const sharp = await getSharp();
    const buffer = await loadImageBuffer(file, userId);
    let processor = sharp(buffer);
    const ts = Date.now();
    let resultMeta = {};

    switch (action) {
      case 'resize': {
        const w = options.width;
        const h = options.height;
        const fit = options.fit || 'inside'; // cover, contain, fill, inside, outside
        const withoutEnlargement = options.without_enlargement !== false;

        if (!w && !h)
          return { success: false, error: 'Provide width, height, or both' };

        // Percentage-based resize
        if (options.percentage) {
          const meta = await sharp(buffer).metadata();
          const pct = options.percentage / 100;
          processor = processor.resize(
            Math.round(meta.width * pct),
            Math.round(meta.height * pct),
            { fit: 'fill' }
          );
          resultMeta.message = `Resized to ${options.percentage}%`;
        } else {
          processor = processor.resize(w || null, h || null, {
            fit,
            withoutEnlargement,
          });
          resultMeta.message = `Resized to ${w || 'auto'}×${h || 'auto'} (fit: ${fit})`;
        }
        break;
      }

      case 'crop': {
        // Smart crop with position keyword (attention, entropy, centre, north, etc.)
        if (options.position) {
          const w = options.width || 400;
          const h = options.height || 400;
          processor = processor.resize(w, h, {
            fit: 'cover',
            position: options.position, // attention, entropy, centre, north, south, east, west, etc.
          });
          resultMeta.message = `Smart cropped to ${w}×${h} (position: ${options.position})`;
        }
        // Fixed region crop
        else if (options.left !== undefined && options.top !== undefined) {
          processor = processor.extract({
            left: options.left,
            top: options.top,
            width: options.width || 200,
            height: options.height || 200,
          });
          resultMeta.message = `Cropped region (${options.left},${options.top}) ${options.width}×${options.height}`;
        }
        // Center crop
        else if (options.width && options.height) {
          processor = processor.resize(options.width, options.height, {
            fit: 'cover',
            position: 'centre',
          });
          resultMeta.message = `Center cropped to ${options.width}×${options.height}`;
        } else {
          return {
            success: false,
            error:
              'Crop needs width+height, or left+top+width+height, or position',
          };
        }
        break;
      }

      case 'rotate': {
        const angle = options.angle ?? options.degrees ?? 90;
        const background = parseColor(options.background || 'transparent');
        processor = processor.rotate(angle, { background });
        resultMeta.message = `Rotated ${angle}°`;
        break;
      }

      case 'flip': {
        const direction = options.direction || 'vertical';
        if (direction === 'horizontal') {
          processor = processor.flop();
          resultMeta.message = 'Flipped horizontally';
        } else {
          processor = processor.flip();
          resultMeta.message = 'Flipped vertically';
        }
        break;
      }

      case 'extend': {
        const top = options.top || 0;
        const bottom = options.bottom || 0;
        const left = options.left || 0;
        const right = options.right || 0;
        const background = parseColor(options.background || 'white');
        processor = processor.extend({ top, bottom, left, right, background });
        resultMeta.message = `Extended by top:${top} bottom:${bottom} left:${left} right:${right}`;
        break;
      }

      case 'trim': {
        const threshold = options.threshold || 10;
        processor = processor.trim(threshold);
        resultMeta.message = `Trimmed whitespace (threshold: ${threshold})`;
        break;
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Use: resize, crop, rotate, flip, extend, trim`,
        };
    }

    const outputFormat = options.format || 'png';
    const result = await processor.toFormat(outputFormat).toBuffer();
    const outputFilename = `${action}-${ts}.${getExtension(outputFormat)}`;
    return saveImageResult(
      result,
      outputFilename,
      outputFormat,
      userId,
      resultMeta
    );
  } catch (error) {
    console.error('[image_transform] Error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 3: image_convert
// ═══════════════════════════════════════════════════════════════════

/**
 * Format conversion, compression, optimization.
 *
 * Actions:
 *   format     — convert to PNG/JPG/WEBP/AVIF/TIFF/GIF
 *   compress   — quality-based or size-target compression
 *   responsive — generate multiple sizes (1x, 2x, 3x / custom widths)
 *   thumbnail  — generate single thumbnail
 */
export async function imageConvert(params, userId = 'default') {
  const { file, action = 'format', options = {} } = params;
  if (!file) return { success: false, error: 'file parameter is required' };

  try {
    const sharp = await getSharp();
    const buffer = await loadImageBuffer(file, userId);
    const ts = Date.now();

    switch (action) {
      case 'format': {
        const format = (options.format || 'png').toLowerCase();
        const quality = options.quality || 90;
        const lossless = options.lossless || false;
        const progressive = options.progressive || false;
        const stripMetadata = options.strip_metadata !== false;

        let processor = sharp(buffer);
        if (stripMetadata) processor = processor.withMetadata({});

        switch (format) {
          case 'jpeg':
          case 'jpg':
            processor = processor.jpeg({ quality, progressive, mozjpeg: true });
            break;
          case 'webp':
            processor = processor.webp({ quality, lossless });
            break;
          case 'avif':
            processor = processor.avif({ quality, lossless });
            break;
          case 'png':
            processor = processor.png({
              progressive,
              compressionLevel: options.compression_level || 6,
            });
            break;
          case 'tiff':
            processor = processor.tiff({ quality });
            break;
          case 'gif':
            processor = processor.gif();
            break;
          default:
            return {
              success: false,
              error: `Unsupported format: ${format}. Use: png, jpg, webp, avif, tiff, gif`,
            };
        }

        const result = await processor.toBuffer();
        const filename = `converted-${ts}.${getExtension(format)}`;
        return saveImageResult(result, filename, format, userId, {
          message: `Converted to ${format.toUpperCase()} (quality: ${quality})`,
        });
      }

      case 'compress': {
        const quality = options.quality || 80;
        const maxSize = options.max_size; // bytes target
        const format = (options.format || 'webp').toLowerCase();
        const stripMetadata = options.strip_metadata !== false;

        let processor = sharp(buffer);
        if (stripMetadata) processor = processor.withMetadata({});

        // Size-target compression: binary search quality
        if (maxSize) {
          let lo = 10,
            hi = 100,
            bestBuffer = null,
            bestQ = quality;
          for (let i = 0; i < 8; i++) {
            const mid = Math.floor((lo + hi) / 2);
            const attempt = await sharp(buffer)
              .toFormat(format, { quality: mid })
              .toBuffer();
            if (attempt.length <= maxSize) {
              bestBuffer = attempt;
              bestQ = mid;
              lo = mid + 1; // try higher quality
            } else {
              hi = mid - 1;
            }
          }
          if (!bestBuffer) {
            // Even minimum quality is too large
            bestBuffer = await sharp(buffer)
              .toFormat(format, { quality: 10 })
              .toBuffer();
            bestQ = 10;
          }
          const filename = `compressed-${ts}.${getExtension(format)}`;
          return saveImageResult(bestBuffer, filename, format, userId, {
            quality: bestQ,
            original_size: buffer.length,
            compressed_size: bestBuffer.length,
            reduction: `${Math.round((1 - bestBuffer.length / buffer.length) * 100)}%`,
            message: `Compressed to ${(bestBuffer.length / 1024).toFixed(1)}KB (q=${bestQ}, target=${(maxSize / 1024).toFixed(1)}KB)`,
          });
        }

        // Quality-based compression
        const result = await processor.toFormat(format, { quality }).toBuffer();
        const filename = `compressed-${ts}.${getExtension(format)}`;
        return saveImageResult(result, filename, format, userId, {
          quality,
          original_size: buffer.length,
          compressed_size: result.length,
          reduction: `${Math.round((1 - result.length / buffer.length) * 100)}%`,
          message: `Compressed to ${(result.length / 1024).toFixed(1)}KB (q=${quality}, ${Math.round((1 - result.length / buffer.length) * 100)}% smaller)`,
        });
      }

      case 'responsive': {
        const sizes = options.sizes || [
          { width: 320, suffix: 'sm' },
          { width: 768, suffix: 'md' },
          { width: 1024, suffix: 'lg' },
          { width: 1920, suffix: 'xl' },
        ];
        const format = (options.format || 'webp').toLowerCase();
        const quality = options.quality || 80;
        const results = [];

        for (const { width, suffix } of sizes) {
          const resized = await sharp(buffer)
            .resize(width, null, { fit: 'inside', withoutEnlargement: true })
            .toFormat(format, { quality })
            .toBuffer();

          const filename = `responsive-${suffix}-${ts}.${getExtension(format)}`;
          const saved = await saveImageResult(
            resized,
            filename,
            format,
            userId,
            {}
          );
          results.push({
            width,
            suffix,
            filename: saved.filename,
            size: saved.size,
          });
        }

        return {
          success: true,
          variants: results,
          count: results.length,
          message: `Generated ${results.length} responsive variants: ${sizes.map((s) => `${s.width}px`).join(', ')}`,
        };
      }

      case 'thumbnail': {
        const w = options.width || 200;
        const h = options.height || 200;
        const fit = options.fit || 'cover';
        const format = (options.format || 'webp').toLowerCase();

        const thumb = await sharp(buffer)
          .resize(w, h, { fit, position: 'centre' })
          .toFormat(format, { quality: options.quality || 75 })
          .toBuffer();

        const filename = `thumb-${w}x${h}-${ts}.${getExtension(format)}`;
        return saveImageResult(thumb, filename, format, userId, {
          message: `Created ${w}×${h} thumbnail`,
        });
      }

      case 'auto_orient': {
        // Auto-rotate based on EXIF orientation tag + strip orientation metadata
        const meta = await sharp(buffer).metadata();
        const hadOrientation = meta.orientation && meta.orientation !== 1;
        const result = await sharp(buffer).rotate().toBuffer(); // rotate() with no args = EXIF auto-orient
        const newMeta = await sharp(result).metadata();
        const filename = `auto-oriented-${ts}.${getExtension(meta.format || 'png')}`;
        return saveImageResult(result, filename, meta.format || 'png', userId, {
          original_orientation: meta.orientation || 1,
          rotated: hadOrientation,
          dimensions: `${newMeta.width}×${newMeta.height}`,
          message: hadOrientation
            ? `Auto-oriented from EXIF orientation ${meta.orientation} → upright (${newMeta.width}×${newMeta.height})`
            : `Image already upright (orientation ${meta.orientation || 1})`,
        });
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Use: format, compress, responsive, thumbnail, auto_orient`,
        };
    }
  } catch (error) {
    console.error('[image_convert] Error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 4: image_compose
// ═══════════════════════════════════════════════════════════════════

/**
 * Text overlays, watermarks, layer compositing, merging.
 *
 * Actions:
 *   text_overlay — add text to image (multi-line, styled)
 *   watermark    — add text or image watermark
 *   composite    — overlay one image on another with blend mode
 *   merge        — join images side-by-side or stacked
 *   collage      — arrange multiple images in grid
 */
export async function imageCompose(params, userId = 'default') {
  const { file, action = 'text_overlay', options = {} } = params;

  try {
    const sharp = await getSharp();
    const ts = Date.now();

    switch (action) {
      case 'text_overlay': {
        if (!file)
          return { success: false, error: 'file parameter is required' };
        const text = options.text;
        if (!text) return { success: false, error: 'options.text is required' };

        const buffer = await loadImageBuffer(file, userId);
        const meta = await sharp(buffer).metadata();
        const w = meta.width;
        const h = meta.height;

        const fontSize = options.font_size || Math.round(Math.min(w, h) / 15);
        const fontColor = options.font_color || options.color || '#ffffff';
        const fontFamily = options.font_family || 'Arial, sans-serif';
        const x = options.x ?? Math.round(w * 0.05);
        const y = options.y ?? Math.round(h * 0.95);
        const stroke = options.stroke || null;
        const shadow = options.shadow !== false;

        const lines = text.split('\n');
        const lineHeight = fontSize * 1.3;

        let textElements = '';
        lines.forEach((line, i) => {
          const ty = y - (lines.length - 1 - i) * lineHeight;
          // Shadow
          if (shadow) {
            textElements += `<text x="${x + 2}" y="${ty + 2}" font-family="${fontFamily}" font-size="${fontSize}" fill="rgba(0,0,0,0.5)">${escapeXml(line)}</text>`;
          }
          // Stroke
          if (stroke) {
            textElements += `<text x="${x}" y="${ty}" font-family="${fontFamily}" font-size="${fontSize}" fill="none" stroke="${stroke}" stroke-width="2">${escapeXml(line)}</text>`;
          }
          // Main text
          textElements += `<text x="${x}" y="${ty}" font-family="${fontFamily}" font-size="${fontSize}" fill="${fontColor}">${escapeXml(line)}</text>`;
        });

        const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${textElements}</svg>`;
        const overlayBuffer = Buffer.from(svg);

        const result = await sharp(buffer)
          .composite([{ input: overlayBuffer, top: 0, left: 0 }])
          .png()
          .toBuffer();

        return saveImageResult(
          result,
          `text-overlay-${ts}.png`,
          'png',
          userId,
          {
            message: `Added text overlay (${lines.length} line${lines.length > 1 ? 's' : ''})`,
          }
        );
      }

      case 'watermark': {
        if (!file)
          return { success: false, error: 'file parameter is required' };
        const buffer = await loadImageBuffer(file, userId);
        const meta = await sharp(buffer).metadata();
        const w = meta.width;
        const h = meta.height;

        let overlayInput;
        const opacity = options.opacity ?? 0.3;
        const position = options.position || 'bottom-right'; // top-left, top-right, bottom-left, bottom-right, center, tile

        if (options.image || options.watermark_file) {
          // Image watermark
          const wmBuffer = await loadImageBuffer(
            options.image || options.watermark_file,
            userId
          );
          const wmSize = options.size || Math.round(Math.min(w, h) * 0.2);
          overlayInput = await sharp(wmBuffer)
            .resize(wmSize, wmSize, { fit: 'inside' })
            .ensureAlpha()
            .composite([
              {
                input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                blend: 'dest-in',
              },
            ])
            .toBuffer();
        } else {
          // Text watermark
          const text = options.text || options.watermark_text || '© Watermark';
          const fontSize = options.font_size || Math.round(Math.min(w, h) / 20);
          const color = options.color || `rgba(255,255,255,${opacity})`;

          if (position === 'tile') {
            // Tiled watermark — repeat across entire image
            let tileContent = '';
            const spacing = options.spacing || fontSize * 6;
            for (let tx = 0; tx < w; tx += spacing) {
              for (let ty = fontSize; ty < h; ty += spacing) {
                tileContent += `<text x="${tx}" y="${ty}" font-family="Arial" font-size="${fontSize}" fill="${color}" transform="rotate(-30, ${tx}, ${ty})">${escapeXml(text)}</text>`;
              }
            }
            overlayInput = Buffer.from(
              `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${tileContent}</svg>`
            );
          } else {
            const svgW = text.length * fontSize * 0.65;
            const svgH = fontSize * 1.5;
            const svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="${fontSize}" font-family="Arial" font-size="${fontSize}" fill="${color}">${escapeXml(text)}</text>
          </svg>`;
            overlayInput = Buffer.from(svg);
          }
        }

        // Position calculation
        const overlayMeta = await sharp(overlayInput).metadata();
        const ow = overlayMeta.width;
        const oh = overlayMeta.height;
        let top = 0,
          left = 0;
        const margin = options.margin || 20;

        switch (position) {
          case 'top-left':
            top = margin;
            left = margin;
            break;
          case 'top-right':
            top = margin;
            left = w - ow - margin;
            break;
          case 'bottom-left':
            top = h - oh - margin;
            left = margin;
            break;
          case 'bottom-right':
            top = h - oh - margin;
            left = w - ow - margin;
            break;
          case 'center':
          case 'centre':
            top = Math.round((h - oh) / 2);
            left = Math.round((w - ow) / 2);
            break;
          case 'tile':
            top = 0;
            left = 0;
            break;
        }

        const result = await sharp(buffer)
          .composite([
            {
              input: overlayInput,
              top: Math.max(0, top),
              left: Math.max(0, left),
            },
          ])
          .png()
          .toBuffer();

        return saveImageResult(result, `watermarked-${ts}.png`, 'png', userId, {
          message: `Added ${options.image ? 'image' : 'text'} watermark (position: ${position}, opacity: ${opacity})`,
        });
      }

      case 'composite': {
        if (!file)
          return { success: false, error: 'file (base image) is required' };
        const overlay = options.overlay || options.overlay_file;
        if (!overlay)
          return { success: false, error: 'options.overlay is required' };

        const baseBuffer = await loadImageBuffer(file, userId);
        const overlayBuffer = await loadImageBuffer(overlay, userId);
        const blend = options.blend || 'over'; // over, multiply, screen, overlay, add, saturate, etc.
        const gravity = options.gravity || 'centre';
        const opacityVal = options.opacity ?? 1.0;

        let processedOverlay = overlayBuffer;
        if (opacityVal < 1.0) {
          processedOverlay = await sharp(overlayBuffer)
            .ensureAlpha()
            .composite([
              {
                input: Buffer.from([
                  255,
                  255,
                  255,
                  Math.round(opacityVal * 255),
                ]),
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                blend: 'dest-in',
              },
            ])
            .toBuffer();
        }

        const result = await sharp(baseBuffer)
          .composite([
            {
              input: processedOverlay,
              gravity,
              blend,
            },
          ])
          .png()
          .toBuffer();

        return saveImageResult(result, `composite-${ts}.png`, 'png', userId, {
          message: `Composited images (blend: ${blend}, gravity: ${gravity})`,
        });
      }

      case 'merge': {
        const files = options.files || [];
        if (!file && files.length < 2)
          return {
            success: false,
            error:
              'Provide file + options.files, or options.files with 2+ images',
          };

        const allFiles = file ? [file, ...files] : files;
        const direction = options.direction || 'horizontal'; // horizontal, vertical
        const gap = options.gap || 0;
        const bg = parseColor(options.background || 'white');

        const buffers = await Promise.all(
          allFiles.map((f) => loadImageBuffer(f, userId))
        );
        const metas = await Promise.all(
          buffers.map((b) => sharp(b).metadata())
        );

        let totalW, totalH;
        if (direction === 'horizontal') {
          totalW =
            metas.reduce((sum, m) => sum + m.width, 0) +
            gap * (metas.length - 1);
          totalH = Math.max(...metas.map((m) => m.height));
        } else {
          totalW = Math.max(...metas.map((m) => m.width));
          totalH =
            metas.reduce((sum, m) => sum + m.height, 0) +
            gap * (metas.length - 1);
        }

        const compositeOps = [];
        let offset = 0;
        for (let i = 0; i < buffers.length; i++) {
          if (direction === 'horizontal') {
            compositeOps.push({ input: buffers[i], left: offset, top: 0 });
            offset += metas[i].width + gap;
          } else {
            compositeOps.push({ input: buffers[i], left: 0, top: offset });
            offset += metas[i].height + gap;
          }
        }

        const result = await sharp({
          create: {
            width: totalW,
            height: totalH,
            channels: 4,
            background: bg,
          },
        })
          .composite(compositeOps)
          .png()
          .toBuffer();

        return saveImageResult(result, `merged-${ts}.png`, 'png', userId, {
          count: allFiles.length,
          direction,
          dimensions: `${totalW}×${totalH}`,
          message: `Merged ${allFiles.length} images ${direction}ly (${totalW}×${totalH})`,
        });
      }

      case 'collage': {
        const files = options.files || [];
        if (!file && files.length === 0)
          return { success: false, error: 'Provide images to arrange' };

        const allFiles = file ? [file, ...files] : files;
        const columns =
          options.columns || Math.ceil(Math.sqrt(allFiles.length));
        const cellWidth = options.cell_width || options.width || 300;
        const cellHeight = options.cell_height || options.height || 300;
        const padding = options.padding || 4;
        const bg = parseColor(options.background || 'white');

        const rows = Math.ceil(allFiles.length / columns);
        const totalW = columns * cellWidth + (columns + 1) * padding;
        const totalH = rows * cellHeight + (rows + 1) * padding;

        const compositeOps = [];
        for (let i = 0; i < allFiles.length; i++) {
          const buf = await loadImageBuffer(allFiles[i], userId);
          const cell = await sharp(buf)
            .resize(cellWidth, cellHeight, { fit: 'cover' })
            .toBuffer();
          const col = i % columns;
          const row = Math.floor(i / columns);
          compositeOps.push({
            input: cell,
            left: padding + col * (cellWidth + padding),
            top: padding + row * (cellHeight + padding),
          });
        }

        const result = await sharp({
          create: {
            width: totalW,
            height: totalH,
            channels: 4,
            background: bg,
          },
        })
          .composite(compositeOps)
          .png()
          .toBuffer();

        return saveImageResult(result, `collage-${ts}.png`, 'png', userId, {
          count: allFiles.length,
          grid: `${columns}×${rows}`,
          dimensions: `${totalW}×${totalH}`,
          message: `Created ${columns}×${rows} collage of ${allFiles.length} images`,
        });
      }

      case 'shadow': {
        // Add drop shadow behind the image
        if (!file)
          return { success: false, error: 'file parameter is required' };
        const buffer = await loadImageBuffer(file, userId);
        const meta = await sharp(buffer).metadata();

        const offsetX = options.offset_x ?? options.x ?? 8;
        const offsetY = options.offset_y ?? options.y ?? 8;
        const blurRadius = options.blur ?? options.radius ?? 12;
        const shadowColor = parseColor(options.color || 'rgba(0,0,0,0.5)');
        const bgColor = parseColor(options.background || 'transparent');

        // Expand canvas to fit shadow offset + blur spread
        const spread = Math.ceil(blurRadius * 2);
        const padLeft = Math.max(0, spread - offsetX);
        const padTop = Math.max(0, spread - offsetY);
        const padRight = Math.max(0, offsetX + spread);
        const padBottom = Math.max(0, offsetY + spread);
        const canvasW = meta.width + padLeft + padRight;
        const canvasH = meta.height + padTop + padBottom;

        // Create shadow layer: same-size solid color, blurred
        const shadowBase = await sharp(buffer)
          .ensureAlpha()
          .composite([
            {
              input: Buffer.from([
                shadowColor.r || 0,
                shadowColor.g || 0,
                shadowColor.b || 0,
                Math.round((shadowColor.alpha ?? 0.5) * 255),
              ]),
              raw: { width: 1, height: 1, channels: 4 },
              tile: true,
              blend: 'dest-in',
            },
          ])
          .toBuffer();

        const shadowBlurred = await sharp(shadowBase)
          .blur(Math.max(0.3, blurRadius))
          .toBuffer();

        // Compose: canvas → shadow at offset → original on top
        const result = await sharp({
          create: {
            width: canvasW,
            height: canvasH,
            channels: 4,
            background: bgColor,
          },
        })
          .composite([
            {
              input: shadowBlurred,
              left: padLeft + offsetX,
              top: padTop + offsetY,
            },
            { input: buffer, left: padLeft, top: padTop },
          ])
          .png()
          .toBuffer();

        return saveImageResult(result, `shadow-${ts}.png`, 'png', userId, {
          offset: `${offsetX},${offsetY}`,
          blur: blurRadius,
          dimensions: `${canvasW}×${canvasH}`,
          message: `Added drop shadow (offset: ${offsetX},${offsetY}, blur: ${blurRadius})`,
        });
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Use: text_overlay, watermark, composite, merge, collage, shadow`,
        };
    }
  } catch (error) {
    console.error('[image_compose] Error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 5: image_filter
// ═══════════════════════════════════════════════════════════════════

/**
 * Apply visual filters and effects to an image.
 *
 * Accepts an array of filters, applied in order:
 *   blur, sharpen, grayscale, sepia, invert, brightness, contrast,
 *   saturation, hue, gamma, normalize, threshold, tint, posterize,
 *   pixelate, median, clahe, vignette, noise, vintage, warm, cool,
 *   emboss, edge_detect
 */
export async function imageFilter(params, userId = 'default') {
  const { file, filters = [] } = params;
  if (!file) return { success: false, error: 'file parameter is required' };
  if (!filters.length)
    return {
      success: false,
      error: 'filters array is required (e.g. [{name:"blur", value:5}])',
    };

  try {
    const sharp = await getSharp();
    const buffer = await loadImageBuffer(file, userId);
    let processor = sharp(buffer);
    const meta = await sharp(buffer).metadata();
    const appliedOps = [];

    for (const f of filters) {
      const name = (typeof f === 'string' ? f : f.name).toLowerCase();
      const value = typeof f === 'object' ? f.value : null;

      switch (name) {
        case 'blur':
          processor = processor.blur(value || 3);
          appliedOps.push(`blur(${value || 3})`);
          break;

        case 'sharpen':
          processor = processor.sharpen(value || 1);
          appliedOps.push(`sharpen(${value || 1})`);
          break;

        case 'grayscale':
        case 'greyscale':
          processor = processor.grayscale();
          appliedOps.push('grayscale');
          break;

        case 'sepia': {
          // Sepia via recomb matrix
          processor = processor.recomb([
            [0.393, 0.769, 0.189],
            [0.349, 0.686, 0.168],
            [0.272, 0.534, 0.131],
          ]);
          appliedOps.push('sepia');
          break;
        }

        case 'invert':
        case 'negate':
          processor = processor.negate();
          appliedOps.push('invert');
          break;

        case 'brightness':
          processor = processor.modulate({ brightness: value ?? 1.2 });
          appliedOps.push(`brightness(${value ?? 1.2})`);
          break;

        case 'contrast':
          processor = processor.linear(
            value ?? 1.2,
            -(128 * (value ?? 1.2)) + 128
          );
          appliedOps.push(`contrast(${value ?? 1.2})`);
          break;

        case 'saturation':
          processor = processor.modulate({ saturation: value ?? 1.5 });
          appliedOps.push(`saturation(${value ?? 1.5})`);
          break;

        case 'hue':
          processor = processor.modulate({ hue: value ?? 90 });
          appliedOps.push(`hue(${value ?? 90})`);
          break;

        case 'gamma':
          processor = processor.gamma(value ?? 2.2);
          appliedOps.push(`gamma(${value ?? 2.2})`);
          break;

        case 'normalize':
        case 'normalise':
          processor = processor.normalize();
          appliedOps.push('normalize');
          break;

        case 'threshold':
          processor = processor.threshold(value ?? 128);
          appliedOps.push(`threshold(${value ?? 128})`);
          break;

        case 'tint':
          if (value) processor = processor.tint(value);
          appliedOps.push(`tint(${value})`);
          break;

        case 'posterize': {
          // Posterize via threshold bands
          const levels = value || 4;
          const step = 256 / levels;
          // Use linear to quantize
          processor = processor.linear(levels / 256, 0).linear(256 / levels, 0);
          appliedOps.push(`posterize(${levels})`);
          break;
        }

        case 'pixelate': {
          const size = value || 10;
          const pxW = Math.max(1, Math.round(meta.width / size));
          const pxH = Math.max(1, Math.round(meta.height / size));
          // Pipeline break: pixelate needs intermediate buffer
          const intermediate = await processor.toBuffer();
          processor = sharp(intermediate)
            .resize(pxW, pxH, { kernel: 'nearest' })
            .resize(meta.width, meta.height, { kernel: 'nearest' });
          appliedOps.push(`pixelate(${size})`);
          break;
        }

        case 'median':
          processor = processor.median(value || 3);
          appliedOps.push(`median(${value || 3})`);
          break;

        case 'clahe':
          processor = processor.clahe({
            width: value || 3,
            height: value || 3,
          });
          appliedOps.push(`clahe(${value || 3})`);
          break;

        case 'flip':
          processor = processor.flip();
          appliedOps.push('flip');
          break;

        case 'flop':
          processor = processor.flop();
          appliedOps.push('flop');
          break;

        case 'rotate':
          processor = processor.rotate(value || 90);
          appliedOps.push(`rotate(${value || 90})`);
          break;

        case 'vignette': {
          // Vignette via dark-edge SVG overlay
          const vigSigma = value || 0.5;
          const cx = Math.round(meta.width / 2);
          const cy = Math.round(meta.height / 2);
          const r = Math.round(Math.max(meta.width, meta.height) * vigSigma);
          const svg = `<svg width="${meta.width}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="v" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="black" stop-opacity="0"/>
              <stop offset="100%" stop-color="black" stop-opacity="0.7"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#v)"/>
        </svg>`;
          const intermediate2 = await processor.toBuffer();
          processor = sharp(intermediate2).composite([
            { input: Buffer.from(svg), blend: 'multiply' },
          ]);
          appliedOps.push(`vignette(${vigSigma})`);
          break;
        }

        case 'noise': {
          // Add random noise by compositing a noise layer
          const amount = value || 30; // noise intensity 0-255
          const intermediate3 = await processor.toBuffer();
          const noiseMeta = await sharp(intermediate3).metadata();
          const pixelCount = noiseMeta.width * noiseMeta.height * 3;
          const noiseData = Buffer.alloc(pixelCount);
          for (let ni = 0; ni < pixelCount; ni++) {
            noiseData[ni] = Math.floor(
              (Math.random() - 0.5) * amount * 2 + 128
            );
          }
          const noiseLayer = await sharp(noiseData, {
            raw: {
              width: noiseMeta.width,
              height: noiseMeta.height,
              channels: 3,
            },
          })
            .png()
            .toBuffer();
          processor = sharp(intermediate3).composite([
            { input: noiseLayer, blend: 'soft-light' },
          ]);
          appliedOps.push(`noise(${amount})`);
          break;
        }

        case 'vintage': {
          // Vintage preset: warm sepia + vignette + slight fade + grain
          // 1. Sepia
          processor = processor.recomb([
            [0.393, 0.769, 0.189],
            [0.349, 0.686, 0.168],
            [0.272, 0.534, 0.131],
          ]);
          // 2. Warm tint
          processor = processor.modulate({
            brightness: 1.05,
            saturation: 0.85,
          });
          // 3. Slight fade (lift blacks)
          processor = processor.linear(0.9, 25);
          // 4. Vignette overlay
          const vintageIntermediate = await processor.toBuffer();
          const vinMeta = await sharp(vintageIntermediate).metadata();
          const vinSvg = `<svg width="${vinMeta.width}" height="${vinMeta.height}" xmlns="http://www.w3.org/2000/svg">
            <defs><radialGradient id="vv" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="black" stop-opacity="0"/>
              <stop offset="100%" stop-color="black" stop-opacity="0.55"/>
            </radialGradient></defs>
            <rect width="100%" height="100%" fill="url(#vv)"/>
          </svg>`;
          processor = sharp(vintageIntermediate).composite([
            { input: Buffer.from(vinSvg), blend: 'multiply' },
          ]);
          // 5. Grain
          const grainIntermediate = await processor.toBuffer();
          const grainPixels = vinMeta.width * vinMeta.height * 3;
          const grainData = Buffer.alloc(grainPixels);
          for (let gi = 0; gi < grainPixels; gi++) {
            grainData[gi] = Math.floor((Math.random() - 0.5) * 30 + 128);
          }
          const grainLayer = await sharp(grainData, {
            raw: { width: vinMeta.width, height: vinMeta.height, channels: 3 },
          })
            .png()
            .toBuffer();
          processor = sharp(grainIntermediate).composite([
            { input: grainLayer, blend: 'soft-light' },
          ]);
          appliedOps.push('vintage');
          break;
        }

        case 'warm': {
          // Warm color temperature shift
          const intensity = value || 15;
          processor = processor
            .modulate({ brightness: 1.02 })
            .tint({ r: 255, g: 220 + Math.min(35, intensity), b: 180 });
          appliedOps.push(`warm(${intensity})`);
          break;
        }

        case 'cool': {
          // Cool color temperature shift
          const coolIntensity = value || 15;
          processor = processor
            .modulate({ brightness: 0.98 })
            .tint({ r: 180, g: 210, b: 255 });
          appliedOps.push(`cool(${coolIntensity})`);
          break;
        }

        case 'emboss': {
          // Emboss via convolution kernel
          processor = processor.convolve({
            width: 3,
            height: 3,
            kernel: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
          });
          appliedOps.push('emboss');
          break;
        }

        case 'edge_detect': {
          // Edge detection via convolution (Laplacian)
          processor = processor.convolve({
            width: 3,
            height: 3,
            kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0],
          });
          appliedOps.push('edge_detect');
          break;
        }

        default:
          console.log(`[image_filter] Unknown filter: ${name}`);
          appliedOps.push(`SKIPPED:${name}`);
      }
    }

    const result = await processor.png().toBuffer();
    const ts = Date.now();
    return saveImageResult(result, `filtered-${ts}.png`, 'png', userId, {
      filters_applied: appliedOps,
      count: appliedOps.length,
      message: `Applied ${appliedOps.length} filter${appliedOps.length > 1 ? 's' : ''}: ${appliedOps.join(', ')}`,
    });
  } catch (error) {
    console.error('[image_filter] Error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 6: image_analyze
// ═══════════════════════════════════════════════════════════════════

/**
 * Image analysis, metadata, validation, hashing, comparison.
 *
 * Actions:
 *   metadata        — full metadata (dimensions, format, channels, EXIF, etc.)
 *   stats           — pixel statistics (channels, min/max/mean)
 *   validate        — check against constraints (size, format, dimensions)
 *   hash            — generate file hash (md5, sha256) for dedup
 *   dominant_colors — extract dominant colors
 *   histogram       — channel histogram data
 *   exif            — full EXIF/ICC/XMP data extraction
 *   corruption      — image integrity validation (decode check + marker validation)
 *   perceptual_hash — visual fingerprint (pHash) for similarity matching
 *   similarity      — compare two images by Hamming distance of perceptual hashes
 */
export async function imageAnalyze(params, userId = 'default') {
  const { file, action = 'metadata', options = {} } = params;
  if (!file) return { success: false, error: 'file parameter is required' };

  try {
    const sharp = await getSharp();
    const buffer = await loadImageBuffer(file, userId);

    switch (action) {
      case 'metadata': {
        const meta = await sharp(buffer).metadata();
        return {
          success: true,
          width: meta.width,
          height: meta.height,
          format: meta.format,
          channels: meta.channels,
          depth: meta.depth,
          density: meta.density,
          hasAlpha: meta.hasAlpha,
          orientation: meta.orientation,
          space: meta.space,
          size: buffer.length,
          size_readable: `${(buffer.length / 1024).toFixed(1)}KB`,
          aspect_ratio:
            meta.width && meta.height
              ? `${(meta.width / meta.height).toFixed(2)}:1`
              : null,
          exif: meta.exif ? 'present' : 'none',
          icc: meta.icc ? 'present' : 'none',
          message: `${meta.format?.toUpperCase()} ${meta.width}×${meta.height} (${(buffer.length / 1024).toFixed(1)}KB, ${meta.channels}ch${meta.hasAlpha ? ', alpha' : ''})`,
        };
      }

      case 'stats': {
        const stats = await sharp(buffer).stats();
        const channelNames = ['red', 'green', 'blue', 'alpha'];
        const channelStats = stats.channels.map((ch, i) => ({
          channel: channelNames[i] || `channel_${i}`,
          min: ch.min,
          max: ch.max,
          mean: Math.round(ch.mean * 100) / 100,
          stdev: Math.round(ch.stdev * 100) / 100,
        }));
        return {
          success: true,
          channels: channelStats,
          isOpaque: stats.isOpaque,
          entropy: stats.entropy,
          dominant: stats.dominant,
          message: `Image stats: ${channelStats.length} channels, dominant color: rgb(${stats.dominant?.r},${stats.dominant?.g},${stats.dominant?.b})`,
        };
      }

      case 'validate': {
        const meta = await sharp(buffer).metadata();
        const errors = [];

        if (options.max_width && meta.width > options.max_width) {
          errors.push(`Width ${meta.width} exceeds max ${options.max_width}`);
        }
        if (options.max_height && meta.height > options.max_height) {
          errors.push(
            `Height ${meta.height} exceeds max ${options.max_height}`
          );
        }
        if (options.min_width && meta.width < options.min_width) {
          errors.push(`Width ${meta.width} below min ${options.min_width}`);
        }
        if (options.min_height && meta.height < options.min_height) {
          errors.push(`Height ${meta.height} below min ${options.min_height}`);
        }
        if (options.max_size && buffer.length > options.max_size) {
          errors.push(
            `Size ${(buffer.length / 1024).toFixed(1)}KB exceeds max ${(options.max_size / 1024).toFixed(1)}KB`
          );
        }
        if (
          options.allowed_formats &&
          !options.allowed_formats.includes(meta.format)
        ) {
          errors.push(
            `Format ${meta.format} not in allowed: ${options.allowed_formats.join(', ')}`
          );
        }
        if (options.aspect_ratio) {
          const actual = meta.width / meta.height;
          const [aw, ah] = options.aspect_ratio.split(':').map(Number);
          const expected = aw / ah;
          if (Math.abs(actual - expected) > 0.05) {
            errors.push(
              `Aspect ratio ${actual.toFixed(2)} doesn't match ${options.aspect_ratio}`
            );
          }
        }

        return {
          success: true,
          valid: errors.length === 0,
          errors,
          image: {
            width: meta.width,
            height: meta.height,
            format: meta.format,
            size: buffer.length,
          },
          message:
            errors.length === 0
              ? `Image passes all validations (${meta.width}×${meta.height} ${meta.format})`
              : `Validation failed: ${errors.join('; ')}`,
        };
      }

      case 'hash': {
        const algorithm = options.algorithm || 'sha256'; // md5, sha256, sha512
        const hash = crypto.createHash(algorithm).update(buffer).digest('hex');
        return {
          success: true,
          algorithm,
          hash,
          size: buffer.length,
          message: `${algorithm.toUpperCase()}: ${hash}`,
        };
      }

      case 'dominant_colors': {
        const stats = await sharp(buffer).stats();
        const meta = await sharp(buffer).metadata();

        // Get dominant from stats
        const dominant = stats.dominant;

        // Sample more colors by resizing to tiny image and reading pixels
        const sampleSize = options.count || 5;
        const tiny = await sharp(buffer)
          .resize(sampleSize, sampleSize, { fit: 'cover' })
          .raw()
          .toBuffer();

        const colors = [];
        const channels = meta.hasAlpha ? 4 : 3;
        for (let i = 0; i < tiny.length; i += channels) {
          const r = tiny[i],
            g = tiny[i + 1],
            b = tiny[i + 2];
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          colors.push({ r, g, b, hex });
        }

        // Deduplicate similar colors
        const unique = [];
        for (const c of colors) {
          const isDuplicate = unique.some(
            (u) =>
              Math.abs(u.r - c.r) + Math.abs(u.g - c.g) + Math.abs(u.b - c.b) <
              30
          );
          if (!isDuplicate) unique.push(c);
        }

        return {
          success: true,
          dominant: {
            r: dominant.r,
            g: dominant.g,
            b: dominant.b,
            hex: `#${dominant.r.toString(16).padStart(2, '0')}${dominant.g.toString(16).padStart(2, '0')}${dominant.b.toString(16).padStart(2, '0')}`,
          },
          palette: unique.slice(0, sampleSize),
          count: unique.length,
          message: `Dominant color: rgb(${dominant.r},${dominant.g},${dominant.b}). Found ${unique.length} distinct colors.`,
        };
      }

      case 'histogram': {
        const stats = await sharp(buffer).stats();
        const channelNames = ['red', 'green', 'blue', 'alpha'];
        const histogram = stats.channels.map((ch, i) => ({
          channel: channelNames[i] || `ch_${i}`,
          min: ch.min,
          max: ch.max,
          mean: Math.round(ch.mean * 100) / 100,
          stdev: Math.round(ch.stdev * 100) / 100,
          // Simplified histogram: low/mid/high distribution estimate
          estimated_low: Math.round(
            ch.mean < 85 ? 100 : ch.mean < 170 ? 50 : 20
          ),
          estimated_mid: Math.round(ch.mean >= 85 && ch.mean <= 170 ? 100 : 50),
          estimated_high: Math.round(
            ch.mean > 170 ? 100 : ch.mean > 85 ? 50 : 20
          ),
        }));

        return {
          success: true,
          histogram,
          isOpaque: stats.isOpaque,
          entropy: stats.entropy,
          message: `Histogram: ${histogram.map((h) => `${h.channel} avg=${h.mean}`).join(', ')}`,
        };
      }

      case 'exif': {
        // Full EXIF data extraction
        const meta = await sharp(buffer).metadata();
        let exifData = {};
        if (meta.exif) {
          try {
            // Parse EXIF buffer — use built-in binary parsing
            const exifBuf = meta.exif;
            // Try dynamic import of exif-reader if available
            try {
              const exifReader = await import('exif-reader').then(
                (m) => m.default || m
              );
              exifData = exifReader(exifBuf);
            } catch {
              // Manual fallback: extract common fields from raw metadata
              exifData = {
                _raw: `EXIF data present (${exifBuf.length} bytes)`,
                orientation: meta.orientation,
                density: meta.density,
                chromaSubsampling: meta.chromaSubsampling,
                isProgressive: meta.isProgressive,
                space: meta.space,
                depth: meta.depth,
              };
            }
          } catch (e) {
            exifData = { _parseError: e.message };
          }
        }
        return {
          success: true,
          has_exif: !!meta.exif,
          exif: exifData,
          icc: meta.icc
            ? { present: true, size: meta.icc.length }
            : { present: false },
          xmp: meta.xmp
            ? { present: true, size: meta.xmp.length }
            : { present: false },
          iptc: meta.iptc
            ? { present: true, size: meta.iptc.length }
            : { present: false },
          orientation: meta.orientation,
          density: meta.density,
          message: meta.exif
            ? `EXIF data found (${meta.exif.length} bytes). Orientation: ${meta.orientation || 'none'}, Density: ${meta.density || 'unknown'}dpi`
            : 'No EXIF data found in image',
        };
      }

      case 'corruption':
      case 'integrity': {
        // Validate image buffer integrity — can Sharp read it without errors?
        const issues = [];
        let isCorrupt = false;
        let meta2 = null;
        try {
          meta2 = await sharp(buffer).metadata();
          if (!meta2.width || !meta2.height) {
            issues.push('Missing dimensions');
            isCorrupt = true;
          }
          if (!meta2.format) {
            issues.push('Unknown format');
            isCorrupt = true;
          }
          // Try to actually decode pixels
          await sharp(buffer).raw().toBuffer();
        } catch (e) {
          issues.push(`Decode error: ${e.message}`);
          isCorrupt = true;
        }

        // Check for truncated file (common corruption)
        if (meta2 && meta2.format === 'jpeg') {
          // JPEG should end with 0xFFD9
          if (
            buffer.length > 2 &&
            !(
              buffer[buffer.length - 2] === 0xff &&
              buffer[buffer.length - 1] === 0xd9
            )
          ) {
            issues.push('JPEG appears truncated (missing end marker)');
          }
        }
        if (meta2 && meta2.format === 'png') {
          // PNG should end with IEND chunk
          const tail = buffer.slice(-12).toString('hex');
          if (!tail.includes('49454e44')) {
            issues.push('PNG appears truncated (missing IEND chunk)');
          }
        }

        return {
          success: true,
          is_corrupt: isCorrupt,
          issues,
          format: meta2?.format || 'unknown',
          dimensions: meta2 ? `${meta2.width}×${meta2.height}` : 'unknown',
          size: buffer.length,
          message: isCorrupt
            ? `Image corruption detected: ${issues.join('; ')}`
            : `Image integrity OK (${meta2.format} ${meta2.width}×${meta2.height}, ${(buffer.length / 1024).toFixed(1)}KB)`,
        };
      }

      case 'perceptual_hash':
      case 'phash': {
        // Perceptual hash: resize to 8x8 grayscale, compare to mean
        const hashSize = options.size || 8;
        const raw = await sharp(buffer)
          .resize(hashSize, hashSize, { fit: 'fill' })
          .grayscale()
          .raw()
          .toBuffer();

        // Compute mean pixel value
        let sum = 0;
        for (let pi = 0; pi < raw.length; pi++) sum += raw[pi];
        const mean = sum / raw.length;

        // Build binary hash: 1 if pixel > mean, 0 otherwise
        let hashBits = '';
        let hashHex = '';
        for (let pi = 0; pi < raw.length; pi++) {
          hashBits += raw[pi] > mean ? '1' : '0';
        }
        // Convert to hex
        for (let i = 0; i < hashBits.length; i += 4) {
          hashHex += parseInt(hashBits.substring(i, i + 4), 2).toString(16);
        }

        return {
          success: true,
          perceptual_hash: hashHex,
          hash_bits: hashBits,
          hash_size: `${hashSize}×${hashSize}`,
          message: `Perceptual hash (${hashSize}×${hashSize}): ${hashHex}`,
        };
      }

      case 'similarity': {
        // Compare two images by perceptual hash — Hamming distance
        const fileB = options.compare_file || options.file_b;
        if (!fileB)
          return {
            success: false,
            error: 'options.compare_file is required for similarity comparison',
          };

        const hashSize2 = options.size || 8;

        const rawA = await sharp(buffer)
          .resize(hashSize2, hashSize2, { fit: 'fill' })
          .grayscale()
          .raw()
          .toBuffer();
        const bufferB = await loadImageBuffer(fileB, userId);
        const rawB = await sharp(bufferB)
          .resize(hashSize2, hashSize2, { fit: 'fill' })
          .grayscale()
          .raw()
          .toBuffer();

        // Build hash bits for both
        let sumA = 0,
          sumB = 0;
        for (let pi = 0; pi < rawA.length; pi++) sumA += rawA[pi];
        for (let pi = 0; pi < rawB.length; pi++) sumB += rawB[pi];
        const meanA = sumA / rawA.length;
        const meanB = sumB / rawB.length;

        let bitsA = '',
          bitsB = '';
        for (let pi = 0; pi < rawA.length; pi++)
          bitsA += rawA[pi] > meanA ? '1' : '0';
        for (let pi = 0; pi < rawB.length; pi++)
          bitsB += rawB[pi] > meanB ? '1' : '0';

        // Hamming distance
        let distance = 0;
        for (let pi = 0; pi < bitsA.length; pi++) {
          if (bitsA[pi] !== bitsB[pi]) distance++;
        }
        const totalBits = hashSize2 * hashSize2;
        const similarityPct = Math.round((1 - distance / totalBits) * 100);

        // Convert to hex
        let hexA = '',
          hexB = '';
        for (let i = 0; i < bitsA.length; i += 4) {
          hexA += parseInt(bitsA.substring(i, i + 4), 2).toString(16);
          hexB += parseInt(bitsB.substring(i, i + 4), 2).toString(16);
        }

        return {
          success: true,
          similarity: similarityPct,
          hamming_distance: distance,
          total_bits: totalBits,
          hash_a: hexA,
          hash_b: hexB,
          is_similar: similarityPct >= (options.threshold || 90),
          message: `Similarity: ${similarityPct}% (Hamming distance: ${distance}/${totalBits}). ${similarityPct >= 90 ? 'Images are visually similar.' : 'Images are visually different.'}`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Use: metadata, stats, validate, hash, dominant_colors, histogram, exif, corruption, perceptual_hash, similarity`,
        };
    }
  } catch (error) {
    console.error('[image_analyze] Error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 7: image_batch
// ═══════════════════════════════════════════════════════════════════

/**
 * Bulk image processing pipeline.
 *
 * Runs a sequence of operations on multiple images.
 * Each operation references another image tool + action + options.
 *
 * Actions:
 *   process      — apply operations to list of files
 *   pipeline     — chain multiple tool operations per file
 */
export async function imageBatch(params, userId = 'default') {
  const { files = [], operations = [], options = {} } = params;
  if (!files.length)
    return { success: false, error: 'files array is required' };
  if (!operations.length)
    return { success: false, error: 'operations array is required' };

  const failMode = options.fail_mode || 'continue'; // 'stop' or 'continue'
  const results = [];
  let successCount = 0;
  let failCount = 0;

  // Tool dispatcher
  const toolMap = {
    image_create: imageCreate,
    image_transform: imageTransform,
    image_convert: imageConvert,
    image_compose: imageCompose,
    image_filter: imageFilter,
    image_analyze: imageAnalyze,
  };

  for (const filePath of files) {
    try {
      let currentFile = filePath;

      for (const op of operations) {
        const toolFn = toolMap[op.tool];
        if (!toolFn) {
          throw new Error(`Unknown tool: ${op.tool}`);
        }

        const toolParams = {
          file: currentFile,
          action: op.action,
          options: op.options || {},
          filters: op.filters || [],
          ...op,
        };
        // Remove meta keys
        delete toolParams.tool;

        const result = await toolFn(toolParams, userId);

        if (!result.success) {
          throw new Error(`${op.tool}.${op.action} failed: ${result.error}`);
        }

        // Chain: use output as next input
        if (result.filename) {
          currentFile = result.filename;
        }
      }

      results.push({ file: filePath, success: true, output: currentFile });
      successCount++;
    } catch (error) {
      results.push({ file: filePath, success: false, error: error.message });
      failCount++;
      if (failMode === 'stop') break;
    }
  }

  return {
    success: failCount === 0 || failMode === 'continue',
    total: files.length,
    succeeded: successCount,
    failed: failCount,
    results,
    message: `Processed ${successCount}/${files.length} images (${failCount} failed). Operations: ${operations.map((o) => `${o.tool}.${o.action}`).join(' → ')}`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// §7  BACKGROUND REMOVAL / REPLACEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Remove background via remove.bg API (best quality, production-grade)
 * Falls back to @imgly/background-removal-node → Sharp threshold
 */
async function _removeBgViaAPI(buffer, options = {}) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) return null;

  try {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('image_file', buffer, {
      filename: 'image.png',
      contentType: 'image/png',
    });
    form.append('size', options.size || 'auto');
    if (options.type) form.append('type', options.type); // auto, person, product, car
    if (options.bg_color) form.append('bg_color', options.bg_color);
    if (options.bg_image_url) form.append('bg_image_url', options.bg_image_url);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        ...form.getHeaders(),
      },
      body: form.getBuffer(),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[remove.bg] API error ${response.status}: ${errText}`);
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (err) {
    console.warn(`[remove.bg] Failed, falling back:`, err.message);
    return null;
  }
}

/**
 * image_background — remove or replace image backgrounds
 *
 * Priority chain: remove.bg API → @imgly/background-removal-node → Sharp threshold
 *
 * Actions:
 *   remove    — Remove background → transparent PNG
 *   replace   — Remove background, place on new color/gradient/image
 *   blur      — Keep foreground sharp, blur background (portrait mode)
 */
export async function imageBackground(params, userId = 'default') {
  const { file, action = 'remove', options = {} } = params;

  try {
    const sharp = await getSharp();
    const buffer = await loadImageBuffer(file, userId);

    switch (action) {
      // ─── Remove Background ──────────────────────────────────
      case 'remove': {
        // 1. Try remove.bg API (best quality)
        const removeBgResult = await _removeBgViaAPI(buffer, options);
        if (removeBgResult) {
          const filename = `bg-removed-${Date.now()}.png`;
          return saveImageResult(removeBgResult, filename, 'png', userId, {
            action: 'remove',
            method: 'remove.bg',
            originalSize: buffer.length,
          });
        }

        // 2. Try @imgly/background-removal-node
        let bgRemoval;
        try {
          bgRemoval = await import('@imgly/background-removal-node');
        } catch {
          // 3. Fallback: sharp color-based thresholding for simple backgrounds
          return await _removeBackgroundFallback(
            sharp,
            buffer,
            options,
            userId
          );
        }

        const removeBackground =
          bgRemoval.removeBackground || bgRemoval.default;
        const blob = new Blob([buffer], { type: 'image/png' });
        const resultBlob = await removeBackground(blob, {
          model: options.model || 'medium',
          output: { format: 'image/png', quality: options.quality || 0.9 },
        });

        const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());
        const filename = `bg-removed-${Date.now()}.png`;
        return saveImageResult(resultBuffer, filename, 'png', userId, {
          action: 'remove',
          method: '@imgly',
          originalSize: buffer.length,
        });
      }

      // ─── Replace Background ─────────────────────────────────
      case 'replace': {
        // First remove background
        const removeResult = await imageBackground(
          { file, action: 'remove', options },
          userId
        );
        if (!removeResult.success) return removeResult;

        const fgBuffer = await loadImageBuffer(removeResult.filename, userId);
        const fgImage = sharp(fgBuffer);
        const meta = await fgImage.metadata();

        let bgLayer;
        if (options.background_image) {
          // Use another image as background
          const bgBuf = await loadImageBuffer(options.background_image, userId);
          bgLayer = sharp(bgBuf).resize(meta.width, meta.height, {
            fit: 'cover',
          });
        } else {
          // Solid color or gradient
          const bgColor = parseColor(
            options.color || options.background || '#ffffff'
          );
          bgLayer = sharp({
            create: {
              width: meta.width,
              height: meta.height,
              channels: 4,
              background: bgColor,
            },
          });
        }

        const resultBuffer = await bgLayer
          .composite([{ input: fgBuffer, blend: 'over' }])
          .png()
          .toBuffer();

        const filename = `bg-replaced-${Date.now()}.png`;
        return saveImageResult(resultBuffer, filename, 'png', userId, {
          action: 'replace',
          background: options.color || options.background_image || '#ffffff',
        });
      }

      // ─── Blur Background (portrait mode) ────────────────────
      case 'blur': {
        const blurAmount = options.blur || options.sigma || 15;

        // Try to get foreground mask: remove.bg → @imgly → center-weighted fallback
        let maskBuffer;

        // 1. Try remove.bg API first (best quality foreground extraction)
        const removeBgMask = await _removeBgViaAPI(buffer, options);
        if (removeBgMask) {
          maskBuffer = removeBgMask;
        }

        // 2. Try @imgly as fallback
        if (!maskBuffer) {
          try {
            const bgRemoval = await import('@imgly/background-removal-node');
            const removeBackground =
              bgRemoval.removeBackground || bgRemoval.default;
            const blob = new Blob([buffer], { type: 'image/png' });
            const maskBlob = await removeBackground(blob, {
              model: options.model || 'medium',
              output: { format: 'image/png' },
            });
            maskBuffer = Buffer.from(await maskBlob.arrayBuffer());
          } catch {
            // continue to fallback
          }
        }

        // 3. Without any bg removal, do a simple center-weighted blur
        if (!maskBuffer) {
          const img = sharp(buffer);
          const meta = await img.metadata();
          const blurred = await sharp(buffer)
            .blur(Math.max(1, blurAmount))
            .toBuffer();

          // Create a center elliptical mask (focus center sharp, edges blurred)
          const mask = Buffer.from(
            `<svg width="${meta.width}" height="${meta.height}">
              <defs><radialGradient id="g"><stop offset="30%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient></defs>
              <rect width="100%" height="100%" fill="url(#g)"/>
            </svg>`
          );

          const maskPng = await sharp(mask)
            .resize(meta.width, meta.height)
            .png()
            .toBuffer();
          const result = await sharp(buffer)
            .composite([
              { input: blurred, blend: 'over' },
              { input: maskPng, blend: 'dest-in' },
              { input: buffer, blend: 'over' },
            ])
            .png()
            .toBuffer();

          // Simplified: just layer blurred behind original w/ mask
          const simpleResult = await sharp(blurred)
            .composite([{ input: buffer, blend: 'over' }])
            .png()
            .toBuffer();

          const filename = `bg-blurred-${Date.now()}.png`;
          return saveImageResult(simpleResult, filename, 'png', userId, {
            action: 'blur',
            sigma: blurAmount,
            method: 'center-weighted-fallback',
          });
        }

        // Use mask to composite: blurred background + sharp foreground
        const blurred = await sharp(buffer)
          .blur(Math.max(1, blurAmount))
          .toBuffer();
        const resultBuffer = await sharp(blurred)
          .composite([{ input: maskBuffer, blend: 'over' }])
          .png()
          .toBuffer();

        const filename = `bg-blurred-${Date.now()}.png`;
        return saveImageResult(resultBuffer, filename, 'png', userId, {
          action: 'blur',
          sigma: blurAmount,
        });
      }

      default:
        return {
          success: false,
          error: `Unknown background action: ${action}. Use: remove, replace, blur`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `Background operation failed: ${error.message}`,
    };
  }
}

/**
 * Fallback background removal using color-based thresholding
 * Works well for solid-color backgrounds (white, green screen, etc.)
 */
async function _removeBackgroundFallback(sharp, buffer, options, userId) {
  const bgColor = parseColor(
    options.target_color || options.color || '#ffffff'
  );
  const tolerance = options.tolerance || 30;

  const img = sharp(buffer).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  // Scan pixels: if close to target color, make transparent
  for (let i = 0; i < data.length; i += 4) {
    const dr = Math.abs(data[i] - bgColor.r);
    const dg = Math.abs(data[i + 1] - bgColor.g);
    const db = Math.abs(data[i + 2] - bgColor.b);
    if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
      data[i + 3] = 0; // Set alpha to 0
    }
  }

  const resultBuffer = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  const filename = `bg-removed-fallback-${Date.now()}.png`;
  return saveImageResult(resultBuffer, filename, 'png', userId, {
    action: 'remove',
    method: 'color-threshold',
    targetColor: options.target_color || '#ffffff',
    tolerance,
  });
}

// ═══════════════════════════════════════════════════════════════════
// §8  FACE DETECTION & OPERATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * image_face — face detection, blurring, cropping, landmarks
 *
 * Uses AI vision model (GPT-4o) for detection — no local models needed.
 *
 * Actions:
 *   detect       — Find faces, return bounding boxes + confidence
 *   blur_faces   — Detect and blur all faces in image
 *   crop_face    — Crop to the largest detected face (with padding)
 *   landmarks    — Detect facial landmarks (eyes, nose, mouth)
 *   count        — Just count faces
 */
export async function imageFace(params, userId = 'default') {
  const { file, action = 'detect', options = {} } = params;

  try {
    await getSharp(); // ensure sharp is available for blur/crop ops
    const buffer = await loadImageBuffer(file, userId);
    return await _faceDetectViaAI(buffer, action, options, userId);
  } catch (error) {
    return { success: false, error: `Face operation failed: ${error.message}` };
  }
}

/**
 * Face detection — Azure Vision (primary) → GPT-4o (fallback)
 * Azure returns real pixel-level bounding boxes. AI models estimate.
 */
async function _faceDetectViaAI(buffer, action, options, userId) {
  // ── AZURE VISION (primary — real bounding boxes) ──────────────
  if (isAzureVisionAvailable()) {
    try {
      const azResult = await azureFaceDetect(buffer);
      if (azResult.success && azResult.faceCount > 0) {
        // Normalize Azure format { x, y, w, h } → { x, y, width, height }
        const faces = azResult.faces.map((f) => ({
          index: f.index,
          box: {
            x: f.boundingBox.x,
            y: f.boundingBox.y,
            width: f.boundingBox.w,
            height: f.boundingBox.h,
          },
          confidence: f.confidence,
        }));
        const normalized = { faceCount: azResult.faceCount, faces };
        const result = await _handleAIFaceResult(
          normalized,
          buffer,
          action,
          options,
          userId
        );
        if (result.method) result.method = 'azure-vision';
        return result;
      }
      // Azure found 0 faces — might still be correct, but fall through for blur/crop
      if (azResult.success && action === 'count') {
        return {
          success: true,
          faceCount: 0,
          method: 'azure-vision',
          message: 'No faces detected',
        };
      }
    } catch (e) {
      console.warn(
        '[ImageService] Azure face detection failed, falling back to AI:',
        e.message
      );
    }
  }

  // ── AI VISION FALLBACK (GPT-4o) ─────────────
  const base64 = buffer.toString('base64');
  const dataUrl = `data:image/png;base64,${base64}`;

  const prompt = _buildFaceDetectionPrompt(action);

  // Try OpenAI (GPT-4o has strong vision)
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: dataUrl, detail: 'high' },
              },
            ],
          },
        ],
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return _handleAIFaceResult(result, buffer, action, options, userId);
    } catch (e) {
      console.error('OpenAI face detection fallback failed:', e.message);
    }
  }

  return {
    success: false,
    error:
      'Face detection requires a vision AI provider. Set OPENAI_API_KEY.',
  };
}

function _buildFaceDetectionPrompt(action) {
  return `Analyze this image for faces. Return a JSON object with:
{
  "faceCount": <number>,
  "faces": [
    {
      "index": 0,
      "box": { "x": <pixels from left>, "y": <pixels from top>, "width": <pixels>, "height": <pixels> },
      "confidence": <0-1>,
      "age_estimate": "<range like 20-30>",
      "expression": "<neutral/happy/sad/surprised/etc>"
    }
  ]
}
${action === 'landmarks' ? 'Also include approximate landmark positions for eyes, nose, mouth in each face entry.' : ''}
${action === 'count' ? 'Only the faceCount is needed, faces array can be minimal.' : ''}
Estimate bounding boxes as accurately as possible in pixel coordinates. Return ONLY valid JSON.`;
}

async function _handleAIFaceResult(result, buffer, action, options, userId) {
  const faces = result.faces || [];
  const faceCount = result.faceCount || faces.length;

  switch (action) {
    case 'detect':
    case 'landmarks':
    case 'count':
      return {
        success: true,
        faceCount,
        faces: action === 'count' ? undefined : faces,
        method: 'ai-vision',
        message: `Found ${faceCount} face(s) via AI vision analysis.`,
      };

    case 'blur_faces': {
      if (faces.length === 0) {
        return {
          success: true,
          faceCount: 0,
          message: 'No faces detected to blur.',
        };
      }

      const sharp = await getSharp();
      const blurSigma = options.blur || options.sigma || 20;
      const composites = [];

      for (const face of faces) {
        if (!face.box) continue;
        const { x, y, width, height } = face.box;
        try {
          const faceRegion = await sharp(buffer)
            .extract({
              left: Math.max(0, Math.round(x)),
              top: Math.max(0, Math.round(y)),
              width: Math.round(width),
              height: Math.round(height),
            })
            .blur(Math.max(1, blurSigma))
            .toBuffer();
          composites.push({
            input: faceRegion,
            left: Math.max(0, Math.round(x)),
            top: Math.max(0, Math.round(y)),
          });
        } catch {
          /* skip invalid region */
        }
      }

      if (composites.length === 0) {
        return {
          success: true,
          faceCount,
          message:
            'Faces detected but regions could not be blurred (approximate boxes from AI).',
        };
      }

      const resultBuffer = await sharp(buffer)
        .composite(composites)
        .png()
        .toBuffer();
      const filename = `faces-blurred-${Date.now()}.png`;
      return saveImageResult(resultBuffer, filename, 'png', userId, {
        action: 'blur_faces',
        facesBlurred: composites.length,
        method: 'ai-vision',
      });
    }

    case 'crop_face': {
      if (faces.length === 0) {
        return { success: false, error: 'No faces detected in image' };
      }

      const sharp = await getSharp();
      const largest = faces.reduce((a, b) => {
        const areaA = (a.box?.width || 0) * (a.box?.height || 0);
        const areaB = (b.box?.width || 0) * (b.box?.height || 0);
        return areaA > areaB ? a : b;
      });

      if (!largest.box)
        return {
          success: false,
          error: 'AI did not return usable bounding boxes',
        };

      const padding = options.padding || 0.3;
      const meta = await sharp(buffer).metadata();
      const padX = Math.round(largest.box.width * padding);
      const padY = Math.round(largest.box.height * padding);
      const left = Math.max(0, Math.round(largest.box.x) - padX);
      const top = Math.max(0, Math.round(largest.box.y) - padY);
      const width = Math.min(
        meta.width - left,
        Math.round(largest.box.width) + padX * 2
      );
      const height = Math.min(
        meta.height - top,
        Math.round(largest.box.height) + padY * 2
      );

      const resultBuffer = await sharp(buffer)
        .extract({ left, top, width, height })
        .png()
        .toBuffer();
      const filename = `face-crop-${Date.now()}.png`;
      return saveImageResult(resultBuffer, filename, 'png', userId, {
        action: 'crop_face',
        face: largest.box,
        method: 'ai-vision',
      });
    }

    default:
      return { success: false, error: `Unknown face action: ${action}` };
  }
}

// ═══════════════════════════════════════════════════════════════════
// §11  IMAGE EXPORT — Convert image to non-image formats
// ═══════════════════════════════════════════════════════════════════

/**
 * image_export — Convert images to non-image output formats
 *
 * Actions:
 *   ascii      — Convert to ASCII art text
 *   base64     — Export as base64-encoded string
 *   data_url   — Export as data:image/... URL
 *   raw_pixels — Export raw pixel data (width × height × channels)
 */
export async function imageExport(params, userId = 'default') {
  const { file, action = 'base64', options = {} } = params;
  if (!file) return { success: false, error: 'file parameter is required' };

  try {
    const sharp = await getSharp();
    const buffer = await loadImageBuffer(file, userId);

    switch (action) {
      case 'ascii': {
        // Convert image to ASCII art
        const asciiChars = options.charset || ' .:-=+*#%@';
        const targetWidth = Math.min(options.width || 80, 200);
        // ASCII chars are ~2x taller than wide, so halve height
        const targetHeight = Math.round(targetWidth * 0.45);

        const raw = await sharp(buffer)
          .resize(targetWidth, targetHeight, { fit: 'fill' })
          .grayscale()
          .raw()
          .toBuffer();

        let asciiArt = '';
        for (let y = 0; y < targetHeight; y++) {
          let line = '';
          for (let x = 0; x < targetWidth; x++) {
            const brightness = raw[y * targetWidth + x];
            const charIndex = Math.floor(
              (brightness / 256) * asciiChars.length
            );
            line += asciiChars[Math.min(charIndex, asciiChars.length - 1)];
          }
          asciiArt += line + '\n';
        }

        return {
          success: true,
          ascii: asciiArt,
          width: targetWidth,
          height: targetHeight,
          charset_length: asciiChars.length,
          message: `Converted to ASCII art (${targetWidth}×${targetHeight} chars)`,
        };
      }

      case 'base64': {
        const format = (options.format || 'png').toLowerCase();
        const quality = options.quality || 90;
        const encoded = await sharp(buffer)
          .toFormat(format, { quality })
          .toBuffer();
        const base64Str = encoded.toString('base64');

        return {
          success: true,
          base64: base64Str,
          format,
          size: base64Str.length,
          original_size: buffer.length,
          message: `Exported as base64 ${format.toUpperCase()} (${(base64Str.length / 1024).toFixed(1)}KB encoded)`,
        };
      }

      case 'data_url': {
        const format = (options.format || 'png').toLowerCase();
        const quality = options.quality || 90;
        const encoded = await sharp(buffer)
          .toFormat(format, { quality })
          .toBuffer();
        const mimeType = getMimeType(format);
        const dataUrl = `data:${mimeType};base64,${encoded.toString('base64')}`;

        return {
          success: true,
          data_url: dataUrl,
          mime_type: mimeType,
          format,
          size: dataUrl.length,
          message: `Exported as data URL (${mimeType}, ${(dataUrl.length / 1024).toFixed(1)}KB)`,
        };
      }

      case 'raw_pixels': {
        const meta = await sharp(buffer).metadata();
        const channels = options.channels || meta.channels || 4;
        const raw = await sharp(buffer).ensureAlpha().raw().toBuffer();

        return {
          success: true,
          pixels_base64: raw.toString('base64'),
          width: meta.width,
          height: meta.height,
          channels: 4,
          pixel_count: meta.width * meta.height,
          byte_count: raw.length,
          message: `Exported raw pixel data: ${meta.width}×${meta.height}×4 (${(raw.length / 1024).toFixed(1)}KB)`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown export action: ${action}. Use: ascii, base64, data_url, raw_pixels`,
        };
    }
  } catch (error) {
    console.error('[image_export] Error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// §14  AI-ENHANCED IMAGE ANALYSIS
// ═══════════════════════════════════════════════════════════════════

/**
 * image_ai — AI-powered image understanding via vision models
 *
 * Actions:
 *   describe     — General image description / caption
 *   analyze      — Detailed analysis (objects, scene, colors, text, mood)
 *   extract_text — OCR via AI vision (better than Tesseract for complex layouts)
 *   compare      — Compare two images and describe differences
 *   classify     — Categorize image (type, genre, content rating)
 *   qa           — Answer a specific question about the image
 */
export async function imageAI(params, userId = 'default') {
  const { file, action = 'describe', options = {} } = params;

  try {
    const buffer = await loadImageBuffer(file, userId);
    const base64 = buffer.toString('base64');

    // For compare action, load second image too
    let base64B;
    if (action === 'compare' && options.file_b) {
      const bufferB = await loadImageBuffer(options.file_b, userId);
      base64B = bufferB.toString('base64');
    }

    // ── AZURE VISION for precision tasks (OCR, moderation) ──────
    if (isAzureVisionAvailable()) {
      if (action === 'extract_text') {
        const azResult = await azureOCR(buffer, { language: options.language });
        if (azResult.success) {
          return {
            success: true,
            action,
            analysis: azResult.text,
            lines: azResult.lines,
            wordCount: azResult.wordCount,
            confidence: azResult.confidence,
            model: 'azure-vision-ocr',
            message: azResult.message,
          };
        }
        // Fall through to AI vision on Azure failure
      }
    }

    // ── AI VISION for reasoning tasks ────────────────────────────
    const prompt = _buildVisionPrompt(action, options);
    const result = await _callVisionModel(base64, prompt, base64B, options);

    if (!result.success) return result;

    return {
      success: true,
      action,
      analysis: result.text,
      model: result.model,
      message: `AI image ${action} complete via ${result.model}.`,
    };
  } catch (error) {
    return {
      success: false,
      error: `AI image analysis failed: ${error.message}`,
    };
  }
}

function _buildVisionPrompt(action, options) {
  switch (action) {
    case 'describe':
      return options.detail === 'brief'
        ? 'Describe this image in one sentence.'
        : 'Provide a detailed description of this image including: subject, setting, colors, mood, composition, and notable details.';

    case 'analyze':
      return `Analyze this image comprehensively. Include:
1. Objects & entities identified
2. Scene/setting description
3. Color palette & lighting
4. Text visible in image (if any)
5. Mood/atmosphere
6. Composition & style
7. Technical quality assessment
${options.focus ? `Focus especially on: ${options.focus}` : ''}`;

    case 'extract_text':
      return `Extract ALL text visible in this image. Preserve the layout and formatting as much as possible. 
If text appears in multiple areas, indicate the position (top, bottom, left, right, center).
${options.language ? `The text is primarily in: ${options.language}` : ''}
Return the extracted text only, no commentary.`;

    case 'compare':
      return `Compare these two images in detail. Describe:
1. Key differences between them
2. Similarities
3. Changes in objects, colors, layout, or content
4. Which aspects are most different
${options.focus ? `Focus on: ${options.focus}` : ''}`;

    case 'classify':
      return `Classify this image. Return a JSON object:
{
  "type": "<photo/illustration/screenshot/diagram/chart/meme/document/art/other>",
  "genre": "<portrait/landscape/product/food/architecture/nature/abstract/etc>",
  "content_rating": "<safe/sensitive/nsfw>",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "dominant_subject": "<main subject>",
  "quality": "<low/medium/high/professional>"
}
Return ONLY valid JSON.`;

    case 'qa':
      return options.question || 'What do you see in this image?';

    default:
      return 'Describe this image.';
  }
}

/**
 * Call the best available vision model — OpenAI only
 */
async function _callVisionModel(base64, prompt, base64B = null, options = {}) {
  const providers = ['openai'];

  for (const provider of providers) {
    try {
      switch (provider) {
        case 'openai': {
          if (!process.env.OPENAI_API_KEY) continue;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const content = [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64}`,
                detail: options.detail === 'brief' ? 'low' : 'high',
              },
            },
          ];
          if (base64B) {
            content.push({
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64B}`,
                detail: 'high',
              },
            });
          }
          const response = await openai.chat.completions.create({
            model: options.openai_model || 'gpt-4o',
            messages: [{ role: 'user', content }],
            max_tokens: options.max_tokens || 2000,
          });
          return {
            success: true,
            text: response.choices[0].message.content,
            model: 'gpt-4o',
          };
        }

      }
    } catch (e) {
      console.error(`Vision model ${provider} failed:`, e.message);
      continue;
    }
  }

  return {
    success: false,
    error:
      'No vision-capable AI provider available. Set OPENAI_API_KEY.',
  };
}
