import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // Get user's activity stats to compute badges
    const chatCount = await prisma.chatAnalyticsInteraction.count({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, lastLoginAt: true },
    });

    // Build badges based on activity
    const badges: any[] = [];
    let displayOrder = 1;

    // Welcome badge - everyone gets this
    badges.push({
      id: 'welcome',
      name: 'Welcome',
      description: 'Joined One Last AI',
      icon: '🎉',
      category: 'milestone',
      earnedAt: user?.createdAt?.toISOString() || new Date().toISOString(),
      rarity: 'common',
      displayOrder: displayOrder++,
    });

    // Activity-based badges
    if (chatCount >= 1) {
      badges.push({
        id: 'first_chat',
        name: 'First Steps',
        description: 'Completed your first AI conversation',
        icon: '💬',
        category: 'achievement',
        earnedAt: user?.createdAt?.toISOString() || new Date().toISOString(),
        rarity: 'common',
        displayOrder: displayOrder++,
      });
    }

    if (chatCount >= 10) {
      badges.push({
        id: 'chatter',
        name: 'Chatter',
        description: 'Had 10+ conversations',
        icon: '🗣️',
        category: 'achievement',
        earnedAt: new Date().toISOString(),
        rarity: 'common',
        displayOrder: displayOrder++,
      });
    }

    if (chatCount >= 50) {
      badges.push({
        id: 'conversationalist',
        name: 'Conversationalist',
        description: 'Had 50+ conversations',
        icon: '🎯',
        category: 'achievement',
        earnedAt: new Date().toISOString(),
        rarity: 'rare',
        displayOrder: displayOrder++,
      });
    }

    if (chatCount >= 100) {
      badges.push({
        id: 'enthusiast',
        name: 'AI Enthusiast',
        description: 'Had 100+ conversations',
        icon: '⭐',
        category: 'milestone',
        earnedAt: new Date().toISOString(),
        rarity: 'rare',
        displayOrder: displayOrder++,
      });
    }

    if (chatCount >= 500) {
      badges.push({
        id: 'power_user',
        name: 'Power User',
        description: 'Had 500+ conversations',
        icon: '🏆',
        category: 'milestone',
        earnedAt: new Date().toISOString(),
        rarity: 'epic',
        displayOrder: displayOrder++,
      });
    }

    if (chatCount >= 1000) {
      badges.push({
        id: 'master',
        name: 'AI Master',
        description: 'Had 1000+ conversations',
        icon: '👑',
        category: 'milestone',
        earnedAt: new Date().toISOString(),
        rarity: 'legendary',
        displayOrder: displayOrder++,
      });
    }

    // Early adopter badge
    if (user?.createdAt && new Date(user.createdAt).getFullYear() <= 2025) {
      badges.push({
        id: 'early_adopter',
        name: 'Early Adopter',
        description: 'Joined before 2026',
        icon: '🚀',
        category: 'special',
        earnedAt: user.createdAt.toISOString(),
        rarity: 'rare',
        displayOrder: displayOrder++,
      });
    }

    return NextResponse.json({
      success: true,
      badges,
      total: badges.length,
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
