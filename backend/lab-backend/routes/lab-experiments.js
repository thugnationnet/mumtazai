/**
 * LAB EXPERIMENTS — Simple experiment routes
 *
 * POST /story-generation         — Continue / enhance / complete a story
 * GET  /story-generation?stats   — Stats
 * POST /future-prediction        — Predict future for a topic
 * GET  /future-prediction?stats  — Stats
 * POST /personality-analysis     — Analyse personality from text
 * GET  /personality-analysis?stats — Stats
 * POST /emotion-analysis         — Emotion classification
 * GET  /emotion-analysis?stats   — Stats
 * POST /dream-analysis           — Dream interpretation
 * GET  /dream-analysis?stats     — Stats
 * POST /image-generation         — Generate image description / prompt
 * GET  /image-generation?stats   — Stats
 * POST /voice-generation         — Voice-clone text generation
 * GET  /voice-generation?stats   — Stats
 * POST /debate-arena             — AI debate on a topic
 * POST /neural-art               — Neural art creation
 * GET  /neural-art?stats         — Stats
 * POST /music-generation         — Music composition
 * GET  /music-generation?stats   — Stats
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { generateWithAI } from '../lib/ai-provider.js';

const router = express.Router();

// ── Helpers ─────────────────────────────────────────────────────

function expId() {
  return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

async function getStats(type, window = 5 * 60 * 1000) {
  const since = new Date(Date.now() - window);
  const [total, recent] = await Promise.all([
    prisma.labExperiment.count({ where: { experimentType: type } }),
    prisma.labExperiment.findMany({
      where: { experimentType: type, createdAt: { gte: since } },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);
  return { activeUsers: recent.length || Math.floor(Math.random() * 5) + 1, totalCreated: total };
}

async function createExperiment(experimentId, experimentType, input) {
  return prisma.labExperiment.create({
    data: { experimentId, experimentType, input, status: 'processing', startedAt: new Date() },
  });
}

async function completeExperiment(experimentId, output, processingTime, tokensUsed) {
  return prisma.labExperiment.update({
    where: { experimentId },
    data: { output, status: 'completed', processingTime, tokensUsed, completedAt: new Date() },
  });
}

async function failExperiment(experimentId, message) {
  try {
    await prisma.labExperiment.update({
      where: { experimentId },
      data: { status: 'failed', errorMessage: message, completedAt: new Date() },
    });
  } catch {}
}

// ── Story Generation ────────────────────────────────────────────

router.get('/story-generation', async (req, res) => {
  if (req.query.stats !== 'true') return res.status(400).json({ error: 'Invalid request' });
  try { res.json(await getStats('story-weaver')); } catch { res.json({ activeUsers: 0, totalCreated: 0 }); }
});

router.post('/story-generation', async (req, res) => {
  const start = Date.now();
  const id = expId();
  try {
    const { story, genre, action } = req.body;
    if (!story) return res.status(400).json({ error: 'Story content is required' });

    await createExperiment(id, 'story-weaver', { prompt: story, settings: { genre, action } });

    let sys = '', usr = '';
    switch (action) {
      case 'continue': sys = `You are a creative ${genre} story writer. Continue the story naturally.`; usr = `Continue this ${genre} story:\n\n${story}\n\nWrite the next 2-3 paragraphs:`; break;
      case 'enhance': sys = `You are a literary editor specializing in ${genre}. Enhance with better descriptions.`; usr = `Enhance this ${genre} story:\n\n${story}\n\nReturn the enhanced version:`; break;
      case 'complete': sys = `You are a ${genre} story writer. Provide a satisfying conclusion.`; usr = `Complete this ${genre} story with a great ending:\n\n${story}\n\nWrite the conclusion:`; break;
      default: sys = `You are a creative ${genre || 'fiction'} story writer.`; usr = story;
    }

    const { text, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.9 });
    const pt = Date.now() - start;
    await completeExperiment(id, { result: text, metadata: { action, genre, tokensUsed: tokens, processingTime: pt } }, pt, tokens);
    res.json({ success: true, generated: text, action, genre, tokens, experimentId: id });
  } catch (err) {
    await failExperiment(id, err.message);
    res.status(500).json({ error: err.message || 'Failed to generate story' });
  }
});

// ── Future Prediction ───────────────────────────────────────────

router.get('/future-prediction', async (req, res) => {
  if (req.query.stats !== 'true') return res.status(400).json({ error: 'Invalid request' });
  try { res.json(await getStats('future-prediction')); } catch { res.json({ activeUsers: 0, totalCreated: 0 }); }
});

router.post('/future-prediction', async (req, res) => {
  const start = Date.now();
  const id = expId();
  try {
    const { topic, timeframe } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    await createExperiment(id, 'future-prediction', { prompt: topic, settings: { timeframe } });

    const sys = 'You are a futurist and trend analyst. Provide thoughtful, data-informed predictions with confidence levels. Format with categories: Technology, Society, Economy, Environment.';
    const usr = `Predict the future of "${topic}" over the next ${timeframe || '10 years'}. Include:
1. Key predictions (with confidence %)
2. Potential disruptions
3. Timeline of milestones
4. Supporting trends
5. Wildcard scenarios`;

    const { text, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.8 });
    const pt = Date.now() - start;
    await completeExperiment(id, { result: text, metadata: { topic, timeframe, tokensUsed: tokens, processingTime: pt } }, pt, tokens);
    res.json({ success: true, prediction: text, topic, timeframe, tokens, experimentId: id });
  } catch (err) {
    await failExperiment(id, err.message);
    res.status(500).json({ error: err.message || 'Failed to generate prediction' });
  }
});

// ── Personality Analysis ────────────────────────────────────────

router.get('/personality-analysis', async (req, res) => {
  if (req.query.stats !== 'true') return res.status(400).json({ error: 'Invalid request' });
  try { res.json(await getStats('personality-mirror')); } catch { res.json({ activeUsers: 0, totalCreated: 0 }); }
});

router.post('/personality-analysis', async (req, res) => {
  const start = Date.now();
  const id = expId();
  try {
    const { text, answers } = req.body;
    if (!text && !answers) return res.status(400).json({ error: 'Text or answers required' });

    const input = text || JSON.stringify(answers);
    await createExperiment(id, 'personality-mirror', { prompt: input });

    const sys = 'You are a personality psychologist. Analyse the text and provide Big Five (OCEAN) scores 0-100, MBTI type, strengths, areas for growth, and communication style. Respond with valid JSON only.';
    const usr = `Analyse this person's personality from their writing:\n\n"${input}"\n\nRespond with JSON: { "bigFive": {"openness": 0-100, "conscientiousness": 0-100, "extraversion": 0-100, "agreeableness": 0-100, "neuroticism": 0-100}, "mbti": "XXXX", "strengths": [...], "growth": [...], "communicationStyle": "..." }`;

    const { text: resultText, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.5 });
    const pt = Date.now() - start;

    let parsed;
    try { const m = resultText.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { raw: resultText }; } catch { parsed = { raw: resultText }; }

    await completeExperiment(id, { result: parsed, metadata: { tokensUsed: tokens, processingTime: pt } }, pt, tokens);
    res.json({ success: true, analysis: parsed, tokens, experimentId: id });
  } catch (err) {
    await failExperiment(id, err.message);
    res.status(500).json({ error: err.message || 'Failed to analyse personality' });
  }
});

// ── Emotion Analysis ────────────────────────────────────────────

router.get('/emotion-analysis', async (req, res) => {
  if (req.query.stats !== 'true') return res.status(400).json({ error: 'Invalid request' });
  try {
    const [total, recent] = await Promise.all([
      prisma.labExperiment.count({ where: { experimentType: { in: ['emotion-visualizer', 'emotion-analysis'] }, status: 'completed' } }),
      prisma.labExperiment.findMany({
        where: { experimentType: { in: ['emotion-visualizer', 'emotion-analysis'] }, startedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
        select: { userId: true }, distinct: ['userId'],
      }),
    ]);
    res.json({ activeUsers: Math.max(recent.length, Math.floor(Math.random() * 3) + 1), totalAnalyzed: total });
  } catch { res.json({ activeUsers: 0, totalAnalyzed: 0 }); }
});

router.post('/emotion-analysis', async (req, res) => {
  const start = Date.now();
  const id = expId();
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    await createExperiment(id, 'emotion-visualizer', { prompt: text });

    const sys = 'You are an emotion and sentiment analysis expert. Respond with valid JSON only.';
    const usr = `Analyze the emotions in this text and return JSON:
{ "primaryEmotion": "...", "confidence": 0.0-1.0, "overall": -100 to 100, "joy": 0-100, "trust": 0-100, "anticipation": 0-100, "surprise": 0-100, "sadness": 0-100, "fear": 0-100, "anger": 0-100, "disgust": 0-100 }

Text: "${text}"`;

    const { text: resultText, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.3 });
    const pt = Date.now() - start;

    let parsed;
    try { const m = resultText.match(/\{[\s\S]*\}/); parsed = JSON.parse(m[0]); } catch { parsed = { primaryEmotion: 'neutral', confidence: 0.5, overall: 0 }; }

    const result = {
      classification: { prediction: parsed.primaryEmotion, confidence: parsed.confidence || 0.85 },
      emotions: {
        overall: parsed.overall || 0, joy: parsed.joy || 0, trust: parsed.trust || 0,
        anticipation: parsed.anticipation || 0, surprise: parsed.surprise || 0,
        sadness: parsed.sadness || 0, fear: parsed.fear || 0, anger: parsed.anger || 0, disgust: parsed.disgust || 0,
      },
      text,
    };

    await completeExperiment(id, { result, metadata: { processingTime: pt } }, pt, tokens);
    res.json({ success: true, ...result, experimentId: id });
  } catch (err) {
    await failExperiment(id, err.message);
    res.status(500).json({ error: err.message || 'Failed to analyze emotions' });
  }
});

// ── Dream Analysis ──────────────────────────────────────────────

router.get('/dream-analysis', async (req, res) => {
  if (req.query.stats !== 'true') return res.status(400).json({ error: 'Invalid request' });
  try { res.json(await getStats('dream-interpreter')); } catch { res.json({ activeUsers: 0, totalCreated: 0 }); }
});

router.post('/dream-analysis', async (req, res) => {
  const start = Date.now();
  const id = expId();
  try {
    const { dream } = req.body;
    if (!dream) return res.status(400).json({ error: 'Dream description is required' });

    await createExperiment(id, 'dream-interpreter', { prompt: dream });

    const sys = 'You are an expert dream interpreter combining Jungian psychology, cultural symbolism, and modern neuroscience. Provide thoughtful, personalised dream analysis.';
    const usr = `Interpret this dream in depth:\n\n"${dream}"\n\nInclude:\n1. Key symbols and their meanings\n2. Emotional themes\n3. Possible psychological significance\n4. Cultural/archetypal connections\n5. Practical insights for the dreamer`;

    const { text, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.8 });
    const pt = Date.now() - start;
    await completeExperiment(id, { result: text, metadata: { tokensUsed: tokens, processingTime: pt } }, pt, tokens);
    res.json({ success: true, interpretation: text, tokens, experimentId: id });
  } catch (err) {
    await failExperiment(id, err.message);
    res.status(500).json({ error: err.message || 'Failed to interpret dream' });
  }
});

// ── Image Generation (prompt/description) ───────────────────────

router.get('/image-generation', async (req, res) => {
  if (req.query.stats !== 'true') return res.status(400).json({ error: 'Invalid request' });
  try { res.json(await getStats('image-playground')); } catch { res.json({ activeUsers: 0, totalCreated: 0 }); }
});

router.post('/image-generation', async (req, res) => {
  const start = Date.now();
  const id = expId();
  try {
    const { prompt, style, settings } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    await createExperiment(id, 'image-playground', { prompt, settings: { style, ...settings } });

    const sys = 'You are a creative image prompt engineer. Transform user requests into vivid, detailed image prompts optimised for AI image generation. Include composition, lighting, mood, colour palette, style details.';
    const usr = `Create a detailed, optimised image generation prompt for:\n\n"${prompt}"\n\nStyle: ${style || 'photorealistic'}\n\nProvide:\n1. Enhanced prompt (ready for DALL-E / Stable Diffusion)\n2. Negative prompt (what to avoid)\n3. Composition notes\n4. Style reference`;

    const { text, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.8 });
    const pt = Date.now() - start;
    await completeExperiment(id, { result: text, metadata: { style, tokensUsed: tokens, processingTime: pt } }, pt, tokens);
    res.json({ success: true, result: text, tokens, experimentId: id });
  } catch (err) {
    await failExperiment(id, err.message);
    res.status(500).json({ error: err.message || 'Failed to generate image prompt' });
  }
});

// ── Voice Generation ────────────────────────────────────────────

router.get('/voice-generation', async (req, res) => {
  if (req.query.stats !== 'true') return res.status(400).json({ error: 'Invalid request' });
  try { res.json(await getStats('voice-cloning')); } catch { res.json({ activeUsers: 0, totalCreated: 0 }); }
});

router.post('/voice-generation', async (req, res) => {
  const start = Date.now();
  const id = expId();
  try {
    const { text, voice, settings } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    await createExperiment(id, 'voice-cloning', { prompt: text, settings: { voice, ...settings } });

    const sys = 'You are a voice synthesis and audio production expert. Analyse text for optimal voice synthesis parameters and provide phonetic guidance, emphasis marks, and pacing notes.';
    const usr = `Prepare this text for voice synthesis:\n\n"${text}"\n\nVoice style: ${voice || 'neutral'}\n\nProvide:\n1. SSML-marked text\n2. Pronunciation notes\n3. Pacing and emphasis guide\n4. Emotional tone markers`;

    const { text: result, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.6 });
    const pt = Date.now() - start;
    await completeExperiment(id, { result, metadata: { voice, tokensUsed: tokens, processingTime: pt } }, pt, tokens);
    res.json({ success: true, result, tokens, experimentId: id });
  } catch (err) {
    await failExperiment(id, err.message);
    res.status(500).json({ error: err.message || 'Failed to process voice generation' });
  }
});

// ── Debate Arena ────────────────────────────────────────────────

// GET /debate-arena — list active debates + stats (used by frontend page on load)
router.get('/debate-arena', async (req, res) => {
  try {
    const { stats, debateId } = req.query;

    if (debateId) {
      const debate = await prisma.debate.findUnique({ where: { debateId } });
      if (!debate) return res.status(404).json({ success: false, error: 'Debate not found' });
      return res.json({ success: true, debate });
    }

    if (stats === 'true') {
      const [totalDebates, activeDebates] = await Promise.all([
        prisma.debate.count(),
        prisma.debate.count({ where: { status: 'active' } }),
      ]);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentDebates = await prisma.debate.findMany({
        where: { updatedAt: { gte: twentyFourHoursAgo } },
        select: { totalVotes: true },
      });
      const recentVotes = recentDebates.reduce((sum, d) => sum + d.totalVotes, 0);
      const activeUsers = Math.max(12, activeDebates * 3 + Math.floor(Math.random() * 20));
      return res.json({ success: true, stats: { totalDebates, activeDebates, activeUsers, recentVotes } });
    }

    const debates = await prisma.debate.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const totalDebates = await prisma.debate.count();
    const activeUsers = Math.max(12, debates.length * 3 + Math.floor(Math.random() * 20));
    res.json({ success: true, debates, stats: { totalDebates, activeUsers } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch debates' });
  }
});

// POST /debate-arena — create a new two-AI debate OR cast a vote
router.post('/debate-arena', async (req, res) => {
  const start = Date.now();
  try {
    const { action, topic, agent1Position, agent2Position, debateId, vote, visitorId } = req.body;

    // ── Voting ─────────────────────────────────────────────────
    if (action === 'vote') {
      if (!debateId || !vote) return res.status(400).json({ error: 'debateId and vote are required' });
      const debate = await prisma.debate.findUnique({ where: { debateId } });
      if (!debate) return res.status(404).json({ success: false, error: 'Debate not found' });

      const voterId = visitorId || 'anonymous';
      if (debate.votedUsers.includes(voterId)) {
        return res.status(400).json({ success: false, error: 'Already voted' });
      }

      const agent1Data = { ...debate.agent1 };
      const agent2Data = { ...debate.agent2 };
      if (vote === 'agent1') {
        agent1Data.votes = (agent1Data.votes || 0) + 1;
      } else {
        agent2Data.votes = (agent2Data.votes || 0) + 1;
      }

      const updated = await prisma.debate.update({
        where: { debateId },
        data: {
          agent1: agent1Data,
          agent2: agent2Data,
          totalVotes: { increment: 1 },
          votedUsers: { push: voterId },
        },
      });

      return res.json({
        success: true,
        votes: {
          agent1: updated.agent1.votes || 0,
          agent2: updated.agent2.votes || 0,
          total: updated.totalVotes || 0,
        },
      });
    }

    // ── Create new debate ───────────────────────────────────────
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const newDebateId = `debate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const pos1 = agent1Position || 'Pro';
    const pos2 = agent2Position || 'Con';

    const sys1 = `You are "Nova", a brilliant AI debater known for logical precision and articulate arguments. You argue the "${pos1}" position on: "${topic}". Give a compelling opening statement. Be logical, articulate, and convincing. Keep response to 2-3 paragraphs.`;
    const sys2 = `You are "Blaze", a sharp AI debater known for fiery persuasion and engaging rhetoric. You argue the "${pos2}" position on: "${topic}". Give a compelling opening statement. Be analytical, persuasive, and engaging. Keep response to 2-3 paragraphs.`;

    const [r1, r2] = await Promise.all([
      generateWithAI(sys1, `Opening statement for "${topic}". Argue: ${pos1}`, { maxTokens: 600, temperature: 0.85 }),
      generateWithAI(sys2, `Opening statement for "${topic}". Argue: ${pos2}`, { maxTokens: 600, temperature: 0.85 }),
    ]);

    const debate = await prisma.debate.create({
      data: {
        debateId: newDebateId,
        topic,
        status: 'active',
        agent1: {
          name: 'Nova',
          position: pos1,
          avatar: '⚡',
          provider: 'Nova',
          response: r1.text,
          responseTime: r1.processingTime || (Date.now() - start),
          votes: 0,
        },
        agent2: {
          name: 'Blaze',
          position: pos2,
          avatar: '🔥',
          provider: 'Blaze',
          response: r2.text,
          responseTime: r2.processingTime || (Date.now() - start),
          votes: 0,
        },
        totalVotes: 0,
        viewers: Math.floor(Math.random() * 50) + 20,
        votedUsers: [],
      },
    });

    res.json({ success: true, debate, totalTime: Date.now() - start });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to process debate request' });
  }
});

// ── Neural Art ──────────────────────────────────────────────────

router.get('/neural-art', async (req, res) => {
  if (req.query.stats !== 'true') return res.status(400).json({ error: 'Invalid request' });
  try { res.json(await getStats('neural-art')); } catch { res.json({ activeUsers: 0, totalCreated: 0 }); }
});

router.post('/neural-art', async (req, res) => {
  const start = Date.now();
  const id = expId();
  try {
    const { description, style, medium, settings } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });

    await createExperiment(id, 'neural-art', { prompt: description, settings: { style, medium, ...settings } });

    const sys = 'You are a world-class digital artist and art director. Create detailed art concept descriptions suitable for AI generation, with technical and aesthetic guidance.';
    const usr = `Create a neural art concept for:\n\n"${description}"\n\nStyle: ${style || 'abstract'}\nMedium: ${medium || 'digital painting'}\n\nProvide:\n1. Detailed visual description\n2. Colour palette (hex codes)\n3. Composition guide\n4. Lighting and mood\n5. Style-transfer reference notes`;

    const { text, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.9 });
    const pt = Date.now() - start;
    await completeExperiment(id, { result: text, metadata: { style, medium, tokensUsed: tokens, processingTime: pt } }, pt, tokens);
    res.json({ success: true, result: text, tokens, experimentId: id });
  } catch (err) {
    await failExperiment(id, err.message);
    res.status(500).json({ error: err.message || 'Failed to create neural art' });
  }
});

// ── Music Generation ────────────────────────────────────────────

router.get('/music-generation', async (req, res) => {
  if (req.query.stats !== 'true') return res.status(400).json({ error: 'Invalid request' });
  try { res.json(await getStats('music-generator')); } catch { res.json({ activeUsers: 0, totalCreated: 0 }); }
});

router.post('/music-generation', async (req, res) => {
  const start = Date.now();
  const id = expId();
  try {
    const { description, genre, mood, tempo, settings } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });

    await createExperiment(id, 'music-generator', { prompt: description, settings: { genre, mood, tempo, ...settings } });

    const sys = 'You are a music composer and arranger. Create detailed musical compositions with structure, chord progressions, instrumentation, and performance notes.';
    const usr = `Compose music for:\n\n"${description}"\n\nGenre: ${genre || 'cinematic'}\nMood: ${mood || 'epic'}\nTempo: ${tempo || 120} BPM\n\nProvide:\n1. Song structure (sections)\n2. Chord progression\n3. Instrumentation\n4. Melody notes\n5. Production tips`;

    const { text, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.9 });
    const pt = Date.now() - start;
    await completeExperiment(id, { result: text, metadata: { genre, mood, tempo, tokensUsed: tokens, processingTime: pt } }, pt, tokens);
    res.json({ success: true, composition: text, tokens, experimentId: id });
  } catch (err) {
    await failExperiment(id, err.message);
    res.status(500).json({ error: err.message || 'Failed to generate music' });
  }
});

export default router;
