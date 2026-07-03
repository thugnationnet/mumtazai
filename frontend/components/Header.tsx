'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalTheme } from '@/contexts/GlobalThemeContext';
import Image from 'next/image';

export default function Header() {
  const { state, logout } = useAuth();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useGlobalTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  // Auto-close menu on scroll
  useEffect(() => {
    const onScroll = () => {
      if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [menuOpen]);

  // Close on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Hide header on chat root, agent chat pages, and canvas-studio
  if (
    pathname === '/' ||
    (pathname?.startsWith('/agents/') && pathname !== '/agents') ||
    pathname === '/canvas-studio'
  ) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation: Array<{
    name: string;
    href: string;
    external?: boolean;
    icon: string;
  }> = [
    { name: 'Home',         href: '/home', icon: '⌂' },
    { name: 'Agents',       href: 'https://mumtaz.ai/agents', icon: '◉' },
    { name: 'Tools',        href: '/tools', icon: '⚙' },
    { name: 'Status',       href: '/status', icon: '◈' },
    { name: 'Demo',         href: 'https://demo.mumtaz.ai', icon: '▶' },
    { name: 'AI Lab',       href: '/lab', icon: '⬡' },
    { name: 'AI Space',     href: 'https://studio.mumtaz.ai', icon: '◇' },
    { name: 'Canvas',       href: 'https://build.mumtaz.ai', external: true, icon: '▣' },
    { name: 'Editor',       href: 'https://editor.mumtaz.ai', external: true, icon: '✎' },
    { name: 'Apps',          href: '/apps', icon: '⊞' },
  ];

  const MenuLink = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    const className = `group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 active:scale-[0.97] overflow-hidden backdrop-blur-lg ${
      isActive
        ? 'border-2 border-purple-300/70 text-purple-700 bg-white/70 shadow-[0_4px_20px_rgba(139,92,246,0.15),inset_0_2px_4px_rgba(255,255,255,0.9)]'
        : 'border-2 border-white/70 bg-white/40 text-slate-600 hover:bg-white/70 hover:text-slate-800 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(139,92,246,0.1),inset_0_2px_4px_rgba(255,255,255,0.8)]'
    }`;

    const content = (
      <>
        {isActive && <div className="absolute inset-0 bg-gradient-to-r from-purple-50/60 to-indigo-50/40 rounded-2xl" />}
        <span className={`text-sm ${isActive ? 'opacity-70' : 'opacity-35'}`}>{item.icon}</span>
        <span className="text-sm font-semibold tracking-wide relative">{item.name}</span>
        {item.external && (
          <svg className="w-3 h-3 ml-auto opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        )}
      </>
    );

    if (item.external || item.href.startsWith('http')) {
      return (
        <a href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined} className={className} onClick={() => setMenuOpen(false)}>
          {content}
        </a>
      );
    }
    return (
      <Link href={item.href} className={className} onClick={() => setMenuOpen(false)}>
        {content}
      </Link>
    );
  };

  return (
    <>
      {/* ━━━ Backdrop overlay ━━━ */}
      <div
        className={`fixed inset-0 z-[185] bg-black/30 backdrop-blur-sm transition-opacity duration-500 ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* ━━━ LOGO BUTTON — Fixed top-left, glass style ━━━ */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`fixed top-4 left-4 z-[200] w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group overflow-hidden backdrop-blur-xl ${
          menuOpen
            ? 'bg-white/70 border-2 border-purple-400/60 shadow-[0_4px_24px_rgba(139,92,246,0.3)] scale-110'
            : 'bg-white/50 border-2 border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_2px_4px_rgba(255,255,255,0.8)] hover:bg-white/70 hover:scale-105 hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)]'
        }`}
        aria-label="Toggle menu"
      >
        <Image
          src="/images/logos/company-logo.png"
          alt="Mumtaz AI"
          width={28}
          height={28}
          className={`w-7 h-7 object-contain rounded-md transition-all duration-500 ${
            menuOpen ? 'rotate-180 scale-90' : 'group-hover:scale-110'
          }`}
        />
      </button>

      {/* ━━━ SLIDER MENU — slides from left, glass panel ━━━ */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-[190] w-full max-w-md flex flex-col overflow-hidden transition-transform duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${
          menuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Crystal Flow background */}
        <div className="themed-section-bg absolute inset-0 backdrop-blur-[28px] backdrop-saturate-150 border-r-2 border-white/80 shadow-[8px_0_40px_rgba(0,0,0,0.08)]" />

        {/* Glass Ribbons */}
        <div className="absolute -top-16 -left-8 w-[120px] h-[360px] rotate-[25deg] rounded-[60px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40 pointer-events-none" />
        <div className="absolute -top-24 right-[5%] w-[100px] h-[420px] rotate-[-20deg] rounded-[60px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30 pointer-events-none" />
        <div className="absolute -bottom-28 left-[25%] w-[90px] h-[300px] rotate-[35deg] rounded-[60px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30 pointer-events-none" />
        <div className="absolute -bottom-16 -right-6 w-[130px] h-[340px] rotate-[-30deg] rounded-[60px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40 pointer-events-none" />
        <div className="absolute top-[15%] left-[40%] w-[70px] h-[240px] rotate-[15deg] rounded-[50px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25 pointer-events-none" />
        {/* Chrome Sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

        {/* Close button */}
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-5 right-5 z-[200] w-10 h-10 rounded-xl bg-white/50 backdrop-blur-lg border-2 border-white/80 text-slate-500 flex items-center justify-center hover:bg-white/80 hover:text-slate-800 hover:rotate-90 hover:shadow-[0_4px_20px_rgba(139,92,246,0.12)] transition-all duration-500 shadow-[0_2px_12px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.8)]"
          aria-label="Close menu"
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Menu content */}
        <div className="flex flex-col flex-1 relative z-10 px-6 pt-6 pb-4 overflow-y-auto">

          {/* Title — Logo + brand name */}
          <div className="flex flex-col items-center w-full mb-1 mt-1">
            <Image
              src="/images/logos/company-logo.png"
              alt="Mumtaz AI"
              width={52}
              height={52}
              className="h-13 w-auto object-contain rounded-xl mb-2"
            />
            <p className="text-slate-700 text-base font-bold tracking-[0.2em] uppercase">Mumtaz AI</p>
            <p className="text-slate-400 text-[10px] font-semibold tracking-[0.25em] uppercase mt-1">Intelligence Platform</p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent my-6" />

          {/* Nav Grid — glass buttons */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            {navigation.map((item) => (
              <MenuLink key={item.name} item={item} />
            ))}
          </div>

          {/* Auth Section */}
          <div className="mt-6 flex flex-col gap-3 w-full">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

            {!state.isLoading && (
              state.isAuthenticated ? (
                <div className="flex gap-2.5 w-full mt-2">
                  <Link
                    href="/dashboard/overview"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/50 backdrop-blur-lg border-2 border-white/80 text-slate-600 text-sm font-semibold hover:bg-red-50/60 hover:text-red-500 hover:border-red-200/60 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 shadow-[0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.8)]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2.5 w-full mt-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/50 backdrop-blur-lg border-2 border-white/80 text-slate-700 text-sm font-semibold hover:bg-white/80 hover:text-slate-900 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 shadow-[0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.8)]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                  >
                    Get Started
                  </Link>
                </div>
              )
            )}
          </div>

          <div className="flex-1" />

          {/* Theme toggle — glass pill */}
          <button
            onClick={toggleTheme}
            className="self-center mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-lg border border-white/70 text-slate-500 text-xs font-medium tracking-wide hover:bg-white/60 hover:text-slate-700 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            {mounted && (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {isDark ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  )}
                </svg>
                {isDark ? 'Dark' : 'Light'}
              </>
            )}
          </button>
        </div>

        {/* Bottom status bar — glass */}
        <div className="relative z-10 border-t border-white/40 bg-white/30 backdrop-blur-lg py-3 flex justify-center">
          <div className="flex items-center gap-5 text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              Online
            </div>
            <span className="w-px h-3 bg-slate-200/60" />
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-purple-400" viewBox="0 0 24 24" fill="currentColor"><path d="M16.309 9.313a1.12 1.12 0 0 0-.962-.085l-2.3.946L15.393.39A.466.466 0 0 0 15 0a.473.473 0 0 0-.42.228L7.6 11.986c-.14.222-.12.5.045.7a.69.69 0 0 0 .596.252l2.715-.372-1.477 5.605a.465.465 0 0 0 .253.529c.076.037.16.056.243.056a.47.47 0 0 0 .324-.126l6.5-6.06c.183-.17.24-.434.146-.67z"/></svg>
              Protected
            </div>
            <span className="w-px h-3 bg-slate-200/60" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
              v2.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
