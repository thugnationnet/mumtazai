/**
 * CANVAS STUDIO - VIDEO GENERATION PANEL
 * AI video & image generation:
 *   - RunwayML: Gen-4, Gen-4.5 (text-to-video, image-to-video, text-to-image)
 *   - fal.ai: Minimax video-01-live (text-to-video)
 * Integrates with the canvas sidebar as a panel.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWithCredentials } from '../fetchUtil';
import { PreviewContent } from './PanelPreview';

type VideoMode = 'text-to-video' | 'image-to-video' | 'text-to-image' | 'video-to-video';
type Provider = 'runwayml' | 'fal';

interface VideoItem {
  id: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'throttled';
  videoUrl?: string;
  imageUrl?: string;
  requestId?: string;  // fal.ai
  taskId?: string;     // RunwayML
  provider: Provider;
  mode: VideoMode;
  model?: string;
  createdAt: number;
  error?: string;
  progress?: number;
}

interface ProviderInfo {
  id: string;
  name: string;
  available: boolean;
  models: { id: string; name: string; type: string; description: string; duration?: number[]; ratios?: string[] }[];
  capabilities: string[];
}

interface VideoPanelProps {
  onClose?: () => void;
  onPreviewContent?: (content: PreviewContent) => void;
}

const MODES: { id: VideoMode; label: string; icon: string; desc: string }[] = [
  { id: 'text-to-video', label: 'Text → Video', icon: '🎬', desc: 'Generate video from text' },
  { id: 'image-to-video', label: 'Image → Video', icon: '🖼️', desc: 'Animate an image' },
  { id: 'text-to-image', label: 'Text → Image', icon: '🎨', desc: 'Generate an image' },
];

const VideoPanel: React.FC<VideoPanelProps> = ({ onClose, onPreviewContent }) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<VideoMode>('text-to-video');
  const [provider, setProvider] = useState<Provider>('runwayml');
  const [model, setModel] = useState('gen4');
  const [ratio, setRatio] = useState('1280:720');
  const [duration, setDuration] = useState(5);
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastGenerateRef = useRef<number>(0);
  const onPreviewContentRef = useRef(onPreviewContent);
  onPreviewContentRef.current = onPreviewContent;
  const GENERATE_COOLDOWN_MS = 3000;

  // Load available providers
  useEffect(() => {
    fetchWithCredentials('/api/video/providers', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.providers) {
          setProviders(data.providers);
          if (data.defaultProvider) setProvider(data.defaultProvider);
        }
      })
      .catch(() => { });
  }, []);

  // Load video generation history from DB
  useEffect(() => {
    fetchWithCredentials('/api/video/history?limit=50&sourceApp=canvas', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.videos?.length) {
          const loaded: VideoItem[] = data.videos.map((v: any) => ({
            id: v.id,
            prompt: v.prompt,
            status: v.status === 'queued' || v.status === 'processing' ? 'failed' : v.status,
            videoUrl: v.videoUrl || undefined,
            imageUrl: v.imageUrl || undefined,
            requestId: v.requestId || undefined,
            taskId: v.taskId || undefined,
            provider: v.provider as Provider,
            mode: v.mode as VideoMode,
            model: v.model || undefined,
            createdAt: new Date(v.createdAt).getTime(),
            error: v.status === 'queued' || v.status === 'processing' ? 'Session expired' : (v.error || undefined),
            progress: v.progress || undefined,
          }));
          setVideos(loaded);
        }
      })
      .catch(() => { });
  }, []);

  // Poll for RunwayML task status
  const pollRunwayStatus = useCallback(async (videoId: string, taskId: string) => {
    try {
      const res = await fetchWithCredentials(`/api/video/runway/status/${taskId}`, { credentials: 'include' });
      if (!res.ok) return false;
      const data = await res.json();

      if (data.status === 'COMPLETED' && data.output) {
        const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        setVideos(prev => prev.map(v =>
          v.id === videoId ? { ...v, status: 'completed', videoUrl: outputUrl, imageUrl: outputUrl } : v
        ));
        onPreviewContentRef.current?.({ type: 'video', src: outputUrl, title: 'Generated Video', icon: '🎬' });
        // Persist to DB
        fetchWithCredentials(`/api/video/history/${videoId}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', videoUrl: outputUrl, imageUrl: outputUrl }),
        }).catch(() => { });
        return true;
      }

      if (data.status === 'FAILED' || data.status === 'CANCELLED') {
        setVideos(prev => prev.map(v =>
          v.id === videoId ? { ...v, status: 'failed', error: data.error || 'Generation failed' } : v
        ));
        fetchWithCredentials(`/api/video/history/${videoId}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'failed', error: data.error || 'Generation failed' }),
        }).catch(() => { });
        return true;
      }

      // Update progress
      setVideos(prev => prev.map(v =>
        v.id === videoId ? {
          ...v,
          status: data.status === 'THROTTLED' ? 'throttled' : data.status === 'QUEUED' ? 'queued' : 'processing',
          progress: data.progress || 0,
        } : v
      ));
      return false;
    } catch {
      return false;
    }
  }, []);

  // Poll for fal.ai status
  const pollFalStatus = useCallback(async (videoId: string, requestId: string) => {
    try {
      const res = await fetchWithCredentials(`/api/video/status/${requestId}`, { credentials: 'include' });
      if (!res.ok) return false;
      const data = await res.json();

      if (data.success && data.status === 'COMPLETED' && data.videoUrl) {
        setVideos(prev => prev.map(v =>
          v.id === videoId ? { ...v, status: 'completed', videoUrl: data.videoUrl } : v
        ));
        onPreviewContentRef.current?.({ type: 'video', src: data.videoUrl, title: 'Generated Video', icon: '🎬' });
        fetchWithCredentials(`/api/video/history/${videoId}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', videoUrl: data.videoUrl }),
        }).catch(() => { });
        return true;
      }

      if (!data.success) {
        setVideos(prev => prev.map(v =>
          v.id === videoId ? { ...v, status: 'failed', error: data.error } : v
        ));
        fetchWithCredentials(`/api/video/history/${videoId}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'failed', error: data.error }),
        }).catch(() => { });
        return true;
      }

      setVideos(prev => prev.map(v =>
        v.id === videoId ? { ...v, status: data.status === 'IN_QUEUE' ? 'queued' : 'processing' } : v
      ));
      return false;
    } catch {
      return false;
    }
  }, []);

  // Start polling for pending videos
  useEffect(() => {
    const pendingVideos = videos.filter(v => ['queued', 'processing', 'throttled'].includes(v.status));

    if (pendingVideos.length === 0) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    if (!pollTimerRef.current) {
      pollTimerRef.current = setInterval(async () => {
        const currentPending = videos.filter(v => ['queued', 'processing', 'throttled'].includes(v.status));
        for (const video of currentPending) {
          if (video.provider === 'runwayml' && video.taskId) {
            const done = await pollRunwayStatus(video.id, video.taskId);
            if (done) break;
          } else if (video.provider === 'fal' && video.requestId) {
            const done = await pollFalStatus(video.id, video.requestId);
            if (done) break;
          }
        }
      }, 3000);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [videos, pollRunwayStatus, pollFalStatus]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    const now = Date.now();
    const elapsed = now - lastGenerateRef.current;
    if (elapsed < GENERATE_COOLDOWN_MS) {
      setError(`Please wait ${Math.ceil((GENERATE_COOLDOWN_MS - elapsed) / 1000)}s`);
      return;
    }
    lastGenerateRef.current = now;

    setError(null);
    setIsGenerating(true);

    const currentPrompt = prompt.trim();
    const currentModel = provider === 'runwayml' ? model : 'minimax-video-01-live';

    // Save to DB first and use DB id
    let dbId = 'vid_' + Date.now();
    try {
      const saveRes = await fetchWithCredentials('/api/video/history', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, mode, provider, model: currentModel, status: 'queued', sourceApp: 'canvas' }),
      });
      const saveData = await saveRes.json();
      if (saveData.success && saveData.video?.id) dbId = saveData.video.id;
    } catch { /* use client id as fallback */ }

    const newVideo: VideoItem = {
      id: dbId,
      prompt: currentPrompt,
      status: 'queued',
      provider,
      mode,
      model: currentModel,
      createdAt: Date.now(),
    };

    setVideos(prev => [newVideo, ...prev]);
    setPrompt('');
    onPreviewContentRef.current?.({
      type: 'html', title: 'VIDEO_GENERATION', icon: '🎬',
      html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;min-height:100vh;display:flex;align-items:center;justify-content:center}.card{text-align:center;max-width:400px;padding:32px}.spinner{width:48px;height:48px;border:3px solid #1f2937;border-top-color:#a855f7;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px}@keyframes spin{to{transform:rotate(360deg)}}.title{font-size:16px;font-weight:700;color:#a855f7;margin-bottom:8px}.prompt{font-size:12px;color:#6b7280;margin-bottom:16px;font-style:italic;max-width:300px;line-height:1.5}.badge{background:#1f2937;border:1px solid #374151;border-radius:20px;padding:4px 16px;font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.1em}</style></head><body><div class="card"><div class="spinner"></div><div class="title">Generating ' + (mode === 'text-to-image' ? 'Image' : 'Video') + '...</div><div class="prompt">"' + currentPrompt.slice(0, 120) + (currentPrompt.length > 120 ? '...' : '') + '"</div><div class="badge">' + provider + ' · ' + (mode === 'text-to-image' ? 'image' : currentModel) + '</div></div></body></html>',
    });

    try {
      if (provider === 'runwayml') {
        // RunwayML generation
        const reqBody: any = {
          mode,
          model: mode === 'text-to-image' ? 'gen4_image' : model,
          prompt: currentPrompt,
          ratio,
          duration,
        };
        if (mode === 'image-to-video' && imageUrl) {
          reqBody.promptImage = imageUrl;
        }

        const res = await fetchWithCredentials('/api/video/runway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(reqBody),
        });

        const data = await res.json();

        if (data.success && data.taskId) {
          setVideos(prev => prev.map(v =>
            v.id === dbId ? { ...v, taskId: data.taskId, status: 'processing' } : v
          ));
          fetchWithCredentials(`/api/video/history/${dbId}`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'processing', taskId: data.taskId }),
          }).catch(() => { });
        } else {
          setVideos(prev => prev.map(v =>
            v.id === dbId ? { ...v, status: 'failed', error: data.error } : v
          ));
          fetchWithCredentials(`/api/video/history/${dbId}`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'failed', error: data.error }),
          }).catch(() => { });
          setError(data.error);
        }
      } else {
        // fal.ai generation
        const res = await fetchWithCredentials('/api/video/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ prompt: currentPrompt }),
        });

        const data = await res.json();

        if (data.success) {
          if (data.status === 'COMPLETED' && data.videoUrl) {
            setVideos(prev => prev.map(v =>
              v.id === dbId ? { ...v, status: 'completed', videoUrl: data.videoUrl } : v
            ));
            onPreviewContentRef.current?.({ type: 'video', src: data.videoUrl, title: 'Generated Video', icon: '🎬' });
            fetchWithCredentials(`/api/video/history/${dbId}`, {
              method: 'PATCH', credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'completed', videoUrl: data.videoUrl }),
            }).catch(() => { });
          } else {
            setVideos(prev => prev.map(v =>
              v.id === dbId ? { ...v, requestId: data.requestId, status: 'processing' } : v
            ));
            fetchWithCredentials(`/api/video/history/${dbId}`, {
              method: 'PATCH', credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'processing', requestId: data.requestId }),
            }).catch(() => { });
          }
        } else {
          setVideos(prev => prev.map(v =>
            v.id === dbId ? { ...v, status: 'failed', error: data.error } : v
          ));
          fetchWithCredentials(`/api/video/history/${dbId}`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'failed', error: data.error }),
          }).catch(() => { });
          setError(data.error);
        }
      }
    } catch (err: any) {
      setVideos(prev => prev.map(v =>
        v.id === dbId ? { ...v, status: 'failed', error: err.message } : v
      ));
      fetchWithCredentials(`/api/video/history/${dbId}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'failed', error: err.message }),
      }).catch(() => { });
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelTask = async (video: VideoItem) => {
    if (video.provider === 'runwayml' && video.taskId) {
      try {
        await fetchWithCredentials(`/api/video/runway/cancel/${video.taskId}`, { method: 'DELETE', credentials: 'include' });
        setVideos(prev => prev.map(v =>
          v.id === video.id ? { ...v, status: 'failed', error: 'Cancelled' } : v
        ));
      } catch { }
    }
  };

  const removeVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    fetchWithCredentials(`/api/video/history/${id}`, { method: 'DELETE', credentials: 'include' }).catch(() => { });
  };

  const downloadMedia = async (url: string, name: string, isImage: boolean) => {
    try {
      const res = await fetchWithCredentials(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${name}.${isImage ? 'png' : 'mp4'}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const currentProviderInfo = providers.find(p => p.id === provider);
  const availableModels = currentProviderInfo?.models?.filter(m => {
    if (mode === 'text-to-video' || mode === 'image-to-video') return m.type === 'text-to-video';
    if (mode === 'text-to-image') return m.type === 'text-to-image';
    return true;
  }) || [];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111]/95">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50">
        <div>
          <h3 className="text-xs font-bold text-pink-400/80 uppercase tracking-widest">
            AI Media Studio
          </h3>
          <p className="text-[9px] text-gray-600 mt-0.5">
            {provider === 'runwayml' ? 'RunwayML' : 'fal.ai'} · {MODES.find(m => m.id === mode)?.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`text-gray-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors ${showSettings ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-600 hover:text-indigo-600 dark:text-indigo-400 transition-colors" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel (collapsible) */}
      {showSettings && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/30 space-y-3 bg-black/30">
          {/* Provider */}
          <div>
            <label className="block text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Provider</label>
            <div className="flex gap-1.5">
              {providers.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProvider(p.id as Provider);
                    if (p.id === 'fal') { setMode('text-to-video'); setModel('minimax-video-01-live'); }
                    else { setModel('gen4'); }
                  }}
                  disabled={!p.available}
                  className={`flex-1 px-2 py-1.5 text-[10px] rounded-lg border transition-all ${provider === p.id
                    ? 'border-pink-500/50 bg-pink-500/10 text-pink-400'
                    : p.available
                      ? 'border-slate-200 dark:border-slate-800 bg-black/30 text-gray-500 hover:border-gray-600'
                      : 'border-slate-200 dark:border-slate-800/30 bg-black/10 text-gray-700 cursor-not-allowed'
                    }`}
                >
                  {p.name}
                </button>
              ))}
              {providers.length === 0 && (
                <span className="text-[10px] text-gray-600">Loading providers...</span>
              )}
            </div>
          </div>

          {/* Mode (RunwayML only — fal is text-to-video only) */}
          {provider === 'runwayml' && (
            <div>
              <label className="block text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Mode</label>
              <div className="flex gap-1.5">
                {MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id);
                      if (m.id === 'text-to-image') setModel('gen4_image');
                      else setModel('gen4');
                    }}
                    className={`flex-1 px-2 py-1.5 text-[10px] rounded-lg border transition-all ${mode === m.id
                      ? 'border-indigo-500/50 bg-cyan-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 bg-black/30 text-gray-500 hover:border-gray-600'
                      }`}
                  >
                    <span className="block">{m.icon}</span>
                    <span className="block mt-0.5">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Model */}
          {provider === 'runwayml' && availableModels.length > 0 && mode !== 'text-to-image' && (
            <div>
              <label className="block text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Model</label>
              <div className="flex gap-1.5">
                {availableModels.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`flex-1 px-2 py-1.5 text-[10px] rounded-lg border transition-all ${model === m.id
                      ? 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                      : 'border-slate-200 dark:border-slate-800 bg-black/30 text-gray-500 hover:border-gray-600'
                      }`}
                  >
                    <span className="block font-bold">{m.name}</span>
                    <span className="block text-[8px] mt-0.5 text-gray-600">{m.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ratio & Duration */}
          {provider === 'runwayml' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Ratio</label>
                <select
                  value={ratio}
                  onChange={e => setRatio(e.target.value)}
                  className="w-full px-2 py-1.5 text-[10px] bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="1280:720">16:9 Landscape</option>
                  <option value="720:1280">9:16 Portrait</option>
                  <option value="1024:1024">1:1 Square</option>
                </select>
              </div>
              {mode !== 'text-to-image' && (
                <div className="flex-1">
                  <label className="block text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Duration</label>
                  <select
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-[10px] bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Image URL (for image-to-video) */}
          {mode === 'image-to-video' && provider === 'runwayml' && (
            <div>
              <label className="block text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Source Image URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 text-[10px] bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder-gray-600 focus:border-pink-500/50 outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Prompt Input */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800/30">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder={
              mode === 'text-to-image'
                ? 'Describe the image you want to generate...'
                : mode === 'image-to-video'
                  ? 'Describe how the image should animate...'
                  : 'Describe the video you want to generate...'
            }
            rows={3}
            maxLength={2000}
            className="w-full px-4 py-3 text-xs bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder-gray-600 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 outline-none transition-all resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || (mode === 'image-to-video' && !imageUrl)}
            className="absolute bottom-3 right-3 px-3 py-1.5 text-[10px] font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-slate-900 dark:text-white rounded-lg hover:from-pink-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 transition-all uppercase tracking-wider"
          >
            {isGenerating ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating
              </span>
            ) : (
              `${MODES.find(m => m.id === mode)?.icon || '🎬'} Generate`
            )}
          </button>
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(mode === 'text-to-image'
            ? [
              'A photorealistic mountain landscape at dawn',
              'Abstract digital art with neon colors',
              'A fantasy castle in the clouds',
              'A cyberpunk street at night',
            ]
            : [
              'A cinematic sunset over the ocean',
              'A futuristic city with flying cars',
              'Abstract colorful particles flowing',
              'A cat playing with a butterfly',
            ]
          ).map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setPrompt(suggestion)}
              className="px-2 py-1 text-[9px] bg-black/30 border border-slate-200 dark:border-slate-800 rounded text-gray-500 hover:text-pink-400 hover:border-pink-500/30 transition-all"
            >
              {suggestion.slice(0, 30)}...
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[11px]">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Results List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4">
        {videos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center justify-center text-3xl mb-4">
              {mode === 'text-to-image' ? '🎨' : '🎬'}
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">No Generations Yet</p>
            <p className="text-[10px] text-gray-600 max-w-[200px]">
              {mode === 'text-to-image'
                ? 'Describe an image above and click Generate.'
                : 'Describe a scene above and click Generate to create an AI video.'}
            </p>
          </div>
        )}

        {videos.map((video) => (
          <div
            key={video.id}
            className={`rounded-lg border overflow-hidden transition-all ${video.status === 'completed'
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : video.status === 'failed'
                ? 'border-red-500/20 bg-red-500/5'
                : 'border-slate-200 dark:border-slate-800 bg-black/30'
              }`}
          >
            {/* Completed: Video player or Image */}
            {video.status === 'completed' && video.mode === 'text-to-image' && video.imageUrl && (
              <div className="relative">
                <img
                  src={video.imageUrl}
                  alt={video.prompt}
                  className="w-full rounded-t-lg object-contain"
                  style={{ maxHeight: '250px' }}
                />
              </div>
            )}
            {video.status === 'completed' && video.mode !== 'text-to-image' && video.videoUrl && (
              <div className="relative">
                <video
                  src={video.videoUrl}
                  controls
                  className="w-full rounded-t-lg"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}

            {/* Processing indicator */}
            {(['queued', 'processing', 'throttled'] as string[]).includes(video.status) && (
              <div className="h-32 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-400 rounded-full animate-spin" />
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {video.status === 'queued'
                    ? 'In Queue...'
                    : video.status === 'throttled'
                      ? 'Rate Limited — Waiting...'
                      : `Generating${video.progress ? ` ${video.progress}%` : '...'}`}
                </p>
                {video.provider === 'runwayml' && video.taskId && (
                  <button
                    onClick={() => cancelTask(video)}
                    className="px-2 py-0.5 text-[9px] text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {/* Failed indicator */}
            {video.status === 'failed' && (
              <div className="h-24 flex items-center justify-center">
                <p className="text-[11px] text-red-400">❌ {video.error || 'Generation failed'}</p>
              </div>
            )}

            {/* Info bar */}
            <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800/30">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{video.prompt}</p>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-600">
                    {new Date(video.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 bg-white dark:bg-slate-800/50 rounded text-gray-600">
                    {video.provider === 'runwayml' ? 'RunwayML' : 'fal.ai'}
                    {video.model ? ` · ${video.model}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {video.status === 'completed' && (video.videoUrl || video.imageUrl) && (
                    <button
                      onClick={() => downloadMedia(
                        (video.mode === 'text-to-image' ? video.imageUrl : video.videoUrl)!,
                        video.prompt.slice(0, 20).replace(/\s+/g, '-'),
                        video.mode === 'text-to-image'
                      )}
                      className="px-2 py-0.5 text-[9px] text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 rounded transition-colors"
                    >
                      ⬇ Download
                    </button>
                  )}
                  <button
                    onClick={() => removeVideo(video.id)}
                    className="px-2 py-0.5 text-[9px] text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800/30">
        <p className="text-[9px] text-gray-600 text-center">
          {provider === 'runwayml'
            ? 'Powered by RunwayML · 8 credits per generation · Results may take 30-120s'
            : 'Powered by fal.ai · 5 credits per generation · Results may take 30-60s'}
        </p>
      </div>
    </div>
  );
};

export default VideoPanel;
