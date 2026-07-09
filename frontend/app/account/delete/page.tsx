'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DeleteAccountPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const { state, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.push('/auth/login?redirect=/account/delete');
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  const handleFirstStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (confirmation !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" exactly to proceed.');
      return;
    }

    setShowFinalConfirm(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, confirmation }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to delete account');
        setIsDeleting(false);
        setShowFinalConfirm(false);
        return;
      }

      // Account deleted — clear local state and redirect
      logout();
      router.push('/auth/login?message=account-deleted');
    } catch {
      setError('Network error. Please try again.');
      setIsDeleting(false);
      setShowFinalConfirm(false);
    }
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
      </div>
    );
  }

  if (!state.isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-16 sm:py-24">
        {/* Back link */}
        <Link
          href="/dashboard/overview"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Warning header */}
        <div className="bg-red-950/50 border border-red-800/60 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-900/60 rounded-lg shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-red-300 mb-2">Delete Your Account</h1>
              <p className="text-red-200/80 text-sm leading-relaxed">
                This action is <strong>permanent and irreversible</strong>. All your data will be
                immediately and permanently deleted, including:
              </p>
            </div>
          </div>
        </div>

        {/* What gets deleted */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Data that will be permanently deleted
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-400">
            {[
              'Your profile, email, and login credentials',
              'All chat sessions and conversation history',
              'Agent subscriptions and personalizations',
              'Canvas projects and deployed apps',
              'Transaction and billing history',
              'Favorites, preferences, and settings',
              'Push notification subscriptions',
              'Security settings and 2FA configuration',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Trash2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {!showFinalConfirm ? (
          /* Step 1: Confirmation form */
          <form onSubmit={handleFirstStep} className="space-y-5">
            {/* Password field (for password-based accounts) */}
            {state.user?.authMethod === 'password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Enter your password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Your current password"
                />
              </div>
            )}

            {/* Type confirmation */}
            <div>
              <label htmlFor="confirmation" className="block text-sm font-medium text-slate-300 mb-1.5">
                Type <span className="font-mono text-red-400">DELETE MY ACCOUNT</span> to confirm
              </label>
              <input
                id="confirmation"
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="DELETE MY ACCOUNT"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700/50 rounded-lg px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={confirmation !== 'DELETE MY ACCOUNT'}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" />
              Continue to Delete Account
            </button>
          </form>
        ) : (
          /* Step 2: Final confirmation */
          <div className="space-y-5">
            <div className="bg-red-950/70 border-2 border-red-600 rounded-xl p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-red-300 mb-2">Are you absolutely sure?</h2>
              <p className="text-red-200/80 text-sm mb-1">
                Logged in as <strong>{state.user?.email}</strong>
              </p>
              <p className="text-red-200/60 text-xs">
                This cannot be undone. Your account and all data will be gone forever.
              </p>
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700/50 rounded-lg px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowFinalConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete Forever
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Contact support */}
        <p className="mt-8 text-center text-xs text-slate-500">
          Having issues?{' '}
          <Link href="/support" className="text-indigo-400 hover:text-indigo-300">
            Contact Support
          </Link>{' '}
          at support@mumtaz.ai
        </p>
      </div>
    </div>
  );
}
