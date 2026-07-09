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

    // Get user activity to build points history
    const interactions = await prisma.chatAnalyticsInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        totalTokens: true,
        status: true,
      },
    });

    // Build points history from interactions
    // Each successful interaction earns points
    const history = interactions.map((interaction, index) => {
      const points = interaction.status === 'completed' ? 10 : 5;
      return {
        id: interaction.id,
        type: 'earned' as const,
        amount: points,
        description: `AI conversation completed`,
        category: 'activity',
        timestamp: interaction.createdAt.toISOString(),
        metadata: {
          tokensUsed: interaction.totalTokens || 0,
        },
      };
    });

    // Add welcome bonus at the beginning (oldest)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (user?.createdAt) {
      history.push({
        id: 'welcome_bonus',
        type: 'bonus' as const,
        amount: 100,
        description: 'Welcome bonus for joining One Last AI',
        category: 'bonus',
        timestamp: user.createdAt.toISOString(),
        metadata: {},
      });
    }

    // Calculate totals
    const totalEarned = history
      .filter(h => h.type === 'earned' || h.type === 'bonus')
      .reduce((sum, h) => sum + h.amount, 0);

    return NextResponse.json({
      success: true,
      history: history.slice(0, 50), // Limit to 50 most recent
      summary: {
        totalTransactions: history.length,
        totalEarned,
        totalRedeemed: 0, // Would need separate tracking
      },
    });
  } catch (error) {
    console.error('Error fetching points history:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch points history' },
      { status: 500 }
    );
  }
}
