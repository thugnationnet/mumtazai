'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center neu-page-bg px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Offline icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-indigo-500/30 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-1.414-7.072m-2.829 7.072L3 21m0 0l2.829-2.829M3 21l-1-1m12.728-12.728L21 3m0 0l-2.829 2.829M21 3l-1 1M8.464 15.536L3 21"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            You&apos;re Offline
          </h1>
          <p className="text-slate-600 text-lg">
            It looks like you&apos;ve lost your internet connection. Don&apos;t
            worry — your data is safe.
          </p>
        </div>

        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6 space-y-4">
          <h2 className="font-semibold text-indigo-300">While you wait:</h2>
          <ul className="text-sm text-slate-600 space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              <span>Previously viewed pages are cached and may still load</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              <span>Messages will be queued and sent when you reconnect</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              <span>Check your Wi-Fi or cellular data settings</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium shadow-lg shadow-indigo-500/25"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>

        <p className="text-xs text-slate-600">
          Mumtaz AI • Progressive Web App
        </p>
      </div>
    </div>
  );
}
