'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function CancelContent() {
  const searchParams = useSearchParams();
  const agentName = searchParams.get('agent') || 'AI Agent';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container-custom section-padding-lg">
        <div className="max-w-2xl mx-auto text-center">
          {/* Cancel Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-orange-500 rounded-full flex items-center justify-center">
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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your purchase of{' '}
            <span className="font-semibold text-brand-600">{agentName}</span>{' '}
            was not completed
          </p>

          {/* Info Box */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <p className="text-gray-700 mb-4">
              Don't worry! No charges were made to your account.
            </p>
            <p className="text-gray-600 text-sm">
              You can try again anytime or explore our other agents.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/subscribe?agent=${encodeURIComponent(agentName)}`}
              className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="https://mumtaz.ai/agents"
              className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
            >
              Browse All Agents
            </Link>
          </div>

          {/* Help Box */}
          <div className="mt-12 bg-blue-50 rounded-xl p-6 text-left">
            <h3 className="font-bold text-gray-900 mb-2">💡 Need Help?</h3>
            <ul className="text-gray-700 space-y-2 text-sm">
              <li>
                • Having payment issues?{' '}
                <Link
                  href="/support"
                  className="text-brand-600 hover:underline"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                • Want to learn more about plans?{' '}
                <Link
                  href="/overview/pricing"
                  className="text-brand-600 hover:underline"
                >
                  View Pricing
                </Link>
              </li>
              <li>
                • Questions about pricing? Check our{' '}
                <Link
                  href="/support/faqs"
                  className="text-brand-600 hover:underline"
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
