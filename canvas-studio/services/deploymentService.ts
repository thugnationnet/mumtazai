/**
 * Deployment Service — Deploy projects to mumtaz.ai and 3rd-party platforms
 *
 * Primary: POST /api/canvas/deploy (One Last AI hosting, free for all users)
 * Also supports: Vercel, Railway, Netlify, Cloudflare via backend routes
 *
 * Provides:
 *  - prepareDeploymentFiles()  — filter/transform files for deployment
 *  - deployProject()           — POST to backend with status callbacks
 *  - getDeploymentHistory()    — local history of deployments
 *  - requestBuildFix()         — send build errors to AI for fix
 */
import {
  DeploymentConfig,
  DeploymentStatus,
  DeploymentResult,
  DeploymentPlatform,
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface DeploymentHistoryEntry {
  id: string;
  projectName: string;
  platform: DeploymentPlatform;
  status: 'success' | 'failed';
  url?: string;
  error?: string;
  timestamp: number;
}

export interface BuildFixResult {
  fixedFiles: Record<string, string>;
  explanation: string;
}

// ═══════════════════════════════════════════════════════════════════
// History Storage (DB-backed via /api/user/preferences/canvas-state)
// ZERO localStorage — in-memory session cache for guests
// ═══════════════════════════════════════════════════════════════════

const HISTORY_KEY = 'canvas_deploy_history';
const MAX_HISTORY = 50;
const STATE_API = '/api/user/preferences/canvas-state';

// In-memory session cache (lost on page close for guests)
let _deployCache: DeploymentHistoryEntry[] | null = null;

async function readHistory(): Promise<DeploymentHistoryEntry[]> {
  // Return in-memory cache if available
  if (_deployCache !== null) return _deployCache;

  // 1. Try DB
  try {
    const res = await fetch(`${STATE_API}/${HISTORY_KEY}`, { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        _deployCache = json.data;
        return _deployCache;
      }
    }
  } catch { /* fall through */ }

  return [];
}

async function writeHistory(entries: DeploymentHistoryEntry[]): Promise<void> {
  const trimmed = entries.slice(0, MAX_HISTORY);
  _deployCache = trimmed;

  // Write DB
  try {
    await fetch(`${STATE_API}/${HISTORY_KEY}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trimmed),
    });
  } catch { /* offline — in-memory cache still has the data */ }
}

async function addHistoryEntry(entry: DeploymentHistoryEntry): Promise<void> {
  const history = await readHistory();
  await writeHistory([entry, ...history.filter((e) => e.id !== entry.id)]);
}

// ═══════════════════════════════════════════════════════════════════
// File Preparation
// ═══════════════════════════════════════════════════════════════════

interface DeployFile {
  path: string;
  content: string;
}

/**
 * Filter and transform project files for deployment.
 *  - Strips leading slashes for consistent paths
 *  - Excludes dev-only files (node_modules, .git, etc.)
 *  - Ensures an index.html exists for static deploys
 */
function prepareDeploymentFiles(
  files: Record<string, string>,
  _config: DeploymentConfig
): DeployFile[] {
  const excludePatterns = [
    /^\/?(\.git|\.github|node_modules|\.env)/,
    /\.DS_Store$/,
    /\.gitkeep$/,
  ];

  const result: DeployFile[] = [];

  for (const [rawPath, content] of Object.entries(files)) {
    const path = rawPath.replace(/^\//, '');

    // Skip excluded patterns
    if (excludePatterns.some((p) => p.test(path))) continue;
    // Skip empty paths
    if (!path) continue;

    result.push({ path, content });
  }

  // If static framework and no index.html, create a minimal one
  if (
    (!_config.framework || _config.framework === 'static') &&
    !result.find((f) => f.path === 'index.html')
  ) {
    const htmlFile = result.find((f) => f.path.endsWith('.html'));
    if (htmlFile) {
      result.push({ path: 'index.html', content: htmlFile.content });
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// Deploy to mumtaz.ai (primary) via backend
// ═══════════════════════════════════════════════════════════════════

async function deployProject(
  config: DeploymentConfig,
  files: DeployFile[],
  onStatus: (status: DeploymentStatus) => void
): Promise<DeploymentResult> {
  const historyId = `deploy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    // Step 1: Preparing
    onStatus({
      state: 'preparing',
      platform: config.platform || 'mumtazai',
      progress: 10,
      message: 'Packaging files for deployment...',
      logs: ['Preparing files...'],
    });

    // Step 2: Uploading
    onStatus({
      state: 'uploading',
      platform: config.platform || 'mumtazai',
      progress: 30,
      message: 'Uploading to mumtaz.ai...',
      logs: ['Preparing files...', `Uploading ${files.length} files...`],
    });

    const res = await fetch('/api/canvas/deploy', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: config.platform || 'mumtazai',
        projectName: config.projectName,
        source: 'canvas-studio',
        files: files.map((f) => ({
          path: f.path,
          content: f.content,
        })),
        framework: config.framework || 'static',
        subdomain: config.projectName
          ?.toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 30),
        envVars: config.envVars,
      }),
    });

    // Step 3: Building
    onStatus({
      state: 'building',
      platform: config.platform || 'mumtazai',
      progress: 60,
      message: 'Building project...',
      logs: [
        'Preparing files...',
        `Uploading ${files.length} files...`,
        'Building project...',
      ],
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Deploy failed' }));
      const errorMsg = errorData.error || errorData.message || `Deploy failed (${res.status})`;

      const failResult: DeploymentResult = {
        success: false,
        platform: config.platform || 'mumtazai',
        error: errorMsg,
        errorType: res.status === 401 ? 'auth' : 'build',
        buildLogs: [errorMsg],
        timestamp: Date.now(),
      };

      onStatus({
        state: 'error',
        platform: config.platform || 'mumtazai',
        message: errorMsg,
        error: errorMsg,
        logs: [errorMsg],
      });

      await addHistoryEntry({
        id: historyId,
        projectName: config.projectName,
        platform: config.platform || 'mumtazai',
        status: 'failed',
        error: errorMsg,
        timestamp: Date.now(),
      });

      return failResult;
    }

    const data = await res.json();
    const deployUrl = data.url || data.deployUrl || data.data?.url;

    // Step 4: Success
    onStatus({
      state: 'ready',
      platform: config.platform || 'mumtazai',
      progress: 100,
      message: 'Deployed successfully!',
      url: deployUrl,
      logs: [
        'Preparing files...',
        `Uploading ${files.length} files...`,
        'Building project...',
        `✅ Live at ${deployUrl}`,
      ],
    });

    await addHistoryEntry({
      id: historyId,
      projectName: config.projectName,
      platform: config.platform || 'mumtazai',
      status: 'success',
      url: deployUrl,
      timestamp: Date.now(),
    });

    return {
      success: true,
      platform: config.platform || 'mumtazai',
      url: deployUrl,
      deploymentId: data.deploymentId || data.id,
      timestamp: Date.now(),
    };
  } catch (err: any) {
    const errorMsg = err.message || 'Network error during deployment';

    onStatus({
      state: 'error',
      platform: config.platform || 'mumtazai',
      message: errorMsg,
      error: errorMsg,
      logs: [errorMsg],
    });

    await addHistoryEntry({
      id: historyId,
      projectName: config.projectName,
      platform: config.platform || 'mumtazai',
      status: 'failed',
      error: errorMsg,
      timestamp: Date.now(),
    });

    return {
      success: false,
      platform: config.platform || 'mumtazai',
      error: errorMsg,
      errorType: 'network',
      timestamp: Date.now(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Build Fix — Send errors to AI for automatic fix
// ═══════════════════════════════════════════════════════════════════

async function requestBuildFix(
  error: string,
  buildLogs: string[],
  files: Record<string, string>
): Promise<BuildFixResult | null> {
  try {
    const res = await fetch('/api/canvas/agent-stream', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Fix the following build/deploy error. Return only the corrected files.\n\nError: ${error}\n\nBuild logs:\n${buildLogs.join('\n')}`,
        files: Object.entries(files).map(([path, content]) => ({
          path: path.replace(/^\//, ''),
          name: path.split('/').pop() || path,
          content,
          language: 'text',
        })),
        provider: 'Anthropic',
        modelId: 'claude-sonnet-4-20250514',
        source: 'canvas-studio',
        history: [],
      }),
    });

    if (!res.ok) return null;

    // Parse SSE stream for files
    const reader = res.body?.getReader();
    if (!reader) return null;

    const decoder = new TextDecoder();
    let buffer = '';
    let fixedFiles: Record<string, string> = {};
    let explanation = '';

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
            explanation += event.token;
          }
          if (event.files) {
            for (const f of event.files) {
              const filePath = f.path.startsWith('/') ? f.path : `/${f.path}`;
              fixedFiles[filePath] = f.content;
            }
          }
        } catch { /* ignore parse errors */ }
      }
    }

    if (Object.keys(fixedFiles).length === 0) return null;

    return {
      fixedFiles,
      explanation: explanation || 'Applied automatic fixes to resolve build errors.',
    };
  } catch (err) {
    console.error('[deploymentService] requestBuildFix error:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

const deploymentService = {
  prepareDeploymentFiles,
  deployProject,
  getDeploymentHistory: readHistory,
  requestBuildFix,
};

export default deploymentService;
