'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface CloudflareTurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  appearance?: 'always' | 'execute' | 'interaction-only';
  className?: string;
}

const SITE_KEY = '0x4AAAAAACzhUCkQSyr2oR-V';

let scriptLoaded = false;
let scriptLoading = false;
const pendingCallbacks: (() => void)[] = [];

function loadTurnstileScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve) => {
      pendingCallbacks.push(resolve);
    });
  }
  scriptLoading = true;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;
    window.onTurnstileLoad = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      pendingCallbacks.forEach((cb) => cb());
      pendingCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

export default function CloudflareTurnstile({
  onVerify,
  onExpire,
  onError,
  theme = 'dark',
  size = 'flexible',
  appearance = 'interaction-only',
  className = '',
}: CloudflareTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  useEffect(() => {
    let mounted = true;

    loadTurnstileScript().then(() => {
      if (!mounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme,
        size,
        appearance,
        callback: (token: string) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        'error-callback': () => onErrorRef.current?.(),
      });
    });

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [theme, size, appearance]);

  return <div ref={containerRef} className={className} />;
}

export function useTurnstile() {
  const tokenRef = useRef<string | null>(null);

  const onVerify = useCallback((token: string) => {
    tokenRef.current = token;
  }, []);

  const onExpire = useCallback(() => {
    tokenRef.current = null;
  }, []);

  const getToken = useCallback(() => tokenRef.current, []);

  const resetToken = useCallback(() => {
    tokenRef.current = null;
  }, []);

  return { onVerify, onExpire, getToken, resetToken };
}
