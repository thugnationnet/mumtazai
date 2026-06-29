'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ErrorPageProps {
  code: number | string;
  title: string;
  description: string;
  icon: React.ReactNode;
  suggestion?: string;
  retryAfter?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  showRetryButton?: boolean;
  showContactButton?: boolean;
  heroColor?: 'brand' | 'red' | 'amber' | 'purple' | 'orange';
}

const heroGradients: Record<string, string> = {
  brand: 'from-blue-600 to-indigo-600',
  red: 'from-red-600 to-rose-500',
  amber: 'from-amber-600 to-orange-500',
  purple: 'from-purple-600 to-indigo-500',
  orange: 'from-orange-600 to-amber-500',
};

export default function ErrorPage({
  code,
  title,
  description,
  icon,
  suggestion,
  retryAfter,
  showHomeButton = true,
  showBackButton = true,
  showRetryButton = false,
  showContactButton = false,
  heroColor = 'brand',
}: ErrorPageProps) {
  const router = useRouter();
  const gradient = heroGradients[heroColor] || heroGradients.brand;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Banner – matches auth pages */}
      <section className={`bg-gradient-to-r ${gradient} text-slate-900 py-10 md:py-14`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-300 mb-3">
            <span className="text-3xl">{icon}</span>
          </div>
          <div className="text-5xl md:text-6xl font-extrabold tracking-tight mb-2 font-mono opacity-90">
            {code}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{title}</h1>
          <p className="text-sm md:text-base opacity-90 max-w-md mx-auto">{description}</p>
        </div>
      </section>

      {/* Content area – matches auth page layout */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="glass-card p-6">
            {/* Logo */}
            <div className="text-center mb-4">
              <Link href="/" className="inline-block mb-3">
                <Image
                  src="/images/logos/company-logo.png"
                  alt="Mumtaz AI"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain mx-auto"
                />
              </Link>

              {suggestion && (
                <p className="text-slate-500 text-sm leading-relaxed">
                  {suggestion}
                </p>
              )}

              {retryAfter && (
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-gray-50 border border-white/80 text-slate-600 text-sm">
                  <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Retry after: <span className="font-semibold">{retryAfter}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 mt-5">
              {showHomeButton && (
                <Link
                  href="/"
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-center text-slate-900 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Back to Home
                </Link>
              )}

              {showRetryButton && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-center text-slate-600 bg-gray-50 border border-white/80 hover:bg-gray-100 transition-all duration-200"
                >
                  Try Again
                </button>
              )}

              {showBackButton && (
                <button
                  onClick={() => router.back()}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-center text-slate-600 bg-gray-50 border border-white/80 hover:bg-gray-100 transition-all duration-200"
                >
                  &larr; Go Back
                </button>
              )}

              {showContactButton && (
                <Link
                  href="/support"
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-center text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 transition-all duration-200"
                >
                  Contact Support
                </Link>
              )}
            </div>
          </div>

          {/* Footer link */}
          <div className="text-center mt-4">
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 font-medium">
              &larr; Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
