'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Lock, Crown, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionGuardProps {
  children: ReactNode;
  /** Custom message to show when user doesn't have subscription */
  message?: string;
  /** Where to redirect for subscription (default: /pricing) */
  pricingUrl?: string;
}

/**
 * SubscriptionGuard - Protects pages that require an active subscription
 *
 * Usage:
 * ```tsx
 * export default function MyProtectedPage() {
 *   return (
 *     <SubscriptionGuard>
 *       <YourPageContent />
 *     </SubscriptionGuard>
 *   );
 * }
 * ```
 *
 * This component:
 * 1. Shows loading spinner while checking auth/subscription status
 * 2. If not logged in: Shows login prompt
 * 3. If logged in but no subscription: Shows upgrade prompt
 * 4. If logged in with active subscription: Renders children
 */
export function SubscriptionGuard({
  children,
  message = 'This feature requires an active subscription to access.',
  pricingUrl = '/overview',
}: SubscriptionGuardProps) {
  const router = useRouter();
  const { state: authState } = useAuth();
  const { hasActiveSubscription, isLoading: subscriptionLoading } =
    useSubscriptionStatus();

  // Combined loading state
  const isLoading = authState.isLoading || subscriptionLoading;

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="min-h-screen neu-page-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Checking access...</p>
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
            Please log in to access this feature. Already have an account? Sign
            in below.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
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
            New to Mumtaz AI?{' '}
            <Link
              href="/overview"
              className="text-blue-600 hover:text-blue-500"
            >
              View our plans
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Logged in but no active subscription - show upgrade prompt
  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen neu-page-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 border border-slate-300 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 neu-icon rounded-full mb-6">
            <Crown className="w-10 h-10 text-amber-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Subscription Required
          </h1>

          <p className="text-slate-600 mb-8">{message}</p>

          <div className="neu-info rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">
              What you get:
            </h3>
            <ul className="text-left text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Access to all Network
                Tools
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Access to all
                Developer Utils
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Access to AI Lab
                Experiments
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Chat with AI Agents
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={pricingUrl}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 glass-card rounded-xl font-semibold text-slate-800 hover:shadow-lg hover:shadow-yellow-500/50 transition-all transform hover:scale-105"
            >
              <Crown className="w-5 h-5 text-amber-600" />
              View Subscription Plans
            </Link>

            <button
              onClick={() => router.back()}
              className="w-full px-6 py-3 border border-slate-400 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Has active subscription - render the protected content
  return <>{children}</>;
}

export default SubscriptionGuard;
