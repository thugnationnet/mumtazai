'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import CloudflareTurnstile, { useTurnstile } from '@/components/CloudflareTurnstile'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribeError, setSubscribeError] = useState('')
  const [isAnimated, setIsAnimated] = useState(false)
  const footerRef = useRef<HTMLElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Mark as visible immediately to prevent flash of invisible content
    setIsAnimated(true);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scrollTriggerInstance: any = null;
    
    const initGSAP = async () => {
      // Check if all refs are available before running GSAP
      if (!footerRef.current || !brandRef.current || !linksRef.current || !ctaRef.current) {
        return;
      }

      const gsap = (await import('gsap')).default;
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      
      // Kill any existing animations on these elements first
      gsap.killTweensOf([brandRef.current, linksRef.current, ctaRef.current]);

      // Animate elements when footer comes into view
      // Start from nearly visible (0.9) to prevent flash
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 95%',
          toggleActions: 'play none none none'
        }
      });
      
      scrollTriggerInstance = tl.scrollTrigger;

      tl.fromTo(brandRef.current, 
        { opacity: 0.9, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' }
      )
      .fromTo(linksRef.current,
        { opacity: 0.9, x: 20 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo(ctaRef.current,
        { opacity: 0.9, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      );
    };

    initGSAP();
    
    // Cleanup on unmount or re-render
    return () => {
      if (scrollTriggerInstance) {
        scrollTriggerInstance.kill();
      }
    };

    initGSAP();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { onVerify, onExpire, getToken, resetToken } = useTurnstile()

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || isSubmitting) return
    
    setIsSubmitting(true)
    
    const turnstileToken = getToken()
    if (!turnstileToken) {
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'early_access',
          turnstileToken,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubscribed(true)
        setSubscribeError('')
        setEmail('')
        setTimeout(() => setSubscribed(false), 5000)
      } else {
        setSubscribeError(data.message || 'Subscription failed. Please try again.')
        setTimeout(() => setSubscribeError(''), 4000)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      setSubscribeError('Something went wrong. Please try again.')
      setTimeout(() => setSubscribeError(''), 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // All navigation links in one organized structure
  const footerLinks = [
    { name: 'Agents', href: 'https://mumtaz.ai/agents' },
    { name: 'Demo', href: 'https://demo.mumtaz.ai' },
    { name: 'AI Lab', href: '/lab' },
    { name: 'Canvas', href: 'https://build.mumtaz.ai', external: true },
    { name: 'Editor', href: 'https://editor.mumtaz.ai', external: true },
    { name: 'Apps', href: '/apps' },
    { name: 'Pricing', href: '/overview' },
    { name: 'Dashboard', href: '/dashboard/overview' },
    { name: 'Documentation', href: '/docs' },
    { name: 'Community', href: '/community/overview' },
    { name: 'Resources', href: '/resources' },
    { name: 'Careers', href: '/resources/careers' },
    { name: 'All Tools', href: '/tools' },
    { name: 'Security', href: '/security' },
    { name: 'Status', href: '/status' },
    { name: 'Rewards', href: '/rewards' },
  ]

  const bottomLinks = [
    { name: 'Support', href: '/support' },
    { name: 'About', href: '/about' },
    { name: 'Roadmap', href: '/community/roadmap' },
    { name: 'Legal', href: '/legal' },
  ]

  return (
    <footer ref={footerRef} className="themed-section-bg relative border-t border-white/40 w-full overflow-hidden">
      {/* Glass Ribbons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
      </div>
      {/* Chrome Sweep */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

      {/* Main Footer - Clean 2-column grid */}
      <div className="relative z-10 container-custom py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Left Column: Brand & Description */}
          <div ref={brandRef}>
            <Link href="/home" className="flex items-center gap-3 mb-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-xl group-hover:bg-purple-500/40 transition-all duration-300"></div>
                <Image
                  src="/images/logos/company-logo.png"
                  alt="Mumtaz AI"
                  width={48}
                  height={48}
                  className="relative w-12 h-12 object-contain"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
                Mumtaz AI
              </span>
            </Link>
            <p className="text-slate-500 text-base leading-relaxed max-w-md">
              Transform your business with intelligent AI agents. 18+ specialized personalities ready to revolutionize how you work.
            </p>
          </div>

          {/* Right Column: Navigation Links - Brand Theme Style */}
          <div ref={linksRef}>
            <div className="bg-white/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/50 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_8px_40px_rgba(139,92,246,0.2)] transition-all duration-300">
              <h3 className="text-sm font-bold bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent uppercase tracking-wider mb-5">Quick Links</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-3">
                {footerLinks.map((link) => (
                  link.external ? (
                    <a
                      key={link.name}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center text-green-600 hover:text-emerald-500 text-sm font-medium transition-all duration-300"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400 mr-0 group-hover:mr-2 transition-all duration-300 rounded-full"></span>
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="group flex items-center text-slate-600 hover:text-purple-700 text-sm font-medium transition-all duration-300"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 mr-0 group-hover:mr-2 transition-all duration-300 rounded-full"></span>
                      {link.name}
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner - Crystal Flow purple with 2-column layout: Email left, App badges right */}
      <div ref={ctaRef} className="footer-cta-banner relative z-10 overflow-hidden" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 30%, #5b21b6 50%, #7c3aed 75%, #8b5cf6 100%)' }}>
        <div className="relative container-custom py-5 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            {/* Left: Email Subscription */}
            <div className="flex flex-col gap-3">
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email for early access"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white text-sm transition-all duration-300"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-purple-700 rounded-lg font-bold hover:bg-white/90 transition-all duration-300 text-sm whitespace-nowrap shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Subscribe
                </button>
              </form>
              <div className="flex items-center gap-3">
                <CloudflareTurnstile onVerify={onVerify} onExpire={onExpire} theme="dark" size="flexible" appearance="interaction-only" className="[&>iframe]:!rounded-lg" />
                {subscribed && (
                  <p className="text-emerald-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Thanks for subscribing!
                  </p>
                )}
                {subscribeError && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {subscribeError}
                  </p>
                )}
              </div>
            </div>

            {/* Right: App Store badges */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-end items-center">
              {/* App Store Badge */}
              <div className="relative group">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-all duration-300 cursor-not-allowed">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/80 leading-tight">Download on the</span>
                    <span className="text-sm font-semibold text-white leading-tight">App Store</span>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 px-2 py-0.5 neu-icon rounded-full text-[9px] font-bold text-amber-600">
                  SOON
                </div>
              </div>

              {/* Google Play Badge */}
              <div className="relative group">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-all duration-300 cursor-not-allowed">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/80 leading-tight">GET IT ON</span>
                    <span className="text-sm font-semibold text-white leading-tight">Google Play</span>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 px-2 py-0.5 neu-icon rounded-full text-[9px] font-bold text-amber-600">
                  SOON
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Compact Dark Purple */}
      <div className="relative z-10 bg-purple-950 border-t border-purple-900/50">
        <div className="container-custom py-3 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-purple-300/70 text-xs">
              © {currentYear} Mumtaz AI. All rights reserved.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a href="https://x.com/mumtazai" target="_blank" rel="noopener noreferrer" className="text-purple-300/70 hover:text-slate-900 transition-colors" title="X (Twitter)">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://t.me/mumtazai" target="_blank" rel="noopener noreferrer" className="text-purple-300/70 hover:text-cyan-400 transition-colors" title="Telegram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a href="https://line.me/ti/p/@mumtazai" target="_blank" rel="noopener noreferrer" className="text-purple-300/70 hover:text-green-400 transition-colors" title="LINE">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              </a>
              <a href="https://instagram.com/mumtazai" target="_blank" rel="noopener noreferrer" className="text-purple-300/70 hover:text-pink-400 transition-colors" title="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://tiktok.com/@mumtazai" target="_blank" rel="noopener noreferrer" className="text-purple-300/70 hover:text-slate-900 transition-colors" title="TikTok">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61555473113271" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors" title="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://github.com/aidigitalfriend" target="_blank" rel="noopener noreferrer" className="text-purple-300/70 hover:text-slate-900 transition-colors" title="GitHub">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>

            <div className="flex items-center gap-6">
              {bottomLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-purple-300/70 hover:text-purple-200 text-xs transition-all duration-300"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
