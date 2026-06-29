/**
 * CACHE — In-memory key-value store used by agent-tools-service workflow automation.
 * Provides cache.get(key) and cache.set(key, value, ttlSeconds) interface.
 * Falls back to Map-based in-process storage (no Redis dependency per agent).
 */

class CacheManager {
  constructor() {
    this._store = new Map();
  }

  async get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttlSeconds = 3600) {
    this._store.set(key, {
      value,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key) {
    this._store.delete(key);
  }
}

export const cache = new CacheManager();
export default cache;

