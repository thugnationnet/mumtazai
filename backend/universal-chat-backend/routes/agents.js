/**
 * AGENTS ROUTES - PRISMA VERSION
 * PostgreSQL-based agent management for Mumtaz AI
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { cache } from '../lib/cache.js';

const router = express.Router();

// ============================================
// GET /api/agents - List all agents (cached 5 min)
// ============================================
router.get('/', cache.middleware(300), async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        agentId: true,
        name: true,
        specialty: true,
        description: true,
        avatarUrl: true,
        specialties: true,
        tags: true,
        color: true,
        pricingDaily: true,
        pricingWeekly: true,
        pricingMonthly: true,
        totalUsers: true,
        totalSessions: true,
        averageRating: true,
      },
    });

    res.json({
      success: true,
      count: agents.length,
      agents: agents.map(agent => ({
        id: agent.agentId,
        name: agent.name,
        specialty: agent.specialty,
        description: agent.description,
        avatarUrl: agent.avatarUrl,
        tags: agent.tags,
        specialties: agent.specialties,
        color: agent.color,
        pricing: {
          daily: agent.pricingDaily,
          weekly: agent.pricingWeekly,
          monthly: agent.pricingMonthly,
        },
        stats: {
          totalUsers: agent.totalUsers,
          totalSessions: agent.totalSessions,
          averageRating: agent.averageRating,
        },
      })),
    });

  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents',
    });
  }
});

// ============================================
// GET /api/agents/:agentId - Get specific agent (cached 2 min)
// ============================================
router.get('/:agentId', cache.middleware(120), cache.middleware(120), async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { agentId },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: 'active' },
            },
            chatSessions: true,
          },
        },
      },
    });

    if (!agent || agent.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    res.json({
      success: true,
      agent: {
        id: agent.agentId,
        name: agent.name,
        specialty: agent.specialty,
        description: agent.description,
        avatarUrl: agent.avatarUrl,
        systemPrompt: agent.systemPrompt,
        welcomeMessage: agent.welcomeMessage,
        tags: agent.tags,
        specialties: agent.specialties,
        color: agent.color,
        pricing: {
          daily: agent.pricingDaily,
          weekly: agent.pricingWeekly,
          monthly: agent.pricingMonthly,
        },
        stats: {
          totalUsers: agent.totalUsers,
          totalSessions: agent.totalSessions,
          averageRating: agent.averageRating,
          activeSubscriptions: agent._count.subscriptions,
          totalChatSessions: agent._count.chatSessions,
        },
        aiProvider: agent.aiProvider,
      },
    });

  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent',
    });
  }
});

// ============================================
// GET /api/agents/category/:category - Get agents by category (using tags)
// ============================================
router.get('/category/:category', cache.middleware(300), cache.middleware(300), async (req, res) => {
  try {
    const { category } = req.params;

    const agents = await prisma.agent.findMany({
      where: {
        status: 'active',
        tags: { has: category },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        agentId: true,
        name: true,
        specialty: true,
        description: true,
        avatarUrl: true,
        tags: true,
        specialties: true,
        color: true,
        pricingDaily: true,
        pricingWeekly: true,
        pricingMonthly: true,
      },
    });

    res.json({
      success: true,
      category,
      count: agents.length,
      agents: agents.map(agent => ({
        id: agent.agentId,
        name: agent.name,
        specialty: agent.specialty,
        description: agent.description,
        avatarUrl: agent.avatarUrl,
        tags: agent.tags,
        specialties: agent.specialties,
        pricing: {
          daily: agent.pricingDaily,
          weekly: agent.pricingWeekly,
          monthly: agent.pricingMonthly,
        },
      })),
    });

  } catch (error) {
    console.error('Error fetching agents by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents by category',
    });
  }
});

// ============================================
// GET /api/agents/search/:query - Search agents
// ============================================
router.get('/search/:query', cache.middleware(120), cache.middleware(120), async (req, res) => {
  try {
    const { query } = req.params;

    const agents = await prisma.agent.findMany({
      where: {
        status: 'active',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { specialty: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        agentId: true,
        name: true,
        specialty: true,
        description: true,
        avatarUrl: true,
        tags: true,
        specialties: true,
        color: true,
        pricingDaily: true,
        pricingWeekly: true,
        pricingMonthly: true,
      },
    });

    res.json({
      success: true,
      query,
      count: agents.length,
      agents: agents.map(agent => ({
        id: agent.agentId,
        name: agent.name,
        specialty: agent.specialty,
        description: agent.description,
        avatarUrl: agent.avatarUrl,
        tags: agent.tags,
        specialties: agent.specialties,
        pricing: {
          daily: agent.pricingDaily,
          weekly: agent.pricingWeekly,
          monthly: agent.pricingMonthly,
        },
      })),
    });

  } catch (error) {
    console.error('Error searching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search agents',
    });
  }
});

// ============================================
// POST /api/agents - Create new agent (admin)
// ============================================
router.post('/', async (req, res) => {
  try {
    const {
      agentId,
      name,
      specialty,
      description,
      avatarUrl,
      systemPrompt,
      welcomeMessage,
      tags,
      specialties,
      color,
      pricingDaily,
      pricingWeekly,
      pricingMonthly,
      aiProvider,
    } = req.body;

    if (!agentId || !name || !systemPrompt || !welcomeMessage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, name, systemPrompt, welcomeMessage',
      });
    }

    const agent = await prisma.agent.create({
      data: {
        agentId,
        name,
        specialty,
        description,
        avatarUrl,
        systemPrompt,
        welcomeMessage,
        tags: tags || [],
        specialties: specialties || [],
        color,
        pricingDaily: pricingDaily || 0,
        pricingWeekly: pricingWeekly || 0,
        pricingMonthly: pricingMonthly || 0,
        aiProvider: aiProvider || {},
        status: 'active',
      },
    });

    res.status(201).json({
      success: true,
      agent,
    });

  } catch (error) {
    console.error('Error creating agent:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Agent with this ID already exists',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create agent',
    });
  }
});

// ============================================
// PUT /api/agents/:agentId - Update agent (admin)
// ============================================
router.put('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;

    const agent = await prisma.agent.update({
      where: { agentId },
      data: updateData,
    });

    res.json({
      success: true,
      agent,
    });

  } catch (error) {
    console.error('Error updating agent:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update agent',
    });
  }
});

// ============================================
// DELETE /api/agents/:agentId - Soft delete agent (admin)
// ============================================
router.delete('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await prisma.agent.update({
      where: { agentId },
      data: { status: 'deprecated' },
    });

    res.json({
      success: true,
      message: 'Agent deactivated successfully',
      agent,
    });

  } catch (error) {
    console.error('Error deleting agent:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete agent',
    });
  }
});

export default router;
