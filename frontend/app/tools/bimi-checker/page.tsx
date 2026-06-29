'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ImageIcon, ArrowLeft, Loader2, Copy, Check, Info, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'

const SAMPLE_DOMAINS = ['google.com', 'linkedin.com', 'bank.barclays', 'cnn.com', 'paypal.com']

export default function BimiCheckerPage() {
  const [domain, setDomain] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [showInfo, setShowInfo] = useState(false)

  const check = async (target?: string) => {
    const t = (target || domain).trim()
    if (!t) return
    if (target) setDomain(t)
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/tools/bimi-checker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: t }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ domain: t, valid: json.data.valid, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
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
            <div className="flex items-center justify-center mb-6"><div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg"><ImageIcon className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">BIMI <span className="text-slate-500">Checker</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Check Brand Indicators for Message Identification records</p>
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}Check
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
              {/* Status */}
              <div className={`rounded-2xl border shadow-lg p-6 ${data.valid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-4">
                  {data.valid ? <CheckCircle className="w-10 h-10 text-green-600" /> : <XCircle className="w-10 h-10 text-amber-600" />}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{data.domain || domain}</h3>
                    <p className={`text-sm font-medium ${data.valid ? 'text-green-700' : 'text-amber-700'}`}>
                      {data.valid ? 'BIMI Record Found — Brand logo configured' : 'No BIMI Record Detected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Record */}
              {data.record && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">BIMI TXT Record</p>
                    <button onClick={() => copy(data.record, 'record')} className="text-gray-400 hover:text-blue-600">
                      {copied === 'record' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="font-mono text-sm text-gray-800 break-all">{data.record}</p>
                  </div>
                </div>
              )}

              {/* Logo & Certificate */}
              {data.valid && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Logo URL (l=)</h4>
                    {data.logoUrl ? (
                      <>
                        {/* Logo preview */}
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-3 flex items-center justify-center min-h-[80px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={data.logoUrl} alt="BIMI Logo" className="max-h-20 max-w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                        <div className="flex items-center gap-2 group">
                          <p className="font-mono text-xs text-gray-600 break-all flex-1">{data.logoUrl}</p>
                          <button onClick={() => copy(data.logoUrl, 'logo')} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 flex-shrink-0">
                            {copied === 'logo' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">Not specified</p>
                    )}
                  </div>

                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">VMC Certificate (a=)</h4>
                    {data.certificateUrl ? (
                      <div className="flex items-center gap-2 group">
                        <p className="font-mono text-xs text-gray-600 break-all flex-1">{data.certificateUrl}</p>
                        <button onClick={() => copy(data.certificateUrl, 'cert')} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 flex-shrink-0">
                          {copied === 'cert' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Not specified</p>
                    )}
                    <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-blue-700">A VMC (Verified Mark Certificate) from a trusted CA is required for Gmail and Apple Mail to display the logo.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements checklist if no BIMI */}
              {!data.valid && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">BIMI Requirements</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'DMARC policy set to "quarantine" or "reject"', required: true },
                      { label: 'SPF or DKIM authentication passing', required: true },
                      { label: 'SVG Tiny P/S logo file hosted at a public URL', required: true },
                      { label: 'VMC certificate from DigiCert or Entrust (for Gmail)', required: false },
                      { label: `TXT record at default._bimi.${domain || 'yourdomain.com'}`, required: true },
                    ].map((req, i) => (
                      <div key={i} className="flex items-start gap-3 py-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${req.required ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{req.required ? 'Required' : 'Optional'}</span>
                        <span className="text-sm text-gray-700">{req.label}</span>
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
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />Check History</h3>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button key={i} onClick={() => check(h.domain)} className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg text-left transition-colors">
                    <span className="font-mono text-sm text-gray-700">{h.domain}</span>
                    <div className="flex items-center gap-3">
                      {h.valid ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-amber-500" />}
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
              <h3 className="font-semibold text-gray-900">What is BIMI?</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p><strong>BIMI</strong> (Brand Indicators for Message Identification) is an email standard that allows organizations to display their brand logo next to authenticated emails in supporting inboxes (Gmail, Apple Mail, Yahoo, etc.).</p>
                <p>It works by publishing a TXT record at <code className="bg-gray-100 px-1 rounded text-xs">default._bimi.yourdomain.com</code> containing a link to your SVG logo and optionally a VMC certificate.</p>
                <p>BIMI requires a strong DMARC policy (quarantine or reject) as a prerequisite, ensuring only authenticated emails can display the brand logo.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
