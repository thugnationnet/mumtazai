import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Achievement definitions - computed from user activity
const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_chat',
    name: 'First Steps',
    description: 'Complete your first AI conversation',
    category: 'usage',
    icon: '💬',
    points: 50,
    rarity: 'common',
    target: 1,
    requirements: ['Complete 1 chat interaction'],
  },
  {
    id: 'chat_10',
    name: 'Getting Started',
    description: 'Complete 10 AI conversations',
    category: 'usage',
    icon: '🗣️',
    points: 100,
    rarity: 'common',
    target: 10,
    requirements: ['Complete 10 chat interactions'],
  },
  {
    id: 'chat_50',
    name: 'Conversation Expert',
    description: 'Complete 50 AI conversations',
    category: 'usage',
    icon: '🎯',
    points: 250,
    rarity: 'rare',
    target: 50,
    requirements: ['Complete 50 chat interactions'],
  },
  {
    id: 'chat_100',
    name: 'AI Enthusiast',
    description: 'Complete 100 AI conversations',
    category: 'milestone',
    icon: '⭐',
    points: 500,
    rarity: 'rare',
    target: 100,
    requirements: ['Complete 100 chat interactions'],
  },
  {
    id: 'chat_500',
    name: 'Power User',
    description: 'Complete 500 AI conversations',
    category: 'milestone',
    icon: '🏆',
    points: 1000,
    rarity: 'epic',
    target: 500,
    requirements: ['Complete 500 chat interactions'],
  },
  {
    id: 'chat_1000',
    name: 'AI Master',
    description: 'Complete 1000 AI conversations',
    category: 'milestone',
    icon: '👑',
    points: 2500,
    rarity: 'legendary',
    target: 1000,
    requirements: ['Complete 1000 chat interactions'],
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day login streak',
    category: 'usage',
    icon: '🔥',
    points: 150,
    rarity: 'common',
    target: 7,
    requirements: ['Log in for 7 consecutive days'],
  },
  {
    id: 'streak_30',
    name: 'Monthly Champion',
    description: 'Maintain a 30-day login streak',
    category: 'milestone',
    icon: '🌟',
    points: 500,
    rarity: 'rare',
    target: 30,
    requirements: ['Log in for 30 consecutive days'],
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined One Last AI in the early days',
    category: 'special',
    icon: '🚀',
    points: 200,
    rarity: 'rare',
    target: 1,
    requirements: ['Account created before 2026'],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Try 5 different AI agents',
    category: 'usage',
    icon: '🧭',
    points: 150,
    rarity: 'common',
    target: 5,
    requirements: ['Use 5 different AI agents'],
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const sessionId = request.cookies.get('session_id')?.value ||
                      request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify session
    const sessionUser = await prisma.user.findFirst({
      where: {
        sessionId,
        sessionExpiry: { gt: new Date() },
      },
    });

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      );
    }

    const userId = sessionUser.id;

    // Get user's chat count for progress calculation
    const chatCount = await prisma.chatAnalyticsInteraction.count({
      where: { userId },
    });

    // Get unique agents used
    const uniqueAgents = await prisma.chatAnalyticsInteraction.groupBy({
      by: ['agentId'],
      where: { userId, agentId: { not: null } },
    });

    // Calculate streak (simplified - based on last login)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, lastLoginAt: true },
    });

    const daysSinceCreation = user?.createdAt 
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Simplified streak calculation (would need separate tracking for real implementation)
    const estimatedStreak = Math.min(daysSinceCreation, 7);

    // Build achievements with progress
    const achievements = ACHIEVEMENT_DEFINITIONS.map((def) => {
      let current = 0;
      let completed = false;
      let completedAt: string | undefined;

      switch (def.id) {
        case 'first_chat':
        case 'chat_10':
        case 'chat_50':
        case 'chat_100':
        case 'chat_500':
        case 'chat_1000':
          current = chatCount;
          completed = chatCount >= def.target;
          break;
        case 'streak_7':
        case 'streak_30':
          current = estimatedStreak;
          completed = estimatedStreak >= def.target;
          break;
        case 'early_adopter':
          const createdYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : 2030;
          current = createdYear < 2026 ? 1 : 0;
          completed = createdYear < 2026;
          break;
        case 'explorer':
          current = uniqueAgents.length;
          completed = uniqueAgents.length >= def.target;
          break;
      }

      if (completed && user?.createdAt) {
        completedAt = new Date().toISOString();
      }

      return {
        id: def.id,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        points: def.points,
        rarity: def.rarity,
        progress: {
          current: Math.min(current, def.target),
          target: def.target,
          percentage: Math.min((current / def.target) * 100, 100),
        },
        completed,
        completedAt,
        requirements: def.requirements,
      };
    });

    return NextResponse.json({
      success: true,
      achievements,
      summary: {
        total: achievements.length,
        completed: achievements.filter(a => a.completed).length,
        inProgress: achievements.filter(a => !a.completed && a.progress.current > 0).length,
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
