
import React, { useRef, useEffect, useState } from 'react';

interface OverlayProps {
  active: boolean;
  onActivate: () => void;
}

const ASCII_ART = `      # ###                                 ##### /                                                 ##              #####  # 
    /  /###                              ######  /                                               /####           ######  /   
   /  /  ###                            /#   /  /                                  #            /  ###          /#   /  /    
  /  ##   ###                          /    /  /                                  ##               /##         /    /  /     
 /  ###    ###                             /  /                                   ##              /  ##            /  /      
##   ##     ## ###  /###     /##          ## ##              /###      /###     ########          /  ##           ## ##      
##   ##     ##  ###/ #### / / ###         ## ##             / ###  /  / #### / ########          /    ##          ## ##      
##   ##     ##   ##   ###/ /   ###        ## ##            /   ###/  ##  ###/     ##             /    ##        /### ##      
##   ##     ##   ##    ## ##    ###       ## ##           ##    ##  ####          ##            /      ##      / ### ##      
##   ##     ##   ##    ## ########        ## ##           ##    ##    ###         ##            /########         ## ##      
 ##  ##     ##   ##    ## #######         #  ##           ##    ##      ###       ##           /        ##   ##   ## ##      
  ## #      /    ##    ## ##                 /            ##    ##        ###     ##           #        ##  ###   #  /       
   ###     /     ##    ## ####    /      /##/           / ##    /#   /###  ##     ##          /####      ##  ###    /        
    ######/      ###   ### ######/      /  ############/   ####/ ## / #### /      ##         /   ####    ## / #####/         
      ###         ###   ### #####      /     #########      ###   ##   ###/        ##       /     ##      #/    ###          
                                       #                                                    #                                
                                        ##                                                   ##`;

