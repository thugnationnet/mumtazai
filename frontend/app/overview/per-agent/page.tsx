'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PerAgentPricingPage() {
  const pricingOptions = [
    {
      name: 'Daily Access',
      description: 'Perfect for short-term projects or trying out agents',
      price: '$1',
      originalPrice: null,
      period: 'per day',
      features: [
        'Access to any single agent',
        'Unlimited conversations',
        'Real-time responses',
        'Voice interaction',
        'Agent memory',
        'Analytics dashboard',
        'No auto-renewal',
      ],
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Weekly Access',
      description: 'Great value for regular use and projects',
      price: '$5',
      originalPrice: '$10',
      period: 'per week',
      features: [
        'Access to any single agent',
        'Unlimited conversations',
        'Real-time responses',
        'Voice interaction',
        'Agent memory',
        'Analytics dashboard',
        'No auto-renewal',
        'Save 29% vs daily',
      ],
      color: 'from-indigo-500 to-purple-600',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      recommended: true,
    },
    {
      name: 'Monthly Access',
      description: 'Best value for ongoing work and long-term projects',
      price: '$15',
      originalPrice: '$30',
      period: 'per month',
      features: [
        'Access to any single agent',
        'Unlimited conversations',
        'Real-time responses',
        'Voice interaction',
        'Agent memory',
        'Analytics dashboard',
        'No auto-renewal',
        'Save 39% vs daily',
      ],
      color: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      name: 'Yearly Access',
      description: 'Best long-term value — full year of access',
      price: '$150',
      originalPrice: '$300',
      period: 'per year',
      features: [
        'Access to any single agent',
        'Unlimited conversations',
        'Real-time responses',
        'Voice interaction',
        'Agent memory',
        'Analytics dashboard',
        'No auto-renewal',
        'Save 17% vs monthly',
      ],
      color: 'from-emerald-500 to-green-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="py-16 bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Transparent Pricing
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple Per-Agent Pricing
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              All agents use the same transparent pricing. No hidden fees. Choose your billing cycle.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {pricingOptions.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl overflow-hidden border-2 ${
                  tier.recommended
                    ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-10'
                    : 'border-gray-200 hover:border-gray-300 shadow-lg'
                } transition-all bg-white`}
              >
                {tier.recommended && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1.5 text-xs font-bold rounded-bl-xl">
                    MOST POPULAR
                  </div>
                )}

                <div className={`bg-gradient-to-br ${tier.color} p-6 text-white`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${tier.iconBg} rounded-xl flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${tier.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold">{tier.name}</h3>
                  </div>
                  <p className="text-white/90 text-sm">{tier.description}</p>
                </div>

                <div className="p-8">
                  {/* 50% OFF Badge */}
                  {tier.originalPrice && (
                    <div className="mb-3">
                      <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                        🎁 50% OFF
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-6">
                    <p className="text-gray-500 text-sm mb-1">Starting at</p>
                    {tier.originalPrice && (
                      <div className="mb-1">
                        <span className="text-lg text-gray-400 line-through">{tier.originalPrice}</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                      <span className="text-gray-500">/{tier.period.split(' ')[1]}</span>
                    </div>
                  </div>

                  {/* Per-Agent Cost */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-6 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Pricing Structure</p>
                    <p className="text-lg font-semibold text-gray-900">One Agent at a Time</p>
                  </div>

                  {/* Included Agents */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Includes:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-medium">
                        Any Single Agent
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-8">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Features:</p>
                    <ul className="space-y-3">
                      {tier.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-gray-600">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href="https://onelastai.co/agents"
                    className={`block w-full text-center py-3.5 rounded-xl font-semibold transition-all ${
                      tier.recommended
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-2xl font-bold text-gray-900">Feature Comparison</h2>
              <p className="text-gray-600 mt-1">Every plan includes all features — you only choose your billing cycle</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">
                      Daily ($1)
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-indigo-600 bg-indigo-50">
                      Weekly (<span className="line-through text-gray-400">$10</span> $5)
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-amber-600">
                      Monthly (<span className="line-through text-gray-400">$30</span> $15)
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-600">
                      Yearly (<span className="line-through text-gray-400">$300</span> $150)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: 'Chat Interface',
                      daily: true,
                      weekly: true,
                      monthly: true,
                      yearly: true,
                    },
                    {
                      feature: 'Voice Interaction',
                      daily: true,
                      weekly: true,
                      monthly: true,
                      yearly: true,
                    },
                    {
                      feature: 'Real-time Responses',
                      daily: true,
                      weekly: true,
                      monthly: true,
                      yearly: true,
                    },
                    {
                      feature: 'Agent Memory',
                      daily: true,
                      weekly: true,
                      monthly: true,
                      yearly: true,
                    },
                    {
                      feature: 'Analytics Dashboard',
                      daily: true,
                      weekly: true,
                      monthly: true,
                      yearly: true,
                    },
                    {
                      feature: 'Conversations',
                      daily: 'Unlimited',
                      weekly: 'Unlimited',
                      monthly: 'Unlimited',
                      yearly: 'Unlimited',
                    },
                    {
                      feature: 'Advanced AI Models',
                      daily: true,
                      weekly: true,
                      monthly: true,
                      yearly: true,
                    },
                    {
                      feature: 'No Auto-Renewal',
                      daily: true,
                      weekly: true,
                      monthly: true,
                      yearly: true,
                    },
                    {
                      feature: 'Savings vs Daily',
                      daily: '—',
                      weekly: '29%',
                      monthly: '39%',
                      yearly: '59%',
                    },
                    {
                      feature: 'Access Duration',
                      daily: '24 hours',
                      weekly: '7 days',
                      monthly: '30 days',
                      yearly: '365 days',
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {row.feature}
                      </td>
                      {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((key) => (
                        <td
                          key={key}
                          className={`px-6 py-4 text-center text-gray-600 ${
                            key === 'weekly' ? 'bg-indigo-50/50' : ''
                          }`}
                        >
                          {typeof row[key] === 'boolean' ? (
                            <span className="text-green-500">
                              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          ) : (
                            <span className={`font-medium ${key === 'weekly' ? 'text-indigo-600' : ''}`}>{row[key]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
              <p className="text-gray-600">Everything you need to know about our pricing</p>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: 'Can I change plans anytime?',
                  a: 'Yes! Since each purchase is one-time with no auto-renewal, simply choose a different plan when you repurchase. Your current access continues until expiration.',
                },
                {
                  q: 'Do you offer enterprise plans?',
                  a: 'Yes! Contact our sales team for custom enterprise pricing, volume discounts, and dedicated support.',
                },
                {
                  q: 'Is there a free trial?',
                  a: "No, we don't offer free trials. All agent access requires payment starting at $1/day. With no auto-renewal, you only pay once per purchase.",
                },
                {
                  q: 'Will I be charged automatically?',
                  a: 'No! There is NO auto-renewal. Each purchase is one-time only. You must manually purchase again when your access expires if you want to continue using the agent.',
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 text-sm pl-7">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 p-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl text-center text-white shadow-2xl"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="mb-8 text-blue-100 text-lg max-w-xl mx-auto">
              Choose your plan and start building amazing AI experiences today. Browse our collection of specialized AI agents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://onelastai.co/agents"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Browse Agents
              </Link>
              <Link
                href="/support/contact-us"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition border border-white/20 backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
