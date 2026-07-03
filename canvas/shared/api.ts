/**
 * Shared API module for Canvas
 * All API calls use fetchWithCredentials (httpOnly cookie auth)
 */
import { fetchWithCredentials } from '../fetchUtil';

// ============================================================================
// TYPES
// ============================================================================

export interface WSProjectFile {
  path: string;
  content: string;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  language: string;
  mainFile?: string;
  originalPrompt?: string;
  files: WSProjectFile[];
  editorState?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color?: string;
  cursor?: { line: number; column: number };
  isOnline?: boolean;
}

export interface DeployRequest {
  provider: string;
  projectName: string;
  files: Record<string, string>;
  buildCommand?: string;
  outputDir?: string;
  envVars?: Record<string, string>;
}

export interface DeployResponse {
  success: boolean;
  url?: string;
  previewUrl?: string;
  error?: string;
}

// ============================================================================
// WORKSPACE SERVICE
// ============================================================================

export const workspaceService = {
  /** Load a project by slug */
  async load(slug: string): Promise<Project | null> {
    try {
      const res = await fetchWithCredentials(`/api/workspace/projects/${slug}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.project || data;
    } catch {
      console.error('[workspaceService] Failed to load project:', slug);
      return null;
    }
  },

  /** Quick save a new or existing project */
  async quickSave(params: {
    name: string;
    files: WSProjectFile[];
    editorState?: Record<string, unknown>;
    mainFile?: string;
    language?: string;
    originalPrompt?: string;
    slug?: string;
  }): Promise<{ slug: string; id: string } | null> {
    try {
      const url = params.slug
        ? `/api/workspace/projects/${params.slug}/save`
        : '/api/workspace/projects';
      const method = params.slug ? 'POST' : 'POST';
      const res = await fetchWithCredentials(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.project || data;
    } catch {
      console.error('[workspaceService] Failed to save project');
      return null;
    }
  },
};

// ============================================================================
// PROJECT FUNCTIONS
// ============================================================================

/** Save a project (alias for workspaceService.quickSave) */
export async function saveProject(params: {
  slug?: string;
  name: string;
  files: WSProjectFile[];
  editorState?: Record<string, unknown>;
}): Promise<{ slug: string } | null> {
  return workspaceService.quickSave(params);
}

/** Load a project (alias for workspaceService.load) */
export async function loadProject(slug: string): Promise<Project | null> {
  return workspaceService.load(slug);
}

// ============================================================================
// TOOL FUNCTIONS
// ============================================================================

/** Get available agent tools */
export async function getAvailableTools(): Promise<{ tools: unknown[] }> {
  try {
    const res = await fetchWithCredentials('/api/agent/tools');
    if (!res.ok) return { tools: [] };
    return await res.json();
  } catch {
    return { tools: [] };
  }
}

/** Run a specific agent tool */
export async function runTool(
  toolName: string,
  params: Record<string, unknown>
): Promise<unknown> {
  try {
    const res = await fetchWithCredentials('/api/agent/run-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, params }),
    });
    if (!res.ok) throw new Error('Tool execution failed');
    return await res.json();
  } catch (err) {
    console.error('[runTool] Failed:', err);
    throw err;
  }
}

// ============================================================================
// REALTIME / COLLABORATION
// ============================================================================

/** Get a realtime WebSocket connection URL */
export function getRealtimeConnection(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
}

// ============================================================================
// USER
// ============================================================================

/** Get current authenticated user */
export async function getCurrentUser(): Promise<{
  id: string;
  name?: string;
  email?: string;
} | null> {
  try {
    const res = await fetchWithCredentials('/api/auth/session');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

// ============================================================================
// AI HELPERS
// ============================================================================

/** Analyze code for errors */
export async function analyzeErrors(
  code: string,
  error: string
): Promise<{ analysis: string; suggestions: string[] }> {
  const res = await fetchWithCredentials('/api/ai/analyze-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, error }),
  });
  if (!res.ok) throw new Error('Analysis failed');
  return await res.json();
}

/** Generate tests for code */
export async function generateTests(
  code: string,
  language: string
): Promise<{ tests: string }> {
  const res = await fetchWithCredentials('/api/ai/generate-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });
  if (!res.ok) throw new Error('Test generation failed');
  return await res.json();
}

/** Analyze code for refactoring */
export async function analyzeForRefactoring(
  code: string
): Promise<{ suggestions: string[]; refactored: string }> {
  const res = await fetchWithCredentials('/api/ai/analyze-refactoring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('Refactoring analysis failed');
  return await res.json();
}

// ============================================================================
// SPEECH
// ============================================================================

/** Synthesize text to speech and play it */
export async function speak(text: string): Promise<void> {
  try {
    const res = await fetchWithCredentials('/api/speech/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Speech synthesis failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[speak] Failed:', err);
  }
}

// ============================================================================
// DEPLOY
// ============================================================================

/** Deploy a project to a cloud provider */
export async function deployProject(
  request: DeployRequest
): Promise<DeployResponse> {
  const res = await fetchWithCredentials('/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return { success: false, error: errData.message || 'Deployment failed' };
  }
  return await res.json();
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface CanvasPreferences {
  isDarkMode: boolean;
  temperature: number;
  maxTokens: number;
  chatFontSize: number;
  focusMode: boolean;
  chatMode: 'agent' | 'chat';
  selectedLanguage: string;
  viewMode: string;
  deviceMode: string;
  activePanel: string | null;
  previewMode: 'browser' | 'cloud';
}

export const preferencesService = {
  async load(): Promise<CanvasPreferences | null> {
    try {
      const res = await fetchWithCredentials('/api/preferences');
      if (!res.ok) return null;
      const data = await res.json();
      return data.preferences || null;
    } catch {
      return null;
    }
  },

  async save(prefs: Partial<CanvasPreferences>): Promise<boolean> {
    try {
      const res = await fetchWithCredentials('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

// ============================================================================
// CHAT SESSIONS
// ============================================================================

export const chatSessionService = {
  async list(): Promise<{ sessions: unknown[] }> {
    try {
      const res = await fetchWithCredentials('/api/chat/sessions');
      if (!res.ok) return { sessions: [] };
      return await res.json();
    } catch {
      return { sessions: [] };
    }
  },

  async get(sessionId: string): Promise<unknown | null> {
    try {
      const res = await fetchWithCredentials(`/api/chat/sessions/${sessionId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.session || null;
    } catch {
      return null;
    }
  },

  async create(params: { name?: string; chatMode?: string }): Promise<{ id: string } | null> {
    try {
      const res = await fetchWithCredentials('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.session || null;
    } catch {
      return null;
    }
  },

  async addMessage(sessionId: string, msg: { role: string; content: string; chatMode?: string; provider?: string; model?: string; tokensUsed?: number; metadata?: unknown }): Promise<boolean> {
    try {
      const res = await fetchWithCredentials(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async delete(sessionId: string): Promise<boolean> {
    try {
      const res = await fetchWithCredentials(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async archive(sessionId: string, isArchived = true): Promise<boolean> {
    try {
      const res = await fetchWithCredentials(`/api/chat/sessions/${sessionId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async archiveFromConversation(params: {
    name?: string;
    chatMode?: string;
    provider?: string;
    model?: string;
    messages: Array<{ role: string; content: string; [k: string]: unknown }>;
  }): Promise<{ id: string } | null> {
    try {
      const res = await fetchWithCredentials('/api/chat/sessions/archive-from-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.session || null;
    } catch {
      return null;
    }
  },
};
