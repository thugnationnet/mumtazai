/**
 * useCanvasProjects Hook
 * Manages canvas project persistence with backend API (ZERO localStorage)
 * 
 * All data stored in PostgreSQL via backend API.
 * In-memory React state used for instant UI updates.
 * 
 * Scoping Strategy:
 * - Authenticated users: userId-based scoping (server-side)
 * - Guest users: Unique sessionId per browser session
 * - Optional agentId for further isolation between agents
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCanvasSessionId } from '../../../../lib/sessionManager';

export interface CanvasProject {
  id: string;
  name: string;
  prompt: string;
  code: string;
  timestamp: number;
  chatHistory?: ChatMessage[];
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface UseCanvasProjectsOptions {
  userId?: string | null;
  agentId?: string;
}

interface UseCanvasProjectsResult {
  projects: CanvasProject[];
  isLoading: boolean;
  error: string | null;
  saveProject: (project: Omit<CanvasProject, 'id'> & { id?: string }) => Promise<{ success: boolean; projectId?: string }>;
  loadProject: (projectId: string) => Promise<CanvasProject | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  updateProject: (projectId: string, updates: Partial<CanvasProject>) => Promise<boolean>;
  syncToBackend: () => Promise<void>;
  sessionId: string;  // Expose sessionId for debugging
}

// User/session-scoped key for canvas chat messages (used by loadChatHistory/saveChatHistory)
const getChatStorageKey = (userId: string | null, agentId?: string) => {
  const baseId = userId || getCanvasSessionId();
  if (agentId && agentId !== 'default') {
    return `canvasMessages_${agentId}_${baseId}`;
  }
  return `canvasMessages_${baseId}`;
};

export function useCanvasProjects(
  userIdOrOptions?: string | null | UseCanvasProjectsOptions
): UseCanvasProjectsResult {
  // Parse options - support both old signature (just userId) and new options object
  const options = typeof userIdOrOptions === 'object' && userIdOrOptions !== null && 'agentId' in userIdOrOptions
    ? userIdOrOptions
    : { userId: userIdOrOptions as string | null | undefined };
  
  const currentUserId = options.userId ?? null;
  const agentId = options.agentId;
  
  // Get sessionId for guests - this is stable per browser session
  const sessionId = typeof window !== 'undefined' ? getCanvasSessionId() : '';
  
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedFromApi = useRef(false);
  const isSyncing = useRef(false);

  // Load projects from API on mount
  useEffect(() => {
    if (hasLoadedFromApi.current) return;
    hasLoadedFromApi.current = true;

    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/canvas-projects', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.projects) {
            const backendProjects: CanvasProject[] = data.projects.map((p: Record<string, unknown>) => ({
              id: p.id || p.projectId,
              name: p.name || 'Untitled',
              prompt: p.description || '',
              code: p.code || '',
              timestamp: new Date(p.createdAt as string || Date.now()).getTime(),
              chatHistory: p.chatHistory || [],
              metadata: p.metadata || {},
            }));

            setProjects(backendProjects.sort((a, b) => b.timestamp - a.timestamp));
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[Canvas] Failed to load from API:', err);
        setError('Failed to load projects');
      }

      setProjects([]);
      setIsLoading(false);
    };

    loadProjects();
  }, [currentUserId]);

  // Mark legacy migration via DB (one-time, no localStorage)
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUserId) return;
    
    const migrationKey = `canvas_migrated_${currentUserId}`;

    const checkMigration = async () => {
      try {
        const res = await fetch('/api/user/preferences', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const flags = data?.data?.uiFlags || {};
          if (flags[migrationKey]) return; // Already migrated
        }
      } catch { /* fall through */ }

      // Mark as migrated in DB
      fetch('/api/user/preferences/ui-flags', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [migrationKey]: true }),
      }).catch(() => {});
    };

    checkMigration();
  }, [currentUserId]);

  // Merge projects (backend takes priority for same IDs)
  const mergeProjects = (backend: CanvasProject[], local: CanvasProject[]): CanvasProject[] => {
    const backendIds = new Set(backend.map(p => p.id));
    const localOnly = local.filter(p => !backendIds.has(p.id));
    return [...backend, ...localOnly].sort((a, b) => b.timestamp - a.timestamp);
  };

  // Save a project
  const saveProject = useCallback(async (
    project: Omit<CanvasProject, 'id'> & { id?: string }
  ): Promise<{ success: boolean; projectId?: string }> => {
    const projectId = project.id || `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullProject: CanvasProject = {
      ...project,
      id: projectId,
      timestamp: project.timestamp || Date.now(),
    };

    // Update local state immediately
    setProjects(prev => {
      const existing = prev.findIndex(p => p.id === projectId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = fullProject;
        return updated;
      }
      return [fullProject, ...prev];
    });

    // Try to save to backend
    try {
      const response = await fetch('/api/canvas-projects', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId,
          name: fullProject.name,
          description: fullProject.prompt,
          code: fullProject.code,
          chatHistory: fullProject.chatHistory,
          metadata: fullProject.metadata,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, projectId: data.projectId || projectId };
      }
    } catch (err) {
      console.warn('[Canvas] Failed to save to backend, saved locally:', err);
    }

    return { success: true, projectId };
  }, []);

  // Load a specific project
  const loadProject = useCallback(async (projectId: string): Promise<CanvasProject | null> => {
    // Check local state first
    const local = projects.find(p => p.id === projectId);
    if (local) return local;

    // Try backend
    try {
      const response = await fetch(`/api/canvas-projects/${projectId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.project) {
          return {
            id: data.project.id || data.project.projectId,
            name: data.project.name,
            prompt: data.project.description || '',
            code: data.project.code || '',
            timestamp: new Date(data.project.createdAt).getTime(),
            chatHistory: data.project.chatHistory || [],
            metadata: data.project.metadata || {},
          };
        }
      }
    } catch (err) {
      console.warn('[Canvas] Failed to load project from backend:', err);
    }

    return null;
  }, [projects]);

  // Delete a project
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    // Remove from local state
    setProjects(prev => prev.filter(p => p.id !== projectId));

    // Try to delete from backend
    try {
      const response = await fetch(`/api/canvas-projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('[Canvas] Project deleted from backend:', projectId);
      }
    } catch (err) {
      console.warn('[Canvas] Failed to delete from backend:', err);
    }

    return true;
  }, []);

  // Update a project
  const updateProject = useCallback(async (
    projectId: string,
    updates: Partial<CanvasProject>
  ): Promise<boolean> => {
    // Update local state
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, ...updates } : p
    ));

    // Try to update backend
    try {
      const response = await fetch(`/api/canvas-projects/${projectId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updates.name,
          description: updates.prompt,
          code: updates.code,
          chatHistory: updates.chatHistory,
          metadata: updates.metadata,
        }),
      });

      if (response.ok) {
        return true;
      }
    } catch (err) {
      console.warn('[Canvas] Failed to update in backend:', err);
    }

    return true;
  }, []);

  // Sync all local projects to backend
  const syncToBackend = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      for (const project of projects) {
        await saveProject(project);
      }
    } catch (err) {
      console.error('[Canvas] Sync failed:', err);
    } finally {
      isSyncing.current = false;
    }
  }, [projects, saveProject]);

  return {
    projects,
    isLoading,
    error,
    saveProject,
    loadProject,
    deleteProject,
    updateProject,
    syncToBackend,
    sessionId,  // Expose for debugging/tracking
  };
}

// Export chat history helpers (DB only — no localStorage)
export async function loadChatHistory(userId?: string | null, agentId?: string): Promise<ChatMessage[]> {
  const effectiveAgentId = agentId && agentId !== 'default' ? agentId : 'default';

  try {
    const res = await fetch(`/api/user/preferences/canvas-messages/${effectiveAgentId}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
        return data.messages;
      }
    }
  } catch { /* fall through */ }

  return [];
}

export function saveChatHistory(messages: ChatMessage[], userId?: string | null, agentId?: string): void {
  // Fire-and-forget: DB save
  const effectiveAgentId = agentId && agentId !== 'default' ? agentId : 'default';
  fetch(`/api/user/preferences/canvas-messages/${effectiveAgentId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  }).catch(() => {});
}
