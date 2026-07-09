'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, LogOut } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirect = searchParams.get('redirect') || '/dashboard/overview';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only last digit
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered (only if terms agreed)
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6 && agreedToTerms) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const finalCode = verificationCode || code.join('');
    if (finalCode.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Privacy Policy and Terms of Service');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: finalCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Email verified successfully! Redirecting...');
        setTimeout(() => {
          router.push(`/auth/login?message=Email verified! Please sign in.&redirect=${encodeURIComponent(redirect)}`);
        }, 1500);
      } else {
        setError(data.message || 'Invalid verification code');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('A new verification code has been sent to your email.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-base flex flex-col">
      {/* Hero Banner – compact */}
      <section className="bg-gradient-to-r from-brand-600 to-accent-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 mb-2">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Verify Your Email</h1>
          <p className="text-sm opacity-90">Enter the 6-digit code sent to your inbox</p>
        </div>
      </section>

      {/* Form area */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-md">
          {/* Success Message */}
          {message && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-3 mb-3 shadow-sm">
              <p className="text-green-800 dark:text-green-300 text-center text-sm font-medium">{message}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-3 mb-3 shadow-sm">
              <p className="text-red-800 dark:text-red-300 text-center text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Verification Card */}
          <div className="bg-white dark:bg-dark-elevated rounded-2xl shadow-sm border border-neural-100 dark:border-neural-700 p-6">
            <div className="text-center mb-5">
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
              <h2 className="text-xl font-bold text-neural-800 dark:text-white">Check Your Email</h2>
              <p className="text-xs text-neural-600 dark:text-neural-400 mt-1">
                We sent a verification code to
              </p>
              {email && (
                <p className="text-sm font-semibold text-brand-600 mt-0.5">{email}</p>
              )}
            </div>

            {/* 6-digit code input */}
            <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-13 text-center text-xl font-bold border-2 border-neural-200 dark:border-neural-500 rounded-lg bg-gray-50 dark:bg-dark-base dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white dark:focus:bg-dark-base transition-all"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Terms & Privacy checkbox */}
            <div className="flex items-start gap-3 mb-4">
              <button
                type="button"
                role="checkbox"
                aria-checked={agreedToTerms}
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  agreedToTerms
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-transparent border-neural-400 dark:border-neural-300 hover:border-brand-500'
                }`}
              >
                {agreedToTerms && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <label
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className="text-sm text-neural-300 dark:text-neural-300 cursor-pointer leading-relaxed select-none"
              >
                I agree to the{' '}
                <Link href="/legal/privacy-policy" target="_blank" className="text-brand-400 hover:text-brand-300 font-semibold underline" onClick={(e) => e.stopPropagation()}>
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/legal/terms-of-service" target="_blank" className="text-brand-400 hover:text-brand-300 font-semibold underline" onClick={(e) => e.stopPropagation()}>
                  Terms of Service
                </Link>
              </label>
            </div>

            <button
              onClick={() => handleVerify()}
              disabled={loading || code.join('').length !== 6 || !agreedToTerms}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 text-sm ${
                loading || code.join('').length !== 6 || !agreedToTerms
                  ? 'bg-neural-200 dark:bg-neural-700 text-neural-400 dark:text-neural-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-600 to-accent-500 text-white hover:from-brand-700 hover:to-accent-600 shadow-sm hover:shadow-md'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>

            {/* Resend */}
            <div className="mt-4 text-center">
              <p className="text-sm text-neural-600 dark:text-neural-400">
                Didn&apos;t receive the code?{' '}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-brand-600 hover:text-brand-700 font-semibold disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </p>
              <p className="text-xs text-neural-500 dark:text-neural-400 mt-1">Check your spam/junk folder if you don&apos;t see it.</p>
            </div>

            {/* Divider + Sign out */}
            <div className="mt-4 pt-4 border-t border-neural-100 dark:border-neural-700 text-center">
              <p className="text-xs text-neural-500 dark:text-neural-400 mb-2">
                Can&apos;t verify or don&apos;t agree to the terms?
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out &amp; go back to homepage
              </Link>
            </div>
          </div>

          <div className="text-center mt-3">
            <Link href="/" className="text-sm text-neural-500 dark:text-neural-400 hover:text-neural-700 dark:hover:text-neural-300 font-medium">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-dark-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neural-600 dark:text-neural-400">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
