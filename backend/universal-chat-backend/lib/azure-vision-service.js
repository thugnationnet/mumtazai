/**
 * AZURE COMPUTER VISION SERVICE
 *
 * Dedicated Azure Vision API client for precision tasks:
 *   - OCR / Read API (structured text extraction with bounding boxes)
 *   - Face detection (real pixel-level bounding boxes)
 *   - Object detection & tagging
 *   - Content moderation (NSFW, violence categories)
 *   - Image captioning
 *
 * GPT-4o stays king for reasoning (describe, compare, Q&A, classify).
 * Azure handles structured data tasks (OCR, faces, moderation).
 *
 * Endpoint: https://mumtaz-ai.cognitiveservices.azure.com/
 * Region: eastus
 * API Version: 2024-02-01 (Image Analysis 4.0)
 */

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY;
const AZURE_VISION_ENDPOINT =
  process.env.AZURE_VISION_ENDPOINT?.replace(/\/$/, '') ||
  'https://mumtaz-ai.cognitiveservices.azure.com';
const AZURE_VISION_REGION = process.env.AZURE_VISION_REGION || 'eastus';
const API_VERSION = '2024-02-01';

// Content Safety is a separate Azure resource
const AZURE_CONTENT_SAFETY_KEY = process.env.AZURE_CONTENT_SAFETY_KEY;
const AZURE_CONTENT_SAFETY_ENDPOINT =
  process.env.AZURE_CONTENT_SAFETY_ENDPOINT?.replace(/\/$/, '') ||
  'https://content-safety-mumtaz-ai.cognitiveservices.azure.com';

/**
 * Check if Azure Vision is configured
 */
export function isAzureVisionAvailable() {
  return !!(AZURE_VISION_KEY && AZURE_VISION_ENDPOINT);
}

// ═══════════════════════════════════════════════════════════════════
// CORE API CALL
// ═══════════════════════════════════════════════════════════════════

/**
 * Call Azure Image Analysis 4.0 API
 * @param {Buffer} imageBuffer - Image as buffer
 * @param {string[]} features - Visual features to analyze
 * @param {object} queryParams - Additional query parameters
 * @returns {object} Analysis result
 */
