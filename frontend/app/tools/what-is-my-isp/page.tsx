'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wifi, ArrowLeft, Loader2, Copy, Check, RefreshCw, Info } from 'lucide-react'

export default function WhatIsMyIspPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => { detect() }, [])

  const detect = async () => {
    setLoading(true)
    try {
      const res = await fetch('https://ipinfo.io/json')
      const json = await res.json()
      const org = json.org || ''
      const asnMatch = org.match(/^(AS\d+)\s+(.+)$/)
      setData({
        ip: json.ip,
        isp: org,
        asn: asnMatch?.[1] || '',
        ispName: asnMatch?.[2] || org,
        city: json.city || 'Unknown',
        region: json.region || 'Unknown',
        country: json.country || 'Unknown',
        hostname: json.hostname || 'N/A',
        timezone: json.timezone || 'Unknown',
        loc: json.loc || '',
        postal: json.postal || '',
      })
    } catch {
      try {
        const res = await fetch('https://api.ipify.org?format=json')
        const json = await res.json()
        setData({ ip: json.ip, isp: 'Could not detect', ispName: 'Unknown', asn: '', city: 'N/A', region: 'N/A', country: 'N/A', hostname: 'N/A', timezone: 'N/A', loc: '', postal: '' })
      } catch { /* ignore */ }
    }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const copyAll = async () => {
    if (!data) return
    const txt = Object.entries(data).filter(([, v]) => v && v !== 'N/A' && v !== 'Unknown').map(([k, v]) => `${k}: ${v}`).join('\n')
    await navigator.clipboard.writeText(txt); setCopied('all'); setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="min-h-screen themed-section-bg">
      <div className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10">
          <Link href="/tools" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-500 mb-8 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Tools</Link>
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="text-center">
            <div className="flex items-center justify-center mb-6"><div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg"><Wifi className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">What Is <span className="text-slate-500">My ISP?</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Detect your Internet Service Provider and connection details</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {loading ? (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Detecting your ISP...</p>
            </div>
          ) : data ? (
            <>
              {/* ISP Hero */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 text-center">
                <Wifi className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">Your Internet Service Provider</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{data.ispName}</p>
                {data.asn && <p className="text-sm text-gray-400 font-mono">{data.asn}</p>}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button onClick={() => copy(data.isp, 'isp')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm inline-flex items-center gap-2 transition-colors">
                    {copied === 'isp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}Copy ISP
                  </button>
                  <button onClick={copyAll} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm inline-flex items-center gap-2 transition-colors">
                    {copied === 'all' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}Copy All
                  </button>
                  <button onClick={detect} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Network Details</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'IP Address', value: data.ip },
                      { label: 'ISP / Organization', value: data.isp },
                      { label: 'Hostname', value: data.hostname },
                    ].filter(r => r.value && r.value !== 'N/A').map(row => (
                      <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 group">
                        <span className="text-sm text-gray-500">{row.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-900 font-mono">{row.value}</span>
                          <button onClick={() => copy(row.value, `n-${row.label}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600">
                            {copied === `n-${row.label}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'City', value: data.city },
                      { label: 'Region', value: data.region },
                      { label: 'Country', value: data.country },
                      { label: 'Timezone', value: data.timezone },
                      { label: 'Postal', value: data.postal },
                      { label: 'Coordinates', value: data.loc },
                    ].filter(r => r.value && r.value !== 'Unknown' && r.value !== 'N/A').map(row => (
                      <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-500">{row.label}</span>
                        <span className="text-sm font-medium text-gray-900">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-2 w-full text-left">
                  <Info className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">About Your ISP</h3>
                  <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
                </button>
                {showInfo && (
                  <div className="mt-3 text-sm text-gray-600 space-y-2">
                    <p>Your <strong>ISP (Internet Service Provider)</strong> is the company providing your internet connection. The ASN (Autonomous System Number) is a unique identifier assigned to your ISP&apos;s network.</p>
                    <p>If you&apos;re using a VPN, the ISP shown will be the VPN provider&apos;s network, not your actual ISP. The location data may also reflect the VPN server&apos;s location.</p>
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
