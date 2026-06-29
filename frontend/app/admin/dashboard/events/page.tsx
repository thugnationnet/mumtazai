'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
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
const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280', '#ef4444', '#06b6d4', '#ec4899'];

interface EventItem {
  id: string;
  userId: string | null;
  eventType: string;
  category: string;
  action: string;
  label: string | null;
  value: number | null;
  properties: Record<string, any> | null;
  durationMs: number | null;
  success: boolean | null;
  source: string;
  occurredAt: string;
  tags: string[];
  createdAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const limit = 30;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (type) params.set('eventType', type);
      if (category) params.set('category', category);
      const res = await fetch(`${API_BASE}/events?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setEvents(json.data.events || []);
        setTotal(json.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, type, category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  const totalPages = Math.ceil(total / limit);

  const categoryColors: Record<string, string> = {
    auth: 'bg-green-50 text-green-600',
    navigation: 'bg-blue-50 text-blue-600',
    engagement: 'bg-purple-50 text-purple-600',
    commerce: 'bg-yellow-50 text-yellow-600',
    system: 'bg-gray-100 text-gray-500',
    error: 'bg-red-50 text-red-600',
  };

  // Compute category distribution from current events
  const categoryDistribution = events.reduce<Record<string, number>>((acc, ev) => {
    acc[ev.category] = (acc[ev.category] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryDistribution).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Compute top event types
  const typeDistribution = events.reduce<Record<string, number>>((acc, ev) => {
    acc[ev.eventType] = (acc[ev.eventType] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeDistribution).map(([name, value]) => ({ name: name.length > 25 ? name.slice(0, 22) + '...' : name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

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
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-300/40 rounded-full text-orange-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  Events
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-orange-700 bg-clip-text text-transparent">Event Feed</h1>
                <p className="text-sm text-slate-500 mt-1">{total.toLocaleString()} events tracked</p>
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

      {/* Charts */}
      {events.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="relative glass-card p-5">
            <h3 className="text-sm font-medium text-slate-800 mb-4">Category Distribution</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Events']} contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="relative glass-card p-5">
            <h3 className="text-sm font-medium text-slate-800 mb-4">Top Event Types</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={14} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Event type..." value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs bg-white/60 border border-white/80 text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 w-44" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs bg-white/60 border border-white/80 text-slate-500 outline-none focus:border-blue-300">
          <option value="">All categories</option>
          {['auth', 'navigation', 'engagement', 'commerce', 'system', 'error'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Event List */}
      <div className="relative glass-card overflow-hidden">
        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No events found</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50/50">
                <div className="w-1 h-1 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-700 font-medium">{ev.eventType}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${categoryColors[ev.category] || 'bg-gray-100 text-gray-500'}`}>{ev.category}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                    <span>{new Date(ev.occurredAt).toLocaleString()}</span>
                    {ev.userId && <span>User: {ev.userId.slice(0, 8)}...</span>}
                    {ev.source && <span>Source: {ev.source}</span>}
                  </div>
                  {ev.properties && Object.keys(ev.properties).length > 0 && (
                    <div className="mt-1.5 text-[10px] text-slate-500 font-mono bg-slate-50 border border-slate-100 rounded px-2 py-1 max-w-md truncate">
                      {JSON.stringify(ev.properties).slice(0, 120)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
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
