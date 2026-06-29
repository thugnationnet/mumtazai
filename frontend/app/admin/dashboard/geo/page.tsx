'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Cpu,
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
const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#3b82f6', '#f97316', '#14b8a6', '#a855f7'];

interface GeoData {
  countries: Array<{ name: string; count: number }>;
  cities: Array<{ name: string; country: string; count: number }>;
}

interface DeviceData {
  devices: Array<{ name: string; count: number }>;
  browsers: Array<{ name: string; count: number }>;
  os: Array<{ name: string; count: number }>;
}

export default function GeoPage() {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [geoRes, devRes] = await Promise.all([
        fetch(`${API_BASE}/geo`, { credentials: 'include' }),
        fetch(`${API_BASE}/devices`, { credentials: 'include' }),
      ]);
      const [geoJson, devJson] = await Promise.all([
        geoRes.json(),
        devRes.json(),
      ]);
      if (geoJson.success) setGeoData({ ...geoJson.data, countries: geoJson.data.countries || [], cities: geoJson.data.cities || [] });
      if (devJson.success) setDeviceData({ ...devJson.data, devices: devJson.data.devices || [], browsers: devJson.data.browsers || [], os: devJson.data.os || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 60000);
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
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-300/40 rounded-full text-cyan-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                  Geography
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-cyan-700 bg-clip-text text-transparent">Geographic & Devices</h1>
                <p className="text-sm text-slate-500 mt-1">Where visitors come from & what they use</p>
              </div>
              <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Countries Bar Chart */}
        {geoData && geoData.countries.length > 0 && (
          <div className="relative glass-card p-5">
            <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-blue-500" /> Countries
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geoData.countries.slice(0, 10).map(c => ({ name: c.name || 'Unknown', visitors: c.count }))} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#374151', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="visitors" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Cities Bar Chart */}
        {geoData && geoData.cities.length > 0 && (
          <div className="relative glass-card p-5">
            <h3 className="text-sm font-medium text-slate-800 mb-4">Top Cities</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geoData.cities.slice(0, 10).map(c => ({ name: `${c.name || 'Unknown'}`, visitors: c.count }))} layout="vertical" margin={{ left: 90, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#374151', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="visitors" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Device Types Pie */}
        {deviceData && deviceData.devices.length > 0 && (
          <div className="relative glass-card p-5">
            <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4 text-pink-500" /> Device Types
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData.devices.map(d => ({ name: d.name || 'Unknown', value: d.count }))} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {deviceData.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Visitors']} contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Browsers Pie */}
        {deviceData && deviceData.browsers.length > 0 && (
          <div className="relative glass-card p-5">
            <h3 className="text-sm font-medium text-slate-800 mb-4">Browsers</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData.browsers.slice(0, 8).map(b => ({ name: b.name || 'Unknown', value: b.count }))} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {deviceData.browsers.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Visitors']} contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* OS Bar Chart */}
      {deviceData && deviceData.os.length > 0 && (
        <div className="relative glass-card p-5">
          <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-yellow-500" /> Operating Systems
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData.os.slice(0, 10).map(o => ({ name: o.name || 'Unknown', visitors: o.count }))} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="visitors" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
