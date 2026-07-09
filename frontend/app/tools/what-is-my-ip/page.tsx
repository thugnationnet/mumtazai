'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Globe, ArrowLeft, Copy, Check, Loader2, MapPin, RefreshCw, Shield, Wifi, Info } from 'lucide-react'

interface IpInfo {
  ip: string
  city?: string
  region?: string
  country?: string
  loc?: string
  org?: string
  timezone?: string
  postal?: string
  hostname?: string
}

export default function WhatIsMyIpPage() {
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [browserInfo, setBrowserInfo] = useState<Record<string, string>>({})
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    fetchIp()
    setBrowserInfo({
      'User Agent': navigator.userAgent,
      'Platform': navigator.platform,
      'Language': navigator.language,
      'Cookies Enabled': navigator.cookieEnabled ? 'Yes' : 'No',
      'Online': navigator.onLine ? 'Yes' : 'No',
      'Screen Resolution': `${screen.width}×${screen.height}`,
      'Window Size': `${window.innerWidth}×${window.innerHeight}`,
      'Color Depth': `${screen.colorDepth}-bit`,
      'Touch Support': navigator.maxTouchPoints > 0 ? 'Yes' : 'No',
      'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      'Connection Type': (navigator as any).connection?.effectiveType || 'Unknown',
    })
  }, [])

  const fetchIp = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('https://ipinfo.io/json')
      if (!res.ok) throw new Error('Failed')
      setIpInfo(await res.json())
    } catch {
      try {
        const res = await fetch('https://api.ipify.org?format=json')
        const data = await res.json()
        setIpInfo({ ip: data.ip })
      } catch {
        setError('Unable to detect your IP address')
      }
    }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const copyAll = async () => {
    if (!ipInfo) return
    const lines = [
      `IP: ${ipInfo.ip}`,
      ipInfo.city && `City: ${ipInfo.city}`,
      ipInfo.region && `Region: ${ipInfo.region}`,
      ipInfo.country && `Country: ${ipInfo.country}`,
      ipInfo.org && `ISP: ${ipInfo.org}`,
      ipInfo.timezone && `Timezone: ${ipInfo.timezone}`,
      ipInfo.loc && `Location: ${ipInfo.loc}`,
    ].filter(Boolean).join('\n')
    await navigator.clipboard.writeText(lines); setCopied('all'); setTimeout(() => setCopied(''), 1500)
  }

  const ipVersion = ipInfo?.ip?.includes(':') ? 'IPv6' : 'IPv4'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Tools</Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6"><div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"><Globe className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">What Is <span className="text-blue-100">My IP</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Your public IP address, location, ISP, and browser details</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
              <p className="text-gray-600">Detecting your IP address...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-center">
              {error}
              <button onClick={fetchIp} className="ml-3 text-sm underline">Retry</button>
            </div>
          ) : ipInfo ? (
            <>
              {/* Big IP Display */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center">
                <p className="text-sm text-gray-500 mb-2">Your Public IP Address</p>
                <p className="text-4xl md:text-5xl font-bold text-gray-900 font-mono mb-2">{ipInfo.ip}</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-4 ${ipVersion === 'IPv6' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{ipVersion}</span>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => copy(ipInfo.ip, 'ip')} className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors inline-flex items-center gap-2">
                    {copied === 'ip' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied === 'ip' ? 'Copied!' : 'Copy IP'}
                  </button>
                  <button onClick={copyAll} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors inline-flex items-center gap-2">
                    {copied === 'all' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}Copy All
                  </button>
                  <button onClick={fetchIp} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Location & ISP Details */}
              {(ipInfo.city || ipInfo.org) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-600" />Location</h3>
                    <div className="space-y-2.5">
                      {[
                        { label: 'City', value: ipInfo.city },
                        { label: 'Region', value: ipInfo.region },
                        { label: 'Country', value: ipInfo.country },
                        { label: 'Coordinates', value: ipInfo.loc },
                        { label: 'Postal Code', value: ipInfo.postal },
                        { label: 'Timezone', value: ipInfo.timezone },
                      ].filter(r => r.value).map(row => (
                        <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 group">
                          <span className="text-sm text-gray-500">{row.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-900">{row.value}</span>
                            <button onClick={() => copy(row.value!, `loc-${row.label}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600">
                              {copied === `loc-${row.label}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Wifi className="w-4 h-4 text-brand-600" />Network</h3>
                    <div className="space-y-2.5">
                      {[
                        { label: 'IP Address', value: ipInfo.ip },
                        { label: 'IP Version', value: ipVersion },
                        { label: 'ISP / Org', value: ipInfo.org },
                        { label: 'Hostname', value: ipInfo.hostname },
                      ].filter(r => r.value).map(row => (
                        <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 group">
                          <span className="text-sm text-gray-500">{row.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-900 max-w-48 truncate">{row.value}</span>
                            <button onClick={() => copy(row.value!, `net-${row.label}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600">
                              {copied === `net-${row.label}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Browser Info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-brand-600" />Browser & Device Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  {Object.entries(browserInfo).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-100 group">
                      <span className="text-sm text-gray-500">{key}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-900 max-w-48 truncate">{val}</span>
                        <button onClick={() => copy(val, `br-${key}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600">
                          {copied === `br-${key}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-2 w-full text-left">
                  <Info className="w-4 h-4 text-brand-600" />
                  <h3 className="font-semibold text-gray-900">About Your IP Address</h3>
                  <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
                </button>
                {showInfo && (
                  <div className="mt-3 text-sm text-gray-600 space-y-2">
                    <p>Your <strong>public IP address</strong> is assigned by your Internet Service Provider (ISP) and is visible to every website you visit. It can reveal your approximate location.</p>
                    <p>If you&apos;re using a VPN or proxy, the IP shown will be from the VPN server — not your real location. The location data is based on IP geolocation databases and may not be 100% accurate.</p>
                    <p><strong>IPv4</strong> addresses are 32-bit (e.g., 192.168.1.1), while <strong>IPv6</strong> addresses are 128-bit (e.g., 2001:db8::1) — the newer standard with vastly more addresses available.</p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}
