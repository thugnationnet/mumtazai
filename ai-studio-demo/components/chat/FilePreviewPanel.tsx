'use client';

import { useState, useMemo, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────
export interface FileOperation {
  id: string;
  tool: 'create_file' | 'write_file' | 'modify_file' | 'read_file';
  filename: string;
  path?: string;
  folder?: string;
  content: string;
  language: string;
  success: boolean;
  timestamp: Date;
  /** For modify_file — what type of modification */
  modifyMode?: 'replace' | 'append' | 'prepend' | 'find_replace' | 'insert_at_line';
}

// Extension → language mapping for syntax highlighting label
const EXT_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  py: 'python', rb: 'ruby', rs: 'rust', go: 'go',
  java: 'java', kt: 'kotlin', swift: 'swift', cs: 'csharp',
  cpp: 'c++', c: 'c', h: 'c', hpp: 'c++',
  html: 'html', css: 'css', scss: 'scss', less: 'less',
  json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
  xml: 'xml', svg: 'svg', md: 'markdown', mdx: 'mdx',
  sql: 'sql', sh: 'bash', bash: 'bash', zsh: 'bash',
  dockerfile: 'docker', makefile: 'make',
  txt: 'text', log: 'text', env: 'text', cfg: 'text',
  php: 'php', lua: 'lua', r: 'r', dart: 'dart',
  vue: 'vue', svelte: 'svelte',
};

// File types that can be rendered as live previews
const LIVE_PREVIEW_LANGUAGES = new Set(['html', 'svg']);

export function detectLanguage(filename: string): string {
  const name = filename.toLowerCase();
  // Handle dotfiles and special names
  if (name === 'dockerfile') return 'docker';
  if (name === 'makefile') return 'make';
  if (name.startsWith('.env')) return 'text';
  const ext = name.split('.').pop() || '';
  return EXT_MAP[ext] || 'text';
}

// Tool action label
function toolLabel(tool: FileOperation['tool']): { icon: string; label: string; color: string } {
  switch (tool) {
    case 'create_file': return { icon: '📄', label: 'Created', color: 'text-green-400' };
    case 'write_file': return { icon: '✏️', label: 'Written', color: 'text-blue-400' };
    case 'modify_file': return { icon: '🔧', label: 'Modified', color: 'text-amber-400' };
    case 'read_file': return { icon: '👁️', label: 'Read', color: 'text-cyan-400' };
    default: return { icon: '📁', label: 'File', color: 'text-gray-400' };
  }
}

// ─── Component ───────────────────────────────────────────────────
interface FilePreviewPanelProps {
  fileOp: FileOperation;
  onOpenFile?: (fileOp: FileOperation) => void;
}

export default function FilePreviewPanel({ fileOp, onOpenFile }: FilePreviewPanelProps) {
  const canLivePreview = LIVE_PREVIEW_LANGUAGES.has(fileOp.language);
  const [expanded, setExpanded] = useState(canLivePreview);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'code'>(canLivePreview ? 'live' : 'code');

  const lines = useMemo(() => fileOp.content.split('\n'), [fileOp.content]);
  const lineCount = lines.length;
  const { icon, label, color } = toolLabel(fileOp.tool);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fileOp.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [fileOp.content]);

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([fileOp.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileOp.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [fileOp.content, fileOp.filename]);

  const handleOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenFile?.(fileOp);
  }, [fileOp, onOpenFile]);

  // Open live preview in a new tab
  const handleOpenInNewTab = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([fileOp.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [fileOp.content]);

  return (
    <div className="my-3 rounded-xl border border-neural-200 overflow-hidden shadow-sm bg-[#0d1117]">
      {/* ── Header bar ── */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none bg-[#161b22] border-b border-slate-300 dark:border-white/10 hover:bg-[#1c2129] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm">{icon}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>
            {label}
          </span>
          <span className="text-sm font-mono text-slate-900 dark:text-white/90 truncate" title={fileOp.path || fileOp.filename}>
            {fileOp.filename}
          </span>
          <span className="text-[10px] text-gray-500 flex-shrink-0">
            {fileOp.language} &middot; {lineCount} lines
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
            title="Copy file contents"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          {/* Download */}
          <button
            onClick={handleDownload}
            className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
            title="Download file"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          {/* Open live in new tab — HTML only */}
          {canLivePreview && (
            <button
              onClick={handleOpenInNewTab}
              className="px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20"
              title="Open live in new tab"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Live
            </button>
          )}
          {/* Open in editor */}
          {onOpenFile && (
            <button
              onClick={handleOpen}
              className="px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20"
              title="Open in editor"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded content ── */}
      {expanded && (
        <div>
          {/* Tab bar — Live / Code for HTML files, Preview / Raw for modify */}
          {canLivePreview ? (
            <div className="flex border-b border-slate-300 dark:border-white/10 bg-[#0d1117]">
              <button
                onClick={() => setActiveTab('live')}
                className={`px-4 py-1.5 text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'live'
                    ? 'text-slate-900 dark:text-white border-b-2 border-emerald-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Live Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-1.5 text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'text-slate-900 dark:text-white border-b-2 border-cyan-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Code
              </button>
            </div>
          ) : fileOp.tool === 'modify_file' ? (
            <div className="flex border-b border-slate-300 dark:border-white/10 bg-[#0d1117]">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-1.5 text-[11px] font-medium transition-colors ${
                  activeTab === 'code'
                    ? 'text-slate-900 dark:text-white border-b-2 border-cyan-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('live')}
                className={`px-4 py-1.5 text-[11px] font-medium transition-colors ${
                  activeTab === 'live'
                    ? 'text-slate-900 dark:text-white border-b-2 border-cyan-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Raw
              </button>
            </div>
          ) : null}

          {/* Live preview iframe for HTML/SVG */}
          {canLivePreview && activeTab === 'live' && (
            <div className="relative bg-white rounded-b-none">
              <iframe
                srcDoc={fileOp.content}
                title={`Live preview: ${fileOp.filename}`}
                className="w-full border-0 rounded-none"
                style={{ height: '420px', background: '#fff' }}
                sandbox="allow-scripts allow-same-origin"
              />
              {/* Gradient fade at bottom to hint there's more */}
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none" />
            </div>
          )}

          {/* Code content with line numbers */}
          {(!canLivePreview || activeTab === 'code') && (
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full border-collapse text-sm font-mono leading-relaxed">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="hover:bg-slate-100 dark:hover:bg-white/5">
                      <td className="px-3 py-0 text-right text-gray-600 select-none align-top w-[1%] whitespace-nowrap border-r border-slate-200 dark:border-white/5">
                        {i + 1}
                      </td>
                      <td className="px-3 py-0 text-[#e6edf3] whitespace-pre overflow-x-auto">
                        {line || '\u00A0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer with file info */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-t border-slate-300 dark:border-white/10 text-[10px] text-gray-500">
            <span>{fileOp.path || `/${fileOp.filename}`}</span>
            <span>{(new TextEncoder().encode(fileOp.content).length / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Multi-file panel wrapper ────────────────────────────────────
interface FileOperationsPanelProps {
  fileOps: FileOperation[];
  onOpenFile?: (fileOp: FileOperation) => void;
}

export function FileOperationsPanel({ fileOps, onOpenFile }: FileOperationsPanelProps) {
  if (!fileOps || fileOps.length === 0) return null;

  return (
    <div className="mt-2">
      {fileOps.map((op) => (
        <FilePreviewPanel key={op.id} fileOp={op} onOpenFile={onOpenFile} />
      ))}
    </div>
  );
}
