import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GeneratedApp,
  GenerationState,
  ChatMessage,
  ModelOption,
  ProgrammingLanguage,
  Template,
  FileNode,
  FileOperation,
} from './types';
import SandpackPreview from './components/SandpackPreview';
import CodeEditor from './components/CodeEditor';
import FileTree from './components/FileTree';
import ChatBox from './components/ChatBox';
import TemplatesPanel, { LANGUAGES, TEMPLATES } from './components/TemplatesPanel';
import { TEMPLATE_FILES } from './templateFiles';
import VoiceInput from './components/VoiceInput';
import ImageToCode from './components/ImageToCode';
import DeployPanel from './components/DeployPanel';
import AppSettingsPanel from './components/AppSettings';
import Overlay from './components/Overlay';
import { useAuth } from './hooks/useAuth';
import canvasAppsService from './services/canvasAppsService';
import { editorBridge, useEditorStore } from './services/editorBridge';
import deploymentService from './services/deploymentService';
import { DeploymentPlatform, ChatAttachment } from './types';
import {
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Columns,
  Mic,
  Image,
  Rocket,
  Edit,
  Eye,
  MessageSquare,
  FolderTree,
  Clock,
  LayoutTemplate,
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  Hammer,
  FolderOpen,
  Database,
  Activity,
  Bot,
  Film,
  X,
  LogIn,
  CreditCard,
  Loader2,
  UserPlus,
  Paintbrush,
  GitBranch,
  Package,
  Lock,
  Search,
  AlertTriangle,
  Terminal as TerminalIcon,
  Wand2,
  Receipt,
  BarChart3,
  Globe,
  RotateCcw,
  Zap,
  Archive,
  Code2,
  MoreVertical,
  Download,
  Trash2,
  Star,
  Bookmark,
} from 'lucide-react';
import BuildPanel from './components/editor/BuildPanel';
import AssetBrowser from './components/sidebar/AssetBrowser';
import DatabasePanel from './components/sidebar/DatabasePanel';
import MonitoringDashboard from './components/deploy/MonitoringDashboard';
import AgentPanel from './components/sidebar/AgentPanel';
import VideoEditorPanel from './components/video/VideoEditorPanel';
import AnalyticsDrawer from './components/AnalyticsDrawer';

// ── Previously unused components — now wired ──
import { default as ToastContainer, toast } from './components/shared/Toast';
import PlanStatusBar from './components/PlanStatusBar';
import CodeView from './components/CodeView';
import EditorTabs from './components/editor/EditorTabs';
import EditorStatusBar from './components/editor/EditorStatusBar';
import EditorSettings from './components/editor/EditorSettings';
import ProblemPanel from './components/editor/ProblemPanel';
import SearchReplace from './components/editor/SearchReplace';
import TerminalManager from './components/editor/TerminalManager';
import DeviceFrames from './components/preview/DeviceFrames';
import PreviewToolbar from './components/preview/PreviewToolbar';
import ConsolePanel from './components/preview/ConsolePanel';
import NetworkPanel, { type NetworkRequest } from './components/preview/NetworkPanel';
import AIAutofix from './components/ai/AIAutofix';
import AIExplain from './components/ai/AIExplain';
import AIRefactor, { type RefactorSuggestion } from './components/ai/AIRefactor';
import AITestWriter, { type GeneratedTest } from './components/ai/AITestWriter';
import GitPanel from './components/sidebar/GitPanel';
import DependenciesPanel from './components/sidebar/DependenciesPanel';
import EnvironmentVars from './components/sidebar/EnvironmentVars';
import ImagePanel from './components/sidebar/ImagePanel';
import HistoryPanel, { type HistoryEntry } from './components/sidebar/HistoryPanel';
import { useDraftsStore } from './stores/draftsStore';
import RollbackPanel from './components/deploy/RollbackPanel';
import InvoiceHistory from './components/billing/InvoiceHistory';
import UsageDashboard from './components/billing/UsageDashboard';
import { useEditorSettingsStore } from './stores/editorStore';

// Preview view mode type (separate from legacy ViewMode)
type PreviewViewMode = 'desktop' | 'tablet' | 'mobile' | 'code' | 'split';

// Left sidebar tab type
type SidebarTab =
  | 'chat'
  | 'files'
  | 'quickstart'
  | 'templates'
  | 'drafts'
  | 'history'
  | 'build'
  | 'assets'
  | 'database'
  | 'monitor'
  | 'agent'
  | 'video'
  | 'ai'
  | 'git'
  | 'deps'
  | 'env'
  | 'images'
  | 'search'
  | 'billing';

type BottomPanelTab = 'terminal' | 'problems' | 'console' | 'network';
type AiSubTab = 'autofix' | 'explain' | 'refactor' | 'tests';
type BillingSubTab = 'usage' | 'invoices';

// Tabs that expand to full screen (no preview needed)
const FULLSCREEN_TABS = new Set<SidebarTab>([
  'quickstart', 'templates', 'history', 'drafts', 'search',
  'build', 'assets', 'database', 'monitor', 'agent', 'video', 'ai', 'git', 'deps', 'env', 'images', 'billing',
]);

// Backend handles model selection and fallback automatically via PROVIDER_CASCADE
const DEFAULT_MODEL: ModelOption = {
  id: 'mistral-large-latest',
  name: 'Mistral Large',
  provider: 'Mistral',
  description: 'Best quality code generation.',
};

const PRESET_TEMPLATES: { name: string; prompt: string; icon: string; category: string; tags: string[] }[] = [
  // ── Web & Landing ──
  {
    name: 'SaaS Landing Page',
    icon: '🚀',
    category: 'Web',
    tags: ['hero', 'pricing', 'features'],
    prompt: 'Build a modern SaaS landing page with animated hero, feature grid, testimonials carousel, pricing table, and CTA section. Use glassmorphism UI and smooth CSS animations.',
  },
  {
    name: 'Portfolio Site',
    icon: '🎨',
    category: 'Web',
    tags: ['portfolio', 'personal', 'showcase'],
    prompt: 'Create a stunning developer portfolio with dark theme, animated skill bars, project showcase grid with hover effects, and a contact form with validation.',
  },
  {
    name: 'Agency Website',
    icon: '🏢',
    category: 'Web',
    tags: ['agency', 'business', 'services'],
    prompt: 'Build a premium digital agency website with full-screen hero, services section, work portfolio masonry grid, team cards, and animated scroll reveals.',
  },
  {
    name: 'Product Landing',
    icon: '📦',
    category: 'Web',
    tags: ['product', 'marketing', 'cta'],
    prompt: 'Create a high-converting product landing page with bold typography, feature highlights, social proof section, video placeholder, and sticky navigation with CTA.',
  },
  // ── Dashboards ──
  {
    name: 'Analytics Dashboard',
    icon: '📊',
    category: 'Dashboard',
    tags: ['charts', 'stats', 'dark'],
    prompt: 'Create a dark-themed analytics dashboard with KPI cards, line chart, bar chart, pie chart placeholders, date range filter, and responsive sidebar navigation.',
  },
  {
    name: 'Admin Panel',
    icon: '🛠️',
    category: 'Dashboard',
    tags: ['admin', 'crud', 'table'],
    prompt: 'Build a full-featured admin panel with collapsible sidebar, stats overview, data table with sort/filter/pagination, user management section, and dark mode toggle.',
  },
  {
    name: 'Finance Dashboard',
    icon: '💰',
    category: 'Dashboard',
    tags: ['finance', 'budget', 'charts'],
    prompt: 'Create a finance dashboard with portfolio overview, income/expense charts, transaction list with categories, budget progress bars, and monthly summary cards.',
  },
  // ── Apps ──
  {
    name: 'Todo App',
    icon: '✅',
    category: 'App',
    tags: ['todo', 'tasks', 'react'],
    prompt: 'Build a React todo app with drag-and-drop ordering, local storage persistence, priority levels (urgent/normal/low), tags, due dates, and filter/search bar.',
  },
  {
    name: 'Kanban Board',
    icon: '📋',
    category: 'App',
    tags: ['kanban', 'project', 'drag'],
    prompt: 'Create a Kanban board with three columns (To Do / In Progress / Done), drag-and-drop cards, card creation modal, color labels, and column card count badges.',
  },
  {
    name: 'Chat Interface',
    icon: '💬',
    category: 'App',
    tags: ['chat', 'messaging', 'ui'],
    prompt: 'Build a modern chat interface with message bubbles, typing indicator animation, emoji picker placeholder, file attachment button, online status indicators, and auto-scroll.',
  },
  {
    name: 'Note Taking App',
    icon: '📝',
    category: 'App',
    tags: ['notes', 'markdown', 'editor'],
    prompt: 'Create a note-taking app with sidebar list of notes, rich text editor area, markdown preview toggle, search notes, pin/archive functionality, and tags.',
  },
  // ── E-commerce ──
  {
    name: 'E-commerce Store',
    icon: '🛒',
    category: 'E-commerce',
    tags: ['shop', 'cart', 'products'],
    prompt: 'Build an e-commerce storefront with product grid, filtering sidebar, quick-view modal, add-to-cart with quantity, sticky cart sidebar, and checkout summary.',
  },
  {
    name: 'Product Detail Page',
    icon: '🔍',
    category: 'E-commerce',
    tags: ['product', 'gallery', 'checkout'],
    prompt: 'Create a product detail page with image gallery carousel, color/size selectors, reviews section with star ratings, related products row, and add-to-cart CTA.',
  },
  // ── Backend / API ──
  {
    name: 'REST API (Node.js)',
    icon: '⚡',
    category: 'Backend',
    tags: ['api', 'express', 'crud'],
    prompt: 'Create an Express.js REST API with CRUD routes, JWT auth middleware, request validation, rate limiting, error handling middleware, and Swagger-style comments.',
  },
  {
    name: 'FastAPI Backend',
    icon: '🐍',
    category: 'Backend',
    tags: ['python', 'fastapi', 'pydantic'],
    prompt: 'Build a FastAPI backend with Pydantic models, async CRUD endpoints, JWT auth, database session dependency, background tasks, and health check endpoint.',
  },
  // ── UI Components ──
  {
    name: 'Design System',
    icon: '🎡',
    category: 'Components',
    tags: ['buttons', 'inputs', 'cards'],
    prompt: 'Create a comprehensive Tailwind CSS design system: buttons (primary/secondary/ghost/danger), inputs, cards, badges, modals, toasts, dropdowns, and loading states.',
  },
  {
    name: 'Auth Forms',
    icon: '🔐',
    category: 'Components',
    tags: ['login', 'signup', 'validation'],
    prompt: 'Create polished login, signup, and forgot-password forms with real-time validation, password strength meter, social auth buttons (Google/GitHub), and error states.',
  },
];

type ActivePanel =
  | 'workspace'
  | 'assistant'
  | 'history'
  | 'voice'
  | 'image'
  | 'deploy'
  | 'files'
  | null;
type EditorMode = 'view' | 'edit'; // Toggle between read-only and editable code

/**
 * Strip markdown code blocks from LLM output so only conversational text
 * appears in the chat panel. Code/files go to the Files panel instead.
 */
function stripCodeBlocks(text: string): string {
  // Remove complete fenced code blocks (```...```)
  let result = text.replace(/```[\s\S]*?```/g, '');
  // Remove any unclosed code block at the end (streaming partial)
  const lastOpen = result.lastIndexOf('```');
  if (lastOpen !== -1) {
    const after = result.substring(lastOpen + 3);
    if (!after.includes('```')) {
      result = result.substring(0, lastOpen);
    }
  }
  // Collapse excessive newlines left behind
  result = result.replace(/\n{3,}/g, '\n\n').trim();
  return result;
}

/** Map a tool name to a friendly file-operation descriptor */
function toolToFileOp(toolName: string, input: Record<string, any>): FileOperation | null {
  const path = input?.path || input?.filename || input?.file_path || '';
  if (toolName === 'canvas_file_create')
    return { op: 'create', path, status: 'running' };
  if (toolName === 'canvas_file_edit' || toolName === 'canvas_file_update')
    return { op: 'edit', path, status: 'running' };
  if (toolName === 'canvas_file_delete')
    return { op: 'delete', path, status: 'running' };
  if (toolName === 'canvas_terminal_run')
    return { op: 'terminal', path: input?.command || 'command', status: 'running' };
  if (toolName === 'canvas_project_add_dependency')
    return { op: 'dependency', path: input?.package || input?.name || 'package', status: 'running' };
  return null;
}

