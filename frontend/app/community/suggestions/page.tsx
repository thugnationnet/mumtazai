'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Lightbulb, Send, CheckCircle, ArrowRight, MessageSquare, Zap, Users } from 'lucide-react'
import CloudflareTurnstile, { useTurnstile } from '@/components/CloudflareTurnstile'

export default function SuggestionsPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    title: '',
    description: '',
    category: 'feature',
    priority: 'medium',
    attachments: [] as File[]
  })

  const [submitted, setSubmitted] = useState(false)
  const [suggestionId, setSuggestionId] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const { onVerify, onExpire, getToken, resetToken } = useTurnstile()

  const categories = [
    { value: 'feature', label: '💡 New Feature' },
    { value: 'improvement', label: '⚡ Improvement' },
    { value: 'integration', label: '🔗 Integration' },
    { value: 'performance', label: '🚀 Performance' },
    { value: 'security', label: '🔒 Security' },
    { value: 'ux', label: '🎨 User Experience' },
    { value: 'documentation', label: '📚 Documentation' },
    { value: 'other', label: '📝 Other' }
  ]

  const priorityLevels = [
    { value: 'low', label: '🟢 Nice to Have' },
    { value: 'medium', label: '🟡 Important' },
    { value: 'high', label: '🔴 Critical' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
    // Simulate upload progress
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 100)
  }

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    const turnstileToken = getToken()
    if (!turnstileToken) {
      setSubmitError('Please complete the verification challenge')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: `${formData.firstName} ${formData.lastName}`.trim(),
          userEmail: formData.email,
          title: formData.title,
          description: formData.company
            ? `${formData.description}\n\nCompany: ${formData.company}`
            : formData.description,
          category: formData.category,
          userPriority: formData.priority,
          isAnonymous: false,
          turnstileToken,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to submit suggestion')
      }

      setSuggestionId(data.suggestion?.suggestionId || '')
      setSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitAnother = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      title: '',
      description: '',
      category: 'feature',
      priority: 'medium',
      attachments: []
    })
    setSubmitted(false)
    setSuggestionId('')
    setUploadProgress(0)
    setSubmitError('')
  }

  return (
    <div className="min-h-full themed-section-bg">
      {/* Hero Header - Glass Pillar Glassmorphism */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        {/* Chrome shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-5">
              <Lightbulb className="w-5 h-5" />
              Community Ideas
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">Share Your Ideas</h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Help shape the future of Mumtaz AI. Submit your feature requests, improvements, and ideas to make our platform even better.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Your Voice Matters</h3>
              <p className="text-slate-500 text-sm">Every suggestion is reviewed by our team and helps prioritize future development.</p>
            </div>
            <div className="glass-card p-6 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Community Driven</h3>
              <p className="text-slate-500 text-sm">Vote on and discuss ideas with other community members to show your support.</p>
            </div>
            <div className="glass-card p-6 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Quick Updates</h3>
              <p className="text-slate-500 text-sm">Receive notifications when your suggested feature is implemented or discussed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <div className="glass-card overflow-hidden">
              {/* Success Header */}
              <div className="relative py-8 px-8 text-center overflow-hidden rounded-t-2xl themed-section-bg">
                <div className="w-20 h-20 bg-white/40 border border-white/60 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-12 h-12 text-purple-600" />
                </div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-2">Thank You for Your Suggestion!</h2>
                <p className="text-slate-600 text-lg">
                  Your idea has been submitted successfully. Our team will review it and get back to you soon.
                </p>
              </div>

              <div className="p-8">
                {/* Suggestion Details Card */}
                <div className="bg-transparent rounded-xl border border-white/80 p-6 mb-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Your Suggestion Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-4">
                      <p className="text-slate-400 text-sm mb-1">Suggestion ID</p>
                      <p className="text-xl font-mono font-bold text-blue-600">{suggestionId}</p>
                      <p className="text-xs text-slate-400 mt-2">Save this for reference</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-slate-400 text-sm mb-1">Category</p>
                      <p className="text-lg font-semibold text-slate-800 capitalize">
                        {categories.find(c => c.value === formData.category)?.label}
                      </p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-slate-400 text-sm mb-1">Title</p>
                      <p className="text-lg font-semibold text-slate-800">{formData.title}</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-slate-400 text-sm mb-1">Priority</p>
                      <p className="text-lg font-semibold text-slate-800 capitalize">{formData.priority}</p>
                    </div>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl p-6 mb-6 shadow-[0_4px_20px_rgba(139,92,246,0.08)]">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">What Happens Next?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-white/40 border border-white/60 rounded-full shadow-lg flex items-center justify-center text-sm font-bold text-purple-600">1</div>
                      <div>
                        <p className="font-semibold text-slate-800">Review & Assessment</p>
                        <p className="text-slate-500 text-sm">Our team evaluates your suggestion for feasibility and alignment with our roadmap.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-white/40 border border-white/60 rounded-full shadow-lg flex items-center justify-center text-sm font-bold text-purple-600">2</div>
                      <div>
                        <p className="font-semibold text-slate-800">Community Voting</p>
                        <p className="text-slate-500 text-sm">The idea appears in our community board where members can vote and discuss it.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-white/40 border border-white/60 rounded-full shadow-lg flex items-center justify-center text-sm font-bold text-purple-600">3</div>
                      <div>
                        <p className="font-semibold text-slate-800">Roadmap Integration</p>
                        <p className="text-slate-500 text-sm">Popular ideas get added to our product roadmap and you receive updates on progress.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/community/roadmap" className="flex-1 px-6 py-3 bg-white/40 hover:bg-gray-200 text-slate-600 rounded-xl font-semibold transition text-center">
                    View Roadmap
                  </Link>
                  <button onClick={handleSubmitAnother} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)]">
                    Submit Another
                  </button>
                  <Link href="/community" className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition text-center shadow-lg">
                    Explore Community
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact Information Section */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-white/80 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">👤</span>
                    About You
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Company</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Your Company"
                      />
                    </div>
                  </div>
                </div>

                {/* Suggestion Details Section */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-white/80 flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">💡</span>
                    Your Suggestion
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Priority *</label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        {priorityLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Brief title of your idea"
                    />
                    <p className="text-xs text-slate-400 mt-1">{formData.title.length}/100</p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      maxLength={2000}
                      rows={6}
                      className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      placeholder="Describe your suggestion in detail. What problem does it solve? How would it improve Mumtaz AI?"
                    />
                    <p className="text-xs text-slate-400 mt-1">{formData.description.length}/2000</p>
                  </div>
                </div>

                {/* Attachments Section */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-white/80 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">📎</span>
                    Attachments (Optional)
                  </h3>

                  <div className="bg-transparent border-2 border-dashed border-white/80 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.gif,.sketch,.fig,.xd"
                      />
                      <div>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">🎨</span>
                        </div>
                        <p className="font-semibold text-slate-800 mb-1">Click to upload mockups or screenshots</p>
                        <p className="text-sm text-slate-400">PNG, JPG, PDF, Sketch, Figma up to 10MB</p>
                      </div>
                    </label>
                  </div>

                  {/* Upload Progress */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Uploading... {uploadProgress}%</p>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Attached Files List */}
                  {formData.attachments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Attached Files ({formData.attachments.length}):</p>
                      <div className="space-y-2">
                        {formData.attachments.map((file, idx) => (
                          <div key={idx} className="bg-transparent p-3 rounded-xl border border-white/80 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-lg">📎</span>
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-800">{file.name}</p>
                                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm transition font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestion Guidelines */}
                <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl p-5 shadow-[0_4px_20px_rgba(139,92,246,0.08)]">
                  <p className="text-sm text-slate-600 mb-2 font-semibold flex items-center gap-2">
                    <span>💡</span> Pro Tips:
                  </p>
                  <ul className="text-sm text-slate-500 space-y-1.5 ml-6">
                    <li>• Be specific about the problem and your proposed solution</li>
                    <li>• Include examples of how this would improve your workflow</li>
                    <li>• Attach mockups or screenshots if they help explain your idea</li>
                    <li>• Check the roadmap to avoid duplicate suggestions</li>
                  </ul>
                </div>

                {/* Terms & Submit */}
                <div className="bg-transparent p-4 rounded-xl border border-white/80">
                  <p className="text-sm text-slate-500 flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    By submitting this suggestion, you agree that your idea may be implemented, discussed publicly, or used to improve Mumtaz AI.
                  </p>
                </div>

                <CloudflareTurnstile onVerify={onVerify} onExpire={onExpire} className="flex justify-center" />

                {/* Submit Button */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)]"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Your Suggestion
                    </>
                  )}
                </button>
              </form>

              {/* Additional Info */}
              <div className="mt-10 pt-8 border-t border-white/80">
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6 text-center">What Happens with Your Suggestion?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl p-5 text-center shadow-[0_4px_20px_rgba(139,92,246,0.08)]">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📋</span>
                    </div>
                    <p className="font-semibold text-slate-800">Review</p>
                    <p className="text-sm text-slate-500 mt-2">Our team reviews and evaluates your suggestion</p>
                  </div>
                  <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl p-5 text-center shadow-[0_4px_20px_rgba(139,92,246,0.08)]">
                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🗳️</span>
                    </div>
                    <p className="font-semibold text-slate-800">Vote</p>
                    <p className="text-sm text-slate-500 mt-2">Community members can vote on ideas</p>
                  </div>
                  <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl p-5 text-center shadow-[0_4px_20px_rgba(139,92,246,0.08)]">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🚀</span>
                    </div>
                    <p className="font-semibold text-slate-800">Build</p>
                    <p className="text-sm text-slate-500 mt-2">Popular ideas make it to our roadmap</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
