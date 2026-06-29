'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KeyRound, ArrowLeft, Loader2, Copy, Check, Info, Search } from 'lucide-react'

const COMMON_SELECTORS = ['default', 'google', 'selector1', 'selector2', 'k1', 'dkim', 's1', 's2', 'mail']
const SAMPLES = ['google.com', 'microsoft.com', 'github.com', 'amazon.com']
const DKIM_TAGS: Record<string, string> = {
  v: 'Version (must be DKIM1)',
  k: 'Key type (rsa, ed25519)',
  p: 'Public key (base64)',
  t: 'Flags (y=testing, s=strict)',
  h: 'Hash algorithms',
  s: 'Service type',
  n: 'Notes',
}

function parseDKIM(record: string) {
  const tags: { tag: string; value: string; desc: string }[] = []
  const parts = record.split(';').map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const tag = part.substring(0, eq).trim()
    const value = part.substring(eq + 1).trim()
    tags.push({ tag, value, desc: DKIM_TAGS[tag] || 'Unknown tag' })
  }
  return tags
}

export default function DkimCheckerPage() {
  const [domain, setDomain] = useState('')
  const [selector, setSelector] = useState('default')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<{ domain: string; selector: string; valid: boolean; time: string }[]>([])
  const [scanAll, setScanAll] = useState(false)
  const [scanResults, setScanResults] = useState<{ selector: string; valid: boolean; record?: string }[]>([])
  const [scanning, setScanning] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const check = async (d?: string, s?: string) => {
    const dd = d || domain.trim()
    const ss = s || selector.trim()
    if (!dd) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/tools/dkim-checker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: dd, selector: ss }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ domain: dd, selector: ss, valid: json.data.valid, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const scanSelectors = async () => {
    if (!domain.trim()) return
    setScanning(true); setScanResults([])
    const results: { selector: string; valid: boolean; record?: string }[] = []
    for (const s of COMMON_SELECTORS) {
      try {
        const res = await fetch('/api/tools/dkim-checker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: domain.trim(), selector: s }) })
        const json = await res.json()
        results.push({ selector: s, valid: json.data?.valid || false, record: json.data?.record })
      } catch {
        results.push({ selector: s, valid: false })
      }
      setScanResults([...results])
    }
    setScanning(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const parsed = data?.record ? parseDKIM(data.record) : []

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
            <div className="flex items-center justify-center mb-6"><div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg"><KeyRound className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">DKIM <span className="text-slate-500">Checker</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Verify DKIM records with tag breakdown and selector scan</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <div className="flex flex-wrap gap-2 mt-2">
                {SAMPLES.map(s => (
                  <button key={s} onClick={() => setDomain(s)} className="px-2.5 py-1 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg text-xs text-gray-500">{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selector</label>
              <input type="text" value={selector} onChange={e => setSelector(e.target.value)} placeholder="default" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_SELECTORS.map(s => (
                  <button key={s} onClick={() => setSelector(s)} className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${selector === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => check()} disabled={loading || !domain.trim()} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}Check DKIM
              </button>
              <button onClick={scanSelectors} disabled={scanning || !domain.trim()} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 transition-colors">
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}Scan All
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {/* Scan All Results */}
          {scanResults.length > 0 && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Selector Scan Results {scanning && <Loader2 className="w-4 h-4 inline animate-spin ml-2" />}</h3>
              <div className="grid grid-cols-3 gap-2">
                {scanResults.map((r, i) => (
                  <button key={i} onClick={() => { setSelector(r.selector); if (r.valid) check(domain.trim(), r.selector); }}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${r.valid ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${r.valid ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="font-mono text-xs">{r.selector}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {data && (
            <>
              <div className={`rounded-2xl border p-5 ${data.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${data.valid ? 'bg-green-500' : 'bg-red-400'}`} />
                  <h3 className={`text-lg font-semibold ${data.valid ? 'text-green-700' : 'text-red-700'}`}>{data.valid ? 'DKIM Record Found' : 'No DKIM Record Found'}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1 ml-7">Lookup: <code className="bg-white/60 px-1 rounded text-xs">{data.lookupDomain}</code></p>
              </div>

              {data.record && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">DKIM Record</h3>
                    <button onClick={() => copy(data.record, 'dkim')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1">
                      {copied === 'dkim' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}Copy
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono text-xs text-gray-800 break-all">{data.record}</div>

                  {parsed.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Tag Breakdown</h4>
                      <div className="space-y-2">
                        {parsed.map((t, i) => (
                          <div key={i} className="flex items-start gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold shrink-0">{t.tag}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-xs text-gray-800 break-all">{t.value.length > 80 ? t.value.substring(0, 80) + '…' : t.value}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                  <div key={i} className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 px-2 rounded" onClick={() => { setDomain(h.domain); setSelector(h.selector); }}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${h.valid ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="text-sm font-medium text-gray-700">{h.domain}</span>
                      <span className="text-xs text-gray-400 font-mono">{h.selector}</span>
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
              <h3 className="font-semibold text-gray-900">What is DKIM?</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p><strong>DomainKeys Identified Mail (DKIM)</strong> is an email authentication method that uses cryptographic signatures to verify that an email was sent by the domain it claims to be from and wasn&apos;t altered in transit.</p>
                <p>DKIM records are published as DNS TXT records at <code className="bg-gray-100 px-1 rounded">[selector]._domainkey.[domain]</code>. The <strong>selector</strong> identifies which DKIM key pair to use — a domain can have multiple selectors for different email services.</p>
                <p>Key tags: <code className="bg-gray-100 px-1 rounded">v=DKIM1</code> (version), <code className="bg-gray-100 px-1 rounded">k=rsa</code> (key type), <code className="bg-gray-100 px-1 rounded">p=...</code> (public key).</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
