/**
 * LAB — BATTLE ARENA sub-routes
 *
 * POST /                                 — Run a battle (two models, parallel)
 * POST /matchmaking                      — Find opponent
 * POST /matchmaking/cancel               — Cancel matchmaking
 * GET  /stats/:userId                    — Player stats
 * POST /create                           — Create custom battle
 * GET  /tournaments                      — List tournaments
 * POST /tournaments/:tournamentId/join   — Join tournament
 * GET  /history/:userId                  — Battle history
 * GET  /leaderboard                      — Global leaderboard
 * GET  /agents                           — Available battle agents
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { callModel } from '../lib/ai-provider.js';

const router = express.Router();

// ── POST / — Run battle ─────────────────────────────────────────

router.post('/', async (req, res) => {
  const start = Date.now();
  const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  try {
    const { prompt, model1, model2, round } = req.body;
    if (!prompt || !model1 || !model2) return res.status(400).json({ error: 'Missing required fields: prompt, model1, model2' });
    if (model1 === model2) return res.status(400).json({ error: 'Cannot battle the same model against itself' });

    await prisma.labExperiment.create({
      data: { experimentId: id, experimentType: 'battle-arena', input: { prompt, settings: { model1, model2, round } }, status: 'processing', startedAt: new Date() },
    });

    const systemPrompt = `You are participating in an AI Battle Arena (Round ${round || 1}/3). Give your best, most impressive response to win the user's vote. Be creative, accurate, and engaging.`;

    const [r1, r2] = await Promise.all([
      callModel(model1, systemPrompt, prompt, { maxTokens: 32768, temperature: 0.8 }),
      callModel(model2, systemPrompt, prompt, { maxTokens: 32768, temperature: 0.8 }),
    ]);

    const responseTime = Date.now() - start;
    const totalTokens = (r1.tokens || 0) + (r2.tokens || 0);

    const battleResult = {
      round: round || 1,
      model1: { name: model1, response: r1.text, responseTime: r1.time, tokens: r1.tokens },
      model2: { name: model2, response: r2.text, responseTime: r2.time, tokens: r2.tokens },
      totalTime: responseTime,
    };

    await prisma.labExperiment.update({
      where: { experimentId: id },
      data: { output: { result: battleResult, metadata: { totalTokens, responseTime } }, status: 'completed', processingTime: responseTime, tokensUsed: totalTokens, completedAt: new Date() },
    });

    res.json({ success: true, ...battleResult, experimentId: id });
  } catch (err) {
    try { await prisma.labExperiment.update({ where: { experimentId: id }, data: { status: 'failed', errorMessage: err.message, completedAt: new Date() } }); } catch {}
    res.status(500).json({ error: err.message || 'Failed to generate battle responses' });
  }
});

// ── POST /matchmaking ───────────────────────────────────────────

router.post('/matchmaking', async (req, res) => {
  try {
    const { userId, agentId, battleType, settings } = req.body;
    if (!agentId) return res.status(400).json({ message: 'Agent ID required' });

    const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await prisma.labExperiment.create({
      data: { experimentId: matchId, experimentType: 'battle-matchmaking', userId: userId || null, input: { agentId, battleType: battleType || 'duel', settings: settings || {} }, status: 'processing', startedAt: new Date() },
    });

    // Simulate matchmaking
    await prisma.labExperiment.update({
      where: { experimentId: matchId },
      data: {
        status: 'completed',
        output: {
          matched: true,
          opponent: {
            id: `ai_${Math.random().toString(36).substring(2, 9)}`,
            type: 'ai',
            name: ['Alpha', 'Nova', 'Quantum', 'Pulse', 'Titan'][Math.floor(Math.random() * 5)],
          },
        },
        completedAt: new Date(),
      },
    });

    res.json({ success: true, matchId, status: 'matched', message: 'Match found! Preparing battle...' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Matchmaking failed' });
  }
});

// ── POST /matchmaking/cancel ────────────────────────────────────

router.post('/matchmaking/cancel', async (_req, res) => {
  try {
    const pending = await prisma.labExperiment.findMany({
      where: { experimentType: 'battle-matchmaking', status: 'processing' },
      select: { experimentId: true },
      take: 5,
    });
    for (const r of pending) {
      await prisma.labExperiment.update({ where: { experimentId: r.experimentId }, data: { status: 'failed', errorMessage: 'Cancelled by user', completedAt: new Date() } });
    }
    res.json({ success: true, message: 'Matchmaking cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel' });
  }
});

// ── GET /stats/:userId ──────────────────────────────────────────

router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const experiments = await prisma.labExperiment.findMany({
      where: { userId, experimentType: 'battle-arena', status: 'completed' },
      select: { output: true, processingTime: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    let battlesWon = 0, battlesLost = 0, totalScore = 0, highestScore = 0;
    let currentStreak = 0, longestStreak = 0, streakBroken = false;
    const agentCounts = {};

    for (const exp of experiments) {
      const output = exp.output;
      const result = output?.result;
      if (!result) continue;

      const m1 = result?.model1?.name || result?.model1;
      const m2 = result?.model2?.name || result?.model2;
      if (m1) agentCounts[m1] = (agentCounts[m1] || 0) + 1;
      if (m2) agentCounts[m2] = (agentCounts[m2] || 0) + 1;

      if (output?.userVote === 'model1') {
        battlesWon++;
        if (!streakBroken) currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        if (!streakBroken) streakBroken = true;
        battlesLost++;
      }

      const score = output?.metadata?.totalTokens || 0;
      totalScore += score;
      highestScore = Math.max(highestScore, score);
    }

    const battlesTotal = experiments.length;
    const favoriteAgent = Object.entries(agentCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    res.json({
      stats: {
        battlesTotal, battlesWon, battlesLost,
        winRate: battlesTotal > 0 ? (battlesWon / battlesTotal) * 100 : 0,
        currentStreak, longestStreak, totalScore,
        averageScore: battlesTotal > 0 ? totalScore / battlesTotal : 0,
        highestScore, ranking: 0, favoriteAgent, favoriteChallenge: '',
      },
    });
  } catch (err) {
    res.json({ stats: {} });
  }
});

// ── POST /create ────────────────────────────────────────────────

router.post('/create', async (req, res) => {
  try {
    const { userId, agentId, settings } = req.body;
    if (!agentId) return res.status(400).json({ message: 'Agent ID required' });

    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const battleSettings = {
      rounds: settings?.rounds || 3, timePerRound: settings?.timePerRound || 120,
      challengeTypes: settings?.challengeTypes || ['creativity', 'logic'],
      difficulty: settings?.difficulty || 'mixed', scoring: settings?.scoring || 'standard',
      allowSpectators: settings?.allowSpectators ?? true, isRanked: settings?.isRanked ?? false,
    };

    const agentNames = { 'gpt-4': 'Alpha', 'claude-3': 'Nova', 'gemini': 'Quantum', 'mistral': 'Pulse', 'llama-3': 'Titan' };

    const battle = {
      id: battleId, type: settings?.isRanked ? 'ranked' : 'practice', status: 'preparing',
      participants: [
        { id: userId || 'user', type: 'user', name: 'You', agent: { id: agentId, name: agentId }, score: 0, status: 'ready' },
        { id: `ai_${agentId}`, type: 'ai', name: agentNames[agentId] || agentId, agent: { id: agentId, name: agentId }, score: 0, status: 'ready' },
      ],
      rounds: [], currentRound: 0, totalRounds: battleSettings.rounds,
      startedAt: now, settings: battleSettings,
    };

    await prisma.labExperiment.create({
      data: { experimentId: battleId, experimentType: 'battle-arena', userId: userId || null, input: { agentId, settings: battleSettings }, output: { battle }, status: 'processing', startedAt: new Date() },
    });

    res.json({ success: true, battle });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create battle' });
  }
});

// ── GET /tournaments ────────────────────────────────────────────

router.get('/tournaments', async (_req, res) => {
  try {
    const records = await prisma.labExperiment.findMany({
      where: { experimentType: 'battle-tournament' },
      select: { experimentId: true, input: true, output: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const tournaments = records.map((rec) => {
      const input = rec.input;
      const output = rec.output;
      return {
        id: rec.experimentId,
        name: input?.name || 'AI Championship',
        description: input?.description || 'Battle tournament between AI models',
        type: input?.type || 'bracket',
        status: rec.status === 'completed' ? 'completed' : 'registration',
        participants: output?.participants || 0,
        maxParticipants: input?.maxParticipants || 16,
        rounds: input?.rounds || 4,
        currentRound: output?.currentRound || 0,
        prize: input?.prize || '🏆 Champion Title',
        startTime: rec.createdAt.toISOString(),
        registrationDeadline: new Date(rec.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        isRegistered: false,
      };
    });

    // Provide default tournament if none exist
    if (tournaments.length === 0) {
      const now = new Date();
      tournaments.push({
        id: 'tournament_weekly', name: 'Weekly AI Championship',
        description: 'Compete against top AI models in creative and logical challenges',
        type: 'bracket', status: 'registration', participants: 4, maxParticipants: 16,
        rounds: 4, currentRound: 0, prize: '🏆 Weekly Champion',
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        registrationDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        isRegistered: false,
      });
    }

    res.json({ tournaments });
  } catch { res.json({ tournaments: [] }); }
});

// ── POST /tournaments/:tournamentId/join ────────────────────────

router.post('/tournaments/:tournamentId/join', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { userId, agentId } = req.body;
    if (!agentId) return res.status(400).json({ message: 'Agent ID required' });

    const tournament = await prisma.labExperiment.findUnique({ where: { experimentId: tournamentId } });
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    const output = tournament.output || {};
    const registrations = output.registrations || [];

    if (registrations.some((r) => r.userId === userId)) {
      return res.status(400).json({ message: 'Already registered for this tournament' });
    }

    registrations.push({ userId, agentId, joinedAt: new Date().toISOString() });

    await prisma.labExperiment.update({
      where: { experimentId: tournamentId },
      data: { output: { ...output, participants: (output.participants || 0) + 1, registrations } },
    });

    res.json({ success: true, message: 'Successfully joined tournament' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to join tournament' });
  }
});

// ── GET /history/:userId ────────────────────────────────────────

router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit || '50');

    const experiments = await prisma.labExperiment.findMany({
      where: { userId, experimentType: 'battle-arena', status: 'completed' },
      select: { experimentId: true, input: true, output: true, processingTime: true, tokensUsed: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const history = experiments.map((exp) => {
      const input = exp.input;
      const output = exp.output;
      const result = output?.result;
      return {
        id: exp.experimentId,
        type: input?.settings?.battleType || 'duel',
        opponent: result?.model2?.name || input?.settings?.model2 || 'AI',
        result: output?.userVote ? 'won' : 'completed',
        score: result?.model1?.tokens || 0,
        opponentScore: result?.model2?.tokens || 0,
        rounds: input?.settings?.round || 1,
        duration: (exp.processingTime || 0) / 1000,
        challenges: [input?.settings?.challengeType || 'general'],
        completedAt: exp.createdAt.toISOString(),
      };
    });

    res.json({ history });
  } catch { res.json({ history: [] }); }
});

// ── GET /leaderboard ────────────────────────────────────────────

router.get('/leaderboard', async (_req, res) => {
  try {
    const recentBattles = await prisma.labExperiment.findMany({
      where: { experimentType: 'battle-arena', status: 'completed', userId: { not: null } },
      select: { userId: true, output: true, tokensUsed: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const userStats = {};
    for (const battle of recentBattles) {
      const uid = battle.userId || 'anonymous';
      if (!userStats[uid]) userStats[uid] = { wins: 0, losses: 0, total: 0, streak: 0, lastActive: battle.createdAt.toISOString() };
      userStats[uid].total++;
      if (battle.output?.userVote) userStats[uid].wins++;
      else userStats[uid].losses++;
    }

    const leaderboard = Object.entries(userStats)
      .map(([userId, s]) => ({
        rank: 0, userId, username: `Player_${userId.slice(-6)}`,
        rating: Math.round(1000 + s.wins * 25 - s.losses * 15),
        wins: s.wins, losses: s.losses,
        winRate: s.total > 0 ? (s.wins / s.total) * 100 : 0,
        streak: s.streak, favoriteAgent: '', lastActive: s.lastActive,
      }))
      .sort((a, b) => b.rating - a.rating)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
      .slice(0, 50);

    res.json({ leaderboard });
  } catch { res.json({ leaderboard: [] }); }
});

// ── GET /agents ─────────────────────────────────────────────────

router.get('/agents', (_req, res) => {
  res.json({
    agents: [
      { id: 'gpt-4', name: 'Alpha', type: 'analytical', level: 85, skills: { creativity: 90, logic: 95, speed: 70, accuracy: 92, adaptability: 88 }, specialty: 'Deep reasoning & analysis', avatar: '🤖', stats: { battlesTotal: 0, battlesWon: 0, winRate: 0, averageScore: 0, highestScore: 0, ranking: 1 } },
      { id: 'claude-3', name: 'Nova', type: 'creative', level: 88, skills: { creativity: 95, logic: 90, speed: 75, accuracy: 93, adaptability: 91 }, specialty: 'Creative writing & nuanced thinking', avatar: '🧠', stats: { battlesTotal: 0, battlesWon: 0, winRate: 0, averageScore: 0, highestScore: 0, ranking: 2 } },
      { id: 'gemini', name: 'Quantum', type: 'strategic', level: 82, skills: { creativity: 85, logic: 88, speed: 90, accuracy: 87, adaptability: 86 }, specialty: 'Multimodal intelligence', avatar: '✨', stats: { battlesTotal: 0, battlesWon: 0, winRate: 0, averageScore: 0, highestScore: 0, ranking: 3 } },
      { id: 'mistral', name: 'Pulse', type: 'conversational', level: 78, skills: { creativity: 80, logic: 82, speed: 95, accuracy: 80, adaptability: 84 }, specialty: 'Speed-optimized responses', avatar: '⚡', stats: { battlesTotal: 0, battlesWon: 0, winRate: 0, averageScore: 0, highestScore: 0, ranking: 4 } },
      { id: 'llama-3', name: 'Titan', type: 'analytical', level: 80, skills: { creativity: 82, logic: 86, speed: 92, accuracy: 84, adaptability: 80 }, specialty: 'Open-source powerhouse', avatar: '🦙', stats: { battlesTotal: 0, battlesWon: 0, winRate: 0, averageScore: 0, highestScore: 0, ranking: 5 } },
      { id: 'cohere', name: 'Echo', type: 'conversational', level: 75, skills: { creativity: 78, logic: 80, speed: 85, accuracy: 82, adaptability: 79 }, specialty: 'Natural dialogue & understanding', avatar: '🔊', stats: { battlesTotal: 0, battlesWon: 0, winRate: 0, averageScore: 0, highestScore: 0, ranking: 6 } },
    ],
  });
});

export default router;
