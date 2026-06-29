'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Loader2, Copy, Check, Info, Trash2 } from 'lucide-react'

const SAMPLES = ['google.com', 'microsoft.com', 'github.com', 'amazon.com', 'cloudflare.com']
const SPF_MECHANISMS: Record<string, string> = {
  'all': 'Match all senders',
  'ip4': 'Match IPv4 address or CIDR',
  'ip6': 'Match IPv6 address or CIDR',
  'a': 'Match domain A record',
  'mx': 'Match domain MX record',
  'include': 'Include another domain\'s SPF',
  'redirect': 'Use another domain\'s SPF policy',
  'exists': 'Match if domain resolves',
}
const QUALIFIERS: Record<string, { label: string; color: string }> = {
  '+': { label: 'Pass', color: 'text-green-700 bg-green-50' },
  '-': { label: 'Fail', color: 'text-red-700 bg-red-50' },
  '~': { label: 'SoftFail', color: 'text-amber-700 bg-amber-50' },
  '?': { label: 'Neutral', color: 'text-gray-700 bg-gray-50' },
}

function parseSPF(record: string) {
  const parts = record.split(/\s+/).filter(Boolean)
  return parts.slice(1).map(p => {
    const qualifier = ['+', '-', '~', '?'].includes(p[0]) ? p[0] : '+'
    const mechanism = p.replace(/^[+\-~?]/, '')
    const [mech, value] = mechanism.includes(':') ? mechanism.split(':', 2) : mechanism.includes('/') ? [mechanism.split('/')[0], '/' + mechanism.split('/').slice(1).join('/')] : [mechanism, '']
    return { raw: p, qualifier, mechanism: mech, value }
  })
}

export default function SpfCheckerPage() {
  const [domain, setDomain] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<{ domain: string; valid: boolean; time: string }[]>([])
  const [showInfo, setShowInfo] = useState(false)

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/tools/spf-checker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: domain.trim() }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ domain: domain.trim(), valid: json.data.valid, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const parsed = data?.spfRecord ? parseSPF(data.spfRecord) : []

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
            <div className="flex items-center justify-center mb-6"><div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg"><ShieldCheck className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">SPF Record <span className="text-slate-500">Checker</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Validate and analyze SPF records with mechanism breakdown</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
            <div className="flex gap-3">
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} placeholder="example.com" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button onClick={check} disabled={loading || !domain.trim()} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Check SPF
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {SAMPLES.map(s => (
                <button key={s} onClick={() => { setDomain(s); }} className="px-2.5 py-1 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg text-xs text-gray-500">{s}</button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>

          {data && (
            <>
              {/* Status */}
              <div className={`rounded-2xl border p-5 ${data.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${data.valid ? 'bg-green-500' : 'bg-red-400'}`} />
                  <h3 className={`text-lg font-semibold ${data.valid ? 'text-green-700' : 'text-red-700'}`}>{data.valid ? 'SPF Record Found' : 'No SPF Record Found'}</h3>
                </div>
              </div>

              {/* SPF Record */}
              {data.spfRecord && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">SPF Record</h3>
                    <button onClick={() => copy(data.spfRecord, 'spf')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1">
                      {copied === 'spf' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}Copy
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono text-sm text-gray-800 break-all">{data.spfRecord}</div>

                  {/* Parsed Mechanisms */}
                  {parsed.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Mechanism Breakdown</h4>
                      <div className="space-y-2">
                        {parsed.map((p, i) => {
                          const q = QUALIFIERS[p.qualifier] || QUALIFIERS['+']
                          return (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.color}`}>{q.label}</span>
                              <span className="font-mono text-sm font-medium text-gray-900">{p.mechanism}</span>
                              {p.value && <span className="font-mono text-sm text-gray-500">{p.value}</span>}
                              {SPF_MECHANISMS[p.mechanism] && <span className="text-xs text-gray-400 ml-auto">{SPF_MECHANISMS[p.mechanism]}</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* All TXT Records */}
              {data.allTxtRecords?.length > 0 && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">All TXT Records ({data.allTxtRecords.length})</h3>
                  <div className="space-y-2">
                    {data.allTxtRecords.map((r: string, i: number) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 font-mono text-xs text-gray-700 break-all group flex items-start justify-between gap-2">
                        <span>{r}</span>
                        <button onClick={() => copy(r, `txt-${i}`)} className="opacity-0 group-hover:opacity-100 shrink-0 text-gray-400 hover:text-blue-600 mt-0.5">
                          {copied === `txt-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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
                  <div key={i} className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 px-2 rounded" onClick={() => { setDomain(h.domain); }}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${h.valid ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="text-sm font-medium text-gray-700">{h.domain}</span>
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
              <h3 className="font-semibold text-gray-900">What is SPF?</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p><strong>Sender Policy Framework (SPF)</strong> is an email authentication protocol that allows domain owners to specify which mail servers are authorized to send email on behalf of their domain.</p>
                <p>SPF records are published as DNS TXT records and start with <code className="bg-gray-100 px-1 rounded">v=spf1</code>. They contain mechanisms that define which IPs/hosts are allowed to send mail.</p>
                <p>Common qualifiers: <code className="bg-gray-100 px-1 rounded">+</code> Pass, <code className="bg-gray-100 px-1 rounded">-</code> Fail, <code className="bg-gray-100 px-1 rounded">~</code> SoftFail, <code className="bg-gray-100 px-1 rounded">?</code> Neutral.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
