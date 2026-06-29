'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  MoonIcon,
  SunIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import ChatSessionSidebar from './ChatSessionSidebar';
import ChatSettingsPanel, { AgentSettings } from './ChatSettingsPanel';
import ChatRightPanel from './ChatRightPanel';
import ResearchPanel from './ResearchPanel';
import type { ResearchTab } from './ResearchPanel';
import MapPanel from './MapPanel';
import type { MapTab } from './MapPanel';

import { ThemeProvider, useChatTheme, ChatTheme } from './ThemeContext';

// Re-export for backward compatibility
export { useChatTheme } from './ThemeContext';
export type { ChatTheme } from './ThemeContext';

interface ChatSession {
  id: string;
  name: string;
  lastMessage?: string;
  messageCount?: number;
  updatedAt?: Date;
}

interface EnhancedChatLayoutProps {
  children: React.ReactNode;
  agentId: string;
  agentName: string;
  agentIcon?: string;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newName: string) => void;
  onExportSession?: (id: string) => void;
  settings: AgentSettings;
  onUpdateSettings: (settings: Partial<AgentSettings>) => void;
  onResetSettings: () => void;
  showSidebar?: boolean;
  showThemeToggle?: boolean;
  externalUrl?: string;
  // Research Panel (agent-controlled)
  researchPanelOpen?: boolean;
  researchTabs?: ResearchTab[];
  activeResearchTabId?: string | null;
  onCloseResearchPanel?: () => void;
  onSelectResearchTab?: (id: string) => void;
  onCloseResearchTab?: (id: string) => void;
  // Map Panel (agent-controlled — separate from Research Panel)
  mapPanelOpen?: boolean;
  mapTabs?: MapTab[];
  activeMapTabId?: string | null;
  onCloseMapPanel?: () => void;
  onSelectMapTab?: (id: string) => void;
  onCloseMapTab?: (id: string) => void;
}

