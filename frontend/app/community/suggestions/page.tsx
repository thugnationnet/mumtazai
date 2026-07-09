'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Lightbulb, Send, CheckCircle, ArrowRight, MessageSquare, Zap, Users } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-brand-600 to-accent-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMjBjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTIwIDBjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
            <Lightbulb className="w-5 h-5" />
            Community Ideas
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Share Your Ideas</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Help shape the future of One Last AI. Submit your feature requests, improvements, and ideas to make our platform even better.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-neural-200 shadow-lg p-6 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-neural-900 mb-2">Your Voice Matters</h3>
              <p className="text-neural-600 text-sm">Every suggestion is reviewed by our team and helps prioritize future development.</p>
            </div>
            <div className="bg-white rounded-2xl border border-neural-200 shadow-lg p-6 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-neural-900 mb-2">Community Driven</h3>
              <p className="text-neural-600 text-sm">Vote on and discuss ideas with other community members to show your support.</p>
            </div>
            <div className="bg-white rounded-2xl border border-neural-200 shadow-lg p-6 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-neural-900 mb-2">Quick Updates</h3>
              <p className="text-neural-600 text-sm">Receive notifications when your suggested feature is implemented or discussed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <div className="bg-white rounded-2xl border border-neural-200 shadow-lg overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Thank You for Your Suggestion!</h2>
                <p className="text-white/90 text-lg">
                  Your idea has been submitted successfully. Our team will review it and get back to you soon.
                </p>
              </div>

              <div className="p-8">
                {/* Suggestion Details Card */}
                <div className="bg-neural-50 rounded-xl border border-neural-200 p-6 mb-6">
                  <h3 className="text-xl font-bold text-neural-900 mb-4">Your Suggestion Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-neural-200">
                      <p className="text-neural-500 text-sm mb-1">Suggestion ID</p>
                      <p className="text-xl font-mono font-bold text-blue-600">{suggestionId}</p>
                      <p className="text-xs text-neural-400 mt-2">Save this for reference</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-neural-200">
                      <p className="text-neural-500 text-sm mb-1">Category</p>
                      <p className="text-lg font-semibold text-neural-900 capitalize">
                        {categories.find(c => c.value === formData.category)?.label}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-neural-200">
                      <p className="text-neural-500 text-sm mb-1">Title</p>
                      <p className="text-lg font-semibold text-neural-900">{formData.title}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-neural-200">
                      <p className="text-neural-500 text-sm mb-1">Priority</p>
                      <p className="text-lg font-semibold text-neural-900 capitalize">{formData.priority}</p>
                    </div>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6 mb-6">
                  <h3 className="text-xl font-bold text-neural-900 mb-4">What Happens Next?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">1</div>
                      <div>
                        <p className="font-semibold text-neural-900">Review & Assessment</p>
                        <p className="text-neural-600 text-sm">Our team evaluates your suggestion for feasibility and alignment with our roadmap.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">2</div>
                      <div>
                        <p className="font-semibold text-neural-900">Community Voting</p>
                        <p className="text-neural-600 text-sm">The idea appears in our community board where members can vote and discuss it.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">3</div>
                      <div>
                        <p className="font-semibold text-neural-900">Roadmap Integration</p>
                        <p className="text-neural-600 text-sm">Popular ideas get added to our product roadmap and you receive updates on progress.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/community/roadmap" className="flex-1 px-6 py-3 bg-neural-100 hover:bg-gray-200 text-neural-700 rounded-xl font-semibold transition text-center">
                    View Roadmap
                  </Link>
                  <button onClick={handleSubmitAnother} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-500/25">
                    Submit Another
                  </button>
                  <Link href="/community" className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition text-center shadow-lg">
                    Explore Community
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neural-200 shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact Information Section */}
                <div>
                  <h3 className="text-2xl font-bold text-neural-900 mb-4 pb-2 border-b border-neural-200 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">👤</span>
                    About You
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neural-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-neural-50 border border-neural-200 rounded-xl text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neural-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-neural-50 border border-neural-200 rounded-xl text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-neural-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-neural-50 border border-neural-200 rounded-xl text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neural-700 mb-2">Company</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-neural-50 border border-neural-200 rounded-xl text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Your Company"
                      />
                    </div>
                  </div>
                </div>

                {/* Suggestion Details Section */}
                <div>
                  <h3 className="text-2xl font-bold text-neural-900 mb-4 pb-2 border-b border-neural-200 flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">💡</span>
                    Your Suggestion
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neural-700 mb-2">Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-neural-50 border border-neural-200 rounded-xl text-neural-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neural-700 mb-2">Priority *</label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-neural-50 border border-neural-200 rounded-xl text-neural-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                    <label className="block text-sm font-semibold text-neural-700 mb-2">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      className="w-full px-4 py-3 bg-neural-50 border border-neural-200 rounded-xl text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Brief title of your idea"
                    />
                    <p className="text-xs text-neural-400 mt-1">{formData.title.length}/100</p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-neural-700 mb-2">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      maxLength={2000}
                      rows={6}
                      className="w-full px-4 py-3 bg-neural-50 border border-neural-200 rounded-xl text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      placeholder="Describe your suggestion in detail. What problem does it solve? How would it improve One Last AI?"
                    />
                    <p className="text-xs text-neural-400 mt-1">{formData.description.length}/2000</p>
                  </div>
                </div>

                {/* Attachments Section */}
                <div>
                  <h3 className="text-2xl font-bold text-neural-900 mb-4 pb-2 border-b border-neural-200 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">📎</span>
                    Attachments (Optional)
                  </h3>

                  <div className="bg-neural-50 border-2 border-dashed border-neural-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition">
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
                        <p className="font-semibold text-neural-900 mb-1">Click to upload mockups or screenshots</p>
                        <p className="text-sm text-neural-500">PNG, JPG, PDF, Sketch, Figma up to 10MB</p>
                      </div>
                    </label>
                  </div>

                  {/* Upload Progress */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-neural-700 mb-2">Uploading... {uploadProgress}%</p>
                      <div className="w-full bg-neural-200 rounded-full h-2">
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
                      <p className="text-sm font-semibold text-neural-700 mb-2">Attached Files ({formData.attachments.length}):</p>
                      <div className="space-y-2">
                        {formData.attachments.map((file, idx) => (
                          <div key={idx} className="bg-neural-50 p-3 rounded-xl border border-neural-200 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-lg">📎</span>
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-neural-900">{file.name}</p>
                                <p className="text-xs text-neural-500">{(file.size / 1024).toFixed(2)} KB</p>
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
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border border-amber-200">
                  <p className="text-sm text-neural-700 mb-2 font-semibold flex items-center gap-2">
                    <span>💡</span> Pro Tips:
                  </p>
                  <ul className="text-sm text-neural-600 space-y-1.5 ml-6">
                    <li>• Be specific about the problem and your proposed solution</li>
                    <li>• Include examples of how this would improve your workflow</li>
                    <li>• Attach mockups or screenshots if they help explain your idea</li>
                    <li>• Check the roadmap to avoid duplicate suggestions</li>
                  </ul>
                </div>

                {/* Terms & Submit */}
                <div className="bg-neural-50 p-4 rounded-xl border border-neural-200">
                  <p className="text-sm text-neural-600 flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    By submitting this suggestion, you agree that your idea may be implemented, discussed publicly, or used to improve One Last AI.
                  </p>
                </div>

                {/* Submit Button */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
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
              <div className="mt-10 pt-8 border-t border-neural-200">
                <h3 className="text-xl font-bold text-neural-900 mb-6 text-center">What Happens with Your Suggestion?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 text-center">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📋</span>
                    </div>
                    <p className="font-semibold text-neural-900">Review</p>
                    <p className="text-sm text-neural-600 mt-2">Our team reviews and evaluates your suggestion</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100 text-center">
                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🗳️</span>
                    </div>
                    <p className="font-semibold text-neural-900">Vote</p>
                    <p className="text-sm text-neural-600 mt-2">Community members can vote on ideas</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100 text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🚀</span>
                    </div>
                    <p className="font-semibold text-neural-900">Build</p>
                    <p className="text-sm text-neural-600 mt-2">Popular ideas make it to our roadmap</p>
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
