'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Globe, ArrowLeft, Loader2, Copy, Check, Download, Info, Clock } from 'lucide-react'

const SAMPLE_DOMAINS = ['google.com', 'github.com', 'cloudflare.com', 'amazon.com', 'microsoft.com']

export default function WebsiteToIpPage() {
  const [domain, setDomain] = useState('')
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [batchInput, setBatchInput] = useState('')
  const [data, setData] = useState<any>(null)
  const [batchResults, setBatchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [showInfo, setShowInfo] = useState(false)

  const resolve = async (target?: string) => {
    const t = (target || domain).trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!t) return
    if (target) setDomain(t)
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/tools/website-to-ip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: t }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ domain: t, v4: json.data.ipv4?.length || 0, v6: json.data.ipv6?.length || 0, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const resolveBatch = async () => {
    const domains = batchInput.split('\n').map(d => d.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean).slice(0, 10)
    if (domains.length === 0) return
    setLoading(true); setError(''); setBatchResults([])
    const results: any[] = []
    for (const d of domains) {
      try {
        const res = await fetch('/api/tools/website-to-ip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: d }) })
        const json = await res.json()
        results.push(json.success ? { domain: d, ...json.data } : { domain: d, error: json.error })
      } catch { results.push({ domain: d, error: 'Request failed' }) }
    }
    setBatchResults(results)
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const exportResults = () => {
    let lines: string[] = []
    if (mode === 'single' && data) {
      lines = [`Domain: ${data.domain}`, '', 'IPv4:', ...(data.ipv4?.map((ip: string) => `  ${ip}`) || ['  None']), '', 'IPv6:', ...(data.ipv6?.map((ip: string) => `  ${ip}`) || ['  None'])]
    } else if (batchResults.length > 0) {
      lines = batchResults.flatMap(r => r.error ? [`${r.domain}: ERROR - ${r.error}`] : [`${r.domain}: ${[...(r.ipv4 || []), ...(r.ipv6 || [])].join(', ') || 'No IPs'}`])
    }
    if (lines.length === 0) return
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `website-to-ip.txt`; a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Tools</Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6"><div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"><Globe className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Website to <span className="text-blue-100">IP Address</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Resolve domain names to their IP addresses</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Mode Toggle */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit mb-4">
              {(['single', 'batch'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${mode === m ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{m}</button>
              ))}
            </div>

            {mode === 'single' ? (
              <>
                <div className="flex gap-3">
                  <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && resolve()} placeholder="example.com" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                  <button onClick={() => resolve()} disabled={loading || !domain.trim()} className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}Resolve
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-gray-400">Try:</span>
                  {SAMPLE_DOMAINS.map(s => (
                    <button key={s} onClick={() => resolve(s)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-brand-50 text-gray-600 hover:text-brand-600 rounded transition-colors font-mono">{s}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <textarea value={batchInput} onChange={(e) => setBatchInput(e.target.value)} rows={5} placeholder="Enter up to 10 domains, one per line..." className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none" />
                <button onClick={resolveBatch} disabled={loading || !batchInput.trim()} className="mt-3 px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}Resolve All
                </button>
              </>
            )}
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>

          {/* Single Result */}
          {mode === 'single' && data && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{data.domain}</h3>
                <button onClick={exportResults} className="p-2 text-gray-400 hover:text-brand-600 transition-colors"><Download className="w-4 h-4" /></button>
              </div>
              {data.ipv4?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">IPv4 Addresses</h4>
                  <div className="space-y-2">
                    {data.ipv4.map((ip: string, i: number) => (
                      <div key={i} className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-100 flex items-center justify-between group">
                        <span className="font-mono text-lg text-gray-900">{ip}</span>
                        <button onClick={() => copy(ip, `v4-${i}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600 transition-opacity">
                          {copied === `v4-${i}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.ipv6?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">IPv6 Addresses</h4>
                  <div className="space-y-2">
                    {data.ipv6.map((ip: string, i: number) => (
                      <div key={i} className="bg-purple-50 rounded-lg px-4 py-3 border border-purple-100 flex items-center justify-between group">
                        <span className="font-mono text-sm text-gray-900 break-all">{ip}</span>
                        <button onClick={() => copy(ip, `v6-${i}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600 transition-opacity ml-2">
                          {copied === `v6-${i}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!data.ipv4 || data.ipv4.length === 0) && (!data.ipv6 || data.ipv6.length === 0) && (
                <p className="text-gray-500 text-sm">No IP addresses found for this domain.</p>
              )}
            </div>
          )}

          {/* Batch Results */}
          {mode === 'batch' && batchResults.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Batch Results ({batchResults.length})</h3>
                <button onClick={exportResults} className="p-2 text-gray-400 hover:text-brand-600 transition-colors"><Download className="w-4 h-4" /></button>
              </div>
              {batchResults.map((r, i) => (
                <div key={i} className={`rounded-lg p-4 border ${r.error ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{r.domain}</p>
                  {r.error ? (
                    <p className="text-red-600 text-xs">{r.error}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {[...(r.ipv4 || []), ...(r.ipv6 || [])].map((ip: string, j: number) => (
                        <button key={j} onClick={() => copy(ip, `batch-${i}-${j}`)} className="text-xs font-mono px-2 py-1 bg-white rounded border border-gray-200 text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-colors">
                          {copied === `batch-${i}-${j}` ? '✓' : ip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />Lookup History</h3>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setMode('single'); resolve(h.domain) }} className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg text-left transition-colors">
                    <span className="font-mono text-sm text-gray-700">{h.domain}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">v4:{h.v4} v6:{h.v6}</span>
                      <span className="text-xs text-gray-400">{h.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-2 w-full text-left">
              <Info className="w-4 h-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900">About DNS Resolution</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p><strong>DNS resolution</strong> converts domain names (like google.com) into IP addresses that computers use to communicate. A domain can have multiple IPv4 (A records) and IPv6 (AAAA records) addresses.</p>
                <p>Multiple IPs typically indicate load balancing or CDN usage. IPv6 addresses are the newer standard providing a much larger address space than IPv4.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
