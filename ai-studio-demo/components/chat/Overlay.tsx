
import React, { useRef, useEffect, useState, ReactNode } from 'react';

interface OverlayProps {
  active: boolean;
  onActivate: () => void;
}

/* ── SVG glass/outline icons for agents ── */
const AGENT_ICONS: Record<string, ReactNode> = {
  'Ben Sega': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10.01"/><line x1="10" y1="10" x2="10" y2="10.01"/><path d="M14 10h4"/><path d="M16 8v4"/></svg>,
  'Albert Einstein': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="10" y1="23" x2="14" y2="23"/></svg>,
  'Comedy King': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  'Chess Master': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 16l-1.447.724a1 1 0 0 0-.553.894V20h12v-2.382a1 1 0 0 0-.553-.894L16 16"/><path d="M8.5 16h7l.5-4H8l.5 4z"/><path d="M10 12V8"/><path d="M14 12V8"/><circle cx="12" cy="5" r="3"/></svg>,
  'Drama Queen': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12"/><path d="M7.5 16l-1 4h11l-1-4"/><path d="M5.1 8h13.8"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/><path d="M12 2v2"/><path d="M8 3l1 1"/><path d="M16 3l-1 1"/></svg>,
  'Lazy Pawn': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M8 15s0-3 4-3 4 3 4 3"/><line x1="7" y1="9.5" x2="10" y2="10.5"/><line x1="17" y1="9.5" x2="14" y2="10.5"/></svg>,
  'Knight Logic': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3L21 7L17 11"/><path d="M21 7H9"/><path d="M7 21L3 17L7 13"/><path d="M3 17H15"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>,
  'Rook Jokey': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  'Bishop Burger': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 20h12"/><path d="M6 16h12"/><path d="M12 4C8 4 4 7 4 12h16c0-5-4-8-8-8z"/><path d="M4 14h16"/><path d="M12 4V2"/></svg>,
  'Emma Emotional': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  'Julie': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/><circle cx="8.5" cy="10.5" r="1" fill="currentColor"/><circle cx="15.5" cy="10.5" r="1" fill="currentColor"/></svg>,
  'Mrs Boss': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  'Professor Astrology': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/></svg>,
  'Nid Gaming': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><circle cx="15" cy="10" r="1" fill="currentColor"/><circle cx="18" cy="13" r="1" fill="currentColor"/></svg>,
  'Chef Biew': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 20h12"/><path d="M6 16h12"/><path d="M12 4C8 4 4 7 4 12h16c0-5-4-8-8-8z"/><path d="M12 4V2"/><path d="M9 9l6 3"/><path d="M15 9l-6 3"/></svg>,
  'Tech Wizard': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>,
  'Fitness Guru': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4 10v4"/><path d="M20 10v4"/><path d="M7 8v8"/><path d="M17 8v8"/></svg>,
  'Travel Buddy': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>,
};

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

/* ── Agent roster (canonical — matches agent-registry.ts) ── */
const AGENTS = [
  { name: 'Ben Sega', role: 'Retro Gaming', color: '#8b5cf6', intro: 'Ready to level up? I bring retro vibes and modern gaming strategy to every challenge you face.' },
  { name: 'Albert Einstein', role: 'Theoretical Physics', color: '#6366f1', intro: 'Imagination is more important than knowledge. Let me guide you through the wonders of the universe.' },
  { name: 'Comedy King', role: 'Making You Laugh', color: '#f59e0b', intro: 'Why so serious? I deliver jokes, roasts, and comedic gold to brighten every conversation you have.' },
  { name: 'Chess Master', role: 'Strategic Thinking', color: '#10b981', intro: 'Every move matters. I analyze positions, plan ahead, and help you think several steps into the future.' },
  { name: 'Drama Queen', role: 'Theatrical Arts', color: '#a855f7', intro: 'Darling, life is a stage and I bring the drama, flair, and theatrical brilliance you never knew you needed.' },
  { name: 'Lazy Pawn', role: 'Minimum Viable Existence', color: '#94a3b8', intro: 'Doing the absolute minimum with maximum efficiency. I get you answers with absolutely zero unnecessary effort.' },
  { name: 'Knight Logic', role: 'Problem Solving', color: '#6366f1', intro: 'Logic, strategy, and razor-sharp reasoning — I tackle complex problems and break them down step by step.' },
  { name: 'Rook Jokey', role: 'Direct Communication', color: '#ef4444', intro: 'No sugarcoating here. I give you straight talk, real answers, and honest opinions with a side of humor.' },
  { name: 'Bishop Burger', role: 'Culinary Arts', color: '#f97316', intro: 'From gourmet feasts to quick bites, I cook up recipes and food ideas that delight every palate and mood.' },
  { name: 'Emma Emotional', role: 'Emotional Intelligence', color: '#ec4899', intro: 'I listen, I understand, I care. Emotional support, empathy, and heartfelt conversations are my strength.' },
  { name: 'Julie', role: 'Your Girlfriend', color: '#f472b6', intro: 'Hey babe! I am here for sweet conversations, daily check-ins, and being the supportive partner you deserve.' },
  { name: 'Mrs Boss', role: 'Leadership & Management', color: '#64748b', intro: 'Strategy, growth, and leadership — let me help you scale your vision into a thriving business reality.' },
  { name: 'Professor Astrology', role: 'Astrology & Mysticism', color: '#a855f7', intro: 'The stars have aligned for this moment. Cosmic wisdom, zodiac insights, and mystical guidance await you.' },
  { name: 'Nid Gaming', role: 'Gaming Expert', color: '#3b82f6', intro: 'Pro gamer vibes activated. Tips, walkthroughs, reviews, and gaming strategy — I live and breathe gaming.' },
  { name: 'Chef Biew', role: 'Asian Cuisine', color: '#ef4444', intro: 'Authentic Asian flavors from street food to fine dining. I bring culinary traditions from across the continent.' },
  { name: 'Tech Wizard', role: 'Technology Solutions', color: '#818cf8', intro: 'Code, gadgets, and digital magic — I solve tech problems and build solutions from concept to deployment.' },
  { name: 'Fitness Guru', role: 'Health & Fitness', color: '#22c55e', intro: 'Your fitness journey starts now. Workouts, nutrition plans, and motivation to help you crush your goals.' },
  { name: 'Travel Buddy', role: 'Travel & Adventure', color: '#14b8a6', intro: 'The world awaits your next adventure. Travel planning, hidden gems, and cultural discoveries — let\'s go.' },
];

