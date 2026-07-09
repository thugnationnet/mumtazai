'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Globe2, ArrowLeft, Loader2, Copy, Check, Download, Info, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const SAMPLES = ['google.com', 'microsoft.com', 'github.com', 'cloudflare.com']
const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA']

export default function DnsPropagationPage() {
  const [domain, setDomain] = useState('')
  const [recordType, setRecordType] = useState('A')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<{ domain: string; type: string; propagated: number; total: number; time: string }[]>([])

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/tools/dns-propagation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: domain.trim(), recordType }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      const propagated = json.data.propagation?.filter((p: any) => p.success && p.records.length > 0).length || 0
      const total = json.data.propagation?.length || 0
      setHistory(prev => [{ domain: domain.trim(), type: recordType, propagated, total, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const exportResults = () => {
    if (!data) return
    const lines = data.propagation.map((p: any) => `${p.server} (${p.ip}): ${p.success ? p.records.join(', ') || 'No records' : 'FAILED'}`).join('\n')
    const blob = new Blob([`DNS Propagation: ${data.domain} (${data.type})\n${new Date().toISOString()}\n\n${lines}`], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `dns-propagation-${data.domain}-${Date.now()}.txt`; a.click()
  }

  const propagated = data?.propagation?.filter((p: any) => p.success && p.records.length > 0).length || 0
  const total = data?.propagation?.length || 0
  const pct = total > 0 ? Math.round((propagated / total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Tools</Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6"><div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"><Globe2 className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">DNS <span className="text-blue-100">Propagation</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Check DNS propagation across global servers</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 space-y-4">
            <div className="flex gap-3">
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} placeholder="example.com" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button onClick={check} disabled={loading || !domain.trim()} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe2 className="w-4 h-4" />}Check
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {RECORD_TYPES.map(t => (
                <button key={t} onClick={() => setRecordType(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${recordType === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{t}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map(s => (
                <button key={s} onClick={() => setDomain(s)} className="px-2.5 py-1 bg-gray-50 border border-gray-200 hover:border-brand-300 hover:bg-brand-50 rounded-lg text-xs text-gray-500">{s}</button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {data && (
            <>
              {/* Propagation Summary */}
              <div className={`rounded-2xl border p-5 ${pct === 100 ? 'bg-green-50 border-green-200' : pct >= 50 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {pct === 100 ? <CheckCircle className="w-5 h-5 text-green-600" /> : pct >= 50 ? <AlertCircle className="w-5 h-5 text-blue-600" /> : <XCircle className="w-5 h-5 text-amber-600" />}
                    <div>
                      <h3 className="font-semibold text-gray-900">{pct}% Propagated</h3>
                      <p className="text-sm text-gray-600">{propagated} of {total} servers responding with {data.type} records</p>
                    </div>
                  </div>
                  <button onClick={exportResults} className="px-3 py-1.5 bg-white/60 hover:bg-white text-gray-700 rounded-lg text-sm flex items-center gap-1 border border-white/40"><Download className="w-3.5 h-3.5" />Export</button>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Server Results */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-4">{data.type} records for {data.domain}</h3>
                <div className="space-y-3">
                  {data.propagation?.map((p: any, i: number) => (
                    <div key={i} className={`rounded-lg p-4 border ${p.success && p.records.length > 0 ? 'bg-green-50/50 border-green-200' : p.success ? 'bg-amber-50/50 border-amber-200' : 'bg-red-50/50 border-red-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${p.success && p.records.length > 0 ? 'bg-green-500' : p.success ? 'bg-amber-500' : 'bg-red-400'}`} />
                          <span className="font-medium text-sm text-gray-900">{p.server}</span>
                          <span className="text-xs text-gray-400 font-mono">{p.ip}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{p.records.length} record{p.records.length !== 1 ? 's' : ''}</span>
                          {p.records.length > 0 && (
                            <button onClick={() => copy(p.records.join(', '), `srv-${i}`)} className="text-gray-400 hover:text-brand-600">
                              {copied === `srv-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                      {p.records.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.records.map((r: string, j: number) => (
                            <span key={j} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono text-gray-700">{r}</span>
                          ))}
                        </div>
                      )}
                      {!p.success && <p className="text-xs text-red-400 mt-1">Server did not respond</p>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Check History ({history.length})</h3>
                <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-red-500">Clear</button>
              </div>
              <div className="divide-y divide-gray-100">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 px-2 rounded" onClick={() => { setDomain(h.domain); setRecordType(h.type); }}>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">{h.type}</span>
                      <span className="text-sm font-medium text-gray-700">{h.domain}</span>
                      <span className={`text-xs font-medium ${h.propagated === h.total ? 'text-green-600' : 'text-amber-600'}`}>{h.propagated}/{h.total}</span>
                    </div>
                    <span className="text-xs text-gray-400">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