// Detect dark mode from document class (set by GlobalThemeProvider)
function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const check = () => setIsDark(document.documentElement.classList.contains('dark-theme'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const Overlay: React.FC<OverlayProps> = ({ active, onActivate }) => {
  const asciiRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const isDark = useIsDarkMode();

  useEffect(() => {
    function calcScale() {
      if (!asciiRef.current || !containerRef.current) return;
      const naturalW = asciiRef.current.scrollWidth;
      const naturalH = asciiRef.current.scrollHeight;
      const availableW = containerRef.current.clientWidth;
      const maxArtH = window.innerHeight * 0.35;
      const scaleByW = availableW / naturalW;
      const scaleByH = maxArtH / naturalH;
      const s = Math.min(scaleByW, scaleByH, 1.2);
      setScale(Math.max(s, 0.15));
    }
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [active]);

  // — Theme tokens (ai-studio-demo palette: violet ↔ cyan on near-black) —
  // Both modes use the rich dark aesthetic; light mode is slightly lifted
  const t = isDark
    ? {
        bg: '#0A0A0A',                                    // studio body
        gridColor: 'rgba(139,92,246,0.10)',               // violet grid
        edgeGlow: 'linear-gradient(90deg, #8b5cf6, #06b6d4)', // violet→cyan
        edgeShadow: '0 0 20px rgba(139,92,246,0.35), 0 0 60px rgba(6,182,212,0.15)',
        asciiColor: '#22d3ee',                            // bright cyan
        asciiGlow: '0 0 8px rgba(34,211,238,0.6), 0 0 30px rgba(139,92,246,0.25)',
        titlePrimary: '#8b5cf6',                          // violet
        titlePrimaryGlow: '0 0 14px rgba(139,92,246,0.5)',
        titleAccent: '#22d3ee',                           // bright cyan
        titleAccentGlow: '0 0 14px rgba(34,211,238,0.5)',
        titleBase: '#D1D5DB',                             // studio body text
        subtitle: '#64748b',                              // muted
        btnBorder: 'rgba(139,92,246,0.5)',
        btnBorderHover: 'rgba(34,211,238,0.8)',
        btnBg: 'rgba(139,92,246,0.08)',
        btnFillHover: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))',
        btnText: '#a78bfa',                               // violet light
        btnShadow: '0 0 30px rgba(139,92,246,0.25), 0 0 60px rgba(6,182,212,0.1)',
        bracketColor: 'rgba(139,92,246,0.3)',
        statusLabel: '#64748b',                           // muted
        statusLabelHover: '#a78bfa',                      // violet light
        statusValue: '#D1D5DB',
        statusAccent: '#22d3ee',                          // bright cyan
        footerColor: '#1e293b',
      }
    : {
        bg: '#111113',                                    // lifted dark surface
        gridColor: 'rgba(6,182,212,0.08)',                // cyan tint grid
        edgeGlow: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
        edgeShadow: '0 0 15px rgba(139,92,246,0.25), 0 0 40px rgba(6,182,212,0.1)',
        asciiColor: '#a78bfa',                            // violet light
        asciiGlow: '0 0 6px rgba(167,139,250,0.4), 0 0 20px rgba(6,182,212,0.15)',
        titlePrimary: '#8b5cf6',                          // violet
        titlePrimaryGlow: '0 0 10px rgba(139,92,246,0.35)',
        titleAccent: '#06b6d4',                           // cyan
        titleAccentGlow: '0 0 10px rgba(6,182,212,0.35)',
        titleBase: '#e2e8f0',
        subtitle: '#94a3b8',                              // secondary
        btnBorder: 'rgba(139,92,246,0.4)',
        btnBorderHover: 'rgba(34,211,238,0.7)',
        btnBg: 'rgba(139,92,246,0.06)',
        btnFillHover: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))',
        btnText: '#8b5cf6',                               // violet
        btnShadow: '0 0 25px rgba(139,92,246,0.2), 0 0 50px rgba(6,182,212,0.08)',
        bracketColor: 'rgba(6,182,212,0.25)',
        statusLabel: '#94a3b8',
        statusLabelHover: '#22d3ee',
        statusValue: '#D1D5DB',
        statusAccent: '#06b6d4',
        footerColor: '#1e293b',
      };

  return (
    <div
      className={`fixed inset-0 z-[150] flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 transition-transform duration-[1200ms] will-change-transform ${
        active ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ background: t.bg }}
    >
      {/* Top edge glow (violet→cyan) */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: t.edgeGlow, boxShadow: t.edgeShadow }}
      />
      {/* Bottom edge glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: t.edgeGlow, boxShadow: t.edgeShadow }}
      />

      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Ambient gradient orbs (studio-style) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />
      </div>

      <div ref={containerRef} className="w-full max-w-[1400px] flex flex-col items-center relative z-10 overflow-hidden">
        {/* ASCII Art */}
        <div className="w-full flex justify-center mb-2 sm:mb-3 md:mb-4">
          <pre
            ref={asciiRef}
            className="leading-tight font-mono select-none whitespace-pre"
            style={{
              fontSize: '14px',
              color: t.asciiColor,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease, color 0.3s ease',
              textShadow: t.asciiGlow,
              height: asciiRef.current ? asciiRef.current.scrollHeight * scale : undefined,
            }}
          >
            {ASCII_ART}
          </pre>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl 2xl:text-7xl font-bold text-center tracking-tighter" style={{ color: t.titleBase }}>
          <span style={{ color: t.titlePrimary, textShadow: t.titlePrimaryGlow }}>Neural</span>{' '}
          <span className="ml-1 sm:ml-2" style={{ color: t.titleAccent, textShadow: t.titleAccentGlow }}>Link</span>
        </h1>
        <p
          className="mt-2 sm:mt-3 md:mt-4 italic font-mono text-[9px] sm:text-xs md:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] animate-pulse"
          style={{ color: t.subtitle }}
        >
          Standby for Core Initialization
        </p>

        {/* Open Chat button */}
        <button
          onClick={onActivate}
          className="mt-4 sm:mt-5 md:mt-6 relative group overflow-hidden px-6 sm:px-8 md:px-10 py-2 sm:py-2.5 rounded-sm transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))',
            border: `1px solid ${t.btnBorderHover}`,
            boxShadow: t.btnShadow,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 40px rgba(34,211,238,0.4), 0 0 80px rgba(139,92,246,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = t.btnShadow;
          }}
        >
          <div
            className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.25))' }}
          />
          <span
            className="relative font-bold tracking-[0.2em] sm:tracking-[0.3em] group-hover:text-white transition-colors text-xs sm:text-sm"
            style={{ color: t.statusAccent }}
          >
            OPEN CHAT
          </span>
        </button>

        <div className="mt-3 sm:mt-4 md:mt-5 flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {[
            { label: 'AI LAB', href: 'https://onelastai.co/lab' },
            { label: 'AGENTS', href: 'https://onelastai.co/dashboard/agent-management' },
            { label: 'STUDIO', href: 'https://studio.onelastai.co/' },
            { label: 'BUILD', href: 'https://build.onelastai.co/' },
            { label: 'TOOLS', href: 'https://onelastai.co/tools' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="relative group overflow-hidden px-2.5 sm:px-3.5 md:px-4 py-1 sm:py-1.5 rounded-sm transition-all active:scale-95"
              style={{
                background: t.btnBg,
                border: `1px solid ${t.btnBorder}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = t.btnBorderHover;
                e.currentTarget.style.boxShadow = t.btnShadow;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = t.btnBorder;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                style={{ background: t.btnFillHover }}
              />
              <span
                className="relative font-semibold tracking-[0.1em] sm:tracking-[0.15em] group-hover:text-white transition-colors text-[8px] sm:text-[10px] md:text-xs"
                style={{ color: t.btnText }}
              >
                {label}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 md:mt-12 grid grid-cols-3 gap-4 sm:gap-8 md:gap-12 text-[8px] sm:text-[10px] md:text-xs font-mono uppercase tracking-wider sm:tracking-widest">
          {[
            { label: 'SECURE_LINK', value: '[OK]', accent: false },
            { label: 'CORE_LOAD', value: '[READY]', accent: false },
            { label: 'UPLINK_UP', value: '[ACTIVE]', accent: true },
          ].map(({ label, value, accent }) => (
            <div key={label} className="text-center group cursor-default">
              <div
                className="mb-1 transition-colors"
                style={{ color: t.statusLabel }}
                onMouseEnter={(e) => { e.currentTarget.style.color = t.statusLabelHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = t.statusLabel; }}
              >
                {label}
              </div>
              <div className="font-bold" style={{ color: accent ? t.statusAccent : t.statusValue }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer label */}
      <div
        className="absolute bottom-3 sm:bottom-5 md:bottom-6 text-[6px] sm:text-[8px] font-mono uppercase tracking-[0.5em] sm:tracking-[1em] opacity-30"
        style={{ color: t.footerColor }}
      >
        Authorized Access Only // Terminal ID: 0xFF2A
      </div>
    </div>
  );
};

export default Overlay;
