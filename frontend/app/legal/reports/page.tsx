'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Mail, Shield, AlertTriangle, FileText } from 'lucide-react'

interface FormData {
  name: string
  email: string
  reportType: string
  severity: string
  description: string
  evidence: string
  agentName: string
  timestamp: string
  actions: string
  contactPreference: string
  agreeToTerms: boolean
}

interface FormErrors {
  [key: string]: string
}

export default function ReportsPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    reportType: 'inappropriate-content',
    severity: 'medium',
    description: '',
    evidence: '',
    agentName: '',
    timestamp: '',
    actions: '',
    contactPreference: 'email',
    agreeToTerms: false
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reportTypes = [
    { value: 'inappropriate-content', label: 'Inappropriate Content' },
    { value: 'abuse', label: 'Abuse or Harassment' },
    { value: 'misuse', label: 'Misuse of Service' },
    { value: 'security', label: 'Security Vulnerability' },
    { value: 'false-information', label: 'False Information' },
    { value: 'scam', label: 'Scam or Fraud' },
    { value: 'other', label: 'Other' }
  ]

  const severityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ]

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a detailed description of the issue'
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Description must be at least 50 characters'
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the legal disclaimer'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSubmitted(true)
        setFormData({
          name: '',
          email: '',
          reportType: 'inappropriate-content',
          severity: 'medium',
          description: '',
          evidence: '',
          agentName: '',
          timestamp: '',
          actions: '',
          contactPreference: 'email',
          agreeToTerms: false
        })

        setTimeout(() => {
          setSubmitted(false)
        }, 5000)
      } else {
        setErrors({ submit: 'Failed to submit report. Please try again.' })
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again later.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Report Inappropriate Activity</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Help us maintain a safe and trustworthy platform. Report any misuse, inappropriate content, or violations of our policies.
          </p>
        </div>
      </section>

      {/* Overview Section */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-neural-200 rounded-lg p-6 hover:border-red-400 transition-all shadow-lg">
              <Shield className="w-8 h-8 text-red-500 mb-3" />
              <h3 className="text-lg font-bold text-neural-900 mb-2">Your Safety Matters</h3>
              <p className="text-neural-600">
                We take all reports seriously and investigate them thoroughly to protect our community.
              </p>
            </div>

            <div className="bg-white border border-neural-200 rounded-lg p-6 hover:border-orange-400 transition-all shadow-lg">
              <FileText className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="text-lg font-bold text-neural-900 mb-2">Detailed Documentation</h3>
              <p className="text-neural-600">
                Provide as much detail as possible to help us understand and resolve the issue quickly.
              </p>
            </div>

            <div className="bg-white border border-neural-200 rounded-lg p-6 hover:border-yellow-400 transition-all shadow-lg">
              <Mail className="w-8 h-8 text-yellow-500 mb-3" />
              <h3 className="text-lg font-bold text-neural-900 mb-2">Confidential Handling</h3>
              <p className="text-neural-600">
                Your report will be handled confidentially and processed by our trust and safety team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Report Form Section */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl">
          <div className="bg-white border border-neural-200 rounded-lg p-8 shadow-lg">
            {submitted && (
              <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-green-700 mb-1">Report Submitted Successfully</h3>
                  <p className="text-green-700">
                    Thank you for your report. Our team will review it and take appropriate action. You will be contacted via your preferred method if we need additional information.
                  </p>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg flex gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-red-700 mb-1">Submission Error</h3>
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-neural-900 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className={`w-full px-4 py-3 bg-neural-50 border ${
                      errors.name ? 'border-red-500' : 'border-neural-300'
                    } rounded-lg text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-neural-900 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className={`w-full px-4 py-3 bg-neural-50 border ${
                      errors.email ? 'border-red-500' : 'border-neural-300'
                    } rounded-lg text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Report Type and Severity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="reportType" className="block text-sm font-semibold text-neural-900 mb-2">
                    Report Type *
                  </label>
                  <select
                    id="reportType"
                    name="reportType"
                    value={formData.reportType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-neural-50 border border-neural-300 rounded-lg text-neural-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  >
                    {reportTypes.map(type => (
                      <option key={type.value} value={type.value} className="bg-white">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="severity" className="block text-sm font-semibold text-neural-900 mb-2">
                    Severity Level *
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-neural-50 border border-neural-300 rounded-lg text-neural-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  >
                    {severityLevels.map(level => (
                      <option key={level.value} value={level.value} className="bg-white">
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agent Name and Timestamp */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="agentName" className="block text-sm font-semibold text-neural-900 mb-2">
                    Agent Name Involved (if applicable)
                  </label>
                  <input
                    type="text"
                    id="agentName"
                    name="agentName"
                    value={formData.agentName}
                    onChange={handleInputChange}
                    placeholder="e.g., Tech Wizard, Chef Biew"
                    className="w-full px-4 py-3 bg-neural-50 border border-neural-300 rounded-lg text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>

                <div>
                  <label htmlFor="timestamp" className="block text-sm font-semibold text-neural-900 mb-2">
                    When Did This Occur?
                  </label>
                  <input
                    type="datetime-local"
                    id="timestamp"
                    name="timestamp"
                    value={formData.timestamp}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-neural-50 border border-neural-300 rounded-lg text-neural-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-neural-900 mb-2">
                  Detailed Description of the Issue * <span className="text-neural-500">(minimum 50 characters)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Please provide a clear and detailed description of the inappropriate activity or misuse you are reporting. Include specific examples and context that will help us understand the issue."
                  rows={5}
                  className={`w-full px-4 py-3 bg-neural-50 border ${
                    errors.description ? 'border-red-500' : 'border-neural-300'
                  } rounded-lg text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none`}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className={`text-sm ${errors.description ? 'text-red-600' : 'text-neural-500'}`}>
                    {formData.description.length} characters
                  </p>
                  {errors.description && (
                    <p className="text-red-600 text-sm">{errors.description}</p>
                  )}
                </div>
              </div>

              {/* Evidence */}
              <div>
                <label htmlFor="evidence" className="block text-sm font-semibold text-neural-900 mb-2">
                  Evidence or Screenshots (URLs or descriptions)
                </label>
                <textarea
                  id="evidence"
                  name="evidence"
                  value={formData.evidence}
                  onChange={handleInputChange}
                  placeholder="Provide links to screenshots, chat logs, or other evidence that supports your report. You can also describe what you saw or provide relevant details."
                  rows={4}
                  className="w-full px-4 py-3 bg-neural-50 border border-neural-300 rounded-lg text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                />
              </div>

              {/* Previous Actions */}
              <div>
                <label htmlFor="actions" className="block text-sm font-semibold text-neural-900 mb-2">
                  Actions Already Taken (if any)
                </label>
                <textarea
                  id="actions"
                  name="actions"
                  value={formData.actions}
                  onChange={handleInputChange}
                  placeholder="Have you already blocked the user, reported them elsewhere, or taken any other action? Please describe."
                  rows={3}
                  className="w-full px-4 py-3 bg-neural-50 border border-neural-300 rounded-lg text-neural-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                />
              </div>

              {/* Contact Preference */}
              <div>
                <label htmlFor="contactPreference" className="block text-sm font-semibold text-neural-900 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  id="contactPreference"
                  name="contactPreference"
                  value={formData.contactPreference}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-neural-50 border border-neural-300 rounded-lg text-neural-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                >
                  <option value="email" className="bg-white">Email</option>
                  <option value="phone" className="bg-white">Phone</option>
                  <option value="no-contact" className="bg-white">Anonymous Report (No Follow-up Needed)</option>
                </select>
              </div>

              {/* Legal Disclaimer */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-red-700 mb-3">Legal Disclaimer</h3>
                    <p className="text-red-700 text-sm leading-relaxed mb-4">
                      By submitting this report, you acknowledge that:
                    </p>
                    <ul className="space-y-2 text-red-700 text-sm mb-4">
                      <li className="flex gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>You are providing truthful and accurate information to the best of your knowledge</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>You understand that submitting false or malicious reports is prohibited</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>You may be held legally liable for knowingly filing false reports or providing false information</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>False reports may result in legal action, including but not limited to civil litigation and criminal prosecution</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>Our team will investigate all reports and may share information with law enforcement if necessary</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>You grant us permission to use the information provided in your report for investigation and prevention purposes</span>
                      </li>
                    </ul>
                    <p className="text-red-700 text-sm italic">
                      We take false reports very seriously. By submitting this form, you accept full responsibility for the accuracy of the information provided. Deliberate false reporting is a serious matter that may result in legal consequences.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 accent-red-600 cursor-pointer"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-neural-700 cursor-pointer flex-1">
                  <span className="text-red-600 font-semibold">I acknowledge and agree</span> that I understand the legal disclaimer above and certify that the information I have provided in this report is true and accurate to the best of my knowledge. I understand the legal consequences of submitting false information. *
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-red-600 text-sm">{errors.agreeToTerms}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>

              <p className="text-center text-neural-500 text-sm">
                Your report will be reviewed by our trust and safety team within 24-48 hours.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl">
          <h2 className="text-3xl font-bold text-neural-900 mb-8 text-center">Frequently Asked Questions</h2>

          <div className="space-y-4">
            <details className="bg-white border border-neural-200 rounded-lg p-6 open:border-red-400 cursor-pointer shadow-sm">
              <summary className="flex items-center gap-3 font-semibold text-neural-900 cursor-pointer">
                <span className="text-red-500 text-lg">+</span>
                <span>Will my identity be kept confidential?</span>
              </summary>
              <p className="text-neural-600 mt-4">
                Yes, we handle all reports confidentially. Your identity will only be shared with law enforcement if required by law, and only after thorough investigation. We keep reporter information strictly private.
              </p>
            </details>

            <details className="bg-white border border-neural-200 rounded-lg p-6 open:border-red-400 cursor-pointer shadow-sm">
              <summary className="flex items-center gap-3 font-semibold text-neural-900 cursor-pointer">
                <span className="text-red-500 text-lg">+</span>
                <span>What happens after I submit a report?</span>
              </summary>
              <p className="text-neural-600 mt-4">
                Our trust and safety team reviews each report within 24-48 hours. We investigate the details provided and may contact you for additional information if needed. Based on our findings, we take appropriate action which may include warnings, suspensions, or permanent bans.
              </p>
            </details>

            <details className="bg-white border border-neural-200 rounded-lg p-6 open:border-red-400 cursor-pointer shadow-sm">
              <summary className="flex items-center gap-3 font-semibold text-neural-900 cursor-pointer">
                <span className="text-red-500 text-lg">+</span>
                <span>Can I report anonymously?</span>
              </summary>
              <p className="text-neural-600 mt-4">
                Yes! You can select "Anonymous Report (No Follow-up Needed)" as your contact preference. However, providing your contact information helps us reach out if we need clarification or can provide you with updates on the investigation.
              </p>
            </details>

            <details className="bg-white border border-neural-200 rounded-lg p-6 open:border-red-400 cursor-pointer shadow-sm">
              <summary className="flex items-center gap-3 font-semibold text-neural-900 cursor-pointer">
                <span className="text-red-500 text-lg">+</span>
                <span>What types of issues can I report?</span>
              </summary>
              <p className="text-neural-600 mt-4">
                You can report inappropriate content, abuse/harassment, service misuse, security vulnerabilities, false information, scams, fraud, or any other policy violations. Please be as specific as possible about the issue you're reporting.
              </p>
            </details>

            <details className="bg-white border border-neural-200 rounded-lg p-6 open:border-red-400 cursor-pointer shadow-sm">
              <summary className="flex items-center gap-3 font-semibold text-neural-900 cursor-pointer">
                <span className="text-red-500 text-lg">+</span>
                <span>What if I file a false report?</span>
              </summary>
              <p className="text-neural-600 mt-4">
                Filing a false report is a serious matter. By submitting this form, you certify that your information is truthful. We take false reporting very seriously and may pursue legal action against individuals who knowingly file false reports or provide false information, including civil and criminal prosecution.
              </p>
            </details>

            <details className="bg-white border border-neural-200 rounded-lg p-6 open:border-red-400 cursor-pointer shadow-sm">
              <summary className="flex items-center gap-3 font-semibold text-neural-900 cursor-pointer">
                <span className="text-red-500 text-lg">+</span>
                <span>How will you use my report information?</span>
              </summary>
              <p className="text-neural-600 mt-4">
                Your report will be used solely for investigation and prevention purposes. We may share information with law enforcement if required by law and if the report involves illegal activity. Your personal information will not be shared with third parties without your consent, except as required by law.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="container-custom max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need Additional Help?</h2>
          <p className="text-blue-100 mb-8">
            If you prefer to contact our trust and safety team directly, please reach out to us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support/contact-us"
              className="px-8 py-3 bg-white hover:bg-neural-100 text-blue-600 font-semibold rounded-lg transition-all transform hover:scale-105"
            >
              Contact Us
            </a>
            <a
              href="/legal/privacy-policy"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all transform hover:scale-105 border border-white/30"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
