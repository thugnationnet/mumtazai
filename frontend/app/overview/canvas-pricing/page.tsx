'use client';

import { Suspense, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptions } from '@/contexts/SubscriptionContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Check,
  Lock,
  Shield,
  Zap,
  ArrowRight,
  Crown,
  Hammer,
  Bot,
  Code2,
  Monitor,
  Layers,
  Cloud,
  Globe,
  Terminal,
  ChevronDown,
  HelpCircle,
  Workflow,
  Cpu,
  FileCode,
  Smartphone,
} from 'lucide-react';

const CANVAS_BUILD_PLANS = [
  {
    id: 'daily',
    name: 'Daily',
    price: 10,
    originalPrice: 20,
    period: '/day',
    description: '24-hour access — try Canvas Build for a day',
    savings: null,
    features: [
      'AI-powered code generation',
      'Canvas-based visual builder',
      'Real-time collaboration',
      'Live preview & sandbox',
      'Code & no-code modes',
      'Build pipeline automation',
      'Deploy to production',
      'Export & download projects',
      'Unlimited builds',
      'Auto-renews daily',
    ],
    highlight: false,
    badge: '50% OFF',
    color: 'from-sky-500 to-cyan-500',
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: 20,
    originalPrice: 40,
    period: '/week',
    description: '7-day access to Canvas Build',
    savings: null,
    features: [
      'AI-powered code generation',
      'Canvas-based visual builder',
      'Real-time collaboration',
      'Live preview & sandbox',
      'Code & no-code modes',
      'Build pipeline automation',
      'Deploy to production',
      'Export & download projects',
      'Unlimited builds',
      'Auto-renews weekly',
    ],
    highlight: false,
    badge: '50% OFF',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 50,
    originalPrice: 100,
    period: '/month',
    description: '30-day access to Canvas Build',
    savings: 'Save 38% vs weekly',
    features: [
      'AI-powered code generation',
      'Canvas-based visual builder',
      'Real-time collaboration',
      'Live preview & sandbox',
      'Code & no-code modes',
      'Build pipeline automation',
      'Deploy to production',
      'Export & download projects',
      'Unlimited builds',
      'Auto-renews monthly',
    ],
    highlight: true,
    badge: '50% OFF · Most Popular',
    color: 'from-orange-600 to-red-500',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 500,
    originalPrice: 1000,
    period: '/year',
    description: '365-day access — just $41.67/month',
    savings: 'Save 17% vs monthly',
    features: [
      'AI-powered code generation',
      'Canvas-based visual builder',
      'Real-time collaboration',
      'Live preview & sandbox',
      'Code & no-code modes',
      'Build pipeline automation',
      'Deploy to production',
      'Export & download projects',
      'Unlimited builds',
      'Auto-renews yearly',
    ],
    highlight: false,
    badge: '50% OFF · Best Value',
    color: 'from-emerald-500 to-green-500',
  },
];

const BUILD_CAPABILITIES = [
  {
    icon: Workflow,
    title: 'AI Canvas Builder',
    description:
      'Multiple specialized AI agents collaborate on your project — a planner, coder, reviewer, and deployer working together simultaneously.',
  },
  {
    icon: Hammer,
    title: 'Canvas Visual Builder',
    description:
      'Drag-and-drop canvas interface for building apps visually. Connect components, define flows, and see results in real-time.',
  },
  {
    icon: Code2,
    title: 'Code & No-Code Modes',
    description:
      'Switch between visual no-code building and full code editing. Power users get direct code access, beginners get visual tools.',
  },
  {
    icon: Monitor,
    title: 'Live Preview & Sandbox',
    description:
      'Instant live preview of your builds in a secure sandbox environment. See changes as you make them without deploying.',
  },
  {
    icon: Cpu,
    title: 'Build Pipeline',
    description:
      'Automated build pipeline that validates, tests, and packages your project. Catch errors before they reach production.',
  },
  {
    icon: Globe,
    title: 'Production Deployment',
    description:
      'Deploy directly to production with one click. Supports multiple deployment targets and environments.',
  },
  {
    icon: Layers,
    title: 'Multi-File Projects',
    description:
      'Full project structure with file tree, multi-file editing, and project versioning. Build real applications, not just demos.',
  },
  {
    icon: Terminal,
    title: 'Terminal & Console',
    description:
      'Integrated terminal and console output for debugging and running commands directly within the builder.',
  },
  {
    icon: FileCode,
    title: 'Template Gallery',
    description:
      'Start from pre-built templates for common app patterns — dashboards, landing pages, APIs, and more.',
  },
  {
    icon: Cloud,
    title: 'Cloud Storage',
    description:
      'All projects saved to the cloud. Access your work from any device, anywhere. Never lose a build.',
  },
  {
    icon: Smartphone,
    title: 'Responsive Preview',
    description:
      'Preview your builds across desktop, tablet, and mobile viewports. Ensure your apps look great everywhere.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description:
      'All data encrypted in transit. Recurring subscription — cancel anytime. Your code and projects stay yours.',
  },
];

