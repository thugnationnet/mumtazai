'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Loader2, Copy, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react'

const SAMPLES = ['google.com', 'microsoft.com', 'github.com', 'amazon.com', 'cloudflare.com']
const POLICY_INFO: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  none: { label: 'Monitor Only', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: '👁️', desc: 'No action taken on failing emails — reports only.' },
  quarantine: { label: 'Quarantine', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: '📦', desc: 'Failing emails are placed in spam/junk folder.' },
  reject: { label: 'Reject', color: 'bg-green-50 border-green-200 text-green-700', icon: '🛡️', desc: 'Failing emails are rejected outright. Strongest protection.' },
}

function gradePolicy(data: any): { grade: string; color: string; tips: string[] } {
  const tips: string[] = []
  let score = 0
  if (data.policy === 'reject') score += 4
  else if (data.policy === 'quarantine') { score += 2; tips.push('Upgrade policy to "reject" for maximum protection') }
  else { score += 0; tips.push('Policy "none" provides no protection — move to quarantine or reject') }
  if (data.rua) score += 2; else tips.push('Add rua (aggregate report) address to receive reports')
  if (data.ruf) score += 1; else tips.push('Add ruf (forensic report) address for detailed failure reports')
  if (data.adkim === 's') score += 1; else tips.push('Consider strict DKIM alignment (adkim=s)')
  if (data.aspf === 's') score += 1; else tips.push('Consider strict SPF alignment (aspf=s)')
  const pct = data.pct ? parseInt(data.pct) : 100
  if (pct < 100) tips.push(`Only ${pct}% of emails are subject to the policy — increase to 100%`)
  else score += 1

  if (score >= 8) return { grade: 'A', color: 'text-green-600 bg-green-50 border-green-200', tips }
  if (score >= 6) return { grade: 'B', color: 'text-blue-600 bg-blue-50 border-blue-200', tips }
  if (score >= 4) return { grade: 'C', color: 'text-amber-600 bg-amber-50 border-amber-200', tips }
  return { grade: 'D', color: 'text-red-600 bg-red-50 border-red-200', tips }
}

export default function DmarcCheckerPage() {
  const [domain, setDomain] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<{ domain: string; valid: boolean; policy?: string; time: string }[]>([])
  const [showInfo, setShowInfo] = useState(false)

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/tools/dmarc-checker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: domain.trim() }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ domain: domain.trim(), valid: json.data.valid, policy: json.data.policy, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const rating = data?.valid ? gradePolicy(data) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Tools</Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6"><div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"><Shield className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">DMARC <span className="text-blue-100">Checker</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Validate DMARC records with policy analysis and security grading</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <div className="flex gap-3">
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} placeholder="example.com" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button onClick={check} disabled={loading || !domain.trim()} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Check DMARC
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
              {/* Status + Grade */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`rounded-2xl border p-5 md:col-span-2 ${data.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${data.valid ? 'bg-green-500' : 'bg-red-400'}`} />
                    <h3 className={`text-lg font-semibold ${data.valid ? 'text-green-700' : 'text-red-700'}`}>{data.valid ? 'DMARC Record Found' : 'No DMARC Record Found'}</h3>
                  </div>
                  {!data.valid && <p className="text-red-600 text-sm mt-2 ml-7">This domain has no DMARC protection — it is vulnerable to email spoofing.</p>}
                </div>
                {rating && (
                  <div className={`rounded-2xl border p-5 flex flex-col items-center justify-center ${rating.color}`}>
                    <span className="text-4xl font-bold">{rating.grade}</span>
                    <span className="text-xs mt-1">Security Grade</span>
                  </div>
                )}
              </div>

              {/* DMARC Record */}
              {data.record && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">DMARC Record</h3>
                    <button onClick={() => copy(data.record, 'dmarc')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1">
                      {copied === 'dmarc' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}Copy
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono text-sm text-gray-800 break-all">{data.record}</div>
                </div>
              )}

              {/* Policy Details */}
              {data.valid && (
                <>
                  {/* Policy Card */}
                  {data.policy && POLICY_INFO[data.policy] && (
                    <div className={`rounded-2xl border p-5 ${POLICY_INFO[data.policy].color}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{POLICY_INFO[data.policy].icon}</span>
                        <div>
                          <h3 className="font-semibold">Policy: {POLICY_INFO[data.policy].label}</h3>
                          <p className="text-sm opacity-80">{POLICY_INFO[data.policy].desc}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parsed Fields */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Record Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Policy (p)', value: data.policy || 'N/A', color: data.policy === 'reject' ? 'text-green-700' : data.policy === 'quarantine' ? 'text-blue-700' : 'text-amber-700' },
                        { label: 'Subdomain Policy (sp)', value: data.subdomainPolicy || 'Inherits domain policy' },
                        { label: 'Aggregate Reports (rua)', value: data.rua || 'Not configured' },
                        { label: 'Forensic Reports (ruf)', value: data.ruf || 'Not configured' },
                        { label: 'Percentage (pct)', value: data.pct ? `${data.pct}%` : '100%' },
                        { label: 'DKIM Alignment (adkim)', value: data.adkim === 's' ? 'Strict' : 'Relaxed' },
                        { label: 'SPF Alignment (aspf)', value: data.aspf === 's' ? 'Strict' : 'Relaxed' },
                      ].map(item => (
                        <div key={item.label} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p className={`text-sm font-medium truncate ${(item as any).color || 'text-gray-900'}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {rating && rating.tips.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Recommendations</h3>
                      <div className="space-y-2">
                        {rating.tips.map((tip, i) => (
                          <div key={i} className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">{tip}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Lookup History ({history.length})</h3>
                <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-red-500">Clear</button>
              </div>
              <div className="divide-y divide-gray-100">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 px-2 rounded" onClick={() => setDomain(h.domain)}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${h.valid ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="text-sm font-medium text-gray-700">{h.domain}</span>
                      {h.policy && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${h.policy === 'reject' ? 'bg-green-100 text-green-700' : h.policy === 'quarantine' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{h.policy}</span>}
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
              <h3 className="font-semibold text-gray-900">What is DMARC?</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p><strong>Domain-based Message Authentication, Reporting, and Conformance (DMARC)</strong> builds on SPF and DKIM to give domain owners control over what happens to unauthenticated emails.</p>
                <p>DMARC records are published as DNS TXT records at <code className="bg-gray-100 px-1 rounded">_dmarc.[domain]</code>. They specify a policy (none/quarantine/reject) and reporting addresses.</p>
                <p><strong>Best practice:</strong> Start with <code className="bg-gray-100 px-1 rounded">p=none</code> to monitor, then ramp up to <code className="bg-gray-100 px-1 rounded">p=quarantine</code> and finally <code className="bg-gray-100 px-1 rounded">p=reject</code> once you confirm legitimate email passes SPF/DKIM.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
