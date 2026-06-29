'use client'

import Link from 'next/link'
import { useState } from 'react'
import CloudflareTurnstile, { useTurnstile } from '@/components/CloudflareTurnstile'

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const { onVerify, onExpire, getToken, resetToken } = useTurnstile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    const turnstileToken = getToken()
    if (!turnstileToken) {
      setSubmitStatus('error')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, turnstileToken }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }
  return (
    <div className="min-h-screen themed-section-bg">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-violet-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-fuchsia-300/20 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-56 h-56 bg-violet-200/25 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-block bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl px-8 py-10 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Get in touch with our team. We're here to help you succeed with AI agents.
            </p>
          </div>
        </div>
      </section>

      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-700 mb-6">Send us a message</h2>
            
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✅ Message sent successfully! We'll get back to you soon.</p>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">❌ Failed to send message. Please try again.</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Email *</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Message *</label>
                <textarea 
                  rows={5} 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm"
                ></textarea>
              </div>
              <CloudflareTurnstile onVerify={onVerify} onExpire={onExpire} className="flex justify-center" />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
              <h3 className="text-xl font-bold text-slate-700 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/40 backdrop-blur-sm border border-white/60 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600">📧</span>
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-slate-500">support@mumtaz.ai</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/40 backdrop-blur-sm border border-white/60 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600">💬</span>
                  </div>
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-slate-500">Available 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
              <h3 className="text-xl font-bold text-slate-700 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/support/help-center" className="block w-full px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm text-center">
                  Visit Help Center
                </Link>
                <Link href="/support/book-consultation" className="block w-full px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm text-center">
                  Book Consultation
                </Link>
                <Link href="/support/live-support" className="block w-full px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm text-center">
                  Start Live Chat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}