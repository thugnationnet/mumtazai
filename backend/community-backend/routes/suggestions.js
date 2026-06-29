/**
 * SUGGESTIONS ROUTES
 * Handles community feature requests and feedback
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { requireAuth, optionalAuth } from '../lib/auth-middleware.js';
import { verifyTurnstileToken } from '../../lib/turnstile.js';

const router = express.Router();

/**
 * Submit a new suggestion (authenticated + Turnstile required)
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      userName,
      userEmail,
      isAnonymous,
      title,
      description,
      category,
      relatedTo,
      userPriority,
      tags,
      turnstileToken,
    } = req.body;

    // Turnstile is mandatory — reject if missing
    if (!turnstileToken) {
      return res.status(403).json({ error: 'Verification required. Please complete the challenge.' });
    }

    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileResult.success) {
      return res.status(403).json({ error: 'Bot verification failed. Please try again.' });
    }

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userId = req.isAuthenticated ? req.userId : null;

    const suggestion = await prisma.communitySuggestion.create({
      data: {
        suggestionId: `sug_${Date.now()}_${uuidv4().slice(0, 8)}`,
        userId,
        userEmail: isAnonymous ? null : (userEmail || null),
        userName: isAnonymous ? null : (userName || null),
        isAnonymous: isAnonymous || false,
        title,
        description,
        category,
        relatedTo: relatedTo || null,
        userPriority: userPriority || 'would-be-helpful',
        tags: tags || [],
        status: 'pending',
        votes: 0,
        votesUp: 0,
        votesDown: 0,
        voters: [],
        comments: [],
      },
    });

    res.json({
      success: true,
      suggestion: {
        suggestionId: suggestion.suggestionId,
        title: suggestion.title,
        status: suggestion.status,
        createdAt: suggestion.createdAt,
      },
      message: 'Thank you for your suggestion!',
    });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({ error: 'Failed to submit suggestion' });
  }
});

/**
 * Get all suggestions (public)
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      status,
      sort = 'votes',
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;

    let orderBy = {};
    switch (sort) {
    case 'votes':
      orderBy = { votesUp: 'desc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    default:
      orderBy = { votesUp: 'desc' };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);

    const [suggestions, total] = await Promise.all([
      prisma.communitySuggestion.findMany({
        where,
        orderBy,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true,
          suggestionId: true,
          title: true,
          description: true,
          category: true,
          status: true,
          votesUp: true,
          votesDown: true,
          userPriority: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.communitySuggestion.count({ where }),
    ]);

    res.json({
      success: true,
      suggestions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

/**
 * Get single suggestion details
 */
router.get('/:suggestionId', async (req, res) => {
  try {
    const { suggestionId } = req.params;

    const suggestion = await prisma.communitySuggestion.findFirst({
      where: { suggestionId },
    });

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    res.json({ success: true, suggestion });
  } catch (error) {
    console.error('Error fetching suggestion:', error);
    res.status(500).json({ error: 'Failed to fetch suggestion' });
  }
});

/**
 * Vote on a suggestion (authenticated)
 */
router.post('/:suggestionId/vote', requireAuth, async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const userId = req.userId;
    const { vote } = req.body; // vote: 1 or -1

    if (![1, -1].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote — must be 1 or -1' });
    }

    const suggestion = await prisma.communitySuggestion.findFirst({ where: { suggestionId } });
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    const voters = Array.isArray(suggestion.voters) ? [...suggestion.voters] : [];
    let votesUp = suggestion.votesUp || 0;
    let votesDown = suggestion.votesDown || 0;

    const existingVoteIndex = voters.findIndex((v) => v.userId === userId);

    if (existingVoteIndex >= 0) {
      const oldVote = voters[existingVoteIndex].vote;

      // Remove old vote count
      if (oldVote === 1) votesUp -= 1;
      else votesDown -= 1;

      if (oldVote === vote) {
        // Same vote = toggle off
        voters.splice(existingVoteIndex, 1);
      } else {
        // Different vote = change
        voters[existingVoteIndex].vote = vote;
        voters[existingVoteIndex].votedAt = new Date().toISOString();
        if (vote === 1) votesUp += 1;
        else votesDown += 1;
      }
    } else {
      // New vote
      voters.push({ userId, vote, votedAt: new Date().toISOString() });
      if (vote === 1) votesUp += 1;
      else votesDown += 1;
    }

    await prisma.communitySuggestion.update({
      where: { id: suggestion.id },
      data: {
        votesUp,
        votesDown,
        voters,
        votes: votesUp - votesDown,
      },
    });

    res.json({
      success: true,
      votes: { up: votesUp, down: votesDown },
    });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

/**
 * Add comment to suggestion (authenticated)
 */
router.post('/:suggestionId/comments', requireAuth, async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const userId = req.userId;
    const { userName, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text required' });
    }

    const suggestion = await prisma.communitySuggestion.findFirst({ where: { suggestionId } });
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    const comments = Array.isArray(suggestion.comments) ? [...suggestion.comments] : [];
    comments.push({
      userId,
      userName: userName || 'User',
      text: text.trim(),
      isOfficial: false,
      createdAt: new Date().toISOString(),
    });

    await prisma.communitySuggestion.update({
      where: { id: suggestion.id },
      data: { comments },
    });

    res.json({ success: true, message: 'Comment added' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

/**
 * Get user's suggestions
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const suggestions = await prisma.communitySuggestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        suggestionId: true,
        title: true,
        category: true,
        status: true,
        votesUp: true,
        votesDown: true,
        createdAt: true,
      },
    });

    res.json({ success: true, suggestions });
  } catch (error) {
    console.error('Error fetching user suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;
