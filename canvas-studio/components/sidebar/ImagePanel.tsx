/**
 * ImagePanel — AI-powered image tools sidebar panel
 *
 * Tabs:
 *   Transform  — resize, crop, rotate, flip
 *   Filter     — blur, sharpen, grayscale, sepia, vintage, etc.
 *   Background — remove / blur background
 *   Compose    — text overlay, watermark
 *   AI         — describe, OCR, classify, Q&A
 *   Analyze    — metadata, dominant colors, stats
 *
 * Talks to /api/canvas-images/:projectId/* backend routes.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Wand2,
  Layers,
  Search,
  ScanLine,
  Scissors,
  Sliders,
  Type,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────

interface ImagePanelProps {
  projectId: string;
  className?: string;
}

type ToolTab = 'transform' | 'filter' | 'background' | 'compose' | 'ai' | 'analyze';

const TABS: { id: ToolTab; label: string; icon: React.ReactNode }[] = [
  { id: 'transform', label: 'Transform', icon: <Scissors className="w-3 h-3" /> },
  { id: 'filter', label: 'Filter', icon: <Sliders className="w-3 h-3" /> },
  { id: 'background', label: 'BG', icon: <Layers className="w-3 h-3" /> },
  { id: 'compose', label: 'Compose', icon: <Type className="w-3 h-3" /> },
  { id: 'ai', label: 'AI', icon: <Wand2 className="w-3 h-3" /> },
  { id: 'analyze', label: 'Analyze', icon: <Search className="w-3 h-3" /> },
];

const FILTERS = ['blur', 'sharpen', 'grayscale', 'sepia', 'vintage', 'emboss', 'negate', 'normalize', 'clahe', 'threshold'] as const;

// ── Helpers ──────────────────────────────────────────────────────

async function callImageAPI(projectId: string, endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/canvas-images/${projectId}/${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Image processing failed');
  return data;
}

// ── Result display ───────────────────────────────────────────────

const ResultBlock: React.FC<{ result: Record<string, unknown> | null; loading: boolean; error: string | null }> = ({ result, loading, error }) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 p-3 text-xs text-slate-600 dark:text-slate-400">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…
    </div>
  );
  if (error) return (
    <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20">
      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
      <span className="text-xs text-red-300">{error}</span>
    </div>
  );
  if (!result) return null;

  const outputUrl = (result.url || result.outputUrl) as string | undefined;
  const text = (result.text || result.description || result.content) as string | undefined;
  const metadata = (result.metadata || result.data) as Record<string, unknown> | undefined;

  return (
    <div className="space-y-2">
      {outputUrl && (
        <div className="space-y-1.5">
          <img src={outputUrl} alt="result" className="w-full rounded-md max-h-48 object-contain bg-slate-50 dark:bg-white/[0.02]" />
          <div className="flex gap-1">
            <button
              onClick={() => copy(outputUrl)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20 transition-all"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
            <a
              href={outputUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] hover:bg-white/[0.07] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-white/[0.06] transition-all"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
      {text && (
        <div className="rounded-md bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] p-2.5">
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>
          <button onClick={() => copy(text)} className="mt-1.5 text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
            {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />} Copy text
          </button>
        </div>
      )}
      {metadata && !outputUrl && !text && (
        <div className="rounded-md bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] p-2.5 space-y-1">
          {Object.entries(metadata).slice(0, 15).map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px]">
              <span className="text-slate-500">{k}</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── URL input ────────────────────────────────────────────────────

const UrlInput: React.FC<{ value: string; onChange: (v: string) => void; label?: string }> = ({ value, onChange, label = 'Image URL' }) => (
  <div>
    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
    <input
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="https://… or data:image/…"
      className="w-full px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
    />
  </div>
);

// ── Main Component ───────────────────────────────────────────────

const ImagePanel: React.FC<ImagePanelProps> = ({ projectId, className = '' }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('transform');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Transform params
  const [transformOp, setTransformOp] = useState('resize');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [angle, setAngle] = useState('90');
  const [flipDir, setFlipDir] = useState('horizontal');

  // Filter params
  const [filterName, setFilterName] = useState<typeof FILTERS[number]>('blur');
  const [filterIntensity, setFilterIntensity] = useState('1');

  // Background params
  const [bgOp, setBgOp] = useState('blur');
  const [bgSigma, setBgSigma] = useState('10');

  // Compose params
  const [composeOp, setComposeOp] = useState('text_overlay');
  const [overlayText, setOverlayText] = useState('');
  const [overlayUrl, setOverlayUrl] = useState('');
  const [gravity, setGravity] = useState('center');

  // AI params
  const [aiOp, setAiOp] = useState('describe');
  const [aiQuestion, setAiQuestion] = useState('');

  // Reset result when tab or URL changes
  useEffect(() => { setResult(null); setError(null); }, [activeTab, url]);

  const run = useCallback(async () => {
    if (!url.trim()) { setError('Please enter an image URL'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let data: Record<string, unknown>;

      switch (activeTab) {
        case 'transform':
          data = await callImageAPI(projectId, 'transform', {
            url, operation: transformOp,
            ...(transformOp === 'resize' && { width: Number(width) || undefined, height: Number(height) || undefined }),
            ...(transformOp === 'rotate' && { angle: Number(angle) }),
            ...(transformOp === 'flip' && { direction: flipDir }),
          });
          break;
        case 'filter':
          data = await callImageAPI(projectId, 'filter', { url, filter: filterName, intensity: Number(filterIntensity) });
          break;
        case 'background':
          data = await callImageAPI(projectId, 'background', { url, operation: bgOp, sigma: Number(bgSigma) });
          break;
        case 'compose':
          data = await callImageAPI(projectId, 'compose', {
            url, operation: composeOp,
            ...(composeOp === 'text_overlay' && { text: overlayText, gravity }),
            ...(composeOp === 'watermark' && { overlayUrl, gravity }),
          });
          break;
        case 'ai':
          data = await callImageAPI(projectId, 'ai', { url, operation: aiOp, question: aiQuestion || undefined });
          break;
        case 'analyze':
          data = await callImageAPI(projectId, 'analyze', { url, operation: 'metadata' });
          break;
        default:
          return;
      }
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, url, transformOp, width, height, angle, flipDir, filterName, filterIntensity, bgOp, bgSigma, composeOp, overlayText, overlayUrl, gravity, aiOp, aiQuestion, projectId]);

  return (
    <div className={`flex flex-col h-full text-slate-800 dark:text-slate-200 ${className}`}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-2 shrink-0">
        <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Image Tools</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/[0.06] shrink-0 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === t.id
                ? 'text-violet-300 border-b-2 border-violet-500'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* URL shared across all tabs */}
        <UrlInput value={url} onChange={setUrl} />

        {/* ── Transform ── */}
        {activeTab === 'transform' && (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Operation</label>
              <select
                value={transformOp}
                onChange={(e) => setTransformOp(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50"
              >
                <option value="resize">Resize</option>
                <option value="crop">Crop</option>
                <option value="rotate">Rotate</option>
                <option value="flip">Flip</option>
                <option value="trim">Auto-trim</option>
              </select>
            </div>
            {transformOp === 'resize' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Width px</label>
                  <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="auto"
                    className="w-full px-2 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Height px</label>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="auto"
                    className="w-full px-2 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50" />
                </div>
              </div>
            )}
            {transformOp === 'rotate' && (
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Angle °</label>
                <input type="number" value={angle} onChange={(e) => setAngle(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50" />
              </div>
            )}
            {transformOp === 'flip' && (
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Direction</label>
                <select value={flipDir} onChange={(e) => setFlipDir(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50">
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* ── Filter ── */}
        {activeTab === 'filter' && (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Filter</label>
              <div className="grid grid-cols-2 gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterName(f)}
                    className={`px-2 py-1.5 rounded-md text-xs capitalize transition-all ${
                      filterName === f
                        ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                        : 'bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Intensity / Sigma</label>
              <input type="number" step="0.1" value={filterIntensity} onChange={(e) => setFilterIntensity(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50" />
            </div>
          </div>
        )}

        {/* ── Background ── */}
        {activeTab === 'background' && (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Operation</label>
              <div className="grid grid-cols-3 gap-1">
                {['blur', 'remove', 'replace'].map((op) => (
                  <button
                    key={op}
                    onClick={() => setBgOp(op)}
                    className={`px-2 py-1.5 rounded-md text-xs capitalize transition-all ${
                      bgOp === op
                        ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                        : 'bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>
            {bgOp === 'blur' && (
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Blur strength</label>
                <input type="number" value={bgSigma} onChange={(e) => setBgSigma(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50" />
              </div>
            )}
          </div>
        )}

        {/* ── Compose ── */}
        {activeTab === 'compose' && (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Operation</label>
              <select value={composeOp} onChange={(e) => setComposeOp(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50">
                <option value="text_overlay">Text Overlay</option>
                <option value="watermark">Watermark</option>
                <option value="composite">Composite</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Gravity / Position</label>
              <select value={gravity} onChange={(e) => setGravity(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50">
                {['center', 'north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            {composeOp === 'text_overlay' && (
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Text</label>
                <input type="text" value={overlayText} onChange={(e) => setOverlayText(e.target.value)} placeholder="Your text…"
                  className="w-full px-2 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50" />
              </div>
            )}
            {(composeOp === 'watermark' || composeOp === 'composite') && (
              <UrlInput value={overlayUrl} onChange={setOverlayUrl} label="Overlay image URL" />
            )}
          </div>
        )}

        {/* ── AI ── */}
        {activeTab === 'ai' && (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Operation</label>
              <div className="grid grid-cols-2 gap-1">
                {['describe', 'ocr', 'classify', 'qa', 'analyze'].map((op) => (
                  <button
                    key={op}
                    onClick={() => setAiOp(op)}
                    className={`px-2 py-1.5 rounded-md text-xs capitalize transition-all ${
                      aiOp === op
                        ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                        : 'bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {op === 'ocr' ? 'OCR' : op}
                  </button>
                ))}
              </div>
            </div>
            {aiOp === 'qa' && (
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Question</label>
                <input type="text" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} placeholder="What is in this image?"
                  className="w-full px-2 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50" />
              </div>
            )}
          </div>
        )}

        {/* ── Analyze ── */}
        {activeTab === 'analyze' && (
          <p className="text-xs text-slate-500">Extracts metadata, dimensions, dominant colors, file size, format, and EXIF data from any image URL.</p>
        )}

        {/* Run button */}
        <button
          onClick={run}
          disabled={loading || !url.trim()}
          className="w-full py-2 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-900 dark:text-white transition-all flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          {loading ? 'Processing…' : 'Run'}
        </button>

        {/* Result */}
        <ResultBlock result={result} loading={false} error={error} />
      </div>
    </div>
  );
};

export default ImagePanel;
