'use client'

import { useState } from 'react'
import Image from 'next/image'
import CloudflareTurnstile, { useTurnstile } from '@/components/CloudflareTurnstile'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const { onVerify, onExpire, getToken, resetToken } = useTurnstile()

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')

    const turnstileToken = getToken()
    if (!turnstileToken) {
      setStatus('error')
      setMessage('Please complete the verification challenge')
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
          source: 'newsletter',
          turnstileToken,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage(data.message || 'Thanks for subscribing! Check your inbox for confirmation.')
        setEmail('')
        
        // Reset after 5 seconds
        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 5000)
      } else {
        setStatus('error')
        setMessage(data.message || 'Something went wrong. Please try again.')
        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 3000)
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)
    }
  }

  return (
    <section className="section-padding neu-cta text-slate-900 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl"></div>
      </div>
      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-300 rounded-full text-slate-900 text-sm font-medium mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Newsletter
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Stay
              <span className="text-slate-900"> Updated</span>
            </h2>
            <p className="text-lg text-slate-900 mb-8 leading-relaxed">
              Get the latest news, features, and tips delivered to your inbox every week. Join 5,000+ subscribers.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === 'loading'}
                className="flex-1 px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button 
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-neutral-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subscribing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>

            {/* Turnstile — invisible until interaction needed */}
            <div className="[&_iframe]:!h-[65px] [&_iframe]:!w-auto mb-1">
              <CloudflareTurnstile onVerify={onVerify} onExpire={onExpire} theme="dark" size="flexible" appearance="interaction-only" />
            </div>

            {/* Status messages */}
            {status === 'success' && (
              <p className="text-sm text-emerald-300 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {message}
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-300 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {message}
              </p>
            )}
            {status === 'idle' && (
              <p className="text-sm text-slate-900">
                We respect your privacy. Unsubscribe at any time.
              </p>
            )}
          </div>
          
          {/* Right - Visual */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <Image
                src="/images/products/newsletter.jpeg"
                alt="Newsletter Subscription"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-white to-neutral-100 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-3xl">📬</span>
            </div>
            <div className="absolute -top-4 -left-4 bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-white">5K+</div>
              <div className="text-xs text-white/70">Subscribers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
