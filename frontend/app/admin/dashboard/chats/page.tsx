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
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Chat Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Conversations, tokens & agent performance</p>
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
              <div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-pink-400" /><span className="text-xs text-gray-500">Total Chats</span></div>
              <p className="text-2xl font-bold text-white">{data.summary.totalChats.toLocaleString()}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2"><Coins className="w-4 h-4 text-yellow-400" /><span className="text-xs text-gray-500">Total Tokens</span></div>
              <p className="text-2xl font-bold text-white">{data.summary.totalTokens.toLocaleString()}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2"><Timer className="w-4 h-4 text-blue-400" /><span className="text-xs text-gray-500">Avg Duration</span></div>
              <p className="text-2xl font-bold text-white">{Math.round(data.summary.avgDuration / 1000)}s</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2"><Hash className="w-4 h-4 text-green-400" /><span className="text-xs text-gray-500">Avg Turns</span></div>
              <p className="text-2xl font-bold text-white">{data.summary.avgTurns}</p>
            </div>
          </div>

          {/* Agent Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Bar Chart - Chats by Agent */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-400" /> Chats by Agent
              </h3>
              {data.chatsByAgent.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chatsByAgent.map(a => ({ name: a.agentId || 'Default', chats: a.chats, tokens: a.tokens }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="chats" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} name="Chats" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No agent data</div>
              )}
            </div>

            {/* Pie Chart - Token Distribution */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-4">Token Distribution by Agent</h3>
              {data.chatsByAgent.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.chatsByAgent.map(a => ({ name: a.agentId || 'Default', value: a.tokens }))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {data.chatsByAgent.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Tokens']} contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data</div>
              )}
            </div>
          </div>

          {/* Recent Chats */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-medium text-white">Recent Conversations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.06] text-gray-400">
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
                    <tr key={c.conversationId} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="px-4 py-2 text-gray-400 font-mono">{c.userId?.slice(0, 8) || 'anon'}...</td>
                      <td className="px-4 py-2 text-violet-400">{c.agentId || 'default'}</td>
                      <td className="px-4 py-2 text-gray-400 capitalize">{c.channel}</td>
                      <td className="px-4 py-2 text-yellow-400 tabular-nums">{c.totalTokens.toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-300">{c.turnCount}</td>
                      <td className="px-4 py-2 text-gray-500">{Math.round(c.durationMs / 1000)}s</td>
                      <td className="px-4 py-2 text-gray-500">{new Date(c.startedAt).toLocaleString()}</td>
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
