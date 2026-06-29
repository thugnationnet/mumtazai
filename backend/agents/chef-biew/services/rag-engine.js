/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RAG ENGINE - Retrieval Augmented Generation
 * Vector storage, document processing, and context retrieval for AI agents
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import crypto from 'crypto';

// Initialize clients
let pinecone = null;
let openai = null;

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'agent-knowledge';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// Chunk configuration
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

/**
 * Initialize the RAG Engine
 */
export async function initializeRAG() {
  try {
    // Initialize OpenAI for embeddings
    if (process.env.OPENAI_API_KEY) {
      openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    // Initialize Pinecone
    if (process.env.PINECONE_API_KEY) {
      pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });
      console.log('[RAG] Pinecone initialized');
      
      // Ensure index exists
      await ensureIndexExists();
    } else {
      console.warn('[RAG] ⚠️ Pinecone API key not configured - using in-memory fallback');
    }

    return { success: true, pinecone: !!pinecone, openai: !!openai };
  } catch (error) {
    console.error('[RAG] Initialization error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Ensure Pinecone index exists
 */
async function ensureIndexExists() {
  if (!pinecone) return;

  try {
    const indexes = await pinecone.listIndexes();
    const indexExists = indexes.indexes?.some(idx => idx.name === PINECONE_INDEX_NAME);

    if (!indexExists) {
      await pinecone.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: EMBEDDING_DIMENSIONS,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
    }
  } catch (error) {
    console.error('[RAG] Index check error:', error);
  }
}

/**
 * Generate embedding for text
 */
export async function generateEmbedding(text) {
  if (!openai) {
    throw new Error('OpenAI not initialized for embeddings');
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    encoding_format: 'float',
  });

  return {
    embedding: response.data[0].embedding,
    model: EMBEDDING_MODEL,
    dimensions: response.data[0].embedding.length,
    usage: response.usage,
  };
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddingsBatch(texts) {
  if (!openai) {
    throw new Error('OpenAI not initialized for embeddings');
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    encoding_format: 'float',
  });

  return {
    embeddings: response.data.map(d => d.embedding),
    model: EMBEDDING_MODEL,
    count: response.data.length,
    usage: response.usage,
  };
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  let currentLength = 0;

  for (const sentence of sentences) {
    if (currentLength + sentence.length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      
      // Keep overlap from the end of current chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
      currentLength = currentChunk.length;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentLength = currentChunk.length;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Index a document into the vector store
 */
export async function indexDocument(document, metadata = {}) {
  const {
    content,
    title = 'Untitled',
    source = 'manual',
    agentId = 'global',
    userId = null,
    type = 'document',
  } = document;

  if (!content || typeof content !== 'string') {
    throw new Error('Document content is required');
  }

  // Chunk the document
  const chunks = chunkText(content);

  // Generate embeddings for all chunks
  const { embeddings } = await generateEmbeddingsBatch(chunks);

  // Prepare vectors for Pinecone
  const documentId = crypto.randomUUID();
  const vectors = chunks.map((chunk, index) => ({
    id: `${documentId}_chunk_${index}`,
    values: embeddings[index],
    metadata: {
      documentId,
      chunkIndex: index,
      totalChunks: chunks.length,
      content: chunk.substring(0, 1000), // Pinecone metadata limit
      title,
      source,
      agentId,
      userId,
      type,
      ...metadata,
      indexedAt: new Date().toISOString(),
    },
  }));

  // Upsert to Pinecone or in-memory store
  if (pinecone) {
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    
    // Batch upsert (Pinecone limit: 100 vectors per request)
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
  } else {
    // In-memory fallback
    if (!global.ragMemoryStore) {
      global.ragMemoryStore = [];
    }
    global.ragMemoryStore.push(...vectors);
  }

  return {
    success: true,
    documentId,
    title,
    chunks: chunks.length,
    vectors: vectors.length,
  };
}

/**
 * Search for relevant context
 */
export async function searchContext(query, options = {}) {
  const {
    topK = 5,
    agentId = null,
    userId = null,
    minScore = 0.7,
    includeMetadata = true,
  } = options;

  // Generate query embedding
  const { embedding: queryEmbedding } = await generateEmbedding(query);

  // Build filter
  const filter = {};
  if (agentId) filter.agentId = agentId;
  if (userId) filter.userId = userId;

  let results = [];

  if (pinecone) {
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    results = queryResponse.matches || [];
  } else {
    // In-memory search fallback
    if (global.ragMemoryStore && global.ragMemoryStore.length > 0) {
      results = global.ragMemoryStore
        .map(vector => ({
          id: vector.id,
          score: cosineSimilarity(queryEmbedding, vector.values),
          metadata: vector.metadata,
        }))
        .filter(r => !agentId || r.metadata?.agentId === agentId)
        .filter(r => !userId || r.metadata?.userId === userId)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    }
  }

  // Filter by minimum score and format results
  const relevantResults = results
    .filter(r => r.score >= minScore)
    .map(r => ({
      id: r.id,
      score: r.score,
      content: r.metadata?.content || '',
      title: r.metadata?.title || 'Unknown',
      source: r.metadata?.source || 'unknown',
      chunkIndex: r.metadata?.chunkIndex,
      documentId: r.metadata?.documentId,
    }));

  return {
    success: true,
    query,
    results: relevantResults,
    totalFound: relevantResults.length,
    searchParams: { topK, minScore, agentId, userId },
  };
}

/**
 * Retrieve context and format for LLM
 */
export async function retrieveForLLM(query, options = {}) {
  const searchResults = await searchContext(query, options);

  if (searchResults.results.length === 0) {
    return {
      success: true,
      context: null,
      message: 'No relevant context found',
    };
  }

  // Combine relevant chunks into context
  const contextParts = searchResults.results.map((r, i) => 
    `[Source ${i + 1}: ${r.title} (relevance: ${(r.score * 100).toFixed(1)}%)]\n${r.content}`,
  );

  const formattedContext = `
RELEVANT CONTEXT FROM KNOWLEDGE BASE:
${'-'.repeat(50)}
${contextParts.join('\n\n')}
${'-'.repeat(50)}
Use the above context to help answer the user's question. If the context doesn't contain relevant information, say so.
`;

  return {
    success: true,
    context: formattedContext,
    sources: searchResults.results.map(r => ({
      title: r.title,
      source: r.source,
      score: r.score,
    })),
    totalSources: searchResults.results.length,
  };
}

/**
 * Delete document from vector store
 */
export async function deleteDocument(documentId) {
  if (pinecone) {
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    
    // Delete all chunks for this document
    await index.deleteMany({
      filter: { documentId },
    });
    
    return { success: true, message: `Document ${documentId} deleted from Pinecone` };
  } else {
    // In-memory deletion
    if (global.ragMemoryStore) {
      const before = global.ragMemoryStore.length;
      global.ragMemoryStore = global.ragMemoryStore.filter(
        v => v.metadata?.documentId !== documentId,
      );
      const deleted = before - global.ragMemoryStore.length;
      return { success: true, message: `Deleted ${deleted} vectors from memory` };
    }
  }

  return { success: false, message: 'No storage available' };
}

/**
 * Get RAG engine status
 */
export function getRAGStatus() {
  const memoryVectors = global.ragMemoryStore?.length || 0;
  
  return {
    initialized: true,
    pinecone: {
      connected: !!pinecone,
      index: PINECONE_INDEX_NAME,
    },
    openai: {
      connected: !!openai,
      embeddingModel: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    },
    memoryStore: {
      vectors: memoryVectors,
    },
    config: {
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    },
  };
}

/**
 * Cosine similarity for in-memory search
 */
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Export the RAG engine
const ragEngine = {
  initialize: initializeRAG,
  generateEmbedding,
  generateEmbeddingsBatch,
  chunkText,
  indexDocument,
  searchContext,
  retrieveForLLM,
  deleteDocument,
  getStatus: getRAGStatus,
};

export default ragEngine;
