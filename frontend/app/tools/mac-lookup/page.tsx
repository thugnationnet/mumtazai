'use client'

import { useState } from 'react'
import { ArrowLeft, Cpu, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function MACLookupPage() {
  const [mac, setMac] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<any>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mac.trim()) {
      setError('Please enter a MAC address')
      return
    }

    setLoading(true)
    setError('')
    setData(null)

    try {
      const response = await fetch('/api/tools/mac-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: mac.trim() })
      })

      const result = await response.json()
      if (!result.success) {
        setError(result.error || 'Failed to lookup MAC address')
        return
      }
      setData(result.data)
    } catch (err) {
      setError('An error occurred while looking up MAC address')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen themed-section-bg">
      {/* Hero Header */}
      <div className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10">
          <Link href="/tools" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-500 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Network Tools
          </Link>
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg">
                <Cpu className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
              MAC Address <span className="text-slate-500">Lookup</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Find manufacturer information for any MAC address
            </p>
          </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Search Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleLookup} className="relative">
            <div className="relative bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-2">
              <Cpu className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={mac}
                onChange={(e) => setMac(e.target.value)}
                placeholder="Enter MAC address (e.g., 00:1A:2B:3C:4D:5E)"
                className="w-full pl-12 pr-36 py-4 bg-white border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-0 transition-all outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !mac.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:from-gray-400 disabled:to-gray-400 rounded-lg font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Looking...</> : <><Cpu className="w-4 h-4" />Lookup</>}
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
        {data && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="neu-info p-6">
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Vendor Information</h2>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Vendor</div>
                  <div className="text-lg text-gray-900 font-semibold">{data.vendor || 'Unknown'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">MAC Address</div>
                  <div className="text-lg font-mono text-gray-900">{data.mac}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        {!data && !loading && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About MAC Lookup</h3>
              <div className="space-y-3 text-gray-600">
                <p>Identify hardware manufacturers from MAC addresses. Perfect for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Identifying unknown devices on your network</li>
                  <li>Network inventory and asset management</li>
                  <li>Security auditing and device verification</li>
                  <li>Troubleshooting network connectivity issues</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
