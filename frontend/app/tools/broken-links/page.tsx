'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LinkIcon, ArrowLeft, Loader2, Download, Info, CheckCircle, XCircle, AlertCircle, Clock, Copy, Check, ExternalLink } from 'lucide-react'

const SAMPLE_URLS = ['https://github.com', 'https://google.com', 'https://example.com']

export default function BrokenLinksPage() {
  const [url, setUrl] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'broken' | 'ok'>('all')
  const [history, setHistory] = useState<any[]>([])
  const [showInfo, setShowInfo] = useState(false)
  const [copied, setCopied] = useState('')

  const check = async (target?: string) => {
    const t = (target || url).trim()
    if (!t) return
    if (target) setUrl(t)
    setLoading(true); setError(''); setData(null); setFilter('all')
    try {
      const res = await fetch('/api/tools/broken-links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: t }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ url: t, broken: json.data.brokenCount, total: json.data.totalLinks, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const exportResults = () => {
    if (!data) return
    const lines = [
      `Broken Links Report: ${url}`, `Total: ${data.totalLinks} | Checked: ${data.checkedLinks} | Broken: ${data.brokenCount}`, '',
      ...data.results.map((r: any) => `${r.ok ? '✅' : '❌'} [${r.status || 'ERR'}] ${r.url}`)
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `broken-links-report.txt`; a.click()
  }

  const filtered = data?.results?.filter((r: any) => filter === 'all' ? true : filter === 'broken' ? !r.ok : r.ok) || []
  const healthPct = data ? Math.round(((data.checkedLinks - data.brokenCount) / Math.max(data.checkedLinks, 1)) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Tools</Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6"><div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"><LinkIcon className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Broken Links <span className="text-blue-100">Checker</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Scan any web page for broken and dead links</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Input */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex gap-3">
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="https://example.com" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              <button onClick={() => check()} disabled={loading || !url.trim()} className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}Scan
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-400">Try:</span>
              {SAMPLE_URLS.map(s => (
                <button key={s} onClick={() => check(s)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-brand-50 text-gray-600 hover:text-brand-600 rounded transition-colors font-mono">{s}</button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>

          {data && (
            <>
              {/* Summary Bar */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Link Health Score</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copy(url, 'url')} className="p-2 text-gray-400 hover:text-brand-600"><Copy className="w-4 h-4" /></button>
                    <button onClick={exportResults} className="p-2 text-gray-400 hover:text-brand-600"><Download className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden mb-4">
                  <div className={`h-full rounded-full transition-all duration-500 ${healthPct === 100 ? 'bg-green-500' : healthPct >= 80 ? 'bg-blue-500' : healthPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${healthPct}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">{healthPct}% Healthy</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{data.totalLinks}</p>
                    <p className="text-xs text-gray-500">Total Found</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{data.checkedLinks}</p>
                    <p className="text-xs text-gray-500">Checked</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{data.checkedLinks - data.brokenCount}</p>
                    <p className="text-xs text-gray-500">OK</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{data.brokenCount}</p>
                    <p className="text-xs text-gray-500">Broken</p>
                  </div>
                </div>
              </div>

              {/* Filter + Link Results */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Link Results</h3>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {(['all', 'broken', 'ok'] as const).map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {f === 'broken' ? `Broken (${data.brokenCount})` : f === 'ok' ? `OK (${data.checkedLinks - data.brokenCount})` : `All (${data.results.length})`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {filtered.map((r: any, i: number) => (
                    <div key={i} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border group ${r.ok ? 'bg-green-50/50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      {r.ok ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : r.status && r.status >= 300 && r.status < 500 ? <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                      <span className="text-sm text-gray-700 truncate flex-1 font-mono">{r.url}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${r.ok ? 'bg-green-100 text-green-700' : r.status >= 300 && r.status < 400 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status || 'ERR'}
                        </span>
                        <button onClick={() => copy(r.url, `link-${i}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600">
                          {copied === `link-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {filtered.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No links matching filter</p>}
              </div>
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />Scan History</h3>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button key={i} onClick={() => check(h.url)} className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg text-left transition-colors">
                    <span className="text-sm text-gray-700 truncate max-w-[60%]">{h.url}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${h.broken === 0 ? 'text-green-600' : 'text-red-600'}`}>{h.broken === 0 ? 'All OK' : `${h.broken} broken`}</span>
                      <span className="text-xs text-gray-400">{h.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-2 w-full text-left">
              <Info className="w-4 h-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900">About Broken Links</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p><strong>Broken links</strong> (HTTP 4xx/5xx) hurt SEO rankings and user experience. Search engines may lower your ranking if your site has many dead links.</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-green-50 rounded-lg p-2 text-center"><p className="text-xs font-semibold text-green-700">2xx</p><p className="text-xs text-gray-500">Success</p></div>
                  <div className="bg-amber-50 rounded-lg p-2 text-center"><p className="text-xs font-semibold text-amber-700">3xx</p><p className="text-xs text-gray-500">Redirect</p></div>
                  <div className="bg-red-50 rounded-lg p-2 text-center"><p className="text-xs font-semibold text-red-700">4xx/5xx</p><p className="text-xs text-gray-500">Broken</p></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
