'use client';

import { createContext, useContext, ReactNode } from 'react';

// Stub AuthContext for demo — no login required, always "guest"
interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; email?: string; name?: string } | null;
  token: string | null;
  loading: boolean;
  isLoading: boolean;
}

interface AuthContextType {
  authState: AuthState;
  state: AuthState; // Alias used by universal-canvas
  login: () => Promise<void>;
  logout: () => void;
  register: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const defaultState: AuthState = { isAuthenticated: false, user: null, token: null, loading: false, isLoading: false };

const AuthContext = createContext<AuthContextType>({
  authState: defaultState,
  state: defaultState,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthContextType = {
    authState: defaultState,
    state: defaultState,
    login: async () => {},
    logout: () => {},
    register: async () => {},
    refreshUser: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
