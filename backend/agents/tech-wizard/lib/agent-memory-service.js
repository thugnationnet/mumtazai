/**
 * AGENT MEMORY SERVICE
 * Extracts facts from conversations and stores them in PostgreSQL UserMemoryProfile.
 * MongoDB is NOT used. All memory lives in the UserMemoryProfile.memories JSON column.
 */

import { prisma } from './prisma.js';

/**
 * Patterns to detect important information in messages
 */
const LEARNING_PATTERNS = {
  // User introducing themselves or sharing personal info
  user_introduction: [
    /my name is\s+(\w+)/i,
    /i('m| am)\s+(\w+)/i,
    /call me\s+(\w+)/i,
    /i work (as|at|for|in)\s+(.+)/i,
    /i('m| am) (a|an)\s+(\w+)/i,
    /i live in\s+(.+)/i,
    /i('m| am) from\s+(.+)/i,
  ],

  // User preferences and likes/dislikes
  preferences: [
    /i (love|like|enjoy|prefer)\s+(.+)/i,
    /i (hate|dislike|don't like|can't stand)\s+(.+)/i,
    /my favorite\s+(\w+)\s+is\s+(.+)/i,
    /i (always|usually|often|never)\s+(.+)/i,
  ],

  // Corrections from user
  corrections: [
    /no,?\s+(actually|that's not|you're wrong|incorrect)/i,
    /i (meant|mean|said)\s+(.+)/i,
    /let me (clarify|correct|explain)/i,
    /that's not (right|correct|what i)/i,
  ],

  // User goals and challenges
  goals: [
    /i (want|need|wish) to\s+(.+)/i,
    /i('m| am) trying to\s+(.+)/i,
    /my goal is\s+(.+)/i,
    /i('m| am) working on\s+(.+)/i,
    /help me (with|to)\s+(.+)/i,
  ],

  // Emotional cues
  emotions: [
    /i('m| am) (feeling|so)\s+(happy|sad|frustrated|excited|worried|anxious|stressed)/i,
    /i (feel|felt)\s+(.+)/i,
    /this (makes|made) me\s+(happy|sad|frustrated|excited|worried|anxious|angry)/i,
  ],

  // Communication style indicators
  style: [
    /can you (be more|keep it)\s+(brief|concise|detailed|simple)/i,
    /i prefer\s+(shorter|longer|detailed|simple)\s+responses/i,
    /just give me\s+(.+)/i,
    /explain it like\s+(.+)/i,
  ],
};

/**
 * Extract potential learnings from a message
 */
export function extractLearnings(message, role = 'user') {
  const learnings = [];

  if (role !== 'user') return learnings;

  // Check each pattern category
  for (const [category, patterns] of Object.entries(LEARNING_PATTERNS)) {
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        learnings.push({
          type: mapCategoryToMemoryType(category),
          content: message.slice(0, 500), // Store the original context
          data: {
            category,
            matchedPattern: pattern.toString(),
            extractedValue: match[match.length - 1]?.trim(),
          },
          importance: getImportance(category),
          tags: [category],
        });
      }
    }
  }

  // Also detect important keywords
  const importantKeywords = extractImportantKeywords(message);
  if (importantKeywords.length > 0) {
    learnings.push({
      type: 'conversation_insight',
      content: `User mentioned: ${importantKeywords.join(', ')}`,
      data: { keywords: importantKeywords },
      importance: 4,
      tags: ['keywords', ...importantKeywords.slice(0, 5)],
    });
  }

  return learnings;
}

/**
 * Map pattern categories to memory types
 */
function mapCategoryToMemoryType(category) {
  const mapping = {
    user_introduction: 'user_fact',
    preferences: 'user_preference',
    corrections: 'correction',
    goals: 'user_fact',
    emotions: 'emotional_cue',
    style: 'user_preference',
  };
  return mapping[category] || 'conversation_insight';
}

/**
 * Get importance score for a learning type
 */
function getImportance(category) {
  const scores = {
    user_introduction: 9,
    preferences: 7,
    corrections: 8,
    goals: 8,
    emotions: 6,
    style: 7,
  };
  return scores[category] || 5;
}

/**
 * Extract important keywords from a message
 */
function extractImportantKeywords(message) {
  const stopWords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
    'they', 'the', 'a', 'an', 'and', 'but', 'or', 'for', 'nor', 'on', 'at',
    'to', 'from', 'by', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom',
    'how', 'when', 'where', 'why', 'with', 'about', 'just', 'only',
    'very', 'really', 'also', 'some', 'any', 'more', 'most', 'other',
  ]);

  const words = message.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const wordFreq = {};

  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Return words that appear multiple times or are capitalized in original
  return Object.keys(wordFreq)
    .filter(word => wordFreq[word] >= 2 || message.includes(word.charAt(0).toUpperCase() + word.slice(1)))
    .slice(0, 10);
}

/**
 * Load memories array from PostgreSQL for a user.
 * Returns parsed array or [].
 */
async function loadMemories(userId) {
  try {
    const profile = await prisma.userMemoryProfile.findUnique({ where: { userId } });
    if (!profile) return [];
    return typeof profile.memories === 'string' ? JSON.parse(profile.memories) : (profile.memories || []);
  } catch {
    return [];
  }
}

/**
 * Save memories array to PostgreSQL for a user (upsert).
 * Caps at 100 most recent memories.
 */
async function saveMemories(userId, memories) {
  const capped = memories.slice(-100);
  await prisma.userMemoryProfile.upsert({
    where: { userId },
    update: { memories: JSON.stringify(capped) },
    create: {
      userId,
      enabled: true,
      userName: '',
      language: '',
      gender: '',
      dateOfBirth: '',
      memories: JSON.stringify(capped),
    },
  });
}

/**
 * Process a conversation and extract/store learnings into PostgreSQL.
 * Called after each chat response.
 */
export async function processConversation(userId, agentId, messages, conversationId) {
  try {
    // Check if user has memory enabled
    const profile = await prisma.userMemoryProfile.findUnique({ where: { userId } });
    if (!profile?.enabled) return { success: true, skipped: true };

    const existing = await loadMemories(userId);
    let newLearnings = 0;

    for (const msg of messages) {
      if (msg.role !== 'user') continue;
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      const learnings = extractLearnings(content, 'user');

      for (const learning of learnings) {
        const extractedVal = (learning.data?.extractedValue || '').toLowerCase();
        const isDuplicate = existing.some(m =>
          m.category === learning.data.category &&
          m.fact.toLowerCase().includes(extractedVal),
        );
        if (!isDuplicate && extractedVal) {
          existing.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            fact: learning.content.slice(0, 300),
            category: mapCategoryToUICategory(learning.data.category),
            agentId: agentId || 'unknown',
            conversationId: conversationId || null,
            createdAt: Date.now(),
          });
          newLearnings++;
        }
      }
    }

    if (newLearnings > 0) {
      await saveMemories(userId, existing);
    }

    return { success: true, newLearnings, totalMemories: existing.length };
  } catch (error) {
    console.error('[agent-memory] processConversation error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Map internal pattern categories to UI category names.
 */
function mapCategoryToUICategory(category) {
  const mapping = {
    user_introduction: 'personal',
    preferences: 'preference',
    corrections: 'general',
    goals: 'project',
    emotions: 'general',
    style: 'style',
  };
  return mapping[category] || 'general';
}

/**
 * Build enhanced system prompt by injecting stored memories from PostgreSQL.
 * Called before each chat request.
 */
export async function buildEnhancedSystemPrompt(userId, agentId, baseSystemPrompt) {
  try {
    const profile = await prisma.userMemoryProfile.findUnique({ where: { userId } });
    if (!profile?.enabled) return baseSystemPrompt;

    const memories = await loadMemories(userId);
    if (memories.length === 0) return baseSystemPrompt;

    // Build context string from most recent 20 memories
    const recent = [...memories].reverse().slice(0, 20);
    const contextLines = recent.map(m => `- [${m.category}] ${m.fact}`).join('\n');

    // Also include About You profile fields if set
    const aboutLines = [];
    if (profile.userName) aboutLines.push(`- Name: ${profile.userName}`);
    if (profile.language) aboutLines.push(`- Preferred language: ${profile.language}`);
    if (profile.gender) aboutLines.push(`- Gender: ${profile.gender}`);

    const profileSection = aboutLines.length > 0 ? `\n**User Profile:**\n${aboutLines.join('\n')}\n` : '';
    const memoriesSection = `\n**Remembered facts (${memories.length} total, showing most recent):**\n${contextLines}`;

    const enhancedPrompt = `${baseSystemPrompt}

---
# MEMORY — WHAT YOU KNOW ABOUT THIS USER
${profileSection}${memoriesSection}

Use these memories naturally. Don't say "I remember" — just act like you know. If something seems outdated, gently verify.
---`;

    return enhancedPrompt;
  } catch (error) {
    console.error('[agent-memory] buildEnhancedSystemPrompt error:', error.message);
    return baseSystemPrompt;
  }
}

/**
 * Get memory stats for a user (used by admin/debug routes).
 */
export async function getMemoryStats(userId) {
  try {
    const memories = await loadMemories(userId);
    const counts = {};
    memories.forEach(m => { counts[m.category] = (counts[m.category] || 0) + 1; });
    return { exists: memories.length > 0, totalMemories: memories.length, byCategory: counts };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

/**
 * Clear all memories for a user (called when chat session is deleted).
 */
export async function clearMemories(userId) {
  try {
    await prisma.userMemoryProfile.update({
      where: { userId },
      data: { memories: JSON.stringify([]) },
    });
    return { success: true };
  } catch (error) {
    console.error('[agent-memory] clearMemories error:', error.message);
    return { success: false, error: error.message };
  }
}

export default {
  extractLearnings,
  processConversation,
  buildEnhancedSystemPrompt,
  getMemoryStats,
  clearMemories,
};
