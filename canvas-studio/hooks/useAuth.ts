/**
 * useAuth — Authentication + Plan management hook
 * Single source of truth for session verification, plan checks,
 * post-checkout handling, and Stripe checkout initiation.
 *
 * Replaces the inline auth useEffect that was duplicated in App.tsx.
 */
import { useState, useEffect, useCallback } from 'react';
import type { PlanInfo } from '../components/PlanStatusBar';

export type { PlanInfo };

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  plan: PlanInfo | null;
  isLoading: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  hasPlan: boolean;
  showThankYou: boolean;
  dismissThankYou: () => void;
  error: string | null;
  login: (redirect?: string) => void;
  signup: (redirect?: string) => void;
  logout: () => Promise<void>;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
  checkPlan: () => Promise<void>;
  startCheckout: (planType: 'daily' | 'weekly' | 'monthly' | 'yearly') => Promise<void>;
  verifyPurchase: (sessionId: string) => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanChecked, setIsPlanChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  const checkAuth = useCallback(async () => {
    const parseUserFromResponse = async (res: Response): Promise<AuthUser | null> => {
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.success && data?.user?.id) {
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          avatar: data.user.avatar,
        };
      }
      return null;
    };

    try {
      // Primary path: same-origin auth session check on studio domain.
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });

      const primaryUser = await parseUserFromResponse(res);
      if (primaryUser) {
        setUser(primaryUser);
        return;
      }

      // Fallback path: check central domain directly to recover legacy host-only cookies.
      const centralRes = await fetch('https://mumtaz.ai/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });
      const centralUser = await parseUserFromResponse(centralRes);
      setUser(centralUser);
    } catch {
      setUser(null);
    }
  }, []);

  const checkPlan = useCallback(async () => {
    if (!user) { setPlan(null); setIsPlanChecked(true); return; }
    try {
      // Check for active GenCraft Pro subscription (canonical agentId: 'gencraft-pro')
      const res = await fetch(`/api/agent/subscriptions/check/${user.id}/gencraft-pro`, { credentials: 'include' });
      let canvasSub = null;
      if (res.ok) {
        const data = await res.json();
        canvasSub = (data.hasActiveSubscription || data.hasAccess) ? data.subscription : null;
      }

      if (canvasSub) {
        const startDate = new Date(canvasSub.startDate || canvasSub.createdAt);
        const expiryDate = canvasSub.expiryDate ? new Date(canvasSub.expiryDate) : null;
        const now = new Date();
        const daysRemaining = expiryDate
          ? Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000))
          : null;
        const hoursRemaining = expiryDate
          ? Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / 3600000))
          : null;
        setPlan({
          type: (canvasSub.plan || 'monthly') as PlanInfo['type'],
          price: canvasSub.price || 19,
          startDate: startDate.toISOString(),
          expiryDate: expiryDate?.toISOString() || null,
          isLifetime: canvasSub.plan === 'yearly',
          daysRemaining,
          hoursRemaining,
        });
      } else {
        setPlan(null);
      }
    } catch {
      setPlan(null);
    } finally {
      setIsPlanChecked(true);
    }
  }, [user]);

  const login = useCallback((redirect = 'https://studio.mumtaz.ai') => {
    window.location.href = `https://mumtaz.ai/auth/login?redirect=${encodeURIComponent(redirect)}`;
  }, []);

  const signup = useCallback((redirect = 'https://studio.mumtaz.ai') => {
    window.location.href = `https://mumtaz.ai/auth/signup?redirect=${encodeURIComponent(redirect)}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
      setPlan(null);
    }
  }, []);

  const startCheckout = useCallback(async (planType: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    if (!user) { setError('Please sign in first'); return; }
    try {
      const res = await fetch('/api/agent/subscriptions/subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'canvas-build',
          plan: planType,
          userId: user.id,
          email: user.email,
          successUrl: `${window.location.origin}/?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/`,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Checkout failed');
    } catch {
      setError('Failed to start checkout');
    }
  }, [user]);

  const verifyPurchase = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/agent/subscriptions/verify-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 6000);
        await checkPlan();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user, checkPlan]);

  const dismissThankYou = useCallback(() => setShowThankYou(false), []);
  const clearUser = useCallback(() => setUser(null), []);

  // On mount: check auth, then handle post-checkout redirect
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    })();
  }, [checkAuth]);

  // After auth resolves, check plan & handle purchase redirect
  useEffect(() => {
    if (!user) return;
    checkPlan();

    // Handle post-Stripe-checkout redirect
    const params = new URLSearchParams(window.location.search);
    const purchaseStatus = params.get('purchase');
    const sessionId = params.get('session_id');
    if (purchaseStatus === 'success' && sessionId) {
      verifyPurchase(sessionId);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user, checkPlan, verifyPurchase]);

  return {
    user,
    plan,
    isLoading,
    isReady: !isLoading && (!user || isPlanChecked),
    isAuthenticated: !!user,
    hasPlan: !!plan,
    showThankYou,
    dismissThankYou,
    error,
    login,
    signup,
    logout,
    clearUser,
    checkAuth,
    checkPlan,
    startCheckout,
    verifyPurchase,
  };
}