async function analyzeImage(
  imageBuffer,
  features = ['caption', 'tags'],
  queryParams = {}
) {
  if (!isAzureVisionAvailable()) {
    throw new Error(
      'Azure Vision not configured. Set AZURE_VISION_KEY and AZURE_VISION_ENDPOINT.'
    );
  }

  const params = new URLSearchParams({
    'api-version': API_VERSION,
    features: features.join(','),
    ...queryParams,
  });

  const url = `${AZURE_VISION_ENDPOINT}/computervision/imageanalysis:analyze?${params}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Azure Vision API error ${response.status}: ${error}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════
// OCR / READ API
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract text from image using Azure Read API (OCR)
 * Returns structured text with line-by-line bounding boxes and confidence.
 *
 * @param {Buffer} imageBuffer - Image as buffer
 * @param {object} options - { language?: string }
 * @returns {{ success, text, lines[], words[], confidence }}
 */
export async function azureOCR(imageBuffer, options = {}) {
  try {
    const result = await analyzeImage(imageBuffer, ['read'], {
      ...(options.language ? { language: options.language } : {}),
    });

    const readResult = result.readResult;
    if (!readResult || !readResult.blocks?.length) {
      return {
        success: true,
        text: '',
        lines: [],
        words: [],
        confidence: 0,
        provider: 'azure-vision',
        message: 'No text detected in image',
      };
    }

    // Flatten blocks → lines → words
    const lines = [];
    const words = [];
    let totalConfidence = 0;
    let wordCount = 0;

    for (const block of readResult.blocks) {
      for (const line of block.lines || []) {
        const lineWords = [];
        for (const word of line.words || []) {
          lineWords.push({
            text: word.text,
            confidence: word.confidence,
            boundingPolygon: word.boundingPolygon,
          });
          totalConfidence += word.confidence;
          wordCount++;
        }
        lines.push({
          text: line.text,
          boundingPolygon: line.boundingPolygon,
          words: lineWords,
        });
        words.push(...lineWords);
      }
    }

    const fullText = lines.map((l) => l.text).join('\n');
    const avgConfidence = wordCount > 0 ? totalConfidence / wordCount : 0;

    return {
      success: true,
      text: fullText,
      lines,
      words,
      wordCount,
      lineCount: lines.length,
      confidence: parseFloat(avgConfidence.toFixed(4)),
      provider: 'azure-vision',
      message: `Extracted ${wordCount} words from ${lines.length} lines (${(avgConfidence * 100).toFixed(1)}% confidence)`,
    };
  } catch (error) {
    console.error('[AzureVision] OCR error:', error.message);
    return { success: false, error: error.message, provider: 'azure-vision' };
  }
}

// ═══════════════════════════════════════════════════════════════════
// FACE DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Detect faces in image using Azure Face API via Image Analysis
 * Returns real bounding boxes with confidence.
 *
 * @param {Buffer} imageBuffer - Image as buffer
 * @returns {{ success, faces[], faceCount }}
 */
export async function azureFaceDetect(imageBuffer) {
  try {
    const result = await analyzeImage(imageBuffer, ['people']);

    const people = result.peopleResult?.values || [];

    const faces = people.map((person, i) => ({
      index: i,
      boundingBox: person.boundingBox, // { x, y, w, h } — real pixels
      confidence: person.confidence,
    }));

    return {
      success: true,
      faces,
      faceCount: faces.length,
      provider: 'azure-vision',
      message: `Detected ${faces.length} face(s)`,
    };
  } catch (error) {
    console.error('[AzureVision] Face detection error:', error.message);
    return { success: false, error: error.message, provider: 'azure-vision' };
  }
}

// ═══════════════════════════════════════════════════════════════════
// OBJECT DETECTION & TAGGING
// ═══════════════════════════════════════════════════════════════════

/**
 * Detect objects in image with bounding boxes.
 *
 * @param {Buffer} imageBuffer
 * @returns {{ success, objects[], tags[] }}
 */
export async function azureObjectDetect(imageBuffer) {
  try {
    const result = await analyzeImage(imageBuffer, ['objects', 'tags']);

    const objects = (result.objectsResult?.values || []).map((obj) => ({
      name: obj.tags?.[0]?.name || 'unknown',
      confidence: obj.tags?.[0]?.confidence || 0,
      boundingBox: obj.boundingBox, // { x, y, w, h }
    }));

    const tags = (result.tagsResult?.values || []).map((tag) => ({
      name: tag.name,
      confidence: tag.confidence,
    }));

    return {
      success: true,
      objects,
      objectCount: objects.length,
      tags,
      tagCount: tags.length,
      provider: 'azure-vision',
      message: `Detected ${objects.length} objects, ${tags.length} tags`,
    };
  } catch (error) {
    console.error('[AzureVision] Object detection error:', error.message);
    return { success: false, error: error.message, provider: 'azure-vision' };
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONTENT MODERATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Content safety / moderation check via Azure Content Safety API
 * Falls back to Image Analysis tags if Content Safety not available.
 *
 * @param {Buffer} imageBuffer
 * @returns {{ success, safe, categories, severity }}
 */
export async function azureModerate(imageBuffer) {
  // Try Azure Content Safety API first
  try {
    const csKey = AZURE_CONTENT_SAFETY_KEY || AZURE_VISION_KEY;
    const csEndpoint = AZURE_CONTENT_SAFETY_ENDPOINT || AZURE_VISION_ENDPOINT;
    const url = `${csEndpoint}/contentsafety/image:analyze?api-version=2024-09-01`;

    const base64Image = imageBuffer.toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': csKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: { content: base64Image },
        categories: ['Hate', 'SelfHarm', 'Sexual', 'Violence'],
        outputType: 'FourSeverityLevels',
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const categories = {};
      let maxSeverity = 0;

      for (const cat of result.categoriesAnalysis || []) {
        categories[cat.category.toLowerCase()] = {
          severity: cat.severity,
          detected: cat.severity > 0,
        };
        maxSeverity = Math.max(maxSeverity, cat.severity);
      }

      const ratingMap = { 0: 'safe', 2: 'mild', 4: 'moderate', 6: 'severe' };
      const rating =
        maxSeverity >= 6
          ? 'severe'
          : maxSeverity >= 4
            ? 'moderate'
            : maxSeverity >= 2
              ? 'mild'
              : 'safe';

      return {
        success: true,
        safe: maxSeverity < 2,
        rating,
        maxSeverity,
        categories,
        provider: 'azure-content-safety',
        message: `Content moderation: ${rating}`,
      };
    }
  } catch (error) {
    console.warn(
      '[AzureVision] Content Safety API unavailable, falling back to tag analysis:',
      error.message
    );
  }

  // Fallback: Use Image Analysis tags to infer safety
  try {
    const result = await analyzeImage(imageBuffer, ['tags', 'caption']);

    const tags = (result.tagsResult?.values || []).map((t) =>
      t.name.toLowerCase()
    );
    const nsfw_keywords = [
      'nudity',
      'lingerie',
      'bikini',
      'underwear',
      'adult',
      'explicit',
      'sexual',
    ];
    const violence_keywords = [
      'weapon',
      'gun',
      'blood',
      'violence',
      'fight',
      'knife',
      'sword',
    ];

    const nsfw = tags.some((t) => nsfw_keywords.some((k) => t.includes(k)));
    const violence = tags.some((t) =>
      violence_keywords.some((k) => t.includes(k))
    );

    return {
      success: true,
      safe: !nsfw && !violence,
      rating: nsfw || violence ? 'mild' : 'safe',
      categories: {
        sexual: { detected: nsfw, severity: nsfw ? 2 : 0 },
        violence: { detected: violence, severity: violence ? 2 : 0 },
        hate: { detected: false, severity: 0 },
        selfharm: { detected: false, severity: 0 },
      },
      tags,
      provider: 'azure-vision-tags',
      message: `Content moderation via tag analysis: ${nsfw || violence ? 'flagged' : 'safe'}`,
    };
  } catch (error) {
    console.error('[AzureVision] Moderation fallback error:', error.message);
    return { success: false, error: error.message, provider: 'azure-vision' };
  }
}

// ═══════════════════════════════════════════════════════════════════
// IMAGE CAPTIONING
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a caption for an image.
 *
 * @param {Buffer} imageBuffer
 * @param {object} options - { dense?: boolean }
 * @returns {{ success, caption, confidence }}
 */
export async function azureCaption(imageBuffer, options = {}) {
  try {
    const features = options.dense ? ['denseCaptions'] : ['caption'];
    const result = await analyzeImage(imageBuffer, features);

    if (options.dense) {
      const captions = (result.denseCaptionsResult?.values || []).map((c) => ({
        text: c.text,
        confidence: c.confidence,
        boundingBox: c.boundingBox,
      }));

      return {
        success: true,
        captions,
        count: captions.length,
        provider: 'azure-vision',
        message: `Generated ${captions.length} dense captions`,
      };
    }

    const caption = result.captionResult;
    return {
      success: true,
      caption: caption?.text || '',
      confidence: caption?.confidence || 0,
      provider: 'azure-vision',
      message: `Caption: "${caption?.text}" (${((caption?.confidence || 0) * 100).toFixed(1)}% confidence)`,
    };
  } catch (error) {
    console.error('[AzureVision] Caption error:', error.message);
    return { success: false, error: error.message, provider: 'azure-vision' };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SMART CROP
// ═══════════════════════════════════════════════════════════════════

/**
 * Get smart crop suggestions for specific aspect ratios.
 *
 * @param {Buffer} imageBuffer
 * @param {object} options - { aspectRatios: ['1.0', '0.5625'] }
 * @returns {{ success, crops[] }}
 */
export async function azureSmartCrop(imageBuffer, options = {}) {
  try {
    const aspectRatios = options.aspectRatios || ['1.0', '0.5625', '1.7778'];

    const result = await analyzeImage(imageBuffer, ['smartCrops'], {
      'smartcrops-aspect-ratios': aspectRatios.join(','),
    });

    const crops = (result.smartCropsResult?.values || []).map((c) => ({
      aspectRatio: c.aspectRatio,
      boundingBox: c.boundingBox, // { x, y, w, h }
    }));

    return {
      success: true,
      crops,
      count: crops.length,
      provider: 'azure-vision',
      message: `Generated ${crops.length} smart crop suggestions`,
    };
  } catch (error) {
    console.error('[AzureVision] Smart crop error:', error.message);
    return { success: false, error: error.message, provider: 'azure-vision' };
  }
}

// ═══════════════════════════════════════════════════════════════════
// FULL ANALYSIS (all features at once)
// ═══════════════════════════════════════════════════════════════════

/**
 * Run comprehensive analysis — caption + tags + objects + people + read in one call.
 *
 * @param {Buffer} imageBuffer
 * @returns {object} Combined results
 */
export async function azureFullAnalysis(imageBuffer) {
  try {
    const result = await analyzeImage(imageBuffer, [
      'caption',
      'tags',
      'objects',
      'people',
      'read',
    ]);

    return {
      success: true,
      caption: result.captionResult?.text || '',
      captionConfidence: result.captionResult?.confidence || 0,
      tags: (result.tagsResult?.values || []).map((t) => ({
        name: t.name,
        confidence: t.confidence,
      })),
      objects: (result.objectsResult?.values || []).map((o) => ({
        name: o.tags?.[0]?.name || 'unknown',
        confidence: o.tags?.[0]?.confidence || 0,
        boundingBox: o.boundingBox,
      })),
      people: (result.peopleResult?.values || []).map((p) => ({
        boundingBox: p.boundingBox,
        confidence: p.confidence,
      })),
      text:
        result.readResult?.blocks
          ?.flatMap((b) => (b.lines || []).map((l) => l.text))
          .join('\n') || '',
      imageSize: result.metadata,
      provider: 'azure-vision',
      message: 'Full Azure Vision analysis complete',
    };
  } catch (error) {
    console.error('[AzureVision] Full analysis error:', error.message);
    return { success: false, error: error.message, provider: 'azure-vision' };
  }
}
