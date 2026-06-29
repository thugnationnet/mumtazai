'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptions } from '@/contexts/SubscriptionContext';
import { Lock, Crown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAgentChatUrl } from '@/lib/agentUrl';

interface AgentSubscriptionGuardProps {
  children: React.ReactNode;
  agentId: string;
  agentName: string;
}

/**
 * AgentSubscriptionGuard - Protects agent chat pages that require a subscription to that specific agent
 *
 * Usage:
 * ```tsx
 * export default function BenSegaPage() {
 *   return (
 *     <AgentSubscriptionGuard agentId="ben-sega" agentName="Ben Sega">
 *       <UniversalAgentChat agent={agentConfig} />
 *     </AgentSubscriptionGuard>
 *   );
 * }
 * ```
 */

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function AgentSubscriptionGuardInner({
  children,
  agentId,
  agentName,
}: AgentSubscriptionGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: authState } = useAuth();
  const {
    hasActiveSubscription,
    getSubscription,
    getDaysRemaining,
    loading: subscriptionLoading,
    refreshSubscriptions,
  } = useSubscriptions();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);

  // Check if coming from successful checkout (fresh=1 parameter)
  useEffect(() => {
    const isFresh = searchParams.get('fresh') === '1';
    if (isFresh && !hasRefreshed && authState.isAuthenticated) {
      setIsRefreshing(true);
      setHasRefreshed(true);
      
      // Force refresh subscriptions after successful checkout
      refreshSubscriptions().finally(() => {
        setIsRefreshing(false);
        // Clean up the URL by removing the fresh parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('fresh');
        window.history.replaceState({}, '', url.toString());
      });
    }
  }, [searchParams, hasRefreshed, authState.isAuthenticated, refreshSubscriptions]);

  // Combined loading state
  const isLoading = authState.isLoading || subscriptionLoading || isRefreshing;

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="min-h-screen neu-page-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Checking access to {agentName}...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login prompt
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen neu-page-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 border border-slate-300 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 neu-icon rounded-full mb-6">
            <Lock className="w-10 h-10 text-blue-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-4">Login Required</h1>

          <p className="text-slate-600 mb-8">
            Please log in to chat with {agentName}.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(getAgentChatUrl(agentId))}`}
              className="w-full px-6 py-3 glass-card rounded-xl font-semibold text-slate-800 hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
            >
              Log In
            </Link>

            <Link
              href="/auth/signup"
              className="w-full px-6 py-3 border border-slate-400 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-all"
            >
              Create Account
            </Link>
          </div>

          <p className="text-slate-500 text-sm mt-6">
            Don't have a subscription?{' '}
            <Link
              href={`/subscribe?agent=${encodeURIComponent(agentName)}&slug=${agentId}`}
              className="text-blue-600 hover:text-blue-500"
            >
              Subscribe to {agentName}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Logged in but no subscription for this agent - show subscribe prompt
  if (!hasActiveSubscription(agentId)) {
    return (
      <div className="min-h-screen neu-page-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 border border-slate-300 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 neu-icon rounded-full mb-6">
            <Crown className="w-10 h-10 text-amber-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Subscribe to {agentName}
          </h1>

          <p className="text-slate-600 mb-8">
            You need an active subscription to chat with {agentName}. Choose a
            plan that works for you.
          </p>

          <div className="neu-info rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">
              Subscription includes:
            </h3>
            <ul className="text-left text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Unlimited chat with{' '}
                {agentName}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Voice chat
                capabilities
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> File & image uploads
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Chat history saved
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/subscribe?agent=${encodeURIComponent(agentName)}&slug=${agentId}`}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 glass-card rounded-xl font-semibold text-slate-800 hover:shadow-lg hover:shadow-yellow-500/50 transition-all transform hover:scale-105"
            >
              <Crown className="w-5 h-5 text-amber-600" />
              Subscribe Now
            </Link>

            <Link
              href="https://mumtaz.ai/agents"
              className="w-full px-6 py-3 border border-slate-400 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-all"
            >
              Browse Other Agents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Has active subscription for this agent - render the chat
  return <>{children}</>;
}

// Wrapper component with Suspense boundary for useSearchParams
export function AgentSubscriptionGuard(props: AgentSubscriptionGuardProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen neu-page-bg flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Loading...</p>
          </div>
        </div>
      }
    >
      <AgentSubscriptionGuardInner {...props} />
    </Suspense>
  );
}

export default AgentSubscriptionGuard;