function CanvasPricingContent() {
  const { state } = useAuth();
  const { hasActiveSubscription } = useSubscriptions();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    cancelled === 'true' ? 'Payment was cancelled. You can try again when ready.' : null
  );

  const isSubscribed = hasActiveSubscription('canvas');

  const handleSubscribe = async (plan: string) => {
    if (!state.isAuthenticated || !state.user) {
      window.location.href = '/auth/login?redirect=/overview/canvas-pricing';
      return;
    }

    setLoading(plan);
    setError(null);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          agentId: 'canvas',
          agentName: 'Canvas Build',
          plan,
          userId: state.user.id,
          userEmail: state.user.email,
        }),
      });

      const data = await res.json();

      if (data.alreadySubscribed) {
        setError(
          `You already have an active ${data.existingSubscription?.plan} plan. To switch plans, cancel your current plan first, then purchase a new one.`
        );
        setLoading(null);
        return;
      }

      if (!data.success || !data.url) {
        setError(data.error || 'Failed to create checkout session');
        setLoading(null);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/60 mb-6">
            <Hammer className="w-8 h-8 text-purple-700" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
            Canvas Build
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
            AI-powered builder with canvas-based visual interface. Orchestrate
            multiple AI agents to plan, code, review, and deploy your projects — all
            from an intuitive drag-and-drop canvas.
          </p>

          {/* Overview Link */}
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 bg-white/60 hover:bg-white/80 border border-white/60 rounded-full px-5 py-2.5 transition-all duration-300 group text-slate-700"
          >
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">
              Looking for other plans? View All Products
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          </div>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Quick Stats */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">4</div>
                <div className="text-xs text-slate-500">Flexible Plans</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  <span className="text-sm line-through text-slate-400">$20/day</span>{' '}$10/day
                </div>
                <div className="text-xs text-slate-500">Starting From</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">50%</div>
                <div className="text-xs text-slate-500">Welcome Discount</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">Multi</div>
                <div className="text-xs text-slate-500">AI Agents</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 max-w-7xl mx-auto mb-16">
          {CANVAS_BUILD_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative group bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg transition-all duration-300 hover:shadow-xl ${
                plan.highlight
                  ? 'border-orange-300 shadow-md ring-2 ring-orange-100'
                  : 'border-white/80 hover:border-orange-200'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                      plan.badge.includes('50% OFF')
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white animate-pulse'
                        : plan.highlight
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                          : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    {plan.highlight ? (
                      <Crown className="w-5 h-5 text-white" />
                    ) : plan.id === 'yearly' ? (
                      <Sparkles className="w-5 h-5 text-white" />
                    ) : (
                      <Zap className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-700">
                      {plan.name}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-6">
                  {plan.description}
                </p>

                {plan.originalPrice && (
                  <div className="mb-1">
                    <span className="text-lg text-slate-400 line-through">${plan.originalPrice}</span>
                  </div>
                )}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl lg:text-5xl font-extrabold text-slate-800">
                    ${plan.price}
                  </span>
                  <span className="text-slate-400 text-lg">{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
                    🎁 50% OFF
                  </span>
                )}
                {plan.savings && (
                  <p className="text-sm text-green-600 font-medium mb-6">
                    {plan.savings}
                  </p>
                )}
                {!plan.savings && <div className="mb-6" />}

                {/* Key highlights */}
                <div className="space-y-2.5 mb-8">
                  {[
                    'AI canvas builder',
                    'Canvas visual builder',
                    'Live preview & sandbox',
                    'Build pipeline',
                    'Production deployment',
                    'Unlimited builds',
                    'Recurring · cancel anytime',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          plan.highlight
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-slate-500">{feature}</span>
                    </div>
                  ))}
                </div>

                {isSubscribed ? (
                  <div className="w-full py-3 rounded-xl bg-green-50 border border-green-200 text-center">
                    <span className="text-green-600 font-semibold text-sm flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Active Subscription
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!loading}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      `Get ${plan.name} Plan`
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* All Plans Include Banner */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/60 shadow-lg">
            <p className="text-orange-700 font-semibold text-lg mb-1">
              All plans are recurring subscriptions — cancel anytime from your account
            </p>
            <p className="text-slate-500 text-sm">
              Pick the cadence that fits your workflow. Your card is charged every {`{daily / weekly / monthly / yearly}`} until you cancel. No hidden fees.
            </p>
          </div>
        </div>

        {/* What You Can Do With Canvas Build */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-700 mb-3">
              What You Can Build with Canvas Build
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              A AI-powered builder with a visual canvas interface. Here&apos;s
              everything included in every plan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BUILD_CAPABILITIES.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <div
                  key={i}
                  className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-white/60 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-2xl font-bold text-slate-700">
                Plan Comparison
              </h2>
              <p className="text-slate-500 mt-1">
                Every plan includes all features — you only choose your cadence. Recurring, cancel anytime.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-transparent border-b border-white/80">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sky-600">
                      Daily (<span className="line-through text-slate-400">$20</span> $10)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-orange-600">
                      Weekly (<span className="line-through text-slate-400">$40</span> $20)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-orange-700 bg-orange-50/50">
                      Monthly (<span className="line-through text-slate-400">$100</span> $50)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-emerald-600">
                      Yearly (<span className="line-through text-slate-400">$1000</span> $500)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'AI Canvas Builder', d: true, w: true, m: true, y: true },
                    { feature: 'Canvas Visual Builder', d: true, w: true, m: true, y: true },
                    { feature: 'Live Preview & Sandbox', d: true, w: true, m: true, y: true },
                    { feature: 'Code & No-Code Modes', d: true, w: true, m: true, y: true },
                    { feature: 'Build Pipeline', d: true, w: true, m: true, y: true },
                    { feature: 'Production Deployment', d: true, w: true, m: true, y: true },
                    { feature: 'Multi-File Projects', d: true, w: true, m: true, y: true },
                    { feature: 'Terminal & Console', d: true, w: true, m: true, y: true },
                    { feature: 'Template Gallery', d: true, w: true, m: true, y: true },
                    { feature: 'Cloud Storage', d: true, w: true, m: true, y: true },
                    { feature: 'Responsive Preview', d: true, w: true, m: true, y: true },
                    { feature: 'Export & Download', d: true, w: true, m: true, y: true },
                    { feature: 'Builds', d: 'Unlimited', w: 'Unlimited', m: 'Unlimited', y: 'Unlimited' },
                    { feature: 'Billing', d: 'Daily', w: 'Weekly', m: 'Monthly', y: 'Yearly' },
                    { feature: 'Cancel Anytime', d: 'Yes', w: 'Yes', m: 'Yes', y: 'Yes' },
                    { feature: 'Renewal Period', d: 'Every day', w: 'Every 7 days', m: 'Every 30 days', y: 'Every 365 days' },
                    { feature: 'Effective Price', d: '$10/day', w: '~$2.86/day', m: '~$1.67/day', y: '~$1.37/day' },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-white/80 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-transparent/50'
                      }`}
                    >
                      <td className="px-6 py-3.5 font-medium text-slate-700">
                        {row.feature}
                      </td>
                      {(['d', 'w', 'm', 'y'] as const).map((key) => (
                        <td
                          key={key}
                          className={`px-6 py-3.5 text-center ${
                            key === 'm' ? 'bg-orange-50/30' : ''
                          }`}
                        >
                          {typeof row[key] === 'boolean' ? (
                            <span className="text-green-500">
                              <svg
                                className="w-5 h-5 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </span>
                          ) : (
                            <span
                              className={`font-medium ${
                                key === 'm' ? 'text-orange-600' : 'text-slate-500'
                              }`}
                            >
                              {row[key]}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                Secure payment via Stripe
              </span>
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-slate-500" />
                </div>
                Cancel anytime
              </span>
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-slate-500" />
                </div>
                Instant access
              </span>
            </div>
            <p className="text-center text-sm text-slate-400 mt-4">
              All plans are recurring subscriptions. Your card is auto-renewed at the cadence you choose —
              daily, weekly, monthly, or yearly. Cancel anytime from your account; access continues until
              the end of the current billing period.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full text-sm font-medium text-orange-600 mb-4">
              <HelpCircle className="w-4 h-4" />
              Common Questions
            </div>
            <h2 className="text-3xl font-bold text-slate-700 mb-3">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'What is Canvas Build?',
                a: 'Canvas Build is a AI-powered builder with a visual canvas interface. Specialized AI agents help build your projects from start to finish.',
              },
              {
                q: 'How is Canvas Build different from GenCraft Pro?',
                a: 'GenCraft Pro is a single-agent AI IDE for code generation. Canvas Build uses multiple AI agents working together with a visual canvas interface — ideal for larger projects, team-like workflows, and visual app building.',
              },
              {
                q: 'Are all features the same on every plan?',
                a: 'Yes. Daily, Weekly, Monthly, and Yearly plans all include identical features — AI canvas builder, canvas builder, deployment, and unlimited builds. The only difference is the billing cadence and price.',
              },
              {
                q: 'Is this a subscription or one-time purchase?',
                a: 'Recurring subscription. Pick a cadence (daily $10 / weekly $20 / monthly $50 / yearly $500) and your card is auto-charged at that interval. Cancel anytime from your account; access continues until the end of the current billing period.',
              },
              {
                q: 'Can I switch between plans?',
                a: 'Yes. Cancel your current plan from your account, then subscribe to the cadence you prefer. Switching is instant and you can do it at any time.',
              },
              {
                q: 'What happens when I cancel?',
                a: 'Your access continues until the end of the current billing period. After that you stop being charged. Projects and data are retained so you can resume by subscribing again.',
              },
              {
                q: 'Can I deploy apps I build?',
                a: 'Yes. Canvas Build includes production deployment capabilities. Deploy your projects directly from the canvas with one click.',
              },
              {
                q: 'Do I need coding experience?',
                a: 'No. Canvas Build includes both code and no-code modes. Beginners can use the visual canvas builder while power users can switch to direct code editing at any time.',
              },
            ].map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center themed-section-bg">
            {/* Glass Pillars */}
            <div className="absolute left-[10%] top-0 w-32 h-full bg-gradient-to-b from-white/30 via-white/10 to-white/25 rounded-full blur-2xl transform -skew-x-12" />
            <div className="absolute right-[15%] top-0 w-24 h-full bg-gradient-to-b from-white/25 via-white/5 to-white/20 rounded-full blur-2xl transform skew-x-12" />
            {/* Chrome Shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <h2 className="relative z-10 text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
              Explore Other Products
            </h2>
            <p className="relative z-10 text-lg text-slate-600 mb-8">
              Check out GenCraft Pro for AI code generation, AI Agent subscriptions
              for personalized conversations, or Spaces for community sharing.
            </p>
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/overview"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
              >
                View All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://build.mumtaz.ai"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/60 hover:bg-white/80 text-slate-800 font-semibold rounded-xl transition border border-white/60"
              >
                Try Canvas Build
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/60 transition-colors"
      >
        <span className="font-semibold text-slate-700 pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function CanvasPricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CanvasPricingContent />
    </Suspense>
  );
}
