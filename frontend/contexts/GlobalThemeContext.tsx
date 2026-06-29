'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';

export type GlobalTheme = 'light' | 'dark';

interface GlobalThemeContextType {
  theme: GlobalTheme;
  setTheme: (theme: GlobalTheme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const GlobalThemeContext = createContext<GlobalThemeContextType | undefined>(
  undefined
);

export function GlobalThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<GlobalTheme>('light');
  const [mounted, setMounted] = useState(false);
  const loadedRef = useRef(false);

  // Load from DB on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined' || loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      try {
        const res = await fetch('/api/user/preferences', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && (json.data?.siteTheme === 'dark' || json.data?.siteTheme === 'light')) {
            setThemeState(json.data.siteTheme);
          }
        }
      } catch {
        // Keep default
      }
    })();
  }, []);

  // Sync .dark-theme class on <html> whenever global theme changes
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }, [theme, mounted]);

  // Set theme and persist to DB
  const setTheme = useCallback((newTheme: GlobalTheme) => {
    setThemeState(newTheme);
    fetch('/api/user/preferences/site-theme', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: newTheme }),
    }).catch(() => {});
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const value: GlobalThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return (
    <GlobalThemeContext.Provider value={value}>
      {children}
    </GlobalThemeContext.Provider>
  );
}

// Hook to use global theme
export function useGlobalTheme() {
  const context = useContext(GlobalThemeContext);
  if (context === undefined) {
    // Fallback for components not wrapped in provider
    return {
      theme: 'light' as GlobalTheme,
      setTheme: () => {},
      toggleTheme: () => {},
      isDark: false,
    };
  }
  return context;
}
