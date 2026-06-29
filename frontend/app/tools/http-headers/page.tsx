'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FileText, ArrowLeft, Copy, Check, Loader2, Shield, Zap, Search, Download, Trash2, Globe, AlertTriangle, CheckCircle, XCircle, Info, Filter, Clock, ExternalLink } from 'lucide-react'

interface HeaderData {
  url: string
  status: number
  statusText: string
  headers: Record<string, string>
  timing?: number
}

type TabId = 'all' | 'security' | 'performance' | 'caching'

const securityHeaderDefs: Record<string, { desc: string; fix: string; severity: 'critical' | 'high' | 'medium' | 'low' }> = {
  'strict-transport-security': { desc: 'Enforces HTTPS connections, preventing downgrade attacks', fix: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload', severity: 'critical' },
  'content-security-policy': { desc: 'Controls resource loading to prevent XSS and data injection', fix: "Add: Content-Security-Policy: default-src 'self'; script-src 'self'", severity: 'critical' },
  'x-frame-options': { desc: 'Prevents clickjacking by controlling iframe embedding', fix: 'Add: X-Frame-Options: DENY (or SAMEORIGIN)', severity: 'high' },
  'x-content-type-options': { desc: 'Prevents MIME type sniffing', fix: 'Add: X-Content-Type-Options: nosniff', severity: 'high' },
  'x-xss-protection': { desc: 'Legacy XSS filter (deprecated but still useful)', fix: 'Add: X-XSS-Protection: 1; mode=block', severity: 'low' },
  'referrer-policy': { desc: 'Controls referrer information sent with requests', fix: 'Add: Referrer-Policy: strict-origin-when-cross-origin', severity: 'medium' },
  'permissions-policy': { desc: 'Controls browser feature access (camera, mic, location, etc.)', fix: 'Add: Permissions-Policy: camera=(), microphone=(), geolocation=()', severity: 'medium' },
  'cross-origin-opener-policy': { desc: 'Isolates browsing context for cross-origin protection', fix: 'Add: Cross-Origin-Opener-Policy: same-origin', severity: 'medium' },
  'cross-origin-resource-policy': { desc: 'Prevents cross-origin resource sharing attacks', fix: 'Add: Cross-Origin-Resource-Policy: same-origin', severity: 'medium' },
  'cross-origin-embedder-policy': { desc: 'Enables SharedArrayBuffer and high-res timers safely', fix: 'Add: Cross-Origin-Embedder-Policy: require-corp', severity: 'low' },
}

const headerDocs: Record<string, string> = {
  'content-type': 'MIME type of the response body',
  'content-length': 'Size of the response body in bytes',
  'content-encoding': 'Compression algorithm used (gzip, br, deflate)',
  'cache-control': 'Directives for request/response caching',
  'etag': 'Identifier for a specific version of a resource',
  'last-modified': 'Date the resource was last changed',
  'expires': 'Date/time after which the response is stale',
  'age': 'Time in seconds since response generated/revalidated',
  'vary': 'Headers used by server to determine cached response',
  'server': 'Info about the software used by the origin server',
  'x-powered-by': 'Technology powering the application (consider removing)',
  'set-cookie': 'Cookie to store on the client side',
  'access-control-allow-origin': 'Origins allowed by CORS policy',
  'access-control-allow-methods': 'HTTP methods allowed by CORS',
  'connection': 'Connection management options',
  'transfer-encoding': 'Form of encoding used for safe transfer',
  'date': 'Date and time the response was generated',
  'accept-ranges': 'Whether partial requests are supported',
  'x-request-id': 'Unique identifier for tracking the request',
  'x-dns-prefetch-control': 'Controls DNS prefetching by browsers',
  'nel': 'Network Error Logging configuration',
  'report-to': 'Endpoint for browser reporting API',
  'alt-svc': 'Alternative services available (HTTP/3, QUIC)',
}

const performanceHeaders = ['content-encoding', 'transfer-encoding', 'connection', 'keep-alive', 'alt-svc', 'server-timing', 'x-response-time']
const cachingHeaders = ['cache-control', 'etag', 'last-modified', 'expires', 'age', 'vary', 'pragma']

const quickUrls = [
  { label: 'Google', url: 'https://google.com' },
  { label: 'GitHub', url: 'https://github.com' },
  { label: 'Cloudflare', url: 'https://cloudflare.com' },
  { label: 'Amazon', url: 'https://amazon.com' },
  { label: 'MDN', url: 'https://developer.mozilla.org' },
  { label: 'Twitter/X', url: 'https://x.com' },
]

export default function HttpHeadersPage() {
  const [url, setUrl] = useState('')
  const [data, setData] = useState<HeaderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | false>(false)
  const [tab, setTab] = useState<TabId>('all')
  const [searchFilter, setSearchFilter] = useState('')
  const [expandedHeader, setExpandedHeader] = useState<string | null>(null)
  const [history, setHistory] = useState<{ url: string; status: number; score: number; timestamp: string }[]>([])

  const check = async () => {
    const rawUrl = url.trim()
    if (!rawUrl) return
    setLoading(true)
    setError('')
    setData(null)
    const startTime = performance.now()
    try {
      const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
      const res = await fetch('/api/tools/http-headers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      const timing = Math.round(performance.now() - startTime)
      setData({ ...json.data, timing })
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  // Security score
  const securityScore = useMemo(() => {
    if (!data) return 0
    const weights: Record<string, number> = { critical: 25, high: 15, medium: 10, low: 5 }
    let total = 0, earned = 0
    for (const [header, def] of Object.entries(securityHeaderDefs)) {
      const w = weights[def.severity]
      total += w
      if (Object.keys(data.headers).some(k => k.toLowerCase() === header)) earned += w
    }
    return Math.round((earned / total) * 100)
  }, [data])

  // Add to history after successful check
  const addToHistory = () => {
    if (!data) return
    setHistory(prev => [{ url: data.url, status: data.status, score: securityScore, timestamp: new Date().toISOString() }, ...prev].slice(0, 15))
  }

  // Auto-add history on data change
  useMemo(() => { if (data) addToHistory() }, [data])

  // Filter headers by tab and search
  const filteredHeaders = useMemo(() => {
    if (!data) return []
    let entries = Object.entries(data.headers)
    if (tab === 'security') entries = entries.filter(([k]) => Object.keys(securityHeaderDefs).includes(k.toLowerCase()) || k.toLowerCase().startsWith('x-'))
    else if (tab === 'performance') entries = entries.filter(([k]) => performanceHeaders.includes(k.toLowerCase()) || k.toLowerCase().includes('encoding') || k.toLowerCase().includes('timing'))
    else if (tab === 'caching') entries = entries.filter(([k]) => cachingHeaders.includes(k.toLowerCase()))
    if (searchFilter) entries = entries.filter(([k, v]) => k.toLowerCase().includes(searchFilter.toLowerCase()) || v.toLowerCase().includes(searchFilter.toLowerCase()))
    return entries
  }, [data, tab, searchFilter])

  const copyAll = async () => {
    if (!data) return
    const text = Object.entries(data.headers).map(([k, v]) => `${k}: ${v}`).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied('all')
    setTimeout(() => setCopied(false), 1500)
  }

  const copySingle = async (key: string, value: string) => {
    await navigator.clipboard.writeText(`${key}: ${value}`)
    setCopied(key)
    setTimeout(() => setCopied(false), 1200)
  }

  const exportReport = (format: 'json' | 'txt') => {
    if (!data) return
    let content: string, mime: string, ext: string
    if (format === 'json') {
      content = JSON.stringify({ url: data.url, status: data.status, securityScore, headers: data.headers, timing: data.timing }, null, 2)
      mime = 'application/json'; ext = 'json'
    } else {
      const lines = [`HTTP Headers Report`, `URL: ${data.url}`, `Status: ${data.status} ${data.statusText}`, `Security Score: ${securityScore}/100`, `Response Time: ${data.timing}ms`, '', '--- Headers ---', ...Object.entries(data.headers).map(([k, v]) => `${k}: ${v}`), '', '--- Security Check ---']
      for (const [h, def] of Object.entries(securityHeaderDefs)) {
        const present = Object.keys(data.headers).some(k => k.toLowerCase() === h)
        lines.push(`${present ? '✓' : '✗'} ${h} [${def.severity}] — ${present ? 'Present' : 'MISSING: ' + def.fix}`)
      }
      content = lines.join('\n'); mime = 'text/plain'; ext = 'txt'
    }
    const blob = new Blob([content], { type: mime })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `headers-report.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const scoreColor = securityScore >= 80 ? 'text-green-600' : securityScore >= 50 ? 'text-yellow-600' : 'text-red-600'
  const scoreBg = securityScore >= 80 ? 'bg-green-500' : securityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  const scoreLabel = securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : securityScore >= 40 ? 'Fair' : 'Poor'

  const tabs: { id: TabId; label: string; icon: any; count?: number }[] = [
    { id: 'all', label: 'All Headers', icon: Globe, count: data ? Object.keys(data.headers).length : 0 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'caching', label: 'Caching', icon: Clock },
  ]

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
          <Link href="/tools" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-500 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Tools
          </Link>
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg">
                <FileText className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">HTTP Headers <span className="text-slate-500">Analyzer</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Deep-inspect HTTP response headers with security scoring, performance analysis, and remediation tips</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Input */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <div className="flex gap-3">
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="https://example.com" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button onClick={check} disabled={loading || !url.trim()} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}Analyze
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {quickUrls.map(q => (
                <button key={q.url} onClick={() => { setUrl(q.url); }} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs transition-colors">
                  {q.label}
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />{error}</p>}
          </div>

          {data && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg shadow p-4 text-center">
                  <span className={`text-3xl font-bold ${data.status < 400 ? 'text-green-600' : 'text-red-600'}`}>{data.status}</span>
                  <p className="text-xs text-gray-500 mt-1">{data.statusText}</p>
                </div>
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg shadow p-4 text-center">
                  <span className={`text-3xl font-bold ${scoreColor}`}>{securityScore}</span>
                  <p className="text-xs text-gray-500 mt-1">Security Score</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full ${scoreBg} transition-all`} style={{ width: `${securityScore}%` }} />
                  </div>
                </div>
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg shadow p-4 text-center">
                  <span className="text-3xl font-bold text-blue-600">{Object.keys(data.headers).length}</span>
                  <p className="text-xs text-gray-500 mt-1">Headers Found</p>
                </div>
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg shadow p-4 text-center">
                  <span className="text-3xl font-bold text-purple-600">{data.timing || '—'}ms</span>
                  <p className="text-xs text-gray-500 mt-1">Response Time</p>
                </div>
              </div>

              {/* Tabs + Actions */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg overflow-hidden">
                <div className="border-b border-gray-200 px-6 pt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1">
                    {tabs.map(t => (
                      <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2.5 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <t.icon className="w-3.5 h-3.5" />{t.label}
                        {t.count != null && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{t.count}</span>}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Filter headers..." className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40" />
                    </div>
                    <button onClick={copyAll} className="p-1.5 text-gray-400 hover:text-gray-600" title="Copy all">
                      {copied === 'all' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => exportReport('json')} className="p-1.5 text-gray-400 hover:text-gray-600" title="Export JSON"><Download className="w-4 h-4" /></button>
                    <button onClick={() => exportReport('txt')} className="p-1.5 text-gray-400 hover:text-gray-600" title="Export TXT"><FileText className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Header List */}
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {filteredHeaders.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No headers match this filter</div>
                  ) : filteredHeaders.map(([key, value]) => {
                    const keyLower = key.toLowerCase()
                    const isSecHeader = keyLower in securityHeaderDefs
                    const doc = headerDocs[keyLower] || (isSecHeader ? securityHeaderDefs[keyLower].desc : null)
                    const isExpanded = expandedHeader === key
                    return (
                      <div key={key} className={`px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50' : ''}`} onClick={() => setExpandedHeader(isExpanded ? null : key)}>
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-sm font-semibold ${isSecHeader ? 'text-green-700' : 'text-gray-800'}`}>{key}</span>
                              {isSecHeader && <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${securityHeaderDefs[keyLower].severity === 'critical' ? 'bg-red-100 text-red-600' : securityHeaderDefs[keyLower].severity === 'high' ? 'bg-orange-100 text-orange-600' : securityHeaderDefs[keyLower].severity === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>{securityHeaderDefs[keyLower].severity}</span>}
                            </div>
                            <p className="font-mono text-sm text-gray-500 break-all mt-0.5 line-clamp-2">{value}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); copySingle(key, value) }} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                            {copied === key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {isExpanded && doc && (
                          <div className="mt-2 pl-0 bg-blue-50 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{doc}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Security Audit */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" />Security Audit</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${scoreColor} ${securityScore >= 80 ? 'bg-green-50' : securityScore >= 50 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                    {securityScore}/100 — {scoreLabel}
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(securityHeaderDefs).map(([header, def]) => {
                    const present = Object.keys(data.headers).some(k => k.toLowerCase() === header)
                    const headerValue = Object.entries(data.headers).find(([k]) => k.toLowerCase() === header)?.[1]
                    return (
                      <div key={header} className={`rounded-xl p-4 border ${present ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                        <div className="flex items-start gap-3">
                          {present ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-gray-900">{header}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${def.severity === 'critical' ? 'bg-red-100 text-red-600' : def.severity === 'high' ? 'bg-orange-100 text-orange-600' : def.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>{def.severity}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{def.desc}</p>
                            {present && headerValue && <p className="font-mono text-xs text-green-700 bg-green-100 rounded px-2 py-1 mt-2 break-all">{headerValue}</p>}
                            {!present && <p className="text-xs text-red-600 bg-red-100 rounded px-2 py-1 mt-2 font-mono">{def.fix}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Caching Analysis */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-blue-600" />Caching Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cachingHeaders.map(h => {
                    const entry = Object.entries(data.headers).find(([k]) => k.toLowerCase() === h)
                    return (
                      <div key={h} className={`rounded-lg p-3 border ${entry ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <span className="font-mono text-xs font-bold text-gray-700 block">{h}</span>
                        {entry ? <span className="font-mono text-xs text-blue-700 break-all">{entry[1]}</span> : <span className="text-xs text-gray-400 italic">Not set</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Check History</h3>
                <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className={`w-2 h-2 rounded-full ${h.status < 400 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <button onClick={() => { setUrl(h.url); }} className="font-mono text-sm text-gray-700 hover:text-blue-600 truncate text-left flex-1">{h.url}</button>
                    <span className="text-xs font-mono text-gray-400">{h.status}</span>
                    <span className={`text-xs font-bold ${h.score >= 80 ? 'text-green-600' : h.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{h.score}%</span>
                    <span className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🛡️', title: 'Security Scoring', desc: '10 security headers checked with severity levels, remediation guidance, and a 0-100 composite score' },
              { icon: '🔍', title: 'Deep Analysis', desc: 'Inline documentation for every header, filterable tabs (Security, Performance, Caching), and searchable list' },
              { icon: '📊', title: 'Export & History', desc: 'Export reports as JSON or TXT, copy individual headers, and track check history with scores' },
            ].map((f, i) => (
              <div key={i} className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-1">{f.title}</h4>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
