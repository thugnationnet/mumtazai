'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Product screenshots that will fly around smoothly
const productScreenshots = [
  { id: 'canvas', image: '/images/products/canvas.jpeg' },
  { id: 'api-tester', image: '/images/products/api-tester.jpeg' },
  { id: 'dns-lookup', image: '/images/products/dns-lookup.jpeg' },
  { id: 'hash-generator', image: '/images/products/hash-generator.jpeg' },
  { id: 'dream-interpreter', image: '/images/products/dream-interpreter.jpeg' },
  { id: 'battle-arena', image: '/images/products/battle-arena.jpeg' },
  { id: 'emotion-visualizer', image: '/images/products/emotion-visualizer.jpeg' },
  { id: 'json-formatter', image: '/images/products/json-formatter.jpeg' },
  { id: 'ssl-checker', image: '/images/products/ssl-checker.jpeg' },
  { id: 'port-scanner', image: '/images/products/port-scanner.jpeg' },
  { id: 'story-weaver', image: '/images/products/story-weaver.jpeg' },
  { id: 'neural-art', image: '/images/products/neural-art.jpeg' },
];

// Use 20 cards for smooth flying effect
const expandedProducts = [
  ...productScreenshots,
  ...productScreenshots.slice(0, 8).map((p) => ({ ...p, id: `${p.id}-alt1` })),
];

// 20 smooth animation configurations - left, right, up, down only (no zoom)
const animationConfigs = [
  { direction: 'left-to-right', duration: 25, delay: 0, startY: '5%', size: 'large' },
  { direction: 'right-to-left', duration: 22, delay: 1, startY: '15%', size: 'medium' },
  { direction: 'top-to-bottom', duration: 28, delay: 2, startX: '10%', size: 'small' },
  { direction: 'bottom-to-top', duration: 24, delay: 0.5, startX: '85%', size: 'medium' },
  { direction: 'left-to-right', duration: 30, delay: 3, startY: '35%', size: 'large' },
  { direction: 'right-to-left', duration: 20, delay: 1.5, startY: '25%', size: 'small' },
  { direction: 'top-to-bottom', duration: 26, delay: 4, startX: '70%', size: 'medium' },
  { direction: 'bottom-to-top', duration: 23, delay: 2.5, startX: '30%', size: 'large' },
  { direction: 'left-to-right', duration: 27, delay: 5, startY: '55%', size: 'small' },
  { direction: 'right-to-left', duration: 21, delay: 3.5, startY: '45%', size: 'large' },
  { direction: 'top-to-bottom', duration: 29, delay: 6, startX: '50%', size: 'medium' },
  { direction: 'bottom-to-top', duration: 25, delay: 4.5, startX: '15%', size: 'small' },
  { direction: 'left-to-right', duration: 24, delay: 7, startY: '75%', size: 'medium' },
  { direction: 'right-to-left', duration: 28, delay: 5.5, startY: '65%', size: 'large' },
  { direction: 'top-to-bottom', duration: 22, delay: 8, startX: '90%', size: 'small' },
  { direction: 'bottom-to-top', duration: 26, delay: 6.5, startX: '60%', size: 'medium' },
  { direction: 'left-to-right', duration: 30, delay: 9, startY: '85%', size: 'large' },
  { direction: 'right-to-left', duration: 23, delay: 7.5, startY: '8%', size: 'small' },
  { direction: 'top-to-bottom', duration: 27, delay: 10, startX: '40%', size: 'medium' },
  { direction: 'bottom-to-top', duration: 21, delay: 8.5, startX: '75%', size: 'large' },
];

// Product Card Component - smooth flying with dark shadows
function ProductCard({ 
  product, 
  config, 
  index 
}: { 
  product: typeof expandedProducts[0]; 
  config: typeof animationConfigs[0];
  index: number;
}) {
  const sizeClasses = {
    small: 'w-36 h-28 md:w-48 md:h-36',
    medium: 'w-48 h-36 md:w-64 md:h-48',
    large: 'w-64 h-48 md:w-80 md:h-60',
  };

  const getAnimationClass = () => {
    switch (config.direction) {
      case 'left-to-right': return 'animate-float-right';
      case 'right-to-left': return 'animate-float-left';
      case 'top-to-bottom': return 'animate-float-down';
      case 'bottom-to-top': return 'animate-float-up';
      default: return 'animate-float-right';
    }
  };

  const getPositionStyle = () => {
    const style: React.CSSProperties = {
      animationDuration: `${config.duration}s`,
      animationDelay: `${config.delay}s`,
      zIndex: config.size === 'large' ? 10 : config.size === 'medium' ? 5 : 1,
    };
    if (config.direction === 'left-to-right' || config.direction === 'right-to-left') {
      style.top = config.startY;
    }
    if (config.direction === 'top-to-bottom' || config.direction === 'bottom-to-top') {
      style.left = config.startX;
    }
    return style;
  };

  return (
    <div
      className={`absolute ${sizeClasses[config.size as keyof typeof sizeClasses]} ${getAnimationClass()}`}
      style={getPositionStyle()}
    >
      {/* Card with heavy dark shadow */}
      <div className="w-full h-full rounded-xl overflow-hidden relative shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8),0_10px_30px_-5px_rgba(0,0,0,0.6)]">
        <Image
          src={product.image}
          alt={`Product ${index + 1}`}
          fill
          className="object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        {/* Dark overlay on image edges */}
        <div className="absolute inset-0 shadow-[inset_0_0_30px_10px_rgba(0,0,0,0.5)]"></div>
        {/* Bottom dark gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent"></div>
        {/* Top dark gradient */}
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent"></div>
      </div>
    </div>
  );
}

