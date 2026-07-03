import React, { useState, useRef, useEffect } from 'react';
import { fetchWithCredentials } from '../fetchUtil';
import { PreviewContent } from './PanelPreview';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'font' | 'document';
  size: number;
  url: string;
  mimeType?: string;
  createdAt?: string;
}

const FILTERS = ['all', 'image', 'video', 'audio', 'font', 'document'] as const;

const AssetsPanel: React.FC<{ onClose?: () => void; onPreviewContent?: (c: PreviewContent) => void }> = ({ onClose, onPreviewContent }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');
  const [selected, setSelected] = useState<Asset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load assets from DB on mount
  useEffect(() => {
    setLoading(true);
    fetchWithCredentials('/api/assets?sourceApp=canvas', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.assets) {
          setAssets(data.assets.map((a: any) => ({
            id: a.id,
            name: a.name,
            type: a.type || 'document',
            size: a.size || 0,
            url: a.url || '',
            mimeType: a.mimeType,
            createdAt: a.createdAt,
          })));
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeIcon = (type: Asset['type']) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'font': return '🔤';
      default: return '📄';
    }
  };

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('files', file));
      formData.append('sourceApp', 'canvas');

      const res = await fetchWithCredentials('/api/assets/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.assets) {
        const newAssets: Asset[] = data.assets.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type || 'document',
          size: a.size || 0,
          url: a.url || '',
          mimeType: a.mimeType,
          createdAt: a.createdAt,
        }));
        setAssets(prev => [...newAssets, ...prev]);
      } else if (data.success && data.asset) {
        setAssets(prev => [{
          id: data.asset.id,
          name: data.asset.name,
          type: data.asset.type || 'document',
          size: data.asset.size || 0,
          url: data.asset.url || '',
          mimeType: data.asset.mimeType,
          createdAt: data.asset.createdAt,
        }, ...prev]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      await fetchWithCredentials(`/api/assets/${id}`, { method: 'DELETE', credentials: 'include' });
    } catch { /* continue removing from state */ }
    setAssets(prev => prev.filter(a => a.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = filter === 'all' ? assets : assets.filter(a => a.type === filter);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111]/95">
      {/* Fixed Header */}
      <div className="px-6 py-4 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold text-cyan-500/80 uppercase tracking-widest">Assets Library</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-600 hover:text-indigo-600 dark:text-indigo-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-4">
        {/* Upload Area */}
        <div
          className="p-6 bg-black/30 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 rounded-lg text-center cursor-pointer transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files); }}
        >
          <input ref={fileRef} type="file" multiple className="hidden" onChange={e => e.target.files && handleUpload(e.target.files)} />
          {uploading ? (
            <>
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Uploading...</p>
            </>
          ) : (
            <>
              <p className="text-xl mb-1">📤</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Drop files or click to upload</p>
              <p className="text-[10px] text-gray-700 mt-0.5">Images, videos, audio, fonts</p>
            </>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg whitespace-nowrap transition-colors ${filter === f
                ? 'bg-cyan-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                : 'bg-black/30 border border-slate-200 dark:border-slate-800 text-gray-500 hover:text-slate-700 dark:text-slate-300 hover:border-gray-600'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="p-4 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg text-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Loading assets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg text-center py-10">
            <p className="text-gray-600 text-xl mb-2">📁</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">No assets yet</p>
            <p className="text-[10px] text-gray-700 mt-1">Upload files to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filtered.map(asset => (
              <div
                key={asset.id}
                onClick={() => { setSelected(asset); if (onPreviewContent) { if (asset.type === 'image') onPreviewContent({ type: 'image', src: asset.url, title: asset.name, icon: '🖼️' }); else if (asset.type === 'video') onPreviewContent({ type: 'video', src: asset.url, title: asset.name, icon: '🎬' }); else onPreviewContent({ type: 'html', title: 'ASSETS_LIBRARY', icon: '📦', html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;padding:32px}.card{background:#111;border:1px solid #1f2937;border-radius:12px;padding:24px;max-width:480px}h2{font-size:13px;font-weight:700;color:#22d3ee;text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1f2937;font-size:12px}.label{color:#4b5563}.value{color:#e5e7eb;font-weight:600}.url{word-break:break-all;color:#22d3ee;font-size:11px;margin-top:12px}</style></head><body><div class="card"><h2>' + typeIcon(asset.type) + ' ' + asset.name + '</h2><div class="row"><span class="label">Type</span><span class="value">' + asset.type + '</span></div><div class="row"><span class="label">Size</span><span class="value">' + formatSize(asset.size) + '</span></div><div class="row"><span class="label">Uploaded</span><span class="value">' + (asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'Unknown') + '</span></div>' + (asset.mimeType ? '<div class="row"><span class="label">MIME</span><span class="value">' + asset.mimeType + '</span></div>' : '') + '<div class="url">' + asset.url + '</div></div></body></html>' }); } }}
                className={`p-2 bg-black/30 rounded-lg cursor-pointer transition-all ${selected?.id === asset.id
                  ? 'border border-indigo-500/50 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                  : 'border border-slate-200 dark:border-slate-800 hover:border-gray-600'
                  }`}
              >
                <div className="aspect-square bg-slate-400 dark:bg-black/50 rounded flex items-center justify-center mb-1.5 overflow-hidden">
                  {asset.type === 'image' ? (
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">{typeIcon(asset.type)}</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{asset.name}</p>
                <p className="text-[9px] text-gray-700">{formatSize(asset.size)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Selected Asset Detail */}
        {selected && (
          <div className="p-4 bg-black/30 border border-indigo-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span>{typeIcon(selected.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selected.name}</p>
                <p className="text-[10px] text-gray-600">{selected.type} • {formatSize(selected.size)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(selected.url)}
                className="flex-1 py-1.5 bg-black/30 border border-slate-200 dark:border-slate-800 text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:border-gray-600 text-[10px] font-bold rounded uppercase tracking-wider transition-colors"
              >
                Copy URL
              </button>
              <button
                onClick={() => deleteAsset(selected.id)}
                className="py-1.5 px-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[10px] font-bold rounded uppercase tracking-wider transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetsPanel;
