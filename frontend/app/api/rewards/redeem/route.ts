import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const { rewardId } = await request.json();

    if (!rewardId) {
      return NextResponse.json(
        { success: false, message: 'Reward ID is required' },
        { status: 400 }
      );
    }

    // Define rewards catalog (same as catalog endpoint)
    const REWARDS = {
      'discount_10': { cost: 500, name: '10% Off Next Month' },
      'discount_25': { cost: 1000, name: '25% Off Next Month' },
      'extra_tokens_1000': { cost: 300, name: '1,000 Bonus Tokens' },
      'extra_tokens_5000': { cost: 1200, name: '5,000 Bonus Tokens' },
      'priority_support': { cost: 800, name: 'Priority Support' },
      'early_access': { cost: 1500, name: 'Early Access Pass', minLevel: 5 },
      'custom_agent': { cost: 5000, name: 'Custom Agent Training', minLevel: 10 },
      'free_month': { cost: 2500, name: 'Free Month Subscription', minLevel: 3 },
    };

    const reward = REWARDS[rewardId as keyof typeof REWARDS];
    if (!reward) {
      return NextResponse.json(
        { success: false, message: 'Invalid reward ID' },
        { status: 400 }
      );
    }

    // Calculate user's available points
    const chatCount = await prisma.chatAnalyticsInteraction.count({
      where: { userId: sessionUser.id },
    });
    const userPoints = chatCount * 10 + 100; // 10 per chat + 100 welcome bonus

    // Check if user has enough points
    if (userPoints < reward.cost) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Insufficient points. You have ${userPoints} points, but this reward costs ${reward.cost} points.` 
        },
        { status: 400 }
      );
    }

    // Check level requirements
    const userLevel = Math.floor(userPoints / 100) + 1;
    if ('minLevel' in reward && userLevel < reward.minLevel!) {
      return NextResponse.json(
        { 
          success: false, 
          message: `You need to be level ${reward.minLevel} to redeem this reward. You are level ${userLevel}.` 
        },
        { status: 400 }
      );
    }

    // Generate redemption code
    const code = `REWARD-${rewardId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // In a real implementation, we would:
    // 1. Store the redemption in a RewardRedemption table
    // 2. Deduct points from user's balance
    // 3. Send email confirmation
    // 4. Apply the reward (discount, tokens, etc.)

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ${reward.name}!`,
      transactionId: `TXN-${Date.now()}`,
      code,
      instructions: getRedemptionInstructions(rewardId),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to redeem reward' },
      { status: 500 }
    );
  }
}

function getRedemptionInstructions(rewardId: string): string {
  const instructions: Record<string, string> = {
    'discount_10': 'Your 10% discount will be automatically applied to your next billing cycle.',
    'discount_25': 'Your 25% discount will be automatically applied to your next billing cycle.',
    'extra_tokens_1000': 'Your bonus tokens have been added to your account balance.',
    'extra_tokens_5000': 'Your bonus tokens have been added to your account balance.',
    'priority_support': 'Your priority support status is now active. All support tickets will be prioritized.',
    'early_access': 'You now have early access to new features. Check the Lab section for exclusive previews.',
    'custom_agent': 'Our team will contact you within 48 hours to discuss your custom agent requirements.',
    'free_month': 'Your free month will be applied to your next billing cycle. You won\'t be charged.',
  };
  return instructions[rewardId] || 'Your reward has been redeemed successfully.';
}
