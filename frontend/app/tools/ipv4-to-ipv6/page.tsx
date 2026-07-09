'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Network, ArrowLeft, Copy, Check, ArrowLeftRight, Clock, Download, ChevronDown, ChevronUp, Info } from 'lucide-react'

interface ConversionResult {
  ipv4: string
  mapped: string
  full: string
  compatible: string
  sixTo4: string
  decimal: string
  binary: string
}

const SAMPLES = ['192.168.1.1', '10.0.0.1', '8.8.8.8', '172.16.0.1', '255.255.255.255', '127.0.0.1']

function convertIpv4(ipStr: string): ConversionResult {
  const parts = ipStr.trim().split('.')
  if (parts.length !== 4) throw new Error('Invalid IPv4 format — use x.x.x.x')
  const nums = parts.map(Number)
  if (nums.some(n => isNaN(n) || n < 0 || n > 255)) throw new Error('Each octet must be 0-255')

  const h = nums.map(n => n.toString(16).padStart(2, '0'))
  const mapped = `::ffff:${h[0]}${h[1]}:${h[2]}${h[3]}`
  const full = `0000:0000:0000:0000:0000:ffff:${h[0]}${h[1]}:${h[2]}${h[3]}`
  const compatible = `::${h[0]}${h[1]}:${h[2]}${h[3]}`
  const sixTo4 = `2002:${h[0]}${h[1]}:${h[2]}${h[3]}::1`
  const decimal = (((nums[0] * 256 + nums[1]) * 256 + nums[2]) * 256 + nums[3]).toString()
  const binary = nums.map(n => n.toString(2).padStart(8, '0')).join('.')

  return { ipv4: ipStr.trim(), mapped, full, compatible, sixTo4, decimal, binary }
}

