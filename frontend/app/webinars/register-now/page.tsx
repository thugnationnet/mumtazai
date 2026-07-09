'use client'

import Link from 'next/link'
import { useState } from 'react'

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
    <div className="min-h-screen bg-gradient-to-br from-neural-900 to-neural-800 text-white">
      {/* Header */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-purple-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Webinar Registration</h1>
          <p className="text-xl opacity-90">Register for our upcoming webinars and enhance your AI knowledge</p>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="section-padding">
        <div className="container-custom max-w-2xl">
          {submitted ? (
            <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-8 text-center">
              <div className="text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
              <p className="text-neural-300 mb-4">
                Thank you for registering. We've sent a confirmation email to <strong>{formData.email}</strong>
              </p>
              <p className="text-neural-300 mb-6">
                You'll receive webinar details and access links shortly.
              </p>
              <Link href="/resources/webinars" className="inline-block px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition">
                Back to Webinars
              </Link>
            </div>
          ) : (
            <div className="bg-neural-800 border border-neural-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Register for a Webinar</h2>

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
                      className="w-full px-4 py-2 bg-neural-700 border border-neural-600 rounded-lg text-white placeholder-neural-400 focus:outline-none focus:border-brand-500"
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
                      className="w-full px-4 py-2 bg-neural-700 border border-neural-600 rounded-lg text-white placeholder-neural-400 focus:outline-none focus:border-brand-500"
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
                    className="w-full px-4 py-2 bg-neural-700 border border-neural-600 rounded-lg text-white placeholder-neural-400 focus:outline-none focus:border-brand-500"
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
                      className="w-full px-4 py-2 bg-neural-700 border border-neural-600 rounded-lg text-white placeholder-neural-400 focus:outline-none focus:border-brand-500"
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
                      className="w-full px-4 py-2 bg-neural-700 border border-neural-600 rounded-lg text-white placeholder-neural-400 focus:outline-none focus:border-brand-500"
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
                    className="w-full px-4 py-2 bg-neural-700 border border-neural-600 rounded-lg text-white placeholder-neural-400 focus:outline-none focus:border-brand-500"
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
                    className="w-full px-4 py-2 bg-neural-700 border border-neural-600 rounded-lg text-white focus:outline-none focus:border-brand-500"
                  >
                    {webinarOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Terms */}
                <div className="bg-neural-700 p-4 rounded-lg border border-neural-600">
                  <p className="text-sm text-neural-300">
                    ✓ By registering, you agree to receive webinar updates and related communications from us.
                  </p>
                  <p className="text-sm text-neural-300 mt-2">
                    ✓ We respect your privacy and will never share your email address with third parties.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Complete Registration →
                </button>
              </form>

              {/* Back Link */}
              <div className="mt-6 text-center">
                <Link href="/resources/webinars" className="text-blue-400 hover:text-blue-300 transition">
                  ← Back to Webinars
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="section-padding bg-neural-800">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">What to Expect</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neural-700 p-6 rounded-lg border border-neural-600">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="font-bold mb-2">Confirmation Email</h3>
              <p className="text-neural-300 text-sm">
                You'll receive a confirmation email with webinar details and access links.
              </p>
            </div>
            <div className="bg-neural-700 p-6 rounded-lg border border-neural-600">
              <div className="text-3xl mb-3">🎥</div>
              <h3 className="font-bold mb-2">Live Webinar</h3>
              <p className="text-neural-300 text-sm">
                Join us live for interactive sessions with Q&A and expert insights.
              </p>
            </div>
            <div className="bg-neural-700 p-6 rounded-lg border border-neural-600">
              <div className="text-3xl mb-3">📹</div>
              <h3 className="font-bold mb-2">Recording Access</h3>
              <p className="text-neural-300 text-sm">
                Can't attend live? Access the recorded session anytime after the webinar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-neural-800 p-6 rounded-lg border border-neural-700">
              <h3 className="font-bold mb-2 text-blue-400">Do I need to attend live?</h3>
              <p className="text-neural-300">
                No, you can attend live or watch the recording later. Both registered attendees and those who can't make it live will have access to the recording.
              </p>
            </div>
            <div className="bg-neural-800 p-6 rounded-lg border border-neural-700">
              <h3 className="font-bold mb-2 text-blue-400">Will there be a Q&A session?</h3>
              <p className="text-neural-300">
                Yes! All our webinars include a dedicated Q&A session where you can ask questions directly to our experts.
              </p>
            </div>
            <div className="bg-neural-800 p-6 rounded-lg border border-neural-700">
              <h3 className="font-bold mb-2 text-blue-400">What if I need to cancel?</h3>
              <p className="text-neural-300">
                No problem! You can unsubscribe from webinar notifications at any time. Simply click the unsubscribe link in any email we send you.
              </p>
            </div>
            <div className="bg-neural-800 p-6 rounded-lg border border-neural-700">
              <h3 className="font-bold mb-2 text-blue-400">Is there a cost?</h3>
              <p className="text-neural-300">
                All webinars are completely free! We offer these sessions to help you get the most out of our platform.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
