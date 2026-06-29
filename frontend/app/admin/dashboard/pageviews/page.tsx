'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw, TrendingUp, ExternalLink } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_BASE = '/api/admin/dashboard';

interface PageViewData {
  topPages: Array<{ url: string; views: number }>;
  timeline: Array<{ date: string; count: number }>;
  total: number;
  period: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="text-slate-700 font-bold">{payload[0].value.toLocaleString()} views</p>
    </div>
  );
};

export default function PageViewsPage() {
  const [data, setData] = useState<PageViewData | null>(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pageviews?period=${period}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setData({ ...json.data, timeline: json.data.timeline || [], topPages: json.data.topPages || [] });
    } catch (err) {
      console.error('Failed to fetch pageviews:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  return (
    <div className="min-h-full themed-section-bg">
      {/* Hero Header */}
      <section className="relative py-10 overflow-hidden rounded-b-[2rem]">
        <div className="absolute -top-20 -right-10 w-[200px] h-[600px] rotate-[-25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-indigo-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 left-[10%] w-[180px] h-[700px] rotate-[20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 right-[30%] w-[160px] h-[500px] rotate-[-35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-blue-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -left-10 w-[220px] h-[550px] rotate-[30deg] rounded-[100px] bg-gradient-to-t from-transparent via-purple-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-300/40 rounded-full text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Pages
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-blue-700 bg-clip-text text-transparent">Page Views</h1>
                <p className="text-sm text-slate-500 mt-1">Content analytics & top pages</p>
              </div>
              <div className="flex items-center gap-2">
                {['24h', '7d', '30d', '90d'].map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-500 bg-white/50 border border-white/60 hover:border-purple-300'}`}>{p}</button>
                ))}
                <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-2 py-1.5 rounded-lg text-xs transition-all ${autoRefresh ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {autoRefresh ? '● Live' : '○ Paused'}
                </button>
                <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/50 text-slate-500 border border-white/60 hover:border-purple-300 transition-all">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

      {data && (
        <>
          <div className="relative glass-card p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-slate-700">Total Page Views</h3>
              <span className="text-xs text-slate-400">{period}</span>
            </div>
            <p className="text-3xl font-bold text-slate-700">{data.total.toLocaleString()}</p>
          </div>

          {/* Area Chart */}
          <div className="relative glass-card p-5">
            <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" /> Views Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(data.timeline || []).map(t => ({ ...t, date: t.date.slice(5) }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#pvGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Pages with Bar Chart */}
          <div className="relative glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" /> Top Pages
              </h3>
            </div>
            {data.topPages.length > 0 && (
              <div className="p-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data.topPages || []).slice(0, 10).map(p => ({ name: p.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 30), views: p.views }))} layout="vertical" margin={{ left: 120, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="views" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {(data.topPages || []).length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No page views in this period</div>
            )}
            {/* Details Table */}
            {(data.topPages || []).length > 0 && (
              <div className="border-t border-slate-100">
                {(data.topPages || []).map((page, i) => {
                  const pct = ((page.views / ((data.topPages || [])[0]?.views || 1)) * 100).toFixed(0);
                  return (
                    <div key={page.url} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50">
                      <span className="text-xs text-slate-400 w-6 text-right font-mono">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 font-mono truncate">{page.url}</p>
                        <div className="h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-700 tabular-nums">{page.views.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
