/**
 * AssetBrowser — Full-screen asset management dashboard
 * Production-wired: fetches from /api/assets, uploads to S3 via backend, real CRUD
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Upload,
  Image as ImageIcon,
  File,
  Film,
  Music,
  Type,
  Grid,
  List,
  Trash2,
  Copy,
  Check,
  Loader2,
  Search,
  RefreshCw,
  X,
  ExternalLink,
  FolderOpen,
  LayoutGrid,
  SortAsc,
  SortDesc,
  Eye,
  Info,
  HardDrive,
  BarChart3,
  Zap,
  Shield,
  Archive,
  Link,
  Globe,
} from 'lucide-react';

// ── Types (matching backend CanvasAsset model) ─────────────────────

type AssetType = 'image' | 'video' | 'audio' | 'font' | 'document' | 'archive' | 'other';
type AssetTab = 'browse' | 'upload' | 'optimize' | 'cdn';
type SortField = 'name' | 'size' | 'date' | 'type';
type SortDir = 'asc' | 'desc';

interface Asset {
  id: string;
  type: AssetType;
  originalName: string;
  originalSize: number;
  optimizedSize?: number;
  storagePath?: string;
  cdnUrl: string;
  thumbnailUrl?: string;
  mimeType?: string;
  createdAt: string;
}

interface AssetBrowserProps {
  projectId: string;
  onInsertUrl?: (url: string) => void;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const timeAgo = (date: string): string => {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  image: { icon: <ImageIcon size={16} />, color: 'text-violet-400', bg: 'bg-violet-500/15', label: 'Images' },
  video: { icon: <Film size={16} />, color: 'text-indigo-400', bg: 'bg-indigo-500/15', label: 'Videos' },
  audio: { icon: <Music size={16} />, color: 'text-pink-400', bg: 'bg-pink-500/15', label: 'Audio' },
  font: { icon: <Type size={16} />, color: 'text-orange-400', bg: 'bg-orange-500/15', label: 'Fonts' },
  document: { icon: <File size={16} />, color: 'text-violet-400', bg: 'bg-violet-500/15', label: 'Documents' },
  archive: { icon: <Archive size={16} />, color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'Archives' },
  other: { icon: <File size={16} />, color: 'text-zinc-400', bg: 'bg-zinc-500/15', label: 'Other' },
};

const getTypeConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG.other;

// ── Component ──────────────────────────────────────────────────────

const AssetBrowser: React.FC<AssetBrowserProps> = ({ projectId, onInsertUrl, className = '' }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AssetTab>('browse');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load assets from API ─────────────────────────────────

  const loadAssets = useCallback(async () => {
    if (!projectId || projectId === 'default') {
      setAssets([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/assets/${projectId}`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to load assets (${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets || []);
      } else {
        throw new Error(data.message || 'Failed to load assets');
      }
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load assets');
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  // ── Computed ──────────────────────────────────────────────

  const totalSize = useMemo(() => assets.reduce((sum, a) => sum + a.originalSize, 0), [assets]);
  const optimizedSize = useMemo(() => assets.reduce((sum, a) => sum + (a.optimizedSize || a.originalSize), 0), [assets]);

  const typeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return counts;
  }, [assets]);

  const filtered = useMemo(() => {
    let result = [...assets];
    if (activeTypeFilter !== 'all') {
      result = result.filter(a => a.type === activeTypeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => a.originalName.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.originalName.localeCompare(b.originalName); break;
        case 'size': cmp = a.originalSize - b.originalSize; break;
        case 'date': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [assets, activeTypeFilter, searchQuery, sortField, sortDir]);

  // ── Actions ──────────────────────────────────────────────

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/assets/upload');
      xhr.withCredentials = true;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resp = JSON.parse(xhr.responseText);
              if (resp.success && resp.asset) {
                setAssets(prev => [resp.asset, ...prev]);
              } else {
                setUploadError(resp.message || 'Upload failed');
              }
            } catch {
              setUploadError('Invalid response from server');
            }
            resolve();
          } else {
            let msg = `Upload failed (${xhr.status})`;
            try { msg = JSON.parse(xhr.responseText).message || msg; } catch {}
            setUploadError(msg);
            resolve();
          }
        };
        xhr.onerror = () => {
          setUploadError('Network error — unable to upload');
          resolve();
        };
        xhr.send(formData);
      });
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const deleteAsset = useCallback(async (assetId: string) => {
    setIsDeleting(assetId);
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setAssets(prev => prev.filter(a => a.id !== assetId));
        setSelectedAssets(prev => { const next = new Set(prev); next.delete(assetId); return next; });
        if (detailAsset?.id === assetId) setDetailAsset(null);
      }
    } catch {} finally {
      setIsDeleting(null);
    }
  }, [detailAsset]);

  const deleteSelected = useCallback(async () => {
    const ids = Array.from(selectedAssets);
    for (const id of ids) {
      await deleteAsset(id);
    }
    setSelectedAssets(new Set());
  }, [selectedAssets, deleteAsset]);

  const copyUrl = useCallback((asset: Asset) => {
    navigator.clipboard.writeText(asset.cdnUrl);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  };

  // ── Tab: Browse ──────────────────────────────────────────────

  const renderBrowse = () => (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar — Type Filters */}
      <div className="w-56 shrink-0 border-r border-slate-200 dark:border-white/[0.06] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Filter</span>
            <button onClick={loadAssets} className="p-1 rounded hover:bg-white/[0.06] text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="Refresh">
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Type</span>
            <button
              onClick={() => setActiveTypeFilter('all')}
              className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors mb-1 ${
                activeTypeFilter === 'all' ? 'bg-slate-200 dark:bg-white/[0.06] text-slate-900 dark:text-white font-medium' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
              }`}
            >
              <LayoutGrid size={12} /> All Types
            </button>
            {(Object.entries(TYPE_CONFIG) as [AssetType, typeof TYPE_CONFIG[AssetType]][]).map(([type, cfg]) => {
              const count = typeStats[type] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setActiveTypeFilter(type)}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    activeTypeFilter === type ? `${cfg.bg} ${cfg.color} font-medium` : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                  }`}
                >
                  <span className={cfg.color}>{cfg.icon}</span>
                  <span className="flex-1 text-left">{cfg.label}</span>
                  <span className="text-[10px] opacity-50">{count}</span>
                </button>
              );
            })}
          </div>

        {/* Storage Usage */}
        <div className="p-3 border-t border-slate-200 dark:border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1"><HardDrive size={10} /> Storage</span>
            <span className="text-[10px] text-slate-900 dark:text-white font-mono">{formatSize(totalSize)}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-violet-500 rounded-full" style={{ width: `${Math.min((totalSize / 10_000_000) * 100, 100)}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-zinc-600">{assets.length} files</span>
            <span className="text-[9px] text-zinc-600">10 MB limit</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
          {/* Search */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-2.5 flex-1 max-w-xs">
            <Search size={12} className="text-zinc-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="bg-transparent text-xs text-slate-900 dark:text-white w-full py-1.5 outline-none placeholder:text-zinc-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-zinc-300"><X size={12} /></button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value as SortField)}
              className="px-2 py-1.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[10px] text-zinc-300 outline-none"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 transition-colors"
            >
              {sortDir === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
            </button>
          </div>

          {/* View mode */}
          <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] rounded-lg overflow-hidden border border-slate-200 dark:border-white/[0.06]">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}>
              <Grid size={13} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}>
              <List size={13} />
            </button>
          </div>

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-violet-600 hover:from-violet-500 hover:to-violet-500 rounded-lg text-xs font-bold text-slate-900 dark:text-white transition-all active:scale-95"
          >
            <Upload size={12} /> Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.woff,.woff2,.ttf,.otf,.json,.css,.js,.ts"
            onChange={e => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) uploadFiles(files);
              e.target.value = '';
            }}
          />

          {/* Bulk actions */}
          {selectedAssets.size > 0 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200 dark:border-white/[0.08]">
              <span className="text-[10px] text-zinc-400">{selectedAssets.size} selected</span>
              <button onClick={deleteSelected} className="p-1 rounded hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
              <button onClick={() => setSelectedAssets(new Set())} className="p-1 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-300 transition-colors"><X size={12} /></button>
            </div>
          )}
        </div>

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 bg-violet-500/10 border-2 border-dashed border-violet-500 rounded-xl flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Upload size={32} className="mx-auto text-violet-400 mb-2" />
              <p className="text-sm text-violet-300 font-medium">Drop files to upload</p>
            </div>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="px-4 py-2 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
            <div className="flex items-center gap-3">
              <Loader2 size={14} className="text-violet-400 animate-spin" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-400">Uploading...</span>
                  <span className="text-[10px] text-violet-300 font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-slate-200 dark:bg-white/[0.06] rounded-full">
                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Grid/List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen size={36} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-500">{searchQuery ? 'No matching assets' : 'No assets yet'}</p>
              <p className="text-xs text-zinc-600 mt-1">Upload files or drag & drop to get started</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-violet-500/15 hover:bg-violet-500/25 rounded-lg text-xs font-medium text-violet-300 transition-colors"
              >
                <Upload size={12} /> Upload Files
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── Grid View ── */
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map(asset => {
                const cfg = TYPE_CONFIG[asset.type];
                const isSelected = selectedAssets.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={`group relative rounded-xl border overflow-hidden transition-all hover:border-violet-500/30 cursor-pointer ${
                      isSelected ? 'border-violet-500/50 ring-1 ring-violet-500/20' : 'border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]'
                    }`}
                    onClick={() => setDetailAsset(asset)}
                  >
                    {/* Select checkbox */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleSelect(asset.id); }}
                      className={`absolute top-2 left-2 z-[2] w-5 h-5 rounded-md border flex items-center justify-center text-slate-900 dark:text-white transition-all ${
                        isSelected ? 'bg-violet-500 border-violet-500' : 'border-white/20 bg-slate-300 dark:bg-black/40 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check size={10} />}
                    </button>

                    {/* Thumbnail */}
                    <div className="aspect-square flex items-center justify-center bg-slate-200 dark:bg-black/20 relative">
                      {asset.type === 'image' && asset.cdnUrl ? (
                        <img src={asset.cdnUrl} alt={asset.originalName} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className={`w-full h-full ${cfg.bg} flex items-center justify-center`}>
                          <span className={`${cfg.color} scale-150`}>{cfg.icon}</span>
                        </div>
                      )}
                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-slate-400 dark:bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); setPreviewAsset(asset); }}
                          className="p-2 bg-slate-200 dark:bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                          <Eye size={14} className="text-slate-900 dark:text-white" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); copyUrl(asset); }}
                          className="p-2 bg-slate-200 dark:bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                          {copiedId === asset.id ? <Check size={14} className="text-violet-400" /> : <Copy size={14} className="text-slate-900 dark:text-white" />}
                        </button>
                        {onInsertUrl && (
                          <button onClick={e => { e.stopPropagation(); onInsertUrl(asset.cdnUrl); }}
                            className="p-2 bg-violet-600/50 rounded-lg hover:bg-violet-600/70 transition-colors">
                            <ExternalLink size={14} className="text-slate-900 dark:text-white" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="px-2.5 py-2">
                      <p className="text-[11px] text-slate-900 dark:text-white truncate font-medium" title={asset.originalName}>{asset.originalName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-zinc-500">{formatSize(asset.originalSize)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── List View ── */
            <div className="space-y-1">
              {/* Header row */}
              <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                <div className="w-5" />
                <div className="w-8" />
                <span className="flex-1">Name</span>
                <span className="w-16 text-right">Size</span>
                <span className="w-20 text-right">Type</span>
                <span className="w-20 text-right">Modified</span>
                <div className="w-24" />
              </div>
              {filtered.map(asset => {
                const cfg = TYPE_CONFIG[asset.type];
                const isSelected = selectedAssets.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => setDetailAsset(asset)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors cursor-pointer group ${
                      isSelected ? 'border-violet-500/30 bg-violet-500/5' : 'border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Checkbox */}
                    <button onClick={e => { e.stopPropagation(); toggleSelect(asset.id); }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-violet-500 border-violet-500 text-slate-900 dark:text-white' : 'border-slate-300 dark:border-white/10 hover:border-white/25'
                      }`}
                    >
                      {isSelected && <Check size={10} />}
                    </button>
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <span className={cfg.color}>{cfg.icon}</span>
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-900 dark:text-white truncate">{asset.originalName}</p>
                    </div>
                    {/* Size */}
                    <span className="w-16 text-right text-[10px] text-zinc-400 font-mono shrink-0">{formatSize(asset.originalSize)}</span>
                    {/* Type */}
                    <span className={`w-20 text-right text-[10px] font-medium shrink-0 ${cfg.color}`}>{cfg.label}</span>
                    {/* Date */}
                    <span className="w-20 text-right text-[10px] text-zinc-500 shrink-0">{timeAgo(asset.createdAt)}</span>
                    {/* Actions */}
                    <div className="w-24 flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={e => { e.stopPropagation(); copyUrl(asset); }} className="p-1 rounded hover:bg-white/[0.06]" title="Copy URL">
                        {copiedId === asset.id ? <Check size={12} className="text-violet-400" /> : <Copy size={12} className="text-zinc-400" />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); setPreviewAsset(asset); }} className="p-1 rounded hover:bg-white/[0.06]" title="Preview">
                        <Eye size={12} className="text-zinc-400" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteAsset(asset.id); }} className="p-1 rounded hover:bg-red-500/15" title="Delete">
                        <Trash2 size={12} className="text-zinc-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel — right sidebar when asset selected */}
      {detailAsset && (
        <div className="w-72 shrink-0 border-l border-slate-200 dark:border-white/[0.06] flex flex-col overflow-hidden bg-white/[0.01]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/[0.06]">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{detailAsset.originalName}</span>
            <button onClick={() => setDetailAsset(null)} className="p-1 rounded hover:bg-white/[0.06] text-zinc-500"><X size={14} /></button>
          </div>

          {/* Preview */}
          <div className="aspect-video flex items-center justify-center mx-4 mt-4 rounded-xl overflow-hidden bg-slate-200 dark:bg-black/20">
            {detailAsset.type === 'image' && detailAsset.cdnUrl ? (
              <img src={detailAsset.cdnUrl} alt={detailAsset.originalName} className="w-full h-full object-contain" />
            ) : (
              <div className={`w-full h-full ${TYPE_CONFIG[detailAsset.type].bg} flex items-center justify-center`}>
                <span className={`${TYPE_CONFIG[detailAsset.type].color} scale-[2]`}>{TYPE_CONFIG[detailAsset.type].icon}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            <div className="space-y-2">
              {([
                ['Name', detailAsset.originalName, 'text-slate-900 dark:text-white'],
                ['Type', TYPE_CONFIG[detailAsset.type].label, TYPE_CONFIG[detailAsset.type].color],
                ['Size', formatSize(detailAsset.originalSize), 'text-slate-900 dark:text-white'],
                ...(detailAsset.optimizedSize ? [['Optimized', formatSize(detailAsset.optimizedSize), 'text-violet-400']] : []),
                ...(detailAsset.mimeType ? [['MIME Type', detailAsset.mimeType, 'text-zinc-300']] : []),
                ['Uploaded', timeAgo(detailAsset.createdAt), 'text-zinc-400'],
              ] as [string, string, string][]).map(([label, value, color]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">{label}</span>
                  <span className={`text-[10px] font-medium truncate max-w-[140px] ${color}`} title={value}>{value}</span>
                </div>
              ))}
            </div>

            {/* CDN URL */}
            <div>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1.5 block">CDN URL</span>
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-black/20 rounded-lg px-2 py-1.5">
                <span className="text-[10px] text-zinc-400 font-mono truncate flex-1">{detailAsset.cdnUrl}</span>
                <button onClick={() => copyUrl(detailAsset)} className="p-1 shrink-0 text-zinc-400 hover:text-slate-900 dark:hover:text-white">
                  {copiedId === detailAsset.id ? <Check size={12} className="text-violet-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {detailAsset.optimizedSize && detailAsset.optimizedSize < detailAsset.originalSize && (
              <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5">
                  <Zap size={12} className="text-violet-400" />
                  <span className="text-[10px] text-violet-300 font-medium">
                    {Math.round((1 - detailAsset.optimizedSize / detailAsset.originalSize) * 100)}% smaller
                  </span>
                </div>
                <p className="text-[9px] text-zinc-500 mt-0.5">{formatSize(detailAsset.originalSize)} → {formatSize(detailAsset.optimizedSize)}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-slate-200 dark:border-white/[0.06] space-y-1.5 shrink-0">
            <button onClick={() => copyUrl(detailAsset)}
              className="flex items-center gap-2 w-full px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 rounded-lg text-xs font-medium text-violet-300 transition-colors">
              <Copy size={12} /> Copy URL
            </button>
            {onInsertUrl && (
              <button onClick={() => onInsertUrl(detailAsset.cdnUrl)}
                className="flex items-center gap-2 w-full px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 rounded-lg text-xs font-medium text-violet-300 transition-colors">
                <ExternalLink size={12} /> Insert into Code
              </button>
            )}
            <button onClick={() => deleteAsset(detailAsset.id)}
              className="flex items-center gap-2 w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs font-medium text-red-400 transition-colors">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Tab: Upload ──────────────────────────────────────────────

  const renderUpload = () => (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Drop zone — large */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragging ? 'border-violet-500 bg-violet-500/10' : 'border-slate-300 dark:border-white/10 hover:border-violet-500/30 hover:bg-white/[0.02]'
          }`}
        >
          <Upload size={40} className="mx-auto text-zinc-500 mb-3" />
          <p className="text-sm text-zinc-300 font-medium">Drop files or click to upload</p>
          <p className="text-xs text-zinc-500 mt-1">Images, videos, fonts, documents, code files</p>
          <p className="text-[10px] text-zinc-600 mt-2">Max 50MB per file · Multiple files supported</p>
        </div>

        {/* Supported formats */}
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Shield size={14} className="text-violet-400" /> Supported Formats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.entries(TYPE_CONFIG) as [AssetType, typeof TYPE_CONFIG[AssetType]][]).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-white/[0.04]">
                <span className={cfg.color}>{cfg.icon}</span>
                <div>
                  <p className="text-[11px] text-slate-900 dark:text-white font-medium">{cfg.label}</p>
                  <p className="text-[9px] text-zinc-500">
                    {type === 'image' ? 'PNG, JPG, SVG, WebP, GIF' :
                     type === 'video' ? 'MP4, WebM, MOV' :
                     type === 'audio' ? 'MP3, WAV, OGG' :
                     type === 'font' ? 'WOFF2, TTF, OTF' :
                     type === 'document' ? 'PDF, TXT, MD' :
                     type === 'code' ? 'JS, TS, CSS, JSON' : 'All other files'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload tips */}
        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2"><Info size={14} /> Upload Tips</h3>
          <ul className="space-y-1.5 text-xs text-zinc-400">
            <li className="flex items-start gap-2"><Check size={12} className="text-indigo-400 mt-0.5 shrink-0" /> Use WebP or AVIF for images — up to 30% smaller than PNG</li>
            <li className="flex items-start gap-2"><Check size={12} className="text-indigo-400 mt-0.5 shrink-0" /> WOFF2 fonts load faster than TTF or OTF</li>
            <li className="flex items-start gap-2"><Check size={12} className="text-indigo-400 mt-0.5 shrink-0" /> Assets are served from CDN for optimal delivery</li>
            <li className="flex items-start gap-2"><Check size={12} className="text-indigo-400 mt-0.5 shrink-0" /> Images are auto-optimized on upload</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // ── Tab: Optimize ──────────────────────────────────────────────

  const renderOptimize = () => {
    const savingsBytes = totalSize - optimizedSize;
    const savingsPct = totalSize > 0 ? Math.round((savingsBytes / totalSize) * 100) : 0;
    const imageAssets = assets.filter(a => a.type === 'image');
    const optimizable = imageAssets.filter(a => !a.optimizedSize || a.optimizedSize === a.originalSize);

    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 text-center">
              <HardDrive size={20} className="mx-auto text-violet-400 mb-2" />
              <p className="text-lg font-bold text-slate-900 dark:text-white">{formatSize(totalSize)}</p>
              <p className="text-[10px] text-zinc-500">Total Size</p>
            </div>
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 text-center">
              <Zap size={20} className="mx-auto text-violet-400 mb-2" />
              <p className="text-lg font-bold text-violet-400">{formatSize(optimizedSize)}</p>
              <p className="text-[10px] text-zinc-500">Optimized Size</p>
            </div>
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 text-center">
              <BarChart3 size={20} className="mx-auto text-violet-400 mb-2" />
              <p className="text-lg font-bold text-violet-400">{savingsPct}%</p>
              <p className="text-[10px] text-zinc-500">Savings ({formatSize(savingsBytes)})</p>
            </div>
          </div>

          {/* Optimization actions */}
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Zap size={14} className="text-amber-400" /> Optimization</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <ImageIcon size={14} className="text-violet-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">Compress Images</p>
                    <p className="text-[10px] text-zinc-500">{optimizable.length} images can be optimized</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-violet-500/15 hover:bg-violet-500/25 rounded-lg text-[10px] font-semibold text-violet-300 transition-colors">
                  Optimize All
                </button>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <Film size={14} className="text-indigo-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">Convert to WebP</p>
                    <p className="text-[10px] text-zinc-500">Convert PNG/JPG to WebP for 25-35% savings</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 rounded-lg text-[10px] font-semibold text-indigo-300 transition-colors">
                  Convert
                </button>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <Archive size={14} className="text-violet-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">Generate Responsive Versions</p>
                    <p className="text-[10px] text-zinc-500">Create 1x, 2x, 3x variants for retina displays</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-violet-500/15 hover:bg-violet-500/25 rounded-lg text-[10px] font-semibold text-violet-300 transition-colors">
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Asset breakdown */}
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><BarChart3 size={14} className="text-violet-400" /> Breakdown by Type</h3>
            <div className="space-y-2">
              {(Object.entries(typeStats) as [AssetType, number][]).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const cfg = TYPE_CONFIG[type];
                const typeSize = assets.filter(a => a.type === type).reduce((s, a) => s + a.originalSize, 0);
                const pct = totalSize > 0 ? Math.round((typeSize / totalSize) * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                      <span className={cfg.color}>{cfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-slate-900 dark:text-white font-medium">{cfg.label}</span>
                        <span className="text-[10px] text-zinc-400">{count} files · {formatSize(typeSize)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-white/[0.06] rounded-full">
                        <div className={`h-full rounded-full ${cfg.bg.replace('/15', '/40')}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Tab: CDN ──────────────────────────────────────────────

  const renderCDN = () => (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* CDN Info */}
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Globe size={14} className="text-indigo-400" /> CDN Configuration</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">CDN Base URL</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-slate-200 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs text-zinc-300 font-mono">
                  https://cdn.studio.mumtaz.ai/assets/
                </div>
                <button className="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Project ID</label>
              <div className="px-3 py-2 bg-slate-200 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs text-violet-400 font-mono">
                {projectId}
              </div>
            </div>
          </div>
        </div>

        {/* Cache settings */}
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Shield size={14} className="text-violet-400" /> Cache & Performance</h3>
          <div className="space-y-2">
            {([
              { label: 'Cache-Control', value: 'public, max-age=31536000, immutable', desc: 'Assets cached for 1 year' },
              { label: 'Content Encoding', value: 'gzip, br', desc: 'Brotli + Gzip compression enabled' },
              { label: 'Edge Locations', value: '40+ PoPs worldwide', desc: 'Served from nearest edge' },
              { label: 'CORS', value: 'Access-Control-Allow-Origin: *', desc: 'Cross-origin requests allowed' },
            ]).map(item => (
              <div key={item.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <p className="text-xs font-medium text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-[10px] text-zinc-500">{item.desc}</p>
                </div>
                <span className="text-[10px] text-violet-400 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All CDN URLs */}
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Link size={12} /> All Asset URLs</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {assets.map(a => (
              <div key={a.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.03] group">
                <span className={TYPE_CONFIG[a.type].color}>{TYPE_CONFIG[a.type].icon}</span>
                <span className="text-[11px] text-zinc-300 font-mono truncate flex-1">{a.cdnUrl}</span>
                <button onClick={() => copyUrl(a)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.06] transition-all">
                  {copiedId === a.id ? <Check size={12} className="text-violet-400" /> : <Copy size={12} className="text-zinc-400" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Tab config ──────────────────────────────────────────────

  const tabs: { id: AssetTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'browse', label: 'Browse', icon: <FolderOpen size={14} />, count: assets.length },
    { id: 'upload', label: 'Upload', icon: <Upload size={14} /> },
    { id: 'optimize', label: 'Optimize', icon: <Zap size={14} /> },
    { id: 'cdn', label: 'CDN', icon: <Globe size={14} /> },
  ];

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-[#0a0a0a] ${className}`}>
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 dark:border-white/[0.06] shrink-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/25'
                : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === tab.id ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-200 dark:bg-white/[0.06] text-zinc-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] text-zinc-600">{formatSize(totalSize)} used</span>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'browse' && renderBrowse()}
      {activeTab === 'upload' && renderUpload()}
      {activeTab === 'optimize' && renderOptimize()}
      {activeTab === 'cdn' && renderCDN()}

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPreviewAsset(null)}>
          <div className="relative max-w-3xl max-h-[85vh] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-white/10"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className={TYPE_CONFIG[previewAsset.type].color}>{TYPE_CONFIG[previewAsset.type].icon}</span>
                <span className="text-sm text-slate-900 dark:text-white font-medium truncate">{previewAsset.originalName}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => copyUrl(previewAsset)} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-zinc-400 hover:text-slate-900 dark:hover:text-white">
                  {copiedId === previewAsset.id ? <Check size={14} className="text-violet-400" /> : <Copy size={14} />}
                </button>
                <button onClick={() => setPreviewAsset(null)} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-zinc-400 hover:text-slate-900 dark:hover:text-white">
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center p-6 min-h-[300px]">
              {previewAsset.type === 'image' && previewAsset.cdnUrl ? (
                <img src={previewAsset.cdnUrl} alt={previewAsset.originalName} className="max-w-full max-h-[60vh] rounded-xl object-contain" />
              ) : (
                <div className={`w-48 h-48 rounded-2xl flex items-center justify-center ${TYPE_CONFIG[previewAsset.type].bg}`}>
                  <span className={`${TYPE_CONFIG[previewAsset.type].color} scale-[3]`}>{TYPE_CONFIG[previewAsset.type].icon}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-300 dark:border-white/10">
              <span className="text-[10px] text-zinc-500">{formatSize(previewAsset.originalSize)}</span>
              <div className="flex-1" />
              <button onClick={() => copyUrl(previewAsset)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-bold text-slate-900 dark:text-white transition-colors">
                <Copy size={12} /> Copy URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetBrowser;
