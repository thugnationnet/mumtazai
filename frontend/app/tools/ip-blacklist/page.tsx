'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Loader2, Copy, Check, Download, Info, ShieldCheck, ShieldX, Clock } from 'lucide-react'

const SAMPLE_IPS = ['8.8.8.8', '1.1.1.1', '208.67.222.222', '9.9.9.9', '185.220.101.1']

export default function IpBlacklistPage() {
  const [ip, setIp] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [showInfo, setShowInfo] = useState(false)
  const [filter, setFilter] = useState<'all' | 'listed' | 'clean'>('all')

  const check = async (target?: string) => {
    const t = (target || ip).trim()
    if (!t) return
    if (target) setIp(t)
    setLoading(true); setError(''); setData(null); setFilter('all')
    try {
      const res = await fetch('/api/tools/ip-blacklist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip: t }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ ip: t, listed: json.data.listedCount, total: json.data.totalChecked, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const exportResults = () => {
    if (!data) return
    const lines = [`IP Blacklist Check: ${data.ip}`, `Listed: ${data.listedCount} / ${data.totalChecked}`, '', ...data.checks.map((c: any) => `${c.listed ? '❌ LISTED' : '✅ Clean'}  ${c.blacklist}`)]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `blacklist-${data.ip}.txt`; a.click()
  }

  const filtered = data?.checks?.filter((c: any) => filter === 'all' ? true : filter === 'listed' ? c.listed : !c.listed) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Tools</Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6"><div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"><ShieldAlert className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">IP Blacklist <span className="text-blue-100">Checker</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Check if an IP address is listed on spam and abuse blacklists</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Input */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex gap-3">
              <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="Enter IP address (e.g. 8.8.8.8)" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              <button onClick={() => check()} disabled={loading || !ip.trim()} className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}Check
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-400">Try:</span>
              {SAMPLE_IPS.map(s => (
                <button key={s} onClick={() => check(s)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-brand-50 text-gray-600 hover:text-brand-600 rounded transition-colors font-mono">{s}</button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>

          {data && (
            <>
              {/* Summary */}
              <div className={`rounded-2xl border shadow-lg p-6 ${data.listedCount === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {data.listedCount === 0 ? <ShieldCheck className="w-10 h-10 text-green-600" /> : <ShieldX className="w-10 h-10 text-red-600" />}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{data.ip}</h3>
                      <p className={`text-sm font-medium ${data.listedCount === 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {data.listedCount === 0 ? 'Not listed on any blacklist — IP is clean!' : `Listed on ${data.listedCount} of ${data.totalChecked} blacklists`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copy(data.ip, 'ip')} className="p-2 bg-white/60 hover:bg-white rounded-lg transition-colors">
                      {copied === 'ip' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-600" />}
                    </button>
                    <button onClick={exportResults} className="p-2 bg-white/60 hover:bg-white rounded-lg transition-colors"><Download className="w-4 h-4 text-gray-600" /></button>
                  </div>
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{data.totalChecked}</p>
                    <p className="text-xs text-gray-500">Total Checked</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{data.totalChecked - data.listedCount}</p>
                    <p className="text-xs text-gray-500">Clean</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{data.listedCount}</p>
                    <p className="text-xs text-gray-500">Listed</p>
                  </div>
                </div>
              </div>

              {/* Filter + Results */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Blacklist Results</h3>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {(['all', 'listed', 'clean'] as const).map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {filtered.map((c: any, i: number) => (
                    <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg ${c.listed ? 'bg-red-50' : 'hover:bg-gray-50'} group`}>
                      <span className="font-mono text-sm text-gray-700">{c.blacklist}</span>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 text-sm font-medium ${c.listed ? 'text-red-600' : 'text-green-600'}`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${c.listed ? 'bg-red-500' : 'bg-green-500'}`} />
                          {c.listed ? 'Listed' : 'Clean'}
                        </span>
                        <button onClick={() => copy(c.blacklist, `bl-${i}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600">
                          {copied === `bl-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {filtered.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No results matching filter</p>}
              </div>
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />Check History</h3>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button key={i} onClick={() => check(h.ip)} className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg text-left transition-colors">
                    <span className="font-mono text-sm text-gray-700">{h.ip}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${h.listed === 0 ? 'text-green-600' : 'text-red-600'}`}>{h.listed === 0 ? 'Clean' : `${h.listed} listed`}</span>
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
              <h3 className="font-semibold text-gray-900">About IP Blacklists</h3>
              <span className="ml-auto text-gray-400 text-sm">{showInfo ? '−' : '+'}</span>
            </button>
            {showInfo && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p><strong>IP blacklists</strong> (also called DNSBLs) are real-time databases of IP addresses known to send spam, host malware, or engage in other abusive behavior.</p>
                <p>Being listed on a blacklist can cause your emails to be rejected or marked as spam. If you find your IP listed, contact the blacklist operator for delisting procedures.</p>
                <p>Common reasons for listing include: sending unsolicited email, being part of a botnet, insecure mail server configuration, or shared hosting with a spammer.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
