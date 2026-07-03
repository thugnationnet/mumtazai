'use client';

// Stub subscription hook for demo — always returns free/active
export function useSubscriptionStatus() {
  return {
    plan: 'free',
    isActive: true,
    hasActiveSubscription: false,
    loading: false,
    error: null,
    features: {},
    refresh: async () => {},
  };
}
