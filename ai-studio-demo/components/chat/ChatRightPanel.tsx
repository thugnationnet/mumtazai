'use client';

import { useState } from 'react';
import {
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
  MoonIcon,
  SunIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import CanvasMode from './universal-canvas/CanvasMode';

interface ChatRightPanelProps {
  theme?: 'default' | 'neural';
  isDarkMode?: boolean;
  agentId?: string;
  agentName?: string;
  externalUrl?: string;
  onToggleTheme?: () => void;
  onToggleSettings?: () => void;
  isSettingsActive?: boolean;
}

export default function ChatRightPanel({
  theme = 'default',
  isDarkMode = false,
  agentId,
  agentName,
  externalUrl,
  onToggleTheme,
  onToggleSettings,
  isSettingsActive = false,
}: ChatRightPanelProps) {
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);

  const handleOpenCanvas = () => {
    setIsCanvasOpen(true);
  };

  return (
    <>
      {/* Right Sidebar Panel */}
      <div className="w-14 flex-shrink-0 flex flex-col border-l bg-gray-50 border-neural-100 transition-all duration-300">
        {/* Icon buttons container */}
        <div className="flex-1 flex flex-col items-center pt-4 space-y-4">
          {/* Canvas Icon Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleOpenCanvas}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group bg-gradient-to-r from-brand-600 to-accent-600 shadow-sm hover:shadow-md hover:scale-105"
              title="Open Canvas"
            >
              <CodeBracketIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-900 dark:text-white" />
            </button>
            <span className="mt-1 text-[9px] text-neural-400">Canvas</span>
          </div>

          {/* Divider */}
          <div className="w-8 h-px bg-neural-200" />

          {/* External Link */}
          {externalUrl && (
            <div className="flex flex-col items-center">
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group hover:bg-brand-50 ring-1 ring-neural-200 hover:ring-brand-300"
                title="Open in new tab"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-neural-500 group-hover:text-brand-600" />
              </a>
              <span className="mt-1 text-[9px] text-neural-400">External</span>
            </div>
          )}

          {/* Theme Toggle */}
          {onToggleTheme && (
            <div className="flex flex-col items-center">
              <button
                onClick={onToggleTheme}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-sm shadow-purple-500/20'
                    : 'hover:bg-brand-50 ring-1 ring-neural-200 hover:ring-brand-300'
                }`}
                title={
                  isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'
                }
              >
                {isDarkMode ? (
                  <MoonIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-900 dark:text-white" />
                ) : (
                  <SunIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-neural-500 group-hover:text-brand-600" />
                )}
              </button>
              <span className="mt-1 text-[9px] text-neural-400">
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </div>
          )}

          {/* Settings */}
          {onToggleSettings && (
            <div className="flex flex-col items-center">
              <button
                onClick={onToggleSettings}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group ${
                  isSettingsActive
                    ? 'bg-gradient-to-r from-brand-600 to-accent-600 shadow-sm'
                    : 'hover:bg-brand-50 ring-1 ring-neural-200 hover:ring-brand-300'
                }`}
                title="Agent Settings"
              >
                <Cog6ToothIcon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isSettingsActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-neural-500 group-hover:text-brand-600'
                  }`}
                />
              </button>
              <span className="mt-1 text-[9px] text-neural-400">Settings</span>
            </div>
          )}
        </div>

        {/* Bottom indicator */}
        <div className="p-3 flex justify-center">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-brand-600 to-accent-600" />
        </div>
      </div>

      {/* Full Canvas Mode Overlay */}
      <CanvasMode
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        theme={theme}
        agentId={agentId}
        agentName={agentName}
      />
    </>
  );
}
