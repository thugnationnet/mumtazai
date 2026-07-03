/**
 * EnvironmentVars — Environment variable management panel
 * Self-contained: fetches from /api/canvas-env/:projectId
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Lock,
  AlertTriangle,
  X,
  Upload,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';

interface EnvVariable {
  key: string;
  value: string;
  isSecret: boolean;
  description?: string;
}

interface EnvironmentVarsProps {
  projectId: string;
  className?: string;
}

const EnvironmentVars: React.FC<EnvironmentVarsProps> = ({ projectId, className = '' }) => {
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newIsSecret, setNewIsSecret] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(`/api/canvas-env/${projectId}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    return res.json();
  }, [projectId]);

  // Load env vars
  const loadVars = useCallback(async () => {
    if (!projectId || projectId === 'default') { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api('');
      if (data.success && Array.isArray(data.variables)) {
        setVariables(data.variables);
      }
    } catch {}
    finally { setLoading(false); }
  }, [projectId, api]);

  useEffect(() => { loadVars(); }, [loadVars]);

  const filtered = variables.filter((v) =>
    v.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyValue = useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  }, []);

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    if (variables.some((v) => v.key === newKey.trim())) return;
    setActionLoading(true);
    try {
      const data = await api('', {
        method: 'PATCH',
        body: JSON.stringify({ key: newKey.trim(), value: newValue, isSecret: newIsSecret }),
      });
      if (data.success) {
        await loadVars();
        setNewKey('');
        setNewValue('');
        setNewIsSecret(true);
        setShowAddForm(false);
      }
    } catch {}
    finally { setActionLoading(false); }
  };

  const handleDelete = async (key: string) => {
    setActionLoading(true);
    try {
      const data = await api(`/${encodeURIComponent(key)}`, { method: 'DELETE' });
      if (data.success) {
        setVariables((prev) => prev.filter((v) => v.key !== key));
      }
    } catch {}
    finally { setActionLoading(false); }
  };

  const handleUpdate = async (key: string, field: 'key' | 'value', value: string) => {
    if (field === 'value') {
      const variable = variables.find((v) => v.key === key);
      if (!variable) return;
      try {
        await api('', {
          method: 'PATCH',
          body: JSON.stringify({ key, value, isSecret: variable.isSecret }),
        });
        setVariables((prev) => prev.map((v) => v.key === key ? { ...v, value } : v));
      } catch {}
    }
  };

  const maskValue = (val: string) => '•'.repeat(Math.min(val.length, 20));

  const exportEnv = async () => {
    try {
      const res = await fetch(`/api/canvas-env/${projectId}/export`, { credentials: 'include' });
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '.env';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
  };

  const importEnv = async (text: string) => {
    const newVars: EnvVariable[] = [];
    text.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!key.match(/^[A-Z0-9_]+$/i)) return;
      if (!variables.some((v) => v.key === key) && !newVars.some((v) => v.key === key)) {
        newVars.push({ key, value, isSecret: false });
      }
    });
    if (newVars.length > 0) {
      // Bulk import by pushing all new vars via PUT
      setActionLoading(true);
      try {
        const allVars = [...variables, ...newVars];
        const data = await api('', {
          method: 'PUT',
          body: JSON.stringify({ variables: allVars }),
        });
        if (data.success) {
          await loadVars();
        }
      } catch {}
      finally { setActionLoading(false); }
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') importEnv(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className={`flex flex-col h-full bg-[#0a0a0c] ${className}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-2">
        <Key className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Environment Variables</span>
        <span className="text-[10px] text-slate-600">({variables.length})</span>
        <div className="flex-1" />
        {variables.length > 0 && (
          <button
            onClick={exportEnv}
            className="p-1 text-slate-500 hover:text-violet-400 transition-colors"
            title="Export .env file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1 text-slate-500 hover:text-violet-400 transition-colors"
          title="Import .env file"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".env,text/plain"
          className="sr-only"
          onChange={handleFileImport}
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1 text-slate-500 hover:text-violet-400 transition-colors"
          title="Add variable"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-1.5 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-2 py-1 gap-1.5">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search variables..."
            className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-none placeholder-gray-600"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}
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
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="VARIABLE_NAME"
                className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono placeholder-gray-600 outline-none focus:border-violet-500/30"
              />
              <input
                type={newIsSecret ? 'password' : 'text'}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Value..."
                className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono placeholder-gray-600 outline-none focus:border-violet-500/30"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsSecret}
                    onChange={(e) => setNewIsSecret(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      newIsSecret
                        ? 'bg-violet-500/20 border-violet-500/40'
                        : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]'
                    }`}
                  >
                    {newIsSecret && <Check className="w-2.5 h-2.5 text-violet-400" />}
                  </div>
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] text-slate-500">Secret</span>
                </label>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1 rounded-lg text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/[0.04] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newKey.trim()}
                    className="px-3 py-1 rounded-lg text-[10px] font-medium bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white disabled:opacity-30 transition-opacity"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variables list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2 p-4">
            <Key className="w-6 h-6 opacity-40" />
            <span className="text-xs">
              {searchQuery ? 'No matching variables' : 'No environment variables'}
            </span>
            {!searchQuery && (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-[10px] text-violet-400 hover:text-violet-300"
              >
                Add your first variable
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((variable) => {
              const isRevealed = revealedKeys.has(variable.key);
              const isCopied = copiedKey === variable.key;

              return (
                <motion.div
                  key={variable.key}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-white/[0.04] px-3 py-2 hover:bg-white/[0.02] group"
                >
                  <div className="flex items-center gap-2">
                    {variable.isSecret ? (
                      <Lock className="w-3 h-3 text-amber-500/60 shrink-0" />
                    ) : (
                      <Key className="w-3 h-3 text-slate-500 shrink-0" />
                    )}

                    <span className="text-xs text-violet-400 font-mono font-medium flex-1 truncate">
                      {variable.key}
                    </span>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {variable.isSecret && (
                        <button
                          onClick={() => toggleReveal(variable.key)}
                          className="p-0.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                          {isRevealed ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => copyValue(variable.key, variable.value)}
                        className="p-0.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-violet-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(variable.key)}
                        className="p-0.5 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-1 ml-5">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {variable.isSecret && !isRevealed
                        ? maskValue(variable.value)
                        : variable.value || '(empty)'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer warning */}
      <div className="px-3 py-1.5 bg-amber-500/[0.03] border-t border-amber-500/10 flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3 text-amber-500/60 shrink-0" />
        <span className="text-[10px] text-amber-500/60">
          Secrets are encrypted at rest
        </span>
      </div>
    </div>
  );
};

export default EnvironmentVars;
