'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface DomainCheck {
  domain: string
  available: boolean
  price?: string
}

export default function DomainAvailabilityPage() {
  const [domainInput, setDomainInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<DomainCheck[]>([])

  const extensions = ['.com', '.net', '.org', '.io', '.co', '.ai', '.dev']

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!domainInput.trim()) {
      setError('Please enter a domain name')
      return
    }

    setLoading(true)
    setError('')
    setResults([])

    try {
      // Remove any existing extensions
      const baseDomain = domainInput.trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .replace(/\.(com|net|org|io|co|ai|dev|info|biz)$/i, '')

      const response = await fetch('/api/tools/domain-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: baseDomain })
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to check domain availability')
        return
      }

      setResults(result.data)
    } catch (err: any) {
      setError('An error occurred while checking domain availability')
      console.error('Domain check error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen themed-section-bg">
      {/* Header */}
      <div className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container mx-auto px-4 py-6">
          <Link 
            href="/tools" 
            className="inline-flex items-center text-purple-600 hover:text-purple-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Network Tools
          </Link>
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <Search className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
                Domain Availability Checker
              </h1>
              <p className="text-slate-500 mt-1">
                Check if your desired domain name is available for registration
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Input Form */}
        <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 mb-6">
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                Domain Name (without extension)
              </label>
              <input
                type="text"
                id="domain"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="e.g., myawesomesite"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
              />
              <p className="mt-2 text-sm text-gray-500">
                We'll check availability for popular extensions: {extensions.join(', ')}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking availability...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Check Availability
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-red-700">{error}</div>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              Availability Results
            </h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    result.available 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.available ? (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-lg text-gray-900">{result.domain}</div>
                      <div className={`text-sm ${result.available ? 'text-green-600' : 'text-red-600'}`}>
                        {result.available ? 'Available for registration! 🎉' : 'Already registered'}
                      </div>
                    </div>
                  </div>
                  {result.available && (
                    <a
                      href={`https://www.namecheap.com/domains/registration/results/?domain=${result.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25 transition-all"
                    >
                      Register
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-lg">
          <h3 className="font-semibold text-blue-700 mb-2">About Domain Availability Checker</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            This tool uses the WHOIS XML API Domain Availability service to check if domain names are available for registration 
            across popular TLDs. Get instant results for multiple extensions to find your perfect domain name! 🔍
          </p>
        </div>
      </div>
    </div>
  )
}
