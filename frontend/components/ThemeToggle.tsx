'use client';

import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load theme from DB, fallback to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply system preference immediately to avoid flash
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }

    // Then load from DB (overrides system preference if available)
    (async () => {
      try {
        const res = await fetch('/api/user/preferences', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.siteTheme) {
            const dbTheme = json.data.siteTheme;
            const shouldBeDark = dbTheme === 'dark';
            setIsDark(shouldBeDark);
            if (shouldBeDark) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            return;
          }
        }
      } catch {
        // Fallback to system preference (already applied)
      }
    })();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    const themeStr = newTheme ? 'dark' : 'light';
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Persist to DB
    fetch('/api/user/preferences/site-theme', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: themeStr }),
    }).catch(() => {});
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center w-12 h-12 rounded-full
        transition-all duration-300 transform hover:scale-110
        ${isDark 
          ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 text-slate-900 shadow-lg hover:shadow-xl' 
          : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-slate-900 shadow-lg hover:shadow-xl'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        ${isDark ? 'focus:ring-yellow-400' : 'focus:ring-indigo-500'}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative">
        {isDark ? (
          <SunIcon className="h-6 w-6 transform transition-transform duration-300 hover:rotate-45" />
        ) : (
          <MoonIcon className="h-6 w-6 transform transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>
      
      {/* Animated background glow */}
      <div className={`
        absolute inset-0 rounded-full opacity-20 blur-xl transition-all duration-300
        ${isDark 
          ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
          : 'bg-gradient-to-br from-indigo-500 to-purple-600'
        }
      `} />
    </button>
  );
}