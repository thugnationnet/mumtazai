/**
 * ProblemPanel — Errors & warnings panel with gorgeous UI
 * Groups by file, clickable to navigate to error location
 */
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, AlertTriangle, Info, FileCode, ChevronRight } from 'lucide-react';
import { useEditorSettingsStore, ProblemItem } from '../../stores/editorStore';

interface ProblemPanelProps {
  onNavigate?: (file: string, line: number, column: number) => void;
  className?: string;
}

const severityConfig = {
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', badge: 'bg-red-500/20 text-red-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', badge: 'bg-amber-500/20 text-amber-400' },
  info: { icon: Info, color: 'text-indigo-400', bg: 'bg-indigo-500/10', badge: 'bg-indigo-500/20 text-indigo-400' },
};

const ProblemPanel: React.FC<ProblemPanelProps> = ({ onNavigate, className = '' }) => {
  const problems = useEditorSettingsStore((s) => s.problems);

  const grouped = useMemo(() => {
    const map = new Map<string, ProblemItem[]>();
    for (const p of problems) {
      const existing = map.get(p.file) || [];
      existing.push(p);
      map.set(p.file, existing);
    }
    return map;
  }, [problems]);

  const errorCount = problems.filter((p) => p.severity === 'error').length;
  const warningCount = problems.filter((p) => p.severity === 'warning').length;
  const infoCount = problems.filter((p) => p.severity === 'info').length;

  return (
    <div className={`h-full bg-white dark:bg-[#0a0a0a] flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Problems</span>
          <div className="flex items-center gap-1.5">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-400">
                <XCircle className="w-3 h-3" /> {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400">
                <AlertTriangle className="w-3 h-3" /> {warningCount}
              </span>
            )}
            {infoCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-400">
                <Info className="w-3 h-3" /> {infoCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Problem list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <div className="w-10 h-10 rounded-xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center mb-3">
              <XCircle className="w-5 h-5 text-violet-500/30" />
            </div>
            <p className="text-xs font-medium text-violet-400/60">No problems detected</p>
            <p className="text-[10px] text-slate-600 mt-1">Your code looks clean ✨</p>
          </div>
        ) : (
          <AnimatePresence>
            {Array.from(grouped.entries()).map(([file, items]) => (
              <motion.div
                key={file}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-white/[0.03]"
              >
                {/* File header */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/[0.02]">
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{file}</span>
                  <span className="text-[10px] text-slate-600 ml-auto">{items.length}</span>
                </div>

                {/* Problems in this file */}
                {items.map((problem) => {
                  const config = severityConfig[problem.severity];
                  const Icon = config.icon;

                  return (
                    <button
                      key={problem.id}
                      onClick={() => onNavigate?.(problem.file, problem.line, problem.column)}
                      className="w-full flex items-start gap-2 px-3 py-1.5 pl-7 hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors text-left group"
                    >
                      <Icon className={`w-3.5 h-3.5 ${config.color} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">{problem.message}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {problem.source && <span className="text-slate-500">[{problem.source}] </span>}
                          Ln {problem.line}, Col {problem.column}
                        </p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </button>
                  );
                })}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ProblemPanel;
