'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// ─── Types ───────────────────────────────────────────────────────
export interface ResearchTab {
  id: string;
  url: string;
  title: string;
  content?: string;        // Extracted text content
  htmlContent?: string;    // Raw HTML for iframe preview
  summary?: string;        // Short summary from tool
  toolName: string;        // Which tool produced this (fetch_url, fetch_webpage, web_scrape, web_search)
  timestamp: Date;
  isLoading?: boolean;
}

interface ResearchPanelProps {
  isOpen: boolean;
  tabs: ResearchTab[];
  activeTabId: string | null;
  onClose: () => void;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

// ─── Build preview HTML from text content ────────────────────────
function buildPreviewHtml(title: string, url: string, content: string, toolName: string): string {
  // Escape HTML entities in text content to prevent XSS
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const isSearch = toolName === 'web_search';

  if (isSearch) {
    // For search results, render as a clean results page
    // Content is usually structured text from the search API
    const lines = content.split('\n').filter(l => l.trim());
    const resultsHtml = lines.map(line => {
      const trimmed = line.trim();
      // Detect URL-like lines
      if (/^https?:\/\//.test(trimmed)) {
        return `<a href="${esc(trimmed)}" target="_blank" rel="noopener" style="color:#1a73e8;text-decoration:none;font-size:13px;word-break:break-all;">${esc(trimmed)}</a>`;
      }
      // Detect headers/titles (bold or numbered)
      if (/^\d+\./.test(trimmed) || /^\*\*/.test(trimmed)) {
        const clean = trimmed.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '');
        return `<h3 style="margin:12px 0 4px;font-size:15px;color:#1a0dab;">${esc(clean)}</h3>`;
      }
      return `<p style="margin:2px 0;font-size:13px;color:#4d5156;line-height:1.5;">${esc(trimmed)}</p>`;
    }).join('\n');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:16px;background:#fff;">
<div style="max-width:600px;">
  <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e0e0e0;">
    <div style="font-size:11px;color:#70757a;">🔍 Search results for</div>
    <div style="font-size:15px;color:#202124;font-weight:500;">${esc(url)}</div>
  </div>
  ${resultsHtml}
</div></body></html>`;
  }

  // For fetch_webpage/web_scrape — render extracted text with source attribution
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:16px;background:#fff;">
<div style="max-width:700px;">
  <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e0e0e0;">
    <div style="font-size:11px;color:#70757a;">📄 Content from</div>
    <a href="${esc(url)}" target="_blank" rel="noopener" style="font-size:13px;color:#1a73e8;text-decoration:none;word-break:break-all;">${esc(url)}</a>
  </div>
  <div style="font-size:13px;color:#333;line-height:1.7;white-space:pre-wrap;">${esc(content)}</div>
</div></body></html>`;
}

// ─── Component ───────────────────────────────────────────────────
export default function ResearchPanel({
  isOpen,
  tabs,
  activeTabId,
  onClose,
  onSelectTab,
  onCloseTab,
}: ResearchPanelProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'text'>('preview');
  const [panelWidth, setPanelWidth] = useState(480);
  const isResizing = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Resize handle drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setPanelWidth(Math.max(320, Math.min(newWidth, window.innerWidth * 0.6)));
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isOpen || tabs.length === 0) return null;

  const toolIcon = (name: string) => {
    switch (name) {
      case 'web_search': return '🔍';
      case 'fetch_webpage': return '📄';
      case 'web_scrape': return '🕷️';
      default: return '🌐';
    }
  };

  return (
    <div
      ref={panelRef}
      className="relative flex flex-col border-l border-white/80 bg-white h-full transition-all duration-300"
      style={{ width: panelWidth, minWidth: 320, maxWidth: '60vw' }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-blue-400/40 active:bg-blue-500/50 transition-colors"
        onMouseDown={() => {
          isResizing.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/80 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2">
          <GlobeAltIcon className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-600">Research</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            {tabs.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode('preview')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              viewMode === 'preview'
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100'
            }`}
            title="Web Preview"
          >
            <GlobeAltIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('text')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              viewMode === 'text'
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100'
            }`}
            title="Extracted Text"
          >
            <DocumentTextIcon className="w-4 h-4" />
          </button>
          {/* Open in new tab */}
          {activeTab?.url && /^https?:\/\//.test(activeTab.url) && (
            <a
              href={activeTab.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-500 hover:bg-slate-100 transition-all"
              title="Open in new tab"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </a>
          )}
          {/* Close panel */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Close Research Panel"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      {tabs.length > 1 && (
        <div className="flex border-b border-white/80 bg-slate-50/50 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-white/80 whitespace-nowrap transition-all min-w-0 max-w-[180px] ${
                tab.id === activeTabId
                  ? 'bg-white text-blue-700 border-b-2 border-b-blue-500'
                  : 'text-slate-400 hover:bg-white/80 hover:text-slate-600'
              }`}
            >
              <span className="text-[10px]">{toolIcon(tab.toolName)}</span>
              <span className="truncate">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 ml-auto p-0.5 rounded hover:bg-red-100 transition-all"
                title="Close tab"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* URL bar */}
      {activeTab && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/80 bg-slate-50/30">
          <span className="text-[10px]">{toolIcon(activeTab.toolName)}</span>
          <span className="text-[11px] text-slate-400 truncate flex-1 font-mono">
            {activeTab.url}
          </span>
          {activeTab.isLoading && (
            <ArrowPathIcon className="w-3.5 h-3.5 text-blue-500 animate-spin" />
          )}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab?.isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Agent is fetching content...</p>
            <p className="text-xs text-slate-400 font-mono">{activeTab.url}</p>
          </div>
        ) : viewMode === 'preview' && activeTab ? (
          activeTab.htmlContent ? (
            <iframe
              srcDoc={activeTab.htmlContent}
              title={activeTab.title}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-popups"
              referrerPolicy="no-referrer"
            />
          ) : activeTab.content ? (
            <iframe
              srcDoc={buildPreviewHtml(activeTab.title, activeTab.url, activeTab.content, activeTab.toolName)}
              title={activeTab.title}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-popups"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
              <GlobeAltIcon className="w-10 h-10" />
              <p className="text-sm">No preview available</p>
              <button
                onClick={() => setViewMode('text')}
                className="text-xs text-blue-600 hover:underline"
              >
                Switch to text view
              </button>
            </div>
          )
        ) : activeTab ? (
          <div className="h-full overflow-y-auto p-4">
            {activeTab.summary && (
              <div className="mb-3 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">Summary</p>
                <p className="text-sm text-blue-800">{activeTab.summary}</p>
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-xs text-slate-600 font-mono leading-relaxed bg-slate-50 rounded-lg p-3">
                {activeTab.content || 'No extracted text available.'}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <GlobeAltIcon className="w-10 h-10" />
            <p className="text-sm">No research content yet</p>
            <p className="text-xs">Agent will open content here automatically</p>
          </div>
        )}
      </div>

      {/* Footer status */}
      {activeTab && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/80 bg-slate-50/50">
          <span className="text-[10px] text-slate-400">
            via <span className="font-medium">{activeTab.toolName}</span>
          </span>
          <span className="text-[10px] text-slate-400">
            {new Date(activeTab.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}
