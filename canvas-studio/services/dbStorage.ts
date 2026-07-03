/**
 * DB Storage Adapter — Pure database-backed storage for all Zustand persist stores
 *
 * Implements Zustand's StateStorage interface with PostgreSQL backing
 * via /api/user/preferences/canvas-state endpoints.
 *
 * ZERO localStorage — all data is database-backed.
 *
 * Behaviour:
 *  - On first getItem(), fetches ALL canvas states in one request (bulk hydration)
 *  - Subsequent getItem() calls hit the in-memory session cache
 *  - setItem() debounces writes (1.5s) to avoid flooding the API
 *  - Guest (unauthenticated) users get in-memory session cache only
 *  - No localStorage dependency — data persists only in DB
 */
import type { StateStorage } from 'zustand/middleware';

const API_BASE = '/api/user/preferences/canvas-state';
const DEBOUNCE_MS = 1500;

// ═══════════════════════════════════════════════════════════════════
// In-memory session cache — fetched once per page load
// For guests: in-memory only (lost on page close)
// For authenticated users: synced with DB
// ═══════════════════════════════════════════════════════════════════

let _cache: Record<string, unknown> | null = null;
let _cachePromise: Promise<Record<string, unknown>> | null = null;
let _isAuthenticated: boolean | null = null; // null = unknown, true/false after first fetch

/**
 * Fetch all canvas states from the API in one request.
 * Caches the result in memory for the session lifetime.
 * Returns {} for guests (401) — marks _isAuthenticated = false.
 * ZERO localStorage fallback — guests get empty state.
 */
function fetchAllStates(): Promise<Record<string, unknown>> {
  if (_cache !== null) return Promise.resolve(_cache);
  if (_cachePromise) return _cachePromise;

  _cachePromise = (async () => {
    try {
      const res = await fetch(API_BASE, { credentials: 'include' });

      if (res.status === 401) {
        _isAuthenticated = false;
        _cache = {};
        return _cache;
      }

      if (!res.ok) {
        _cache = {};
        return _cache;
      }

      _isAuthenticated = true;
      const json = await res.json();
      _cache = json.data || {};
      return _cache;
    } catch {
      // Network error — can't determine auth state, return empty for guests
      _cache = {};
      return _cache;
    }
  })();

  return _cachePromise;
}

// ═══════════════════════════════════════════════════════════════════
// Debounced Writes — batch rapid setItem calls per store key
// ═══════════════════════════════════════════════════════════════════

const _writeTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debouncedApiWrite(key: string, value: string): void {
  // Don't write to API for guests
  if (_isAuthenticated === false) return;

  const existing = _writeTimers.get(key);
  if (existing) clearTimeout(existing);

  _writeTimers.set(
    key,
    setTimeout(async () => {
      _writeTimers.delete(key);
      try {
        await fetch(`${API_BASE}/${encodeURIComponent(key)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: value, // Already JSON-stringified by Zustand persist
        });
      } catch {
        // Offline — in-memory cache still has the data
      }
    }, DEBOUNCE_MS)
  );
}

// ═══════════════════════════════════════════════════════════════════
// StateStorage implementation
// ═══════════════════════════════════════════════════════════════════

export const dbStorage: StateStorage = {
  /**
   * Load state for a store key.
   * 1. Try API (bulk cached)
   * 2. If API unreachable, return from in-memory session cache
   * ZERO localStorage — no client-side persistence.
   */
  getItem: async (name: string): Promise<string | null> => {
    try {
      const allStates = await fetchAllStates();

      // API has data for this key — use it
      if (name in allStates && allStates[name] !== null && allStates[name] !== undefined) {
        const val = allStates[name];
        return typeof val === 'string' ? val : JSON.stringify(val);
      }

      return null;
    } catch {
      // Total failure — return from in-memory cache if available
      return _cache && name in _cache
        ? (typeof _cache[name] === 'string' ? _cache[name] as string : JSON.stringify(_cache[name]))
        : null;
    }
  },

  /**
   * Save state for a store key.
   * Writes to in-memory session cache immediately, debounces API write.
   * ZERO localStorage — no client-side persistence.
   */
  setItem: async (name: string, value: string): Promise<void> => {
    // Update in-memory session cache immediately
    if (_cache) {
      try { _cache[name] = JSON.parse(value); } catch { _cache[name] = value; }
    }

    // Debounced write to API
    debouncedApiWrite(name, value);
  },

  /**
   * Remove state for a store key.
   * ZERO localStorage — only clears in-memory cache and DB.
   */
  removeItem: async (name: string): Promise<void> => {
    if (_cache) {
      delete _cache[name];
    }

    if (_isAuthenticated === false) return;

    try {
      await fetch(`${API_BASE}/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      // Offline — data removed from in-memory cache
    }
  },
};

// ═══════════════════════════════════════════════════════════════════
// Helpers — ZERO localStorage
// ═══════════════════════════════════════════════════════════════════

/**
 * Reset the in-memory cache — call on login/logout to force re-fetch.
 */
export function resetDbStorageCache(): void {
  _cache = null;
  _cachePromise = null;
  _isAuthenticated = null;
  // Clear all pending writes
  for (const timer of _writeTimers.values()) {
    clearTimeout(timer);
  }
  _writeTimers.clear();
}

/**
 * Flush any pending debounced writes immediately.
 * Call before page unload to ensure data is saved.
 */
export function flushPendingWrites(): void {
  for (const [key, timer] of _writeTimers.entries()) {
    clearTimeout(timer);
    _writeTimers.delete(key);

    // Fire-and-forget the write
    const cached = _cache?.[key];
    if (cached !== undefined) {
      const value = typeof cached === 'string' ? cached : JSON.stringify(cached);
      navigator.sendBeacon?.(
        `${API_BASE}/${encodeURIComponent(key)}`,
        new Blob([value], { type: 'application/json' })
      );
    }
  }
}
