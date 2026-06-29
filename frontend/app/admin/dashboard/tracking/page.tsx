'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Battery,
  Wifi,
  RefreshCw,
  Eye,
  Trash2,
  Lock,
  Unlock,
  X,
  ChevronDown,
  ChevronUp,
  Signal,
} from 'lucide-react';

const API_BASE = '/api/admin/tracking';

interface Device {
  id: string;
  deviceName: string | null;
  deviceModel: string | null;
  deviceOS: string | null;
  deviceOSVersion: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  registeredIp: string | null;
  isLost: boolean;
  isActive: boolean;
  lastSeenAt: string | null;
  lastLat: number | null;
  lastLng: number | null;
  lastAccuracy: number | null;
  lastBattery: number | null;
  lastNetwork: string | null;
  locationUnlocked: boolean;
  paymentRef: string | null;
  notes: string | null;
  createdAt: string;
}

interface Ping {
  id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  battery: number | null;
  network: string | null;
  ipAddress: string | null;
  timestamp: string;
}

interface DeviceDetail extends Device {
  pings: Ping[];
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function batteryColor(pct: number | null): string {
  if (pct == null) return 'text-slate-400';
  if (pct > 50) return 'text-green-600';
  if (pct > 20) return 'text-yellow-600';
  return 'text-red-600';
}

function statusDot(device: Device): string {
  if (!device.isActive) return 'bg-slate-500';
  if (device.isLost) return 'bg-red-500 animate-pulse';
  if (!device.lastSeenAt) return 'bg-slate-400';
  const mins = (Date.now() - new Date(device.lastSeenAt).getTime()) / 60000;
  if (mins < 10) return 'bg-green-400 animate-pulse';
  if (mins < 60) return 'bg-green-600';
  return 'bg-yellow-500';
}

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Google Maps rendered as srcdoc iframe
function DeviceMap({ devices, selectedId }: { devices: Device[]; selectedId: string | null }) {
  const mapDevices = devices.filter(d => d.lastLat != null && d.lastLng != null);

  const center = (() => {
    const target = selectedId ? mapDevices.find(d => d.id === selectedId) : mapDevices[0];
    if (target) return { lat: target.lastLat!, lng: target.lastLng! };
    return { lat: 20, lng: 0 };
  })();

  const markers = mapDevices.map(d => ({
    lat: d.lastLat!,
    lng: d.lastLng!,
    label: (d.deviceName || d.deviceModel || d.id.slice(0, 8)).replace(/'/g, "\\'"),
    lost: d.isLost,
    selected: d.id === selectedId,
  }));

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head><body>
<div id="map"></div>
<script>
function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: ${center.lat}, lng: ${center.lng} },
    zoom: ${markers.length === 1 ? 14 : 3},
    mapTypeId: 'roadmap',
    styles: [
      {elementType:'geometry',stylers:[{color:'#1a1a2e'}]},
      {elementType:'labels.text.fill',stylers:[{color:'#8ec3b9'}]},
      {elementType:'labels.text.stroke',stylers:[{color:'#1a1a2e'}]},
      {featureType:'road',elementType:'geometry',stylers:[{color:'#16213e'}]},
      {featureType:'road',elementType:'geometry.stroke',stylers:[{color:'#212a37'}]},
      {featureType:'water',elementType:'geometry',stylers:[{color:'#0d1b2a'}]},
      {featureType:'poi',stylers:[{visibility:'off'}]},
    ],
  });
  ${markers.map(m => `
  new google.maps.Marker({
    position: { lat: ${m.lat}, lng: ${m.lng} },
    map,
    title: '${m.label}',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: ${m.selected ? 12 : 8},
      fillColor: '${m.lost ? '#ef4444' : m.selected ? '#22d3ee' : '#10b981'}',
      fillOpacity: ${m.selected ? 0.95 : 0.75},
      strokeColor: '${m.lost ? '#ff0000' : m.selected ? '#67e8f9' : '#34d399'}',
      strokeWeight: ${m.selected ? 3 : 1.5},
    },
  }).addListener('click', function() {
    new google.maps.InfoWindow({ content: '<b style="color:#111">${m.label}</b>${m.lost ? '<br><span style="color:red;font-weight:bold">LOST</span>' : ''}' }).open(map, this);
  });
  `).join('')}
}
<\/script>
<script src="https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&callback=initMap" async defer><\/script>
</body></html>`;

  return (
    <iframe
      srcDoc={html}
      className="w-full h-full border-0 rounded-sm"
      sandbox="allow-scripts allow-same-origin"
      title="Device tracking map"
    />
  );
}

export default function TrackingAdminPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadDevices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/devices`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setDevices(data.devices);
      else setError(data.message || 'Failed to load devices');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadDevices, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDevices]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/devices/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setDetail(data.device);
        setNotes(data.device.notes || '');
      }
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const selectDevice = (id: string) => {
    setSelectedId(id);
    setShowHistory(false);
    loadDetail(id);
  };

  const markLost = async (id: string, isLost: boolean) => {
    const res = await fetch(`${API_BASE}/devices/${id}/lost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isLost }),
    });
    const data = await res.json();
    if (data.success) {
      setDevices(prev => prev.map(d => d.id === id ? { ...d, isLost } : d));
      if (detail?.id === id) setDetail(prev => prev ? { ...prev, isLost } : null);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch(`${API_BASE}/devices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive }),
    });
    const data = await res.json();
    if (data.success) {
      setDevices(prev => prev.map(d => d.id === id ? { ...d, isActive } : d));
    }
  };

  const unlockLocation = async (id: string) => {
    const res = await fetch(`${API_BASE}/devices/${id}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ paymentRef: 'manual-admin-unlock' }),
    });
    const data = await res.json();
    if (data.success) {
      setDevices(prev => prev.map(d => d.id === id ? { ...d, locationUnlocked: true } : d));
      if (detail?.id === id) setDetail(prev => prev ? { ...prev, locationUnlocked: true } : null);
    }
  };

  const saveNotes = async () => {
    if (!detail) return;
    setSavingNotes(true);
    await fetch(`${API_BASE}/devices/${detail.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Delete this device and all its location history? This cannot be undone.')) return;
    const res = await fetch(`${API_BASE}/devices/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setDevices(prev => prev.filter(d => d.id !== id));
      if (selectedId === id) { setSelectedId(null); setDetail(null); }
    }
  };

  const lostCount = devices.filter(d => d.isLost).length;
  const activeCount = devices.filter(d => d.isActive && d.lastSeenAt && (Date.now() - new Date(d.lastSeenAt).getTime()) < 600000).length;

  return (
    <div className="h-screen flex flex-col text-slate-700 overflow-hidden themed-section-bg">
      {/* Header */}
      <div className="flex-shrink-0 relative px-6 py-4 border-b border-white/40 bg-white/30 backdrop-blur-2xl shadow-[0_4px_20px_rgba(139,92,246,0.08)] flex items-center justify-between overflow-hidden">
        <div className="absolute -top-10 -right-5 w-[100px] h-[300px] rotate-[-25deg] rounded-[60px] bg-gradient-to-b from-white/40 via-indigo-300/20 to-transparent border border-white/30 pointer-events-none" />
        <div className="absolute -top-16 left-[15%] w-[80px] h-[350px] rotate-[20deg] rounded-[60px] bg-gradient-to-b from-transparent via-violet-400/15 to-white/30 border border-white/20 pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 neu-icon"><MapPin className="w-4 h-4 text-white" /></div>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-red-500/10 border border-red-300/40 rounded-full text-red-700 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              Tracker
            </div>
            <h1 className="text-lg font-black bg-gradient-to-r from-slate-800 via-purple-800 to-red-700 bg-clip-text text-transparent tracking-tight">SecureTrace — Device Tracker</h1>
          </div>
          <span className="text-xs text-slate-400 font-mono">{devices.length} devices</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono relative z-10">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-green-600">{activeCount} online</span>
          </span>
          {lostCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              {lostCount} LOST
            </span>
          )}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2 py-1.5 rounded text-xs transition-all ${
              autoRefresh
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            {autoRefresh ? '● Live (30s)' : '○ Paused'}
          </button>
          <button
            onClick={() => { setLoading(true); loadDevices(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 hover:border-purple-300 rounded text-slate-500 border border-white/60 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex-shrink-0 mx-6 mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Device List */}
        <div className="w-80 flex-shrink-0 border-r border-slate-100 flex flex-col overflow-hidden bg-white/60 backdrop-blur-2xl">
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Registered Devices</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading...</div>
            ) : devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
                <Smartphone className="w-8 h-8" />
                <p className="text-sm">No devices registered yet</p>
              </div>
            ) : (
              devices.map(device => (
                <div
                  key={device.id}
                  onClick={() => selectDevice(device.id)}
                  className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedId === device.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 flex-shrink-0 rounded-full ${statusDot(device)}`}></span>
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {device.deviceName || device.deviceModel || `Device ${device.id.slice(0, 8)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {device.isLost && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-mono uppercase">LOST</span>
                      )}
                      {!device.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">OFF</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>{device.deviceOS || '—'}</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(device.lastSeenAt)}
                    </span>
                    {device.lastBattery != null && (
                      <span className={`flex items-center gap-0.5 ${batteryColor(device.lastBattery)}`}>
                        <Battery className="w-2.5 h-2.5" />
                        {device.lastBattery}%
                      </span>
                    )}
                  </div>
                  {device.lastLat != null && (
                    <div className="mt-0.5 text-[10px] text-blue-500 font-mono">
                      {device.lastLat.toFixed(5)}, {device.lastLng!.toFixed(5)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          {devices.some(d => d.lastLat != null) ? (
            <DeviceMap devices={devices} selectedId={selectedId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <MapPin className="w-12 h-12" />
              <p className="text-sm">No location data yet</p>
              <p className="text-xs">Devices will appear on the map once they start pinging</p>
            </div>
          )}

          {/* Stats overlay top-right */}
          <div className="absolute top-3 right-3 flex gap-2">
            <div className="px-3 py-2 bg-white/80 backdrop-blur-xl border border-white/80 rounded-xl shadow-lg text-xs font-mono">
              <div className="text-slate-400">Total</div>
              <div className="text-slate-700 font-bold text-lg leading-none">{devices.length}</div>
            </div>
            <div className="px-3 py-2 bg-white/80 backdrop-blur-xl border border-green-200 rounded-xl shadow-lg text-xs font-mono">
              <div className="text-slate-400">Online</div>
              <div className="text-green-600 font-bold text-lg leading-none">{activeCount}</div>
            </div>
            {lostCount > 0 && (
              <div className="px-3 py-2 bg-white/80 backdrop-blur-xl border border-red-200 rounded-xl shadow-lg text-xs font-mono animate-pulse">
                <div className="text-slate-400">Lost</div>
                <div className="text-red-600 font-bold text-lg leading-none">{lostCount}</div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedId && (
          <div className="w-80 flex-shrink-0 border-l border-slate-100 flex flex-col overflow-hidden bg-white/60 backdrop-blur-2xl">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Device Detail</p>
              <button onClick={() => { setSelectedId(null); setDetail(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading...</div>
            ) : detail ? (
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs">
                {/* Device info */}
                <div className="space-y-1.5">
                  <p className="text-slate-400 uppercase tracking-widest text-[10px] font-mono">Device Info</p>
                  <Row label="Name" value={detail.deviceName} />
                  <Row label="Model" value={detail.deviceModel} />
                  <Row label="OS" value={`${detail.deviceOS || '—'} ${detail.deviceOSVersion || ''}`} />
                  <Row label="App Ver" value={(detail as any).appVersion} />
                  <Row label="Reg. IP" value={detail.registeredIp} />
                  <Row label="Registered" value={new Date(detail.createdAt).toLocaleDateString()} />
                </div>

                {/* Owner info */}
                <div className="space-y-1.5">
                  <p className="text-slate-400 uppercase tracking-widest text-[10px] font-mono">Owner</p>
                  <Row label="Email" value={detail.ownerEmail} />
                  <Row label="Phone" value={detail.ownerPhone} />
                </div>

                {/* Last location */}
                <div className="space-y-1.5">
                  <p className="text-slate-400 uppercase tracking-widest text-[10px] font-mono">Last Location</p>
                  {detail.lastLat != null ? (
                    <>
                      <Row label="Lat/Lng" value={`${detail.lastLat.toFixed(6)}, ${detail.lastLng!.toFixed(6)}`} />
                      <Row label="Accuracy" value={detail.lastAccuracy != null ? `±${detail.lastAccuracy.toFixed(0)}m` : null} />
                      <Row label="Battery" value={detail.lastBattery != null ? `${detail.lastBattery}%` : null} />
                      <Row label="Network" value={detail.lastNetwork} />
                      <Row label="Last Seen" value={timeAgo(detail.lastSeenAt)} />
                      <a
                        href={`https://www.google.com/maps?q=${detail.lastLat},${detail.lastLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg hover:border-blue-300 transition-all text-[11px]"
                      >
                        <MapPin className="w-3 h-3" />
                        Open in Google Maps
                      </a>
                    </>
                  ) : (
                    <p className="text-slate-400 italic">No location data yet</p>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <p className="text-slate-400 uppercase tracking-widest text-[10px] font-mono">Status</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono ${detail.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                      {detail.isActive ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {detail.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono ${detail.isLost ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                      <AlertTriangle className="w-3 h-3" />
                      {detail.isLost ? 'LOST' : 'OK'}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono ${detail.locationUnlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {detail.locationUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {detail.locationUnlocked ? 'Paid' : 'Locked'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-1.5">
                  <p className="text-slate-400 uppercase tracking-widest text-[10px] font-mono">Actions</p>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => markLost(detail.id, !detail.isLost)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono transition-all ${detail.isLost ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'}`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {detail.isLost ? 'Mark as Found' : 'Mark as LOST'}
                    </button>
                    {!detail.locationUnlocked && (
                      <button
                        onClick={() => unlockLocation(detail.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-all"
                      >
                        <Unlock className="w-3 h-3" />
                        Unlock Location (Admin)
                      </button>
                    )}
                    <button
                      onClick={() => toggleActive(detail.id, !detail.isActive)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                    >
                      {detail.isActive ? <X className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {detail.isActive ? 'Deactivate Device' : 'Activate Device'}
                    </button>
                    <button
                      onClick={() => deleteDevice(detail.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Device
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <p className="text-slate-400 uppercase tracking-widest text-[10px] font-mono">Admin Notes</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-white/40 border border-white/80 rounded-lg px-3 py-2 text-xs text-slate-700 focus:border-blue-300 focus:outline-none resize-none"
                    placeholder="Internal notes about this device..."
                  />
                  <button
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-[11px] hover:border-blue-300 transition-all disabled:opacity-50"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>

                {/* Location History */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => setShowHistory(h => !h)}
                    className="flex items-center gap-1.5 text-slate-400 uppercase tracking-widest text-[10px] font-mono hover:text-slate-600 transition-colors"
                  >
                    <Signal className="w-3 h-3" />
                    Location History ({detail.pings.length})
                    {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showHistory && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {detail.pings.length === 0 ? (
                        <p className="text-slate-400 italic">No pings yet</p>
                      ) : (
                        detail.pings.map(ping => (
                          <div key={ping.id} className="px-2 py-1.5 bg-white/40 rounded-lg border border-white/80 font-mono text-[10px]">
                            <div className="text-blue-600">{ping.lat.toFixed(5)}, {ping.lng.toFixed(5)}</div>
                            <div className="flex gap-2 text-slate-400 mt-0.5">
                              <span>{new Date(ping.timestamp).toLocaleString()}</span>
                              {ping.battery != null && <span className={batteryColor(ping.battery)}>{ping.battery}%</span>}
                              {ping.network && <span>{ping.network}</span>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className="text-slate-700 text-right truncate">{value || '—'}</span>
    </div>
  );
}
