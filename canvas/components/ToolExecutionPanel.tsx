/**
 * ToolExecutionPanel — Production-grade reusable tool panel
 * 
 * Every tool category uses this component. It provides:
 * - Tool selector list with search
 * - Dynamic form fields per tool
 * - Direct execution against /api/agent/run-tool
 * - Real-time output preview (HTML, JSON, markdown, table, logs)
 * - Execution history with re-run, delete, download, share
 * - Copy, download, export actions on results
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fetchWithCredentials } from '../fetchUtil';

// ============================================================================
// TYPES
// ============================================================================

export interface ToolField {
  key: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'file' | 'json' | 'color' | 'range';
  label: string;
  placeholder?: string;
  options?: string[];
  default?: any;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  helperText?: string;
}

export interface ToolDefinition {
  id: string;
  icon: string;
  label: string;
  desc: string;
  color: string;
  fields: ToolField[];
  /** Build the API input from form values */
  buildInput: (values: Record<string, any>) => Record<string, any>;
  /** Optional: custom output renderer */
  renderOutput?: (result: any) => React.ReactNode;
  /** Mark as dangerous — shows confirmation before executing */
  dangerous?: boolean;
}

export interface ExecutionRecord {
  id: string;
  tool: string;
  toolLabel: string;
  toolIcon: string;
  input: Record<string, any>;
  result: any;
  sideEffects: any;
  success: boolean;
  executionMs: number;
  timestamp: number;
}

export interface ToolExecutionPanelProps {
  categoryTitle: string;
  categorySubtitle: string;
  categoryColor: string;
  tools: ToolDefinition[];
  onClose?: () => void;
  /** Called when a result should be previewed in the main preview pane */
  onPreviewContent?: (content: any) => void;
  /** Fallback: send prompt to AI chat agent */
  onRunTool?: (message: string) => void;
}

// ============================================================================
// COLOR SYSTEM
// ============================================================================

const COLOR: Record<string, string> = {
  amber:    'text-amber-400 border-amber-500/30 bg-amber-500/10',
  green:    'text-violet-600 dark:text-violet-400 border-violet-500/30 bg-green-500/10',
  purple:   'text-purple-400 border-purple-500/30 bg-purple-500/10',
  cyan:     'text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-cyan-500/10',
  orange:   'text-orange-400 border-orange-500/30 bg-orange-500/10',
  red:      'text-red-400 border-red-500/30 bg-red-500/10',
  blue:     'text-blue-400 border-blue-500/30 bg-blue-500/10',
  pink:     'text-pink-400 border-pink-500/30 bg-pink-500/10',
  teal:     'text-teal-400 border-teal-500/30 bg-teal-500/10',
  violet:   'text-violet-400 border-violet-500/30 bg-violet-500/10',
  indigo:   'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  emerald:  'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  lime:     'text-lime-400 border-lime-500/30 bg-lime-500/10',
  rose:     'text-rose-400 border-rose-500/30 bg-rose-500/10',
  sky:      'text-sky-400 border-sky-500/30 bg-sky-500/10',
};

const SOLID_BG: Record<string, string> = {
  amber: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
  green: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500',
  purple: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500',
  cyan: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500',
  orange: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500',
  red: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500',
  blue: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500',
  pink: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500',
  teal: 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500',
  violet: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
  indigo: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500',
  emerald: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
  lime: 'bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-500 hover:to-green-500',
  rose: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500',
  sky: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500',
};

const TITLE_COLOR: Record<string, string> = {
  amber: 'text-amber-500/80', green: 'text-green-500/80', purple: 'text-purple-500/80',
  cyan: 'text-cyan-500/80', orange: 'text-orange-500/80', red: 'text-red-500/80',
  blue: 'text-blue-500/80', pink: 'text-pink-500/80', teal: 'text-teal-500/80',
  violet: 'text-violet-500/80', indigo: 'text-indigo-500/80', emerald: 'text-emerald-500/80',
  lime: 'text-lime-500/80', rose: 'text-rose-500/80', sky: 'text-sky-500/80',
};

