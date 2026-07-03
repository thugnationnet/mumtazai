'use client';

import { useState, useEffect } from 'react';
import {
  CodeBracketIcon,
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
import CanvasMode from './universal-canvas/CanvasMode';
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
}: EnhancedChatLayoutProps) {
  // Use theme from context
  const { theme, toggleTheme, themeContainerRef } = useChatTheme();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeLeftPanel, setActiveLeftPanel] = useState<
    'sessions' | 'settings'
  >('sessions');
  const [isMobileCanvasOpen, setIsMobileCanvasOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    } else {
      setActiveLeftPanel('settings');
      if (!isSidebarOpen) {
        setIsSidebarOpen(true);
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
            className="absolute inset-0 bg-slate-400 dark:bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
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
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
                    ? 'bg-brand-50 text-brand-600'
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
                className={`absolute top-[44px] right-2 z-50 rounded-xl shadow-xl border p-2 flex flex-col space-y-1 transition-all bg-white/95 border-neural-100 backdrop-blur-xl`}
              >
                {/* Canvas */}
                <button
                  onClick={() => {
                    setIsMobileCanvasOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-brand-50 ring-1 ring-neural-200"
                  title="Canvas"
                >
                  <CodeBracketIcon className="w-5 h-5 text-brand-600" />
                </button>

                {/* External Link */}
                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-brand-50 ring-1 ring-neural-200"
                    title="External"
                  >
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-neural-500" />
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
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-sm shadow-purple-500/20'
                        : 'hover:bg-brand-50 ring-1 ring-neural-200'
                    }`}
                    title={
                      theme === 'neural'
                        ? 'Switch to Light Mode'
                        : 'Switch to Dark Mode'
                    }
                  >
                    {theme === 'neural' ? (
                      <MoonIcon className="w-5 h-5 text-slate-900 dark:text-white" />
                    ) : (
                      <SunIcon className="w-5 h-5 text-neural-500" />
                    )}
                  </button>
                )}

                {/* Settings */}
                <button
                  onClick={() => {
                    handleSettingsToggle();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-brand-50 ring-1 ring-neural-200"
                  title="Settings"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-neural-500" />
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
                onToggleCollapse={() =>
                  setIsSidebarCollapsed(!isSidebarCollapsed)
                }
                theme={theme}
              />
            ) : (
              <ChatSettingsPanel
                isOpen={true}
                onClose={() => setActiveLeftPanel('sessions')}
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
      <div className="absolute top-0 left-0 w-64 h-64 bg-brand-500/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/3 rounded-full blur-3xl pointer-events-none" />

      {/* Mobile Canvas Mode */}
      <CanvasMode
        isOpen={isMobileCanvasOpen}
        onClose={() => setIsMobileCanvasOpen(false)}
        theme={theme}
        agentId={agentId}
        agentName={agentName}
      />
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
