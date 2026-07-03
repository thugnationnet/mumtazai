import { memoryStorage } from './memoryStorage';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GeneratedApp,
  ViewMode,
  GenerationState,
  ChatMessage,
  SSEEvent,
  ToolEvent,
} from './types';
import Preview from './components/Preview';
import CloudPreview from './components/CloudPreview';
import CodeView from './components/CodeView';
import ChatBox from './components/ChatBox';
import AnalyticsDrawer from './components/AnalyticsDrawer';
import Overlay from './components/Overlay';
import DeployPanel from './components/DeployPanel';
import CredentialsPanel from './components/CredentialsPanel';
import VideoPanel from './components/VideoPanel';
import AIPanel from './components/AIPanel';
import ProjectPanel from './components/ProjectPanel';
import BuildPanel from './components/BuildPanel';
import DatabasePanel from './components/DatabasePanel';
import AssetsPanel from './components/AssetsPanel';
import CollaborationPanel from './components/CollaborationPanel';
import CodeToolsPanel from './components/CodeToolsPanel';
import BackendToolsPanel from './components/BackendToolsPanel';
import CommunicationPanel from './components/CommunicationPanel';
import DockerPanel from './components/DockerPanel';
import VideoProcessingPanel from './components/VideoProcessingPanel';
import CanvasToolsPanel from './components/CanvasToolsPanel';
import ImageToolsPanel from './components/ImageToolsPanel';
import DevToolsPanel from './components/DevToolsPanel';
import DocumentParsingPanel from './components/DocumentParsingPanel';
import ApiToolsPanel from './components/ApiToolsPanel';
import WebToolsPanel from './components/WebToolsPanel';
import SecurityPanel from './components/SecurityPanel';
import ContentMarkdownPanel from './components/ContentMarkdownPanel';
import WorkflowPanel from './components/WorkflowPanel';
import KnowledgeGraphPanel from './components/KnowledgeGraphPanel';
import BusinessGrowthPanel from './components/BusinessGrowthPanel';
import AdvancedAiPanel from './components/AdvancedAiPanel';
import DataSciencePanel from './components/DataSciencePanel';
import GeoPanel from './components/GeoPanel';
import CloudPanel from './components/CloudPanel';
import AdvancedSecurityPanel from './components/AdvancedSecurityPanel';
import FinancialPanel from './components/FinancialPanel';
import ProjectManagementPanel from './components/ProjectManagementPanel';
import EmailPanel from './components/EmailPanel';
import SalesCrmPanel from './components/SalesCrmPanel';
import HrRecruitingPanel from './components/HrRecruitingPanel';
import LegalCompliancePanel from './components/LegalCompliancePanel';
import MarketingSeoPanel from './components/MarketingSeoPanel';
import PanelPreview, { PreviewContent } from './components/PanelPreview';
import AutoSaveIndicator from './components/AutoSaveIndicator';
import CollaboratorsBar from './components/CollaboratorsBar';
import { useEditorBridge } from './hooks/useEditorBridge';
import { useAutoSave } from './hooks/useAutoSave';
import { useCollaboration } from './hooks/useCollaboration';
import {
  Project,
  Collaborator,
  saveProject,
  loadProject,
  getRealtimeConnection,
  workspaceService,
  WSProjectFile,
  preferencesService,
  chatSessionService,
} from '@shared/api';
import {
  PRESET_TEMPLATES,
  QUICK_ACTIONS,
  GENERATION_COMMENTARY,
  PROJECT_TEMPLATES,
  DEVICE_SIZES,
  ProjectFile,
} from './constants';
import { fetchWithCredentials } from './fetchUtil';
import { useAuth } from './contexts/AuthContext';
import { usePlan } from './hooks/usePlan';
import PlanLockOverlay from './components/PlanLockOverlay';
import AgentInteractionOverlay, { AgentInteractionHandle } from './components/AgentInteractionOverlay';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

type ConversationPhase = 'initial' | 'gathering' | 'confirming' | 'building' | 'editing';
type ActivePanel = 'workspace' | 'assistant' | 'files' | 'tools' | 'settings' | 'history' | 'templates' | 'deploy' | 'credentials' | 'video' | 'ai' | 'project' | 'build' | 'database' | 'assets' | 'collaboration' | 'code-tools' | 'backend-tools' | 'communication' | 'docker' | 'video-processing' | 'canvas-tools' | 'image-tools' | 'dev-tools' | 'document-parsing' | 'api-tools' | 'web-tools' | 'security' | 'content-markdown' | 'workflow' | 'knowledge-graph' | 'business-growth' | 'advanced-ai' | 'data-science' | 'geo' | 'cloud' | 'advanced-security' | 'financial' | 'project-management' | 'email' | 'sales-crm' | 'hr-recruiting' | 'legal-compliance' | 'marketing-seo' | null;

