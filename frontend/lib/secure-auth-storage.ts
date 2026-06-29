/**
 * Secure Auth Storage Utility for HttpOnly Session Cookies
 *
 * IMPORTANT: With HttpOnly cookies, NO localStorage is used.
 * - Session ID: Stored in HttpOnly cookie (not accessible to JavaScript)
 * - User Identity: Always verified via server session validation
 * - User data: Held in memory only (React state) for UI rendering
 */

// In-memory user data (NOT persisted — refreshed from server on each page load)
let _memoryUser: any = null;

export const secureAuthStorage = {
  /**
   * Store user data in memory (safe — no persistent storage)
   */
  setUser: (user: any) => {
    _memoryUser = user;
  },

  /**
   * Get user data from memory
   */
  getUser: () => {
    return _memoryUser;
  },

  /**
   * Verify session via server call (HttpOnly cookie sent automatically)
   */
  verifySession: async (): Promise<{ valid: boolean; user?: any }> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        credentials: 'include', // Sends HttpOnly cookies automatically
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        return { valid: data.valid, user: data.user };
      }

      return { valid: false };
    } catch (error) {
      console.error('❌ Session verification failed:', error);
      return { valid: false };
    }
  },

  /**
   * Clear user data from memory (token cleared via logout endpoint)
   */
  clearUser: () => {
    _memoryUser = null;
  },

  /**
   * Logout and clear HttpOnly cookie via server
   */
  logout: async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Sends HttpOnly cookies automatically
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Clear local user data regardless of server response
      secureAuthStorage.clearUser();

      if (response.ok) {
        return true;
      } else {
        console.warn('⚠️ Server logout failed, but local data cleared');
        return false;
      }
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Still clear local data
      secureAuthStorage.clearUser();
      return false;
    }
  },
};

export default secureAuthStorage;