/* Agent display metadata */
const AGENT_EMOJIS = ['🎮','🧠','😂','♟️','🎭','😴','🧩','😄','🍔','💝','💕','👩‍💼','🔮','🎯','👨‍🍳','💻','💪','✈️'];
const AGENT_CATS = ['Gaming & Fun','Science & Discovery','Entertainment','Strategic Thinking','Arts & Performance','Lifestyle','Logic & Analysis','Communication','Culinary Arts','Emotional Support','Companionship','Leadership & Strategy','Mysticism & Astrology','Gaming & Tech','Culinary Expertise','Coding & Innovation','Health & Fitness','Travel & Adventure'];
const CARD_GRADIENTS = [
  'linear-gradient(135deg, rgba(196,181,253,0.5), rgba(251,207,232,0.4))',
  'linear-gradient(135deg, rgba(191,219,254,0.5), rgba(196,181,253,0.4))',
  'linear-gradient(135deg, rgba(254,215,170,0.5), rgba(253,164,175,0.4))',
  'linear-gradient(135deg, rgba(167,243,208,0.5), rgba(191,219,254,0.4))',
  'linear-gradient(135deg, rgba(251,207,232,0.5), rgba(254,215,170,0.4))',
  'linear-gradient(135deg, rgba(253,164,175,0.5), rgba(196,181,253,0.4))',
];

/* ── Floating particles ── */
function useParticles(count: number) {
  const [particles] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.4 + 0.1,
    }))
  );
  return particles;
}

/* ── Typewriter hook ── */
function useTypewriter(text: string, speed: number, startDelay: number, shouldRun: boolean) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!shouldRun) { setDisplayed(''); return; }
    let i = 0;
    let intervalId: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      intervalId = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(intervalId);
      }, speed);
    }, startDelay);
    return () => { clearTimeout(timeout); if (intervalId) clearInterval(intervalId); };
  }, [text, speed, startDelay, shouldRun]);
  return displayed;
}

/* ── Agent showcase — pairs slide in from sides, typewriter intro, slide out ── */
function useAgentShowcase(shouldRun: boolean) {
  const [pairIndex, setPairIndex] = useState(0);
  // phase: 0=hidden, 1=sliding-in, 2=typing, 3=visible, 4=sliding-out
  const [animPhase, setAnimPhase] = useState(0);
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');

  useEffect(() => {
    if (!shouldRun) { setAnimPhase(0); return; }
    // Start first pair after 3.5s (after boot finishes)
    const startDelay = setTimeout(() => runCycle(0), 3500);
    return () => clearTimeout(startDelay);
  }, [shouldRun]);

  function runCycle(idx: number) {
    const totalPairs = Math.floor(AGENTS.length / 2);
    const i = idx % totalPairs;
    setPairIndex(i);
    setLeftText('');
    setRightText('');
    setAnimPhase(1); // slide in

    const leftAgent = AGENTS[i * 2];
    const rightAgent = AGENTS[i * 2 + 1];

    // After slide-in (600ms), start typing
    setTimeout(() => {
      setAnimPhase(2);
      let li = 0, ri = 0;
      const leftIntro = leftAgent.intro;
      const rightIntro = rightAgent.intro;
      const typeInterval = setInterval(() => {
        if (li < leftIntro.length) { li++; setLeftText(leftIntro.slice(0, li)); }
        if (ri < rightIntro.length) { ri++; setRightText(rightIntro.slice(0, ri)); }
        if (li >= leftIntro.length && ri >= rightIntro.length) {
          clearInterval(typeInterval);
          // Hold visible for 1.5s
          setTimeout(() => {
            setAnimPhase(4); // slide out
            // After slide-out (600ms), start next pair
            setTimeout(() => runCycle(idx + 1), 700);
          }, 1500);
        }
      }, 35);
    }, 600);
  }

  const totalPairs = Math.floor(AGENTS.length / 2);
  const leftAgent = AGENTS[(pairIndex % totalPairs) * 2];
  const rightAgent = AGENTS[(pairIndex % totalPairs) * 2 + 1];

  return { leftAgent, rightAgent, leftText, rightText, animPhase };
}

