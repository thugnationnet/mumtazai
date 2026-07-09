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
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Geographic & Devices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Where visitors come from & what they use</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${autoRefresh ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06]'}`}>
            {autoRefresh ? '● Live' : '○ Paused'}
          </button>
          <button onClick={fetchData} disabled={loading} className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/[0.06]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Countries Bar Chart */}
        {geoData && geoData.countries.length > 0 && (
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-blue-400" /> Countries
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geoData.countries.slice(0, 10).map(c => ({ name: c.name || 'Unknown', visitors: c.count }))} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="visitors" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Cities Bar Chart */}
        {geoData && geoData.cities.length > 0 && (
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white mb-4">Top Cities</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geoData.cities.slice(0, 10).map(c => ({ name: `${c.name || 'Unknown'}`, visitors: c.count }))} layout="vertical" margin={{ left: 90, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="visitors" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Device Types Pie */}
        {deviceData && deviceData.devices.length > 0 && (
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4 text-pink-400" /> Device Types
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData.devices.map(d => ({ name: d.name || 'Unknown', value: d.count }))} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {deviceData.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Visitors']} contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Browsers Pie */}
        {deviceData && deviceData.browsers.length > 0 && (
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white mb-4">Browsers</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData.browsers.slice(0, 8).map(b => ({ name: b.name || 'Unknown', value: b.count }))} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {deviceData.browsers.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Visitors']} contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* OS Bar Chart */}
      {deviceData && deviceData.os.length > 0 && (
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-yellow-400" /> Operating Systems
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData.os.slice(0, 10).map(o => ({ name: o.name || 'Unknown', visitors: o.count }))} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="visitors" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
