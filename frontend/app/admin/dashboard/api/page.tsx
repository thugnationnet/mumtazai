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
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Monitoring</h1>
          <p className="text-sm text-gray-500 mt-0.5">Endpoint usage, response times & errors</p>
        </div>
        <div className="flex items-center gap-2">
          {['1h', '24h', '7d'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'text-gray-400 bg-white/[0.03] border border-white/[0.06] hover:text-white'}`}>{p}</button>
          ))}
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${autoRefresh ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06]'}`}>
            {autoRefresh ? '● Live' : '○ Paused'}
          </button>
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 text-gray-400 border border-white/[0.06]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-blue-400" /><span className="text-xs text-gray-500">Total Calls</span></div>
              <p className="text-2xl font-bold text-white">{data.summary.totalCalls.toLocaleString()}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2"><XCircle className="w-4 h-4 text-red-400" /><span className="text-xs text-gray-500">Errors</span></div>
              <p className="text-2xl font-bold text-red-400">{data.summary.errorCount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{data.summary.errorRate}% error rate</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-yellow-400" /><span className="text-xs text-gray-500">Avg Response</span></div>
              <p className="text-2xl font-bold text-white">{data.summary.avgResponseTime}ms</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-xs text-gray-500">Success Rate</span></div>
              <p className="text-2xl font-bold text-green-400">{(100 - parseFloat(data.summary.errorRate)).toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Top Endpoints Bar Chart */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-4">Top Endpoints</h3>
              {data.topEndpoints.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topEndpoints.slice(0, 10).map(ep => ({ name: ep.endpoint.length > 30 ? '...' + ep.endpoint.slice(-27) : ep.endpoint, calls: ep.calls, latency: ep.avgResponseTime }))} layout="vertical" margin={{ left: 140, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 9 }} axisLine={false} tickLine={false} width={140} />
                      <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="calls" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} name="Calls" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data</div>
              )}
            </div>

            {/* Status Codes Donut Chart */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-4">Status Code Distribution</h3>
              {data.statusCodes.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.statusCodes.map(sc => ({ name: String(sc.code), value: sc.count }))} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {data.statusCodes.map((sc) => <Cell key={sc.code} fill={statusCodeColor(sc.code)} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Requests']} contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data</div>
              )}

              {/* Error Hotspots */}
              {data.errorEndpoints.length > 0 && (
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <h4 className="text-xs font-medium text-red-400 flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5" /> Error Hotspots
                  </h4>
                  {data.errorEndpoints.map((ep) => (
                    <div key={ep.endpoint} className="flex items-center gap-3 py-1.5 text-xs">
                      <span className="text-gray-300 font-mono truncate flex-1">{ep.endpoint}</span>
                      <span className="text-red-400 font-medium">{ep.errors} errors</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Slow Endpoints */}
          {data.slowEndpoints.length > 0 && (
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <h3 className="text-sm font-medium text-yellow-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Slow Endpoints (&gt;1s)
                </h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.06] text-gray-400">
                    <th className="text-left px-4 py-2 font-medium">Method</th>
                    <th className="text-left px-4 py-2 font-medium">Endpoint</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Response Time</th>
                    <th className="text-left px-4 py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slowEndpoints.map((ep, i) => (
                    <tr key={i} className="border-b border-white/[0.03]">
                      <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${ep.method === 'GET' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{ep.method}</span></td>
                      <td className="px-4 py-2 text-gray-300 font-mono">{ep.endpoint}</td>
                      <td className="px-4 py-2"><span className={ep.statusCode < 400 ? 'text-green-400' : 'text-red-400'}>{ep.statusCode}</span></td>
                      <td className="px-4 py-2 text-yellow-400 font-mono">{ep.responseTime}ms</td>
                      <td className="px-4 py-2 text-gray-500">{new Date(ep.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
