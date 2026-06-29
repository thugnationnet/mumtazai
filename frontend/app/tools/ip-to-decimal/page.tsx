'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Hash, ArrowLeft, Copy, Check, ArrowLeftRight, Clock, Download, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface ConversionResult {
  ip: string
  decimal: string
  hex: string
  binary: string
  octal: string
}

function ipToFormats(ipStr: string): ConversionResult {
  const parts = ipStr.trim().split('.')
  if (parts.length !== 4) throw new Error('Invalid IP format — use x.x.x.x')
  const nums = parts.map(Number)
  if (nums.some(n => isNaN(n) || n < 0 || n > 255)) throw new Error('Each octet must be 0-255')
  const num = (nums[0] * 16777216 + nums[1] * 65536 + nums[2] * 256 + nums[3]) >>> 0
  return {
    ip: ipStr.trim(),
    decimal: num.toString(),
    hex: '0x' + num.toString(16).toUpperCase().padStart(8, '0'),
    binary: nums.map(n => n.toString(2).padStart(8, '0')).join('.'),
    octal: '0' + num.toString(8),
  }
}

function decimalToIp(dec: string): string {
  const n = parseInt(dec.trim(), 10)
  if (isNaN(n) || n < 0 || n > 4294967295) throw new Error('Decimal must be 0-4294967295')
  return `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`
}

const SAMPLES = [
  { ip: '192.168.1.1', dec: '3232235777' },
  { ip: '10.0.0.1', dec: '167772161' },
  { ip: '8.8.8.8', dec: '134744072' },
  { ip: '127.0.0.1', dec: '2130706433' },
  { ip: '255.255.255.255', dec: '4294967295' },
  { ip: '172.16.0.1', dec: '2886729729' },
  { ip: '1.1.1.1', dec: '16843009' },
]

export default function IpToDecimalPage() {
  const [ip, setIp] = useState('192.168.1.1')
  const [decimal, setDecimal] = useState('')
  const [direction, setDirection] = useState<'ip-to-dec' | 'dec-to-ip'>('ip-to-dec')
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<ConversionResult[]>([])
  const [showInfo, setShowInfo] = useState(false)

  const convert = () => {
    setError(''); setResult(null)
    try {
      if (direction === 'ip-to-dec') {
        const r = ipToFormats(ip)
        setResult(r)
        setDecimal(r.decimal)
        setHistory(prev => [r, ...prev.filter(h => h.ip !== r.ip)].slice(0, 15))
      } else {
        const ipResult = decimalToIp(decimal)
        setIp(ipResult)
        const r = ipToFormats(ipResult)
        setResult(r)
        setHistory(prev => [r, ...prev.filter(h => h.ip !== r.ip)].slice(0, 15))
      }
    } catch (e: any) { setError(e.message) }
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1200)
  }

  const exportResult = () => {
    if (!result) return
    const txt = `IP Address: ${result.ip}\nDecimal: ${result.decimal}\nHexadecimal: ${result.hex}\nBinary: ${result.binary}\nOctal: ${result.octal}`
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'ip-conversion.txt'; a.click()
    URL.revokeObjectURL(url)
  }

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
                <Hash className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">IP to <span className="text-slate-500">Decimal Converter</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Convert IPs to decimal, hex, binary, and octal formats</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Input */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setDirection(direction === 'ip-to-dec' ? 'dec-to-ip' : 'ip-to-dec')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                <ArrowLeftRight className="w-4 h-4" />
                {direction === 'ip-to-dec' ? 'IP → Number' : 'Number → IP'}
              </button>
              {result && (
                <button onClick={exportResult} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 flex items-center gap-1.5 transition-colors"><Download className="w-3.5 h-3.5" />Export</button>
              )}
            </div>

            <div className="space-y-3">
              {direction === 'ip-to-dec' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">IP Address</label>
                  <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && convert()} placeholder="192.168.1.1" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Decimal Value</label>
                  <input type="text" value={decimal} onChange={(e) => setDecimal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && convert()} placeholder="3232235777" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              )}
              <button onClick={convert} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">Convert</button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            {/* Quick Samples */}
            <div className="flex flex-wrap gap-2 mt-3">
              {SAMPLES.map(s => (
                <button key={s.ip} onClick={() => { if (direction === 'ip-to-dec') setIp(s.ip); else setDecimal(s.dec) }} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-mono text-gray-600 transition-colors">
                  {direction === 'ip-to-dec' ? s.ip : s.dec}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-format Results */}
          {result && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Formats</h3>
                <button onClick={() => { const all = `IP: ${result.ip}\nDecimal: ${result.decimal}\nHex: ${result.hex}\nBinary: ${result.binary}\nOctal: ${result.octal}`; copy(all, 'all') }} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  {copied === 'all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}Copy All
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'IP Address', value: result.ip, bg: 'bg-blue-50 border-blue-200' },
                  { label: 'Decimal', value: result.decimal, bg: 'bg-green-50 border-green-200' },
                  { label: 'Hexadecimal', value: result.hex, bg: 'bg-purple-50 border-purple-200' },
                  { label: 'Binary', value: result.binary, bg: 'bg-amber-50 border-amber-200' },
                  { label: 'Octal', value: result.octal, bg: 'bg-cyan-50 border-cyan-200' },
                ].map(item => (
                  <div key={item.label} className={`rounded-lg p-4 border ${item.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">{item.label}</span>
                      <button onClick={() => copy(item.value, item.label)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        {copied === item.label ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}Copy
                      </button>
                    </div>
                    <p className="font-mono text-lg text-gray-900 break-all">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Examples Table */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Common Conversions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                  <th className="py-2 pr-4">IP</th><th className="py-2 pr-4">Decimal</th><th className="py-2">Hex</th>
                </tr></thead>
                <tbody>
                  {SAMPLES.map(s => (
                    <tr key={s.ip} className="border-b border-gray-100 cursor-pointer hover:bg-gray-50" onClick={() => { setDirection('ip-to-dec'); setIp(s.ip); const r = ipToFormats(s.ip); setResult(r); setDecimal(r.decimal) }}>
                      <td className="py-2 pr-4 font-mono text-gray-900">{s.ip}</td>
                      <td className="py-2 pr-4 font-mono text-gray-600">{s.dec}</td>
                      <td className="py-2 font-mono text-gray-600">0x{parseInt(s.dec).toString(16).toUpperCase().padStart(8, '0')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" />Conversion History</h3>
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setIp(h.ip); setDecimal(h.decimal); setResult(h); setDirection('ip-to-dec') }} className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <span className="font-mono text-sm text-gray-900">{h.ip}</span>
                    <span className="font-mono text-xs text-gray-500">{h.decimal}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info Panel */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg">
            <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />About IP Number Formats</h3>
              {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showInfo && (
              <div className="px-6 pb-6 space-y-3 text-sm text-gray-600">
                <p>IPv4 addresses are 32-bit numbers commonly written as four decimal octets. They can also be expressed in other numeric bases for different purposes:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { t: 'Decimal Notation', d: 'Single 32-bit unsigned integer (0-4294967295). Used in some firewall rules, databases, and IP geolocation lookups.' },
                    { t: 'Hexadecimal', d: 'Base-16 representation prefixed with 0x. Common in low-level networking, packet analysis, and programming.' },
                    { t: 'Binary', d: 'Base-2 showing individual bits. Essential for understanding subnet masks and CIDR calculations.' },
                    { t: 'Octal', d: 'Base-8 prefixed with 0. Some systems accept octal IP notation (e.g., ping 0177.0.0.1 = 127.0.0.1).' },
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
