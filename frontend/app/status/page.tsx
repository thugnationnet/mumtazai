'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  Server,
  Zap,
  Database,
} from 'lucide-react';

interface StatusData {
  system?: {
    cpuPercent: number;
    memoryPercent: number;
    totalMem: number;
    freeMem: number;
    usedMem: number;
    load1: number;
    load5: number;
    load15: number;
    cores: number;
    uptimeFormatted?: string;
  };
  platform: {
    status: string;
    uptime: number;
    lastUpdated: string;
    version: string;
    environment?: string;
  };
  api: {
    status: string;
    responseTime: number;
    uptime: number;
    requestsToday: number;
    requestsPerMinute: number;
    errorRate?: number;
    errorsToday?: number;
  };
  database: {
    status: string;
    connectionPool: number;
    responseTime: number;
    uptime: number;
    type?: string;
  };
  cache?: {
    status: string;
    type: string;
    responseTime: number;
    connected: boolean;
  };

  agents: Array<{
    name: string;
    status: string;
    responseTime: number;
    activeUsers: number;
  }>;
  tools: Array<{
    name: string;
    status: string;
    responseTime: number;
    activeChats?: number;
  }>;
  historical: Array<{
    date: string;
    uptime: number;
    requests: number;
    avgResponseTime: number;
  }>;
  incidents: Array<{
    id: number;
    date: string;
    title: string;
    severity: string;
    duration: string;
    resolved: boolean;
  }>;
  analytics?: {
    sessionsToday: number;
    pageViewsToday: number;
  };
}

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    operational: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-400/10',
      text: 'Operational',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-400/10',
      text: 'Degraded',
    },
    outage: {
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      text: 'Outage',
    },
    maintenance: {
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      text: 'Maintenance',
    },
  };

  const {
    icon: Icon,
    color,
    bg,
    text,
  } = config[status as keyof typeof config] || config.operational;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bg}`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-sm font-semibold ${color}`}>{text}</span>
    </div>
  );
};

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);
  const [rpmHistory, setRpmHistory] = useState<number[]>([]);
  const [errRateHistory, setErrRateHistory] = useState<number[]>([]);
  const [usedMock, setUsedMock] = useState(false);

  // No mock data - use real API responses only

  const fetchStatus = async () => {
    try {
      setError(null);
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        // Use real data directly without any mock fallbacks
        setData(result.data);
        setLastUpdate(new Date());
        setIsLoading(false);
      } else {
        console.error('API returned error:', result.error);
        setError(result.error || 'Unknown error');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch status'
      );
      // Set loading to false even on error
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let es: EventSource | null = null;
    let pollTimer: any = null;

    const startSSE = () => {
      try {
        es = new EventSource('/api/status/stream');
        es.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload?.success && payload?.data) {
              // Use real data directly without mock fallbacks
              setData(payload.data);
              if (payload.data.system) {
                setCpuHistory((h) => {
                  const next = [...h, payload.data.system.cpuPercent];
                  return next.slice(-30);
                });
                setMemHistory((h) => {
                  const next = [...h, payload.data.system.memoryPercent];
                  return next.slice(-30);
                });
              }
              if (payload.data.api) {
                setRpmHistory((h) => {
                  const next = [...h, payload.data.api.requestsPerMinute];
                  return next.slice(-60);
                });
                if (typeof payload.data.api.errorRate === 'number') {
                  setErrRateHistory((h) => {
                    const next = [...h, payload.data.api.errorRate as number];
                    return next.slice(-60);
                  });
                }
              }
              setLastUpdate(new Date());
              setIsLoading(false);
            }
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        };
        es.onerror = (e) => {
          console.warn('SSE error, switching to polling...', e);
          es?.close();
          // fallback to polling every 5s for real-time updates
          pollTimer = setInterval(fetchStatus, 5000);
        };
      } catch (e) {
        console.warn('SSE not available, using polling.', e);
        pollTimer = setInterval(fetchStatus, 5000);
      }
    };

    // initial snapshot to render something fast
    fetchStatus();
    // then start live stream
    startSSE();

    // Also set up a 5-second refresh interval for reliable updates
    const refreshInterval = setInterval(fetchStatus, 5000);

    return () => {
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
      clearInterval(refreshInterval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-700 text-lg font-medium">
            Loading Status...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/40 backdrop-blur-lg rounded-2xl border border-red-200 shadow-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-700 mb-2">
            Unable to Load Status
          </h2>
          <p className="text-center text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetchStatus();
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="w-16 h-16 text-yellow-600" />
          <p className="text-slate-700 text-lg font-medium">
            No data available
          </p>
        </div>
      </div>
    );
  }

  const operationalCount = data.agents.filter(
    (a) => a.status === 'operational'
  ).length;
  const overallStatus =
    operationalCount === data.agents.length ? 'operational' : 'degraded';

  const Gauge = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => {
    const clamped = Math.max(0, Math.min(100, value));
    const angle = (clamped / 100) * 180; // semicircle
    const radius = 60;
    const cx = 80;
    const cy = 80;
    const start = {
      x: cx - radius,
      y: cy,
    };
    const radians = (Math.PI * (180 - angle)) / 180;
    const end = {
      x: cx + radius * Math.cos(radians),
      y: cy - radius * Math.sin(radians),
    };
    const largeArc = angle > 180 ? 1 : 0;
    const dBg = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${
      cx + radius
    } ${cy}`;
    const dVal = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    return (
      <div className="flex flex-col items-center">
        <svg width="160" height="100" viewBox="0 0 160 100">
          <path d={dBg} stroke="#e5e7eb" strokeWidth="14" fill="none" />
          <path
            d={dVal}
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
          />
          <text
            x="80"
            y="70"
            textAnchor="middle"
            className="fill-slate-800 font-bold text-xl"
          >
            {clamped}%
          </text>
        </svg>
        <div className="text-sm text-slate-500 mt-1">{label}</div>
      </div>
    );
  };

  const MiniLine = ({
    series,
    stroke,
  }: {
    series: number[];
    stroke: string;
  }) => {
    const width = 280;
    const height = 80;
    const max = Math.max(100, ...series, 1);
    const pts = series
      .map((v, i) => {
        const x = (i / Math.max(1, series.length - 1)) * width;
        const y = height - (v / max) * height;
        return `${x},${y}`;
      })
      .join(' ');
    return (
      <svg width={width} height={height} className="w-full h-20">
        <polyline
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          points={`0,${height} ${width},${height}`}
        />
        <polyline fill="none" stroke={stroke} strokeWidth="2" points={pts} />
      </svg>
    );
  };

  const BarChart = ({
    values,
    labels,
    color,
  }: {
    values: number[];
    labels: string[];
    color: string;
  }) => {
    const max = Math.max(...values, 1);
    return (
      <div className="h-40 flex items-end gap-2 w-full">
        {values.map((v, i) => {
          const h = (v / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full h-full relative group">
                <div
                  className="rounded-t-md"
                  style={{ height: `${h}%`, background: color }}
                />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                  {v}
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 truncate w-full text-center">
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const Donut = ({ percent, color }: { percent: number; color: string }) => {
    const size = 120;
    const stroke = 14;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, percent));
    const dash = (clamped / 100) * c;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-slate-800 font-bold text-lg"
        >
          {clamped.toFixed(1)}%
        </text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -right-10 w-[200px] h-[600px] rotate-[-25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-violet-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 left-[12%] w-[180px] h-[700px] rotate-[22deg] rounded-[100px] bg-gradient-to-b from-transparent via-purple-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 right-[28%] w-[160px] h-[500px] rotate-[-32deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -left-10 w-[220px] h-[550px] rotate-[28deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[12%] right-[48%] w-[120px] h-[400px] rotate-[-12deg] rounded-[80px] bg-gradient-to-b from-white/40 via-violet-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
              System Status
            </h1>
            <p className="text-xl text-slate-500 max-w-3xl mx-auto mb-6">
              Real-time monitoring of all Mumtaz AI services
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <StatusBadge status={overallStatus} />
              <span className="text-slate-500 text-sm">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mt-6">
              <a
                href="/status/analytics"
                className="flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              >
                <TrendingUp className="w-5 h-5" />
                View Analytics
              </a>
              <a
                href="/status/api-status"
                className="flex items-center justify-center gap-2 px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm w-full sm:w-auto"
              >
                <Zap className="w-5 h-5" />
                API Status
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container-custom px-4 md:px-6 py-8 md:py-12">

        {/* System Gauges */}
        {data.system && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-700">
                  CPU Usage
                </h3>
                <MiniLine series={cpuHistory} stroke="#f97316" />
                <div className="text-xs text-slate-500 mt-1">
                  {data.system.cores} cores • Load: {data.system.load1}
                </div>
              </div>
              <Gauge
                label="CPU"
                value={data.system.cpuPercent}
                color="#f97316"
              />
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-700">
                  Memory Usage
                </h3>
                <MiniLine series={memHistory} stroke="#22c55e" />
                <div className="text-xs text-slate-500 mt-1">
                  {data.system.usedMem.toFixed(1)} GB /{' '}
                  {data.system.totalMem.toFixed(1)} GB
                </div>
              </div>
              <Gauge
                label="RAM"
                value={data.system.memoryPercent}
                color="#22c55e"
              />
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-700">
                  Server Uptime
                </h3>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {data.system.uptimeFormatted || '—'}
              </div>
              <div className="text-sm text-slate-500">
                {data.platform.environment || 'production'} • v{data.platform.version}
              </div>
            </div>
          </div>
        )}

        {/* Realtime KPIs */}
        {data.api && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <p className="text-sm text-slate-500">Requests / min</p>
              <div className="text-3xl font-extrabold text-blue-700">
                {data.api.requestsPerMinute}
              </div>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <p className="text-sm text-slate-500">Error rate</p>
              <div className="text-3xl font-extrabold text-red-600">
                {(data.api.errorRate ?? 0).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <p className="text-sm text-slate-500">Requests today</p>
              <div className="text-3xl font-extrabold text-slate-700">
                {(data.api.requestsToday ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <p className="text-sm text-slate-500">Errors today</p>
              <div className="text-3xl font-extrabold text-red-600">
                {(data.api.errorsToday ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Realtime analytics under gauges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-2">Requests / Minute</h3>
            <div className="text-slate-500 text-sm mb-4">
              Live last ~10 minutes
            </div>
            <MiniLine series={rpmHistory} stroke="#3b82f6" />
          </div>
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-2">Error Rate</h3>
            <div className="text-slate-500 text-sm mb-4">
              Live last ~10 minutes
            </div>
            <MiniLine series={errRateHistory} stroke="#ef4444" />
          </div>
        </div>

        {/* Main Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {/* Platform Status */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5 md:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Server className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
              <StatusBadge status={data.platform.status} />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-2 text-slate-700">
              Platform
            </h3>
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
              {data.platform.uptime.toFixed(2)}%
            </div>
            <p className="text-xs md:text-sm text-slate-500">Uptime</p>
          </div>

          {/* API Status */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5 md:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-7 h-7 md:w-8 md:h-8 text-yellow-600" />
              <StatusBadge status={data.api.status} />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-2 text-slate-700">
              API
            </h3>
            <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-2">
              {data.api.responseTime || 0}ms
            </div>
            <p className="text-sm text-slate-500">Avg Response Time</p>
          </div>

          {/* Database Status */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-8 h-8 text-green-600" />
              <StatusBadge status={data.database.status} />
            </div>
            <h3 className="text-lg font-semibold mb-2">{data.database.type || 'Database'}</h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {data.database.responseTime || 0}ms
            </div>
            <p className="text-sm text-slate-500">Response Time</p>
          </div>

          {/* Cache Status */}
          {data.cache && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-red-500" />
                <StatusBadge status={data.cache.status} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Cache ({data.cache.type})</h3>
              <div className="text-3xl font-bold text-red-500 mb-2">
                {data.cache.responseTime || 0}ms
              </div>
              <p className="text-sm text-slate-500">{data.cache.connected ? 'Connected' : 'Disconnected'}</p>
            </div>
          )}

        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
          {/* Uptime Chart */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-6">7-Day Uptime</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {data.historical.map((day, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-2 h-full"
                >
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${day.uptime ?? 0}%` }}
                  />
                  <span className="text-xs text-slate-500">
                    {day.date
                      ? new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                        })
                      : '-'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-slate-500">
              Average:{' '}
              {data.historical.length > 0
                ? (
                    data.historical.reduce(
                      (sum, d) => sum + (d.uptime ?? 0),
                      0
                    ) / data.historical.length
                  ).toFixed(2)
                : '0.00'}
              %
            </div>
          </div>

          {/* Requests Chart */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-6">API Requests (7 Days)</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {data.historical.map((day, i) => {
                const maxRequests = Math.max(
                  ...data.historical.map((d) => d.requests ?? 0),
                  1
                );
                const height = ((day.requests ?? 0) / maxRequests) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2 h-full"
                  >
                    <div className="relative group h-full w-full">
                      <div
                        className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${height * 2.5}px` }}
                      />
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {(day.requests ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {day.date
                        ? new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                          })
                        : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center text-sm text-slate-500">
              Total Today: {(data.api.requestsToday ?? 0).toLocaleString()}{' '}
              requests
            </div>
          </div>
        </div>

        {/* Agents and Errors Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">

          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Requests vs Errors (Today)
              </h3>
              <p className="text-slate-500 text-sm">
                {(data.api.errorsToday ?? 0).toLocaleString()} errors of{' '}
                {(data.api.requestsToday ?? 0).toLocaleString()} requests
              </p>
              <div className="mt-4">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-600 mr-2" />
                <span className="text-sm mr-4">Requests</span>
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2" />
                <span className="text-sm">Errors</span>
              </div>
            </div>
            <Donut
              percent={Math.min(
                100,
                Math.max(
                  0,
                  ((data.api.errorsToday ?? 0) /
                    Math.max(1, data.api.requestsToday)) *
                    100
                )
              )}
              color="#ef4444"
            />
          </div>
        </div>

        {/* Real-time Analytics */}
        {data.analytics && (
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow mb-12">
            <h3 className="text-xl font-bold mb-6">📊 Real-time Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/30 backdrop-blur-sm border border-white/50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-6 h-6 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Sessions Today</h4>
                </div>
                <div className="text-4xl font-bold text-blue-700">{data.analytics.sessionsToday}</div>
                <p className="text-sm text-blue-600 mt-1">User sessions started today</p>
              </div>
              <div className="bg-white/30 backdrop-blur-sm border border-white/50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <h4 className="font-semibold text-green-900">Page Views Today</h4>
                </div>
                <div className="text-4xl font-bold text-green-700">{data.analytics.pageViewsToday}</div>
                <p className="text-sm text-green-600 mt-1">Pages viewed today</p>
              </div>

            </div>
          </div>
        )}



        {/* Agents Status */}
        <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow mb-12">
          <h3 className="text-xl font-bold mb-6">
            AI Agents ({operationalCount}/{data.agents.length} Operational)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.agents.map((agent, i) => (
              <div key={i} className="bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-white/60">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm capitalize">
                    {agent.name.replace(/-/g, ' ')}
                  </h4>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'operational'
                        ? 'bg-green-400'
                        : 'bg-yellow-400'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Response</p>
                    <p className="font-bold text-blue-600">
                      {agent.responseTime}ms
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tools Status */}
        <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow mb-12">
          <h3 className="text-xl font-bold mb-6">Tools & Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.tools.map((tool, i) => (
              <div key={i} className="bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-white/60">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{tool.name}</h4>
                  <StatusBadge status={tool.status} />
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Response Time</p>
                    <p className="font-bold text-blue-600">
                      {tool.responseTime}ms
                    </p>
                  </div>
                  {tool.activeChats && (
                    <div>
                      <p className="text-slate-500">Active Chats</p>
                      <p className="font-bold text-green-600">
                        {tool.activeChats}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        {data.incidents.length > 0 && (
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-6">Recent Incidents</h3>
            <div className="space-y-4">
              {data.incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-white/60"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold mb-1">{incident.title}</h4>
                      <p className="text-sm text-slate-500">
                        {new Date(incident.date).toLocaleDateString()} •
                        Duration: {incident.duration}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        incident.resolved ? 'operational' : incident.severity
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live update notice */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            • Live updating • Last update: {lastUpdate.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
