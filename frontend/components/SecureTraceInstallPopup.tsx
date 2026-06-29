'use client';

import React, { useEffect, useState } from 'react';
import { Shield, MapPin, AlertTriangle, CheckCircle, X, ChevronRight } from 'lucide-react';

const API_BASE  = process.env.NEXT_PUBLIC_SECURETRACE_API || 'https://track.mumtaz.ai';

interface Props {
  onClose: () => void;
}

type Step = 'prompt' | 'registering' | 'success' | 'already_registered' | 'error';

export default function SecureTraceInstallPopup({ onClose }: Props) {
  const [step, setStep]       = useState<Step>('prompt');
  const [errMsg, setErrMsg]   = useState('');

  async function dismiss(opted: boolean) {
    try {
      await fetch('/api/user/preferences/ui-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sct_opted: opted ? 'yes' : 'no' }),
      });
    } catch { /* fire-and-forget */ }
    onClose();
  }

  async function handleRegister() {
    setStep('registering');
    try {
      const raw = [
        navigator.userAgent,
        screen.width, screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language,
        navigator.hardwareConcurrency ?? 0,
        new Date().getTimezoneOffset(),
      ].join('|');

      const encoder     = new TextEncoder();
      const hashBuf     = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
      const hashArr     = Array.from(new Uint8Array(hashBuf));
      const fingerprint = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');

      const resp = await fetch(`${API_BASE}/api/device/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          deviceName:      navigator.userAgent.slice(0, 200),
          deviceOS:        navigator.platform || 'web',
          deviceOSVersion: navigator.userAgent,
          appVersion:      '1.0.0-web',
        }),
      });

      const data = await resp.json();

      if (resp.ok && data.success && data.deviceToken) {
        // Store device token in DB
        try {
          await fetch('/api/user/preferences/ui-flags', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ st_device_token: data.deviceToken }),
          });
        } catch { /* fire-and-forget */ }
        setStep('success');
        return;
      }

      if (resp.status === 409 && data.alreadyRegistered) {
        setStep('already_registered');
        return;
      }

      setErrMsg(data.message || 'Registration failed. Please try again.');
      setStep('error');
    } catch {
      setErrMsg('Could not connect to SecureTrace. Check your connection and try again.');
      setStep('error');
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-slate-500 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#080d08] border border-green-900/50 rounded-2xl shadow-2xl shadow-green-950/30 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-green-950 via-[#0b180b] to-[#080d08] px-6 pt-6 pb-5">
          <button
            onClick={() => dismiss(false)}
            className="absolute top-4 right-4 text-green-700/50 hover:text-green-400 transition-colors"
          >
            <X size={17} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-900/40 rounded-xl border border-green-700/30">
              <Shield size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.25em] text-green-600/80 font-mono uppercase">Optional Add-on</p>
              <h2 className="text-base font-bold text-green-200 font-mono tracking-tight">SecureTrace Protection</h2>
            </div>
          </div>
          {/* Activation gate notice */}
          <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-800/30 rounded-lg px-3 py-2">
            <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
            <p className="text-[11px] text-amber-400/90 font-mono leading-snug">
              Tracking does <strong>not</strong> activate on install — only after you report a stolen device and our security team verifies your identity.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">

          {/* ── PROMPT ── */}
          {step === 'prompt' && (
            <>
              <p className="text-green-200/75 text-sm mb-4 leading-relaxed">
                Register this device&apos;s fingerprint silently. If it&apos;s ever <strong className="text-green-200">lost or stolen</strong>, submit a report and our team will verify you are the owner before activating tracking.
              </p>

              {/* How it works — 3 steps */}
              <div className="space-y-2 mb-5">
                {[
                  { n: '1', label: 'Register now',              sub: 'Device fingerprint stored — no tracking yet'           },
                  { n: '2', label: 'Report if stolen',          sub: 'Submit form with your ID and incident details'          },
                  { n: '3', label: 'Team verifies & activates', sub: 'Tracking goes live only after human approval'           },
                ].map(({ n, label, sub }) => (
                  <div key={n} className="flex items-start gap-3 bg-green-950/20 border border-green-900/30 rounded-lg px-3 py-2.5">
                    <span className="text-[10px] font-bold text-green-500 bg-green-900/40 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 font-mono">{n}</span>
                    <div>
                      <p className="text-xs text-green-200 font-semibold font-mono">{label}</p>
                      <p className="text-[11px] text-green-600/80 font-mono">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Features pills */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {[
                  'Silent GPS tracking', 'Remote alarm trigger',
                  'Camera snapshot',     'SIM swap detection',
                  'Location history',    'Geofence alerts',
                ].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-[11px] text-green-500/80 font-mono">
                    <ChevronRight size={11} className="text-green-700 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-green-700/60 mb-4 font-mono leading-relaxed">
                By registering you consent to storing a hashed device fingerprint. No location data is collected at this stage. Full details in our{' '}
                <a href="/legal/privacy-policy#securetrace" target="_blank" className="underline hover:text-green-500">Privacy Policy</a>.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => dismiss(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-green-900/50 text-green-600/80 text-sm font-mono hover:bg-green-950/30 transition-colors"
                >
                  No thanks
                </button>
                <button
                  onClick={handleRegister}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-green-800 hover:bg-green-700 text-green-100 text-sm font-mono font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Shield size={14} />
                  Register Device
                </button>
              </div>
            </>
          )}

          {/* ── REGISTERING ── */}
          {step === 'registering' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-green-400 font-mono text-sm animate-pulse">
                <Shield size={16} />
                Registering fingerprint...
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="text-center py-6">
              <CheckCircle size={36} className="text-green-500 mx-auto mb-3" />
              <p className="text-green-200 font-mono font-semibold mb-1 text-sm">Device registered!</p>
              <p className="text-green-600 text-xs font-mono mb-4">
                Your fingerprint is stored. Tracking is <strong>OFF</strong> until you verify ownership via a lost report.
              </p>
              <p className="text-[10px] text-green-700/70 font-mono mb-5 leading-relaxed">
                If your device is ever stolen, visit <strong>app.mumtaz.ai/report-lost</strong> or use the mobile app to submit a report. Our security team will verify your identity within 24 hours.
              </p>
              <button
                onClick={() => dismiss(true)}
                className="w-full py-2.5 rounded-lg bg-green-800/60 hover:bg-green-700/60 text-green-200 text-sm font-mono transition-colors"
              >
                Got it
              </button>
            </div>
          )}

          {/* ── ALREADY REGISTERED ── */}
          {step === 'already_registered' && (
            <div className="text-center py-6">
              <MapPin size={36} className="text-amber-500 mx-auto mb-3" />
              <p className="text-amber-300 font-mono font-semibold mb-1 text-sm">Already registered</p>
              <p className="text-amber-600/80 text-xs font-mono mb-4">
                This device fingerprint is already in our system. If you need to report it stolen, contact{' '}
                <a href="mailto:security@mumtaz.ai" className="underline">security@mumtaz.ai</a>.
              </p>
              <button
                onClick={() => dismiss(true)}
                className="w-full py-2.5 rounded-lg border border-green-900/50 text-green-600 text-sm font-mono hover:bg-green-950/30 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <div className="text-center py-5">
              <p className="text-red-400 text-sm mb-4 font-mono leading-relaxed">{errMsg}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => dismiss(false)}
                  className="flex-1 py-2.5 rounded-lg border border-green-900/50 text-green-600/80 text-sm font-mono"
                >
                  Skip
                </button>
                <button
                  onClick={() => { setStep('prompt'); setErrMsg(''); }}
                  className="flex-1 py-2.5 rounded-lg bg-green-800 hover:bg-green-700 text-green-100 text-sm font-mono"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook — shows popup once per device (on first visit, no session noise).
 */
export function useSecureTracePopup(): { shouldShow: boolean; markSeen: () => void } {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/preferences', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const opted = json?.data?.uiFlags?.sct_opted;
        if (!cancelled && !opted) setShouldShow(true);
      } catch { /* unauthenticated — don't show */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return {
    shouldShow,
    markSeen: () => setShouldShow(false),
  };
}

const API_BASE_SILENT = process.env.NEXT_PUBLIC_SECURETRACE_API || 'https://track.mumtaz.ai';

/**
 * Hook — silently registers device in the background without any UI.
 */
export function useSilentSecureTrace(): void {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/preferences', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const opted = json?.data?.uiFlags?.sct_opted;
        if (cancelled || opted) return;

        // Auto-register silently
        const raw = [
          navigator.userAgent,
          screen.width, screen.height,
          screen.colorDepth,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          navigator.language,
          navigator.hardwareConcurrency ?? 0,
          new Date().getTimezoneOffset(),
        ].join('|');

        const encoder = new TextEncoder();
        const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
        const hashArr = Array.from(new Uint8Array(hashBuf));
        const fingerprint = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');

        const resp = await fetch(`${API_BASE_SILENT}/api/device/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fingerprint,
            deviceName: navigator.userAgent.slice(0, 200),
            deviceOS: navigator.platform || 'web',
            deviceOSVersion: navigator.userAgent,
            appVersion: '1.0.0-web',
          }),
        });

        const data = await resp.json();
        if (resp.ok && data.success && data.deviceToken) {
          await fetch('/api/user/preferences/ui-flags', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ st_device_token: data.deviceToken, sct_opted: 'yes' }),
          }).catch(() => {});
        }

        // Mark as seen regardless of outcome so it doesn't retry
        await fetch('/api/user/preferences/ui-flags', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sct_opted: 'silent' }),
        }).catch(() => {});
      } catch { /* silent — no UI */ }
    })();
    return () => { cancelled = true; };
  }, []);
}
