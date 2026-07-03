export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  hasAudio?: boolean;
  toolEvents?: ToolEvent[];
  pinned?: boolean;
  favorite?: boolean;
  archived?: boolean;
  edited?: boolean;
  tags?: string[];
}

// ============================================================================
// SSE STREAMING & TOOL EVENT TYPES
// ============================================================================

export interface SSEEvent {
  type: 'status' | 'text' | 'tool_start' | 'tool_result' | 'tool_side_effect' | 'file_write' | 'file_delete' |
  'switch_file' | 'project_created' |
  'command_start' | 'command_output' | 'deploy_start' | 'deploy_complete' | 'image_result' | 'video_result' | 'archive_result' | 'backend_result' | 'code_result' | 'editor_command' |
  'agent_memory_result' | 'agent_approval_request' | 'agent_ui_message' | 'agent_ui_question' | 'agent_ui_progress' | 'agent_ui_toast' | 'agent_ui_close' |
  'agent_mode_change' | 'agent_status_change' | 'agent_task_started' | 'agent_task_completed' | 'agent_task_cancelled' |
  'done' | 'error';
  message?: string;
  content?: string;
  tool?: string;
  input?: any;
  success?: boolean;
  summary?: string;
  path?: string;
  error?: string;
  projectFiles?: Record<string, string>;
  tokens?: { input: number; output: number };
  credits?: number;
  balance?: number;
  latencyMs?: number;
  // Image result fields (signed URL or fallback dataUrl)
  imageUrl?: string;
  dataUrl?: string;
  imageUrls?: string[];
  dataUrls?: string[];
  s3Key?: string;
  expiresAt?: string;
  width?: number;
  height?: number;
  format?: string;
  // Video result fields
  videoUrl?: string;
  videoUrls?: string[];
  duration?: number;
  thumbnailUrl?: string;
  thumbnailDataUrl?: string;
  outputPath?: string;
  metadata?: Record<string, any>;
  // Archive result fields
  archiveUrl?: string;
  s3Key?: string;
  entryCount?: number;
  size?: number;
  sizeFormatted?: string;
  operation?: string;
  resultCount?: number;
  succeeded?: number;
  failed?: number;
  safe?: boolean;
  fileCount?: number;
  findingCount?: number;
  // Agent tools fields
  key?: string;
  value?: any;
  scope?: 'session' | 'persistent';
  approvalId?: string;
  level?: 'safe' | 'moderate' | 'dangerous' | 'critical';
  action?: string;
  messageId?: string;
  messageType?: 'info' | 'warning' | 'error';
  question?: string;
  questionId?: string;
  inputType?: 'text' | 'choice' | 'confirm' | 'multiline';
  options?: string[];
  progress?: number;
  previousMode?: string;
  newMode?: string;
  modeInfo?: any;
  taskId?: string;
  taskName?: string;
  reason?: string;
  // editor_command fields
  command?: string;
  line?: number;
  column?: number;
  query?: string;
  // project_created / switch_file fields
  files?: Record<string, string>;
  mainFile?: string;
}

export interface ToolEvent {
  type: 'tool_start' | 'tool_result' | 'file_write' | 'file_delete' | 'command_output' | 'image_result' | 'video_result' | 'archive_result' | 'backend_result' | 'code_result' | 'editor_command' | 'agent_memory' | 'agent_approval' | 'agent_ui' | 'agent_control';
  tool?: string;
  input?: any;
  success?: boolean;
  summary?: string;
  path?: string;
  content?: string;
  imageUrl?: string;
  dataUrl?: string;
  imageUrls?: string[];
  width?: number;
  height?: number;
  format?: string;
  // Video result fields
  videoUrl?: string;
  videoUrls?: string[];
  thumbnailUrl?: string;
  duration?: number;
  timestamp: number;
}

export interface ConsoleLine {
  type: 'log' | 'error' | 'warn' | 'info';
  text: string;
  timestamp: number;
}

export interface GeneratedApp {
  id: string;
  name: string;
  code: string;
  language?: string; // Detected code language (html, react, typescript, javascript, python, etc.)
  prompt: string;
  timestamp: number;
  history: ChatMessage[];
  slug?: string; // DB project slug for persistence
}

export enum ViewMode {
  PREVIEW = 'PREVIEW',
  CODE = 'CODE',
  SPLIT = 'SPLIT',
}

export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  progressMessage: string;
  isThinking?: boolean;
}

// ============================================================================
// PROJECT & MULTI-FILE TYPES
// ============================================================================

export type ProjectType =
  | 'STATIC'      // HTML/CSS/JS static site
  | 'SPA'         // React/Vue single-page app
  | 'SSR'         // Next.js/Nuxt server-side rendering
  | 'FULLSTACK'   // Frontend + Backend
  | 'API_ONLY';   // Backend API only

export interface ProjectFile {
  path: string;           // Full path from project root (e.g., "src/App.tsx")
  name: string;           // File name only (e.g., "App.tsx")
  type: 'file' | 'folder';
  language?: string;      // typescript, javascript, html, css, python, etc.
  content?: string;       // File content (only for files)
  children?: ProjectFile[]; // Children (only for folders)
  isOpen?: boolean;       // UI state: is folder expanded
  isModified?: boolean;   // Has unsaved changes
  isNew?: boolean;        // Newly created, not yet saved
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  projectType: ProjectType;
  language: string;       // Primary language (react, html, python, etc.)
  framework?: string;     // Framework (next, flask, express, etc.)

