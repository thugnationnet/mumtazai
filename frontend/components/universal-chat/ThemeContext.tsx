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

export type ChatTheme = 'default' | 'neural';

interface ThemeContextType {
  theme: ChatTheme;
  setTheme: (theme: ChatTheme) => void;
  toggleTheme: () => ChatTheme;
  isNeural: boolean;
  /** Ref callback — attach to the chat wrapper div to scope dark-theme */
  themeContainerRef: React.RefCallback<HTMLDivElement>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  agentId: string;
}

export function ThemeProvider({ children, agentId }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ChatTheme>('default');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load theme from DB only
  const themeLoadedRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!themeLoadedRef.current) {
      themeLoadedRef.current = true;

      (async () => {
        try {
          const res = await fetch('/api/user/preferences', { credentials: 'include' });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data?.agentThemes?.[agentId]) {
              const dbTheme = json.data.agentThemes[agentId] as ChatTheme;
              setThemeState(dbTheme);
            }
          }
        } catch {
          // Keep default
        }
      })();
    }
  }, [agentId]);

  // Apply dark-theme class to scoped container only (NOT <html>)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (theme === 'neural') {
      el.classList.add('dark-theme');
    } else {
      el.classList.remove('dark-theme');
    }
  }, [theme]);

  // Ref callback to capture the container element
  const themeContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (node) {
        if (theme === 'neural') {
          node.classList.add('dark-theme');
        } else {
          node.classList.remove('dark-theme');
        }
      }
    },
    [theme]
  );

  // Update theme and persist to DB
  const setTheme = useCallback(
    (newTheme: ChatTheme) => {
      setThemeState(newTheme);
      fetch(`/api/user/preferences/agent-theme/${encodeURIComponent(agentId)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      }).catch(() => {});
    },
    [agentId]
  );

  // Toggle between themes
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'default' ? 'neural' : 'default';
    setTheme(newTheme);
    return newTheme;
  }, [theme, setTheme]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isNeural: theme === 'neural',
    themeContainerRef,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useChatTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Fallback for components not wrapped in provider (backward compatibility)
    return {
      theme: 'default' as ChatTheme,
      setTheme: () => {},
      toggleTheme: () => 'default' as ChatTheme,
      isNeural: false,
      themeContainerRef: () => {},
    };
  }
  return context;
}
