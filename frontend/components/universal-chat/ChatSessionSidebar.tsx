'use client';

import { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  MapPinIcon,
  ShareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import {
  MapPinIcon as MapPinSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  ArchiveBoxIcon as ArchiveBoxSolidIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import { FormattedDate } from '@/components/FormattedDateTime';
import { getAgentChatUrl } from '@/lib/agentUrl';

interface ChatSession {
  id: string;
  name: string;
  lastMessage?: string;
  messageCount?: number;
  updatedAt?: Date;
  isPinned?: boolean;
  isArchived?: boolean;
}

interface ChatSessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  agentId: string;
  agentName: string;
  agentIcon?: string;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newName: string) => void;
  onExportSession?: (id: string) => void;
  onArchiveSession?: (id: string) => void;
  onPinSession?: (id: string) => void;
  onShareSession?: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: 'default' | 'neural';
}

export default function ChatSessionSidebar({
  sessions,
  activeSessionId,
  agentId,
  agentName,
  agentIcon = '🤖',
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onExportSession,
  onArchiveSession,
  onPinSession,
  onShareSession,
  isCollapsed = false,
  onToggleCollapse,
  theme = 'default',
}: ChatSessionSidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [localPinned, setLocalPinned] = useState<Set<string>>(new Set());
  const [localArchived, setLocalArchived] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when renaming
  useEffect(() => {
    if (renamingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renamingId]);

  const handleRenameStart = (session: ChatSession) => {
    setRenamingId(session.id);
    setRenameValue(session.name);
    setOpenMenuId(null);
  };

  const handleRenameConfirm = () => {
    if (renamingId && renameValue.trim()) {
      onRenameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameConfirm();
    if (e.key === 'Escape') handleRenameCancel();
  };

  const handleTogglePin = (sessionId: string) => {
    setLocalPinned((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
    if (onPinSession) onPinSession(sessionId);
    setOpenMenuId(null);
  };

  const handleToggleArchive = (sessionId: string) => {
    setLocalArchived((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
    if (onArchiveSession) onArchiveSession(sessionId);
    setOpenMenuId(null);
  };

  const handleShare = (sessionId: string) => {
    if (onShareSession) {
      onShareSession(sessionId);
    } else {
      // Fallback: copy session link to clipboard
      const url = getAgentChatUrl(agentId, { session: sessionId });
      navigator.clipboard.writeText(url).then(() => {
        // brief feedback
      }).catch(() => {});
    }
    setOpenMenuId(null);
  };

  const isSessionPinned = (id: string) => localPinned.has(id);
  const isSessionArchived = (id: string) => localArchived.has(id);

  // Generate initials from agent name (e.g. "Drama Queen" -> "DQ")
  const agentInitials = agentName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── Collapsed state ────────────────────────────────────
  if (isCollapsed) {
    return (
      <div className="w-12 flex-shrink-0 flex flex-col border-r bg-gray-50 border-white/80 transition-all duration-300">
        {/* Company Logo - Collapsed */}
        <div className="p-2 flex justify-center border-b border-white/80">
          <Image
            src="/images/logos/company-logo.png"
            alt="OnelastAI"
            width={24}
            height={24}
            className="object-contain"
          />
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggleCollapse}
          className="p-3 hover:bg-slate-100 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRightIcon className="w-5 h-5 text-slate-400" />
        </button>

        {/* Agent initials */}
        <div
          className="mx-auto w-8 h-8 rounded-lg neu-icon flex items-center justify-center"
          title={agentName}
        >
          <span className="text-[10px] font-bold text-white">
            {agentInitials}
          </span>
        </div>

        {/* Search button */}
        <button
          onClick={() => {
            if (onToggleCollapse) onToggleCollapse();
            setTimeout(() => {
              setIsSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 200);
            }, 300);
          }}
          className="p-3 hover:bg-slate-100 transition-colors"
          title="Search conversations"
        >
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
        </button>

        {/* New chat button */}
        <button
          onClick={onNewChat}
          className="p-3 hover:bg-slate-100 transition-colors"
          title="New chat"
        >
          <PlusIcon className="w-5 h-5 text-blue-500" />
        </button>

        {/* Archive button */}
        <button
          onClick={() => {
            if (onToggleCollapse) onToggleCollapse();
            setTimeout(() => setShowArchived(true), 300);
          }}
          className="p-3 hover:bg-slate-100 transition-colors"
          title="Show archived"
        >
          <ArchiveBoxIcon className="w-5 h-5 text-slate-400" />
        </button>

        {/* Pin filter button */}
        <button
          onClick={() => {
            if (onToggleCollapse) onToggleCollapse();
            setTimeout(() => setShowPinnedOnly(true), 300);
          }}
          className="p-3 hover:bg-slate-100 transition-colors"
          title="Show pinned"
        >
          <MapPinIcon className="w-5 h-5 text-slate-400" />
        </button>

        {/* Session indicators */}
        <div className="flex-1 py-2 space-y-1">
          {sessions.slice(0, 8).map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className="w-full p-2 flex justify-center"
              title={session.name}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  session.id === activeSessionId
                    ? 'bg-blue-500'
                    : 'bg-slate-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Footer - Collapsed */}
        <div className="p-2 border-t border-white/80">
          <div className="text-[9px] text-slate-400 text-center font-medium">
            AI
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 flex flex-col h-full border-r bg-gray-50 border-white/80 transition-all duration-300">
      {/* ── Company Logo Header ─────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image
            src="/images/logos/company-logo.png"
            alt="OnelastAI"
            width={28}
            height={28}
            className="object-contain"
          />
          <p className="text-[11px] text-slate-400">AI Digital Friend</p>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg transition-colors hover:bg-slate-100"
            title="Collapse sidebar"
          >
            <ChevronLeftIcon className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* ── Agent Header ────────────────────────────────── */}
      <div className="flex-shrink-0 p-3 space-y-3">
        {/* Agent info card with action icons */}
        <div className="neu-cta rounded-2xl p-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{agentIcon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">
                {agentName}
              </h3>
              <p className="text-xs text-slate-500">
                {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {/* Action icons row under agent name */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-300">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (!isSearchOpen) {
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  } else {
                    setSearchQuery('');
                  }
                }}
                className={`p-1.5 rounded-lg transition-all ${isSearchOpen ? 'neu-icon text-slate-700' : 'bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700'}`}
                title="Search conversations"
              >
                <MagnifyingGlassIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onNewChat}
                className="p-1.5 rounded-lg bg-white/15 text-white/80 hover:bg-white/25 hover:text-white transition-all"
                title="New conversation"
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`p-1.5 rounded-lg transition-all ${showArchived ? 'neu-icon text-slate-700' : 'bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700'}`}
                title={showArchived ? 'Hide archived' : 'Show archived'}
              >
                {showArchived ? (
                  <ArchiveBoxSolidIcon className="w-3.5 h-3.5" />
                ) : (
                  <ArchiveBoxIcon className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                className={`p-1.5 rounded-lg transition-all ${showPinnedOnly ? 'neu-icon text-slate-700' : 'bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700'}`}
                title={showPinnedOnly ? 'Show all' : 'Show pinned only'}
              >
                {showPinnedOnly ? (
                  <MapPinSolidIcon className="w-3.5 h-3.5" />
                ) : (
                  <MapPinIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar - slides open below card */}
        {isSearchOpen && (
          <div className="glass-card p-2.5">
            <div className="flex items-center rounded-xl px-3 py-2 bg-slate-50 border border-white/80 focus-within:border-blue-300 transition-colors">
              <MagnifyingGlassIcon className="w-4 h-4 mr-2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 rounded hover:bg-slate-100"
                  title="Clear search"
                >
                  <XMarkIcon className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Sessions List ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {(() => {
          // Filter sessions based on search query, pin, and archive state
          let filteredSessions = searchQuery
            ? sessions.filter(
                (s) =>
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.lastMessage
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase())
              )
            : sessions;

          // Filter by archived state
          if (showArchived) {
            filteredSessions = filteredSessions.filter((s) => isSessionArchived(s.id));
          } else {
            filteredSessions = filteredSessions.filter((s) => !isSessionArchived(s.id));
          }

          // Filter pinned only
          if (showPinnedOnly) {
            filteredSessions = filteredSessions.filter((s) => isSessionPinned(s.id));
          }

          // Sort: pinned sessions first
          const pinnedSessions = filteredSessions.filter((s) => isSessionPinned(s.id));
          const unpinnedSessions = filteredSessions.filter((s) => !isSessionPinned(s.id));
          const sortedSessions = [...pinnedSessions, ...unpinnedSessions];

          if (sessions.length === 0) {
            return (
              <div className="text-center py-8 text-slate-400">
                <ChatBubbleLeftIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            );
          }

          if (sortedSessions.length === 0) {
            return (
              <div className="text-center py-8 text-slate-400">
                {showArchived ? (
                  <>
                    <ArchiveBoxIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No archived conversations</p>
                  </>
                ) : showPinnedOnly ? (
                  <>
                    <MapPinIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pinned conversations</p>
                    <p className="text-xs mt-1">Pin a chat from the menu</p>
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No matching conversations</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </>
                )}
              </div>
            );
          }

          return sortedSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isRenaming = renamingId === session.id;
            const isPinned = isSessionPinned(session.id);

            return (
              <div
                key={session.id}
                className={`group rounded-xl border p-3 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'bg-white border-white/80 hover:shadow-sm hover:border-blue-200'
                }`}
                onClick={() => !isRenaming && onSelectSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleRenameConfirm}
                        placeholder="Rename conversation"
                        className="w-full px-2 py-1 rounded-lg text-sm border bg-white border-blue-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          {isPinned && (
                            <MapPinSolidIcon className="w-3 h-3 text-blue-500 flex-shrink-0" title="Pinned" />
                          )}
                          <h4
                            className={`font-medium text-sm truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}
                          >
                            {session.name}
                          </h4>
                        </div>
                        {session.lastMessage && (
                          <p className="text-xs truncate mt-0.5 text-slate-400">
                            {session.lastMessage}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-1.5 text-xs text-slate-400">
                          {session.messageCount !== undefined && (
                            <span>{session.messageCount} messages</span>
                          )}
                          {session.updatedAt && (
                            <span className="flex items-center space-x-1">
                              <ClockIcon className="w-3 h-3" />
                              <FormattedDate date={session.updatedAt} />
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Menu */}
                  {!isRenaming && (
                    <div
                      className="relative ml-2"
                      ref={openMenuId === session.id ? menuRef : null}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === session.id ? null : session.id
                          );
                        }}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
                        title="More options"
                      >
                        <EllipsisVerticalIcon className="w-4 h-4 text-slate-400" />
                      </button>

                      {openMenuId === session.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl shadow-lg border z-50 py-1 bg-white border-white/80">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(session.id);
                            }}
                            className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 hover:bg-slate-50 text-slate-600"
                          >
                            {isPinned ? (
                              <>
                                <MapPinSolidIcon className="w-4 h-4 text-blue-500" />
                                <span>Unpin</span>
                              </>
                            ) : (
                              <>
                                <MapPinIcon className="w-4 h-4" />
                                <span>Pin</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleArchive(session.id);
                            }}
                            className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 hover:bg-slate-50 text-slate-600"
                          >
                            {isSessionArchived(session.id) ? (
                              <>
                                <ArchiveBoxSolidIcon className="w-4 h-4 text-amber-500" />
                                <span>Unarchive</span>
                              </>
                            ) : (
                              <>
                                <ArchiveBoxIcon className="w-4 h-4" />
                                <span>Archive</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(session.id);
                            }}
                            className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 hover:bg-slate-50 text-slate-600"
                          >
                            <ShareIcon className="w-4 h-4" />
                            <span>Share</span>
                          </button>
                          <div className="border-t border-white/80 my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameStart(session);
                            }}
                            className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 hover:bg-slate-50 text-slate-600"
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span>Rename</span>
                          </button>
                          {onExportSession && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onExportSession(session.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 hover:bg-slate-50 text-slate-600"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                              <span>Export</span>
                            </button>
                          )}
                          <div className="border-t border-white/80 my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this conversation?')) {
                                onDeleteSession(session.id);
                              }
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 hover:bg-red-50 text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="p-3 border-t border-white/80">
        <div className="text-xs text-slate-400 text-center flex items-center justify-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span>Powered by Mumtaz AI</span>
        </div>
      </div>
    </div>
  );
}
