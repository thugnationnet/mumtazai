'use client';

import { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  Cog6ToothIcon,
  SparklesIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CodeBracketIcon,
  ChatBubbleBottomCenterTextIcon,
  CpuChipIcon,
  ArrowPathIcon,
  BeakerIcon,
  SignalIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import type { AIProvider } from '../../app/agents/agent-registry';

export interface AgentSettings {
  temperature: number;
  maxTokens: number;
  mode: 'professional' | 'balanced' | 'creative' | 'fast' | 'coding';
  systemPrompt: string;
  provider: AIProvider;
  model: string;
}

// Preset colors matching tools page gradient style
const PRESET_COLORS: Record<string, string> = {
  educational: 'from-emerald-500 to-teal-500',
  professional: 'from-blue-500 to-indigo-500',
  creative: 'from-purple-500 to-pink-500',
  coding: 'from-cyan-500 to-blue-500',
  conversational: 'from-amber-500 to-orange-500',
  experimental: 'from-rose-500 to-red-500',
};

// Core presets
export const NEURAL_PRESETS = {
  educational: {
    name: 'Educational',
    icon: AcademicCapIcon,
    prompt:
      'You are an educational mentor. Use clear logic, step-by-step explanations, and helpful analogies. Make complex topics accessible.',
    temp: 0.5,
    tokens: 2500,
  },
  professional: {
    name: 'Professional',
    icon: BriefcaseIcon,
    prompt:
      'You are a professional business advisor. Use formal language, precise data, and actionable insights. Be concise and results-oriented.',
    temp: 0.3,
    tokens: 2000,
  },
  creative: {
    name: 'Creative',
    icon: SparklesIcon,
    prompt:
      'You are a creative visionary. Generate imaginative, novel, and thought-provoking responses. Think outside the box and explore unconventional ideas.',
    temp: 1.2,
    tokens: 3000,
  },
  coding: {
    name: 'Coding',
    icon: CodeBracketIcon,
    prompt:
      'You are a senior software engineer. Provide clean, well-documented code with clear explanations. Follow best practices and include error handling.',
    temp: 0.4,
    tokens: 4000,
  },
  conversational: {
    name: 'Casual Chat',
    icon: ChatBubbleBottomCenterTextIcon,
    prompt:
      'You are a friendly conversational partner. Be warm, engaging, and personable. Use casual language and show genuine interest.',
    temp: 0.8,
    tokens: 2000,
  },
  experimental: {
    name: 'Experimental',
    icon: BeakerIcon,
    prompt:
      'You are an experimental AI pushing boundaries. Be bold, unconventional, and exploratory. Challenge assumptions and offer unique perspectives.',
    temp: 1.5,
    tokens: 3500,
  },
};

// Get temperature label
function getTemperatureLabel(temp: number): string {
  if (temp <= 0.3) return 'Precise';
  if (temp <= 0.6) return 'Focused';
  if (temp <= 0.9) return 'Balanced';
  if (temp <= 1.3) return 'Creative';
  return 'Experimental';
}

interface ChatSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AgentSettings;
  onUpdateSettings: (settings: Partial<AgentSettings>) => void;
  onResetSettings: () => void;
  agentName: string;
  agentId?: string;
  theme?: 'default' | 'neural';
  isLeftPanel?: boolean;
}