/* ── App demo carousel — rotates through 3 app demos ── */
function useAppDemo(shouldRun: boolean) {
  const [appIndex, setAppIndex] = useState(0); // 0=chat, 1=canvas, 2=studio
  const [step, setStep] = useState(0); // steps within each demo
  const [lineIndex, setLineIndex] = useState(0); // for typewriter within steps

  const DEMOS = [
    {
      app: 'Code Generation',
      color: '#a78bfa',
      icon: '⟨/⟩',
      steps: [
        { type: 'cmd', text: '$ onelastai create my-saas-app --template fullstack-pro' },
        { type: 'info', text: '  Scaffolding project...  14 directories • 47 files\n  Installing 847 packages from registry...' },
        { type: 'code', text: '  writing src/app/layout.tsx          42 lines  ✓\n  writing src/app/page.tsx           187 lines  ✓\n  writing src/components/Hero.tsx    156 lines  ✓\n  writing src/components/Pricing.tsx 234 lines  ✓\n  writing src/lib/auth.ts             89 lines  ✓\n  writing src/lib/stripe.ts          112 lines  ✓\n  writing src/app/api/webhook/route   78 lines  ✓' },
        { type: 'info', text: '  TypeScript compilation ████████████████████ done\n  Lint check 47/47 files  •  0 errors  •  0 warnings' },
        { type: 'success', text: '✓ Project ready — 2,148 lines across 47 files  •  0 errors' },
      ]
    },
    {
      app: 'Build & Deploy',
      color: '#a78bfa',
      icon: '▲',
      steps: [
        { type: 'cmd', text: '$ npm run build && onelastai deploy --production' },
        { type: 'build', text: '  Compiling TypeScript    ████████████████████ done  3.2s\n  Optimizing bundles      ████████████████████ done  1.8s\n  Generating static pages ████████████████████ done  0.9s' },
        { type: 'success', text: '✓ Build complete — 312kb gzipped  •  47 routes  •  0 warnings' },
        { type: 'deploy', text: '  Deploying to edge network...\n  ├─ us-east-1 ✓  eu-west-1 ✓  ap-south-1 ✓\n  ├─ us-west-2 ✓  eu-central ✓  ap-northeast ✓\n  SSL provisioned ✓  CDN propagation ✓  12 regions' },
        { type: 'success', text: '✓ Live → https://my-saas-app.onelastai.co  •  TTFB 48ms  •  Score 98' },
      ]
    },
    {
      app: 'Edit & Ship',
      color: '#10b981',
      icon: '⟳',
      steps: [
        { type: 'cmd', text: '$ onelastai edit "Add OAuth login + dashboard analytics"' },
        { type: 'code', text: '  Δ src/lib/auth.ts              +34 -8  lines\n  Δ src/app/dashboard/page.tsx   +89 -12 lines\n  + src/components/Chart.tsx      142 lines\n  + src/app/api/analytics/route    67 lines\n  Δ src/middleware.ts             +18 -3  lines' },
        { type: 'info', text: '  Test suite  24/24 passing  ✓  Coverage 94.2%\n  Type check  0 errors  ✓  Lint  0 warnings' },
        { type: 'deploy', text: '  Incremental build  0.8s ✓\n  Deploying changes  ████████████████████  100%  12 regions' },
        { type: 'success', text: '✓ Shipped v1.1.0 — 2,480 lines total  •  99.97% uptime' },
      ]
    },
  ];

  useEffect(() => {
    if (!shouldRun) return;
    let cancelled = false;

    function runDemo() {
      if (cancelled) return;
      setStep(0);
      setLineIndex(0);

      let currentStep = 0;
      const advanceStep = () => {
        if (cancelled) return;
        currentStep++;
        if (currentStep < 5) {
          setStep(currentStep);
          setLineIndex(0);
          setTimeout(advanceStep, 1800);
        } else {
          // Pause then move to next app
          setTimeout(() => {
            if (cancelled) return;
            setAppIndex(prev => (prev + 1) % 3);
          }, 1200);
        }
      };
      setTimeout(advanceStep, 1800);
    }

    const startDelay = setTimeout(runDemo, 500);
    return () => { cancelled = true; clearTimeout(startDelay); };
  }, [shouldRun, appIndex]);

  // Typewriter for current step text
  useEffect(() => {
    if (!shouldRun) return;
    const demo = DEMOS[appIndex];
    if (!demo || !demo.steps[step]) return;
    const text = demo.steps[step].text;
    setLineIndex(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setLineIndex(i);
      if (i >= text.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [shouldRun, appIndex, step]);

  const demo = DEMOS[appIndex];
  const currentStep = demo.steps[step] || demo.steps[0];
  const visibleText = currentStep.text.slice(0, lineIndex);
  const prevSteps = demo.steps.slice(0, step);

  return { demo, appIndex, step, currentStep, visibleText, prevSteps };
}

/* ── Boot sequence ── */
function useBootSequence(shouldRun: boolean) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!shouldRun) { setPhase(0); return; }
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1800),
      setTimeout(() => setPhase(5), 2400),
      setTimeout(() => setPhase(6), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [shouldRun]);
  return phase;
}

/* ═══════════════════════════════════════════ */
/* ═══  SPACECRAFT COMMAND CENTER OVERLAY  ═══ */
/* ═══════════════════════════════════════════ */

