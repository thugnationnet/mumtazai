import React, { useState, useEffect } from 'react';

export interface PreviewContent {
  type: 'html' | 'video' | 'image' | 'table' | 'logs' | 'json' | 'markdown' | 'url' | 'empty';
  title?: string;
  subtitle?: string;
  icon?: string;
  html?: string;
  src?: string;
  data?: any;
  actions?: { label: string; onClick: () => void; color?: string }[];
}

// Panel metadata: icon, title, subtitle, color for the awaiting-input state
const PANEL_META: Record<string, { icon: string; title: string; subtitle: string; color: string }> = {
  templates:          { icon: '📋', title: 'CODE_TEMPLATES',         subtitle: 'Select a template to preview it here',                  color: 'cyan' },
  deploy:             { icon: '🚀', title: 'DEPLOY_CENTER',          subtitle: 'Deploy results and live URLs will appear here',         color: 'orange' },
  credentials:        { icon: '🔑', title: 'DEPLOY_CREDENTIALS',     subtitle: 'Credential status and verification results here',      color: 'violet' },
  video:              { icon: '🎬', title: 'VIDEO_GENERATION',       subtitle: 'Generated videos and images will play here',           color: 'pink' },
  ai:                 { icon: '🧠', title: 'AI_CODE_ANALYSIS',       subtitle: 'Analysis results and insights will display here',      color: 'amber' },
  project:            { icon: '📁', title: 'PROJECT_MANAGER',        subtitle: 'Select a project to preview and manage it',            color: 'teal' },
  build:              { icon: '🔨', title: 'BUILD_OUTPUT',            subtitle: 'Build logs and results will stream here',              color: 'indigo' },
  database:           { icon: '🗄️', title: 'DATABASE_VIEWER',        subtitle: 'Query results and table data will display here',       color: 'lime' },
  assets:             { icon: '📦', title: 'ASSET_VIEWER',            subtitle: 'Preview uploaded images, files and assets',            color: 'rose' },
  collaboration:      { icon: '👥', title: 'COLLABORATION_HUB',      subtitle: 'Team activity and shared work appears here',           color: 'orange' },
  'code-tools':       { icon: '🛠️', title: 'CODE_TOOLS_OUTPUT',      subtitle: 'Run a tool to see formatted results here',            color: 'emerald' },
  'backend-tools':    { icon: '⚙️', title: 'BACKEND_TOOLS_OUTPUT',   subtitle: 'Scaffold and backend results render here',            color: 'indigo' },
  communication:      { icon: '📡', title: 'COMMUNICATION_OUTPUT',   subtitle: 'Email, SMS and notification results here',            color: 'blue' },
  docker:             { icon: '🐳', title: 'DOCKER_DEPLOY_OUTPUT',   subtitle: 'Container logs and deployment status here',           color: 'sky' },
  'video-processing': { icon: '🎞️', title: 'VIDEO_PROCESSING',      subtitle: 'Processed video output and previews here',            color: 'pink' },
  'canvas-tools':     { icon: '🎨', title: 'CANVAS_WORKSPACE',       subtitle: 'Workspace output and generated scaffolds here',       color: 'teal' },
  'image-tools':      { icon: '🖼️', title: 'IMAGE_TOOLS_OUTPUT',    subtitle: 'Generated and processed images display here',         color: 'violet' },
  'dev-tools':        { icon: '🔧', title: 'DEV_TOOLS_OUTPUT',       subtitle: 'Git, env and dev tool results here',                  color: 'orange' },
  'document-parsing': { icon: '📄', title: 'DOCUMENT_PARSER',        subtitle: 'Parsed document content and extracted data here',     color: 'red' },
  'api-tools':        { icon: '🔌', title: 'API_TOOLS_OUTPUT',       subtitle: 'API responses and test results here',                 color: 'indigo' },
  'web-tools':        { icon: '🌐', title: 'WEB_TOOLS_OUTPUT',       subtitle: 'Search results and web data here',                    color: 'cyan' },
  security:           { icon: '🔒', title: 'SECURITY_OUTPUT',         subtitle: 'Scan results and security analysis here',             color: 'rose' },
  'content-markdown': { icon: '📝', title: 'CONTENT_OUTPUT',          subtitle: 'Rendered markdown and content preview here',          color: 'amber' },
};

const COLOR_MAP: Record<string, string> = {
  cyan: 'text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-cyan-500/5',
  orange: 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  violet: 'text-violet-400 border-violet-500/30 bg-violet-500/5',
  pink: 'text-pink-400 border-pink-500/30 bg-pink-500/5',
  amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  teal: 'text-teal-400 border-teal-500/30 bg-teal-500/5',
  indigo: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5',
  lime: 'text-lime-400 border-lime-500/30 bg-lime-500/5',
  rose: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
  emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  blue: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  sky: 'text-sky-400 border-sky-500/30 bg-sky-500/5',
  red: 'text-red-400 border-red-500/30 bg-red-500/5',
};

const TITLE_COLOR: Record<string, string> = {
  cyan: 'text-indigo-600 dark:text-indigo-400',
  orange: 'text-orange-400',
  violet: 'text-violet-400',
  pink: 'text-pink-400',
  amber: 'text-amber-400',
  teal: 'text-teal-400',
  indigo: 'text-indigo-400',
  lime: 'text-lime-400',
  rose: 'text-rose-400',
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  sky: 'text-sky-400',
  red: 'text-red-400',
};

