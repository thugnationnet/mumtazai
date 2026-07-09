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
    id: 'weekly',
    name: 'Weekly',
    price: 10,
    originalPrice: 20,
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
      'One-time purchase',
    ],
    highlight: false,
    badge: '50% OFF',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 30,
    originalPrice: 60,
    period: '/month',
    description: '30-day access to Canvas Build',
    savings: 'Save 25% vs weekly',
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
      'One-time purchase',
    ],
    highlight: true,
    badge: '50% OFF · Most Popular',
    color: 'from-orange-600 to-red-500',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 300,
    originalPrice: 600,
    period: '/year',
    description: '365-day access — just $25/month',
    savings: 'Save 42% vs weekly',
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
      'One-time purchase',
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
      'All data encrypted in transit. One-time purchase — no renewal, no upgrade, no downgrade. Your code and projects stay yours.',
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-orange-600 to-amber-600 text-white">
        <div className="container-custom text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-6">
            <Hammer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Canvas Build
          </h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-6">
            AI-powered builder with canvas-based visual interface. Orchestrate
            multiple AI agents to plan, code, review, and deploy your projects — all
            from an intuitive drag-and-drop canvas.
          </p>

          {/* Overview Link */}
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-full px-5 py-2.5 transition-all duration-300 group"
          >
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">
              Looking for other plans? View All Products
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
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">3</div>
                <div className="text-xs text-neural-600">Flexible Plans</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  <span className="text-sm line-through text-neural-400">$20/wk</span>{' '}$10/wk
                </div>
                <div className="text-xs text-neural-600">Starting From</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">50%</div>
                <div className="text-xs text-neural-600">Welcome Discount</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">Multi</div>
                <div className="text-xs text-neural-600">AI Agents</div>
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
          {CANVAS_BUILD_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative group bg-white rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-lg ${
                plan.highlight
                  ? 'border-orange-300 shadow-md ring-2 ring-orange-100'
                  : 'border-neural-100 hover:border-orange-200'
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

                {/* Key highlights */}
                <div className="space-y-2.5 mb-8">
                  {[
                    'AI canvas builder',
                    'Canvas visual builder',
                    'Live preview & sandbox',
                    'Build pipeline',
                    'Production deployment',
                    'Unlimited builds',
                    'One-time purchase · No renewal',
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
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25'
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
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6 text-center">
            <p className="text-orange-700 font-semibold text-lg mb-1">
              All plans are one-time purchases — no renewal, no upgrade, no downgrade
            </p>
            <p className="text-neural-600 text-sm">
              Choose your duration. When it expires, purchase a new plan. Cancel anytime to switch to a different duration.
            </p>
          </div>
        </div>

        {/* What You Can Do With Canvas Build */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neural-800 mb-3">
              What You Can Build with Canvas Build
            </h2>
            <p className="text-neural-600 max-w-2xl mx-auto">
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
                  className="bg-white rounded-xl border border-neural-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-orange-600" />
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
                Every plan includes all features — you only choose your duration. One-time purchase, no renewal.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neural-50 border-b border-neural-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-neural-800">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-orange-600">
                      Weekly (<span className="line-through text-neural-400">$20</span> $10)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-orange-700 bg-orange-50/50">
                      Monthly (<span className="line-through text-neural-400">$60</span> $30)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-emerald-600">
                      Yearly (<span className="line-through text-neural-400">$600</span> $300)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'AI Canvas Builder', w: true, m: true, y: true },
                    { feature: 'Canvas Visual Builder', w: true, m: true, y: true },
                    { feature: 'Live Preview & Sandbox', w: true, m: true, y: true },
                    { feature: 'Code & No-Code Modes', w: true, m: true, y: true },
                    { feature: 'Build Pipeline', w: true, m: true, y: true },
                    { feature: 'Production Deployment', w: true, m: true, y: true },
                    { feature: 'Multi-File Projects', w: true, m: true, y: true },
                    { feature: 'Terminal & Console', w: true, m: true, y: true },
                    { feature: 'Template Gallery', w: true, m: true, y: true },
                    { feature: 'Cloud Storage', w: true, m: true, y: true },
                    { feature: 'Responsive Preview', w: true, m: true, y: true },
                    { feature: 'Export & Download', w: true, m: true, y: true },
                    { feature: 'Builds', w: 'Unlimited', m: 'Unlimited', y: 'Unlimited' },
                    { feature: 'Purchase Type', w: 'One-time', m: 'One-time', y: 'One-time' },
                    { feature: 'Upgrade/Downgrade', w: 'No', m: 'No', y: 'No' },
                    { feature: 'Access Duration', w: '7 days', m: '30 days', y: '365 days' },
                    { feature: 'Effective Price', w: '$1.43/day', m: '$1/day', y: '~$0.82/day' },
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
                                key === 'm' ? 'text-orange-600' : 'text-neural-600'
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
                One-time purchase
              </span>
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neural-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-neural-600" />
                </div>
                Instant access
              </span>
            </div>
            <p className="text-center text-sm text-neural-500 mt-4">
              All plans are one-time purchases. No recurring charges, no upgrade, no downgrade.
              Access expires at the end of your plan period — then purchase a new plan.
              Cancel anytime to switch to a different duration.
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
            <h2 className="text-3xl font-bold text-neural-800 mb-3">
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
                a: 'Yes. Weekly, Monthly, and Yearly plans all include identical features — AI canvas builder, canvas builder, deployment, and unlimited builds. The only difference is the access duration and price.',
              },
              {
                q: 'Is this a subscription or one-time purchase?',
                a: 'One-time purchase only. There is no auto-renewal, no recurring billing. You pay once and get access for the chosen duration (7 days, 30 days, or 365 days). When your plan expires, you can purchase a new one.',
              },
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'No. There are no upgrades or downgrades. If you want to switch to a different duration, cancel your current plan first, then purchase the new duration you prefer.',
              },
              {
                q: 'What happens when my plan expires?',
                a: 'Your access ends when the plan period is over. You can then purchase any plan again — weekly, monthly, or yearly. Your projects and data are retained so you can pick up where you left off.',
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
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Explore Other Products
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Check out GenCraft Pro for AI code generation, AI Agent subscriptions
              for personalized conversations, or Spaces for community sharing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/overview"
                className="btn-primary bg-white text-orange-600 hover:bg-neural-50 inline-flex items-center gap-2"
              >
                View All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://build.mumtaz.ai"
                className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-orange-600 inline-flex items-center gap-2"
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

export default function CanvasPricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CanvasPricingContent />
    </Suspense>
  );
}
