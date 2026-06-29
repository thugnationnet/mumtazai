'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  RefreshCw,
  Bot,
  Hash,
  Timer,
  Coins,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const API_BASE = '/api/admin/dashboard';
const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#3b82f6', '#f97316'];

interface ChatData {
  summary: {
    totalChats: number;
    totalTokens: number;
    avgDuration: number;
    avgTurns: number;
  };
  chatsByAgent: Array<{ agentId: string; chats: number; tokens: number }>;
  recentChats: Array<{
    conversationId: string;
    userId: string | null;
    agentId: string | null;
    channel: string;
    totalTokens: number;
    durationMs: number;
    turnCount: number;
    startedAt: string;
    status: string;
  }>;
  period: string;
}

export default function ChatsPage() {
  const [data, setData] = useState<ChatData | null>(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chats?period=${period}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setData({ ...json.data, chatsByAgent: json.data.chatsByAgent || [], recentChats: json.data.recentChats || [] });
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
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  Chats
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Chat Analytics</h1>
                <p className="text-sm text-slate-500 mt-1">Conversations, tokens & agent performance</p>
              </div>
              <div className="flex items-center gap-2">
                {['24h', '7d', '30d'].map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'text-slate-500 bg-white/50 border border-white/60 hover:border-purple-300'}`}>{p}</button>
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
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><MessageSquare className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-500">Total Chats</span></div>
              <p className="text-2xl font-bold text-slate-800">{data.summary.totalChats.toLocaleString()}</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><Coins className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-500">Total Tokens</span></div>
              <p className="text-2xl font-bold text-slate-800">{data.summary.totalTokens.toLocaleString()}</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><Timer className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-500">Avg Duration</span></div>
              <p className="text-2xl font-bold text-slate-800">{Math.round(data.summary.avgDuration / 1000)}s</p>
            </div>
            <div className="relative glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 neu-icon"><Hash className="w-4 h-4 text-white" /></div><span className="text-xs text-slate-500">Avg Turns</span></div>
              <p className="text-2xl font-bold text-slate-800">{data.summary.avgTurns}</p>
            </div>
          </div>

          {/* Agent Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Bar Chart - Chats by Agent */}
            <div className="relative glass-card p-5">
              <h3 className="text-sm font-medium text-slate-800 mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-500" /> Chats by Agent
              </h3>
              {data.chatsByAgent.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chatsByAgent.map(a => ({ name: a.agentId || 'Default', chats: a.chats, tokens: a.tokens }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="chats" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} name="Chats" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No agent data</div>
              )}
            </div>

            {/* Pie Chart - Token Distribution */}
            <div className="relative glass-card p-5">
              <h3 className="text-sm font-medium text-slate-800 mb-4">Token Distribution by Agent</h3>
              {data.chatsByAgent.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.chatsByAgent.map(a => ({ name: a.agentId || 'Default', value: a.tokens }))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {data.chatsByAgent.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Tokens']} contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data</div>
              )}
            </div>
          </div>

          {/* Recent Chats */}
          <div className="relative glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-medium text-slate-800">Recent Conversations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
                    <th className="text-left px-4 py-2 font-medium">User</th>
                    <th className="text-left px-4 py-2 font-medium">Agent</th>
                    <th className="text-left px-4 py-2 font-medium">Channel</th>
                    <th className="text-left px-4 py-2 font-medium">Tokens</th>
                    <th className="text-left px-4 py-2 font-medium">Turns</th>
                    <th className="text-left px-4 py-2 font-medium">Duration</th>
                    <th className="text-left px-4 py-2 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentChats.map((c) => (
                    <tr key={c.conversationId} className="border-b border-slate-50 hover:bg-blue-50/50">
                      <td className="px-4 py-2 text-slate-500 font-mono">{c.userId?.slice(0, 8) || 'anon'}...</td>
                      <td className="px-4 py-2 text-blue-600">{c.agentId || 'default'}</td>
                      <td className="px-4 py-2 text-slate-500 capitalize">{c.channel}</td>
                      <td className="px-4 py-2 text-yellow-600 tabular-nums">{c.totalTokens.toLocaleString()}</td>
                      <td className="px-4 py-2 text-slate-500">{c.turnCount}</td>
                      <td className="px-4 py-2 text-slate-500">{Math.round(c.durationMs / 1000)}s</td>
                      <td className="px-4 py-2 text-slate-500">{new Date(c.startedAt).toLocaleString()}</td>
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
