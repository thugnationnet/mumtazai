'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Replace, ArrowLeft, Copy, Check, Plus, Trash2, Download, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface RewriteRule {
  id: number
  pattern: string
  target: string
  flags: string
  condition?: string
}

const PRESETS = [
  { label: 'Force HTTPS', rules: [{ pattern: '(.*)', target: 'https://%{HTTP_HOST}%{REQUEST_URI}', flags: '[R=301,L]', condition: '%{HTTPS} off' }] },
  { label: 'WWW Redirect', rules: [{ pattern: '(.*)', target: 'https://www.%{HTTP_HOST}%{REQUEST_URI}', flags: '[R=301,L]', condition: '%{HTTP_HOST} !^www\\.' }] },
  { label: 'Remove .html', rules: [{ pattern: '^(.+)\\.html$', target: '/$1', flags: '[R=301,L]' }] },
  { label: 'Pretty URLs', rules: [{ pattern: '^products/([0-9]+)/?$', target: '/product.php?id=$1', flags: '[L,QSA]' }] },
  { label: 'Trailing Slash', rules: [{ pattern: '^(.+[^/])$', target: '$1/', flags: '[R=301,L]', condition: '%{REQUEST_FILENAME} !-f' }] },
  { label: 'Single Page App', rules: [{ pattern: '.', target: '/index.html', flags: '[L]', condition: '%{REQUEST_FILENAME} !-f' }] },
]

const APACHE_FLAGS: { flag: string; desc: string }[] = [
  { flag: 'L', desc: 'Last — stop processing rules' },
  { flag: 'R=301', desc: 'Redirect — permanent 301' },
  { flag: 'R=302', desc: 'Redirect — temporary 302' },
  { flag: 'QSA', desc: 'Query String Append' },
  { flag: 'NC', desc: 'No Case — case-insensitive' },
  { flag: 'NE', desc: 'No Escape — don\'t encode special chars' },
  { flag: 'P', desc: 'Proxy — handle via mod_proxy' },
  { flag: 'F', desc: 'Forbidden — return 403' },
  { flag: 'G', desc: 'Gone — return 410' },
]

export default function UrlRewriteGeneratorPage() {
  const [rules, setRules] = useState<RewriteRule[]>([
    { id: 1, pattern: '^products/([0-9]+)$', target: '/product.php?id=$1', flags: '[L,QSA]' }
  ])
  const [engine, setEngine] = useState<'apache' | 'nginx'>('apache')
  const [copied, setCopied] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const addRule = () => setRules(prev => [...prev, { id: Date.now(), pattern: '', target: '', flags: '[L,QSA]' }])
  const removeRule = (id: number) => setRules(prev => prev.filter(r => r.id !== id))
  const updateRule = (id: number, field: keyof RewriteRule, value: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setRules(preset.rules.map((r, i) => ({ id: Date.now() + i, ...r })))
  }

  const generateCode = (): string => {
    if (engine === 'apache') {
      const lines = ['# Apache URL Rewrite Rules', 'RewriteEngine On', '']
      rules.forEach(r => {
        if (r.pattern && r.target) {
          if (r.condition) lines.push(`RewriteCond %{${r.condition.includes('%{') ? r.condition.replace(/%\{/g, '').replace(/\}/g, '') : r.condition.split(' ')[0]}} ${r.condition.split(' ').slice(1).join(' ') || r.condition}`)
          if (r.condition) {
            const parts = r.condition.split(' ')
            lines.pop()
            lines.push(`RewriteCond ${parts[0].startsWith('%') ? parts[0] : '%{' + parts[0] + '}'} ${parts.slice(1).join(' ')}`)
          }
          lines.push(`RewriteRule ${r.pattern} ${r.target} ${r.flags}`)
          lines.push('')
        }
      })
      return lines.join('\n').trim()
    }
    const lines = ['# Nginx URL Rewrite Rules', '']
    rules.forEach(r => {
      if (r.pattern && r.target) {
        const flag = r.flags.includes('R=301') ? 'permanent' : r.flags.includes('R=302') ? 'redirect' : 'last'
        if (r.condition) lines.push(`# Condition: ${r.condition}`)
        lines.push(`rewrite ${r.pattern} ${r.target} ${flag};`)
        lines.push('')
      }
    })
    return lines.join('\n').trim()
  }

  const code = generateCode()

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const download = () => {
    const ext = engine === 'apache' ? '.htaccess' : 'nginx.conf'
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = ext; a.click()
    URL.revokeObjectURL(url)
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
                <Replace className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">URL Rewrite <span className="text-blue-100">Generator</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Generate Apache and Nginx URL rewrite rules with presets</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Engine + Presets */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Server Engine</label>
              <div className="flex gap-2 mb-4">
                {(['apache', 'nginx'] as const).map(e => (
                  <button key={e} onClick={() => setEngine(e)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${engine === e ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {e === 'apache' ? 'Apache (.htaccess)' : 'Nginx'}
                  </button>
                ))}
              </div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => applyPreset(p)} className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors">{p.label}</button>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Rewrite Rules</h3>
                <button onClick={addRule} className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"><Plus className="w-4 h-4" />Add Rule</button>
              </div>
              {rules.map(r => (
                <div key={r.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Rule #{rules.indexOf(r) + 1}</span>
                    <button onClick={() => removeRule(r.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  {engine === 'apache' && (
                    <input type="text" value={r.condition || ''} onChange={(e) => updateRule(r.id, 'condition', e.target.value)} placeholder="RewriteCond (optional), e.g. %{HTTPS} off" className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                  )}
                  <input type="text" value={r.pattern} onChange={(e) => updateRule(r.id, 'pattern', e.target.value)} placeholder="Pattern (regex)" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input type="text" value={r.target} onChange={(e) => updateRule(r.id, 'target', e.target.value)} placeholder="Target URL" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  {engine === 'apache' && (
                    <input type="text" value={r.flags} onChange={(e) => updateRule(r.id, 'flags', e.target.value)} placeholder="Flags e.g. [L,QSA]" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  )}
                </div>
              ))}
            </div>

            {/* Flag reference */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
              <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />Apache Rewrite Flag Reference</h3>
                {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showInfo && (
                <div className="px-6 pb-6 space-y-1">
                  {APACHE_FLAGS.map(f => (
                    <div key={f.flag} className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                      <code className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono font-semibold min-w-[50px]">{f.flag}</code>
                      <span className="text-xs text-gray-600">{f.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Output */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Generated Code</h3>
              <div className="flex gap-2">
                <button onClick={copy} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={download} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                  <Download className="w-3.5 h-3.5" />Download
                </button>
              </div>
            </div>
            <pre className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap font-mono">{code}</pre>
          </div>
        </div>
      </main>
    </div>
  )
}
