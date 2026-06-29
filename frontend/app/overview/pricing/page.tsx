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
  Paintbrush,
  Bot,
  Code2,
  Monitor,
  Mic,
  Image,
  Video,
  Layers,
  Cloud,
  Globe,
  FileCode,
  Terminal,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';

const GENCRAFT_PLANS = [
  {
    id: 'daily',
    name: 'Daily',
    price: 10,
    originalPrice: 20,
    period: '/day',
    description: '24-hour access — try GenCraft Pro for a day',
    savings: null,
    features: [
      'Full AI-powered app generation',
      'Multiple AI models optimized for every task',
      'Live preview & Sandpack runtime',
      'Monaco & CodeMirror editors',
      '40+ programming languages',
      'Multi-file project support',
      'Image-to-code conversion',
      'AI video generation',
      'Deploy to 5 platforms',
      'Export & download projects',
      'Unlimited generations',
      'Auto-renews daily — cancel anytime',
    ],
    highlight: false,
    badge: '50% OFF',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: 15,
    originalPrice: 30,
    period: '/week',
    description: '7-day access to GenCraft Pro',
    savings: 'Save 79% vs daily',
    features: [
      'Full AI-powered app generation',
      'Multiple AI models optimized for every task',
      'Live preview & Sandpack runtime',
      'Monaco & CodeMirror editors',
      '40+ programming languages',
      'Multi-file project support',
      'Image-to-code conversion',
      'AI video generation',
      'Deploy to 5 platforms',
      'Export & download projects',
      'Unlimited generations',
      'Auto-renews weekly — cancel anytime',
    ],
    highlight: false,
    badge: '50% OFF',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 30,
    originalPrice: 60,
    period: '/month',
    description: '30-day access to GenCraft Pro',
    savings: 'Save 50% vs weekly',
    features: [
      'Full AI-powered app generation',
      'Multiple AI models optimized for every task',
      'Live preview & Sandpack runtime',
      'Monaco & CodeMirror editors',
      '40+ programming languages',
      'Multi-file project support',
      'Image-to-code conversion',
      'AI video generation',
      'Deploy to 5 platforms',
      'Export & download projects',
      'Unlimited generations',
      'Auto-renews monthly — cancel anytime',
    ],
    highlight: true,
    badge: '50% OFF · Most Popular',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 300,
    originalPrice: 600,
    period: '/year',
    description: '365-day access — just $25/month',
    savings: 'Save 17% vs monthly',
    features: [
      'Full AI-powered app generation',
      'Multiple AI models optimized for every task',
      'Live preview & Sandpack runtime',
      'Monaco & CodeMirror editors',
      '40+ programming languages',
      'Multi-file project support',
      'Image-to-code conversion',
      'AI video generation',
      'Deploy to 5 platforms',
      'Export & download projects',
      'Unlimited generations',
      'Auto-renews yearly — cancel anytime',
    ],
    highlight: false,
    badge: '50% OFF · Best Value',
    color: 'from-emerald-500 to-green-500',
  },
];

const APP_CAPABILITIES = [
  {
    icon: Code2,
    title: 'AI Code Generation',
    description:
      'Describe any app in natural language and GenCraft Pro generates full working code — frontend, backend, styling, and logic.',
  },
  {
    icon: Monitor,
    title: 'Live Preview & Sandpack',
    description:
      'See your app running in real-time with Sandpack runtime. Edit code and watch changes instantly in the browser.',
  },
  {
    icon: FileCode,
    title: 'Dual Code Editors',
    description:
      'Monaco Editor (VS Code engine) and CodeMirror 6 — syntax highlighting, IntelliSense, and multi-file editing for 40+ languages.',
  },
  {
    icon: Layers,
    title: 'Multi-File Projects',
    description:
      'Full project structure with file tree, multi-file support, and project history. Build real apps, not just snippets.',
  },
  {
    icon: Terminal,
    title: '35 AI Tools',
    description:
      'AI calls 35 specialized tools: file create/edit/delete, terminal execution, npm build validation, and more — up to 10 rounds per request.',
  },
  {
    icon: Globe,
    title: 'Deploy to 5 Platforms',
    description:
      'One-click deployment to Vercel, Netlify, GitHub Pages, AWS, and cloud preview. Export and download projects locally.',
  },
  {
    icon: Image,
    title: 'Image-to-Code',
    description:
      'Upload a screenshot or design mockup and GenCraft Pro converts it into working code using Azure AI Vision.',
  },
  {
    icon: Video,
    title: 'AI Video Generation',
    description:
      'Generate videos from text prompts using integrated AI video tools powered by fal.ai and Minimax.',
  },
  {
    icon: Mic,
    title: 'Voice Input',
    description:
      'Speak your instructions instead of typing. Voice-to-text input lets you describe apps hands-free.',
  },
  {
    icon: Sparkles,
    title: 'Advanced AI Models',
    description:
      'Multiple state-of-the-art AI models automatically selected and optimized for each task — code generation, debugging, design, and more.',
  },
  {
    icon: Cloud,
    title: '10 Starter Templates',
    description:
      'Kickstart projects with templates for React, Next.js, Vue, Svelte, HTML/CSS, Python, Node.js, and more.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description:
      'All data encrypted in transit (TLS 1.2/1.3). Subscriptions auto-renew — cancel anytime from your account. Your code stays yours.',
  },
];

