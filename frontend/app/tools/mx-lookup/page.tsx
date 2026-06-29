'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Mail,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Download,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Server,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface MxRecord {
  priority: number
  host: string
}

interface LookupResult {
  domain: string
  records: MxRecord[]
  timestamp: string
}

interface HistoryEntry {
  domain: string
  recordCount: number
  timestamp: string
  records: MxRecord[]
}

const popularProviders: Record<string, { name: string; color: string }> = {
  'google.com': { name: 'Google Workspace', color: 'text-blue-600 bg-blue-50' },
  'googlemail.com': { name: 'Google Workspace', color: 'text-blue-600 bg-blue-50' },
  'outlook.com': { name: 'Microsoft 365', color: 'text-indigo-600 bg-indigo-50' },
  'protection.outlook.com': { name: 'Microsoft 365', color: 'text-indigo-600 bg-indigo-50' },
  'pphosted.com': { name: 'Proofpoint', color: 'text-teal-600 bg-teal-50' },
  'mimecast.com': { name: 'Mimecast', color: 'text-green-600 bg-green-50' },
  'messagelabs.com': { name: 'Symantec', color: 'text-yellow-600 bg-yellow-50' },
  'barracuda.com': { name: 'Barracuda', color: 'text-orange-600 bg-orange-50' },
  'secureserver.net': { name: 'GoDaddy', color: 'text-teal-600 bg-teal-50' },
  'registrar-servers.com': { name: 'Namecheap', color: 'text-orange-600 bg-orange-50' },
  'zoho.com': { name: 'Zoho Mail', color: 'text-red-600 bg-red-50' },
  'emailsrvr.com': { name: 'Rackspace', color: 'text-purple-600 bg-purple-50' },
  'yahoodns.net': { name: 'Yahoo', color: 'text-violet-600 bg-violet-50' },
  'privateemail.com': { name: 'Namecheap Email', color: 'text-orange-600 bg-orange-50' },
}

const quickDomains = [
  'gmail.com',
  'outlook.com',
  'yahoo.com',
  'protonmail.com',
  'icloud.com',
  'zoho.com',
]

function detectProvider(host: string): { name: string; color: string } | null {
  const lower = host.toLowerCase()
  for (const [key, val] of Object.entries(popularProviders)) {
    if (lower.includes(key)) return val
  }
  return null
}

function getPriorityLabel(priority: number): { label: string; color: string } {
  if (priority <= 5) return { label: 'Primary', color: 'text-green-700 bg-green-100' }
  if (priority <= 10) return { label: 'Primary', color: 'text-green-700 bg-green-100' }
  if (priority <= 20) return { label: 'Secondary', color: 'text-blue-700 bg-blue-100' }
  if (priority <= 30) return { label: 'Backup', color: 'text-yellow-700 bg-yellow-100' }
  return { label: 'Fallback', color: 'text-orange-700 bg-orange-100' }
}

function getHealthScore(records: MxRecord[]): { score: number; issues: string[]; good: string[] } {
  const issues: string[] = []
  const good: string[] = []

  if (records.length === 0) return { score: 0, issues: ['No MX records found — email delivery will fail'], good: [] }

  if (records.length >= 2) good.push('Multiple MX records provide redundancy')
  else issues.push('Only one MX record — no failover if the server goes down')

  const priorities = records.map(r => r.priority)
  const uniquePriorities = new Set(priorities)
  if (uniquePriorities.size > 1) good.push('Different priorities configured for failover')
  else if (records.length > 1) issues.push('All MX records have the same priority — consider staggering them')

  const hosts = new Set(records.map(r => r.host.split('.').slice(-2).join('.')))
  if (hosts.size > 1) good.push('Multiple mail providers increases resilience')

  const provider = detectProvider(records[0].host)
  if (provider) good.push(`Using ${provider.name} — a recognized email provider`)

  const score = Math.min(100, Math.max(0, 40 + (good.length * 20) - (issues.length * 15)))
  return { score, issues, good }
}

