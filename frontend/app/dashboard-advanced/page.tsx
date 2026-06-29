'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

interface ApiMetrics {
  date: string;
  requests: number;
  latency: number;
  successRate: number;
  failureRate: number;
  tokenUsage: number;
  responseSize: number;
}

interface ModelUsage {
  model: string;
  usage: number;
  percentage: number;
  color: string;
}

interface ErrorType {
  type: string;
  count: number;
  percentage: number;
}

interface GeographicData {
  region: string;
  requests: number;
  percentage: number;
}

interface PeakTraffic {
  hour: number;
  requests: number;
}

interface CostData {
  model: string;
  cost: number;
  percentage: number;
}

interface TokenTrendPoint {
  date: string;
  tokens: number;
}

interface DashboardStats {
  totalRequests: number;
  requestChange: number;
  avgLatency: number;
  latencyChange: number;
  avgSuccessRate: number;
  successChange: number;
  totalCost: number;
}

interface AdvancedAnalyticsPayload {
  stats: DashboardStats;
  apiMetrics: ApiMetrics[];
  modelUsage: ModelUsage[];
  successFailure: { day: string; successful: number; failed: number }[];
  peakTraffic: PeakTraffic[];
  errors: ErrorType[];
  geographic: GeographicData[];
  costData: CostData[];
  tokenTrend: TokenTrendPoint[];
}

