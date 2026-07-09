'use client'

import { useState, useCallback, useEffect } from 'react'
import { FileText, Search, Loader2, XCircle, ArrowLeft, Calendar, User, Globe, Server, Download, History, Star, StarOff, Wifi, Layers, RefreshCcw, CheckCircle, Shield } from 'lucide-react'
import Link from 'next/link'

/* ─── Types (from service file) ─────────────────────────────── */
interface WHOISResult {
  domain: string
  registrar: { name: string; url: string; abuseEmail: string }
  registrant: { name: string; organization: string; email: string; country: string }
  dates: { created: string; updated: string; expires: string; registeredFor: string }
  nameservers: string[]
  statuses: string[]
  domainInfo: { tld: string; isAvailable: boolean }
  security: { dnssec: boolean; privacyProtected: boolean }
  raw: string
}

interface IPResult {
  ip: string
  reverseDNS: string
  location: { country: string; city: string; region: string; latitude: number; longitude: number; timezone: string }
  network: { range: string; cidr: string; organization: string }
  isp: { name: string; asn: string }
  abuse: { email: string; phone: string }
  raw: string
}

interface DNSResult {
  domain: string
  records: { type: string; name: string; value: string; ttl: number }[]
  authoritative: string[]
  totalRecords: number
  queriedTypes: string[]
}

interface WHOISQuery {
  id: string; domain: string; timestamp: string; queryTime: number; success: boolean; queryType: string; error?: string
}

