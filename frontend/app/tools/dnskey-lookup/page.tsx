'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Key, ArrowLeft, Loader2, Copy, Check, Info, ShieldCheck, ShieldX, Clock } from 'lucide-react'

const SAMPLE_DOMAINS = ['cloudflare.com', 'google.com', 'isc.org', 'verisign.com', 'nic.cz']

const ALGO_NAMES: Record<string, string> = {
  '5': 'RSA/SHA-1', '7': 'RSASHA1-NSEC3-SHA1', '8': 'RSA/SHA-256', '10': 'RSA/SHA-512',
  '13': 'ECDSA P-256/SHA-256', '14': 'ECDSA P-384/SHA-384', '15': 'Ed25519', '16': 'Ed448',
}

export default function DnskeyLookupPage() {
  const [domain, setDomain] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [showInfo, setShowInfo] = useState(false)

  const lookup = async (target?: string) => {
    const t = (target || domain).trim()
    if (!t) return
    if (target) setDomain(t)
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/tools/dnskey-lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: t }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ domain: t, enabled: json.data.dnssecEnabled, keys: json.data.dnskeys?.length || 0, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const parseKey = (raw: string) => {
    const parts = raw.trim().split(/\s+/)
    return { flags: parts[0], protocol: parts[1], algorithm: parts[2], key: parts.slice(3).join('') }
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
            <div className="flex items-center justify-center mb-6"><div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg"><Key className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">DNSKEY / DS <span className="text-slate-500">Lookup</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Check DNSSEC key and delegation signer records</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Input */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <div className="flex gap-3">
              <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && lookup()} placeholder="example.com" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button onClick={() => lookup()} disabled={loading || !domain.trim()} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}Lookup
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-400">Try:</span>
              {SAMPLE_DOMAINS.map(s => (
                <button key={s} onClick={() => lookup(s)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded transition-colors font-mono">{s}</button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>

          {data && (
            <>
              {/* Status */}
              <div className={`rounded-2xl border shadow-lg p-6 ${data.dnssecEnabled ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-4">
                  {data.dnssecEnabled ? <ShieldCheck className="w-10 h-10 text-green-600" /> : <ShieldX className="w-10 h-10 text-amber-600" />}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{domain}</h3>
                    <p className={`text-sm font-medium ${data.dnssecEnabled ? 'text-green-700' : 'text-amber-700'}`}>
                      DNSSEC {data.dnssecEnabled ? 'Enabled — Domain is signed' : 'Not Detected — Domain may not be signed'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{data.dnskeys?.length || 0}</p>
                    <p className="text-xs text-gray-500">DNSKEY Records</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{data.dsRecords?.length || 0}</p>
                    <p className="text-xs text-gray-500">DS Records</p>
                  </div>
                </div>
              </div>

              {/* DNSKEY Records */}
              {data.dnskeys?.length > 0 && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">DNSKEY Records</h3>
                  <div className="space-y-3">
                    {data.dnskeys.map((k: string, i: number) => {
                      const parsed = parseKey(k)
                      const isKSK = parsed.flags === '257'
                      return (
                        <div key={i} className={`rounded-lg p-4 border group ${isKSK ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isKSK ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>{isKSK ? 'KSK (257)' : 'ZSK (256)'}</span>
                              <span className="text-xs text-gray-500">Algorithm {parsed.algorithm} ({ALGO_NAMES[parsed.algorithm] || 'Unknown'})</span>
                            </div>
                            <button onClick={() => copy(k, `key-${i}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600">
                              {copied === `key-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="font-mono text-xs text-gray-600 break-all">{parsed.key.length > 120 ? parsed.key.slice(0, 120) + '...' : parsed.key}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* DS Records */}
              {data.dsRecords?.length > 0 && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">DS Records</h3>
                  <div className="space-y-2">
                    {data.dsRecords.map((d: string, i: number) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 flex items-center justify-between group">
                        <span className="font-mono text-xs text-gray-700 break-all">{d}</span>
                        <button onClick={() => copy(d, `ds-${i}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 ml-2 flex-shrink-0">
                          {copied === `ds-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!data.dnskeys || data.dnskeys.length === 0) && (!data.dsRecords || data.dsRecords.length === 0) && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 text-center text-gray-500 text-sm">No DNSKEY or DS records found for this domain.</div>
              )}
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />Lookup History</h3>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button key={i} onClick={() => lookup(h.domain)} className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg text-left transition-colors">
                    <span className="font-mono text-sm text-gray-700">{h.domain}</span>
                    <div className="flex items-center gap-3">
                      {h.enabled ? <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> : <ShieldX className="w-3.5 h-3.5 text-amber-500" />}
                      <span className="text-xs text-gray-500">{h.keys} keys</span>
                      <span className="text-xs text-gray-400">{h.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
            <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-2 w-full text-left">
              <Info className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">About DNSSEC</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p><strong>DNSSEC</strong> (Domain Name System Security Extensions) adds cryptographic signatures to DNS records, preventing attackers from forging or tampering with DNS responses.</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs font-semibold text-blue-700">KSK (Flag 257)</p><p className="text-xs text-gray-600">Key Signing Key — signs the DNSKEY set, referenced by DS records in the parent zone</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs font-semibold text-gray-700">ZSK (Flag 256)</p><p className="text-xs text-gray-600">Zone Signing Key — signs all other record sets in the zone</p></div>
                </div>
                <p><strong>DS records</strong> are placed in the parent zone and act as a trust anchor, linking the child zone&apos;s KSK to the parent&apos;s chain of trust.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
