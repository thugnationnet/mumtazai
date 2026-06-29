'use client';

import { useState } from 'react';
import {
  LightBulbIcon,
  CodeBracketIcon,
  PencilSquareIcon,
  AcademicCapIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  DocumentTextIcon,
  CalculatorIcon,
  GlobeAltIcon,
  BeakerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MicrophoneIcon,
  PaperClipIcon,
  PhoneIcon,
  StopIcon,
  ChartBarIcon,
  CpuChipIcon,
  ArrowDownTrayIcon,
  CommandLineIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  category: string;
}

interface StreamAnalytics {
  tokenCount: number;
  charCount: number;
  requestActive: boolean;
  toolsUsed: number;
  startTime: number | null;
  elapsedMs: number;
}

interface SessionStats {
  totalRequests: number;
  totalTokens: number;
  totalToolsUsed: number;
  totalMessages: number;
  totalAttachments: number;
  startedAt: number;
  // Upload breakdowns
  imagesUploaded: number;
  docsUploaded: number;
  otherUploaded: number;
  // Agent-generated file breakdowns
  filesGenerated: number;
  imagesGenerated: number;
  codeGenerated: number;
  documentsGenerated: number;
  videosGenerated: number;
  // Tool type breakdown
  toolTypes: Record<string, number>;
}

export interface AutoMemory {
  id: string;
  fact: string;
  category: 'personal' | 'preference' | 'project' | 'topic' | 'style' | 'general';
  createdAt: number;
  sessionId?: string;
}

export interface MemorySettings {
  enabled: boolean;
  userName: string;
  language: string;
  gender: string;
  dateOfBirth: string;
  memories: AutoMemory[];
}

interface QuickActionsPanelProps {
  onSelectAction: (prompt: string) => void;
  theme?: 'default' | 'neural';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onMicToggle?: () => void;
  onFileUpload?: () => void;
  onVoiceCall?: () => void;
  isRecording?: boolean;
  hasSpeechRecognition?: boolean;
  streamAnalytics?: StreamAnalytics;
  activePanel?: 'quick-actions' | 'stats' | 'memory' | 'export' | 'shortcuts' | 'emoji' | null;
  onToggleStats?: () => void;
  onToggleMemory?: () => void;
  onToggleExport?: () => void;
  onToggleShortcuts?: () => void;
  onToggleEmoji?: () => void;
  onExportChat?: (format: 'markdown' | 'json' | 'text') => void;
  onInsertEmoji?: (emoji: string) => void;
  sessionStats?: SessionStats;
  memorySettings?: MemorySettings;
  onMemoryChange?: (settings: MemorySettings) => void;

}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'explain',
    label: 'Explain this',
    icon: <AcademicCapIcon className="w-4 h-4" />,
    prompt: 'Please explain this in simple terms: ',
    category: 'Learning',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: <DocumentTextIcon className="w-4 h-4" />,
    prompt: 'Please summarize the following: ',
    category: 'Learning',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm ideas',
    icon: <LightBulbIcon className="w-4 h-4" />,
    prompt: 'Help me brainstorm ideas for: ',
    category: 'Creative',
  },
  {
    id: 'write',
    label: 'Help me write',
    icon: <PencilSquareIcon className="w-4 h-4" />,
    prompt: 'Help me write: ',
    category: 'Creative',
  },
  {
    id: 'code',
    label: 'Write code',
    icon: <CodeBracketIcon className="w-4 h-4" />,
    prompt: 'Write code for: ',
    category: 'Technical',
  },
  {
    id: 'debug',
    label: 'Debug code',
    icon: <BeakerIcon className="w-4 h-4" />,
    prompt: 'Help me debug this code: ',
    category: 'Technical',
  },
  {
    id: 'translate',
    label: 'Translate',
    icon: <GlobeAltIcon className="w-4 h-4" />,
    prompt: 'Translate the following: ',
    category: 'Utility',
  },
  {
    id: 'calculate',
    label: 'Calculate',
    icon: <CalculatorIcon className="w-4 h-4" />,
    prompt: 'Calculate: ',
    category: 'Utility',
  },
  {
    id: 'chat',
    label: 'Just chat',
    icon: <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />,
    prompt: '',
    category: 'General',
  },
  {
    id: 'creative',
    label: 'Get creative',
    icon: <SparklesIcon className="w-4 h-4" />,
    prompt: 'Create something creative about: ',
    category: 'Creative',
  },
];

