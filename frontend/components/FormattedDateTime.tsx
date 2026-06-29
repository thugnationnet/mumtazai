'use client';

/**
 * ============================================================================
 * FORMATTED DATE/TIME COMPONENTS
 * ============================================================================
 * 
 * Hydration-safe components for rendering formatted dates and times.
 * These components prevent React hydration mismatches by only rendering
 * the formatted value on the client side.
 */

import { useState, useEffect, memo } from 'react';

interface FormattedTimeProps {
  date: Date | string | number | undefined | null;
  options?: Intl.DateTimeFormatOptions;
  placeholder?: string;
  className?: string;
}

interface FormattedDateProps {
  date: Date | string | number | undefined | null;
  options?: Intl.DateTimeFormatOptions;
  placeholder?: string;
  className?: string;
}

interface FormattedDateTimeProps {
  date: Date | string | number | undefined | null;
  options?: Intl.DateTimeFormatOptions;
  placeholder?: string;
  className?: string;
}

/**
 * Hydration-safe time display component.
 * Shows placeholder on server, then the formatted time on client.
 */
export const FormattedTime = memo(function FormattedTime({
  date,
  options = { hour: '2-digit', minute: '2-digit' },
  placeholder = '',
  className,
}: FormattedTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !date) {
    return <span className={className}>{placeholder}</span>;
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const formatted = dateObj.toLocaleTimeString(undefined, options);
    return <span className={className}>{formatted}</span>;
  } catch {
    return <span className={className}>{placeholder}</span>;
  }
});

/**
 * Hydration-safe date display component.
 * Shows placeholder on server, then the formatted date on client.
 */
export const FormattedDate = memo(function FormattedDate({
  date,
  options = { month: 'short', day: 'numeric' },
  placeholder = '',
  className,
}: FormattedDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !date) {
    return <span className={className}>{placeholder}</span>;
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const formatted = dateObj.toLocaleDateString(undefined, options);
    return <span className={className}>{formatted}</span>;
  } catch {
    return <span className={className}>{placeholder}</span>;
  }
});

/**
 * Hydration-safe date and time display component.
 * Shows placeholder on server, then the formatted datetime on client.
 */
export const FormattedDateTime = memo(function FormattedDateTime({
  date,
  options = { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  },
  placeholder = '',
  className,
}: FormattedDateTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !date) {
    return <span className={className}>{placeholder}</span>;
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const formatted = dateObj.toLocaleString(undefined, options);
    return <span className={className}>{formatted}</span>;
  } catch {
    return <span className={className}>{placeholder}</span>;
  }
});

export default FormattedDateTime;
