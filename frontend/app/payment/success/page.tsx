'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const agentName = searchParams.get('agent') || 'AI Agent';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      <div className="container-custom section-padding-lg">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center">
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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🎉 Payment Successful!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            You now have access to{' '}
            <span className="font-semibold text-brand-600">{agentName}</span>
          </p>

          {/* Details */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center border-b pb-4">
                <span className="text-gray-600">Access Status:</span>
                <span className="font-semibold text-green-600">✅ Active</span>
              </div>
              <div className="flex justify-between items-center border-b pb-4">
                <span className="text-gray-600">Agent:</span>
                <span className="font-semibold">{agentName}</span>
              </div>
              {sessionId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Session ID:</span>
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
              href={`https://chat.mumtaz.ai/agents/${agentName.toLowerCase().replace(/\s+/g, '-')}`}
              className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors"
            >
              Start Chatting with {agentName}
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Info Box */}
          <div className="mt-12 bg-blue-50 rounded-xl p-6 text-left">
            <h3 className="font-bold text-gray-900 mb-2">📧 What's Next?</h3>
            <ul className="text-gray-700 space-y-2 text-sm">
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
