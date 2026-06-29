'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Eye,
  MousePointerClick,
  Activity,
  MessageSquare,
  Zap,
  CreditCard,
  Server,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Wifi,
  WifiOff,
  TrendingUp,
  Timer,
  Globe,
  Wrench,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const API_BASE = '/api/admin/dashboard';

interface OverviewData {
  realtime: { activeSessions: number; timestamp: string };
  users: { total: number; newToday: number; new7d: number };
  visitors: { total: number; today: number; last7d: number };
  pageViews: { total: number; today: number; last7d: number; last30d: number };
  apiCalls: { today: number; last7d: number };
  chats: { today: number; last7d: number };
  tools: { today: number };
  events: { today: number };
  revenue: { total: number; transactions: number };
}

interface RealtimeData {
  activeSessions: number;
  activeVisitors: number;
  recentPageViews: Array<{
    url: string;
    visitorId: string;
    timestamp: string;
    userId: string | null;
  }>;
  recentApiCalls: Array<{
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    ipAddress: string;
    timestamp: string;
  }>;
  recentSessions: Array<{
    sessionId: string;
    visitorId: string;
    userId: string | null;
    startTime: string;
    lastActivity: string;
    pageViews: number;
    events: number;
    duration: number;
  }>;
  recentChats: number;
  recentErrors: number;
  timestamp: string;
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  subtitle,
  sparkline,
  sparkColor = '#8b5cf6',
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  gradient: string;
  subtitle?: string;
  sparkline?: number[];
  sparkColor?: string;
}) {
  const isPositive = change && !change.startsWith('-');
  const sparkData = sparkline?.map((v, i) => ({ v, i }));
  return (
    <div className="relative glass-card p-5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-1 transition-all duration-500 overflow-hidden">
      {sparkData && sparkData.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Area type="monotone" dataKey="v" stroke={sparkColor} fill={sparkColor} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70 ${gradient}`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {change}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-0.5 relative z-10">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-slate-500 relative z-10">{title}</p>
      {subtitle && <p className="text-[10px] text-slate-400 mt-1 relative z-10">{subtitle}</p>}
    </div>
  );
}

function LiveIndicator({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
      </span>
      <span className="text-sm font-medium text-green-600">{count} live</span>
    </div>
  );
}

function RealtimeFeed({ data, historyRef }: { data: RealtimeData | null; historyRef: React.MutableRefObject<{ sessions: number[]; visitors: number[]; errors: number[]; chats: number[] }> }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Active Sessions */}
      <div className="relative glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 neu-icon">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            Active Sessions
          </h3>
          <LiveIndicator count={data.activeSessions} />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {data.recentSessions.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              No active sessions
            </div>
          ) : (
            data.recentSessions.map((sess) => (
              <div
                key={sess.sessionId}
                className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 truncate font-mono">
                    {sess.userId
                      ? `User: ${sess.userId.slice(0, 8)}...`
                      : `Visitor: ${sess.visitorId.slice(0, 8)}...`}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {sess.pageViews} pages · {Math.floor(sess.duration / 60)}m{' '}
                    {sess.duration % 60}s
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {new Date(sess.lastActivity).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Page Views */}
      <div className="relative glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 neu-icon">
              <Eye className="w-4 h-4 text-white" />
            </div>
            Live Page Views
          </h3>
          <span className="text-xs text-slate-400">Last 5 min</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {data.recentPageViews.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              No recent page views
            </div>
          ) : (
            data.recentPageViews.map((pv, i) => (
              <div
                key={`${pv.visitorId}-${i}`}
                className="flex items-center gap-3 px-5 py-2 border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <p className="text-xs text-slate-500 truncate flex-1 font-mono">
                  {pv.url}
                </p>
                <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                  {new Date(pv.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent API Calls */}
      <div className="relative glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 neu-icon">
              <Server className="w-4 h-4 text-white" />
            </div>
            Live API Traffic
          </h3>
          <span className="text-xs text-slate-400">Last 1 min</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {data.recentApiCalls.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              No recent API calls
            </div>
          ) : (
            data.recentApiCalls.map((api, i) => (
              <div
                key={`${api.endpoint}-${i}`}
                className="flex items-center gap-2 px-5 py-2 border-b border-slate-50 hover:bg-slate-50 transition-colors text-xs"
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                    api.method === 'GET'
                      ? 'bg-green-50 text-green-600'
                      : api.method === 'POST'
                        ? 'bg-blue-50 text-blue-600'
                        : api.method === 'DELETE'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-yellow-50 text-yellow-600'
                  }`}
                >
                  {api.method}
                </span>
                <span className="text-slate-500 truncate flex-1 font-mono">
                  {api.endpoint}
                </span>
                <span
                  className={`text-[10px] font-mono ${
                    api.statusCode < 400 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {api.statusCode}
                </span>
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {api.responseTime}ms
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="relative glass-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 neu-icon">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Real-time Pulse
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-100">
          {[
            { label: 'Active Sessions', value: data.activeSessions, color: '#22c55e', history: historyRef.current.sessions },
            { label: 'Active Visitors', value: data.activeVisitors, color: '#3b82f6', history: historyRef.current.visitors },
            { label: 'Chats (5m)', value: data.recentChats, color: '#a855f7', history: historyRef.current.chats },
            { label: 'Errors (5m)', value: data.recentErrors, color: '#ef4444', history: historyRef.current.errors },
          ].map((item) => {
            const chartData = item.history.map((v, i) => ({ v, i }));
            return (
              <div key={item.label} className="bg-white/60 p-4 text-center relative overflow-hidden">
                {chartData.length > 1 && (
                  <div className="absolute inset-0 opacity-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Area type="monotone" dataKey="v" stroke={item.color} fill={item.color} strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-2xl font-bold relative z-10" style={{ color: item.color }}>
                  {item.value}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 relative z-10">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardOverview() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const historyRef = useRef<{ sessions: number[]; visitors: number[]; errors: number[]; chats: number[] }>({
    sessions: [], visitors: [], errors: [], chats: [],
  });

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/overview`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setOverview({ ...json.data, recentSessions: json.data.recentSessions || [], recentPageViews: json.data.recentPageViews || [], recentApiCalls: json.data.recentApiCalls || [] });
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    }
  }, []);

  const fetchRealtime = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/realtime`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setRealtime(json.data);
        const h = historyRef.current;
        h.sessions = [...h.sessions.slice(-19), json.data.activeSessions];
        h.visitors = [...h.visitors.slice(-19), json.data.activeVisitors];
        h.errors = [...h.errors.slice(-19), json.data.recentErrors];
        h.chats = [...h.chats.slice(-19), json.data.recentChats];
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch realtime:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), fetchRealtime()]);
    setLoading(false);
  }, [fetchOverview, fetchRealtime]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-refresh realtime every 15s
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchRealtime, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchRealtime]);

  // Refresh overview every 60s
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchOverview, 60000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchOverview]);

  return (
    <div className="min-h-full themed-section-bg">
      {/* Hero Header - Glass Pillar Glassmorphism */}
      <section className="relative py-10 overflow-hidden rounded-b-[2rem]">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  Admin Panel
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Dashboard Overview</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Real-time platform analytics & monitoring
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    autoRefresh
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {autoRefresh ? (
                    <Wifi className="w-3.5 h-3.5" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5" />
                  )}
                  {autoRefresh ? 'Live' : 'Paused'}
                </button>
                <button
                  onClick={refreshAll}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/50 text-slate-500 hover:text-slate-800 border border-white/60 hover:border-purple-300 hover:shadow transition-all"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
                <span className="text-[10px] text-slate-400">
                  Updated {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Loading */}
      {loading && !overview && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Users"
            value={overview.users.total}
            change={`+${overview.users.newToday} today`}
            icon={Users}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
          />
          <StatCard
            title="Active Sessions"
            value={overview.realtime.activeSessions}
            icon={Activity}
            gradient="bg-gradient-to-br from-green-500 to-emerald-500"
            subtitle="Right now"
          />
          <StatCard
            title="Visitors (7d)"
            value={overview.visitors.last7d}
            change={`${overview.visitors.today} today`}
            icon={Eye}
            gradient="bg-gradient-to-br from-purple-500 to-pink-500"
            subtitle={`${overview.visitors.total} total`}
          />
          <StatCard
            title="Page Views Today"
            value={overview.pageViews.today}
            icon={MousePointerClick}
            gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
            subtitle={`${overview.pageViews.last7d} this week`}
          />
          <StatCard
            title="API Calls Today"
            value={overview.apiCalls.today}
            icon={Server}
            gradient="bg-gradient-to-br from-orange-500 to-red-500"
            subtitle={`${overview.apiCalls.last7d} this week`}
          />
          <StatCard
            title="Chats Today"
            value={overview.chats.today}
            icon={MessageSquare}
            gradient="bg-gradient-to-br from-pink-500 to-rose-500"
            subtitle={`${overview.chats.last7d} this week`}
          />
          <StatCard
            title="Tool Uses Today"
            value={overview.tools.today}
            icon={Wrench}
            gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
          />
          <StatCard
            title="Events Today"
            value={overview.events.today}
            icon={Zap}
            gradient="bg-gradient-to-br from-indigo-500 to-purple-500"
          />
          <StatCard
            title="Revenue"
            value={`$${(overview.revenue.total / 100).toFixed(2)}`}
            icon={CreditCard}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
            subtitle={`${overview.revenue.transactions} transactions`}
          />
          <StatCard
            title="New Users (7d)"
            value={overview.users.new7d}
            change={`+${overview.users.newToday} today`}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-rose-500 to-pink-500"
          />
        </div>
      )}

      {/* Real-time feeds */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          Real-time Activity
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        </h2>
        <RealtimeFeed data={realtime} historyRef={historyRef} />
      </div>
      </div>
    </div>
  );
}
