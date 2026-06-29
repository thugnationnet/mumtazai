'use client';

import Link from 'next/link';

export default function SubscriptionSuccessError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen themed-section-bg">
      <div className="container-custom section-padding-lg flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-red-100/80 backdrop-blur-sm flex items-center justify-center text-4xl mb-6">
          ⚠️
        </div>
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
          Something Went Wrong
        </h1>
        <p className="text-lg text-red-600 max-w-2xl mb-8">
          We encountered an error while processing your subscription. This is
          usually temporary.
        </p>

        <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-red-200/60 shadow-lg p-6 w-full max-w-2xl mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            Error Details
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center w-full max-w-xl">
          <button
            onClick={reset}
            className="flex-1 py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex-1 py-3 px-6 rounded-xl font-bold bg-white/50 border border-white/60 text-slate-700 hover:bg-white/70 transition-all duration-300 backdrop-blur-sm text-center"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/support/contact-us"
            className="flex-1 py-3 px-6 rounded-xl font-semibold border border-red-300 text-red-600 hover:bg-red-50/50 transition-all duration-300 backdrop-blur-sm text-center"
          >
            Contact Support
          </Link>
        </div>

        <div className="mt-8 text-sm text-slate-500">
          <p>
            If this problem persists, please contact our support team with the
            error details above.
          </p>
        </div>
      </div>
    </div>
  );
}
