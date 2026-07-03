import React, { useState } from 'react';
import { PreviewContent } from './PanelPreview';

interface BuildLog {
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
}

interface BuildPanelProps {
  onClose?: () => void;
  onPreviewContent?: (content: PreviewContent) => void;
}

const BuildPanel: React.FC<BuildPanelProps> = ({ onClose, onPreviewContent }) => {
  const [status, setStatus] = useState<'idle' | 'building' | 'success' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [minify, setMinify] = useState(true);
  const [sourceMaps, setSourceMaps] = useState(true);
  const [analyzeBundle, setAnalyzeBundle] = useState(false);

  const buildLog = (type: BuildLog['type'], message: string, current: BuildLog[]): BuildLog[] =>
    [...current.slice(-100), { timestamp: new Date().toLocaleTimeString(), type, message }];

  const pushPreview = (currentLogs: BuildLog[], currentStatus: string, currentProgress: number) => {
    if (!onPreviewContent) return;
    const statusColor =
      currentStatus === 'success' ? '#10b981' :
      currentStatus === 'failed'  ? '#ef4444' :
      currentStatus === 'building'? '#f59e0b' : '#6b7280';
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#e5e7eb;font-family:'SF Mono','Fira Code',monospace;padding:24px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
h2{font-size:13px;font-weight:700;color:#818cf8;text-transform:uppercase;letter-spacing:.1em}
.badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;color:${statusColor};border:1px solid ${statusColor}40;background:${statusColor}10}
.pw{height:6px;background:#1f2937;border-radius:4px;overflow:hidden;margin:0 0 16px}
.pb{height:100%;width:${currentProgress}%;background:${currentStatus === 'failed' ? '#ef4444' : '#6366f1'};border-radius:4px}
.log-box{background:#0d0d0d;border:1px solid #1f2937;border-radius:10px;padding:16px}
.line{font-size:11px;line-height:1.7}
.s{color:#10b981}.e{color:#ef4444}.w{color:#f59e0b}.i{color:#6b7280}.ts{color:#374151}
</style>
</head><body>
<div class="header"><h2>🔨 Build Output</h2><span class="badge">${currentStatus.toUpperCase()}${currentProgress > 0 ? ' · ' + currentProgress + '%' : ''}</span></div>
${currentProgress > 0 ? '<div class="pw"><div class="pb"></div></div>' : ''}
<div class="log-box">
${currentLogs.length === 0
  ? '<div class="line i" style="font-style:italic">Waiting for build to start...</div>'
  : currentLogs.map(l => {
      const cls = l.type === 'success' ? 's' : l.type === 'error' ? 'e' : l.type === 'warning' ? 'w' : 'i';
      const icon = l.type === 'success' ? '✅' : l.type === 'error' ? '❌' : l.type === 'warning' ? '⚠️' : 'ℹ️';
      return '<div class="line ' + cls + '"><span class="ts">[' + l.timestamp + ']</span> ' + icon + ' ' + l.message + '</div>';
    }).join('')}
</div>
</body></html>`;
    onPreviewContent({ type: 'html', title: 'BUILD_OUTPUT', icon: '🔨', html });
  };

  const startBuild = async () => {
    setStatus('building');
    setProgress(0);
    setLogs([]);

    const steps = [
      { progress: 10, msg: '📦 Installing dependencies...' },
      { progress: 30, msg: '🔍 Type checking...' },
      { progress: 50, msg: '📝 Compiling TypeScript...' },
      { progress: 70, msg: '🎨 Processing CSS...' },
      { progress: 85, msg: '📦 Bundling assets...' },
      { progress: 95, msg: minify ? '🗜️ Minifying output...' : '📋 Copying assets...' },
      { progress: 100, msg: '✅ Build complete!' },
    ];
    if (analyzeBundle) steps.splice(6, 0, { progress: 97, msg: '📊 Analyzing bundle size...' });

    let curLogs = buildLog('info', '🚀 Starting build process...', []);
    setLogs(curLogs);
    pushPreview(curLogs, 'building', 0);

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 500));
      const type = step.progress === 100 ? 'success' : 'info';
      curLogs = buildLog(type, step.msg, curLogs);
      setLogs(curLogs);
      setProgress(step.progress);
      pushPreview(curLogs, step.progress === 100 ? 'success' : 'building', step.progress);
    }
    setStatus('success');
  };

  const cancelBuild = () => {
    setStatus('idle');
    setProgress(0);
    const updated = buildLog('warning', '⚠️ Build cancelled by user', logs);
    setLogs(updated);
    pushPreview(updated, 'idle', progress);
  };

  const getLogColor = (type: BuildLog['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111]/95">
      <div className="px-6 py-4 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold text-indigo-400/80 uppercase tracking-widest">Build & Orchestration</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-600 hover:text-indigo-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-4">
        <div className="p-4 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</p>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              status === 'building' ? 'text-yellow-400' :
              status === 'success' ? 'text-emerald-400' :
              status === 'failed'  ? 'text-red-400' :
              'text-gray-600'
            }`}>{status}</span>
          </div>
          <div className="w-full h-1.5 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                status === 'success' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' :
                status === 'failed'  ? 'bg-red-500' :
                'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.4)]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress > 0 && <p className="text-[10px] text-gray-600 mt-1">{progress}% complete</p>}
        </div>

        {status === 'building' ? (
          <button onClick={cancelBuild} className="w-full py-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors">
            ⏹ Cancel Build
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={startBuild} className="py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-slate-900 dark:text-white hover:from-indigo-500 hover:to-purple-500 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all">
              ▶ Start Build
            </button>
            <button
              onClick={() => { setLogs([]); if (onPreviewContent) onPreviewContent({ type: 'empty' }); }}
              className="py-2.5 bg-black/30 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-gray-600 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        <div className="p-4 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Options</p>
          <div className="space-y-2.5">
            {[
              { label: 'Minify Output', checked: minify, toggle: () => setMinify(v => !v) },
              { label: 'Source Maps', checked: sourceMaps, toggle: () => setSourceMaps(v => !v) },
              { label: 'Analyze Bundle', checked: analyzeBundle, toggle: () => setAnalyzeBundle(v => !v) },
            ].map(opt => (
              <label key={opt.label} className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:text-slate-200 transition-colors">{opt.label}</span>
                <div onClick={opt.toggle} className={`w-8 h-4 rounded-full transition-colors cursor-pointer flex items-center ${opt.checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform mx-0.5 ${opt.checked ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Recent Logs</p>
          <div className="bg-slate-400 dark:bg-black/50 rounded-lg p-3 min-h-[80px] max-h-[140px] overflow-auto font-mono">
            {logs.length === 0 ? (
              <p className="text-[10px] text-gray-700 italic">Logs stream to preview window →</p>
            ) : (
              <div className="space-y-1">
                {logs.slice(-8).map((log, i) => (
                  <div key={i} className={`text-[10px] ${getLogColor(log.type)}`}>
                    <span className="text-gray-700">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildPanel;
