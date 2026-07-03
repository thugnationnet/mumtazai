/**
 * GitPanel — Git status, staging, commits, diff viewer
 * Self-contained: fetches from /api/canvas-git/:projectId
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Plus,
  Minus,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  RefreshCw,
  Upload,
  Download,
  Clock,
  X,
  Loader2,
} from 'lucide-react';

type FileStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';

interface GitFile {
  path: string;
  status: FileStatus;
  staged: boolean;
  additions?: number;
  deletions?: number;
}

interface GitCommitEntry {
  id: string;
  message: string;
  author: string;
  date: string;
  hash: string;
}

interface GitPanelProps {
  projectId: string;
  className?: string;
}

const statusConfig: Record<FileStatus, { label: string; color: string; bg: string }> = {
  modified: { label: 'M', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  added: { label: 'A', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  deleted: { label: 'D', color: 'text-red-400', bg: 'bg-red-500/10' },
  renamed: { label: 'R', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  untracked: { label: 'U', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10' },
};

const GitPanel: React.FC<GitPanelProps> = ({
  projectId,
  className = '',
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [showStaged, setShowStaged] = useState(true);
  const [showChanges, setShowChanges] = useState(true);
  const [view, setView] = useState<'changes' | 'history'>('changes');
  const [branch, setBranch] = useState('main');
  const [files, setFiles] = useState<GitFile[]>([]);
  const [commits, setCommits] = useState<GitCommitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(`/api/canvas-git/${projectId}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    return res.json();
  }, [projectId]);

  // Load status + log
  const loadData = useCallback(async () => {
    if (!projectId || projectId === 'default') { setLoading(false); return; }
    setLoading(true);
    try {
      const [statusData, logData] = await Promise.all([
        api('/status'),
        api('/log'),
      ]);
      if (statusData.success) {
        setFiles(statusData.files || []);
        setBranch(statusData.branch || 'main');
      }
      if (logData.success) {
        setCommits(logData.commits || []);
      }
    } catch {}
    finally { setLoading(false); }
  }, [projectId, api]);

  useEffect(() => { loadData(); }, [loadData]);

  // Local staging helpers (client-side only — staging is a UI concept before commit)
  const onStage = (path: string) => setFiles((prev) => prev.map((f) => f.path === path ? { ...f, staged: true } : f));
  const onUnstage = (path: string) => setFiles((prev) => prev.map((f) => f.path === path ? { ...f, staged: false } : f));
  const onStageAll = () => setFiles((prev) => prev.map((f) => ({ ...f, staged: true })));
  const onUnstageAll = () => setFiles((prev) => prev.map((f) => ({ ...f, staged: false })));
  const onDiscard = (path: string) => setFiles((prev) => prev.filter((f) => f.path !== path));

  const staged = useMemo(() => files.filter((f) => f.staged), [files]);
  const unstaged = useMemo(() => files.filter((f) => !f.staged), [files]);

  const handleCommit = async () => {
    if (!commitMessage.trim() || staged.length === 0) return;
    setActionLoading('commit');
    try {
      const data = await api('/commit', {
        method: 'POST',
        body: JSON.stringify({ message: commitMessage.trim(), author: 'You' }),
      });
      if (data.success && data.commit) {
        setCommits((prev) => [
          { id: data.commit.id, message: data.commit.message, author: data.commit.author || 'You', date: data.commit.date, hash: data.commit.hash },
          ...prev,
        ]);
        setFiles((prev) => prev.filter((f) => !f.staged));
        setCommitMessage('');
      }
    } catch {}
    finally { setActionLoading(null); }
  };

  const handlePush = async () => {
    setActionLoading('push');
    try {
      await api('/push', { method: 'POST' });
    } catch {}
    finally { setActionLoading(null); }
  };

  const handlePull = async () => {
    setActionLoading('pull');
    await loadData();
    setActionLoading(null);
  };

  const FileRow: React.FC<{
    file: GitFile;
    onAction: () => void;
    onSecondaryAction?: () => void;
    actionIcon: React.ReactNode;
    secondaryIcon?: React.ReactNode;
  }> = ({ file, onAction, onSecondaryAction, actionIcon, secondaryIcon }) => {
    const config = statusConfig[file.status];
    const fileName = file.path.split('/').pop() || file.path;
    const dirPath = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';

    return (
      <motion.div
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="flex items-center px-3 py-1 hover:bg-white/[0.02] group text-[12px]"
      >
        <FileText className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
        <div className="flex-1 truncate">
          <span className="text-slate-700 dark:text-slate-300">{fileName}</span>
          {dirPath && <span className="text-slate-600 ml-1 text-[10px]">{dirPath}/</span>}
        </div>

        {file.additions !== undefined && (
          <span className="text-violet-400/60 text-[10px] mr-1">+{file.additions}</span>
        )}
        {file.deletions !== undefined && (
          <span className="text-red-400/60 text-[10px] mr-1">-{file.deletions}</span>
        )}

        <span
          className={`w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold ${config.color} ${config.bg} mr-1`}
        >
          {config.label}
        </span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {secondaryIcon && onSecondaryAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSecondaryAction();
              }}
              className="p-0.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              {secondaryIcon}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="p-0.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            {actionIcon}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-[#0a0a0c] ${className}`}>
      {/* Branch header */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-2">
        <GitBranch className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{branch}</span>
        <div className="flex-1" />
        {loading && <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />}
        <button
          onClick={handlePull}
          disabled={actionLoading === 'pull'}
          className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors disabled:opacity-40"
          title="Refresh"
        >
          {actionLoading === 'pull' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        </button>
        <button
          onClick={handlePush}
          disabled={actionLoading === 'push'}
          className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors disabled:opacity-40"
          title="Push"
        >
          {actionLoading === 'push' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        </button>
      </div>

      {/* View toggle */}
      <div className="px-2 py-1 border-b border-slate-200 dark:border-white/[0.06] flex gap-0.5">
        {(['changes', 'history'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 px-2 py-1 rounded text-[11px] font-medium capitalize transition-all ${
              view === v ? 'bg-slate-200 dark:bg-white/[0.06] text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'changes' ? (
        <>
          {/* Commit input */}
          <div className="px-3 py-2 border-b border-slate-200 dark:border-white/[0.06]">
            <div className="relative">
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                rows={2}
                className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 placeholder-gray-600 outline-none resize-none focus:border-violet-500/30 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCommit();
                }}
              />
            </div>
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || staged.length === 0 || actionLoading === 'commit'}
              className="mt-1.5 w-full py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
            >
              {actionLoading === 'commit' ? <Loader2 className="w-3 h-3 inline mr-1 -mt-px animate-spin" /> : <Check className="w-3 h-3 inline mr-1 -mt-px" />}
              Commit ({staged.length} file{staged.length !== 1 ? 's' : ''})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Staged */}
            <div>
              <button
                onClick={() => setShowStaged(!showStaged)}
                className="w-full flex items-center px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                {showStaged ? (
                  <ChevronDown className="w-3 h-3 mr-1" />
                ) : (
                  <ChevronRight className="w-3 h-3 mr-1" />
                )}
                Staged Changes
                <span className="ml-1.5 px-1.5 py-0 rounded-full bg-violet-500/10 text-violet-400 text-[10px]">
                  {staged.length}
                </span>
                <div className="flex-1" />
                {staged.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnstageAll();
                    }}
                    className="p-0.5 hover:text-slate-800 dark:hover:text-slate-200"
                    title="Unstage all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                )}
              </button>
              <AnimatePresence>
                {showStaged &&
                  staged.map((file) => (
                    <FileRow
                      key={file.path}
                      file={file}
                      onAction={() => onUnstage(file.path)}
                      actionIcon={<Minus className="w-3 h-3" />}
                    />
                  ))}
              </AnimatePresence>
            </div>

            {/* Unstaged */}
            <div>
              <button
                onClick={() => setShowChanges(!showChanges)}
                className="w-full flex items-center px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                {showChanges ? (
                  <ChevronDown className="w-3 h-3 mr-1" />
                ) : (
                  <ChevronRight className="w-3 h-3 mr-1" />
                )}
                Changes
                <span className="ml-1.5 px-1.5 py-0 rounded-full bg-amber-500/10 text-amber-400 text-[10px]">
                  {unstaged.length}
                </span>
                <div className="flex-1" />
                <div className="flex items-center gap-0.5">
                  {unstaged.length > 0 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStageAll();
                        }}
                        className="p-0.5 hover:text-slate-800 dark:hover:text-slate-200"
                        title="Stage all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </button>
              <AnimatePresence>
                {showChanges &&
                  unstaged.map((file) => (
                    <FileRow
                      key={file.path}
                      file={file}
                      onAction={() => onStage(file.path)}
                      onSecondaryAction={() => onDiscard(file.path)}
                      actionIcon={<Plus className="w-3 h-3" />}
                      secondaryIcon={<RotateCcw className="w-3 h-3" />}
                    />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        /* History view */
        <div className="flex-1 overflow-y-auto">
          {commits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
              <GitCommit className="w-6 h-6 opacity-40" />
              <span className="text-xs">No commits yet</span>
            </div>
          ) : (
            commits.map((commit, i) => (
              <motion.div
                key={commit.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start px-3 py-2 border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer group"
              >
                <div className="flex flex-col items-center mr-3 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-violet-500 ring-2 ring-violet-500/20" />
                  {i < commits.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-white/[0.06] mt-1" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{commit.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-600">{commit.author}</span>
                    <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {commit.date}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {commit.hash.slice(0, 7)}
                </span>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GitPanel;
