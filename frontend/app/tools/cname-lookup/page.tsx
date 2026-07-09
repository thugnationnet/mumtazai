'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Server, ArrowLeft, Loader2, Copy, Check, Info, Download } from 'lucide-react'

const SAMPLES = ['google.com', 'microsoft.com', 'github.com', 'cloudflare.com']
const RECORD_TYPES = ['CNAME', 'NS', 'A', 'AAAA', 'SOA', 'TXT', 'MX']
const RECORD_INFO: Record<string, string> = {
  CNAME: 'Canonical name — maps an alias to another domain name.',
  NS: 'Name Server — indicates which DNS servers are authoritative for the domain.',
  A: 'Address — maps a domain to an IPv4 address.',
  AAAA: 'IPv6 Address — maps a domain to an IPv6 address.',
  SOA: 'Start of Authority — primary NS, admin contact, serial, refresh/retry/expire timers.',
  TXT: 'Text — arbitrary text data, commonly used for SPF, DKIM, domain verification.',
  MX: 'Mail Exchange — specifies mail servers that handle email for the domain.',
}

export default function CnameLookupPage() {
  const [domain, setDomain] = useState('')
  const [recordType, setRecordType] = useState('CNAME')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<{ domain: string; type: string; count: number; time: string }[]>([])
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkResults, setBulkResults] = useState<{ type: string; records: string[]; count: number }[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  const lookup = async (d?: string, t?: string) => {
    const dd = d || domain.trim()
    const tt = t || recordType
    if (!dd) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/tools/cname-lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: dd, recordType: tt }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
      setHistory(prev => [{ domain: dd, type: tt, count: json.data.records?.length || 0, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15))
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const lookupAll = async () => {
    if (!domain.trim()) return
    setBulkLoading(true); setBulkResults([])
    const results: { type: string; records: string[]; count: number }[] = []
    for (const t of RECORD_TYPES) {
      try {
        const res = await fetch('/api/tools/cname-lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: domain.trim(), recordType: t }) })
        const json = await res.json()
        results.push({ type: t, records: json.data?.records || [], count: json.data?.records?.length || 0 })
      } catch {
        results.push({ type: t, records: [], count: 0 })
      }
      setBulkResults([...results])
    }
    setBulkLoading(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const exportResults = () => {
    const lines = bulkResults.length > 0
      ? bulkResults.map(r => `--- ${r.type} (${r.count}) ---\n${r.records.join('\n') || 'No records'}`).join('\n\n')
      : data ? `--- ${data.type} for ${data.domain} ---\n${data.records.join('\n') || 'No records'}` : ''
    const blob = new Blob([`DNS Lookup: ${domain}\n${new Date().toISOString()}\n\n${lines}`], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `dns-${domain}-${Date.now()}.txt`; a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Tools</Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6"><div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"><Server className="w-10 h-10 text-white" /></div></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">DNS Record <span className="text-blue-100">Lookup</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Look up CNAME, NS, A, AAAA, SOA, TXT, and MX records</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 space-y-4">
            <div className="flex gap-3">
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()} placeholder="example.com" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button onClick={() => lookup()} disabled={loading || !domain.trim()} className="px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Lookup
              </button>
              <button onClick={lookupAll} disabled={bulkLoading || !domain.trim()} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 transition-colors text-sm">
                {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}All Types
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
            <p className="text-xs text-gray-400 flex items-center gap-1"><Info className="w-3 h-3" />{RECORD_INFO[recordType]}</p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {/* Bulk All-Types Results */}
          {bulkResults.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All DNS Records for {domain} {bulkLoading && <Loader2 className="w-4 h-4 inline animate-spin ml-2" />}</h3>
                <button onClick={exportResults} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1"><Download className="w-3.5 h-3.5" />Export</button>
              </div>
              <div className="space-y-4">
                {bulkResults.map((r, i) => (
                  <div key={i} className={`rounded-lg border p-4 ${r.count > 0 ? 'bg-gray-50 border-gray-200' : 'bg-gray-50/50 border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded text-xs font-bold">{r.type}</span>
                        <span className="text-xs text-gray-500">{r.count} record{r.count !== 1 ? 's' : ''}</span>
                      </div>
                      {r.count > 0 && (
                        <button onClick={() => copy(r.records.join('\n'), `bulk-${r.type}`)} className="text-gray-400 hover:text-brand-600">
                          {copied === `bulk-${r.type}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                    {r.count > 0 ? (
                      <div className="space-y-1">
                        {r.records.map((rec, j) => (
                          <p key={j} className="font-mono text-xs text-gray-700 break-all">{rec}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No records found</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Lookup Results */}
          {data && bulkResults.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded text-sm mr-2">{data.type}</span>
                  {data.domain}
                </h3>
                <div className="flex items-center gap-2">
                  {data.records?.length > 0 && (
                    <>
                      <button onClick={exportResults} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1"><Download className="w-3.5 h-3.5" />Export</button>
                      <button onClick={() => copy(data.records.join('\n'), 'all')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1">
                        {copied === 'all' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}Copy All
                      </button>
                    </>
                  )}
                </div>
              </div>
              {data.records?.length === 0 ? (
                <p className="text-gray-500 text-sm">No {data.type} records found for this domain.</p>
              ) : (
                <div className="space-y-2">
                  {data.records?.map((r: string, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 font-mono text-sm text-gray-800 break-all group flex items-start justify-between gap-2">
                      <span>{r}</span>
                      <button onClick={() => copy(r, `r-${i}`)} className="opacity-0 group-hover:opacity-100 shrink-0 text-gray-400 hover:text-brand-600 mt-0.5">
                        {copied === `r-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  <div key={i} className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 px-2 rounded" onClick={() => { setDomain(h.domain); setRecordType(h.type); }}>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">{h.type}</span>
                      <span className="text-sm font-medium text-gray-700">{h.domain}</span>
                      <span className="text-xs text-gray-400">{h.count} record{h.count !== 1 ? 's' : ''}</span>
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
