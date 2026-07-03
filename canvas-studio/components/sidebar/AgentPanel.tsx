/**
 * AgentPanel — Natural language command interface for the AI Agent
 * "make it live" → Build → Test → Deploy → Health Check
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  SkipForward,
  Sparkles,
  Rocket,
  Bug,
  Gauge,
  Database,
  Shield,
  BarChart3,
  Trash2,
  Globe,
  Wrench,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────

interface PlanStep {
  action: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: unknown;
  error?: string;
}

interface ExecutionResult {
  executionId: string;
  intent: string;
  plan: PlanStep[];
  results: Array<{ action: string; status: string; result?: unknown; error?: string }>;
  summary: string;
}

interface AgentPanelProps {
  projectId: string;
  className?: string;
}

const INTENT_ICONS: Record<string, React.ReactNode> = {
  deploy: <Rocket size={14} className="text-violet-400" />,
  build: <Wrench size={14} className="text-indigo-400" />,
  rollback: <Clock size={14} className="text-amber-400" />,
  debug: <Bug size={14} className="text-red-400" />,
  scale: <Gauge size={14} className="text-violet-400" />,
  database: <Database size={14} className="text-violet-400" />,
  setup: <Sparkles size={14} className="text-pink-400" />,
  security: <Shield size={14} className="text-orange-400" />,
  status: <BarChart3 size={14} className="text-zinc-400" />,
  cost: <BarChart3 size={14} className="text-indigo-400" />,
  domain: <Globe size={14} className="text-indigo-400" />,
  cleanup: <Trash2 size={14} className="text-zinc-400" />,
};

const STEP_STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={12} className="text-zinc-500" />,
  running: <Loader2 size={12} className="text-violet-400 animate-spin" />,
  completed: <CheckCircle2 size={12} className="text-violet-400" />,
  failed: <XCircle size={12} className="text-red-400" />,
  skipped: <SkipForward size={12} className="text-zinc-500" />,
};

const QUICK_COMMANDS = [
  { label: '🚀 Deploy', command: 'deploy to production' },
  { label: '🔍 Status', command: 'check status' },
  { label: '🐛 Debug', command: "what's wrong" },
  { label: '📈 Performance', command: 'analyze performance' },
  { label: '💾 Backup', command: 'backup database' },
  { label: '🔒 Security', command: 'security audit' },
];

// ── Component ──────────────────────────────────────────────────────

const AgentPanel: React.FC<AgentPanelProps> = ({ projectId, className = '' }) => {
  const [command, setCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<ExecutionResult[]>([]);
  const [expandedExec, setExpandedExec] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new results
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async (cmd?: string) => {
    const input = cmd || command;
    if (!input.trim() || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setCommand('');

    try {
      const res = await fetch(`/api/agent-ops/${projectId}/execute`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: input }),
      });

      const data = await res.json();

      if (data.success) {
        const result: ExecutionResult = {
          executionId: data.executionId,
          intent: data.intent,
          plan: data.plan,
          results: data.results,
          summary: data.summary,
        };
        setHistory(prev => [...prev, result]);
        setExpandedExec(data.executionId);
      } else {
        setError(data.error || 'Execution failed');
      }
    } catch (err) {
      setError('Network error — could not reach agent');
    } finally {
      setIsExecuting(false);
    }
  };

  const cancelExecution = async () => {
    try {
      await fetch(`/api/agent-ops/${projectId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-900/90 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-300 dark:border-white/10">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
          <Bot size={14} className="text-slate-900 dark:text-white" />
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">AI Agent</span>
          <p className="text-[9px] text-zinc-500">Natural language → infrastructure actions</p>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-white/5">
        <div className="flex flex-wrap gap-1">
          {QUICK_COMMANDS.map(qc => (
            <button
              key={qc.label}
              onClick={() => executeCommand(qc.command)}
              disabled={isExecuting}
              className="px-2 py-1 text-[10px] bg-slate-100 dark:bg-white/[0.03] hover:bg-violet-500/10 text-zinc-400 hover:text-violet-300 rounded-md border border-slate-200 dark:border-white/5 hover:border-violet-500/20 transition-all disabled:opacity-50"
            >
              {qc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Execution History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {history.length === 0 && !isExecuting && (
          <div className="text-center py-12">
            <Bot size={32} className="mx-auto text-zinc-700 mb-3" />
            <p className="text-xs text-zinc-500 mb-1">Tell the agent what to do</p>
            <p className="text-[10px] text-zinc-600 max-w-[200px] mx-auto">
              "make it live", "fix the errors", "check status", "backup the database"
            </p>
          </div>
        )}

        <AnimatePresence>
          {history.map(exec => (
            <motion.div
              key={exec.executionId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden"
            >
              {/* Execution Header */}
              <button
                onClick={() => setExpandedExec(expandedExec === exec.executionId ? null : exec.executionId)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.02]"
              >
                {INTENT_ICONS[exec.intent] || INTENT_ICONS.status}
                <span className="text-xs text-slate-900 dark:text-white font-medium flex-1 text-left capitalize">
                  {exec.intent}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {exec.plan.filter(s => s.status === 'completed').length}/{exec.plan.length}
                </span>
                {expandedExec === exec.executionId ? (
                  <ChevronDown size={12} className="text-zinc-500" />
                ) : (
                  <ChevronRight size={12} className="text-zinc-500" />
                )}
              </button>

              {/* Expanded Steps */}
              {expandedExec === exec.executionId && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="border-t border-slate-200 dark:border-white/5"
                >
                  <div className="p-3 space-y-1.5">
                    {exec.plan.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {STEP_STATUS_ICONS[step.status]}
                        <span className={`text-[11px] flex-1 ${
                          step.status === 'completed' ? 'text-zinc-300' :
                          step.status === 'failed' ? 'text-red-400' :
                          step.status === 'skipped' ? 'text-zinc-600' :
                          'text-zinc-400'
                        }`}>
                          {step.label}
                        </span>
                        {step.error && (
                          <span className="text-[9px] text-red-500 truncate max-w-[100px]" title={step.error}>
                            {step.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="px-3 py-2 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/5">
                    <p className="text-[10px] text-zinc-400">{exec.summary}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Active execution indicator */}
        {isExecuting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 rounded-xl border border-violet-500/20"
          >
            <Loader2 size={14} className="text-violet-400 animate-spin" />
            <span className="text-xs text-violet-300 flex-1">Executing...</span>
            <button
              onClick={cancelExecution}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10"
            >
              <X size={12} className="text-zinc-400" />
            </button>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
            <XCircle size={14} className="text-red-400" />
            <span className="text-xs text-red-300">{error}</span>
          </div>
        )}
      </div>

      {/* Command Input */}
      <div className="px-3 py-3 border-t border-slate-300 dark:border-white/10">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.05] rounded-xl px-3 py-2 border border-slate-300 dark:border-white/10 focus-within:border-violet-500/30">
          <Sparkles size={14} className="text-violet-400 shrink-0" />
          <input
            ref={inputRef}
            value={command}
            onChange={e => setCommand(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && executeCommand()}
            placeholder="Tell the agent what to do..."
            disabled={isExecuting}
            className="bg-transparent text-xs text-slate-900 dark:text-white flex-1 outline-none placeholder:text-zinc-600 disabled:opacity-50"
          />
          <button
            onClick={() => executeCommand()}
            disabled={!command.trim() || isExecuting}
            className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:hover:bg-violet-600 transition-colors"
          >
            <Send size={12} className="text-slate-900 dark:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;
