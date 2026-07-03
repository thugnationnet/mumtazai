import React, { useState, useEffect, useCallback } from 'react';
import { fetchWithCredentials } from '../fetchUtil';
import type { CollaborationReturn, Collaborator as LiveCollaborator } from '../hooks/useCollaboration';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'offline' | 'away' | 'pending' | 'accepted';
  color: string;
  cursor?: { file: string; line: number; column: number };
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'editor' | 'viewer';
  invitedAt?: string;
}

interface Props {
  onClose?: () => void;
  projectSlug?: string;
  onPreviewContent?: (c: any) => void;
  collaboration?: CollaborationReturn;
  authUser?: { id?: string; email?: string; name?: string } | null;
}

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#fbbf24', '#f87171', '#38bdf8', '#c084fc', '#4ade80'];

const CollaborationPanel: React.FC<Props> = ({ onClose, projectSlug, onPreviewContent, collaboration, authUser }) => {
  const [dbCollaborators, setDbCollaborators] = useState<Collaborator[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [shareLink, setShareLink] = useState('');
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'pending' | 'settings'>('members');

  // Merge live WebSocket collaborators with DB collaborators
  const liveCollaborators = collaboration?.collaborators || [];
  const liveIds = new Set(liveCollaborators.map(c => c.id));

  // Build final collaborator list: DB data enriched with live presence
  const mergedCollaborators: Collaborator[] = dbCollaborators.map(c => {
    const isLive = liveIds.has(c.id);
    const liveData = liveCollaborators.find(lc => lc.id === c.id);
    return {
      ...c,
      status: isLive ? 'online' : c.status === 'pending' ? 'pending' : 'offline',
      cursor: liveData?.cursor,
      color: liveData?.color || c.color,
    };
  });

  // Add live collaborators that aren't in DB yet (currently connected guests)
  liveCollaborators.forEach((lc, i) => {
    if (!mergedCollaborators.find(mc => mc.id === lc.id)) {
      mergedCollaborators.push({
        id: lc.id,
        name: lc.name,
        email: '',
        role: 'viewer',
        status: 'online',
        color: lc.color || COLORS[i % COLORS.length],
        cursor: lc.cursor,
      });
    }
  });

  const onlineCount = mergedCollaborators.filter(c => c.status === 'online').length;
  const totalMembers = mergedCollaborators.filter(c => c.status !== 'pending').length;

  // Load collaborators from backend
  const loadCollaborators = useCallback(async () => {
    if (!projectSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithCredentials(`/api/workspace/projects/${projectSlug}/collaborators`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      if (data?.success) {
        const list: Collaborator[] = [];
        const pending: PendingInvite[] = [];

        if (data.owner) {
          list.push({
            id: data.owner.id || 'owner',
            name: data.owner.name || (authUser?.name || authUser?.email?.split('@')[0] || 'You'),
            email: data.owner.email || authUser?.email || '',
            role: 'owner',
            status: 'online',
            color: COLORS[0],
          });
        } else if (authUser) {
          // If no owner data from API, use authenticated user
          list.push({
            id: authUser.id || 'self',
            name: authUser.name || authUser.email?.split('@')[0] || 'You',
            email: authUser.email || '',
            role: 'owner',
            status: 'online',
            color: COLORS[0],
          });
        }

        if (data.collaborators) {
          data.collaborators.forEach((c: any, i: number) => {
            if (c.status === 'pending') {
              pending.push({ id: c.id, email: c.email, role: c.role, invitedAt: c.invitedAt || c.createdAt });
            } else {
              list.push({
                id: c.userId || c.id,
                name: c.user?.name || c.email.split('@')[0],
                email: c.email,
                role: c.role,
                status: 'offline',
                color: COLORS[(i + 1) % COLORS.length],
              });
            }
          });
        }

        setDbCollaborators(list);
        setPendingInvites(pending);
      }
    } catch {
      // If API fails, show at least the current user
      if (authUser) {
        setDbCollaborators([{
          id: authUser.id || 'self',
          name: authUser.name || authUser.email?.split('@')[0] || 'You',
          email: authUser.email || '',
          role: 'owner',
          status: 'online',
          color: COLORS[0],
        }]);
      }
    } finally {
      setLoading(false);
    }
  }, [projectSlug, authUser]);

  useEffect(() => { loadCollaborators(); }, [loadCollaborators]);

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteError('Please enter a valid email address');
      return;
    }
    if (!projectSlug) {
      setInviteError('No project selected');
      return;
    }

    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await fetchWithCredentials(`/api/workspace/projects/${projectSlug}/collaborators`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();

      if (data.success && data.collaborator) {
        setPendingInvites(prev => [...prev, {
          id: data.collaborator.id,
          email: data.collaborator.email || inviteEmail.trim(),
          role: data.collaborator.role || inviteRole,
        }]);
        setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}`);
        setInviteEmail('');
        setTimeout(() => setInviteSuccess(''), 3000);
      } else {
        setInviteError(data.error || 'Failed to send invitation');
      }
    } catch {
      setInviteError('Network error — please try again');
    }
  };

  const cancelInvite = async (inviteId: string) => {
    if (projectSlug) {
      try {
        await fetchWithCredentials(`/api/workspace/projects/${projectSlug}/collaborators/${inviteId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch { /* continue anyway */ }
    }
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
  };

  const generateLink = async () => {
    if (!projectSlug) return;
    try {
      const res = await fetchWithCredentials(`/api/workspace/projects/${projectSlug}/share-link`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && (data.shareLink || data.url)) {
        const link = data.shareLink || data.url;
        setShareLink(link);
        await navigator.clipboard.writeText(link);
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 2000);
      }
    } catch {
      // Silently fail
    }
  };

  const removeCollaborator = async (collabId: string) => {
    if (!projectSlug) return;
    try {
      await fetchWithCredentials(`/api/workspace/projects/${projectSlug}/collaborators/${collabId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setDbCollaborators(prev => prev.filter(c => c.id !== collabId));
    } catch { /* continue */ }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 bg-[#0f0f0f]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Collaboration</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {projectSlug ? (
                <>
                  <span className="text-slate-500 dark:text-slate-400">{totalMembers}</span> member{totalMembers !== 1 ? 's' : ''} · <span className="text-emerald-400">{onlineCount} online</span>
                </>
              ) : (
                'Select a project to collaborate'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
            collaboration?.isConnected
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/30 text-gray-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${collaboration?.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
            {collaboration?.isConnected ? 'Connected' : 'Offline'}
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:bg-slate-800/50 rounded-lg transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* No project state */}
      {!projectSlug && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No Project Selected</h3>
            <p className="text-[11px] text-gray-600 leading-relaxed">Open or create a project to start collaborating with your team in real time.</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Loading collaboration data…</span>
          </div>
        </div>
      )}

      {/* Main content */}
      {projectSlug && !loading && (
        <>
          {/* Action bar */}
          <div className="px-8 py-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/40">
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-slate-900 dark:text-white text-[11px] font-bold rounded-lg uppercase tracking-widest transition-all shadow-lg shadow-orange-900/20 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Invite Member
            </button>
            <button
              onClick={generateLink}
              className="px-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-gray-600 text-[11px] font-bold rounded-lg uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {shareLinkCopied ? '✓ Copied!' : 'Share Link'}
            </button>
            <button
              onClick={loadCollaborators}
              className="px-3 py-2.5 bg-white dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700/30 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-gray-600 rounded-lg transition-all"
              title="Refresh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Tabs */}
            <div className="ml-auto flex items-center bg-white dark:bg-slate-800/40 rounded-lg p-0.5">
              {(['members', 'pending', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    activeTab === tab
                      ? 'bg-slate-200 dark:bg-slate-700/60 text-slate-900 dark:text-white'
                      : 'text-gray-500 hover:text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab === 'pending' ? `Pending (${pendingInvites.length})` : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Share link banner */}
          {shareLink && (
            <div className="mx-8 mt-4 p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-lg flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Share Link</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">{shareLink}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => { navigator.clipboard.writeText(shareLink); setShareLinkCopied(true); setTimeout(() => setShareLinkCopied(false), 2000); }}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded transition-all"
                >
                  {shareLinkCopied ? '✓' : 'Copy'}
                </button>
                <button onClick={() => setShareLink('')} className="text-gray-600 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Invite form */}
          {showInvite && (
            <div className="mx-8 mt-4 p-5 bg-white dark:bg-[#111] border border-orange-500/20 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Invite Collaborator</h3>
                <button onClick={() => { setShowInvite(false); setInviteError(''); setInviteSuccess(''); }} className="text-gray-600 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                    onKeyDown={e => e.key === 'Enter' && sendInvite()}
                    placeholder="name@company.com"
                    className="w-full p-3 text-xs border border-slate-200 dark:border-slate-800 bg-slate-400 dark:bg-black/50 text-slate-800 dark:text-slate-200 placeholder:text-gray-700 rounded-lg focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all"
                    autoFocus
                  />
                </div>
                <div className="w-36">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest">Role</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')}
                    className="w-full p-3 text-xs border border-slate-200 dark:border-slate-800 bg-slate-400 dark:bg-black/50 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={sendInvite}
                    disabled={!inviteEmail.trim()}
                    className="px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-slate-900 dark:text-white text-[11px] font-bold rounded-lg uppercase tracking-widest disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 transition-all hover:from-orange-500 hover:to-amber-500"
                  >
                    Send
                  </button>
                </div>
              </div>
              {inviteError && <p className="mt-2 text-[11px] text-red-400">{inviteError}</p>}
              {inviteSuccess && <p className="mt-2 text-[11px] text-emerald-400">{inviteSuccess}</p>}
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-5">
            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Team Members ({totalMembers})
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-medium">{onlineCount} online</span>
                  </div>
                </div>

                {/* Online members first, then offline */}
                {mergedCollaborators
                  .filter(c => c.status !== 'pending')
                  .sort((a, b) => {
                    if (a.status === 'online' && b.status !== 'online') return -1;
                    if (a.status !== 'online' && b.status === 'online') return 1;
                    if (a.role === 'owner') return -1;
                    if (b.role === 'owner') return 1;
                    return 0;
                  })
                  .map(c => (
                    <div key={c.id} className="p-4 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 rounded-xl flex items-center gap-4 hover:border-slate-300 dark:border-slate-700/60 transition-all group">
                      {/* Avatar */}
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ backgroundColor: c.color + '18', color: c.color, border: `1px solid ${c.color}30` }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${
                          c.status === 'online' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                          c.status === 'away' ? 'bg-yellow-500' : 'bg-gray-600'
                        }`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                          {c.id === authUser?.id && (
                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">(you)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.email && <p className="text-[11px] text-gray-500 truncate">{c.email}</p>}
                          {c.cursor && (
                            <span className="text-[9px] text-gray-600 bg-white dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                              {c.cursor.file}:{c.cursor.line}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Role badge */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0 ${
                        c.role === 'owner' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' :
                        c.role === 'editor' ? 'text-indigo-600 dark:text-indigo-400 bg-cyan-400/10 border border-cyan-400/20' :
                        'text-slate-500 dark:text-slate-400 bg-gray-400/10 border border-gray-400/20'
                      }`}>
                        {c.role}
                      </span>

                      {/* Remove button (not for owner or self) */}
                      {c.role !== 'owner' && c.id !== authUser?.id && (
                        <button
                          onClick={() => removeCollaborator(c.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Remove collaborator"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                {mergedCollaborators.filter(c => c.status !== 'pending').length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-xs text-gray-600">No collaborators yet. Invite someone to get started.</p>
                  </div>
                )}
              </div>
            )}

            {/* Pending Tab */}
            {activeTab === 'pending' && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Pending Invitations ({pendingInvites.length})
                </h3>

                {pendingInvites.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800/40 flex items-center justify-center mx-auto mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600">No pending invitations</p>
                  </div>
                ) : (
                  pendingInvites.map(inv => (
                    <div key={inv.id} className="p-4 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 rounded-xl flex items-center justify-between hover:border-slate-300 dark:border-slate-700/60 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{inv.email}</p>
                          <p className="text-[10px] text-gray-600">Invited as <span className="text-orange-400/80">{inv.role}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-yellow-500/60 uppercase tracking-wider bg-yellow-500/10 px-2 py-0.5 rounded">Pending</span>
                        <button
                          onClick={() => cancelInvite(inv.id)}
                          className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Cancel invitation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Real-Time Sync</h3>
                  <div className="p-4 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          collaboration?.isConnected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700/30'
                        }`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${collaboration?.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">WebSocket Connection</p>
                          <p className="text-[10px] text-gray-600">{collaboration?.isConnected ? 'Connected to real-time sync server' : 'Not connected — changes won\'t sync live'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        collaboration?.isConnected ? 'text-emerald-400 bg-emerald-400/10' : 'text-gray-500 bg-white dark:bg-slate-800/40'
                      }`}>
                        {collaboration?.isConnected ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800/40 pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">CRDT Engine</p>
                          <p className="text-[10px] text-gray-600">Yjs-powered conflict-free replicated data types</p>
                        </div>
                        <span className="text-[10px] font-mono text-gray-600 bg-white dark:bg-slate-800/40 px-2 py-0.5 rounded">Yjs v13</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800/40 pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cursor Tracking</p>
                          <p className="text-[10px] text-gray-600">See where collaborators are editing in real time</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase tracking-wider">Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Project Info</h3>
                  <div className="p-4 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Project Slug</p>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">{projectSlug}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CollaborationPanel;
