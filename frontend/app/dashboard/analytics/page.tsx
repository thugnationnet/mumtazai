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
        <div className="min-h-screen neu-page-bg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading analytics...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!analyticsData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen neu-page-bg flex items-center justify-center px-4">
          <div className="max-w-lg text-center">
            <h2 className="text-2xl font-semibold text-slate-800 mb-3">
              {error || 'We could not load your analytics.'}
            </h2>
            <p className="text-slate-500 mb-6">
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
                <span className="text-purple-700 text-xs font-bold uppercase tracking-wider">Analytics</span>
              </div>
              <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-6">
                <Activity className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">Analytics & Insights</h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4">
                Real-time visibility into usage, performance, and costs
              </p>
              {lastUpdated && (
                <p className="text-sm text-slate-500 mb-6">
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
                  className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm text-slate-700 rounded-lg hover:bg-white/50 border border-white/60 transition-colors"
                  disabled={!analyticsData}
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={() => fetchAnalytics()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm text-slate-700 rounded-lg hover:bg-white/50 border border-white/60 transition-colors"
                  disabled={isRefreshing}
                >
                  <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing…' : 'Refresh'}
                </button>
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
                  className="p-6 glass-card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-400">{metric.label}</p>
                    <metric.icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">
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
              <div className="lg:col-span-2 glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Usage overview</p>
                    <h3 className="text-xl font-semibold text-slate-800">
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
                        <div className="w-full h-40 bg-white/40/70 rounded-2xl relative overflow-hidden">
                          <div
                            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400"
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                        <p className="mt-3 text-xs font-medium text-slate-500 text-center">
                          {formatDateLabel(day.date)}
                        </p>
                        <p className="text-xs text-slate-400 text-center">
                          {total.toLocaleString()} events
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Conversations</p>
                    <p className="text-lg font-semibold text-slate-800">
                      {(analyticsData?.usage?.conversations?.current ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Messages</p>
                    <p className="text-lg font-semibold text-slate-800">
                      {(analyticsData?.usage?.messages?.current ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">API Calls</p>
                    <p className="text-lg font-semibold text-slate-800">
                      {(analyticsData?.usage?.apiCalls?.current ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total messages (30d)</p>
                    <p className="text-lg font-semibold text-slate-800">
                      {(totalMessages ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-400">Cost analysis</p>
                    <h3 className="text-xl font-semibold text-slate-800">
                      Spend overview
                    </h3>
                  </div>
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase text-slate-400">
                      Current month
                    </p>
                    <p className="text-3xl font-bold text-slate-800">
                      {formatCurrency(analyticsData.costAnalysis.currentMonth)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Projected spend</span>
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
                        <p className="font-medium text-slate-800">
                          {item.category}
                        </p>
                        <p className="text-slate-400">
                          {item.percentage}% of spend
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(item.cost)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Billing data updates hourly
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-400">Team performance</p>
                    <h3 className="text-xl font-semibold text-slate-800">
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
                      <tr className="text-slate-400">
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
                          className="border-t border-white/80"
                        >
                          <td className="py-3">
                            <p className="font-medium text-slate-800">
                              {agent.name || 'Unknown Agent'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {(agent.messages ?? 0).toLocaleString()} messages
                            </p>
                          </td>
                          <td className="py-3 text-slate-800">
                            {(agent.conversations ?? 0).toLocaleString()}
                          </td>
                          <td className="py-3 text-slate-800">
                            {((agent.avgResponseTime ?? 0) / 1000).toFixed(1)}s
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-2 bg-blue-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      agent.successRate
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-slate-800">
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

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-400">Latest activity</p>
                    <h3 className="text-xl font-semibold text-slate-800">
                      Audit trail
                    </h3>
                  </div>
                  <TrendingDown className="w-5 h-5 text-blue-500" />
                </div>
                <ul className="space-y-4">
                  {analyticsData.recentActivity.length > 0 ? (
                    analyticsData.recentActivity.slice(0, 6).map((activity) => {
                    const statusKey = activity.status
                      ? activity.status.toLowerCase()
                      : '';
                    const badgeClass =
                      statusColorMap[statusKey] ||
                      'bg-white/40 text-slate-500 border-white/80';
                    return (
                      <li
                        key={`${activity.timestamp}-${activity.agent}`}
                        className="flex items-start justify-between gap-4 border-b border-white/80 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium text-slate-800">
                            {activity.action}
                          </p>
                          <p className="text-sm text-slate-400">
                            {activity.agent}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${badgeClass}`}
                          >
                            {activity.status}
                          </span>
                          <p className="text-xs text-slate-400 mt-2">
                            {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                      </li>
                    );
                  })
                  ) : (
                    <li className="text-center py-8">
                      <div className="text-slate-400 mb-2">
                        <Activity className="w-12 h-12 mx-auto opacity-50" />
                      </div>
                      <p className="text-slate-400 font-medium">No recent activity</p>
                      <p className="text-sm text-slate-400 mt-1">
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
                  <h2 className="text-2xl font-bold text-slate-800">
                    Advanced Analytics
                  </h2>
                  <p className="text-slate-500">
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
