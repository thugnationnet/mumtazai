import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Banner */}
      <section className="neu-hero py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-300 mb-3">
            <span className="text-3xl">🔍</span>
          </div>
          <div className="text-5xl md:text-6xl font-extrabold tracking-tight mb-2 font-mono opacity-90">
            404
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Page Not Found</h1>
          <p className="text-sm md:text-base opacity-90 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-md">
          <div className="glass-card p-6">
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
              <p className="text-neural-600 text-sm">
                Check the URL or head back to familiar ground.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mt-5">
              <Link
                href="/"
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-center text-slate-900 bg-gradient-to-r from-brand-600 to-accent-500 hover:from-brand-700 hover:to-accent-600 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Back to Home
              </Link>
              <Link
                href="/support"
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-center text-brand-600 hover:text-brand-700 border border-brand-200 hover:border-brand-300 bg-brand-50 hover:bg-brand-100 transition-all duration-200"
              >
                Contact Support
              </Link>
            </div>
          </div>

          <div className="text-center mt-4">
            <Link href="/" className="text-sm text-neural-500 hover:text-neural-700 font-medium">
              &larr; Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}