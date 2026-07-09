'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wrench, RefreshCw, Clock, Zap } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

const API_BASE = '/api/admin/dashboard';

interface ToolData {
  summary: {
    totalUsage: number;
    avgLatency: number;
    totalTokensInput: number;
    totalTokensOutput: number;
  };
  tools: Array<{
    name: string;
    count: number;
    avgLatency: number;
    avgTokensIn: number;
    avgTokensOut: number;
  }>;
  period: string;
}

export default function ToolsPage() {
  const [data, setData] = useState<ToolData | null>(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tools?period=${period}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setData({ ...json.data, tools: json.data.tools || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tool Usage</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI tool analytics & performance</p>
        </div>
        <div className="flex items-center gap-2">
          {['24h', '7d', '30d'].map((p) => (
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-yellow-400" /><span className="text-xs text-gray-500">Total Uses</span></div>
              <p className="text-2xl font-bold text-white">{data.summary.totalUsage.toLocaleString()}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-blue-400" /><span className="text-xs text-gray-500">Avg Latency</span></div>
              <p className="text-2xl font-bold text-white">{data.summary.avgLatency}ms</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-2">Tokens In</p>
              <p className="text-2xl font-bold text-cyan-400">{data.summary.totalTokensInput.toLocaleString()}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-2">Tokens Out</p>
              <p className="text-2xl font-bold text-pink-400">{data.summary.totalTokensOutput.toLocaleString()}</p>
            </div>
          </div>

          {/* Usage Bar Chart */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-400" /> Tool Usage Distribution
            </h3>
            {data.tools.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tools.slice(0, 15).map(t => ({ name: t.name.length > 20 ? t.name.slice(0, 20) + '...' : t.name, uses: t.count, latency: t.avgLatency }))} layout="vertical" margin={{ left: 130, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={(value: number, name: string) => [name === 'latency' ? `${value}ms` : value.toLocaleString(), name === 'latency' ? 'Avg Latency' : 'Uses']} />
                    <Bar dataKey="uses" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} name="Uses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No tool usage data</div>
            )}
          </div>

          {/* Latency Scatter */}
          {data.tools.length > 0 && (
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" /> Usage vs Latency
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" dataKey="count" name="Uses" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Uses', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 10 }} />
                    <YAxis type="number" dataKey="avgLatency" name="Latency" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }} />
                    <ZAxis range={[40, 200]} />
                    <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={(value: number, name: string) => [name === 'Latency' ? `${value}ms` : value, name]} />
                    <Scatter data={data.tools} fill="#06b6d4" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-medium text-white">Detailed Breakdown</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.06] text-gray-400">
                  <th className="text-left px-4 py-2 font-medium">Tool</th>
                  <th className="text-left px-4 py-2 font-medium">Uses</th>
                  <th className="text-left px-4 py-2 font-medium">Avg Latency</th>
                  <th className="text-left px-4 py-2 font-medium">Avg Tokens In</th>
                  <th className="text-left px-4 py-2 font-medium">Avg Tokens Out</th>
                </tr>
              </thead>
              <tbody>
                {data.tools.map((t) => (
                  <tr key={t.name} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-blue-400 tabular-nums">{t.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums">{t.avgLatency}ms</td>
                    <td className="px-4 py-3 text-cyan-400 tabular-nums">{t.avgTokensIn}</td>
                    <td className="px-4 py-3 text-pink-400 tabular-nums">{t.avgTokensOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
