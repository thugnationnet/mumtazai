/**
 * Canvas IDE Types
 * Comprehensive type definitions for the AI-powered Canvas IDE
 * Supports multi-file, multi-page, multi-language projects with deployment
 */

// =============================================================================
// PROJECT & FILE TYPES
// =============================================================================

export type FileLanguage =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'tsx'
  | 'jsx'
  | 'json'
  | 'markdown'
  | 'python'
  | 'yaml'
  | 'toml'
  | 'env'
  | 'svg'
  | 'xml'
  | 'sql'
  | 'graphql'
  | 'go'
  | 'java'
  | 'php'
  | 'shell'
  | 'c'
  | 'cpp'
  | 'ruby'
  | 'rust'
  | 'plaintext';

export type ProjectFramework =
  | 'html' // Static HTML/CSS/JS
  | 'vite_react' // Vite + React
  | 'nextjs' // Next.js
  | 'express' // Express.js backend
  | 'fastapi' // Python FastAPI
  | 'vue' // Vue.js
  | 'svelte' // SvelteKit
  | 'astro'; // Astro

export type ProjectStatus = 'draft' | 'building' | 'deployed' | 'error';

export interface ProjectFile {
  id: string;
  name: string;
  path: string; // e.g. "/src/components/Header.tsx"
  language: FileLanguage;
  content: string;
  size: number;
  isEntryPoint?: boolean;
  isModified?: boolean; // Has unsaved changes
  createdAt: number;
  updatedAt: number;
}

export interface ProjectFolder {
  name: string;
  path: string; // e.g. "/src/components"
  children: (ProjectFile | ProjectFolder)[];
  isExpanded?: boolean;
}

export interface ProjectPage {
  id: string;
  name: string; // e.g. "Home", "About", "Contact"
  route: string; // e.g. "/", "/about", "/contact"
  title: string;
  description?: string;
  fileId: string; // Points to the main file for this page
  layout?: string; // Layout component name
  isIndex?: boolean;
}

export interface CanvasProjectFull {
  id: string;
  name: string;
  description?: string;
  framework: ProjectFramework;
  status: ProjectStatus;

  // Multi-file system
  files: ProjectFile[];

  // Multi-page routing
  pages: ProjectPage[];
  routes: string[];

  // Multi-language (i18n)
  languages: string[]; // e.g. ["en", "es", "fr"]
  defaultLanguage: string;
  translations: Record<string, Record<string, string>>; // { "en": { "hello": "Hello" }, "es": { "hello": "Hola" } }

  // Backend settings
  hasBackend: boolean;
  database?: {
    type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
    connectionString?: string;
  };
  apiRoutes?: string[];

  // Deployment
  subdomain?: string;
  deploymentUrl?: string;
  lastDeployment?: DeploymentInfo;

  // Build
  lastBuild?: BuildInfo;

  // Metadata
  thumbnail?: string;
  tags: string[];
  isPublic: boolean;

  // Chat history
  chatHistory?: ChatMessageCanvas[];

  createdAt: number;
  updatedAt: number;
}

// =============================================================================
// BUILD TYPES
// =============================================================================

export type BuildStatus =
  | 'idle'
  | 'validating'
  | 'building'
  | 'success'
  | 'failed';

export interface BuildError {
  id: string;
  file: string; // File path where error occurred
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string; // Error code (e.g. "TS2304")
  suggestion?: string; // AI-suggested fix
  autoFixable?: boolean;
}

export interface BuildInfo {
  id: string;
  status: BuildStatus;
  version: number;
  startedAt?: number;
  completedAt?: number;
  duration?: number; // seconds
  logs: string[];
  errors: BuildError[];
  warnings: BuildError[];
  artifactUrl?: string;
}

// =============================================================================
// DEPLOYMENT TYPES
// =============================================================================

export type DeployProvider =
  | 'vercel'
  | 'railway'
  | 'netlify'
  | 'mumtazai'
  | 'cloudflare';

export type DeploymentStatus =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'building'
  | 'deploying'
  | 'live'
  | 'failed'
  | 'stopped';

export interface DeploymentInfo {
  id: string;
  provider: DeployProvider;
  status: DeploymentStatus;
  url?: string; // Live URL
  previewUrl?: string; // Preview/staging URL
  subdomain?: string;

  // Timing
  startedAt?: number;
  completedAt?: number;

  // Build output
  buildLogs: string[];
  deployLogs: string[];
  errors: BuildError[];

  // Environment
  envVars: Record<string, string>;

  // Provider-specific info
  providerProjectId?: string;
  providerDeployId?: string;
}

