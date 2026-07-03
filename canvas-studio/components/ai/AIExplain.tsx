/**
 * AIExplain — AI code explanation panel
 * Select code and get explanations, documentation, complexity analysis
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Code2,
  FileText,
  Brain,
  Lightbulb,
  BarChart3,
  List,
  ChevronDown,
} from 'lucide-react';

export interface Explanation {
  summary: string;
  detailed: string;
  complexity?: string;
  suggestions?: string[];
  relatedConcepts?: string[];
}

interface AIExplainProps {
  selectedCode?: string;
  selectedFile?: string;
  selectedLines?: [number, number];
  explanation?: Explanation;
  isLoading?: boolean;
  onExplain: (code: string) => void;
  className?: string;
}

const AIExplain: React.FC<AIExplainProps> = ({
  selectedCode,
  selectedFile,
  selectedLines,
  explanation,
  isLoading = false,
  onExplain,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'suggestions'>('summary');
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { key: 'summary' as const, label: 'Summary', icon: BookOpen },
    { key: 'detailed' as const, label: 'Detailed', icon: Brain },
    { key: 'suggestions' as const, label: 'Tips', icon: Lightbulb },
  ];

  return (
    <div className={`flex flex-col bg-[#0a0a0c] rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-[#111113] border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-slate-800 dark:text-slate-200 font-medium">AI Explain</h3>
            <span className="text-[10px] text-slate-500">
              {selectedCode ? 'Code selected' : 'Select code to explain'}
            </span>
          </div>
        </div>
      </div>

      {/* Selected code preview */}
      {selectedCode && (
        <div className="border-b border-slate-200 dark:border-white/[0.06]">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Code2 className="w-3 h-3 text-slate-500" />
              {selectedFile && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedFile}
                  {selectedLines && `:${selectedLines[0]}-${selectedLines[1]}`}
                </span>
              )}
            </div>
            <button
              onClick={() => handleCopy(selectedCode)}
              className="p-0.5 text-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {copied ? <Check className="w-3 h-3 text-violet-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <pre className="px-3 py-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono max-h-24 overflow-auto bg-white/[0.01]">
            {selectedCode.length > 500 ? selectedCode.slice(0, 500) + '...' : selectedCode}
          </pre>
        </div>
      )}

      {/* Explain button */}
      {selectedCode && !explanation && !isLoading && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/[0.06]">
          <button
            onClick={() => onExplain(selectedCode)}
            className="w-full py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-slate-900 dark:text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Explain This Code
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="px-4 py-6 flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="w-6 h-6 text-violet-400" />
          </motion.div>
          <div className="space-y-1 text-center">
            <span className="text-xs text-slate-600 dark:text-slate-400">Analyzing code...</span>
            <motion.div
              className="h-1 w-32 bg-slate-100 dark:bg-white/[0.04] rounded-full overflow-hidden mx-auto"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-violet-500 rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: '50%' }}
              />
            </motion.div>
          </div>
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-white/[0.06]">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors border-b-2 ${
                  activeTab === key
                    ? 'text-slate-900 dark:text-white border-violet-500'
                    : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'summary' && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="space-y-3"
                >
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{explanation.summary}</p>

                  {explanation.complexity && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-white/[0.02] rounded-lg border border-slate-200 dark:border-white/[0.06]">
                      <BarChart3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Complexity
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{explanation.complexity}</p>
                      </div>
                    </div>
                  )}

                  {explanation.relatedConcepts && explanation.relatedConcepts.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Related Concepts
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {explanation.relatedConcepts.map((concept) => (
                          <span
                            key={concept}
                            className="px-2 py-0.5 rounded-full text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'detailed' && (
                <motion.div
                  key="detailed"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <div className="prose prose-invert prose-xs max-w-none">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {explanation.detailed}
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'suggestions' && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="space-y-2"
                >
                  {explanation.suggestions && explanation.suggestions.length > 0 ? (
                    explanation.suggestions.map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-white/[0.02] rounded-lg border border-slate-200 dark:border-white/[0.06]"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">{tip}</p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-600 text-xs">
                      No additional suggestions
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Empty state */}
      {!selectedCode && !explanation && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-600 gap-2">
          <BookOpen className="w-8 h-8 opacity-20" />
          <span className="text-xs">Select code to explain</span>
          <span className="text-[10px] text-slate-700">
            Highlight code in the editor, then click "Explain"
          </span>
        </div>
      )}
    </div>
  );
};

export default AIExplain;
