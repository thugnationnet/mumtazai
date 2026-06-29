'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function CancelContent() {
  const searchParams = useSearchParams();
  const agentName = searchParams.get('agent') || 'AI Agent';

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass Pillars */}
        <div className="absolute top-0 left-[10%] w-40 h-full bg-white/10 -skew-x-12 blur-2xl pointer-events-none" />
        <div className="absolute top-0 left-[30%] w-24 h-full bg-white/15 -skew-x-12 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-[20%] w-32 h-full bg-white/10 skew-x-12 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-[5%] w-20 h-full bg-white/15 skew-x-12 blur-2xl pointer-events-none" />
        <div className="absolute top-0 left-[55%] w-28 h-full bg-white/8 -skew-x-6 blur-3xl pointer-events-none" />
        {/* Chrome Shine */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
          {/* Cancel Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          {/* Cancel Message */}
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
            Payment Cancelled
          </h1>
          <p className="text-xl text-slate-600">
            Your purchase of{' '}
            <span className="font-semibold text-purple-700">{agentName}</span>{' '}
            was not completed
          </p>
        </div>
      </section>

      <div className="container-custom section-padding-lg">
        <div className="max-w-2xl mx-auto text-center">

          {/* Info Box */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/60 shadow-lg">
            <p className="text-slate-700 mb-4">
              Don't worry! No charges were made to your account.
            </p>
            <p className="text-slate-600 text-sm">
              You can try again anytime or explore our other agents.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/subscribe?agent=${encodeURIComponent(agentName)}`}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Try Again
            </Link>
            <Link
              href="https://mumtaz.ai/agents"
              className="px-8 py-4 bg-white/60 hover:bg-white/80 text-slate-800 rounded-xl font-semibold transition-all border border-white/60"
            >
              Browse All Agents
            </Link>
          </div>

          {/* Help Box */}
          <div className="mt-12 bg-white/40 backdrop-blur-lg rounded-2xl p-6 text-left border border-white/60 shadow-lg">
            <h3 className="font-bold text-slate-800 mb-2">💡 Need Help?</h3>
            <ul className="text-slate-600 space-y-2 text-sm">
              <li>
                • Having payment issues?{' '}
                <Link
                  href="/support"
                  className="text-purple-700 hover:underline"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                • Want to learn more about plans?{' '}
                <Link
                  href="/overview/pricing"
                  className="text-purple-700 hover:underline"
                >
                  View Pricing
                </Link>
              </li>
              <li>
                • Questions about pricing? Check our{' '}
                <Link
                  href="/support/faqs"
                  className="text-purple-700 hover:underline"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CancelContent />
    </Suspense>
  );
}
