/**
 * CodeRunner — Server-side code execution output panel
 * Calls /api/canvas/execute for non-web languages (Python, Java, Go, etc.)
 * Displays stdout/stderr in a terminal-like UI
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Square, RotateCcw, Copy, Check, Terminal, AlertTriangle, Clock } from 'lucide-react';

interface CodeRunnerProps {
  code: string;
  language: string;
  files?: Record<string, string>;
}

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  language: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python 3',
  java: 'Java',
  go: 'Go',
  rust: 'Rust',
  c: 'C (GCC)',
  cpp: 'C++ (G++20)',
  'c++': 'C++ (G++20)',
  php: 'PHP',
  ruby: 'Ruby',
  swift: 'Swift',
  kotlin: 'Kotlin',
  csharp: 'C# (.NET)',
  'c#': 'C# (.NET)',
  javascript: 'Node.js',
  typescript: 'TypeScript (tsx)',
  sql: 'SQLite3',
  shell: 'Bash',
  bash: 'Bash',
};

const CodeRunner: React.FC<CodeRunnerProps> = ({ code, language, files }) => {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLPreElement>(null);

  const runCode = useCallback(async () => {
    if (!code.trim() || isRunning) return;

    setIsRunning(true);
    setResult(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/canvas/execute', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ code, language, files }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setResult({
          success: false,
          stdout: '',
          stderr: err.message || 'Execution failed',
          exitCode: 1,
          executionTime: 0,
          language,
        });
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [code, language, files, isRunning]);

  const stopExecution = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
  }, []);

  const copyOutput = useCallback(() => {
    const text = result ? (result.stdout || '') + (result.stderr || '') : '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [result]);

  const langLabel = LANGUAGE_LABELS[language] || language;
  const hasOutput = result && (result.stdout || result.stderr);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0a0a0a]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {langLabel}
          </span>
          {result && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              result.exitCode === 0
                ? 'bg-violet-500/15 text-violet-400'
                : 'bg-red-500/15 text-red-400'
            }`}>
              {result.exitCode === 0 ? 'Success' : `Exit ${result.exitCode}`}
            </span>
          )}
          {result?.executionTime ? (
            <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {result.executionTime}ms
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {hasOutput && (
            <button
              onClick={copyOutput}
              className="p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/[0.04] transition-all"
              title="Copy output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-violet-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          {result && (
            <button
              onClick={() => { setResult(null); }}
              className="p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/[0.04] transition-all"
              title="Clear"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {isRunning ? (
            <button
              onClick={stopExecution}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-400 text-[10px] font-medium rounded-md hover:bg-red-500/30 transition-all"
            >
              <Square className="w-3 h-3" />
              Stop
            </button>
          ) : (
            <button
              onClick={runCode}
              disabled={!code.trim()}
              className="flex items-center gap-1 px-2.5 py-1 bg-violet-500/20 text-violet-400 text-[10px] font-medium rounded-md hover:bg-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Play className="w-3 h-3" />
              Run
            </button>
          )}
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isRunning && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04]">
            <div className="w-3 h-3 border-2 border-violet-900/30 border-t-emerald-400 rounded-full animate-spin" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Executing {langLabel}...</span>
          </div>
        )}

        {!result && !isRunning && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.03] flex items-center justify-center">
              <Play className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-slate-500">Press Run to execute</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Server-side {langLabel} execution</p>
            </div>
          </div>
        )}

        {result && (
          <pre
            ref={outputRef}
            className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words"
          >
            {result.stdout && (
              <span className="text-slate-800 dark:text-slate-200">{result.stdout}</span>
            )}
            {result.stderr && (
              <span className={result.exitCode === 0 ? 'text-yellow-400' : 'text-red-400'}>
                {result.stdout ? '\n' : ''}{result.stderr}
              </span>
            )}
            {!result.stdout && !result.stderr && result.exitCode === 0 && (
              <span className="text-slate-500 italic">Program completed with no output.</span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
};

export default CodeRunner;
