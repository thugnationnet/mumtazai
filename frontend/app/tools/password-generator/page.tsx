'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { KeyRound, Copy, Check, ArrowLeft, RefreshCw, Shield, Download, Trash2, Zap, Eye, EyeOff, Hash, Lock, Layers, Sparkles } from 'lucide-react'

type GenerateMode = 'password' | 'passphrase' | 'pin'

interface GenOptions {
  upper: boolean
  lower: boolean
  numbers: boolean
  symbols: boolean
  excludeSimilar: boolean  // l,1,I,0,O
  excludeAmbiguous: boolean // {}[]()\/'"~,;:.<>
  customInclude: string
  customExclude: string
}

const SIMILAR_CHARS = 'l1IO0'
const AMBIGUOUS_CHARS = '{}[]()\\\/\'"~,;:.<>'

const wordList = ['apple','river','table','cloud','dream','forest','guitar','harbor','island','jungle','knight','lemon','mango','novel','ocean','piano','queen','rocket','silver','tiger','umbrella','violet','window','yellow','zebra','anchor','bridge','crystal','dancer','eagle','falcon','garden','heaven','ivory','jewel','karma','lotus','marble','nectar','opal','pepper','quartz','raven','storm','throne','ultra','vortex','wisdom','xenon']

const presets: { label: string; desc: string; mode: GenerateMode; length: number; opts: Partial<GenOptions> }[] = [
  { label: 'Web Safe', desc: 'Avoids ambiguous chars', mode: 'password', length: 16, opts: { upper: true, lower: true, numbers: true, symbols: false, excludeSimilar: true } },
  { label: 'Maximum Security', desc: 'All char types, 32 length', mode: 'password', length: 32, opts: { upper: true, lower: true, numbers: true, symbols: true, excludeSimilar: false } },
  { label: 'Passphrase', desc: '4-word memorable', mode: 'passphrase', length: 4, opts: {} },
  { label: 'PIN Code', desc: 'Numeric only', mode: 'pin', length: 6, opts: {} },
  { label: 'API Key', desc: 'Hex-style token', mode: 'password', length: 40, opts: { upper: false, lower: true, numbers: true, symbols: false, excludeSimilar: false } },
  { label: 'Wi-Fi Key', desc: 'Easy to type, 20 chars', mode: 'password', length: 20, opts: { upper: true, lower: true, numbers: true, symbols: false, excludeSimilar: true } },
]

function buildCharSet(opts: GenOptions): string {
  let chars = ''
  if (opts.upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (opts.lower) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (opts.numbers) chars += '0123456789'
  if (opts.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  if (opts.customInclude) chars += opts.customInclude
  if (opts.excludeSimilar) chars = chars.split('').filter(c => !SIMILAR_CHARS.includes(c)).join('')
  if (opts.excludeAmbiguous) chars = chars.split('').filter(c => !AMBIGUOUS_CHARS.includes(c)).join('')
  if (opts.customExclude) chars = chars.split('').filter(c => !opts.customExclude.includes(c)).join('')
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz'
  return [...new Set(chars.split(''))].join('')
}

function generatePassword(length: number, opts: GenOptions): string {
  const chars = buildCharSet(opts)
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, (v) => chars[v % chars.length]).join('')
}

function generatePassphrase(wordCount: number, separator: string, capitalize: boolean): string {
  const arr = new Uint32Array(wordCount)
  crypto.getRandomValues(arr)
  return Array.from(arr, v => {
    const w = wordList[v % wordList.length]
    return capitalize ? w[0].toUpperCase() + w.slice(1) : w
  }).join(separator)
}

function generatePin(length: number): string {
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, v => (v % 10).toString()).join('')
}

function calcEntropy(pw: string, charsetSize: number): number {
  return pw.length * Math.log2(charsetSize || 1)
}

