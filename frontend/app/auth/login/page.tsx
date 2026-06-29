'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import OAuthButtons from '@/components/auth/OAuthButtons';
import CloudflareTurnstile, { useTurnstile } from '@/components/CloudflareTurnstile';

function LoginPageContent() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { onVerify, onExpire, getToken, resetToken } = useTurnstile();

  const { login, state } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Force light theme on login page by temporarily removing dark-theme class
  useEffect(() => {
    const html = document.documentElement;
    const hadDarkTheme = html.classList.contains('dark-theme');
    html.classList.remove('dark-theme');
    return () => {
      if (hadDarkTheme) html.classList.add('dark-theme');
    };
  }, []);

  // Get success message from URL parameters (e.g., after successful signup)
  const successMessage = searchParams.get('message');

  // Get OAuth error from URL parameters
  const oauthError = searchParams.get('error');
  const oauthErrorMessages: Record<string, string> = {
    invalid_state: 'Authentication session expired. Please try again.',
    no_code: 'Authorization was denied. Please try again.',
    token_exchange_failed: 'Could not complete sign-in. Please try again.',
    no_email: 'No email address found on your account. Please use email/password sign-in.',
    oauth_failed: 'Sign-in failed. Please try again or use email/password.',
  };
  const oauthErrorMessage = oauthError ? oauthErrorMessages[oauthError] || 'Sign-in failed. Please try again.' : null;

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      const isAdmin = state.user?.role === 'admin';
      const redirectParam = searchParams.get('redirect');
      // Validate redirect: only allow *.mumtaz.ai domains or relative paths
      const isSafeRedirect = redirectParam && (
        /^https:\/\/([a-z0-9-]+\.)*mumtazai\.co(\/.*)?\??$/i.test(redirectParam) ||
        (redirectParam.startsWith('/') && !redirectParam.startsWith('//'))
      );
      const redirectTo = isSafeRedirect
        ? redirectParam
        : (isAdmin ? '/admin/dashboard' : '/dashboard/overview');
      if (redirectTo.startsWith('http')) {
        window.location.href = redirectTo;
      } else {
        router.push(redirectTo);
      }
    }
  }, [state.isAuthenticated, state.user, router, searchParams]);

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center themed-section-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (state.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center themed-section-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Already signed in! Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const turnstileToken = getToken();
    if (!turnstileToken) {
      setIsSubmitting(false);
      return;
    }

    try {
      await login(formData.email, formData.password, turnstileToken);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
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
              Sign In
            </div>
            <div className="flex justify-center mb-3">
              <div className="p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                <LogIn className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-1">Welcome Back</h1>
            <p className="text-sm text-slate-600">Sign in to access your AI agents and tools</p>
          </div>
        </div>
      </section>

      {/* Form area – below hero with gap, no overlap */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-md">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 shadow-sm">
              <p className="text-green-800 text-center text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {(state.error || oauthErrorMessage) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 shadow-sm">
              <p className="text-red-800 text-center text-sm font-medium">{state.error || oauthErrorMessage}</p>
            </div>
          )}

          {/* Login Form Card */}
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
              <h2 className="text-xl font-bold text-slate-700">Sign In</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter your credentials below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-white/80 rounded-lg bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 pr-10 border border-white/80 rounded-lg bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link
                  href="/auth/reset-password"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>

              <CloudflareTurnstile onVerify={onVerify} onExpire={onExpire} className="flex justify-center" />

              <button
                type="submit"
                disabled={isSubmitting || state.isLoading}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 text-sm ${
                  isSubmitting || state.isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-700 hover:to-indigo-600 shadow-sm hover:shadow-md'
                }`}
              >
                {isSubmitting || state.isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <OAuthButtons redirect={searchParams.get('redirect') || undefined} />

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link
                  href={`/auth/signup${
                    searchParams.get('redirect')
                      ? `?redirect=${searchParams.get('redirect')}`
                      : ''
                  }`}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Sign up here
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
