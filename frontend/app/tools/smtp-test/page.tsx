'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Send, ArrowLeft, Loader2, Copy, Check, Info, Wifi, WifiOff } from 'lucide-react'

const SAMPLES = ['google.com', 'microsoft.com', 'yahoo.com', 'protonmail.com', 'zoho.com']

export default function SmtpTestPage() {
  const [domain, setDomain] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<{ domain: string; reachable: boolean; primaryMx?: string; time: string }[]>([])
  const [showInfo, setShowInfo] = useState(false)

  const test = async () => {
    if (!domain.trim()) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/tools/smtp-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: domain.trim() }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ domain: domain.trim(), reachable: json.data.smtpReachable, primaryMx: json.data.primaryMx, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Tools</Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6"><div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"><Send className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">SMTP <span className="text-blue-100">Test</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Test SMTP server connectivity and MX records</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <div className="flex gap-3">
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && test()} placeholder="example.com" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button onClick={test} disabled={loading || !domain.trim()} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Test SMTP
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {SAMPLES.map(s => (
                <button key={s} onClick={() => setDomain(s)} className="px-2.5 py-1 bg-gray-50 border border-gray-200 hover:border-brand-300 hover:bg-brand-50 rounded-lg text-xs text-gray-500">{s}</button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>

          {data && (
            <>
              {/* Connection Status */}
              <div className={`rounded-2xl border p-5 ${data.smtpReachable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  {data.smtpReachable ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-500" />}
                  <div>
                    <h3 className={`text-lg font-semibold ${data.smtpReachable ? 'text-green-700' : 'text-red-700'}`}>SMTP {data.smtpReachable ? 'Reachable' : 'Unreachable'}</h3>
                    {data.primaryMx && <p className="text-sm opacity-70">Primary MX: {data.primaryMx}</p>}
                  </div>
                </div>
                {data.banner && (
                  <div className="mt-3 bg-white/60 rounded-lg p-3 border border-white/40">
                    <p className="text-xs text-gray-500 mb-1">Server Banner</p>
                    <p className="font-mono text-sm text-gray-800">{data.banner}</p>
                  </div>
                )}
                {data.message && <p className="text-sm text-gray-600 mt-2 ml-8">{data.message}</p>}
              </div>

              {/* MX Records */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">MX Records ({data.mxRecords?.length || 0})</h3>
                  {data.mxRecords?.length > 0 && (
                    <button onClick={() => copy(data.mxRecords.map((mx: any) => `${mx.priority} ${mx.host}`).join('\n'), 'mx')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1">
                      {copied === 'mx' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}Copy
                    </button>
                  )}
                </div>
                {data.mxRecords?.length === 0 ? (
                  <p className="text-gray-400 text-sm">No MX records found for this domain.</p>
                ) : (
                  <div className="space-y-2">
                    {data.mxRecords?.map((mx: any, i: number) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${i === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{mx.priority}</span>
                          <span className="font-mono text-sm text-gray-800">{mx.host}</span>
                        </div>
                        <button onClick={() => copy(mx.host, `mx-${i}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600">
                          {copied === `mx-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-xs text-gray-500">Domain</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{data.domain}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-xs text-gray-500">MX Records</p>
                  <p className="text-sm font-semibold text-gray-900">{data.mxRecords?.length || 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-xs text-gray-500">SMTP Status</p>
                  <p className={`text-sm font-semibold ${data.smtpReachable ? 'text-green-600' : 'text-red-500'}`}>{data.smtpReachable ? 'Online' : 'Offline'}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-xs text-gray-500">Primary MX</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{data.primaryMx || 'N/A'}</p>
                </div>
              </div>
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Test History ({history.length})</h3>
                <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-red-500">Clear</button>
              </div>
              <div className="divide-y divide-gray-100">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 px-2 rounded" onClick={() => setDomain(h.domain)}>
                    <div className="flex items-center gap-2">
                      {h.reachable ? <Wifi className="w-3.5 h-3.5 text-green-500" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                      <span className="text-sm font-medium text-gray-700">{h.domain}</span>
                      {h.primaryMx && <span className="text-xs text-gray-400">{h.primaryMx}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-2 w-full text-left">
              <Info className="w-4 h-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900">About SMTP Testing</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p><strong>SMTP (Simple Mail Transfer Protocol)</strong> is the standard protocol for sending email. This tool checks if a domain&apos;s mail servers are accepting connections.</p>
                <p>It first resolves MX records to find mail servers, then attempts to connect to port 25 on the highest-priority server. The server banner reveals the mail software and sometimes the hostname.</p>
                <p><strong>MX Priority:</strong> Lower numbers = higher priority. If the primary MX is down, the sending server tries the next one.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