export default function AdvancedDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiMetrics, setApiMetrics] = useState<ApiMetrics[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [successFailure, setSuccessFailure] = useState<
    AdvancedAnalyticsPayload['successFailure']
  >([]);
  const [peakTraffic, setPeakTraffic] = useState<PeakTraffic[]>([]);
  const [errors, setErrors] = useState<ErrorType[]>([]);
  const [geographic, setGeographic] = useState<GeographicData[]>([]);
  const [costData, setCostData] = useState<CostData[]>([]);
  const [tokenTrend, setTokenTrend] = useState<TokenTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/user/analytics/advanced', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`Failed to load analytics: ${res.status}`);
        }

        const data: AdvancedAnalyticsPayload = await res.json();

        if (!isMounted) return;

        setStats(data.stats);
        setApiMetrics(data.apiMetrics || []);
        setModelUsage(data.modelUsage || []);
        setSuccessFailure(data.successFailure || []);
        setPeakTraffic(data.peakTraffic || []);
        setErrors(data.errors || []);
        setGeographic(data.geographic || []);
        setCostData(data.costData || []);
        setTokenTrend(data.tokenTrend || []);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to load advanced analytics', err);
        setError('Failed to load analytics data');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchAnalytics, 30 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-card p-8 border border-red-200 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 neu-hero overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="advanced-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#advanced-grid)" />
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 neu-hero-icon mb-6">
            <BarChart3 className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Advanced Analytics
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Monitor your AI API usage, performance metrics, and cost analysis
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>

      {/* Analytics Content */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container-custom">
          {/* Key Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                icon: '📊',
                label: 'Total Requests (7d)',
                value: stats.totalRequests.toLocaleString(),
                change: `${stats.requestChange > 0 ? '+' : ''}${
                  stats.requestChange
                }%`,
                positive: stats.requestChange >= 0,
                gradient: 'from-blue-500 to-indigo-500',
              },
              {
                icon: '⚡',
                label: 'Avg Latency',
                value: `${stats.avgLatency}ms`,
                change: `${stats.latencyChange > 0 ? '+' : ''}${
                  stats.latencyChange
                }%`,
                positive: stats.latencyChange <= 0,
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: '✅',
                label: 'Success Rate',
                value: `${stats.avgSuccessRate}%`,
                change: `${stats.successChange > 0 ? '+' : ''}${
                  stats.successChange
                }%`,
                positive: stats.successChange >= 0,
                gradient: 'from-green-500 to-emerald-500',
              },
              {
                icon: '💰',
                label: 'Est. Weekly Cost',
                value: `$${stats.totalCost.toFixed(2)}`,
                change: 'Last 7 days',
                positive: true,
                gradient: 'from-yellow-500 to-orange-500',
              },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="glass-card p-6 hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-2">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                  <p
                    className={`text-sm mt-2 font-medium ${
                      stat.positive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Row 1: API Requests & Latency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Requests */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🧭</span>
                </div>
                API Requests (Last 7 Days)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={apiMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Average Latency */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                Average Latency (ms)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={apiMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="latency" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Model Usage & Success vs Failure */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Usage Distribution */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🧠</span>
                </div>
                Model Usage Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={modelUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ model, percentage }) =>
                      `${model} (${percentage}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="usage"
                  >
                    {modelUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ color: '#374151' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Success vs Failure Rate */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">📈</span>
                </div>
                Request Success vs Failure Rate
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={successFailure}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="successful"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar dataKey="failed" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Token Usage & Peak Traffic */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Token Usage Trend */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🔄</span>
                </div>
                Token Usage Trend
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tokenTrend}>
                  <defs>
                    <linearGradient
                      id="colorTokens"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorTokens)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Peak Traffic Hours */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🕓</span>
                </div>
                Peak Traffic Hours
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={peakTraffic}>
                  <defs>
                    <linearGradient
                      id="colorTraffic"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="hour"
                    stroke="#6b7280"
                    label={{
                      value: 'Hour of Day',
                      position: 'insideBottomRight',
                      offset: -5,
                    }}
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ color: '#374151' }}
                    formatter={(value) => [`${value} requests`, 'Requests']}
                    labelFormatter={(label) => `${label}:00`}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorTraffic)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 4: Error Types, Geographic & Cost */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Error Type Breakdown */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🧩</span>
                </div>
                Error Type Breakdown
              </h2>
              <div className="space-y-4">
                {errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{error.type}</p>
                      <p className="text-sm text-gray-500">
                        {error.count} errors
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-red-600">{error.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🌍</span>
                </div>
                Geographic Distribution
              </h2>
              <div className="space-y-4">
                {geographic.map((region, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-gray-900">{region.region}</p>
                      <span className="text-sm text-gray-500">
                        {region.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                        style={{ width: `${region.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Estimation by Model */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                Cost by Model
              </h2>
              <div className="space-y-4">
                {costData.map((cost, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{cost.model}</p>
                      <p className="text-sm text-gray-500">
                        {cost.percentage}% of total
                      </p>
                    </div>
                    <div className="text-right font-bold text-green-600">
                      ${cost.cost.toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ${costData.reduce((sum, c) => sum + c.cost, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Response Size & Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Average Response Size */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🧾</span>
                </div>
                Average Response Size
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={apiMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis
                    stroke="#6b7280"
                    label={{ value: 'KB', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ color: '#374151' }}
                    formatter={(value) => [`${value} KB`, 'Size']}
                  />
                  <Line
                    type="monotone"
                    dataKey="responseSize"
                    stroke="#ec4899"
                    strokeWidth={3}
                    dot={{ fill: '#ec4899', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats Table */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Summary Statistics</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-600">Total API Calls</span>
                  <span className="font-bold text-gray-900">
                    {stats.totalRequests.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-600">Average Latency</span>
                  <span className="font-bold text-gray-900">{stats.avgLatency}ms</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-bold text-green-600">
                    {stats.avgSuccessRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-600">Weekly Cost</span>
                  <span className="font-bold text-green-600">
                    ${stats.totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-600">Agents Used</span>
                  <span className="font-bold text-gray-900">{modelUsage.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-600">Error Count</span>
                  <span className="font-bold text-red-600">
                    {errors.reduce((sum, e) => sum + e.count, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="glass-card p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-gray-600">
                Live data • Auto-refreshes every 30 seconds
              </p>
            </div>
            <p className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