function formatElapsed(ms: number): string {
  if (ms < 1000) return '0.0s';
  return (ms / 1000).toFixed(1) + 's';
}

function getStrengthColor(tokens: number): string {
  if (tokens === 0) return 'bg-slate-200';
  if (tokens < 50) return 'bg-blue-400';
  if (tokens < 200) return 'bg-green-500';
  if (tokens < 500) return 'bg-yellow-500';
  return 'bg-orange-500';
}

function getStrengthWidth(tokens: number): number {
  if (tokens === 0) return 0;
  return Math.min((tokens / 600) * 100, 100);
}

export default function QuickActionsPanel({
  onSelectAction,
  theme = 'default',
  isCollapsed = false,
  onToggleCollapse,
  onMicToggle,
  onFileUpload,
  onVoiceCall,
  isRecording = false,
  hasSpeechRecognition = false,
  streamAnalytics,
  activePanel,
  onToggleStats,
  onToggleMemory,
  sessionStats,
  memorySettings,
  onMemoryChange,
  onToggleExport,
  onToggleShortcuts,
  onToggleEmoji,
  onExportChat,
  onInsertEmoji,
}: QuickActionsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [memoryTab, setMemoryTab] = useState<'about' | 'memory' | null>(null);
  const [emojiSearch, setEmojiSearch] = useState('');

  const categories = [...new Set(QUICK_ACTIONS.map((a) => a.category))];
  const filteredActions = selectedCategory
    ? QUICK_ACTIONS.filter((a) => a.category === selectedCategory)
    : QUICK_ACTIONS;

  const analytics = streamAnalytics || {
    tokenCount: 0,
    charCount: 0,
    requestActive: false,
    toolsUsed: 0,
    startTime: null,
    elapsedMs: 0,
  };

  // ── Slim bar (always visible) ─────────────────────────────────
  const slimBar = (
    <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' as any }}>
      <div className="flex items-center h-9 px-2 gap-2 w-max min-w-full">
      {/* LEFT: 3 action icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={onMicToggle}
          className={`p-1.5 rounded-lg transition-all ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
          }`}
          title={
            isRecording
              ? 'Stop recording'
              : hasSpeechRecognition
                ? 'Voice input'
                : 'Speech not available'
          }
        >
          {isRecording ? (
            <StopIcon className="w-3.5 h-3.5" />
          ) : (
            <MicrophoneIcon className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={onFileUpload}
          className="p-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
          title="Upload file"
        >
          <PaperClipIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onVoiceCall}
          className="p-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
          title="Voice call"
        >
          <PhoneIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* CENTER: Live analytics bar — fills all available space */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-center">
        {analytics.requestActive ? (
          <>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex-1 max-w-[200px]">
              <div
                className={`h-full rounded-full transition-all duration-150 ${getStrengthColor(analytics.tokenCount)}`}
                style={{ width: `${getStrengthWidth(analytics.tokenCount)}%` }}
              />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 flex-shrink-0 tabular-nums">
              <span className="text-blue-600 font-semibold">{analytics.tokenCount} tok</span>
              <span className="text-slate-300">|</span>
              <span>{formatElapsed(analytics.elapsedMs)}</span>
              {analytics.toolsUsed > 0 && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-indigo-600">{analytics.toolsUsed} 🔧</span>
                </>
              )}
            </div>
          </>
        ) : analytics.tokenCount > 0 ? (
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 flex-shrink-0 tabular-nums">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden flex-1 max-w-[160px]" style={{ minWidth: '60px' }}>
              <div
                className={`h-full rounded-full ${getStrengthColor(analytics.tokenCount)} opacity-50`}
                style={{ width: `${getStrengthWidth(analytics.tokenCount)}%` }}
              />
            </div>
            <span>{analytics.tokenCount} tok</span>
            <span className="text-slate-300">|</span>
            <span>{formatElapsed(analytics.elapsedMs)}</span>
            {analytics.toolsUsed > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <span>{analytics.toolsUsed} 🔧</span>
              </>
            )}
          </div>
        ) : (
          <div className="h-1.5 bg-slate-50 rounded-full flex-1 max-w-[200px]" />
        )}
      </div>

      {/* RIGHT: toggles */}
      <div className="flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap">
        <button
          type="button"
          onClick={onToggleMemory}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-colors ${
            activePanel === 'memory'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-slate-50 text-slate-400'
          }`}
        >
          <CpuChipIcon className="w-3 h-3" />
          <span className="text-[10px] font-semibold tracking-wide uppercase">
            Memory
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleStats}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-colors ${
            activePanel === 'stats'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-slate-50 text-slate-400'
          }`}
        >
          <ChartBarIcon className="w-3 h-3" />
          <span className="text-[10px] font-semibold tracking-wide uppercase">
            Stats
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleExport}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-colors ${
            activePanel === 'export'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-slate-50 text-slate-400'
          }`}
        >
          <ArrowDownTrayIcon className="w-3 h-3" />
          <span className="text-[10px] font-semibold tracking-wide uppercase">
            Export
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleShortcuts}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-colors ${
            activePanel === 'shortcuts'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-slate-50 text-slate-400'
          }`}
        >
          <CommandLineIcon className="w-3 h-3" />
          <span className="text-[10px] font-semibold tracking-wide uppercase">
            Keys
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleEmoji}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-colors ${
            activePanel === 'emoji'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-slate-50 text-slate-400'
          }`}
        >
          <FaceSmileIcon className="w-3 h-3" />
          <span className="text-[10px] font-semibold tracking-wide uppercase">
            Emoji
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-colors ${
            activePanel === 'quick-actions'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-slate-50 text-slate-400'
          }`}
        >
          <span className="text-[10px] font-semibold tracking-wide uppercase">
            Actions
          </span>
          {activePanel === 'quick-actions' ? (
            <ChevronDownIcon className="w-3 h-3" />
          ) : (
            <ChevronUpIcon className="w-3 h-3" />
          )}
        </button>
      </div>
      </div>
    </div>
  );

  const stats = sessionStats || {
    totalRequests: 0,
    totalTokens: 0,
    totalToolsUsed: 0,
    totalMessages: 0,
    totalAttachments: 0,
    startedAt: Date.now(),
    imagesUploaded: 0,
    docsUploaded: 0,
    otherUploaded: 0,
    filesGenerated: 0,
    imagesGenerated: 0,
    codeGenerated: 0,
    documentsGenerated: 0,
    videosGenerated: 0,
    toolTypes: {},
  };

  // Neither panel open — just show slim bar
  if (!activePanel) {
    return (
      <div className="bg-white/90 backdrop-blur-sm border-t border-white/80">
        {slimBar}
      </div>
    );
  }

  // Memory panel
  if (activePanel === 'memory') {
    const mem = memorySettings || {
      enabled: false,
      userName: '',
      language: '',
      gender: '',
      dateOfBirth: '',
      memories: [],
    };
    const update = (patch: Partial<MemorySettings>) => {
      // Enforce 18+ age requirement for date of birth
      if (patch.dateOfBirth) {
        const dob = new Date(patch.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 18) return; // Silently reject under-18
      }
      onMemoryChange?.({ ...mem, ...patch } as MemorySettings);
    };

    // Calculate max date (18 years ago today) for DOB picker
    const maxDobDate = (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 18);
      return d.toISOString().split('T')[0];
    })();

    const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
      personal: { bg: 'bg-blue-50', text: 'text-blue-600', label: '👤 Personal' },
      preference: { bg: 'bg-purple-50', text: 'text-purple-600', label: '⚙️ Preference' },
      project: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: '📁 Project' },
      topic: { bg: 'bg-amber-50', text: 'text-amber-600', label: '💡 Topic' },
      style: { bg: 'bg-pink-50', text: 'text-pink-600', label: '💬 Style' },
      general: { bg: 'bg-gray-50', text: 'text-gray-600', label: '📌 General' },
    };

    const formatTimeAgo = (ts: number) => {
      const diff = Date.now() - ts;
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return `${Math.floor(diff / 86400000)}d ago`;
    };

    return (
      <div className="bg-white/90 backdrop-blur-sm border-t border-white/80">
        {slimBar}
        <div className="px-3 pt-2 pb-2">

          {/* Toggle row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${mem.enabled ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-[11px] font-semibold text-slate-500">{mem.enabled ? 'Auto Memory On' : 'Memory Off'}</span>
            </div>
            <button
              type="button"
              onClick={() => update({ enabled: !mem.enabled })}
              className={`relative w-9 h-[18px] rounded-full transition-colors ${mem.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-transform ${mem.enabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
            </button>
          </div>

          {mem.enabled && (
            <>
              {/* Tab bar — About You | Memory */}
              <div className="flex rounded-lg bg-slate-100 p-0.5 mb-2">
                <button
                  type="button"
                  onClick={() => setMemoryTab(memoryTab === 'about' ? null : 'about')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    memoryTab === 'about'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>👋</span> About You
                </button>
                <button
                  type="button"
                  onClick={() => setMemoryTab(memoryTab === 'memory' ? null : 'memory')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    memoryTab === 'memory'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>🧠</span> Memory
                  {mem.memories.length > 0 && (
                    <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{mem.memories.length}</span>
                  )}
                </button>
              </div>

              {/* About You section — expand/collapse */}
              {memoryTab === 'about' && (
                <div className="space-y-2 py-2 border-t border-white/80">
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Tell the agent about yourself</div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Name</label>
                    <input
                      type="text"
                      value={mem.userName}
                      onChange={(e) => update({ userName: e.target.value })}
                      placeholder="What should the agent call you?"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-white/80 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 mb-0.5 block">Language</label>
                      <select
                        value={mem.language}
                        onChange={(e) => update({ language: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-white/80 bg-white focus:border-blue-400 outline-none transition-all text-slate-500"
                      >
                        <option value="">Select...</option>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Urdu">Urdu</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Korean">Korean</option>
                        <option value="Russian">Russian</option>
                        <option value="Italian">Italian</option>
                        <option value="Turkish">Turkish</option>
                        <option value="Dutch">Dutch</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 mb-0.5 block">Gender</label>
                      <select
                        value={mem.gender}
                        onChange={(e) => update({ gender: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-white/80 bg-white focus:border-blue-400 outline-none transition-all text-slate-500"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Date of Birth <span className="text-slate-300">(18+ only)</span></label>
                    <input
                      type="date"
                      value={mem.dateOfBirth}
                      max={maxDobDate}
                      onChange={(e) => update({ dateOfBirth: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-white/80 bg-white focus:border-blue-400 outline-none transition-all text-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* Memory section — expand/collapse with internal scroll */}
              {memoryTab === 'memory' && (
                <div className="border-t border-white/80 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Saved memories · Auto-learned from chats</span>
                    <span className="text-[9px] text-slate-300">Delete chat session to clear its memories</span>
                  </div>
                  <div className="max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent rounded-lg border border-white/80 bg-slate-50/30">
                    {mem.memories.length > 0 ? (
                      <div className="p-2 space-y-1.5">
                        {[...mem.memories].reverse().map((memory) => {
                          const cat = CATEGORY_COLORS[memory.category] || CATEGORY_COLORS.general;
                          return (
                            <div key={memory.id} className={`flex items-start gap-2 px-2.5 py-2 rounded-lg ${cat.bg} group`}>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-slate-600 leading-snug">{memory.fact}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] font-medium ${cat.text}`}>{cat.label}</span>
                                  <span className="text-[9px] text-slate-300">·</span>
                                  <span className="text-[9px] text-slate-400">{formatTimeAgo(memory.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="text-2xl mb-1">🧠</div>
                        <div className="text-[11px] text-slate-400">No memories yet</div>
                        <div className="text-[9px] text-slate-300 mt-0.5">Chat with the agent and it will<br/>automatically remember key facts</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!mem.enabled && (
            <div className="text-center py-2">
              <span className="text-[10px] text-slate-400">Enable to let the agent remember facts about you</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Export panel ──────────────────────────────────────────────
  if (activePanel === 'export') {
    const exportOptions = [
      {
        format: 'markdown' as const,
        label: 'Markdown',
        ext: '.md format',
        icon: '📝',
        desc: 'Rich formatted text with headings, bold, code blocks',
      },
      {
        format: 'json' as const,
        label: 'JSON',
        ext: '.json format',
        icon: '📊',
        desc: 'Structured data with messages, timestamps, metadata',
      },
      {
        format: 'text' as const,
        label: 'Plain Text',
        ext: '.txt format',
        icon: '📄',
        desc: 'Simple readable text, easy to share anywhere',
      },
    ];

    return (
      <div className="bg-white/90 backdrop-blur-sm border-t border-white/80">
        {slimBar}
        <div className="px-4 pt-2 pb-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Export Conversation</div>
          <div className="grid grid-cols-3 gap-2">
            {exportOptions.map((opt) => (
              <button
                key={opt.format}
                type="button"
                onClick={() => onExportChat?.(opt.format)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/80 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all group"
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">{opt.label}</span>
                <span className="text-[9px] text-slate-400">{opt.ext}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Shortcuts panel ──────────────────────────────────────────
  if (activePanel === 'shortcuts') {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    const mod = isMac ? '⌘' : 'Ctrl';

    const shortcuts = [
      { keys: ['Enter'], desc: 'Send message' },
      { keys: ['Shift', 'Enter'], desc: 'New line in message' },
      { keys: [mod, 'Shift', 'N'], desc: 'New conversation' },
      { keys: [mod, 'Shift', 'S'], desc: 'Toggle sidebar' },
      { keys: [mod, 'Shift', 'C'], desc: 'Copy last response' },
      { keys: ['Esc'], desc: 'Stop generating / Close panel' },
      { keys: [mod, '/'], desc: 'Focus message input' },
      { keys: [mod, 'Shift', 'E'], desc: 'Export conversation' },
    ];

    return (
      <div className="bg-white/90 backdrop-blur-sm border-t border-white/80">
        {slimBar}
        <div className="px-4 pt-2 pb-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Keyboard Shortcuts</div>
          <div className="space-y-1.5">
            {shortcuts.map((sc) => (
              <div key={sc.desc} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="text-[11px] text-slate-500">{sc.desc}</span>
                <div className="flex items-center gap-0.5">
                  {sc.keys.map((key) => (
                    <kbd
                      key={key}
                      className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 text-[10px] font-medium text-slate-500 bg-slate-100 border border-white/80 rounded shadow-sm"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Emoji panel ──────────────────────────────────────────────
  if (activePanel === 'emoji') {
    const EMOJI_CATEGORIES: Record<string, string[]> = {
      'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🫢', '🤫', '🤔', '🫡', '😐', '😑', '😶', '🫥', '😏', '😒', '🙄', '😬', '🤥', '🫨'],
      'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🤝', '🙏', '💪', '🫶', '🤲', '🤝', '✍️', '🤳', '💅'],
      'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '🫀', '💌', '💐', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻'],
      'Objects': ['💻', '📱', '🖥️', '⌨️', '🖱️', '💾', '📀', '🎮', '🕹️', '📷', '📸', '🎥', '📞', '☎️', '📺', '📻', '🔊', '🔔', '🎵', '🎶', '🎤', '🎧', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '📦', '✉️'],
      'Symbols': ['✅', '❌', '⭐', '🌟', '💫', '⚡', '🔥', '💥', '❗', '❓', '💯', '🎯', '🏆', '🥇', '🏅', '🎪', '🎨', '🎬', '🎭', '🚀', '✨', '🔗', '📌', '📍', '🏷️', '💬', '💭', '🗯️', '♻️', '🔒'],
    };

    const filteredEmojis = emojiSearch.trim()
      ? Object.entries(EMOJI_CATEGORIES).reduce((acc, [cat, emojis]) => {
          // Simple filter: show all if searching (emoji search is visual)
          return { ...acc, [cat]: emojis };
        }, {} as Record<string, string[]>)
      : EMOJI_CATEGORIES;

    return (
      <div className="bg-white/90 backdrop-blur-sm border-t border-white/80">
        {slimBar}
        <div className="px-4 pt-2 pb-3">
          <input
            type="text"
            value={emojiSearch}
            onChange={(e) => setEmojiSearch(e.target.value)}
            placeholder="Search emojis..."
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-white/80 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-300 mb-2"
          />
          <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent space-y-2">
            {Object.entries(filteredEmojis).map(([category, emojis]) => (
              <div key={category}>
                <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{category}</div>
                <div className="flex flex-wrap gap-0.5">
                  {emojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      type="button"
                      onClick={() => onInsertEmoji?.(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg rounded-md hover:bg-blue-50 transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Stats panel
  if (activePanel === 'stats') {
    const reqPct = Math.min((stats.totalRequests / 50) * 100, 100);
    const tokPct = Math.min((stats.totalTokens / 5000) * 100, 100);
    const toolPct = Math.min((stats.totalToolsUsed / 30) * 100, 100);
    const fmtTok = stats.totalTokens > 999 ? `${(stats.totalTokens / 1000).toFixed(1)}k` : String(stats.totalTokens);

    // Top tool types (sorted by count)
    const topTools = Object.entries(stats.toolTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const maxToolCount = topTools.length > 0 ? topTools[0][1] : 1;

    return (
      <div className="bg-white/90 backdrop-blur-sm border-t border-white/80">
        {slimBar}
        <div className="px-4 pt-2 pb-3 space-y-3">
          {/* Gauges row — 3 gauges */}
          <div className="flex items-center gap-5 justify-center">
            {/* Gauge: Requests */}
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#grad-req)" strokeWidth="2.5" strokeDasharray={`${reqPct} ${100 - reqPct}`} strokeLinecap="round" className="transition-all duration-500" />
                  <defs><linearGradient id="grad-req" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-600 tabular-nums">{stats.totalRequests}</span>
                </div>
              </div>
              <span className="text-[9px] font-medium text-slate-400 mt-0.5">Requests</span>
            </div>

            {/* Gauge: Tokens */}
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#grad-tok)" strokeWidth="2.5" strokeDasharray={`${tokPct} ${100 - tokPct}`} strokeLinecap="round" className="transition-all duration-500" />
                  <defs><linearGradient id="grad-tok" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-600 tabular-nums">{fmtTok}</span>
                </div>
              </div>
              <span className="text-[9px] font-medium text-slate-400 mt-0.5">Tokens</span>
            </div>

            {/* Gauge: Tools */}
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#grad-tool)" strokeWidth="2.5" strokeDasharray={`${toolPct} ${100 - toolPct}`} strokeLinecap="round" className="transition-all duration-500" />
                  <defs><linearGradient id="grad-tool" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-600 tabular-nums">{stats.totalToolsUsed}</span>
                </div>
              </div>
              <span className="text-[9px] font-medium text-slate-400 mt-0.5">Tools</span>
            </div>
          </div>

          {/* Core counters row */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className="bg-slate-50 rounded-lg px-2 py-1.5 text-center">
              <div className="text-base font-bold text-blue-600 tabular-nums leading-tight">{stats.totalMessages}</div>
              <div className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Messages</div>
            </div>
            <div className="bg-slate-50 rounded-lg px-2 py-1.5 text-center">
              <div className="text-base font-bold text-indigo-600 tabular-nums leading-tight">{stats.totalRequests}</div>
              <div className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Requests</div>
            </div>
            <div className="bg-slate-50 rounded-lg px-2 py-1.5 text-center">
              <div className="text-base font-bold text-green-600 tabular-nums leading-tight">{fmtTok}</div>
              <div className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Tokens</div>
            </div>
            <div className="bg-slate-50 rounded-lg px-2 py-1.5 text-center">
              <div className="text-base font-bold text-orange-500 tabular-nums leading-tight">{stats.totalToolsUsed}</div>
              <div className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Tools</div>
            </div>
          </div>

          {/* Uploads section */}
          {stats.totalAttachments > 0 && (
            <div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <PaperClipIcon className="w-3 h-3" /> Uploads ({stats.totalAttachments})
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-blue-600 tabular-nums">{stats.imagesUploaded}</div>
                  <div className="text-[8px] font-medium text-blue-400 uppercase">Images</div>
                </div>
                <div className="bg-purple-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-purple-600 tabular-nums">{stats.docsUploaded}</div>
                  <div className="text-[8px] font-medium text-purple-400 uppercase">Documents</div>
                </div>
                <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-gray-600 tabular-nums">{stats.otherUploaded}</div>
                  <div className="text-[8px] font-medium text-gray-400 uppercase">Other</div>
                </div>
              </div>
            </div>
          )}

          {/* Agent-generated files section */}
          {stats.filesGenerated > 0 && (
            <div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" /> Agent Generated ({stats.filesGenerated})
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-indigo-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-indigo-600 tabular-nums">{stats.imagesGenerated}</div>
                  <div className="text-[8px] font-medium text-indigo-400 uppercase">Images</div>
                </div>
                <div className="bg-emerald-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-emerald-600 tabular-nums">{stats.codeGenerated}</div>
                  <div className="text-[8px] font-medium text-emerald-400 uppercase">Code</div>
                </div>
                <div className="bg-amber-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-amber-600 tabular-nums">{stats.documentsGenerated}</div>
                  <div className="text-[8px] font-medium text-amber-400 uppercase">Docs</div>
                </div>
                <div className="bg-rose-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-rose-600 tabular-nums">{stats.videosGenerated}</div>
                  <div className="text-[8px] font-medium text-rose-400 uppercase">Video</div>
                </div>
              </div>
            </div>
          )}

          {/* Tool usage breakdown */}
          {topTools.length > 0 && (
            <div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Top Tools Used</div>
              <div className="space-y-1">
                {topTools.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-24 truncate" title={name}>{name}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-500"
                        style={{ width: `${(count / maxToolCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 tabular-nums w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quick Actions panel
  return (
    <div className="bg-white/90 backdrop-blur-sm border-t border-white/80">
      {slimBar}

      {/* Category Filters */}
      <div className="px-4 pb-2.5 pt-1.5 flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
            selectedCategory === null
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white shadow-sm'
              : 'bg-white border-white/80 text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setSelectedCategory(selectedCategory === cat ? null : cat)
            }
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white shadow-sm'
                : 'bg-white border-white/80 text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {filteredActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onSelectAction(action.prompt)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:border-transparent transition-all hover:scale-[1.02] shadow-sm"
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
