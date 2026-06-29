'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Package,
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
  Legend,
} from 'recharts';

const API_BASE = '/api/admin/dashboard';
const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#3b82f6'];

interface RevenueData {
  summary: {
    totalRevenue: number;
    transactionCount: number;
    avgAmount: number;
  };
  byType: Array<{ type: string; total: number; count: number }>;
  recentTransactions: Array<{
    id: string;
    userId: string | null;
    type: string;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    createdAt: string;
  }>;
  period: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-slate-700 font-bold">{payload[0].name}: ${(payload[0].value / 100).toFixed(2)}</p>
    </div>
  );
};

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/revenue?period=${period}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        const summary = d.summary || {};
        const revenue = summary.revenue || 0;
        const txCount = summary.totalTransactions || 0;
        setData({
          summary: {
            totalRevenue: revenue,
            transactionCount: txCount,
            avgAmount: txCount > 0 ? Math.round(revenue / txCount) : 0,
          },
          byType: (d.revenueByType || []).map((r: any) => ({ type: r.type, total: r.amount || 0, count: r.count || 0 })),
          recentTransactions: d.recentTransactions || [],
          period: d.period || period,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 60000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-50 text-green-600';
      case 'pending': return 'bg-yellow-50 text-yellow-600';
      case 'failed': return 'bg-red-50 text-red-600';
      case 'refunded': return 'bg-orange-50 text-orange-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const pieData = data?.byType.map((t) => ({ name: t.type, value: t.total })) || [];

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
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-300/40 rounded-full text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Revenue
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-emerald-700 bg-clip-text text-transparent">Revenue</h1>
                <p className="text-sm text-slate-500 mt-1">Transactions & earnings</p>
              </div>
              <div className="flex items-center gap-2">
                {['7d', '30d', '90d'].map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'text-slate-500 bg-white/50 border border-white/60 hover:border-purple-300'}`}>{p}</button>
                ))}
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

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 neu-icon"><DollarSign className="w-4 h-4 text-white" /></div>
                <span className="text-xs text-slate-400">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-green-600">${(data.summary.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 neu-icon"><CreditCard className="w-4 h-4 text-white" /></div>
                <span className="text-xs text-slate-400">Transactions</span>
              </div>
              <p className="text-3xl font-bold text-slate-700">{data.summary.transactionCount}</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 neu-icon"><TrendingUp className="w-4 h-4 text-white" /></div>
                <span className="text-xs text-slate-400">Avg Amount</span>
              </div>
              <p className="text-3xl font-bold text-slate-700">${(data.summary.avgAmount / 100).toFixed(2)}</p>
            </div>
          </div>

          {/* Revenue by Type — Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="relative glass-card p-5">
              <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" /> Revenue Distribution
              </h3>
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data</div>
              )}
            </div>

            {/* Bar Chart */}
            <div className="relative glass-card p-5">
              <h3 className="text-sm font-medium text-slate-700 mb-4">Revenue by Type</h3>
              {data.byType.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byType.map(t => ({ name: t.type, revenue: t.total / 100, count: t.count }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data</div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="relative glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-medium text-slate-700">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
                    <th className="text-left px-4 py-2 font-medium">ID</th>
                    <th className="text-left px-4 py-2 font-medium">User</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Amount</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-500 font-mono">{tx.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2 text-slate-500 font-mono">{tx.userId?.slice(0, 8) || '—'}...</td>
                      <td className="px-4 py-2 text-slate-500 capitalize">{tx.type}</td>
                      <td className="px-4 py-2 text-green-600 font-medium">${(tx.amount / 100).toFixed(2)} {tx.currency}</td>
                      <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] ${statusColor(tx.status)}`}>{tx.status}</span></td>
                      <td className="px-4 py-2 text-slate-500 max-w-[200px] truncate">{tx.description || '—'}</td>
                      <td className="px-4 py-2 text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
