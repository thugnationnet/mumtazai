'use client'

import Link from 'next/link'
import { useState } from 'react'
import CloudflareTurnstile, { useTurnstile } from '@/components/CloudflareTurnstile'

export default function WebinarRegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phoneNumber: '',
    webinarTopic: 'getting-started'
  })

  const [submitted, setSubmitted] = useState(false)
  const { onVerify, onExpire, getToken, resetToken } = useTurnstile()

  const webinarOptions = [
    { value: 'getting-started', label: 'Getting Started with AI Agents' },
    { value: 'advanced-customization', label: 'Advanced Customization Techniques' },
    { value: 'enterprise-solutions', label: 'Building Enterprise Solutions' },
    { value: 'analytics-reporting', label: 'Real-time Analytics & Reporting' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData)
    setSubmitted(true)
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        jobTitle: '',
        phoneNumber: '',
        webinarTopic: 'getting-started'
      })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen themed-section-bg">
      {/* Header */}
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
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Webinar Registration</h1>
            <p className="text-lg text-slate-600">Register for our upcoming webinars and enhance your AI knowledge</p>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="section-padding">
        <div className="container-custom max-w-2xl">
          {submitted ? (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-emerald-200/60 shadow-lg p-8 text-center">
              <div className="text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-2">Registration Successful!</h2>
              <p className="text-slate-600 mb-4">
                Thank you for registering. We've sent a confirmation email to <strong>{formData.email}</strong>
              </p>
              <p className="text-slate-600 mb-6">
                You'll receive webinar details and access links shortly.
              </p>
              <Link href="/resources/webinars" className="inline-block px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">
                Back to Webinars
              </Link>
            </div>
          ) : (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
              <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">Register for a Webinar</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* First Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Company and Job Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Your Company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Job Title</label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Product Manager"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Webinar Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Select Webinar *</label>
                  <select
                    name="webinarTopic"
                    value={formData.webinarTopic}
                    onChange={handleInputChange}
                    className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {webinarOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Terms */}
                <div className="bg-white/30 backdrop-blur-sm border border-white/50 rounded-xl p-4">
                  <p className="text-sm text-slate-600">
                    ✓ By registering, you agree to receive webinar updates and related communications from us.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    ✓ We respect your privacy and will never share your email address with third parties.
                  </p>
                </div>

                <CloudflareTurnstile onVerify={onVerify} onExpire={onExpire} className="flex justify-center" />

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105"
                >
                  Complete Registration →
                </button>
              </form>

              {/* Back Link */}
              <div className="mt-6 text-center">
                <Link href="/resources/webinars" className="text-purple-600 hover:text-purple-500 transition">
                  ← Back to Webinars
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="relative py-14 overflow-hidden rounded-[2rem] mx-4 mb-8 themed-section-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-56 h-56 bg-violet-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-fuchsia-300/20 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-48 h-48 bg-indigo-300/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
        </div>
        <div className="container-custom max-w-3xl relative z-10">
          <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">What to Expect</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="font-bold text-slate-800 mb-2">Confirmation Email</h3>
              <p className="text-slate-600 text-sm">
                You'll receive a confirmation email with webinar details and access links.
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="text-3xl mb-3">🎥</div>
              <h3 className="font-bold text-slate-800 mb-2">Live Webinar</h3>
              <p className="text-slate-600 text-sm">
                Join us live for interactive sessions with Q&A and expert insights.
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="text-3xl mb-3">📹</div>
              <h3 className="font-bold text-slate-800 mb-2">Recording Access</h3>
              <p className="text-slate-600 text-sm">
                Can't attend live? Access the recorded session anytime after the webinar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="font-bold mb-2 text-purple-600">Do I need to attend live?</h3>
              <p className="text-slate-600">
                No, you can attend live or watch the recording later. Both registered attendees and those who can't make it live will have access to the recording.
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="font-bold mb-2 text-purple-600">Will there be a Q&A session?</h3>
              <p className="text-slate-600">
                Yes! All our webinars include a dedicated Q&A session where you can ask questions directly to our experts.
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="font-bold mb-2 text-purple-600">What if I need to cancel?</h3>
              <p className="text-slate-600">
                No problem! You can unsubscribe from webinar notifications at any time. Simply click the unsubscribe link in any email we send you.
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="font-bold mb-2 text-purple-600">Is there a cost?</h3>
              <p className="text-slate-600">
                All webinars are completely free! We offer these sessions to help you get the most out of our platform.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
