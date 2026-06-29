'use client';

import { useEffect } from 'react';

/**
 * Silently starts the device tracking agent on app load.
 * Lazy-loaded so it never blocks the critical path.
 */
export default function DeviceTrackerInitializer() {
  useEffect(() => {
    // Delay startup so it doesn't compete with critical resources
    const t = window.setTimeout(async () => {
      try {
        const { deviceTracker } = await import('@/services/deviceTrackingService');
        deviceTracker.start();
      } catch {
        // fail silently
      }
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return null;
}
