'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export const dynamic = 'force-dynamic';

interface AgentMetric {
  agentId: string;
  name: string;
  type: string;
  avatar: string;
  conversations: number;
  avgResponseTime: string;
  satisfaction: string;
  messages: number;
}

interface OverviewData {
  totalConversations: number;
  totalAgents: number;
  avgResponseTime: string;
  avgSatisfaction: string;
  agents: AgentMetric[];
  dataRefreshed: string;
}

export default function PerformanceMetricsPage() {
  const { state } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!state.user?.id) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/agent/performance/overview', {
        credentials: 'include',
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error('Failed to load performance metrics');
      }

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'No data returned');
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('Error fetching performance metrics:', err);
      setError((err as Error).message || 'Unable to load metrics');
    } finally {
      setLoading(false);
    }
  }, [state.user?.id]);

  useEffect(() => {
    if (!state.user?.id) return;
    fetchMetrics();
    return () => abortRef.current?.abort();
  }, [state.user?.id, fetchMetrics]);

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neural-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neural-900 mb-4">
            Please log in to view metrics
          </h1>
          <Link href="/auth/login" className="btn-primary inline-block">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neural-50 to-white">
      {/* Header */}
      <section className="py-12 px-4 border-b border-neural-200">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-neural-900 mb-2">
                Agent Performance Metrics
              </h1>
              <p className="text-neural-600">
                Monitor your AI agents performance and health
              </p>
            </div>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors text-sm"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className="container-custom px-4 mt-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}{' '}
            <button onClick={fetchMetrics} className="underline font-medium">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="container-custom px-4 py-16 text-center">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 bg-white rounded-lg border border-neural-200">
                  <div className="h-4 bg-neural-200 rounded w-1/2 mb-3" />
                  <div className="h-8 bg-neural-200 rounded w-2/3 mb-2" />
                  <div className="h-5 bg-neural-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      {data && (
        <section className="py-16 px-4">
          <div className="container-custom">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Total Conversations', value: String(data.totalConversations), status: data.totalConversations > 0 ? 'Active' : 'No data' },
                { label: 'Avg Response', value: data.avgResponseTime, status: data.avgResponseTime !== '—' ? 'Tracked' : 'No data' },
                { label: 'User Satisfaction', value: data.avgSatisfaction, status: data.avgSatisfaction !== '—' ? 'Tracked' : 'No data' },
                { label: 'Active Agents', value: String(data.totalAgents), status: data.totalAgents > 0 ? 'Online' : 'None' },
              ].map((metric, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white rounded-lg border border-neural-200"
                >
                  <p className="text-neural-600 text-sm mb-2">{metric.label}</p>
                  <h3 className="text-2xl font-bold text-neural-900 mb-2">
                    {metric.value}
                  </h3>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded ${
                    metric.status === 'No data' || metric.status === 'None'
                      ? 'bg-neural-100 text-neural-500'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {metric.status}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Agent Performance Table */}
            {data.agents.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg border border-neural-200 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neural-50 border-b border-neural-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neural-900">Agent</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neural-900">Conversations</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neural-900">Avg Response</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neural-900">Satisfaction</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neural-900">Messages</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.agents.map((agent, i) => (
                        <tr
                          key={agent.agentId}
                          className="border-b border-neural-200 hover:bg-neural-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-neural-900">
                            <span className="mr-2">{agent.avatar}</span>
                            {agent.name}
                          </td>
                          <td className="px-6 py-4 text-neural-600">
                            {agent.conversations}
                          </td>
                          <td className="px-6 py-4 text-neural-600">
                            {agent.avgResponseTime}
                          </td>
                          <td className="px-6 py-4 text-neural-600">
                            {agent.satisfaction}
                          </td>
                          <td className="px-6 py-4 text-neural-600">
                            {agent.messages}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-lg border border-neural-200 p-12 text-center">
                <p className="text-neural-600 mb-2">No agent conversations yet</p>
                <p className="text-neural-400 text-sm">Start chatting with agents to see performance data here</p>
              </div>
            )}

            {data.dataRefreshed && (
              <p className="text-xs text-neural-400 mt-4 text-right">
                Last refreshed: {new Date(data.dataRefreshed).toLocaleString()}
              </p>
            )}

            <div className="mt-8">
              <Link
                href="/dashboard/overview"
                className="btn-secondary inline-block"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
