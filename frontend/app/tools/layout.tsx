'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';

/**
 * Tools Layout - Protects all individual tool pages with subscription check
 *
 * This layout wraps all pages under /tools/* EXCEPT:
 * - /tools (listing page - has its own card locking)
 */

// Listing pages that should NOT be protected (they show locked cards instead)
const LISTING_PAGES = ['/tools'];

export default function ToolsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Listing pages show locked cards, don't need full-page protection
  if (LISTING_PAGES.includes(pathname)) {
    return <>{children}</>;
  }

  // All individual tool pages require subscription
  return (
    <SubscriptionGuard message="Access to Network Tools and Developer Utilities requires an active subscription.">
      {children}
    </SubscriptionGuard>
  );
}
