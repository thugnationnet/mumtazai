'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Copy, Check, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface DmarcPolicy {
  policy: 'none' | 'quarantine' | 'reject'
  subPolicy: 'none' | 'quarantine' | 'reject' | ''
  ruaEmail: string
  rufEmail: string
  pct: number
  adkim: 'r' | 's'
  aspf: 'r' | 's'
  fo: '0' | '1' | 'd' | 's'
  ri: number
}

const PRESETS = [
  { label: 'Monitor Only', desc: 'Start here — collect reports without affecting mail', data: { policy: 'none' as const, pct: 100, ruaEmail: '', rufEmail: '', fo: '1' as const } },
  { label: 'Soft Quarantine', desc: 'Quarantine 25% to test before full rollout', data: { policy: 'quarantine' as const, pct: 25, fo: '1' as const } },
  { label: 'Full Quarantine', desc: 'Quarantine all failing emails', data: { policy: 'quarantine' as const, pct: 100, fo: '0' as const } },
  { label: 'Full Reject', desc: 'Maximum protection — reject all failures', data: { policy: 'reject' as const, pct: 100, fo: '0' as const } },
]

export default function DmarcRecordGeneratorPage() {
  const [config, setConfig] = useState<DmarcPolicy>({
    policy: 'none', subPolicy: '', ruaEmail: '', rufEmail: '',
    pct: 100, adkim: 'r', aspf: 'r', fo: '0', ri: 86400,
  })
  const [copied, setCopied] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const update = (field: keyof DmarcPolicy, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setConfig(prev => ({ ...prev, ...preset.data }))
  }

  const generateRecord = (): string => {
    let record = `v=DMARC1; p=${config.policy}`
    if (config.subPolicy) record += `; sp=${config.subPolicy}`
    if (config.ruaEmail) record += `; rua=mailto:${config.ruaEmail}`
    if (config.rufEmail) record += `; ruf=mailto:${config.rufEmail}`
    if (config.pct !== 100) record += `; pct=${config.pct}`
    if (config.adkim !== 'r') record += `; adkim=${config.adkim}`
    if (config.aspf !== 'r') record += `; aspf=${config.aspf}`
    if (config.fo !== '0') record += `; fo=${config.fo}`
    if (config.ri !== 86400) record += `; ri=${config.ri}`
    return record
  }

  const record = generateRecord()

  const copy = async () => {
    await navigator.clipboard.writeText(record)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const policyColor = config.policy === 'reject' ? 'text-red-600 bg-red-50 border-red-200' : config.policy === 'quarantine' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-blue-600 bg-blue-50 border-blue-200'

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
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">DMARC Record <span className="text-slate-500">Generator</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Generate DMARC DNS records for email authentication</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          {/* Presets */}
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)} className="text-left px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm">
                <div className="text-xs font-semibold text-gray-900">{p.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Policy Settings</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain Policy (p)</label>
                  <select value={config.policy} onChange={(e) => update('policy', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="none">None (monitoring only)</option>
                    <option value="quarantine">Quarantine (mark as spam)</option>
                    <option value="reject">Reject (block emails)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain Policy (sp)</label>
                  <select value={config.subPolicy} onChange={(e) => update('subPolicy', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="">Same as domain</option>
                    <option value="none">None</option>
                    <option value="quarantine">Quarantine</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (pct) — {config.pct}%</label>
                  <input type="range" min="0" max="100" value={config.pct} onChange={(e) => update('pct', Number(e.target.value))} className="w-full" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
                </div>
              </div>

              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Reporting</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aggregate Reports (rua)</label>
                  <input type="email" value={config.ruaEmail} onChange={(e) => update('ruaEmail', e.target.value)} placeholder="dmarc@example.com" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm font-mono focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forensic Reports (ruf)</label>
                  <input type="email" value={config.rufEmail} onChange={(e) => update('rufEmail', e.target.value)} placeholder="dmarc-forensic@example.com" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm font-mono focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Failure Reporting (fo)</label>
                  <select value={config.fo} onChange={(e) => update('fo', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="0">Generate report if both SPF and DKIM fail</option>
                    <option value="1">Generate report if either fails</option>
                    <option value="d">Generate report on DKIM failure</option>
                    <option value="s">Generate report on SPF failure</option>
                  </select>
                </div>
              </div>

              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Alignment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DKIM (adkim)</label>
                    <select value={config.adkim} onChange={(e) => update('adkim', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500">
                      <option value="r">Relaxed</option>
                      <option value="s">Strict</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SPF (aspf)</label>
                    <select value={config.aspf} onChange={(e) => update('aspf', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500">
                      <option value="r">Relaxed</option>
                      <option value="s">Strict</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-6 h-fit">
              {/* Policy status */}
              <div className={`rounded-2xl border p-4 text-center ${policyColor}`}>
                <div className="text-lg font-bold capitalize">{config.policy}</div>
                <div className="text-xs mt-1">
                  {config.policy === 'none' && 'Monitoring only — no emails will be affected'}
                  {config.policy === 'quarantine' && `${config.pct}% of failing emails will be quarantined`}
                  {config.policy === 'reject' && `${config.pct}% of failing emails will be rejected`}
                </div>
              </div>

              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">DNS Record</h3>
                  <button onClick={copy} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                  <p className="text-xs text-gray-500">Host / Name</p>
                  <p className="font-mono text-sm text-gray-900">_dmarc</p>
                  <p className="text-xs text-gray-500 mt-3">Type</p>
                  <p className="font-mono text-sm text-gray-900">TXT</p>
                  <p className="text-xs text-gray-500 mt-3">Value</p>
                  <p className="font-mono text-sm text-gray-800 break-all">{record}</p>
                </div>
              </div>

              {/* Deployment Guide */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg">
                <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />Deployment Guide</h3>
                  {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showInfo && (
                  <div className="px-6 pb-6 space-y-3">
                    {[
                      { step: '1', title: 'Start with p=none', desc: 'Begin monitoring without affecting mail delivery. Set rua to receive reports.' },
                      { step: '2', title: 'Analyze Reports', desc: 'Review aggregate reports for 2-4 weeks. Identify legitimate senders missing SPF/DKIM.' },
                      { step: '3', title: 'Move to Quarantine', desc: 'Set p=quarantine with pct=25, gradually increase to 100% over weeks.' },
                      { step: '4', title: 'Enable Reject', desc: 'Once confident, set p=reject. This provides maximum email authentication.' },
                    ].map(s => (
                      <div key={s.step} className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{s.step}</div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{s.title}</div>
                          <div className="text-xs text-gray-600">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
