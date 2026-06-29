'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Paintbrush,
  Globe,
  Sparkles,
  Shield,
  Zap,
  CreditCard,
  HelpCircle,
  ChevronDown,
  Hammer,
} from 'lucide-react';
import { useState } from 'react';

const overviewCards = [
  {
    title: 'Per-Agent Pricing',
    description:
      'Simple, transparent pricing for AI agents. Pay per agent — daily, weekly, or monthly. No auto-renewal, no hidden fees.',
    href: '/overview/per-agent',
    icon: Bot,
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    stats: [
      { label: 'Starting at', value: '$5/day' },
      { label: 'Agents', value: '18+' },
      { label: 'Discount', value: 'Save up to 84%' },
    ],
    features: [
      'Access any single AI agent',
      'Unlimited conversations',
      'Voice interaction support',
      'No auto-renewal',
    ],
  },
  {
    title: 'GenCraft Pro Pricing',
    description:
      'Full-stack app generation powered by cutting-edge AI. Weekly, monthly, or yearly plans for GenCraft Pro IDE.',
    href: '/overview/pricing',
    icon: Paintbrush,
    gradient: 'from-purple-500 to-pink-600',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    stats: [
      { label: 'Starting at', value: '$7/week' },
      { label: 'AI Models', value: '8+' },
      { label: 'Savings', value: 'Up to 47%' },
    ],
    features: [
      'AI-powered app generation',
      'Multiple AI models',
      'Live preview & editing',
      'Export & download projects',
    ],
  },
  {
    title: 'Canvas Build',
    description:
      'AI-powered app builder embedded in chat. Build full-stack apps with AI code generation, real-time preview, and one-click deploy — all inside the chat interface.',
    href: '/overview/canvas-pricing',
    icon: Hammer,
    gradient: 'from-orange-500 to-red-600',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    stats: [
      { label: 'Starting at', value: '$10/day' },
      { label: 'AI Agents', value: 'Multi' },
      { label: 'Discount', value: '50% OFF' },
    ],
    features: [
      'AI-powered code generation',
      'Live preview & deploy',
      'Build pipeline & validation',
      'Cancel anytime',
    ],
  },
  {
    title: 'Spaces — maula.dev',
    description:
      'Professional AI code editor & IDE at maula.dev. 268 AI tools across 39 categories. Credit-based billing with sandbox execution.',
    href: '/overview/spaces',
    icon: Globe,
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    stats: [
      { label: 'AI Tools', value: '268' },
      { label: 'Categories', value: '39' },
      { label: 'Providers', value: '9+' },
    ],
    features: [
      'Canvas Studio IDE',
      'Maula Editor (maula.dev)',
      'Sandbox code execution',
      'One-click cloud deploy',
    ],
  },
];

const faqs = [
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, MasterCard, American Express) via Stripe. All payments are PCI DSS Level 1 compliant — your card details never touch our servers.',
  },
  {
    q: 'Is there auto-renewal on any plans?',
    a: 'No. All purchases are one-time. Your access expires at the end of your chosen period and you manually repurchase when you want to continue. No surprise charges.',
  },
  {
    q: 'Can I switch between plans or products?',
    a: 'Yes! Since each purchase is one-time, you can freely switch between per-agent pricing, GenCraft Pro, or Spaces credits at any time. There are no lock-in contracts.',
  },
  {
    q: 'Do you offer enterprise or custom plans?',
    a: 'Yes. Contact our sales team at support@mumtaz.ai for custom enterprise pricing, volume discounts, dedicated support, and SLA guarantees.',
  },
  {
    q: 'What AI models are available?',
    a: 'We support multiple state-of-the-art AI models, automatically selected and optimized for each task. Our platform continuously updates to the latest model versions to deliver the best results.',
  },
  {
    q: 'Is my data safe?',
    a: 'Absolutely. All data is encrypted in transit (TLS 1.2/1.3) and at rest (AES-256). Credentials are encrypted with AES-256-GCM. We do not use your data to train AI models. See our Privacy Policy for full details.',
  },
  {
    q: 'What is the refund policy?',
    a: 'Given the low-cost, no-commitment nature of our pricing (starting at $5/day for any AI agent), all purchases are final and non-refundable. See our Payments & Refunds policy for details.',
  },
  {
    q: 'How does the credit system work on Spaces?',
    a: 'Each AI request on Spaces (maula.dev) consumes credits based on the model used, token count, and tool complexity. You purchase credit packs and use them across all 268 tools. Credits never expire.',
  },
];

