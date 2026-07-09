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
    id: 'weekly',
    name: 'Weekly',
    price: 7,
    originalPrice: 14,
    period: '/week',
    description: '7-day access to GenCraft Pro',
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
      'No auto-renewal',
    ],
    highlight: false,
    badge: '50% OFF',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 19,
    originalPrice: 38,
    period: '/month',
    description: '30-day access to GenCraft Pro',
    savings: 'Save 32% vs weekly',
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
      'No auto-renewal',
    ],
    highlight: true,
    badge: '50% OFF · Most Popular',
    color: 'from-brand-500 to-accent-500',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 120,
    originalPrice: 240,
    period: '/year',
    description: '365-day access — just $10/month',
    savings: 'Save 53% vs weekly',
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
      'No auto-renewal',
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
      'All data encrypted in transit (TLS 1.2/1.3). No auto-renewal — one-time purchase. Your code stays yours.',
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-6">
            <Paintbrush className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            GenCraft Pro
          </h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-6">
            AI-powered full-stack app builder. Describe any app in natural
            language and get working code with live preview. Advanced AI models,
            40+ languages, deploy to 5 platforms.
          </p>

          {/* Agent Pricing Badge */}
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-full px-5 py-2.5 transition-all duration-300 group"
          >
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">
              Looking for AI Agent subscriptions? View All Plans
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Quick Stats */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-brand-50 rounded-lg">
                <div className="text-2xl font-bold text-brand-600">3</div>
                <div className="text-xs text-neural-600">Flexible Plans</div>
              </div>
              <div className="text-center p-4 bg-accent-50 rounded-lg">
                <div className="text-2xl font-bold text-accent-600">
                  <span className="text-sm line-through text-neural-400">$20/mo</span>{' '}$10/mo
                </div>
                <div className="text-xs text-neural-600">Starting From</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">50%</div>
                <div className="text-xs text-neural-600">Welcome Discount</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">9+</div>
                <div className="text-xs text-neural-600">AI Providers</div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          {GENCRAFT_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative group bg-white rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-lg ${
                plan.highlight
                  ? 'border-brand-300 shadow-md ring-2 ring-brand-100'
                  : 'border-neural-100 hover:border-brand-200'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                      plan.badge.includes('50% OFF')
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white animate-pulse'
                        : plan.highlight
                          ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white'
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
                    <h3 className="text-xl font-bold text-neural-800">
                      {plan.name}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-neural-500 mb-6">
                  {plan.description}
                </p>

                {plan.originalPrice && (
                  <div className="mb-1">
                    <span className="text-lg text-neural-400 line-through">${plan.originalPrice}</span>
                  </div>
                )}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl lg:text-5xl font-extrabold text-neural-900">
                    ${plan.price}
                  </span>
                  <span className="text-neural-400 text-lg">{plan.period}</span>
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
                    'No auto-renewal',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          plan.highlight
                            ? 'bg-brand-100 text-brand-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-neural-600">{feature}</span>
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
                        ? 'bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white shadow-lg shadow-brand-500/25'
                        : 'bg-neural-800 hover:bg-neural-900 text-white'
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
          <div className="bg-gradient-to-r from-brand-50 to-accent-50 border border-brand-100 rounded-2xl p-6 text-center">
            <p className="text-brand-700 font-semibold text-lg mb-1">
              All plans include identical features
            </p>
            <p className="text-neural-600 text-sm">
              The only difference is billing cycle and savings. Every plan gives full access to all GenCraft Pro capabilities below.
            </p>
          </div>
        </div>

        {/* What You Can Do With GenCraft Pro */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neural-800 mb-3">
              What You Can Build with GenCraft Pro
            </h2>
            <p className="text-neural-600 max-w-2xl mx-auto">
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
                  className="bg-white rounded-xl border border-neural-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-neural-800 mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-neural-600 leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-white rounded-2xl border border-neural-200 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-neural-200 bg-gradient-to-r from-neural-50 to-white">
              <h2 className="text-2xl font-bold text-neural-800">
                Plan Comparison
              </h2>
              <p className="text-neural-600 mt-1">
                Every plan includes all features — you only choose your billing cycle
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neural-50 border-b border-neural-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-neural-800">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600">
                      Weekly (<span className="line-through text-neural-400">$14</span> $7)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-brand-600 bg-brand-50/50">
                      Monthly (<span className="line-through text-neural-400">$38</span> $19)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-emerald-600">
                      Yearly (<span className="line-through text-neural-400">$240</span> $120)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'AI App Generation', w: true, m: true, y: true },
                    { feature: 'AI Providers', w: '9+', m: '9+', y: '9+' },
                    { feature: 'Programming Languages', w: '40+', m: '40+', y: '40+' },
                    { feature: 'Live Preview (Sandpack)', w: true, m: true, y: true },
                    { feature: 'Monaco & CodeMirror Editors', w: true, m: true, y: true },
                    { feature: 'Multi-File Projects', w: true, m: true, y: true },
                    { feature: 'AI Tools (per request)', w: '35', m: '35', y: '35' },
                    { feature: 'Image-to-Code', w: true, m: true, y: true },
                    { feature: 'AI Video Generation', w: true, m: true, y: true },
                    { feature: 'Voice Input', w: true, m: true, y: true },
                    { feature: 'Deploy (Vercel, Netlify, GitHub, AWS)', w: true, m: true, y: true },
                    { feature: 'Export & Download', w: true, m: true, y: true },
                    { feature: 'Starter Templates', w: '10', m: '10', y: '10' },
                    { feature: 'Generations', w: 'Unlimited', m: 'Unlimited', y: 'Unlimited' },
                    { feature: 'Auto-Renewal', w: 'No', m: 'No', y: 'No' },
                    { feature: 'Access Duration', w: '7 days', m: '30 days', y: '365 days' },
                    { feature: 'Effective Price', w: '$1/day', m: '~$0.63/day', y: '~$0.33/day' },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-neural-100 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-neural-50/50'
                      }`}
                    >
                      <td className="px-6 py-3.5 font-medium text-neural-800">
                        {row.feature}
                      </td>
                      {(['w', 'm', 'y'] as const).map((key) => (
                        <td
                          key={key}
                          className={`px-6 py-3.5 text-center ${
                            key === 'm' ? 'bg-brand-50/30' : ''
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
                                key === 'm' ? 'text-brand-600' : 'text-neural-600'
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-100">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-neural-500">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neural-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-neural-600" />
                </div>
                Secure payment via Stripe
              </span>
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neural-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-neural-600" />
                </div>
                No auto-renewal
              </span>
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neural-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-neural-600" />
                </div>
                Instant access
              </span>
            </div>
            <p className="text-center text-sm text-neural-500 mt-4">
              All plans are one-time purchases. No recurring charges. Access
              expires at the end of your plan period.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 rounded-full text-sm font-medium text-brand-600 mb-4">
              <HelpCircle className="w-4 h-4" />
              Common Questions
            </div>
            <h2 className="text-3xl font-bold text-neural-800 mb-3">
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
                a: 'Yes. Weekly, Monthly, and Yearly plans all include identical features — full AI app generation, advanced AI models, 40+ languages, deployment, video generation, and unlimited generations. The only difference is billing cycle and savings.',
              },
              {
                q: 'Which AI models can I use?',
                a: 'All plans include access to multiple state-of-the-art AI models, automatically selected and optimized for each task. Our platform continuously updates to the latest models to deliver the best results.',
              },
              {
                q: 'Is there auto-renewal?',
                a: 'No. All purchases are one-time. Your access expires at the end of your chosen period and you manually repurchase when you want to continue. No surprise charges ever.',
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
          <div className="bg-gradient-to-r from-brand-600 to-accent-500 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Want AI Agent Subscriptions?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Explore pricing for all 18 AI agents with unique personalities,
              voice capabilities, and specialized skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/overview"
                className="btn-primary bg-white text-brand-600 hover:bg-neural-50 inline-flex items-center gap-2"
              >
                View Agent Pricing
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://onelastai.co/agents"
                className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-brand-600 inline-flex items-center gap-2"
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
    <div className="bg-white rounded-xl border border-neural-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-neural-50 transition-colors"
      >
        <span className="font-semibold text-neural-800 pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-neural-400 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-neural-600 text-sm leading-relaxed">{a}</p>
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