export default function ChatSettingsPanel({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
  agentName,
  agentId = '',
  theme = 'default',
  isLeftPanel = false,
}: ChatSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [promptReadOnly, setPromptReadOnly] = useState(true);
  const [showEngineState, setShowEngineState] = useState(false);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const applyPreset = (presetKey: string) => {
    const preset = NEURAL_PRESETS[presetKey as keyof typeof NEURAL_PRESETS];
    if (!preset) return;
    setActivePreset(presetKey);
    onUpdateSettings({
      systemPrompt: preset.prompt,
      temperature: preset.temp,
      maxTokens: preset.tokens,
      mode: presetKey as AgentSettings['mode'],
    });
  };

  if (!isOpen) return null;

  // =========================================================================
  // BRAND THEME PANEL — matches /tools page design system
  // Uses brand-*, accent-*, neural-* Tailwind tokens
  // =========================================================================
  const panelContent = (
    <>
      {/* ── AI ENGINE STATUS ──────────────────────────────── */}
      <div className="neu-cta rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl neu-icon flex items-center justify-center">
            <CpuChipIcon className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold truncate">Mumtaz AI</div>
            <div className="text-xs opacity-80">Neural Engine v4</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          <span className="text-xs opacity-90">Connected &bull; Ready</span>
        </div>
      </div>

      {/* ── ENGINE DETAILS (collapsible) ──────────────────── */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setShowEngineState(!showEngineState)}
          className="flex items-center gap-2 w-full px-5 py-3 hover:bg-slate-50 transition-colors"
        >
          <SignalIcon className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-600">
            Engine Details
          </span>
          <div className="flex-1" />
          <span className="text-xs text-slate-400">
            {showEngineState ? '▾' : '▸'}
          </span>
        </button>
        {showEngineState && (
          <div className="px-5 pb-4 space-y-2.5 border-t border-white/80 pt-3">
            {[
              { label: 'Status', value: 'Active', accent: false },
              {
                label: 'Context',
                value: `${(settings.maxTokens / 1000).toFixed(1)}k tokens`,
                accent: false,
              },
              { label: 'Provider', value: 'Mumtaz AI', accent: true },
              {
                label: 'Temperature',
                value: getTemperatureLabel(settings.temperature),
                accent: false,
              },
              { label: 'Streaming', value: 'Enabled', accent: true },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-slate-400">{row.label}</span>
                <span
                  className={`text-sm font-medium ${row.accent ? 'text-blue-600' : 'text-slate-700'}`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SYSTEM PROMPT ─────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-600">
            System Prompt
          </h4>
          <button
            onClick={() => setPromptReadOnly(!promptReadOnly)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors"
          >
            {promptReadOnly ? (
              <EyeSlashIcon className="w-3.5 h-3.5" />
            ) : (
              <EyeIcon className="w-3.5 h-3.5" />
            )}
            <span>{promptReadOnly ? 'Locked' : 'Editing'}</span>
          </button>
        </div>
        <textarea
          value={
            settings.systemPrompt ||
            'You are a friendly AI assistant for Mumtaz AI. Be helpful, conversational, and supportive.'
          }
          onChange={(e) => onUpdateSettings({ systemPrompt: e.target.value })}
          readOnly={promptReadOnly}
          rows={4}
          className={`w-full px-4 py-3 rounded-xl text-sm leading-relaxed resize-none transition-all
            bg-slate-50 border border-white/80 text-slate-600
            ${promptReadOnly ? 'opacity-70 cursor-default' : 'focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-text opacity-100'}
          `}
          placeholder="Custom instructions for the agent..."
        />
      </div>

      {/* ── PRESETS ────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-slate-600 mb-3">Presets</h4>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(NEURAL_PRESETS).map(([key, preset]) => {
            const Icon = preset.icon;
            const isActive = activePreset === key;
            const gradient =
              PRESET_COLORS[key] || 'from-blue-500 to-indigo-500';
            return (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 text-left ${
                  isActive
                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                    : 'border-white/80 bg-white hover:shadow-sm hover:border-blue-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-105'} transition-transform`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span
                  className={`text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-slate-600 group-hover:text-blue-600'} transition-colors`}
                >
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TEMPERATURE ───────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-600">Temperature</h4>
          <span className="text-sm font-bold text-blue-600">
            {settings.temperature.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.temperature}
          onChange={(e) =>
            onUpdateSettings({ temperature: parseFloat(e.target.value) })
          }
          title="Adjust temperature"
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      </div>

      {/* ── MAX TOKENS ────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-600">Max Tokens</h4>
          <span className="text-sm font-bold text-blue-600">
            {settings.maxTokens.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min="256"
          max="8192"
          step="256"
          value={settings.maxTokens}
          onChange={(e) =>
            onUpdateSettings({ maxTokens: parseInt(e.target.value) })
          }
          title="Adjust max tokens"
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>Short</span>
          <span>Standard</span>
          <span>Extended</span>
        </div>
      </div>

      {/* ── RESPONSE STYLE ────────────────────────────────── */}
      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-slate-600 mb-3">
          Response Style
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {(['concise', 'balanced', 'detailed'] as const).map((style) => {
            const isActive =
              (style === 'concise' && settings.maxTokens <= 1500) ||
              (style === 'balanced' &&
                settings.maxTokens > 1500 &&
                settings.maxTokens <= 3000) ||
              (style === 'detailed' && settings.maxTokens > 3000);
            return (
              <button
                key={style}
                onClick={() => {
                  const tokenMap = {
                    concise: 1024,
                    balanced: 2048,
                    detailed: 4096,
                  };
                  onUpdateSettings({ maxTokens: tokenMap[style] });
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-300 shadow-sm'
                    : 'bg-slate-50 text-slate-400 border border-white/80 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                {style}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTEXT & AGENT INFO ──────────────────────────── */}
      <div className="glass-card p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Context Memory</span>
            <div className="text-right">
              <span className="text-sm font-bold text-indigo-600">
                {Math.round(settings.maxTokens / 100)}
              </span>
              <span className="text-xs text-slate-400 ml-1">msgs</span>
            </div>
          </div>
          <div className="border-t border-white/80" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Agent</span>
            <span className="text-sm font-semibold text-slate-700">
              {agentName}
            </span>
          </div>
        </div>
      </div>

      {/* ── RESET ─────────────────────────────────────────── */}
      <button
        onClick={onResetSettings}
        className="w-full py-3 rounded-2xl border-2 border-red-200 bg-red-50 text-red-600
          hover:bg-red-100 hover:border-red-300
          transition-all duration-200 flex items-center justify-center gap-2 group"
      >
        <ArrowPathIcon className="w-4 h-4 group-hover:animate-spin" />
        <span className="text-sm font-semibold">Reset Settings</span>
      </button>
    </>
  );

  // =========================================================================
  // LEFT PANEL MODE
  // =========================================================================
  if (isLeftPanel) {
    return (
      <div className="w-80 flex-shrink-0 flex flex-col h-full bg-gray-50 border-r border-white/80 transition-all duration-300">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0 border-b border-white/80 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl neu-icon flex items-center justify-center">
              <Cog6ToothIcon className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm font-bold text-slate-700">Settings</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-all"
            title="Close"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {panelContent}
        </div>
      </div>
    );
  }

  // =========================================================================
  // FLOATING PANEL MODE
  // =========================================================================
  return (
    <div
      ref={panelRef}
      className="absolute right-4 top-16 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-large border border-white/80 overflow-hidden bg-gray-50"
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-white border-b border-white/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl neu-icon flex items-center justify-center">
            <Cog6ToothIcon className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">Settings</h3>
            <p className="text-xs text-slate-400">{agentName}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-all"
          title="Close settings"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[70vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {panelContent}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/80 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Auto-saved</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-600">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
