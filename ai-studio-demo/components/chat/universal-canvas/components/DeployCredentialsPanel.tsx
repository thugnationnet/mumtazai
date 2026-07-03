/**
 * DeployCredentialsPanel
 * 
 * Panel where users manage their deployment platform credentials
 * (Vercel, Railway, Netlify, Cloudflare) and initiate deployments.
 */
'use client';

import { useState, useCallback } from 'react';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import type { DeployProvider, DeploymentCredential, ProviderConfig } from '../types/canvas-types';
import { DEPLOY_PROVIDERS } from '../types/canvas-types';

interface DeployCredentialsPanelProps {
  credentials: DeploymentCredential[];
  onSave: (provider: DeployProvider, token: string, name?: string, teamId?: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onValidate: (id: string) => Promise<boolean>;
  isLoading?: boolean;
  onClose?: () => void;
}

export default function DeployCredentialsPanel({
  credentials,
  onSave,
  onDelete,
  onValidate,
  isLoading = false,
  onClose,
}: DeployCredentialsPanelProps) {
  const [addingProvider, setAddingProvider] = useState<DeployProvider | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [teamIdInput, setTeamIdInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!addingProvider || !tokenInput.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const success = await onSave(addingProvider, tokenInput.trim(), nameInput.trim() || undefined, teamIdInput.trim() || undefined);
      if (success) {
        setAddingProvider(null);
        setTokenInput('');
        setNameInput('');
        setTeamIdInput('');
      } else {
        setError('Failed to save credential. Please check the token and try again.');
      }
    } catch {
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  }, [addingProvider, tokenInput, nameInput, teamIdInput, onSave]);

  const handleValidate = useCallback(async (id: string) => {
    setValidating(id);
    await onValidate(id);
    setValidating(null);
  }, [onValidate]);

  const handleDelete = useCallback(async (id: string) => {
    await onDelete(id);
    setDeleteConfirm(null);
  }, [onDelete]);

  const getProviderConfig = (provider: DeployProvider): ProviderConfig | undefined =>
    DEPLOY_PROVIDERS.find(p => p.provider === provider);

  const connectedProviders = new Set(credentials.map(c => c.provider));

  return (
    <div className="flex flex-col h-full bg-[#12121a] text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2">
          <KeyIcon className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold">Deploy Credentials</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-slate-900 dark:hover:text-white transition">
            ✕
          </button>
        )}
      </div>

      {/* Security Notice */}
      <div className="mx-3 mt-3 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
        <div className="flex items-start gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-cyan-300/80">
            Your credentials are encrypted and stored securely. They are only used to deploy your projects and are never shared.
          </p>
        </div>
      </div>

      {/* Connected Platforms */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Connected Platforms</p>

        {credentials.length === 0 && !isLoading && (
          <div className="text-center py-6">
            <KeyIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No platforms connected</p>
            <p className="text-xs text-gray-600 mt-1">Add a platform below to start deploying</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {credentials.map(cred => {
          const config = getProviderConfig(cred.provider);
          if (!config) return null;

          return (
            <div key={cred.id} className="rounded-lg border border-[#2a2a3a] bg-[#1a1a24] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{config.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{config.name}</p>
                    <p className="text-xs text-gray-500">{cred.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {cred.isValid ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-yellow-400">
                      <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={() => handleValidate(cred.id)}
                  disabled={validating === cred.id}
                  className="flex-1 py-1.5 px-2.5 text-xs rounded-md bg-[#2a2a3a] hover:bg-[#353545] text-gray-300 transition flex items-center justify-center gap-1"
                >
                  {validating === cred.id ? (
                    <div className="w-3 h-3 border border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Verify
                    </>
                  )}
                </button>
                {deleteConfirm === cred.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(cred.id)}
                      className="py-1.5 px-2.5 text-xs rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 transition"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="py-1.5 px-2.5 text-xs rounded-md bg-[#2a2a3a] hover:bg-[#353545] text-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(cred.id)}
                    className="py-1.5 px-2.5 text-xs rounded-md bg-[#2a2a3a] hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Platform Section */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Add Platform</p>
          
          {/* Add form open */}
          {addingProvider ? (
            <div className="rounded-lg border border-cyan-500/30 bg-[#1a1a24] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getProviderConfig(addingProvider)?.icon}</span>
                  <p className="text-sm font-medium">{getProviderConfig(addingProvider)?.name}</p>
                </div>
                <button onClick={() => { setAddingProvider(null); setError(null); }} className="text-gray-500 hover:text-slate-900 dark:hover:text-white">
                  ✕
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Display Name (optional)</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder={`My ${getProviderConfig(addingProvider)?.name} Account`}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[#0a0a0f] border border-[#2a2a3a] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">{getProviderConfig(addingProvider)?.tokenLabel}</label>
                  {getProviderConfig(addingProvider)?.tokenUrl && (
                    <a
                      href={getProviderConfig(addingProvider)?.tokenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      Get token <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    placeholder="Paste your API token here"
                    className="w-full px-3 py-2 pr-9 text-sm rounded-md bg-[#0a0a0f] border border-[#2a2a3a] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                  />
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showToken ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Team ID (Vercel) */}
              {addingProvider === 'vercel' && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Team ID (optional)</label>
                  <input
                    type="text"
                    value={teamIdInput}
                    onChange={e => setTeamIdInput(e.target.value)}
                    placeholder="team_xxxxx"
                    className="w-full px-3 py-2 text-sm rounded-md bg-[#0a0a0f] border border-[#2a2a3a] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                  />
                </div>
              )}

              {error && (
                <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !tokenInput.trim()}
                className="w-full py-2 px-3 text-sm rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-slate-900 dark:text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheckIcon className="w-4 h-4" />
                    Save & Connect
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Provider grid */
            <div className="grid grid-cols-2 gap-2">
              {DEPLOY_PROVIDERS.filter(p => p.provider !== 'mumtazai').map(provider => {
                const isConnected = connectedProviders.has(provider.provider);
                return (
                  <button
                    key={provider.provider}
                    onClick={() => {
                      if (isConnected) {
                        // Re-open to update
                        setAddingProvider(provider.provider);
                        const existing = credentials.find(c => c.provider === provider.provider);
                        setNameInput(existing?.name || '');
                      } else {
                        setAddingProvider(provider.provider);
                      }
                      setTokenInput('');
                      setTeamIdInput('');
                      setError(null);
                    }}
                    className={`p-3 rounded-lg border transition text-left ${
                      isConnected
                        ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
                        : 'border-[#2a2a3a] bg-[#1a1a24] hover:bg-[#252530]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{provider.icon}</span>
                      <span className="text-xs font-medium text-gray-200">{provider.name}</span>
                    </div>
                    {isConnected ? (
                      <span className="text-[10px] text-green-400 flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <PlusIcon className="w-3 h-3" /> Add token
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* One Last AI - Always available */}
        <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🧠</span>
            <span className="text-sm font-medium text-cyan-300">One Last AI Apps</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">Free</span>
          </div>
          <p className="text-xs text-gray-500">
            Deploy to apps.mumtaz.ai instantly — no credentials needed!
          </p>
        </div>
      </div>
    </div>
  );
}
