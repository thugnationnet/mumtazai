'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { UserPlus } from 'lucide-react';
import OAuthButtons from '@/components/auth/OAuthButtons';
import CloudflareTurnstile, { useTurnstile } from '@/components/CloudflareTurnstile';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { onVerify, onExpire, getToken, resetToken } = useTurnstile();

  const handlePasswordSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const turnstileToken = getToken();

    if (!turnstileToken) {
      setError('Please complete the verification challenge');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, authMethod: 'password', turnstileToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to create account');
        return;
      }

      // Redirect to email verification page with the email
      const redirectTo = searchParams.get('redirect') || '/dashboard/overview';
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`);
    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error('Password signup error:', err);
    } finally {
      setIsLoading(false);
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
              Create Account
            </div>
            <div className="flex justify-center mb-3">
              <div className="p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-1">Join Mumtaz AI</h1>
            <p className="text-sm text-slate-600">Create your account in seconds and start exploring</p>
          </div>
        </div>
      </section>

      {/* Form area – below hero with gap, no overlap */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-lg">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 shadow-sm">
              <p className="text-red-800 text-center text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Signup Form Card */}
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
              <h2 className="text-xl font-bold text-slate-700">Create Account</h2>
              <p className="text-xs text-slate-400 mt-0.5">Fill in your details below</p>
            </div>

            <form onSubmit={handlePasswordSignup} className="space-y-3">
              {/* Row 1: Email + Name side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-500 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-white/80 rounded-lg bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-500 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-white/80 rounded-lg bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Row 2: Password + Confirm side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-500 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      className="w-full px-3 py-2 pr-10 border border-white/80 rounded-lg bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-500 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      className="w-full px-3 py-2 pr-10 border border-white/80 rounded-lg bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <CloudflareTurnstile onVerify={onVerify} onExpire={onExpire} className="flex justify-center" />

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 text-sm ${
                  isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-700 hover:to-indigo-600 shadow-sm hover:shadow-md'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>

              <p className="text-xs text-slate-400 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>

            <OAuthButtons redirect={searchParams.get('redirect') || undefined} />

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                  href={`/auth/login${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
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

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400">
            <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16.309 9.313a1.12 1.12 0 0 0-.962-.085l-2.3.946L15.393.39A.466.466 0 0 0 15 0a.473.473 0 0 0-.42.228L7.6 11.986c-.14.222-.12.5.045.7a.69.69 0 0 0 .596.252l2.715-.372-1.477 5.605a.465.465 0 0 0 .253.529c.076.037.16.056.243.056a.47.47 0 0 0 .324-.126l6.5-6.06c.183-.17.24-.434.146-.67z"/></svg>
            <span>Protected by Cloudflare</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center themed-section-bg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