export interface DeploymentCredential {
  id: string;
  provider: DeployProvider;
  name: string; // User-friendly name e.g. "My Vercel Account"
  token: string; // API token (stored encrypted)
  teamId?: string; // For Vercel teams
  isValid: boolean;
  lastValidated?: number;
  createdAt: number;
}

export interface DeployConfig {
  provider: DeployProvider;
  credentialId: string;
  projectName: string;
  subdomain?: string;
  framework: ProjectFramework;
  buildCommand?: string;
  outputDir?: string;
  installCommand?: string;
  envVars: Record<string, string>;
  region?: string;
}

// Provider-specific configuration
export interface ProviderConfig {
  provider: DeployProvider;
  name: string;
  icon: string;
  color: string;
  description: string;
  tokenUrl: string; // Where users get their API tokens
  tokenLabel: string; // Label for the token field
  supportsPreview: boolean;
  supportsCustomDomain: boolean;
  supportsServerless: boolean;
  supportsDocker: boolean;
  supportedFrameworks: ProjectFramework[];
}

export const DEPLOY_PROVIDERS: ProviderConfig[] = [
  {
    provider: 'vercel',
    name: 'Vercel',
    icon: '▲',
    color: '#000000',
    description:
      'Best for Next.js, React, and static sites. Global CDN with automatic HTTPS.',
    tokenUrl: 'https://vercel.com/account/tokens',
    tokenLabel: 'Vercel Access Token',
    supportsPreview: true,
    supportsCustomDomain: true,
    supportsServerless: true,
    supportsDocker: false,
    supportedFrameworks: [
      'html',
      'vite_react',
      'nextjs',
      'vue',
      'svelte',
      'astro',
    ],
  },
  {
    provider: 'railway',
    name: 'Railway',
    icon: '🚂',
    color: '#0B0D0E',
    description:
      'Full-stack deployments with databases. Great for backends and full apps.',
    tokenUrl: 'https://railway.app/account/tokens',
    tokenLabel: 'Railway API Token',
    supportsPreview: true,
    supportsCustomDomain: true,
    supportsServerless: false,
    supportsDocker: true,
    supportedFrameworks: [
      'html',
      'vite_react',
      'nextjs',
      'express',
      'fastapi',
      'vue',
      'svelte',
      'astro',
    ],
  },
  {
    provider: 'netlify',
    name: 'Netlify',
    icon: '◆',
    color: '#00C7B7',
    description:
      'Perfect for static sites and JAMstack. Built-in forms, auth, and functions.',
    tokenUrl:
      'https://app.netlify.com/user/applications#personal-access-tokens',
    tokenLabel: 'Netlify Personal Access Token',
    supportsPreview: true,
    supportsCustomDomain: true,
    supportsServerless: true,
    supportsDocker: false,
    supportedFrameworks: [
      'html',
      'vite_react',
      'nextjs',
      'vue',
      'svelte',
      'astro',
    ],
  },
  {
    provider: 'cloudflare',
    name: 'Cloudflare Pages',
    icon: '☁️',
    color: '#F48120',
    description:
      'Edge-first deployment with Cloudflare Workers. Ultra-fast global network.',
    tokenUrl: 'https://dash.cloudflare.com/profile/api-tokens',
    tokenLabel: 'Cloudflare API Token',
    supportsPreview: true,
    supportsCustomDomain: true,
    supportsServerless: true,
    supportsDocker: false,
    supportedFrameworks: [
      'html',
      'vite_react',
      'nextjs',
      'vue',
      'svelte',
      'astro',
    ],
  },
  {
    provider: 'mumtazai',
    name: 'One Last AI Apps',
    icon: '🧠',
    color: '#06B6D4',
    description: 'Deploy to your own subdomain at *.mumtaz.ai — no credentials needed! Free SSL included.',
    tokenUrl: '',
    tokenLabel: '',
    supportsPreview: true,
    supportsCustomDomain: true,
    supportsServerless: false,
    supportsDocker: false,
    supportedFrameworks: [
      'html',
      'vite_react',
      'nextjs',
      'vue',
      'svelte',
      'astro',
      'express',
      'fastapi',
    ],
  },
];

// =============================================================================
// AGENT ACTION TYPES
// =============================================================================

export type AgentActionType =
  | 'create_file'
  | 'edit_file'
  | 'delete_file'
  | 'rename_file'
  | 'move_file'
  | 'create_folder'
  | 'create_page'
  | 'delete_page'
  | 'add_dependency'
  | 'remove_dependency'
  | 'update_config'
  | 'build_project'
  | 'deploy_project'
  | 'fix_error'
  | 'add_language'
  | 'add_translation'
  | 'set_env_var'
  | 'preview_update';

