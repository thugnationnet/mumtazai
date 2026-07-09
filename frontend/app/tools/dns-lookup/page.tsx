'use client'

import { useState } from 'react'
import { Globe, Search, Loader2, CheckCircle, XCircle, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface DnsRecord {
  type: string
  value: string
  ttl?: number
  priority?: number
}

interface DnsResult {
  domain: string
  records: {
    A?: DnsRecord[]
    AAAA?: DnsRecord[]
    MX?: DnsRecord[]
    NS?: DnsRecord[]
    TXT?: DnsRecord[]
    CNAME?: DnsRecord[]
    SOA?: any
  }
}

export default function DnsLookupPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DnsResult | null>(null)
  const [error, setError] = useState('')

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domain.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/tools/dns-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Failed to perform DNS lookup')
      }
    } catch (err) {
      setError('Failed to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  const RecordSection = ({ title, records, type }: { title: string, records?: DnsRecord[], type: string }) => {
    if (!records || records.length === 0) return null

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          {title} Records
        </h3>
        <div className="space-y-3">
          {records.map((record, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 mb-1">Value</p>
                  <p className="text-gray-900 font-mono text-sm break-all">{record.value}</p>
                </div>
                {record.ttl && (
                  <div className="flex-shrink-0">
                    <p className="text-sm text-gray-500 mb-1">TTL</p>
                    <p className="text-blue-600 font-semibold">{record.ttl}s</p>
                  </div>
                )}
                {record.priority !== undefined && (
                  <div className="flex-shrink-0">
                    <p className="text-sm text-gray-500 mb-1">Priority</p>
                    <p className="text-blue-600 font-semibold">{record.priority}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link 
            href="/tools"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Network Tools
          </Link>

          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <Globe className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              DNS <span className="text-blue-100">Lookup</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Perform DNS queries and check domain name system records
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-12">

        {/* Search Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleLookup} className="relative">
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
              <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter domain name (e.g., example.com)"
                className="w-full pl-12 pr-32 py-4 bg-white border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-0 transition-all outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !domain.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:from-gray-400 disabled:to-gray-400 rounded-lg font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Lookup
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Domain Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Domain Information</h2>
              </div>
              <p className="text-2xl font-mono text-gray-900">{result.domain}</p>
            </div>

            {/* DNS Records */}
            <RecordSection title="A (IPv4 Address)" records={result.records.A} type="A" />
            <RecordSection title="AAAA (IPv6 Address)" records={result.records.AAAA} type="AAAA" />
            <RecordSection title="MX (Mail Exchange)" records={result.records.MX} type="MX" />
            <RecordSection title="NS (Name Server)" records={result.records.NS} type="NS" />
            <RecordSection title="TXT (Text)" records={result.records.TXT} type="TXT" />
            <RecordSection title="CNAME (Canonical Name)" records={result.records.CNAME} type="CNAME" />

            {/* SOA Record */}
            {result.records.SOA && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  SOA (Start of Authority) Record
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(result.records.SOA).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">{key}</p>
                      <p className="text-gray-900 font-mono text-sm">{String(value)}</p>
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
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About DNS Lookup</h3>
              <div className="space-y-3 text-gray-600">
                <p>DNS (Domain Name System) translates human-readable domain names into IP addresses. This tool helps you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Query A, AAAA, MX, NS, TXT, and CNAME records</li>
                  <li>Check mail server configuration (MX records)</li>
                  <li>View name servers for a domain</li>
                  <li>Inspect TXT records for SPF, DKIM, and verification</li>
                  <li>Verify DNS propagation</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
