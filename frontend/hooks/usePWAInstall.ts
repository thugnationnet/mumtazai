'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export interface UsePWAInstallReturn {
  /** Whether the install prompt is available (browser supports A2HS) */
  canInstall: boolean;
  /** Whether the app is already installed (standalone mode) */
  isInstalled: boolean;
  /** Whether this is an iOS device (requires manual instructions) */
  isIOS: boolean;
  /** Show the install prompt */
  promptInstall: () => Promise<boolean>;
  /** Dismiss the install banner */
  dismissBanner: () => void;
  /** Whether the user has dismissed the banner this session */
  isDismissed: boolean;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    // Check if recently dismissed (localStorage first, then DB)
    let cancelled = false;
    const localDismissed = localStorage.getItem(DISMISS_KEY);
    if (localDismissed && Date.now() - parseInt(localDismissed, 10) < DISMISS_DURATION) {
      setIsDismissed(true);
    } else {
      (async () => {
        try {
          const res = await fetch('/api/user/preferences', { credentials: 'include' });
          if (!res.ok || cancelled) return;
          const json = await res.json();
          const dismissedAt = json?.data?.uiFlags?.pwa_install_dismissed;
          if (!cancelled && dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION) {
            setIsDismissed(true);
            localStorage.setItem(DISMISS_KEY, dismissedAt);
          }
        } catch { /* unauthenticated — use localStorage only */ }
      })();
    }

    // Listen for install prompt (Chrome/Edge/Samsung)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (e) {
      console.error('[PWA] Install prompt error:', e);
    }
    return false;
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    const now = String(Date.now());
    localStorage.setItem(DISMISS_KEY, now);
    fetch('/api/user/preferences/ui-flags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ pwa_install_dismissed: now }),
    }).catch(() => {});
  }, []);

  return {
    canInstall: canInstall || (isIOS && !isInstalled),
    isInstalled,
    isIOS,
    promptInstall,
    dismissBanner,
    isDismissed,
  };
}
