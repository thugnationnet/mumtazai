'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { RotateCw, Copy, Check, ArrowLeft, ArrowRightLeft, Download, Trash2, BarChart3, Shuffle, FileText, RefreshCw } from 'lucide-react'

type CipherMode = 'rot13' | 'rot47' | 'caesar' | 'atbash' | 'vigenere' | 'substitution'

function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

function rot47(text: string): string {
  return text.replace(/[!-~]/g, c => String.fromCharCode(((c.charCodeAt(0) - 33 + 47) % 94) + 33))
}

function caesarShift(text: string, shift: number): string {
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base)
  })
}

function atbash(text: string): string {
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base))
  })
}

function vigenereEncrypt(text: string, key: string): string {
  if (!key) return text
  const k = key.toUpperCase()
  let ki = 0
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97
    const shift = k.charCodeAt(ki % k.length) - 65
    ki++
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base)
  })
}

function vigenereDecrypt(text: string, key: string): string {
  if (!key) return text
  const k = key.toUpperCase()
  let ki = 0
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97
    const shift = k.charCodeAt(ki % k.length) - 65
    ki++
    return String.fromCharCode(((c.charCodeAt(0) - base - shift + 26) % 26) + base)
  })
}

function generateSubstitutionKey(): string {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  for (let i = alpha.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [alpha[i], alpha[j]] = [alpha[j], alpha[i]]
  }
  return alpha.join('')
}

function substitutionCipher(text: string, key: string): string {
  return text.replace(/[a-zA-Z]/g, c => {
    const isUpper = c <= 'Z'
    const idx = c.toUpperCase().charCodeAt(0) - 65
    const mapped = key[idx] || c
    return isUpper ? mapped : mapped.toLowerCase()
  })
}

function substitutionDecipher(text: string, key: string): string {
  const reverseKey = Array(26).fill('A')
  for (let i = 0; i < 26; i++) reverseKey[key.charCodeAt(i) - 65] = String.fromCharCode(65 + i)
  return text.replace(/[a-zA-Z]/g, c => {
    const isUpper = c <= 'Z'
    const idx = c.toUpperCase().charCodeAt(0) - 65
    const mapped = reverseKey[idx] || c
    return isUpper ? mapped : mapped.toLowerCase()
  })
}

function analyzeFrequency(text: string): { char: string; count: number; percent: number }[] {
  const freq: Record<string, number> = {}
  let total = 0
  for (const c of text.toUpperCase()) {
    if (/[A-Z]/.test(c)) { freq[c] = (freq[c] || 0) + 1; total++ }
  }
  return Object.entries(freq).map(([char, count]) => ({ char, count, percent: total ? (count / total) * 100 : 0 })).sort((a, b) => b.count - a.count)
}

// Standard English letter frequency for comparison
const englishFreq: Record<string, number> = { E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1, R: 6.0, D: 4.3, L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2, G: 2.0, Y: 2.0, P: 1.9, B: 1.5, V: 1.0, K: 0.8, J: 0.2, X: 0.2, Q: 0.1, Z: 0.1 }

