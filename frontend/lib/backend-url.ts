/**
 * Centralized backend URL configuration.
 * Import from here instead of hardcoding URLs in each file.
 */

const DEFAULT_BACKEND_URL = 'http://127.0.0.1:3005';

// ── Server-side (API routes) ────────────────────────────────

/** Main backend URL — used by most API route proxies */
export const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.BACKEND_BASE_URL ||
  DEFAULT_BACKEND_URL;

/** Auth-specific backend (falls back to main) */
export const AUTH_BACKEND_URL =
  process.env.AUTH_BACKEND_URL ||
  BACKEND_URL;

/** Chat / subscription backend (falls back to main) */
export const CHAT_BACKEND_URL =
  process.env.CHAT_BACKEND_URL ||
  BACKEND_URL;

// ── Client-side (needs NEXT_PUBLIC_ prefix) ─────────────────

/** Public API URL for browser-side fetch / WebSocket */
export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:3005';
