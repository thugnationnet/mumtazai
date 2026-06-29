/**
 * Agent Subscription Service
 * Handles subscription operations via API calls to backend
 */

// Always use relative path - let Next.js API routes handle proxying to backend
const API_BASE = '/api';

export interface AgentSubscription {
  _id: string;
  userId: string;
  agentId: string;
  plan: 'daily' | 'weekly' | 'monthly' | 'yearly';
  price: number;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  expiryDate: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  originalPrice: number | null;
  period: string;
  description: string;
  priceFormatted: string;
  originalPriceFormatted: string | null;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'daily',
    name: 'daily',
    displayName: 'Daily Plan',
    price: 5,
    originalPrice: null,
    period: 'day',
    description: 'Perfect for short-term projects',
    priceFormatted: '$5.00',
    originalPriceFormatted: null,
  },
  {
    id: 'weekly',
    name: 'weekly',
    displayName: 'Weekly Plan',
    price: 7,
    originalPrice: 35,
    period: 'week',
    description: 'Great for weekly projects — save 80%',
    priceFormatted: '$7.00',
    originalPriceFormatted: '$35.00',
  },
  {
    id: 'monthly',
    name: 'monthly',
    displayName: 'Monthly Plan',
    price: 30,
    originalPrice: 150,
    period: 'month',
    description: 'Best value for ongoing work — save 80%',
    priceFormatted: '$30.00',
    originalPriceFormatted: '$150.00',
  },
  {
    id: 'yearly',
    name: 'yearly',
    displayName: 'Yearly Plan',
    price: 300,
    originalPrice: 1825,
    period: 'year',
    description: 'Best long-term value — save 84% vs daily',
    priceFormatted: '$300.00',
    originalPriceFormatted: '$1,825.00',
  },
];

class AgentSubscriptionService {
  // Check if user has active subscription for agent
  async checkSubscription(
    userId: string,
    agentId: string
  ): Promise<{
    hasActiveSubscription: boolean;
    subscription: AgentSubscription | null;
  }> {
    try {
      const response = await fetch(
        `${API_BASE}/agent/subscriptions/check/${userId}/${agentId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to check subscription: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { hasActiveSubscription: false, subscription: null };
    }
  }

  // Create new subscription
  async createSubscription(
    userId: string,
    agentId: string,
    plan: string
  ): Promise<AgentSubscription> {
    try {
      const response = await fetch(
        `${API_BASE}/agent/subscriptions/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, agentId, plan }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to create subscription: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Get user's all subscriptions
  async getUserSubscriptions(userId: string): Promise<AgentSubscription[]> {
    try {
      const response = await fetch(
        `${API_BASE}/agent/subscriptions/user/${userId}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get subscriptions: ${response.statusText}`);
      }

      const data = await response.json();
      return data.subscriptions || [];
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE}/agent/subscriptions/${subscriptionId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to cancel subscription: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string,
    updates: {
      status?: string;
      plan?: string;
    }
  ): Promise<AgentSubscription> {
    try {
      const response = await fetch(
        `${API_BASE}/agent/subscriptions/${subscriptionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to update subscription: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.subscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Get plan by ID
  getPlan(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
  }

  // Format expiry date
  formatExpiryDate(expiryDate: string): string {
    const date = new Date(expiryDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Check if subscription is expiring soon (within 24 hours)
  isExpiringSoon(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const timeDiff = expiry.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    return hoursDiff > 0 && hoursDiff <= 24;
  }
}

export const agentSubscriptionService = new AgentSubscriptionService();
