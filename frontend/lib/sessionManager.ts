/**
 * SESSION MANAGER
 * Manages unique session IDs for Canvas/Studio to ensure data isolation
 * - Authenticated users: Use their userId
 * - Guest users: Generate unique sessionId per browser session
 */

const SESSION_STORAGE_KEY = 'canvas_session_id';
const COOKIE_NAME = 'canvas_session';

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const randomPart2 = Math.random().toString(36).substring(2, 6);
  return `session_${timestamp}_${randomPart}${randomPart2}`;
}

/**
 * Get or create a session ID for the current browser session
 * This ensures each browser tab/session gets a unique ID for guest users
 */
export function getCanvasSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return temporary ID
    return `ssr_${Date.now()}`;
  }

  // Try to get existing session ID from sessionStorage
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    
    // Also set a cookie so backend can use it
    document.cookie = `${COOKIE_NAME}=${sessionId}; path=/; max-age=86400; SameSite=Lax`;
  }
  
  return sessionId;
}

/**
 * Get the effective storage key for canvas data
 * - For authenticated users: Uses userId
 * - For guests: Uses unique sessionId
 * - Optionally includes agentId for further isolation
 */
export function getCanvasStorageKey(
  userId: string | null,
  prefix: string = 'canvas',
  agentId?: string
): string {
  const baseKey = userId || getCanvasSessionId();
  
  if (agentId && agentId !== 'default') {
    return `${prefix}_${agentId}_${baseKey}`;
  }
  
  return `${prefix}_${baseKey}`;
}

/**
 * Clear the current session (for logout or explicit reset)
 */
export function clearCanvasSession(): void {
  if (typeof window === 'undefined') return;
  
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Check if the current user is a guest (no authenticated userId)
 */
export function isGuestSession(userId: string | null): boolean {
  return !userId;
}

/**
 * Get session metadata for API requests
 * Returns an object that can be sent to the backend for session tracking
 */
export function getSessionMetadata(userId: string | null): {
  userId?: string;
  sessionId: string;
  isAuthenticated: boolean;
} {
  const sessionId = getCanvasSessionId();
  
  if (userId) {
    return {
      userId,
      sessionId,
      isAuthenticated: true,
    };
  }
  
  return {
    sessionId,
    isAuthenticated: false,
  };
}