/* ─── Hook ──────────────────────────────────────────────────── */
function useWhoisLookup() {
  const [isQuerying, setIsQuerying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [domainResult, setDomainResult] = useState<WHOISResult | null>(null)
  const [ipResult, setIPResult] = useState<IPResult | null>(null)
  const [dnsResult, setDNSResult] = useState<DNSResult | null>(null)
  const [queryHistory, setQueryHistory] = useState<WHOISQuery[]>([])
  const [favorites, setFavorites] = useState<string[]>([])

  const loadState = useCallback(async () => {
    try {
      const res = await fetch('/api/user/preferences/tool-state/whois_lookup', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        setQueryHistory(json.data?.history || [])
        setFavorites(json.data?.favorites || [])
      }
    } catch { /* silent */ }
  }, [])

  const saveState = useCallback(async (key: string, value: unknown) => {
    try {
      await fetch('/api/user/preferences/tool-state/whois_lookup', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ [key]: value }),
      })
    } catch { /* silent */ }
  }, [])

  useEffect(() => { loadState() }, [loadState])

  const addToHistory = useCallback((entry: WHOISQuery) => {
    setQueryHistory(prev => {
      const next = [entry, ...prev].slice(0, 100)
      saveState('history', next)
      return next
    })
  }, [saveState])

  const lookupDomain = useCallback(async (domain: string) => {
    setIsQuerying(true); setError(null); setDomainResult(null)
    const start = Date.now()
    try {
      const res = await fetch('/api/tools/whois-lookup/domain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'WHOIS lookup failed')
      const result: WHOISResult = { ...data.result, queryTime: Date.now() - start }
      setDomainResult(result)
      addToHistory({ id: `q_${Date.now()}`, domain: result.domain, timestamp: new Date().toISOString(), queryTime: Date.now() - start, success: true, queryType: 'domain' })
      return result
    } catch (err: any) {
      setError(err.message || 'WHOIS lookup failed')
      addToHistory({ id: `q_${Date.now()}`, domain, timestamp: new Date().toISOString(), queryTime: Date.now() - start, success: false, queryType: 'domain', error: err.message })
      return null
    } finally { setIsQuerying(false) }
  }, [addToHistory])

  const lookupIP = useCallback(async (ip: string) => {
    setIsQuerying(true); setError(null); setIPResult(null)
    try {
      const res = await fetch('/api/tools/whois-lookup/ip', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ip.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'IP lookup failed')
      setIPResult(data.result)
      addToHistory({ id: `q_${Date.now()}`, domain: ip, timestamp: new Date().toISOString(), queryTime: 0, success: true, queryType: 'ip' })
      return data.result
    } catch (err: any) {
      setError(err.message || 'IP lookup failed')
      return null
    } finally { setIsQuerying(false) }
  }, [addToHistory])

  const lookupDNS = useCallback(async (domain: string, recordType?: string) => {
    setIsQuerying(true); setError(null); setDNSResult(null)
    try {
      const res = await fetch('/api/tools/whois-lookup/dns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim().toLowerCase(), recordType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'DNS lookup failed')
      setDNSResult(data.result)
      addToHistory({ id: `q_${Date.now()}`, domain, timestamp: new Date().toISOString(), queryTime: 0, success: true, queryType: 'dns' })
      return data.result
    } catch (err: any) {
      setError(err.message || 'DNS lookup failed')
      return null
    } finally { setIsQuerying(false) }
  }, [addToHistory])

  const toggleFavorite = useCallback((domain: string) => {
    setFavorites(prev => {
      const d = domain.trim().toLowerCase()
      const next = prev.includes(d) ? prev.filter(f => f !== d) : [...prev, d]
      saveState('favorites', next)
      return next
    })
  }, [saveState])

  const exportResult = useCallback(async (format: 'json' | 'csv' | 'txt', result?: WHOISResult) => {
    const data = result || domainResult
    if (!data) return
    try {
      const res = await fetch('/api/tools/whois-lookup/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, result: data }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url
        a.download = `whois-${data.domain}-${Date.now()}.${format}`
        a.click(); window.URL.revokeObjectURL(url)
      }
    } catch { /* silent */ }
  }, [domainResult])

  return { isQuerying, error, domainResult, ipResult, dnsResult, queryHistory, favorites, lookupDomain, lookupIP, lookupDNS, toggleFavorite, exportResult }
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function WhoisLookupPage() {
  const { isQuerying, error, domainResult, ipResult, dnsResult, queryHistory, favorites, lookupDomain, lookupIP, lookupDNS, toggleFavorite, exportResult } = useWhoisLookup()
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState<'domain' | 'ip' | 'dns' | 'history' | 'favorites'>('domain')
  const [dnsRecordType, setDnsRecordType] = useState('')
  const [showRaw, setShowRaw] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    if (activeTab === 'domain') await lookupDomain(input)
    else if (activeTab === 'ip') await lookupIP(input)
    else if (activeTab === 'dns') await lookupDNS(input, dnsRecordType || undefined)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-600 to-accent-600">
        <div className="container-custom py-8">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Network Tools
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2 text-white">WHOIS <span className="text-orange-200">Lookup</span></h1>
            <p className="text-lg text-blue-100">Domain, IP &amp; DNS record lookups with history and export</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container-custom flex gap-1 overflow-x-auto">
          {[
            { id: 'domain' as const, label: 'Domain WHOIS', icon: Globe },
            { id: 'ip' as const, label: 'IP Lookup', icon: Wifi },
            { id: 'dns' as const, label: 'DNS Records', icon: Layers },
            { id: 'history' as const, label: `History (${queryHistory.length})`, icon: History },
            { id: 'favorites' as const, label: `Favorites (${favorites.length})`, icon: Star },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container-custom py-8 max-w-6xl mx-auto">
        {/* Search Form (shown for domain, ip, dns tabs) */}
        {['domain', 'ip', 'dns'].includes(activeTab) && (
          <div className="max-w-3xl mx-auto mb-8">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={input} onChange={e => setInput(e.target.value)}
                    placeholder={activeTab === 'domain' ? 'Enter domain (e.g., example.com)' : activeTab === 'ip' ? 'Enter IP address (e.g., 8.8.8.8)' : 'Enter domain for DNS lookup'}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all outline-none shadow-lg"
                    disabled={isQuerying} />
                </div>
                {activeTab === 'dns' && (
                  <select value={dnsRecordType} onChange={e => setDnsRecordType(e.target.value)} className="px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-orange-500 outline-none shadow-lg">
                    <option value="">All Records</option>
                    {['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'PTR', 'SRV'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
                <button type="submit" disabled={isQuerying || !input.trim()} className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-300 rounded-xl font-semibold text-white transition-all flex items-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 whitespace-nowrap">
                  {isQuerying ? <><Loader2 className="w-4 h-4 animate-spin" />Looking up...</> : <><Search className="w-4 h-4" />Lookup</>}
                </button>
              </div>
            </form>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ─── DOMAIN RESULT ─── */}
        {activeTab === 'domain' && domainResult && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Domain header */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-mono">{domainResult.domain}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      {domainResult.security.dnssec ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                      DNSSEC
                    </span>
                    <span className="flex items-center gap-1">
                      {domainResult.security.privacyProtected ? <Shield className="w-4 h-4 text-blue-500" /> : <User className="w-4 h-4 text-gray-400" />}
                      {domainResult.security.privacyProtected ? 'Privacy Protected' : 'Public Registration'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleFavorite(domainResult.domain)} className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors ${favorites.includes(domainResult.domain) ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {favorites.includes(domainResult.domain) ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                    {favorites.includes(domainResult.domain) ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <button onClick={() => exportResult('json')} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm flex items-center gap-1 transition-colors">
                    <Download className="w-4 h-4" />JSON
                  </button>
                  <button onClick={() => exportResult('csv')} className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm flex items-center gap-1 transition-colors">
                    <Download className="w-4 h-4" />CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registrar */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><Server className="w-5 h-5 text-orange-600" /></div>
                  <h3 className="text-lg font-semibold text-gray-900">Registrar</h3>
                </div>
                <p className="text-gray-700">{domainResult.registrar.name}</p>
                {domainResult.registrar.url && <a href={domainResult.registrar.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-1 block">{domainResult.registrar.url}</a>}
              </div>

              {/* Registrant */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><User className="w-5 h-5 text-purple-600" /></div>
                  <h3 className="text-lg font-semibold text-gray-900">Registrant</h3>
                </div>
                <p className="text-gray-700">{domainResult.registrant.name || 'REDACTED'}</p>
                {domainResult.registrant.organization && <p className="text-sm text-gray-500">{domainResult.registrant.organization}</p>}
                {domainResult.registrant.country && <p className="text-sm text-gray-500">{domainResult.registrant.country}</p>}
              </div>

              {/* Dates */}
              {['created', 'expires', 'updated'].filter(k => (domainResult.dates as Record<string, string>)[k]).map(key => (
                <div key={key} className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${key === 'created' ? 'bg-green-100' : key === 'expires' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <Calendar className={`w-5 h-5 ${key === 'created' ? 'text-green-600' : key === 'expires' ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">{key}</h3>
                  </div>
                  <p className="text-gray-700">{new Date((domainResult.dates as Record<string, string>)[key]).toLocaleDateString()}</p>
                </div>
              ))}
            </div>

            {/* Name Servers */}
            {domainResult.nameservers.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Name Servers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {domainResult.nameservers.map((ns, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono text-sm text-gray-900">{ns}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Statuses */}
            {domainResult.statuses.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Domain Status</h3>
                <div className="flex flex-wrap gap-2">
                  {domainResult.statuses.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-700">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Raw WHOIS */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <button onClick={() => setShowRaw(!showRaw)} className="text-lg font-semibold text-gray-900 flex items-center gap-2 hover:text-blue-600 transition-colors">
                Raw WHOIS Data {showRaw ? '▲' : '▼'}
              </button>
              {showRaw && domainResult.raw && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-200">
                  <pre className="text-sm text-gray-600 font-mono whitespace-pre-wrap">{domainResult.raw}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── IP RESULT ─── */}
        {activeTab === 'ip' && ipResult && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 font-mono mb-1">{ipResult.ip}</h2>
              {ipResult.reverseDNS && <p className="text-sm text-gray-500">Reverse DNS: {ipResult.reverseDNS}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="text-gray-500">Country:</span> {ipResult.location.country}</p>
                  {ipResult.location.city && <p><span className="text-gray-500">City:</span> {ipResult.location.city}</p>}
                  {ipResult.location.region && <p><span className="text-gray-500">Region:</span> {ipResult.location.region}</p>}
                  {ipResult.location.timezone && <p><span className="text-gray-500">Timezone:</span> {ipResult.location.timezone}</p>}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Network</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="text-gray-500">ISP:</span> {ipResult.isp.name}</p>
                  {ipResult.isp.asn && <p><span className="text-gray-500">ASN:</span> {ipResult.isp.asn}</p>}
                  {ipResult.network.range && <p><span className="text-gray-500">Range:</span> {ipResult.network.range}</p>}
                  {ipResult.network.organization && <p><span className="text-gray-500">Org:</span> {ipResult.network.organization}</p>}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Abuse Contact</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  {ipResult.abuse.email && <p><span className="text-gray-500">Email:</span> {ipResult.abuse.email}</p>}
                  {ipResult.abuse.phone && <p><span className="text-gray-500">Phone:</span> {ipResult.abuse.phone}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── DNS RESULT ─── */}
        {activeTab === 'dns' && dnsResult && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-1">DNS Records for {dnsResult.domain}</h2>
              <p className="text-sm text-gray-500">{dnsResult.totalRecords} records found across {dnsResult.queriedTypes.join(', ')}</p>
            </div>
            {/* Group by type */}
            {Array.from(new Set(dnsResult.records.map(r => r.type))).map(type => (
              <div key={type} className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">{type}</span>
                  Records ({dnsResult.records.filter(r => r.type === type).length})
                </h3>
                <div className="space-y-2">
                  {dnsResult.records.filter(r => r.type === type).map((record, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono text-sm text-gray-900 break-all">{record.value}</div>
                  ))}
                </div>
              </div>
            ))}
            {dnsResult.authoritative.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Authoritative Nameservers</h3>
                <div className="flex flex-wrap gap-2">
                  {dnsResult.authoritative.map((ns, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-mono text-gray-700">{ns}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── HISTORY TAB ─── */}
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto space-y-3">
            {queryHistory.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg text-center">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No lookup history yet.</p>
              </div>
            ) : (
              queryHistory.map(q => (
                <div key={q.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${q.queryType === 'domain' ? 'bg-orange-100 text-orange-700' : q.queryType === 'ip' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{q.queryType}</span>
                    <div>
                      <span className="font-medium text-gray-900 font-mono">{q.domain}</span>
                      <span className="text-xs text-gray-400 ml-2">{new Date(q.timestamp).toLocaleString()}</span>
                    </div>
                    {!q.success && <span className="text-xs text-red-500">Failed</span>}
                  </div>
                  <button onClick={() => { setInput(q.domain); setActiveTab(q.queryType as 'domain' | 'ip' | 'dns') }} className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1">
                    <RefreshCcw className="w-3.5 h-3.5" />Re-lookup
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── FAVORITES TAB ─── */}
        {activeTab === 'favorites' && (
          <div className="max-w-4xl mx-auto space-y-3">
            {favorites.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg text-center">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No favorite domains yet. Lookup a domain and click the star.</p>
              </div>
            ) : (
              favorites.map(d => (
                <div key={d} className="bg-white rounded-xl p-4 border border-gray-200 shadow-lg flex items-center justify-between">
                  <span className="font-medium text-gray-900 font-mono">{d}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setInput(d); setActiveTab('domain'); lookupDomain(d) }} className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">Lookup</button>
                    <button onClick={() => toggleFavorite(d)} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Empty state for lookup tabs */}
        {['domain', 'ip', 'dns'].includes(activeTab) && !domainResult && !ipResult && !dnsResult && !isQuerying && !error && (
          <div className="max-w-3xl mx-auto mt-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {activeTab === 'domain' ? 'About WHOIS Lookup' : activeTab === 'ip' ? 'About IP Lookup' : 'About DNS Lookup'}
              </h3>
              <div className="space-y-3 text-gray-600">
                {activeTab === 'domain' && (
                  <>
                    <p>WHOIS provides domain registration info including registrar, registrant, dates, nameservers, and status.</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Domain ownership and registrar details</li>
                      <li>Creation, expiry, and update dates</li>
                      <li>Name servers and DNSSEC status</li>
                      <li>Privacy protection detection</li>
                      <li>Export as JSON or CSV</li>
                    </ul>
                  </>
                )}
                {activeTab === 'ip' && (
                  <>
                    <p>IP Lookup provides geolocation, ISP, network details, and abuse contact information for any IP address.</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Country, city, and region geolocation</li>
                      <li>ISP and ASN information</li>
                      <li>Network range and CIDR</li>
                      <li>Reverse DNS lookup</li>
                      <li>Abuse contact details</li>
                    </ul>
                  </>
                )}
                {activeTab === 'dns' && (
                  <>
                    <p>DNS lookup queries all record types for a domain including A, AAAA, MX, NS, TXT, CNAME, SOA.</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>All record types in one query</li>
                      <li>Filter by specific record type</li>
                      <li>Authoritative nameserver identification</li>
                      <li>Grouped display by record type</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
