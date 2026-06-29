'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { getAgentChatUrl } from '@/lib/agentUrl';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
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
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-lg">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
            🎉 Payment Successful!
          </h1>
          <p className="text-xl text-slate-600">
            You now have access to{' '}
            <span className="font-semibold text-purple-700">{agentName}</span>
          </p>
        </div>
      </section>

      <div className="container-custom section-padding-lg">
        <div className="max-w-2xl mx-auto text-center">

          {/* Details */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/60 shadow-lg">
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-white/40 pb-4">
                <span className="text-slate-600">Access Status:</span>
                <span className="font-semibold text-green-600">✅ Active</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/40 pb-4">
                <span className="text-slate-600">Agent:</span>
                <span className="font-semibold">{agentName}</span>
              </div>
              {sessionId && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Session ID:</span>
                  <span className="font-mono text-sm text-gray-500">
                    {sessionId.substring(0, 20)}...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={getAgentChatUrl(agentName.toLowerCase().replace(/\s+/g, '-'))}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Start Chatting with {agentName}
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-white/60 hover:bg-white/80 text-slate-800 rounded-xl font-semibold transition-all border border-white/60"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Info Box */}
          <div className="mt-12 bg-white/40 backdrop-blur-lg rounded-2xl p-6 text-left border border-white/60 shadow-lg">
            <h3 className="font-bold text-slate-800 mb-2">📧 What's Next?</h3>
            <ul className="text-slate-600 space-y-2 text-sm">
              <li>✓ A confirmation email has been sent to your inbox</li>
              <li>✓ Your access is now active and ready to use</li>
              <li>✓ You can manage your purchases from the Dashboard</li>
              <li>✓ No auto-renewal - buy again when you want more access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