const App: React.FC = () => {
  const [isOverlayActive, setIsOverlayActive] = useState(true);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PREVIEW);
  const [currentApp, setCurrentApp] = useState<GeneratedApp | null>(null);
  const [history, setHistory] = useState<GeneratedApp[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('assistant');
  const activePanelRef = useRef<ActivePanel>('assistant');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof PROJECT_TEMPLATES[0] | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [templatePreviewMode, setTemplatePreviewMode] = useState<'list' | 'preview' | 'code'>('list');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Keep ref in sync for use inside useCallback
  useEffect(() => { activePanelRef.current = activePanel; }, [activePanel]);

  // Camera/Voice State (restored for camera modal + TTS)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);

  // SSE Streaming State
  const [streamingText, setStreamingText] = useState('');
  const [liveToolEvents, setLiveToolEvents] = useState<ToolEvent[]>([]);
  const [chatMode, setChatMode] = useState<'agent' | 'chat'>('agent');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarHighlight, setSidebarHighlight] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [genState, setGenState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    progressMessage: '',
  });
  const [commentary, setCommentary] = useState(GENERATION_COMMENTARY[0]);
  const [commentaryIndex, setCommentaryIndex] = useState(0);

  // Conversation History
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const chatSessionIdRef = useRef<string | null>(null);

  // 🎛️ AI Controls State
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [chatFontSize, setChatFontSize] = useState(12);
  const [focusMode, setFocusMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 🚀 Deploy/Hosting State
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);

  // ☁️ Preview Mode: 'browser' (Sandpack) or 'cloud' (ECS Sandbox)
  const [previewMode, setPreviewMode] = useState<'browser' | 'cloud'>('browser');

  // 🖥️ Panel Preview Content — what the preview area shows when a panel is active
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null);

  // Panels that only need the drawer (no preview window) — they get full width
  const FULLSCREEN_PANELS = ['code-tools', 'backend-tools', 'communication', 'docker', 'video-processing', 'canvas-tools', 'image-tools', 'dev-tools', 'document-parsing', 'api-tools', 'web-tools', 'security', 'content-markdown', 'credentials', 'collaboration', 'workflow', 'knowledge-graph', 'business-growth', 'advanced-ai', 'data-science', 'geo', 'cloud', 'advanced-security', 'financial', 'project-management', 'email', 'sales-crm', 'hr-recruiting', 'legal-compliance', 'marketing-seo'];
  // Fullscreen only when no preview content to show — once output arrives, split into panel+preview
  const isFullscreenPanel = activePanel ? FULLSCREEN_PANELS.includes(activePanel) && !previewContent : false;

  // 💾 PROJECT PERSISTENCE STATE
  const [projectSlug, setProjectSlug] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [isProjectLoading, setIsProjectLoading] = useState(false);

  // 🔗 EDITOR BRIDGE - Full editor integration for agent
  const editorBridge = useEditorBridge({});

  // 🤖 Agent Interaction Overlay (toasts, approvals, questions)
  const agentInteractionRef = useRef<AgentInteractionHandle>(null);

  // 💾 GET FILES FOR AUTO-SAVE
  const getFilesForSave = useCallback((): WSProjectFile[] => {
    const files = editorBridge.files;
    const fileList = editorBridge.fileList;
    return fileList.map(path => ({
      path,
      content: files.get(path) || '',
      language: path.split('.').pop() || 'text',
      isOpen: editorBridge.state.openFiles.includes(path),
    }));
  }, [editorBridge]);

  const getEditorStateForSave = useCallback(() => ({
    activeFile: editorBridge.activeFile,
    cursor: editorBridge.cursor,
    openFiles: editorBridge.state.openFiles,
  }), [editorBridge]);

  const getMainFileForSave = useCallback(() => {
    return editorBridge.activeFile || 'index.html';
  }, [editorBridge]);

  // 💾 AUTO-SAVE HOOK
  const autoSave = useAutoSave(
    getFilesForSave,
    getEditorStateForSave,
    getMainFileForSave,
    {
      slug: projectSlug,
      debounceMs: 2000,
      enabled: !!projectSlug,
      onSave: (result) => {
        console.log('[Canvas] Auto-saved:', result.fileCount, 'files at', result.savedAt);
      },
      onError: (error) => {
        console.error('[Canvas] Auto-save failed:', error);
      },
    }
  );

  // Auth context — centralised session from AuthProvider
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();

  // Plan check — gates right panel behind active subscription
  const { hasPlan, startCheckout } = usePlan();

  // Sync auth user → collaboration name
  useEffect(() => {
    if (authUser?.name) setCurrentUserName(authUser.name);
    else if (authUser?.email) setCurrentUserName(authUser.email.split('@')[0]);
  }, [authUser]);

  // 🤝 COLLABORATION HOOK - Real-time multiplayer editing
  const collaboration = useCollaboration({
    projectSlug,
    userId: authUser?.id || null,
    userName: currentUserName || `Guest ${Math.random().toString(36).slice(2, 6)}`,
    userAvatar: undefined,
    enabled: !!projectSlug && isAuthenticated, // Only when authenticated and have a project
    onSync: () => {
      console.log('[Canvas] Collaboration synced');
    },
    onCollaboratorJoin: (collaborator: Collaborator) => {
      console.log('[Canvas] Collaborator joined:', collaborator.name);
    },
    onCollaboratorLeave: (collaborator: Collaborator) => {
      console.log('[Canvas] Collaborator left:', collaborator.name);
    },
  });

  // 💾 LOAD PROJECT FROM URL PARAM
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectParam = params.get('project');

    if (projectParam && projectParam !== projectSlug) {
      loadProject(projectParam);
    }
  }, []);

  // 💾 LOAD PROJECT FUNCTION
  const loadProject = async (slug: string) => {
    setIsProjectLoading(true);
    try {
      const project = await workspaceService.load(slug);
      if (project) {
        setProjectSlug(project.slug);
        setProjectName(project.name);

        // Load files into editor bridge
        project.files.forEach(file => {
          editorBridge.setFile(file.path, file.content);
        });

        // Set active file
        if (project.mainFile) {
          editorBridge.setActiveFile(project.mainFile);
        }

        // Set current app
        const mainFileContent = project.files.find(f => f.path === project.mainFile)?.content || project.files[0]?.content || '';
        const restoredHistory = (project as any).editorState?.history || (project as any).editorState?.conversationHistory || [];
        setCurrentApp({
          id: project.id,
          code: mainFileContent,
          language: project.language,
          name: project.name,
          prompt: project.originalPrompt || '',
          timestamp: new Date(project.updatedAt).getTime(),
          history: restoredHistory,
          slug: project.slug,
        });
        // Restore conversation history from project
        setConversationHistory(restoredHistory);

        console.log('[Canvas] Loaded project:', project.name, 'with', project.files.length, 'files');
      }
    } catch (error) {
      console.error('[Canvas] Failed to load project:', error);
    } finally {
      setIsProjectLoading(false);
    }
  };

  // 💾 CREATE NEW PROJECT (when user first generates code)
  const createProjectIfNeeded = async () => {
    if (!projectSlug && currentApp?.code) {
      const files = getFilesForSave();
      if (files.length > 0) {
        const result = await workspaceService.quickSave({
          name: projectName,
          files,
          editorState: getEditorStateForSave(),
          mainFile: getMainFileForSave(),
          language: currentApp.language,
          originalPrompt: currentApp.prompt,
        });

        if (result) {
          setProjectSlug(result.slug);
          autoSave.setSlug(result.slug);

          // Update URL without reload
          const newUrl = `${window.location.pathname}?project=${result.slug}`;
          window.history.pushState({}, '', newUrl);

          console.log('[Canvas] Created project:', result.slug);
        }
      }
    }
  };

  // 💾 MARK CHANGES FOR AUTO-SAVE
  useEffect(() => {
    if (projectSlug && currentApp?.code) {
      autoSave.markChanged();
    }
  }, [currentApp?.code, projectFiles]);

  // Sync currentApp.code to editorBridge when it changes
  useEffect(() => {
    if (currentApp?.code) {
      const ext = currentApp.language === 'react' ? 'tsx' :
        currentApp.language === 'python' ? 'py' :
          currentApp.language === 'typescript' ? 'ts' :
            currentApp.language === 'javascript' ? 'js' : 'html';
      const filename = `App.${ext}`;

      console.log('[Canvas] Language detected:', currentApp.language, '→ Extension:', ext, '→ Filename:', filename);

      // Clear ALL old App.* files to prevent duplicates (App.html, App.tsx, etc.)
      const existingFiles = [...editorBridge.fileList]; // Copy to avoid mutation during iteration
      console.log('[Canvas] Existing files before clear:', existingFiles);
      existingFiles.forEach(file => {
        if (file.startsWith('App.') && file !== filename) {
          console.log('[Canvas] Deleting old file:', file);
          editorBridge.deleteFile(file);
        }
      });

      // Set the new file with correct extension
      editorBridge.setFile(filename, currentApp.code);
      editorBridge.setActiveFile(filename);
      console.log('[Canvas] Set active file:', filename);
    }
  }, [currentApp?.code, currentApp?.language]);

  // Sync selectedLanguage to currentApp when manually changed (not 'auto')
  useEffect(() => {
    if (selectedLanguage !== 'auto' && currentApp) {
      // Map dropdown values to language values
      const languageMap: Record<string, string> = {
        'html': 'html',
        'react': 'react',
        'typescript': 'typescript',
        'javascript': 'javascript',
        'python': 'python',
      };
      const newLang = languageMap[selectedLanguage] || selectedLanguage;
      if (newLang !== currentApp.language) {
        setCurrentApp(prev => prev ? { ...prev, language: newLang } : null);
      }
    }
  }, [selectedLanguage]);

  // 🔗 Sync EditorBridge files to projectFiles state
  // This ensures the Files panel shows what's in the editor
  useEffect(() => {
    const files = editorBridge.files;
    const fileList = editorBridge.fileList;

    if (fileList.length > 0) {
      // Convert editorBridge files to ProjectFile format
      const newProjectFiles: ProjectFile[] = fileList.map(filePath => {
        const content = files.get(filePath) || '';
        const name = filePath.split('/').pop() || filePath;
        const ext = name.split('.').pop()?.toLowerCase() || '';

        // Determine language from extension
        const langMap: Record<string, string> = {
          'tsx': 'typescript', 'ts': 'typescript', 'jsx': 'javascript', 'js': 'javascript',
          'html': 'html', 'htm': 'html', 'css': 'css', 'py': 'python', 'json': 'json', 'md': 'markdown',
          'java': 'java', 'go': 'go', 'rs': 'rust', 'c': 'c', 'cpp': 'cpp', 'cc': 'cpp', 'h': 'c',
          'php': 'php', 'rb': 'ruby', 'swift': 'swift', 'kt': 'kotlin', 'kts': 'kotlin',
          'cs': 'csharp', 'csx': 'csharp', 'sql': 'sql', 'sh': 'shell', 'bash': 'shell',
        };

        return {
          name: filePath, // Use full path for unique keys
          type: 'file' as const,
          language: langMap[ext] || 'text',
          content,
        };
      });

      setProjectFiles(newProjectFiles);
    }
  }, [editorBridge.fileList, editorBridge.files]); // Watch fileList which changes when files change

  // 🔗 Handle files generated by Sandpack/Preview component
  // This syncs generated files (like index.tsx, styles.css) back to EditorBridge AND projectFiles
  const handlePreviewFilesGenerated = React.useCallback((files: Record<string, string>) => {
    // Clear existing files first to avoid stale files
    const currentFiles = editorBridge.fileList;

    // Build new project files array
    const newProjectFiles: ProjectFile[] = [];

    // Sync each file to EditorBridge and projectFiles
    Object.entries(files).forEach(([filePath, content]) => {
      // Remove leading slash for EditorBridge
      const cleanPath = filePath.replace(/^\//, '');

      // Set file in EditorBridge
      editorBridge.setFile(cleanPath, content);

      // Also add to projectFiles
      const name = cleanPath.split('/').pop() || cleanPath;
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const langMap: Record<string, string> = {
        'tsx': 'typescript', 'ts': 'typescript', 'jsx': 'javascript', 'js': 'javascript',
        'html': 'html', 'htm': 'html', 'css': 'css', 'py': 'python', 'json': 'json', 'md': 'markdown',
        'java': 'java', 'go': 'go', 'rs': 'rust', 'c': 'c', 'cpp': 'cpp', 'cc': 'cpp', 'h': 'c',
        'php': 'php', 'rb': 'ruby', 'swift': 'swift', 'kt': 'kotlin', 'kts': 'kotlin',
        'cs': 'csharp', 'csx': 'csharp', 'sql': 'sql', 'sh': 'shell', 'bash': 'shell',
      };

      newProjectFiles.push({
        name: cleanPath,
        type: 'file' as const,
        language: langMap[ext] || 'text',
        content,
      });
    });

    // Update projectFiles state directly
    if (newProjectFiles.length > 0) {
      setProjectFiles(newProjectFiles);
    }
  }, [editorBridge]);

  // 🎭 Rotate fun commentary messages during generation
  useEffect(() => {
    if (!genState.isGenerating) {
      setCommentaryIndex(0);
      setCommentary(GENERATION_COMMENTARY[0]);
      return;
    }

    const interval = setInterval(() => {
      setCommentaryIndex(prev => {
        const nextIndex = (prev + 1) % GENERATION_COMMENTARY.length;
        setCommentary(GENERATION_COMMENTARY[nextIndex]);
        return nextIndex;
      });
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [genState.isGenerating]);

  // ── Preferences: load from DB on mount ──
  const prefsLoadedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || prefsLoadedRef.current) return;
    prefsLoadedRef.current = true;
    (async () => {
      const prefs = await preferencesService.load();
      if (prefs) {
        setIsDarkMode(prefs.isDarkMode);
        setTemperature(prefs.temperature);
        setMaxTokens(prefs.maxTokens);
        setChatFontSize(prefs.chatFontSize);
        setFocusMode(prefs.focusMode);
        setChatMode(prefs.chatMode as 'agent' | 'chat');
        setSelectedLanguage(prefs.selectedLanguage);
        setViewMode(prefs.viewMode as ViewMode);
        setDeviceMode(prefs.deviceMode as DeviceMode);
        setActivePanel(prefs.activePanel as ActivePanel);
        setPreviewMode(prefs.previewMode as 'browser' | 'cloud');
      }
    })();
  }, [isAuthenticated]);

  // ── Preferences: debounced save to DB ──
  const prefsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefsMountedRef = useRef(false);
  useEffect(() => {
    // Skip the initial render — don't save defaults before DB load completes
    if (!prefsMountedRef.current) { prefsMountedRef.current = true; return; }
    if (!isAuthenticated) return;
    if (prefsSaveTimerRef.current) clearTimeout(prefsSaveTimerRef.current);
    prefsSaveTimerRef.current = setTimeout(() => {
      preferencesService.save({
        isDarkMode, temperature, maxTokens, chatFontSize,
        focusMode, chatMode, selectedLanguage,
        viewMode: viewMode as string, deviceMode,
        activePanel, previewMode,
      });
    }, 1000);
    return () => { if (prefsSaveTimerRef.current) clearTimeout(prefsSaveTimerRef.current); };
  }, [isDarkMode, temperature, maxTokens, chatFontSize, focusMode, chatMode, selectedLanguage, viewMode, deviceMode, activePanel, previewMode, isAuthenticated]);

  // ── Chat session: persist messages to DB ──
  const persistMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!isAuthenticated) return;
    try {
      // Create session on first message
      if (!chatSessionIdRef.current) {
        const session = await chatSessionService.create({ name: content.slice(0, 50), chatMode });
        if (session) chatSessionIdRef.current = session.id;
        else return;
      }
      await chatSessionService.addMessage(chatSessionIdRef.current, { role, content, chatMode });
    } catch { /* fire-and-forget */ }
  }, [isAuthenticated, chatMode]);

  // Load deployed URL from hosting API on mount
  useEffect(() => {
    const loadDeployedUrl = async () => {
      try {
        const res = await fetchWithCredentials('/api/hosting/my-apps?sourceApp=canvas', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.apps?.length > 0) {
            const latestApp = data.apps[0];
            if (latestApp?.url || latestApp?.embedUrl) {
              setDeployedUrl(latestApp.url || latestApp.embedUrl);
            }
          }
        }
      } catch { /* non-critical */ }
    };
    loadDeployedUrl();
  }, []);

  // Auto-scroll sidebar animation AFTER overlay closes to show users all options.
  // ZERO localStorage / sessionStorage — flag is persisted in DB via /api/preferences/ui-flags.
  // Loaded once into a ref to avoid extra renders; set to true after the animation finishes.
  const sidebarIntroSeenRef = useRef<boolean | null>(null);

  // Load flag from DB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithCredentials('/api/preferences', { credentials: 'include' });
        if (!res.ok) {
          // Treat unauthenticated/guest as "already seen" to avoid showing animation to anonymous viewers
          if (!cancelled) sidebarIntroSeenRef.current = true;
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          sidebarIntroSeenRef.current = !!data?.preferences?.uiFlags?.sidebarIntroSeen;
        }
      } catch {
        if (!cancelled) sidebarIntroSeenRef.current = true; // fail-safe: don't replay
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Only run when overlay closes
    if (isOverlayActive) return;

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    // Wait until DB flag has loaded (ref === null means still loading)
    if (sidebarIntroSeenRef.current === null) return;
    if (sidebarIntroSeenRef.current === true) return;

    // Delay start after overlay animation completes
    const startDelay = setTimeout(() => {
      setSidebarHighlight(true);

      const scrollHeight = sidebar.scrollHeight;
      const clientHeight = sidebar.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      const persistSeen = () => {
        sidebarIntroSeenRef.current = true;
        // Fire-and-forget DB write
        fetchWithCredentials('/api/preferences/ui-flags', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sidebarIntroSeen: true }),
        }).catch(() => { /* offline — flag stays in-memory for this session */ });
      };

      if (maxScroll > 0) {
        // Smooth scroll down with slower, more visible animation
        let scrollPos = 0;
        const scrollDown = setInterval(() => {
          scrollPos += 2; // Slower scroll
          sidebar.scrollTop = scrollPos;
          if (scrollPos >= maxScroll) {
            clearInterval(scrollDown);
            // Pause at bottom longer
            setTimeout(() => {
              // Smooth scroll back up
              const scrollUp = setInterval(() => {
                scrollPos -= 2;
                sidebar.scrollTop = scrollPos;
                if (scrollPos <= 0) {
                  clearInterval(scrollUp);
                  setSidebarHighlight(false);
                  persistSeen();
                }
              }, 20);
            }, 800);
          }
        }, 20);
      } else {
        setSidebarHighlight(false);
        persistSeen();
      }
    }, 1500); // Wait for overlay animation to complete

    return () => clearTimeout(startDelay);
  }, [isOverlayActive]);

  // Load history from DB (workspace projects) on mount, with memoryStorage fallback
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetchWithCredentials('/api/workspace/projects?limit=20&sourceApp=canvas', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.projects?.length > 0) {
            const apps: GeneratedApp[] = data.projects.map((p: any) => ({
              id: p.id,
              name: p.name,
              code: '',
              prompt: p.description || '',
              timestamp: new Date(p.updatedAt || p.createdAt).getTime(),
              history: [],
              slug: p.slug,
            }));
            setHistory(apps);
            return;
          }
        }
      } catch (e) {
        console.warn('[Canvas Studio] Failed to load projects from DB, falling back to memoryStorage');
      }
      // Fallback: memoryStorage for non-authenticated users
      const saved = memoryStorage.getItem('gencraft_v4_history');
      if (saved)
        try {
          const parsed = JSON.parse(saved);
          setHistory(parsed.slice(0, 20));
        } catch (e) { }
    };
    loadProjects();
  }, []);

  const saveHistory = (newHistory: GeneratedApp[]) => {
    const trimmed = newHistory.slice(0, 20); // Max 20 projects
    setHistory(trimmed);
    // Keep memoryStorage as fallback
    try {
      memoryStorage.setItem('gencraft_v4_history', JSON.stringify(trimmed));
    } catch { /* quota exceeded */ }
  };

  // Save/update project to DB (fire-and-forget)
  const saveProjectToDB = async (app: GeneratedApp, files: { path: string; content: string }[]) => {
    try {
      if (app.slug) {
        // Update existing project
        await fetchWithCredentials(`/api/workspace/projects/${app.slug}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            files,
            editorState: { history: app.history, conversationHistory: app.history },
            mainFile: files.find(f => f.path.includes('index.html') || f.path.includes('App.'))?.path || files[0]?.path || 'index.html',
            sourceApp: 'canvas',
          }),
        });
        await fetchWithCredentials(`/api/workspace/projects/${app.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: app.name, description: app.prompt }),
        });
      } else {
        // Create new project
        const mainFile = files.find(f => f.path.includes('index.html') || f.path.includes('App.'))?.path || files[0]?.path || 'index.html';
        const res = await fetchWithCredentials('/api/workspace/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: app.name,
            description: app.prompt,
            language: app.language || 'html',
            projectType: 'STATIC',
            mainFile,
            files,
            editorState: { history: app.history, conversationHistory: app.history },
            originalPrompt: app.prompt,
            sourceApp: 'canvas',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.project?.slug) {
            app.id = data.project.id;
            app.slug = data.project.slug;
            setHistory(prev => prev.map(h => h.id === app.id ? { ...app } : h));
          }
        }
      }
    } catch (e) {
      console.warn('[Canvas Studio] Failed to save project to DB:', e);
    }
  };

  // Build live preview HTML from tool events + streaming text for tool panels
  const buildToolPreviewHtml = (toolEvents: ToolEvent[], text: string, isDone = false): string => {
    const parts: string[] = [];
    parts.push('<div style="font-family:system-ui,-apple-system,sans-serif;padding:16px;color:#e2e8f0;max-width:100%;overflow-wrap:break-word;">');
    
    if (toolEvents.length > 0) {
      parts.push('<div style="margin-bottom:16px;">');
      parts.push('<div style="font-size:13px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Tool Activity</div>');
      for (const te of toolEvents) {
        const icon = te.type === 'tool_start' ? '⚙️' : (te.success !== false ? '✅' : '❌');
        const label = te.type === 'tool_start' ? `Running ${te.tool}...` : `${te.tool}: ${te.summary || (te.success !== false ? 'Done' : 'Failed')}`;
        parts.push(`<div style="padding:6px 10px;margin:4px 0;border-radius:6px;background:${te.type==='tool_start'?'rgba(59,130,246,0.15)':'rgba(34,197,94,0.15)'};font-size:13px;">${icon} ${label}</div>`);
      }
      parts.push('</div>');
    }
    
    if (text) {
      parts.push('<div style="margin-top:12px;">');
      if (!isDone) parts.push('<div style="font-size:13px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Response</div>');
      // Simple markdown-ish rendering: code blocks, bold, newlines
      const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const formatted = escaped
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#1e293b;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;margin:8px 0;"><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code style="background:#334155;padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
      parts.push(`<div style="font-size:14px;line-height:1.7;">${formatted}</div>`);
      parts.push('</div>');
    }
    
    if (!text && toolEvents.length === 0 && !isDone) {
      parts.push('<div style="text-align:center;padding:40px 0;color:#64748b;"><div style="font-size:32px;margin-bottom:12px;">⏳</div><div>Processing request...</div></div>');
    }
    
    if (isDone && !text && toolEvents.length === 0) {
      parts.push('<div style="text-align:center;padding:40px 0;color:#64748b;"><div style="font-size:32px;margin-bottom:12px;">✅</div><div>Complete</div></div>');
    }
    
    parts.push('</div>');
    return parts.join('');
  };

  // SSE STREAMING — Single-agent tool calling with Mistral/xAI/OpenAI
  const handleAgentMessage = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || genState.isGenerating) return;

    // Require login before any API call
    if (!isAuthenticated) {
      window.location.href = `https://mumtaz.ai/auth/login?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }

    // Add user message
    const userMsg: ChatMessage = { role: 'user', text: userPrompt, timestamp: Date.now() };
    setConversationHistory(prev => [...prev, userMsg]);
    persistMessage('user', userPrompt);
    setGenState({ isGenerating: true, error: null, progressMessage: 'Connecting...' });
    setStreamingText('');
    setLiveToolEvents([]);
    setPrompt('');

    // Build project files map from editorBridge
    const filesMap: Record<string, string> = {};
    for (const path of editorBridge.fileList) {
      const content = editorBridge.files.get(path);
      if (content) filesMap[path] = content;
    }

    const toolEventsCollected: ToolEvent[] = [];
    let fullText = '';
    const startTime = Date.now();

    // Create abort controller for stop generation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetchWithCredentials('/api/canvas/agent-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          prompt: userPrompt,
          projectFiles: filesMap,
          history: conversationHistory.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
          appId: 'canvas',
          panel: activePanel,
          temperature,
          maxTokens,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || '⚡ You\'ve run out of credits. Purchase more credits to continue generating.');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event: SSEEvent = JSON.parse(line.slice(6));

            switch (event.type) {
              case 'status':
                setGenState(s => ({ ...s, progressMessage: event.message || '' }));
                break;
              case 'text':
                fullText += event.content || '';
                setStreamingText(fullText);
                // Live-update preview with streaming text
                if (activePanelRef.current && FULLSCREEN_PANELS.includes(activePanelRef.current)) {
                  setPreviewContent({ type: 'html', title: 'Agent Response', icon: '🤖', html: buildToolPreviewHtml(toolEventsCollected, fullText) });
                }
                break;
              case 'tool_side_effect': {
                // Forward as tool event for UI display (file/project effects arrive as their own event types)
                const sete: ToolEvent = {
                  type: 'tool_result',
                  tool: event.tool,
                  success: true,
                  summary: `Side effect from ${event.tool}`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(sete);
                setLiveToolEvents([...toolEventsCollected]);
                break;
              }
              case 'switch_file': {
                // Canvas tool: switch active file in editor
                if (event.path) editorBridge.setActiveFile(event.path);
                break;
              }
              case 'project_created': {
                // Canvas tool: write all scaffolded files into editor
                if (event.files) {
                  Object.entries(event.files).forEach(([p, c]) => editorBridge.setFile(p, c));
                }
                if (event.mainFile) editorBridge.setActiveFile(event.mainFile);
                break;
              }
              case 'tool_start': {
                const te: ToolEvent = { type: 'tool_start', tool: event.tool, input: event.input, agent: event.agent, agentName: event.name, taskId: event.taskId, timestamp: Date.now() };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                // Push live tool activity to preview for tool panels
                if (activePanelRef.current && FULLSCREEN_PANELS.includes(activePanelRef.current)) {
                  setPreviewContent({ type: 'html', title: 'Agent Working', icon: '🤖', html: buildToolPreviewHtml(toolEventsCollected, fullText) });
                }
                break;
              }
              case 'tool_result': {
                const te: ToolEvent = { type: 'tool_result', tool: event.tool, success: event.success, summary: event.summary, agent: event.agent, agentName: event.name, taskId: event.taskId, timestamp: Date.now() };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                // Update preview with tool result for tool panels
                if (activePanelRef.current && FULLSCREEN_PANELS.includes(activePanelRef.current)) {
                  setPreviewContent({ type: 'html', title: 'Agent Working', icon: '🤖', html: buildToolPreviewHtml(toolEventsCollected, fullText) });
                }
                break;
              }
              case 'file_write':
                if (event.path && event.content !== undefined) {
                  editorBridge.setFile(event.path, event.content);
                  toolEventsCollected.push({ type: 'file_write', path: event.path, timestamp: Date.now() });
                  setLiveToolEvents([...toolEventsCollected]);

                  // Live-update currentApp.code for the main file so Preview refreshes in real-time
                  // (Without this, single-file HTML previews only update on the 'done' event)
                  const mainExts = ['index.html', 'main.html', 'App.tsx', 'App.jsx', 'index.tsx', 'index.jsx'];
                  if (mainExts.includes(event.path) || editorBridge.fileList.length <= 1) {
                    setCurrentApp(prev => prev ? { ...prev, code: event.content, timestamp: Date.now() } : prev);
                  }
                }
                break;
              case 'file_delete':
                if (event.path) {
                  editorBridge.deleteFile(event.path);
                  toolEventsCollected.push({ type: 'file_delete', path: event.path, timestamp: Date.now() });
                  setLiveToolEvents([...toolEventsCollected]);
                }
                break;
              case 'command_output':
                toolEventsCollected.push({ type: 'command_output', content: event.content, timestamp: Date.now() });
                setLiveToolEvents([...toolEventsCollected]);
                break;
              case 'image_result': {
                // Image processed — signed URL (production) or dataUrl (fallback)
                const imgUrl = event.imageUrl || event.dataUrl || '';
                const te: ToolEvent = {
                  type: 'image_result',
                  imageUrl: event.imageUrl,
                  dataUrl: event.dataUrl,
                  imageUrls: event.imageUrls || event.dataUrls,
                  width: event.width,
                  height: event.height,
                  format: event.format,
                  summary: `Image ${event.width}×${event.height} ${event.format || ''}`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);

                // Auto-embed in project as downloadable asset if we have a URL
                if (imgUrl) {
                  const ext = event.format || 'png';
                  const assetPath = `assets/generated-${Date.now()}.${ext}`;
                  // Write an HTML img tag reference so the preview can show it
                  console.log(`[Canvas] Image ready: ${event.width}×${event.height} ${ext}`, imgUrl.slice(0, 80));
                }
                break;
              }
              case 'video_result': {
                // Video processed — signed URL (production) or file path (fallback)
                const vidUrl = event.videoUrl || '';
                const te: ToolEvent = {
                  type: 'video_result',
                  videoUrl: event.videoUrl,
                  videoUrls: event.videoUrls,
                  thumbnailUrl: event.thumbnailUrl,
                  duration: event.duration,
                  width: event.width,
                  height: event.height,
                  format: event.format,
                  summary: `Video ${event.width || '?'}×${event.height || '?'} ${event.format || 'mp4'} ${event.duration ? `(${Math.round(event.duration)}s)` : ''}`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                if (vidUrl) {
                  console.log(`[Canvas] Video ready: ${event.width}×${event.height} ${event.format || 'mp4'}`, vidUrl.slice(0, 80));
                }
                break;
              }
              case 'archive_result': {
                // Archive processed — ZIP/TAR/etc result
                const te: ToolEvent = {
                  type: 'archive_result',
                  format: event.format,
                  summary: event.operation
                    ? `Archive ${event.operation}: ${event.sizeFormatted || ''} ${event.format || 'zip'}${event.entryCount ? ` (${event.entryCount} files)` : ''}${event.safe !== undefined ? (event.safe ? ' ✓ safe' : ' ⚠ unsafe') : ''}`
                    : event.message || 'Archive operation complete',
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                if (event.archiveUrl) {
                  console.log(`[Canvas] Archive ready: ${event.operation} ${event.format || 'zip'}`, event.archiveUrl.slice(0, 80));
                }
                break;
              }
              case 'backend_result': {
                // Backend code generation result
                const te: ToolEvent = {
                  type: 'backend_result',
                  summary: event.message || `Backend ${event.operation || 'tool'}: ${event.fileCount ? `${event.fileCount} file(s) generated` : 'complete'}`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                console.log(`[Canvas] Backend generated: ${event.operation}/${event.action}`, event.fileCount, 'files');
                break;
              }
              case 'code_result': {
                // Code Intelligence tool result
                const te: ToolEvent = {
                  type: 'code_result',
                  tool: event.tool,
                  summary: event.message || `Code ${event.tool || 'tool'}: ${event.success ? 'success' : 'failed'}`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                console.log(`[Canvas] Code tool: ${event.tool}`, event.success);
                break;
              }
              // Agent Memory events
              case 'agent_memory_result': {
                const te: ToolEvent = {
                  type: 'agent_memory',
                  tool: 'agent_memory',
                  summary: `Memory ${event.operation}: ${event.key || 'keys'}`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                console.log(`[Canvas] Agent memory: ${event.operation}`, event.key);
                break;
              }
              // Agent Safety events
              case 'agent_approval_request': {
                const te: ToolEvent = {
                  type: 'agent_approval',
                  tool: 'agent_safety',
                  summary: `Approval needed: ${event.action} (${event.level})`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                console.log(`[Canvas] Approval request: ${event.interactionId}`, event.action);
                agentInteractionRef.current?.showApproval(event);
                break;
              }
              // Agent UI events
              case 'agent_ui_message':
              case 'agent_ui_question': {
                const te: ToolEvent = {
                  type: 'agent_ui',
                  tool: 'agent_ui',
                  summary: event.content || event.question || `UI: ${event.type}`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                if (event.type === 'agent_ui_question' && event.interactionId) {
                  agentInteractionRef.current?.showQuestion(event);
                }
                console.log(`[Canvas] Agent UI: ${event.type}`, event.content || event.question);
                break;
              }
              case 'agent_ui_progress':
              case 'agent_ui_toast': {
                const te: ToolEvent = {
                  type: 'agent_ui',
                  tool: 'agent_ui',
                  summary: event.content || `UI: ${event.type}`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                if (event.type === 'agent_ui_toast') {
                  agentInteractionRef.current?.showToast(event.level || 'info', event.content || '');
                }
                console.log(`[Canvas] Agent UI: ${event.type}`, event.content);
                break;
              }
              case 'agent_ui_close': {
                const te: ToolEvent = {
                  type: 'agent_ui',
                  tool: 'agent_ui',
                  summary: `UI: close`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                break;
              }
              // Agent Control events
              case 'agent_mode_change': {
                const te: ToolEvent = {
                  type: 'agent_control',
                  tool: 'agent_control',
                  summary: `Mode: ${event.previousMode} → ${event.newMode}`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                console.log(`[Canvas] Mode change: ${event.previousMode} → ${event.newMode}`);
                break;
              }
              case 'agent_status_change':
              case 'agent_task_started':
              case 'agent_task_completed':
              case 'agent_task_cancelled': {
                const te: ToolEvent = {
                  type: 'agent_control',
                  tool: 'agent_control',
                  summary: event.taskName || event.message || event.type,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(te);
                setLiveToolEvents([...toolEventsCollected]);
                console.log(`[Canvas] Agent control: ${event.type}`, event.taskName);
                break;
              }
              case 'editor_command': {
                // Editor bridge commands from tools (cursor move, file switch, etc.)
                if (event.command === 'switch_file' && event.path) {
                  editorBridge.setActiveFile(event.path);
                } else if ((event.command === 'set_cursor' || event.command === 'select_range') && event.path) {
                  editorBridge.setActiveFile(event.path);
                }
                const ece: ToolEvent = {
                  type: 'tool_result',
                  tool: 'editor_command',
                  success: true,
                  summary: `Editor: ${event.command ?? ''}${event.path ? ` → ${event.path}` : ''}`,
                  timestamp: Date.now(),
                };
                toolEventsCollected.push(ece);
                setLiveToolEvents([...toolEventsCollected]);
                break;
              }
              case 'done': {
                // Apply final project files
                if (event.projectFiles) {
                  Object.entries(event.projectFiles).forEach(([path, content]) => {
                    editorBridge.setFile(path, content as string);
                  });
                }

                // Find main file
                const allFiles = editorBridge.fileList;
                const mainFile = allFiles.find(f => f === 'index.html') ||
                  allFiles.find(f => f.endsWith('.html')) ||
                  allFiles.find(f => f === 'App.tsx') ||
                  allFiles[0] || 'index.html';
                const mainCode = editorBridge.files.get(mainFile) || '';

                // Detect language from main file extension
                const ext = mainFile.split('.').pop()?.toLowerCase() || 'html';
                const langMap: Record<string, string> = {
                  html: 'html', htm: 'html', tsx: 'react', jsx: 'react',
                  ts: 'typescript', js: 'javascript', py: 'python',
                  java: 'java', go: 'go', rs: 'rust', c: 'c', cpp: 'cpp', cc: 'cpp', h: 'c',
                  php: 'php', rb: 'ruby', swift: 'swift', kt: 'kotlin', kts: 'kotlin',
                  cs: 'csharp', csx: 'csharp', sql: 'sql', sh: 'shell', bash: 'shell',
                };
                const detectedLang = langMap[ext] || 'html';

                // Build assistant message
                const assistantMsg: ChatMessage = {
                  role: 'model',
                  text: fullText || 'Done! Your code has been generated.',
                  timestamp: Date.now(),
                  toolEvents: toolEventsCollected.length > 0 ? [...toolEventsCollected] : undefined,
                };
                persistMessage('assistant', assistantMsg.text);

                // Update state
                const appId = currentApp?.id || Date.now().toString();
                const updatedApp: GeneratedApp = {
                  id: appId,
                  name: currentApp?.name || userPrompt.slice(0, 40),
                  code: mainCode,
                  language: detectedLang,
                  prompt: userPrompt,
                  timestamp: Date.now(),
                  history: [...conversationHistory, userMsg, assistantMsg],
                  slug: currentApp?.slug,
                };

                setCurrentApp(updatedApp);
                setConversationHistory(prev => [...prev, assistantMsg]);
                editorBridge.setActiveFile(mainFile);

                // Save to history
                saveHistory([updatedApp, ...history]);

                // Save to DB
                const dbFiles = editorBridge.fileList.map((fp: string) => ({
                  path: fp,
                  content: editorBridge.files.get(fp) || '',
                }));
                saveProjectToDB(updatedApp, dbFiles);

                // Switch to preview if files were written
                if (allFiles.length > 0) setViewMode(ViewMode.PREVIEW);

                // Push final response to preview for tool panels
                if (activePanelRef.current && FULLSCREEN_PANELS.includes(activePanelRef.current)) {
                  setPreviewContent({ type: 'html', title: 'Complete', icon: '✅', html: buildToolPreviewHtml(toolEventsCollected, fullText, true) });
                }

                // Create project if needed
                createProjectIfNeeded();
                break;
              }
              case 'error':
                throw new Error(event.error || 'Generation failed');
            }
          } catch (parseErr: any) {
            if (parseErr.message?.includes('Generation failed') || parseErr.message?.includes('HTTP')) throw parseErr;
          }
        }
      }
    } catch (err: any) {
      console.error('[Canvas] SSE error:', err);
      const errorMsg: ChatMessage = { role: 'model', text: `Error: ${err.message}`, timestamp: Date.now() };
      setConversationHistory(prev => [...prev, errorMsg]);
      setGenState(s => ({ ...s, error: err.message }));
    } finally {
      setGenState({ isGenerating: false, error: null, progressMessage: '' });
      setStreamingText('');
      setLiveToolEvents([]);
    }
  }, [genState.isGenerating, conversationHistory, currentApp, editorBridge, prompt, persistMessage]);

  // Simple chat mode — non-streaming conversational AI via /api/canvas/chat
  const handleChatMessage = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || genState.isGenerating) return;

    if (!isAuthenticated) {
      window.location.href = `https://mumtaz.ai/auth/login?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }

    const userMsg: ChatMessage = { role: 'user', text: userPrompt, timestamp: Date.now() };
    setConversationHistory(prev => [...prev, userMsg]);
    persistMessage('user', userPrompt);
    setGenState({ isGenerating: true, error: null, progressMessage: 'Thinking...' });
    setPrompt('');

    try {
      const response = await fetchWithCredentials('/api/canvas/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userPrompt,
          conversationHistory: conversationHistory.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
          appId: 'canvas',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

      const assistantMsg: ChatMessage = { role: 'model', text: data.message || 'No response', timestamp: Date.now() };
      setConversationHistory(prev => [...prev, assistantMsg]);
      persistMessage('assistant', assistantMsg.text);
    } catch (err: any) {
      console.error('[Canvas] Chat error:', err);
      const errorMsg: ChatMessage = { role: 'model', text: `Error: ${err.message}`, timestamp: Date.now() };
      setConversationHistory(prev => [...prev, errorMsg]);
      setGenState(s => ({ ...s, error: err.message }));
    } finally {
      setGenState({ isGenerating: false, error: null, progressMessage: '' });
    }
  }, [genState.isGenerating, conversationHistory, isAuthenticated, persistMessage]);

  // 🛑 Stop Generation
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setGenState({ isGenerating: false, error: null, progressMessage: '' });
    setStreamingText('');
    setLiveToolEvents([]);
  }, []);

  // 🔄 Regenerate — resend the last user message
  const handleRegenerateMessage = useCallback((messageIndex: number) => {
    // Find the last user message before this index
    const lastUserMsg = [...conversationHistory].slice(0, messageIndex).reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove messages from the regenerated model message onward
      setConversationHistory(prev => prev.slice(0, messageIndex));
      if (chatMode === 'chat') {
        handleChatMessage(lastUserMsg.text);
      } else {
        handleAgentMessage(lastUserMsg.text);
      }
    }
  }, [conversationHistory, chatMode, handleChatMessage, handleAgentMessage]);

  // ✏️ Edit message — update text and re-send
  const handleEditMessage = useCallback((messageIndex: number, newText: string) => {
    setConversationHistory(prev => {
      const updated = [...prev];
      updated[messageIndex] = { ...updated[messageIndex], text: newText, edited: true };
      // Remove all messages after the edited one to re-generate
      return updated.slice(0, messageIndex + 1);
    });
    // Re-send the edited message
    if (chatMode === 'chat') {
      handleChatMessage(newText);
    } else {
      handleAgentMessage(newText);
    }
  }, [chatMode, handleChatMessage, handleAgentMessage]);

  // 📌 Pin message
  const handlePinMessage = useCallback((messageIndex: number) => {
    setConversationHistory(prev => {
      const updated = [...prev];
      updated[messageIndex] = { ...updated[messageIndex], pinned: !updated[messageIndex].pinned };
      return updated;
    });
  }, []);

  // ❤️ Favorite message
  const handleFavoriteMessage = useCallback((messageIndex: number) => {
    setConversationHistory(prev => {
      const updated = [...prev];
      updated[messageIndex] = { ...updated[messageIndex], favorite: !updated[messageIndex].favorite };
      return updated;
    });
  }, []);

  // 📦 Archive conversation — persists to DB (ChatSession.isArchived)
  const handleArchiveConversation = useCallback(async () => {
    if (conversationHistory.length === 0) return;
    const title = conversationHistory[0]?.text.slice(0, 50) || 'Archived';
    const messagesPayload = conversationHistory.map(m => ({
      role: m.role,
      content: m.text,
    }));
    try {
      if (chatSessionIdRef.current) {
        // Existing DB session — flip its isArchived flag
        await chatSessionService.archive(chatSessionIdRef.current, true);
      } else {
        // No persisted session yet — create one with all messages then archive
        await chatSessionService.archiveFromConversation({
          name: title,
          messages: messagesPayload,
        });
      }
    } catch (err) {
      console.warn('[Canvas] Archive failed:', err);
    }
    setConversationHistory([]);
    // Reset session so next message creates a new DB session
    chatSessionIdRef.current = null;
  }, [conversationHistory]);

  // 📥 Export conversation
  const handleExportConversation = useCallback((format: 'markdown' | 'json' | 'pdf' | 'image') => {
    if (conversationHistory.length === 0) return;

    if (format === 'markdown') {
      const md = conversationHistory.map(m =>
        `## ${m.role === 'user' ? '👤 You' : '🤖 AI'} — ${new Date(m.timestamp).toLocaleString()}\n\n${m.text}\n`
      ).join('\n---\n\n');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `chat-export-${Date.now()}.md`; a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const json = JSON.stringify({ messages: conversationHistory, exportedAt: new Date().toISOString() }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `chat-export-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Generate printable HTML and trigger print as PDF
      const html = `<!DOCTYPE html><html><head><title>Chat Export</title><style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:20px}
        .msg{margin:12px 0;padding:12px;border-radius:8px}.user{background:#e0f7fa;text-align:right}.model{background:#f5f5f5}
        .meta{font-size:11px;color:#666;margin-bottom:4px}</style></head><body><h1>Chat Export</h1>
        ${conversationHistory.map(m => `<div class="msg ${m.role}"><div class="meta">${m.role === 'user' ? 'You' : 'AI'} — ${new Date(m.timestamp).toLocaleString()}</div><div>${m.text.replace(/\n/g, '<br>')}</div></div>`).join('')}
        </body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.print(); }
    } else if (format === 'image') {
      // Capture chat area as image using canvas
      const chatEl = document.querySelector('.custom-scrollbar');
      if (chatEl) {
        import('html2canvas').then(({ default: html2canvas }) => {
          html2canvas(chatEl as HTMLElement, { backgroundColor: '#0a0a0a' }).then(canvas => {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url; a.download = `chat-export-${Date.now()}.png`; a.click();
          });
        }).catch(() => {
          // Fallback: save as text file if html2canvas not available
          const text = conversationHistory.map(m => `[${m.role}] ${m.text}`).join('\n\n');
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `chat-export-${Date.now()}.txt`; a.click();
          URL.revokeObjectURL(url);
        });
      }
    }
  }, [conversationHistory]);

  // Template Click - Send to agent for generation
  const handleTemplateClick = (templatePrompt: string) => {
    setActivePanel('assistant');
    handleAgentMessage(`I want to build: ${templatePrompt}`);
  };

  const togglePanel = (panel: ActivePanel) => {
    if (activePanel === panel) {
      setActivePanel(null);
      setPreviewContent(null);
    } else {
      setActivePanel(panel);
      setPreviewContent(null);
    }
  };

  // Camera functions - selfie style with front/back camera
  const startCamera = async (facing: 'user' | 'environment' = facingMode) => {
    try {
      // Stop any existing stream first
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setShowCameraModal(true);
        setFacingMode(facing);
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setShowCameraModal(false);
    setCapturedImage(null);
  };

  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    startCamera(newFacing);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the image for front camera (selfie mode)
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
      }
    }
  };



  const savePhoto = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `photo_${Date.now()}.png`;
      link.href = capturedImage;
      link.click();
    }
  };

  // Screenshot - uses browser's screen capture API
  const captureScreenshot = async () => {
    try {
      // This opens the native browser dialog with Chrome Tab/Window/Entire Screen options
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor' // Suggests full screen but user can choose
        },
        audio: false
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Wait a moment for video to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture to canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/png');

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());

        // Download the screenshot
        const link = document.createElement('a');
        link.download = `screenshot_${Date.now()}.png`;
        link.href = imageData;
        link.click();
      }
    } catch (err) {
      console.error('Screenshot error:', err);
      // User cancelled or permission denied
    }
  };

  // Text-to-Speech using OpenAI TTS API
  const [ttsAudio, setTtsAudio] = useState<HTMLAudioElement | null>(null);

  const speakText = async (text: string) => {
    // Cancel any ongoing speech
    if (ttsAudio) {
      ttsAudio.pause();
      ttsAudio.currentTime = 0;
      setTtsAudio(null);
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    try {
      const response = await fetchWithCredentials('/api/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text, voice: 'nova', speed: 1.0 })
      });

      if (!response.ok) {
        // Fallback to browser TTS
        console.warn('[TTS] API failed, using browser fallback');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        return;
      }

      const data = await response.json();
      const audio = new Audio(data.audio);
      setTtsAudio(audio);

      audio.onended = () => {
        setIsSpeaking(false);
        setTtsAudio(null);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setTtsAudio(null);
      };

      audio.play();
    } catch (error) {
      console.error('[TTS] Error:', error);
      setIsSpeaking(false);
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const toggleSpeaker = () => {
    if (isSpeaking) {
      if (ttsAudio) {
        ttsAudio.pause();
        ttsAudio.currentTime = 0;
        setTtsAudio(null);
      }
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Speak the last agent message
      const lastAgentMessage = currentApp?.history.filter(m => m.role === 'model').pop();
      if (lastAgentMessage) {
        speakText(lastAgentMessage.text);
      } else {
        speakText('No agent response to read yet.');
      }
    }
  };

  const openInNewTab = () => {
    if (currentApp?.code) {
      // Create a blob URL for safe preview without document.write
      const blob = new Blob([currentApp.code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      // Revoke the blob URL after a delay to free memory
      if (newWindow) {
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    }
  };

  const deleteProject = () => {
    if (currentApp && confirm('Delete this project?')) {
      setHistory(history.filter(h => h.id !== currentApp.id));
      setCurrentApp(null);
    }
  };

  const copyCode = () => {
    if (currentApp?.code) {
      navigator.clipboard.writeText(currentApp.code);
      alert('Code copied!');
    }
  };

  // 🚀 Deploy app to get shareable URL
  const deployApp = async () => {
    if (!currentApp?.code) {
      alert('No app to deploy. Generate something first!');
      return;
    }

    setIsDeploying(true);
    setShowDeployModal(true);

    try {
      const response = await fetchWithCredentials('/api/hosting/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies for auth
        body: JSON.stringify({
          code: currentApp.code,
          name: currentApp.name || 'Untitled App',
          description: currentApp.prompt,
          language: currentApp.language || 'html',
          isPublic: true,
          originalPrompt: currentApp.prompt,
          sourceApp: 'canvas',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to deploy');
      }

      const data = await response.json();

      if (data.success && data.app?.url) {
        setDeployedUrl(data.app.url);
      } else {
        throw new Error(data.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Deploy error:', error);
      alert('Failed to deploy: ' + (error as Error).message);
      setShowDeployModal(false);
    } finally {
      setIsDeploying(false);
    }
  };

  // Copy deployed URL to clipboard
  const copyDeployedUrl = () => {
    if (deployedUrl) {
      navigator.clipboard.writeText(deployedUrl);
      alert('URL copied to clipboard!');
    }
  };

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-white dark:bg-[#0a0a0a] text-slate-700 dark:text-slate-300 matrix-bg' : 'bg-gray-100 text-gray-800'}`}>
      {/* Activation Overlay */}
      <Overlay active={isOverlayActive} onActivate={() => setIsOverlayActive(false)} />

      {/* Main Content Area - subtract footer height (32px) */}
      <div className={`flex flex-1 overflow-hidden transition-opacity duration-300 ${isOverlayActive ? 'opacity-0' : 'opacity-100'}`} style={{ height: 'calc(100vh - 32px)', marginBottom: '32px' }}>
        {/* 1. Left Vertical Nav Bar - Neural Style */}
        <nav className={`w-16 ${isDarkMode ? 'bg-white dark:bg-[#111]/95 border-slate-200 dark:border-slate-800/50' : 'bg-white border-gray-200'} backdrop-blur-md flex flex-col items-center shrink-0 z-[60] border-r relative`}>


          {/* Logo + Analytics Button */}
          <div className={`py-3 border-b ${isDarkMode ? 'border-slate-200 dark:border-slate-800/50' : 'border-gray-200'} w-full flex flex-col items-center gap-2`}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-900/30">
              <img
                src="/logo.png"
                alt="Mumtaz AI"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to text logo if image fails
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-900 dark:text-white font-bold text-lg">O</div>';
                }}
              />
            </div>
            <button onClick={() => setShowAnalytics(true)} className="p-1.5 rounded-lg transition-all text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/20 hover:shadow-[0_0_8px_rgba(34,211,238,0.3)]" title="Analytics Dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Scrollable Icon Area */}
          <div
            ref={sidebarRef}
            className={`flex-1 overflow-y-auto overflow-x-hidden py-2 w-full custom-scrollbar transition-all duration-500 ${sidebarHighlight ? 'bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-500/10 shadow-[inset_0_0_20px_rgba(34,211,238,0.15)]' : ''}`}
            style={{ scrollbarWidth: 'none' }}
          >
            <div className="flex flex-col items-center gap-1 px-2">
              {/* Home */}
              <button onClick={() => window.location.href = '/'} className={`p-2.5 rounded-lg ${isDarkMode ? 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10' : 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 hover:bg-cyan-50'} transition-all w-full flex justify-center border border-transparent ${isDarkMode ? 'hover:border-indigo-500/20' : 'hover:border-cyan-200'}`} title="Home">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>

              {/* AI Assistant - Chat (moved up) */}
              <button onClick={() => togglePanel('assistant')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'assistant' ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`} title="AI Assistant">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>

              {/* Workspace */}
              <button onClick={() => togglePanel('workspace')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'workspace' ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`} title="Workspace">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>

              {/* Files */}
              <button onClick={() => togglePanel('files')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'files' ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`} title="Files">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>

              {/* History */}
              <button onClick={() => togglePanel('history')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'history' ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`} title="History">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Tools */}
              <button onClick={() => togglePanel('tools')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'tools' ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`} title="Tools">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <div className="w-8 border-t border-slate-200 dark:border-slate-800/50 my-2"></div>

              {/* Preview Mode */}
              <button onClick={() => setViewMode(ViewMode.PREVIEW)} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${viewMode === ViewMode.PREVIEW ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20'}`} title="Preview">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>

              {/* Code Mode */}
              <button onClick={() => setViewMode(ViewMode.CODE)} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${viewMode === ViewMode.CODE ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20'}`} title="Code">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>

              {/* Split Mode */}
              <button onClick={() => setViewMode(ViewMode.SPLIT)} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${viewMode === ViewMode.SPLIT ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20'}`} title="Split View">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>

              <div className="w-8 border-t border-slate-200 dark:border-slate-800/50 my-2"></div>

              {/* Desktop Preview */}
              <button onClick={() => setDeviceMode('desktop')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${deviceMode === 'desktop' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 border-transparent hover:border-purple-500/20'}`} title="Desktop Preview">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Tablet Preview */}
              <button onClick={() => setDeviceMode('tablet')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${deviceMode === 'tablet' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 border-transparent hover:border-purple-500/20'}`} title="Tablet Preview">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Mobile Preview */}
              <button onClick={() => setDeviceMode('mobile')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${deviceMode === 'mobile' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 border-transparent hover:border-purple-500/20'}`} title="Mobile Preview">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Camera */}
              <button onClick={() => isCameraActive ? stopCamera() : startCamera()} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${isCameraActive ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`} title="Camera (Selfie)">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Speaker - Listen to Agent */}
              <button onClick={toggleSpeaker} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${isSpeaking ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse' : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20'}`} title="Listen to Agent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>

              {/* Screenshot - Screen Capture */}
              <button onClick={captureScreenshot} className="p-2.5 rounded-lg text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 transition-all w-full flex justify-center border border-transparent hover:border-indigo-500/20" title="Screenshot (Screen Capture)">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Share */}
              <button onClick={copyCode} className="p-2.5 rounded-lg text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 transition-all w-full flex justify-center border border-transparent hover:border-indigo-500/20" title="Share">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>

              {/* 🚀 DEPLOY - One Click Deploy */}
              <button
                onClick={deployApp}
                disabled={!currentApp?.code || isDeploying}
                className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${isDeploying
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse'
                  : currentApp?.code
                    ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 border-transparent hover:border-orange-500/30 hover:shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                    : 'text-gray-600 cursor-not-allowed border-transparent'
                  }`}
                title="Deploy & Get Shareable URL"
              >
                {isDeploying ? (
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
              </button>

              {/* Open in New Tab */}
              <button onClick={openInNewTab} className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all w-full flex justify-center" title="Open in New Tab">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>

              {/* Delete */}
              <button onClick={deleteProject} className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full flex justify-center" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Templates */}
              <button onClick={() => togglePanel('templates')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'templates' ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`} title="Code Templates">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </button>

              {/* Deploy - Rocket Icon */}
              <button onClick={() => togglePanel('deploy')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'deploy' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 border-transparent hover:border-orange-500/20'}`} title="Deploy">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </button>

              {/* Deploy Credentials - Key Icon */}
              <button onClick={() => togglePanel('credentials')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'credentials' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 border-transparent hover:border-violet-500/20'}`} title="Deploy Credentials">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </button>

              {/* Video Generation - Film Icon */}
              <button onClick={() => togglePanel('video')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'video' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'text-gray-500 hover:text-pink-400 hover:bg-pink-500/10 border-transparent hover:border-pink-500/20'}`} title="Generate Video">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>

              {/* AI Analysis - Robot Icon */}
              <button onClick={() => togglePanel('ai')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'ai' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(251,146,60,0.2)]' : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 border-transparent hover:border-amber-500/20'}`} title="AI Code Analysis">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Project Management - Folder Icon */}
              <button onClick={() => togglePanel('project')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'project' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.2)]' : 'text-gray-500 hover:text-teal-400 hover:bg-teal-500/10 border-transparent hover:border-teal-500/20'}`} title="Projects">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>

              {/* Build & Deploy - Hammer Icon */}
              <button onClick={() => togglePanel('build')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'build' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 border-transparent hover:border-indigo-500/20'}`} title="Build">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.452a6 6 0 00-3.86.454l-.286.05a6 6 0 00-2.693-1.732l-.724-.898a6 6 0 00-7.652 7.652l.898.724a6 6 0 001.732 2.693l-.05.286a6 6 0 00-.454 3.86l.452 2.387a2 2 0 00.547 1.022l10.855 10.855c.363.363.852.565 1.414.565H19a2 2 0 002-2V4a2 2 0 00-2-2h-.572a2 2 0 00-1.414.586l-.869.869m.31 5.093a9.01 9.01 0 00-1.771-1.771m2.4 2.4a9.01 9.01 0 011.771-1.771" />
                </svg>
              </button>

              {/* Database - Database Icon */}
              <button onClick={() => togglePanel('database')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'database' ? 'bg-lime-500/20 text-lime-400 border-lime-500/30 shadow-[0_0_10px_rgba(132,204,22,0.2)]' : 'text-gray-500 hover:text-lime-400 hover:bg-lime-500/10 border-transparent hover:border-lime-500/20'}`} title="Database">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7m0 0c0 2.21-3.582 4-8 4s-8-1.79-8-4m0 0C4 4.79 7.582 3 12 3s8 1.79 8 4m-8 12c-4.418 0-8-1.79-8-4" />
                </svg>
              </button>

              {/* Assets - Image Icon */}
              <button onClick={() => togglePanel('assets')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'assets' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 border-transparent hover:border-rose-500/20'}`} title="Assets">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Collaboration - Users Icon */}
              <button onClick={() => togglePanel('collaboration')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'collaboration' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 border-transparent hover:border-orange-500/20'}`} title="Collaboration">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.048M7.828 9.14A4 4 0 009.732 3h4.536a4 4 0 011.904 6.14M16 19H8a2 2 0 01-2-2v-3a6 6 0 0112 0v3a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Code Tools - Terminal Icon */}
              <button onClick={() => togglePanel('code-tools')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'code-tools' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]' : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20'}`} title="Code Tools">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>

              {/* Backend Tools - Server Icon */}
              <button onClick={() => togglePanel('backend-tools')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'backend-tools' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 border-transparent hover:border-indigo-500/20'}`} title="Backend Tools">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </button>

              {/* Communication - Bell Icon */}
              <button onClick={() => togglePanel('communication')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'communication' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 border-transparent hover:border-blue-500/20'}`} title="Communication">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Docker - Cube Icon */}
              <button onClick={() => togglePanel('docker')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'docker' ? 'bg-sky-500/20 text-sky-400 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]' : 'text-gray-500 hover:text-sky-400 hover:bg-sky-500/10 border-transparent hover:border-sky-500/20'}`} title="Docker & Deploy">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </button>

              {/* Video Processing - Film Icon */}
              <button onClick={() => togglePanel('video-processing')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'video-processing' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'text-gray-500 hover:text-pink-400 hover:bg-pink-500/10 border-transparent hover:border-pink-500/20'}`} title="Video Processing">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </button>

              {/* Canvas Workspace Tools - Folder Icon */}
              <button onClick={() => togglePanel('canvas-tools')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'canvas-tools' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.2)]' : 'text-gray-500 hover:text-teal-400 hover:bg-teal-500/10 border-transparent hover:border-teal-500/20'}`} title="Canvas Workspace">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>

              {/* Image Tools - Photo Icon */}
              <button onClick={() => togglePanel('image-tools')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'image-tools' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 border-transparent hover:border-violet-500/20'}`} title="Image Tools">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Dev Tools - Wrench Icon */}
              <button onClick={() => togglePanel('dev-tools')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'dev-tools' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 border-transparent hover:border-orange-500/20'}`} title="Dev Tools">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Document Parsing - Document Icon */}
              <button onClick={() => togglePanel('document-parsing')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'document-parsing' ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10 border-transparent hover:border-red-500/20'}`} title="Document Parsing">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* API Tools - Plug/Connection Icon */}
              <button onClick={() => togglePanel('api-tools')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'api-tools' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 border-transparent hover:border-indigo-500/20'}`} title="API Tools">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Web Tools - Globe Icon */}
              <button onClick={() => togglePanel('web-tools')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'web-tools' ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`} title="Web Tools">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </button>

              {/* Security - Shield Icon */}
              <button onClick={() => togglePanel('security')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'security' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 border-transparent hover:border-rose-500/20'}`} title="Security">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </button>

              {/* Markdown & Content - Document-text Icon */}
              <button onClick={() => togglePanel('content-markdown')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'content-markdown' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 border-transparent hover:border-amber-500/20'}`} title="Markdown & Content">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {/* Workflow Automation */}
              <button onClick={() => togglePanel('workflow')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'workflow' ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`} title="Workflow Automation">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>

              {/* Knowledge Graph */}
              <button onClick={() => togglePanel('knowledge-graph')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'knowledge-graph' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 border-transparent hover:border-violet-500/20'}`} title="Knowledge Graph">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
              </button>

              {/* Business Growth */}
              <button onClick={() => togglePanel('business-growth')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'business-growth' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20'}`} title="Business Growth">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </button>

              {/* Advanced AI */}
              <button onClick={() => togglePanel('advanced-ai')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'advanced-ai' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 border-transparent hover:border-blue-500/20'}`} title="Advanced AI">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </button>

              {/* Data Science */}
              <button onClick={() => togglePanel('data-science')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'data-science' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.2)]' : 'text-gray-500 hover:text-teal-400 hover:bg-teal-500/10 border-transparent hover:border-teal-500/20'}`} title="Data Science">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </button>

              {/* Geo & Location */}
              <button onClick={() => togglePanel('geo')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'geo' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 border-transparent hover:border-amber-500/20'}`} title="Geo & Location">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>

              {/* Cloud Control */}
              <button onClick={() => togglePanel('cloud')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'cloud' ? 'bg-sky-500/20 text-sky-400 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]' : 'text-gray-500 hover:text-sky-400 hover:bg-sky-500/10 border-transparent hover:border-sky-500/20'}`} title="Cloud Control">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
              </button>

              {/* Advanced Security */}
              <button onClick={() => togglePanel('advanced-security')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'advanced-security' ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10 border-transparent hover:border-red-500/20'}`} title="Advanced Security">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </button>

              {/* Enterprise Tools Separator */}
              <div className="w-8 border-t border-slate-300 dark:border-slate-700/50 my-1"></div>

              {/* Financial */}
              <button onClick={() => togglePanel('financial')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'financial' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20'}`} title="Financial">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              {/* Project Management */}
              <button onClick={() => togglePanel('project-management')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'project-management' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 border-transparent hover:border-blue-500/20'}`} title="Project Management">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </button>

              {/* Email & Communication */}
              <button onClick={() => togglePanel('email')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'email' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 border-transparent hover:border-violet-500/20'}`} title="Email & Communication">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </button>

              {/* Sales & CRM */}
              <button onClick={() => togglePanel('sales-crm')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'sales-crm' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 border-transparent hover:border-amber-500/20'}`} title="Sales & CRM">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </button>

              {/* HR & Recruiting */}
              <button onClick={() => togglePanel('hr-recruiting')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'hr-recruiting' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'text-gray-500 hover:text-pink-400 hover:bg-pink-500/10 border-transparent hover:border-pink-500/20'}`} title="HR & Recruiting">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              </button>

              {/* Legal & Compliance */}
              <button onClick={() => togglePanel('legal-compliance')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'legal-compliance' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 border-transparent hover:border-indigo-500/20'}`} title="Legal & Compliance">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              </button>

              {/* Marketing & SEO */}
              <button onClick={() => togglePanel('marketing-seo')} className={`p-2.5 rounded-lg transition-all w-full flex justify-center border ${activePanel === 'marketing-seo' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 border-transparent hover:border-rose-500/20'}`} title="Marketing & SEO">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </button>

              {/* Dark/Light Mode */}
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all w-full flex justify-center" title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Scroll indicator - shows during highlight animation */}
            {sidebarHighlight && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>

          {/* Fixed Status at Bottom */}
          <div className={`py-3 border-t ${isDarkMode ? 'border-slate-200 dark:border-slate-800/50' : 'border-gray-200'} w-full flex justify-center`}>
            <div className={`w-2 h-2 rounded-full ${genState.isGenerating ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'} shadow-sm shadow-emerald-500/50`}></div>
          </div>
        </nav>

        {/* 2. Main Content Area - Neural Style */}
        <div className={`flex-1 flex flex-col relative overflow-hidden ${isDarkMode ? 'bg-white dark:bg-[#0a0a0a]' : 'bg-gray-50'}`} style={{ minHeight: 0 }}>
          {/* Workspace Content (Preview/Code) - Full Height */}
          <main className="flex-1 relative flex" style={{ minHeight: 0 }}>
            {!isFullscreenPanel && (
            <div className={`flex-1 relative overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800/50' : 'bg-gray-100 border-gray-200'} m-2 rounded-lg border shadow-[0_0_40px_rgba(0,0,0,0.3)]`} style={{ minHeight: 0 }}>
              {genState.isGenerating && (
                <div className={`absolute inset-0 z-40 ${isDarkMode ? 'bg-slate-50 dark:bg-slate-950/90' : 'bg-white/90'} backdrop-blur-md flex flex-col items-center justify-center animate-fade-in`}>
                  {/* Animated spinner with glow */}
                  <div className="relative mb-8">
                    <div className="w-20 h-20 border-4 border-cyan-900/50 border-t-cyan-400 rounded-full animate-spin shadow-xl shadow-cyan-500/30"></div>
                    <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-purple-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    <div className="absolute inset-2 w-16 h-16 flex items-center justify-center">
                      <span className="text-3xl animate-pulse">{commentary.emoji}</span>
                    </div>
                  </div>

                  {/* Model info */}
                  <div className="text-center mb-4">
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-tight glow-cyan">
                      {genState.progressMessage}
                    </p>
                  </div>

                  {/* Fun rotating commentary */}
                  <div className="text-center max-w-md px-4">
                    <p
                      className={`text-base font-medium ${isDarkMode ? 'text-slate-700 dark:text-slate-300' : 'text-gray-600'} transition-all duration-500 ease-in-out`}
                      style={{ animation: 'fadeSlide 2s ease-in-out infinite' }}
                    >
                      {commentary.text}
                    </p>
                  </div>

                  {/* Progress dots animation */}
                  <div className="flex gap-2 mt-6">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-cyan-500/50"
                        style={{
                          animation: 'pulse 1.5s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
              {/* Device Frame Preview */}
              <div className="h-full w-full flex items-center justify-center p-4" style={{ minHeight: 0 }}>
                <div
                  className={`${isDarkMode ? 'bg-slate-50 dark:bg-[#0d0d0d] border-slate-200 dark:border-slate-800/50' : 'bg-white border-gray-200'} rounded-lg shadow-2xl overflow-hidden transition-all duration-300 border flex flex-col ${deviceMode === 'desktop' ? 'w-full h-full' : ''}`}
                  style={deviceMode !== 'desktop' ? { width: DEVICE_SIZES[deviceMode].width, height: DEVICE_SIZES[deviceMode].height } : { height: '100%', width: '100%' }}
                >
                  {/* Preview Mode Toggle */}
                  {(viewMode === ViewMode.PREVIEW || viewMode === ViewMode.SPLIT) && (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/50 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewMode('browser')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${previewMode === 'browser'
                            ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40'
                            : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10'
                            }`}
                        >
                          🌐 Browser
                        </button>
                        <button
                          onClick={() => setPreviewMode('cloud')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${previewMode === 'cloud'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                            : 'text-gray-500 hover:text-purple-400 hover:bg-purple-500/10'
                            }`}
                        >
                          ☁️ Cloud
                        </button>
                      </div>
                      <span className="text-[9px] text-gray-600">
                        {previewMode === 'browser' ? 'In-browser sandbox (Sandpack)' : 'Cloud sandbox (real npm/build)'}
                      </span>
                    </div>
                  )}
                  {viewMode === ViewMode.PREVIEW ? (
                    <div className="w-full h-full flex-1" style={{ minHeight: 0 }}>
                      {/* Show PanelPreview when a feature panel is active and has content or no app loaded */}
                      {activePanel && !isFullscreenPanel && !['workspace', 'assistant', 'files', 'tools', 'settings', 'history'].includes(activePanel) && (previewContent || !currentApp?.code) ? (
                        <PanelPreview activePanel={activePanel} previewContent={previewContent} />
                      ) : previewMode === 'browser' ? (
                        <Preview code={currentApp?.code || ''} language={currentApp?.language?.toLowerCase() || 'html'} projectFiles={projectFiles} onFilesGenerated={handlePreviewFilesGenerated} />
                      ) : (
                        <CloudPreview
                          projectFiles={projectFiles}
                          onDeployComplete={(url) => {
                            setDeployedUrl(url);
                            setShowDeployModal(true);
                          }}
                        />
                      )}
                    </div>
                  ) : viewMode === ViewMode.CODE ? (
                    <CodeView
                      code={currentApp?.code || ''}
                      files={editorBridge.files}
                      activeFile={editorBridge.activeFile}
                      fileList={editorBridge.fileList}
                      onFileSelect={(f) => editorBridge.setActiveFile(f)}
                      onCodeChange={(newCode) => {
                        if (editorBridge.activeFile) {
                          editorBridge.setFile(editorBridge.activeFile, newCode);
                          collaboration.sendFileChange(editorBridge.activeFile, newCode);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex h-full">
                      <div className={`w-1/2 border-r ${isDarkMode ? 'border-slate-200 dark:border-slate-800' : 'border-gray-200'}`}>
                        {previewMode === 'browser' ? (
                          <Preview code={currentApp?.code || ''} language={currentApp?.language?.toLowerCase() || 'html'} projectFiles={projectFiles} onFilesGenerated={handlePreviewFilesGenerated} />
                        ) : (
                          <CloudPreview
                            projectFiles={projectFiles}
                            onDeployComplete={(url) => {
                              setDeployedUrl(url);
                              setShowDeployModal(true);
                            }}
                          />
                        )}
                      </div>
                      <div className="w-1/2">
                        <CodeView
                          code={currentApp?.code || ''}
                          files={editorBridge.files}
                          activeFile={editorBridge.activeFile}
                          fileList={editorBridge.fileList}
                          onFileSelect={(f) => editorBridge.setActiveFile(f)}
                          onCodeChange={(newCode) => {
                            if (editorBridge.activeFile) {
                              editorBridge.setFile(editorBridge.activeFile, newCode);
                              collaboration.sendFileChange(editorBridge.activeFile, newCode);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* 3. Right Toggleable Panels (Drawer-style) - Neural Style */}
            <div
              className={`h-full max-h-full ${isDarkMode ? 'bg-white dark:bg-[#111]/95 border-slate-200 dark:border-slate-800/50' : 'bg-white border-gray-200'} backdrop-blur-md border-l transition-all duration-300 ease-in-out flex shrink-0 shadow-2xl ${!activePanel ? 'w-0 border-l-0 opacity-0' : isFullscreenPanel ? 'flex-1' : 'w-80'
                }`}
              style={{ height: '100%', maxHeight: '100%' }}
            >
              <div className={`${isFullscreenPanel ? 'w-full' : 'w-80'} flex flex-col`} style={{ height: '100%', maxHeight: '100%', overflow: 'hidden', paddingBottom: '0' }}>
                {/* Plan gate — redirect to central pricing page */}
                {!hasPlan ? (
                  <div className="h-full flex flex-col items-center justify-center px-6 py-8 text-center bg-white dark:bg-[#111]/98 backdrop-blur-xl">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Subscription Required</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-[240px]">
                      You need an active AI Canvas Pro plan to access premium features.
                    </p>
                    {!isAuthenticated ? (
                      <button
                        onClick={() => {
                          window.location.href = `https://mumtaz.ai/auth/login?redirect=${encodeURIComponent(window.location.href)}`;
                        }}
                        className="w-full max-w-[220px] py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 dark:text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25 text-sm"
                      >
                        Sign In to Continue
                      </button>
                    ) : (
                      <a
                        href="https://mumtaz.ai/overview/pricing"
                        className="w-full max-w-[220px] py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 dark:text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25 text-sm text-center inline-block"
                      >
                        View Plans & Subscribe
                      </a>
                    )}
                  </div>
                ) : (
                <>
                {activePanel === 'workspace' && (
                  <div className={`h-full flex flex-col ${isDarkMode ? 'bg-white dark:bg-[#111]/95' : 'bg-white'}`}>
                    {/* Fixed Header */}
                    <div className={`px-6 py-4 flex items-center justify-between`}>
                      <h3 className={`text-xs font-bold ${isDarkMode ? 'text-cyan-500/80' : 'text-cyan-600'} uppercase tracking-widest`}>
                        Workspace
                      </h3>
                      <button
                        onClick={() => setActivePanel(null)}
                        className={`${isDarkMode ? 'text-gray-600 hover:text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-cyan-600'} transition-colors`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-scroll px-6 pb-6" style={{ maxHeight: 'calc(100vh - 60px)' }}>
                      <div className="mb-6">
                        <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'} uppercase mb-2 tracking-widest`}>
                          Message Agent
                        </label>
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Say hi, describe what you want to build, or ask anything..."
                          className={`w-full p-4 text-xs border ${isDarkMode ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 placeholder:text-gray-700' : 'border-gray-200 bg-gray-50 text-gray-800 placeholder:text-slate-500 dark:text-slate-400'} rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-indigo-500/50 outline-none min-h-[120px] resize-none transition-all`}
                        />
                        <button
                          onClick={() => handleAgentMessage(prompt)}
                          disabled={genState.isGenerating || !prompt.trim()}
                          className="w-full mt-3 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 text-slate-900 dark:text-white text-xs font-bold rounded-lg hover:from-cyan-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-900/30 uppercase tracking-widest"
                        >
                          {genState.isGenerating ? 'THINKING...' : 'SEND'}
                        </button>
                      </div>

                      {/* Quick Actions */}
                      <div className="mb-6">
                        <h3 className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest mb-3`}>
                          Quick Actions
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {QUICK_ACTIONS.slice(0, 6).map((action) => (
                            <button
                              key={action.id}
                              onClick={() => {
                                const actionPrompts: Record<string, string> = {
                                  'dark-mode': 'Add a dark mode toggle to this app with smooth transitions',
                                  'responsive': 'Make this layout fully responsive for mobile, tablet and desktop',
                                  'animations': 'Add smooth CSS animations and transitions throughout the app',
                                  'accessibility': 'Improve accessibility with ARIA labels, focus states, and keyboard navigation',
                                  'loading': 'Add loading states and skeleton screens to improve UX',
                                  'validation': 'Add form validation with error messages and success states'
                                };
                                if (currentApp) {
                                  handleAgentMessage(actionPrompts[action.id] || action.description);
                                } else {
                                  setPrompt(actionPrompts[action.id] || action.description);
                                }
                              }}
                              className={`flex flex-col items-center gap-1 p-3 ${isDarkMode ? 'bg-slate-50 dark:bg-slate-950/30 hover:bg-cyan-500/10 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30' : 'bg-white hover:bg-cyan-50 border-gray-200 hover:border-cyan-300'} border rounded-lg transition-all`}
                              title={action.description}
                            >
                              <span className="text-lg">{action.icon}</span>
                              <span className={`text-[9px] font-bold ${isDarkMode ? 'text-slate-500 dark:text-slate-400' : 'text-gray-500'}`}>{action.label.split(' ')[0]}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Starter Templates */}
                      <div className="mb-6">
                        <h3 className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest mb-3`}>
                          Starter Templates
                        </h3>
                        <div className="space-y-2">
                          {PRESET_TEMPLATES.map((tpl) => (
                            <button
                              key={tpl.name}
                              onClick={() => handleTemplateClick(tpl.prompt)}
                              className={`w-full text-left px-4 py-3 text-xs ${isDarkMode ? 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 hover:bg-cyan-500/10 hover:border-indigo-500/30' : 'text-gray-600 bg-white border-gray-200 hover:bg-cyan-50 hover:border-cyan-300'} border rounded-lg transition-all flex items-center gap-3 group`}
                            >
                              <span className="text-xl">{tpl.icon}</span>
                              <div className="flex-1">
                                <span className={`${isDarkMode ? 'group-hover:text-indigo-600 dark:text-indigo-400' : 'group-hover:text-cyan-600'} transition-colors`}>{tpl.name}</span>
                                <span className="ml-2 text-[9px] text-gray-600">💬 Chat first</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activePanel === 'assistant' && (
                  <div className="h-full flex flex-col bg-white dark:bg-[#111]/95">
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ChatBox
                        messages={conversationHistory}
                        onSendMessage={chatMode === 'chat' ? handleChatMessage : handleAgentMessage}
                        isGenerating={genState.isGenerating}
                        onClose={() => setActivePanel(null)}
                        mode={chatMode}
                        onModeChange={setChatMode}
                        onStopGeneration={handleStopGeneration}
                        onRegenerateMessage={handleRegenerateMessage}
                        onEditMessage={handleEditMessage}
                        onPinMessage={handlePinMessage}
                        onFavoriteMessage={handleFavoriteMessage}
                        onArchiveConversation={handleArchiveConversation}
                        onExportConversation={handleExportConversation}
                        fontSize={chatFontSize}
                        onFontSizeChange={setChatFontSize}
                        temperature={temperature}
                        onTemperatureChange={setTemperature}
                        maxTokens={maxTokens}
                        onMaxTokensChange={setMaxTokens}
                        focusMode={focusMode}
                        onFocusModeToggle={() => setFocusMode(f => !f)}
                        onNewChat={() => {
                          setConversationHistory([]);
                          setCurrentApp(null);
                          const newApp = {
                            id: Date.now().toString(),
                            name: 'New App',
                            code: '',
                            prompt: '',
                            timestamp: Date.now(),
                            history: [],
                            language: 'html'
                          };
                          setCurrentApp(newApp);
                          setHistory(prev => [newApp, ...prev]);
                        }}
                        streamingText={streamingText}
                        toolEvents={liveToolEvents}
                        onLoadSession={(session) => {
                          setConversationHistory(session.messages || []);
                          setCurrentApp({
                            id: session.id,
                            name: session.title || session.id,
                            code: '',
                            prompt: '',
                            timestamp: session.timestamp || Date.now(),
                            history: session.messages || [],
                            language: 'html',
                          });
                        }}
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={setSelectedLanguage}
                      />
                    </div>
                  </div>
                )}

                {/* Files Panel */}
                {activePanel === 'files' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111]/95">
                    {/* Fixed Header */}
                    <div className="p-4 pb-3 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between shrink-0">
                      <h3 className="text-xs font-bold text-cyan-500/80 uppercase tracking-widest">
                        Project Files
                      </h3>
                      <button onClick={() => setActivePanel(null)} className="text-gray-600 hover:text-indigo-600 dark:text-indigo-400 transition-colors" title="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 min-h-0">
                      {projectFiles.length > 0 ? (
                        <>
                          {/* Project File Tree */}
                          <div className="mb-4">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                              {selectedTemplate?.name || 'Current Project'}
                            </h4>
                            <div className="space-y-1">
                              {projectFiles.map((file, idx) => (
                                <div key={idx}>
                                  <button
                                    onClick={() => {
                                      if (file.type === 'file' && file.content) {
                                        setSelectedFile(file);
                                        setCurrentApp(prev => prev ? { ...prev, code: file.content || '' } : {
                                          id: Date.now().toString(),
                                          name: file.name,
                                          code: file.content || '',
                                          prompt: 'Viewing file',
                                          timestamp: Date.now(),
                                          history: []
                                        });
                                        setViewMode(ViewMode.CODE);
                                      }
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-all border ${selectedFile?.name === file.name
                                      ? 'bg-cyan-500/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                                      : 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400'
                                      }`}
                                  >
                                    {file.type === 'folder' ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${file.language === 'python' ? 'text-green-500' :
                                        file.language === 'javascript' ? 'text-yellow-500' :
                                          file.language === 'typescript' ? 'text-blue-500' :
                                            file.language === 'html' ? 'text-orange-500' :
                                              file.language === 'css' ? 'text-purple-500' :
                                                'text-gray-500'
                                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    )}
                                    <span className="text-xs font-mono">{file.name}</span>
                                    {file.language && <span className="text-[9px] text-gray-600 ml-auto">{file.language}</span>}
                                  </button>
                                  {/* Show children for folders */}
                                  {file.children && file.children.length > 0 && (
                                    <div className="ml-4 mt-1 pl-3 border-l border-slate-200 dark:border-slate-800/50 space-y-1">
                                      {file.children.map((child, cidx) => (
                                        <button
                                          key={cidx}
                                          onClick={() => {
                                            if (child.type === 'file' && child.content) {
                                              setSelectedFile(child);
                                              setCurrentApp(prev => prev ? { ...prev, code: child.content || '' } : {
                                                id: Date.now().toString(),
                                                name: child.name,
                                                code: child.content || '',
                                                prompt: 'Viewing file',
                                                timestamp: Date.now(),
                                                history: []
                                              });
                                              setViewMode(ViewMode.CODE);
                                            }
                                          }}
                                          className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-all ${selectedFile?.name === child.name
                                            ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400'
                                            : 'hover:bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400'
                                            }`}
                                        >
                                          {child.type === 'folder' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                          ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${child.language === 'python' ? 'text-green-500' :
                                              child.language === 'javascript' ? 'text-yellow-500' :
                                                child.language === 'typescript' ? 'text-blue-500' :
                                                  child.language === 'html' ? 'text-orange-500' :
                                                    child.language === 'css' ? 'text-purple-500' :
                                                      'text-gray-500'
                                              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                          )}
                                          <span className="text-[10px] font-mono">{child.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Clear Project Button */}
                          <button
                            onClick={() => {
                              setProjectFiles([]);
                              setSelectedFile(null);
                              setSelectedTemplate(null);
                            }}
                            className="w-full py-2 text-[10px] font-bold bg-slate-50 dark:bg-slate-950/30 text-gray-500 hover:bg-red-500/10 hover:text-red-400 border border-slate-200 dark:border-slate-800 hover:border-red-500/30 rounded-lg transition-all uppercase tracking-widest"
                          >
                            Clear Project
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Empty State */}
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-14 h-14 bg-cyan-500/10 border border-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">No Project Files</p>
                            <p className="text-[10px] text-gray-600 mb-4">Choose a template to get started</p>
                            <button
                              onClick={() => setActivePanel('templates')}
                              className="px-4 py-2 text-[10px] font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 text-slate-900 dark:text-white rounded-lg hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all uppercase tracking-wider"
                            >
                              Browse Templates
                            </button>
                          </div>

                          {/* Quick Templates */}
                          <div className="mt-6">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Quick Start</h4>
                            <div className="space-y-1">
                              {PROJECT_TEMPLATES.slice(0, 3).map((tpl) => (
                                <button
                                  key={tpl.id}
                                  className="w-full text-left px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 rounded-lg transition-all group"
                                  onClick={() => {
                                    // Route through agent — backend defines tools, model chooses, backend executes
                                    handleTemplateClick(`Build a ${tpl.name} (${tpl.language}) — ${tpl.description}`);
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{tpl.icon}</span>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">{tpl.name}</span>
                                    <span className="text-[9px] text-gray-600 ml-auto">{tpl.files.length} files</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Tools Panel */}
                {activePanel === 'tools' && (
                  <div className="h-full flex flex-col bg-white dark:bg-[#111]/95">
                    {/* Fixed Header */}
                    <div className="px-6 py-4 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-cyan-500/80 uppercase tracking-widest">
                        Tools & Actions
                      </h3>
                      <button onClick={() => setActivePanel(null)} className="text-gray-600 hover:text-indigo-600 dark:text-indigo-400 transition-colors" title="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-scroll px-6 pb-6 space-y-6" style={{ maxHeight: 'calc(100vh - 60px)' }}>
                      {/* Quick Enhancements */}
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                          Quick Enhancements
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {QUICK_ACTIONS.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => {
                                const actionPrompts: Record<string, string> = {
                                  'dark-mode': 'Add a dark mode toggle to this app with smooth transitions',
                                  'responsive': 'Make this layout fully responsive for mobile, tablet and desktop',
                                  'animations': 'Add smooth CSS animations and transitions throughout the app',
                                  'accessibility': 'Improve accessibility with ARIA labels, focus states, and keyboard navigation',
                                  'loading': 'Add loading states and skeleton screens to improve UX',
                                  'validation': 'Add form validation with error messages and success states'
                                };
                                if (currentApp) {
                                  handleAgentMessage(actionPrompts[action.id] || action.description);
                                } else {
                                  setPrompt(actionPrompts[action.id] || action.description);
                                  setActivePanel('workspace');
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/30 hover:bg-cyan-500/10 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 rounded-lg transition-all text-left group"
                            >
                              <span className="text-sm">{action.icon}</span>
                              <span className="text-[10px] font-medium text-gray-500 group-hover:text-indigo-600 dark:text-indigo-400 truncate transition-colors">{action.label}...</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Settings Section */}
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                          Settings
                        </h4>

                        {/* SSE Streaming (always on) */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg">
                          <label className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">SSE Streaming</span>
                            </div>
                            <div className="w-5 h-5 rounded flex items-center justify-center bg-cyan-600 text-slate-900 dark:text-white shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Panel - Now just for additional settings */}
                {activePanel === 'settings' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111]/95">
                    {/* Fixed Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between shrink-0">
                      <h3 className="text-sm font-bold text-cyan-500/80 uppercase tracking-widest">
                        Settings
                      </h3>
                      <button onClick={() => setActivePanel(null)} className="text-gray-600 hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                      {/* Neural Mode Toggle */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Neural Mode</p>
                            <p className="text-[10px] text-gray-500">Cyberpunk interface active</p>
                          </div>
                          <div className="w-10 h-5 rounded-full transition-colors bg-cyan-600 shadow-[0_0_10px_rgba(34,211,238,0.3)]" onClick={() => setIsDarkMode(!isDarkMode)}>
                            <div className="w-4 h-4 rounded-full bg-white mt-0.5 transition-transform translate-x-5"></div>
                          </div>
                        </label>
                      </div>
                      {/* Auto-sync */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Auto-sync</p>
                            <p className="text-[10px] text-gray-500">Automatically save changes</p>
                          </div>
                          <div className="w-10 h-5 rounded-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-colors">
                            <div className="w-4 h-4 rounded-full bg-white mt-0.5 translate-x-5"></div>
                          </div>
                        </label>
                      </div>
                      {/* Export Options */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Export Options</p>
                        <div className="space-y-2">
                          <button
                            onClick={async () => {
                              try {
                                const { default: JSZip } = await import('jszip');
                                const zip = new JSZip();
                                const allFiles = editorBridge.files;
                                allFiles.forEach((content, path) => {
                                  zip.file(path, content);
                                });
                                const blob = await zip.generateAsync({ type: 'blob' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-export.zip`;
                                a.click();
                                URL.revokeObjectURL(url);
                              } catch (err: any) {
                                console.error('[Export] ZIP failed:', err);
                                alert('ZIP export failed: ' + err.message);
                              }
                            }}
                            className="w-full py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950/40 hover:bg-cyan-500/10 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 rounded-lg transition-all uppercase tracking-wider"
                          >
                            Download as ZIP
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const filesObj: Record<string, { content: string }> = {};
                                editorBridge.files.forEach((content, path) => {
                                  filesObj[path] = { content };
                                });
                                const params = new URLSearchParams();
                                params.set('parameters', JSON.stringify({ files: filesObj }));
                                window.open(`https://codesandbox.io/api/v1/sandboxes/define?${params.toString()}`, '_blank');
                              } catch (err: any) {
                                console.error('[Export] CodeSandbox failed:', err);
                                alert('CodeSandbox export failed: ' + err.message);
                              }
                            }}
                            className="w-full py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950/40 hover:bg-cyan-500/10 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 rounded-lg transition-all uppercase tracking-wider"
                          >
                            Export to CodeSandbox
                          </button>
                          <button
                            onClick={async () => {
                              const repoName = window.prompt('Enter GitHub repo name:', projectName.replace(/\s+/g, '-').toLowerCase());
                              if (!repoName) return;
                              try {
                                const filesObj: Record<string, string> = {};
                                editorBridge.files.forEach((content, path) => {
                                  filesObj[path] = content;
                                });
                                const res = await fetchWithCredentials('/api/credentials/deploy', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ provider: 'GITHUB', projectName: repoName, files: filesObj }),
                                });
                                const data = await res.json();
                                if (data.success) {
                                  window.open(data.url, '_blank');
                                } else {
                                  alert(data.error || 'Push to GitHub failed. Make sure your GitHub token is configured in Deploy Credentials.');
                                }
                              } catch (err: any) {
                                alert('GitHub push failed: ' + err.message);
                              }
                            }}
                            className="w-full py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950/40 hover:bg-cyan-500/10 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 rounded-lg transition-all uppercase tracking-wider"
                          >
                            Push to GitHub
                          </button>
                        </div>
                      </div>
                      {/* API Keys */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">API Configuration</p>
                        <button
                          onClick={() => setActivePanel('credentials')}
                          className="w-full py-2 text-xs font-bold bg-gradient-to-r from-violet-600 to-cyan-600 text-slate-900 dark:text-white rounded-lg hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all uppercase tracking-wider"
                        >
                          Manage Deploy Tokens
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Panel */}
                {activePanel === 'history' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111]/95">
                    {/* Fixed Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between shrink-0">
                      <h3 className="text-sm font-bold text-cyan-500/80 uppercase tracking-widest">
                        Project History
                      </h3>
                      <button onClick={() => setActivePanel(null)} className="text-gray-600 hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                      {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                          <div className="w-12 h-12 bg-cyan-500/10 border border-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">No Projects Yet</p>
                          <p className="text-[10px] text-gray-600">Generate your first app to see it here</p>
                        </div>
                      ) : (
                        history.map((app) => (
                          <button
                            key={app.id}
                            onClick={async () => {
                              // Load full project data from DB if has slug
                              if (app.slug && !app.code) {
                                try {
                                  const res = await fetchWithCredentials(`/api/workspace/projects/${app.slug}`, { credentials: 'include' });
                                  if (res.ok) {
                                    const data = await res.json();
                                    if (data.success && data.project) {
                                      const p = data.project;
                                      const mainFile = p.files?.find((f: any) => f.isMain) || p.files?.[0];
                                      const loadedApp: GeneratedApp = {
                                        ...app,
                                        code: mainFile?.content || '',
                                        prompt: p.originalPrompt || p.description || app.prompt,
                                        history: p.editorState?.history || p.editorState?.conversationHistory || [],
                                      };
                                      // Apply files to editor
                                      if (p.files?.length > 0) {
                                        p.files.forEach((f: any) => {
                                          editorBridge.setFile(f.path, f.content || '');
                                        });
                                        if (mainFile) editorBridge.setActiveFile(mainFile.path);
                                      }
                                      setCurrentApp(loadedApp);
                                      setConversationHistory(loadedApp.history || []);
                                      setProjectSlug(app.slug);
                                      setProjectName(loadedApp.name);
                                      setActivePanel('workspace');
                                      return;
                                    }
                                  }
                                } catch { /* fall through to default */ }
                              }
                              // Fallback: use cached data
                              if (app.code) {
                                const ext = app.language === 'react' ? 'tsx' : app.language === 'python' ? 'py' : app.language === 'typescript' ? 'ts' : app.language === 'javascript' ? 'js' : 'html';
                                editorBridge.setFile(`App.${ext}`, app.code);
                                editorBridge.setActiveFile(`App.${ext}`);
                              }
                              setCurrentApp(app);
                              setConversationHistory(app.history || []);
                              setActivePanel('workspace');
                            }}
                            className={`w-full text-left p-4 rounded-lg transition-all border ${currentApp?.id === app.id
                              ? 'bg-cyan-500/20 border-indigo-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                              : 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 hover:bg-cyan-500/5'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${currentApp?.id === app.id ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 text-gray-500'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate ${currentApp?.id === app.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {app.name}
                                </p>
                                <p className="text-[10px] text-gray-600 mt-1 line-clamp-2">
                                  {app.prompt}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[9px] text-gray-600 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(app.timestamp).toLocaleDateString()}
                                  </span>
                                  <span className="text-[9px] text-gray-600 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {app.history?.length || 0} edits
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}

                      {history.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Clear all project history?')) {
                              // Delete each project from DB
                              history.forEach(app => {
                                if (app.slug) {
                                  fetchWithCredentials(`/api/workspace/projects/${app.slug}`, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                  }).catch(() => { });
                                }
                              });
                              setHistory([]);
                              memoryStorage.removeItem('gencraft_v4_history');
                            }
                          }}
                          className="w-full mt-4 py-2 text-[10px] font-bold text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-lg transition-all uppercase tracking-widest"
                        >
                          Clear History
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Code Templates Panel */}
                {activePanel === 'templates' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111]/95" style={{ height: '100%' }}>
                    {/* Fixed Header with Search */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800/50 shrink-0">
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="text-cyan-500">▶</span>
                        <input
                          type="text"
                          placeholder="Search templates..."
                          className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-gray-600 outline-none"
                        />
                      </div>

                      {/* Category Tabs */}
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        <button className="px-3 py-1.5 text-[10px] font-bold bg-slate-200 dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-md whitespace-nowrap">All</button>
                        <button className="px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-slate-800/50 rounded-md whitespace-nowrap flex items-center gap-1">
                          <span>🚀</span> Landing Pages
                        </button>
                        <button className="px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-slate-800/50 rounded-md whitespace-nowrap flex items-center gap-1">
                          <span>💼</span> Business
                        </button>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden min-h-0" style={{ minHeight: 0 }}>
                      {templatePreviewMode === 'list' ? (
                        /* Templates List */
                        <div className="h-full overflow-y-auto custom-scrollbar p-3">
                          <div className="space-y-3">
                            {PROJECT_TEMPLATES.map((template) => (
                              <div
                                key={template.id}
                                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all"
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <span className="text-3xl">{template.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{template.name}</h4>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{template.description}</p>
                                  </div>
                                </div>

                                {/* Tech Tags */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">{template.language}</span>
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">Tailwind CSS</span>
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">Responsive</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                        setSelectedTemplate(template);
                                        setTemplatePreviewMode('preview');
                                        // Push template preview to main preview window
                                        const findHtml = (files: ProjectFile[]): string => {
                                          for (const f of files) {
                                            if (f.type === 'file' && f.name.endsWith('.html') && f.content) return f.content;
                                            if (f.children) { const r = findHtml(f.children); if (r) return r; }
                                          }
                                          return '';
                                        };
                                        let tplHtml = findHtml(template.files);
                                        if (!tplHtml) {
                                          const mainFileName = template.mainFile.split('/').pop() || '';
                                          const findCode = (files: ProjectFile[]): string => { for (const f of files) { if (f.type === 'file' && f.name === mainFileName && f.content) return f.content; if (f.children) { const r = findCode(f.children); if (r) return r; } } return ''; };
                                          const code = findCode(template.files);
                                          tplHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script><style>body{background:#0a0a0f;color:#fff;font-family:system-ui;padding:20px;}</style></head><body><div class="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-indigo-500/20"><div class="flex items-center gap-3 mb-4"><span class="text-4xl">${template.icon}</span><div><h1 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${template.name}</h1><p class="text-slate-500 dark:text-slate-400 text-sm">${template.description}</p></div></div><div class="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-4 mt-4"><pre class="text-xs text-slate-700 dark:text-slate-300 overflow-auto"><code>${code.slice(0,500)}${code.length>500?'...':''}</code></pre></div></div></body></html>`;
                                        }
                                        setPreviewContent({ type: 'html', title: template.name, icon: template.icon, html: tplHtml });
                                      }}
                                    className="flex-1 py-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-indigo-500/30 rounded-lg transition-all uppercase tracking-wider"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Route through agent — backend defines tools, model chooses, backend executes
                                      handleTemplateClick(`Build a ${template.name} (${template.language}) — ${template.description}`);
                                    }}
                                    className="flex-1 py-2 text-[10px] font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700/50 hover:bg-gray-600/50 rounded-lg transition-all uppercase tracking-wider"
                                  >
                                    Use
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Preview Mode */
                        <div className="h-full flex flex-col" style={{ height: '100%' }}>
                          {/* Preview Header */}
                          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800/50 shrink-0">
                            <button
                              onClick={() => {
                                setTemplatePreviewMode('list');
                                setSelectedTemplate(null);
                              }}
                              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 transition-colors"
                            >
                              ◀ Back
                            </button>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setTemplatePreviewMode('preview')}
                                className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${templatePreviewMode === 'preview' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-slate-700 dark:text-slate-300'}`}
                              >
                                Preview
                              </button>
                              <button
                                onClick={() => setTemplatePreviewMode('code')}
                                className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${templatePreviewMode === 'code' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-slate-700 dark:text-slate-300'}`}
                              >
                                Code
                              </button>
                            </div>
                          </div>

                          {/* Preview/Code Content */}
                          <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ minHeight: 0 }}>
                            {templatePreviewMode === 'preview' && selectedTemplate && (
                              <div className="p-2">
                                {/* Live Preview iframe */}
                                <div className="bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                  <iframe
                                    srcDoc={(() => {
                                      // Find HTML file
                                      const findHtmlContent = (files: ProjectFile[]): string => {
                                        for (const f of files) {
                                          if (f.type === 'file' && f.name.endsWith('.html') && f.content) {
                                            return f.content;
                                          }
                                          if (f.children) {
                                            const found = findHtmlContent(f.children);
                                            if (found) return found;
                                          }
                                        }
                                        return '';
                                      };
                                      let html = findHtmlContent(selectedTemplate.files);

                                      // If no HTML, generate preview from code
                                      if (!html) {
                                        const mainFileName = selectedTemplate.mainFile.split('/').pop() || '';
                                        const searchFiles = (files: ProjectFile[]): string => {
                                          for (const f of files) {
                                            if (f.type === 'file' && f.name === mainFileName && f.content) {
                                              return f.content;
                                            }
                                            if (f.children) {
                                              const found = searchFiles(f.children);
                                              if (found) return found;
                                            }
                                          }
                                          return '';
                                        };
                                        const code = searchFiles(selectedTemplate.files);
                                        html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<script src="https://cdn.tailwindcss.com"></script>
<style>body{background:#0a0a0f;color:#fff;font-family:system-ui;padding:20px;}</style>
</head><body>
<div class="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-indigo-500/20">
  <div class="flex items-center gap-3 mb-4">
    <span class="text-4xl">${selectedTemplate.icon}</span>
    <div>
      <h1 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${selectedTemplate.name}</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm">${selectedTemplate.description}</p>
    </div>
  </div>
  <div class="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-4 mt-4">
    <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Main File: ${selectedTemplate.mainFile}</p>
    <pre class="text-xs text-slate-700 dark:text-slate-300 overflow-auto"><code>${code.slice(0, 500)}${code.length > 500 ? '...' : ''}</code></pre>
  </div>
</div>
</body></html>`;
                                      }
                                      return html;
                                    })()}
                                    className="w-full bg-white"
                                    style={{ height: '400px' }}
                                    sandbox="allow-scripts"
                                  />
                                </div>
                              </div>
                            )}

                            {templatePreviewMode === 'code' && selectedTemplate && (
                              <div className="p-3">
                                {/* File Tree */}
                                <div className="mb-4">
                                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Project Files</p>
                                  <div className="space-y-1">
                                    {selectedTemplate.files.map((file, idx) => (
                                      <div key={idx}>
                                        <button
                                          onClick={() => file.type === 'file' && setSelectedFile(file)}
                                          className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-all ${selectedFile?.name === file.name
                                            ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400'
                                            : 'hover:bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                          {file.type === 'folder' ? '📁' : '📄'}
                                          <span className="text-[11px] font-mono">{file.name}</span>
                                        </button>
                                        {file.children && (
                                          <div className="ml-4 pl-2 border-l border-slate-200 dark:border-slate-800">
                                            {file.children.map((child, cidx) => (
                                              <button
                                                key={cidx}
                                                onClick={() => child.type === 'file' && setSelectedFile(child)}
                                                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 transition-all text-[10px] ${selectedFile?.name === child.name
                                                  ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400'
                                                  : 'hover:bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                                                  }`}
                                              >
                                                {child.type === 'folder' ? '📁' : '📄'}
                                                <span className="font-mono">{child.name}</span>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Code Preview */}
                                {selectedFile && selectedFile.content && (
                                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                                    <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mb-2">{selectedFile.name}</p>
                                    <pre className="text-[10px] text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                                      <code>{selectedFile.content}</code>
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Bottom Bar with Template Info & Use Button */}
                          {selectedTemplate && (
                            <div className="p-3 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/40 shrink-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{selectedTemplate.icon}</span>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedTemplate.name}</p>
                                    <p className="text-[9px] text-gray-500">{selectedTemplate.description}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    // Get main file content
                                    let mainContent = '';
                                    const mainFileName = selectedTemplate.mainFile.split('/').pop() || '';
                                    const searchFiles = (files: ProjectFile[]): string => {
                                      for (const f of files) {
                                        if (f.type === 'file' && f.name === mainFileName && f.content) {
                                          return f.content;
                                        }
                                        if (f.children) {
                                          const found = searchFiles(f.children);
                                          if (found) return found;
                                        }
                                      }
                                      return '';
                                    };
                                    mainContent = searchFiles(selectedTemplate.files) || selectedTemplate.files[0]?.content || '';

                                    // Create app with the template
                                    const newApp: GeneratedApp = {
                                      id: Date.now().toString(),
                                      name: selectedTemplate.name,
                                      code: mainContent,
                                      prompt: `Using ${selectedTemplate.name} template`,
                                      timestamp: Date.now(),
                                      history: [],
                                    };
                                    setCurrentApp(newApp);
                                    setProjectFiles(selectedTemplate.files);
                                    saveHistory([newApp, ...history].slice(0, 10));
                                    // Save template project to DB
                                    const templateFiles = selectedTemplate.files
                                      .filter((f: any) => f.type === 'file')
                                      .map((f: any) => ({ path: f.name, content: f.content || '' }));
                                    saveProjectToDB(newApp, templateFiles);
                                    setActivePanel('workspace');
                                    setViewMode(ViewMode.CODE);
                                    setTemplatePreviewMode('list');
                                  }}
                                  className="px-4 py-2 text-[10px] font-bold bg-gray-600 hover:bg-gray-500 text-slate-900 dark:text-white rounded-lg transition-all uppercase tracking-wider"
                                >
                                  Use
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Deploy Panel */}
                {activePanel === 'deploy' && (
                  <DeployPanel
                    code={currentApp?.code || ''}
                    language={currentApp?.language || 'html'}
                    appName={currentApp?.name || 'My App'}
                    originalPrompt={currentApp?.prompt}
                    onDeploySuccess={(app) => {
                      setDeployedUrl(app.url);
                      setShowDeployModal(true);
                    }}
                    onClose={() => setActivePanel(null)}
                    onPreviewContent={setPreviewContent}
                  />
                )}

                {/* Credentials Panel */}
                {activePanel === 'credentials' && (
                  <CredentialsPanel
                    onClose={() => setActivePanel(null)}
                    onPreviewContent={setPreviewContent}
                  />
                )}

                {/* Video Generation Panel */}
                {activePanel === 'video' && (
                  <VideoPanel
                    onClose={() => setActivePanel(null)}
                    onPreviewContent={setPreviewContent}
                  />
                )}

                {/* AI Analysis Panel */}
                {activePanel === 'ai' && (
                  <AIPanel
                    onClose={() => setActivePanel(null)}
                    onPreviewContent={setPreviewContent}
                  />
                )}

                {/* Project Management Panel */}
                {activePanel === 'project' && (
                  <ProjectPanel
                    onClose={() => setActivePanel(null)}
                    onPreviewContent={setPreviewContent}
                  />
                )}

                {/* Build Panel */}
                {activePanel === 'build' && (
                  <BuildPanel onClose={() => setActivePanel(null)} onPreviewContent={setPreviewContent} />
                )}

                {/* Database Panel */}
                {activePanel === 'database' && (
                  <DatabasePanel onClose={() => setActivePanel(null)} onPreviewContent={setPreviewContent} />
                )}

                {/* Assets Panel */}
                {activePanel === 'assets' && (
                  <AssetsPanel onClose={() => setActivePanel(null)} onPreviewContent={setPreviewContent} />
                )}

                {/* Collaboration Panel */}
                {activePanel === 'collaboration' && (
                  <CollaborationPanel onClose={() => setActivePanel(null)} projectSlug={currentApp?.slug} onPreviewContent={setPreviewContent} collaboration={collaboration} authUser={authUser} />
                )}

                {/* Code Tools Panel */}
                {activePanel === 'code-tools' && (
                  <CodeToolsPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Backend Tools Panel */}
                {activePanel === 'backend-tools' && (
                  <BackendToolsPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Communication Panel */}
                {activePanel === 'communication' && (
                  <CommunicationPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Docker & Deploy Panel */}
                {activePanel === 'docker' && (
                  <DockerPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Video Processing Panel */}
                {activePanel === 'video-processing' && (
                  <VideoProcessingPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Canvas Workspace Tools Panel */}
                {activePanel === 'canvas-tools' && (
                  <CanvasToolsPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Image Tools Panel */}
                {activePanel === 'image-tools' && (
                  <ImageToolsPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Dev Tools Panel */}
                {activePanel === 'dev-tools' && (
                  <DevToolsPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Document Parsing Panel */}
                {activePanel === 'document-parsing' && (
                  <DocumentParsingPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* API Tools Panel */}
                {activePanel === 'api-tools' && (
                  <ApiToolsPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Web Tools Panel */}
                {activePanel === 'web-tools' && (
                  <WebToolsPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Security Panel */}
                {activePanel === 'security' && (
                  <SecurityPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Markdown & Content Panel */}
                {activePanel === 'content-markdown' && (
                  <ContentMarkdownPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Workflow Panel */}
                {activePanel === 'workflow' && (
                  <WorkflowPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Knowledge Graph Panel */}
                {activePanel === 'knowledge-graph' && (
                  <KnowledgeGraphPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Business Growth Panel */}
                {activePanel === 'business-growth' && (
                  <BusinessGrowthPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Advanced AI Panel */}
                {activePanel === 'advanced-ai' && (
                  <AdvancedAiPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Data Science Panel */}
                {activePanel === 'data-science' && (
                  <DataSciencePanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Geo & Location Panel */}
                {activePanel === 'geo' && (
                  <GeoPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Cloud Control Panel */}
                {activePanel === 'cloud' && (
                  <CloudPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Advanced Security Panel */}
                {activePanel === 'advanced-security' && (
                  <AdvancedSecurityPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}

                {/* Enterprise Panels */}
                {activePanel === 'financial' && (
                  <FinancialPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}
                {activePanel === 'project-management' && (
                  <ProjectManagementPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}
                {activePanel === 'email' && (
                  <EmailPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}
                {activePanel === 'sales-crm' && (
                  <SalesCrmPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}
                {activePanel === 'hr-recruiting' && (
                  <HrRecruitingPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}
                {activePanel === 'legal-compliance' && (
                  <LegalCompliancePanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}
                {activePanel === 'marketing-seo' && (
                  <MarketingSeoPanel onClose={() => setActivePanel(null)} onRunTool={(msg) => { handleAgentMessage(msg); }} onPreviewContent={setPreviewContent} />
                )}
                </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {genState.error && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm p-4 bg-white dark:bg-[#111] border border-red-500/30 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.2)] flex gap-4 items-start animate-slide-up">
          <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider">
              System Error
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {genState.error}
            </p>
            <div className="mt-3 flex gap-4">
              <button
                onClick={() => setGenState({ ...genState, error: null })}
                className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowTemplatesModal(false)}></div>
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-lg shadow-[0_0_30px_rgba(34,211,238,0.1)] overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">All Templates</h2>
              <button onClick={() => setShowTemplatesModal(false)} className="text-gray-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                {PRESET_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    onClick={() => {
                      setPrompt(tpl.prompt);
                      setShowTemplatesModal(false);
                    }}
                    className="text-left p-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-cyan-500/10 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{tpl.icon}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">{tpl.name}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2">{tpl.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 Deploy Success Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-cyan-500/10">
            {isDeploying ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-orange-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Deploying Your App...</h3>
                <p className="text-gray-500 text-sm">Creating shareable URL</p>
              </div>
            ) : deployedUrl ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">🎉 Deployed Successfully!</h3>
                <p className="text-gray-500 text-sm mb-6">Your app is now live at:</p>

                {/* URL Display */}
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-lg p-3 mb-4">
                  <a
                    href={deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-cyan-300 text-sm break-all font-mono"
                  >
                    {deployedUrl}
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={copyDeployedUrl}
                    className="flex-1 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy URL
                  </button>
                  <a
                    href={deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open
                  </a>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => { setShowDeployModal(false); setDeployedUrl(null); }}
                  className="w-full mt-4 py-2 text-gray-500 hover:text-slate-500 dark:text-slate-400 text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Camera Modal - Selfie Style */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          {/* Camera View */}
          <div className="relative w-full h-full flex flex-col">
            {/* Top Controls */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
              <button
                onClick={stopCamera}
                className="p-3 bg-slate-50 dark:bg-slate-950/50 backdrop-blur-sm rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold bg-slate-50 dark:bg-slate-950/50 backdrop-blur-sm px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-wider">
                  {facingMode === 'user' ? 'Front Camera' : 'Back Camera'}
                </span>
              </div>
              <button
                onClick={switchCamera}
                className="p-3 bg-slate-50 dark:bg-slate-950/50 backdrop-blur-sm rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all"
                title="Switch Camera"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Video Preview */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`max-w-full max-h-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6">
              {capturedImage ? (
                <>
                  {/* Retake Button */}
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="px-6 py-3 bg-slate-50 dark:bg-slate-950/50 backdrop-blur-sm rounded-full text-indigo-600 dark:text-indigo-400 font-bold hover:bg-cyan-500/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all uppercase tracking-wider"
                  >
                    Retake
                  </button>
                  {/* Save Button */}
                  <button
                    onClick={savePhoto}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-full text-slate-900 dark:text-white font-bold hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all uppercase tracking-wider"
                  >
                    Save Photo
                  </button>
                </>
              ) : (
                /* Capture Button */
                <button
                  onClick={takePhoto}
                  className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                >
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full border-4 border-cyan-400"></div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      <AnalyticsDrawer
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        sessionStartTime={sessionStartTime}
        chatMessages={conversationHistory}
      />

      {/* Neural Link Footer */}
      <footer className={`fixed bottom-0 left-0 right-0 h-8 ${isDarkMode ? 'bg-white dark:bg-[#0a0a0a]/95 border-slate-200 dark:border-slate-800/50' : 'bg-white/95 border-gray-200'} backdrop-blur-sm border-t flex items-center justify-between px-4 z-50`}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
          <span className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest`}>Canvas_Protocol_v2.0</span>
        </div>

        {/* Project Name & Auto-Save Indicator */}
        <div className="flex items-center gap-3">
          {projectSlug && (
            <span className={`text-[10px] ${isDarkMode ? 'text-indigo-600 dark:text-indigo-400/70' : 'text-cyan-600'} uppercase tracking-wider`}>
              {projectName}
            </span>
          )}
          <AutoSaveIndicator status={autoSave.status} />

          {/* 🤝 Collaboration Status */}
          {projectSlug && (
            <CollaboratorsBar
              collaborators={collaboration.collaborators}
              isConnected={collaboration.isConnected}
              maxVisible={4}
            />
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-[10px] ${isDarkMode ? 'text-gray-700' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest`}>Neural_Sync_Active</span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </footer>
      <AgentInteractionOverlay ref={agentInteractionRef} />
    </div>
  );
};

export default App;
