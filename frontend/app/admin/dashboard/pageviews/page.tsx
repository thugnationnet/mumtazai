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
    <div className="bg-[#1a1a1d] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-bold">{payload[0].value.toLocaleString()} views</p>
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
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Page Views</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Content analytics & top pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['24h', '7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'text-gray-400 bg-white/[0.03] border border-white/[0.06] hover:text-white'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${autoRefresh ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06]'}`}
          >
            {autoRefresh ? '● Live' : '○ Paused'}
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 text-gray-400 border border-white/[0.06]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-white">Total Page Views</h3>
              <span className="text-xs text-gray-500">{period}</span>
            </div>
            <p className="text-3xl font-bold text-white">{data.total.toLocaleString()}</p>
          </div>

          {/* Area Chart */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Views Over Time
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#pvGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Pages with Bar Chart */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-400" /> Top Pages
              </h3>
            </div>
            {data.topPages.length > 0 && (
              <div className="p-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data.topPages || []).slice(0, 10).map(p => ({ name: p.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 30), views: p.views }))} layout="vertical" margin={{ left: 120, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="views" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {(data.topPages || []).length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No page views in this period</div>
            )}
            {/* Details Table */}
            {(data.topPages || []).length > 0 && (
              <div className="border-t border-white/[0.06]">
                {(data.topPages || []).map((page, i) => {
                  const pct = ((page.views / ((data.topPages || [])[0]?.views || 1)) * 100).toFixed(0);
                  return (
                    <div key={page.url} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <span className="text-xs text-gray-600 w-6 text-right font-mono">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-mono truncate">{page.url}</p>
                        <div className="h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white tabular-nums">{page.views.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