// Inner component that uses the theme context
function EnhancedChatLayoutContent({
  children,
  agentId,
  agentName,
  agentIcon = '🤖',
  sessions,
  activeSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onExportSession,
  settings,
  onUpdateSettings,
  onResetSettings,
  showSidebar = true,
  showThemeToggle = true,
  externalUrl,
  researchPanelOpen = false,
  researchTabs = [],
  activeResearchTabId = null,
  onCloseResearchPanel,
  onSelectResearchTab,
  onCloseResearchTab,
  mapPanelOpen = false,
  mapTabs = [],
  activeMapTabId = null,
  onCloseMapPanel,
  onSelectMapTab,
  onCloseMapTab,
}: EnhancedChatLayoutProps) {
  // Use theme from context
  const { theme, toggleTheme, themeContainerRef } = useChatTheme();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeLeftPanel, setActiveLeftPanel] = useState<
    'sessions' | 'settings'
  >('sessions');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persist UI panel state to DB
  const saveUiFlag = (key: string, value: any) => {
    fetch('/api/user/preferences/ui-flags', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => {});
  };

  // Load persisted panel state from DB
  const uiFlagsLoadedRef = useRef(false);
  useEffect(() => {
    if (uiFlagsLoadedRef.current) return;
    uiFlagsLoadedRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/user/preferences', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          const flags = json.data?.uiFlags || {};
          if (typeof flags.chatSidebarCollapsed === 'boolean') setIsSidebarCollapsed(flags.chatSidebarCollapsed);
          if (typeof flags.chatSidebarOpen === 'boolean' && !isMobile) setIsSidebarOpen(flags.chatSidebarOpen);
          if (flags.chatActiveLeftPanel === 'sessions' || flags.chatActiveLeftPanel === 'settings') setActiveLeftPanel(flags.chatActiveLeftPanel);
        }
      } catch { /* keep defaults */ }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle settings toggle - show in left panel
  const handleSettingsToggle = () => {
    if (activeLeftPanel === 'settings') {
      setActiveLeftPanel('sessions');
      saveUiFlag('chatActiveLeftPanel', 'sessions');
    } else {
      setActiveLeftPanel('settings');
      saveUiFlag('chatActiveLeftPanel', 'settings');
      if (!isSidebarOpen) {
        setIsSidebarOpen(true);
        saveUiFlag('chatSidebarOpen', true);
      }
    }
  };

  // Theme-based styles
  const containerBg = 'bg-gray-50';

  return (
    <div
      ref={themeContainerRef}
      className={`h-screen flex flex-col ${containerBg} relative overflow-hidden`}
    >
      {/* Main Content Area - No top header needed, logo is in sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="absolute inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => { setIsSidebarOpen(false); saveUiFlag('chatSidebarOpen', false); }}
          />
        )}

        {/* Mobile Header Bar - Only shown on mobile - Transparent */}
        {isMobile && (
          <>
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-2 py-1.5">
              {/* Left: Logo + Arrow to open sidebar */}
              <div className="flex flex-col items-center">
                <Image
                  src="/images/logos/company-logo.png"
                  alt="OnelastAI"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                {showSidebar && (
                  <button
                    onClick={() => { const next = !isSidebarOpen; setIsSidebarOpen(next); saveUiFlag('chatSidebarOpen', next); }}
                    className="p-1 rounded transition-colors hover:bg-gray-100/50 text-gray-500"
                    title="Toggle sidebar"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Center: Empty */}
              <div className="flex-1" />

              {/* Right: Dropdown arrow */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-1.5 rounded-lg transition-all ${
                  isMobileMenuOpen
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-100/50 text-gray-500'
                }`}
                title="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Mobile Dropdown Menu - Icons only, vertical column */}
            {isMobileMenuOpen && (
              <div
                className={`absolute top-[44px] right-2 z-50 rounded-xl shadow-xl border p-2 flex flex-col space-y-1 transition-all bg-white/95 border-white/80 backdrop-blur-xl`}
              >
                {/* External Link */}
                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-blue-50 ring-1 ring-slate-200"
                    title="External"
                  >
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-slate-400" />
                  </a>
                )}

                {/* Theme Toggle */}
                {showThemeToggle && (
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      theme === 'neural'
                        ? 'bg-gradient-to-r from-violet-500 to-cyan-500 shadow-sm shadow-violet-500/20'
                        : 'hover:bg-blue-50 ring-1 ring-slate-200'
                    }`}
                    title={
                      theme === 'neural'
                        ? 'Switch to Light Mode'
                        : 'Switch to Dark Mode'
                    }
                  >
                    {theme === 'neural' ? (
                      <MoonIcon className="w-5 h-5 text-white" />
                    ) : (
                      <SunIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                )}

                {/* Settings */}
                <button
                  onClick={() => {
                    handleSettingsToggle();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-blue-50 ring-1 ring-slate-200"
                  title="Settings"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            )}

            {/* Click outside to close mobile menu */}
            {isMobileMenuOpen && (
              <div
                className="absolute inset-0 z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
          </>
        )}

        {/* Left Sidebar - Sessions or Settings */}
        {showSidebar && (
          <div
            className={`${
              isMobile
                ? `absolute left-0 top-0 bottom-0 z-50 transform transition-transform duration-300 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                  }`
                : 'relative'
            }`}
          >
            {activeLeftPanel === 'sessions' ? (
              <ChatSessionSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                agentId={agentId}
                agentName={agentName}
                agentIcon={agentIcon}
                onNewChat={onNewSession}
                onSelectSession={(id) => {
                  onSelectSession(id);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                onDeleteSession={onDeleteSession}
                onRenameSession={onRenameSession}
                onExportSession={onExportSession}
                isCollapsed={!isMobile && isSidebarCollapsed}
                onToggleCollapse={() => {
                  const next = !isSidebarCollapsed;
                  setIsSidebarCollapsed(next);
                  saveUiFlag('chatSidebarCollapsed', next);
                }}
                theme={theme}
              />
            ) : (
              <ChatSettingsPanel
                isOpen={true}
                onClose={() => { setActiveLeftPanel('sessions'); saveUiFlag('chatActiveLeftPanel', 'sessions'); }}
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                onResetSettings={onResetSettings}
                agentName={agentName}
                agentId={agentId}
                theme={theme}
                isLeftPanel={true}
              />
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Children (ChatBox) - Add top padding on mobile for header */}
          <div className={`flex-1 overflow-hidden ${isMobile ? 'pt-12' : ''}`}>
            {children}
          </div>
        </div>

        {/* Research Panel — Agent-controlled, slides in from right */}
        {researchPanelOpen && researchTabs.length > 0 && !isMobile && (
          <ResearchPanel
            isOpen={researchPanelOpen}
            tabs={researchTabs}
            activeTabId={activeResearchTabId ?? researchTabs[0]?.id ?? null}
            onClose={onCloseResearchPanel ?? (() => {})}
            onSelectTab={onSelectResearchTab ?? (() => {})}
            onCloseTab={onCloseResearchTab ?? (() => {})}
          />
        )}

        {/* Map Panel — Agent-controlled, slides in from right (separate from Research Panel) */}
        {mapPanelOpen && mapTabs.length > 0 && !isMobile && (
          <MapPanel
            isOpen={mapPanelOpen}
            tabs={mapTabs}
            activeTabId={activeMapTabId ?? mapTabs[0]?.id ?? null}
            onClose={onCloseMapPanel ?? (() => {})}
            onSelectTab={onSelectMapTab ?? (() => {})}
            onCloseTab={onCloseMapTab ?? (() => {})}
          />
        )}

        {/* Right Sidebar Panel - mirrors left panel */}
        <div className="hidden md:block">
          <ChatRightPanel
            theme={theme}
            isDarkMode={theme === 'neural'}
            agentId={agentId}
            agentName={agentName}
            externalUrl={externalUrl}
            onToggleTheme={showThemeToggle ? toggleTheme : undefined}
            onToggleSettings={handleSettingsToggle}
            isSettingsActive={activeLeftPanel === 'settings'}
          />
        </div>
      </div>

      {/* Corner accent effects */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/3 rounded-full blur-3xl pointer-events-none" />


    </div>
  );
}

// Main export that wraps with ThemeProvider
export default function EnhancedChatLayout(props: EnhancedChatLayoutProps) {
  return (
    <ThemeProvider agentId={props.agentId}>
      <EnhancedChatLayoutContent {...props} />
    </ThemeProvider>
  );
}
