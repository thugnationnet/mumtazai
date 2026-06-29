'use client'

import { useState } from 'react'
import { ArrowLeft, Globe, MapPin, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'

interface GeolocationData {
  ip: string
  location: {
    country: string
    region: string
    city: string
    lat: number
    lng: number
    postalCode: string
    timezone: string
  }
  isp: string
  connectionType: string
  organization: string
  asn: {
    asn: string
    name: string
    route: string
  }
}

export default function IPGeolocationPage() {
  const [ipAddress, setIpAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<GeolocationData | null>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ipAddress.trim()) {
      setError('Please enter an IP address')
      return
    }

    setLoading(true)
    setError('')
    setData(null)

    try {
      const response = await fetch('/api/tools/ip-geolocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipAddress.trim() })
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to fetch IP geolocation data')
        return
      }

      setData(result.data)
    } catch (err: any) {
      setError('An error occurred while fetching geolocation data')
      console.error('Geolocation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGetMyIP = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const result = await response.json()
      setIpAddress(result.ip)
    } catch (err) {
      setError('Failed to detect your IP address')
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
                <Globe className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
              IP <span className="text-slate-500">Geolocation</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Get detailed location and ISP information for any IP address
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
              <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="Enter IP address (e.g., 8.8.8.8)"
                className="w-full pl-12 pr-48 py-4 bg-white border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-0 transition-all outline-none"
                disabled={loading}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                <button
                  type="button"
                  onClick={handleGetMyIP}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  My IP
                </button>
                <button
                  type="submit"
                  disabled={loading || !ipAddress.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:from-gray-400 disabled:to-gray-400 rounded-lg font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:cursor-not-allowed"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Looking...</> : <><MapPin className="w-4 h-4" />Lookup</>}
                </button>
              </div>
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
            {/* Header Card */}
            <div className="neu-info p-6">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">IP Address</h2>
              </div>
              <p className="text-2xl font-mono text-gray-900">{data.ip}</p>
            </div>

            {/* Location Card */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Country</div>
                  <div className="text-lg text-gray-900">{data.location.country}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Region</div>
                  <div className="text-lg text-gray-900">{data.location.region || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">City</div>
                  <div className="text-lg text-gray-900">{data.location.city || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Postal Code</div>
                  <div className="text-lg text-gray-900">{data.location.postalCode || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Timezone</div>
                  <div className="text-lg text-gray-900">{data.location.timezone || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Coordinates</div>
                  <div className="text-lg font-mono text-gray-900">
                    {data.location.lat}, {data.location.lng}
                  </div>
                </div>
              </div>
            </div>

            {/* ISP Card */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                ISP & Network Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">ISP</div>
                  <div className="text-lg text-gray-900">{data.isp || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Organization</div>
                  <div className="text-lg text-gray-900">{data.organization || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Connection Type</div>
                  <div className="text-lg text-gray-900">{data.connectionType || 'N/A'}</div>
                </div>
                {data.asn && (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-500 mb-1">ASN</div>
                      <div className="text-lg font-mono text-gray-900">{data.asn.asn || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-500 mb-1">ASN Name</div>
                      <div className="text-lg text-gray-900">{data.asn.name || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-500 mb-1">Route</div>
                      <div className="text-lg font-mono text-gray-900">{data.asn.route || 'N/A'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        {!data && !loading && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About IP Geolocation</h3>
              <div className="space-y-3 text-gray-600">
                <p>Get detailed location and network information for any IP address. Perfect for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Identifying the geographic location of visitors</li>
                  <li>Detecting fraud and suspicious activity</li>
                  <li>Customizing content based on location</li>
                  <li>Network troubleshooting and analysis</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
