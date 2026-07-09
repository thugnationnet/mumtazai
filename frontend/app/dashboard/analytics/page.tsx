'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  RefreshCcw,
  Download,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import type { AnalyticsData } from '@/models/analytics';
import AdvancedCharts from '@/components/AdvancedCharts';
import { exportAnalyticsToPDF } from '@/lib/pdfExport';

export const dynamic = 'force-dynamic';

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDateLabel = (value: string) => {
  try {
    return new Date(value).toLocaleDateString('en-US', {
      weekday: 'short',
    });
  } catch {
    return value;
  }
};

const formatTimestamp = (value: string) => {
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const statusColorMap: Record<string, string> = {
  success: 'bg-green-50 text-green-700 border-green-100',
  completed: 'bg-green-50 text-green-700 border-green-100',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  failed: 'bg-red-50 text-red-600 border-red-100',
  error: 'bg-red-50 text-red-600 border-red-100',
};

export default function DashboardAnalyticsPage() {
  const { state } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchAnalytics = useCallback(async () => {
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
      const response = await fetch('/api/user/analytics', {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        const message =
          (payload && typeof payload === 'object' && 'error' in payload
            ? (payload as { error?: string }).error
            : undefined) ||
          (payload && typeof payload === 'object' && 'message' in payload
            ? (payload as { message?: string }).message
            : undefined) ||
          'Failed to load analytics';
        throw new Error(message);
      }

      setAnalyticsData(payload as AnalyticsData);
      setLastUpdated(new Date());
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      console.error('Error fetching analytics:', err);
      setError((err as Error).message || 'Unable to load analytics');
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [state.user]);

  const handleExportPDF = useCallback(async () => {
    if (!analyticsData) return;

    try {
      await exportAnalyticsToPDF(analyticsData, {
        filename: `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
        title: 'Analytics Report',
        includeCharts: true,
        includeTables: true,
        includeMetrics: true,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('Failed to export PDF report');
    }
  }, [analyticsData, setError]);

  useEffect(() => {
    if (!state.user) return;

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);

    return () => {
      clearInterval(interval);
      abortControllerRef.current?.abort();
    };
  }, [state.user, fetchAnalytics]);

  const averageResponseTime = analyticsData?.agentPerformance?.length
    ? (
        analyticsData.agentPerformance.reduce(
          (sum, agent) => sum + (agent.avgResponseTime || 0),
          0
        ) / analyticsData.agentPerformance.length
      ).toFixed(0)
    : '0';

  const successRate = analyticsData?.agentPerformance?.length
    ? (
        analyticsData.agentPerformance.reduce(
          (sum, agent) => sum + (agent.successRate || 0),
          0
        ) / analyticsData.agentPerformance.length
      ).toFixed(1)
    : '0.0';

  const totalMessages =
    analyticsData?.dailyUsage?.reduce(
      (sum, day) => sum + (day.messages || 0),
      0
    ) || 0;

  const dailyUsageMax =
    analyticsData?.dailyUsage?.reduce((max, day) => {
      const total = day.conversations + day.messages + day.apiCalls;
      return Math.max(max, total);
    }, 0) || 1;

  const metricCards = analyticsData
    ? [
        {
          label: 'Conversations',
          value: (analyticsData?.usage?.conversations?.current ?? 0).toLocaleString(),
          delta: analyticsData?.weeklyTrend?.conversationsChange ?? '+0%',
          icon: MessageSquare,
        },
        {
          label: 'API Calls',
          value: (analyticsData?.usage?.apiCalls?.current ?? 0).toLocaleString(),
          delta: analyticsData?.weeklyTrend?.apiCallsChange ?? '+0%',
          icon: Zap,
        },
        {
          label: 'Active Agents',
          value: (analyticsData?.usage?.agents?.current ?? 0).toString(),
          delta: `${analyticsData?.usage?.agents?.current ?? 0}/${analyticsData?.usage?.agents?.limit ?? 10} in use`,
          icon: Users,
        },
        {
          label: 'Messages Sent',
          value: (analyticsData?.usage?.messages?.current ?? 0).toLocaleString(),
          delta: analyticsData?.weeklyTrend?.messagesChange ?? '+0%',
          icon: Activity,
        },
      ]
    : [];

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-neural-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-neural-600">Loading analytics...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!analyticsData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-neural-50 to-white flex items-center justify-center px-4">
          <div className="max-w-lg text-center">
            <h2 className="text-2xl font-semibold text-neural-900 mb-3">
              {error || 'We could not load your analytics.'}
            </h2>
            <p className="text-neural-600 mb-6">
              Please verify your session is active and refresh to try again.
            </p>
            <button
              onClick={() => fetchAnalytics()}
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

  const recentDailyUsage = analyticsData.dailyUsage.slice(-7);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="analytics-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="currentColor"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#analytics-grid)"/>
            </svg>
          </div>
          <div className="container-custom text-center relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Activity className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Analytics & Insights</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-4">
              Real-time visibility into usage, performance, and costs
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
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                disabled={!analyticsData}
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={() => fetchAnalytics()}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                disabled={isRefreshing}
              >
                <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center bg-white text-brand-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-lg"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <section className="py-4 px-4 bg-yellow-50 border-b border-yellow-200">
            <div className="container-custom">
              <p className="font-medium text-yellow-800">Live data warning</p>
              <p className="text-sm mt-1 text-yellow-700">{error}</p>
            </div>
          </section>
        )}

        <section className="py-12 px-4 bg-gray-50">
          <div className="container-custom space-y-10">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
              {metricCards.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 bg-white rounded-2xl border border-neural-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-neural-500">{metric.label}</p>
                    <metric.icon className="w-5 h-5 text-brand-500" />
                  </div>
                  <p className="text-3xl font-bold text-neural-900">
                    {metric.value}
                  </p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {metric.delta}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-neural-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neural-500">Usage overview</p>
                    <h3 className="text-xl font-semibold text-neural-900">
                      Last 7 days traffic
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    {analyticsData.weeklyTrend.conversationsChange} vs last week
                  </span>
                </div>
                <div className="mt-8 flex items-end gap-4">
                  {recentDailyUsage.map((day) => {
                    const total =
                      day.conversations + day.messages + day.apiCalls;
                    const height = Math.min(
                      100,
                      Math.max(6, (total / dailyUsageMax) * 100)
                    );
                    return (
                      <div key={day.date} className="flex-1">
                        <div className="w-full h-40 bg-neural-100/70 rounded-2xl relative overflow-hidden">
                          <div
                            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-600 via-brand-500 to-brand-400"
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                        <p className="mt-3 text-xs font-medium text-neural-600 text-center">
                          {formatDateLabel(day.date)}
                        </p>
                        <p className="text-xs text-neural-500 text-center">
                          {total.toLocaleString()} events
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-neural-500">Conversations</p>
                    <p className="text-lg font-semibold text-neural-900">
                      {(analyticsData?.usage?.conversations?.current ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-neural-500">Messages</p>
                    <p className="text-lg font-semibold text-neural-900">
                      {(analyticsData?.usage?.messages?.current ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-neural-500">API Calls</p>
                    <p className="text-lg font-semibold text-neural-900">
                      {(analyticsData?.usage?.apiCalls?.current ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-neural-500">Total messages (30d)</p>
                    <p className="text-lg font-semibold text-neural-900">
                      {(totalMessages ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-neural-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-neural-500">Cost analysis</p>
                    <h3 className="text-xl font-semibold text-neural-900">
                      Spend overview
                    </h3>
                  </div>
                  <DollarSign className="w-5 h-5 text-brand-500" />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase text-neural-500">
                      Current month
                    </p>
                    <p className="text-3xl font-bold text-neural-900">
                      {formatCurrency(analyticsData.costAnalysis.currentMonth)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neural-500">Projected spend</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        analyticsData.costAnalysis.projectedMonth
                      )}
                    </span>
                  </div>
                </div>
                <ul className="mt-6 space-y-4">
                  {analyticsData.costAnalysis.breakdown.map((item) => (
                    <li
                      key={item.category}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium text-neural-900">
                          {item.category}
                        </p>
                        <p className="text-neural-500">
                          {item.percentage}% of spend
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(item.cost)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-neural-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Billing data updates hourly
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl border border-neural-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-neural-500">Team performance</p>
                    <h3 className="text-xl font-semibold text-neural-900">
                      Agent response quality
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    {successRate}% avg success
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-neural-500">
                        <th className="py-3 text-left font-medium">Agent</th>
                        <th className="py-3 text-left font-medium">
                          Conversations
                        </th>
                        <th className="py-3 text-left font-medium">
                          Avg response
                        </th>
                        <th className="py-3 text-left font-medium">Success</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.agentPerformance.map((agent) => (
                        <tr
                          key={agent.name}
                          className="border-t border-neural-100"
                        >
                          <td className="py-3">
                            <p className="font-medium text-neural-900">
                              {agent.name || 'Unknown Agent'}
                            </p>
                            <p className="text-xs text-neural-500">
                              {(agent.messages ?? 0).toLocaleString()} messages
                            </p>
                          </td>
                          <td className="py-3 text-neural-900">
                            {(agent.conversations ?? 0).toLocaleString()}
                          </td>
                          <td className="py-3 text-neural-900">
                            {((agent.avgResponseTime ?? 0) / 1000).toFixed(1)}s
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-neural-200 rounded-full overflow-hidden">
                                <div
                                  className="h-2 bg-brand-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      agent.successRate
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-neural-900">
                                {agent.successRate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-neural-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-neural-500">Latest activity</p>
                    <h3 className="text-xl font-semibold text-neural-900">
                      Audit trail
                    </h3>
                  </div>
                  <TrendingDown className="w-5 h-5 text-brand-500" />
                </div>
                <ul className="space-y-4">
                  {analyticsData.recentActivity.length > 0 ? (
                    analyticsData.recentActivity.slice(0, 6).map((activity) => {
                    const statusKey = activity.status
                      ? activity.status.toLowerCase()
                      : '';
                    const badgeClass =
                      statusColorMap[statusKey] ||
                      'bg-neural-100 text-neural-600 border-neural-200';
                    return (
                      <li
                        key={`${activity.timestamp}-${activity.agent}`}
                        className="flex items-start justify-between gap-4 border-b border-neural-100 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium text-neural-900">
                            {activity.action}
                          </p>
                          <p className="text-sm text-neural-500">
                            {activity.agent}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${badgeClass}`}
                          >
                            {activity.status}
                          </span>
                          <p className="text-xs text-neural-500 mt-2">
                            {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                      </li>
                    );
                  })
                  ) : (
                    <li className="text-center py-8">
                      <div className="text-neural-400 mb-2">
                        <Activity className="w-12 h-12 mx-auto opacity-50" />
                      </div>
                      <p className="text-neural-500 font-medium">No recent activity</p>
                      <p className="text-sm text-neural-400 mt-1">
                        Start chatting with AI agents to see your activity here
                      </p>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Advanced Charts Section */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neural-900">
                    Advanced Analytics
                  </h2>
                  <p className="text-neural-600">
                    Interactive charts and detailed insights
                  </p>
                </div>
                <button
                  onClick={() => fetchAnalytics()}
                  className="btn-secondary inline-flex items-center gap-2"
                  disabled={isRefreshing}
                >
                  <RefreshCcw
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh Charts
                </button>
              </div>
              <AdvancedCharts analyticsData={analyticsData} />
            </div>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
