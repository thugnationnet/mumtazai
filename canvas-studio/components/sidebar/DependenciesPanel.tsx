/**
 * DependenciesPanel — NPM dependencies management
 * Self-contained: fetches from /api/canvas-deps/:projectId
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface Dependency {
  name: string;
  version: string;
  latestVersion?: string;
  isDev: boolean;
  description?: string;
  hasUpdate?: boolean;
}

interface VulnerabilitySummary {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  info: number;
}

type VulnerabilityMap = Record<string, VulnerabilitySummary>;

interface DependenciesPanelProps {
  projectId: string;
  className?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  info: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

const DependenciesPanel: React.FC<DependenciesPanelProps> = ({
  projectId,
  className = '',
}) => {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityMap | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPackage, setNewPackage] = useState('');
  const [isDev, setIsDev] = useState(false);
  const [showDeps, setShowDeps] = useState(true);
  const [showDevDeps, setShowDevDeps] = useState(true);

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(`/api/canvas-deps/${projectId}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    return res.json();
  }, [projectId]);

  // Load deps
  const loadDeps = useCallback(async () => {
    if (!projectId || projectId === 'default') { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api('');
      if (data.success) setDependencies(data.dependencies || []);
    } catch {}
    finally { setLoading(false); }
  }, [projectId, api]);

  useEffect(() => { loadDeps(); }, [loadDeps]);

  const prodDeps = useMemo(() => dependencies.filter((d) => !d.isDev), [dependencies]);
  const devDeps = useMemo(() => dependencies.filter((d) => d.isDev), [dependencies]);
  const updatable = useMemo(() => dependencies.filter((d) => d.hasUpdate), [dependencies]);

  const filteredProd = prodDeps.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDev = devDeps.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newPackage.trim()) return;
    setIsInstalling(true);
    try {
      const data = await api('/add', {
        method: 'POST',
        body: JSON.stringify({ name: newPackage.trim(), isDev }),
      });
      if (data.success) {
        setDependencies(data.dependencies || []);
        setNewPackage('');
        setShowAddForm(false);
      }
    } catch {}
    finally { setIsInstalling(false); }
  };

  const handleRemove = async (name: string) => {
    setIsInstalling(true);
    try {
      const data = await api('/remove', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (data.success) setDependencies(data.dependencies || []);
    } catch {}
    finally { setIsInstalling(false); }
  };

  const handleUpdate = async (name: string) => {
    setIsInstalling(true);
    try {
      const data = await api('/update', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (data.success) setDependencies(data.dependencies || []);
    } catch {}
    finally { setIsInstalling(false); }
  };

  const handleUpdateAll = async () => {
    setIsInstalling(true);
    try {
      const data = await api('/update-all', { method: 'POST' });
      if (data.success) setDependencies(data.dependencies || []);
    } catch {}
    finally { setIsInstalling(false); }
  };

  const handleSecurityScan = async () => {
    setIsScanning(true);
    try {
      const data = await api('/audit', { method: 'POST' });
      if (data.success) setVulnerabilities(data.vulnerabilities || {});
    } catch {}
    finally { setIsScanning(false); }
  };

  const DepRow: React.FC<{ dep: Dependency }> = ({ dep }) => {
    const vulns = vulnerabilities?.[dep.name];
    const hasVulns = vulns && (vulns.critical + vulns.high + vulns.moderate + vulns.low) > 0;
    const worstSeverity = vulns?.critical > 0 ? 'critical' : vulns?.high > 0 ? 'high' : vulns?.moderate > 0 ? 'moderate' : vulns?.low > 0 ? 'low' : null;
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        className="flex flex-col px-3 py-1.5 hover:bg-white/[0.02] group"
      >
        <div className="flex items-center">
          <Package className="w-3 h-3 text-slate-600 mr-2 shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{dep.name}</span>
              {dep.hasUpdate && (
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" title="Update available" />
              )}
              {hasVulns && worstSeverity && (
                <span className={`text-[9px] px-1 py-0.5 rounded border font-semibold shrink-0 ${SEVERITY_COLORS[worstSeverity]}`}>
                  {worstSeverity}
                </span>
              )}
            </div>
          </div>

          <span className="text-[10px] text-slate-600 font-mono mr-1">{dep.version}</span>

          {dep.hasUpdate && dep.latestVersion && (
            <span className="text-[10px] text-violet-400/60 font-mono mr-2">
              → {dep.latestVersion}
            </span>
          )}

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {dep.hasUpdate && (
              <button
                onClick={() => handleUpdate(dep.name)}
                className="p-0.5 text-violet-400/60 hover:text-violet-400 transition-colors"
                title="Update"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
            )}
            <a
              href={`https://npmjs.com/package/${encodeURIComponent(dep.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-0.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              title="View on npm"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => handleRemove(dep.name)}
              className="p-0.5 text-slate-500 hover:text-red-400 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {/* Vulnerability detail row */}
        {hasVulns && vulns && (
          <div className="ml-5 mt-1 flex items-center gap-1 flex-wrap">
            {vulns.critical > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${SEVERITY_COLORS.critical}`}>{vulns.critical} critical</span>}
            {vulns.high > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${SEVERITY_COLORS.high}`}>{vulns.high} high</span>}
            {vulns.moderate > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${SEVERITY_COLORS.moderate}`}>{vulns.moderate} moderate</span>}
            {vulns.low > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${SEVERITY_COLORS.low}`}>{vulns.low} low</span>}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-[#0a0a0c] ${className}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-2">
        <Package className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Dependencies</span>
        <span className="text-[10px] text-slate-600">({dependencies.length})</span>
        <div className="flex-1" />

        {isInstalling && (
          <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
        )}

        {updatable.length > 0 && (
          <button
            onClick={handleUpdateAll}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 transition-colors"
          >
            <ArrowUp className="w-2.5 h-2.5" />
            {updatable.length}
          </button>
        )}

        <button
          onClick={handleSecurityScan}
          disabled={isScanning}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          title="Run security audit"
        >
          {isScanning ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <ShieldAlert className="w-2.5 h-2.5" />}
          Audit
        </button>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1 text-slate-500 hover:text-violet-400 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Vulnerability summary banner */}
      {vulnerabilities && (() => {
        const totals = Object.values(vulnerabilities).reduce((acc, v) => ({
          critical: acc.critical + (v.critical || 0),
          high: acc.high + (v.high || 0),
          moderate: acc.moderate + (v.moderate || 0),
          low: acc.low + (v.low || 0),
        }), { critical: 0, high: 0, moderate: 0, low: 0 });
        const total = totals.critical + totals.high + totals.moderate + totals.low;
        if (total === 0) return (
          <div className="px-3 py-1.5 bg-violet-500/5 border-b border-violet-500/10 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-violet-500/60 shrink-0" />
            <span className="text-[10px] text-violet-500/70">No vulnerabilities found</span>
          </div>
        );
        return (
          <div className="px-3 py-1.5 bg-red-500/5 border-b border-red-500/10 flex items-center gap-2 flex-wrap">
            <ShieldAlert className="w-3 h-3 text-red-400/70 shrink-0" />
            <span className="text-[10px] text-red-400/80">{total} vuln{total !== 1 ? 's' : ''}</span>
            {totals.critical > 0 && <span className="text-[9px] px-1 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400">{totals.critical} critical</span>}
            {totals.high > 0 && <span className="text-[9px] px-1 py-0.5 rounded border border-orange-500/30 bg-orange-500/10 text-orange-400">{totals.high} high</span>}
            {totals.moderate > 0 && <span className="text-[9px] px-1 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">{totals.moderate} mod</span>}
            {totals.low > 0 && <span className="text-[9px] px-1 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">{totals.low} low</span>}
          </div>
        );
      })()}

      {/* Search */}
      <div className="px-3 py-1.5 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-2 py-1 gap-1.5">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packages..."
            className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-none placeholder-gray-600"
          />
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-200 dark:border-white/[0.06] overflow-hidden"
          >
            <div className="p-3 space-y-2">
              <input
                type="text"
                value={newPackage}
                onChange={(e) => setNewPackage(e.target.value)}
                placeholder="package-name or package@version"
                className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono placeholder-gray-600 outline-none focus:border-violet-500/30"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDev}
                    onChange={(e) => setIsDev(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isDev
                        ? 'bg-violet-500/20 border-violet-500/40'
                        : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]'
                    }`}
                  >
                    {isDev && <Check className="w-2.5 h-2.5 text-violet-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500">Dev dependency</span>
                </label>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1 rounded-lg text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/[0.04]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newPackage.trim()}
                    className="px-3 py-1 rounded-lg text-[10px] font-medium bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white disabled:opacity-30"
                  >
                    Install
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deps lists */}
      <div className="flex-1 overflow-y-auto">
        {/* Production */}
        <div>
          <button
            onClick={() => setShowDeps(!showDeps)}
            className="w-full flex items-center px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            {showDeps ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
            dependencies
            <span className="ml-1.5 text-[10px] text-slate-600">({filteredProd.length})</span>
          </button>
          <AnimatePresence>
            {showDeps && filteredProd.map((dep) => <DepRow key={dep.name} dep={dep} />)}
          </AnimatePresence>
        </div>

        {/* Dev */}
        <div>
          <button
            onClick={() => setShowDevDeps(!showDevDeps)}
            className="w-full flex items-center px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            {showDevDeps ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
            devDependencies
            <span className="ml-1.5 text-[10px] text-slate-600">({filteredDev.length})</span>
          </button>
          <AnimatePresence>
            {showDevDeps && filteredDev.map((dep) => <DepRow key={dep.name} dep={dep} />)}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DependenciesPanel;
