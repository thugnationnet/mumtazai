/**
 * NetworkPanel — Network requests inspector
 * Displays HTTP requests with timing, status, size visualization
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  ArrowDown,
  ArrowUp,
  Search,
  X,
  Filter,
  Ban,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
} from 'lucide-react';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
type RequestStatus = 'pending' | 'success' | 'error' | 'cancelled';

export interface NetworkRequest {
  id: string;
  method: RequestMethod;
  url: string;
  status: number | null;
  statusText?: string;
  requestStatus: RequestStatus;
  size: number | null;
  time: number | null;
  type: 'fetch' | 'xhr' | 'script' | 'style' | 'image' | 'font' | 'other';
  timestamp: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
}

interface NetworkPanelProps {
  requests: NetworkRequest[];
  onClear: () => void;
  className?: string;
}

const methodColors: Record<RequestMethod, string> = {
  GET: 'text-violet-400',
  POST: 'text-indigo-400',
  PUT: 'text-amber-400',
  DELETE: 'text-red-400',
  PATCH: 'text-violet-400',
  OPTIONS: 'text-slate-600 dark:text-slate-400',
  HEAD: 'text-slate-600 dark:text-slate-400',
};

const statusColor = (s: number | null): string => {
  if (!s) return 'text-slate-500';
  if (s < 300) return 'text-violet-400';
  if (s < 400) return 'text-amber-400';
  return 'text-red-400';
};

const formatSize = (bytes: number | null): string => {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const formatTime = (ms: number | null): string => {
  if (ms === null) return '⏳';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const typeFilters = ['all', 'fetch', 'xhr', 'script', 'style', 'image', 'font', 'other'] as const;

const NetworkPanel: React.FC<NetworkPanelProps> = ({ requests, onClear, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'headers' | 'request' | 'response'>('headers');

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (searchQuery && !r.url.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [requests, typeFilter, searchQuery]);

  const selected = selectedRequest ? requests.find((r) => r.id === selectedRequest) : null;

  const totalSize = filtered.reduce((acc, r) => acc + (r.size || 0), 0);
  const totalTime = filtered.length > 0 ? Math.max(...filtered.map((r) => r.time || 0)) : 0;

  return (
    <div className={`flex flex-col h-full bg-[#0a0a0c] ${className}`}>
      {/* Toolbar */}
      <div className="h-8 bg-[#111113] border-b border-slate-200 dark:border-white/[0.06] flex items-center px-2 gap-1 shrink-0">
        {/* Type filters */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize whitespace-nowrap transition-all ${
                typeFilter === t
                  ? 'bg-slate-200 dark:bg-white/[0.08] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.1]'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded px-1.5 py-0.5 gap-1">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter URLs..."
            className="bg-transparent text-[10px] text-slate-700 dark:text-slate-300 outline-none w-24 placeholder-gray-600"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X className="w-2.5 h-2.5 text-slate-500" />
            </button>
          )}
        </div>

        <button
          onClick={onClear}
          className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          title="Clear network log"
        >
          <Ban className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Requests list */}
        <div className={`${selected ? 'w-1/2 border-r border-slate-200 dark:border-white/[0.06]' : 'w-full'} flex flex-col overflow-hidden`}>
          {/* Column headers */}
          <div className="h-6 bg-[#111113]/50 border-b border-slate-200 dark:border-white/[0.06] flex items-center px-2 text-[10px] text-slate-500 font-medium shrink-0">
            <span className="w-14">Method</span>
            <span className="flex-1 truncate">URL</span>
            <span className="w-12 text-right">Status</span>
            <span className="w-16 text-right">Size</span>
            <span className="w-16 text-right">Time</span>
          </div>

          {/* Request rows */}
          <div className="flex-1 overflow-y-auto font-mono">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                <WifiOff className="w-6 h-6 opacity-40" />
                <span className="text-xs">No network activity</span>
              </div>
            ) : (
              filtered.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedRequest(req.id === selectedRequest ? null : req.id)}
                  className={`flex items-center px-2 py-1 text-[11px] border-b border-white/[0.03] cursor-pointer transition-colors ${
                    selectedRequest === req.id
                      ? 'bg-violet-500/[0.08] border-l-2 border-l-violet-500'
                      : 'hover:bg-white/[0.02]'
                  } ${req.requestStatus === 'error' ? 'bg-red-500/[0.03]' : ''}`}
                >
                  <span className={`w-14 font-semibold text-[10px] ${methodColors[req.method]}`}>
                    {req.method}
                  </span>
                  <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">
                    {req.url.replace(/^https?:\/\/[^/]+/, '')}
                  </span>
                  <span className={`w-12 text-right ${statusColor(req.status)}`}>
                    {req.status || '…'}
                  </span>
                  <span className="w-16 text-right text-slate-500">{formatSize(req.size)}</span>
                  <span className={`w-16 text-right ${
                    (req.time || 0) > 1000 ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    {formatTime(req.time)}
                  </span>
                </motion.div>
              ))
            )}
          </div>

          {/* Summary bar */}
          <div className="h-6 bg-[#111113] border-t border-slate-200 dark:border-white/[0.06] flex items-center px-2 text-[10px] text-slate-500 gap-4 shrink-0">
            <span>{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1">
              <ArrowDown className="w-2.5 h-2.5" />
              {formatSize(totalSize)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatTime(totalTime)}
            </span>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="flex flex-col overflow-hidden"
            >
              {/* Detail header */}
              <div className="h-8 bg-[#111113] border-b border-slate-200 dark:border-white/[0.06] flex items-center px-2 gap-2 shrink-0">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
                <span className={`text-[10px] font-semibold ${methodColors[selected.method]}`}>
                  {selected.method}
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate flex-1">
                  {selected.url}
                </span>
              </div>

              {/* Detail tabs */}
              <div className="h-7 bg-[#111113]/50 border-b border-slate-200 dark:border-white/[0.06] flex items-center px-2 gap-0.5 shrink-0">
                {(['headers', 'request', 'response'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-all ${
                      detailTab === tab
                        ? 'bg-slate-200 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Detail content */}
              <div className="flex-1 overflow-y-auto p-2 text-[11px] font-mono">
                {detailTab === 'headers' && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-slate-500 uppercase text-[9px] tracking-wider mb-1">
                        General
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex">
                          <span className="text-slate-500 w-28 shrink-0">Status:</span>
                          <span className={statusColor(selected.status)}>
                            {selected.status} {selected.statusText}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="text-slate-500 w-28 shrink-0">Type:</span>
                          <span className="text-slate-700 dark:text-slate-300">{selected.type}</span>
                        </div>
                      </div>
                    </div>

                    {selected.responseHeaders && Object.keys(selected.responseHeaders).length > 0 && (
                      <div>
                        <div className="text-slate-500 uppercase text-[9px] tracking-wider mb-1">
                          Response Headers
                        </div>
                        <div className="space-y-0.5">
                          {Object.entries(selected.responseHeaders).map(([k, v]) => (
                            <div key={k} className="flex">
                              <span className="text-violet-400/70 w-28 shrink-0 truncate">{k}:</span>
                              <span className="text-slate-700 dark:text-slate-300 break-all">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.requestHeaders && Object.keys(selected.requestHeaders).length > 0 && (
                      <div>
                        <div className="text-slate-500 uppercase text-[9px] tracking-wider mb-1">
                          Request Headers
                        </div>
                        <div className="space-y-0.5">
                          {Object.entries(selected.requestHeaders).map(([k, v]) => (
                            <div key={k} className="flex">
                              <span className="text-violet-400/70 w-28 shrink-0 truncate">{k}:</span>
                              <span className="text-slate-700 dark:text-slate-300 break-all">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'request' && (
                  <div>
                    {selected.requestBody ? (
                      <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                        {selected.requestBody}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-24 text-slate-600 text-xs">
                        No request body
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'response' && (
                  <div>
                    {selected.responseBody ? (
                      <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                        {selected.responseBody}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-24 text-slate-600 text-xs">
                        No response body
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NetworkPanel;
