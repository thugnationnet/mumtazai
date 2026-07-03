import React, { useState, useEffect } from 'react';
import { fetchWithCredentials } from '../fetchUtil';
import { PreviewContent } from './PanelPreview';

interface Database {
  id: string;
  name: string;
  type: 'sqlite' | 'postgres';
  status: 'active' | 'stopped' | 'error';
  size: string;
  tables: number;
}

interface DatabasePanelProps {
  onClose?: () => void;
  onPreviewContent?: (content: PreviewContent) => void;
}

const DatabasePanel: React.FC<DatabasePanelProps> = ({ onClose, onPreviewContent }) => {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'sqlite' | 'postgres'>('sqlite');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [browsingDb, setBrowsingDb] = useState<string | null>(null);
  const [queryText, setQueryText] = useState("SELECT * FROM sqlite_master WHERE type='table';");
  const [queryRunning, setQueryRunning] = useState(false);

  // Load databases from backend on mount
  useEffect(() => {
    setLoadingList(true);
    fetchWithCredentials('/api/workspace/databases', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.databases) {
          setDatabases(data.databases.map((db: any) => ({
            id: db.id,
            name: db.name,
            type: db.type || 'sqlite',
            status: db.status || 'active',
            size: db.size || '0 KB',
            tables: db.tables || 0,
          })));
        }
      })
      .catch(() => { })
      .finally(() => setLoadingList(false));
  }, []);

  const createDatabase = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetchWithCredentials('/api/workspace/databases', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), type: newType }),
      });
      const data = await res.json();
      if (data.success && data.database) {
        const newDb: Database = {
          id: data.database.id,
          name: data.database.name,
          type: data.database.type || newType,
          status: data.database.status || 'active',
          size: data.database.size || '0 KB',
          tables: data.database.tables || 0,
        };
        setDatabases(prev => [...prev, newDb]);
        if (onPreviewContent) {
          onPreviewContent({
            type: 'html',
            title: 'DATABASE_CREATED',
            icon: '🗄️',
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;padding:32px}.card{background:#111;border:1px solid #1f2937;border-radius:16px;padding:28px;max-width:480px;margin:0 auto}.icon{width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#047857,#0e7490);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:20px}h1{font-size:18px;font-weight:700;color:#10b981;margin-bottom:8px}p{font-size:13px;color:#6b7280;margin-top:4px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}.stat{background:#0d0d0d;border:1px solid #1f2937;border-radius:8px;padding:12px}.sl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#4b5563;margin-bottom:4px}.sv{font-size:14px;font-weight:700;color:#e5e7eb}</style></head><body><div class="card"><div class="icon">✅</div><h1>Database Created</h1><p>Your database <strong style="color:#22d3ee">${newDb.name}</strong> is ready.</p><div class="grid"><div class="stat"><div class="sl">Type</div><div class="sv">${newDb.type.toUpperCase()}</div></div><div class="stat"><div class="sl">Status</div><div class="sv" style="color:#10b981">${newDb.status}</div></div><div class="stat"><div class="sl">Size</div><div class="sv">${newDb.size}</div></div><div class="stat"><div class="sl">Tables</div><div class="sv">${newDb.tables}</div></div></div></div></body></html>`,
          });
        }
      }
    } catch (err) {
      console.error('Create database failed:', err);
    } finally {
      setNewName('');
      setShowCreate(false);
      setLoading(false);
    }
  };

  const deleteDatabase = async (id: string) => {
    try {
      await fetchWithCredentials(`/api/workspace/databases/${id}`, { method: 'DELETE', credentials: 'include' });
    } catch { /* continue removing from state */ }
    setDatabases(prev => prev.filter(db => db.id !== id));
  };

  const openBrowse = (db: Database) => {
    setBrowsingDb(db.id);
    const defaultQuery = db.type === 'postgres'
      ? "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
      : "SELECT * FROM sqlite_master WHERE type='table';";
    setQueryText(defaultQuery);
    if (onPreviewContent) {
      onPreviewContent({
        type: 'html', title: 'DATABASE_VIEWER', icon: '🗄️',
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;padding:32px}.card{background:#111;border:1px solid #1f2937;border-radius:12px;padding:24px;max-width:480px}h2{font-size:13px;font-weight:700;color:#22d3ee;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}p{font-size:12px;color:#6b7280}.hint{margin-top:16px;font-size:11px;color:#374151;background:#0d0d0d;border:1px solid #1f2937;border-radius:6px;padding:10px;font-family:'SF Mono',monospace;white-space:pre}</style></head><body><div class="card"><h2>🗄️ ${db.name}</h2><p>Type a SQL query in the panel and click Run Query.</p><div class="hint">${defaultQuery}</div></div></body></html>`,
      });
    }
  };

  const runQuery = async (db: Database) => {
    if (!queryText.trim()) return;
    setQueryRunning(true);
    if (onPreviewContent) {
      onPreviewContent({
        type: 'html', title: 'DATABASE_VIEWER', icon: '🗄️',
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:'SF Mono',monospace;padding:24px}h2{font-size:12px;font-weight:700;color:#22d3ee;text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px}.running{color:#f59e0b;font-size:13px;margin-top:12px}</style></head><body><h2>🗄️ ${db.name} · Running...</h2><pre style="background:#0d0d0d;border:1px solid #1f2937;border-radius:8px;padding:12px;font-size:11px;color:#6b7280">${queryText}</pre><div class="running">⏳ Executing query...</div></body></html>`,
      });
    }
    try {
      const res = await fetchWithCredentials('/api/workspace/databases/query', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseId: db.id, sql: queryText }),
      });
      const data = await res.json();
      if (onPreviewContent) {
        if (data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
          const cols: string[] = data.columns || Object.keys(data.rows[0]);
          const rowsHtml = data.rows.slice(0, 200).map((row: any) =>
            '<tr>' + cols.map((c: string) => `<td>${row[c] ?? ''}</td>`).join('') + '</tr>'
          ).join('');
          onPreviewContent({
            type: 'html', title: 'DATABASE_VIEWER', icon: '🗄️',
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;padding:20px}.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}h2{font-size:12px;font-weight:700;color:#22d3ee;text-transform:uppercase;letter-spacing:.1em}.meta{font-size:10px;color:#4b5563}.sql-box{background:#0d0d0d;border:1px solid #1f2937;border-radius:6px;padding:10px 12px;margin-bottom:14px;font-size:10px;color:#6b7280;font-family:'SF Mono',monospace;white-space:pre-wrap}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#0d0d0d;color:#22d3ee;font-size:9px;text-transform:uppercase;letter-spacing:.08em;padding:8px 10px;text-align:left;border-bottom:1px solid #1f2937}td{padding:7px 10px;border-bottom:1px solid #111;color:#9ca3af}tr:hover td{background:#111;color:#e5e7eb}</style></head><body><div class="header"><h2>🗄️ ${db.name}</h2><span class="meta">${data.rows.length} row${data.rows.length !== 1 ? 's' : ''} · ${data.executionTime || '< 1ms'}</span></div><div class="sql-box">${queryText}</div><table><thead><tr>${cols.map((c: string) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`,
          });
        } else {
          onPreviewContent({
            type: 'html', title: 'DATABASE_VIEWER', icon: '🗄️',
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;padding:24px}.card{background:#111;border:1px solid #1f2937;border-radius:10px;padding:20px;max-width:480px}h2{font-size:12px;font-weight:700;color:#22d3ee;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px}.sql{background:#0d0d0d;border:1px solid #1f2937;border-radius:6px;padding:10px;font-family:'SF Mono',monospace;font-size:10px;color:#6b7280;white-space:pre-wrap;margin-bottom:12px}.msg{font-size:12px;color:${data.error ? '#ef4444' : '#10b981'}}</style></head><body><div class="card"><h2>🗄️ ${db.name}</h2><div class="sql">${queryText}</div><div class="msg">${data.error ? '❌ ' + data.error : '✅ Query executed. ' + (data.affectedRows != null ? data.affectedRows + ' rows affected.' : 'No rows returned.')}</div></div></body></html>`,
          });
        }
      }
    } catch (err: any) {
      if (onPreviewContent) {
        onPreviewContent({
          type: 'html', title: 'DATABASE_VIEWER', icon: '🗄️',
          html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{background:#0a0a0a;color:#ef4444;font-family:system-ui;padding:24px;font-size:13px}</style></head><body>❌ ${err.message}</body></html>`,
        });
      }
    } finally { setQueryRunning(false); }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111]/95">
      {/* Fixed Header */}
      <div className="px-6 py-4 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold text-cyan-500/80 uppercase tracking-widest">Database Management</h3>
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
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 text-slate-900 dark:text-white hover:from-cyan-500 hover:to-emerald-500 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/20"
          >
            + New Database
          </button>
          <button className="py-2.5 bg-black/30 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-gray-600 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors">
            Import SQL
          </button>
        </div>

        {/* Create Database Form */}
        {showCreate && (
          <div className="p-4 bg-black/30 border border-indigo-500/30 rounded-lg space-y-3">
            <p className="text-[10px] font-bold text-cyan-500/80 uppercase tracking-wider">Create Database</p>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest">Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="my-database"
                className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-400 dark:bg-black/50 text-slate-800 dark:text-slate-200 placeholder:text-gray-700 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-indigo-500/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest">Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as 'sqlite' | 'postgres')}
                className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-400 dark:bg-black/50 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-indigo-500/50 outline-none transition-all"
              >
                <option value="sqlite">SQLite (Embedded)</option>
                <option value="postgres">PostgreSQL</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createDatabase}
                disabled={loading || !newName.trim()}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 text-slate-900 dark:text-white text-[10px] font-bold rounded-lg uppercase tracking-widest disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 transition-all"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-black/30 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-widest hover:border-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Database List */}
        {browsingDb && (
          <div className="p-3 bg-black/30 border border-indigo-500/30 rounded-lg space-y-2">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">SQL Query</p>
            <textarea
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              rows={3}
              className="w-full bg-slate-400 dark:bg-black/50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono rounded-lg px-2 py-1.5 focus:border-indigo-500/50 focus:outline-none resize-none"
            />
            <button
              onClick={() => { const db = databases.find(d => d.id === browsingDb); if (db) runQuery(db); }}
              disabled={queryRunning || !queryText.trim()}
              className="w-full py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-slate-900 dark:text-white text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors"
            >
              {queryRunning ? '⏳ Running...' : '▶ Run Query'}
            </button>
          </div>
        )}

        {/* Database List */}
        {loadingList ? (
          <div className="p-4 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg text-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Loading databases...</p>
          </div>
        ) : databases.length === 0 ? (
          <div className="p-4 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg text-center py-10">
            <p className="text-gray-600 text-xl mb-2">🗄️</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">No databases yet</p>
            <p className="text-[10px] text-gray-700 mt-1">Create one to store your app data</p>
          </div>
        ) : (
          databases.map(db => (
            <div key={db.id} className="p-4 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:border-slate-700 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{db.type === 'postgres' ? '🐘' : '📄'}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{db.name}</p>
                    <p className="text-[10px] text-gray-600">{db.type.toUpperCase()} • {db.tables} tables • {db.size}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${db.status === 'active' ? 'text-emerald-400 bg-emerald-400/10' :
                    db.status === 'stopped' ? 'text-yellow-400 bg-yellow-400/10' :
                      'text-red-400 bg-red-400/10'
                  }`}>
                  {db.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openBrowse(db)} className="flex-1 py-1.5 bg-black/30 border border-slate-200 dark:border-slate-800 text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:border-gray-600 text-[10px] font-bold rounded uppercase tracking-wider transition-colors">
                  Browse
                </button>
                <button className="flex-1 py-1.5 bg-black/30 border border-slate-200 dark:border-slate-800 text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:border-gray-600 text-[10px] font-bold rounded uppercase tracking-wider transition-colors">
                  Backup
                </button>
                <button
                  onClick={() => deleteDatabase(db.id)}
                  className="py-1.5 px-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[10px] font-bold rounded uppercase tracking-wider transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}

        {/* Info */}
        <div className="p-4 bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Supported Engines</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📄</span>
              <span className="text-[10px] text-gray-500">SQLite</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🐘</span>
              <span className="text-[10px] text-gray-500">PostgreSQL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabasePanel;
