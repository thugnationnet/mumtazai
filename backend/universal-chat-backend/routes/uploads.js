/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UPLOADS API ROUTES
 * Endpoints for file uploads and image proxy downloads
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import https from 'https';
import http from 'http';

const router = express.Router();

/**
 * GET /api/uploads/proxy-download
 * Proxy download for images to bypass CORS restrictions
 * Used for downloading AI-generated images from external sources
 */
router.get('/proxy-download', async (req, res) => {
  try {
    const { url, filename } = req.query;

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL parameter is required', 
      });
    }

    const decodedUrl = decodeURIComponent(url);
    const downloadFilename = filename ? decodeURIComponent(filename) : 'download.png';

    // Handle base64 data URLs
    if (decodedUrl.startsWith('data:')) {
      try {
        const matches = decodedUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid data URL format', 
          });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
      } catch (err) {
        console.error('Error processing data URL:', err);
        return res.status(400).json({ 
          success: false, 
          error: 'Failed to process data URL', 
        });
      }
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(decodedUrl);
    } catch (_err) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format', 
      });
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Only HTTP and HTTPS URLs are supported', 
      });
    }

    // Whitelist allowed domains for security
    const allowedDomains = [
      'oaidalleapiprodscus.blob.core.windows.net', // OpenAI DALL-E
      'images.openai.com',
      'openai.com',
      's3.amazonaws.com',
      's3.ap-southeast-1.amazonaws.com',
      'mumtaz-ai-bucket.s3.ap-southeast-1.amazonaws.com',
      'replicate.delivery',
      'pbxt.replicate.delivery',
      'cdn.midjourney.com',
      'stability.ai',
      'api.stability.ai',
      'together.ai',
      'api.together.ai',
    ];

    const isAllowed = allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain),
    );

    if (!isAllowed) {
      console.warn(`Proxy download blocked for unauthorized domain: ${parsedUrl.hostname}`);
      return res.status(403).json({ 
        success: false, 
        error: 'Domain not allowed for proxy downloads', 
      });
    }

    // Proxy the request
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const proxyReq = protocol.get(decodedUrl, {
      headers: {
        'User-Agent': 'MumtazAI-ImageProxy/1.0',
        'Accept': 'image/*,*/*',
      },
      timeout: 30000, // 30 second timeout
    }, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        console.error(`Proxy download failed with status ${proxyRes.statusCode} for URL: ${decodedUrl}`);
        return res.status(proxyRes.statusCode).json({ 
          success: false, 
          error: `Remote server returned status ${proxyRes.statusCode}`, 
        });
      }

      // Get content type from response or default to image/png
      const contentType = proxyRes.headers['content-type'] || 'image/png';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      
      if (proxyRes.headers['content-length']) {
        res.setHeader('Content-Length', proxyRes.headers['content-length']);
      }

      // Pipe the response
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to download from remote server', 
        });
      }
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ 
          success: false, 
          error: 'Request timed out', 
        });
      }
    });

  } catch (error) {
    console.error('Proxy download error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error', 
    });
  }
});

/**
 * GET /api/uploads/status
 * Check uploads service status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    capabilities: {
      proxyDownload: true,
      maxProxySize: '50MB',
      supportedProtocols: ['http', 'https', 'data-url'],
    },
  });
});

export default router;
