'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ScrollText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
  MessageSquare,
  Wrench,
  Server,
  DollarSign,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_BASE = '/api/admin/dashboard';
const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f97316', '#ec4899', '#f59e0b', '#22c55e'];

interface ActivityItem {
  type: 'pageview' | 'session' | 'event' | 'api' | 'chat' | 'tool' | 'transaction';
  detail: string;
  userId?: string;
  visitorId?: string;
  ip?: string;
  source?: string;
  timestamp: string;
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const limit = 40;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/activity-log?limit=${limit}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setItems(json.data.activities || []);
        setTotal(json.data.activities?.length || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  const totalPages = Math.ceil(total / limit);

  const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    pageview: { icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
    session: { icon: User, color: 'text-green-600', bg: 'bg-green-50' },
    event: { icon: ScrollText, color: 'text-purple-600', bg: 'bg-purple-50' },
    api: { icon: Server, color: 'text-orange-600', bg: 'bg-orange-50' },
    chat: { icon: MessageSquare, color: 'text-pink-600', bg: 'bg-pink-50' },
    tool: { icon: Wrench, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    transaction: { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
  };

  // Compute type distribution for chart
  const typeDistribution = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="min-h-full themed-section-bg">
      {/* Hero Header */}
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
                  Activity
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Activity Log</h1>
                <p className="text-sm text-slate-500 mt-1">Unified timeline of all system activity</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-2 py-1.5 rounded-lg text-xs transition-all ${autoRefresh ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {autoRefresh ? '● Live' : '○ Paused'}
                </button>
                <button onClick={fetchData} disabled={loading} className="p-1.5 rounded-lg bg-white/50 text-slate-500 border border-white/60 hover:border-purple-300 transition-all">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Activity Type Breakdown */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="relative glass-card p-5">
            <h3 className="text-sm font-medium text-slate-800 mb-4">Activity Type Distribution</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Activities']} contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="relative glass-card p-5">
            <h3 className="text-sm font-medium text-slate-800 mb-4">By Type</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative glass-card overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No activity recorded yet</div>
        ) : (
          <div className="relative">
            <div className="absolute left-[27px] top-0 bottom-0 w-px bg-slate-200" />
            {items.map((item, i) => {
              const cfg = typeConfig[item.type] || typeConfig.event;
              const Icon = cfg.icon;
              return (
                <div key={String(item.timestamp) + i} className="flex gap-3 px-4 py-3 hover:bg-blue-50/50 relative">
                  <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 relative z-10`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-700 font-medium">{item.type}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>{item.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.detail}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                      <span>{timeSince(item.timestamp)}</span>
                      {item.userId && <span>User: {item.userId.slice(0, 8)}...</span>}
                      {item.visitorId && <span>Visitor: {item.visitorId.slice(0, 8)}...</span>}
                      {item.ip && <span>IP: {item.ip}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 tabular-nums">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page} of {totalPages} ({total.toLocaleString()} activities)</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg bg-white/60 text-slate-500 border border-white/80 hover:border-blue-300 disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg bg-white/60 text-slate-500 border border-white/80 hover:border-blue-300 disabled:opacity-30 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
