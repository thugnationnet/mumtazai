'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Heart,
  RefreshCw,
  Database,
  Cpu,
  HardDrive,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_BASE = '/api/admin/dashboard';

interface HealthData {
  status: string;
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  database: {
    status: string;
    latency: number;
  };
  nodeVersion: string;
  platform: string;
  responseTime: number;
}

interface HistoryPoint {
  time: string;
  rss: number;
  heapUsed: number;
  dbLatency: number;
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const historyRef = useRef<HistoryPoint[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/health`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        const point: HistoryPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rss: json.data.memory.rss,
          heapUsed: json.data.memory.heapUsed,
          dbLatency: json.data.database?.latency || 0,
        };
        historyRef.current = [...historyRef.current.slice(-29), point];
        setHistory([...historyRef.current]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const dbLatencyStatus = (ms: number) => {
    if (ms < 50) return { icon: CheckCircle, color: 'text-green-400', label: 'Excellent' };
    if (ms < 200) return { icon: CheckCircle, color: 'text-yellow-400', label: 'Good' };
    return { icon: AlertTriangle, color: 'text-red-400', label: 'Slow' };
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-sm text-gray-500 mt-0.5">Server monitoring & diagnostics</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${autoRefresh ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06]'}`}>
            {autoRefresh ? '● Live (10s)' : '○ Paused'}
          </button>
          <button onClick={fetchData} disabled={loading} className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/[0.06]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Status Banner */}
          <div className={`rounded-xl p-5 border ${data.status === 'healthy' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-center gap-3">
              {data.status === 'healthy' ? <CheckCircle className="w-6 h-6 text-green-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
              <div>
                <p className={`text-lg font-bold ${data.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
                  System is {data.status === 'healthy' ? 'Healthy' : 'Degraded'}
                </p>
                <p className="text-xs text-gray-500">Last checked: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-blue-400" /><span className="text-xs text-gray-500">Uptime</span></div>
              <p className="text-xl font-bold text-white">{formatUptime(data.uptime)}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                {(() => { const s = dbLatencyStatus(data.database.latency); return <s.icon className={`w-4 h-4 ${s.color}`} />; })()}
                <span className="text-xs text-gray-500">DB Latency</span>
              </div>
              <p className={`text-xl font-bold ${data.database.latency < 50 ? 'text-green-400' : data.database.latency < 200 ? 'text-yellow-400' : 'text-red-400'}`}>{data.database.latency}ms</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{dbLatencyStatus(data.database.latency).label}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3"><Cpu className="w-4 h-4 text-yellow-400" /><span className="text-xs text-gray-500">Node.js</span></div>
              <p className="text-xl font-bold text-white">{data.nodeVersion}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{data.platform}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-pink-400" /><span className="text-xs text-gray-500">Heap Usage</span></div>
              <p className="text-xl font-bold text-white">{((data.memory.heapUsed / data.memory.heapTotal) * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{data.memory.heapUsed} MB / {data.memory.heapTotal} MB</p>
            </div>
          </div>

          {/* Memory & Latency History Charts */}
          {history.length > 1 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" /> Memory Usage Over Time (MB)
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ left: 10, right: 10 }}>
                      <defs>
                        <linearGradient id="rssGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="heapGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="rss" stroke="#3b82f6" fill="url(#rssGrad)" strokeWidth={2} name="RSS (MB)" />
                      <Area type="monotone" dataKey="heapUsed" stroke="#8b5cf6" fill="url(#heapGrad)" strokeWidth={2} name="Heap (MB)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-green-400" /> DB Latency Over Time (ms)
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="dbLatency" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={12} name="Latency (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Memory Breakdown */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
              <HardDrive className="w-4 h-4 text-cyan-400" /> Memory Breakdown
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'RSS', value: data.memory.rss },
                  { name: 'Heap Total', value: data.memory.heapTotal },
                  { name: 'Heap Used', value: data.memory.heapUsed },
                  { name: 'External', value: data.memory.external },
                ]} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#d1d5db', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'MB', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => [`${value} MB`, 'Memory']} contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {[
                      { color: '#3b82f6' },
                      { color: '#06b6d4' },
                      { color: '#8b5cf6' },
                      { color: '#ec4899' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
