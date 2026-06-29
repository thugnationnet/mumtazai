'use client';

/**
 * ============================================================================
 * HYDRATION-SAFE UTILITIES
 * ============================================================================
 * 
 * Utilities to prevent React hydration mismatches when rendering 
 * content that differs between server and client (dates, locale-specific
 * formatting, random values, etc.)
 */

import { useState, useEffect } from 'react';

/**
 * Hook that returns whether the component has mounted on the client.
 * Use this to conditionally render content that would cause hydration mismatches.
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  return hasMounted;
}

/**
 * Hook for hydration-safe date formatting.
 * Returns a placeholder on server/initial render, then the formatted date on client.
 * 
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @param placeholder - What to show during SSR (default: empty string)
 */
export function useFormattedDate(
  date: Date | string | number | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  placeholder: string = ''
): string {
  const hasMounted = useHasMounted();
  
  if (!hasMounted || !date) {
    return placeholder;
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(undefined, options);
  } catch {
    return placeholder;
  }
}

/**
 * Hook for hydration-safe time formatting.
 * Returns a placeholder on server/initial render, then the formatted time on client.
 */
export function useFormattedTime(
  date: Date | string | number | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  placeholder: string = ''
): string {
  const hasMounted = useHasMounted();
  
  if (!hasMounted || !date) {
    return placeholder;
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString(undefined, options);
  } catch {
    return placeholder;
  }
}

/**
 * Hook for hydration-safe datetime formatting.
 * Returns a placeholder on server/initial render, then the formatted datetime on client.
 */
export function useFormattedDateTime(
  date: Date | string | number | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  placeholder: string = ''
): string {
  const hasMounted = useHasMounted();
  
  if (!hasMounted || !date) {
    return placeholder;
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleString(undefined, options);
  } catch {
    return placeholder;
  }
}

/**
 * Component wrapper for hydration-safe rendering.
 * Only renders children on the client after hydration is complete.
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}): React.ReactNode {
  const hasMounted = useHasMounted();
  
  if (!hasMounted) {
    return fallback;
  }
  
  return children;
}
