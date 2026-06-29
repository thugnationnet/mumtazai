'use client'

import { useState, useCallback, useEffect } from 'react'
import { ArrowLeft, Award, Loader2, AlertCircle, Star, Shield, Download, Eye, History, Bell, Settings, ChevronDown, ChevronUp, ExternalLink, CheckCircle, XCircle, AlertTriangle, BookmarkPlus, BookmarkMinus, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

import type {
  DomainReputationState,
  ReputationReport,
  CategoryScore,
  ThreatDetection,
  ScanRecord,
  SecurityAlert,
  ReputationSettings,
} from './domain-reputation'

/* ─── Hook: wraps service logic with React state ───────────────── */
function useDomainReputation() {
  const [state, setState] = useState<DomainReputationState>({
    isLoading: false,
    isScanning: false,
    error: null,
    success: false,
    currentReport: null,
    scanHistory: [],
    watchlist: [],
    alerts: [],
    settings: {
      autoScan: false,
      scanDepth: 'standard',
      includeSSL: true,
      includeMalware: true,
      includePhishing: true,
      includeBlacklist: true,
      alertThreshold: 60,
      monitorInterval: 24,
      maxHistoryItems: 100,
      emailNotifications: false,
      compareMode: false,
      shareResults: false,
    },
  })

  const loadToolState = useCallback(async () => {
    try {
      const res = await fetch('/api/user/preferences/tool-state/domain_reputation', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        const d = json.data || {}
        setState(prev => ({
          ...prev,
          scanHistory: d.history || [],
          watchlist: d.watchlist || [],
          alerts: d.alerts || [],
          settings: d.settings ? { ...prev.settings, ...d.settings } : prev.settings,
        }))
      }
    } catch { /* silent */ }
  }, [])

  const saveToolState = useCallback(async (key: string, value: unknown) => {
    try {
      await fetch('/api/user/preferences/tool-state/domain_reputation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [key]: value }),
      })
    } catch { /* silent */ }
  }, [])

  useEffect(() => { loadToolState() }, [loadToolState])

  const scanDomain = useCallback(async (domain: string) => {
    setState(prev => ({ ...prev, isScanning: true, error: null, success: false }))
    const startTime = Date.now()
    try {
      const response = await fetch('/api/tools/domain-reputation/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''), settings: state.settings }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Scan failed')

      const report: ReputationReport = { ...data.report, scanDuration: Date.now() - startTime, lastScanned: new Date().toISOString() }
      const record: ScanRecord = {
        id: `scan_${Date.now()}`,
        domain: report.domain,
        timestamp: report.lastScanned,
        score: report.overallScore,
        riskLevel: report.riskLevel,
        scanDuration: report.scanDuration,
        threatsFound: (report.threats || []).length,
        success: true,
      }

      setState(prev => {
        const history = [record, ...prev.scanHistory].slice(0, 100)
        saveToolState('history', history)
        return { ...prev, isScanning: false, success: true, currentReport: report, scanHistory: history }
      })
      return report
    } catch (err: any) {
      setState(prev => ({ ...prev, isScanning: false, error: err.message || 'Scan failed' }))
      return null
    }
  }, [state.settings, saveToolState])

  const toggleWatchlist = useCallback((domain: string) => {
    setState(prev => {
      const d = domain.trim().toLowerCase()
      const exists = prev.watchlist.includes(d)
      const watchlist = exists ? prev.watchlist.filter(w => w !== d) : [...prev.watchlist, d]
      saveToolState('watchlist', watchlist)
      return { ...prev, watchlist }
    })
  }, [saveToolState])

  const dismissAlert = useCallback((id: string) => {
    setState(prev => {
      const alerts = prev.alerts.filter(a => a.id !== id)
      saveToolState('alerts', alerts)
      return { ...prev, alerts }
    })
  }, [saveToolState])

  const exportResults = useCallback(async (format: 'json' | 'csv' | 'pdf', report?: ReputationReport) => {
    const exportData = report || state.currentReport
    if (!exportData) return
    try {
      const response = await fetch('/api/tools/domain-reputation/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, report: exportData }),
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `domain-reputation-${exportData.domain}-${Date.now()}.${format === 'pdf' ? 'txt' : format}`
        link.click()
        window.URL.revokeObjectURL(url)
      }
    } catch { /* silent */ }
  }, [state.currentReport])

  return { state, scanDomain, toggleWatchlist, dismissAlert, exportResults }
}

/* ─── Sub-components ───────────────────────────────────────────── */

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center text-3xl font-bold" fill={color} style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>{score}</text>
    </svg>
  )
}

