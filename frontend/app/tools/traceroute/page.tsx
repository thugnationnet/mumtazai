'use client'

import { useState } from 'react'
import { RouteIcon, Search, Loader2, XCircle, ArrowLeft, MapPin } from 'lucide-react'
import Link from 'next/link'

interface Hop {
  hop: number
  ip?: string
  hostname?: string
  rtt1?: number
  rtt2?: number
  rtt3?: number
  avgRtt?: number
}

interface TracerouteResult {
  destination: string
  hops: Hop[]
  completed: boolean
}

export default function TraceroutePage() {
  const [host, setHost] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TracerouteResult | null>(null)
  const [error, setError] = useState('')

  const handleTraceroute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!host.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/tools/traceroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: host.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Failed to perform traceroute')
      }
    } catch (err) {
      setError('Failed to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  const getRttColor = (rtt?: number) => {
    if (!rtt) return 'text-gray-400'
    if (rtt < 50) return 'text-green-600'
    if (rtt < 100) return 'text-yellow-600'
    if (rtt < 200) return 'text-orange-600'
    return 'text-red-600'
  }

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
                <RouteIcon className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
              <span className="text-yellow-200">Traceroute</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Trace the network path to a destination
            </p>
          </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-12">

        {/* Traceroute Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleTraceroute} className="relative">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="Enter hostname or IP address (e.g., google.com)"
                className="w-full pl-12 pr-32 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none shadow-lg"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !host.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-300 rounded-lg font-semibold text-white transition-all flex items-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Tracing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Trace
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
        {result && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Destination Card */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Destination</h2>
                  <p className="text-2xl font-mono text-gray-900">{result.destination}</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center px-6 py-3 bg-yellow-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Total Hops</p>
                    <p className="text-2xl font-bold text-yellow-600">{result.hops.length}</p>
                  </div>
                  <div className={`text-center px-6 py-3 ${result.completed ? 'bg-green-100' : 'bg-red-100'} rounded-xl`}>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className={`text-sm font-bold ${result.completed ? 'text-green-600' : 'text-red-600'}`}>
                      {result.completed ? 'Completed' : 'Incomplete'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hops */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Route Hops</h3>
              <div className="space-y-3">
                {result.hops.map((hop, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <span className="text-yellow-600 font-bold">{hop.hop}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {hop.ip ? (
                            <>
                              <p className="text-gray-900 font-mono text-sm truncate">{hop.ip}</p>
                              {hop.hostname && hop.hostname !== hop.ip && (
                                <p className="text-gray-500 text-xs mt-1 truncate">{hop.hostname}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-400 text-sm">* * * Request timed out</p>
                          )}
                        </div>
                      </div>
                      
                      {hop.avgRtt && (
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Round Trip Time</p>
                            <div className="flex gap-2">
                              {hop.rtt1 && (
                                <span className={`text-sm font-mono ${getRttColor(hop.rtt1)}`}>
                                  {hop.rtt1.toFixed(1)}ms
                                </span>
                              )}
                              {hop.rtt2 && (
                                <span className={`text-sm font-mono ${getRttColor(hop.rtt2)}`}>
                                  {hop.rtt2.toFixed(1)}ms
                                </span>
                              )}
                              {hop.rtt3 && (
                                <span className={`text-sm font-mono ${getRttColor(hop.rtt3)}`}>
                                  {hop.rtt3.toFixed(1)}ms
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-center px-4 py-2 bg-white border border-gray-200 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Avg</p>
                            <p className={`text-lg font-bold ${getRttColor(hop.avgRtt)}`}>
                              {hop.avgRtt.toFixed(1)}ms
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        {!result && !loading && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About Traceroute</h3>
              <div className="space-y-3 text-gray-600">
                <p>Traceroute shows the path network packets take to reach a destination. This tool helps you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Identify the route to a destination</li>
                  <li>Locate network bottlenecks</li>
                  <li>Troubleshoot connectivity issues</li>
                  <li>Measure latency at each hop</li>
                  <li>Identify routing problems</li>
                </ul>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Some routers may not respond to traceroute requests, resulting in timeouts (*).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
