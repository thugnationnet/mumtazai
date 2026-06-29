'use client'

import { useState } from 'react'
import { Shield, Search, Loader2, XCircle, ArrowLeft, CheckCircle, AlertTriangle, Calendar, Globe } from 'lucide-react'
import Link from 'next/link'

interface SslResult {
  domain: string
  valid: boolean
  issuer?: string
  subject?: string
  validFrom?: string
  validTo?: string
  daysRemaining?: number
  serialNumber?: string
  signatureAlgorithm?: string
  keySize?: number
  protocol?: string
  subjectAltNames?: string[]
  warning?: string
}

export default function SslCheckerPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SslResult | null>(null)
  const [error, setError] = useState('')

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domain.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/tools/ssl-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Failed to check SSL certificate')
      }
    } catch (err) {
      setError('Failed to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  const getCertificateStatus = () => {
    if (!result) return null
    
    if (!result.valid) {
      return { color: 'red', text: 'Invalid', icon: XCircle }
    }
    
    if (result.daysRemaining !== undefined) {
      if (result.daysRemaining < 0) {
        return { color: 'red', text: 'Expired', icon: XCircle }
      } else if (result.daysRemaining < 30) {
        return { color: 'yellow', text: 'Expiring Soon', icon: AlertTriangle }
      }
    }
    
    return { color: 'green', text: 'Valid', icon: CheckCircle }
  }

  const status = getCertificateStatus()

  return (
    <div className="min-h-screen themed-section-bg">
      {/* Header */}
      <header className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 py-8">
          <Link 
            href="/tools"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-500 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Network Tools
          </Link>
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">

          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
              SSL Certificate <span className="text-teal-200">Checker</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Verify SSL/TLS certificate validity and security
            </p>
          </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-12">

        {/* Search Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleCheck} className="relative">
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter domain name (e.g., example.com)"
                className="w-full pl-12 pr-32 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none shadow-lg"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !domain.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-gray-300 disabled:to-gray-300 rounded-lg font-semibold text-white transition-all flex items-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Check
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && status && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Status Card */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Certificate Status</h2>
                  <p className="text-2xl font-mono text-gray-900">{result.domain}</p>
                </div>
                <div className={`flex items-center gap-3 px-6 py-3 bg-${status.color}-100 rounded-xl`}>
                  <status.icon className={`w-6 h-6 text-${status.color}-600`} />
                  <span className={`text-xl font-bold text-${status.color}-600`}>{status.text}</span>
                </div>
              </div>
              
              {result.daysRemaining !== undefined && result.daysRemaining >= 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-900">{result.daysRemaining}</span> days until expiration
                  </p>
                </div>
              )}

              {result.warning && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-700 text-sm">{result.warning}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Issuer */}
              {result.issuer && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Issued By</h3>
                  <p className="text-gray-700">{result.issuer}</p>
                </div>
              )}

              {/* Subject */}
              {result.subject && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Issued To</h3>
                  <p className="text-gray-700">{result.subject}</p>
                </div>
              )}

              {/* Valid From */}
              {result.validFrom && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Valid From</h3>
                  </div>
                  <p className="text-gray-700">{new Date(result.validFrom).toLocaleString()}</p>
                </div>
              )}

              {/* Valid To */}
              {result.validTo && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Valid To</h3>
                  </div>
                  <p className="text-gray-700">{new Date(result.validTo).toLocaleString()}</p>
                </div>
              )}

              {/* Serial Number */}
              {result.serialNumber && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Serial Number</h3>
                  <p className="text-gray-700 font-mono text-sm break-all">{result.serialNumber}</p>
                </div>
              )}

              {/* Signature Algorithm */}
              {result.signatureAlgorithm && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Signature Algorithm</h3>
                  <p className="text-gray-700">{result.signatureAlgorithm}</p>
                </div>
              )}

              {/* Key Size */}
              {result.keySize && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Size</h3>
                  <p className="text-gray-700">{result.keySize} bits</p>
                </div>
              )}

              {/* Protocol */}
              {result.protocol && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Protocol</h3>
                  <p className="text-gray-700">{result.protocol}</p>
                </div>
              )}
            </div>

            {/* Subject Alternative Names */}
            {result.subjectAltNames && result.subjectAltNames.length > 0 && (
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Alternative Names</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.subjectAltNames.map((name, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-900 font-mono text-sm">{name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        {!result && !loading && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About SSL Certificate Checker</h3>
              <div className="space-y-3 text-gray-600">
                <p>SSL/TLS certificates encrypt data between your browser and a website. This tool helps you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Verify certificate validity and expiration</li>
                  <li>Check certificate issuer and authority</li>
                  <li>View encryption strength and protocol version</li>
                  <li>Inspect subject alternative names (SANs)</li>
                  <li>Identify potential security issues</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
