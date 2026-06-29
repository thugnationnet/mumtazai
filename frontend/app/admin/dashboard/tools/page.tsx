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
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-300/40 rounded-full text-violet-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                  Tools
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-violet-700 bg-clip-text text-transparent">Tool Usage</h1>
                <p className="text-sm text-slate-500 mt-1">AI tool analytics & performance</p>
              </div>
              <div className="flex items-center gap-2">
                {['24h', '7d', '30d'].map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-violet-50 text-violet-600 border border-violet-200' : 'text-slate-500 bg-white/50 border border-white/60 hover:border-purple-300'}`}>{p}</button>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><Zap className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-400">Total Uses</span></div>
              <p className="text-2xl font-bold text-slate-700">{data.summary.totalUsage.toLocaleString()}</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><Clock className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-400">Avg Latency</span></div>
              <p className="text-2xl font-bold text-slate-700">{data.summary.avgLatency}ms</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><Zap className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-400">Tokens In</span></div>
              <p className="text-2xl font-bold text-slate-700">{data.summary.totalTokensInput.toLocaleString()}</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><Zap className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-400">Tokens Out</span></div>
              <p className="text-2xl font-bold text-slate-700">{data.summary.totalTokensOutput.toLocaleString()}</p>
            </div>
          </div>

          {/* Usage Bar Chart */}
          <div className="relative glass-card p-5">
            <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-500" /> Tool Usage Distribution
            </h3>
            {data.tools.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tools.slice(0, 15).map(t => ({ name: t.name.length > 20 ? t.name.slice(0, 20) + '...' : t.name, uses: t.count, latency: t.avgLatency }))} layout="vertical" margin={{ left: 130, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number, name: string) => [name === 'latency' ? `${value}ms` : value.toLocaleString(), name === 'latency' ? 'Avg Latency' : 'Uses']} />
                    <Bar dataKey="uses" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} name="Uses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No tool usage data</div>
            )}
          </div>

          {/* Latency Scatter */}
          {data.tools.length > 0 && (
            <div className="relative glass-card p-5">
              <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> Usage vs Latency
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis type="number" dataKey="count" name="Uses" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Uses', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 10 }} />
                    <YAxis type="number" dataKey="avgLatency" name="Latency" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }} />
                    <ZAxis range={[40, 200]} />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number, name: string) => [name === 'Latency' ? `${value}ms` : value, name]} />
                    <Scatter data={data.tools} fill="#06b6d4" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="relative glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-medium text-slate-700">Detailed Breakdown</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
                  <th className="text-left px-4 py-2 font-medium">Tool</th>
                  <th className="text-left px-4 py-2 font-medium">Uses</th>
                  <th className="text-left px-4 py-2 font-medium">Avg Latency</th>
                  <th className="text-left px-4 py-2 font-medium">Avg Tokens In</th>
                  <th className="text-left px-4 py-2 font-medium">Avg Tokens Out</th>
                </tr>
              </thead>
              <tbody>
                {data.tools.map((t) => (
                  <tr key={t.name} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-blue-600 tabular-nums">{t.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">{t.avgLatency}ms</td>
                    <td className="px-4 py-3 text-cyan-600 tabular-nums">{t.avgTokensIn}</td>
                    <td className="px-4 py-3 text-pink-600 tabular-nums">{t.avgTokensOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
