'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

/**
 * ServiceWorkerRegistration — registers the SW and shows an update banner
 * when a new version is detected.
 */
export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const registerSW = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Don't register SW in development
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      setRegistration(reg);

      // Check for updates periodically (every 60 minutes)
      setInterval(() => {
        reg.update().catch(() => {});
      }, 60 * 60 * 1000);

      // Listen for new SW waiting
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available — show update banner
            setUpdateAvailable(true);
          }
        });
      });

      // Handle controller change (after skipWaiting)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } catch (err) {
      console.error('[PWA] SW registration failed:', err);
    }
  }, []);

  useEffect(() => {
    registerSW();
  }, [registerSW]);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-slate-900 shadow-2xl shadow-indigo-500/30 border border-indigo-400/20">
        <RefreshCw size={16} className="animate-spin-slow flex-shrink-0" />
        <span className="text-sm font-medium">New version available</span>
        <button
          onClick={handleUpdate}
          className="px-3 py-1 rounded-lg bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors"
        >
          Update
        </button>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
