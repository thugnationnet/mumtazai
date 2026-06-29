'use client';

import { useEffect, useRef, useState } from 'react';

interface Agent {
  id: string;
  name: string;
  specialty: string;
  description: string;
  color: string;
  emoji: string;
  hoverBadge: string;
}

const agents: Agent[] = [
  {
    id: '1',
    name: 'Einstein',
    specialty: 'Physics & Science',
    description: 'Explore the mysteries of the universe',
    color: 'from-blue-500 to-indigo-600',
    emoji: '🔬',
    hoverBadge: 'E=mc²',
  },
  {
    id: '2',
    name: 'Tech Wizard',
    specialty: 'Coding & Innovation',
    description: 'Master the art of technology',
    color: 'from-purple-500 to-pink-600',
    emoji: '💻',
    hoverBadge: 'Full Stack',
  },
  {
    id: '3',
    name: 'Mrs Boss',
    specialty: 'Leadership & Strategy',
    description: 'Lead with confidence and clarity',
    color: 'from-rose-500 to-red-600',
    emoji: '👔',
    hoverBadge: 'CEO Mindset',
  },
  {
    id: '4',
    name: 'Chef Biew',
    specialty: 'Culinary Expertise',
    description: 'Create culinary masterpieces',
    color: 'from-orange-500 to-amber-600',
    emoji: '👨‍🍳',
    hoverBadge: '5-Star Chef',
  },
  {
    id: '5',
    name: 'Julie',
    specialty: 'Companionship',
    description: 'Your caring AI companion',
    color: 'from-pink-500 to-rose-600',
    emoji: '💕',
    hoverBadge: 'Always Here',
  },
  {
    id: '6',
    name: 'Emma Emotional',
    specialty: 'Empathy & Support',
    description: 'Emotional intelligence expert',
    color: 'from-teal-500 to-cyan-600',
    emoji: '💝',
    hoverBadge: 'Empathy Pro',
  },
  {
    id: '7',
    name: 'Travel Buddy',
    specialty: 'Travel Planning',
    description: 'Your ultimate travel companion',
    color: 'from-green-500 to-emerald-600',
    emoji: '✈️',
    hoverBadge: 'World Explorer',
  },
  {
    id: '8',
    name: 'Fitness Guru',
    specialty: 'Health & Fitness',
    description: 'Transform your body and mind',
    color: 'from-red-500 to-orange-600',
    emoji: '💪',
    hoverBadge: 'Get Fit',
  },
  {
    id: '9',
    name: 'Comedy King',
    specialty: 'Entertainment',
    description: 'Laughter is the best medicine',
    color: 'from-yellow-500 to-orange-600',
    emoji: '😂',
    hoverBadge: 'LOL Master',
  },
  {
    id: '10',
    name: 'Drama Queen',
    specialty: 'Creative Writing',
    description: 'Dramatic storytelling expert',
    color: 'from-violet-500 to-purple-600',
    emoji: '🎭',
    hoverBadge: 'Storyteller',
  },
  {
    id: '11',
    name: 'Professor Astrology',
    specialty: 'Astrology & Spirituality',
    description: 'Decode the stars and beyond',
    color: 'from-indigo-500 to-blue-600',
    emoji: '🔮',
    hoverBadge: 'Star Reader',
  },
  {
    id: '12',
    name: 'Nid Gaming',
    specialty: 'Gaming & Esports',
    description: 'Level up your gaming skills',
    color: 'from-cyan-500 to-blue-600',
    emoji: '🎮',
    hoverBadge: 'Pro Gamer',
  },
  {
    id: '13',
    name: 'Ben Sega',
    specialty: 'Retro Gaming',
    description: 'Classic games & nostalgia',
    color: 'from-blue-600 to-purple-600',
    emoji: '🕹️',
    hoverBadge: 'Retro Expert',
  },
  {
    id: '14',
    name: 'Bishop Burger',
    specialty: 'Chess Strategy',
    description: 'Master chess tactics & moves',
    color: 'from-amber-600 to-yellow-500',
    emoji: '♟️',
    hoverBadge: 'Grandmaster',
  },
  {
    id: '15',
    name: 'Chess Player',
    specialty: 'Strategic Thinking',
    description: 'Think several moves ahead',
    color: 'from-gray-600 to-slate-700',
    emoji: '♚',
    hoverBadge: 'Tactician',
  },
  {
    id: '16',
    name: 'Knight Logic',
    specialty: 'Problem Solving',
    description: 'Logical reasoning expert',
    color: 'from-emerald-600 to-teal-600',
    emoji: '🐴',
    hoverBadge: 'Logic Pro',
  },
  {
    id: '17',
    name: 'Lazy Pawn',
    specialty: 'Relaxation',
    description: 'Take it easy, one step at a time',
    color: 'from-slate-500 to-gray-600',
    emoji: '😴',
    hoverBadge: 'Chill Mode',
  },
  {
    id: '18',
    name: 'Rook Jokey',
    specialty: 'Humor & Wit',
    description: 'Jokes and fun for everyone',
    color: 'from-orange-500 to-red-500',
    emoji: '🃏',
    hoverBadge: 'Joker',
  },
];