export default function Ipv4ToIpv6Page() {
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [ipv4, setIpv4] = useState('192.168.1.1')
  const [batchInput, setBatchInput] = useState('')
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [batchResults, setBatchResults] = useState<(ConversionResult | { ipv4: string; error: string })[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<ConversionResult[]>([])
  const [showInfo, setShowInfo] = useState(false)

  const convert = () => {
    setError('')
    setResult(null)
    try {
      const r = convertIpv4(ipv4)
      setResult(r)
      setHistory(prev => [r, ...prev.filter(h => h.ipv4 !== r.ipv4)].slice(0, 15))
    } catch (e: any) { setError(e.message) }
  }

  const convertBatch = () => {
    const ips = batchInput.split('\n').map(s => s.trim()).filter(Boolean)
    if (!ips.length) return
    const results = ips.slice(0, 20).map(ip => {
      try { return convertIpv4(ip) }
      catch (e: any) { return { ipv4: ip, error: e.message } }
    })
    setBatchResults(results)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1200)
  }

  const exportResults = () => {
    const items = mode === 'single' && result ? [result] : batchResults.filter((r): r is ConversionResult => !('error' in r))
    const txt = items.map(r => `IPv4: ${r.ipv4}\nMapped: ${r.mapped}\nFull: ${r.full}\nCompatible: ${r.compatible}\n6to4: ${r.sixTo4}\nDecimal: ${r.decimal}\nBinary: ${r.binary}`).join('\n\n---\n\n')
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'ipv4-to-ipv6-results.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const formats = (r: ConversionResult) => [
    { label: 'IPv4-Mapped IPv6', value: r.mapped, desc: '::ffff: prefix — standard dual-stack mapping', bg: 'bg-blue-50 border-blue-200' },
    { label: 'Full Expanded', value: r.full, desc: 'All 8 groups, zero-padded 128-bit format', bg: 'bg-indigo-50 border-indigo-200' },
    { label: 'IPv4-Compatible', value: r.compatible, desc: 'Legacy compatible (deprecated in RFC 4291)', bg: 'bg-purple-50 border-purple-200' },
    { label: '6to4 Tunnel', value: r.sixTo4, desc: '2002::/16 prefix for 6to4 transition tunneling', bg: 'bg-cyan-50 border-cyan-200' },
    { label: 'Decimal', value: r.decimal, desc: '32-bit unsigned integer representation', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Binary', value: r.binary, desc: '32-bit binary with dotted octets', bg: 'bg-gray-50 border-gray-200' },
  ]

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
                <Network className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">IPv4 to <span className="text-blue-100">IPv6 Converter</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Convert IPv4 addresses to all IPv6 notations with batch support</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Mode Toggle */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['single', 'batch'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                    {m === 'single' ? 'Single' : 'Batch'}
                  </button>
                ))}
              </div>
              {(result || batchResults.length > 0) && (
                <button onClick={exportResults} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 flex items-center gap-1.5 transition-colors">
                  <Download className="w-3.5 h-3.5" />Export
                </button>
              )}
            </div>

            {mode === 'single' ? (
              <>
                <div className="flex gap-3">
                  <input type="text" value={ipv4} onChange={(e) => setIpv4(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && convert()} placeholder="192.168.1.1" className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <button onClick={convert} className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5" />Convert
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {SAMPLES.map(s => (
                    <button key={s} onClick={() => { setIpv4(s); }} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-mono text-gray-600 transition-colors">{s}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <textarea value={batchInput} onChange={(e) => setBatchInput(e.target.value)} rows={5} placeholder="Enter one IPv4 per line (up to 20):&#10;192.168.1.1&#10;10.0.0.1&#10;8.8.8.8" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                <button onClick={convertBatch} className="w-full mt-3 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">Convert All</button>
              </>
            )}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          {/* Single Result */}
          {mode === 'single' && result && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Representations of <span className="font-mono text-brand-600">{result.ipv4}</span></h3>
                <button onClick={() => { const all = formats(result).map(f => `${f.label}: ${f.value}`).join('\n'); copy(all, 'all') }} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  {copied === 'all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}Copy All
                </button>
              </div>
              <div className="space-y-3">
                {formats(result).map(item => (
                  <div key={item.label} className={`rounded-lg p-4 border ${item.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">{item.label}</span>
                      <button onClick={() => copy(item.value, item.label)} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                        {copied === item.label ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}Copy
                      </button>
                    </div>
                    <p className="font-mono text-base text-gray-900 break-all">{item.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Batch Results */}
          {mode === 'batch' && batchResults.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Results ({batchResults.length})</h3>
              <div className="space-y-3">
                {batchResults.map((r, i) => (
                  <div key={i} className={`rounded-lg p-4 border ${'error' in r ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="font-mono text-sm font-semibold text-gray-900 mb-1">{r.ipv4}</div>
                    {'error' in r ? (
                      <p className="text-red-600 text-sm">{r.error}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                        {[
                          { l: 'Mapped', v: r.mapped },
                          { l: 'Full', v: r.full },
                          { l: '6to4', v: r.sixTo4 },
                          { l: 'Decimal', v: r.decimal },
                        ].map(f => (
                          <button key={f.l} onClick={() => copy(f.v, `${i}-${f.l}`)} className="text-left bg-white rounded px-2 py-1 border border-gray-200 hover:border-brand-300 transition-colors group">
                            <span className="text-[10px] text-gray-400 uppercase">{f.l}</span>
                            <div className="font-mono text-xs text-gray-800 truncate">{f.v}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" />Conversion History</h3>
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setIpv4(h.ipv4); setResult(h); setMode('single') }} className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <span className="font-mono text-sm text-gray-900">{h.ipv4}</span>
                    <span className="font-mono text-xs text-gray-500 truncate ml-4">{h.mapped}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />About IPv4 to IPv6 Conversion</h3>
              {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showInfo && (
              <div className="px-6 pb-6 space-y-3 text-sm text-gray-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { t: 'IPv4-Mapped (::ffff:)', d: 'Used by dual-stack hosts to represent IPv4 addresses in IPv6 format. Most commonly used in modern networking.' },
                    { t: '6to4 (2002::/16)', d: 'Transition mechanism that allows IPv6 packets to be transmitted over IPv4 infrastructure without tunnels.' },
                    { t: 'IPv4-Compatible (deprecated)', d: 'Was used for automatic tunneling, now deprecated by RFC 4291. Replaced by ISATAP and 6to4.' },
                    { t: 'Full Expanded', d: 'All 128 bits shown in 8 groups of 4 hex digits — no abbreviation. Useful for debugging and configuration.' },
                  ].map(c => (
                    <div key={c.t} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="font-semibold text-gray-800 text-xs mb-1">{c.t}</div>
                      <p className="text-xs leading-relaxed">{c.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