  // File structure
  files: ProjectFile[];   // Root-level files and folders
  mainFile: string;       // Entry point (e.g., "src/App.tsx" or "index.html")

  // Build configuration
  buildCommand?: string;  // e.g., "npm run build"
  startCommand?: string;  // e.g., "npm start"
  envVars?: Record<string, string>;

  // Backend (for full-stack)
  hasBackend: boolean;
  backendType?: string;   // express, flask, fastapi
  backendPort?: number;

  // Database
  hasDatabase: boolean;
  databaseType?: string;  // sqlite, postgres

  // Metadata
  createdAt: number;
  updatedAt: number;
  prompt?: string;        // Original AI prompt
}

// ============================================================================
// DEPLOYMENT TYPES
// ============================================================================

export type DeployStatus =
  | 'PENDING'
  | 'BUILDING'
  | 'DEPLOYING'
  | 'LIVE'
  | 'FAILED'
  | 'ROLLED_BACK';

export type HostedAppStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'SUSPENDED';

export interface DeployedApp {
  id: string;
  slug: string;
  name: string;
  description?: string;

  // URLs
  url: string;                    // Primary URL (subdomain)
  previewUrl?: string;            // Preview URL
  customDomain?: string;          // Custom domain if set

  // Project info
  projectType: ProjectType;
  language: string;
  framework?: string;

  // Status
  status: HostedAppStatus;
  sslEnabled: boolean;

  // Analytics
  viewCount: number;
  lastViewedAt?: string;
  lastDeployedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Deployment {
  id: string;
  appId: string;
  version: number;
  environment: 'preview' | 'production';
  status: DeployStatus;

  // Build info
  buildLogs?: string;
  buildDuration?: number;        // seconds

  // Result
  url?: string;
  error?: string;

  // Timestamps
  startedAt: string;
  completedAt?: string;
}

export interface DeployConfig {
  name: string;
  isPublic: boolean;
  customDomain?: string;
  envVars?: Record<string, string>;
}

// ============================================================================
// AGENT ACTION TYPES
// ============================================================================

export type AgentAction =
  // Chat & Information
  | 'chat'                // Respond conversationally
  | 'explain'             // Explain code
  | 'debug'               // Debug/fix issues

  // Single-file operations
  | 'build'               // Generate single-file app
  | 'edit'                // Modify existing code

  // Multi-file project operations
  | 'build_project'       // Generate multi-file project
  | 'create_page'         // Add new page to project
  | 'create_component'    // Add reusable component
  | 'create_api'          // Generate API endpoint
  | 'create_model'        // Generate database model
  | 'create_route'        // Add backend route

  // Full-stack operations
  | 'build_fullstack'     // Generate complete full-stack app
  | 'setup_auth'          // Add authentication
  | 'setup_database'      // Configure database

  // UI actions
  | 'preview'             // Show preview
  | 'open_panel'          // Open specific panel
  | 'copy_code'           // Copy to clipboard
  | 'download'            // Download files

  // Deploy actions
  | 'deploy_preview'      // Deploy to preview URL
  | 'deploy_production'   // Deploy to production
  | 'add_domain'          // Configure custom domain
  | 'deploy'              // Generic deploy

  // File operations
  | 'create_file'         // Create new file
  | 'delete_file'         // Delete file
  | 'open_file'           // Open/switch to file
  | 'rename_file'         // Rename file

  // Editor operations
  | 'insert_at'           // Insert at position
  | 'replace_range'       // Replace range
  | 'delete_lines'        // Delete lines
  | 'goto_line'           // Move cursor
  | 'find_replace'        // Find and replace
  | 'undo'                // Undo
  | 'redo'                // Redo
  | 'get_selection'       // Get selection

  // Tool operations
  | 'tool_calls'          // Execute multiple tools
  | 'run_tool'            // Execute single tool

  // Session
  | 'new_chat'            // Start new chat
  | 'save'                // Save current state
  | 'sandbox'             // Open in CodeSandbox
  | 'change_provider'     // Switch AI provider
  | 'change_language';    // Change target language

export interface AgentResponse {
  action: AgentAction;
  message?: string;
  code?: string;
  language?: string;

  // For multi-file operations
  files?: {
    path: string;
    content: string;
    language?: string;
  }[];
  mainFile?: string;

  // For specific actions
  panel?: string;
  provider?: string;
  model?: string;
  explanation?: string;
  analysis?: string;
  fix?: string;

  // For editor operations
  position?: { line: number; column: number };
  start?: { line: number; column: number };
  end?: { line: number; column: number };
  text?: string;
  find?: string;
  replace?: string;
  startLine?: number;
  endLine?: number;
  line?: number;
  column?: number;
  path?: string;

  // For tool operations
  tool?: string;
  args?: any[];
  tool_calls?: { tool: string; args: any[] }[];
}
