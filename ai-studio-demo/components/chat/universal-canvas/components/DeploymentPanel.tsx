/**
 * DeploymentPanel
 * 
 * Full deployment UI panel with:
 * - Provider selection from connected credentials
 * - Deploy button with real-time status tracking
 * - Build/deploy logs streaming
 * - Build error list with auto-fix option
 * - Live URL after successful deploy
 * - Deployment history
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  RocketLaunchIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  WrenchScrewdriverIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  ClockIcon,
  Cog6ToothIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import type {
  DeployProvider,
  DeploymentInfo,
  DeploymentCredential,
  DeploymentStatus,
  BuildError,
  ProjectFile,
  ProjectFramework,
  DeployConfig,
} from '../types/canvas-types';
import { DEPLOY_PROVIDERS } from '../types/canvas-types';

// =============================================================================
// TYPES
// =============================================================================

interface DeploymentPanelProps {
  files: ProjectFile[];
  projectName: string;
  framework: ProjectFramework;
  credentials: DeploymentCredential[];
  activeDeployment: DeploymentInfo | null;
  deployments: DeploymentInfo[];
  isDeploying: boolean;
  deployError: string | null;
  onDeploy: (config: DeployConfig, files: ProjectFile[]) => Promise<DeploymentInfo>;
  onUndeploy?: (deploymentId: string) => Promise<boolean>;
  onAutoFix?: (errors: BuildError[]) => void;
  onOpenCredentials: () => void;
  onClearError: () => void;
  className?: string;
}

// =============================================================================
// STATUS DISPLAY HELPERS
// =============================================================================

const STATUS_CONFIG: Record<
  DeploymentStatus,
  { color: string; bgColor: string; icon: string; label: string; animate?: boolean }
> = {
  idle: { color: 'text-gray-400', bgColor: 'bg-gray-500/10', icon: '⏸', label: 'Ready' },
  preparing: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: '📦', label: 'Preparing...', animate: true },
  uploading: { color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', icon: '📤', label: 'Uploading...', animate: true },
  building: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', icon: '🔨', label: 'Building...', animate: true },
  deploying: { color: 'text-purple-400', bgColor: 'bg-purple-500/10', icon: '🚀', label: 'Deploying...', animate: true },
  live: { color: 'text-green-400', bgColor: 'bg-green-500/10', icon: '✅', label: 'Live' },
  failed: { color: 'text-red-400', bgColor: 'bg-red-500/10', icon: '❌', label: 'Failed' },
  stopped: { color: 'text-gray-500', bgColor: 'bg-gray-500/10', icon: '⏹', label: 'Stopped' },
};

function getStageProgress(status: DeploymentStatus): number {
  const stages: DeploymentStatus[] = ['preparing', 'uploading', 'building', 'deploying', 'live'];
  const idx = stages.indexOf(status);
  if (idx === -1) return 0;
  return ((idx + 1) / stages.length) * 100;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function DeploymentPanel({
  files,
  projectName,
  framework,
  credentials,
  activeDeployment,
  deployments,
  isDeploying,
  deployError,
  onDeploy,
  onUndeploy,
  onAutoFix,
  onOpenCredentials,
  onClearError,
  className = '',
}: DeploymentPanelProps) {
  const [selectedProvider, setSelectedProvider] = useState<DeployProvider>('onelastai');
  const [showLogs, setShowLogs] = useState(false);
  const [showErrors, setShowErrors] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [envInput, setEnvInput] = useState({ key: '', value: '' });
  const [subdomain, setSubdomain] = useState('');
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeDeployment?.buildLogs, activeDeployment?.deployLogs, showLogs]);

  // Available providers (connected + onelastai)
  const availableProviders = DEPLOY_PROVIDERS.filter(
    (p) =>
      p.provider === 'onelastai' ||
      credentials.some((c) => c.provider === p.provider && c.isValid)
  );

  const selectedProviderConfig = DEPLOY_PROVIDERS.find((p) => p.provider === selectedProvider);
  const selectedCredential = credentials.find(
    (c) => c.provider === selectedProvider && c.isValid
  );

  const statusConfig = activeDeployment
    ? STATUS_CONFIG[activeDeployment.status]
    : STATUS_CONFIG.idle;

  // Deploy handler
  const handleDeploy = useCallback(async () => {
    if (isDeploying) return;

    const config: DeployConfig = {
      provider: selectedProvider,
      credentialId: selectedCredential?.id || '',
      projectName: projectName || 'my-project',
      subdomain: subdomain || undefined,
      framework,
      envVars,
    };

    try {
      await onDeploy(config, files);
    } catch {
      // Error handled by parent hook
    }
  }, [
    isDeploying,
    selectedProvider,
    selectedCredential,
    projectName,
    subdomain,
    framework,
    envVars,
    files,
    onDeploy,
  ]);

  // Copy URL
  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Add env var
  const addEnvVar = useCallback(() => {
    if (envInput.key.trim()) {
      setEnvVars((prev) => ({ ...prev, [envInput.key.trim()]: envInput.value }));
      setEnvInput({ key: '', value: '' });
    }
  }, [envInput]);

  // Errors from active deployment
  const errors = activeDeployment?.errors?.filter((e) => e.severity === 'error') || [];
  const warnings = activeDeployment?.errors?.filter((e) => e.severity === 'warning') || [];
  const allLogs = [
    ...(activeDeployment?.buildLogs || []).map((l) => ({ type: 'build' as const, text: l })),
    ...(activeDeployment?.deployLogs || []).map((l) => ({ type: 'deploy' as const, text: l })),
  ];

  return (
    <div className={`flex flex-col h-full bg-[#0a0a12] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <RocketLaunchIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Deploy</span>
        </div>
        <button
          onClick={onOpenCredentials}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title="Manage credentials"
        >
          <KeyIcon className="w-3.5 h-3.5" />
          Credentials
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Provider Selection */}
        <div className="p-4 border-b border-slate-200 dark:border-white/5">
          <label className="text-xs font-medium text-gray-400 mb-2 block">Platform</label>
          <div className="grid grid-cols-3 gap-2">
            {availableProviders.map((provider) => (
              <button
                key={provider.provider}
                onClick={() => setSelectedProvider(provider.provider)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs ${
                  selectedProvider === provider.provider
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-gray-400 hover:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
                disabled={isDeploying}
              >
                <span className="text-base">{provider.icon}</span>
                <span className="truncate w-full text-center">{provider.name}</span>
              </button>
            ))}
          </div>

          {credentials.length === 0 && (
            <button
              onClick={onOpenCredentials}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-white/10 text-xs text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
            >
              <KeyIcon className="w-3.5 h-3.5" />
              Add platform credentials for more options
            </button>
          )}
        </div>

        {/* Subdomain / Project Name */}
        <div className="p-4 border-b border-slate-200 dark:border-white/5 space-y-3">
          {selectedProvider === 'onelastai' && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Subdomain</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                  placeholder={projectName?.toLowerCase().replace(/\s+/g, '-') || 'my-app'}
                  className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 transition-colors"
                  disabled={isDeploying}
                />
                <span className="text-xs text-gray-500">.apps.onelastai.co</span>
              </div>
            </div>
          )}
        </div>

        {/* Env Variables */}
        <div className="border-b border-slate-200 dark:border-white/5">
          <button
            onClick={() => setShowEnvVars(!showEnvVars)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Cog6ToothIcon className="w-3.5 h-3.5" />
              Environment Variables
              {Object.keys(envVars).length > 0 && (
                <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full text-[10px]">
                  {Object.keys(envVars).length}
                </span>
              )}
            </span>
            {showEnvVars ? (
              <ChevronUpIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )}
          </button>
          {showEnvVars && (
            <div className="px-4 pb-3 space-y-2">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <span className="text-cyan-400 font-mono">{key}</span>
                  <span className="text-gray-600">=</span>
                  <span className="text-gray-400 font-mono truncate flex-1">
                    {value.replace(/./g, '•')}
                  </span>
                  <button
                    onClick={() => {
                      const next = { ...envVars };
                      delete next[key];
                      setEnvVars(next);
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <XCircleIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={envInput.key}
                  onChange={(e) => setEnvInput((p) => ({ ...p, key: e.target.value }))}
                  placeholder="KEY"
                  className="w-1/3 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-mono placeholder-gray-500 outline-none focus:border-cyan-500/50"
                />
                <input
                  type="text"
                  value={envInput.value}
                  onChange={(e) => setEnvInput((p) => ({ ...p, value: e.target.value }))}
                  placeholder="value"
                  className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-mono placeholder-gray-500 outline-none focus:border-cyan-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && addEnvVar()}
                />
                <button
                  onClick={addEnvVar}
                  className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-xs hover:bg-cyan-500/20 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Deploy Button */}
        <div className="p-4 border-b border-slate-200 dark:border-white/5">
          <button
            onClick={handleDeploy}
            disabled={isDeploying || files.length === 0}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              isDeploying
                ? 'bg-purple-500/20 text-purple-300 cursor-wait'
                : files.length === 0
                ? 'bg-slate-100 dark:bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-900 dark:text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30'
            }`}
          >
            {isDeploying ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                {statusConfig.label}
              </>
            ) : (
              <>
                <RocketLaunchIcon className="w-4 h-4" />
                Deploy to {selectedProviderConfig?.name || 'Platform'}
              </>
            )}
          </button>

          {/* Progress bar during deploy */}
          {isDeploying && activeDeployment && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                <span>{statusConfig.label}</span>
                <span>{Math.round(getStageProgress(activeDeployment.status))}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${getStageProgress(activeDeployment.status)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Deploy Error */}
        {deployError && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-red-300">{deployError}</p>
              </div>
              <button
                onClick={onClearError}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <XCircleIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Live URL */}
        {activeDeployment?.status === 'live' && activeDeployment.url && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-4 h-4 text-green-400" />
              <span className="text-xs font-semibold text-green-300">Deployed Successfully!</span>
            </div>
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-3.5 h-3.5 text-green-400/70" />
              <a
                href={activeDeployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 underline truncate flex-1"
              >
                {activeDeployment.url}
              </a>
              <button
                onClick={() => copyUrl(activeDeployment.url!)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Copy URL"
              >
                {copied ? (
                  <CheckCircleIcon className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                )}
              </button>
              <a
                href={activeDeployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Open in new tab"
              >
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </a>
            </div>
            {activeDeployment.previewUrl && activeDeployment.previewUrl !== activeDeployment.url && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-gray-500">Preview:</span>
                <a
                  href={activeDeployment.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-gray-400 hover:text-cyan-400 truncate"
                >
                  {activeDeployment.previewUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Build Errors */}
        {errors.length > 0 && (
          <div className="mx-4 mt-3">
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="w-full flex items-center justify-between mb-2"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                {errors.length} Error{errors.length !== 1 ? 's' : ''}
                {warnings.length > 0 && (
                  <span className="text-yellow-500">
                    , {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
                  </span>
                )}
              </span>
              {showErrors ? (
                <ChevronUpIcon className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
              )}
            </button>

            {showErrors && (
              <div className="space-y-2">
                {errors.map((err) => (
                  <div
                    key={err.id}
                    className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <XCircleIcon className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-red-300 break-words">{err.message}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                          <span className="font-mono">{err.file}</span>
                          {err.line && <span>Line {err.line}</span>}
                          {err.code && <span className="text-gray-600">[{err.code}]</span>}
                        </div>
                        {err.suggestion && (
                          <p className="mt-1.5 text-[11px] text-cyan-400/70 italic">
                            💡 {err.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Auto-fix button */}
                {onAutoFix &&
                  errors.some((e) => e.autoFixable) && (
                    <button
                      onClick={() => onAutoFix(errors.filter((e) => e.autoFixable))}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-colors border border-cyan-500/20"
                    >
                      <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                      Auto-fix {errors.filter((e) => e.autoFixable).length} Error
                      {errors.filter((e) => e.autoFixable).length !== 1 ? 's' : ''}
                    </button>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Build/Deploy Logs */}
        {allLogs.length > 0 && (
          <div className="mx-4 mt-3 mb-4">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full flex items-center justify-between mb-2"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <CodeBracketIcon className="w-3.5 h-3.5" />
                Logs ({allLogs.length})
              </span>
              {showLogs ? (
                <ChevronUpIcon className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
              )}
            </button>

            {showLogs && (
              <div className="bg-black/30 rounded-lg border border-slate-200 dark:border-white/5 p-2 max-h-48 overflow-y-auto font-mono text-[10px] leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
                {allLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`${
                      log.type === 'build' ? 'text-yellow-400/70' : 'text-cyan-400/70'
                    }`}
                  >
                    <span className="text-gray-600 mr-2 select-none">
                      {log.type === 'build' ? 'build' : 'deploy'}
                    </span>
                    {log.text}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        )}

        {/* Deployment History */}
        {deployments.length > 1 && (
          <div className="mx-4 mt-1 mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between mb-2"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <ClockIcon className="w-3.5 h-3.5" />
                History ({deployments.length})
              </span>
              {showHistory ? (
                <ChevronUpIcon className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
              )}
            </button>

            {showHistory && (
              <div className="space-y-1.5">
                {deployments.slice(0, 10).map((dep) => {
                  const cfg = STATUS_CONFIG[dep.status];
                  const provider = DEPLOY_PROVIDERS.find((p) => p.provider === dep.provider);
                  return (
                    <div
                      key={dep.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-xs"
                    >
                      <span className="text-[11px]">{cfg.icon}</span>
                      <span className="text-gray-400 flex-1 truncate">
                        {provider?.name} • v{dep.id.slice(-4)}
                      </span>
                      <span className={`text-[10px] ${cfg.color}`}>{cfg.label}</span>
                      {dep.url && (
                        <a
                          href={dep.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-cyan-400 transition-colors"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
