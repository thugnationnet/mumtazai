/**
 * TerminalPanel — Displays command execution history.
 * Shows stdout/stderr with syntax highlighting for shell output.
 */
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal, Trash2, Play, X, ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { ExecResult } from '../types/canvas-agent-protocol';

interface TerminalPanelProps {
  history: ExecResult[];
  onRunCommand: (command: string) => Promise<ExecResult>;
  onClear: () => void;
  onClose: () => void;
}

export default function TerminalPanel({ history, onRunCommand, onClear, onClose }: TerminalPanelProps) {
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleRun = useCallback(async () => {
    if (!input.trim() || running) return;
    setRunning(true);
    try {
      await onRunCommand(input.trim());
      setInput('');
    } finally {
      setRunning(false);
      inputRef.current?.focus();
    }
  }, [input, running, onRunCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRun();
    if (e.key === 'Escape') onClose();
  }, [handleRun, onClose]);

  const toggleCollapse = (id: string) => {
    setCollapsedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a] font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#181825] border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-sm text-zinc-300 font-medium">Terminal</span>
          <span className="text-xs text-zinc-600">{history.length} command{history.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Clear terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Close terminal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {history.length === 0 && (
          <div className="text-zinc-600 text-center py-8">
            No commands executed yet
          </div>
        )}

        {history.map(result => {
          const isCollapsed = collapsedItems.has(result.id);
          const isSuccess = result.exitCode === 0;
          const isTimedOut = result.timedOut;

          return (
            <div key={result.id} className="border border-zinc-800/50 rounded-lg overflow-hidden">
              {/* Command Header */}
              <button
                onClick={() => toggleCollapse(result.id)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-900/50 hover:bg-zinc-900 text-left"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                )}
                <span className="text-green-400 flex-shrink-0">$</span>
                <span className="text-zinc-200 truncate">{result.command}</span>
                <span className="ml-auto flex items-center gap-2 flex-shrink-0">
                  {isTimedOut ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                  ) : isSuccess ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className="text-xs text-zinc-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result.duration}ms
                  </span>
                </span>
              </button>

              {/* Output */}
              {!isCollapsed && (
                <div className="p-3 space-y-1">
                  {result.stdout && (
                    <pre className="text-zinc-300 whitespace-pre-wrap break-words text-xs leading-relaxed">
                      {result.stdout}
                    </pre>
                  )}
                  {result.stderr && (
                    <pre className="text-red-400/80 whitespace-pre-wrap break-words text-xs leading-relaxed">
                      {result.stderr}
                    </pre>
                  )}
                  {isTimedOut && (
                    <div className="text-yellow-400 text-xs">⚠ Command timed out</div>
                  )}
                  {!result.stdout && !result.stderr && !isTimedOut && (
                    <div className="text-zinc-600 text-xs italic">No output</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Command Input */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#181825] border-t border-zinc-800">
        <span className="text-green-400 text-sm">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command…"
          disabled={running}
          className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleRun}
          disabled={running || !input.trim()}
          className="p-1.5 rounded bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-slate-900 dark:text-white transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
