
import React from 'react';

interface OverlayProps {
  active: boolean;
  onActivate: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ active, onActivate }) => {
  return (
    <div
      className={`fixed inset-0 bg-[#0a0a0c] z-[200] flex flex-col items-center justify-center px-6 transition-transform duration-[1200ms] will-change-transform cubic-bezier(0.7, 0, 0.3, 1) ${active ? 'translate-y-0' : '-translate-y-full'
        }`}
    >
      {/* Visual shutter bottom edge shadow/glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-500/20 shadow-[0_5px_15px_rgba(34,211,238,0.3)]"></div>

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(34,211,238,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.2)_1px,transparent_1px)] bg-[length:40px_40px]"></div>

      {/* Ambient glow behind title */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-2xl w-full flex flex-col items-center relative z-10">
        {/* Large ASCII Art Title */}
        <pre className="text-indigo-600 dark:text-indigo-400 text-[14px] sm:text-[18px] md:text-[22px] leading-tight text-center font-mono mb-6 select-none" style={{ textShadow: '0 0 15px rgba(34,211,238,0.6), 0 0 40px rgba(34,211,238,0.2)' }}>
          {`█▀▄▀█ ██     ▄   █    ██       ██   ▄█ 
█ █ █ █ █     █  █    █ █      █ █  ██ 
█ ▄ █ █▄▄█ █   █ █    █▄▄█     █▄▄█ ██ 
█   █ █  █ █   █ ███▄ █  █     █  █ ▐█ 
   █     █ █▄ ▄█     ▀   █        █  ▐ 
  ▀     █   ▀▀▀         █        █     
       ▀               ▀        ▀      `}
        </pre>

        {/* Main Title — Large */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-center tracking-tight leading-none">
          <span className="text-indigo-600 dark:text-indigo-400" style={{ textShadow: '0 0 30px rgba(34,211,238,0.5), 0 0 60px rgba(34,211,238,0.2)' }}>One Last</span>
          <span className="text-emerald-400 ml-3" style={{ textShadow: '0 0 30px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.2)' }}>AI</span>
        </h1>

        <p className="text-gray-500 mt-3 font-mono text-xs sm:text-sm uppercase tracking-[0.3em]">
          AI Digital Friend Zone
        </p>

        {/* Open Studio — Main CTA */}
        <div className="mt-8 relative">
          <button
            onClick={onActivate}
            className="relative group bg-slate-300 dark:bg-black/40 overflow-hidden border border-indigo-500/50 px-10 sm:px-14 py-4 sm:py-5 rounded-sm transition-all hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)] active:scale-95"
          >
            <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative text-indigo-600 dark:text-indigo-400 font-bold tracking-[0.4em] group-hover:text-white transition-colors text-sm sm:text-base flex items-center gap-3">
              🚀 OPEN STUDIO
            </span>
          </button>
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-indigo-500/30"></div>
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-indigo-500/30"></div>
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-indigo-500/30"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-indigo-500/30"></div>
        </div>

        {/* Navigation Buttons — 4 in a row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {[
            { label: 'AI CHAT', icon: '💬', href: 'https://demo.onelastai.co', color: 'border-emerald-500/40 text-emerald-400 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]' },
            { label: 'CANVAS', icon: '⚡', href: 'https://studio.onelastai.co', color: 'border-violet-500/40 text-violet-400 hover:border-violet-400 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]' },
            { label: 'DASHBOARD', icon: '📊', href: 'https://onelastai.co/dashboard/canvas-app', color: 'border-orange-500/40 text-orange-400 hover:border-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]' },
            { label: 'HOME', icon: '🏠', href: 'https://onelastai.co', color: 'border-gray-500/40 text-slate-500 dark:text-slate-400 hover:border-gray-400 hover:shadow-[0_0_20px_rgba(161,161,170,0.15)]' },
          ].map((nav) => (
            <a
              key={nav.label}
              href={nav.href}
              className={`flex items-center gap-2 px-5 py-3 bg-black/30 border rounded-sm font-mono text-xs font-bold tracking-[0.15em] uppercase transition-all hover:bg-black/50 active:scale-95 ${nav.color}`}
            >
              <span className="text-sm">{nav.icon}</span>
              {nav.label}
            </a>
          ))}
        </div>

        {/* Status Indicators */}
        <div className="mt-10 grid grid-cols-3 gap-12 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
          <div className="text-center group">
            <div className="text-cyan-900 group-hover:text-cyan-500 transition-colors mb-1">AI_ENGINE</div>
            <div className="font-bold">[OK]</div>
          </div>
          <div className="text-center group">
            <div className="text-cyan-900 group-hover:text-cyan-500 transition-colors mb-1">CANVAS_CORE</div>
            <div className="font-bold">[READY]</div>
          </div>
          <div className="text-center group">
            <div className="text-cyan-900 group-hover:text-cyan-500 transition-colors mb-1">PREVIEW_SYS</div>
            <div className="font-bold text-emerald-500">[ACTIVE]</div>
          </div>
        </div>
      </div>

      {/* Sub-labeling at the bottom */}
      <div className="absolute bottom-3 text-[8px] text-gray-800 font-mono uppercase tracking-[1em] opacity-30">
        OneLast AI // Canvas Build v2.0
      </div>
    </div>
  );
};

export default Overlay;