// ============================================================================
// COMPONENT
// ============================================================================

type PanelView = 'tools' | 'form' | 'output' | 'history';

const ToolExecutionPanel: React.FC<ToolExecutionPanelProps> = ({
  categoryTitle,
  categorySubtitle,
  categoryColor,
  tools,
  onClose,
  onPreviewContent,
  onRunTool,
}) => {
  // State
  const [view, setView] = useState<PanelView>('tools');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentResult, setCurrentResult] = useState<ExecutionRecord | null>(null);
  const [history, setHistory] = useState<ExecutionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const activeTool = tools.find(t => t.id === activeToolId);
  const titleColor = TITLE_COLOR[categoryColor] || 'text-cyan-500/80';
  const solidBg = SOLID_BG[categoryColor] || SOLID_BG.cyan;

  // Load history from server on mount
  useEffect(() => {
    fetchWithCredentials('/api/agent/tool-history?limit=100')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.items) {
          // Filter to tools in this category
          const toolIds = new Set(tools.map(t => t.id));
          const filtered = data.items.filter((h: any) => toolIds.has(h.tool)).map((h: any) => ({
            ...h,
            toolLabel: tools.find(t => t.id === h.tool)?.label || h.tool,
            toolIcon: tools.find(t => t.id === h.tool)?.icon || '🔧',
          }));
          setHistory(filtered);
        }
      })
      .catch(() => {});
  }, []);

  // Search filter
  const filteredTools = searchQuery
    ? tools.filter(t =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tools;

  // Select a tool
  const selectTool = useCallback((toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    setActiveToolId(toolId);
    const defaults: Record<string, any> = {};
    tool.fields.forEach(f => {
      if (f.default !== undefined) defaults[f.key] = f.default;
      else if (f.type === 'checkbox') defaults[f.key] = false;
      else defaults[f.key] = '';
    });
    setValues(defaults);
    setCurrentResult(null);
    setView('form');
  }, [tools]);

  // Execute tool
  const executeTool = useCallback(async (confirmed = false) => {
    if (!activeTool || isExecuting) return;

    // Client-side confirmation gate for dangerous tools
    if (activeTool.dangerous && !confirmed && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);
    setIsExecuting(true);

    try {
      const input = activeTool.buildInput(values);
      const res = await fetchWithCredentials('/api/agent/run-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: activeTool.id, input, confirmed: confirmed || !activeTool.dangerous }),
      });

      const data = await res.json();

      // Backend may also gate with requiresConfirmation
      if (data.requiresConfirmation && !confirmed) {
        setShowConfirm(true);
        setIsExecuting(false);
        return;
      }

      const record: ExecutionRecord = {
        id: data.id || `local_${Date.now()}`,
        tool: activeTool.id,
        toolLabel: activeTool.label,
        toolIcon: activeTool.icon,
        input: values,
        result: data.result,
        sideEffects: data.sideEffects,
        success: data.success !== false,
        executionMs: data.executionMs || 0,
        timestamp: data.timestamp || Date.now(),
      };

      setCurrentResult(record);
      setHistory(prev => [record, ...prev]);
      setView('output');

      // Push to preview pane
      if (onPreviewContent) {
        const previewHtml = buildPreviewHtml(activeTool, record);
        onPreviewContent({
          type: 'html',
          title: activeTool.label,
          icon: activeTool.icon,
          subtitle: record.success ? `Completed in ${record.executionMs}ms` : 'Execution failed',
          html: previewHtml,
        });
      }
    } catch (err: any) {
      const record: ExecutionRecord = {
        id: `err_${Date.now()}`,
        tool: activeTool.id,
        toolLabel: activeTool.label,
        toolIcon: activeTool.icon,
        input: values,
        result: { error: err.message || 'Network error' },
        sideEffects: null,
        success: false,
        executionMs: 0,
        timestamp: Date.now(),
      };
      setCurrentResult(record);
      setHistory(prev => [record, ...prev]);
      setView('output');
    } finally {
      setIsExecuting(false);
    }
  }, [activeTool, values, isExecuting, showConfirm, onPreviewContent]);

  // Re-run from history
  const rerunFromHistory = useCallback((record: ExecutionRecord) => {
    const tool = tools.find(t => t.id === record.tool);
    if (!tool) return;
    setActiveToolId(record.tool);
    setValues(record.input);
    setCurrentResult(null);
    setView('form');
  }, [tools]);

  // Delete history entry
  const deleteHistoryEntry = useCallback(async (id: string) => {
    await fetchWithCredentials(`/api/agent/tool-history/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    setHistory(prev => prev.filter(h => h.id !== id));
  }, []);

  // Clear all history
  const clearHistory = useCallback(async () => {
    await fetchWithCredentials('/api/agent/tool-history', { method: 'DELETE' }).catch(() => {});
    setHistory([]);
  }, []);

  // Copy result to clipboard
  const copyResult = useCallback((data: any) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  }, []);

  // Download result as file
  const downloadResult = useCallback((data: any, filename: string) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Share result (Web Share API)
  const shareResult = useCallback(async (record: ExecutionRecord) => {
    const text = typeof record.result === 'string' ? record.result : JSON.stringify(record.result, null, 2);
    if (navigator.share) {
      await navigator.share({
        title: `${record.toolLabel} Result`,
        text: text.slice(0, 2000),
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopyFeedback('Link copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  }, []);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111]/95">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between shrink-0 border-b border-slate-200 dark:border-slate-800/50">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <h3 className={`text-xs font-bold ${titleColor} uppercase tracking-widest`}>
              {categoryTitle}
            </h3>
            <p className="text-[10px] text-gray-600 mt-0.5">{categorySubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Tab navigation */}
          <div className="flex gap-1 bg-black/30 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800/50">
            <button
              onClick={() => { setView('tools'); setCurrentResult(null); }}
              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${
                view === 'tools' ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-gray-500 hover:text-slate-700 dark:text-slate-300'
              }`}
            >Tools</button>
            {activeTool && (
              <button
                onClick={() => setView('form')}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  view === 'form' ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-gray-500 hover:text-slate-700 dark:text-slate-300'
                }`}
              >Input</button>
            )}
            {currentResult && (
              <button
                onClick={() => setView('output')}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  view === 'output' ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-gray-500 hover:text-slate-700 dark:text-slate-300'
                }`}
              >Output</button>
            )}
            <button
              onClick={() => setView('history')}
              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all relative ${
                view === 'history' ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-gray-500 hover:text-slate-700 dark:text-slate-300'
              }`}
            >
              History
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 text-[7px] font-bold text-black rounded-full flex items-center justify-center">
                  {history.length > 99 ? '99+' : history.length}
                </span>
              )}
            </button>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-600 hover:text-slate-900 dark:hover:text-white transition-colors p-1" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Copy feedback toast */}
      {copyFeedback && (
        <div className="absolute top-12 right-4 z-50 bg-emerald-500/90 text-slate-900 dark:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg animate-pulse">
          {copyFeedback}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {/* ═══ TOOLS LIST VIEW ═══ */}
        {view === 'tools' && (
          <div className="px-4 pb-6 pt-3">
            {/* Search */}
            <div className="relative mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-300 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg pl-9 pr-3 py-2 focus:border-gray-600 focus:outline-none placeholder-gray-700"
              />
            </div>

            <div className="space-y-2">
              {filteredTools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => selectTool(tool.id)}
                  className="w-full text-left p-3.5 bg-black/30 hover:bg-black/50 border border-slate-200 dark:border-slate-800 hover:border-gray-600 rounded-lg transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5 shrink-0">{tool.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-white">{tool.label}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${COLOR[tool.color] || COLOR.cyan}`}>
                          {tool.id}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{tool.desc}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700 group-hover:text-white shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
              {filteredTools.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-xs">No tools matching "{searchQuery}"</div>
              )}
            </div>
          </div>
        )}

        {/* ═══ INPUT FORM VIEW ═══ */}
        {view === 'form' && activeTool && (
          <div className="px-4 pb-6 pt-3 space-y-4">
            {/* Tool header */}
            <div className="p-3.5 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{activeTool.icon}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{activeTool.label}</span>
                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${COLOR[activeTool.color] || COLOR.cyan}`}>
                  {activeTool.id}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">{activeTool.desc}</p>
            </div>

            {/* Dynamic form fields */}
            {activeTool.fields.map(field => (
              <div key={field.key}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {field.helperText && (
                  <p className="text-[9px] text-gray-600 mb-1.5">{field.helperText}</p>
                )}

                {field.type === 'select' && (
                  <select
                    value={values[field.key] ?? ''}
                    onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-3 py-2 focus:border-gray-500 focus:outline-none"
                  >
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}

                {field.type === 'text' && (
                  <input
                    type="text"
                    placeholder={field.placeholder || ''}
                    value={values[field.key] ?? ''}
                    onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-3 py-2 focus:border-gray-500 focus:outline-none"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows={field.rows || 4}
                    placeholder={field.placeholder || ''}
                    value={values[field.key] ?? ''}
                    onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono rounded-lg px-3 py-2 focus:border-gray-500 focus:outline-none resize-y"
                    style={{ minHeight: '80px' }}
                  />
                )}

                {field.type === 'json' && (
                  <textarea
                    rows={field.rows || 6}
                    placeholder={field.placeholder || '{\n  "key": "value"\n}'}
                    value={values[field.key] ?? ''}
                    onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono rounded-lg px-3 py-2 focus:border-gray-500 focus:outline-none resize-y"
                    style={{ minHeight: '100px' }}
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder || ''}
                    value={values[field.key] ?? ''}
                    onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-3 py-2 focus:border-gray-500 focus:outline-none"
                  />
                )}

                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!values[field.key]}
                      onChange={e => setValues(p => ({ ...p, [field.key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600 bg-slate-400 dark:bg-black/50 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{field.placeholder || 'Enable'}</span>
                  </label>
                )}

                {field.type === 'range' && (
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={field.min || 0}
                      max={field.max || 100}
                      step={field.step || 1}
                      value={values[field.key] ?? field.default ?? 50}
                      onChange={e => setValues(p => ({ ...p, [field.key]: Number(e.target.value) }))}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono w-12 text-right">{values[field.key] ?? field.default ?? 50}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Confirmation dialog for dangerous tools */}
            {showConfirm && (
              <div className="border border-red-500/40 bg-red-500/10 rounded-lg p-3 space-y-2">
                <p className="text-xs text-red-400 font-bold">⚠️ Confirm Execution</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="text-red-300 font-semibold">{activeTool.label}</span> is a destructive/sensitive operation. Are you sure?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => executeTool(true)}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-slate-900 dark:text-white text-[10px] font-bold rounded-lg uppercase tracking-wider"
                  >
                    Confirm & Execute
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-gray-600 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Execute button */}
            <button
              onClick={() => executeTool()}
              disabled={isExecuting}
              className={`w-full py-3 ${solidBg} disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 dark:text-white text-xs font-bold rounded-lg uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2`}
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Executing...
                </>
              ) : (
                <>▶ Execute {activeTool.label}</>
              )}
            </button>

            {/* Additional context for AI agent */}
            <div className="border-t border-slate-200 dark:border-slate-800/50 pt-3">
              <p className="text-[9px] text-gray-600 mb-2 uppercase tracking-wider font-bold">Additional Context (Optional)</p>
              <textarea
                rows={2}
                placeholder="Add extra instructions for the AI agent..."
                value={values._additionalContext ?? ''}
                onChange={e => setValues(p => ({ ...p, _additionalContext: e.target.value }))}
                className="w-full bg-black/30 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] rounded-lg px-3 py-2 focus:border-gray-600 focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* ═══ OUTPUT VIEW ═══ */}
        {view === 'output' && currentResult && (
          <div className="px-4 pb-6 pt-3 space-y-3" ref={outputRef}>
            {/* Status bar */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              currentResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentResult.toolIcon}</span>
                <div>
                  <span className={`text-xs font-bold ${currentResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentResult.success ? '✓ Completed' : '✗ Failed'}
                  </span>
                  <span className="text-[10px] text-gray-500 ml-2">
                    {currentResult.executionMs}ms
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-gray-600 font-mono">
                {new Date(currentResult.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => copyResult(currentResult.result)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-300 dark:bg-black/40 border border-slate-300 dark:border-slate-700 hover:border-gray-500 text-[10px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all font-bold uppercase tracking-wider"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <button
                onClick={() => downloadResult(currentResult.result, `${currentResult.tool}-${Date.now()}.json`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-300 dark:bg-black/40 border border-slate-300 dark:border-slate-700 hover:border-gray-500 text-[10px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all font-bold uppercase tracking-wider"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={() => shareResult(currentResult)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-300 dark:bg-black/40 border border-slate-300 dark:border-slate-700 hover:border-gray-500 text-[10px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all font-bold uppercase tracking-wider"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button
                onClick={() => rerunFromHistory(currentResult)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-300 dark:bg-black/40 border border-slate-300 dark:border-slate-700 hover:border-gray-500 text-[10px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all font-bold uppercase tracking-wider"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Re-run
              </button>
              {typeof currentResult.result === 'string' && currentResult.result.includes('<') && (
                <button
                  onClick={() => downloadResult(currentResult.result, `${currentResult.tool}-${Date.now()}.html`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-300 dark:bg-black/40 border border-slate-300 dark:border-slate-700 hover:border-gray-500 text-[10px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all font-bold uppercase tracking-wider"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Export HTML
                </button>
              )}
            </div>

            {/* Input summary */}
            <details className="group">
              <summary className="text-[10px] text-gray-500 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Input Parameters
              </summary>
              <div className="mt-2 p-3 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg">
                <pre className="text-[10px] text-slate-500 dark:text-slate-400 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(currentResult.input, null, 2)}
                </pre>
              </div>
            </details>

            {/* Result output */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-300 dark:bg-black/40 px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Output</span>
                <span className="text-[9px] text-gray-600 font-mono">
                  {typeof currentResult.result === 'string' ? `${currentResult.result.length} chars` : 'JSON'}
                </span>
              </div>
              <div className="p-3 max-h-[400px] overflow-y-auto">
                {activeTool?.renderOutput ? (
                  activeTool.renderOutput(currentResult.result)
                ) : (
                  <ResultRenderer result={currentResult.result} />
                )}
              </div>
            </div>

            {/* Side effects */}
            {currentResult.sideEffects && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Side Effects</span>
                <pre className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 whitespace-pre-wrap">
                  {JSON.stringify(currentResult.sideEffects, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY VIEW ═══ */}
        {view === 'history' && (
          <div className="px-4 pb-6 pt-3">
            {history.length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {history.length} execution{history.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={clearHistory}
                  className="text-[9px] text-red-400/70 hover:text-red-400 font-bold uppercase tracking-wider transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}

            <div className="space-y-2">
              {history.map(record => (
                <div key={record.id} className="p-3 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:border-slate-700 transition-all group">
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{record.toolIcon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{record.toolLabel}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                          record.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {record.success ? 'OK' : 'FAIL'}
                        </span>
                        <span className="text-[9px] text-gray-600">{record.executionMs}ms</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">
                        {typeof record.result === 'string'
                          ? record.result.slice(0, 120)
                          : JSON.stringify(record.result).slice(0, 120)
                        }
                      </p>
                      <span className="text-[9px] text-gray-700 font-mono mt-1 block">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setCurrentResult(record); setActiveToolId(record.tool); setView('output'); }}
                      className="text-[9px] text-indigo-600 dark:text-indigo-400/70 hover:text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider transition-colors"
                    >View</button>
                    <span className="text-gray-800">·</span>
                    <button
                      onClick={() => rerunFromHistory(record)}
                      className="text-[9px] text-amber-400/70 hover:text-amber-400 font-bold uppercase tracking-wider transition-colors"
                    >Re-run</button>
                    <span className="text-gray-800">·</span>
                    <button
                      onClick={() => copyResult(record.result)}
                      className="text-[9px] text-slate-500 dark:text-slate-400/70 hover:text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider transition-colors"
                    >Copy</button>
                    <span className="text-gray-800">·</span>
                    <button
                      onClick={() => downloadResult(record.result, `${record.tool}-${record.id}.json`)}
                      className="text-[9px] text-slate-500 dark:text-slate-400/70 hover:text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider transition-colors"
                    >Download</button>
                    <span className="text-gray-800">·</span>
                    <button
                      onClick={() => shareResult(record)}
                      className="text-[9px] text-slate-500 dark:text-slate-400/70 hover:text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider transition-colors"
                    >Share</button>
                    <span className="text-gray-800">·</span>
                    <button
                      onClick={() => deleteHistoryEntry(record.id)}
                      className="text-[9px] text-red-400/70 hover:text-red-400 font-bold uppercase tracking-wider transition-colors"
                    >Delete</button>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3 opacity-30">📋</div>
                  <p className="text-xs text-gray-600">No execution history yet</p>
                  <p className="text-[10px] text-gray-700 mt-1">Run a tool to see results here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// RESULT RENDERER
// ============================================================================

const ResultRenderer: React.FC<{ result: any }> = ({ result }) => {
  if (result === null || result === undefined) {
    return <div className="text-[10px] text-gray-600 italic">No output</div>;
  }

  // String result
  if (typeof result === 'string') {
    // Check if HTML
    if (result.trim().startsWith('<') && (result.includes('</') || result.includes('/>'))) {
      return (
        <div className="space-y-2">
          <div
            className="prose prose-invert prose-xs max-w-none text-slate-700 dark:text-slate-300 text-xs"
            dangerouslySetInnerHTML={{ __html: result }}
          />
          <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
            <details>
              <summary className="text-[9px] text-gray-600 cursor-pointer hover:text-slate-500 dark:text-slate-400">View source</summary>
              <pre className="text-[10px] text-gray-500 font-mono mt-1 whitespace-pre-wrap break-all">{result}</pre>
            </details>
          </div>
        </div>
      );
    }
    // Markdown-ish
    if (result.includes('```') || result.includes('# ') || result.includes('**')) {
      return <pre className="text-[11px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">{result}</pre>;
    }
    // Plain text
    return <pre className="text-[11px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">{result}</pre>;
  }

  // Object/Array JSON
  if (typeof result === 'object') {
    // Error object
    if (result.status === 'error' || result.error) {
      return (
        <div className="space-y-2">
          <div className="text-xs text-red-400 font-bold">Error</div>
          <pre className="text-[10px] text-red-300/70 font-mono whitespace-pre-wrap">{result.error || result.message || JSON.stringify(result, null, 2)}</pre>
        </div>
      );
    }

    // Table-like array
    if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object') {
      const keys = Object.keys(result[0]);
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-700">
                {keys.map(k => (
                  <th key={k} className="text-left py-1.5 px-2 text-gray-500 font-bold uppercase tracking-wider">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.map((row: any, i: number) => (
                <tr key={i} className="border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-white/5">
                  {keys.map(k => (
                    <td key={k} className="py-1.5 px-2 text-slate-500 dark:text-slate-400 font-mono">
                      {typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Generic JSON
    return (
      <pre className="text-[10px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap break-all">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  }

  return <pre className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{String(result)}</pre>;
};

// ============================================================================
// PREVIEW HTML BUILDER
// ============================================================================

function buildPreviewHtml(tool: ToolDefinition, record: ExecutionRecord): string {
  const resultStr = typeof record.result === 'string'
    ? record.result
    : JSON.stringify(record.result, null, 2);

  const isHtml = typeof record.result === 'string' && record.result.trim().startsWith('<');
  const isError = !record.success;

  // Error bridge: captures runtime errors and sends to parent
  const errorBridgeScript = `<script>
    window.onerror = function(msg, src, line, col, err) {
      window.parent.postMessage({ type: 'preview-error', error: { message: String(msg), source: src, line: line, col: col, stack: err && err.stack } }, '*');
    };
    window.addEventListener('unhandledrejection', function(e) {
      window.parent.postMessage({ type: 'preview-error', error: { message: 'Unhandled Promise: ' + (e.reason && e.reason.message || String(e.reason)) } }, '*');
    });
  </script>`;

  // For HTML results, render directly
  if (isHtml && record.success) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${errorBridgeScript}<style>
      body { background: #0a0a0a; color: #e5e7eb; font-family: system-ui, -apple-system, sans-serif; padding: 24px; margin: 0; }
      * { box-sizing: border-box; }
      .header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .header .icon { font-size: 24px; }
      .header .title { font-size: 14px; font-weight: 700; color: #22d3ee; }
      .header .meta { font-size: 10px; color: #6b7280; margin-top: 2px; }
      .content { line-height: 1.6; }
      pre { background: #111; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px; }
      code { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      th, td { padding: 8px; border: 1px solid #333; text-align: left; font-size: 12px; }
      th { background: #1a1a1a; color: #9ca3af; font-weight: 600; }
    </style></head><body>
      <div class="header">
        <span class="icon">${tool.icon}</span>
        <div>
          <div class="title">${tool.label}</div>
          <div class="meta">Completed in ${record.executionMs}ms · ${new Date(record.timestamp).toLocaleString()}</div>
        </div>
      </div>
      <div class="content">${record.result}</div>
    </body></html>`;
  }

  // For JSON/text results
  const escapedResult = resultStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const statusColor = isError ? '#ef4444' : '#10b981';
  const statusText = isError ? 'FAILED' : 'COMPLETED';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${errorBridgeScript}<style>
    body { background: #0a0a0a; color: #e5e7eb; font-family: system-ui, -apple-system, sans-serif; padding: 24px; margin: 0; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; }
    .header .icon { font-size: 28px; }
    .header .info { flex: 1; }
    .header .title { font-size: 14px; font-weight: 700; color: #f3f4f6; }
    .header .meta { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .status { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; padding: 3px 8px; border-radius: 6px; background: ${statusColor}22; color: ${statusColor}; }
    .output { background: #111; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-top: 16px; overflow-x: auto; }
    .output-label { font-size: 10px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    pre { margin: 0; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 11px; color: #d1d5db; white-space: pre-wrap; word-break: break-all; line-height: 1.6; }
  </style></head><body>
    <div class="header">
      <span class="icon">${tool.icon}</span>
      <div class="info">
        <div class="title">${tool.label}</div>
        <div class="meta">${record.executionMs}ms · ${new Date(record.timestamp).toLocaleString()}</div>
      </div>
      <span class="status">${statusText}</span>
    </div>
    <div class="output">
      <div class="output-label">Output</div>
      <pre>${escapedResult}</pre>
    </div>
  </body></html>`;
}

export default ToolExecutionPanel;
export { ResultRenderer, buildPreviewHtml };
