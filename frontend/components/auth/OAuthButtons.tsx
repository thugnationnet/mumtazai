'use client';

/**
 * OAuth login/signup buttons for Google, GitHub, Yahoo, and Microsoft.
 * Renders as full-page redirect links to /api/auth/{provider}.
 */
export default function OAuthButtons({ redirect }: { redirect?: string }) {
  const buildUrl = (provider: string) =>
    redirect
      ? `/api/auth/${provider}?redirect=${encodeURIComponent(redirect)}`
      : `/api/auth/${provider}`;

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="relative flex items-center my-1">
        <div className="flex-grow border-t border-white/80" />
        <span className="mx-3 text-xs text-slate-400 font-medium">or continue with</span>
        <div className="flex-grow border-t border-white/80" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Google */}
        <a
          href={buildUrl('google')}
          className="flex items-center justify-center gap-2 px-3 py-2.5 border border-white/80 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-slate-600 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </a>

        {/* GitHub */}
        <a
          href={buildUrl('github')}
          className="flex items-center justify-center gap-2 px-3 py-2.5 border border-white/80 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-slate-600 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </a>

        {/* Microsoft */}
        <a
          href={buildUrl('microsoft')}
          className="flex items-center justify-center gap-2 px-3 py-2.5 border border-white/80 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-slate-600 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <rect x="1" y="1" width="10" height="10" fill="#F25022" />
            <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
            <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
            <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
          </svg>
          Microsoft
        </a>

        {/* Yahoo */}
        <a
          href={buildUrl('yahoo')}
          className="flex items-center justify-center gap-2 px-3 py-2.5 border border-white/80 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-slate-600 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M0 3.5h4.83l3.1 7.5 3.2-7.5H16L10 16.2V22H7.05v-5.8L0 3.5z" fill="#6001D2" />
            <path d="M14 3.5h4.2L24 16.2V22h-2.95v-5.8L18 10.5l-1.85-4.5L14 3.5z" fill="#6001D2" />
            <circle cx="21" cy="5" r="2.5" fill="#6001D2" />
          </svg>
          Yahoo
        </a>
      </div>
    </div>
  );
}
