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

function LoginPageContent() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, state } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neural-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neural-600">Already signed in! Redirecting...</p>
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

    try {
      await login(formData.email, formData.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Banner – compact */}
      <section className="bg-gradient-to-r from-brand-600 to-accent-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 mb-2">
            <LogIn className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome Back</h1>
          <p className="text-sm opacity-90">Sign in to access your AI agents and tools</p>
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
          <div className="bg-white rounded-2xl shadow-sm border border-neural-100 p-6">
            <div className="text-center mb-4">
              <Link href="/" className="inline-block mb-2">
                <Image
                  src="/images/logos/company-logo.png"
                  alt="One Last AI"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain mx-auto"
                  priority
                />
              </Link>
              <h2 className="text-xl font-bold text-neural-800">Sign In</h2>
              <p className="text-xs text-neural-600 mt-0.5">Enter your credentials below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neural-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-neural-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neural-700 mb-1">
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
                    className="w-full px-3 py-2 pr-10 border border-neural-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-neural-400 hover:text-neural-600"
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
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || state.isLoading}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 text-sm ${
                  isSubmitting || state.isLoading
                    ? 'bg-neural-200 text-neural-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-600 to-accent-500 text-white hover:from-brand-700 hover:to-accent-600 shadow-sm hover:shadow-md'
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
              <p className="text-sm text-neural-600">
                Don&apos;t have an account?{' '}
                <Link
                  href={`/auth/signup${
                    searchParams.get('redirect')
                      ? `?redirect=${searchParams.get('redirect')}`
                      : ''
                  }`}
                  className="text-brand-600 hover:text-brand-700 font-semibold"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-3">
            <Link href="/" className="text-sm text-neural-500 hover:text-neural-700 font-medium">
              ← Back to homepage
            </Link>
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
