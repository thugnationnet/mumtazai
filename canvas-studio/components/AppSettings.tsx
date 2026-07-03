/**
 * AppSettings — App-wide settings panel
 * Sections: Editor, Preview, AI, General
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Type,
  Palette,
  Keyboard,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Monitor,
  Eye,
  Cpu,
  Layout,
  Terminal,
  Code,
} from 'lucide-react';
import Modal, { ModalButton } from './shared/Modal';
import { useEditorSettingsStore, EditorSettings } from '../stores/editorStore';

interface AppSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  bottomPanelOpen?: boolean;
  onToggleTerminal?: () => void;
}

type SettingsTab = 'editor' | 'preview' | 'general';

const Toggle: React.FC<{ label: string; description: string; value: boolean; onChange: (v: boolean) => void }> = ({
  label, description, value, onChange,
}) => (
  <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
    <div>
      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{label}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
    </div>
    <button onClick={() => onChange(!value)} className="transition-colors">
      {value ? (
        <ToggleRight className="w-7 h-7 text-violet-400" />
      ) : (
        <ToggleLeft className="w-7 h-7 text-slate-600" />
      )}
    </button>
  </div>
);

const AppSettingsPanel: React.FC<AppSettingsProps> = ({
  isOpen,
  onClose,
  bottomPanelOpen = false,
  onToggleTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('editor');
  const settings = useEditorSettingsStore((s) => s.settings);
  const updateSettings = useEditorSettingsStore((s) => s.updateSettings);
  const resetSettings = useEditorSettingsStore((s) => s.resetSettings);

  const tabs: { id: SettingsTab; label: string; icon: React.FC<any> }[] = [
    { id: 'editor', label: 'Editor', icon: Code },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'general', label: 'General', icon: Layout },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      subtitle="Customize your workspace"
      icon={<Settings className="w-5 h-5" />}
      size="lg"
      footer={
        <>
          <ModalButton variant="ghost" onClick={resetSettings}>
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </ModalButton>
          <ModalButton variant="primary" onClick={onClose}>Done</ModalButton>
        </>
      }
    >
      {/* Tab Bar */}
      <div className="flex gap-1 mb-5 bg-slate-50 dark:bg-white/[0.02] p-1 rounded-lg border border-white/[0.04]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/[0.04]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
        {/* ──────────── EDITOR TAB ──────────── */}
        {activeTab === 'editor' && (
          <>
            {/* Typography */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Type className="w-3.5 h-3.5" /> Typography
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 dark:text-slate-300">Font Size</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateSettings({ fontSize: Math.max(10, settings.fontSize - 1) })}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all text-xs font-bold"
                    >
                      −
                    </button>
                    <span className="text-xs text-slate-900 dark:text-white font-mono w-8 text-center">{settings.fontSize}</span>
                    <button
                      onClick={() => updateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 dark:text-slate-300">Tab Size</span>
                  <div className="flex items-center gap-1">
                    {[2, 4, 8].map((size) => (
                      <button
                        key={size}
                        onClick={() => updateSettings({ tabSize: size })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          settings.tabSize === size
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 border border-slate-200 dark:border-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 dark:text-slate-300">Word Wrap</span>
                  <div className="flex items-center gap-1">
                    {['on', 'off'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateSettings({ wordWrap: mode as 'on' | 'off' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                          settings.wordWrap === mode
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 border border-slate-200 dark:border-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Display */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" /> Display
              </h3>
              <div>
                <Toggle
                  label="Minimap"
                  description="Show code overview on the right side"
                  value={settings.minimap}
                  onChange={(v) => updateSettings({ minimap: v })}
                />
                <Toggle
                  label="Bracket Pair Colorization"
                  description="Color-code matching brackets"
                  value={settings.bracketPairColorization}
                  onChange={(v) => updateSettings({ bracketPairColorization: v })}
                />
                <Toggle
                  label="Line Numbers"
                  description="Show line numbers in the gutter"
                  value={settings.lineNumbers === 'on'}
                  onChange={(v) => updateSettings({ lineNumbers: v ? 'on' : 'off' })}
                />
              </div>
            </div>

            {/* Behavior */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5" /> Behavior
              </h3>
              <div>
                <Toggle
                  label="Auto Save"
                  description="Automatically save changes after a delay"
                  value={settings.autoSave}
                  onChange={(v) => updateSettings({ autoSave: v })}
                />
                <Toggle
                  label="Format on Save"
                  description="Format code when saving"
                  value={settings.formatOnSave}
                  onChange={(v) => updateSettings({ formatOnSave: v })}
                />
              </div>
            </div>
          </>
        )}

        {/* ──────────── PREVIEW TAB ──────────── */}
        {activeTab === 'preview' && (
          <>
            <div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" /> Preview Behavior
              </h3>
              <div>
                <Toggle
                  label="Auto Refresh"
                  description="Refresh preview automatically when code changes"
                  value={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Show Console on Error"
                  description="Automatically open console panel when errors occur"
                  value={false}
                  onChange={() => {}}
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" /> Terminal
              </h3>
              <div>
                <Toggle
                  label="Terminal Panel"
                  description="Show the integrated terminal panel"
                  value={bottomPanelOpen}
                  onChange={() => onToggleTerminal?.()}
                />
              </div>
            </div>
          </>
        )}

        {/* ──────────── GENERAL TAB ──────────── */}
        {activeTab === 'general' && (
          <>
            <div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" /> AI Preferences
              </h3>
              <div className="space-y-3">
                <Toggle
                  label="Auto-apply Code"
                  description="Automatically apply AI-generated code changes"
                  value={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Show AI Suggestions"
                  description="Display inline AI code suggestions"
                  value={true}
                  onChange={() => {}}
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Layout className="w-3.5 h-3.5" /> Interface
              </h3>
              <div>
                <Toggle
                  label="Smooth Animations"
                  description="Enable UI transition animations"
                  value={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Compact Mode"
                  description="Reduce spacing for more content density"
                  value={false}
                  onChange={() => {}}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Version</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Canvas Studio v2.0</p>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">Built with ❤️ by One Last AI</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AppSettingsPanel;
