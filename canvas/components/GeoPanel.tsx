import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const GeoPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [activeTab, setActiveTab] = useState<'geocode' | 'distance' | 'fence'>('geocode');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">🌍 Geo & Location</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700">
        {(['geocode', 'distance', 'fence'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs font-medium ${activeTab === tab ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {tab === 'geocode' ? '📍 Geocode' : tab === 'distance' ? '📏 Distance' : '🔲 Fence'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'geocode' && (
          <>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter address..." className="w-full bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none" />
            <button onClick={() => runTool('geo_geocode', `Geocode this address: ${address}`)} className="w-full py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium">📍 Geocode</button>
            <div className="grid grid-cols-2 gap-2">
              <input value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude" className="bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 outline-none" />
              <input value={lon} onChange={e => setLon(e.target.value)} placeholder="Longitude" className="bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 outline-none" />
            </div>
            <button onClick={() => runTool('geo_geocode', `Reverse geocode lat=${lat}, lon=${lon} (operation: reverse)`)} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🔄 Reverse Geocode</button>
            <button onClick={() => runTool('geo_geocode', 'List all saved geo records (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 Saved Locations</button>
          </>
        )}
        {activeTab === 'distance' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Calculate distance between two points.</p>
            <button onClick={() => runTool('geo_distance', `Calculate distance from (${lat || '40.7128'}, ${lon || '-74.0060'}) to a destination`)} className="w-full py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium">📏 Calculate</button>
            <button onClick={() => runTool('geo_route', `Plan a driving route from (${lat || '40.7128'}, ${lon || '-74.0060'}) to destination`)} className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded text-sm border border-blue-500/30 text-blue-300">🗺️ Plan Route</button>
          </>
        )}
        {activeTab === 'fence' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create and check geofences.</p>
            <button onClick={() => runTool('geo_fence', 'Create a circular geofence at current location (operation: create, type: circle)')} className="w-full py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium">+ Create Fence</button>
            <button onClick={() => runTool('geo_fence', 'List all geofences (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Fences</button>
          </>
        )}
      </div>
    </div>
  );
};

export default GeoPanel;
