/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI CORE ROUTES
 * API endpoints for RAG operations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import ragEngine from '../services/rag-engine.js';

const router = express.Router();

// Initialize RAG service
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await ragEngine.initialize();
    initialized = true;
    console.log('[AI Core] ✅ RAG service initialized');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS & HEALTH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/ai-core/status
 * Get AI Core status including all services
 */
router.get('/status', async (req, res) => {
  try {
    await ensureInitialized();

    res.json({
      success: true,
      status: 'operational',
      version: '1.0.0',
      services: {
        rag: ragEngine.getStatus(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RAG ENGINE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ai-core/rag/index
 * Index a document into the vector store
 */
router.post('/rag/index', async (req, res) => {
  try {
    await ensureInitialized();

    const { content, title, source, agentId, userId, type, metadata } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    const result = await ragEngine.indexDocument(
      { content, title, source, agentId, userId, type },
      metadata,
    );

    res.json(result);
  } catch (error) {
    console.error('[AI Core] RAG index error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-core/rag/search
 * Search the vector store for relevant context
 */
router.post('/rag/search', async (req, res) => {
  try {
    await ensureInitialized();

    const { query, topK, agentId, userId, minScore } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const results = await ragEngine.searchContext(query, {
      topK,
      agentId,
      userId,
      minScore,
    });

    res.json(results);
  } catch (error) {
    console.error('[AI Core] RAG search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-core/rag/retrieve
 * Retrieve formatted context for LLM
 */
router.post('/rag/retrieve', async (req, res) => {
  try {
    await ensureInitialized();

    const { query, agentId, userId, topK } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const result = await ragEngine.retrieveForLLM(query, { agentId, userId, topK });

    res.json(result);
  } catch (error) {
    console.error('[AI Core] RAG retrieve error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/ai-core/rag/document/:documentId
 * Delete a document from the vector store
 */
router.delete('/rag/document/:documentId', async (req, res) => {
  try {
    await ensureInitialized();

    const { documentId } = req.params;

    const result = await ragEngine.deleteDocument(documentId);

    res.json(result);
  } catch (error) {
    console.error('[AI Core] RAG delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-core/rag/embedding
 * Generate embedding for text
 */
router.post('/rag/embedding', async (req, res) => {
  try {
    await ensureInitialized();

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    const result = await ragEngine.generateEmbedding(text);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[AI Core] Embedding error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
