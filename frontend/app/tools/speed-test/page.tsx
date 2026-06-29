'use client'

import { useState } from 'react'
import { Zap, Play, Loader2, ArrowLeft, Download, Upload, Activity } from 'lucide-react'
import Link from 'next/link'

interface SpeedTestResult {
  downloadSpeed: number
  uploadSpeed: number
  latency: number
  jitter: number
  server?: string
}

export default function SpeedTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SpeedTestResult | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')

  const handleSpeedTest = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    setProgress(0)

    try {
      // Simulate speed test stages
      setStage('Measuring latency...')
      setProgress(10)
      await new Promise(resolve => setTimeout(resolve, 1000))

      setStage('Testing download speed...')
      setProgress(30)
      
      const response = await fetch('/api/tools/speed-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      setProgress(70)
      setStage('Testing upload speed...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      const data = await response.json()
      setProgress(100)

      if (data.success) {
        setResult(data.data)
        setStage('Complete!')
      } else {
        setError(data.error || 'Failed to perform speed test')
      }
    } catch (err) {
      setError('Failed to connect to the server')
    } finally {
      setLoading(false)
      setProgress(0)
      setStage('')
    }
  }

  const getSpeedColor = (speed: number | null | undefined, type: 'download' | 'upload') => {
    const s = speed ?? 0
    const threshold = type === 'download' ? 25 : 10
    if (s < threshold / 2) return 'red'
    if (s < threshold) return 'yellow'
    return 'green'
  }

  const getLatencyColor = (latency: number | null | undefined) => {
    const l = latency ?? 0
    if (l < 50) return 'green'
    if (l < 100) return 'yellow'
    return 'red'
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
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
              Internet <span className="text-pink-200">Speed Test</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Test your internet connection speed
            </p>
          </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-12">

        {/* Speed Test Button */}
        {!result && !loading && (
          <div className="max-w-3xl mx-auto mb-12">
            <button
              onClick={handleSpeedTest}
              className="w-full px-8 py-6 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-2xl font-semibold text-xl text-white transition-all flex items-center justify-center gap-3 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40"
            >
              <Play className="w-6 h-6" />
              Start Speed Test
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
              <div className="text-center mb-6">
                <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{stage}</h3>
                <p className="text-gray-600">{progress}% Complete</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-rose-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto mb-12">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Main Speed Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Download Speed */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 bg-${getSpeedColor(result.downloadSpeed, 'download')}-100 rounded-xl flex items-center justify-center`}>
                    <Download className={`w-7 h-7 text-${getSpeedColor(result.downloadSpeed, 'download')}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Download</h3>
                </div>
                <div className="text-center">
                  <p className={`text-5xl font-bold text-${getSpeedColor(result.downloadSpeed, 'download')}-600 mb-2`}>
                    {(result.downloadSpeed ?? 0).toFixed(2)}
                  </p>
                  <p className="text-gray-600 text-lg">Mbps</p>
                </div>
              </div>

              {/* Upload Speed */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 bg-${getSpeedColor(result.uploadSpeed, 'upload')}-100 rounded-xl flex items-center justify-center`}>
                    <Upload className={`w-7 h-7 text-${getSpeedColor(result.uploadSpeed, 'upload')}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Upload</h3>
                </div>
                <div className="text-center">
                  <p className={`text-5xl font-bold text-${getSpeedColor(result.uploadSpeed, 'upload')}-600 mb-2`}>
                    {(result.uploadSpeed ?? 0).toFixed(2)}
                  </p>
                  <p className="text-gray-600 text-lg">Mbps</p>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Latency */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 bg-${getLatencyColor(result.latency)}-100 rounded-lg flex items-center justify-center`}>
                    <Activity className={`w-5 h-5 text-${getLatencyColor(result.latency)}-600`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Latency (Ping)</h3>
                </div>
                <p className={`text-3xl font-bold text-${getLatencyColor(result.latency)}-600`}>
                  {(result.latency ?? 0).toFixed(2)} ms
                </p>
              </div>

              {/* Jitter */}
              {/* Jitter */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Jitter</h3>
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {(result.jitter ?? 0).toFixed(2)} ms
                </p>
              </div>
            </div>

            {/* Server Info */}
            {result.server && (
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Server</h3>
                <p className="text-gray-700">{result.server}</p>
              </div>
            )}

            {/* Retest Button */}
            <div className="text-center">
              <button
                onClick={handleSpeedTest}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-xl font-semibold text-white transition-all inline-flex items-center gap-2 shadow-lg shadow-pink-500/25"
              >
                <Play className="w-5 h-5" />
                Run Test Again
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        {!result && !loading && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About Speed Test</h3>
              <div className="space-y-3 text-gray-600">
                <p>This tool measures your internet connection performance. Key metrics include:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-gray-900">Download Speed:</strong> How fast you can receive data (streaming, browsing)</li>
                  <li><strong className="text-gray-900">Upload Speed:</strong> How fast you can send data (video calls, file uploads)</li>
                  <li><strong className="text-gray-900">Latency (Ping):</strong> Response time of your connection</li>
                  <li><strong className="text-gray-900">Jitter:</strong> Variation in latency (affects real-time apps)</li>
                </ul>
                <div className="mt-4 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                  <p className="text-sm text-pink-700">
                    <strong>Tip:</strong> For accurate results, close other applications and ensure no other devices are using the network.
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
