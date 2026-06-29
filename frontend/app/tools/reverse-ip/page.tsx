'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, ArrowLeft, Loader2, Copy, Check, Info, Download } from 'lucide-react'

const SAMPLE_IPS = ['8.8.8.8', '1.1.1.1', '208.67.222.222', '9.9.9.9', '76.76.2.0']

export default function ReverseIpPage() {
  const [ip, setIp] = useState('')
  const [data, setData] = useState<{ ip: string; hostnames: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<{ ip: string; count: number; time: string }[]>([])
  const [batchMode, setBatchMode] = useState(false)
  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState<{ ip: string; hostnames: string[]; error?: string }[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const lookup = async (ipAddr?: string) => {
    const target = ipAddr || ip.trim()
    if (!target) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/tools/reverse-ip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip: target }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ ip: target, count: json.data.hostnames?.length || 0, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const batchLookup = async () => {
    const ips = batchInput.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10)
    if (ips.length === 0) return
    setBatchLoading(true); setBatchResults([])
    for (const ipAddr of ips) {
      try {
        const res = await fetch('/api/tools/reverse-ip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip: ipAddr }) })
        const json = await res.json()
        setBatchResults(prev => [...prev, { ip: ipAddr, hostnames: json.data?.hostnames || [], error: json.success ? undefined : json.error }])
      } catch (e: any) {
        setBatchResults(prev => [...prev, { ip: ipAddr, hostnames: [], error: e.message }])
      }
    }
    setBatchLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const exportResults = () => {
    const lines = batchResults.length > 0
      ? batchResults.map(r => `${r.ip}: ${r.error || r.hostnames.join(', ') || 'No records'}`).join('\n')
      : data ? `${data.ip}: ${data.hostnames.join(', ') || 'No records'}` : ''
    const blob = new Blob([`Reverse IP Lookup\n${new Date().toISOString()}\n\n${lines}`], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `reverse-ip-${Date.now()}.txt`; a.click()
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
            <div className="flex items-center justify-center mb-6"><div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg"><ArrowLeftRight className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Reverse IP <span className="text-slate-500">Lookup</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Find hostnames associated with an IP address</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button onClick={() => setBatchMode(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!batchMode ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Single Lookup</button>
            <button onClick={() => setBatchMode(true)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${batchMode ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Batch Lookup</button>
          </div>

          {!batchMode ? (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <div className="flex gap-3">
                <input type="text" value={ip} onChange={e => setIp(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()} placeholder="8.8.8.8" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <button onClick={() => lookup()} disabled={loading || !ip.trim()} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Lookup
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {SAMPLE_IPS.map(s => (
                  <button key={s} onClick={() => setIp(s)} className="px-2.5 py-1 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg text-xs text-gray-500 font-mono">{s}</button>
                ))}
              </div>
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </div>
          ) : (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Addresses (one per line, max 10)</label>
              <textarea value={batchInput} onChange={e => setBatchInput(e.target.value)} rows={5} placeholder="8.8.8.8\n1.1.1.1\n208.67.222.222" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button onClick={batchLookup} disabled={batchLoading || !batchInput.trim()} className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {batchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Lookup All
              </button>
            </div>
          )}

          {/* Single Results */}
          {data && !batchMode && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Hostnames for <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-700">{data.ip}</code></h3>
                <div className="flex gap-2">
                  <button onClick={exportResults} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1"><Download className="w-3.5 h-3.5" />Export</button>
                  {data.hostnames.length > 0 && (
                    <button onClick={() => copy(data.hostnames.join('\n'), 'all')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1">
                      {copied === 'all' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}Copy
                    </button>
                  )}
                </div>
              </div>
              {data.hostnames.length === 0 ? (
                <p className="text-gray-500 text-sm">No reverse DNS records found for this IP.</p>
              ) : (
                <div className="space-y-2">
                  {data.hostnames.map((h, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 font-mono text-sm text-gray-800 group flex items-center justify-between">
                      <span>{h}</span>
                      <button onClick={() => copy(h, `h-${i}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600">
                        {copied === `h-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Batch Results */}
          {batchResults.length > 0 && batchMode && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Batch Results ({batchResults.length}) {batchLoading && <Loader2 className="w-4 h-4 inline animate-spin ml-2" />}</h3>
                <button onClick={exportResults} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1"><Download className="w-3.5 h-3.5" />Export</button>
              </div>
              <div className="space-y-3">
                {batchResults.map((r, i) => (
                  <div key={i} className={`rounded-lg p-3 border ${r.error ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${r.error ? 'bg-red-400' : r.hostnames.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="font-mono text-sm font-medium text-gray-900">{r.ip}</span>
                      <span className="text-xs text-gray-400">{r.error || `${r.hostnames.length} hostname${r.hostnames.length !== 1 ? 's' : ''}`}</span>
                    </div>
                    {r.hostnames.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 ml-5">
                        {r.hostnames.map((h, j) => (
                          <span key={j} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono text-gray-700">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Lookup History ({history.length})</h3>
                <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-red-500">Clear</button>
              </div>
              <div className="divide-y divide-gray-100">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 px-2 rounded" onClick={() => { setIp(h.ip); setBatchMode(false); }}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-700">{h.ip}</span>
                      <span className="text-xs text-gray-400">{h.count} hostname{h.count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-xs text-gray-400">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
            <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-2 w-full text-left">
              <Info className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">About Reverse IP Lookup</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p><strong>Reverse DNS (rDNS)</strong> resolves an IP address back to its associated hostname(s) using PTR records in the in-addr.arpa zone.</p>
                <p>This is the opposite of a normal DNS lookup (domain → IP). It answers: &ldquo;What domain names point to this IP?&rdquo;</p>
                <p>Common uses: verifying mail server identity, investigating suspicious IPs, checking shared hosting environments.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
