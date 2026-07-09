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
      <div className="min-h-screen bg-gradient-to-br from-neural-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neural-900 mb-4">
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="conversation-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#conversation-grid)"/>
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <ChatBubbleLeftRightIcon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Conversation History</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-4">
            Review and manage your past interactions
            {pagination.total > 0 && (
              <span className="block mt-2 text-white/80">
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
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-colors"
                  title="Export as JSON"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-colors"
                  title="Export as CSV"
                >
                  <TableCellsIcon className="w-4 h-4" />
                  <span>CSV</span>
                </button>
              </>
            )}
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-white text-brand-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-lg"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 px-4 bg-white border-b border-gray-200">
        <div className="container-custom">
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-brand-500 text-white text-sm rounded hover:bg-brand-600 disabled:opacity-50"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-neural-600">Loading your conversations...</p>
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
                    className="p-6 bg-white rounded-lg border border-neural-200 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <ChatBubbleLeftRightIcon className="w-5 h-5 text-brand-500 mr-2" />
                          <h3 className="font-semibold text-neural-900">
                            {conv.agent || 'Assistant'}
                          </h3>
                        </div>
                        <p className="text-neural-700 mb-2">{conv.topic}</p>
                        {conv.lastMessage && (
                          <p className="text-sm text-neural-500">
                            "{conv.lastMessage.content}"
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-neural-600">{conv.date}</p>
                        <p className="text-xs text-neural-500">
                          {conv.duration}
                        </p>
                        <p className="text-xs text-neural-500">
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
                    className="flex items-center px-4 py-2 border border-neural-200 rounded-lg hover:bg-neural-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  <span className="text-neural-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center px-4 py-2 border border-neural-200 rounded-lg hover:bg-neural-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-neural-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neural-900 mb-2">
                No conversations found
              </h3>
              <p className="text-neural-600 mb-6">{emptyStateCopy}</p>
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
