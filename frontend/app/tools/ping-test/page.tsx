'use client'

import { useState } from 'react'
import { Activity, Search, Loader2, XCircle, ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface PingResult {
  host: string
  alive: boolean
  time?: number
  min?: number
  max?: number
  avg?: number
  packetLoss?: number
  packets?: number
}

export default function PingTestPage() {
  const [host, setHost] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PingResult | null>(null)
  const [error, setError] = useState('')

  const handlePing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!host.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/tools/ping-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: host.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Failed to ping host')
      }
    } catch (err) {
      setError('Failed to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  const getLatencyColor = (latency?: number) => {
    if (!latency) return 'neural'
    if (latency < 50) return 'green'
    if (latency < 100) return 'yellow'
    if (latency < 200) return 'orange'
    return 'red'
  }

  const latencyColor = getLatencyColor(result?.avg)

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
                <Activity className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
              Ping <span className="text-blue-200">Test</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Test network connectivity and measure latency
            </p>
          </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-12">

        {/* Ping Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handlePing} className="relative">
            <div className="relative">
              <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-300 rounded-lg font-semibold text-white transition-all flex items-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pinging...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Ping
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
            {/* Status Card */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Host Status</h2>
                  <p className="text-2xl font-mono text-gray-900">{result.host}</p>
                </div>
                <div className={`flex items-center gap-3 px-6 py-3 ${result.alive ? 'bg-green-100' : 'bg-red-100'} rounded-xl`}>
                  {result.alive ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-xl font-bold text-green-600">Online</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span className="text-xl font-bold text-red-600">Offline</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {result.alive && (
              <>
                {/* Latency Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Average */}
                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 bg-${latencyColor}-100 rounded-lg flex items-center justify-center`}>
                        <Clock className={`w-5 h-5 text-${latencyColor}-600`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Average</h3>
                    </div>
                    <p className={`text-3xl font-bold text-${latencyColor}-600`}>
                      {result.avg?.toFixed(2)} ms
                    </p>
                  </div>

                  {/* Min */}
                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Min</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {result.min?.toFixed(2)} ms
                    </p>
                  </div>

                  {/* Max */}
                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Max</h3>
                    </div>
                    <p className="text-3xl font-bold text-red-600">
                      {result.max?.toFixed(2)} ms
                    </p>
                  </div>

                  {/* Packet Loss */}
                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 ${result.packetLoss === 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                        <Activity className={`w-5 h-5 ${result.packetLoss === 0 ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Packet Loss</h3>
                    </div>
                    <p className={`text-3xl font-bold ${result.packetLoss === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.packetLoss?.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Performance Indicator */}
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Assessment</h3>
                  <div className="space-y-3">
                    {result.avg !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600">Latency</span>
                          <span className={`text-${latencyColor}-600 font-semibold`}>
                            {result.avg < 50 ? 'Excellent' : result.avg < 100 ? 'Good' : result.avg < 200 ? 'Fair' : 'Poor'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`bg-${latencyColor}-500 h-2 rounded-full transition-all`}
                            style={{ width: `${Math.min((200 - (result.avg || 0)) / 2, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Info Section */}
        {!result && !loading && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About Ping Test</h3>
              <div className="space-y-3 text-gray-600">
                <p>Ping tests network connectivity by sending packets to a host and measuring response time. This tool helps you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Check if a host is reachable</li>
                  <li>Measure network latency (round-trip time)</li>
                  <li>Detect packet loss</li>
                  <li>Troubleshoot network connectivity issues</li>
                  <li>Monitor network performance</li>
                </ul>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Latency Guide:</strong> {"<"}50ms (Excellent), 50-100ms (Good), 100-200ms (Fair), {">"}200ms (Poor)
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
