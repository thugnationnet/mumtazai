/**
 * SearchPanel — Full-text search across project files.
 * Displays results grouped by file with click-to-navigate.
 */
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, X, FileText, ChevronDown, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import type { SearchResult, SearchMatch } from '../types/canvas-agent-protocol';

interface SearchPanelProps {
  onSearch: (query: string, options?: { regex?: boolean; includePattern?: string }) => SearchResult;
  onNavigate: (path: string, line?: number) => void;
  onClose: () => void;
}

export default function SearchPanel({ onSearch, onNavigate, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [includePattern, setIncludePattern] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) {
      setResult(null);
      return;
    }
    const r = onSearch(query, { regex: useRegex, includePattern: includePattern || undefined });
    setResult(r);
    // Auto-expand all files
    const fileSet = new Set(r.matches.map(m => m.file));
    setExpandedFiles(fileSet);
  }, [query, useRegex, includePattern, onSearch]);

  // Search on Enter or debounced input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') onClose();
  }, [handleSearch, onClose]);

  // Group matches by file
  const grouped = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, SearchMatch[]>();
    for (const m of result.matches) {
      if (!map.has(m.file)) map.set(m.file, []);
      map.get(m.file)!.push(m);
    }
    return Array.from(map.entries());
  }, [result]);

  const toggleFile = (file: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-[#1e1e2e]">
      {/* Search Header */}
      <div className="p-3 border-b border-zinc-800 space-y-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in files…"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-2 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white text-xs font-medium transition-colors"
          >
            Search
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <button
            onClick={() => setUseRegex(!useRegex)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${useRegex ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-zinc-800'}`}
          >
            {useRegex ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            Regex
          </button>
          <input
            type="text"
            value={includePattern}
            onChange={e => setIncludePattern(e.target.value)}
            placeholder="Include: *.tsx, *.ts"
            className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded px-2 py-0.5 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto text-sm">
        {result && (
          <div className="px-3 py-1.5 text-xs text-zinc-500 border-b border-zinc-800/50">
            {result.totalMatches} result{result.totalMatches !== 1 ? 's' : ''} in {grouped.length} file{grouped.length !== 1 ? 's' : ''}
          </div>
        )}

        {grouped.map(([file, matches]) => (
          <div key={file}>
            <button
              onClick={() => toggleFile(file)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-zinc-800/50 text-left"
            >
              {expandedFiles.has(file) ? (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-zinc-300 truncate">{file}</span>
              <span className="text-zinc-600 ml-auto text-xs">{matches.length}</span>
            </button>

            {expandedFiles.has(file) && (
              <div className="ml-6 border-l border-zinc-800/50">
                {matches.map((match, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigate(match.file, match.line)}
                    className="w-full flex items-start gap-2 px-3 py-1 hover:bg-zinc-800/30 text-left"
                  >
                    <span className="text-zinc-600 text-xs mt-0.5 w-6 text-right flex-shrink-0">
                      {match.line}
                    </span>
                    <span className="text-zinc-400 truncate">
                      <HighlightedText text={match.lineContent} query={query} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {result && result.totalMatches === 0 && (
          <div className="p-6 text-center text-zinc-600 text-sm">
            No results found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  try {
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}
