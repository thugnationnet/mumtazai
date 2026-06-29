'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowLeft, Loader2, Copy, Check, CheckCircle, XCircle, AlertTriangle, Info, Clock, Download } from 'lucide-react'

const SAMPLE_DOMAINS = ['google.com', 'github.com', 'cloudflare.com', 'microsoft.com', 'amazon.com']

export default function DnsHealthPage() {
  const [domain, setDomain] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [showInfo, setShowInfo] = useState(false)
  const [expandedType, setExpandedType] = useState<string | null>(null)

  const check = async (target?: string) => {
    const t = (target || domain).trim()
    if (!t) return
    if (target) setDomain(t)
    setLoading(true); setError(''); setData(null); setExpandedType(null)
    try {
      const res = await fetch('/api/tools/dns-health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: t }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ domain: t, score: json.data.score, issues: json.data.issues?.length || 0, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const exportReport = () => {
    if (!data) return
    const lines = [
      `DNS Health Report: ${data.domain}`, `Score: ${data.score}/100`, '',
      'Issues:', ...(data.issues?.length ? data.issues.map((i: string) => `  ⚠ ${i}`) : ['  None']), '',
      'Email Auth:', `  SPF: ${data.spf ? 'Found' : 'Not found'}`, `  DMARC: ${data.dmarc ? 'Found' : 'Not found'}`, '',
      'Records:', ...Object.entries(data.records || {}).flatMap(([type, recs]: [string, any]) => [`  ${type}: ${recs.length} record(s)`, ...recs.map((r: string) => `    ${r}`)])
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `dns-health-${data.domain}.txt`; a.click()
  }

  const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 50 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = (s: number) => s >= 80 ? 'bg-green-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const scoreLabel = (s: number) => s >= 90 ? 'Excellent' : s >= 80 ? 'Good' : s >= 60 ? 'Fair' : s >= 40 ? 'Poor' : 'Critical'

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
            <div className="flex items-center justify-center mb-6"><div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg"><Activity className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">DNS Health <span className="text-slate-500">Checker</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Comprehensive DNS health and configuration analysis</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Input */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <div className="flex gap-3">
              <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="example.com" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button onClick={() => check()} disabled={loading || !domain.trim()} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}Check
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-400">Try:</span>
              {SAMPLE_DOMAINS.map(s => (
                <button key={s} onClick={() => check(s)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded transition-colors font-mono">{s}</button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>

          {data && (
            <>
              {/* Score Hero */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{data.domain}</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copy(JSON.stringify(data, null, 2), 'json')} className="p-2 text-gray-400 hover:text-blue-600"><Copy className="w-4 h-4" /></button>
                    <button onClick={exportReport} className="p-2 text-gray-400 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Score gauge */}
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke={data.score >= 80 ? '#22c55e' : data.score >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${data.score * 2.51} 251`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${scoreColor(data.score)}`}>{data.score}</span>
                      <span className="text-[10px] text-gray-400">/ 100</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`text-lg font-bold ${scoreColor(data.score)}`}>{scoreLabel(data.score)}</p>
                    <p className="text-sm text-gray-500 mt-1">{data.issues?.length === 0 ? 'No issues detected — DNS configuration looks healthy!' : `${data.issues.length} issue${data.issues.length > 1 ? 's' : ''} found that may need attention`}</p>
                  </div>
                </div>
              </div>

              {/* Email Authentication */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Email Authentication</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'SPF', found: data.spf, desc: 'Sender Policy Framework' },
                    { label: 'DMARC', found: data.dmarc, desc: 'Domain-based Message Auth' },
                  ].map(item => (
                    <div key={item.label} className={`rounded-lg p-4 border ${item.found ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {item.found ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
                        <span className="font-semibold text-gray-900">{item.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                      <p className={`text-sm font-medium mt-1 ${item.found ? 'text-green-700' : 'text-red-600'}`}>{item.found ? 'Configured' : 'Not Found'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues */}
              {data.issues?.length > 0 && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />Issues ({data.issues.length})
                  </h3>
                  <div className="space-y-2">
                    {data.issues.map((issue: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 py-2 px-3 bg-amber-50 rounded-lg border border-amber-100">
                        <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                        <span className="text-sm text-gray-700">{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Records Grid */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">DNS Records Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(data.records || {}).map(([type, records]: [string, any]) => (
                    <div key={type} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <button onClick={() => setExpandedType(expandedType === type ? null : type)} className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-700 uppercase">{type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${records.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{records.length}</span>
                        </div>
                        <span className="text-xs text-gray-400">{expandedType === type ? '▲' : '▼'}</span>
                      </button>
                      {expandedType === type && records.length > 0 && (
                        <div className="border-t border-gray-200 p-3 space-y-1.5">
                          {records.map((r: string, i: number) => (
                            <div key={i} className="flex items-center justify-between group">
                              <p className="font-mono text-xs text-gray-600 truncate flex-1 mr-2">{r}</p>
                              <button onClick={() => copy(r, `rec-${type}-${i}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 flex-shrink-0">
                                {copied === `rec-${type}-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {expandedType !== type && records.length > 0 && (
                        <div className="px-4 pb-3">
                          <p className="font-mono text-xs text-gray-500 truncate">{records[0]}</p>
                          {records.length > 1 && <p className="text-xs text-gray-400 mt-1">+{records.length - 1} more</p>}
                        </div>
                      )}
                      {records.length === 0 && (
                        <div className="px-4 pb-3"><p className="text-xs text-gray-400">None found</p></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />Check History</h3>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button key={i} onClick={() => check(h.domain)} className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg text-left transition-colors">
                    <span className="font-mono text-sm text-gray-700">{h.domain}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${scoreColor(h.score)}`}>{h.score}/100</span>
                      {h.issues > 0 && <span className="text-xs text-amber-600">{h.issues} issues</span>}
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
              <h3 className="font-semibold text-gray-900">About DNS Health</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p>A <strong>DNS health check</strong> evaluates your domain&apos;s DNS configuration for common issues including missing records, email authentication (SPF, DMARC), and overall configuration quality.</p>
                <p>A high score (80+) indicates a well-configured domain. Issues like missing SPF records, no DMARC policy, or missing NS records can lower your score and may affect email deliverability and security.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
