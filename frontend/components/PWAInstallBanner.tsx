'use client';

import { usePWAInstall } from '@/hooks/usePWAInstall';
import { X, Download, Share, Plus } from 'lucide-react';
import { useState } from 'react';

/**
 * PWA Install Banner — appears at bottom of screen on mobile/desktop.
 * On Android/Chrome: shows native "Add to Home Screen" prompt.
 * On iOS Safari: shows manual instructions (Share → Add to Home Screen).
 */
export default function PWAInstallBanner() {
  const { canInstall, isInstalled, isIOS, promptInstall, dismissBanner, isDismissed } =
    usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [shownThisSession] = useState(() => {
    if (typeof window === 'undefined') return false;
    const already = sessionStorage.getItem('pwa-banner-shown');
    if (already) return true;
    sessionStorage.setItem('pwa-banner-shown', '1');
    return false;
  });

  // Don't render if installed, dismissed, not installable, or already shown this session
  if (isInstalled || isDismissed || !canInstall || shownThisSession) return null;

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      await promptInstall();
    }
  };

  return (
    <>
      {/* Main Install Banner */}
      <div className="fixed bottom-0 inset-x-0 z-[9999] safe-area-pb animate-in slide-in-from-bottom duration-500">
        <div className="mx-auto max-w-lg px-4 pb-4">
          <div className="relative rounded-2xl neu-cta p-4">
            {/* Dismiss button */}
            <button
              onClick={dismissBanner}
              className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Dismiss install banner"
            >
              <X size={16} className="text-slate-900" />
            </button>

            <div className="flex items-center gap-3">
              {/* App icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-200 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <img
                  src="/icon-192x192.png"
                  alt="Mumtaz AI"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 font-semibold text-sm leading-tight">
                  Install Mumtaz AI
                </h3>
                <p className="text-indigo-200 text-xs mt-0.5 leading-snug">
                  {isIOS
                    ? 'Add to your Home Screen for the best experience'
                    : 'Get quick access, offline support & push notifications'}
                </p>
              </div>

              {/* Install button */}
              <button
                onClick={handleInstall}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
              >
                {isIOS ? (
                  <span className="flex items-center gap-1.5">
                    <Plus size={14} />
                    Add
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Download size={14} />
                    Install
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-slate-400 backdrop-blur-sm"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md mx-auto p-6 shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Install Mumtaz AI
              </h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Tap the Share button
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Look for{' '}
                    <Share size={12} className="inline text-blue-500" />{' '}
                    at the bottom of Safari
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Scroll down and tap &quot;Add to Home Screen&quot;
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Look for{' '}
                    <Plus size={12} className="inline text-gray-500" />{' '}
                    Add to Home Screen
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Tap &quot;Add&quot; to confirm
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    The app will appear on your Home Screen
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSInstructions(false);
                dismissBanner();
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 text-slate-900 font-semibold text-sm hover:bg-indigo-500 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
