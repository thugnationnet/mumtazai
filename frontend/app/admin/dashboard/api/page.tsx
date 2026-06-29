'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Server,
  RefreshCw,
  AlertTriangle,
  Clock,
  Zap,
  XCircle,
  CheckCircle,
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

interface ApiData {
  summary: {
    totalCalls: number;
    errorCount: number;
    errorRate: string;
    avgResponseTime: number;
  };
  topEndpoints: Array<{ endpoint: string; calls: number; avgResponseTime: number }>;
  errorEndpoints: Array<{ endpoint: string; errors: number }>;
  statusCodes: Array<{ code: number; count: number }>;
  slowEndpoints: Array<{ endpoint: string; method: string; statusCode: number; responseTime: number; timestamp: string }>;
  period: string;
}

const statusCodeColor = (code: number) => {
  if (code < 300) return '#22c55e';
  if (code < 400) return '#3b82f6';
  if (code < 500) return '#f59e0b';
  return '#ef4444';
};

export default function ApiMonitorPage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [period, setPeriod] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api-usage?period=${period}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setData({ ...json.data, topEndpoints: json.data.topEndpoints || [], statusCodes: json.data.statusCodes || [], errorEndpoints: json.data.errorEndpoints || [], slowEndpoints: json.data.slowEndpoints || [] });
    } catch (err) {
      console.error('Failed to fetch API data:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 15000);
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
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-300/40 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  API
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-indigo-800 to-blue-700 bg-clip-text text-transparent">API Monitoring</h1>
                <p className="text-sm text-slate-500 mt-1">Endpoint usage, response times & errors</p>
              </div>
              <div className="flex items-center gap-2">
                {['1h', '24h', '7d'].map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'text-slate-500 bg-white/50 border border-white/60 hover:border-purple-300'}`}>{p}</button>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><Zap className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-500">Total Calls</span></div>
              <p className="text-2xl font-bold text-slate-800">{data.summary.totalCalls.toLocaleString()}</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><XCircle className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-500">Errors</span></div>
              <p className="text-2xl font-bold text-red-600">{data.summary.errorCount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{data.summary.errorRate}% error rate</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><Clock className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-500">Avg Response</span></div>
              <p className="text-2xl font-bold text-slate-800">{data.summary.avgResponseTime}ms</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><CheckCircle className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-500">Success Rate</span></div>
              <p className="text-2xl font-bold text-green-600">{(100 - parseFloat(data.summary.errorRate)).toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Top Endpoints Bar Chart */}
            <div className="relative glass-card p-5">
              <h3 className="text-sm font-medium text-slate-800 mb-4">Top Endpoints</h3>
              {data.topEndpoints.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topEndpoints.slice(0, 10).map(ep => ({ name: ep.endpoint.length > 30 ? '...' + ep.endpoint.slice(-27) : ep.endpoint, calls: ep.calls, latency: ep.avgResponseTime }))} layout="vertical" margin={{ left: 140, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#374151', fontSize: 9 }} axisLine={false} tickLine={false} width={140} />
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="calls" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} name="Calls" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data</div>
              )}
            </div>

            {/* Status Codes Donut Chart */}
            <div className="relative glass-card p-5">
              <h3 className="text-sm font-medium text-slate-800 mb-4">Status Code Distribution</h3>
              {data.statusCodes.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.statusCodes.map(sc => ({ name: String(sc.code), value: sc.count }))} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {data.statusCodes.map((sc) => <Cell key={sc.code} fill={statusCodeColor(sc.code)} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Requests']} contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data</div>
              )}

              {/* Error Hotspots */}
              {data.errorEndpoints.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-medium text-red-600 flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5" /> Error Hotspots
                  </h4>
                  {data.errorEndpoints.map((ep) => (
                    <div key={ep.endpoint} className="flex items-center gap-3 py-1.5 text-xs">
                      <span className="text-slate-500 font-mono truncate flex-1">{ep.endpoint}</span>
                      <span className="text-red-600 font-medium">{ep.errors} errors</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Slow Endpoints */}
          {data.slowEndpoints.length > 0 && (
            <div className="relative glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-medium text-yellow-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Slow Endpoints (&gt;1s)
                </h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
                    <th className="text-left px-4 py-2 font-medium">Method</th>
                    <th className="text-left px-4 py-2 font-medium">Endpoint</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Response Time</th>
                    <th className="text-left px-4 py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slowEndpoints.map((ep, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/50">
                      <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${ep.method === 'GET' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{ep.method}</span></td>
                      <td className="px-4 py-2 text-slate-500 font-mono">{ep.endpoint}</td>
                      <td className="px-4 py-2"><span className={ep.statusCode < 400 ? 'text-green-600' : 'text-red-600'}>{ep.statusCode}</span></td>
                      <td className="px-4 py-2 text-yellow-600 font-mono">{ep.responseTime}ms</td>
                      <td className="px-4 py-2 text-slate-500">{new Date(ep.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