// Duplicate agents for infinite scroll effect
const duplicatedAgents = [...agents, ...agents];

export default function AgentCardsMarquee() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame

    const animate = () => {
      scrollPosition += scrollSpeed;
      
      // Reset when we've scrolled past the first set of cards
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    // Start animation after a short delay
    const timer = setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 500);

    // Pause on hover
    const handleMouseEnter = () => {
      cancelAnimationFrame(animationId);
    };

    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section className="py-16 md:py-24 neu-page-bg overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full filter blur-[100px]"></div>
      </div>

      {/* Header */}
      <div className="container-custom relative z-10 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-600 text-sm font-medium mb-4 border border-blue-200">
            <span className="text-lg">🤖</span>
            Meet Our AI Agents
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            18+ Unique AI
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent"> Personalities</span>
          </h2>
          <p className="text-lg text-slate-500">
            Each agent brings specialized expertise and a unique personality. Find your perfect AI companion.
          </p>
        </div>
      </div>

      {/* Scrolling Cards Container */}
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide px-4 md:px-8"
        style={{ scrollBehavior: 'auto' }}
      >
        {duplicatedAgents.map((agent, index) => (
          <div
            key={`${agent.id}-${index}`}
            className="group flex-shrink-0 w-[280px] md:w-[320px] cursor-default"
            onMouseEnter={() => setHoveredId(`${agent.id}-${index}`)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="relative h-[380px] md:h-[420px] rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-slate-300 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/20">
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-15 transition-opacity duration-500`}></div>
              
              {/* Top Badge - Changes on hover */}
              <div className="absolute top-4 left-4 z-10">
                <span className={`px-3 py-1.5 backdrop-blur-md rounded-full text-xs font-medium border transition-all duration-300 ${
                  hoveredId === `${agent.id}-${index}` 
                    ? `bg-gradient-to-r ${agent.color} text-slate-900 border-white/40 shadow-lg` 
                    : 'bg-slate-200 text-slate-900 border-white/20'
                }`}>
                  {hoveredId === `${agent.id}-${index}` ? `✨ ${agent.hoverBadge}` : `${agent.emoji} ${agent.specialty}`}
                </span>
              </div>

              {/* Avatar Area */}
              <div className="relative h-[200px] md:h-[220px] overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-white/20 to-white/5 border-2 flex items-center justify-center shadow-xl transition-all duration-500 ${
                    hoveredId === `${agent.id}-${index}` 
                      ? 'scale-110 border-white/50 shadow-2xl' 
                      : 'border-white/30'
                  }`}>
                    <span className={`text-5xl md:text-6xl transition-transform duration-300 ${
                      hoveredId === `${agent.id}-${index}` ? 'scale-110' : ''
                    }`}>{agent.emoji}</span>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-16 h-16 bg-slate-100 rounded-full blur-xl group-hover:bg-white/10 transition-all"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 bg-slate-100 rounded-full blur-lg group-hover:bg-white/10 transition-all"></div>
              </div>

              {/* Content */}
              <div className="p-5 md:p-6">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {agent.name}
                </h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 group-hover:text-slate-600 transition-colors">
                  {agent.description}
                </p>
                
                {/* Specialty Tag */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${agent.color} animate-pulse`}></div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-400 transition-colors">{agent.specialty}</span>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}>
                <div className={`absolute -inset-1 bg-gradient-to-r ${agent.color} opacity-20 blur-xl`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
    </section>
  );
}
