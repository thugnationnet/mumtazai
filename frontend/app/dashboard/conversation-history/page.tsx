'use client';

import { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

type ConversationItem = {
  id: string;
  agent: string;
  topic: string;
  date: string;
  duration: string;
  messageCount: number;
  lastMessage?: {
    content: string;
    timestamp?: string;
  } | null;
};

type PaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

const normalizePagination = (
  payload?: Partial<PaginationState>
): PaginationState => {
  const page = Number(payload?.page ?? DEFAULT_PAGINATION.page);
  const limit = Number(payload?.limit ?? DEFAULT_PAGINATION.limit);
  const total = Number(payload?.total ?? DEFAULT_PAGINATION.total);
  const totalPages = Number(
    payload?.totalPages ?? DEFAULT_PAGINATION.totalPages
  );

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: Boolean(payload?.hasNext ?? page < totalPages),
    hasPrev: Boolean(payload?.hasPrev ?? page > 1),
  };
};

export default function ConversationHistoryPage() {
  const { state } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] =
    useState<PaginationState>(DEFAULT_PAGINATION);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  // Export conversations
  const handleExport = async (format: 'json' | 'csv') => {
    if (!state.user?.id) return;
    
    setExporting(true);
    try {
      const response = await fetch(
        `/api/user/conversations/${state.user.id}/export?format=${format}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversations_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export conversations');
    } finally {
      setExporting(false);
    }
  };

  const fetchConversations = useCallback(
    async (
      page = 1,
      search = '',
      options?: { signal?: AbortSignal; silent?: boolean }
    ) => {
      if (!state.user?.id) return;

      const isSearchRequest = Boolean(search);

      if (!options?.silent) {
        setError('');
        if (isSearchRequest) setSearching(true);
        else setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          ...(search && { search }),
        });

        const response = await fetch(
          `/api/user/conversations/${state.user.id}?${params.toString()}`,
          {
            credentials: 'include',
            signal: options?.signal,
          }
        );

        if (!response.ok) {
          const message =
            response.status === 404
              ? 'No conversations found for your account yet.'
              : 'Unable to load conversations right now.';
          throw new Error(message);
        }

        const result = await response.json();
        const data = result.data || {};
        setConversations(data.conversations || []);
        setPagination(normalizePagination(data.pagination));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        console.error('Error fetching conversations:', err);
        setConversations([]);
        setPagination(normalizePagination());
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading conversations.'
        );
      } finally {
        setLoading(false);
        setSearching(false);
      }
    },
    [state.user?.id, pagination.limit]
  );

  // Load conversations on mount
  useEffect(() => {
    if (!state.user?.id) return;

    const controller = new AbortController();
    fetchConversations(1, '', { signal: controller.signal });

    return () => controller.abort();
  }, [state.user?.id, fetchConversations]);

  const emptyStateCopy = useMemo(() => {
    if (error) return error;
    if (searchTerm) return 'Try adjusting your search terms';
    return 'Start a conversation to see your history here';
  }, [error, searchTerm]);

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen neu-page-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Please log in to view conversations
          </h1>
          <Link href="/auth/login" className="btn-primary inline-block">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Handle search
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchConversations(1, searchTerm.trim());
    } else {
      fetchConversations(1);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchConversations(newPage, searchTerm, { silent: true });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -left-20 top-1/4 w-72 h-[500px] rounded-[100px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
        <div className="absolute -right-16 -top-20 w-80 h-[600px] rounded-[100px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute left-1/3 -bottom-32 w-64 h-[400px] rounded-[80px] rotate-45 bg-gradient-to-tr from-purple-200/25 via-white/30 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute right-1/4 top-10 w-48 h-[350px] rounded-[60px] -rotate-6 bg-gradient-to-b from-white/35 via-slate-200/20 to-transparent backdrop-blur-sm border border-white/45" />
        <div className="absolute -left-10 -bottom-10 w-56 h-[300px] rounded-[70px] rotate-[30deg] bg-gradient-to-tl from-indigo-100/30 via-white/25 to-transparent backdrop-blur-sm border border-white/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-300/40 rounded-full px-4 py-1.5 mb-6">
              <span className="text-purple-700 text-xs font-bold uppercase tracking-wider">History</span>
            </div>
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-6">
              <ChatBubbleLeftRightIcon className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">Conversation History</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4">
              Review and manage your past interactions
              {pagination.total > 0 && (
                <span className="block mt-2 text-slate-500">
                  ({pagination.total} conversations)
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {pagination.total > 0 && (
                <>
                  <button
                    onClick={() => handleExport('json')}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm text-slate-700 rounded-lg hover:bg-white/50 border border-white/60 disabled:opacity-50 transition-colors"
                    title="Export as JSON"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm text-slate-700 rounded-lg hover:bg-white/50 border border-white/60 disabled:opacity-50 transition-colors"
                    title="Export as CSV"
                  >
                    <TableCellsIcon className="w-4 h-4" />
                    <span>CSV</span>
                  </button>
                </>
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all shadow-lg"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 px-4 bg-transparent border-b border-white/40">
        <div className="container-custom">
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {searching ? '...' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Conversations List */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container-custom max-w-4xl">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-500">Loading your conversations...</p>
            </div>
          ) : conversations.length > 0 ? (
            <>
              <div className="space-y-4 mb-8">
                {conversations.map((conv, i) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 bg-white rounded-lg border border-white/80 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500 mr-2" />
                          <h3 className="font-semibold text-slate-800">
                            {conv.agent || 'Assistant'}
                          </h3>
                        </div>
                        <p className="text-slate-600 mb-2">{conv.topic}</p>
                        {conv.lastMessage && (
                          <p className="text-sm text-slate-400">
                            "{conv.lastMessage.content}"
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-slate-500">{conv.date}</p>
                        <p className="text-xs text-slate-400">
                          {conv.duration}
                        </p>
                        <p className="text-xs text-slate-400">
                          {conv.messageCount} messages
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="flex items-center px-4 py-2 border border-white/80 rounded-lg hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  <span className="text-slate-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center px-4 py-2 border border-white/80 rounded-lg hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="text-center py-16">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No conversations found
              </h3>
              <p className="text-slate-500 mb-6">{emptyStateCopy}</p>
              <Link
                href="/dashboard/overview"
                className="btn-primary inline-block"
              >
                Back to Dashboard
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
