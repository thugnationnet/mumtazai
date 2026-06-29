import { ReactNode } from 'react';

/**
 * Shared section wrapper used by the home-page marketing sections.
 * Provides the lavender gradient background, glass ribbon decorations,
 * chrome sweep and a centered `container-custom` content area.
 */
export default function SectionShell({ children }: { children: ReactNode }) {
  return (
    <section className="themed-section-bg section-padding overflow-hidden relative">
      {/* Glass ribbons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-24 bg-white/20 rounded-3xl rotate-12 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-1/3 -right-16 w-80 h-20 bg-white/15 rounded-3xl -rotate-6 backdrop-blur-sm border border-white/30" />
        <div className="absolute bottom-20 left-1/4 w-72 h-16 bg-white/10 rounded-3xl rotate-3 backdrop-blur-sm border border-white/25" />
        <div className="absolute -bottom-10 right-1/3 w-64 h-14 bg-white/20 rounded-3xl -rotate-12 backdrop-blur-sm border border-white/35" />
        <div className="absolute top-1/2 left-10 w-48 h-12 bg-white/10 rounded-3xl rotate-45 backdrop-blur-sm border border-white/20" />
        {/* Chrome sweep */}
        <div className="absolute inset-0 themed-section-sweep" />
      </div>
      <div className="container-custom relative z-10">{children}</div>
    </section>
  );
}
