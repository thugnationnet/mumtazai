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
                <ShieldCheck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-1">Verify Your Email</h1>
            <p className="text-sm text-slate-600">Enter the 6-digit code sent to your inbox</p>
          </div>
        </div>
      </section>

      {/* Form area */}
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
              <h2 className="text-xl font-bold text-slate-700">Check Your Email</h2>
              <p className="text-xs text-slate-400 mt-1">
                We sent a verification code to
              </p>
              {email && (
                <p className="text-sm font-semibold text-blue-600 mt-0.5">{email}</p>
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
                  className="w-11 h-13 text-center text-xl font-bold border-2 border-white/80 rounded-lg bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
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
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-transparent border-slate-400 hover:border-blue-500'
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
                className="text-sm text-slate-500 cursor-pointer leading-relaxed select-none"
              >
                I agree to the{' '}
                <Link href="/legal/privacy-policy" target="_blank" className="text-blue-600 hover:text-blue-700 font-semibold underline" onClick={(e) => e.stopPropagation()}>
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/legal/terms-of-service" target="_blank" className="text-blue-600 hover:text-blue-700 font-semibold underline" onClick={(e) => e.stopPropagation()}>
                  Terms of Service
                </Link>
              </label>
            </div>

            <button
              onClick={() => handleVerify()}
              disabled={loading || code.join('').length !== 6 || !agreedToTerms}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 text-sm ${
                loading || code.join('').length !== 6 || !agreedToTerms
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-700 hover:to-indigo-600 shadow-sm hover:shadow-md'
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
              <p className="text-sm text-slate-500">
                Didn&apos;t receive the code?{' '}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </p>
              <p className="text-xs text-slate-400 mt-1">Check your spam/junk folder if you don&apos;t see it.</p>
            </div>

            {/* Divider + Sign out */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 mb-2">
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
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 font-medium">
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
      <div className="min-h-screen flex items-center justify-center themed-section-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
