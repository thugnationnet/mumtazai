/**
 * Canvas Apps Service — App CRUD via /api/canvas-builder/my-apps
 *
 * IMPORTANT: This service is for the STANDALONE canvas-studio product.
 * Database isolation: canvas-studio uses the `canvas_projects` table (CanvasProject),
 * canvas (universal-canvas) uses a separate `canvas_build_projects` table (CanvasBuildProject).
 * No source-column filtering needed — table-level separation enforces isolation.
 *
 * Provides getApps(), saveApp(), updateApp() with backend persistence.
 * Uses DB-backed canvas-state for offline cache (ZERO localStorage).
 */
import { GeneratedApp } from '../types';

const API_BASE = '/api/canvas-builder/my-apps';
const CACHE_KEY = 'canvas_apps_cache';
const STATE_API = '/api/user/preferences/canvas-state';

// In-memory session cache (lost on page close for guests)
let _memoryCache: GeneratedApp[] | null = null;

/** Read cache — try DB canvas-state first, fall back to in-memory session cache */
async function readCache(): Promise<GeneratedApp[]> {
  // Return in-memory cache if available
  if (_memoryCache !== null) return _memoryCache;

  try {
    const res = await fetch(`${STATE_API}/${CACHE_KEY}`, { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        _memoryCache = json.data;
        return _memoryCache;
      }
    }
  } catch { /* fall through */ }

  return [];
}

/** Write cache to DB canvas-state + in-memory session cache (ZERO localStorage) */
async function writeCache(apps: GeneratedApp[]): Promise<void> {
  const trimmed = apps.slice(0, 50);
  _memoryCache = trimmed;

  // Write to DB
  try {
    await fetch(`${STATE_API}/${CACHE_KEY}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trimmed),
    });
  } catch { /* offline — in-memory cache still has the data */ }
}

const canvasAppsService = {
  /**
   * Fetch all apps for the authenticated user.
   * Falls back to DB-backed cache on network error.
   */
  async getApps(): Promise<GeneratedApp[]> {
    try {
      const res = await fetch(API_BASE, {
        credentials: 'include',
      });

      if (!res.ok) {
        console.warn('[canvasAppsService] GET failed, using cache');
        return await readCache();
      }

      const data = await res.json();
      const apps: GeneratedApp[] = (data.projects || data.data || data || []).map(
        (p: any) => normalizeApp(p)
      );

      // Update cache
      await writeCache(apps);
      return apps;
    } catch (err) {
      console.warn('[canvasAppsService] Network error, using cache:', err);
      return await readCache();
    }
  },

  /**
   * Save a new app to the backend.
   * Returns the saved app with server-assigned ID.
   */
  async saveApp(app: GeneratedApp): Promise<GeneratedApp | null> {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: app.name || 'Untitled',
          code: app.code,
          prompt: app.prompt,
          language: app.language || 'html',
          provider: app.provider,
          modelId: app.modelId,
          files: app.files,
          history: app.history,
        }),
      });

      if (!res.ok) {
        console.error('[canvasAppsService] saveApp failed:', res.status);
        return await fallbackSave(app);
      }

      const data = await res.json();
      const saved = normalizeApp(data.project || data.data || data);

      // Update cache
      const cache = await readCache();
      await writeCache([saved, ...cache.filter((a) => a.id !== saved.id)]);

      return saved;
    } catch (err) {
      console.error('[canvasAppsService] saveApp error:', err);
      return await fallbackSave(app);
    }
  },

  /**
   * Update an existing app by ID.
   * Returns the updated app.
   * Falls back to creating a new app if the ID is not found (e.g. stale timestamp ID).
   */
  async updateApp(
    id: string,
    updates: Partial<GeneratedApp>
  ): Promise<GeneratedApp | null> {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updates.name,
          code: updates.code,
          prompt: updates.prompt,
          language: updates.language,
          provider: updates.provider,
          modelId: updates.modelId,
          files: updates.files,
          history: updates.history,
          isFavorite: updates.isFavorite,
        }),
      });

      if (res.status === 404) {
        // ID not found in DB (likely a stale timestamp ID) — create a new record instead
        console.warn(`[canvasAppsService] updateApp 404 for id=${id}, falling back to saveApp`);
        const saved = await canvasAppsService.saveApp(updates as GeneratedApp);
        return saved;
      }

      if (!res.ok) {
        console.error('[canvasAppsService] updateApp failed:', res.status);
        return await fallbackUpdate(id, updates);
      }

      const data = await res.json();
      const updated = normalizeApp(data.project || data.data || data);

      // Update cache
      const cache = await readCache();
      await writeCache(cache.map((a) => (a.id === id ? updated : a)));

      return updated;
    } catch (err) {
      console.error('[canvasAppsService] updateApp error:', err);
      return await fallbackUpdate(id, updates);
    }
  },

  /**
   * Delete an app by ID.
   */
  async deleteApp(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      // Remove from cache regardless
      const cache = await readCache();
      await writeCache(cache.filter((a) => a.id !== id));

      return res.ok;
    } catch {
      const cache = await readCache();
      await writeCache(cache.filter((a) => a.id !== id));
      return false;
    }
  },
};

/** Normalize backend project shape → GeneratedApp */
function normalizeApp(raw: any): GeneratedApp {
  return {
    id: raw.id || raw._id || `local_${Date.now()}`,
    name: raw.name || raw.projectName || 'Untitled',
    code: raw.code || raw.content || '',
    prompt: raw.prompt || raw.description || '',
    timestamp: raw.timestamp || Date.parse(raw.createdAt) || Date.now(),
    history: raw.history || raw.chatHistory || [],
    language: raw.language || 'html',
    provider: raw.provider,
    modelId: raw.modelId,
    files: raw.files,
    thumbnail: raw.thumbnail,
    isFavorite: raw.isFavorite || false,
  };
}

/** DB-backed save fallback for offline/guest */
async function fallbackSave(app: GeneratedApp): Promise<GeneratedApp> {
  const saved = {
    ...app,
    id: app.id || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: app.timestamp || Date.now(),
  };
  const cache = await readCache();
  await writeCache([saved, ...cache.filter((a) => a.id !== saved.id)]);
  return saved;
}

/** DB-backed update fallback */
async function fallbackUpdate(
  id: string,
  updates: Partial<GeneratedApp>
): Promise<GeneratedApp | null> {
  const cache = await readCache();
  const existing = cache.find((a) => a.id === id);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  await writeCache(cache.map((a) => (a.id === id ? updated : a)));
  return updated;
}

export default canvasAppsService;
