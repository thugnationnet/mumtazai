import type { Metadata } from 'next';
import Header from '@/components/Header';
import ConditionalFooter from '@/components/ConditionalFooter';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import RSCErrorBoundary from '@/components/RSCErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { GlobalThemeProvider } from '@/contexts/GlobalThemeContext';
import { LoadingProvider } from '@/lib/loading-context';
import SplashScreenWrapper from '@/components/SplashScreenWrapper';
import PerformanceInitializer from './components/PerformanceInitializer';
import DeviceTrackerInitializer from './components/DeviceTrackerInitializer';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import GlassBackground from '@/components/GlassBackground';
import '@/styles/globals.css';
// Syntax highlighting theme for code blocks
import 'highlight.js/styles/github-dark.css';

const GTM_ID = 'GTM-PLHRXKQZ';

// Metadata for SEO and browser tabs
export const metadata: Metadata = {
  title: 'Mumtaz AI - Your AI Dream Team',
  description:
    "Transform your workflow with 18 specialized AI personalities. From Einstein's genius to Shakespeare's creativity - unlock the power of history's greatest minds.",
  keywords: [
    'AI',
    'artificial intelligence',
    'AI agents',
    'chatbot',
    'Einstein AI',
    'AI personalities',
    'machine learning',
  ],
  authors: [{ name: 'Mumtaz AI' }],
  creator: 'Mumtaz AI',
  publisher: 'Mumtaz AI',
  metadataBase: new URL('https://mumtaz.ai'),
  alternates: {
    canonical: 'https://mumtaz.ai',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mumtaz.ai',
    title: 'Mumtaz AI - Your AI Dream Team',
    description:
      "Transform your workflow with 18 specialized AI personalities. From Einstein's genius to Shakespeare's creativity.",
    siteName: 'Mumtaz AI',
    images: [
      {
        url: '/images/logos/company-logo.png',
        width: 1200,
        height: 630,
        alt: 'Mumtaz AI - AI Dream Team',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mumtazai',
    creator: '@mumtazai',
    title: 'Mumtaz AI - Your AI Dream Team',
    description:
      'Transform your workflow with 18 specialized AI personalities.',
    images: ['/images/logos/company-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      {
        url: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcut: [{ url: '/favicon.ico' }],
  },
  manifest: '/site.webmanifest',
};

// Fix #1: Root Layout with proper structure and spacing
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth overflow-x-hidden">
      <head>
        {/* iOS PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mumtaz AI" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        {/* PWA theme color */}
        <meta name="theme-color" content="#6366f1" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        {/* Google Tag Manager - must be raw script for SSR */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {/* Console Error Filter - Suppress RSC 503 errors in production only */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                'use strict';
                // Log RSC 503 errors with reduced noise instead of suppressing completely
                if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
                  const originalError = console.error;
                  const rscPattern = /GET.*\\?_rsc=.*503|_rsc=.*503|Service Unavailable.*_rsc|Failed to fetch.*_rsc/;
                  let rscErrorCount = 0;
                  console.error = function(...args) {
                    const message = args.join(' ');
                    if (rscPattern.test(message)) {
                      rscErrorCount++;
                      // Log first occurrence and every 10th after to avoid spam but preserve visibility
                      if (rscErrorCount === 1 || rscErrorCount % 10 === 0) {
                        originalError.call(console, '[RSC] Backend 503 error #' + rscErrorCount);
                      }
                    } else {
                      originalError.apply(console, args);
                    }
                  };
                }
              })();
            `,
          }}
        />
        <PerformanceInitializer />
        <DeviceTrackerInitializer />
        <LoadingProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <GlobalThemeProvider>
                <RSCErrorBoundary>
                  {/* Global Splash Screen - Temporarily disabled */}
                  {/* <SplashScreenWrapper /> */}

                  {/* Crystal Flow Glass Background */}
                  <GlassBackground />

                  {/* Global Navigation - Fix #2: Consistent Navigation */}
                  <Header />

                  {/* Main Content Area - Fix #1: Proper Layout System */}
                  <main className="flex-1">{children}</main>

                  {/* Conditional Footer - Hidden on agent pages */}
                  <ConditionalFooter />

                  {/* Cookie Consent Banner - Global */}
                  <CookieConsentBanner />

                  {/* PWA: Service Worker Registration + Update Banner */}
                  <ServiceWorkerRegistration />

                  {/* PWA: Install Banner (Add to Home Screen) */}
                  <PWAInstallBanner />
                </RSCErrorBoundary>
              </GlobalThemeProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
