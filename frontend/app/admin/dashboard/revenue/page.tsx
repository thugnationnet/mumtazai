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
    <div className="bg-[#1a1a1d] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-bold">{payload[0].name}: ${(payload[0].value / 100).toFixed(2)}</p>
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
      case 'completed': return 'bg-green-500/10 text-green-400';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400';
      case 'failed': return 'bg-red-500/10 text-red-400';
      case 'refunded': return 'bg-orange-500/10 text-orange-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  const pieData = data?.byType.map((t) => ({ name: t.type, value: t.total })) || [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Transactions & earnings</p>
        </div>
        <div className="flex items-center gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'text-gray-400 bg-white/[0.03] border border-white/[0.06]'}`}>{p}</button>
          ))}
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${autoRefresh ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06]'}`}>
            {autoRefresh ? '● Live' : '○ Paused'}
          </button>
          <button onClick={fetchData} disabled={loading} className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/[0.06]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-500">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-green-400">${(data.summary.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-500">Transactions</span>
              </div>
              <p className="text-3xl font-bold text-white">{data.summary.transactionCount}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-500">Avg Amount</span>
              </div>
              <p className="text-3xl font-bold text-white">${(data.summary.avgAmount / 100).toFixed(2)}</p>
            </div>
          </div>

          {/* Revenue by Type — Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-400" /> Revenue Distribution
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
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data</div>
              )}
            </div>

            {/* Bar Chart */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-4">Revenue by Type</h3>
              {data.byType.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byType.map(t => ({ name: t.type, revenue: t.total / 100, count: t.count }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data</div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-medium text-white">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.06] text-gray-400">
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
                    <tr key={tx.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="px-4 py-2 text-gray-500 font-mono">{tx.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2 text-gray-400 font-mono">{tx.userId?.slice(0, 8) || '—'}...</td>
                      <td className="px-4 py-2 text-gray-300 capitalize">{tx.type}</td>
                      <td className="px-4 py-2 text-green-400 font-medium">${(tx.amount / 100).toFixed(2)} {tx.currency}</td>
                      <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] ${statusColor(tx.status)}`}>{tx.status}</span></td>
                      <td className="px-4 py-2 text-gray-500 max-w-[200px] truncate">{tx.description || '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
