'use client'

import { useState } from 'react'
import { Scan, Search, Loader2, XCircle, ArrowLeft, CheckCircle, Lock, Unlock } from 'lucide-react'
import Link from 'next/link'

interface PortResult {
  port: number
  status: 'open' | 'closed' | 'filtered'
  service?: string
}

interface ScanResult {
  host: string
  ports: PortResult[]
  scanTime: number
}

export default function PortScannerPage() {
  const [host, setHost] = useState('')
  const [portRange, setPortRange] = useState('21-443')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!host.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/tools/port-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          host: host.trim(),
          portRange: portRange.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Failed to scan ports')
      }
    } catch (err) {
      setError('Failed to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  const commonPorts = [
    { label: 'Common Ports', value: '21,22,23,25,53,80,110,143,443,445,3306,3389,5432,8080,8443' },
    { label: 'Web Ports', value: '80,443,8000,8080,8443,8888' },
    { label: 'All Standard', value: '1-1024' },
    { label: 'Custom Range', value: portRange }
  ]

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
                <Scan className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
              Port <span className="text-green-200">Scanner</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Scan network ports to identify open services
            </p>
          </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-12">

        {/* Scan Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleScan} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="Enter hostname or IP address"
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none shadow-lg"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={portRange}
                onChange={(e) => setPortRange(e.target.value)}
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none shadow-lg"
                disabled={loading}
              >
                {commonPorts.map((preset) => (
                  <option key={preset.label} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={portRange}
                onChange={(e) => setPortRange(e.target.value)}
                placeholder="e.g., 80,443 or 1-1024"
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none shadow-lg"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !host.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-green-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning ports...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Scan
                </>
              )}
            </button>
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
            {/* Summary Card */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Scan Results</h2>
                  <p className="text-2xl font-mono text-gray-900">{result.host}</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center px-6 py-3 bg-green-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Open Ports</p>
                    <p className="text-2xl font-bold text-green-600">
                      {result.ports.filter(p => p.status === 'open').length}
                    </p>
                  </div>
                  <div className="text-center px-6 py-3 bg-gray-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Scan Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {result.scanTime.toFixed(2)}s
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Open Ports */}
            {result.ports.filter(p => p.status === 'open').length > 0 && (
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Unlock className="w-5 h-5 text-green-600" />
                  Open Ports
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.ports
                    .filter(p => p.status === 'open')
                    .map((port, idx) => (
                      <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xl font-bold text-green-600">{port.port}</p>
                            {port.service && (
                              <p className="text-sm text-gray-600 mt-1">{port.service}</p>
                            )}
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Closed/Filtered Ports */}
            {result.ports.filter(p => p.status !== 'open').length > 0 && (
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gray-500" />
                  Closed/Filtered Ports
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.ports
                    .filter(p => p.status !== 'open')
                    .slice(0, 12)
                    .map((port, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-gray-600">{port.port}</p>
                            {port.service && (
                              <p className="text-xs text-gray-400 mt-1">{port.service}</p>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-200 rounded text-gray-500">
                            {port.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                {result.ports.filter(p => p.status !== 'open').length > 12 && (
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    + {result.ports.filter(p => p.status !== 'open').length - 12} more closed/filtered ports
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        {!result && !loading && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About Port Scanner</h3>
              <div className="space-y-3 text-gray-600">
                <p>A port scanner checks which network ports are open on a target system. This tool helps you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Identify running services on a host</li>
                  <li>Check firewall configuration</li>
                  <li>Verify network security</li>
                  <li>Troubleshoot connectivity issues</li>
                  <li>Audit exposed services</li>
                </ul>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Only scan systems you own or have permission to scan. Unauthorized port scanning may be illegal.
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
