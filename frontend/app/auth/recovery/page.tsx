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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header with Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image
              src="/logo.svg"
              alt="One Last AI"
              width={60}
              height={60}
              className="mx-auto"
              priority
            />
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-neural-900">
            Account Recovery
          </h1>
          <p className="mt-2 text-neural-600">
            Enter one of your backup codes to sign in
          </p>
        </div>

        {/* Recovery Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-900 mb-2">Recovery Successful!</h2>
              <p className="text-neural-600">Redirecting to your dashboard...</p>
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
                  <label htmlFor="backupCode" className="block text-sm font-medium text-neural-700 mb-2">
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
                             border-2 border-neural-300 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
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
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-brand-600 to-accent-500 text-white hover:from-brand-700 hover:to-accent-600'
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
        <div className="space-y-3 text-center">
          <Link
            href={`/auth/verify-2fa?token=${creds.token}&userId=${creds.user}`}
            className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Authenticator
          </Link>
          
          <div className="text-sm text-neural-500">
            <p>
              Need help?{' '}
              <Link href="/support/contact-us" className="text-brand-600 hover:text-brand-700">
                Contact Support
              </Link>
            </p>
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
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <RecoveryContent />
    </Suspense>
  );
}
