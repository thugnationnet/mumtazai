import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Static rewards catalog - can be moved to database later
const REWARDS_CATALOG = [
  {
    id: 'discount_10',
    name: '10% Off Next Month',
    description: 'Get 10% discount on your next subscription payment',
    category: 'discount',
    cost: 500,
    value: '10%',
    type: 'percentage',
    availability: 'unlimited',
    featured: true,
    popular: true,
  },
  {
    id: 'discount_25',
    name: '25% Off Next Month',
    description: 'Get 25% discount on your next subscription payment',
    category: 'discount',
    cost: 1000,
    value: '25%',
    type: 'percentage',
    availability: 'unlimited',
    featured: false,
    popular: true,
  },
  {
    id: 'extra_tokens_1000',
    name: '1,000 Bonus Tokens',
    description: 'Add 1,000 extra tokens to your account',
    category: 'feature',
    cost: 300,
    value: '1000 tokens',
    type: 'service',
    availability: 'unlimited',
    featured: true,
    popular: true,
  },
  {
    id: 'extra_tokens_5000',
    name: '5,000 Bonus Tokens',
    description: 'Add 5,000 extra tokens to your account',
    category: 'feature',
    cost: 1200,
    value: '5000 tokens',
    type: 'service',
    availability: 'unlimited',
    featured: false,
    popular: false,
  },
  {
    id: 'priority_support',
    name: 'Priority Support (1 Month)',
    description: 'Get priority response for all support tickets for 1 month',
    category: 'feature',
    cost: 800,
    value: '1 month',
    type: 'service',
    availability: 'unlimited',
    featured: false,
    popular: false,
  },
  {
    id: 'early_access',
    name: 'Early Access Pass',
    description: 'Get early access to new features for 3 months',
    category: 'exclusive',
    cost: 1500,
    value: '3 months',
    type: 'service',
    availability: 'limited',
    stock: 100,
    featured: true,
    popular: false,
    requirements: {
      minLevel: 5,
    },
  },
  {
    id: 'custom_agent',
    name: 'Custom Agent Training',
    description: 'One custom agent trained on your specific needs',
    category: 'exclusive',
    cost: 5000,
    value: '1 agent',
    type: 'service',
    availability: 'limited',
    stock: 50,
    featured: true,
    popular: false,
    requirements: {
      minLevel: 10,
    },
  },
  {
    id: 'free_month',
    name: 'Free Month Subscription',
    description: 'Get one month of subscription completely free',
    category: 'upgrade',
    cost: 2500,
    value: '1 month',
    type: 'service',
    availability: 'limited',
    stock: 200,
    featured: true,
    popular: true,
    requirements: {
      minLevel: 3,
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      rewards: REWARDS_CATALOG,
      total: REWARDS_CATALOG.length,
    });
  } catch (error) {
    console.error('Error fetching rewards catalog:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch rewards catalog' },
      { status: 500 }
    );
  }
}
