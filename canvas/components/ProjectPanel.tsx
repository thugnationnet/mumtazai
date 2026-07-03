import React, { useState, useEffect } from 'react';
import { fetchWithCredentials } from '../fetchUtil';
import { PreviewContent } from './PanelPreview';

interface ProjectPanelProps {
  onClose?: () => void;
  onPreviewContent?: (content: PreviewContent) => void;
}

const ProjectPanel: React.FC<ProjectPanelProps> = ({ onClose, onPreviewContent }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetchWithCredentials('/api/project/list?sourceApp=canvas', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
    setLoading(false);
  };

  const selectProject = (p: any) => {
    setSelectedId(p.id);
    if (!onPreviewContent) return;

    const lastUpdated = p.updatedAt
      ? new Date(p.updatedAt).toLocaleString()
      : p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Unknown';
    const deployedUrl = p.deployedUrl || p.url || null;
    const language = p.language || p.framework || 'html';
    const fileCount = p.fileCount ?? p.files?.length ?? '—';
    const status = p.status || 'active';

    const statusColor = status === 'active' ? '#10b981' : status === 'building' ? '#f59e0b' : '#6b7280';

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #e5e7eb; font-family: system-ui, sans-serif; padding: 32px; }
  .card { background: #111; border: 1px solid #1f2937; border-radius: 16px; padding: 28px; max-width: 600px; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
  .icon { width: 56px; height: 56px; border-radius: 12px; background: linear-gradient(135deg, #0e7490, #7c3aed); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  h1 { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  .desc { font-size: 13px; color: #6b7280; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .stat { background: #0d0d0d; border: 1px solid #1f2937; border-radius: 10px; padding: 14px; }
  .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #4b5563; margin-bottom: 6px; }
  .stat-value { font-size: 16px; font-weight: 700; color: #e5e7eb; }
  .stat-value.lang { color: #22d3ee; }
  .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .actions { display: flex; gap: 10px; }
  .btn { flex: 1; padding: 12px; border-radius: 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: none; cursor: pointer; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .btn-primary { background: linear-gradient(135deg, #0e7490, #7c3aed); color: #fff; }
  .btn-secondary { background: #1f2937; color: #9ca3af; }
  .btn:hover { opacity: 0.85; }
  .url-box { background: #0d0d0d; border: 1px solid #1f2937; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: #22d3ee; font-family: monospace; word-break: break-all; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="icon">📁</div>
    <div>
      <h1>${p.name || 'Untitled Project'}</h1>
      <div class="desc">${p.description || 'No description provided'}</div>
    </div>
  </div>
  ${deployedUrl ? `<div class="url-box">🌐 ${deployedUrl}</div>` : ''}
  <div class="grid">
    <div class="stat">
      <div class="stat-label">Language</div>
      <div class="stat-value lang">${language}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Status</div>
      <div class="stat-value"><span style="color:${statusColor}">⬤</span> ${status}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Files</div>
      <div class="stat-value">${fileCount}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Last Updated</div>
      <div class="stat-value" style="font-size:12px">${lastUpdated}</div>
    </div>
  </div>
  <div class="actions">
    ${deployedUrl ? `<a href="${deployedUrl}" target="_blank" class="btn btn-primary">🚀 Open Live App</a>` : ''}
    <div class="btn btn-secondary">📂 Load into Editor</div>
  </div>
</div>
</body>
</html>`;

    onPreviewContent({
      type: 'html',
      title: 'PROJECT_DETAILS',
      subtitle: p.name,
      icon: '📁',
      html,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111]/95">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xs font-bold text-teal-400/80 uppercase tracking-widest">Project Manager</h3>
          <p className="text-[10px] text-gray-600 mt-0.5">Click a project to preview</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadProjects}
            className="p-1.5 rounded text-gray-600 hover:text-teal-400 transition-colors"
            title="Refresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded text-gray-600 hover:text-slate-900 dark:hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* New project toggle */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="w-full py-2 bg-teal-600/20 border border-teal-500/30 text-teal-400 hover:bg-teal-600/30 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all"
          >
            + New Project
          </button>
        ) : (
          <div className="space-y-2 p-3 bg-black/30 border border-teal-500/30 rounded-lg">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Project name"
              className="w-full bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-3 py-2 focus:border-teal-500/50 focus:outline-none"
              autoFocus
            />
            <input
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-3 py-2 focus:border-teal-500/50 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!newName.trim()) return;
                  try {
                    await fetchWithCredentials('/api/project/create', {
                      method: 'POST', credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim(), sourceApp: 'canvas' }),
                    });
                    setNewName(''); setNewDesc(''); setCreating(false);
                    loadProjects();
                  } catch { /* ignore */ }
                }}
                disabled={!newName.trim()}
                className="flex-1 py-1.5 bg-teal-600 disabled:opacity-40 text-slate-900 dark:text-white text-[10px] font-bold rounded uppercase tracking-wider"
              >
                Create
              </button>
              <button onClick={() => { setCreating(false); setNewName(''); setNewDesc(''); }} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-2xl mb-2">📁</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">No projects yet</p>
          </div>
        ) : (
          projects.map((p: any) => (
            <button
              key={p.id}
              onClick={() => selectProject(p)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedId === p.id
                  ? 'bg-teal-500/10 border-teal-500/40'
                  : 'bg-black/30 border-slate-200 dark:border-slate-800 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">📁</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 truncate">{p.description || p.language || 'No description'}</p>
                  {p.deployedUrl && (
                    <p className="text-[10px] text-teal-400/70 mt-0.5 truncate">🌐 {p.deployedUrl}</p>
                  )}
                </div>
                {selectedId === p.id && (
                  <span className="text-teal-400 text-xs shrink-0">●</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectPanel;
