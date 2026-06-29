'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRightLeft, Copy, Check, ArrowLeft, Download, Binary, Hash, Braces, Trash2, BarChart3 } from 'lucide-react'

type BaseMode = 'binary' | 'hex' | 'octal' | 'decimal' | 'base64'

function textToBinary(text: string): string { return text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ') }
function binaryToText(b: string): string { return b.trim().split(/\s+/).map(x => { const n = parseInt(x, 2); return isNaN(n) ? '?' : String.fromCharCode(n) }).join('') }
function textToHex(text: string): string { return text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ') }
function hexToText(h: string): string { return h.trim().split(/\s+/).map(x => { const n = parseInt(x, 16); return isNaN(n) ? '?' : String.fromCharCode(n) }).join('') }
function textToOctal(text: string): string { return text.split('').map(c => c.charCodeAt(0).toString(8).padStart(3, '0')).join(' ') }
function octalToText(o: string): string { return o.trim().split(/\s+/).map(x => { const n = parseInt(x, 8); return isNaN(n) ? '?' : String.fromCharCode(n) }).join('') }
function textToDecimal(text: string): string { return text.split('').map(c => c.charCodeAt(0).toString()).join(' ') }
function decimalToText(d: string): string { return d.trim().split(/\s+/).map(x => { const n = parseInt(x, 10); return isNaN(n) ? '?' : String.fromCharCode(n) }).join('') }
function textToBase64(text: string): string { try { return btoa(text) } catch { return 'Invalid input' } }
function base64ToText(b64: string): string { try { return atob(b64.trim()) } catch { return 'Invalid Base64' } }

const modes: { id: BaseMode; label: string; prefix: string; desc: string }[] = [
  { id: 'binary', label: 'Binary', prefix: '0b', desc: 'Base-2 (0s and 1s)' },
  { id: 'hex', label: 'Hexadecimal', prefix: '0x', desc: 'Base-16 (0-9, A-F)' },
  { id: 'octal', label: 'Octal', prefix: '0o', desc: 'Base-8 (0-7)' },
  { id: 'decimal', label: 'Decimal', prefix: '', desc: 'Base-10 (ASCII codes)' },
  { id: 'base64', label: 'Base64', prefix: '', desc: 'Base64 encoding' },
]

const samples = [
  { label: 'Hello World', text: 'Hello World' },
  { label: 'ASCII Art', text: '01001000 01101001' },
  { label: 'Hex Color', text: '#FF5733' },
  { label: 'Binary IP', text: '11000000.10101000.00000001.00000001' },
]

function encode(text: string, mode: BaseMode): string {
  switch (mode) {
    case 'binary': return textToBinary(text)
    case 'hex': return textToHex(text)
    case 'octal': return textToOctal(text)
    case 'decimal': return textToDecimal(text)
    case 'base64': return textToBase64(text)
  }
}

function decode(encoded: string, mode: BaseMode): string {
  switch (mode) {
    case 'binary': return binaryToText(encoded)
    case 'hex': return hexToText(encoded)
    case 'octal': return octalToText(encoded)
    case 'decimal': return decimalToText(encoded)
    case 'base64': return base64ToText(encoded)
  }
}

export default function BinaryTextPage() {
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode')
  const [mode, setMode] = useState<BaseMode>('binary')
  const [copied, setCopied] = useState<string | false>(false)
  const [showAllFormats, setShowAllFormats] = useState(false)
  const [showBitView, setShowBitView] = useState(false)
  const [history, setHistory] = useState<{ input: string; output: string; mode: string; direction: string; ts: string }[]>([])

  const output = useMemo(() => {
    if (!input) return ''
    return direction === 'encode' ? encode(input, mode) : decode(input, mode)
  }, [input, direction, mode])

  // All formats at once (when encoding)
  const allFormats = useMemo(() => {
    if (!input || direction !== 'encode') return null
    return modes.map(m => ({
      ...m,
      output: encode(input, m.id),
    }))
  }, [input, direction])

  // Bit visualization
  const bitView = useMemo(() => {
    const text = direction === 'encode' ? input : output
    if (!text) return []
    return text.split('').map(c => ({
      char: c,
      code: c.charCodeAt(0),
      binary: c.charCodeAt(0).toString(2).padStart(8, '0'),
      hex: c.charCodeAt(0).toString(16).padStart(2, '0'),
    }))
  }, [input, output, direction])

  // Byte statistics
  const stats = useMemo(() => {
    const text = direction === 'encode' ? input : output
    if (!text) return null
    const bytes = text.split('').map(c => c.charCodeAt(0))
    const total = bytes.length
    const printable = bytes.filter(b => b >= 32 && b <= 126).length
    const isAscii = bytes.every(b => b <= 127)
    const unique = new Set(bytes).size
    return { total, printable, isAscii, unique, outputLength: output.length }
  }, [input, output, direction])

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(false), 1200)
  }

  const addToHistory = () => {
    if (!input || !output) return
    setHistory(prev => [{ input: input.slice(0, 40), output: output.slice(0, 40), mode, direction, ts: new Date().toISOString() }, ...prev].slice(0, 15))
  }

  const exportResult = () => {
    addToHistory()
    const allFmt = direction === 'encode' ? modes.map(m => `${m.label}: ${encode(input, m.id)}`).join('\n\n') : ''
    const content = `Text ↔ ${mode} Conversion\nDirection: ${direction}\n\nInput:\n${input}\n\nOutput (${mode}):\n${output}${allFmt ? '\n\n--- All Formats ---\n' + allFmt : ''}`
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'conversion.txt'; a.click(); URL.revokeObjectURL(a.href)
  }

  const swap = () => {
    const prev = output
    setDirection(d => d === 'encode' ? 'decode' : 'encode')
    setInput(prev)
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
                <Binary className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Number Base <span className="text-slate-500">Converter</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Convert between text and Binary, Hex, Octal, Decimal & Base64 with bit visualization</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Mode Selector */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-2">
                {modes.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {m.prefix && <span className="font-mono mr-1 opacity-60">{m.prefix}</span>}{m.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setDirection('encode')} className={`px-3 py-2 rounded-lg text-sm font-medium ${direction === 'encode' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Text → {mode}</button>
                <button onClick={swap} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100"><ArrowRightLeft className="w-4 h-4" /></button>
                <button onClick={() => setDirection('decode')} className={`px-3 py-2 rounded-lg text-sm font-medium ${direction === 'decode' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{mode} → Text</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {samples.map(s => (
                <button key={s.label} onClick={() => setInput(s.text)} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs">{s.label}</button>
              ))}
            </div>
          </div>

          {/* Input / Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Input</label>
              <textarea
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                rows={6}
                placeholder={direction === 'encode' ? 'Enter text...' : `Enter ${mode} values...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{input.length} chars</span>
                <span>{new Blob([input]).size} bytes</span>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Output ({mode})</label>
                <div className="flex gap-1.5">
                  <button onClick={() => copy(output, 'main')} disabled={!output} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50">
                    {copied === 'main' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}{copied === 'main' ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={exportResult} disabled={!output} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"><Download className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-sm text-gray-900 min-h-[148px] break-all whitespace-pre-wrap">
                {output || 'Output will appear here...'}
              </div>
              {stats && (
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                  <span>{stats.outputLength} chars output</span>
                  <span>{stats.isAscii ? '✓ ASCII' : '⚠️ Non-ASCII'}</span>
                  <span>{stats.unique} unique bytes</span>
                  <span>{stats.printable}/{stats.total} printable</span>
                </div>
              )}
            </div>
          </div>

          {/* All Formats View */}
          {direction === 'encode' && input && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <button onClick={() => setShowAllFormats(!showAllFormats)} className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Braces className="w-4 h-4 text-blue-600" />{showAllFormats ? '▼' : '▶'} All Formats Simultaneously
              </button>
              {showAllFormats && allFormats && (
                <div className="mt-4 space-y-3">
                  {allFormats.map(f => (
                    <div key={f.id} className={`rounded-xl p-4 border ${f.id === mode ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-600 uppercase">{f.label} <span className="text-gray-400 font-normal">({f.desc})</span></span>
                        <button onClick={() => copy(f.output, `fmt-${f.id}`)} className="text-gray-400 hover:text-gray-600">
                          {copied === `fmt-${f.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="font-mono text-sm text-gray-800 break-all">{f.output}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bit Visualization */}
          {input && (direction === 'encode' ? input : output) && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <button onClick={() => setShowBitView(!showBitView)} className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />{showBitView ? '▼' : '▶'} Byte-Level Visualization
              </button>
              {showBitView && (
                <div className="mt-4">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {bitView.slice(0, 60).map((b, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-2 border border-gray-200 text-center hover:bg-blue-50 hover:border-blue-200 transition-colors">
                        <div className="text-lg font-bold text-gray-900">{b.char === ' ' ? '␣' : b.char}</div>
                        <div className="text-[10px] font-mono text-gray-500">{b.binary}</div>
                        <div className="flex justify-center gap-[1px] mt-1">
                          {b.binary.split('').map((bit, j) => (
                            <div key={j} className={`w-1.5 h-3 rounded-sm ${bit === '1' ? 'bg-blue-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">0x{b.hex} ({b.code})</div>
                      </div>
                    ))}
                  </div>
                  {bitView.length > 60 && <p className="text-xs text-gray-400 mt-2">Showing first 60 of {bitView.length} characters</p>}
                </div>
              )}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">History</h4>
                <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0 text-xs">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded font-medium uppercase">{h.mode}</span>
                    <span className={`px-1.5 py-0.5 rounded ${h.direction === 'encode' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{h.direction}</span>
                    <span className="font-mono text-gray-600 truncate flex-1">{h.input}</span>
                    <span className="text-gray-400">{new Date(h.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔢', title: '5 Number Bases', desc: 'Convert between text and Binary (base-2), Hexadecimal (base-16), Octal (base-8), Decimal (ASCII), and Base64.' },
              { icon: '📊', title: 'Bit Visualization', desc: 'Interactive byte-level display with individual bit bars, hex values, and decimal codes for each character.' },
              { icon: '📋', title: 'All Formats View', desc: 'See all 5 encoding formats simultaneously. Copy any format individually. Export complete conversion report.' },
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