interface PanelPreviewProps {
  activePanel: string | null;
  previewContent: PreviewContent | null;
}

const PanelPreview: React.FC<PanelPreviewProps> = ({ activePanel, previewContent }) => {
  const meta = activePanel ? PANEL_META[activePanel] : null;
  const colorClass = meta ? (COLOR_MAP[meta.color] || COLOR_MAP.cyan) : COLOR_MAP.cyan;
  const titleColor = meta ? (TITLE_COLOR[meta.color] || TITLE_COLOR.cyan) : TITLE_COLOR.cyan;

  // Preview error bridge: listen for runtime errors from iframe
  const [previewErrors, setPreviewErrors] = useState<Array<{ message: string; line?: number; timestamp: number }>>([]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'preview-error' && e.data?.error) {
        setPreviewErrors(prev => [...prev.slice(-19), {
          message: String(e.data.error.message || 'Unknown error'),
          line: e.data.error.line,
          timestamp: Date.now(),
        }]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Clear errors when content changes
  useEffect(() => { setPreviewErrors([]); }, [previewContent]);

  // Render actual content if provided
  if (previewContent && previewContent.type !== 'empty') {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-[#0a0a0a] overflow-hidden">
        {/* Content header */}
        {previewContent.title && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-400 dark:bg-black/60 border-b border-slate-200 dark:border-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              {previewContent.icon && <span className="text-lg">{previewContent.icon}</span>}
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${titleColor}`}>
                  {previewContent.title}
                </span>
                {previewContent.subtitle && (
                  <p className="text-[9px] text-gray-600">{previewContent.subtitle}</p>
                )}
              </div>
            </div>
            {previewContent.actions && (
              <div className="flex gap-2">
                {previewContent.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={action.onClick}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider border ${
                      action.color === 'primary'
                        ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-cyan-500/30'
                        : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white hover:border-gray-600'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-auto relative" style={{ minHeight: 0 }}>
          {previewContent.type === 'html' && previewContent.html && (
            <iframe
              srcDoc={previewContent.html}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Panel Preview"
            />
          )}

          {/* Runtime error overlay */}
          {previewErrors.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 max-h-32 overflow-auto bg-red-950/95 border-t border-red-500/40 px-3 py-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Runtime Errors ({previewErrors.length})</span>
                <button onClick={() => setPreviewErrors([])} className="text-[9px] text-red-500 hover:text-red-300">Clear</button>
              </div>
              {previewErrors.map((err, i) => (
                <div key={i} className="text-[10px] text-red-300 font-mono truncate">
                  {err.line ? `L${err.line}: ` : ''}{err.message}
                </div>
              ))}
            </div>
          )}

          {previewContent.type === 'video' && previewContent.src && (
            <div className="w-full h-full flex items-center justify-center bg-black p-4">
              <video
                src={previewContent.src}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              />
            </div>
          )}

          {previewContent.type === 'image' && previewContent.src && (
            <div className="w-full h-full flex items-center justify-center bg-slate-400 dark:bg-black/50 p-4">
              <img
                src={previewContent.src}
                alt={previewContent.title || 'Preview'}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          )}

          {previewContent.type === 'url' && previewContent.src && (
            <iframe
              src={previewContent.src}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title="Live Preview"
            />
          )}

          {previewContent.type === 'logs' && previewContent.data && (
            <div className="p-4 font-mono text-xs space-y-1">
              {(previewContent.data as string[]).map((line, i) => (
                <div key={i} className={`${
                  line.includes('✅') || line.includes('success') ? 'text-emerald-400' :
                  line.includes('❌') || line.includes('error') ? 'text-red-400' :
                  line.includes('⚠️') || line.includes('warning') ? 'text-yellow-400' :
                  'text-slate-500 dark:text-slate-400'
                }`}>{line}</div>
              ))}
            </div>
          )}

          {previewContent.type === 'json' && previewContent.data && (
            <pre className="p-4 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
              {typeof previewContent.data === 'string' ? previewContent.data : JSON.stringify(previewContent.data, null, 2)}
            </pre>
          )}

          {previewContent.type === 'table' && previewContent.data && (
            <div className="p-4 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    {previewContent.data.columns?.map((col: string, i: number) => (
                      <th key={i} className="px-3 py-2 text-left text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewContent.data.rows?.map((row: any[], ri: number) => (
                    <tr key={ri} className="border-b border-slate-200 dark:border-slate-800/50 hover:bg-white dark:bg-slate-800/30">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-slate-500 dark:text-slate-400">{String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {previewContent.type === 'markdown' && previewContent.data && (
            <div className="p-6 prose prose-invert prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: previewContent.data }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: show awaiting-input state per panel
  if (meta) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 ${colorClass}`}>
          <span className="text-3xl">{meta.icon}</span>
        </div>
        <p className={`text-sm font-bold tracking-widest uppercase mb-2 ${titleColor}`}>
          {meta.title}
        </p>
        <p className="text-xs text-gray-600 text-center max-w-xs px-4">
          {meta.subtitle}
        </p>
      </div>
    );
  }

  // Fallback: generic awaiting input
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a]">
      <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400/60 tracking-widest uppercase mb-2">
        PREVIEW_AWAITING_INPUT
      </p>
      <p className="text-xs text-gray-600 text-center max-w-xs">
        Describe your application and initiate generation
      </p>
    </div>
  );
};

export { PANEL_META };
export default PanelPreview;
