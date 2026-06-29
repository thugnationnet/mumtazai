'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Cookie, Shield, X, Settings } from 'lucide-react';

/* ───────────────────────────────────────────────────────────────
   Cookie categories — matches what's listed in the Cookie Policy
   ─────────────────────────────────────────────────────────────── */
interface CookiePreferences {
  necessary: boolean;   // Always true — session, auth, CSRF
  analytics: boolean;   // visitorId, sessionId tracking
  functional: boolean;  // theme_preference, language, agent_preferences, voice_settings
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  functional: false,
};

const ACCEPT_ALL: CookiePreferences = {
  necessary: true,
  analytics: true,
  functional: true,
};

/* ───────────────────────────────────────────────────────────────
   Persistence helpers — client-side cookie + API backup
   Cookie ensures consent persists across refreshes.
   ─────────────────────────────────────────────────────────────── */
const CONSENT_COOKIE = 'cookie_consent';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.mumtaz.ai';

function setClientCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  // Use .mumtaz.ai domain in production so all subdomains can read it
  const isProduction = typeof window !== 'undefined' &&
    window.location.hostname.includes('mumtaz.ai');
  const domainPart = isProduction ? '; domain=.mumtaz.ai' : '';
  const securePart = isProduction ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${domainPart}; SameSite=Lax${securePart}`;
}

function getClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function parseConsentValue(val: string | null): CookiePreferences | null {
  if (!val) return null;
  try {
    const obj = JSON.parse(val);
    if (typeof obj === 'object' && obj !== null && 'necessary' in obj) return obj;
  } catch {
    // Legacy string format
  }
  if (val === 'accepted') return ACCEPT_ALL;
  return null;
}

async function saveConsent(prefs: CookiePreferences): Promise<void> {
  const value = JSON.stringify(prefs);

  // 1. Client-side cookie (365 days) — immediate, no network needed
  setClientCookie(CONSENT_COOKIE, value, 365);

  // 2. API backup (fire-and-forget) — sets httpOnly cookie server-side
  try {
    fetch(`${API_BASE}/api/cookie-consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ consent: prefs }),
    }).catch(() => {});
  } catch { /* silently fail */ }
}

function loadConsent(): CookiePreferences | null {
  // 1. Check client cookie (fastest, no async)
  const cookieVal = getClientCookie(CONSENT_COOKIE);
  const fromCookie = parseConsentValue(cookieVal);
  if (fromCookie) return fromCookie;

  return null;
}

/* ───────────────────────────────────────────────────────────────
   Preference toggle row
   ─────────────────────────────────────────────────────────────── */
function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${checked ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-slate-300'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0
          transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

interface CategoryRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}

function CategoryRow({ label, description, checked, disabled, onChange }: CategoryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Toggle checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Main component
   ─────────────────────────────────────────────────────────────── */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);

  // Check existing consent on mount (synchronous — reads cookie/localStorage)
  useEffect(() => {
    const existing = loadConsent();
    if (existing) {
      // Already consented — don't show the panel
      setPrefs(existing);
      setVisible(false);
    } else {
      // No consent yet — show panel after 2 seconds
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for "open-cookie-preferences" events (from cookie policy page)
  useEffect(() => {
    const handler = () => {
      setVisible(true);
    };
    window.addEventListener('open-cookie-preferences', handler);
    return () => window.removeEventListener('open-cookie-preferences', handler);
  }, []);

  const handleSave = useCallback(async (overridePrefs?: CookiePreferences) => {
    const toSave = overridePrefs || prefs;
    setSaving(true);
    await saveConsent(toSave);
    setPrefs(toSave);
    setSaving(false);
    setVisible(false);
  }, [prefs]);

  const acceptAll = useCallback(() => handleSave(ACCEPT_ALL), [handleSave]);
  const rejectOptional = useCallback(() => handleSave({ necessary: true, analytics: false, functional: false }), [handleSave]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-200 backdrop-blur-[2px] z-[9998] transition-opacity duration-500 animate-fade-in"
        onClick={rejectOptional}
        aria-hidden
      />

      {/* Right-side sliding panel */}
      <div
        role="dialog"
        aria-label="Cookie consent"
        aria-modal="true"
        className="fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-[420px] animate-slide-in-right"
        style={{
          animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div className="h-full flex flex-col bg-white shadow-2xl border-l border-white/80 overflow-hidden">
          {/* Gradient accent bar — top */}
          <div className="h-1 shrink-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

          {/* Header */}
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-white/80">
            <div className="flex items-start gap-3">
              <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <Cookie className="w-5 h-5 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-800 leading-tight">
                  We value your privacy
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Cookie Preferences
                </p>
              </div>

              {/* Close btn */}
              <button
                onClick={rejectOptional}
                className="shrink-0 p-2 -mt-1 -mr-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close and reject optional cookies"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <p className="text-sm text-slate-500 leading-relaxed">
              We use cookies to keep you signed in, remember your preferences, and improve our platform.
              You can choose which types of cookies you&apos;d like to allow.{' '}
              <Link
                href="/legal/cookie-policy"
                className="text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2 decoration-blue-200 hover:decoration-blue-400 transition-colors"
              >
                Read our Cookie Policy
              </Link>
            </p>

            {/* Cookie categories — always visible in panel */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-700">Cookie Categories</h3>
              </div>

              <div className="divide-y divide-slate-100">
                <CategoryRow
                  label="Strictly Necessary"
                  description="Essential for sign-in, security, and core functionality. These cannot be disabled."
                  checked={true}
                  disabled
                  onChange={() => {}}
                />
                <CategoryRow
                  label="Analytics"
                  description="Help us understand how visitors use our site so we can improve the experience."
                  checked={prefs.analytics}
                  onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
                />
                <CategoryRow
                  label="Functional"
                  description="Remember your theme, language, favorite agents, and voice settings across sessions."
                  checked={prefs.functional}
                  onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
                />
              </div>
            </div>

            {/* Compliance line */}
            <p className="text-[10px] text-slate-400 mt-6 leading-snug">
              Compliant with GDPR, CCPA/CPRA, ePrivacy Directive, PDPA (Thailand &amp; Singapore) &amp; UAE PDPL.
              Strictly necessary cookies are always active.
            </p>
          </div>

          {/* Sticky action buttons at bottom */}
          <div className="shrink-0 px-6 py-4 border-t border-white/80 bg-slate-50/80 backdrop-blur-sm">
            <div className="flex flex-col gap-2.5">
              {/* Accept all — primary */}
              <button
                onClick={acceptAll}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-900 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-xl shadow-medium hover:shadow-large focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.01]"
              >
                <Shield className="w-4 h-4" />
                {saving ? 'Saving…' : 'Accept All Cookies'}
              </button>

              <div className="flex gap-2">
                {/* Save selected */}
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-blue-600 bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-300 rounded-xl shadow-soft hover:shadow-medium transition-all duration-200"
                >
                  Save Preferences
                </button>

                {/* Reject optional */}
                <button
                  onClick={rejectOptional}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-500 bg-white hover:bg-slate-50 border-2 border-white/80 hover:border-white/60 rounded-xl shadow-soft hover:shadow-medium transition-all duration-200"
                >
                  Reject Optional
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-in animation keyframes */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0.5;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

/* ───────────────────────────────────────────────────────────────
   Exported helper — lets cookie-policy page open the banner
   ─────────────────────────────────────────────────────────────── */
export function openCookiePreferences() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
  }
}
