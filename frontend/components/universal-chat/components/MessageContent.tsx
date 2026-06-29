'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ChevronDown, ChevronRight, Copy, Check, ExternalLink, Globe, Image as ImageIcon, Video, Play } from 'lucide-react';

// ─── URL regex: match http(s) URLs in message text ───
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/g;
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?[^\s]*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?[^\s]*)?$/i;
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/i;

// ─── OG Preview data shape ───
interface OGData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
  loading: boolean;
  error: boolean;
}

// ─── Collapsible Code Block ───
function CollapsibleCodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const language = className?.replace(/^language-/, '') || 'plaintext';
  const codeText = String(children).replace(/\n$/, '');

  const isPreviewable = /^(html|htm|css|javascript|js|jsx|tsx|svg|xml)$/i.test(language) ||
    (language === 'plaintext' && codeText.includes('<') && codeText.includes('>'));

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeText]);

  const getPreviewHtml = () => {
    const lang = language.toLowerCase();
    if (lang === 'css') {
      return `<!DOCTYPE html><html><head><style>${codeText}</style></head><body><p>CSS preview</p></body></html>`;
    }
    if (lang === 'javascript' || lang === 'js') {
      return `<!DOCTYPE html><html><head><style>body{background:#111;color:#e5e7eb;font-family:monospace;padding:12px}pre{white-space:pre-wrap}</style></head><body><pre id="out"></pre><script>
const _origLog=console.log;const _out=document.getElementById('out');
console.log=function(){_origLog.apply(console,arguments);_out.textContent+=Array.from(arguments).map(a=>typeof a==='object'?JSON.stringify(a,null,2):String(a)).join(' ')+'\\n';};
try{${codeText}}catch(e){_out.textContent+='Error: '+e.message+'\\n';}</script></body></html>`;
    }
    if (lang === 'svg' || lang === 'xml') {
      return `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111}</style></head><body>${codeText}</body></html>`;
    }
    if (codeText.trim().toLowerCase().startsWith('<!doctype') || codeText.trim().toLowerCase().startsWith('<html')) {
      return codeText;
    }
    return `<!DOCTYPE html><html><head><style>body{background:#111;color:#e5e7eb;font-family:system-ui,sans-serif;padding:12px}</style></head><body>${codeText}</body></html>`;
  };

  return (
    <div className="my-3 rounded-lg border border-gray-700/60 overflow-hidden bg-[#0d0d0d]">
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-[#151515] border-b border-gray-800/50 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">{language}</span>
        </div>
        <div className="flex items-center gap-1">
          {isPreviewable && (
            <button
              onClick={(e) => { e.stopPropagation(); setCollapsed(false); setShowPreview(!showPreview); }}
              className={`p-1 rounded transition-all ${showPreview ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-600 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
              title={showPreview ? 'Show code' : 'Run preview'}
            >
              <Play size={12} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="p-1 rounded text-gray-600 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
            title={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>
      {!collapsed && !showPreview && (
        <pre className="overflow-x-auto p-3 m-0 text-xs leading-relaxed">
          <code className={className}>{children}</code>
        </pre>
      )}
      {!collapsed && showPreview && (
        <div className="relative">
          <iframe
            srcDoc={getPreviewHtml()}
            sandbox="allow-scripts"
            className="w-full border-0 bg-white rounded-b-lg"
            style={{ minHeight: '200px', maxHeight: '500px', height: '300px' }}
            title="Code preview"
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-cyan-400 font-mono">
            LIVE PREVIEW
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Image ───
function CollapsibleImage({ src, alt }: { src?: string; alt?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src) return null;

  return (
    <div className="my-3 rounded-lg border border-gray-700/40 overflow-hidden bg-[#0d0d0d]">
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-[#151515] border-b border-gray-800/50 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          <ImageIcon size={12} className="text-cyan-500/60" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 truncate max-w-[200px]">
            {alt || 'image'}
          </span>
        </div>
        <a href={src} target="_blank" rel="noopener noreferrer" title="Open image" onClick={(e) => e.stopPropagation()} className="p-1 text-gray-600 hover:text-cyan-400 transition-all">
          <ExternalLink size={12} />
        </a>
      </div>
      {!collapsed && (
        <div className="p-2 flex justify-center bg-black/30">
          {!loaded && <div className="h-32 w-full animate-pulse bg-gray-800/40 rounded" />}
          <img
            src={src}
            alt={alt || 'image'}
            className={`max-w-full max-h-[400px] rounded transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
            onLoad={() => setLoaded(true)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Video ───
function CollapsibleVideo({ src, type }: { src: string; type?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="my-3 rounded-lg border border-gray-700/40 overflow-hidden bg-[#0d0d0d]">
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-[#151515] border-b border-gray-800/50 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          <Video size={12} className="text-red-400/60" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">video</span>
        </div>
        <a href={src} target="_blank" rel="noopener noreferrer" title="Open video" onClick={(e) => e.stopPropagation()} className="p-1 text-gray-600 hover:text-cyan-400 transition-all">
          <ExternalLink size={12} />
        </a>
      </div>
      {!collapsed && (
        <div className="p-2 bg-black/30">
          <video controls className="max-w-full max-h-[400px] rounded mx-auto" preload="metadata">
            <source src={src} type={type || 'video/mp4'} />
          </video>
        </div>
      )}
    </div>
  );
}

// ─── YouTube Embed ───
function CollapsibleYouTube({ videoId, url }: { videoId: string; url: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="my-3 rounded-lg border border-gray-700/40 overflow-hidden bg-[#0d0d0d]">
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-[#151515] border-b border-gray-800/50 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          <Play size={12} className="text-red-500/70" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">youtube</span>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" title="Open on YouTube" onClick={(e) => e.stopPropagation()} className="p-1 text-gray-600 hover:text-cyan-400 transition-all">
          <ExternalLink size={12} />
        </a>
      </div>
      {!collapsed && (
        <div className="p-2 bg-black/30">
          <div className="relative w-full pb-[56.25%]">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`}
              className="absolute inset-0 w-full h-full rounded"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── URL Preview Card (Open Graph) ───
function URLPreviewCard({ url }: { url: string }) {
  const [og, setOg] = useState<OGData>({ url, loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (!cancelled) {
          setOg({ ...data, url, loading: false, error: false });
        }
      } catch {
        if (!cancelled) {
          setOg({ url, loading: false, error: true });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  if (og.loading) {
    return (
      <div className="my-2 flex items-center gap-2 px-3 py-2 rounded border border-gray-800/50 bg-[#111] animate-pulse">
        <Globe size={12} className="text-gray-600" />
        <span className="text-[10px] text-gray-600 font-mono truncate">{url}</span>
      </div>
    );
  }

  if (og.error || (!og.title && !og.description && !og.image)) {
    return null; // no OG data — the markdown link is sufficient
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="my-2 flex gap-3 rounded-lg border border-gray-700/40 bg-[#111] hover:bg-[#161616] hover:border-cyan-500/30 transition-all overflow-hidden group/og no-underline"
    >
      {og.image && (
        <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-20 bg-black/40 overflow-hidden">
          <img src={og.image} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover/og:scale-105" />
        </div>
      )}
      <div className="flex-1 min-w-0 py-2 pr-3 flex flex-col justify-center">
        {og.siteName && (
          <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-500/50 mb-0.5">{og.siteName}</span>
        )}
        {og.title && (
          <span className="text-xs text-gray-200 font-medium line-clamp-1 group-hover/og:text-white transition-colors">{og.title}</span>
        )}
        {og.description && (
          <span className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">{og.description}</span>
        )}
      </div>
    </a>
  );
}

// ─── Extract standalone URLs (not already in markdown link syntax) ───
function extractStandaloneUrls(text: string): string[] {
  // Find URLs that are NOT inside markdown link syntax [text](url)
  const urls: string[] = [];
  const mdLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const mdLinkUrls = new Set<string>();

  let m;
  while ((m = mdLinkRegex.exec(text)) !== null) {
    mdLinkUrls.add(m[2]);
  }

  while ((m = URL_REGEX.exec(text)) !== null) {
    const u = m[0];
    if (!mdLinkUrls.has(u) && !IMAGE_EXT.test(u) && !VIDEO_EXT.test(u)) {
      urls.push(u);
    }
  }

  return [...new Set(urls)];
}

// ─── Classify a URL ───
function classifyUrl(url: string): 'image' | 'video' | 'youtube' | 'link' {
  if (IMAGE_EXT.test(url)) return 'image';
  if (VIDEO_EXT.test(url)) return 'video';
  if (YOUTUBE_REGEX.test(url)) return 'youtube';
  return 'link';
}

// ─── Main MessageContent Component ───
interface MessageContentProps {
  text: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ text }) => {
  // Extract standalone URLs for OG preview cards
  const previewUrls = useMemo(() => extractStandaloneUrls(text), [text]);

  // Separate media URLs from regular URLs for OG cards
  const mediaAndLinks = useMemo(() => {
    const media: { type: 'image' | 'video' | 'youtube'; url: string; videoId?: string }[] = [];
    const links: string[] = [];

    for (const url of previewUrls) {
      const type = classifyUrl(url);
      if (type === 'youtube') {
        const match = YOUTUBE_REGEX.exec(url);
        if (match) media.push({ type: 'youtube', url, videoId: match[1] });
      } else if (type === 'image') {
        media.push({ type: 'image', url });
      } else if (type === 'video') {
        media.push({ type: 'video', url });
      } else {
        links.push(url);
      }
    }

    return { media, links };
  }, [previewUrls]);

  return (
    <div className="message-content text-gray-300 text-xs sm:text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Collapsible code blocks
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children, ...props }) {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code className="bg-gray-800/60 text-cyan-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-gray-700/30" {...props}>
                  {children}
                </code>
              );
            }
            return <CollapsibleCodeBlock className={className}>{children}</CollapsibleCodeBlock>;
          },
          // Collapsible images
          img({ src, alt }) {
            return <CollapsibleImage src={src} alt={alt} />;
          },
          // Style links
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 decoration-cyan-500/30 hover:decoration-cyan-400/60 transition-colors">
                {children}
              </a>
            );
          },
          // Table styling
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded border border-gray-700/40">
                <table className="w-full text-xs">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-[#151515] px-3 py-1.5 text-left text-gray-400 font-mono text-[10px] uppercase tracking-wider border-b border-gray-700/40">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-1.5 border-b border-gray-800/30 text-gray-300">{children}</td>;
          },
          // Blockquote
          blockquote({ children }) {
            return <blockquote className="my-2 border-l-2 border-cyan-500/30 pl-3 text-gray-400 italic">{children}</blockquote>;
          },
          // Lists
          ul({ children }) {
            return <ul className="my-1 ml-4 list-disc marker:text-gray-600 space-y-0.5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-1 ml-4 list-decimal marker:text-gray-600 space-y-0.5">{children}</ol>;
          },
          // Headings
          h1({ children }) {
            return <h1 className="text-base font-bold text-gray-100 mt-3 mb-1">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-sm font-bold text-gray-200 mt-3 mb-1">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold text-gray-300 mt-2 mb-1">{children}</h3>;
          },
          // Paragraph
          p({ children }) {
            return <p className="my-1">{children}</p>;
          },
          // Horizontal rule
          hr() {
            return <hr className="my-3 border-gray-800/50" />;
          },
        }}
      >
        {text}
      </ReactMarkdown>

      {/* Inline media embeds for standalone URLs */}
      {mediaAndLinks.media.map((item, i) => {
        if (item.type === 'youtube' && item.videoId) {
          return <CollapsibleYouTube key={`yt-${i}`} videoId={item.videoId} url={item.url} />;
        }
        if (item.type === 'video') {
          return <CollapsibleVideo key={`vid-${i}`} src={item.url} />;
        }
        if (item.type === 'image') {
          return <CollapsibleImage key={`img-${i}`} src={item.url} />;
        }
        return null;
      })}

      {/* URL Preview Cards (Open Graph) */}
      {mediaAndLinks.links.map((url, i) => (
        <URLPreviewCard key={`og-${i}`} url={url} />
      ))}
    </div>
  );
};

export default MessageContent;
