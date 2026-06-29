'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyIcon, ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { secureAuthStorage } from '@/lib/secure-auth-storage';

function RecoveryContent() {
  const [backupCode, setBackupCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { state } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tempToken = searchParams.get('token');
  const userId = searchParams.get('userId');

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push('/dashboard/overview');
    }
  }, [state.isAuthenticated, router]);

  // Check for token/userId
  useEffect(() => {
    // Try to get from session storage if not in URL
    if (!tempToken || !userId) {
      const storedToken = sessionStorage.getItem('tempToken');
      const storedUserId = sessionStorage.getItem('tempUserId');
      if (!storedToken || !storedUserId) {
        router.push('/auth/login');
      }
    }
  }, [tempToken, userId, router]);

  const getCredentials = () => {
    return {
      token: tempToken || sessionStorage.getItem('tempToken'),
      user: userId || sessionStorage.getItem('tempUserId'),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanCode = backupCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter a valid backup code');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const creds = getCredentials();

    try {
      const response = await fetch('/api/auth-backend/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tempToken: creds.token,
          userId: creds.user,
          code: cleanCode,
          isBackupCode: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Recovery failed');
      }

      if (data.user) {
        setSuccess(true);
        // Clear temp tokens
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('tempUserId');
        
        // Store user data
        secureAuthStorage.setUser(data.user);
        
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = '/dashboard/overview';
        }, 1500);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Recovery failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const creds = getCredentials();
  if (!creds.token || !creds.user) {
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
              Account Recovery
            </div>
            <div className="flex justify-center mb-3">
              <div className="p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                <KeyIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-1">Account Recovery</h1>
            <p className="text-sm text-slate-600">Enter one of your backup codes to sign in</p>
          </div>
        </div>
      </section>

      {/* Form area */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-md w-full">

        {/* Recovery Form */}
        <div className="relative glass-card p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-900 mb-2">Recovery Successful!</h2>
              <p className="text-slate-500">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <>
              {/* Info Box */}
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <KeyIcon className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Backup codes</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Each backup code can only be used once. After using this code, 
                      it will be removed from your account.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="backupCode" className="block text-sm font-medium text-slate-500 mb-2">
                    Backup Code
                  </label>
                  <input
                    type="text"
                    id="backupCode"
                    value={backupCode}
                    onChange={(e) => {
                      setBackupCode(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="XXXXXXXX"
                    className="w-full px-4 py-3 text-center text-xl font-mono tracking-widest uppercase
                             border-2 border-white/80 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             transition-all duration-200"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !backupCode.trim()}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    isSubmitting || !backupCode.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-700 hover:to-indigo-600'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Verifying...
                    </span>
                  ) : (
                    '🔑 Use Backup Code'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back Links */}
        <div className="space-y-3 text-center mt-4">
          <Link
            href={`/auth/verify-2fa?token=${creds.token}&userId=${creds.user}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Authenticator
          </Link>
          
          <div className="text-sm text-slate-400">
            <p>
              Need help?{' '}
              <Link href="/support/contact-us" className="text-blue-600 hover:text-blue-700">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function RecoveryPage() {
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
      <RecoveryContent />
    </Suspense>
  );
}