function estimateCrackTime(entropy: number): string {
  const guessesPerSec = 1e12 // 1 trillion guesses/sec (GPU farm)
  const seconds = Math.pow(2, entropy) / guessesPerSec
  if (seconds < 1) return 'Instant'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} days`
  if (seconds < 86400 * 365 * 1e3) return `${Math.round(seconds / (86400 * 365))} years`
  if (seconds < 86400 * 365 * 1e6) return `${Math.round(seconds / (86400 * 365 * 1e3))}K years`
  if (seconds < 86400 * 365 * 1e9) return `${Math.round(seconds / (86400 * 365 * 1e6))}M years`
  return `${(seconds / (86400 * 365 * 1e9)).toExponential(1)} billion years`
}

function getStrength(entropy: number): { label: string; color: string; bgColor: string; percent: number } {
  if (entropy < 28) return { label: 'Very Weak', color: 'text-red-600', bgColor: 'bg-red-500', percent: 10 }
  if (entropy < 36) return { label: 'Weak', color: 'text-orange-600', bgColor: 'bg-orange-500', percent: 25 }
  if (entropy < 60) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-500', percent: 45 }
  if (entropy < 80) return { label: 'Strong', color: 'text-blue-600', bgColor: 'bg-blue-500', percent: 70 }
  if (entropy < 120) return { label: 'Very Strong', color: 'text-green-600', bgColor: 'bg-green-500', percent: 90 }
  return { label: 'Extreme', color: 'text-emerald-600', bgColor: 'bg-emerald-500', percent: 100 }
}

export default function PasswordGeneratorPage() {
  const [mode, setMode] = useState<GenerateMode>('password')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState<GenOptions>({ upper: true, lower: true, numbers: true, symbols: true, excludeSimilar: false, excludeAmbiguous: false, customInclude: '', customExclude: '' })
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState<string | false>(false)
  const [history, setHistory] = useState<{ pw: string; mode: string; entropy: number; time: string }[]>([])
  const [showPassword, setShowPassword] = useState(true)
  const [batchCount, setBatchCount] = useState(5)
  const [batchPasswords, setBatchPasswords] = useState<string[]>([])
  const [showBatch, setShowBatch] = useState(false)
  const [separator, setSeparator] = useState('-')
  const [capitalize, setCapitalize] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const charsetSize = useMemo(() => {
    if (mode === 'pin') return 10
    if (mode === 'passphrase') return wordList.length
    return buildCharSet(options).length
  }, [mode, options])

  const entropy = useMemo(() => {
    if (!password) return 0
    if (mode === 'passphrase') return length * Math.log2(wordList.length)
    return calcEntropy(password, charsetSize)
  }, [password, charsetSize, length, mode])

  const strength = useMemo(() => getStrength(entropy), [entropy])
  const crackTime = useMemo(() => estimateCrackTime(entropy), [entropy])

  const generate = useCallback(() => {
    let pw: string
    if (mode === 'passphrase') pw = generatePassphrase(length, separator, capitalize)
    else if (mode === 'pin') pw = generatePin(length)
    else pw = generatePassword(length, options)
    setPassword(pw)
    setHistory(prev => [{ pw, mode, entropy: mode === 'passphrase' ? length * Math.log2(wordList.length) : mode === 'pin' ? length * Math.log2(10) : calcEntropy(pw, buildCharSet(options).length), time: new Date().toISOString() }, ...prev].slice(0, 20))
    setShowBatch(false)
  }, [length, options, mode, separator, capitalize])

  const generateBatch = useCallback(() => {
    const pws: string[] = []
    for (let i = 0; i < batchCount; i++) {
      if (mode === 'passphrase') pws.push(generatePassphrase(length, separator, capitalize))
      else if (mode === 'pin') pws.push(generatePin(length))
      else pws.push(generatePassword(length, options))
    }
    setBatchPasswords(pws)
    setShowBatch(true)
  }, [batchCount, length, options, mode, separator, capitalize])

  const applyPreset = (p: typeof presets[0]) => {
    setMode(p.mode)
    setLength(p.length)
    if (p.opts.upper !== undefined) setOptions(prev => ({ ...prev, ...p.opts }))
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(false), 1200)
  }

  const exportPasswords = (format: 'txt' | 'json') => {
    const list = showBatch ? batchPasswords : history.map(h => h.pw)
    if (!list.length) return
    let content: string, ext: string
    if (format === 'json') {
      content = JSON.stringify(showBatch ? { passwords: list } : history.map(h => ({ password: h.pw, mode: h.mode, entropy: Math.round(h.entropy), generated: h.time })), null, 2)
      ext = 'json'
    } else {
      content = list.join('\n')
      ext = 'txt'
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `passwords.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
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
                <KeyRound className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Password <span className="text-blue-100">Generator</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Generate passwords, passphrases & PINs with entropy analysis and crack-time estimation</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Generated Password Display */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200 font-mono text-lg text-gray-900 break-all min-h-[56px] relative">
                {password ? (showPassword ? password : '•'.repeat(password.length)) : <span className="text-gray-400">Click Generate...</span>}
                {password && (
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={generate} className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors" title="Generate"><RefreshCw className="w-5 h-5" /></button>
                <button onClick={() => password && copy(password, 'main')} disabled={!password} className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors disabled:opacity-50" title="Copy">
                  {copied === 'main' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Strength Meter */}
            {password && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className={`text-lg font-bold ${strength.color}`}>{strength.label}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className={`${strength.bgColor} h-2 rounded-full transition-all`} style={{ width: `${strength.percent}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Strength</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-800">{Math.round(entropy)}</div>
                  <p className="text-[10px] text-gray-400">Bits of Entropy</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-600">{charsetSize}</div>
                  <p className="text-[10px] text-gray-400">Charset Size</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-sm font-bold text-orange-600 leading-tight">{crackTime}</div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Crack Time (1T/s)</p>
                </div>
              </div>
            )}
          </div>

          {/* Presets */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {presets.map((p, i) => (
                <button key={i} onClick={() => { applyPreset(p); }} className="p-3 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-left">
                  <div className="text-sm font-semibold text-gray-900">{p.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mode & Options */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-5">
              {/* Mode Selector */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Mode</h3>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'password' as const, label: 'Password', icon: Lock, desc: 'Random chars' },
                    { id: 'passphrase' as const, label: 'Passphrase', icon: Layers, desc: 'Word-based' },
                    { id: 'pin' as const, label: 'PIN', icon: Hash, desc: 'Numbers only' },
                  ]).map(m => (
                    <button key={m.id} onClick={() => { setMode(m.id); setLength(m.id === 'pin' ? 6 : m.id === 'passphrase' ? 4 : 16) }} className={`p-3 rounded-xl text-center transition-all ${mode === m.id ? 'ring-2 ring-brand-500 bg-brand-50' : 'border border-gray-200 hover:bg-gray-50'}`}>
                      <m.icon className="w-5 h-5 mx-auto mb-1 text-gray-700" />
                      <div className="text-sm font-semibold">{m.label}</div>
                      <div className="text-[10px] text-gray-500">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {mode === 'passphrase' ? 'Word Count' : 'Length'}
                  </label>
                  <span className="text-sm font-mono text-gray-500">{length}</span>
                </div>
                <input type="range" min={mode === 'pin' ? 4 : mode === 'passphrase' ? 2 : 4} max={mode === 'pin' ? 12 : mode === 'passphrase' ? 10 : 128} value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-full accent-brand-600" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{mode === 'pin' ? 4 : mode === 'passphrase' ? 2 : 4}</span>
                  <span>{mode === 'pin' ? 12 : mode === 'passphrase' ? 10 : 128}</span>
                </div>
              </div>

              {/* Character Options (password mode) */}
              {mode === 'password' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Character Sets</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'upper' as const, label: 'A-Z Uppercase', sample: 'ABC' },
                      { key: 'lower' as const, label: 'a-z Lowercase', sample: 'abc' },
                      { key: 'numbers' as const, label: '0-9 Numbers', sample: '012' },
                      { key: 'symbols' as const, label: '!@# Symbols', sample: '!@#' },
                    ]).map(opt => (
                      <label key={opt.key} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${options[opt.key] ? 'bg-brand-50 border border-brand-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <input type="checkbox" checked={options[opt.key]} onChange={(e) => setOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))} className="rounded text-brand-600 focus:ring-brand-500" />
                        <div>
                          <span className="text-sm text-gray-700">{opt.label}</span>
                          <span className="text-xs text-gray-400 ml-1 font-mono">{opt.sample}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Passphrase Options */}
              {mode === 'passphrase' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Separator</label>
                    <div className="flex gap-2">
                      {['-', '_', '.', ' ', ''].map(s => (
                        <button key={s || 'none'} onClick={() => setSeparator(s)} className={`px-3 py-1.5 rounded-lg text-sm font-mono ${separator === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {s || 'none'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={capitalize} onChange={(e) => setCapitalize(e.target.checked)} className="rounded text-brand-600" />
                    <span className="text-sm text-gray-700">Capitalize first letter</span>
                  </label>
                </div>
              )}

              {/* Advanced Options (password mode) */}
              {mode === 'password' && (
                <div>
                  <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                    {showAdvanced ? '▼' : '▶'} Advanced Options
                  </button>
                  {showAdvanced && (
                    <div className="mt-3 space-y-3 bg-gray-50 rounded-lg p-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={options.excludeSimilar} onChange={(e) => setOptions(prev => ({ ...prev, excludeSimilar: e.target.checked }))} className="rounded text-brand-600" />
                        <span className="text-sm text-gray-700">Exclude similar chars <span className="font-mono text-gray-400">(l, 1, I, 0, O)</span></span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={options.excludeAmbiguous} onChange={(e) => setOptions(prev => ({ ...prev, excludeAmbiguous: e.target.checked }))} className="rounded text-brand-600" />
                        <span className="text-sm text-gray-700">Exclude ambiguous chars <span className="font-mono text-gray-400">{'{}[]()/\\\'"~'}</span></span>
                      </label>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Custom exclude characters</label>
                        <input type="text" value={options.customExclude} onChange={(e) => setOptions(prev => ({ ...prev, customExclude: e.target.value }))} placeholder="Characters to exclude..." className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Custom include characters</label>
                        <input type="text" value={options.customInclude} onChange={(e) => setOptions(prev => ({ ...prev, customInclude: e.target.value }))} placeholder="Extra characters to include..." className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={generate} className="w-full px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 hover:opacity-90 text-white rounded-xl transition-opacity font-semibold flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />Generate {mode === 'passphrase' ? 'Passphrase' : mode === 'pin' ? 'PIN' : 'Password'}
              </button>
            </div>

            {/* Batch & History */}
            <div className="space-y-6">
              {/* Batch Generator */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Batch Generate</h3>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-sm text-gray-600">Count:</label>
                  <input type="number" min={2} max={50} value={batchCount} onChange={(e) => setBatchCount(Math.min(50, Math.max(2, parseInt(e.target.value) || 2)))} className="w-20 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <button onClick={generateBatch} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />Generate {batchCount}
                  </button>
                </div>
                {showBatch && batchPasswords.length > 0 && (
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    {batchPasswords.map((pw, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                        <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                        <span className="flex-1 font-mono text-sm text-gray-800 truncate">{pw}</span>
                        <button onClick={() => copy(pw, `batch-${i}`)} className="text-gray-400 hover:text-gray-600">
                          {copied === `batch-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => exportPasswords('txt')} className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs flex items-center justify-center gap-1.5"><Download className="w-3.5 h-3.5" />Export TXT</button>
                      <button onClick={() => exportPasswords('json')} className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs flex items-center justify-center gap-1.5"><Download className="w-3.5 h-3.5" />Export JSON</button>
                    </div>
                  </div>
                )}
              </div>

              {/* History */}
              {history.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">History</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => exportPasswords('txt')} className="text-xs text-gray-400 hover:text-gray-600"><Download className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    {history.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${h.mode === 'passphrase' ? 'bg-purple-100 text-purple-600' : h.mode === 'pin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{h.mode}</span>
                        <span className="font-mono text-sm text-gray-700 truncate flex-1">{h.pw}</span>
                        <span className={`text-[10px] font-bold ${getStrength(h.entropy).color}`}>{Math.round(h.entropy)}b</span>
                        <button onClick={() => copy(h.pw, `hist-${i}`)} className="text-gray-400 hover:text-gray-600">
                          {copied === `hist-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Note */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-brand-600" />Browser-Only Security</h3>
                <p className="text-xs text-gray-600 leading-relaxed">All passwords are generated entirely in your browser using the Web Crypto API (crypto.getRandomValues). Nothing is transmitted to any server. Crack time estimates assume a hypothetical attacker performing 1 trillion guesses per second.</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔐', title: '3 Generation Modes', desc: 'Random passwords with custom charsets, memorable word-based passphrases, and numeric PINs — all cryptographically random' },
              { icon: '📊', title: 'Entropy Analysis', desc: 'Real-time entropy calculation, crack-time estimation at 1T guesses/sec, charset size, and strength scoring' },
              { icon: '⚡', title: 'Batch & Export', desc: 'Generate up to 50 passwords at once. Export as TXT or JSON. Full history with per-entry entropy tracking' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
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
