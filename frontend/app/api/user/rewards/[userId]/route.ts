import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const sessionId = request.cookies.get('session_id')?.value ||
                      request.cookies.get('sessionId')?.value;

    console.log('[rewards] Cookies received:', {
      session_id: request.cookies.get('session_id')?.value?.substring(0, 10),
      sessionId: request.cookies.get('sessionId')?.value?.substring(0, 10),
      allCookies: request.cookies.getAll().map(c => c.name),
    });

    if (!sessionId) {
      console.log('[rewards] No session ID found in cookies');
      return NextResponse.json({ message: 'No session ID' }, { status: 401 });
    }

    console.log('[rewards] Looking up session:', sessionId.substring(0, 10) + '...');
    
    const sessionUser = await prisma.user.findFirst({
      where: {
        sessionId,
        sessionExpiry: { gt: new Date() },
      },
    });

    console.log('[rewards] Session user found:', sessionUser ? sessionUser.id : 'null');

    if (!sessionUser) {
      return NextResponse.json(
        { message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const sessionUserId = sessionUser.id;

    // Count user activity from chat interactions
    const userActivity = await prisma.chatAnalyticsInteraction.count({
      where: { userId: sessionUserId },
    });

    // Calculate points and level based on activity
    const startingPoints = Math.min(userActivity * 10, 5000);
    const startingLevel = Math.floor(startingPoints / 100) + 1;
    const pointsThisLevel = startingPoints % 100;
    const pointsToNextLevel = 100 - pointsThisLevel;

    // Build badges based on activity
    const badges: any[] = [];
    const rewardHistory: any[] = [];

    if (userActivity > 0) {
      badges.push({
        id: 'first_chat',
        name: 'First Steps',
        description: 'Your first AI conversation',
        earnedAt: sessionUser.createdAt,
        points: 50,
      });
      rewardHistory.push({
        title: 'First Steps Badge',
        points: 50,
        date: sessionUser.createdAt,
        type: 'badge',
      });
    }

    if (userActivity >= 5) {
      badges.push({
        id: 'getting_started',
        name: 'Getting Started',
        description: 'Completed 5 AI conversations',
        earnedAt: sessionUser.createdAt,
        points: 100,
      });
      rewardHistory.push({
        title: 'Getting Started Badge',
        points: 100,
        date: sessionUser.createdAt,
        type: 'badge',
      });
    }

    if (userActivity >= 10) {
      badges.push({
        id: 'ai_enthusiast',
        name: 'AI Enthusiast',
        description: 'Active AI user with 10+ conversations',
        earnedAt: sessionUser.createdAt,
        points: 200,
      });
      rewardHistory.push({
        title: 'AI Enthusiast Badge',
        points: 200,
        date: sessionUser.createdAt,
        type: 'badge',
      });
    }

    if (userActivity >= 50) {
      badges.push({
        id: 'power_user',
        name: 'Power User',
        description: 'Engaged in 50+ AI conversations',
        earnedAt: sessionUser.createdAt,
        points: 500,
      });
      rewardHistory.push({
        title: 'Power User Badge',
        points: 500,
        date: sessionUser.createdAt,
        type: 'badge',
      });
    }

    if (userActivity >= 100) {
      badges.push({
        id: 'ai_master',
        name: 'AI Master',
        description: 'Reached 100+ AI conversations',
        earnedAt: sessionUser.createdAt,
        points: 1000,
      });
      rewardHistory.push({
        title: 'AI Master Badge',
        points: 1000,
        date: sessionUser.createdAt,
        type: 'badge',
      });
    }

    // Account age badge
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(sessionUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (accountAgeDays >= 30) {
      badges.push({
        id: 'loyal_member',
        name: 'Loyal Member',
        description: 'Member for 30+ days',
        earnedAt: new Date(new Date(sessionUser.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000),
        points: 150,
      });
    }

    // Compute rewards data
    const rewardsData = {
      userId: sessionUserId,
      currentLevel: startingLevel,
      totalPoints: startingPoints,
      pointsThisLevel,
      pointsToNextLevel,
      badges,
      achievements: [],
      rewardHistory,
      streaks: {
        current: userActivity > 0 ? Math.min(userActivity, 7) : 0,
        longest: userActivity > 0 ? Math.min(userActivity, 30) : 0,
      },
      statistics: {
        totalBadgesEarned: badges.length,
        totalAchievementsCompleted: 0,
        averagePointsPerDay: userActivity > 0 ? Math.ceil(startingPoints / Math.max(accountAgeDays, 1)) : 0,
        daysActive: Math.min(accountAgeDays, 365),
      },
    };

    return NextResponse.json({ success: true, data: rewardsData });
  } catch (error) {
    console.error('Rewards fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
