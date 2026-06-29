/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MEDIA PROCESSING API ROUTES
 * Endpoints for image/video/audio processing used by AI agents
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import multer from 'multer';
import mediaService from '../services/media-service.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

/**
 * GET /api/media/status
 * Check media processing capabilities
 */
router.get('/status', (req, res) => {
  try {
    const status = mediaService.getServiceStatus();
    res.json({
      success: true,
      capabilities: status,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/media/generate-image
 * Generate image using DALL-E 3
 */
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, size, quality, style, n } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const result = await mediaService.generateImage(prompt, { size, quality, style, n });
    res.json(result);
  } catch (error) {
    console.error('[MediaAPI] Generate image error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/media/edit-image
 * Edit an image with DALL-E
 */
router.post('/edit-image', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mask', maxCount: 1 },
]), async (req, res) => {
  try {
    const { prompt, size, n } = req.body;
    const imageFile = req.files?.image?.[0];
    const maskFile = req.files?.mask?.[0];

    if (!imageFile || !prompt) {
      return res.status(400).json({ success: false, error: 'Image and prompt are required' });
    }

    const result = await mediaService.editImage(
      imageFile.buffer,
      prompt,
      maskFile?.buffer,
      { size, n },
    );
    res.json(result);
  } catch (error) {
    console.error('[MediaAPI] Edit image error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/media/variation
 * Create variations of an image
 */
router.post('/variation', upload.single('image'), async (req, res) => {
  try {
    const { size, n } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image is required' });
    }

    const result = await mediaService.createImageVariation(req.file.buffer, { size, n });
    res.json(result);
  } catch (error) {
    console.error('[MediaAPI] Image variation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/media/process-image
 * Process image (resize, convert, transform)
 */
router.post('/process-image', upload.single('image'), async (req, res) => {
  try {
    let operations = {};
    
    // Parse operations from body
    if (req.body.operations) {
      operations = typeof req.body.operations === 'string' 
        ? JSON.parse(req.body.operations) 
        : req.body.operations;
    } else {
      // Individual params
      const { resize, format, quality, rotate, flip, flop, grayscale, blur, sharpen, crop } = req.body;
      if (resize) operations.resize = typeof resize === 'string' ? JSON.parse(resize) : resize;
      if (format) operations.format = format;
      if (quality) operations.quality = parseInt(quality);
      if (rotate) operations.rotate = parseInt(rotate);
      if (flip) operations.flip = flip === 'true';
      if (flop) operations.flop = flop === 'true';
      if (grayscale) operations.grayscale = grayscale === 'true';
      if (blur) operations.blur = parseFloat(blur);
      if (sharpen) operations.sharpen = sharpen === 'true';
      if (crop) operations.crop = typeof crop === 'string' ? JSON.parse(crop) : crop;
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image is required' });
    }

    const result = await mediaService.processImage(req.file.buffer, operations);
    
    // Return processed image
    res.set('Content-Type', `image/${result.metadata.format}`);
    res.set('X-Image-Width', result.metadata.width);
    res.set('X-Image-Height', result.metadata.height);
    res.set('X-Image-Size', result.metadata.size);
    res.send(result.buffer);
  } catch (error) {
    console.error('[MediaAPI] Process image error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/media/convert
 * Convert image format
 */
router.post('/convert', upload.single('image'), async (req, res) => {
  try {
    const { format, quality } = req.body;

    if (!req.file || !format) {
      return res.status(400).json({ success: false, error: 'Image and target format are required' });
    }

    const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif'];
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid format. Supported: ${validFormats.join(', ')}`, 
      });
    }

    const result = await mediaService.convertImageFormat(
      req.file.buffer, 
      format.toLowerCase(), 
      quality ? parseInt(quality) : 80,
    );
    
    // Return converted image
    const mimeTypes = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      avif: 'image/avif',
    };
    
    res.set('Content-Type', mimeTypes[format.toLowerCase()]);
    res.set('Content-Disposition', `attachment; filename="converted.${format.toLowerCase()}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('[MediaAPI] Convert image error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/media/analyze
 * Get image metadata and analysis
 */
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image is required' });
    }

    const result = await mediaService.analyzeImage(req.file.buffer);
    res.json(result);
  } catch (error) {
    console.error('[MediaAPI] Analyze image error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/media/resize
 * Quick resize endpoint
 */
router.post('/resize', upload.single('image'), async (req, res) => {
  try {
    const { width, height, fit, format } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image is required' });
    }

    if (!width && !height) {
      return res.status(400).json({ success: false, error: 'Width or height is required' });
    }

    const result = await mediaService.processImage(req.file.buffer, {
      resize: {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        fit: fit || 'contain',
      },
      format: format || undefined,
    });
    
    res.set('Content-Type', `image/${result.metadata.format}`);
    res.send(result.buffer);
  } catch (error) {
    console.error('[MediaAPI] Resize error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/media/download-and-convert
 * Download image from URL and convert
 */
router.post('/download-and-convert', async (req, res) => {
  try {
    const { url, format, quality, resize } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    // Download image
    const downloaded = await mediaService.downloadImage(url);
    
    // Process if needed
    if (format || resize) {
      const operations = {};
      if (format) operations.format = format;
      if (quality) operations.quality = parseInt(quality);
      if (resize) operations.resize = typeof resize === 'string' ? JSON.parse(resize) : resize;
      
      const result = await mediaService.processImage(downloaded.buffer, operations);
      
      res.set('Content-Type', `image/${result.metadata.format}`);
      res.send(result.buffer);
    } else {
      res.set('Content-Type', downloaded.mimeType);
      res.send(downloaded.buffer);
    }
  } catch (error) {
    console.error('[MediaAPI] Download and convert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
