/**
 * CANVAS STUDIO - DEPLOY CREDENTIALS PANEL
 * Manages user's deploy platform tokens (Vercel, Netlify, Railway, Cloudflare, GitHub)
 * Tokens are encrypted server-side with AES-256-GCM — never stored in the browser.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { fetchWithCredentials } from '../fetchUtil';
import { PreviewContent } from './PanelPreview';

// ============================================================================
// TYPES
// ============================================================================

interface Credential {
  id: string;
  provider: string;
  label: string | null;
  username: string | null;
  isValid: boolean;
  extras: Record<string, string> | null;
  lastValidatedAt: string | null;
  createdAt: string;
}

interface ProviderInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  tokenLabel: string;
  tokenHelpUrl: string;
  hasExtras?: boolean;
  extrasLabel?: string;
  extrasPlaceholder?: string;
}

interface CredentialsPanelProps {
  onClose?: () => void;
  onPreviewContent?: (content: PreviewContent) => void;
}

// ============================================================================
// PROVIDER CONFIG
// ============================================================================

const PROVIDERS: ProviderInfo[] = [
  {
    id: 'VERCEL',
    name: 'Vercel',
    icon: '▲',
    color: 'from-gray-700 to-black',
    tokenLabel: 'Vercel API Token',
    tokenHelpUrl: 'https://vercel.com/account/tokens',
  },
  {
    id: 'NETLIFY',
    name: 'Netlify',
    icon: '◆',
    color: 'from-teal-600 to-teal-800',
    tokenLabel: 'Netlify Personal Access Token',
    tokenHelpUrl: 'https://app.netlify.com/user/applications#personal-access-tokens',
  },
  {
    id: 'RAILWAY',
    name: 'Railway',
    icon: '🚂',
    color: 'from-purple-600 to-purple-800',
    tokenLabel: 'Railway API Token',
    tokenHelpUrl: 'https://railway.app/account/tokens',
  },
  {
    id: 'CLOUDFLARE',
    name: 'Cloudflare Pages',
    icon: '☁️',
    color: 'from-orange-500 to-orange-700',
    tokenLabel: 'Cloudflare API Token',
    tokenHelpUrl: 'https://dash.cloudflare.com/profile/api-tokens',
    hasExtras: true,
    extrasLabel: 'Account ID',
    extrasPlaceholder: 'Found in Cloudflare dashboard URL',
  },
  {
    id: 'GITHUB',
    name: 'GitHub',
    icon: '🐙',
    color: 'from-gray-600 to-gray-800',
    tokenLabel: 'GitHub Personal Access Token',
    tokenHelpUrl: 'https://github.com/settings/tokens/new',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

const CredentialsPanel: React.FC<CredentialsPanelProps> = ({ onClose, onPreviewContent }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [extrasInput, setExtrasInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);

  // Fetch existing credentials
  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetchWithCredentials('/api/credentials?sourceApp=canvas', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials || []);
      }
    } catch (err) {
      console.error('[Credentials] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Show credentials overview in preview after initial load
  useEffect(() => {
    if (loading || !onPreviewContent) return;
    const connected = PROVIDERS.filter(p => credentials.some(c => c.provider === p.id));
    const missing = PROVIDERS.filter(p => !credentials.some(c => c.provider === p.id));
    const connCards = connected.map(p => { const c = credentials.find(cr => cr.provider === p.id)!; return '<div class="card"><span class="icon">' + p.icon + '</span><div><div class="name">' + p.name + '</div><div class="status ok">' + (c.isValid ? 'Valid' : 'Saved') + (c.username ? ' · ' + c.username : '') + '</div></div></div>'; }).join('');
    const missCards = missing.map(p => '<div class="card" style="opacity:.5"><span class="icon">' + p.icon + '</span><div><div class="name">' + p.name + '</div><div class="status miss">Not connected</div></div></div>').join('');
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;padding:24px}h2{font-size:12px;font-weight:700;color:#a78bfa;text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}.card{background:#111;border:1px solid #1f2937;border-radius:10px;padding:14px;display:flex;align-items:center;gap:10px}.icon{font-size:18px;width:32px;text-align:center}.name{font-size:12px;font-weight:700;color:#e5e7eb}.status{font-size:10px;margin-top:2px}.ok{color:#10b981}.miss{color:#4b5563}.section{font-size:10px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:.1em;margin:16px 0 8px}</style></head><body><h2>\uD83D\uDD10 Deploy Credentials</h2>' + (connected.length ? '<div class="section">Connected (' + connected.length + ')</div><div class="grid">' + connCards + '</div>' : '') + '<div class="section">Not connected (' + missing.length + ')</div><div class="grid">' + missCards + '</div></body></html>';
    onPreviewContent({ type: 'html', title: 'CREDENTIALS_OVERVIEW', icon: '🔐', html });
  }, [loading]);

  // Connect a provider
  const handleConnect = async (providerId: string) => {
    if (!tokenInput.trim()) {
      setError('Please enter your token');
      return;
    }

    setError(null);
    setSuccess(null);
    setValidating(providerId);

    try {
      const body: Record<string, any> = { provider: providerId, token: tokenInput, sourceApp: 'canvas' };
      if (extrasInput.trim()) {
        body.extras = { accountId: extrasInput.trim() };
      }

      const res = await fetchWithCredentials('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || `${providerId} connected!`);
        setTokenInput('');
        setExtrasInput('');
        setConnectingProvider(null);
        fetchCredentials();
        const providerInfo = PROVIDERS.find(p => p.id === providerId);
        if (onPreviewContent && providerInfo) {
          onPreviewContent({
            type: 'html', title: 'CREDENTIALS_OVERVIEW', icon: '🔐',
            html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;padding:40px;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{background:#111;border:1px solid #1f2937;border-radius:16px;padding:32px;max-width:400px;width:100%;text-align:center}.icon{font-size:48px;margin-bottom:16px}.title{font-size:20px;font-weight:800;color:#10b981;margin-bottom:8px}.sub{font-size:13px;color:#6b7280}.badge{display:inline-block;background:#10b981/10;color:#10b981;border:1px solid #10b981/30;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;margin-top:16px}</style></head><body><div class="card"><div class="icon">' + providerInfo.icon + '</div><div class="title">' + providerInfo.name + ' Connected</div><div class="sub">Your token has been saved and encrypted.</div><div class="badge">✅ Ready to Deploy</div></div></body></html>',
          });
        }
      } else {
        setError(data.error || 'Failed to connect');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setValidating(null);
    }
  };

  // Delete a credential
  const handleDisconnect = async (providerId: string) => {
    if (!confirm(`Disconnect ${providerId}? You'll need to re-enter your token to deploy again.`)) return;

    try {
      const res = await fetchWithCredentials(`/api/credentials/${providerId}?sourceApp=canvas`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setSuccess(`${providerId} disconnected`);
        fetchCredentials();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    }
  };

  // Re-validate a credential
  const handleValidate = async (providerId: string) => {
    setValidating(providerId);
    try {
      const res = await fetchWithCredentials(`/api/credentials/${providerId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sourceApp: 'canvas' }),
      });

      const data = await res.json();
      if (data.valid) {
        setSuccess(`${providerId} token is valid ✓`);
      } else {
        setError(`${providerId} token is invalid. Please update it.`);
      }
      fetchCredentials();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setValidating(null);
    }
  };

  const getCredential = (providerId: string) => credentials.find((c) => c.provider === providerId);

  // Clear notifications after 4s
  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => { setError(null); setSuccess(null); }, 4000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111]/95">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50">
        <h3 className="text-xs font-bold text-violet-400/80 uppercase tracking-widest">
          Deploy Credentials
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-600 hover:text-indigo-600 dark:text-indigo-400 transition-colors" title="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[11px]">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-[11px]">
          {success}
        </div>
      )}

      {/* Provider List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : (
          PROVIDERS.map((provider) => {
            const cred = getCredential(provider.id);
            const isConnecting = connectingProvider === provider.id;

            return (
              <div
                key={provider.id}
                className={`p-4 rounded-lg border transition-all ${cred?.isValid
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : cred && !cred.isValid
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-black/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700'
                  }`}
              >
                {/* Provider header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center text-slate-900 dark:text-white text-sm font-bold`}>
                      {provider.icon}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{provider.name}</p>
                      {cred?.username && (
                        <p className="text-[10px] text-gray-500">{cred.username}</p>
                      )}
                    </div>
                  </div>
                  {cred ? (
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${cred.isValid
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                        }`}
                    >
                      {cred.isValid ? '✓ Connected' : '✗ Invalid'}
                    </span>
                  ) : null}
                </div>

                {/* Connected state */}
                {cred && !isConnecting && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleValidate(provider.id)}
                      disabled={validating === provider.id}
                      className="flex-1 py-1.5 text-[10px] font-bold bg-slate-300 dark:bg-black/40 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border border-slate-300 dark:border-slate-700 hover:border-indigo-500/30 rounded-lg transition-all uppercase tracking-wider disabled:opacity-50"
                    >
                      {validating === provider.id ? 'Validating...' : 'Validate'}
                    </button>
                    <button
                      onClick={() => {
                        setConnectingProvider(provider.id);
                        setTokenInput('');
                        setExtrasInput('');
                      }}
                      className="flex-1 py-1.5 text-[10px] font-bold bg-slate-300 dark:bg-black/40 text-slate-500 dark:text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 border border-slate-300 dark:border-slate-700 hover:border-yellow-500/30 rounded-lg transition-all uppercase tracking-wider"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDisconnect(provider.id)}
                      className="flex-1 py-1.5 text-[10px] font-bold bg-slate-300 dark:bg-black/40 text-slate-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-300 dark:border-slate-700 hover:border-red-500/30 rounded-lg transition-all uppercase tracking-wider"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Not connected / Update form */}
                {(!cred || isConnecting) && (
                  <div className="mt-3 space-y-2">
                    {!isConnecting && !cred && (
                      <button
                        onClick={() => {
                          setConnectingProvider(provider.id);
                          setTokenInput('');
                          setExtrasInput('');
                          setError(null);
                        }}
                        className="w-full py-2 text-[10px] font-bold bg-gradient-to-r from-cyan-600/80 to-emerald-600/80 text-slate-900 dark:text-white rounded-lg hover:from-cyan-500 hover:to-emerald-500 transition-all uppercase tracking-wider"
                      >
                        Connect {provider.name}
                      </button>
                    )}

                    {isConnecting && (
                      <>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                            {provider.tokenLabel}
                          </label>
                          <input
                            type="password"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder="Paste your token here..."
                            className="w-full px-3 py-2 text-xs bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder-gray-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
                          />
                          <a
                            href={provider.tokenHelpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-1 text-[9px] text-cyan-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors"
                          >
                            Get token →
                          </a>
                        </div>

                        {provider.hasExtras && (
                          <div>
                            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                              {provider.extrasLabel}
                            </label>
                            <input
                              type="text"
                              value={extrasInput}
                              onChange={(e) => setExtrasInput(e.target.value)}
                              placeholder={provider.extrasPlaceholder}
                              className="w-full px-3 py-2 text-xs bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder-gray-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConnect(provider.id)}
                            disabled={!tokenInput.trim() || validating === provider.id}
                            className="flex-1 py-2 text-[10px] font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 text-slate-900 dark:text-white rounded-lg hover:from-cyan-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 transition-all uppercase tracking-wider"
                          >
                            {validating === provider.id ? 'Connecting...' : 'Connect'}
                          </button>
                          <button
                            onClick={() => {
                              setConnectingProvider(null);
                              setTokenInput('');
                              setExtrasInput('');
                              setError(null);
                            }}
                            className="px-4 py-2 text-[10px] font-bold text-gray-500 hover:text-slate-700 dark:text-slate-300 bg-slate-300 dark:bg-black/40 border border-slate-300 dark:border-slate-700 rounded-lg transition-all uppercase tracking-wider"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Security note */}
        <div className="mt-4 p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg">
          <p className="text-[10px] text-violet-400/70 leading-relaxed">
            🔒 Tokens are encrypted with AES-256-GCM and stored on our server. They are never sent to the browser after initial validation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CredentialsPanel;
