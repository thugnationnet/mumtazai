'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAgentChatUrl } from '@/lib/agentUrl';

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state } = useAuth();
  const agentName = searchParams.get('agent') || 'AI Agent';
  const agentSlug = searchParams.get('slug') || 'agent';
  const intent = searchParams.get('intent'); // Check for cancel intent
  const cancelled = searchParams.get('cancelled'); // Stripe checkout cancelled
  const [checking, setChecking] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    cancelled === 'true' ? 'Payment was cancelled. You can try again when ready.' : null
  );
  const [activeSubscription, setActiveSubscription] = useState<any>(null); // ✅ Track active subscription
  const [cancelling, setCancelling] = useState(false); // ✅ Track cancel operation

  // Check authentication and subscription status on mount
  useEffect(() => {
    const checkAccessAndRedirect = async () => {
      // First check if user is authenticated
      if (!state.isAuthenticated || !state.user) {
        const currentUrl = `/subscribe?agent=${encodeURIComponent(
          agentName
        )}&slug=${agentSlug}`;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }

      // Check if user already has subscription for this agent
      try {
        const user = state.user;
        if (user) {
          const response = await fetch('/api/subscriptions/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              agentId: agentSlug,
            }),
          });

          const data = await response.json();

          // Check for either hasAccess or hasActiveSubscription (backend response)
          if (
            (data.hasAccess || data.hasActiveSubscription) &&
            data.subscription
          ) {
            // ✅ Store active subscription data instead of redirecting
            // Calculate days remaining if not provided
            const subscription = data.subscription;
            if (!subscription.daysUntilRenewal && subscription.expiryDate) {
              const expiry = new Date(subscription.expiryDate);
              const now = new Date();
              subscription.daysUntilRenewal = Math.max(
                0,
                Math.ceil(
                  (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )
              );
            }
            setActiveSubscription(subscription);

            // If intent is cancel, auto-trigger the cancel confirmation
            if (intent === 'cancel') {
              // Small delay to ensure state is updated
              setTimeout(() => {
                const cancelButton = document.querySelector(
                  '[data-cancel-button]'
                ) as HTMLButtonElement;
                if (cancelButton) {
                  cancelButton.click();
                }
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }

      setChecking(false);
    };

    checkAccessAndRedirect();
  }, [agentName, agentSlug, router, state.isAuthenticated, state.user, intent]);

  // ✅ Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!state.user || !activeSubscription) return;

    if (
      !confirm(
        `Are you sure you want to cancel your ${activeSubscription.plan} subscription to ${agentName}? You will lose access immediately.`
      )
    ) {
      return;
    }

    setCancelling(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: state.user.id,
          agentId: agentSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Successfully cancelled
      setActiveSubscription(null);
      alert(
        'Access cancelled successfully. You can purchase again anytime to continue using this agent.'
      );

      // If came from agent management with cancel intent, redirect back
      if (intent === 'cancel') {
        router.push('/dashboard/agent-management');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to cancel access. Please try again.'
      );
    } finally {
      setCancelling(false);
    }
  };

  // Show loading state while checking
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Checking access status...</p>
        </div>
      </div>
    );
  }

  const subscriptionPlans = [
    {
      type: 'Daily',
      price: '$5',
      originalPrice: null as string | null,
      discountLabel: null as string | null,
      period: 'per day',
      features: [
        'Full access to ' + agentName,
        'Unlimited conversations',
        'Real-time responses',
        'No auto-renewal',
      ],
      recommended: false,
      billingCycle: 'daily',
    },
    {
      type: 'Weekly',
      price: '$7',
      originalPrice: '$35' as string | null,
      discountLabel: '🎁 SAVE 80%' as string | null,
      period: 'per week',
      features: [
        'Full access to ' + agentName,
        'Unlimited conversations',
        'Real-time responses',
        'No auto-renewal',
        'Save 80% vs daily',
      ],
      recommended: true,
      billingCycle: 'weekly',
    },
    {
      type: 'Monthly',
      price: '$30',
      originalPrice: '$150' as string | null,
      discountLabel: '🎁 SAVE 80%' as string | null,
      period: 'per month',
      features: [
        'Full access to ' + agentName,
        'Unlimited conversations',
        'Real-time responses',
        'No auto-renewal',
        'Save 80% vs daily',
        'Best value',
      ],
      recommended: false,
      billingCycle: 'monthly',
    },
    {
      type: 'Yearly',
      price: '$300',
      originalPrice: '$1,825' as string | null,
      discountLabel: '🎁 SAVE 84%' as string | null,
      period: 'per year',
      features: [
        'Full access to ' + agentName,
        'Unlimited conversations',
        'Real-time responses',
        'No auto-renewal',
        'Save 84% vs daily',
        'Best long-term value',
      ],
      recommended: false,
      billingCycle: 'yearly',
    },
  ];

  const handleSubscribe = async (plan: any) => {
    setErrorMessage(null);

    if (!state.isAuthenticated || !state.user) {
      const currentUrl = `/subscribe?agent=${encodeURIComponent(
        agentName
      )}&slug=${agentSlug}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // ✅ Prevent double-click / multiple simultaneous purchases
    if (processingPlan) {
      return; // Already processing another plan
    }

    setProcessingPlan(plan.billingCycle);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentSlug,
          agentName,
          plan: plan.billingCycle,
          userId: state.user.id,
          userEmail: state.user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.url) {
        // Check if user already has subscription
        if (data.alreadySubscribed && data.existingSubscription) {
          const expiryDate = new Date(
            data.existingSubscription.expiryDate
          ).toLocaleDateString();
          throw new Error(
            `You already have an active ${data.existingSubscription.plan} subscription. ` +
              `It expires on ${expiryDate} (${
                data.existingSubscription.daysUntilRenewal || 0
              } days remaining).`
          );
        }
        throw new Error(data.error || 'Failed to start checkout session');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Stripe checkout error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to start checkout. Please try again.';
      setErrorMessage(message);
      setProcessingPlan(null); // ✅ Reset on error
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -right-10 w-[200px] h-[600px] rotate-[-25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-violet-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 left-[12%] w-[180px] h-[700px] rotate-[22deg] rounded-[100px] bg-gradient-to-b from-transparent via-purple-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 right-[28%] w-[160px] h-[500px] rotate-[-32deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -left-10 w-[220px] h-[550px] rotate-[28deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[12%] right-[48%] w-[120px] h-[400px] rotate-[-12deg] rounded-[80px] bg-gradient-to-b from-white/40 via-violet-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/30 backdrop-blur-sm rounded-2xl mb-6 border border-white/50">
              <span className="text-4xl">🤖</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">
              {agentName}
            </h1>
            <p className="text-xl text-slate-500 mb-8">
              {activeSubscription
                ? `Manage your access to ${agentName}`
                : `Choose a one-time purchase plan for access to ${agentName}`}
            </p>
          </div>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Notice Banner */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4">
            <p className="text-slate-500 font-medium text-center">
              ⚠️ One agent per purchase. You can purchase access to multiple
              agents, but each requires a separate purchase. No auto-renewal.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="max-w-3xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center shadow-sm">
            {errorMessage}
          </div>
        )}

        {/* ✅ Active Subscription Info */}
        {activeSubscription && (
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">
                    ✅ Active Access
                  </h3>
                  <p className="text-slate-500">
                    You have full access to {agentName}
                  </p>
                </div>
                <div className="text-6xl">🎉</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/60">
                  <p className="text-slate-400 text-sm mb-1">Plan</p>
                  <p className="text-xl font-bold text-slate-700 capitalize">
                    {activeSubscription.plan}
                  </p>
                </div>
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/60">
                  <p className="text-slate-400 text-sm mb-1">Expires On</p>
                  <p className="text-xl font-bold text-slate-700">
                    {new Date(
                      activeSubscription.expiryDate
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/60">
                  <p className="text-slate-400 text-sm mb-1">Days Remaining</p>
                  <p className="text-xl font-bold text-slate-700">
                    {activeSubscription.daysUntilRenewal || 0}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={getAgentChatUrl(agentSlug)}
                  className="flex-1 text-center py-3 px-6 bg-gradient-to-r from-violet-500 to-purple-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] text-white font-bold rounded-xl shadow-sm transition-all duration-300 hover:scale-105"
                >
                  🚀 Start Chatting
                </Link>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  data-cancel-button
                  className="flex-1 py-3 px-6 bg-red-50 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? '⏳ Cancelling...' : '❌ Cancel Access'}
                </button>
              </div>

              <p className="text-slate-400 text-sm mt-4 text-center">
                💡 After expiration or cancellation, you can purchase a new plan
                anytime
              </p>
            </div>
          </div>
        )}

        {/* ✅ Pricing Plans (only show if no active subscription) */}
        {!activeSubscription && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
            {subscriptionPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 relative border-2 transition-all duration-300 ${
                  plan.recommended
                    ? 'border-purple-500 transform scale-105 shadow-lg'
                    : 'border-white/60 hover:border-purple-300 hover:shadow-lg'
                }`}
              >
                {plan.originalPrice && plan.discountLabel && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm animate-pulse">
                      {plan.discountLabel}
                    </span>
                  </div>
                )}
                {plan.recommended && !plan.originalPrice && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">
                    {plan.type}
                  </h3>
                  {plan.originalPrice && (
                    <div className="mb-1">
                      <span className="text-lg text-slate-400 line-through">{plan.originalPrice}</span>
                    </div>
                  )}
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-purple-600">
                      {plan.price}
                    </span>
                    <span className="text-slate-400 ml-2">{plan.period}</span>
                  </div>
                  {plan.originalPrice && plan.discountLabel && (
                    <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                      {plan.discountLabel.replace(/^🎁\s*/, '')} — Limited Time
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm text-slate-500"
                    >
                      <span className="text-green-500 mr-3">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={processingPlan !== null}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] text-white shadow-sm'
                      : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] text-white'
                  } ${
                    processingPlan !== null
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {processingPlan === plan.billingCycle
                    ? '⏳ Processing...'
                    : processingPlan
                      ? 'Processing...'
                      : `Purchase ${plan.type} Access`}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 max-w-4xl mx-auto mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-700">
            Important Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60">
              <h3 className="font-bold text-purple-600 mb-3">
                🔒 Individual Purchases
              </h3>
              <p className="text-sm text-slate-500">
                Each agent requires its own purchase. You can buy access to
                multiple agents individually, but each purchase is separate. No
                auto-renewal.
              </p>
            </div>
            <div className="p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60">
              <h3 className="font-bold text-purple-600 mb-3">
                💳 Unified Pricing
              </h3>
              <p className="text-sm text-slate-500">
                All agents use the same simple pricing: $5/day, $7/week,
                $30/month, or $300/year. Each purchase is one-time with no
                recurring charges.
              </p>
            </div>
            <div className="p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60">
              <h3 className="font-bold text-purple-600 mb-3">
                🔄 Easy Cancellation
              </h3>
              <p className="text-sm text-slate-500">
                Cancel your access anytime. Since there's no auto-renewal,
                you're never charged again. Access expires naturally at the end
                of your chosen period.
              </p>
            </div>
            <div className="p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60">
              <h3 className="font-bold text-purple-600 mb-3">
                ⚡ Instant Access
              </h3>
              <p className="text-sm text-slate-500">
                Once you purchase, you'll have immediate access to unlimited
                conversations with {agentName} for your chosen period.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="https://mumtaz.ai/agents"
            className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            ← Back to All Agents
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