function PricingContent() {
  const { state } = useAuth();
  const { hasActiveSubscription } = useSubscriptions();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    cancelled === 'true' ? 'Payment was cancelled. You can try again when ready.' : null
  );

  const isSubscribed = hasActiveSubscription('gencraft-pro');

  const handleSubscribe = async (plan: string) => {
    if (!state.isAuthenticated || !state.user) {
      window.location.href = '/auth/login?redirect=/overview/pricing';
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
          agentId: 'gencraft-pro',
          agentName: 'GenCraft Pro',
          plan,
          userId: state.user.id,
          userEmail: state.user.email,
        }),
      });

      const data = await res.json();

      if (data.alreadySubscribed) {
        setError(
          `You already have an active ${data.existingSubscription?.plan} plan.`
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
            <Paintbrush className="w-8 h-8 text-purple-700" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
            GenCraft Pro
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
            AI-powered full-stack app builder. Describe any app in natural
            language and get working code with live preview. Advanced AI models,
            40+ languages, deploy to 5 platforms.
          </p>

          {/* Agent Pricing Badge */}
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 bg-white/60 hover:bg-white/80 border border-white/60 rounded-full px-5 py-2.5 transition-all duration-300 group text-slate-700"
          >
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">
              Looking for AI Agent subscriptions? View All Plans
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
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">4</div>
                <div className="text-xs text-slate-500">Flexible Plans</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  <span className="text-sm line-through text-slate-400">$20/day</span>{' '}$10/day
                </div>
                <div className="text-xs text-slate-500">Starting From</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">50%</div>
                <div className="text-xs text-slate-500">Welcome Discount</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">9+</div>
                <div className="text-xs text-slate-500">AI Providers</div>
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
          {GENCRAFT_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative group bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg transition-all duration-300 hover:shadow-xl ${
                plan.highlight
                  ? 'border-blue-300 shadow-md ring-2 ring-blue-100'
                  : 'border-white/80 hover:border-blue-200'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                      plan.badge.includes('50% OFF')
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white animate-pulse'
                        : plan.highlight
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
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

                {/* Key highlights (compact) */}
                <div className="space-y-2.5 mb-8">
                  {[
                    'Full AI app generation',
                    'Advanced AI models',
                    'Live preview & editors',
                    '40+ languages',
                    'Deploy to 5 platforms',
                    'Unlimited generations',
                  'Auto-renews — cancel anytime',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          plan.highlight
                            ? 'bg-blue-100 text-blue-600'
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
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25'
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
            <p className="text-blue-700 font-semibold text-lg mb-1">
              All plans include identical features
            </p>
            <p className="text-slate-500 text-sm">
              The only difference is billing cycle and savings. Every plan gives full access to all GenCraft Pro capabilities below. All subscriptions auto-renew and can be cancelled anytime from your account dashboard.
            </p>
          </div>
        </div>

        {/* What You Can Do With GenCraft Pro */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-700 mb-3">
              What You Can Build with GenCraft Pro
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              A browser-based AI IDE that generates full-stack applications from
              natural language descriptions. Here&apos;s everything included in every plan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {APP_CAPABILITIES.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <div
                  key={i}
                  className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-blue-600" />
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
                Every plan includes all features — you only choose your billing cycle
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-transparent border-b border-white/80">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-amber-600">
                      Daily (<span className="line-through text-slate-400">$20</span> $10)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600">
                      Weekly (<span className="line-through text-slate-400">$30</span> $15)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600 bg-blue-50/50">
                      Monthly (<span className="line-through text-slate-400">$60</span> $30)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-emerald-600">
                      Yearly (<span className="line-through text-slate-400">$600</span> $300)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'AI App Generation', d: true, w: true, m: true, y: true },
                    { feature: 'AI Providers', d: '9+', w: '9+', m: '9+', y: '9+' },
                    { feature: 'Programming Languages', d: '40+', w: '40+', m: '40+', y: '40+' },
                    { feature: 'Live Preview (Sandpack)', d: true, w: true, m: true, y: true },
                    { feature: 'Monaco & CodeMirror Editors', d: true, w: true, m: true, y: true },
                    { feature: 'Multi-File Projects', d: true, w: true, m: true, y: true },
                    { feature: 'AI Tools (per request)', d: '35', w: '35', m: '35', y: '35' },
                    { feature: 'Image-to-Code', d: true, w: true, m: true, y: true },
                    { feature: 'AI Video Generation', d: true, w: true, m: true, y: true },
                    { feature: 'Voice Input', d: true, w: true, m: true, y: true },
                    { feature: 'Deploy (Vercel, Netlify, GitHub, AWS)', d: true, w: true, m: true, y: true },
                    { feature: 'Export & Download', d: true, w: true, m: true, y: true },
                    { feature: 'Starter Templates', d: '10', w: '10', m: '10', y: '10' },
                    { feature: 'Generations', d: 'Unlimited', w: 'Unlimited', m: 'Unlimited', y: 'Unlimited' },
                    { feature: 'Auto-Renewal', d: 'Daily', w: 'Weekly', m: 'Monthly', y: 'Yearly' },
                    { feature: 'Cancel Anytime', d: true, w: true, m: true, y: true },
                    { feature: 'Access Duration', d: '1 day', w: '7 days', m: '30 days', y: '365 days' },
                    { feature: 'Effective Price', d: '$10/day', w: '~$2.14/day', m: '$1/day', y: '~$0.82/day' },
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
                      {(['d', 'w', 'm', 'y'] as const).map((key) => (                        <td
                          key={key}
                          className={`px-6 py-3.5 text-center ${
                            key === 'm' ? 'bg-blue-50/30' : ''
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
                                key === 'm' ? 'text-blue-600' : 'text-slate-500'
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
              Subscriptions auto-renew at the chosen cadence (daily, weekly, monthly, or yearly). Cancel anytime from your account dashboard — no questions asked.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm font-medium text-blue-600 mb-4">
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
                q: 'What is GenCraft Pro?',
                a: 'GenCraft Pro is a browser-based AI IDE that generates full-stack applications from natural language descriptions. It features dual code editors (Monaco + CodeMirror), live Sandpack preview, 35 AI tools, and deployment to 5 platforms.',
              },
              {
                q: 'Are all features the same on every plan?',
                a: 'Yes. Daily, Weekly, Monthly, and Yearly plans all include identical features — full AI app generation, advanced AI models, 40+ languages, deployment, video generation, and unlimited generations. The only difference is billing cycle and savings.',
              },
              {
                q: 'Which AI models can I use?',
                a: 'All plans include access to multiple state-of-the-art AI models, automatically selected and optimized for each task. Our platform continuously updates to the latest models to deliver the best results.',
              },
              {
                q: 'Is there auto-renewal?',
                a: 'Yes. Subscriptions auto-renew at the cadence you choose (daily, weekly, monthly, or yearly) so your access never lapses. You can cancel anytime from your account dashboard — cancellation takes effect at the end of the current billing period and you keep access until then. No hidden fees, no surprise charges.',
              },
              {
                q: 'How do I cancel my subscription?',
                a: 'Open your account dashboard, click Manage Subscription, and select Cancel. You will keep full access until the end of your current billing period. You can also resubscribe anytime.',
              },
              {
                q: 'Can I deploy apps I build?',
                a: 'Yes. GenCraft Pro supports one-click deployment to Vercel, Netlify, GitHub Pages, AWS, and cloud preview. You can also export and download your projects to run locally.',
              },
              {
                q: 'What languages and frameworks are supported?',
                a: 'GenCraft Pro supports 40+ programming languages and comes with 10 starter templates including React, Next.js, Vue, Svelte, HTML/CSS/JS, Python, Node.js, TypeScript, and more.',
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
              Want AI Agent Subscriptions?
            </h2>
            <p className="relative z-10 text-lg text-slate-600 mb-8">
              Explore pricing for all 18 AI agents with unique personalities,
              voice capabilities, and specialized skills.
            </p>
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/overview"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
              >
                View Agent Pricing
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://mumtaz.ai/agents"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/60 hover:bg-white/80 text-slate-800 font-semibold rounded-xl transition border border-white/60"
              >
                Explore AI Agents
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

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
