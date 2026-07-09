'use client';

import { useState } from 'react';
import { X, DollarSign, CreditCard, Shield, AlertCircle } from 'lucide-react';

export default function PaymentsRefundsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-neural-900">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Payments & Refunds Policy</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Last updated: November 6, 2025 • Effective Date: November 6, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="container-custom section-padding max-w-5xl">
        <div className="space-y-12">
          {/* Introduction */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              1. Overview
            </h2>
            <p className="text-neural-700 leading-relaxed mb-4">
              This Payments & Refunds Policy explains the pricing structure,
              payment methods, billing procedures, and refund policy for One
              Last AI services. By purchasing access to our services, you agree
              to these terms.
            </p>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mt-4">
              <div className="flex gap-3">
                <DollarSign
                  className="text-blue-600 flex-shrink-0 mt-1"
                  size={32}
                />
                <div>
                  <p className="text-neural-900 font-bold text-xl mb-2">
                    One-Time Purchases - No Auto-Renewal
                  </p>
                  <p className="text-neural-700">
                    Choose from $1/day, <span className="line-through text-neural-400">$10</span> $5/week, <span className="line-through text-neural-400">$30</span> $15/month, or <span className="line-through text-neural-400">$300</span> $150/year access to any AI
                    agent. 🎁 50% OFF Welcome Gift! Each purchase is one-time only with NO automatic
                    renewal. You only pay when you want access.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Structure */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              2. Pricing Structure
            </h2>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-2xl font-bold mb-4 text-neural-900 flex items-center gap-2">
                  <DollarSign className="text-blue-600" />
                  Simple Per-Agent Pricing
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1">✓</span>
                    <div>
                      <p className="text-neural-900 font-semibold">
                        One-Time Purchase
                      </p>
                      <p className="text-neural-600 text-sm">
                        $1/day, <span className="line-through text-neural-400">$10</span> $5/week, <span className="line-through text-neural-400">$30</span> $15/month, or <span className="line-through text-neural-400">$300</span> $150/year - NO auto-renewal 🎁 50% OFF Welcome Gift
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1">✓</span>
                    <div>
                      <p className="text-neural-900 font-semibold">
                        Single Agent Access
                      </p>
                      <p className="text-neural-600 text-sm">
                        Choose one AI agent per purchase
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1">✓</span>
                    <div>
                      <p className="text-neural-900 font-semibold">
                        No Recurring Charges
                      </p>
                      <p className="text-neural-600 text-sm">
                        Manually repurchase when access expires if you want to
                        continue
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1">✓</span>
                    <div>
                      <p className="text-neural-900 font-semibold">
                        Immediate Access
                      </p>
                      <p className="text-neural-600 text-sm">
                        Start using your chosen agent right away
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  2.1 What's Included
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-blue-600 mb-2">
                      🤖 AI Agents
                    </p>
                    <p className="text-neural-700 text-sm">
                      Access to 90+ specialized AI personalities
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-blue-600 mb-2">
                      🛠️ Developer Tools
                    </p>
                    <p className="text-neural-700 text-sm">
                      19 network utilities and WHOIS services
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-blue-600 mb-2">
                      🗣️ Voice Features
                    </p>
                    <p className="text-neural-700 text-sm">
                      Emotional TTS with 15+ voices
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-blue-600 mb-2">
                      💬 Community
                    </p>
                    <p className="text-neural-700 text-sm">
                      Connect with users worldwide
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-blue-600 mb-2">
                      📊 Analytics
                    </p>
                    <p className="text-neural-700 text-sm">
                      Track usage and performance
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-blue-600 mb-2">
                      🔒 Priority Support
                    </p>
                    <p className="text-neural-700 text-sm">
                      Email support within 24 hours
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  2.2 No Free Tier
                </h3>
                <p className="text-neural-700">
                  One Last AI does not offer a free tier. All agent access
                  requires a one-time payment starting at $1/day. This low-cost
                  model ensures:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2 mt-2">
                  <li>High-quality AI services without ads</li>
                  <li>Continuous platform improvements</li>
                  <li>Responsive customer support</li>
                  <li>Data privacy and security investments</li>
                  <li>No surprise recurring charges</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              3. Payment Methods
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900 flex items-center gap-2">
                  <CreditCard className="text-blue-600" size={24} />
                  Accepted Payment Methods
                </h3>
                <div className="space-y-3">
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      💳 Credit & Debit Cards
                    </p>
                    <p className="text-neural-700 text-sm">
                      Visa, MasterCard, American Express, Discover, Diners Club,
                      JCB
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">🅿️ PayPal</p>
                    <p className="text-neural-700 text-sm">
                      Link your PayPal account for convenient payments
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      🌐 International Payments
                    </p>
                    <p className="text-neural-700 text-sm">
                      We accept payments from most countries worldwide
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  3.1 Payment Processing
                </h3>
                <p className="text-neural-700 mb-3">
                  Payments are processed securely through:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    <strong className="text-neural-900">Stripe:</strong> PCI DSS
                    Level 1 certified payment processor
                  </li>
                  <li>
                    <strong className="text-neural-900">PayPal:</strong>{' '}
                    Industry-leading payment platform
                  </li>
                  <li>
                    <strong className="text-neural-900">Encryption:</strong> All
                    transactions use 256-bit SSL encryption
                  </li>
                  <li>
                    <strong className="text-neural-900">No Storage:</strong> We do
                    not store full credit card numbers
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="flex gap-3">
                  <Shield
                    className="text-blue-600 flex-shrink-0 mt-1"
                    size={28}
                  />
                  <div>
                    <p className="text-neural-900 font-bold text-lg mb-2">
                      Secure Payment Guarantee
                    </p>
                    <p className="text-neural-700">
                      Your payment information is never stored on our servers.
                      All transactions are processed through PCI-compliant
                      third-party providers with bank-level security.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Billing Terms */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              4. Payment Terms
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  4.1 One-Time Purchase - No Auto-Renewal
                </h3>
                <p className="text-neural-700 mb-3">
                  Your payment method will be charged{' '}
                  <strong className="text-neural-900">once</strong> when you purchase
                  access:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>Charge occurs immediately upon purchase</li>
                  <li>
                    <strong className="text-neural-900">NO automatic renewal</strong>{' '}
                    - you will NOT be charged again
                  </li>
                  <li>
                    Access expires after your chosen period (1 day, 1 week, or 1
                    month)
                  </li>
                  <li>
                    You must manually purchase again if you want continued
                    access
                  </li>
                  <li>No surprises - you control when you pay</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  4.2 Payment Failures
                </h3>
                <p className="text-neural-700 mb-3">
                  If a payment fails during purchase:
                </p>
                <div className="space-y-3">
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-neural-700">
                      <strong className="text-neural-900">Immediate:</strong> You'll
                      see an error message and can retry with a different
                      payment method
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-neural-700">
                      <strong className="text-neural-900">No Access:</strong> Access
                      is not granted until payment succeeds
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-neural-700">
                      <strong className="text-neural-900">No Retries:</strong> Since
                      there's no auto-renewal, we don't retry failed payments -
                      you simply try again when ready
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  4.3 Currency and Taxes
                </h3>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    All prices are in{' '}
                    <strong className="text-neural-900">
                      USD (United States Dollars)
                    </strong>
                  </li>
                  <li>Your bank may apply currency conversion fees</li>
                  <li>Sales tax or VAT may be added based on your location</li>
                  <li>Final charges will be clearly shown before payment</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  4.4 Updating Payment Information
                </h3>
                <p className="text-neural-700">
                  You can update your payment method at any time in your account
                  settings. Updated payment information applies to future
                  charges immediately.
                </p>
              </div>
            </div>
          </section>

          {/* NO REFUND POLICY - EMPHASIZED */}
          <section className="bg-gradient-to-br from-red-900/30 via-amber-900/30 to-red-900/30 rounded-2xl p-8 border-2 border-red-500/50">
            <div className="flex items-start gap-4 mb-6">
              <AlertCircle
                className="text-red-400 flex-shrink-0 mt-1"
                size={40}
              />
              <div>
                <h2 className="text-3xl font-bold mb-2 text-red-400">
                  5. NO REFUND POLICY
                </h2>
                <p className="text-lg font-semibold text-white">
                  All Payments Are Final and Non-Refundable
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
                <h3 className="text-xl font-bold mb-3 text-neural-900">
                  5.1 Policy Statement
                </h3>
                <p className="text-neural-700 leading-relaxed mb-4 text-lg">
                  <strong className="text-red-600">
                    ONE LAST AI DOES NOT OFFER REFUNDS FOR ANY REASON.
                  </strong>
                </p>
                <p className="text-neural-700 leading-relaxed">
                  {' '}
                  All payments made to One Last AI are{' '}
                  <strong className="text-neural-900">
                    final, non-refundable, and non-transferable
                  </strong>
                  . This includes but is not limited to:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2 mt-3">
                  <li>Daily access charges ($1.00 per day)</li>
                  <li>Weekly access charges ($5.00 per week)</li>
                  <li>Monthly access charges ($15.00 per month)</li>
                  <li>Any one-time purchase fees</li>
                  <li>Payments made in error</li>
                  <li>Duplicate payments</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
                <h3 className="text-xl font-bold mb-3 text-neural-900">
                  5.2 Rationale for No Refund Policy
                </h3>
                <p className="text-neural-700 mb-4">
                  Our no-refund policy exists because:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1 text-xl">
                      1.
                    </span>
                    <div>
                      <p className="text-neural-900 font-semibold">
                        Extremely Low Cost
                      </p>
                      <p className="text-neural-600 text-sm">
                        At just $1.00 per day, our service is priced affordably
                        for everyone. The minimal cost reflects immediate value
                        delivery.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1 text-xl">
                      2.
                    </span>
                    <div>
                      <p className="text-neural-900 font-semibold">
                        Immediate Access
                      </p>
                      <p className="text-neural-600 text-sm">
                        You receive full platform access immediately upon
                        payment. AI services, tools, and features are consumed
                        instantly.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1 text-xl">
                      3.
                    </span>
                    <div>
                      <p className="text-neural-900 font-semibold">
                        Digital Service Nature
                      </p>
                      <p className="text-neural-600 text-sm">
                        Our AI services cannot be "returned" once used.
                        Computational resources, API calls, and AI processing
                        are consumed in real-time.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1 text-xl">
                      4.
                    </span>
                    <div>
                      <p className="text-neural-900 font-semibold">
                        Transparent Pricing
                      </p>
                      <p className="text-neural-600 text-sm">
                        You know exactly what you're paying upfront with no
                        hidden fees or recurring charges. Make an informed
                        decision before purchase.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1 text-xl">
                      5.
                    </span>
                    <div>
                      <p className="text-neural-900 font-semibold">
                        Operational Sustainability
                      </p>
                      <p className="text-neural-600 text-sm">
                        Low pricing requires efficient operations. Processing
                        refunds would increase costs, ultimately raising prices
                        for all users.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
                <h3 className="text-xl font-bold mb-3 text-neural-900">
                  5.3 No Exceptions
                </h3>
                <p className="text-neural-700 mb-3">
                  We do not make exceptions to this policy for any circumstance,
                  including:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>❌ Dissatisfaction with service</li>
                  <li>❌ Technical issues or bugs</li>
                  <li>❌ Accidental purchases</li>
                  <li>❌ Change of mind</li>
                  <li>❌ Lack of usage</li>
                  <li>
                    ❌ Early cancellation (access expires naturally, no
                    pro-rated refunds)
                  </li>
                  <li>❌ Billing disputes</li>
                  <li>❌ Feature requests not implemented</li>
                  <li>❌ Competitor comparisons</li>
                </ul>
                <p className="text-red-600 mt-4 font-semibold">
                  By purchasing, you acknowledge and accept this no-refund
                  policy.
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold mb-3 text-blue-600">
                  5.4 Alternatives to Refunds
                </h3>
                <p className="text-neural-700 mb-3">
                  If you're experiencing issues, we encourage you to:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    <strong className="text-neural-900">Contact Support:</strong>{' '}
                    Email{' '}
                    <a
                      href="mailto:support@onelastai.co"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      support@onelastai.co
                    </a>{' '}
                    for technical assistance
                  </li>
                  <li>
                    <strong className="text-neural-900">Cancel Your Access:</strong>{' '}
                    Stop using the agent and prevent accidental duplicate
                    purchases
                  </li>
                  <li>
                    <strong className="text-neural-900">Provide Feedback:</strong>{' '}
                    Help us improve the platform for future users
                  </li>
                  <li>
                    <strong className="text-neural-900">
                      Review Documentation:
                    </strong>{' '}
                    Explore guides and tutorials at{' '}
                    <a
                      href="https://onelastai.co/docs"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      onelastai.co/docs
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cancellation */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              6. Cancellation & Access Management
            </h2>

            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-6">
                <h3 className="text-xl font-semibold mb-3 text-blue-600">
                  Important: No Auto-Renewal = Simple Management
                </h3>
                <p className="text-neural-700 mb-3">
                  Since all purchases are one-time with{' '}
                  <strong className="text-neural-900">NO auto-renewal</strong>,
                  there's nothing to "cancel" in the traditional sense. You're
                  never automatically charged again. Your access simply expires
                  after your chosen period (1 day, 1 week, or 1 month), and you
                  can re-purchase whenever you want.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  6.1 Stopping Access Early (Optional)
                </h3>
                <p className="text-neural-700 mb-3">
                  If you want to stop using an agent before your access expires,
                  you can cancel through:
                </p>
                <div className="space-y-3">
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      Method 1: Agent Page
                    </p>
                    <ol className="list-decimal pl-6 text-neural-700 text-sm space-y-1">
                      <li>Go to /subscribe page</li>
                      <li>Find your active agent</li>
                      <li>Click "Cancel Subscription" button</li>
                      <li>Confirm cancellation</li>
                    </ol>
                  </div>
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      Method 2: Email Request
                    </p>
                    <p className="text-neural-700 text-sm">
                      Email{' '}
                      <a
                        href="mailto:support@onelastai.co"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        support@onelastai.co
                      </a>{' '}
                      with your account email, agent name, and "CANCEL ACCESS"
                      in the subject line
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  6.2 What Happens When You Cancel
                </h3>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    <strong className="text-neural-900">Immediate Effect:</strong>{' '}
                    Access is terminated and you can no longer use the agent
                  </li>
                  <li>
                    <strong className="text-neural-900">No Future Charges:</strong>{' '}
                    Since there's no auto-renewal anyway, you won't be charged
                    again
                  </li>
                  <li>
                    <strong className="text-neural-900">Data Retention:</strong> Your
                    conversation history is kept for 30 days
                  </li>
                  <li>
                    <strong className="text-neural-900">No Refund:</strong> Current
                    purchase is not refunded (all sales final)
                  </li>
                  <li>
                    <strong className="text-neural-900">Can Re-purchase:</strong> You
                    can buy access again anytime you want
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-xl font-semibold mb-3 text-blue-600">
                  6.3 Re-purchasing Access
                </h3>
                <p className="text-neural-700 mb-2">
                  You can purchase access again at any time after expiration or
                  cancellation:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li>Go to /subscribe page</li>
                  <li>Choose the same or different agent</li>
                  <li>
                    Select your preferred plan ($1/day, <span className="line-through text-neural-400">$10</span> $5/week, <span className="line-through text-neural-400">$30</span> $15/month, or <span className="line-through text-neural-400">$300</span> $150/year) 🎁 50% OFF
                  </li>
                  <li>Complete payment - access starts immediately</li>
                  <li>
                    Your previous conversation history is restored if within 30
                    days
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Chargebacks */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              7. Chargebacks and Disputes
            </h2>

            <div className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <h3 className="text-xl font-semibold mb-3 text-amber-700">
                  7.1 Contact Us First
                </h3>
                <p className="text-neural-700">
                  Before filing a chargeback or payment dispute with your bank,
                  please contact us at{' '}
                  <a
                    href="mailto:billing@onelastai.co"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    billing@onelastai.co
                  </a>
                  . We're committed to resolving billing issues quickly.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  7.2 Chargeback Policy
                </h3>
                <p className="text-neural-700 mb-3">
                  Filing a chargeback for a legitimate charge may result in:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>Immediate account suspension</li>
                  <li>Permanent ban from future services</li>
                  <li>Legal action for fraudulent chargebacks</li>
                  <li>Collection of chargeback fees ($15-25)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  7.3 Legitimate Disputes
                </h3>
                <p className="text-neural-700">
                  We will work with you on legitimate billing errors such as:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1 mt-2">
                  <li>Charges after proper cancellation</li>
                  <li>Duplicate transactions</li>
                  <li>Unauthorized account access</li>
                  <li>System processing errors</li>
                  <li>Charged for duplicate active access to the same agent</li>
                </ul>
                <p className="text-neural-500 mt-3 text-sm">
                  These issues will be investigated and resolved within 5-7
                  business days.
                </p>
              </div>
            </div>
          </section>

          {/* Price Changes */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              8. Price Changes
            </h2>
            <p className="text-neural-700 mb-4">
              We reserve the right to change our pricing at any time. Price
              changes will:
            </p>
            <ul className="list-disc pl-6 text-neural-700 space-y-2">
              <li>Be communicated at least 30 days in advance via email</li>
              <li>Apply to all new purchases immediately upon announcement</li>
              <li>
                Not affect any active access periods already purchased at the
                old price
              </li>
              <li>
                Allow you to make final purchases at current prices before
                changes take effect
              </li>
            </ul>
            <p className="text-neural-500 mt-4 text-sm">
              Since there's no auto-renewal, you're never locked into new
              pricing - you simply choose whether to purchase again at the new
              rates.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-white">
              9. Contact Billing Support
            </h2>
            <div className="space-y-3 text-blue-100">
              <p>
                <strong className="text-white">Billing Questions:</strong>
              </p>
              <p>
                Email:{' '}
                <a
                  href="mailto:billing@onelastai.co"
                  className="text-white hover:text-blue-200 underline"
                >
                  billing@onelastai.co
                </a>
              </p>
              <p>
                Support:{' '}
                <a
                  href="mailto:support@onelastai.co"
                  className="text-white hover:text-blue-200 underline"
                >
                  support@onelastai.co
                </a>
              </p>
              <p>
                Website:{' '}
                <a
                  href="https://onelastai.co"
                  className="text-white hover:text-blue-200 underline"
                >
                  https://onelastai.co
                </a>
              </p>

              <div className="mt-6 pt-6 border-t border-blue-400/30">
                <p className="text-sm text-blue-200">
                  <strong className="text-white">Response Time:</strong> We
                  respond to all billing inquiries within 24-48 hours
                  (Monday-Friday, excluding holidays).
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