function CategoryBar({ cat }: { cat: CategoryScore }) {
  const color = cat.status === 'safe' ? 'bg-green-500' : cat.status === 'suspicious' ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{cat.category}</span>
        <span className="text-gray-500">{cat.score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${cat.score}%` }} />
      </div>
      {cat.details.length > 0 && (
        <p className="text-xs text-gray-500">{cat.details[0]}</p>
      )}
    </div>
  )
}

function ThreatCard({ threat }: { threat: ThreatDetection }) {
  const sevColor = { low: 'border-yellow-200 bg-yellow-50', medium: 'border-orange-200 bg-orange-50', high: 'border-red-200 bg-red-50', critical: 'border-red-400 bg-red-100' }
  return (
    <div className={`p-4 border rounded-lg ${sevColor[threat.severity] || sevColor.low}`}>
      <div className="flex items-start justify-between mb-1">
        <span className="font-medium text-gray-900 capitalize">{threat.type}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${threat.severity === 'critical' ? 'bg-red-500 text-white' : threat.severity === 'high' ? 'bg-red-100 text-red-700' : threat.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{threat.severity}</span>
      </div>
      <p className="text-sm text-gray-600">{threat.description}</p>
      {threat.mitigations.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">Fix: {threat.mitigations[0]}</p>
      )}
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────────────────── */

export default function DomainReputationPage() {
  const { state, scanDomain, toggleWatchlist, dismissAlert, exportResults } = useDomainReputation()
  const [domain, setDomain] = useState('')
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'watchlist' | 'alerts'>('scan')
  const [showDetails, setShowDetails] = useState(false)

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domain.trim()) return
    await scanDomain(domain)
  }

  const report = state.currentReport
  const riskColors: Record<string, string> = {
    'very-low': 'from-green-500 to-emerald-500',
    low: 'from-green-400 to-teal-400',
    medium: 'from-yellow-500 to-orange-500',
    high: 'from-orange-500 to-red-500',
    critical: 'from-red-600 to-pink-600',
  }

  return (
    <div className="min-h-screen themed-section-bg">
      {/* Header */}
      <div className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container mx-auto px-4 py-6">
          <Link href="/tools" className="inline-flex items-center text-purple-600 hover:text-purple-500 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Network Tools
          </Link>
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Domain Reputation Scanner</h1>
              <p className="text-slate-500 mt-1">Deep security analysis, threat detection &amp; reputation scoring</p>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 flex gap-1">
          {[
            { id: 'scan' as const, label: 'Scan', icon: Shield },
            { id: 'history' as const, label: `History (${state.scanHistory.length})`, icon: History },
            { id: 'watchlist' as const, label: `Watchlist (${state.watchlist.length})`, icon: Eye },
            { id: 'alerts' as const, label: `Alerts (${state.alerts.length})`, icon: Bell },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ─── SCAN TAB ─── */}
        {activeTab === 'scan' && (
          <>
            {/* Search form */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 mb-6">
              <form onSubmit={handleScan} className="flex gap-3">
                <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="Enter domain (e.g., google.com)" className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400" />
                <button type="submit" disabled={state.isScanning || !domain.trim()} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {state.isScanning ? <><Loader2 className="w-5 h-5 animate-spin" />Scanning...</> : <><Shield className="w-5 h-5" />Scan Domain</>}
                </button>
              </form>
              {state.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700">{state.error}</span>
                </div>
              )}
            </div>

            {/* Report display */}
            {report && (
              <div className="space-y-6">
                {/* Hero score card */}
                <div className={`bg-gradient-to-r ${riskColors[report.riskLevel] || riskColors.medium} rounded-2xl p-8 shadow-xl`}>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg">
                        <ScoreRing score={report.overallScore} />
                      </div>
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h2 className="text-2xl font-bold font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-1">{report.domain}</h2>
                      <div className="text-white/90 text-lg capitalize mb-2">Risk Level: {report.riskLevel.replace('-', ' ')}</div>
                      <div className="flex items-center gap-1 md:justify-start justify-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-5 h-5 ${i < Math.round(report.overallScore / 20) ? 'text-yellow-300 fill-yellow-300' : 'text-white/30'}`} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-start justify-center">
                        <button onClick={() => toggleWatchlist(report.domain)} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors flex items-center gap-1">
                          {state.watchlist.includes(report.domain) ? <><BookmarkMinus className="w-4 h-4" />Remove from Watchlist</> : <><BookmarkPlus className="w-4 h-4" />Add to Watchlist</>}
                        </button>
                        <button onClick={() => exportResults('json')} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors flex items-center gap-1">
                          <Download className="w-4 h-4" />Export JSON
                        </button>
                        <button onClick={() => exportResults('csv')} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors flex items-center gap-1">
                          <Download className="w-4 h-4" />Export CSV
                        </button>
                      </div>
                    </div>
                    <div className="text-white/80 text-sm text-right hidden md:block">
                      <div>Scanned: {new Date(report.lastScanned).toLocaleString()}</div>
                      <div>Duration: {report.scanDuration}ms</div>
                      <div>Threats: {report.threats.length}</div>
                    </div>
                  </div>
                </div>

                {/* Category scores */}
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Scores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(report.categories || []).map((cat, i) => (
                      <CategoryBar key={i} cat={cat} />
                    ))}
                  </div>
                </div>

                {/* Threats */}
                {report.threats.length > 0 && (
                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Threats Detected ({report.threats.length})
                    </h3>
                    <div className="space-y-3">
                      {report.threats.map((t, i) => <ThreatCard key={i} threat={t} />)}
                    </div>
                  </div>
                )}

                {/* SSL & Technical - collapsible */}
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg overflow-hidden">
                  <button onClick={() => setShowDetails(!showDetails)} className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900">Technical Details &amp; SSL</h3>
                    {showDetails ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  {showDetails && (
                    <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-xs text-gray-500 mb-1">Domain Age</div>
                          <div className="text-lg font-semibold text-gray-900">{report.technical?.domainAge || 0} days</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-xs text-gray-500 mb-1">Registrar</div>
                          <div className="text-lg font-semibold text-gray-900 truncate">{report.technical?.registrar || 'Unknown'}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-xs text-gray-500 mb-1">IP Address</div>
                          <div className="text-lg font-semibold text-gray-900 font-mono">{report.technical?.ipAddress || 'N/A'}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-xs text-gray-500 mb-1">SSL Certificate</div>
                          <div className="flex items-center gap-2">
                            {report.ssl?.hasSSL ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                            <span className="text-lg font-semibold text-gray-900">{report.ssl?.hasSSL ? `Grade ${report.ssl.grade}` : 'Not Found'}</span>
                          </div>
                        </div>
                        {report.ssl?.hasSSL && (
                          <>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="text-xs text-gray-500 mb-1">SSL Issuer</div>
                              <div className="text-sm font-semibold text-gray-900 truncate">{report.ssl.issuer}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="text-xs text-gray-500 mb-1">SSL Expires</div>
                              <div className="text-sm font-semibold text-gray-900">{report.ssl.daysUntilExpiry} days</div>
                            </div>
                          </>
                        )}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-xs text-gray-500 mb-1">DNS Health</div>
                          <div className="text-lg font-semibold text-gray-900">{report.technical?.dns?.healthScore || 0}/100</div>
                        </div>
                      </div>
                      {(report.technical?.nameservers || []).length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Name Servers</div>
                          <div className="flex flex-wrap gap-2">
                            {report.technical.nameservers.map((ns, i) => (
                              <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 font-mono">{ns}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {(report.recommendations || []).length > 0 && (
                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                    <div className="space-y-3">
                      {report.recommendations.map((rec, i) => (
                        <div key={i} className={`p-4 rounded-lg border ${rec.priority === 'high' ? 'border-red-200 bg-red-50' : rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}`}>
                          <div className="flex items-start gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{rec.priority}</span>
                            <div>
                              <div className="font-medium text-gray-900">{rec.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{rec.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blacklists */}
                {(report.blacklists || []).length > 0 && (
                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Blacklist Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {report.blacklists.map((bl, i) => (
                        <div key={i} className={`p-3 border rounded-lg flex items-center gap-3 ${bl.listed ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                          {bl.listed ? <XCircle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{bl.name}</div>
                            <div className="text-xs text-gray-500">{bl.listed ? bl.reason || 'Listed' : 'Clean'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!report && !state.isScanning && (
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Enter a domain to scan</h3>
                <p className="text-gray-500 max-w-md mx-auto">Get a comprehensive security analysis including SSL validation, DNS health, threat detection, blacklist checks, and reputation scoring.</p>
              </div>
            )}
          </>
        )}

        {/* ─── HISTORY TAB ─── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {state.scanHistory.length === 0 ? (
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 text-center">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No scan history yet. Scan a domain to get started.</p>
              </div>
            ) : (
              state.scanHistory.map(record => (
                <div key={record.id} className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${record.score >= 60 ? 'bg-green-500' : record.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                      {record.score}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{record.domain}</div>
                      <div className="text-sm text-gray-500">{new Date(record.timestamp).toLocaleString()} · {record.scanDuration}ms · {record.threatsFound} threats</div>
                    </div>
                  </div>
                  <button onClick={() => { setDomain(record.domain); setActiveTab('scan'); scanDomain(record.domain) }} className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1">
                    <RefreshCcw className="w-3.5 h-3.5" />Rescan
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── WATCHLIST TAB ─── */}
        {activeTab === 'watchlist' && (
          <div className="space-y-4">
            {state.watchlist.length === 0 ? (
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 text-center">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No domains in watchlist. Scan a domain and add it to your watchlist.</p>
              </div>
            ) : (
              state.watchlist.map(d => (
                <div key={d} className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4 flex items-center justify-between">
                  <span className="font-medium text-gray-900 font-mono">{d}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setDomain(d); setActiveTab('scan'); scanDomain(d) }} className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">Scan Now</button>
                    <button onClick={() => toggleWatchlist(d)} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── ALERTS TAB ─── */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {state.alerts.length === 0 ? (
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No alerts. Alerts are generated when watchlist domain scores change significantly.</p>
              </div>
            ) : (
              state.alerts.map(alert => (
                <div key={alert.id} className={`bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4 border ${alert.severity === 'high' ? 'border-red-200' : alert.severity === 'medium' ? 'border-yellow-200' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{alert.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{alert.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{alert.domain} · {new Date(alert.timestamp).toLocaleString()}</div>
                    </div>
                    <button onClick={() => dismissAlert(alert.id)} className="text-gray-400 hover:text-gray-600">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
