'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const [mounted, setMounted] = useState(false);
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Don't redirect while loading
    if (state.isLoading) return;

    // Redirect if not authenticated
    if (!state.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [state.isAuthenticated, state.isLoading, router, redirectTo, mounted]);

  // During SSR, show loading
  if (!mounted || state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center neu-page-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!state.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
