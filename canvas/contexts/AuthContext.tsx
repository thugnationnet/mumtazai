/**
 * Canvas Build Auth Context
 *
 * Provides centralised auth state for the entire Canvas Build app.
 * Authentication works via httpOnly cookies:
 *   - `neural_link_session` — set by shiny-backend (port 3005) on `.mumtaz.ai`
 *
 * On mount, calls `/api/auth/session` (with credentials: 'include') to verify
 * the session and fetch user info.  If the user is already signed in on
 * the main site, the cross-domain cookie is picked up automatically.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { fetchWithCredentials } from '../fetchUtil';

// ── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  /** Re-check session (e.g. after sign-in redirect) */
  refreshAuth: () => Promise<void>;
  /** Sign out and redirect to main site */
  logout: () => Promise<void>;
}

// ── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    const parseUser = async (res: Response): Promise<AuthUser | null> => {
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.success && data?.user?.id) {
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || data.user.email?.split('@')[0] || 'User',
          avatar: data.user.avatar,
          role: data.user.role,
        };
      }
      return null;
    };

    setIsLoading(true);
    try {
      const res = await fetchWithCredentials('/api/auth/session', { cache: 'no-store' });
      const primaryUser = await parseUser(res);
      if (primaryUser) {
        setUser(primaryUser);
        setIsAuthenticated(true);
        return;
      }

      // Fallback to the central domain. This recovers sessions that still exist only
      // as host-only cookies on mumtaz.ai from older auth flows.
      const centralRes = await fetch('https://mumtaz.ai/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });
      const centralUser = await parseUser(centralRes);
      if (centralUser) {
        setUser(centralUser);
        setIsAuthenticated(true);
        return;
      }

      setUser(null);
      setIsAuthenticated(false);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetchWithCredentials('/api/auth/logout', { method: 'POST' });
    } catch {
      /* best-effort */
    }
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = 'https://mumtaz.ai/';
  }, []);

  // Check session on first mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    refreshAuth: checkSession,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
