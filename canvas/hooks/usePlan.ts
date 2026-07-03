import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithCredentials } from '../fetchUtil';

export interface PlanInfo {
  plan: string;
  expiryDate: string | null;
  daysRemaining: number;
}

export function usePlan() {
  const { user, isAuthenticated } = useAuth();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const checkPlan = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setIsChecked(true);
      return;
    }
    try {
      const res = await fetchWithCredentials(
        `/api/agent/subscriptions/check/${user.id}/canvas`
      );
      const data = await res.json();
      if (data.hasActiveSubscription && data.subscription) {
        setPlan({
          plan: data.subscription.plan || 'monthly',
          expiryDate: data.subscription.expiryDate || null,
          daysRemaining: data.subscription.daysRemaining ?? 0,
        });
      } else {
        setPlan(null);
      }
    } catch {
      setPlan(null);
    } finally {
      setIsChecked(true);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      checkPlan();
    } else {
      setPlan(null);
      setIsChecked(true);
    }
  }, [isAuthenticated, checkPlan]);

  const startCheckout = useCallback(
    async (planType: 'weekly' | 'monthly' | 'yearly') => {
      if (!user) {
        window.location.href = `https://mumtaz.ai/auth/login?redirect=${encodeURIComponent(window.location.href)}`;
        return;
      }
      try {
        const res = await fetchWithCredentials('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: 'canvas',
            agentName: 'Canvas Build',
            plan: planType,
            userId: user.id,
            userEmail: user.email,
          }),
        });
        const data = await res.json();
        if (data.alreadySubscribed) {
          // Re-check plan in case the stored subscription wasn't picked up yet
          checkPlan();
          return;
        }
        if (data.url) {
          window.location.href = data.url;
        }
      } catch {
        // Checkout failed silently
      }
    },
    [user, checkPlan]
  );

  return {
    plan,
    hasPlan: !!plan,
    isChecked,
    checkPlan,
    startCheckout,
  };
}
