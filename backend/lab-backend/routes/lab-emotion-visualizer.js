/**
 * LAB — EMOTION VISUALIZER sub-routes
 *
 * POST /analyze-text              — AI text emotion analysis
 * GET  /history/:userId           — Emotion analysis history
 * GET  /insights/:userId          — Emotion insights over time
 * GET  /settings/:userId          — Get user settings
 * POST /settings                  — Save / update settings
 * POST /export                    — Export analysis data (json/csv/txt)
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { generateWithAI } from '../lib/ai-provider.js';

const router = express.Router();

function expId(prefix = 'exp') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ── POST /analyze-text ──────────────────────────────────────────

router.post('/analyze-text', async (req, res) => {
  const id = expId();
  const start = Date.now();
  try {
    const { text, userId } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    await prisma.labExperiment.create({
      data: { experimentId: id, experimentType: 'emotion-visualizer', userId: userId || null, input: { text }, status: 'processing', startedAt: new Date() },
    });

    const sys = 'You are an emotion analysis expert. Respond with valid JSON only.';
    const usr = `Analyse emotions in this text. Return JSON:
{
  "primaryEmotion": "...",
  "confidence": 0.0-1.0,
  "intensity": 0.0-1.0,
  "sentiment": { "label": "positive|negative|neutral|mixed", "score": -1 to 1 },
  "emotions": { "joy": 0-1, "sadness": 0-1, "anger": 0-1, "fear": 0-1, "surprise": 0-1, "disgust": 0-1, "trust": 0-1, "anticipation": 0-1 },
  "dominantTheme": "...",
  "nuances": ["...", "..."]
}

Text: "${text}"`;

    const { text: raw, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.3 });
    const pt = Date.now() - start;

    let parsed;
    try { const m = raw.match(/\{[\s\S]*\}/); parsed = JSON.parse(m[0]); } catch { parsed = { primaryEmotion: 'neutral', confidence: 0.5, intensity: 0.5, sentiment: { label: 'neutral', score: 0 }, emotions: {} }; }

    const analysis = { ...parsed, source: 'text', timestamp: new Date().toISOString() };

    await prisma.labExperiment.update({
      where: { experimentId: id },
      data: { output: { analysis }, status: 'completed', processingTime: pt, tokensUsed: tokens, completedAt: new Date() },
    });

    res.json({ success: true, analysis, experimentId: id });
  } catch (err) {
    try { await prisma.labExperiment.update({ where: { experimentId: id }, data: { status: 'failed', errorMessage: err.message } }); } catch {}
    res.status(500).json({ message: err.message || 'Analysis failed' });
  }
});

// ── GET /history/:userId ────────────────────────────────────────

router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit || '50');

    const records = await prisma.labExperiment.findMany({
      where: { userId, experimentType: { in: ['emotion-visualizer', 'emotion-voice-analysis', 'emotion-facial-analysis'] }, status: 'completed' },
      select: { output: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const analyses = records.map((r) => r.output?.analysis).filter(Boolean);
    res.json({ analyses });
  } catch (err) {
    res.json({ analyses: [] });
  }
});

// ── GET /insights/:userId ───────────────────────────────────────

router.get('/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const records = await prisma.labExperiment.findMany({
      where: { userId, experimentType: { in: ['emotion-visualizer', 'emotion-voice-analysis', 'emotion-facial-analysis'] }, status: 'completed' },
      select: { output: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const analyses = records.map((r) => r.output?.analysis).filter(Boolean);
    if (analyses.length === 0) return res.json({ insights: { totalAnalyses: 0, emotionBreakdown: {}, trends: [], topEmotion: 'none' } });

    // Aggregate
    const emotionCounts = {};
    for (const a of analyses) {
      const e = a.primaryEmotion || 'unknown';
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    }

    const topEmotion = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';

    // Sentiment trend (last 10)
    const sentimentTrend = analyses.slice(0, 10).map((a, i) => ({
      index: i,
      sentiment: a.sentiment?.score || 0,
      emotion: a.primaryEmotion || 'unknown',
    }));

    res.json({
      insights: {
        totalAnalyses: analyses.length,
        emotionBreakdown: emotionCounts,
        trends: sentimentTrend,
        topEmotion,
        averageSentiment: analyses.reduce((s, a) => s + (a.sentiment?.score || 0), 0) / analyses.length,
      },
    });
  } catch (err) {
    res.json({ insights: { totalAnalyses: 0, emotionBreakdown: {}, trends: [], topEmotion: 'none' } });
  }
});

// ── GET /settings/:userId ───────────────────────────────────────

router.get('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const record = await prisma.labExperiment.findFirst({
      where: { userId, experimentType: 'emotion-settings' },
      orderBy: { createdAt: 'desc' },
    });

    const settings = record?.output?.settings || {
      sensitivity: 0.7,
      analysisDepth: 'standard',
      realTimeProcessing: true,
      voiceEnabled: true,
      facialEnabled: true,
      notificationsEnabled: false,
      darkMode: false,
    };

    res.json({ settings });
  } catch {
    res.json({ settings: {} });
  }
});

// ── POST /settings ──────────────────────────────────────────────

router.post('/settings', async (req, res) => {
  try {
    const { userId, settings } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const existing = await prisma.labExperiment.findFirst({
      where: { userId, experimentType: 'emotion-settings' },
    });

    if (existing) {
      await prisma.labExperiment.update({
        where: { experimentId: existing.experimentId },
        data: { output: { settings } },
      });
    } else {
      await prisma.labExperiment.create({
        data: {
          experimentId: `settings_${Date.now()}`,
          experimentType: 'emotion-settings',
          userId,
          input: {},
          output: { settings },
          status: 'completed',
          completedAt: new Date(),
        },
      });
    }

    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save settings' });
  }
});

// ── POST /export ────────────────────────────────────────────────

router.post('/export', async (req, res) => {
  try {
    const { format, dateRange, analysisHistory, sessions } = req.body;
    if (!format) return res.status(400).json({ message: 'Format is required' });

    const data = { analysisHistory: analysisHistory || [], sessions: sessions || [], exportDate: new Date().toISOString(), dateRange };

    if (format === 'json') {
      res.set({ 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="emotion-analysis.json"' });
      return res.send(JSON.stringify(data, null, 2));
    }

    if (format === 'csv') {
      let csv = 'Timestamp,Source,Primary Emotion,Confidence,Intensity,Sentiment\n';
      for (const a of (analysisHistory || [])) {
        csv += `"${a.timestamp || ''}","${a.source || ''}","${a.primaryEmotion || ''}",${a.confidence || 0},${a.intensity || 0},"${a.sentiment?.label || ''}"\n`;
      }
      res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="emotion-analysis.csv"' });
      return res.send(csv);
    }

    // txt
    let text = '=== Emotion Analysis Export ===\n\n';
    text += `Date: ${new Date().toLocaleDateString()}\nTotal Analyses: ${(analysisHistory || []).length}\nTotal Sessions: ${(sessions || []).length}\n\n`;
    for (const a of (analysisHistory || []).slice(0, 20)) {
      text += `--- ${a.timestamp || 'Unknown'} ---\nSource: ${a.source || 'text'}\nPrimary Emotion: ${a.primaryEmotion || 'unknown'}\nConfidence: ${((a.confidence || 0) * 100).toFixed(0)}%\nIntensity: ${((a.intensity || 0) * 100).toFixed(0)}%\n\n`;
    }
    res.set({ 'Content-Type': 'text/plain', 'Content-Disposition': 'attachment; filename="emotion-analysis.txt"' });
    return res.send(text);
  } catch (err) {
    res.status(500).json({ message: 'Export failed' });
  }
});

export default router;
