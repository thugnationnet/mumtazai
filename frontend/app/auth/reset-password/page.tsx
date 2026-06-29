'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { KeyRound } from 'lucide-react';
import CloudflareTurnstile, { useTurnstile } from '@/components/CloudflareTurnstile';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { onVerify, onExpire, getToken, resetToken } = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const turnstileToken = getToken();
    if (!turnstileToken) {
      setError('Please complete the verification challenge');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('If an account exists with this email, you will receive a password reset link.');
        setTimeout(() => router.push('/auth/login'), 3000);
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col themed-section-bg">
      {/* Hero Banner - Glass Pillar Glassmorphism */}
      <section className="relative py-10 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        {/* Chrome shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              Password Reset
            </div>
            <div className="flex justify-center mb-3">
              <div className="p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                <KeyRound className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-1">Reset Password</h1>
            <p className="text-sm text-slate-600">Enter your email and we&apos;ll send you a reset link</p>
          </div>
        </div>
      </section>

      {/* Form area – below hero with gap, no overlap */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-md">
          {/* Success Message */}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 shadow-sm">
              <p className="text-green-800 text-center text-sm font-medium">{message}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 shadow-sm">
              <p className="text-red-800 text-center text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Reset Form Card */}
          <div className="relative glass-card p-6">
            <div className="text-center mb-4">
              <Link href="/" className="inline-block mb-2">
                <Image
                  src="/images/logos/company-logo.png"
                  alt="Mumtaz AI"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain mx-auto"
                  priority
                />
              </Link>
              <h2 className="text-xl font-bold text-slate-700">Forgot Password?</h2>
              <p className="text-xs text-slate-400 mt-0.5">No worries, we&apos;ll help you reset it</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-white/80 rounded-lg bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                  placeholder="Enter your email address"
                />
              </div>

              <CloudflareTurnstile onVerify={onVerify} onExpire={onExpire} className="flex justify-center" />

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 text-sm ${
                  loading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-700 hover:to-indigo-600 shadow-sm hover:shadow-md'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-3">
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 font-medium">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
