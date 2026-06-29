'use client';

import React from 'react';
import ErrorPage from '@/components/ErrorPage';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      code={500}
      title="Something Went Wrong"
      description="An unexpected error occurred. Our team has been notified and is working on a fix."
      icon="⚡"
      suggestion={error.digest ? `Error reference: ${error.digest}` : 'Please try again in a moment.'}
      heroColor="red"
      showHomeButton={true}
      showBackButton={true}
      showRetryButton={true}
      showContactButton={true}
    />
  );
}