export default function OverviewPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/40 text-slate-700">
              <Sparkles className="w-4 h-4" />
              Plans &amp; Pricing Overview
            </div>
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              From AI agents to full-stack code generation — choose the plan
              that fits your workflow. No hidden fees, no auto-renewal, no
              lock-in.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <span className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/40 text-slate-700">
                <Shield className="w-4 h-4" /> Secure Stripe Payments
              </span>
              <span className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/40 text-slate-700">
                <CreditCard className="w-4 h-4" /> No Auto-Renewal
              </span>
              <span className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/40 text-slate-700">
                <Zap className="w-4 h-4" /> Instant Access
              </span>
            </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3 Cards */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Product
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three powerful products, each with its own pricing model. Pick what you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {overviewCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="group"
                >
                  <Link href={card.href} className="block h-full">
                    <div className="h-full bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg hover:border-indigo-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                      {/* Card Header */}
                      <div
                        className={`bg-gradient-to-br ${card.gradient} p-6 text-white`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}
                          >
                            <Icon className={`w-6 h-6 ${card.iconColor}`} />
                          </div>
                          <h3 className="text-2xl font-bold">{card.title}</h3>
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed">
                          {card.description}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
                        {card.stats.map((stat, j) => (
                          <div
                            key={j}
                            className="text-center p-4 border-r last:border-r-0 border-gray-100"
                          >
                            <p className="text-lg font-bold text-gray-900">
                              {stat.value}
                            </p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Features */}
                      <div className="p-6">
                        <ul className="space-y-3 mb-6">
                          {card.features.map((f, j) => (
                            <li
                              key={j}
                              className="flex items-center gap-3 text-sm text-gray-600"
                            >
                              <svg
                                className="w-5 h-5 text-green-500 flex-shrink-0"
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
                              {f}
                            </li>
                          ))}
                        </ul>

                        <div className="flex items-center justify-center gap-2 text-indigo-600 font-semibold group-hover:gap-3 transition-all">
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Comparison */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Quick Comparison
            </h2>
            <p className="text-gray-600">
              See how our products differ at a glance
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-blue-600">
                    <Bot className="w-5 h-5 mx-auto mb-1" />
                    Per-Agent
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-purple-600">
                    <Paintbrush className="w-5 h-5 mx-auto mb-1" />
                    GenCraft Pro
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-orange-600">
                    <Hammer className="w-5 h-5 mx-auto mb-1" />
                    Canvas Build
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-emerald-600">
                    <Globe className="w-5 h-5 mx-auto mb-1" />
                    Spaces
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: 'Billing Model',
                    agent: 'Per-agent',
                    gencraft: 'Subscription',
                    canvas: 'Subscription',
                    spaces: 'Credits',
                  },
                  {
                    feature: 'Starting Price',
                    agent: '$5/day',
                    gencraft: '$10/day (50% OFF)',
                    canvas: '$10/day (50% OFF)',
                    spaces: '$5 pack',
                  },
                  {
                    feature: 'AI Chat',
                    agent: '✅',
                    gencraft: '✅',
                    canvas: '✅',
                    spaces: '✅',
                  },
                  {
                    feature: 'Code Generation',
                    agent: '—',
                    gencraft: '✅',
                    canvas: '✅',
                    spaces: '✅',
                  },
                  {
                    feature: 'Live Preview',
                    agent: '—',
                    gencraft: '✅',
                    canvas: '✅',
                    spaces: '✅',
                  },
                  {
                    feature: 'Cloud Deployment',
                    agent: '—',
                    gencraft: '—',
                    canvas: '✅',
                    spaces: '✅',
                  },
                  {
                    feature: 'AI Tools',
                    agent: 'Agent-specific',
                    gencraft: 'Code tools',
                    canvas: 'AI Canvas',
                    spaces: '268 tools',
                  },
                  {
                    feature: 'Video Generation',
                    agent: '—',
                    gencraft: '✅',
                    canvas: '—',
                    spaces: '✅',
                  },
                  {
                    feature: 'Build Pipeline',
                    agent: '—',
                    gencraft: '—',
                    canvas: '✅',
                    spaces: '—',
                  },
                  {
                    feature: 'AI Canvas Builder',
                    agent: '—',
                    gencraft: '—',
                    canvas: '✅',
                    spaces: '—',
                  },
                  {
                    feature: 'Voice Interaction',
                    agent: '✅',
                    gencraft: '—',
                    canvas: '—',
                    spaces: '—',
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-100 ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-900">
                      {row.feature}
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-600">
                      {row.agent}
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-600">
                      {row.gencraft}
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-600">
                      {row.canvas}
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-600">
                      {row.spaces}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-sm font-medium text-indigo-600 mb-4">
              <HelpCircle className="w-4 h-4" />
              Common Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Everything you need to know about our plans and pricing
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/60 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl p-10 text-center themed-section-bg">
            {/* Glass Pillars */}
            <div className="absolute left-[10%] top-0 w-32 h-full bg-gradient-to-b from-white/30 via-white/10 to-white/25 rounded-full blur-2xl transform -skew-x-12" />
            <div className="absolute right-[15%] top-0 w-24 h-full bg-gradient-to-b from-white/25 via-white/5 to-white/20 rounded-full blur-2xl transform skew-x-12" />
            {/* Chrome Shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <h2 className="relative z-10 text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Ready to get started?</h2>
            <p className="relative z-10 text-slate-600 text-lg mb-8 max-w-xl mx-auto">
              Choose a product above, or explore our AI agents and tools to find
              the perfect fit for your workflow.
            </p>
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://mumtaz.ai/agents"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
              >
                <Bot className="w-5 h-5" />
                Browse Agents
              </Link>
              <Link
                href="/support/contact-us"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/60 hover:bg-white/80 text-slate-800 font-semibold rounded-xl transition border border-white/60"
              >
                Contact Sales
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
