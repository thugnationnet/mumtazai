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
    auth: 'bg-green-500/10 text-green-400',
    navigation: 'bg-blue-500/10 text-blue-400',
    engagement: 'bg-purple-500/10 text-purple-400',
    commerce: 'bg-yellow-500/10 text-yellow-400',
    system: 'bg-gray-500/10 text-gray-400',
    error: 'bg-red-500/10 text-red-400',
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
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Event Feed</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} events tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${autoRefresh ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06]'}`}>
            {autoRefresh ? '● Live' : '○ Paused'}
          </button>
          <button onClick={fetchData} disabled={loading} className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/[0.06]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Charts */}
      {events.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white mb-4">Category Distribution</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Events']} contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white mb-4">Top Event Types</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
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
          <Filter className="w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Event type..." value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-white/[0.06] text-white placeholder-gray-600 outline-none focus:border-violet-500/30 w-44" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-white/[0.06] text-gray-400 outline-none">
          <option value="">All categories</option>
          {['auth', 'navigation', 'engagement', 'commerce', 'system', 'error'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Event List */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No events found</div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02]">
                <div className="w-1 h-1 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-white font-medium">{ev.eventType}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${categoryColors[ev.category] || 'bg-gray-500/10 text-gray-400'}`}>{ev.category}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
                    <span>{new Date(ev.occurredAt).toLocaleString()}</span>
                    {ev.userId && <span>User: {ev.userId.slice(0, 8)}...</span>}
                    {ev.source && <span>Source: {ev.source}</span>}
                  </div>
                  {ev.properties && Object.keys(ev.properties).length > 0 && (
                    <div className="mt-1.5 text-[10px] text-gray-600 font-mono bg-white/[0.02] rounded px-2 py-1 max-w-md truncate">
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
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/[0.06] disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/[0.06] disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
