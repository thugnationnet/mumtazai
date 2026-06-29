'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Convert a base64-encoded VAPID public key to a Uint8Array for pushManager.subscribe()
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UsePushNotificationsReturn {
  /** Whether push is supported by this browser */
  isSupported: boolean;
  /** Current permission state */
  permission: PushPermissionState;
  /** Whether the user is currently subscribed */
  isSubscribed: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Error message, if any */
  error: string | null;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<PushSubscription | null>(null);

  // Check support and current state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setIsSupported(supported);

    if (!supported) {
      setPermission('unsupported');
      return;
    }

    // Read current permission
    setPermission(Notification.permission as PushPermissionState);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        if (sub) {
          subscriptionRef.current = sub;
          setIsSubscribed(true);
        }
      });
    });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermissionState);

      if (perm !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // 2. Get VAPID public key
      const keyResponse = await fetch('/api/push/vapid-public-key');
      const keyData = await keyResponse.json();

      if (!keyData.success || !keyData.publicKey) {
        setError('Push notifications not configured on server');
        setIsLoading(false);
        return false;
      }

      // 3. Subscribe via Push API
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      // 4. Send subscription to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!response.ok) {
        throw new Error('Failed to register subscription on server');
      }

      subscriptionRef.current = subscription;
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Subscription failed';
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const sub = subscriptionRef.current;
      if (sub) {
        // Inform backend
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });

        // Unsubscribe from push manager
        await sub.unsubscribe();
      }

      subscriptionRef.current = null;
      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unsubscribe failed';
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    error,
  };
}
