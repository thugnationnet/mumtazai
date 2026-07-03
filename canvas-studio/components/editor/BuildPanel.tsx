/**
 * BuildPanel — Full-screen build & automation dashboard
 * Production-wired: fetches from /api/builds, starts real builds, streams logs via SSE
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Zap,
  TestTube,
  Download,
  AlertTriangle,
  Settings,
  Share2,
  Copy,
  FolderOpen,
  Layers,
  Terminal,
  BarChart3,
  Globe,
  Archive,
  Rocket,
  Cpu,
  Timer,
  Check,
  X,
  ChevronUp,
  Link,
  FileCode,
  Gauge,
} from 'lucide-react';

// ── Types (matching backend CanvasBuild model) ─────────────────────

type BuildStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
type BuildTab = 'pipeline' | 'history' | 'artifacts' | 'settings' | 'share';

interface Build {
  id: string;
  version: number;
  projectId: string;
  status: BuildStatus;
  framework?: string;
  buildCommand?: string;
  logs?: string;
  artifactUrl?: string;
  duration?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

interface BuildConfig {
  minify: boolean;
  sourceMaps: boolean;
  treeshake: boolean;
  analyze: boolean;
  autoTest: boolean;
  autoLint: boolean;
  autoDeploy: boolean;
  outputDir: string;
  envFile: string;
}

interface ShareLink {
  id: string;
  url: string;
  expiresAt: string;
  accessCount: number;
  isPublic: boolean;
}

interface BuildPanelProps {
  projectId: string;
  onDeployReady?: (buildId: string) => void;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
};

const timeAgo = (date: string): string => {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  running: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  success: { bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-400' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  cancelled: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-500' },
};

// ── Component ──────────────────────────────────────────────────────

const BuildPanel: React.FC<BuildPanelProps> = ({ projectId, onDeployReady, className = '' }) => {
  const [activeTab, setActiveTab] = useState<BuildTab>('pipeline');
  const [builds, setBuilds] = useState<Build[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeBuild, setActiveBuild] = useState<Build | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [expandedHistoryBuild, setExpandedHistoryBuild] = useState<string | null>(null);
  const [config, setConfig] = useState<BuildConfig>({
    minify: true,
    sourceMaps: false,
    treeshake: true,
    analyze: true,
    autoTest: true,
    autoLint: true,
    autoDeploy: false,
    outputDir: 'dist',
    envFile: '.env.production',
  });
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Cleanup SSE/poll on unmount
  useEffect(() => () => {
    if (sseRef.current) sseRef.current.close();
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // ── Load builds from API ─────────────────────────────────

  const loadBuilds = useCallback(async () => {
    if (!projectId || projectId === 'default') {
      setBuilds([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/builds/${projectId}`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load builds (${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setBuilds(data.builds || []);
      } else {
        throw new Error(data.error || 'Failed to load builds');
      }
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load builds');
      setBuilds([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadBuilds(); }, [loadBuilds]);

  // ── Start build via API ─────────────────────────────────

  const handleStartBuild = useCallback(async () => {
    if (isBuilding || !projectId || projectId === 'default') return;
    setIsBuilding(true);
    setActiveTab('pipeline');
    setLogs([]);

    const appendLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    appendLog('Starting build...');

    try {
      const res = await fetch('/api/builds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Build request failed (${res.status})`);
      }

      const build = data.build;
      appendLog(`Build v${build.version} queued (${build.id})`);
      setActiveBuild(build);

      // Poll for status updates
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/builds/${build.id}/status`, { credentials: 'include' });
          const statusData = await statusRes.json();
          if (statusData.success) {
            const updated = statusData.build;
            setActiveBuild(updated);

            if (['success', 'failed', 'cancelled'].includes(updated.status)) {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = null;
              setIsBuilding(false);

              if (updated.status === 'success') {
                appendLog(`✓ Build v${updated.version} completed${updated.duration ? ` in ${formatDuration(updated.duration)}` : ''}`);
                onDeployReady?.(updated.id);
              } else if (updated.status === 'failed') {
                appendLog(`✕ Build failed: ${updated.errorMessage || 'Unknown error'}`);
              } else {
                appendLog('✕ Build cancelled');
              }

              // Refresh the builds list
              loadBuilds();
            }
          }
        } catch {}
      }, 3000);

      // Try to stream logs via SSE
      try {
        const logsUrl = `/api/builds/${build.id}/logs`;
        const eventSource = new EventSource(logsUrl, { withCredentials: true } as any);
        sseRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'log' && msg.message) {
              appendLog(msg.message);
            } else if (msg.type === 'complete') {
              eventSource.close();
              sseRef.current = null;
            }
          } catch {}
        };

        eventSource.onerror = () => {
          eventSource.close();
          sseRef.current = null;
        };
      } catch {
        // SSE not available, status polling handles updates
      }
    } catch (err: any) {
      appendLog(`✕ Error: ${err.message || 'Failed to start build'}`);
      setIsBuilding(false);
    }
  }, [isBuilding, projectId, onDeployReady, loadBuilds]);

  // Cancel build via API
  const handleCancel = useCallback(async () => {
    if (!activeBuild) return;
    try {
      await fetch(`/api/builds/${activeBuild.id}/cancel`, { method: 'POST', credentials: 'include' });
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✕ Build cancelled by user`]);
    } catch {}
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setIsBuilding(false);
    loadBuilds();
  }, [activeBuild, loadBuilds]);

  // Create share link (local)
  const handleCreateShareLink = useCallback((_buildId: string, isPublic: boolean) => {
    const link: ShareLink = {
      id: Math.random().toString(36).slice(2, 10),
      url: `https://studio.onelastai.co/builds/${_buildId}`,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      accessCount: 0,
      isPublic,
    };
    setShareLinks(prev => [link, ...prev]);
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // ── Tab: Pipeline ──────────────────────────────────────────────

  const renderPipeline = () => {
    const currentBuild = activeBuild || builds[0];
    const currentStatus = currentBuild ? (STATUS_STYLES[currentBuild.status] || STATUS_STYLES.pending) : null;

    return (
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-auto">
        {/* Left — Pipeline main area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Quick Actions Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleStartBuild}
              disabled={isBuilding || !projectId || projectId === 'default'}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-violet-600 hover:from-violet-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-slate-900 dark:text-white transition-all shadow-lg shadow-violet-500/20 active:scale-95"
            >
              {isBuilding ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {isBuilding ? 'Building...' : 'Start Build'}
            </button>
            {isBuilding && (
              <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/15 hover:bg-red-500/25 rounded-lg text-xs font-medium text-red-400 transition-colors">
                <Square size={12} /> Cancel
              </button>
            )}
            <button onClick={loadBuilds} className="p-2 rounded-lg hover:bg-white/[0.06] text-zinc-400 transition-colors" title="Refresh">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Current Build Status */}
          {currentBuild && currentStatus && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${currentStatus.bg} border-slate-200 dark:border-white/[0.06]`}>
              <span className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot} ${['pending', 'running'].includes(currentBuild.status) ? 'animate-pulse' : ''}`} />
              <span className={`text-sm font-semibold ${currentStatus.text} capitalize`}>{currentBuild.status}</span>
              <span className="text-xs text-zinc-500">v{currentBuild.version}</span>
              {currentBuild.duration != null && (
                <span className="text-xs text-zinc-400 ml-auto">{formatDuration(currentBuild.duration)}</span>
              )}
              {currentBuild.errorMessage && (
                <span className="text-xs text-red-400 ml-2 truncate max-w-xs">{currentBuild.errorMessage}</span>
              )}
            </div>
          )}

          {/* Build Logs */}
          <div className="bg-black/30 border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden flex-1 min-h-[200px]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Terminal size={12} className="text-zinc-500" />
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Build Output</span>
              </div>
              {logs.length > 0 && (
                <button onClick={() => setLogs([])} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">Clear</button>
              )}
            </div>
            <div className="p-3 max-h-[400px] overflow-y-auto font-mono text-[11px] space-y-0.5 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-zinc-600 py-8 text-center text-xs">No build output yet. Click &quot;Start Build&quot; to begin.</div>
              ) : logs.map((line, i) => (
                <div key={i} className={`leading-5 ${
                  line.includes('✕') || line.includes('ERROR') || line.includes('error') || line.includes('failed') ? 'text-red-400' :
                  line.includes('warn') || line.includes('WARN') ? 'text-yellow-400' :
                  line.includes('✓') || line.includes('completed') || line.includes('success') ? 'text-violet-400' :
                  line.includes('▸') || line.includes('Starting') || line.includes('queued') ? 'text-indigo-400' :
                  'text-zinc-400'
                }`}>{line}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Error display */}
          {loadError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              {loadError}
              <button onClick={loadBuilds} className="ml-auto px-3 py-1 bg-red-500/15 rounded-lg text-xs hover:bg-red-500/25">Retry</button>
            </div>
          )}
        </div>

        {/* Right — Build Stats Sidebar */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Current / Last Build Overview */}
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={12} className="text-violet-400" /> Build Overview
            </h3>
            {(() => {
              const b = currentBuild;
              if (!b) return <div className="text-xs text-zinc-500">No builds yet</div>;
              const style = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Status</span>
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${['pending', 'running'].includes(b.status) ? 'animate-pulse' : ''}`} />
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Version</span>
                    <span className="text-[10px] text-slate-900 dark:text-white font-mono">v{b.version}</span>
                  </div>
                  {b.framework && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Framework</span>
                      <span className="text-[10px] text-violet-400 font-mono">{b.framework}</span>
                    </div>
                  )}
                  {b.duration != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Duration</span>
                      <span className="text-[10px] text-slate-900 dark:text-white font-mono">{formatDuration(b.duration)}</span>
                    </div>
                  )}
                  {b.startedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Started</span>
                      <span className="text-[10px] text-zinc-400">{timeAgo(b.startedAt)}</span>
                    </div>
                  )}
                  {b.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Completed</span>
                      <span className="text-[10px] text-zinc-400">{timeAgo(b.completedAt)}</span>
                    </div>
                  )}
                  {b.errorMessage && (
                    <div className="mt-2 p-2 bg-red-500/10 rounded-lg">
                      <span className="text-[10px] text-red-400">{b.errorMessage}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Quick Config Toggles */}
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Settings size={12} className="text-violet-400" /> Quick Config
            </h3>
            {([
              { key: 'minify' as const, label: 'Minify', icon: <Zap size={12} /> },
              { key: 'treeshake' as const, label: 'Tree Shake', icon: <Layers size={12} /> },
              { key: 'sourceMaps' as const, label: 'Source Maps', icon: <FileCode size={12} /> },
              { key: 'autoTest' as const, label: 'Auto Test', icon: <TestTube size={12} /> },
              { key: 'autoLint' as const, label: 'Auto Lint', icon: <AlertTriangle size={12} /> },
              { key: 'analyze' as const, label: 'Bundle Analyze', icon: <BarChart3 size={12} /> },
              { key: 'autoDeploy' as const, label: 'Auto Deploy', icon: <Rocket size={12} /> },
            ]).map(opt => (
              <button
                key={opt.key}
                onClick={() => setConfig(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-300">
                  {opt.icon}
                  <span className="text-[11px]">{opt.label}</span>
                </div>
                <div className={`w-7 h-4 rounded-full transition-colors ${config[opt.key] ? 'bg-violet-500' : 'bg-zinc-700'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${config[opt.key] ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Artifact download if available */}
          {currentBuild?.artifactUrl && currentBuild.status === 'success' && (
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
                <Archive size={12} /> Artifact
              </h3>
              <a
                href={currentBuild.artifactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-violet-500/10 transition-colors text-left"
              >
                <Download size={12} className="text-violet-400" />
                <span className="text-[11px] text-violet-300 truncate flex-1">Download Build Artifact</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Tab: History ──────────────────────────────────────────────

  const renderHistory = () => (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Build History</h3>
          <button onClick={loadBuilds} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 transition-colors" title="Refresh">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 size={24} className="mx-auto text-zinc-500 animate-spin mb-3" />
            <p className="text-xs text-zinc-500">Loading builds...</p>
          </div>
        ) : builds.length === 0 ? (
          <div className="text-center py-16">
            <Archive size={32} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500">No build history</p>
            <p className="text-xs text-zinc-600 mt-1">Start a build to see it here</p>
          </div>
        ) : builds.map(build => {
          const style = STATUS_STYLES[build.status] || STATUS_STYLES.pending;
          const isExpanded = expandedHistoryBuild === build.id;
          return (
            <div key={build.id} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden transition-colors hover:border-white/[0.1]">
              <button onClick={() => setExpandedHistoryBuild(isExpanded ? null : build.id)} className="flex items-center w-full px-4 py-3 text-left gap-3">
                {/* Status indicator */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                {/* Build version */}
                <span className="text-xs font-bold text-slate-900 dark:text-white w-12 shrink-0">v{build.version}</span>
                {/* Framework */}
                {build.framework && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/15 text-violet-400 shrink-0">
                    {build.framework}
                  </span>
                )}
                {/* Status */}
                <span className={`text-[10px] font-semibold ${style.text} shrink-0 capitalize`}>{build.status}</span>
                {/* Spacer */}
                <div className="flex-1" />
                {/* Duration */}
                {build.duration != null && (
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1 shrink-0"><Timer size={10} />{formatDuration(build.duration)}</span>
                )}
                {/* Time ago */}
                <span className="text-[10px] text-zinc-600 shrink-0">{timeAgo(build.createdAt)}</span>
                {/* Expand chevron */}
                {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-3">
                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-50 dark:bg-white/[0.02] rounded-lg p-2">
                      <p className="text-[9px] text-zinc-500 uppercase">ID</p>
                      <p className="text-[10px] text-zinc-300 font-mono truncate">{build.id}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/[0.02] rounded-lg p-2">
                      <p className="text-[9px] text-zinc-500 uppercase">Created</p>
                      <p className="text-[10px] text-zinc-300">{new Date(build.createdAt).toLocaleString()}</p>
                    </div>
                    {build.startedAt && (
                      <div className="bg-slate-50 dark:bg-white/[0.02] rounded-lg p-2">
                        <p className="text-[9px] text-zinc-500 uppercase">Started</p>
                        <p className="text-[10px] text-zinc-300">{new Date(build.startedAt).toLocaleString()}</p>
                      </div>
                    )}
                    {build.completedAt && (
                      <div className="bg-slate-50 dark:bg-white/[0.02] rounded-lg p-2">
                        <p className="text-[9px] text-zinc-500 uppercase">Completed</p>
                        <p className="text-[10px] text-zinc-300">{new Date(build.completedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {build.errorMessage && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-[10px] text-red-400 font-mono">{build.errorMessage}</p>
                    </div>
                  )}

                  {/* Logs preview */}
                  {build.logs && (
                    <div className="bg-slate-200 dark:bg-black/20 rounded-lg p-2.5 max-h-32 overflow-y-auto">
                      <pre className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap">{build.logs}</pre>
                    </div>
                  )}

                  {/* Artifact */}
                  {build.artifactUrl && (
                    <a
                      href={build.artifactUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 rounded-lg text-[10px] font-medium text-violet-300 transition-colors w-fit"
                    >
                      <Download size={10} /> Download Artifact
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Tab: Artifacts ──────────────────────────────────────────────

  const buildsWithArtifacts = builds.filter(b => b.artifactUrl && b.status === 'success');

  const renderArtifacts = () => (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-4xl mx-auto">
        {buildsWithArtifacts.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen size={32} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500">No artifacts</p>
            <p className="text-xs text-zinc-600 mt-1">Build artifacts will appear here after successful builds</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {buildsWithArtifacts.map(b => (
              <div key={b.id} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-violet-500/15 text-violet-400">
                    <Archive size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">Build v{b.version}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {b.framework || 'Unknown'} · {b.duration != null ? formatDuration(b.duration) : '—'}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(b.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <a
                    href={b.artifactUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 rounded-lg text-[10px] font-medium text-violet-300 transition-colors"
                  >
                    <Download size={10} /> Download
                  </a>
                  <button
                    onClick={() => handleCopy(b.artifactUrl!, b.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] rounded-lg text-[10px] font-medium text-zinc-400 transition-colors"
                  >
                    {copiedId === b.id ? <Check size={10} className="text-violet-400" /> : <Copy size={10} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Tab: Settings ──────────────────────────────────────────────

  const renderSettings = () => (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Build Configuration */}
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Settings size={14} className="text-violet-400" /> Build Configuration</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Output Directory</label>
              <input
                value={config.outputDir}
                onChange={e => setConfig(prev => ({ ...prev, outputDir: e.target.value }))}
                className="w-full px-3 py-2 bg-black/30 border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-violet-500/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Environment File</label>
              <input
                value={config.envFile}
                onChange={e => setConfig(prev => ({ ...prev, envFile: e.target.value }))}
                className="w-full px-3 py-2 bg-black/30 border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-violet-500/40"
              />
            </div>
          </div>
        </div>

        {/* Pipeline Steps */}
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Layers size={14} className="text-violet-400" /> Pipeline Steps</h3>
          <div className="space-y-2">
            {([
              { key: 'autoLint' as const, label: 'Lint Check', desc: 'Run eslint before build', icon: <AlertTriangle size={14} className="text-yellow-400" /> },
              { key: 'autoTest' as const, label: 'Run Tests', desc: 'Execute test suite', icon: <TestTube size={14} className="text-purple-400" /> },
              { key: 'minify' as const, label: 'Minify Output', desc: 'Compress JS/CSS for production', icon: <Zap size={14} className="text-amber-400" /> },
              { key: 'treeshake' as const, label: 'Tree Shaking', desc: 'Remove unused code', icon: <Layers size={14} className="text-violet-400" /> },
              { key: 'sourceMaps' as const, label: 'Source Maps', desc: 'Generate .map files for debugging', icon: <FileCode size={14} className="text-indigo-400" /> },
              { key: 'analyze' as const, label: 'Bundle Analysis', desc: 'Generate size report', icon: <BarChart3 size={14} className="text-violet-400" /> },
              { key: 'autoDeploy' as const, label: 'Auto Deploy', desc: 'Deploy after successful build', icon: <Rocket size={14} className="text-violet-400" /> },
            ]).map(opt => (
              <div key={opt.key} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                <div className="flex items-center gap-3">
                  {opt.icon}
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">{opt.label}</p>
                    <p className="text-[10px] text-zinc-500">{opt.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                  className={`w-9 h-5 rounded-full transition-colors ${config[opt.key] ? 'bg-violet-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform mt-[3px] ${config[opt.key] ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-2"><AlertTriangle size={14} /> Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-900 dark:text-white">Clear Build History</p>
              <p className="text-[10px] text-zinc-500">Remove all build records and artifacts</p>
            </div>
            <button
              onClick={() => { setBuilds([]); setActiveBuild(null); setLogs([]); loadBuilds(); }}
              className="px-4 py-1.5 bg-red-500/15 hover:bg-red-500/25 rounded-lg text-[10px] font-semibold text-red-400 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Tab: Share ──────────────────────────────────────────────

  const renderShare = () => (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Share Controls */}
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Share2 size={14} className="text-indigo-400" /> Share Build</h3>
          <p className="text-xs text-zinc-400">Create shareable links to your build artifacts and reports.</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleCreateShareLink('latest', true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 rounded-lg text-xs font-medium text-indigo-300 transition-colors"
            >
              <Globe size={12} /> Public Link
            </button>
            <button
              onClick={() => handleCreateShareLink('latest', false)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500/15 hover:bg-violet-500/25 rounded-lg text-xs font-medium text-violet-300 transition-colors"
            >
              <Link size={12} /> Private Link
            </button>
          </div>
        </div>

        {/* Active Links */}
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Links</h3>
          {shareLinks.length === 0 ? (
            <div className="text-center py-8">
              <Link size={24} className="mx-auto text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-500">No share links created yet</p>
            </div>
          ) : shareLinks.map(link => (
            <div key={link.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-white/[0.04]">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${link.isPublic ? 'bg-indigo-500/15 text-indigo-400' : 'bg-violet-500/15 text-violet-400'}`}>
                {link.isPublic ? <Globe size={14} /> : <Link size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-900 dark:text-white font-mono truncate">{link.url}</p>
                <p className="text-[10px] text-zinc-500">{link.isPublic ? 'Public' : 'Private'} · Expires {timeAgo(link.expiresAt)}</p>
              </div>
              <button
                onClick={() => handleCopy(link.url, link.id)}
                className="p-1.5 rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {copiedId === link.id ? <Check size={14} className="text-violet-400" /> : <Copy size={14} />}
              </button>
              <button
                onClick={() => setShareLinks(prev => prev.filter(l => l.id !== link.id))}
                className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Tab Buttons Config ──────────────────────────────────────────

  const tabs: { id: BuildTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'pipeline', label: 'Pipeline', icon: <Cpu size={14} /> },
    { id: 'history', label: 'History', icon: <Clock size={14} />, count: builds.length },
    { id: 'artifacts', label: 'Artifacts', icon: <Archive size={14} />, count: buildsWithArtifacts.length },
    { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
    { id: 'share', label: 'Share', icon: <Share2 size={14} />, count: shareLinks.length },
  ];

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-[#0a0a0a] ${className}`}>
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 dark:border-white/[0.06] shrink-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/25'
                : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === tab.id ? 'bg-violet-500/30 text-violet-200' : 'bg-slate-200 dark:bg-white/[0.06] text-zinc-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}

        {/* Right side — build count */}
        <div className="ml-auto flex items-center gap-3">
          {isBuilding && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/15 rounded-full text-[10px] text-indigo-300 font-semibold">
              <Loader2 size={10} className="animate-spin" /> Building...
            </span>
          )}
          <span className="text-[10px] text-zinc-600">{builds.length} builds</span>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pipeline' && renderPipeline()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'artifacts' && renderArtifacts()}
      {activeTab === 'settings' && renderSettings()}
      {activeTab === 'share' && renderShare()}
    </div>
  );
};

export default BuildPanel;