export default function MxLookupPage() {
  const [domain, setDomain] = useState('')
  const [data, setData] = useState<LookupResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(true)
  const [compareMode, setCompareMode] = useState(false)
  const [compareData, setCompareData] = useState<LookupResult | null>(null)
  const [compareDomain, setCompareDomain] = useState('')
  const [compareLoading, setCompareLoading] = useState(false)

  const lookup = useCallback(async (targetDomain?: string, isCompare?: boolean) => {
    const d = (targetDomain || domain).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*/, '')
    if (!d) return

    if (isCompare) {
      setCompareLoading(true)
    } else {
      setLoading(true)
      setError('')
      setData(null)
    }

    try {
      const res = await fetch('/api/tools/mx-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Lookup failed')

      const result: LookupResult = {
        domain: json.data.domain,
        records: json.data.records,
        timestamp: new Date().toISOString(),
      }

      if (isCompare) {
        setCompareData(result)
      } else {
        setData(result)
        // Add to history (max 20)
        setHistory(prev => {
          const filtered = prev.filter(h => h.domain !== d)
          return [
            { domain: d, recordCount: result.records.length, timestamp: result.timestamp, records: result.records },
            ...filtered,
          ].slice(0, 20)
        })
      }
    } catch (e: any) {
      if (!isCompare) setError(e.message)
    } finally {
      if (isCompare) setCompareLoading(false)
      else setLoading(false)
    }
  }, [domain])

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const exportData = (format: 'json' | 'csv' | 'txt') => {
    if (!data) return
    let content: string
    let mime: string
    let ext: string

    if (format === 'json') {
      content = JSON.stringify(data, null, 2)
      mime = 'application/json'
      ext = 'json'
    } else if (format === 'csv') {
      content = 'Priority,Mail Server,Provider\n' +
        data.records.map(r => {
          const provider = detectProvider(r.host)
          return `${r.priority},"${r.host}","${provider?.name || 'Unknown'}"`
        }).join('\n')
      mime = 'text/csv'
      ext = 'csv'
    } else {
      content = `MX Records for ${data.domain}\n${'='.repeat(40)}\nLookup Time: ${new Date(data.timestamp).toLocaleString()}\n\n` +
        data.records.map(r => `Priority: ${r.priority}  Server: ${r.host}`).join('\n')
      mime = 'text/plain'
      ext = 'txt'
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mx-records-${data.domain}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const health = data ? getHealthScore(data.records) : null

  return (
    <div className="min-h-screen themed-section-bg">
      {/* Hero */}
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
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">MX <span className="text-slate-500">Lookup</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Look up mail exchange records, detect providers, and analyze email configuration</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto">
          {/* Search */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookup()}
                  placeholder="Enter domain (e.g. gmail.com)"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => lookup()}
                disabled={loading || !domain.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Lookup
              </button>
            </div>

            {/* Quick Domains */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 self-center">Quick:</span>
              {quickDomains.map(d => (
                <button
                  key={d}
                  onClick={() => { setDomain(d); lookup(d) }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {data && (
            <div className="space-y-6">
              {/* Health Score */}
              {health && (
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <button
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {health.score >= 70 ? (
                        <ShieldCheck className="w-6 h-6 text-green-500" />
                      ) : health.score >= 40 ? (
                        <Shield className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                      )}
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">Email Health Score</h3>
                        <p className="text-sm text-gray-500">{data.records.length} MX record{data.records.length !== 1 ? 's' : ''} found</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold ${health.score >= 70 ? 'text-green-600' : health.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {health.score}/100
                      </div>
                      {showAnalysis ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {showAnalysis && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      {/* Score Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${health.score >= 70 ? 'bg-green-500' : health.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${health.score}%` }}
                        />
                      </div>

                      {health.good.map((g, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{g}</span>
                        </div>
                      ))}
                      {health.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MX Records Table */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-600" />
                    MX Records for {data.domain}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyText(data.records.map(r => `${r.priority} ${r.host}`).join('\n'), 'all')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition-colors flex items-center gap-1.5">
                      {copied === 'all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === 'all' ? 'Copied' : 'Copy All'}
                    </button>
                    <div className="relative group">
                      <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition-colors flex items-center gap-1.5">
                        <Download className="w-3 h-3" />Export
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block min-w-[120px]">
                        {(['json', 'csv', 'txt'] as const).map(fmt => (
                          <button key={fmt} onClick={() => exportData(fmt)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700">
                            Export as .{fmt.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left">
                        <th className="py-3 px-2 text-gray-500 font-medium w-20">Priority</th>
                        <th className="py-3 px-2 text-gray-500 font-medium w-24">Role</th>
                        <th className="py-3 px-2 text-gray-500 font-medium">Mail Server</th>
                        <th className="py-3 px-2 text-gray-500 font-medium w-36">Provider</th>
                        <th className="py-3 px-2 text-gray-500 font-medium w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.records.map((r, i) => {
                        const priority = getPriorityLabel(r.priority)
                        const provider = detectProvider(r.host)
                        return (
                          <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                            <td className="py-3 px-2">
                              <span className="inline-flex items-center justify-center w-10 h-8 bg-gray-100 rounded font-mono font-semibold text-gray-900">
                                {r.priority}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                                {priority.label}
                              </span>
                            </td>
                            <td className="py-3 px-2 font-mono text-gray-800 break-all">{r.host}</td>
                            <td className="py-3 px-2">
                              {provider ? (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${provider.color}`}>
                                  {provider.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <button
                                onClick={() => copyText(r.host, `host-${i}`)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Copy hostname"
                              >
                                {copied === `host-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  Looked up at {new Date(data.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Compare Mode */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <button onClick={() => setCompareMode(!compareMode)} className="flex items-center gap-2 text-lg font-semibold text-gray-900 w-full">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Compare with Another Domain
                  {compareMode ? <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />}
                </button>

                {compareMode && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={compareDomain}
                        onChange={(e) => setCompareDomain(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && lookup(compareDomain, true)}
                        placeholder="Enter second domain..."
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => lookup(compareDomain, true)}
                        disabled={compareLoading || !compareDomain.trim()}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {compareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Compare
                      </button>
                    </div>

                    {compareData && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">{data.domain}</h4>
                          {data.records.map((r, i) => (
                            <div key={i} className="text-sm text-blue-700 flex gap-2">
                              <span className="font-mono font-bold w-8">{r.priority}</span>
                              <span className="font-mono">{r.host}</span>
                            </div>
                          ))}
                          <div className="mt-2 text-xs text-blue-600">
                            Provider: {detectProvider(data.records[0]?.host)?.name || 'Unknown'}
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-800 mb-2">{compareData.domain}</h4>
                          {compareData.records.map((r, i) => (
                            <div key={i} className="text-sm text-purple-700 flex gap-2">
                              <span className="font-mono font-bold w-8">{r.priority}</span>
                              <span className="font-mono">{r.host}</span>
                            </div>
                          ))}
                          <div className="mt-2 text-xs text-purple-600">
                            Provider: {detectProvider(compareData.records[0]?.host)?.name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lookup History */}
          {history.length > 0 && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Recent Lookups
                </h3>
                <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />Clear
                </button>
              </div>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { setDomain(h.domain); setData({ domain: h.domain, records: h.records, timestamp: h.timestamp }) }}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                  >
                    <div>
                      <span className="font-medium text-gray-900 text-sm">{h.domain}</span>
                      <span className="text-xs text-gray-500 ml-2">{h.recordCount} record{h.recordCount !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '📧', title: 'Provider Detection', desc: 'Automatically identifies Google Workspace, Microsoft 365, Proofpoint, Mimecast, and more' },
              { icon: '🏥', title: 'Health Analysis', desc: 'Scores your email configuration for redundancy, failover, and best practices' },
              { icon: '📊', title: 'Export & Compare', desc: 'Export as JSON, CSV, or TXT. Compare MX records between two domains side-by-side' },
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
