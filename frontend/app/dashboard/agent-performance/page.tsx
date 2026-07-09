'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  MessageSquare,
  Clock,
  Target,
  Zap,
  RefreshCcw,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

type TrendDirection = 'up' | 'down';

interface AgentPerformanceData {
  agent: {
    name: string;
    type: string;
    avatar: string;
    status: 'active' | 'idle' | 'maintenance';
  };
  metrics: {
    totalConversations: number;
    totalMessages: number;
    averageResponseTime: number;
    satisfactionScore: number;
    activeUsers: number;
    uptime: number;
  };
  trends: {
    conversations: { value: number; change: string; trend: TrendDirection };
    messages: { value: number; change: string; trend: TrendDirection };
    responseTime: { value: number; change: string; trend: TrendDirection };
    satisfaction: { value: number; change: string; trend: TrendDirection };
  };
  recentActivity: Array<{
    timestamp: string;
    type: string;
    description: string;
    user?: string;
  }>;
  timeRange: string;
  dataRefreshed?: string;
}

const agentOptions = [
  { id: 'default', name: 'All Agents (AI Studio)', icon: '🤖' },
  { id: 'einstein', name: 'Einstein', icon: '🧠' },
  { id: 'tech-wizard', name: 'Tech Wizard', icon: '🧙‍♂️' },
  { id: 'comedy-king', name: 'Comedy King', icon: '😄' },
  { id: 'chef-biew', name: 'Chef Biew', icon: '👨‍🍳' },
  { id: 'ben-sega', name: 'Ben Sega', icon: '🎮' },
  { id: 'chess-player', name: 'Chess Player', icon: '♟️' },
];

const timeRangeOptions = [
  { id: '1d', name: 'Last 24 Hours' },
  { id: '7d', name: 'Last 7 Days' },
  { id: '30d', name: 'Last 30 Days' },
];

const statusBadgeMap: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border border-green-100',
  idle: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
  maintenance: 'bg-red-50 text-red-600 border border-red-100',
};

const getTrendIcon = (trend: TrendDirection) =>
  trend === 'up' ? (
    <TrendingUp className="w-4 h-4 text-green-500" />
  ) : (
    <TrendingDown className="w-4 h-4 text-red-500" />
  );

