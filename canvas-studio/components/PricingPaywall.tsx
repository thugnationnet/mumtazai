/**
 * Canvas Studio Pricing Paywall
 * Shows 4 plans: Daily ($10), Weekly ($20), Monthly ($50), Yearly ($500)
 * Display prices doubled with 50% OFF Welcome Gift badge.
 * Recurring subscription — cancel anytime.
 */

import React, { useState } from 'react';
import { Zap, Crown, Infinity, Check, Loader2, ArrowRight, X, Shield, Clock, Sparkles } from 'lucide-react';

interface PricingPlan {
  id: 'daily' | 'weekly' | 'monthly' | 'yearly';
  name: string;
  price: number;
  originalPrice: number;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  badge?: string;
  popular?: boolean;
  color: string;
  gradient: string;
}

const PLANS: PricingPlan[] = [
  {
    id: 'daily',
    name: 'Daily',
    price: 10,
    originalPrice: 20,
    period: 'day',
    description: 'Try it out for a day',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Unlimited AI generations',
      'All AI models access',
      'Multi-page site builder',
      'One-click deploy to mumtaz.ai',
      'Export & download code',
      'Auto-renews daily',
    ],
    badge: '50% OFF',
    color: '#0EA5E9',
    gradient: 'from-sky-500 to-cyan-500',
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: 20,
    originalPrice: 40,
    period: 'week',
    description: 'Short-term flexibility',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Unlimited AI generations',
      'All AI models access',
      'Multi-page site builder',
      'One-click deploy to mumtaz.ai',
      'Export & download code',
      'Auto-renews weekly',
    ],
    badge: '50% OFF',
    color: '#3B82F6',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 50,
    originalPrice: 100,
    period: 'month',
    description: 'Best value for regular use',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Everything in Weekly',
      'Deploy to Vercel, Railway & more',
      'Custom subdomain hosting',
      'Priority AI model access',
      'Image-to-code conversion',
      'Voice input support',
      'Auto-renews monthly',
    ],
    badge: '50% OFF · Most Popular',
    popular: true,
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 500,
    originalPrice: 1000,
    period: 'year',
    description: 'Best value — full year access',
    icon: <Infinity className="w-6 h-6" />,
    features: [
      'Everything in Monthly',
      '365 days of full access',
      'All updates during the year',
      'Priority support',
      'Early access to new features',
      'Save 17% vs monthly',
      'Auto-renews yearly',
    ],
    badge: '50% OFF · Best Deal',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
  },
];

interface PricingPaywallProps {
  userId: string | null;
  userEmail: string | null;
  onClose?: () => void;
  isOverlay?: boolean;
}

const PricingPaywall: React.FC<PricingPaywallProps> = ({ userId, userEmail, onClose, isOverlay = true }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    if (!userId || !userEmail) {
      // Redirect to login
      window.location.href = 'https://mumtaz.ai/auth/login?redirect=https%3A%2F%2Fstudio.mumtaz.ai';
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use existing agent subscriptions endpoint for checkout
      const response = await fetch('/api/agent/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          agentId: 'canvas-build',
          plan: planId,
          userId,
          email: userEmail,
          successUrl: `${window.location.origin}/?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/`,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.alreadySubscribed) {
          setError(data.error);
        } else {
          setError(data.error || 'Failed to create checkout session');
        }
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className="relative w-full max-w-4xl mx-auto px-4 py-8">
      {/* Close button for overlay mode */}
      {isOverlay && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 text-violet-300 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Canvas Studio Pro
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
          Build Websites with AI
        </h2>
        <p className="text-slate-900 dark:text-white/60 text-lg max-w-xl mx-auto">
          Pick your cadence. Recurring subscription — auto-renews daily, weekly, monthly,
          or yearly. Cancel anytime from your account.
        </p>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white/40 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white/40 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>Cancel Anytime</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white/40 text-xs">
          <Check className="w-3.5 h-3.5" />
          <span>Instant Access</span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
              selectedPlan === plan.id
                ? 'border-violet-500 ring-2 ring-violet-500/30 scale-[1.02]'
                : 'border-slate-300 dark:border-white/10 hover:border-white/20'
            } ${plan.popular ? 'md:-translate-y-2' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {/* Popular badge */}
            {plan.badge && (
              <div className={`absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-bold text-slate-900 dark:text-white bg-gradient-to-r ${plan.gradient}`}>
                {plan.badge}
              </div>
            )}

            <div className={`p-6 ${plan.badge ? 'pt-10' : ''}`} style={{ background: 'rgba(15, 15, 25, 0.8)' }}>
              {/* Plan icon & name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-slate-900 dark:text-white`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold text-lg">{plan.name}</h3>
                  <p className="text-slate-900 dark:text-white/40 text-xs">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                {plan.originalPrice && (
                  <div className="mb-1">
                    <span className="text-lg text-slate-900 dark:text-white/30 line-through">${plan.originalPrice}</span>
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">${plan.price}</span>
                  <span className="text-slate-900 dark:text-white/40 text-sm">/ {plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="mt-1.5">
                    <span className="inline-block bg-violet-500/20 text-violet-400 text-xs font-bold px-2.5 py-1 rounded-full">
                      🎁 50% OFF
                    </span>
                  </div>
                )}
                {plan.id !== 'yearly' && (
                  <p className="text-slate-900 dark:text-white/30 text-xs mt-1">Recurring • Cancel anytime</p>
                )}
                {plan.id === 'yearly' && (
                  <p className="text-amber-400/70 text-xs mt-1">Recurring yearly • Cancel anytime</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                    <span className="text-slate-900 dark:text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Buy button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchase(plan.id);
                }}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedPlan === plan.id
                    ? `bg-gradient-to-r ${plan.gradient} text-slate-900 dark:text-white shadow-lg hover:shadow-xl`
                    : 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {!userId ? 'Sign in to Purchase' : `Get ${plan.name} Access`}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-md mx-auto mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="text-center">
        <p className="text-slate-900 dark:text-white/30 text-xs">
          Powered by Stripe • SSL encrypted • Cancel anytime • One Last AI Canvas Studio
        </p>
      </div>
    </div>
  );

  if (!isOverlay) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-4">
      {content}
    </div>
  );
};

export default PricingPaywall;