// Snowflake component - bigger and foggier
function Snowflake({ style }: { style: React.CSSProperties }) {
  return (
    <div 
      className="absolute w-2 h-2 bg-white/25 rounded-full animate-snowfall pointer-events-none blur-[0.5px]"
      style={style}
    />
  );
}

export default function HeroSectionUltra() {
  const [mounted, setMounted] = useState(false);
  
  // Generate snowflakes - increased for foggy effect
  const snowflakes = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        animationDuration: `${6 + Math.random() * 10}s`,
        animationDelay: `${Math.random() * 6}s`,
        opacity: 0.15 + Math.random() * 0.4,
        transform: `scale(${0.8 + Math.random() * 1.5})`,
      }
    }));
  }, []);

  // Generate stars for aurora effect
  const stars = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      style: {
        left: `${5 + Math.random() * 20}%`,
        top: `${10 + Math.random() * 15}%`,
        animationDelay: `${Math.random() * 3}s`,
      }
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden neu-page-bg">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      </div>

      {/* Corner darkness vignette - softer so cards are visible */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {/* Top-left corner - softer */}
        <div className="absolute top-0 left-0 w-[350px] h-[350px] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-black/70 via-black/40 to-transparent"></div>
        {/* Top-right corner - softer */}
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-black/70 via-black/40 to-transparent"></div>
        {/* Bottom-left corner - softer */}
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-black/60 via-black/30 to-transparent"></div>
        {/* Bottom-right corner - softer */}
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-black/60 via-black/30 to-transparent"></div>
        {/* Subtle edge vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.3)_100%)]"></div>
      </div>

      {/* Torch lights from bottom corners - subtle glow */}
      <div className="absolute inset-0 pointer-events-none z-25">
        {/* Bottom-left torch light */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/15 via-purple-500/8 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-400/12 via-transparent to-transparent"></div>
        {/* Bottom-right torch light */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/15 via-indigo-500/8 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-400/12 via-transparent to-transparent"></div>
      </div>

      {/* Aurora/cosmic rays effect near logo (top-left) */}
      <div className="absolute top-0 left-0 w-96 h-64 pointer-events-none overflow-hidden z-40">
        {/* Curved aurora beams */}
        <div className="absolute top-8 left-4 w-48 h-1 bg-gradient-to-r from-indigo-500/40 via-purple-400/30 to-transparent rounded-full blur-sm animate-aurora-pulse"></div>
        <div className="absolute top-12 left-8 w-40 h-0.5 bg-gradient-to-r from-cyan-400/30 via-blue-400/20 to-transparent rounded-full blur-sm animate-aurora-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-16 left-2 w-52 h-0.5 bg-gradient-to-r from-purple-500/35 via-pink-400/25 to-transparent rounded-full blur-sm animate-aurora-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-20 left-12 w-36 h-1 bg-gradient-to-r from-blue-400/30 via-indigo-300/20 to-transparent rounded-full blur-sm animate-aurora-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Twinkling stars */}
        {mounted && stars.map(star => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={star.style}
          />
        ))}
        
        {/* Soft glow near logo area */}
        <div className="absolute top-4 left-16 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Snowfall effect */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
          {snowflakes.map(flake => (
            <Snowflake key={flake.id} style={flake.style} />
          ))}
        </div>
      )}

      {/* Flying product cards - 30 cards with zoom-pass effect coming CLOSE to screen */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {expandedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              config={animationConfigs[index % animationConfigs.length]}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Center content - heading and text */}
      <div className="relative z-40 flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl">
          {/* Main Heading - Sky blue gradient like footer */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
            Build Intelligence
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl lg:text-3xl text-slate-900 mb-8 font-light">
            Create powerful AI agents with our visual canvas builder
          </p>
          
          {/* Description */}
          <p className="text-base md:text-lg text-slate-900 mb-12 max-w-2xl mx-auto">
            No code required. Drag, drop, and deploy intelligent agents that solve real problems.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="https://studio.mumtaz.ai"
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-800 font-bold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-white/20 hover:scale-105"
            >
              <span className="relative z-10">Start Building</span>
              <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold">
                Start Building
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            
            <Link
              href="/lab"
              className="group inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-slate-900 font-semibold rounded-xl hover:bg-slate-100 hover:border-white/40 transition-all duration-300"
            >
              <span>Explore Labs</span>
              <span className="text-lg group-hover:animate-bounce">🧪</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-30"></div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-40">
        <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
