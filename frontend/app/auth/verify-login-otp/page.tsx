'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { secureAuthStorage } from '@/lib/secure-auth-storage';

function VerifyLoginOtpContent() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { state } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tempToken = searchParams.get('token');
  const userId = searchParams.get('userId');
  const redirectTo = searchParams.get('redirect');

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      const dest = redirectTo && /^https:\/\/([a-z0-9-]+\.)*mumtazai\.co(\/.*)?\.?$/i.test(redirectTo)
        ? redirectTo
        : '/dashboard/overview';
      if (dest.startsWith('http')) {
        window.location.href = dest;
      } else {
        router.push(dest);
      }
    }
  }, [state.isAuthenticated, router, redirectTo]);

  // Store credentials in session storage
  useEffect(() => {
    if (tempToken && userId) {
      sessionStorage.setItem('tempToken', tempToken);
      sessionStorage.setItem('tempUserId', userId);
    }
  }, [tempToken, userId]);

  // Redirect if no token/userId
  useEffect(() => {
    if (!tempToken || !userId) {
      router.push('/auth/login');
    }
  }, [tempToken, userId, router]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleInputChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setResendMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/auth-backend/resend-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tempToken, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Redirecting to login...');
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }
        throw new Error(data.message || 'Failed to resend code');
      }

      setResendMessage('A new code has been sent to your email.');
      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth-backend/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tempToken,
          userId,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      if (data.user) {
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('tempUserId');
        secureAuthStorage.setUser(data.user);
        // Redirect to original destination or dashboard
        const dest = redirectTo && /^https:\/\/([a-z0-9-]+\.)*mumtazai\.co(\/.*)?\.?$/i.test(redirectTo)
          ? redirectTo
          : '/dashboard/overview';
        window.location.href = dest;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit when all digits entered
  useEffect(() => {
    const verificationCode = code.join('');
    if (verificationCode.length === 6 && !isSubmitting) {
      const form = document.getElementById('verify-otp-form') as HTMLFormElement;
      form?.requestSubmit();
    }
  }, [code, isSubmitting]);

  if (!tempToken || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center themed-section-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
              Email Verification
            </div>
            <div className="flex justify-center mb-3">
              <div className="p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                <EnvelopeIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-1">Check Your Email</h1>
            <p className="text-sm text-slate-600">Enter the 6-digit verification code we sent to your inbox</p>
          </div>
        </div>
      </section>

      {/* Form area */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-md">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 shadow-sm">
              <p className="text-red-800 text-center text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success / Resend Message */}
          {resendMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 shadow-sm">
              <p className="text-green-800 text-center text-sm font-medium">{resendMessage}</p>
            </div>
          )}

          {/* Verification Card */}
          <div className="relative glass-card p-6">
            <div className="text-center mb-5">
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
              <h2 className="text-xl font-bold text-slate-700">Verify Login Code</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter the code sent to your email</p>
            </div>

            <form id="verify-otp-form" onSubmit={handleSubmit} className="space-y-4">
              {/* 6-Digit Code Input */}
              <div className="flex justify-center gap-2" role="group" aria-label="6-digit verification code">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    aria-label={`Digit ${index + 1} of 6`}
                    className="w-11 h-13 text-center text-xl font-bold border-2 border-white/80 rounded-lg bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                    disabled={isSubmitting}
                  />
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || code.join('').length !== 6}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 text-sm ${
                  isSubmitting || code.join('').length !== 6
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-700 hover:to-indigo-600 shadow-sm hover:shadow-md'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Verifying...
                  </span>
                ) : (
                  'Verify & Sign In'
                )}
              </button>
            </form>

            {/* Resend Code */}
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">
                Didn&apos;t receive the code?{' '}
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
                >
                  {isResending
                    ? 'Sending...'
                    : resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : 'Resend Code'}
                </button>
              </p>
              <p className="text-xs text-slate-400 mt-1">Check your spam/junk folder if you don&apos;t see it.</p>
            </div>

            {/* Divider + 2FA hint */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Want to use an authenticator app instead?{' '}
                <span className="text-slate-500">Enable 2FA in your security settings after signing in.</span>
              </p>
            </div>
          </div>

          <div className="text-center mt-3">
            <Link href="/auth/login" className="text-sm text-slate-400 hover:text-slate-600 font-medium">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyLoginOtpPage() {
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
      <VerifyLoginOtpContent />
    </Suspense>
  );
}