function AgentPerformanceDashboard() {
  const { state } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState('default');
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState<AgentPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchPerformance = useCallback(async () => {
    if (!state.user) return;

    setError(null);

    if (!hasLoadedRef.current) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    const controller = new AbortController();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = controller;

    try {
      const response = await fetch(
        `/api/agent/performance/${selectedAgent}?timeRange=${timeRange}`,
        {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        }
      );

      const payload: unknown = await response.json();

      if (!response.ok) {
        const message =
          (payload && typeof payload === 'object' && 'message' in payload
            ? (payload as { message?: string }).message
            : undefined) ||
          (payload && typeof payload === 'object' && 'error' in payload
            ? (payload as { error?: string }).error
            : undefined) ||
          'Failed to load agent performance';
        throw new Error(message);
      }

      const typedPayload = payload as { data?: AgentPerformanceData };
      if (!typedPayload.data) {
        throw new Error('Agent performance response was empty');
      }

      setData(typedPayload.data);
      setLastUpdated(
        typedPayload.data.dataRefreshed
          ? new Date(typedPayload.data.dataRefreshed)
          : new Date()
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      console.error('Error fetching agent performance:', err);
      setError((err as Error).message || 'Unable to load agent metrics');
      setData(null);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [state.user, selectedAgent, timeRange]);

  useEffect(() => {
    if (!state.user) return;

    fetchPerformance();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [state.user, fetchPerformance]);

  const statusBadge =
    statusBadgeMap[data?.agent?.status ?? ''] ||
    'bg-neural-100 text-neural-600 border border-neural-200';

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-neural-600">Loading agent performance...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!data) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
          <div className="max-w-lg text-center">
            <h2 className="text-2xl font-semibold text-neural-900 mb-3">
              {error || 'Unable to load agent metrics'}
            </h2>
            <p className="text-neural-600 mb-6">
              Confirm your session is active and refresh the metrics.
            </p>
            <button
              onClick={() => fetchPerformance()}
              className="btn-primary"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing…' : 'Retry fetch'}
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="agent-perf-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="currentColor"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#agent-perf-grid)"/>
            </svg>
          </div>
          <div className="container-custom text-center relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Activity className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {data?.agent?.name ?? 'AI Agent'}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-2">
              Monitoring {data?.agent?.type ?? 'Assistant'} ·{' '}
              {timeRangeOptions.find((t) => t.id === timeRange)?.name}
            </p>
            {lastUpdated && (
              <p className="text-sm text-white/70 mb-6">
                Last updated{' '}
                {lastUpdated.toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-white text-brand-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>

        {/* Controls Section */}
        <section className="py-6 px-4 bg-white border-b border-gray-200">
          <div className="container-custom">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Select agent
                  </label>
                  <select
                    value={selectedAgent}
                    onChange={(event) => setSelectedAgent(event.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  >
                    {agentOptions.map((agentOption) => (
                      <option key={agentOption.id} value={agentOption.id}>
                        {agentOption.icon} {agentOption.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Time range
                  </label>
                  <select
                    value={timeRange}
                    onChange={(event) => setTimeRange(event.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  >
                    {timeRangeOptions.map((range) => (
                      <option key={range.id} value={range.id}>
                        {range.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-xs uppercase text-gray-500 mb-1">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusBadge}`}
                  >
                    {(data?.agent?.status ?? 'idle').charAt(0).toUpperCase() +
                      (data?.agent?.status ?? 'idle').slice(1)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => fetchPerformance()}
                className="btn-primary inline-flex items-center gap-2"
                disabled={isRefreshing}
              >
                <RefreshCcw
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing ? 'Refreshing…' : 'Refresh data'}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <section className="py-4 px-4 bg-yellow-50 border-b border-yellow-200">
            <div className="container-custom">
              <p className="font-medium text-yellow-800">Real-time fetch warning</p>
              <p className="text-sm mt-1 text-yellow-700">{error}</p>
            </div>
          </section>
        )}

        {/* Performance Content */}
        <section className="py-12 px-4 bg-gray-50">
          <div className="container-custom">
            {/* Agent Info Card */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-8">
              <div className="flex items-center gap-4">
                <div
                  className="text-5xl"
                  role="img"
                  aria-label={data?.agent?.name ?? 'AI Agent'}
                >
                  {data?.agent?.avatar ?? '🤖'}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {data?.agent?.name ?? 'AI Agent'}
                  </h2>
                  <p className="text-gray-600">
                    {data?.agent?.type ?? 'Assistant'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {(data?.metrics?.totalConversations ?? 0).toLocaleString()}{' '}
                    conversations in this window
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
            {[
              {
                label: 'Total conversations',
                value: (
                  data?.metrics?.totalConversations ?? 0
                ).toLocaleString(),
                change: data?.trends?.conversations?.change ?? '+0%',
                icon: MessageSquare,
                trend: data?.trends?.conversations?.trend ?? 'up',
              },
              {
                label: 'Total messages',
                value: (data?.metrics?.totalMessages ?? 0).toLocaleString(),
                change: data?.trends?.messages?.change ?? '+0%',
                icon: Zap,
                trend: data?.trends?.messages?.trend ?? 'up',
              },
              {
                label: 'Avg response time',
                value: `${(data?.metrics?.averageResponseTime ?? 0).toFixed(
                  1
                )} s`,
                change: data?.trends?.responseTime?.change ?? '+0%',
                icon: Clock,
                trend: data?.trends?.responseTime?.trend ?? 'up',
              },
              {
                label: 'Satisfaction score',
                value: `${(data?.metrics?.satisfactionScore ?? 0).toFixed(
                  1
                )}/5`,
                change: data?.trends?.satisfaction?.change ?? '+0%',
                icon: Target,
                trend: data?.trends?.satisfaction?.trend ?? 'up',
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="bg-white rounded-2xl border border-neural-200 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-neural-500">{metric.label}</p>
                  <metric.icon className="w-5 h-5 text-brand-500" />
                </div>
                <p className="text-3xl font-bold text-neural-900">
                  {metric.value}
                </p>
                <p
                  className={`text-sm mt-2 flex items-center gap-1 ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {getTrendIcon(metric.trend)}
                  {metric.change}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            <div className="bg-white rounded-3xl border border-neural-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-neural-500">Active users</p>
                  <p className="text-3xl font-bold text-neural-900">
                    {(data?.metrics?.activeUsers ?? 0).toLocaleString()}
                  </p>
                </div>
                <Users className="w-6 h-6 text-brand-500" />
              </div>
              <p className="text-sm text-neural-600">
                Unique people who interacted with this agent during the selected
                window.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-neural-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-neural-500">Uptime</p>
                  <p className="text-3xl font-bold text-neural-900">
                    {data?.metrics?.uptime ?? 99.9}%
                  </p>
                </div>
                <Activity className="w-6 h-6 text-brand-500" />
              </div>
              <p className="text-sm text-neural-600">
                Availability is tracked via health pings from the agent runtime.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-neural-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-neural-500">Response insights</p>
                  <p className="text-3xl font-bold text-neural-900">
                    {(data?.metrics?.averageResponseTime ?? 0).toFixed(1)}s
                  </p>
                </div>
                <Clock className="w-6 h-6 text-brand-500" />
              </div>
              <p className="text-sm text-neural-600">
                Aim to keep response times under 2s for best satisfaction.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-neural-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-neural-500">Recent activity</p>
                <h3 className="text-xl font-semibold text-neural-900">
                  Conversation timeline
                </h3>
              </div>
            </div>
            {(data?.recentActivity?.length ?? 0) === 0 ? (
              <p className="text-neural-500">
                No conversations during this window.
              </p>
            ) : (
              <ul className="space-y-4">
                {(data?.recentActivity ?? []).map((activity) => (
                  <li
                    key={`${activity.timestamp}-${activity.user}`}
                    className="flex items-start gap-4 border-b border-neural-100 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-sm font-semibold">
                      {activity.user?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1">
                      <p className="text-neural-900 font-medium">
                        {activity.description}
                      </p>
                      <p className="text-sm text-neural-500 mt-1">
                        {activity.user || 'Anonymous user'}
                      </p>
                    </div>
                    <div className="text-right text-sm text-neural-500">
                      {activity.timestamp}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}

export default function AgentPerformancePage() {
  return <AgentPerformanceDashboard />;
}
