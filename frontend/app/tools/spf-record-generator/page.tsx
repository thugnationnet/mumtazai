'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Copy, Check, Plus, Trash2, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface SpfRule {
  id: number
  type: 'include' | 'ip4' | 'ip6' | 'a' | 'mx' | 'redirect' | 'exists'
  value: string
}

const LOOKUP_TYPES = new Set(['include', 'a', 'mx', 'redirect', 'exists'])

const PRESETS = [
  { label: 'Google Workspace', rules: [{ type: 'include' as const, value: '_spf.google.com' }] },
  { label: 'Microsoft 365', rules: [{ type: 'include' as const, value: 'spf.protection.outlook.com' }] },
  { label: 'Mailchimp', rules: [{ type: 'include' as const, value: 'servers.mcsv.net' }] },
  { label: 'SendGrid', rules: [{ type: 'include' as const, value: 'sendgrid.net' }] },
  { label: 'Amazon SES', rules: [{ type: 'include' as const, value: 'amazonses.com' }] },
  { label: 'Mailgun', rules: [{ type: 'include' as const, value: 'mailgun.org' }] },
  { label: 'Zoho Mail', rules: [{ type: 'include' as const, value: 'zoho.com' }] },
  { label: 'ProtonMail', rules: [{ type: 'include' as const, value: 'mail.protonmail.ch' }] },
]

export default function SpfRecordGeneratorPage() {
  const [rules, setRules] = useState<SpfRule[]>([
    { id: 1, type: 'include', value: '_spf.google.com' }
  ])
  const [allPolicy, setAllPolicy] = useState<'~all' | '-all' | '?all' | '+all'>('~all')
  const [copied, setCopied] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const addRule = () => setRules(prev => [...prev, { id: Date.now(), type: 'include', value: '' }])
  const removeRule = (id: number) => setRules(prev => prev.filter(r => r.id !== id))
  const updateRule = (id: number, field: 'type' | 'value', value: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const exists = rules.some(r => r.type === preset.rules[0].type && r.value === preset.rules[0].value)
    if (!exists) {
      setRules(prev => [...prev, ...preset.rules.map((r, i) => ({ ...r, id: Date.now() + i }))])
    }
  }

  const generateRecord = (): string => {
    let record = 'v=spf1'
    rules.forEach(r => {
      if (r.value) {
        if (r.type === 'redirect') record += ` redirect=${r.value}`
        else record += ` ${r.type}:${r.value}`
      }
    })
    record += ` ${allPolicy}`
    return record
  }

  const record = generateRecord()
  const lookupCount = rules.filter(r => LOOKUP_TYPES.has(r.type) && r.value).length
  const recordLength = record.length

  const copy = async () => {
    await navigator.clipboard.writeText(record)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Tools
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">SPF Record <span className="text-blue-100">Generator</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Generate SPF DNS records for email authentication</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Add Providers</h3>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => applyPreset(p)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors">{p.label}</button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">SPF Rules</h3>
                <button onClick={addRule} className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"><Plus className="w-4 h-4" />Add</button>
              </div>
              {rules.map(r => (
                <div key={r.id} className="flex gap-2 items-center">
                  <select value={r.type} onChange={(e) => updateRule(r.id, 'type', e.target.value)} className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 w-24">
                    <option value="include">include</option>
                    <option value="ip4">ip4</option>
                    <option value="ip6">ip6</option>
                    <option value="a">a</option>
                    <option value="mx">mx</option>
                    <option value="redirect">redirect</option>
                    <option value="exists">exists</option>
                  </select>
                  <input type="text" value={r.value} onChange={(e) => updateRule(r.id, 'value', e.target.value)} placeholder={r.type === 'ip4' ? '192.168.1.0/24' : 'domain.com'} className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  {LOOKUP_TYPES.has(r.type) && <span className="text-xs text-amber-500" title="Uses a DNS lookup">DNS</span>}
                  <button onClick={() => removeRule(r.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Policy</label>
              <select value={allPolicy} onChange={(e) => setAllPolicy(e.target.value as typeof allPolicy)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="~all">~all (Soft Fail — recommended for testing)</option>
                <option value="-all">-all (Hard Fail — reject unauthorized)</option>
                <option value="?all">?all (Neutral — no policy)</option>
                <option value="+all">+all (Pass all — not recommended)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-6 h-fit">
            {/* Warnings */}
            {(lookupCount > 10 || recordLength > 255) && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 space-y-1">
                  {lookupCount > 10 && <p><strong>DNS Lookup Limit Exceeded!</strong> SPF allows max 10 DNS lookups. You have {lookupCount}. Use ip4/ip6 mechanisms where possible.</p>}
                  {recordLength > 255 && <p><strong>Record Too Long!</strong> TXT records should stay under 255 characters ({recordLength} chars). Some DNS providers split long records.</p>}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">DNS Record</h3>
                <button onClick={copy} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                <p className="text-xs text-gray-500">Host / Name</p>
                <p className="font-mono text-sm text-gray-900">@</p>
                <p className="text-xs text-gray-500 mt-3">Type</p>
                <p className="font-mono text-sm text-gray-900">TXT</p>
                <p className="text-xs text-gray-500 mt-3">Value</p>
                <p className="font-mono text-sm text-gray-800 break-all">{record}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${rules.every(r => r.value) ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-xs text-gray-500">{rules.filter(r => r.value).length} rule(s)</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className={lookupCount > 10 ? 'text-red-500 font-semibold' : lookupCount > 7 ? 'text-amber-500' : 'text-gray-500'}>{lookupCount}/10 DNS lookups</span>
                  <span className={recordLength > 255 ? 'text-red-500 font-semibold' : recordLength > 200 ? 'text-amber-500' : 'text-gray-500'}>{recordLength} chars</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
              <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />SPF Mechanism Reference</h3>
                {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showInfo && (
                <div className="px-6 pb-6 space-y-1">
                  {[
                    { mech: 'include', desc: 'Authorize another domain\'s SPF — uses a DNS lookup', dns: true },
                    { mech: 'ip4', desc: 'Authorize an IPv4 address or CIDR range', dns: false },
                    { mech: 'ip6', desc: 'Authorize an IPv6 address or CIDR range', dns: false },
                    { mech: 'a', desc: 'Authorize A record of a domain — uses a DNS lookup', dns: true },
                    { mech: 'mx', desc: 'Authorize MX records of a domain — uses a DNS lookup', dns: true },
                    { mech: 'redirect', desc: 'Use another domain\'s SPF record entirely', dns: true },
                    { mech: 'exists', desc: 'Pass if domain resolves — advanced usage', dns: true },
                  ].map(m => (
                    <div key={m.mech} className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                      <code className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono font-semibold min-w-[60px]">{m.mech}</code>
                      <span className="text-xs text-gray-600 flex-1">{m.desc}</span>
                      {m.dns && <span className="text-xs text-amber-500 font-medium">DNS</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
