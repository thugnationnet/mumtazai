import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
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

    // Get user stats
    const [chatCount, user, uniqueAgents] = await Promise.all([
      prisma.chatAnalyticsInteraction.count({
        where: { userId },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true, lastLoginAt: true },
      }),
      prisma.chatAnalyticsInteraction.groupBy({
        by: ['agentId'],
        where: { userId, agentId: { not: null } },
      }),
    ]);

    // Check for newly unlocked achievements
    const newAchievements: any[] = [];

    // Chat milestones
    const chatMilestones = [
      { id: 'first_chat', target: 1, name: 'First Steps', points: 50 },
      { id: 'chat_10', target: 10, name: 'Getting Started', points: 100 },
      { id: 'chat_50', target: 50, name: 'Conversation Expert', points: 250 },
      { id: 'chat_100', target: 100, name: 'AI Enthusiast', points: 500 },
      { id: 'chat_500', target: 500, name: 'Power User', points: 1000 },
      { id: 'chat_1000', target: 1000, name: 'AI Master', points: 2500 },
    ];

    for (const milestone of chatMilestones) {
      if (chatCount >= milestone.target) {
        // Check if this is newly unlocked (would need persistent storage)
        // For now, just return all unlocked achievements
        newAchievements.push({
          id: milestone.id,
          name: milestone.name,
          description: `Completed ${milestone.target} AI conversations`,
          points: milestone.points,
          completed: true,
          completedAt: new Date().toISOString(),
          progress: {
            current: chatCount,
            target: milestone.target,
            percentage: 100,
          },
        });
      }
    }

    // Explorer achievement
    if (uniqueAgents.length >= 5) {
      newAchievements.push({
        id: 'explorer',
        name: 'Explorer',
        description: 'Tried 5 different AI agents',
        points: 150,
        completed: true,
        completedAt: new Date().toISOString(),
        progress: {
          current: uniqueAgents.length,
          target: 5,
          percentage: 100,
        },
      });
    }

    // Early adopter
    if (user?.createdAt && new Date(user.createdAt).getFullYear() < 2026) {
      newAchievements.push({
        id: 'early_adopter',
        name: 'Early Adopter',
        description: 'Joined One Last AI in the early days',
        points: 200,
        completed: true,
        completedAt: user.createdAt.toISOString(),
        progress: {
          current: 1,
          target: 1,
          percentage: 100,
        },
      });
    }

    // Calculate total points earned from new achievements
    const totalPointsEarned = newAchievements.reduce((sum, a) => sum + a.points, 0);

    return NextResponse.json({
      success: true,
      newAchievements: newAchievements.slice(-5), // Return only recent ones
      totalNewAchievements: newAchievements.length,
      totalPointsEarned,
      message: newAchievements.length > 0 
        ? `Congratulations! You've unlocked ${newAchievements.length} achievement(s)!`
        : 'No new achievements unlocked yet. Keep going!',
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check achievements' },
      { status: 500 }
    );
  }
}
