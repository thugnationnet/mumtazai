'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ErrorPage from '@/components/ErrorPage';
import { notFound } from 'next/navigation';

const errorConfigs: Record<string, {
  code: number;
  title: string;
  description: string;
  icon: string;
  suggestion?: string;
  heroColor: 'brand' | 'red' | 'amber' | 'purple' | 'orange';
  showRetryButton?: boolean;
  showContactButton?: boolean;
}> = {
  '401': {
    code: 401,
    title: 'Authentication Required',
    description: 'You need to sign in to access this page. Your session may have expired.',
    icon: '🔑',
    suggestion: 'Please sign in to continue.',
    heroColor: 'brand',
  },
  '403': {
    code: 403,
    title: 'Access Denied',
    description: "You don't have permission to access this page. This area may require special authorization.",
    icon: '🚫',
    suggestion: 'If you believe this is a mistake, contact your administrator.',
    heroColor: 'red',
    showContactButton: true,
  },
  '408': {
    code: 408,
    title: 'Request Timeout',
    description: 'The server took too long to respond. This could be due to a slow connection or heavy load.',
    icon: '⏳',
    suggestion: 'Check your internet connection and try again.',
    heroColor: 'amber',
    showRetryButton: true,
  },
  '423': {
    code: 423,
    title: 'Account Locked',
    description: 'This account has been temporarily locked due to multiple failed login attempts.',
    icon: '🔒',
    suggestion: 'Wait for the lockout period to expire, or contact support if you need immediate access.',
    heroColor: 'orange',
    showContactButton: true,
  },
  '429': {
    code: 429,
    title: 'Too Many Requests',
    description: "You've sent too many requests in a short period. Please slow down and try again shortly.",
    icon: '⏱️',
    suggestion: 'Our rate limits help keep the service fast for everyone.',
    heroColor: 'amber',
    showRetryButton: true,
  },
  '500': {
    code: 500,
    title: 'Server Error',
    description: 'Something went wrong on our end. Our team has been notified and is working on a fix.',
    icon: '⚡',
    suggestion: 'This is usually temporary. Please try again in a moment.',
    heroColor: 'red',
    showRetryButton: true,
    showContactButton: true,
  },
  '502': {
    code: 502,
    title: 'Bad Gateway',
    description: 'Our servers received an invalid response. This is usually a temporary issue.',
    icon: '🌐',
    suggestion: 'Try refreshing the page in a few seconds.',
    heroColor: 'purple',
    showRetryButton: true,
  },
  '503': {
    code: 503,
    title: 'Service Unavailable',
    description: "We're performing maintenance or experiencing high traffic. The service will be back shortly.",
    icon: '🔧',
    suggestion: "We're working on getting things back to normal as quickly as possible.",
    heroColor: 'purple',
    showRetryButton: true,
    showContactButton: true,
  },
};

export default function ErrorCodePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;

  const config = errorConfigs[code];

  if (!config) {
    notFound();
  }

  // Support custom messages via query params
  const customMessage = searchParams.get('message');
  const retryAfter = searchParams.get('retry');

  return (
    <ErrorPage
      code={config.code}
      title={config.title}
      description={customMessage || config.description}
      icon={config.icon}
      suggestion={config.suggestion}
      retryAfter={retryAfter || undefined}
      heroColor={config.heroColor}
      showHomeButton={true}
      showBackButton={true}
      showRetryButton={config.showRetryButton ?? false}
      showContactButton={config.showContactButton ?? false}
    />
  );
}
