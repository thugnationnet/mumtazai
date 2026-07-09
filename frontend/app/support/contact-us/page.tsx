'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Contact Us
          </h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Get in touch with our team. We're here to help you succeed with AI agents.
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <h2 className="text-2xl font-bold text-neural-800 mb-6">Send us a message</h2>
            
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
                <label className="block text-sm font-medium text-neural-700 mb-2">Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neural-700 mb-2">Email *</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neural-700 mb-2">Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neural-700 mb-2">Message *</label>
                <textarea 
                  rows={5} 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
              <h3 className="text-xl font-bold text-neural-800 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                    <span className="text-brand-600">📧</span>
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-neural-600">support@onelastai.co</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                    <span className="text-brand-600">💬</span>
                  </div>
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-neural-600">Available 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
              <h3 className="text-xl font-bold text-neural-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/support/help-center" className="block w-full btn-secondary text-center">
                  Visit Help Center
                </Link>
                <Link href="/support/book-consultation" className="block w-full btn-secondary text-center">
                  Book Consultation
                </Link>
                <Link href="/support/live-support" className="block w-full btn-secondary text-center">
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