import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get top users by activity (chat interactions)
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            chatAnalyticsInteractions: true,
          },
        },
      },
      orderBy: {
        chatAnalyticsInteractions: {
          _count: 'desc',
        },
      },
      take: 20,
    });

    // Build leaderboard with calculated stats
    const leaderboard = topUsers.map((user, index) => {
      const interactionCount = user._count.chatAnalyticsInteractions;
      const points = interactionCount * 10 + 100; // 10 per interaction + 100 welcome bonus
      const level = Math.floor(points / 100) + 1;
      const badges = Math.min(Math.floor(interactionCount / 10) + 1, 10); // Estimate badges

      return {
        userId: user.id,
        username: user.name || `User ${user.id.slice(0, 6)}`,
        avatar: user.avatar,
        points,
        level,
        badges,
        achievements: Math.min(Math.floor(interactionCount / 20) + 1, 15),
        rank: index + 1,
      };
    });

    return NextResponse.json({
      success: true,
      leaderboard,
      total: leaderboard.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