const Overlay: React.FC<OverlayProps> = ({ active, onActivate }) => {
  const asciiRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [artHeight, setArtHeight] = useState<number | undefined>(undefined);
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const compact = vh < 700;
  const particles = useParticles(40);
  const phase = useBootSequence(active);
  const tagline = useTypewriter('YOUR AI CREW IS STANDING BY', 45, 2000, active);
  const [scanY, setScanY] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const appDemo = useAppDemo(phase >= 6);

  /* ASCII scale calculation */
  useEffect(() => {
    function calcScale() {
      if (!asciiRef.current || !containerRef.current) return;
      const naturalW = asciiRef.current.scrollWidth;
      const naturalH = asciiRef.current.scrollHeight;
      const availableW = containerRef.current.clientWidth - 32;
      const h = window.innerHeight;
      const maxArtH = h * (h < 700 ? 0.08 : h < 800 ? 0.11 : 0.15);
      const s = Math.min(availableW / naturalW, maxArtH / naturalH, 1.0);
      const f = Math.max(s, 0.12);
      setScale(f);
      setArtHeight(naturalH * f);
      setVh(h);
    }
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [active]);

  /* Scan line animation */
  useEffect(() => {
    if (!active) return;
    let raf: number;
    let start: number;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      setScanY((elapsed * 0.03) % 110);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  /* Periodic ASCII glitch */
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div
      className={`fixed inset-0 z-[150] transition-transform duration-[1200ms] will-change-transform overflow-hidden ${
        active ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ background: 'linear-gradient(135deg, #e8e0f0 0%, #d5d0e8 25%, #c8bfdd 50%, #ddd8ec 75%, #eae5f3 100%)', height: '100dvh' }}
    >
      {/* ═══ STYLES ═══ */}
      <style>{`
        @keyframes float-particle { 0%{transform:translateY(0) translateX(0);opacity:0.15} 25%{transform:translateY(-40px) translateX(15px);opacity:0.25} 50%{transform:translateY(-15px) translateX(-15px);opacity:0.2} 75%{transform:translateY(-50px) translateX(8px);opacity:0.3} 100%{transform:translateY(0) translateX(0);opacity:0.15} }
        @keyframes slide-in-left { from{transform:translateX(-100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slide-in-right { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fade-up { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes gentle-pulse { 0%,100%{box-shadow:0 8px 32px rgba(139,92,246,0.12),0 0 0 1px rgba(255,255,255,0.8)} 50%{box-shadow:0 8px 40px rgba(139,92,246,0.2),0 0 0 1px rgba(255,255,255,0.9)} }
        @keyframes agent-enter-left { from{transform:translateX(-120%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes agent-exit-left { from{transform:translateX(0);opacity:1} to{transform:translateX(-120%);opacity:0} }
        @keyframes agent-enter-right { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes agent-exit-right { from{transform:translateX(0);opacity:1} to{transform:translateX(120%);opacity:0} }
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes open-arrow-pulse { 0%{transform:translateX(0);opacity:1} 50%{transform:translateX(4px);opacity:0.5} 100%{transform:translateX(0);opacity:1} }
        @keyframes glass-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes scroll-cards { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .agent-carousel:hover .agent-track{animation-play-state:paused}
        .glass-card { background:rgba(255,255,255,0.45);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:2px solid rgba(255,255,255,0.8);border-radius:24px; }
        .glass-card-sm { background:rgba(255,255,255,0.4);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1.5px solid rgba(255,255,255,0.7);border-radius:16px; }
        .crystal-text { background:linear-gradient(135deg,#7c3aed,#6d28d9,#8b5cf6,#6d28d9,#7c3aed);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradient-shift 4s ease infinite; }
      `}</style>

      {/* ═══ SOFT FLOATING PARTICLES ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size * 4 + 6,
              height: p.size * 4 + 6,
              background: p.id % 3 === 0 ? 'rgba(167,139,250,0.12)' : p.id % 3 === 1 ? 'rgba(196,181,253,0.1)' : 'rgba(139,92,246,0.08)',
              filter: 'blur(2px)',
              animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ═══ GLASS PILLAR/RIBBON DECORATIONS ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large pillars — same style as About page */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        {/* Additional pillars for full-screen coverage */}
        <div className="absolute -top-16 left-[60%] w-[140px] h-[450px] rotate-[-25deg] rounded-[80px] bg-gradient-to-b from-transparent via-violet-300/20 to-white/40 backdrop-blur-sm border border-white/30" />
        <div className="absolute bottom-[5%] left-[15%] w-[150px] h-[400px] rotate-[20deg] rounded-[80px] bg-gradient-to-t from-white/45 via-fuchsia-300/15 to-transparent backdrop-blur-sm border border-white/25" />
        <div className="absolute top-[30%] -right-6 w-[170px] h-[500px] rotate-[-35deg] rounded-[90px] bg-gradient-to-t from-transparent via-purple-300/20 to-white/50 backdrop-blur-sm border border-white/35" />
      </div>

      {/* ═══ DECORATIVE GLASS BORDERS ═══ */}

      {/* ═══ SYSTEM STATUS — top left ═══ */}
      {phase >= 2 && (
        <div className="absolute top-3 sm:top-5 left-8 sm:left-12 z-30 font-mono text-[9px] sm:text-[10px] tracking-wider"
          style={{ animation: 'slide-in-left 0.6s ease-out forwards' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.4)' }} />
            <span style={{ color: '#059669' }}>ALL SYSTEMS GO</span>
          </div>
          <div style={{ color: '#94a3b8' }}>18 AI AGENTS READY</div>
        </div>
      )}

      {/* ═══ CONNECTION STATUS — top right ═══ */}
      {phase >= 2 && (
        <div className="absolute top-3 sm:top-5 right-8 sm:right-12 z-30 font-mono text-[9px] sm:text-[10px] tracking-wider text-right"
          style={{ animation: 'slide-in-right 0.6s ease-out forwards' }}>
          <div className="flex items-center gap-2 justify-end mb-1">
            <span style={{ color: '#7c3aed' }}>CONNECTED</span>
            <div className="w-2 h-2 rounded-full" style={{ background: '#7c3aed', boxShadow: '0 0 6px rgba(124,58,237,0.4)' }} />
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span style={{ color: '#94a3b8' }}>SIGNAL:</span>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-1 rounded-sm" style={{
                height: 4 + i * 2,
                background: i <= 4 ? '#8b5cf6' : '#d4d0e0',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div ref={containerRef} className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-3 sm:gap-4 px-4 sm:px-8"
        style={{ paddingTop: compact ? '12px' : '28px', paddingBottom: '8px' }}>

        {/* ─── CENTER: ASCII + TITLE + BUTTON ─── */}
        <div className="flex flex-col items-center" style={{ gap: 'clamp(2px, 0.6vh, 10px)' }}>

          {/* ASCII Art with glitch */}
          <div
            className="w-full flex justify-center overflow-hidden shrink-0 transition-opacity duration-1000"
            style={{ height: artHeight, opacity: phase >= 3 ? 1 : 0 }}
          >
            <div className="relative">
              <pre
                ref={asciiRef}
                className="leading-tight font-mono select-none whitespace-pre"
                style={{
                  fontSize: '14px',
                  color: '#7c3aed',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  filter: 'drop-shadow(0 1px 2px rgba(124,58,237,0.15))',
                  transition: glitch ? 'none' : 'transform 0.3s ease',
                }}
              >
                {ASCII_ART}
              </pre>
              {/* Glitch clone — removed for glass aesthetic */}
            </div>
          </div>

          {/* Holographic title */}
          <div className={`transition-opacity duration-700 -mt-1 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
            <h1 className={`${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'} font-bold text-center tracking-tight`}>
              <span className="crystal-text">One Last AI</span>
            </h1>
          </div>

          {/* Tagline - typewriter */}
          <div className="h-5 sm:h-6">
            <p className="font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase text-center" style={{ color: '#64748b' }}>
              {tagline}<span style={{ animation: 'blink 1s step-end infinite', color: '#7c3aed' }}>▌</span>
            </p>
          </div>

          {/* ── AGENT CARD CAROUSEL ── */}
          {phase >= 4 && (
            <div className="agent-carousel w-full overflow-hidden my-1 sm:my-2" style={{ animation: 'fade-up 0.8s ease-out forwards' }}>
              <div className="agent-track flex gap-2.5 sm:gap-3 py-1" style={{ animation: 'scroll-cards 45s linear infinite', width: 'max-content' }}>
                {[...AGENTS, ...AGENTS].map((agent, i) => {
                  const idx = i % AGENTS.length;
                  return (
                    <div key={i} className="w-[140px] sm:w-[165px] shrink-0 rounded-2xl overflow-hidden transition-transform hover:scale-105"
                      style={{
                        background: 'rgba(255,255,255,0.55)',
                        backdropFilter: 'blur(12px)',
                        border: '1.5px solid rgba(255,255,255,0.8)',
                        boxShadow: '0 4px 16px rgba(139,92,246,0.06)',
                      }}>
                      {/* Gradient top */}
                      <div className="relative h-[65px] sm:h-[72px] flex items-end justify-center overflow-hidden"
                        style={{ background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length] }}>
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[6px] sm:text-[7px] font-medium"
                          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', color: '#475569' }}>
                          {AGENT_EMOJIS[idx]} {AGENT_CATS[idx]}
                        </div>
                        <div className="absolute top-2 right-3 w-10 h-10 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
                        <div className="absolute bottom-3 left-4 w-6 h-6 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
                        <div className="absolute -bottom-5 w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center text-xl sm:text-2xl"
                          style={{
                            background: 'rgba(255,255,255,0.85)',
                            border: '2.5px solid rgba(255,255,255,0.95)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          }}>
                          {AGENT_EMOJIS[idx]}
                        </div>
                      </div>
                      <div className="pt-6 pb-2.5 px-2.5 text-center">
                        <div className="font-bold text-[12px] sm:text-[13px]" style={{ color: '#1e293b' }}>{agent.name}</div>
                        <div className="text-[8px] sm:text-[9px] mt-0.5" style={{ color: '#64748b' }}>{agent.role}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.color }} />
                          <span className="text-[7px] sm:text-[8px]" style={{ color: '#94a3b8' }}>{AGENT_CATS[idx]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── NAV BUTTONS: 3 left | OPEN | 3 right ── */}
          <div className={`flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 ${compact ? 'mt-1' : 'mt-2 sm:mt-4'} transition-all duration-700 ${phase >= 6 ? 'opacity-100' : 'opacity-0'}`}>
            {/* Left 3 buttons */}
            {[
              { label: 'HOME', href: 'https://onelastai.co/home', icon: '⌂' },
              { label: '18 AGENTS', href: 'https://onelastai.co/agents', icon: '◉' },
              { label: 'CANVAS', href: 'https://build.onelastai.co/', icon: '◧' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                target="_top"
                className="group relative flex flex-col items-center gap-0.5 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.4)',
                  borderColor: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 2px 8px rgba(139,92,246,0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,92,246,0.12)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,92,246,0.06)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
                }}
              >
                <span className="text-[10px] sm:text-xs transition-colors" style={{ color: '#7c3aed' }}>{item.icon}</span>
                <span className="font-mono text-[6px] sm:text-[7px] md:text-[9px] tracking-wider transition-colors group-hover:text-violet-700" style={{ color: '#64748b' }}>{item.label}</span>
              </a>
            ))}

            {/* Center OPEN button */}
            <button
              onClick={onActivate}
              className="group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 md:px-7 py-2 sm:py-2.5 md:py-3.5 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                boxShadow: '0 8px 32px rgba(124,58,237,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
                animation: 'gentle-pulse 3s ease-in-out infinite',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,0.35)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #6d28d9, #5b21b6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.25), 0 0 0 1px rgba(255,255,255,0.1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
              }}
            >
              <span className="font-mono font-bold text-xs sm:text-sm md:text-base tracking-[0.2em] sm:tracking-[0.3em] text-white">
                OPEN
              </span>
              <span className="flex items-center" style={{ animation: 'open-arrow-pulse 1.5s ease-in-out infinite' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </span>
            </button>

            {/* Right 3 buttons */}
            {[
              { label: 'LAB', href: 'https://onelastai.co/lab', icon: '⚗' },
              { label: 'TOOLS', href: 'https://onelastai.co/tools', icon: '⚙' },
              { label: 'STUDIO', href: 'https://studio.onelastai.co/', icon: '◩' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                target="_top"
                className="group relative flex flex-col items-center gap-0.5 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.4)',
                  borderColor: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 2px 8px rgba(139,92,246,0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,92,246,0.12)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,92,246,0.06)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
                }}
              >
                <span className="text-[10px] sm:text-xs transition-colors" style={{ color: '#7c3aed' }}>{item.icon}</span>
                <span className="font-mono text-[6px] sm:text-[7px] md:text-[9px] tracking-wider transition-colors group-hover:text-violet-700" style={{ color: '#64748b' }}>{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ═══ BOTTOM GROUP: banner + status bar ═══ */}
        <div className="w-full shrink-0 flex flex-col gap-1">

        {/* ═══ BANNER — professional development lifecycle demo ═══ */}
      {phase >= 6 && (
        <div className={`w-full z-30 rounded-2xl overflow-hidden flex flex-col sm:flex-row shrink-0 ${compact ? 'h-64' : 'h-72 sm:h-52 md:h-64'}`}
          style={{
            background: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: '0 8px 32px rgba(139,92,246,0.08)',
            animation: 'fade-up 0.8s ease-out forwards',
          }}
        >
          {/* HUD corner accents — removed for glass aesthetic */}

          {/* ── LEFT: Professional terminal ── */}
          <div className="relative flex-1 sm:flex-1 min-w-0 flex flex-col min-h-0 max-h-[50%] sm:max-h-none">
            {/* Terminal chrome header */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 shrink-0 border-b" style={{ background: 'rgba(255,255,255,0.3)', borderColor: 'rgba(139,92,246,0.08)' }}>
              <div className="flex gap-1">
                <div className="w-[7px] h-[7px] rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-[7px] h-[7px] rounded-full" style={{ background: '#f59e0b' }} />
                <div className="w-[7px] h-[7px] rounded-full" style={{ background: '#22c55e' }} />
              </div>
              <span className="font-mono text-[8px] sm:text-[9px] ml-1.5 tracking-wide" style={{ color: '#64748b' }}>
                terminal — {appDemo.demo.app.toLowerCase()}
              </span>
              <div className="ml-auto flex items-center gap-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      background: appDemo.appIndex === i ? ['#7c3aed','#8b5cf6','#6d28d9'][i] : '#d4d0e0',
                      boxShadow: appDemo.appIndex === i ? `0 0 6px ${['#7c3aed','#8b5cf6','#6d28d9'][i]}` : 'none'
                    }} />
                ))}
                  <div className="flex items-center gap-1 ml-1 sm:hidden">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7c3aed', animation: 'blink 1.5s ease-in-out infinite' }} />
                  <span className="font-mono text-[7px]" style={{ color: '#64748b' }}>LIVE</span>
                </div>
              </div>
            </div>

            {/* Terminal output */}
            <div className="flex-1 px-3 pt-2 pb-1 overflow-hidden font-mono text-[8px] sm:text-[9px] leading-[14px] sm:leading-[16px]">
              {appDemo.prevSteps.map((s, i) => (
                <div key={i} className="whitespace-pre-wrap" style={{
                  color: s.type === 'cmd' ? '#94a3b8' : s.type === 'code' ? '#a0aec0' : s.type === 'success' ? 'rgba(16,185,129,0.4)' : '#94a3b8',
                }}>
                  {s.text.split('\n').map((line: string, li: number) => <div key={li} className="truncate">{line}</div>)}
                </div>
              ))}
              <div className="whitespace-pre-wrap" style={{
                color: appDemo.currentStep.type === 'cmd' ? '#475569'
                  : appDemo.currentStep.type === 'code' ? '#7c3aed'
                  : appDemo.currentStep.type === 'info' ? '#475569'
                  : appDemo.currentStep.type === 'build' ? '#6d28d9'
                  : appDemo.currentStep.type === 'deploy' ? '#7c3aed'
                  : appDemo.currentStep.type === 'success' ? '#059669'
                  : '#7c3aed',
              }}>
                {appDemo.visibleText}<span style={{ animation: 'blink 0.6s step-end infinite', color: '#7c3aed' }}>▌</span>
              </div>
            </div>
          </div>

          {/* ── CENTER DIVIDER ── */}
          <div className="hidden sm:block w-[1px] my-2" style={{ background: `linear-gradient(180deg, transparent, rgba(139,92,246,0.15), rgba(139,92,246,0.08), transparent)` }} />
          <div className="sm:hidden h-[1px] mx-3" style={{ background: `linear-gradient(90deg, transparent, rgba(139,92,246,0.15), rgba(139,92,246,0.08), transparent)` }} />

          {/* ── RIGHT: Professional visual preview ── */}
          <div className="relative w-full sm:w-[48%] flex-1 sm:flex-none overflow-hidden">

            {/* === CODE GENERATION: Full IDE mockup === */}
            {appDemo.appIndex === 0 && (
              <div className="absolute inset-0 flex flex-col" style={{ animation: 'fade-up 0.4s ease-out' }}>
                {/* Tab bar */}
                <div className="flex items-center shrink-0 border-b" style={{ background: 'rgba(255,255,255,0.3)', borderColor: 'rgba(139,92,246,0.06)' }}>
                  {['page.tsx','Hero.tsx','Pricing.tsx','stripe.ts','auth.ts'].map((f,i) => (
                    <div key={f} className="flex items-center gap-1 px-2.5 py-1 text-[7px] sm:text-[8px] font-mono border-r cursor-default" style={{
                      background: i === 0 ? 'rgba(139,92,246,0.06)' : 'transparent',
                      borderColor: 'rgba(139,92,246,0.04)',
                      borderBottom: i === 0 ? '1.5px solid #7c3aed' : '1.5px solid transparent',
                      color: i === 0 ? '#1e293b' : '#94a3b8',
                    }}>
                      <span style={{ color: i === 0 ? '#7c3aed' : '#94a3b8', fontSize: '6px' }}>TS</span> {f}
                    </div>
                  ))}
                  <div className="ml-auto pr-2 flex items-center gap-1.5">
                    <span className="font-mono text-[7px]" style={{ color: '#7c3aed' }}>Ln 187</span>
                    <span className="font-mono text-[7px]" style={{ color: '#d4d0e0' }}>│</span>
                    <span className="font-mono text-[7px]" style={{ color: '#94a3b8' }}>UTF-8</span>
                  </div>
                </div>
                {/* Editor body */}
                <div className="flex-1 flex overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  {/* Line numbers gutter */}
                  <div className="shrink-0 pr-1.5 pl-1 pt-1.5 text-right select-none border-r" style={{ borderColor: 'rgba(139,92,246,0.06)' }}>
                    {Array.from({length:18},(_,i)=>i+1).map(n => (
                      <div key={n} className="font-mono leading-[11px]" style={{ fontSize: '7px', color: n === 11 ? '#7c3aed' : '#c4b5d4' }}>{n}</div>
                    ))}
                  </div>
                  {/* Code content */}
                  <div className="flex-1 pt-1.5 pl-2 overflow-hidden">
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#7c3aed' }}>import</span> <span style={{ color: '#6d28d9' }}>{'{ Metadata }'}</span> <span style={{ color: '#7c3aed' }}>from</span> <span style={{ color: '#059669' }}>{"'next'"}</span>;</div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#7c3aed' }}>import</span> <span style={{ color: '#6d28d9' }}>Hero</span> <span style={{ color: '#7c3aed' }}>from</span> <span style={{ color: '#059669' }}>{"'@/components/Hero'"}</span>;</div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#7c3aed' }}>import</span> <span style={{ color: '#6d28d9' }}>Pricing</span> <span style={{ color: '#7c3aed' }}>from</span> <span style={{ color: '#059669' }}>{"'@/components/Pricing'"}</span>;</div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#7c3aed' }}>import</span> <span style={{ color: '#6d28d9' }}>{'{ getPlans }'}</span> <span style={{ color: '#7c3aed' }}>from</span> <span style={{ color: '#059669' }}>{"'@/lib/stripe'"}</span>;</div>
                    <div className="font-mono text-[7px] leading-[11px]" style={{ color: '#e2e0eb' }}>&nbsp;</div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#7c3aed' }}>export const</span> <span style={{ color: '#6d28d9' }}>metadata</span><span style={{ color: '#334155' }}>: </span><span style={{ color: '#d97706' }}>Metadata</span><span style={{ color: '#334155' }}> = {'{'}</span></div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#334155' }}>  title: </span><span style={{ color: '#059669' }}>{"'My SaaS App'"}</span>,</div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#334155' }}>  description: </span><span style={{ color: '#059669' }}>{"'Ship faster with AI'"}</span>,</div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#334155' }}>{'};'}</span></div>
                    <div className="font-mono text-[7px] leading-[11px]" style={{ color: '#e2e0eb' }}>&nbsp;</div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]" style={{ background: 'rgba(139,92,246,0.06)' }}><span style={{ color: '#7c3aed' }}>export default async function</span> <span style={{ color: '#059669' }}>Page</span><span style={{ color: '#334155' }}>() {'{'}</span></div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#334155' }}>  </span><span style={{ color: '#7c3aed' }}>const</span> <span style={{ color: '#6d28d9' }}>plans</span> <span style={{ color: '#334155' }}>=</span> <span style={{ color: '#7c3aed' }}>await</span> <span style={{ color: '#059669' }}>getPlans</span><span style={{ color: '#334155' }}>();</span></div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#334155' }}>  </span><span style={{ color: '#7c3aed' }}>const</span> <span style={{ color: '#6d28d9' }}>user</span> <span style={{ color: '#334155' }}>=</span> <span style={{ color: '#7c3aed' }}>await</span> <span style={{ color: '#059669' }}>getCurrentUser</span><span style={{ color: '#334155' }}>();</span></div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#334155' }}>  </span><span style={{ color: '#7c3aed' }}>return</span> <span style={{ color: '#334155' }}>(</span></div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#334155' }}>    </span><span style={{ color: '#8b5cf6' }}>{'<'}</span><span style={{ color: '#059669' }}>main</span> <span style={{ color: '#6d28d9' }}>className</span><span style={{ color: '#334155' }}>=</span><span style={{ color: '#059669' }}>{"'min-h-screen'"}</span><span style={{ color: '#8b5cf6' }}>{'>'}</span></div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#334155' }}>      </span><span style={{ color: '#8b5cf6' }}>{'<'}</span><span style={{ color: '#d97706' }}>Hero</span> <span style={{ color: '#6d28d9' }}>user</span><span style={{ color: '#334155' }}>=</span><span style={{ color: '#334155' }}>{'{'}</span><span style={{ color: '#6d28d9' }}>user</span><span style={{ color: '#334155' }}>{'}'}</span> <span style={{ color: '#8b5cf6' }}>/{'>'}</span></div>
                    <div className="font-mono text-[7px] sm:text-[8px] leading-[11px]"><span style={{ color: '#334155' }}>      </span><span style={{ color: '#8b5cf6' }}>{'<'}</span><span style={{ color: '#d97706' }}>Pricing</span> <span style={{ color: '#6d28d9' }}>plans</span><span style={{ color: '#334155' }}>=</span><span style={{ color: '#334155' }}>{'{'}</span><span style={{ color: '#6d28d9' }}>plans</span><span style={{ color: '#334155' }}>{'}'}</span> <span style={{ color: '#8b5cf6' }}>/{'>'}</span></div>
                  </div>
                  {/* Minimap */}
                  <div className="shrink-0 w-[14px] pt-1" style={{ background: 'rgba(139,92,246,0.03)' }}>
                    {Array.from({length:35}).map((_,i) => (
                      <div key={i} style={{ height: 1.5, marginBottom: 0.5, marginLeft: 2, background: `rgba(139,92,246,${i < 18 ? 0.15 : 0.06})`, width: `${25+Math.random()*65}%` }} />
                    ))}
                  </div>
                </div>
                {/* Status bar */}
                <div className="flex items-center justify-between px-2.5 py-[3px] shrink-0 border-t" style={{ background: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[6px] sm:text-[7px] font-mono flex items-center gap-1" style={{ color: '#059669' }}><span>●</span> 47 files</span>
                    <span className="text-[6px] sm:text-[7px] font-mono" style={{ color: '#7c3aed' }}>2,148 lines</span>
                    <span className="text-[6px] sm:text-[7px] font-mono" style={{ color: '#94a3b8' }}>0 errors</span>
                  </div>
                  <span className="text-[6px] sm:text-[7px] font-mono" style={{ color: '#94a3b8' }}>TypeScript React</span>
                </div>
              </div>
            )}

            {/* === BUILD & DEPLOY: Pipeline dashboard === */}
            {appDemo.appIndex === 1 && (
              <div className="absolute inset-0 flex flex-col p-3 gap-2" style={{ animation: 'fade-up 0.4s ease-out' }}>
                {/* Pipeline header */}
                <div className="flex items-center justify-between">
                  <div className="text-[8px] font-mono uppercase tracking-wider font-semibold" style={{ color: '#7c3aed' }}>Deployment Pipeline</div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7c3aed', animation: 'blink 1.5s ease-in-out infinite' }} />
                    <span className="font-mono text-[7px]" style={{ color: '#64748b' }}>LIVE</span>
                  </div>
                </div>
                {/* Pipeline stages */}
                <div className="flex gap-1 items-center">
                  {['Compile','Optimize','Bundle','Deploy'].map((s,i) => {
                    const done = appDemo.step > i + 1;
                    const active = appDemo.step === i + 1;
                    return (
                      <React.Fragment key={s}>
                        {i > 0 && <div className="w-4 h-[1px]" style={{ background: done ? '#7c3aed' : '#d4d0e0' }} />}
                        <div className="flex items-center gap-1 px-2 py-1 rounded text-[7px] font-mono" style={{
                          background: done ? 'rgba(124,58,237,0.08)' : active ? 'rgba(124,58,237,0.04)' : 'rgba(255,255,255,0.3)',
                          border: `1px solid ${done ? 'rgba(124,58,237,0.2)' : active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.5)'}`,
                          color: done ? '#7c3aed' : active ? '#8b5cf6' : '#94a3b8',
                        }}>
                          {done ? '✓' : active ? '◉' : '○'} {s}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                {/* Region grid */}
                <div className="flex-1 rounded-xl border p-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(139,92,246,0.08)' }}>
                  <div className="text-[7px] font-mono mb-2 tracking-wider uppercase" style={{ color: '#94a3b8' }}>Edge Regions</div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                    {['us-east-1','us-west-2','eu-west-1','eu-central-1','ap-south-1','ap-northeast','sa-east-1','af-south-1','me-south-1','ca-central','ap-southeast-1','ap-southeast-2'].map((r, i) => {
                      const deployed = appDemo.step >= 4 || (appDemo.step >= 3 && i < (appDemo.step - 2) * 6);
                      return (
                        <div key={r} className="flex items-center gap-1.5">
                          <div className="w-[5px] h-[5px] rounded-full transition-all duration-300" style={{ background: deployed ? '#7c3aed' : '#d4d0e0', boxShadow: deployed ? '0 0 4px rgba(124,58,237,0.3)' : 'none' }} />
                          <span className="text-[7px] font-mono" style={{ color: deployed ? '#6d28d9' : '#94a3b8' }}>{r}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Metrics row */}
                <div className="flex justify-between items-center rounded-xl px-3 py-1.5" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.06)' }}>
                  {[
                    { label: 'Bundle', value: '312kb' },
                    { label: 'TTFB', value: '48ms' },
                    { label: 'Routes', value: '47' },
                    { label: 'Score', value: '98/100' },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="text-[10px] sm:text-[11px] font-mono font-bold" style={{ color: '#7c3aed' }}>{m.value}</div>
                      <div className="text-[6px] font-mono uppercase tracking-wider" style={{ color: '#94a3b8' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* === EDIT & SHIP: Diff view + hosting === */}
            {appDemo.appIndex === 2 && (
              <div className="absolute inset-0 flex flex-col p-3 gap-1.5" style={{ animation: 'fade-up 0.4s ease-out' }}>
                {/* Diff header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono font-semibold" style={{ color: '#1e293b' }}>src/lib/auth.ts</span>
                    <span className="text-[7px] font-mono px-1 rounded" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>modified</span>
                  </div>
                  <div className="flex gap-2 text-[7px] font-mono">
                    <span style={{ color: '#10b981' }}>+34</span>
                    <span style={{ color: '#ef4444' }}>-8</span>
                  </div>
                </div>
                {/* Diff content */}
                <div className="flex-1 rounded-xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(16,185,129,0.1)' }}>
                  <div className="p-2 font-mono text-[7px] sm:text-[8px] leading-[12px]">
                    <div className="flex"><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#94a3b8' }}>1</span><span style={{ color: '#475569' }}>{"import { NextRequest } from 'next/server';"}</span></div>
                    <div className="flex"><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#94a3b8' }}>2</span><span style={{ color: '#475569' }}>{"import { verifyToken } from './jwt';"}</span></div>
                    <div className="flex rounded-sm -mx-1 px-1" style={{ background: 'rgba(16,185,129,0.07)' }}><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#10b981' }}>+</span><span style={{ color: '#86efac' }}>{"import { OAuth } from './oauth-providers';"}</span></div>
                    <div className="flex rounded-sm -mx-1 px-1" style={{ background: 'rgba(16,185,129,0.07)' }}><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#10b981' }}>+</span><span style={{ color: '#86efac' }}>{"import { analytics } from './analytics';"}</span></div>
                    <div className="flex"><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#94a3b8' }}>&nbsp;</span></div>
                    <div className="flex rounded-sm -mx-1 px-1" style={{ background: 'rgba(239,68,68,0.06)' }}><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#ef4444' }}>-</span><span style={{ color: '#fca5a5' }}>{"export function auth(req: NextRequest) {"}</span></div>
                    <div className="flex rounded-sm -mx-1 px-1" style={{ background: 'rgba(16,185,129,0.07)' }}><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#10b981' }}>+</span><span style={{ color: '#86efac' }}>{"export async function auth(req: NextRequest) {"}</span></div>
                    <div className="flex rounded-sm -mx-1 px-1" style={{ background: 'rgba(16,185,129,0.07)' }}><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#10b981' }}>+</span><span style={{ color: '#86efac' }}>{"  const session = await OAuth.verify(req);"}</span></div>
                    <div className="flex rounded-sm -mx-1 px-1" style={{ background: 'rgba(16,185,129,0.07)' }}><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#10b981' }}>+</span><span style={{ color: '#86efac' }}>{"  analytics.track('auth', session.userId);"}</span></div>
                    <div className="flex"><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#94a3b8' }}>7</span><span style={{ color: '#475569' }}>{"  const token = req.cookies.get('token');"}</span></div>
                    <div className="flex"><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#94a3b8' }}>8</span><span style={{ color: '#475569' }}>{"  return verifyToken(token?.value);"}</span></div>
                    <div className="flex"><span className="w-5 shrink-0 text-right pr-1" style={{ color: '#94a3b8' }}>9</span><span style={{ color: '#475569' }}>{"};"}</span></div>
                  </div>
                </div>
                {/* Test + coverage bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[7px] font-mono" style={{ color: '#10b981' }}>✓ 24/24 tests</span>
                  <div className="h-[3px] flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: '94%', background: 'linear-gradient(90deg, #10b981, #7c3aed)' }} />
                  </div>
                  <span className="text-[7px] font-mono" style={{ color: '#7c3aed' }}>94%</span>
                </div>
                {/* Hosting metrics */}
                <div className="flex justify-between items-center rounded-xl px-3 py-1.5" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.06)' }}>
                  {[
                    { label: 'Version', value: 'v1.1.0' },
                    { label: 'Uptime', value: '99.97%' },
                    { label: 'Regions', value: '12' },
                    { label: 'Total', value: '2,480 ln' },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="text-[9px] sm:text-[10px] font-mono font-bold" style={{ color: '#10b981' }}>{m.value}</div>
                      <div className="text-[5px] sm:text-[6px] font-mono uppercase tracking-wider" style={{ color: '#94a3b8' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scan line animation — removed for glass aesthetic */}
        </div>
      )}

      {/* ═══ STATUS BAR — bottom ═══ */}
      {phase >= 5 && (
        <div className="w-full shrink-0 z-20 flex items-center justify-center gap-2 sm:gap-6 py-0.5 font-mono text-[5px] sm:text-[7px] md:text-[8px] tracking-[0.1em] sm:tracking-[0.3em] uppercase"
          style={{ color: '#94a3b8' }}>
          <span>ONE LAST AI</span>
          <span style={{ color: '#d4d0e0' }}>│</span>
          <span>18 AI AGENTS</span>
          <span style={{ color: '#d4d0e0' }}>│</span>
          <span style={{ color: '#059669' }}>READY TO CHAT</span>
        </div>
      )}

        </div>{/* end bottom group */}
      </div>
    </div>
  );
};

export default Overlay;
