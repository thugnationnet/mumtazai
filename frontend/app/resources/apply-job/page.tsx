'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface FormData {
  // Step 1: Personal Info
  fullName: string
  email: string
  contactNumber: string
  address: string
  age: string
  
  // Step 2: Experience
  currentPosition: string
  yearsExperience: string
  expertise: string[]
  
  // Step 3: Work History
  workHistory: Array<{
    company: string
    position: string
    duration: string
    description: string
  }>
  
  // Step 4: Document Upload
  resumeFile: File | null
  coverLetterFile: File | null
  portfolioUrl: string
  
  // Step 5: Additional Info
  additionalInfo: string
  expectations: string
}

function ApplyJobPageContent() {
  const searchParams = useSearchParams()
  const position = searchParams?.get('position') || 'Software Engineer'
  const jobId = searchParams?.get('id') || 'unknown'
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    contactNumber: '',
    address: '',
    age: '',
    currentPosition: '',
    yearsExperience: '',
    expertise: [],
    workHistory: [{ company: '', position: '', duration: '', description: '' }],
    resumeFile: null,
    coverLetterFile: null,
    portfolioUrl: '',
    additionalInfo: '',
    expectations: '',
  })

  const totalSteps = 5

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files[0]) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }))
    }
  }

  const handleExpertiseToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(skill)
        ? prev.expertise.filter(s => s !== skill)
        : [...prev.expertise, skill]
    }))
  }

  const handleWorkHistoryChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      workHistory: prev.workHistory.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addWorkHistory = () => {
    setFormData(prev => ({
      ...prev,
      workHistory: [...prev.workHistory, { company: '', position: '', duration: '', description: '' }]
    }))
  }

  const removeWorkHistory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workHistory: prev.workHistory.filter((_, i) => i !== index)
    }))
  }

  const validateStep = (): boolean => {
    setError('')
    
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        setError('Full name is required')
        return false
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Valid email is required')
        return false
      }
      if (!formData.contactNumber.trim()) {
        setError('Contact number is required')
        return false
      }
      if (!formData.address.trim()) {
        setError('Address is required')
        return false
      }
      if (!formData.age || parseInt(formData.age) < 18) {
        setError('Age must be 18 or older')
        return false
      }
    }

    if (currentStep === 2) {
      if (!formData.currentPosition.trim()) {
        setError('Current position is required')
        return false
      }
      if (!formData.yearsExperience) {
        setError('Years of experience is required')
        return false
      }
      if (formData.expertise.length === 0) {
        setError('Please select at least one area of expertise')
        return false
      }
    }

    if (currentStep === 3) {
      if (formData.workHistory.some(item => !item.company || !item.position || !item.duration)) {
        setError('All work history fields must be filled')
        return false
      }
    }

    if (currentStep === 4) {
      if (!formData.resumeFile) {
        setError('Resume upload is required')
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
        window.scrollTo(0, 0)
      }
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('position', position)
      formDataToSend.append('jobId', jobId)
      formDataToSend.append('fullName', formData.fullName)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('contactNumber', formData.contactNumber)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('age', formData.age)
      formDataToSend.append('currentPosition', formData.currentPosition)
      formDataToSend.append('yearsExperience', formData.yearsExperience)
      formDataToSend.append('expertise', JSON.stringify(formData.expertise))
      formDataToSend.append('workHistory', JSON.stringify(formData.workHistory))
      formDataToSend.append('portfolioUrl', formData.portfolioUrl)
      formDataToSend.append('additionalInfo', formData.additionalInfo)
      formDataToSend.append('expectations', formData.expectations)

      if (formData.resumeFile) {
        formDataToSend.append('resume', formData.resumeFile)
      }
      if (formData.coverLetterFile) {
        formDataToSend.append('coverLetter', formData.coverLetterFile)
      }

      const response = await fetch('/api/job-applications', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to submit application')
      }

      setSubmitted(true)
      setSuccess('Application submitted successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-neural-800 mb-4">Application Submitted!</h2>
          <p className="text-neural-600 mb-6">
            Thank you for applying for the <span className="font-bold">{position}</span> position. We'll review your application and get back to you soon.
          </p>
          <p className="text-sm text-neural-500 mb-8">
            A confirmation email has been sent to <span className="font-semibold">{formData.email}</span>
          </p>
          <Link
            href="/resources/careers"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            Back to Careers
          </Link>
        </div>
      </div>
    )
  }

  const expertiseOptions = [
    'React',
    'Node.js',
    'TypeScript',
    'Python',
    'AI/ML',
    'DevOps',
    'Cloud (AWS/GCP)',
    'Sales',
    'Marketing',
    'Product Management',
    'Leadership',
    'Customer Success'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Apply for {position}</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">Complete the form below to submit your application</p>
        </div>
      </section>

      <div className="section-padding">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/resources/careers" className="text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Careers
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-neural-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-neural-600">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-neural-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-accent-600 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neural-800 mb-6">Personal Information</h2>
              
              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neural-800 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neural-800 mb-2">Contact Number *</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-2">Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                  placeholder="Your street address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-2">Age *</label>
                <input
                  type="number"
                  name="age"
                  min="18"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                  placeholder="18"
                />
              </div>
            </div>
          )}

          {/* Step 2: Experience */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neural-800 mb-6">Professional Experience</h2>
              
              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-2">Current Position *</label>
                <input
                  type="text"
                  name="currentPosition"
                  value={formData.currentPosition}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-2">Years of Experience *</label>
                <select
                  name="yearsExperience"
                  value={formData.yearsExperience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                >
                  <option value="">Select experience level</option>
                  <option value="0-1">0-1 years</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-4">Areas of Expertise *</label>
                <div className="grid grid-cols-2 gap-3">
                  {expertiseOptions.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleExpertiseToggle(skill)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        formData.expertise.includes(skill)
                          ? 'bg-brand-600 text-white'
                          : 'bg-neural-100 text-neural-700 hover:bg-neural-200'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Work History */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neural-800 mb-6">Work History</h2>
              
              {formData.workHistory.map((history, index) => (
                <div key={index} className="border-2 border-neural-200 rounded-lg p-6 bg-neural-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-neural-800">Position {index + 1}</h3>
                    {formData.workHistory.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWorkHistory(index)}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neural-800 mb-2">Company *</label>
                      <input
                        type="text"
                        value={history.company}
                        onChange={(e) => handleWorkHistoryChange(index, 'company', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                        placeholder="Company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neural-800 mb-2">Position *</label>
                      <input
                        type="text"
                        value={history.position}
                        onChange={(e) => handleWorkHistoryChange(index, 'position', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                        placeholder="Job title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neural-800 mb-2">Duration *</label>
                      <input
                        type="text"
                        value={history.duration}
                        onChange={(e) => handleWorkHistoryChange(index, 'duration', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                        placeholder="e.g., Jan 2020 - Dec 2023"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neural-800 mb-2">Description</label>
                      <textarea
                        value={history.description}
                        onChange={(e) => handleWorkHistoryChange(index, 'description', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                        placeholder="Briefly describe your responsibilities and achievements"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addWorkHistory}
                className="px-4 py-2 border-2 border-brand-600 text-brand-600 font-semibold rounded-lg hover:bg-brand-50 transition-all"
              >
                + Add Another Position
              </button>
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neural-800 mb-6">Documents & Portfolio</h2>
              
              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-2">Resume/CV *</label>
                <label className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-neural-300 rounded-lg cursor-pointer hover:border-brand-600 hover:bg-brand-50 transition-all">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-neural-600" />
                    <div>
                      <p className="font-semibold text-neural-800">
                        {formData.resumeFile ? formData.resumeFile.name : 'Click to upload resume'}
                      </p>
                      <p className="text-xs text-neural-600">PDF, DOC, DOCX (Max 5MB)</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    name="resumeFile"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-2">Cover Letter (Optional)</label>
                <label className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-neural-300 rounded-lg cursor-pointer hover:border-brand-600 hover:bg-brand-50 transition-all">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-neural-600" />
                    <div>
                      <p className="font-semibold text-neural-800">
                        {formData.coverLetterFile ? formData.coverLetterFile.name : 'Click to upload cover letter'}
                      </p>
                      <p className="text-xs text-neural-600">PDF, DOC, DOCX (Max 5MB)</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    name="coverLetterFile"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-2">Portfolio URL (Optional)</label>
                <input
                  type="url"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>
          )}

          {/* Step 5: Additional Information */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neural-800 mb-6">Additional Information</h2>
              
              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-2">Tell us about your experience</label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                  placeholder="Share any additional information about your skills, projects, or achievements..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neural-800 mb-2">What are your salary expectations?</label>
                <textarea
                  name="expectations"
                  value={formData.expectations}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-neural-200 rounded-lg focus:outline-none focus:border-brand-600 transition-colors"
                  placeholder="Salary range and any other expectations..."
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                <p className="text-sm text-neural-700">
                  <span className="font-semibold">Ready to submit?</span> Click the "Submit Application" button below to send your application to our HR team.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t border-neural-200">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border-2 border-neural-300 text-neural-800 font-bold rounded-lg hover:border-brand-600 hover:text-brand-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}

export default function ApplyJobPage() {
  return (
    <Suspense fallback={null}>
      <ApplyJobPageContent />
    </Suspense>
  )
}
