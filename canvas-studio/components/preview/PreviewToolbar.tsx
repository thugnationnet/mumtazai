/**
 * PreviewToolbar — Language selector, URL bar, view modes, action buttons, settings
 * Compact glassmorphism toolbar with animated selectors
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  ExternalLink,
  Terminal,
  Wifi,
  Maximize2,
  Eye,
  Code,
  Columns,
  ChevronDown,
  Settings,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { Tooltip } from '../shared/Tooltip';

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'desktop' | 'tablet' | 'mobile' | 'code' | 'split';

interface LanguageOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface PreviewToolbarProps {
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  url: string;
  onRefresh: () => void;
  onOpenExternal?: () => void;
  showConsole: boolean;
  onToggleConsole: () => void;
  showNetwork: boolean;
  onToggleNetwork: () => void;
  onFullscreen?: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
  isLoading?: boolean;
  navOpen?: boolean;
  // Language selector
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  languages: LanguageOption[];
  // View modes
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSetEditorMode?: (mode: string) => void;
  // Settings
  onOpenSettings?: () => void;
}

const devices: { type: DeviceType; icon: React.FC<any>; label: string; shortcut: string }[] = [
  { type: 'desktop', icon: Monitor, label: 'Desktop', shortcut: '⌘1' },
  { type: 'tablet', icon: Tablet, label: 'Tablet', shortcut: '⌘2' },
  { type: 'mobile', icon: Smartphone, label: 'Mobile', shortcut: '⌘3' },
];

const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  device,
  onDeviceChange,
  url,
  onRefresh,
  onOpenExternal,
  showConsole,
  onToggleConsole,
  showNetwork,
  onToggleNetwork,
  onFullscreen,
  onCopy,
  onDownload,
  isLoading = false,
  navOpen = false,
  currentLanguage,
  onLanguageChange,
  languages,
  viewMode,
  onViewModeChange,
  onSetEditorMode,
  onOpenSettings,
}) => {
  const [copied, setCopied] = React.useState(false);
  const isPreviewMode = viewMode === 'desktop' || viewMode === 'tablet' || viewMode === 'mobile';
  const currentLang = languages.find((l) => l.id === currentLanguage);

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="sticky top-0 left-0 right-0 h-10 bg-[#111113]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06] flex items-center px-2 gap-1.5 z-[60] shadow-[0_2px_12px_rgba(0,0,0,0.5)] shrink-0"
    >
      {/* Language Indicator (read-only) */}
      <div className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400">
        <span className="text-sm leading-none">{currentLang?.icon || '📄'}</span>
        <span className="hidden lg:inline text-[11px]">{currentLang?.name || 'HTML'}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.06] shrink-0" />

      {/* View Modes */}
      <div className="flex items-center bg-slate-100 dark:bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.04] shrink-0">
        <Tooltip content="Preview">
          <button
            onClick={() => onViewModeChange('desktop')}
            className={`p-1.5 rounded-md transition-all ${isPreviewMode ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content="Code">
          <button
            onClick={() => {
              onViewModeChange('code');
              onSetEditorMode?.('edit');
            }}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'code' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content="Split">
          <button
            onClick={() => {
              onViewModeChange('split');
              onSetEditorMode?.('edit');
            }}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'split' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.06] shrink-0" />

      {/* Device Selector — only show in preview modes */}
      {isPreviewMode && (
        <>
          <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] rounded-lg p-0.5 border border-slate-200 dark:border-white/[0.06] shrink-0">
            {devices.map(({ type, icon: Icon, label, shortcut }) => (
              <Tooltip key={type} content={label} shortcut={shortcut}>
                <button
                  onClick={() => onDeviceChange(type)}
                  className={`relative p-1.5 rounded-md transition-colors ${
                    device === type ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {device === type && (
                    <motion.div
                      layoutId="deviceSelector"
                      className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-violet-500/20 rounded-md border border-violet-500/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="relative z-10 w-3.5 h-3.5" />
                </button>
              </Tooltip>
            ))}
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.06] shrink-0" />
        </>
      )}

      {/* URL Bar — compact */}
      <div className="flex-1 min-w-0">
        <div className="relative group max-w-xs">
          {isLoading && (
            <motion.div
              className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-violet-500 to-violet-500"
              initial={{ width: '0%' }}
              animate={{ width: '80%' }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          )}
          <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-2.5 py-1 gap-1.5 group-hover:border-white/[0.1] transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60 shrink-0" />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono truncate select-all">
              {url}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Tooltip content="Refresh" shortcut="⌘R">
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <motion.div
              animate={isLoading ? { rotate: 360 } : {}}
              transition={isLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </motion.div>
          </button>
        </Tooltip>

        <Tooltip content="Console" shortcut="⌘J">
          <button
            onClick={onToggleConsole}
            className={`p-1.5 transition-colors ${
              showConsole ? 'text-violet-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip content="Network">
          <button
            onClick={onToggleNetwork}
            className={`p-1.5 transition-colors ${
              showNetwork ? 'text-violet-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {onCopy && (
          <Tooltip content={copied ? 'Copied!' : 'Copy Code'}>
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-violet-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
        )}

        {onDownload && (
          <Tooltip content="Download">
            <button
              onClick={onDownload}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}

        {onOpenExternal && (
          <Tooltip content="Open in New Tab">
            <button
              onClick={onOpenExternal}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}

        {onFullscreen && (
          <Tooltip content="Fullscreen">
            <button
              onClick={onFullscreen}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}

        {/* Divider before settings */}
        <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.06] mx-0.5" />

        {/* Settings */}
        {onOpenSettings && (
          <Tooltip content="Settings">
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/[0.06] rounded-md transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default PreviewToolbar;