const sampleTexts = [
  { label: 'Classic', text: 'The quick brown fox jumps over the lazy dog' },
  { label: 'Pangram 2', text: 'Pack my box with five dozen liquor jugs' },
  { label: 'Secret Message', text: 'Meet me at the old oak tree at midnight. Bring the package.' },
  { label: 'Lorem', text: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor' },
]

const cipherInfo: Record<CipherMode, { name: string; desc: string }> = {
  rot13: { name: 'ROT13', desc: 'Shifts each letter 13 positions. Self-inverse: applying twice yields the original text.' },
  rot47: { name: 'ROT47', desc: 'Extends ROT13 to ASCII printable characters (33-126). Self-inverse.' },
  caesar: { name: 'Caesar Cipher', desc: 'Shifts letters by a customizable amount (1-25). One of the earliest known ciphers.' },
  atbash: { name: 'Atbash', desc: 'Mirrors the alphabet (A↔Z, B↔Y, etc.). Originally a Hebrew cipher. Self-inverse.' },
  vigenere: { name: 'Vigenère', desc: 'Polyalphabetic substitution using a keyword. Each letter is shifted by the corresponding key letter.' },
  substitution: { name: 'Substitution', desc: 'Monoalphabetic cipher with a custom random or specified 26-letter key.' },
}

export default function Rot13Page() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<CipherMode>('rot13')
  const [direction, setDirection] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [shift, setShift] = useState(13)
  const [vigenereKey, setVigenereKey] = useState('SECRET')
  const [subKey, setSubKey] = useState('QWERTYUIOPASDFGHJKLZXCVBNM')
  const [copied, setCopied] = useState<string | false>(false)
  const [showFreq, setShowFreq] = useState(false)
  const [history, setHistory] = useState<{ input: string; output: string; mode: string; direction: string; timestamp: string }[]>([])
  const [showBruteForce, setShowBruteForce] = useState(false)

  const output = useMemo(() => {
    if (!input) return ''
    switch (mode) {
      case 'rot13': return rot13(input)
      case 'rot47': return rot47(input)
      case 'caesar': return caesarShift(input, direction === 'decrypt' ? (26 - shift) : shift)
      case 'atbash': return atbash(input)
      case 'vigenere': return direction === 'encrypt' ? vigenereEncrypt(input, vigenereKey) : vigenereDecrypt(input, vigenereKey)
      case 'substitution': return direction === 'encrypt' ? substitutionCipher(input, subKey) : substitutionDecipher(input, subKey)
    }
  }, [input, mode, direction, shift, vigenereKey, subKey])

  const inputFreq = useMemo(() => analyzeFrequency(input), [input])
  const outputFreq = useMemo(() => analyzeFrequency(output), [output])

  // Caesar brute-force all 25 shifts
  const bruteForce = useMemo(() => {
    if (!input) return []
    return Array.from({ length: 25 }, (_, i) => ({ shift: i + 1, text: caesarShift(input, i + 1) }))
  }, [input])

  const addToHistory = () => {
    if (!input || !output) return
    setHistory(prev => [{ input: input.slice(0, 50), output: output.slice(0, 50), mode, direction, timestamp: new Date().toISOString() }, ...prev].slice(0, 15))
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(false), 1200)
  }

  const exportResult = (format: 'txt' | 'json') => {
    addToHistory()
    let content: string, ext: string
    if (format === 'json') {
      content = JSON.stringify({ cipher: mode, direction, input, output, ...(mode === 'caesar' ? { shift } : {}), ...(mode === 'vigenere' ? { key: vigenereKey } : {}), ...(mode === 'substitution' ? { key: subKey } : {}), inputFrequency: inputFreq, outputFrequency: outputFreq }, null, 2)
      ext = 'json'
    } else {
      const lines = [`Cipher: ${cipherInfo[mode].name}`, `Direction: ${direction}`, '---', `Input:\n${input}`, '---', `Output:\n${output}`]
      if (mode === 'caesar') lines.push(`Shift: ${shift}`)
      if (mode === 'vigenere') lines.push(`Key: ${vigenereKey}`)
      content = lines.join('\n'); ext = 'txt'
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `cipher-result.${ext}`; a.click(); URL.revokeObjectURL(a.href)
  }

  const isSelfInverse = mode === 'rot13' || mode === 'rot47' || mode === 'atbash'

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
                <RotateCw className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Cipher <span className="text-slate-500">Toolkit</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">ROT13, ROT47, Caesar, Atbash, Vigenère & Substitution ciphers with frequency analysis</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Cipher Selector */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Choose Cipher</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {(Object.keys(cipherInfo) as CipherMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`p-3 rounded-xl text-center transition-all ${mode === m ? 'ring-2 ring-blue-500 bg-blue-50' : 'border border-gray-200 hover:bg-gray-50'}`}>
                  <div className="text-sm font-bold text-gray-900">{cipherInfo[m].name}</div>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg p-3">{cipherInfo[mode].desc}</p>
          </div>

          {/* Controls row */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 flex flex-wrap gap-4 items-end">
            {!isSelfInverse && (
              <div className="flex gap-2">
                <button onClick={() => setDirection('encrypt')} className={`px-4 py-2 rounded-lg text-sm font-medium ${direction === 'encrypt' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Encrypt</button>
                <button onClick={() => setDirection('decrypt')} className={`px-4 py-2 rounded-lg text-sm font-medium ${direction === 'decrypt' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Decrypt</button>
              </div>
            )}
            {isSelfInverse && <span className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">Self-inverse: encrypt = decrypt</span>}
            {mode === 'caesar' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Shift:</label>
                <input type="range" min={1} max={25} value={shift} onChange={(e) => setShift(parseInt(e.target.value))} className="w-32 accent-blue-600" />
                <span className="text-sm font-mono font-bold w-6 text-center">{shift}</span>
              </div>
            )}
            {mode === 'vigenere' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Key:</label>
                <input type="text" value={vigenereKey} onChange={(e) => setVigenereKey(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())} placeholder="SECRET" className="w-40 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase" />
              </div>
            )}
            {mode === 'substitution' && (
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm text-gray-600">Key:</label>
                <input type="text" value={subKey} onChange={(e) => setSubKey(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 26))} className="w-64 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase" />
                <button onClick={() => setSubKey(generateSubstitutionKey())} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs flex items-center gap-1"><Shuffle className="w-3 h-3" />Random</button>
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              {sampleTexts.map(s => (
                <button key={s.label} onClick={() => setInput(s.text)} className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs">{s.label}</button>
              ))}
            </div>
          </div>

          {/* Input / Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Input</label>
              <textarea className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono" rows={8} placeholder="Enter text..." value={input} onChange={(e) => setInput(e.target.value)} />
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{input.length} chars</span>
                <span>{input.split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Output</label>
                <div className="flex gap-1.5">
                  <button onClick={() => copy(output, 'main')} disabled={!output} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50">
                    {copied === 'main' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}{copied === 'main' ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => exportResult('txt')} disabled={!output} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"><Download className="w-4 h-4" /></button>
                  <button onClick={() => exportResult('json')} disabled={!output} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"><FileText className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-sm text-gray-900 min-h-[192px] break-all whitespace-pre-wrap">
                {output || 'Output will appear here...'}
              </div>
              {output && (
                <button onClick={() => { setInput(output) }} className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><RefreshCw className="w-3 h-3" />Use output as input</button>
              )}
            </div>
          </div>

          {/* Frequency Analysis */}
          {input && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <button onClick={() => setShowFreq(!showFreq)} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BarChart3 className="w-4 h-4 text-blue-600" />{showFreq ? '▼' : '▶'} Frequency Analysis
              </button>
              {showFreq && (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[{ label: 'Input', data: inputFreq }, { label: 'Output', data: outputFreq }].map(side => (
                    <div key={side.label}>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{side.label} Character Frequency</h4>
                      <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {side.data.map(d => (
                          <div key={d.char} className="flex items-center gap-2 text-xs">
                            <span className="w-4 font-mono font-bold text-gray-700">{d.char}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div className="h-3 bg-blue-500 rounded-full transition-all" style={{ width: `${d.percent}%` }} />
                            </div>
                            <span className="w-8 text-right font-mono text-gray-500">{d.count}</span>
                            <span className="w-12 text-right text-gray-400">{d.percent.toFixed(1)}%</span>
                            <span className="w-12 text-right text-gray-300">({(englishFreq[d.char] || 0).toFixed(1)}%)</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Gray numbers show standard English frequency</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Brute Force (Caesar only) */}
          {mode === 'caesar' && input && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <button onClick={() => setShowBruteForce(!showBruteForce)} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Shuffle className="w-4 h-4 text-blue-600" />{showBruteForce ? '▼' : '▶'} Brute Force All 25 Shifts
              </button>
              {showBruteForce && (
                <div className="mt-3 space-y-1 max-h-[400px] overflow-y-auto">
                  {bruteForce.map(b => (
                    <div key={b.shift} className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm ${b.shift === shift ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                      <span className="w-12 text-xs font-mono font-bold text-gray-500">+{b.shift}</span>
                      <span className="flex-1 font-mono text-gray-800 truncate">{b.text}</span>
                      <button onClick={() => copy(b.text, `bf-${b.shift}`)} className="text-gray-400 hover:text-gray-600">
                        {copied === `bf-${b.shift}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
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
                    <span className="text-gray-400">{h.direction}</span>
                    <span className="font-mono text-gray-600 truncate flex-1">{h.input} → {h.output}</span>
                    <span className="text-gray-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔐', title: '6 Cipher Algorithms', desc: 'ROT13, ROT47, Caesar (custom shift), Atbash, Vigenère (polyalphabetic), and Substitution cipher with random key generation' },
              { icon: '📊', title: 'Frequency Analysis', desc: 'Side-by-side character frequency comparison between input and output, with standard English frequency reference' },
              { icon: '🔓', title: 'Brute Force Tool', desc: 'Caesar cipher brute-force displays all 25 possible shifts for cryptanalysis. Export results as TXT or JSON.' },
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
