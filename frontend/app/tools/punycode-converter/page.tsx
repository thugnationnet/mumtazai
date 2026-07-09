'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Globe, ArrowLeft, Copy, Check, ArrowLeftRight, Clock, Info, ChevronDown, ChevronUp, Download } from 'lucide-react'

function toPunycode(input: string): string {
  try {
    const testUrl = new URL('http://x')
    testUrl.hostname = input
    return testUrl.hostname
  } catch { return 'Invalid input' }
}

function fromPunycode(input: string): string {
  try {
    const url = new URL(`http://${input}`)
    return decodeURIComponent(url.hostname) || url.hostname
  } catch { return 'Invalid punycode' }
}

interface HistoryEntry { input: string; output: string; mode: 'encode' | 'decode' }

const ENCODE_SAMPLES = ['münchen.de', 'ñoño.com', '中文.com', 'café.fr', 'россия.рф', 'tokyo.日本', 'domæne.dk', 'łódź.pl']
const DECODE_SAMPLES = ['xn--mnchen-3ya.de', 'xn--oo-0mc3b.com', 'xn--fiq228c.com', 'xn--caf-dma.fr', 'xn--e1afmapc.xn--p1acf']

export default function PunycodeConverterPage() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [input, setInput] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [tab, setTab] = useState<'single' | 'batch'>('single')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showInfo, setShowInfo] = useState(false)

  const output = input ? (mode === 'encode' ? toPunycode(input) : fromPunycode(input)) : ''

  const addToHistory = (inp: string, out: string) => {
    setHistory(prev => [{ input: inp, output: out, mode }, ...prev.filter(h => h.input !== inp)].slice(0, 15))
  }

  const handleConvert = () => {
    if (!input) return
    const out = mode === 'encode' ? toPunycode(input) : fromPunycode(input)
    addToHistory(input, out)
  }

  const batchResults = batchInput ? batchInput.split('\n').filter(Boolean).slice(0, 20).map(line => {
    const trimmed = line.trim()
    const out = mode === 'encode' ? toPunycode(trimmed) : fromPunycode(trimmed)
    return { input: trimmed, output: out }
  }) : []

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1200)
  }

  const exportResults = () => {
    const items = tab === 'single' && output ? [{ input, output }] : batchResults
    const txt = items.map(r => `${r.input} → ${r.output}`).join('\n')
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'punycode-results.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const examples = mode === 'encode' ? ENCODE_SAMPLES : DECODE_SAMPLES

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
                <Globe className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Punycode <span className="text-blue-100">Converter</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Convert international domain names to and from Punycode (IDN)</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              {/* Mode Toggle */}
              <button onClick={() => setMode(mode === 'encode' ? 'decode' : 'encode')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                <ArrowLeftRight className="w-4 h-4" />
                {mode === 'encode' ? 'Unicode → Punycode' : 'Punycode → Unicode'}
              </button>
              {/* Tab Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['single', 'batch'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                    {t === 'single' ? 'Single' : 'Batch'}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'single' ? (
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{mode === 'encode' ? 'Domain (Unicode/IDN)' : 'Domain (Punycode/ACE)'}</label>
                <div className="flex gap-3">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleConvert()} placeholder={mode === 'encode' ? 'münchen.de' : 'xn--mnchen-3ya.de'} className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <button onClick={handleConvert} className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">Convert</button>
                </div>
              </>
            ) : (
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-2">One domain per line (up to 20)</label>
                <textarea value={batchInput} onChange={(e) => setBatchInput(e.target.value)} rows={5} placeholder={mode === 'encode' ? 'münchen.de\nñoño.com\n中文.com' : 'xn--mnchen-3ya.de\nxn--oo-0mc3b.com'} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {examples.map(ex => (
                <button key={ex} onClick={() => { if (tab === 'single') setInput(ex); else setBatchInput(prev => prev ? prev + '\n' + ex : ex) }} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md text-xs transition-colors font-mono">{ex}</button>
              ))}
            </div>
          </div>

          {/* Single Result — Bidirectional Display */}
          {tab === 'single' && output && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Conversion Result</h3>
                <button onClick={exportResults} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 flex items-center gap-1.5 transition-colors"><Download className="w-3.5 h-3.5" />Export</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-blue-600 uppercase">{mode === 'encode' ? 'Unicode (IDN)' : 'Punycode (ACE)'}</span>
                    <button onClick={() => copy(input, 'input')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      {copied === 'input' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="font-mono text-lg text-gray-900 break-all">{input}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-green-600 uppercase">{mode === 'encode' ? 'Punycode (ACE)' : 'Unicode (IDN)'}</span>
                    <button onClick={() => copy(output, 'output')} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
                      {copied === 'output' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="font-mono text-lg text-gray-900 break-all">{output}</p>
                </div>
              </div>
              {output.startsWith('xn--') || input.startsWith('xn--') ? (
                <p className="text-xs text-gray-500 mt-3">This domain uses IDN encoding. The <code className="bg-gray-100 px-1 rounded">xn--</code> prefix indicates an ACE-encoded label.</p>
              ) : null}
            </div>
          )}

          {/* Batch Results */}
          {tab === 'batch' && batchResults.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Batch Results ({batchResults.length})</h3>
                <button onClick={exportResults} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 flex items-center gap-1.5 transition-colors"><Download className="w-3.5 h-3.5" />Export</button>
              </div>
              <div className="space-y-2">
                {batchResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="font-mono text-sm text-gray-700 flex-1 truncate">{r.input}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-mono text-sm text-gray-900 font-semibold flex-1 truncate">{r.output}</span>
                    <button onClick={() => copy(r.output, `batch-${i}`)} className="text-gray-400 hover:text-brand-600 transition-colors">
                      {copied === `batch-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
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
                  <button key={i} onClick={() => { setMode(h.mode); setInput(h.input); setTab('single') }} className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <span className="font-mono text-sm text-gray-900 truncate">{h.input}</span>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-gray-400">→</span>
                      <span className="font-mono text-xs text-gray-500 truncate max-w-[200px]">{h.output}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${h.mode === 'encode' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>{h.mode === 'encode' ? 'ENC' : 'DEC'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />About Punycode & IDN</h3>
              {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showInfo && (
              <div className="px-6 pb-6 space-y-3 text-sm text-gray-600">
                <p>Punycode (RFC 3492) encodes Unicode characters into the limited ASCII character set used by DNS. Internationalized Domain Names (IDN) let users register domains in their native scripts.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { t: 'ACE Prefix (xn--)', d: 'All punycode-encoded labels start with xn-- to signal they contain encoded Unicode characters.' },
                    { t: 'IDN Standards', d: 'IDNA2003 (RFC 3490) and IDNA2008 (RFC 5891) define how international characters map to DNS-safe ASCII.' },
                    { t: 'Browser Display', d: 'Browsers show Unicode in the address bar but send punycode over DNS. Some may display punycode for phishing protection.' },
                    { t: 'Homograph Attacks', d: 'Visually similar characters from different scripts (e.g., Latin "a" vs Cyrillic "а") can create deceptive domain names.' },
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