export interface AgentAction {
  type: AgentActionType;
  payload: Record<string, unknown>;
  description: string; // Human-readable description
  timestamp: number;
}

// Agent file operation
export interface AgentFileOp {
  action: 'create' | 'edit' | 'delete' | 'rename';
  path: string;
  newPath?: string; // For rename/move
  content?: string; // For create/edit
  language?: FileLanguage;
}

// Agent deploy command
export interface AgentDeployCommand {
  provider: DeployProvider;
  credentialId?: string;
  projectName: string;
  envVars?: Record<string, string>;
  autoFix?: boolean; // Auto-fix build errors
}

// =============================================================================
// CHAT TYPES
// =============================================================================

export interface ChatMessageCanvas {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  isStreaming?: boolean;

  // Agent action results
  actions?: AgentAction[];
  buildResult?: BuildInfo;
  deployResult?: DeploymentInfo;
  errors?: BuildError[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  framework: ProjectFramework;
  thumbnail?: string;
  files: ProjectFile[];
  pages: ProjectPage[];
  tags: string[];
  isPremium: boolean;
}

// =============================================================================
// FILE TREE HELPERS
// =============================================================================

export const FILE_LANGUAGE_MAP: Record<string, FileLanguage> = {
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.jsx': 'jsx',
  '.json': 'json',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.py': 'python',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.env': 'env',
  '.svg': 'svg',
  '.xml': 'xml',
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.go': 'go',
  '.java': 'java',
  '.php': 'php',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hxx': 'cpp',
  '.rb': 'ruby',
  '.rs': 'rust',
  '.txt': 'plaintext',
};

export const FILE_ICONS: Record<FileLanguage, string> = {
  html: '🌐',
  css: '🎨',
  javascript: '📜',
  typescript: '🔷',
  tsx: '⚛️',
  jsx: '⚛️',
  json: '📋',
  markdown: '📝',
  python: '🐍',
  yaml: '⚙️',
  toml: '⚙️',
  env: '🔒',
  svg: '🖼️',
  xml: '📄',
  sql: '🗃️',
  graphql: '◈',
  go: '🐹',
  java: '☕',
  php: '🐘',
  shell: '🖥️',
  c: '⚙️',
  cpp: '⚙️',
  ruby: '💎',
  rust: '🦀',
  plaintext: '📄',
};

export const FOLDER_ICON = '📁';

export function getFileLanguage(filename: string): FileLanguage {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return FILE_LANGUAGE_MAP[ext] || 'plaintext';
}

export function getMonacoLanguage(lang: FileLanguage): string {
  const map: Record<FileLanguage, string> = {
    html: 'html',
    css: 'css',
    javascript: 'javascript',
    typescript: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    json: 'json',
    markdown: 'markdown',
    python: 'python',
    yaml: 'yaml',
    toml: 'toml',
    env: 'plaintext',
    svg: 'xml',
    xml: 'xml',
    sql: 'sql',
    graphql: 'graphql',
    go: 'go',
    java: 'java',
    php: 'php',
    shell: 'shell',
    c: 'c',
    cpp: 'cpp',
    ruby: 'ruby',
    rust: 'rust',
    plaintext: 'plaintext',
  };
  return map[lang] || 'plaintext';
}

// Build a file tree from flat file list
export function buildFileTree(
  files: ProjectFile[]
): (ProjectFile | ProjectFolder)[] {
  const root: ProjectFolder = {
    name: '/',
    path: '/',
    children: [],
    isExpanded: true,
  };

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const folderPath = '/' + parts.slice(0, i + 1).join('/');
      let folder = current.children.find(
        (c): c is ProjectFolder => 'children' in c && c.path === folderPath
      );

      if (!folder) {
        folder = {
          name: parts[i],
          path: folderPath,
          children: [],
          isExpanded: true,
        };
        current.children.push(folder);
      }
      current = folder;
    }

    current.children.push(file);
  }

  // Sort: folders first, then files, alphabetically
  const sortChildren = (
    items: (ProjectFile | ProjectFolder)[]
  ): (ProjectFile | ProjectFolder)[] => {
    return items
      .sort((a, b) => {
        const aIsFolder = 'children' in a;
        const bIsFolder = 'children' in b;
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((item) => {
        if ('children' in item) {
          return { ...item, children: sortChildren(item.children) };
        }
        return item;
      });
  };

  return sortChildren(root.children);
}
