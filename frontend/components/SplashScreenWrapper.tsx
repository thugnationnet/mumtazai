'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLoading } from '@/lib/loading-context';
import SplashScreen from '@/components/SplashScreen';

export default function SplashScreenWrapper() {
  const { isLoading } = useLoading();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Simple client-side check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only show splash on homepage and only on client
  const shouldShow = isClient && pathname === '/' && isLoading;

  if (!shouldShow) {
    return null;
  }

  return <SplashScreen isLoading={isLoading} />;
}
