'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types (self-contained — no imports from other panels) ───────
export interface MapLocation {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  placeId?: string;
  type?: string;         // restaurant, hotel, park, etc.
  category?: string;
}

export interface MapRoute {
  distance: string;      // "15.45 km"
  duration: string;      // "23.5 min"
  steps?: { instruction: string; name: string; distance: number; duration: number }[];
  origin: MapLocation;
  destination: MapLocation;
  waypoints?: MapLocation[];
  mode?: 'driving' | 'walking' | 'cycling' | 'transit';
}

export interface MapTab {
  id: string;
  type: 'location' | 'route' | 'search' | 'places';
  title: string;
  locations: MapLocation[];       // pins on the map
  route?: MapRoute;               // for route visualization
  rawData?: string;               // full tool result text
  toolName: string;               // which geo tool produced this
  timestamp: Date;
}

interface MapPanelProps {
  isOpen: boolean;
  tabs: MapTab[];
  activeTabId: string | null;
  onClose: () => void;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────
function buildMapEmbedUrl(locations: MapLocation[], route?: MapRoute): string {
  // Use OpenStreetMap embed — no API key needed
  if (route && route.origin && route.destination) {
    // Route view: show origin → destination on OSM
    const midLat = (route.origin.lat + route.destination.lat) / 2;
    const midLng = (route.origin.lng + route.destination.lng) / 2;
    // Calculate zoom based on distance
    const dlat = Math.abs(route.origin.lat - route.destination.lat);
    const dlng = Math.abs(route.origin.lng - route.destination.lng);
    const maxDelta = Math.max(dlat, dlng);
    let zoom = 12;
    if (maxDelta > 10) zoom = 4;
    else if (maxDelta > 5) zoom = 6;
    else if (maxDelta > 2) zoom = 8;
    else if (maxDelta > 0.5) zoom = 10;
    else if (maxDelta > 0.1) zoom = 13;
    else zoom = 15;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${midLng - maxDelta * 1.5},${midLat - maxDelta * 1.5},${midLng + maxDelta * 1.5},${midLat + maxDelta * 1.5}&layer=mapnik&marker=${route.origin.lat},${route.origin.lng}`;
  }

  if (locations.length === 1) {
    const loc = locations[0];
    return `https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - 0.01},${loc.lat - 0.01},${loc.lng + 0.01},${loc.lat + 0.01}&layer=mapnik&marker=${loc.lat},${loc.lng}`;
  }

  if (locations.length > 1) {
    // Fit all pins in view
    const lats = locations.map(l => l.lat);
    const lngs = locations.map(l => l.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padLat = Math.max((maxLat - minLat) * 0.2, 0.005);
    const padLng = Math.max((maxLng - minLng) * 0.2, 0.005);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng - padLng},${minLat - padLat},${maxLng + padLng},${maxLat + padLat}&layer=mapnik&marker=${locations[0].lat},${locations[0].lng}`;
  }

  // Fallback — world view
  return `https://www.openstreetmap.org/export/embed.html?bbox=-180,-85,180,85&layer=mapnik`;
}

function getCategoryIcon(type?: string): string {
  const icons: Record<string, string> = {
    restaurant: '🍽️', hotel: '🏨', gas_station: '⛽', hospital: '🏥',
    pharmacy: '💊', school: '🏫', park: '🌳', museum: '🏛️',
    airport: '✈️', bank: '🏦', shopping: '🛍️', gym: '💪',
    cafe: '☕', bar: '🍸', church: '⛪', library: '📚',
  };
  return icons[type || ''] || '📍';
}

function formatCoord(n: number): string {
  return n.toFixed(6);
}

