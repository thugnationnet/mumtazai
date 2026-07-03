
import React from 'react';
import { MessageSquare, Bot, Home } from 'lucide-react';

interface OverlayProps {
  active: boolean;
  onActivate: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ active, onActivate }) => {
  return (
    <div
      className={`fixed inset-0 bg-[#080808] z-[150] flex flex-col items-center justify-center p-4 transition-transform duration-[1200ms] will-change-transform cubic-bezier(0.7, 0, 0.3, 1) ${
        active ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      }`}
    >
      {/* Visual shutter bottom edge shadow/glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-500/20 shadow-[0_5px_15px_rgba(16,185,129,0.3)]"></div>
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.2)_1px,transparent_1px)] bg-[length:40px_40px]"></div>

      <div className="max-w-5xl w-full flex flex-col items-center relative z-10">
        <pre className="text-indigo-400 text-[5px] sm:text-[7px] md:text-[9px] lg:text-xs leading-tight text-center font-mono mb-8 select-none">
{".s5SSSs.                          .s                                          .s5SSSs.  s.  \n" +
"      SS. .s    s.  .s5SSSs.                .s5SSSs.  .s5SSSs.  .s5SSSSs.           SS. SS. \n" +
"sS    S%S       SS.       SS.     sS              SS.       SS.    SSS        sS    S%S S%S \n" +
"SS    S%S sSs.  S%S sS    `:;     SS        sS    S%S sS    `:;    S%S        SS    S%S S%S \n" +
"SS    S%S SS `S.S%S SSSs.         SS        SSSs. S%S `:;;;;.      S%S        SSSs. S%S S%S \n" +
"SS    S%S SS  `sS%S SS            SS        SS    S%S       ;;.    S%S        SS    S%S S%S \n" +
"SS    `:; SS    `:; SS            SS        SS    `:;       `:;    `:;        SS    `:; `:; \n" +
"SS    ;,. SS    ;,. SS    ;,.     SS    ;,. SS    ;,. .,;   ;,.    ;,.        SS    ;,. ;,. \n" +
"`:;;;;;:' :;    ;:' `:;;;;;:'     `:;;;;;:' :;    ;:' `:;;;;;:'    ;:'        :;    ;:' ;:' \n" +
"                                                                                            "}
        </pre>
        <h1 className="text-4xl sm:text-6xl font-bold text-slate-800 dark:text-slate-200 text-center tracking-tighter">
          <span className="text-indigo-400">Maula</span> 
          <span className="text-violet-400 ml-2">AI</span>
        </h1>
        <p className="text-slate-500 mt-6 italic font-mono text-xs sm:text-sm uppercase tracking-[0.3em] animate-pulse">
          AI Digital Friend Zone
        </p>
        
        {/* Actions — responsive: stacked on mobile, row on desktop */}
        <div className="mt-10 flex flex-col items-center gap-3 w-full px-4 sm:px-0">

          {/* Launch button — always center, full-width on mobile */}
          <div className="relative w-full sm:w-auto">
            <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-violet-400 animate-pulse" />
            <span className="absolute -top-px -right-px w-2 h-2 border-t border-r border-violet-400 animate-pulse" />
            <span className="absolute -bottom-px -left-px w-2 h-2 border-b border-l border-violet-400 animate-pulse" />
            <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-violet-400 animate-pulse" />
            <span className="absolute inset-0 overflow-hidden rounded-sm pointer-events-none">
              <span className="absolute left-0 right-0 h-px bg-violet-400/40 animate-[scan_2s_linear_infinite]" style={{ top: '50%' }} />
            </span>
            <button
              onClick={onActivate}
              className="relative w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-sm border border-violet-400/70 bg-violet-950/60 text-violet-300 text-xs font-bold uppercase tracking-[0.3em] shadow-[0_0_18px_rgba(16,185,129,0.25),inset_0_0_12px_rgba(16,185,129,0.05)] hover:border-violet-300 hover:bg-violet-900/60 hover:text-slate-900 dark:hover:text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.45),inset_0_0_18px_rgba(16,185,129,0.1)] transition-all duration-300 active:scale-95"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400" />
              </span>
              Launch
            </button>
          </div>

          {/* Secondary buttons — 2-col grid on mobile, single row on sm+ */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full sm:w-auto">
            <a
              href="https://mumtaz.ai/"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm border border-violet-500/30 bg-slate-300 dark:bg-black/40 text-violet-400 text-xs font-bold uppercase tracking-[0.25em] hover:border-violet-400 hover:bg-violet-500/10 hover:text-violet-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 active:scale-95"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </a>
            <a
              href="https://mumtaz.ai/agents"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm border border-violet-500/30 bg-slate-300 dark:bg-black/40 text-violet-400 text-xs font-bold uppercase tracking-[0.25em] hover:border-violet-400 hover:bg-violet-500/10 hover:text-violet-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 active:scale-95"
            >
              <Bot className="w-3.5 h-3.5" />
              Agents
            </a>
            <a
              href="https://build.mumtaz.ai/"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm border border-violet-500/30 bg-slate-300 dark:bg-black/40 text-violet-400 text-xs font-bold uppercase tracking-[0.25em] hover:border-violet-400 hover:bg-violet-500/10 hover:text-violet-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Canvas
            </a>
            <a
              href="https://mumtaz.ai/dashboard/apps"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm border border-violet-500/30 bg-slate-300 dark:bg-black/40 text-violet-400 text-xs font-bold uppercase tracking-[0.25em] hover:border-violet-400 hover:bg-violet-500/10 hover:text-violet-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 active:scale-95"
            >
              <Bot className="w-3.5 h-3.5" />
              Dashboard
            </a>
          </div>
        </div>
        
        <div className="mt-20 grid grid-cols-3 gap-12 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
          <div className="text-center group">
            <div className="text-violet-900 group-hover:text-violet-500 transition-colors mb-1">SECURE_LINK</div>
            <div className="font-bold">[OK]</div>
          </div>
          <div className="text-center group">
            <div className="text-violet-900 group-hover:text-violet-500 transition-colors mb-1">CORE_LOAD</div>
            <div className="font-bold">[READY]</div>
          </div>
          <div className="text-center group">
            <div className="text-violet-900 group-hover:text-violet-500 transition-colors mb-1">UPLINK_UP</div>
            <div className="font-bold text-violet-500">[ACTIVE]</div>
          </div>
        </div>
      </div>
      
      {/* Sub-labeling at the bottom */}
      <div className="absolute bottom-8 text-[8px] text-slate-800 font-mono uppercase tracking-[1em] opacity-30">
        Authorized Access Only // Terminal ID: 0xFF2A
      </div>
    </div>
  );
};

export default Overlay;