// ─── HistoryCard ───────────────────────────────────────────────────────────────
const HistoryCard: React.FC<{
  entry: import('./components/sidebar/HistoryPanel').HistoryEntry;
  onRestore: () => void;
  onPreview: () => void;
  onBookmark: () => void;
  onDelete: () => void;
  onDownload: () => void;
}> = ({ entry, onRestore, onPreview, onBookmark, onDelete, onDownload }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const actionColors: Record<string, string> = {
    generate: 'from-violet-500 to-purple-500',
    edit: 'from-indigo-500 to-violet-500',
    fix: 'from-amber-500 to-orange-500',
    style: 'from-pink-500 to-rose-500',
    refactor: 'from-violet-500 to-teal-500',
    deploy: 'from-violet-500 to-indigo-500',
    custom: 'from-slate-500 to-slate-600',
  };
  const gradient = actionColors[entry.action] || actionColors.custom;
  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  return (
    <div className="group relative bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 hover:border-violet-500/20 transition-all">
      <div className="flex items-start gap-2.5">
        {/* Gradient dot */}
        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 mt-0.5`}>
          <Sparkles className="w-3 h-3 text-slate-900 dark:text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate flex-1">{entry.title}</span>
            {entry.isBookmarked && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
          </div>
          {entry.prompt && (
            <p className="text-[10px] text-slate-500 line-clamp-1 mb-1">{entry.prompt}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600">{formatTime(entry.timestamp)}</span>
            <span className="text-[10px] text-slate-700">·</span>
            <span className="text-[10px] text-slate-600">{entry.filesChanged.length} file{entry.filesChanged.length !== 1 ? 's' : ''}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: 'rgba(255,255,255,0.05)', color: '#888' }}>{entry.action}</span>
          </div>
        </div>
        {/* Three-dot menu */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="p-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-50 w-40 bg-slate-50 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/[0.10] rounded-xl shadow-2xl shadow-black/50 py-1 overflow-hidden">
                <button onClick={() => { onPreview(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-violet-500/10 hover:text-violet-300 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button onClick={() => { onRestore(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-violet-500/10 hover:text-violet-300 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                </button>
                <button onClick={() => { onBookmark(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-300 transition-colors">
                  <Bookmark className={`w-3.5 h-3.5 ${entry.isBookmarked ? 'fill-current text-amber-400' : ''}`} /> {entry.isBookmarked ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => { onDownload(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-violet-500/10 hover:text-violet-300 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <div className="mx-2 my-1 border-t border-slate-200 dark:border-white/[0.06]" />
                <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel] = useState<ModelOption>(DEFAULT_MODEL);
  const [viewMode, setViewMode] = useState<PreviewViewMode>('desktop');
  const [currentApp, setCurrentApp] = useState<GeneratedApp | null>(null);
  const [history, setHistory] = useState<GeneratedApp[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('workspace');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chat');
  const [genState, setGenState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    progressMessage: '',
  });
  const [chatStreamingText, setChatStreamingText] = useState('');
  const [streamingFileOps, setStreamingFileOps] = useState<FileOperation[]>([]);
  const [showOverlay, setShowOverlay] = useState(true);

  // New state for templates and languages
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<
    ProgrammingLanguage | 'all'
  >('all');
  const [templatesPanelOpen, setTemplatesPanelOpen] = useState(false);
  const [viewOverlayTemplate, setViewOverlayTemplate] = useState<Template | null>(null);
  const [currentLanguage, setCurrentLanguage] =
    useState<ProgrammingLanguage>('html');

  // Abort controller ref for stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // New feature modals
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showImageToCode, setShowImageToCode] = useState(false);
  const [showDeployPanel, setShowDeployPanel] = useState(false);

  // Editor Bridge state
  const [editorMode, setEditorMode] = useState<EditorMode>('view');
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  // Chat mode — Agent (full tool calling, code gen) vs Chat (conversational only)
  const [chatMode, setChatMode] = useState<'agent' | 'chat'>('agent');

  // Sidebar collapse state
  const [leftToolbarOpen, setLeftToolbarOpen] = useState(false);
  const [devToolbarOpen, setDevToolbarOpen] = useState(false);
  const [canvasToolbarOpen, setCanvasToolbarOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Sidebar discovery animation state
  const [sidebarHighlightIndex, setSidebarHighlightIndex] = useState<
    number | null
  >(null);
  const [hasSeenSidebarAnimation, setHasSeenSidebarAnimation] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Auth & Plan — single source of truth via useAuth hook
  const {
    user: authUser,
    plan: activePlan,
    isLoading: isCheckingPlan,
    isReady: isAuthReady,
    showThankYou,
    dismissThankYou,
    clearUser: clearAuthUser,
  } = useAuth();

  // Auth prompt popup (shown when unauthenticated user tries to use a feature)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const authRedirect = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? encodeURIComponent(window.location.href)
    : 'https%3A%2F%2Fstudio.mumtaz.ai';

  // Subscription paywall state
  const [showPricingPaywall, setShowPricingPaywall] = useState(false);

  // Close paywall after successful purchase
  useEffect(() => {
    if (showThankYou) setShowPricingPaywall(false);
  }, [showThankYou]);

  // Analytics drawer state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // ── Bottom panel state ──
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>('terminal');

  // ── Editor settings modal ──
  const [showEditorSettings, setShowEditorSettings] = useState(false);

  // ── App-wide settings modal ──
  const [showAppSettings, setShowAppSettings] = useState(false);

  // ── AI tools sub-tab ──
  const [aiSubTab, setAiSubTab] = useState<AiSubTab>('autofix');
  const [codeErrors, setCodeErrors] = useState<Array<{id: string; file: string; line: number; column: number; message: string; severity: 'error' | 'warning'; fixable: boolean; suggestedFix?: string}>>([]);
  const [refactorSuggestions, setRefactorSuggestions] = useState<RefactorSuggestion[]>([]);
  const [generatedTests, setGeneratedTests] = useState<GeneratedTest[]>([]);
  const [aiExplanation, setAiExplanation] = useState<{summary: string; detailed: string; complexity?: string; suggestions?: string[]; relatedConcepts?: string[]} | undefined>(undefined);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // ── Preview panel controls ──
  const [showConsole, setShowConsole] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<Array<{id: string; level: 'log' | 'warn' | 'error' | 'info' | 'debug'; message: string; timestamp: number; source?: string; line?: number}>>([]);
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([]);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  // ── Git, Deps, Env are now self-contained components (no parent state needed) ──

  // ── Billing sub-tab ──
  const [billingSubTab, setBillingSubTab] = useState<BillingSubTab>('usage');
  const [invoices, setInvoices] = useState<Array<{id: string; date: string; amount: number; currency: string; status: 'paid' | 'pending' | 'failed' | 'refunded'; description: string; pdfUrl?: string; paymentMethod?: string}>>([]);
  const [usageMetrics, setUsageMetrics] = useState<Array<{label: string; used: number; limit: number; unit: string; icon: 'tokens' | 'generations' | 'storage' | 'compute'; resetDate?: string}>>([]);
  const [invoiceDetails, setInvoiceDetails] = useState<null | {
    id: string; agentName: string; plan: string; price: number; currency: string;
    status: string; startDate: string; expiryDate: string; createdAt: string;
    customerName?: string; customerEmail?: string; stripeSubscriptionId?: string | null;
  }>(null);
  const [invoiceDetailsLoading, setInvoiceDetailsLoading] = useState(false);

  const handleInvoiceDownload = useCallback((id: string) => {
    // Browser hits backend, which redirects to Stripe PDF (if any) or renders HTML invoice
    window.open(`/api/agent/subscriptions/invoice/${encodeURIComponent(id)}/download`, '_blank', 'noopener');
  }, []);

  const handleInvoiceViewDetails = useCallback(async (id: string) => {
    setInvoiceDetailsLoading(true);
    try {
      const res = await fetch(`/api/agent/subscriptions/invoice/${encodeURIComponent(id)}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.invoice) throw new Error(json.error || 'Failed to load');
      setInvoiceDetails(json.invoice);
    } catch (e) {
      toast.error(`Could not load invoice: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setInvoiceDetailsLoading(false);
    }
  }, []);

  // ── Deploy sub-panels ──
  const [deployVersions, setDeployVersions] = useState<Array<{id: string; version: string; commitHash?: string; commitMessage?: string; deployedAt: string; deployedBy: string; url?: string; isCurrent: boolean; status: 'active' | 'superseded' | 'failed'; size?: string}>>([]);
  const [showRollbackPanel, setShowRollbackPanel] = useState(false);
  const [hostingStats, setHostingStats] = useState<{
    totalRequests: { label: string; value: string; change: string };
    bandwidth: { label: string; value: string; change: string };
    avgResponseTime: { label: string; value: string; change: string };
    uniqueVisitors: { label: string; value: string; change: string };
    uptimePercent: { label: string; value: string; change: string };
    errorRate: { label: string; value: string; change: string };
  } | null>(null);

  // ── History entries for HistoryPanel ──
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  // ── Editor settings store ──
  const editorSettingsStore = useEditorSettingsStore();

  // Auth & plan are handled by useAuth hook above — no inline effect needed

  // Load apps from database — wait for auth to resolve first to avoid 401s on startup
  useEffect(() => {
    if (!isAuthReady) return; // don't fire until session check completes
    const loadApps = async () => {
      setIsLoadingHistory(true);
      try {
        const apps = await canvasAppsService.getApps();
        setHistory(apps);
      } catch (e) {
        console.error('[App] Failed to load apps:', e);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadApps();
  }, [isAuthReady]);

  // Fetch hosting dashboard data (usage, billing, deployments) when auth is ready
  useEffect(() => {
    if (!isAuthReady || !authUser?.id) return;
    const loadDashboard = async () => {
      try {
        const res = await fetch(`/api/apps/hosting/dashboard/${authUser.id}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.dashboard) return;
        const d = data.dashboard;

        // Map usage data to usageMetrics format
        setUsageMetrics([
          { label: 'AI Generations', used: d.usage?.byType?.generation || 0, limit: d.plan?.maxRequestsPerMonth || 100, unit: 'requests', icon: 'generations' },
          { label: 'Bandwidth', used: d.usage?.bandwidth?.used || 0, limit: d.usage?.bandwidth?.limit || 1024, unit: 'MB', icon: 'storage' },
          { label: 'Storage', used: d.usage?.storage?.used || 0, limit: d.usage?.storage?.limit || 1024, unit: 'MB', icon: 'storage' },
          { label: 'Apps Deployed', used: d.usage?.apps?.used || 0, limit: d.usage?.apps?.limit || 3, unit: 'apps', icon: 'compute' },
        ]);

        // Map billing subscription history to invoices
        if (d.billing?.subscriptionHistory?.length) {
          setInvoices(d.billing.subscriptionHistory.map((s: { id: string; agentId: string; plan: string; price: number; status: string; startDate: string; expiryDate: string }) => ({
            id: s.id,
            date: new Date(s.startDate).toLocaleDateString(),
            amount: s.price,
            currency: 'USD',
            status: s.status === 'active' ? 'paid' as const : s.status === 'expired' ? 'paid' as const : 'pending' as const,
            description: `${s.agentId === 'gencraft-pro' ? 'GenCraft Pro' : 'Canvas'} - ${s.plan}`,
          })));
        }

        // Map deployments to deployVersions
        if (d.deployments?.items?.length) {
          setDeployVersions(d.deployments.items.map((dep: { id: string; version: string; commitHash?: string; commitMessage?: string; createdAt: string; status: string; deploymentUrl?: string; buildSize?: number }, idx: number) => ({
            id: dep.id,
            version: dep.version || `v${d.deployments.items.length - idx}`,
            commitHash: dep.commitHash,
            commitMessage: dep.commitMessage,
            deployedAt: dep.createdAt,
            deployedBy: authUser?.email || 'you',
            url: dep.deploymentUrl,
            isCurrent: idx === 0 && dep.status === 'live',
            status: dep.status === 'live' ? 'active' as const : dep.status === 'failed' ? 'failed' as const : 'superseded' as const,
            size: dep.buildSize ? String(dep.buildSize) : undefined,
          })));
        }

        // Map to hostingStats
        setHostingStats({
          totalRequests: { label: 'Total Requests', value: String(d.deployments?.totalRequests || 0), change: '+0%' },
          bandwidth: { label: 'Bandwidth', value: d.usage?.bandwidth?.usedFormatted || '0 MB', change: '+0%' },
          avgResponseTime: { label: 'Avg Response', value: '—', change: '+0%' },
          uniqueVisitors: { label: 'Visitors', value: '—', change: '+0%' },
          uptimePercent: { label: 'Uptime', value: d.deployments?.live ? '99.9%' : '—', change: '+0%' },
          errorRate: { label: 'Error Rate', value: '—', change: '+0%' },
        });
      } catch (e) {
        console.error('[App] Failed to load dashboard:', e);
      }
    };
    loadDashboard();
  }, [isAuthReady, authUser?.id]);

  // Sync editorBridge with currentApp code
  useEffect(() => {
    if (currentApp?.code) {
      editorBridge.loadFromCode(currentApp.code, currentLanguage);
      setProjectFiles(editorBridge.getProjectTree());
      // Set active file to first file if not set
      if (!activeFilePath) {
        const paths = editorBridge.getAllFilePaths();
        if (paths.length > 0) {
          setActiveFilePath(paths[0]);
        }
      }
    }
  }, [currentApp?.code, currentLanguage]);

  // Listen to editorBridge file changes
  useEffect(() => {
    const handleFileChange = (path: string, content: string) => {
      setProjectFiles(editorBridge.getProjectTree());
      // Sync back to currentApp if in edit mode
      if (editorMode === 'edit' && currentApp) {
        const newCode = editorBridge.toCode();
        setCurrentApp((prev) => (prev ? { ...prev, code: newCode } : null));
      }
    };
    return editorBridge.onFileChange(handleFileChange);
  }, [editorMode, currentApp]);

  // Sync history → HistoryPanel entries
  useEffect(() => {
    setHistoryEntries(
      history.map((app) => ({
        id: app.id,
        action: 'generate' as const,
        title: app.name,
        description: app.prompt,
        prompt: app.prompt,
        timestamp: app.timestamp,
        filesChanged: editorBridge.getAllFilePaths() || ['index.html'],
        isBookmarked: false,
      }))
    );
  }, [history]);

  // Git, Deps, Env panels now load their own data — no parent effects needed

  // Sync active file to editor tabs
  useEffect(() => {
    if (activeFilePath) {
      const name = activeFilePath.split('/').pop() || activeFilePath;
      editorSettingsStore.openTab(activeFilePath, name, currentLanguage);
    }
  }, [activeFilePath]);

  // Listen for iframe console messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        setConsoleEntries((prev) => [
          ...prev,
          {
            id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            level: event.data.level || 'log',
            message: String(event.data.message || ''),
            timestamp: Date.now(),
            source: event.data.source,
            line: event.data.line,
          },
        ]);
      }
      // Preview error bridge — capture runtime errors from iframe
      if (event.data?.type === 'preview-error' && event.data?.error) {
        setConsoleEntries((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            level: 'error',
            message: String(event.data.error.message || 'Unknown error'),
            timestamp: Date.now(),
            source: event.data.error.source,
            line: event.data.error.line,
          },
        ]);
      }
      if (event.data?.type === 'network') {
        setNetworkRequests((prev) => [
          ...prev,
          {
            id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            method: event.data.method || 'GET',
            url: event.data.url || '',
            status: event.data.status || 0,
            requestStatus: event.data.status >= 400 ? 'error' : 'success',
            size: event.data.size,
            time: event.data.time,
            type: event.data.resourceType || 'fetch',
            timestamp: Date.now(),
          },
        ]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sidebar discovery animation - runs once on first load
  // Persisted to DB via /api/user/preferences/ui-flags (ZERO localStorage)
  useEffect(() => {
    let cancelled = false;

    const checkAndAnimate = async () => {
      // Check DB for animation flag (guests skip animation)
      let hasSeen = false;
      if (authUser) {
        try {
          const res = await fetch('/api/user/preferences', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            hasSeen = !!data?.data?.uiFlags?.canvas_sidebar_animated;
          }
        } catch { /* API failed — show animation */ }
      }

      if (cancelled) return;
      if (hasSeen) {
        setHasSeenSidebarAnimation(true);
        return;
      }

      // Animation sequence: highlight each sidebar item with delay
      const sidebarItems = ['logo', 'workspace', 'assistant', 'history', 'settings'];
      let currentIndex = 0;

      const animateNext = () => {
        if (cancelled) return;
        if (currentIndex < sidebarItems.length) {
          setSidebarHighlightIndex(currentIndex);
          currentIndex++;
          setTimeout(animateNext, 600);
        } else {
          // Animation complete — persist to DB only (ZERO localStorage)
          setSidebarHighlightIndex(null);
          setHasSeenSidebarAnimation(true);
          if (authUser) {
            fetch('/api/user/preferences/ui-flags', {
              method: 'PUT',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ canvas_sidebar_animated: true }),
            }).catch(() => {});
          }
        }
      };

      // Start animation after a short delay
      setTimeout(() => {
        if (!cancelled) animateNext();
      }, 1000);
    };

    checkAndAnimate();
    return () => { cancelled = true; };
  }, [authUser]);

  // Save app to database
  const saveApp = useCallback(
    async (app: GeneratedApp, isNew: boolean = false) => {
      try {
        if (isNew) {
          const savedApp = await canvasAppsService.saveApp(app);
          if (savedApp) {
            // Update currentApp with server-assigned ID so subsequent
            // updates use the real CUID instead of the temporary timestamp ID.
            setCurrentApp((prev) =>
              prev && prev.id === app.id ? { ...prev, id: savedApp.id } : prev
            );
            setHistory((prev) => [
              savedApp,
              ...prev.filter((a) => a.id !== savedApp.id && a.id !== app.id),
            ]);
          }
        } else {
          const updatedApp = await canvasAppsService.updateApp(app.id, app);
          if (updatedApp) {
            setHistory((prev) =>
              prev.map((a) => (a.id === updatedApp.id ? updatedApp : a))
            );
          }
        }
      } catch (error) {
        console.error('[App] Save error:', error);
      }
    },
    []
  );

  // Legacy saveHistory for compatibility (no longer writes directly to localStorage)
  const saveHistory = useCallback((newHistory: GeneratedApp[]) => {
    setHistory(newHistory);
  }, []);

  const handleGenerate = async (
    instruction: string,
    isInitial: boolean = false
  ) => {
    if (!instruction.trim() || genState.isGenerating) return;

    // Auth gate — show login popup if not authenticated
    if (!authUser) {
      setShowAuthPrompt(true);
      return;
    }

    setGenState({
      isGenerating: true,
      error: null,
      progressMessage: `Generating ${LANGUAGES.find((l) => l.id === currentLanguage)?.name || 'code'} with ${selectedModel.name}...`,
      isThinking: selectedModel.isThinking,
    });

    try {
      // Add language context to the prompt
      const languageContext = getLanguagePromptAddition(currentLanguage);
      const enhancedInstruction = languageContext
        ? `[Language: ${currentLanguage.toUpperCase()}] ${languageContext}\n\nUser Request: ${instruction}`
        : instruction;

      // Use /api/canvas/agent-stream for real tool calling
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const response = await fetch('/api/canvas/agent-stream', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: enhancedInstruction,
          provider: selectedModel.provider,
          modelId: selectedModel.id,
          source: 'canvas-studio',
          files: isInitial
            ? []
            : editorBridge.getAllFilePaths().map((p) => {
                const f = editorBridge.getFile(p);
                return {
                  path: p,
                  name: p.split('/').pop() || p,
                  content: f?.content || '',
                  language: f?.language || 'text',
                };
              }),
          history: isInitial
            ? []
            : currentApp?.history?.slice(-10)?.map((m) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.text,
              })) || [],
        }),
      });

      // Handle auth errors
      if (response.status === 401) {
        setGenState({ isGenerating: false, error: null, progressMessage: '' });
        clearAuthUser();
        setShowAuthPrompt(true);
        return;
      }
      if (response.status === 403) {
        setGenState({ isGenerating: false, error: null, progressMessage: '' });
        try {
          const errData = await response.clone().json();
          if (errData.code === 'PLAN_REQUIRED') {
            setShowPricingPaywall(true);
            return;
          }
        } catch { /* not JSON */ }
        setShowPricingPaywall(true);
        return;
      }

      // Handle SSE streaming response with tool calling events
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      const genFileOps: FileOperation[] = [];

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6);
            if (d === '[DONE]') continue;
            try {
              const event = JSON.parse(d);
              if (event.token) {
                assistantText += event.token;
              }
              if (event.tool_start) {
                setGenState((prev) => ({
                  ...prev,
                  progressMessage: `Running ${event.tool_start.name.replace(/^canvas_/, '').replace(/_/g, ' ')}...`,
                }));
                const fop = toolToFileOp(event.tool_start.name, event.tool_start.input || {});
                if (fop) {
                  genFileOps.push(fop);
                  setStreamingFileOps([...genFileOps]);
                }
              }
              if (event.tool_result) {
                const tName = event.tool_result.name;
                const idx = genFileOps.findIndex(
                  (f) => f.status === 'running' && f.op === (
                    tName === 'canvas_file_create' ? 'create' :
                    tName === 'canvas_file_edit' || tName === 'canvas_file_update' ? 'edit' :
                    tName === 'canvas_file_delete' ? 'delete' :
                    tName === 'canvas_terminal_run' ? 'terminal' :
                    tName === 'canvas_project_add_dependency' ? 'dependency' : ''
                  )
                );
                if (idx >= 0) {
                  genFileOps[idx].status = 'done';
                  setStreamingFileOps([...genFileOps]);
                }
              }
              if (event.files) {
                // Apply files to editor bridge
                for (const f of event.files) {
                  const filePath = f.path.startsWith('/')
                    ? f.path
                    : `/${f.path}`;
                  const exists = editorBridge.getFile(filePath) !== undefined;
                  if (exists) {
                    editorBridge.updateFile(filePath, f.content);
                  } else {
                    editorBridge.createFile(filePath, f.content);
                  }
                }
                setProjectFiles(editorBridge.getProjectTree());
              }
              if (event.error) {
                throw new Error(event.error);
              }
            } catch (e: any) {
              if (e.message && !e.message.includes('JSON')) throw e;
            }
          }
        }
      }

      const code = editorBridge.toCode();

      const userMsg: ChatMessage = {
        role: 'user',
        text: instruction,
        timestamp: Date.now(),
      };
      const modelMsg: ChatMessage = {
        role: 'model',
        text: isInitial ? 'Application built!' : 'Changes applied.',
        timestamp: Date.now(),
        fileOps: genFileOps.length > 0 ? genFileOps.map((f) => ({ ...f, status: 'done' as const })) : undefined,
      };

      if (isInitial) {
        const newApp: GeneratedApp = {
          id: Date.now().toString(),
          name: instruction.substring(0, 30) + '...',
          code,
          prompt: instruction,
          timestamp: Date.now(),
          history: [userMsg, modelMsg],
          language: currentLanguage,
          provider: selectedModel.provider,
          modelId: selectedModel.id,
        };
        setCurrentApp(newApp);
        // Save new app to database
        saveApp(newApp, true);
      } else if (currentApp) {
        const updatedApp = {
          ...currentApp,
          code,
          history: [...currentApp.history, userMsg, modelMsg],
        };
        setCurrentApp(updatedApp);
        // Update existing app in database
        saveApp(updatedApp, false);
      }

      setStreamingFileOps([]);
      setGenState({ isGenerating: false, error: null, progressMessage: '' });
      setViewMode('desktop');
      setEditorMode('view');
    } catch (err: any) {
      setStreamingFileOps([]);
      setGenState({
        isGenerating: false,
        error: err.message,
        progressMessage: '',
      });
    }
  };

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  // Handle messages from AI Assistant chat - uses /api/canvas/agent-stream
  // with real LLM tool calling for file operations, terminal, build validation
  const handleChatMessage = async (text: string, attachments?: ChatAttachment[]) => {
    if ((!text.trim() && (!attachments || attachments.length === 0)) || genState.isGenerating) return;

    // Auth gate — show login popup if not authenticated
    if (!authUser) {
      setShowAuthPrompt(true);
      return;
    }

    setGenState({
      isGenerating: true,
      error: null,
      progressMessage: 'Building...',
    });
    setChatStreamingText('');
    setStreamingFileOps([]);

    try {
      // Build files array from editor bridge for tool calling context
      const allPaths = editorBridge.getAllFilePaths();
      const files = allPaths.map((p) => {
        const file = editorBridge.getFile(p);
        return {
          path: p,
          name: p.split('/').pop() || p,
          content: file?.content || '',
          language: file?.language || 'text',
        };
      });

      // Build the prompt — append attachment context if present
      let enrichedPrompt = text;
      if (attachments && attachments.length > 0) {
        const attachmentDescriptions: string[] = [];
        for (const att of attachments) {
          if (att.type.startsWith('image/')) {
            attachmentDescriptions.push(`[Attached image: ${att.name} (${att.type}, ${Math.round(att.size / 1024)}KB)]`);
          } else {
            // Decode text content from data URL
            try {
              const base64 = att.dataUrl.split(',')[1];
              const decoded = decodeURIComponent(escape(atob(base64)));
              attachmentDescriptions.push(`\n--- Attached file: ${att.name} ---\n${decoded}\n--- End of ${att.name} ---`);
            } catch {
              attachmentDescriptions.push(`[Attached file: ${att.name} (${att.type}, ${Math.round(att.size / 1024)}KB)]`);
            }
          }
        }
        enrichedPrompt = text + '\n\n' + attachmentDescriptions.join('\n');
      }

      // Single-agent endpoint
      const endpoint = '/api/canvas/agent-stream';

      const requestBody = {
            prompt: enrichedPrompt,
            provider: selectedModel.provider,
            modelId: selectedModel.id,
            source: 'canvas-studio',
            files,
            history:
              currentApp?.history?.slice(-10)?.map((m) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.text,
              })) || [],
          };

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });

      // Handle auth errors
      if (response.status === 401) {
        setGenState({ isGenerating: false, error: null, progressMessage: '' });
        clearAuthUser();
        setShowAuthPrompt(true);
        return;
      }
      if (response.status === 403) {
        setGenState({ isGenerating: false, error: null, progressMessage: '' });
        try {
          const errData = await response.clone().json();
          if (errData.code === 'PLAN_REQUIRED') {
            setShowPricingPaywall(true);
            return;
          }
        } catch { /* not JSON */ }
        setShowPricingPaywall(true);
        return;
      }

      // Handle SSE streaming response — tool calling events
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      const fileOps: FileOperation[] = [];
      let latestFiles: Array<{
        path: string;
        content: string;
        language?: string;
      }> | null = null;

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6);
            if (d === '[DONE]') continue;
            try {
              const event = JSON.parse(d);

              // ── Text token ──
              if (event.token && !event.worker) {
                assistantText += event.token;
                setChatStreamingText(stripCodeBlocks(assistantText));
              }

              // ── Tool start ──
              if (event.tool_start) {
                const toolLabel = event.tool_start.name.replace(/^canvas_/, '').replace(/_/g, ' ');
                const workerLabel = event.tool_start.worker
                  ? `[${event.tool_start.worker}] `
                  : '';
                setGenState((prev) => ({
                  ...prev,
                  progressMessage: `${workerLabel}Running ${toolLabel}...`,
                }));
                // Track file operations for chat notifications
                const fop = toolToFileOp(event.tool_start.name, event.tool_start.input || {});
                if (fop) {
                  fileOps.push(fop);
                  setStreamingFileOps([...fileOps]);
                }
              }

              // ── Tool result (both modes) — mark file op as done ──
              if (event.tool_result) {
                const tName = event.tool_result.name;
                const idx = fileOps.findIndex(
                  (f) => f.status === 'running' && f.op === (
                    tName === 'canvas_file_create' ? 'create' :
                    tName === 'canvas_file_edit' || tName === 'canvas_file_update' ? 'edit' :
                    tName === 'canvas_file_delete' ? 'delete' :
                    tName === 'canvas_terminal_run' ? 'terminal' :
                    tName === 'canvas_project_add_dependency' ? 'dependency' : ''
                  )
                );
                if (idx >= 0) {
                  fileOps[idx].status = 'done';
                  setStreamingFileOps([...fileOps]);
                }
              }

              // ── Files updated (both modes) ──
              if (event.files) {
                latestFiles = event.files;
                for (const f of event.files) {
                  const filePath = f.path.startsWith('/')
                    ? f.path
                    : `/${f.path}`;
                  const exists = editorBridge.getFile(filePath) !== undefined;
                  if (exists) {
                    editorBridge.updateFile(filePath, f.content);
                  } else {
                    editorBridge.createFile(filePath, f.content);
                  }
                }
                setProjectFiles(editorBridge.getProjectTree());
              }
              if (event.error) {
                throw new Error(event.error);
              }
            } catch (e: any) {
              if (e.message && !e.message.includes('JSON')) throw e;
            }
          }
        }
      }

      // Build updated code from editor bridge
      const code = editorBridge.toCode();

      const userMsg: ChatMessage = {
        role: 'user',
        text,
        timestamp: Date.now(),
        attachments,
      };
      const cleanText = stripCodeBlocks(assistantText);
      const modelMsg: ChatMessage = {
        role: 'model',
        text: cleanText || 'Changes applied!',
        timestamp: Date.now(),
        fileOps: fileOps.length > 0 ? fileOps.map((f) => ({ ...f, status: 'done' as const })) : undefined,
      };

      // Update the current app with new code
      if (currentApp) {
        const updatedApp = {
          ...currentApp,
          code,
          history: [...currentApp.history, userMsg, modelMsg],
        };
        setCurrentApp(updatedApp);
        saveApp(updatedApp, false);
      } else {
        const newApp: GeneratedApp = {
          id: Date.now().toString(),
          name: text.substring(0, 30) + '...',
          code,
          prompt: text,
          timestamp: Date.now(),
          history: [userMsg, modelMsg],
          language: currentLanguage,
        };
        setCurrentApp(newApp);
        saveApp(newApp, true);
      }

      setChatStreamingText('');
      setStreamingFileOps([]);
      setGenState({ isGenerating: false, error: null, progressMessage: '' });
      setViewMode('desktop');
      setEditorMode('view');
    } catch (err: any) {
      setChatStreamingText('');
      setStreamingFileOps([]);
      setGenState({
        isGenerating: false,
        error: err.message,
        progressMessage: '',
      });
    }
  };

  // Handle messages in Chat mode — conversational only, no code editing
  // Uses /api/canvas/chat (non-streaming JSON endpoint)
  const handlePureChatMessage = async (text: string, attachments?: ChatAttachment[]) => {
    if (!text.trim() || genState.isGenerating) return;

    if (!authUser) {
      setShowAuthPrompt(true);
      return;
    }

    setGenState({ isGenerating: true, error: null, progressMessage: 'Thinking...' });
    setChatStreamingText('');

    const userMsg: ChatMessage = {
      role: 'user',
      text,
      timestamp: Date.now(),
      attachments,
    };

    // Optimistically add user message
    const prevHistory = currentApp?.history || [];
    const updatedHistory = [...prevHistory, userMsg];

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/canvas/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          conversationHistory: prevHistory.slice(-10).map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            text: m.text,
          })),
        }),
      });

      if (response.status === 401) {
        setGenState({ isGenerating: false, error: null, progressMessage: '' });
        clearAuthUser();
        setShowAuthPrompt(true);
        return;
      }
      if (response.status === 403) {
        setGenState({ isGenerating: false, error: null, progressMessage: '' });
        setShowPricingPaywall(true);
        return;
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Chat failed');

      const modelMsg: ChatMessage = {
        role: 'model',
        text: data.message,
        timestamp: Date.now(),
      };

      if (currentApp) {
        const updatedApp = {
          ...currentApp,
          history: [...updatedHistory, modelMsg],
        };
        setCurrentApp(updatedApp);
        saveApp(updatedApp, false);
      } else {
        const newApp: GeneratedApp = {
          id: Date.now().toString(),
          name: text.substring(0, 30) + '...',
          code: '',
          prompt: text,
          timestamp: Date.now(),
          history: [userMsg, modelMsg],
          language: currentLanguage,
        };
        setCurrentApp(newApp);
        saveApp(newApp, true);
      }

      setGenState({ isGenerating: false, error: null, progressMessage: '' });
    } catch (err: any) {
      setGenState({ isGenerating: false, error: err.message, progressMessage: '' });
    }
  };

  // Stop generation in progress
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setChatStreamingText('');
    setStreamingFileOps([]);
    setGenState({ isGenerating: false, error: null, progressMessage: '' });
  };

  // Handle deploy completion callback from DeployPanel
  const handleDeployComplete = (url: string, platform: DeploymentPlatform) => {
    if (currentApp) {
      const deployMsg: ChatMessage = {
        role: 'model',
        text: `🚀 Deployed successfully to ${platform}!\n${url}`,
        timestamp: Date.now(),
      };
      const updatedApp = {
        ...currentApp,
        history: [...currentApp.history, deployMsg],
      };
      setCurrentApp(updatedApp);
      saveApp(updatedApp, false);

      // Add to deploy versions list
      setDeployVersions((prev) => [
        {
          id: `deploy-${Date.now()}`,
          version: `v${prev.length + 1}`,
          deployedAt: new Date().toISOString(),
          deployedBy: authUser?.email || 'you',
          url,
          isCurrent: true,
          status: 'active' as const,
        },
        ...prev.map((v) => ({ ...v, isCurrent: false, status: 'superseded' as const })),
      ]);
    }
  };

  // Handle build error fix request from DeployPanel
  const handleFixBuildError = async (error: string, buildLogs: string[]) => {
    if (!currentApp) return;

    setGenState({
      isGenerating: true,
      error: null,
      progressMessage: 'AI is analyzing and fixing build errors...',
    });

    try {
      const files = useEditorStore.getState().files;
      const fix = await deploymentService.requestBuildFix(
        error,
        buildLogs,
        files
      );

      if (fix && fix.fixedFiles) {
        // Apply all fixes
        for (const [path, content] of Object.entries(fix.fixedFiles)) {
          const filePath = path.startsWith('/') ? path : `/${path}`;
          const exists = editorBridge.getFile(filePath) !== undefined;
          if (exists) {
            editorBridge.updateFile(filePath, content);
          } else {
            editorBridge.createFile(filePath, content);
          }
        }
        setProjectFiles(editorBridge.getProjectTree());

        const newCode = editorBridge.toCode();
        const fixMsg: ChatMessage = {
          role: 'model',
          text: `🔧 ${fix.explanation}`,
          timestamp: Date.now(),
        };
        const updatedApp = {
          ...currentApp,
          code: newCode,
          history: [...currentApp.history, fixMsg],
        };
        setCurrentApp(updatedApp);
        saveApp(updatedApp, false);
      } else {
        throw new Error(
          'AI could not generate a fix. Try deploying again or modifying the code manually.'
        );
      }

      setGenState({ isGenerating: false, error: null, progressMessage: '' });
    } catch (err: any) {
      setGenState({
        isGenerating: false,
        error: err.message,
        progressMessage: '',
      });
    }
  };

  // Handle template selection from templates panel
  const handleUseTemplate = (template: Template) => {
    setCurrentLanguage(template.language);
    setSidebarTab('chat');
    setLeftPanelOpen(true);

    const builtInFiles = TEMPLATE_FILES[template.id];
    if (builtInFiles) {
      // Load real built-in template files into the editor
      editorBridge.reset();
      for (const [path, content] of Object.entries(builtInFiles)) {
        editorBridge.createFile(path, content);
      }
      setProjectFiles(editorBridge.getProjectTree());

      // Set active file to the main file
      const mainFile = Object.keys(builtInFiles)[0];
      if (mainFile) {
        editorBridge.setActiveFile(mainFile);
        setActiveFilePath(mainFile);
      }

      // Build the code string for currentApp
      const code = editorBridge.toCode();
      setCurrentApp({
        id: template.id,
        name: template.name,
        prompt: template.prompt,
        code,
        language: template.language,
        timestamp: Date.now(),
        history: [],
      });
      setViewMode('desktop');
    } else {
      // Fallback: trigger AI generation from prompt for templates without built-in code
      setTimeout(() => {
        handleGenerate(template.prompt, true);
      }, 100);
    }
  };

  // Handle rollback to a previous deploy version
  const handleRollback = async (versionId: string) => {
    try {
      const res = await fetch(`/api/canvas/deployments/${versionId}/rollback`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setDeployVersions((prev) => prev.map((v) => ({
          ...v,
          isCurrent: v.id === versionId,
          status: v.id === versionId ? ('active' as const) : ('superseded' as const),
        })));
        toast.success('Rollback successful');
      } else {
        toast.error('Rollback failed');
      }
    } catch {
      toast.error('Rollback failed');
    }
  };

  // Drafts store
  const { drafts, saveDraft, removeDraft } = useDraftsStore();

  // Handle new chat — save current work as draft, then clear
  const handleNewChat = () => {
    if (currentApp && (currentApp.code || currentApp.prompt)) {
      saveDraft(currentApp);
    }
    setCurrentApp(null);
    setPrompt('');
    setChatStreamingText('');
    setStreamingFileOps([]);
    editorBridge.reset();
    setProjectFiles([]);
    setActiveFilePath(null);
  };

  // Restore a draft — load it as current app and remove from drafts
  const handleRestoreDraft = (draftId: string) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) return;
    // Save current work first if any
    if (currentApp && (currentApp.code || currentApp.prompt)) {
      saveDraft(currentApp);
    }
    setCurrentApp(draft.app);
    setPrompt(draft.app.prompt || '');
    if (draft.app.language) setCurrentLanguage(draft.app.language);
    removeDraft(draftId);
    // Open both preview and chat
    setViewMode('desktop');
    setSidebarTab('chat');
    setLeftPanelOpen(true);
  };

  // ── AI Tool Handlers ──
  const handleAIAutofix = async (errorId: string) => {
    const error = codeErrors.find((e) => e.id === errorId);
    if (!error || !error.suggestedFix) return;
    const filePath = error.file.startsWith('/') ? error.file : `/${error.file}`;
    const file = editorBridge.getFile(filePath);
    if (file) {
      editorBridge.updateFile(filePath, error.suggestedFix);
      setProjectFiles(editorBridge.getProjectTree());
      setCodeErrors((prev) => prev.filter((e) => e.id !== errorId));
      toast.success(`Fixed error in ${error.file}`);
    }
  };

  const handleAIFixAll = async () => {
    const fixable = codeErrors.filter((e) => e.fixable && e.suggestedFix);
    for (const error of fixable) {
      await handleAIAutofix(error.id);
    }
    toast.success(`Fixed ${fixable.length} errors`);
  };

  const handleAIExplain = async (code: string) => {
    setIsAiAnalyzing(true);
    try {
      const res = await fetch('/api/canvas/agent-stream', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Explain this code concisely:\n\n${code}`, source: 'canvas-studio', provider: 'anthropic' }),
      });
      if (res.ok) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let text = '';
        if (reader) {
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const d = line.slice(6);
              if (d === '[DONE]') continue;
              try { const ev = JSON.parse(d); if (ev.token) text += ev.token; } catch {}
            }
          }
        }
        setAiExplanation({ summary: text.slice(0, 200), detailed: text });
      }
    } catch { toast.error('Failed to explain code'); }
    setIsAiAnalyzing(false);
  };

  const handleAIRefactorApply = async (id: string) => {
    const suggestion = refactorSuggestions.find((s) => s.id === id);
    if (!suggestion) return;
    const filePath = suggestion.file.startsWith('/') ? suggestion.file : `/${suggestion.file}`;
    editorBridge.updateFile(filePath, suggestion.refactoredCode);
    setProjectFiles(editorBridge.getProjectTree());
    setRefactorSuggestions((prev) => prev.filter((s) => s.id !== id));
    toast.success(`Applied refactoring: ${suggestion.title}`);
  };

  const handleAIRefactorRefresh = async () => {
    if (!currentApp?.code) return;
    setIsAiAnalyzing(true);
    try {
      const res = await fetch('/api/canvas/agent-stream', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Analyze this code and suggest refactoring improvements. Return JSON array of suggestions with fields: type, title, description, originalCode, refactoredCode, impact.\n\nCode:\n${currentApp.code.slice(0, 3000)}`, source: 'canvas-studio', provider: 'anthropic' }),
      });
      if (res.ok) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let text = '';
        if (reader) {
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const d = line.slice(6);
              if (d === '[DONE]') continue;
              try { const ev = JSON.parse(d); if (ev.token) text += ev.token; } catch {}
            }
          }
        }
        // Try to parse suggestions from AI response
        try {
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setRefactorSuggestions(parsed.map((s: any, i: number) => ({
              id: `refactor-${i}`,
              type: s.type || 'optimize',
              title: s.title || 'Suggestion',
              description: s.description || '',
              file: activeFilePath || '/index.html',
              lineRange: [1, 10] as [number, number],
              originalCode: s.originalCode || '',
              refactoredCode: s.refactoredCode || '',
              impact: s.impact || 'medium',
            })));
          }
        } catch { /* Could not parse suggestions */ }
      }
    } catch { toast.error('Failed to analyze code'); }
    setIsAiAnalyzing(false);
  };

  const handleGenerateTests = (code: string, framework: string, type: string) => {
    setIsAiAnalyzing(true);
    fetch('/api/canvas/agent-stream', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `Write ${type} tests using ${framework} for this code:\n\n${code}`, source: 'canvas-studio', provider: 'anthropic' }),
    }).then(async (res) => {
      if (res.ok) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let text = '';
        if (reader) {
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const d = line.slice(6);
              if (d === '[DONE]') continue;
              try { const ev = JSON.parse(d); if (ev.token) text += ev.token; } catch {}
            }
          }
        }
        setGeneratedTests([{
          id: `test-${Date.now()}`,
          name: `${type} test`,
          code: text,
          type: type as GeneratedTest['type'],
          framework: framework as GeneratedTest['framework'],
          status: 'pending',
        }]);
      }
    }).catch(() => toast.error('Failed to generate tests'))
    .finally(() => setIsAiAnalyzing(false));
  };

  // Get language-specific system prompt addition
  const getLanguagePromptAddition = (lang: ProgrammingLanguage): string => {
    const languagePrompts: Partial<Record<ProgrammingLanguage, string>> = {
      html: 'Generate a complete, self-contained HTML file with embedded CSS and JavaScript. The output should start with <!DOCTYPE html>.',
      javascript:
        'Generate clean, modern JavaScript code with ES6+ syntax. Include comments explaining key parts.',
      typescript:
        'Generate TypeScript code with proper type annotations and interfaces. Include JSDoc comments.',
      python:
        'Generate clean Python 3 code following PEP 8 style guidelines. Include docstrings and type hints.',
      react:
        'Generate a React functional component with hooks. Use TypeScript and Tailwind CSS classes. Export the component.',
      nextjs:
        'Generate Next.js 14 code using App Router with TypeScript. Use Server Components where appropriate.',
      vue: 'Generate a Vue 3 component using Composition API with TypeScript and <script setup> syntax.',
      svelte: 'Generate a Svelte component with TypeScript support.',
      css: 'Generate modern CSS with custom properties, flexbox/grid, and responsive design.',
      tailwind:
        'Generate HTML with Tailwind CSS classes. Use utility-first approach with proper responsive classes.',
      nodejs:
        'Generate Node.js code with ES modules (import/export). Include error handling and async/await.',
      express:
        'Generate Express.js code with proper middleware, routing, and error handling.',
      sql: 'Generate SQL code compatible with PostgreSQL. Include proper constraints and indexes.',
      bash: 'Generate a Bash script with proper shebang, error handling, and comments.',
      json: 'Generate properly formatted JSON with appropriate structure.',
      markdown:
        'Generate well-structured Markdown with proper headings, lists, and formatting.',
      angular:
        'Generate Angular component with TypeScript. Use standalone components and signals where appropriate.',
      sass: 'Generate SCSS/Sass code with proper nesting, variables, and mixins.',
      fastapi:
        'Generate FastAPI code with type hints, Pydantic models, and async endpoints.',
      django:
        'Generate Django code following Django best practices with models, views, and templates.',
      flask:
        'Generate Flask application code with proper blueprints and error handling.',
      java: 'Generate Java code following modern Java conventions with proper OOP patterns.',
      spring:
        'Generate Spring Boot code with annotations, dependency injection, and REST controllers.',
      go: 'Generate Go code following Go idioms with proper error handling and goroutines.',
      rust: 'Generate Rust code with proper ownership, borrowing, and error handling patterns.',
      csharp:
        'Generate C# code with modern .NET conventions, async/await, and LINQ.',
      dotnet:
        'Generate .NET code with proper project structure and dependency injection.',
      php: 'Generate modern PHP 8+ code with type declarations and named arguments.',
      laravel:
        'Generate Laravel code with Eloquent models, controllers, and blade templates.',
      ruby: 'Generate Ruby code following Ruby style conventions and best practices.',
      rails:
        'Generate Ruby on Rails code with proper MVC structure and Active Record.',
      postgresql:
        'Generate PostgreSQL-specific SQL with advanced features like CTEs and window functions.',
      mongodb:
        'Generate MongoDB queries and aggregation pipelines with proper indexing.',
      prisma:
        'Generate Prisma schema and client code with proper relations and types.',
      graphql:
        'Generate GraphQL schema definitions with resolvers and type definitions.',
      reactnative:
        'Generate React Native code with proper native components and navigation.',
      flutter:
        'Generate Flutter/Dart code with proper widget composition and state management.',
      swift:
        'Generate Swift code with proper protocols, optionals, and SwiftUI patterns.',
      kotlin:
        'Generate Kotlin code with coroutines, data classes, and null safety.',
      docker:
        'Generate Dockerfile and docker-compose.yml with proper multi-stage builds.',
      kubernetes:
        'Generate Kubernetes YAML manifests with proper resource definitions.',
      terraform:
        'Generate Terraform HCL code with proper provider configuration and modules.',
      powershell:
        'Generate PowerShell script with proper cmdlets and error handling.',
      yaml: 'Generate properly structured YAML with appropriate indentation.',
      xml: 'Generate well-formed XML with proper namespaces and schema.',
      jupyter:
        'Generate Jupyter notebook cells with proper markdown and code cells.',
      r: 'Generate R code with tidyverse conventions and proper data manipulation.',
      c: 'Generate C code with proper memory management, header files, and standard library usage. Include main() function and comments.',
      cpp: 'Generate modern C++ code (C++17/20) with RAII, smart pointers, STL containers, and proper const-correctness. Include main() function.',
    };
    return languagePrompts[lang] || '';
  };

  // Helper function for sidebar animation classes
  const getSidebarItemClass = (
    index: number,
    baseClass: string,
    activeClass: string,
    inactiveClass: string,
    isActive: boolean
  ) => {
    const isHighlighted =
      sidebarHighlightIndex === index && !hasSeenSidebarAnimation;
    const highlightClass = isHighlighted
      ? 'animate-pulse ring-2 ring-indigo-400 ring-opacity-75 scale-110 bg-indigo-600/30 text-indigo-300'
      : '';
    return `${baseClass} ${isActive ? activeClass : inactiveClass} ${highlightClass}`;
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#0a0a0a] text-slate-700 dark:text-slate-300 overflow-hidden">
      <Overlay active={showOverlay} onActivate={() => setShowOverlay(false)} />

      {/* ============================================================ */}
      {/* APP FRAME — 4 border strips that define the viewport boundary */}
      {/* ============================================================ */}
      {/* Top border — same height as toolbar header (h-13 = 52px) */}
      <div className="fixed top-0 left-0 right-0 h-13 z-[65] bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-white/[0.06]" />
      {/* Bottom border — slim footer strip */}
      <div className="fixed bottom-0 left-0 right-0 h-7 z-[65] bg-white dark:bg-[#0a0a0a] border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between px-4">
        <span className="text-[10px] text-slate-500 tracking-wide">Canvas Studio <span className="text-slate-900 dark:text-white/20 mx-1">·</span> Powered by Mumtaz AI</span>
        {activePlan && <PlanStatusBar plan={activePlan} />}
      </div>
      {/* Left border — slim vertical strip */}
      <div className="fixed top-0 bottom-0 left-0 w-[3px] z-[65] bg-white dark:bg-[#0a0a0a]" />
      {/* Right border — slim vertical strip */}
      <div className="fixed top-0 bottom-0 right-0 w-[3px] z-[65] bg-white dark:bg-[#0a0a0a]" />

      {/* ===== AUTH PROMPT POPUP — shown when unauthenticated user tries to use a feature ===== */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setShowAuthPrompt(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-400 dark:bg-black/60 backdrop-blur-sm" />
          {/* Modal */}
          <div className="relative max-w-sm w-full animate-in zoom-in-95 fade-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-7 shadow-2xl shadow-black/50">
              {/* Close button */}
              <button
                onClick={() => setShowAuthPrompt(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center mb-5 border border-violet-500/20">
                  <Sparkles className="w-7 h-7 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">Sign in to continue</h2>
                <p className="text-slate-600 dark:text-slate-400 text-xs mb-6 leading-relaxed">
                  Create a free account or log in to start building with AI.
                </p>
                <div className="flex flex-col gap-2.5 w-full">
                  <a
                    href={`https://mumtaz.ai/auth/login?redirect=${authRedirect}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white font-semibold text-sm hover:from-violet-400 hover:to-violet-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <LogIn className="w-4 h-4" />
                    Log In
                  </a>
                  <a
                    href={`https://mumtaz.ai/auth/signup?redirect=${authRedirect}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/[0.12] text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:border-white/[0.2] transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Free Account
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAuthPrompt(false)}
              className="w-full text-center mt-4 text-slate-500 text-xs hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Maybe later — just looking around
            </button>
          </div>
        </div>
      )}

      {/* Plan gate — handled on-demand when user triggers AI features (403 → PricingPaywall) */}
      {/* ===== END AUTH & PLAN GATE ===== */}

      {/* Thank You Toast — shows after successful Stripe checkout */}
      {showThankYou && (
        <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-slate-50 dark:bg-[#1a1a2e] border border-violet-500/30 rounded-2xl p-5 shadow-2xl shadow-emerald-500/10 max-w-sm">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-slate-900 dark:text-white" />
              </div>
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-1">
                  🎉 Welcome to Mumtaz AI Studio!
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Your plan is now active. Start building amazing apps with AI —
                  describe what you want below!
                </p>
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 dark:bg-white/5 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-400 to-violet-500 rounded-full animate-[shrink_6s_linear_forwards]"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CORNER LOGO BUTTONS — Only visible when a project is active */}
      {/* ============================================================ */}

      {/* LEFT CORNER — Company logo */}
      <div className="fixed top-2 left-3 z-[80] flex items-center transition-opacity duration-300">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-[#111]/90 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] shadow-lg"
          title="Mumtaz AI"
        >
          <img src="/icons/icon-96x96.png" alt="Mumtaz AI" className="w-5 h-5 rounded-sm" />
        </div>
      </div>

      {/* RIGHT CORNER BUTTONS — 4 icons: Create, Dev, Editor, Canvas */}
      <div className="fixed top-2 right-3 z-[80] flex items-center gap-1.5 transition-opacity duration-300">
        {/* Sparkle — Opens Create toolbar (Chat, Templates, Drafts, etc.) */}
        <div className={`transition-all duration-300 overflow-hidden ${devToolbarOpen || canvasToolbarOpen ? 'w-0 opacity-0' : 'w-9 opacity-100'}`}>
          <button
            onClick={() => {
              const opening = !leftToolbarOpen;
              setLeftToolbarOpen(opening);
              if (!opening) setLeftPanelOpen(false);
              if (opening) {
                setDevToolbarOpen(false);
                setCanvasToolbarOpen(false);
              }
            }}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-md ${
              leftToolbarOpen
                ? 'bg-gradient-to-br from-violet-500 to-violet-500 shadow-violet-500/25 scale-95'
                : 'bg-white dark:bg-[#111]/90 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] hover:border-violet-500/30 hover:shadow-violet-500/15 hover:scale-105'
            }`}
            title="Create"
          >
            <Sparkles
              className={`w-[18px] h-[18px] transition-all duration-300 ${leftToolbarOpen ? 'text-slate-900 dark:text-white rotate-180' : 'text-violet-400'}`}
            />
          </button>
        </div>

        {/* Code — Opens Dev Tools toolbar (Files, Build, DB, Git, etc.) */}
        <div className={`transition-all duration-300 overflow-hidden ${leftToolbarOpen || canvasToolbarOpen ? 'w-0 opacity-0' : 'w-9 opacity-100'}`}>
          <button
            onClick={() => {
              const opening = !devToolbarOpen;
              setDevToolbarOpen(opening);
              if (!opening) setLeftPanelOpen(false);
              if (opening) {
                setLeftToolbarOpen(false);
                setCanvasToolbarOpen(false);
              }
            }}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-md ${
              devToolbarOpen
                ? 'bg-gradient-to-br from-violet-500 to-violet-500 shadow-emerald-500/25 scale-95'
                : 'bg-white dark:bg-[#111]/90 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] hover:border-violet-500/30 hover:shadow-emerald-500/15 hover:scale-105'
            }`}
            title="Dev Tools"
          >
            <Code2
              className={`w-[18px] h-[18px] transition-all duration-300 ${devToolbarOpen ? 'text-slate-900 dark:text-white rotate-180' : 'text-violet-400'}`}
            />
          </button>
        </div>

        {/* Canvas Icon — Opens Canvas/Deploy toolbar */}
        <div className={`transition-all duration-300 overflow-hidden ${leftToolbarOpen || devToolbarOpen ? 'w-0 opacity-0' : 'w-9 opacity-100'}`}>
          <button
            onClick={() => {
              const opening = !canvasToolbarOpen;
              setCanvasToolbarOpen(opening);
              if (opening) {
                setLeftToolbarOpen(false);
                setDevToolbarOpen(false);
                setLeftPanelOpen(false);
              }
            }}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-md ${
              canvasToolbarOpen
                ? 'bg-gradient-to-br from-violet-500 to-pink-500 shadow-violet-500/25 scale-95'
                : 'bg-white dark:bg-[#111]/90 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] hover:border-violet-500/30 hover:shadow-violet-500/15 hover:scale-105'
            }`}
            title="Canvas Tools"
          >
            <Paintbrush
              className={`w-[18px] h-[18px] transition-all duration-300 ${canvasToolbarOpen ? 'text-slate-900 dark:text-white rotate-12' : 'text-violet-400'}`}
            />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PANEL TOOLS HEADER BAR — Slides from right to left across the top */}
      {/* ============================================================ */}
      <div
        className={`fixed top-0 left-[52px] right-[52px] h-13 z-[70] transition-all duration-400 ease-in-out overflow-hidden ${
          leftToolbarOpen
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-full pointer-events-none'
        }`}
      >
        <div className="h-full bg-white dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-2 px-4 rounded-xl shadow-2xl shadow-black/30 overflow-x-auto scrollbar-hide">
          {/* Brand */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-white/[0.06] mr-1">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-500 rounded-md flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-slate-900 dark:text-white" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                Canvas
              </h1>
              <p className="text-[9px] text-slate-500">Studio</p>
            </div>
          </div>

          {/* Create Tab Buttons — Agent, Chat, Quick Start, Templates, Drafts, History, Search */}
          {[
            { id: 'chat' as SidebarTab, label: 'Agent', icon: Bot, mode: 'agent' as const },
            { id: 'chat' as SidebarTab, label: 'Chat', icon: MessageSquare, mode: 'chat' as const },
            {
              id: 'quickstart' as SidebarTab,
              label: 'Quick Start',
              icon: Zap,
            },
            {
              id: 'templates' as SidebarTab,
              label: 'Templates',
              icon: LayoutTemplate,
            },
            { id: 'drafts' as SidebarTab, label: 'Drafts', icon: Archive },
            { id: 'history' as SidebarTab, label: 'History', icon: Clock },
            { id: 'search' as SidebarTab, label: 'Search', icon: Search },
          ].map((tab) => (
            <button
              key={tab.mode ? `${tab.id}-${tab.mode}` : tab.id}
              onClick={() => {
                if (tab.mode) {
                  setChatMode(tab.mode);
                }
                if (sidebarTab === tab.id && leftPanelOpen && (!tab.mode || chatMode === tab.mode)) {
                  setLeftPanelOpen(false);
                } else {
                  setSidebarTab(tab.id);
                  setLeftPanelOpen(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                sidebarTab === tab.id && leftPanelOpen && (!tab.mode || chatMode === tab.mode)
                  ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}

          {/* Compact prompt input */}
          <div className="ml-auto flex items-center gap-2 flex-1 max-w-[280px]">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && prompt.trim()) {
                  handleGenerate(prompt, true);
                  setSidebarTab('chat');
                  setLeftPanelOpen(true);
                }
              }}
              placeholder="Describe app..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-white/[0.08] rounded-lg focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/30 outline-none bg-slate-100 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 placeholder-gray-600 min-w-0"
            />
            <button
              onClick={() => {
                handleGenerate(prompt, true);
                setSidebarTab('chat');
                setLeftPanelOpen(true);
              }}
              disabled={genState.isGenerating || !prompt.trim()}
              className="w-8 h-8 bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white rounded-lg flex items-center justify-center hover:from-violet-600 hover:to-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
              title="Generate"
            >
              <Play className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DEV TOOLS HEADER BAR — Files, Build, DB, Git, etc.         */}
      {/* ============================================================ */}
      <div
        className={`fixed top-0 left-[52px] right-[52px] h-13 z-[70] transition-all duration-400 ease-in-out overflow-hidden ${
          devToolbarOpen
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-full pointer-events-none'
        }`}
      >
        <div className="h-full bg-white dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-2 px-4 rounded-xl shadow-2xl shadow-black/30 overflow-x-auto scrollbar-hide">
          {/* Brand */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-white/[0.06] mr-1">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-500 rounded-md flex items-center justify-center">
              <Code2 className="w-4 h-4 text-slate-900 dark:text-white" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xs font-bold text-slate-900 dark:text-white leading-none">Dev</h1>
              <p className="text-[9px] text-slate-500">Tools</p>
            </div>
          </div>

          {/* Dev Tab Buttons */}
          {[
            { id: 'files' as SidebarTab, label: 'Files', icon: FolderTree },
            { id: 'build' as SidebarTab, label: 'Build', icon: Hammer },
            { id: 'assets' as SidebarTab, label: 'Assets', icon: FolderOpen },
            { id: 'database' as SidebarTab, label: 'DB', icon: Database },
            { id: 'git' as SidebarTab, label: 'Git', icon: GitBranch },
            { id: 'deps' as SidebarTab, label: 'Deps', icon: Package },
            { id: 'env' as SidebarTab, label: 'Env', icon: Lock },
            { id: 'images' as SidebarTab, label: 'Images', icon: Image },
            { id: 'monitor' as SidebarTab, label: 'Monitor', icon: Activity },
            { id: 'agent' as SidebarTab, label: 'Agent', icon: Bot },
            { id: 'video' as SidebarTab, label: 'Video', icon: Film },
            { id: 'ai' as SidebarTab, label: 'AI', icon: Wand2 },
            { id: 'billing' as SidebarTab, label: 'Billing', icon: Receipt },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (sidebarTab === tab.id && leftPanelOpen) {
                  setLeftPanelOpen(false);
                } else {
                  setSidebarTab(tab.id);
                  setLeftPanelOpen(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                sidebarTab === tab.id && leftPanelOpen
                  ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CANVAS HEADER BAR — Canvas toolbar (slides right to left)   */}
      {/* ============================================================ */}
      <div
        className={`fixed top-0 left-[52px] right-[52px] h-13 z-[70] transition-all duration-400 ease-in-out overflow-hidden ${
          canvasToolbarOpen
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-full pointer-events-none'
        }`}
      >
        <div className="h-full bg-white dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-3 px-4 rounded-xl shadow-2xl shadow-black/30 overflow-x-auto scrollbar-hide">
          {/* Canvas label */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-white/[0.06] mr-1">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-md flex items-center justify-center">
              <Paintbrush className="w-4 h-4 text-slate-900 dark:text-white" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xs font-bold text-slate-900 dark:text-white leading-none">Canvas</h1>
              <p className="text-[9px] text-slate-500">Tools</p>
            </div>
          </div>

          {/* Voice Input */}
          <button
            onClick={() => setShowVoiceInput(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
            title="Voice Input"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Image to Code */}
          <button
            onClick={() => setShowImageToCode(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
            title="Image to Code"
          >
            <Image className="w-4 h-4" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Hosting Dashboard */}
          <button
            onClick={() => {
              setSidebarTab('monitor');
              setLeftPanelOpen(true);
              setCanvasToolbarOpen(false);
            }}
            className="px-3 py-2 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg hover:border-violet-500/30 hover:text-violet-300 transition-all active:scale-95 flex items-center gap-1.5"
            title="Hosting Dashboard"
          >
            <Globe className="w-3.5 h-3.5" />
            HOSTING
          </button>

          {/* Rollback */}
          <button
            onClick={() => {
              setShowRollbackPanel(true);
              setCanvasToolbarOpen(false);
            }}
            className="px-3 py-2 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg hover:border-orange-500/30 hover:text-orange-300 transition-all active:scale-95 flex items-center gap-1.5"
            title="Rollback Deployments"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ROLLBACK
          </button>

          {/* Analytics Button */}
          <button
            onClick={() => {
              setShowAnalytics(true);
              setCanvasToolbarOpen(false);
            }}
            className="px-4 py-2 bg-white dark:bg-[#111] border border-violet-500/30 text-violet-400 text-xs font-bold rounded-lg hover:border-violet-400/60 hover:text-violet-300 transition-all active:scale-95 flex items-center gap-2"
            title="Usage Analytics"
          >
            <Activity className="w-4 h-4" />
            ANALYTICS
          </button>

          {/* Intro Button */}
          <button
            onClick={() => setShowOverlay(true)}
            className="px-4 py-2 bg-white dark:bg-[#111] border border-violet-500/30 text-violet-400 text-xs font-bold rounded-lg hover:border-violet-400/60 hover:text-violet-300 transition-all active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            INTRO
          </button>

          {/* Deploy Button */}
          <button
            onClick={() => setShowDeployPanel(true)}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white text-xs font-bold rounded-lg hover:from-violet-600 hover:to-violet-600 transition-all shadow-lg shadow-violet-500/15 active:scale-95 flex items-center gap-2"
          >
            <Rocket className="w-4 h-4" />
            DEPLOY
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN BODY — Full screen with optional side panels */}
      {/* ============================================================ */}
      <div className="flex-1 flex min-h-0 overflow-hidden pt-[52px] pb-7 px-[3px]">
        {/* LEFT PANEL — Opens when a tab is selected from left header bar */}
        <aside
          className={`shrink-0 flex flex-col bg-slate-50 dark:bg-[#0d0d0d]/95 backdrop-blur-xl border-r border-slate-200 dark:border-white/[0.06] transition-all duration-300 ease-in-out overflow-hidden ${
            leftPanelOpen
              ? FULLSCREEN_TABS.has(sidebarTab)
                ? 'flex-1'
                : 'w-[320px]'
              : 'w-0 border-r-0'
          }`}
        >
          <div className={`${FULLSCREEN_TABS.has(sidebarTab) ? 'w-full' : 'w-[320px]'} h-full flex flex-col`}>
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                {sidebarTab === 'chat' && chatMode === 'agent' && (
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'chat' && chatMode === 'chat' && (
                  <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'files' && (
                  <FolderTree className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'quickstart' && (
                  <Zap className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'templates' && (
                  <LayoutTemplate className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'drafts' && (
                  <Archive className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'history' && (
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'build' && (
                  <Hammer className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'assets' && (
                  <FolderOpen className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'database' && (
                  <Database className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'monitor' && (
                  <Activity className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'agent' && (
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'video' && (
                  <Film className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'ai' && (
                  <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'git' && (
                  <GitBranch className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'deps' && (
                  <Package className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'env' && (
                  <Lock className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'search' && (
                  <Search className="w-3.5 h-3.5 text-violet-400" />
                )}
                {sidebarTab === 'billing' && (
                  <Receipt className="w-3.5 h-3.5 text-violet-400" />
                )}
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {sidebarTab === 'chat' ? (chatMode === 'agent' ? 'Agent' : 'Chat') : sidebarTab === 'quickstart' ? 'Quick Start' : sidebarTab === 'database' ? 'Database' : sidebarTab === 'deps' ? 'Dependencies' : sidebarTab === 'env' ? 'Environment' : sidebarTab === 'ai' ? 'AI Tools' : sidebarTab}
                </span>
                {sidebarTab === 'chat' && (
                  <div className="flex items-center ml-2 bg-slate-100 dark:bg-white/[0.04] rounded-md p-0.5">
                    <button
                      onClick={() => setChatMode('agent')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${chatMode === 'agent' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      Agent
                    </button>
                    <button
                      onClick={() => setChatMode('chat')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${chatMode === 'chat' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      Chat
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLeftPanelOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/[0.04] transition-all"
                  title="Close panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {sidebarTab === 'chat' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <ChatBox
                    messages={currentApp?.history || []}
                    onSendMessage={(text, attachments) =>
                      chatMode === 'agent'
                        ? handleChatMessage(text, attachments)
                        : handlePureChatMessage(text, attachments)
                    }
                    isGenerating={genState.isGenerating}
                    streamingText={chatMode === 'agent' ? chatStreamingText : undefined}
                    fileOperations={chatMode === 'agent' ? streamingFileOps : undefined}
                    onNewChat={handleNewChat}
                    onStopGeneration={handleStopGeneration}
                  />
                </div>
              )}
              {sidebarTab === 'files' && (
                <div className="flex-1 overflow-hidden">
                  <FileTree
                    files={projectFiles}
                    activeFile={activeFilePath}
                    onFileSelect={(path) => {
                      setActiveFilePath(path);
                      setViewMode('code');
                    }}
                    onFileCreate={(path) => {
                      editorBridge.createFile(path, '');
                      setProjectFiles(editorBridge.getProjectTree());
                      setActiveFilePath(path);
                      setViewMode('code');
                    }}
                    onFileDelete={(path) => {
                      editorBridge.deleteFile(path);
                      setProjectFiles(editorBridge.getProjectTree());
                      if (activeFilePath === path) {
                        const paths = editorBridge.getAllFilePaths();
                        setActiveFilePath(paths[0] || null);
                      }
                    }}
                    onFileRename={(oldPath, newPath) => {
                      editorBridge.renameFile(oldPath, newPath);
                      setProjectFiles(editorBridge.getProjectTree());
                      if (activeFilePath === oldPath) {
                        setActiveFilePath(newPath);
                      }
                    }}
                    darkMode={true}
                  />
                </div>
              )}
              {sidebarTab === 'quickstart' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {/* Prompt Input Box */}
                  <div className="p-3 border-b border-slate-200 dark:border-white/[0.06]">
                    <div className="relative mb-2">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                            e.preventDefault();
                            handleGenerate(prompt, true);
                            setSidebarTab('chat');
                            setLeftPanelOpen(true);
                          }
                        }}
                        placeholder="Describe the app you want to build... (Enter to generate)"
                        rows={3}
                        className="w-full px-3 py-2.5 text-xs bg-white dark:bg-[#111] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30 outline-none text-slate-700 dark:text-slate-300 placeholder-gray-600 resize-none leading-relaxed"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (prompt.trim()) {
                          handleGenerate(prompt, true);
                          setSidebarTab('chat');
                          setLeftPanelOpen(true);
                        }
                      }}
                      disabled={genState.isGenerating || !prompt.trim()}
                      className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white text-xs font-bold rounded-xl hover:from-violet-600 hover:to-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {genState.isGenerating ? 'Generating...' : 'Generate App'}
                    </button>
                  </div>

                  {/* Quick Start Categories */}
                  {(() => {
                    const categories = Array.from(new Set(PRESET_TEMPLATES.map((t) => t.category)));
                    return categories.map((cat) => (
                      <div key={cat}>
                        <div className="px-3 pt-3 pb-1.5 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
                          <div className="flex-1 h-px bg-slate-100 dark:bg-white/[0.04]" />
                        </div>
                        <div className="px-2 space-y-1 pb-1">
                          {PRESET_TEMPLATES.filter((t) => t.category === cat).map((tpl) => (
                            <div
                              key={tpl.name}
                              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg border cursor-pointer transition-all ${
                                prompt === tpl.prompt
                                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                                  : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] hover:bg-violet-500/8 hover:border-violet-500/20 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              <span className="text-base shrink-0 leading-none">{tpl.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{tpl.name}</p>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {tpl.tags.map((tag) => (
                                    <span key={tag} className="text-[9px] text-slate-600 bg-slate-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded">#{tag}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setPrompt(tpl.prompt)}
                                  className="px-2 py-1 text-[10px] font-semibold bg-slate-200 dark:bg-white/[0.06] hover:bg-white/[0.10] text-slate-700 dark:text-slate-300 rounded transition-all"
                                  title="Load prompt"
                                >
                                  Load
                                </button>
                                <button
                                  onClick={() => {
                                    setPrompt(tpl.prompt);
                                    handleGenerate(tpl.prompt, true);
                                    setSidebarTab('chat');
                                    setLeftPanelOpen(true);
                                  }}
                                  disabled={genState.isGenerating}
                                  className="px-2 py-1 text-[10px] font-bold bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white rounded transition-all disabled:opacity-40"
                                  title="Generate now"
                                >
                                  ▶ Build
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                  <div className="h-4" />
                </div>
              )}
              {sidebarTab === 'templates' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Search */}
                  <div className="p-3 border-b border-slate-200 dark:border-white/[0.06]">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search templates..."
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-[#111] border border-slate-200 dark:border-white/[0.08] rounded-lg focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/30 outline-none text-slate-700 dark:text-slate-300 placeholder-gray-600"
                      />
                    </div>
                  </div>
                  {/* Language chips */}
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-white/[0.06] overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSelectedLanguage('all')}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all ${
                          selectedLanguage === 'all'
                            ? 'bg-violet-500 text-slate-900 dark:text-white'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        All
                      </button>
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => setSelectedLanguage(lang.id)}
                          className={`px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                            selectedLanguage === lang.id
                              ? 'text-slate-900 dark:text-white'
                              : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                          }`}
                          style={selectedLanguage === lang.id ? { backgroundColor: lang.color } : {}}
                        >
                          <span className="text-[10px]">{lang.icon}</span>
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Template list */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    {(() => {
                      const filtered = TEMPLATES.filter((t) => {
                        const matchLang = selectedLanguage === 'all' || t.language === selectedLanguage;
                        const matchSearch =
                          !templateSearch ||
                          t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                          t.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
                          t.tags?.some((tag) => tag.toLowerCase().includes(templateSearch.toLowerCase()));
                        return matchLang && matchSearch;
                      });
                      if (filtered.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <LayoutTemplate className="w-8 h-8 text-slate-600 mb-2" />
                            <p className="text-xs text-slate-500">No templates found</p>
                            <p className="text-[10px] text-slate-600 mt-1">Try a different filter or search</p>
                          </div>
                        );
                      }
                      return filtered.map((template) => (
                        <div
                          key={template.id}
                          className="bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg p-3 hover:border-violet-500/20 transition-all"
                        >
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="text-sm shrink-0">
                              {LANGUAGES.find((l) => l.id === template.language)?.icon || '📄'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{template.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{template.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleUseTemplate(template)}
                              className="flex-1 py-1.5 bg-gradient-to-r from-violet-500 to-violet-500 hover:from-violet-600 hover:to-violet-600 text-slate-900 dark:text-white text-[10px] font-bold rounded-md transition-all"
                            >
                              Use
                            </button>
                            <button
                              onClick={() => { setViewOverlayTemplate(template); setTemplatesPanelOpen(true); }}
                              className="flex-1 py-1.5 bg-slate-100 dark:bg-white/[0.04] hover:bg-violet-500/10 border border-slate-200 dark:border-white/[0.08] hover:border-violet-500/30 text-slate-600 dark:text-slate-400 hover:text-violet-300 text-[10px] font-bold rounded-md transition-all"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  {/* Footer count */}
                  <div className="px-3 py-2 border-t border-slate-200 dark:border-white/[0.06] text-center">
                    <span className="text-[10px] text-slate-600">
                      {TEMPLATES.filter((t) => {
                        const matchLang = selectedLanguage === 'all' || t.language === selectedLanguage;
                        const matchSearch =
                          !templateSearch ||
                          t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                          t.description.toLowerCase().includes(templateSearch.toLowerCase());
                        return matchLang && matchSearch;
                      }).length} templates
                    </span>
                  </div>
                </div>
              )}
              {sidebarTab === 'drafts' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Header with count */}
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saved Drafts</span>
                    <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-semibold">{drafts.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {drafts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center">
                          <Archive className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">No Drafts Yet</p>
                          <p className="text-[10px] text-slate-600 leading-relaxed">Start a new chat to auto-save your current work as a draft.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {drafts.map((draft) => (
                          <div
                            key={draft.id}
                            className="group bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 hover:border-violet-500/25 hover:bg-violet-500/5 transition-all cursor-pointer"
                            onClick={() => {
                              handleRestoreDraft(draft.id);
                              setViewMode('desktop');
                            }}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-6 h-6 rounded-md bg-violet-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                                  <Archive className="w-3 h-3 text-violet-400" />
                                </div>
                                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{draft.name}</h4>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeDraft(draft.id); }}
                                className="p-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 rounded hover:bg-red-400/10"
                                title="Delete draft"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2 mb-2 ml-8 leading-relaxed">{draft.prompt || 'No prompt'}</p>
                            <div className="flex items-center justify-between ml-8">
                              <span className="text-[9px] text-slate-600">
                                {new Date(draft.savedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] text-violet-400 font-medium">Click to open →</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {sidebarTab === 'history' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* History header */}
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">History</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-200 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{historyEntries.length}</span>
                      {historyEntries.length > 0 && (
                        <button
                          onClick={() => setHistoryEntries([])}
                          className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-red-400/10"
                          title="Clear all history"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2">
                    {historyEntries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center">
                          <Clock className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">No History Yet</p>
                          <p className="text-[10px] text-slate-600">Generated apps will appear here.</p>
                        </div>
                      </div>
                    ) : (
                      historyEntries.map((entry) => {
                        const app = history.find((a) => a.id === entry.id);
                        return (
                          <HistoryCard
                            key={entry.id}
                            entry={entry}
                            onRestore={() => { if (app) { setCurrentApp(app); setViewMode('desktop'); setSidebarTab('chat'); } }}
                            onPreview={() => { if (app) { setCurrentApp(app); setViewMode('desktop'); } }}
                            onBookmark={() => setHistoryEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, isBookmarked: !e.isBookmarked } : e))}
                            onDelete={() => setHistoryEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                            onDownload={() => {
                              if (!app) return;
                              const content = typeof app.code === 'string' ? app.code : JSON.stringify(app.code, null, 2);
                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${entry.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              )}
              {sidebarTab === 'build' && (
                <div className="flex-1 overflow-hidden">
                  <BuildPanel projectId={currentApp?.id || 'default'} />
                </div>
              )}
              {sidebarTab === 'assets' && (
                <div className="flex-1 overflow-hidden">
                  <AssetBrowser
                    projectId={currentApp?.id || 'default'}
                    onInsertUrl={(url) => {
                      if (activeFilePath) {
                        const file = editorBridge.getFile(activeFilePath);
                        const current = file?.content || '';
                        editorBridge.updateFile(
                          activeFilePath,
                          current + `\n/* Asset: ${url} */\n`
                        );
                      }
                    }}
                  />
                </div>
              )}
              {sidebarTab === 'database' && (
                <div className="flex-1 overflow-hidden">
                  <DatabasePanel projectId={currentApp?.id || 'default'} />
                </div>
              )}
              {sidebarTab === 'monitor' && (
                <div className="flex-1 overflow-hidden">
                  <MonitoringDashboard
                    projectId={currentApp?.id || 'default'}
                  />
                </div>
              )}
              {sidebarTab === 'agent' && (
                <div className="flex-1 overflow-hidden">
                  <AgentPanel projectId={currentApp?.id || 'default'} />
                </div>
              )}
              {sidebarTab === 'video' && (
                <div className="flex-1 overflow-hidden">
                  <VideoEditorPanel />
                </div>
              )}

              {/* ── AI Tools Panel ── */}
              {sidebarTab === 'ai' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* AI sub-tabs */}
                  <div className="flex border-b border-slate-200 dark:border-white/[0.06] shrink-0">
                    {([
                      { id: 'autofix' as AiSubTab, label: 'Autofix', icon: Zap },
                      { id: 'explain' as AiSubTab, label: 'Explain', icon: MessageSquare },
                      { id: 'refactor' as AiSubTab, label: 'Refactor', icon: Wand2 },
                      { id: 'tests' as AiSubTab, label: 'Tests', icon: CheckCircle },
                    ] as const).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAiSubTab(tab.id)}
                        className={`flex-1 px-2 py-2 text-[10px] font-medium transition-all ${
                          aiSubTab === tab.id
                            ? 'text-violet-300 border-b-2 border-violet-500'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <tab.icon className="w-3 h-3 mx-auto mb-0.5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {aiSubTab === 'autofix' && (
                      <AIAutofix
                        errors={codeErrors}
                        onFix={handleAIAutofix}
                        onFixAll={handleAIFixAll}
                        onNavigate={(file, line) => {
                          setActiveFilePath(file.startsWith('/') ? file : `/${file}`);
                          setViewMode('code');
                        }}
                        isAnalyzing={isAiAnalyzing}
                      />
                    )}
                    {aiSubTab === 'explain' && (
                      <AIExplain
                        selectedCode={activeFilePath ? editorBridge.getFile(activeFilePath)?.content?.slice(0, 500) : undefined}
                        selectedFile={activeFilePath || undefined}
                        explanation={aiExplanation}
                        isLoading={isAiAnalyzing}
                        onExplain={handleAIExplain}
                      />
                    )}
                    {aiSubTab === 'refactor' && (
                      <AIRefactor
                        suggestions={refactorSuggestions}
                        onApply={handleAIRefactorApply}
                        onDismiss={(id) => setRefactorSuggestions((prev) => prev.filter((s) => s.id !== id))}
                        onRefresh={handleAIRefactorRefresh}
                        onNavigate={(file, line) => {
                          setActiveFilePath(file.startsWith('/') ? file : `/${file}`);
                          setViewMode('code');
                        }}
                        isAnalyzing={isAiAnalyzing}
                      />
                    )}
                    {aiSubTab === 'tests' && (
                      <AITestWriter
                        selectedCode={activeFilePath ? editorBridge.getFile(activeFilePath)?.content : undefined}
                        selectedFile={activeFilePath || undefined}
                        tests={generatedTests}
                        onGenerate={handleGenerateTests}
                        onRunTest={(id) => toast.info('Test runner connected — run tests in terminal')}
                        onRunAll={() => toast.info('Run all tests in terminal')}
                        onCopyTest={(code) => {
                          navigator.clipboard.writeText(code);
                          toast.success('Test code copied!');
                        }}
                        onAddToProject={(test) => {
                          const testPath = `/tests/${test.name.replace(/\s+/g, '-')}.test.ts`;
                          editorBridge.createFile(testPath, test.code);
                          setProjectFiles(editorBridge.getProjectTree());
                          toast.success(`Added ${testPath}`);
                        }}
                        isGenerating={isAiAnalyzing}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* ── Git Panel ── */}
              {sidebarTab === 'git' && (
                <div className="flex-1 overflow-hidden">
                  <GitPanel projectId={currentApp?.id || 'default'} />
                </div>
              )}

              {/* ── Dependencies Panel ── */}
              {sidebarTab === 'deps' && (
                <div className="flex-1 overflow-hidden">
                  <DependenciesPanel projectId={currentApp?.id || 'default'} />
                </div>
              )}

              {/* ── Environment Variables ── */}
              {sidebarTab === 'env' && (
                <div className="flex-1 overflow-hidden">
                  <EnvironmentVars projectId={currentApp?.id || 'default'} />
                </div>
              )}

              {/* ── Image Tools Panel ── */}
              {sidebarTab === 'images' && (
                <div className="flex-1 overflow-hidden">
                  <ImagePanel projectId={currentApp?.id || 'default'} />
                </div>
              )}

              {/* ── Search & Replace ── */}
              {sidebarTab === 'search' && (
                <div className="flex-1 overflow-hidden">
                  <SearchReplace
                    onSearch={(query, flags) => {
                      const allPaths = editorBridge.getAllFilePaths();
                      const results: string[] = [];
                      allPaths.forEach((p) => {
                        const file = editorBridge.getFile(p);
                        if (file?.content?.includes(query)) {
                          results.push(p);
                        }
                      });
                      if (results.length > 0) toast.info(`Found in ${results.length} file(s)`);
                      else toast.info('No results found');
                    }}
                    onReplace={(search, replace) => {
                      if (activeFilePath) {
                        const file = editorBridge.getFile(activeFilePath);
                        if (file?.content) {
                          editorBridge.updateFile(activeFilePath, file.content.replace(search, replace));
                          setProjectFiles(editorBridge.getProjectTree());
                          toast.success('Replaced in current file');
                        }
                      }
                    }}
                    onReplaceAll={(search, replace) => {
                      const allPaths = editorBridge.getAllFilePaths();
                      let count = 0;
                      allPaths.forEach((p) => {
                        const file = editorBridge.getFile(p);
                        if (file?.content?.includes(search)) {
                          editorBridge.updateFile(p, file.content.replaceAll(search, replace));
                          count++;
                        }
                      });
                      setProjectFiles(editorBridge.getProjectTree());
                      toast.success(`Replaced in ${count} file(s)`);
                    }}
                    onNavigateResult={(file, line, column) => {
                      setActiveFilePath(file.startsWith('/') ? file : `/${file}`);
                      setViewMode('code');
                    }}
                  />
                </div>
              )}

              {/* ── Billing Panel ── */}
              {sidebarTab === 'billing' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex border-b border-slate-200 dark:border-white/[0.06] shrink-0">
                    <button
                      onClick={() => setBillingSubTab('usage')}
                      className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${billingSubTab === 'usage' ? 'text-violet-300 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      <BarChart3 className="w-3 h-3 inline mr-1" />
                      Usage
                    </button>
                    <button
                      onClick={() => setBillingSubTab('invoices')}
                      className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${billingSubTab === 'invoices' ? 'text-violet-300 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      <Receipt className="w-3 h-3 inline mr-1" />
                      Invoices
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {billingSubTab === 'usage' && (
                      <UsageDashboard
                        metrics={usageMetrics}
                        plan={activePlan?.type || 'Free'}
                        billingCycle="monthly"
                        onUpgrade={() => setShowPricingPaywall(true)}
                      />
                    )}
                    {billingSubTab === 'invoices' && (
                      <InvoiceHistory
                        invoices={invoices}
                        onDownload={handleInvoiceDownload}
                        onViewDetails={handleInvoiceViewDetails}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </aside>

        {/* ============================================================ */}
        {/* CENTER — Full-screen Preview / Code Area (hidden when full-screen tab is open) */}
        {/* ============================================================ */}
        <main
          className={`flex-1 relative overflow-hidden bg-white dark:bg-[#0a0a0a] min-w-0 ${
            leftPanelOpen && FULLSCREEN_TABS.has(sidebarTab) ? 'hidden' : ''
          }`}
          onClick={() => {
            if (leftToolbarOpen) setLeftToolbarOpen(false);
            if (devToolbarOpen) setDevToolbarOpen(false);
          }}
        >
          {genState.isGenerating && (
            <div className="absolute inset-0 z-40 bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="w-14 h-14 border-[3px] border-violet-900/30 border-t-violet-400 rounded-full animate-spin mb-6" />
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {genState.progressMessage}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Refining UI components and logic...
              </p>
            </div>
          )}
          <div className="h-full flex flex-col">
            {editorMode === 'edit' &&
            (viewMode === 'code' || viewMode === 'split') ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Preview Toolbar — always visible so user can switch back */}
                {currentApp && <PreviewToolbar
                  device={viewMode === 'tablet' ? 'tablet' : viewMode === 'mobile' ? 'mobile' : 'desktop'}
                  onDeviceChange={(device) => setViewMode(device as PreviewViewMode)}
                  url={`preview://[Language: ${currentLanguage.toUpperCase()}] ${currentApp?.name || 'untitled'}`}
                  onRefresh={() => {
                    if (currentApp) {
                      const code = currentApp.code;
                      setCurrentApp({ ...currentApp, code: '' });
                      setTimeout(() => setCurrentApp((prev) => prev ? { ...prev, code } : null), 50);
                    }
                  }}
                  onOpenExternal={() => {
                    if (currentApp?.code) {
                      const blob = new Blob([currentApp.code], { type: 'text/html' });
                      window.open(URL.createObjectURL(blob), '_blank');
                    }
                  }}
                  showConsole={showConsole}
                  onToggleConsole={() => setShowConsole(!showConsole)}
                  showNetwork={showNetwork}
                  onToggleNetwork={() => setShowNetwork(!showNetwork)}
                  isLoading={genState.isGenerating}
                  navOpen={leftToolbarOpen || devToolbarOpen || canvasToolbarOpen}
                  currentLanguage={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                  languages={LANGUAGES}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onSetEditorMode={(mode: string) => {
                    if (chatMode === 'chat' && mode === 'edit') return;
                    setEditorMode(mode as EditorMode);
                  }}
                  onOpenSettings={() => setShowAppSettings(true)}
                  onCopy={() => {
                    if (currentApp?.code) navigator.clipboard.writeText(currentApp.code);
                  }}
                  onDownload={() => {
                    if (currentApp?.code) {
                      const blob = new Blob([currentApp.code], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = ['react', 'nextjs'].includes(currentLanguage) ? 'App.tsx' : 'index.html';
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                />}
                {/* Editor Tabs */}
                <EditorTabs
                  onTabSelect={(path) => {
                    setActiveFilePath(path);
                  }}
                  onTabClose={(path) => {
                    editorSettingsStore.closeTab(path);
                    if (activeFilePath === path) {
                      const tabs = editorSettingsStore.tabs;
                      const remaining = tabs.filter((t) => t.path !== path);
                      setActiveFilePath(remaining[0]?.path || null);
                    }
                  }}
                />
                <div className="flex-1 flex min-h-0">
                  {viewMode === 'split' && (
                    <div className="w-1/2 border-r border-slate-200 dark:border-white/[0.06]">
                      <SandpackPreview
                        code={typeof currentApp?.code === 'string' ? currentApp.code : ''}
                        language={currentLanguage}
                        viewMode="desktop"
                        files={useEditorStore.getState().files}
                        onViewModeChange={setViewMode}
                        onCodeChange={(newCode) => {
                          if (currentApp) {
                            const updatedApp = { ...currentApp, code: newCode };
                            setCurrentApp(updatedApp);
                            saveApp(updatedApp, false);
                          }
                        }}
                      />
                    </div>
                  )}
                  <div className={viewMode === 'split' ? 'w-1/2' : 'w-full'}>
                    <CodeEditor
                      filePath={activeFilePath || '/index.html'}
                      darkMode={true}
                      onSave={(content) => {
                        if (activeFilePath) {
                          editorBridge.updateFile(activeFilePath, content);
                          const newCode = editorBridge.toCode();
                          if (currentApp) {
                            const updatedApp = { ...currentApp, code: newCode };
                            setCurrentApp(updatedApp);
                            saveApp(updatedApp, false);
                          }
                        }
                      }}
                      onChange={() => {}}
                    />
                  </div>
                </div>
                {/* Editor Status Bar */}
                <EditorStatusBar
                  language={currentLanguage}
                  encoding="UTF-8"
                  gitBranch="main"
                  gitStatus="clean"
                  isConnected={true}
                  isSaving={false}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Preview Toolbar — only show when a project is active */}
                {currentApp && <PreviewToolbar
                  device={viewMode === 'tablet' ? 'tablet' : viewMode === 'mobile' ? 'mobile' : 'desktop'}
                  onDeviceChange={(device) => setViewMode(device as PreviewViewMode)}
                  url={`preview://${currentApp?.name || 'untitled'}`}
                  onRefresh={() => {
                    // Force re-render preview by briefly clearing code
                    if (currentApp) {
                      const code = currentApp.code;
                      setCurrentApp({ ...currentApp, code: '' });
                      setTimeout(() => setCurrentApp((prev) => prev ? { ...prev, code } : null), 50);
                    }
                  }}
                  onOpenExternal={() => {
                    if (currentApp?.code) {
                      const blob = new Blob([currentApp.code], { type: 'text/html' });
                      window.open(URL.createObjectURL(blob), '_blank');
                    }
                  }}
                  showConsole={showConsole}
                  onToggleConsole={() => setShowConsole(!showConsole)}
                  showNetwork={showNetwork}
                  onToggleNetwork={() => setShowNetwork(!showNetwork)}
                  isLoading={genState.isGenerating}
                  navOpen={leftToolbarOpen || devToolbarOpen || canvasToolbarOpen}
                  currentLanguage={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                  languages={LANGUAGES}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onSetEditorMode={(mode: string) => {
                    if (chatMode === 'chat' && mode === 'edit') return;
                    setEditorMode(mode as EditorMode);
                  }}
                  onOpenSettings={() => setShowAppSettings(true)}
                  onCopy={() => {
                    if (currentApp?.code) navigator.clipboard.writeText(currentApp.code);
                  }}
                  onDownload={() => {
                    if (currentApp?.code) {
                      const blob = new Blob([currentApp.code], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = ['react', 'nextjs'].includes(currentLanguage) ? 'App.tsx' : 'index.html';
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                />}

                {/* Preview area with optional file explorer */}
                <div className="flex-1 flex min-h-0 overflow-hidden bg-[#0d0d10]">
                  {/* Inline File Explorer — visible when app exists */}
                  {currentApp && projectFiles.length > 0 && (
                    <div className="w-[200px] shrink-0 bg-slate-50 dark:bg-[#0d0d0d] border-r border-slate-200 dark:border-white/[0.06] flex flex-col overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-1.5">
                        <FolderTree className="w-3 h-3 text-violet-400" />
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Files</span>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        <FileTree
                          files={projectFiles}
                          activeFile={activeFilePath}
                          onFileSelect={(path) => {
                            setActiveFilePath(path);
                            if (chatMode === 'agent') {
                              setEditorMode('edit');
                              setViewMode('code');
                            }
                          }}
                          onFileCreate={chatMode === 'agent' ? (path: string) => {
                            editorBridge.createFile(path, '');
                            setProjectFiles(editorBridge.getProjectTree());
                            setActiveFilePath(path);
                            setEditorMode('edit');
                            setViewMode('code');
                          } : undefined}
                          onFileDelete={chatMode === 'agent' ? (path: string) => {
                            editorBridge.deleteFile(path);
                            setProjectFiles(editorBridge.getProjectTree());
                            if (activeFilePath === path) {
                              const paths = editorBridge.getAllFilePaths();
                              setActiveFilePath(paths[0] || null);
                            }
                          } : undefined}
                          onFileRename={chatMode === 'agent' ? (oldPath: string, newPath: string) => {
                            editorBridge.renameFile(oldPath, newPath);
                            setProjectFiles(editorBridge.getProjectTree());
                            if (activeFilePath === oldPath) setActiveFilePath(newPath);
                          } : undefined}
                          darkMode={true}
                        />
                      </div>
                    </div>
                  )}
                  {/* Preview */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <SandpackPreview
                      code={typeof currentApp?.code === 'string' ? currentApp.code : ''}
                      language={currentLanguage}
                      viewMode={viewMode}
                      files={useEditorStore.getState().files}
                      onViewModeChange={setViewMode}
                      onCodeChange={(newCode) => {
                        if (currentApp) {
                          const updatedApp = { ...currentApp, code: newCode };
                          setCurrentApp(updatedApp);
                          saveApp(updatedApp, false);
                        }
                      }}
                    />
                  </div>
                </div>
                {/* Console / Network Panels below preview */}
                {(showConsole || showNetwork) && (
                  <div className="h-48 border-t border-slate-200 dark:border-white/[0.06] flex flex-col shrink-0">
                    <div className="flex border-b border-slate-200 dark:border-white/[0.06] shrink-0">
                      {showConsole && (
                        <button
                          onClick={() => { setShowConsole(true); setShowNetwork(false); }}
                          className={`px-3 py-1.5 text-[10px] font-medium ${!showNetwork ? 'text-violet-300 border-b border-violet-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          Console ({consoleEntries.length})
                        </button>
                      )}
                      {showNetwork && (
                        <button
                          onClick={() => { setShowNetwork(true); setShowConsole(false); }}
                          className={`px-3 py-1.5 text-[10px] font-medium ${!showConsole ? 'text-violet-300 border-b border-violet-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          Network ({networkRequests.length})
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {showConsole && !showNetwork && (
                        <ConsolePanel
                          entries={consoleEntries}
                          onClear={() => setConsoleEntries([])}
                        />
                      )}
                      {showNetwork && !showConsole && (
                        <NetworkPanel
                          requests={networkRequests}
                          onClear={() => setNetworkRequests([])}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Panel — Terminal / Problems */}
            {bottomPanelOpen && chatMode === 'agent' && (
              <div className="h-56 border-t border-slate-200 dark:border-white/[0.06] flex flex-col shrink-0 bg-white dark:bg-[#0a0a0a]">
                <div className="flex items-center border-b border-slate-200 dark:border-white/[0.06] shrink-0 px-2">
                  <button
                    onClick={() => setBottomPanelTab('terminal')}
                    className={`px-3 py-1.5 text-[10px] font-medium transition-all ${bottomPanelTab === 'terminal' ? 'text-violet-300 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    <TerminalIcon className="w-3 h-3 inline mr-1" />
                    Terminal
                  </button>
                  <button
                    onClick={() => setBottomPanelTab('problems')}
                    className={`px-3 py-1.5 text-[10px] font-medium transition-all ${bottomPanelTab === 'problems' ? 'text-violet-300 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Problems
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setBottomPanelOpen(false)}
                    className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {bottomPanelTab === 'terminal' && <TerminalManager />}
                  {bottomPanelTab === 'problems' && (
                    <ProblemPanel
                      onNavigate={(file, line, column) => {
                        setActiveFilePath(file.startsWith('/') ? file : `/${file}`);
                        setViewMode('code');
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Error Toast */}
      {genState.error && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm p-4 bg-slate-100 dark:bg-[#1a1a1a] border border-red-500/20 rounded-xl shadow-2xl flex gap-3 items-start">
          <div className="p-2 bg-red-500/10 text-red-400 rounded-lg shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Error</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {genState.error}
            </p>
            <button
              onClick={() => setGenState({ ...genState, error: null })}
              className="text-xs font-semibold text-red-400 hover:text-red-300 mt-2 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Subscription Required Modal */}
      {showPricingPaywall && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-500 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full bg-white dark:bg-[#111] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto mb-5 bg-gradient-to-br from-violet-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center border border-violet-500/20">
              <CreditCard className="w-7 h-7 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Subscription Required</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
              You need an active plan to use AI features. Choose a plan to get started.
            </p>
            <a
              href="https://mumtaz.ai/overview/pricing"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white font-semibold text-sm hover:from-violet-400 hover:to-violet-400 transition-all shadow-lg shadow-violet-500/20"
            >
              View Plans
            </a>
            <button
              onClick={() => setShowPricingPaywall(false)}
              className="mt-3 text-slate-500 text-xs hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {(invoiceDetails || invoiceDetailsLoading) && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => { setInvoiceDetails(null); setInvoiceDetailsLoading(false); }}
        >
          <div
            className="max-w-md w-full bg-white dark:bg-[#111] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {invoiceDetailsLoading && !invoiceDetails ? (
              <div className="py-12 text-center text-sm text-slate-500">Loading invoice…</div>
            ) : invoiceDetails ? (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Invoice</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                      #{invoiceDetails.id.slice(-12).toUpperCase()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase ${
                    invoiceDetails.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                    invoiceDetails.status === 'expired' ? 'bg-slate-500/10 text-slate-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {invoiceDetails.status === 'active' ? 'Paid' : invoiceDetails.status}
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="text-slate-900 dark:text-white">{invoiceDetails.customerName || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-slate-900 dark:text-white">{invoiceDetails.customerEmail || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Product</span><span className="text-slate-900 dark:text-white">{invoiceDetails.agentName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="text-slate-900 dark:text-white capitalize">{invoiceDetails.plan}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Period</span><span className="text-slate-900 dark:text-white">{new Date(invoiceDetails.startDate).toLocaleDateString()} → {new Date(invoiceDetails.expiryDate).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Issued</span><span className="text-slate-900 dark:text-white">{new Date(invoiceDetails.createdAt).toLocaleDateString()}</span></div>
                  {invoiceDetails.stripeSubscriptionId && (
                    <div className="flex justify-between"><span className="text-slate-500">Stripe Ref</span><span className="text-slate-700 dark:text-slate-300 font-mono text-[10px]">{invoiceDetails.stripeSubscriptionId.slice(-16)}</span></div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-white/[0.08]">
                    <span className="text-slate-900 dark:text-white font-semibold">Total</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoiceDetails.currency || 'USD' }).format(invoiceDetails.price)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => handleInvoiceDownload(invoiceDetails.id)}
                    className="flex-1 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setInvoiceDetails(null)}
                    className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {showVoiceInput && (
        <VoiceInput
          onTranscript={(transcript) => {
            setPrompt(transcript);
            setShowVoiceInput(false);
          }}
          onClose={() => setShowVoiceInput(false)}
        />
      )}

      {showImageToCode && (
        <ImageToCode
          onGenerate={async (code) => {
            const newApp: GeneratedApp = {
              id: Date.now().toString(),
              name: 'From Image',
              code,
              prompt: 'Generated from image upload',
              timestamp: Date.now(),
              history: [
                {
                  role: 'model',
                  text: 'Generated from uploaded image',
                  timestamp: Date.now(),
                },
              ],
              language: currentLanguage,
              provider: selectedModel.provider,
              modelId: selectedModel.id,
            };
            setCurrentApp(newApp);
            saveApp(newApp, true);
            setShowImageToCode(false);
          }}
          onClose={() => setShowImageToCode(false)}
          outputType={
            ['react', 'nextjs'].includes(currentLanguage) ? 'react' : 'html'
          }
        />
      )}

      {showDeployPanel && (
        <DeployPanel
          projectName={currentApp?.name || 'Untitled Project'}
          files={useEditorStore.getState().files}
          onClose={() => setShowDeployPanel(false)}
          onDeployComplete={handleDeployComplete}
          onFixBuildError={handleFixBuildError}
        />
      )}

      {/* Analytics Drawer */}
      <AnalyticsDrawer
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        userId={authUser?.id}
        sessionStartTime={sessionStartTimeRef.current}
        chatMessages={currentApp?.history || []}
        projectId={currentApp?.id}
      />

      {/* Editor Settings Modal */}
      <EditorSettings
        isOpen={showEditorSettings}
        onClose={() => setShowEditorSettings(false)}
      />

      {/* App-wide Settings Modal */}
      <AppSettingsPanel
        isOpen={showAppSettings}
        onClose={() => setShowAppSettings(false)}
        bottomPanelOpen={bottomPanelOpen}
        onToggleTerminal={() => { if (chatMode === 'agent') setBottomPanelOpen((prev) => !prev); }}
      />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Rollback Panel Modal */}
      {showRollbackPanel && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-400 dark:bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowRollbackPanel(false)}>
          <div className="max-w-md w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Rollback</span>
                </div>
                <button onClick={() => setShowRollbackPanel(false)} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <RollbackPanel
                versions={deployVersions}
                onRollback={async (versionId) => {
                  await handleRollback(versionId);
                  setShowRollbackPanel(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Templates Detail Overlay */}
      <TemplatesPanel
        isOpen={templatesPanelOpen}
        onClose={() => { setTemplatesPanelOpen(false); setViewOverlayTemplate(null); }}
        onUseTemplate={(template) => { handleUseTemplate(template); setTemplatesPanelOpen(false); setViewOverlayTemplate(null); }}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        openOnTemplate={viewOverlayTemplate}
      />
    </div>
  );
};

export default App;