// ─── Component ───────────────────────────────────────────────────
export default function MapPanel({
  isOpen,
  tabs,
  activeTabId,
  onClose,
  onSelectTab,
  onCloseTab,
}: MapPanelProps) {
  const [panelWidth, setPanelWidth] = useState(440);
  const [activeView, setActiveView] = useState<'map' | 'details' | 'directions'>('map');
  const isResizing = useRef(false);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Resize drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const w = window.innerWidth - e.clientX;
      setPanelWidth(Math.max(340, Math.min(w, window.innerWidth * 0.55)));
    };
    const onUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Reset view when tab changes
  useEffect(() => {
    if (activeTab?.route) setActiveView('directions');
    else setActiveView('map');
  }, [activeTabId, activeTab?.route]);

  if (!isOpen || tabs.length === 0) return null;

  const tabTypeIcon = (type: string) => {
    switch (type) {
      case 'route': return '🧭';
      case 'search': return '🔎';
      case 'places': return '📍';
      default: return '🗺️';
    }
  };

  const mapUrl = activeTab ? buildMapEmbedUrl(activeTab.locations, activeTab.route) : '';

  return (
    <div
      className="relative flex flex-col h-full border-l border-white/[0.08] bg-[#0c0c0f]/95 backdrop-blur-xl"
      style={{ width: panelWidth, minWidth: 340, maxWidth: '55vw' }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-20 hover:bg-cyan-500/30 active:bg-cyan-500/50 transition-colors"
        onMouseDown={() => {
          isResizing.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🗺️</span>
          <span className="text-xs font-semibold text-white/80 tracking-wide">MAP PANEL</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 transition-colors text-white/50 hover:text-white/90"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab bar */}
      {tabs.length > 1 && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/[0.06] overflow-x-auto scrollbar-hide shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                tab.id === activeTabId
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{tabTypeIcon(tab.type)}</span>
              <span className="max-w-[100px] truncate">{tab.title}</span>
              <span
                onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
                className="ml-1 opacity-50 hover:opacity-100 cursor-pointer"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/[0.06] shrink-0">
        {(['map', 'details', ...(activeTab?.route ? ['directions' as const] : [])] as const).map(v => (
          <button
            key={v}
            onClick={() => setActiveView(v as 'map' | 'details' | 'directions')}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-all ${
              activeView === v
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
            }`}
          >
            {v === 'map' ? '🗺️ Map' : v === 'details' ? '📋 Details' : '🧭 Route'}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'map' && activeTab && (
          <div className="flex-1 flex flex-col">
            {/* Map iframe */}
            <div className="flex-1 relative min-h-[200px]">
              <iframe
                src={mapUrl}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer"
                title="Map view"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
            {/* Location summary bar */}
            <div className="px-3 py-2 border-t border-white/[0.08] bg-[#0a0a0d]/80 shrink-0">
              {activeTab.locations.length === 1 ? (
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">{getCategoryIcon(activeTab.locations[0].type)}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white/90 truncate">
                      {activeTab.locations[0].name || 'Location'}
                    </div>
                    {activeTab.locations[0].address && (
                      <div className="text-[11px] text-white/50 truncate mt-0.5">
                        {activeTab.locations[0].address}
                      </div>
                    )}
                    <div className="text-[10px] text-cyan-400/60 font-mono mt-0.5">
                      {formatCoord(activeTab.locations[0].lat)}, {formatCoord(activeTab.locations[0].lng)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-white/60">
                  {activeTab.locations.length} locations shown
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'details' && activeTab && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Location cards */}
            {activeTab.locations.map((loc, i) => (
              <div
                key={`${loc.lat}-${loc.lng}-${i}`}
                className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/20 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl mt-0.5">{getCategoryIcon(loc.type)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white/90">{loc.name || `Location ${i + 1}`}</div>
                    {loc.address && (
                      <div className="text-[11px] text-white/50 mt-0.5">{loc.address}</div>
                    )}
                    {loc.type && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-300/70 border border-cyan-500/20">
                        {loc.type}
                      </span>
                    )}
                    <div className="text-[10px] text-white/30 font-mono mt-1">
                      {formatCoord(loc.lat)}, {formatCoord(loc.lng)}
                    </div>
                  </div>
                  {/* Open in maps link */}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-cyan-400 transition-colors"
                    title="Open in OpenStreetMap"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}

            {/* Raw data toggle */}
            {activeTab.rawData && (
              <RawDataAccordion data={activeTab.rawData} />
            )}
          </div>
        )}

        {activeView === 'directions' && activeTab?.route && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Route summary */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/[0.06] to-cyan-500/[0.06] border border-violet-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Route</span>
                {activeTab.route.mode && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-300/80 border border-cyan-500/20">
                    {activeTab.route.mode}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Distance</div>
                  <div className="text-lg font-bold text-cyan-300">{activeTab.route.distance}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Duration</div>
                  <div className="text-lg font-bold text-violet-300">{activeTab.route.duration}</div>
                </div>
              </div>
            </div>

            {/* Origin & Destination */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 p-2 rounded bg-green-500/[0.05] border border-green-500/15">
                <span className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-[10px] font-bold text-green-400">A</span>
                <div className="min-w-0">
                  <div className="text-xs text-white/80 truncate">{activeTab.route.origin.name || activeTab.route.origin.address || 'Origin'}</div>
                  <div className="text-[9px] text-white/30 font-mono">{formatCoord(activeTab.route.origin.lat)}, {formatCoord(activeTab.route.origin.lng)}</div>
                </div>
              </div>
              {/* Connector dots */}
              <div className="flex flex-col items-center py-0.5">
                <div className="w-px h-2 bg-white/10" />
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="w-px h-2 bg-white/10" />
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-red-500/[0.05] border border-red-500/15">
                <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-[10px] font-bold text-red-400">B</span>
                <div className="min-w-0">
                  <div className="text-xs text-white/80 truncate">{activeTab.route.destination.name || activeTab.route.destination.address || 'Destination'}</div>
                  <div className="text-[9px] text-white/30 font-mono">{formatCoord(activeTab.route.destination.lat)}, {formatCoord(activeTab.route.destination.lng)}</div>
                </div>
              </div>
            </div>

            {/* Turn-by-turn directions */}
            {activeTab.route.steps && activeTab.route.steps.length > 0 && (
              <div className="space-y-0.5">
                <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Turn-by-turn</div>
                {activeTab.route.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded hover:bg-white/[0.02] transition-colors">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-white/40 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] text-white/70">{step.instruction}</div>
                      {step.name && <div className="text-[10px] text-white/40 mt-0.5">{step.name}</div>}
                      <div className="text-[9px] text-cyan-400/50 font-mono mt-0.5">
                        {(step.distance / 1000).toFixed(1)} km · {Math.ceil(step.duration / 60)} min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer — tool info */}
      {activeTab && (
        <div className="px-3 py-1.5 border-t border-white/[0.06] text-[9px] text-white/25 font-mono flex items-center justify-between shrink-0">
          <span>tool: {activeTab.toolName}</span>
          <span>{activeTab.timestamp.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────
function RawDataAccordion({ data }: { data: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider hover:bg-white/[0.02] transition-colors"
      >
        <span>Raw Data</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <pre className="px-3 py-2 text-[10px] text-white/40 font-mono whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto border-t border-white/[0.06] bg-black/20">
          {data}
        </pre>
      )}
    </div>
  );
}
