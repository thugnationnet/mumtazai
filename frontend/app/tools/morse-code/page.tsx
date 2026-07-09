'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Radio, Copy, Check, ArrowLeft, Volume2, VolumeX, Download, Trash2, ArrowRightLeft, Settings, Zap } from 'lucide-react'

const MORSE_MAP: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.',
  '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.',
  '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.', ' ': '/',
}

const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
)

const PROSIGNS: Record<string, { code: string; meaning: string }> = {
  'SOS': { code: '...---...', meaning: 'International distress signal' },
  'AR': { code: '.-.-.', meaning: 'End of message' },
  'SK': { code: '...-.-', meaning: 'End of contact' },
  'BT': { code: '-...-', meaning: 'Break / new paragraph' },
  'KN': { code: '-.--.', meaning: 'Invitation to specific station' },
  'AS': { code: '.-...', meaning: 'Wait / standby' },
  'CL': { code: '-.-..-..', meaning: 'Closing station' },
}

function textToMorse(text: string): string {
  return text.toUpperCase().split('').map(c => MORSE_MAP[c] || c).join(' ')
}

function morseToText(morse: string): string {
  return morse.split(' ').map(code => {
    if (code === '/') return ' '
    return REVERSE_MORSE[code] || code
  }).join('')
}

const sampleTexts = [
  { label: 'SOS', text: 'SOS' },
  { label: 'Hello World', text: 'Hello World' },
  { label: 'CQ CQ CQ', text: 'CQ CQ CQ' },
  { label: 'The quick brown fox', text: 'The quick brown fox jumps over the lazy dog' },
  { label: 'Coordinates', text: '40.7128 N 74.0060 W' },
]

export default function MorseCodePage() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [copied, setCopied] = useState<string | false>(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(15) // Words per minute
  const [frequency, setFrequency] = useState(600) // Hz
  const [volume, setVolume] = useState(0.3)
  const [showSettings, setShowSettings] = useState(false)
  const [showReference, setShowReference] = useState(true)
  const [history, setHistory] = useState<{ input: string; output: string; mode: string; timestamp: string }[]>([])
  const [activeElement, setActiveElement] = useState<string | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const playingRef = useRef(false)

  const output = useMemo(() => {
    if (!input) return ''
    return mode === 'encode' ? textToMorse(input) : morseToText(input)
  }, [input, mode])

  // Statistics
  const stats = useMemo(() => {
    const morseStr = mode === 'encode' ? output : textToMorse(input)
    const dots = (morseStr.match(/\./g) || []).length
    const dashes = (morseStr.match(/-/g) || []).length
    const words = (mode === 'encode' ? input : output).split(/\s+/).filter(Boolean).length
    const dotDuration = 1.2 / wpm // PARIS standard
    const totalDuration = (dots * dotDuration + dashes * dotDuration * 3 + (dots + dashes - 1) * dotDuration) // approximate
    return { dots, dashes, words, totalDuration: Math.max(0, totalDuration), chars: (mode === 'encode' ? input : output).length }
  }, [input, output, mode, wpm])

  const playMorse = useCallback(async () => {
    const morseStr = mode === 'encode' ? output : textToMorse(input)
    if (!morseStr || isPlaying) return

    setIsPlaying(true)
    playingRef.current = true
    const ctx = new AudioContext()
    audioCtxRef.current = ctx

    const DOT = 1.2 / wpm
    const DASH = DOT * 3
    const GAP = DOT
    const LETTER_GAP = DOT * 3
    const WORD_GAP = DOT * 7

    let time = ctx.currentTime + 0.05

    const chars = morseStr.split('')
    for (let i = 0; i < chars.length; i++) {
      if (!playingRef.current) break
      const c = chars[i]
      if (c === '.' || c === '-') {
        const dur = c === '.' ? DOT : DASH
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = frequency
        gain.gain.value = volume
        // Smooth ramp to avoid clicks
        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(volume, time + 0.005)
        gain.gain.setValueAtTime(volume, time + dur - 0.005)
        gain.gain.linearRampToValueAtTime(0, time + dur)
        osc.start(time)
        osc.stop(time + dur)
        time += dur + GAP
      } else if (c === ' ') {
        time += LETTER_GAP
      } else if (c === '/') {
        time += WORD_GAP
      }
    }

    // Wait for playback to finish
    const totalTime = (time - ctx.currentTime) * 1000
    await new Promise(resolve => setTimeout(resolve, Math.max(0, totalTime)))
    setIsPlaying(false)
    playingRef.current = false
  }, [input, output, mode, wpm, frequency, volume, isPlaying])

  const stopMorse = () => {
    playingRef.current = false
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    setIsPlaying(false)
  }

  const swap = () => {
    const newInput = output
    setMode(mode === 'encode' ? 'decode' : 'encode')
    setInput(newInput)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(false), 1200)
  }

  const addToHistory = () => {
    if (!input || !output) return
    setHistory(prev => [{ input: input.slice(0, 60), output: output.slice(0, 60), mode, timestamp: new Date().toISOString() }, ...prev].slice(0, 15))
  }

  const exportResult = (format: 'txt' | 'wav') => {
    addToHistory()
    if (format === 'txt') {
      const content = `Morse Code ${mode === 'encode' ? 'Encoding' : 'Decoding'}\n\nInput:\n${input}\n\nOutput:\n${output}\n\nStats: ${stats.dots} dots, ${stats.dashes} dashes, ${stats.words} words`
      const blob = new Blob([content], { type: 'text/plain' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = 'morse-code.txt'; a.click(); URL.revokeObjectURL(a.href)
    }
  }

  // Highlighted reference - show which letter maps where
  const referenceChars = Object.entries(MORSE_MAP).filter(([k]) => k !== ' ')

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
                <Radio className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Morse Code <span className="text-blue-100">Translator</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Encode, decode & play Morse code with adjustable speed and frequency</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-2">
                <button onClick={() => setMode('encode')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'encode' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Text → Morse
                </button>
                <button onClick={swap} className="p-2 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-100"><ArrowRightLeft className="w-4 h-4" /></button>
                <button onClick={() => setMode('decode')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'decode' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Morse → Text
                </button>
              </div>
              <div className="flex gap-2 ml-auto flex-wrap">
                {sampleTexts.map(s => (
                  <button key={s.label} onClick={() => setInput(s.text)} className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs">{s.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Input / Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{mode === 'encode' ? 'Text' : 'Morse Code'}</label>
              <textarea
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                rows={6}
                placeholder={mode === 'encode' ? 'Type text here...' : 'Enter morse code (. and -, space between letters, / between words)...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">{mode === 'encode' ? 'Morse Code' : 'Text'}</label>
                <div className="flex gap-1.5">
                  <button onClick={() => copy(output, 'main')} disabled={!output} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50">
                    {copied === 'main' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}{copied === 'main' ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => exportResult('txt')} disabled={!output} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"><Download className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-lg text-gray-900 min-h-[148px] break-all whitespace-pre-wrap">
                {output || <span className="text-gray-400">Output will appear here...</span>}
              </div>
            </div>
          </div>

          {/* Audio Controls + Stats */}
          {output && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Play Controls */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={isPlaying ? stopMorse : playMorse}
                    className={`px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2 transition-colors ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {isPlaying ? <><VolumeX className="w-5 h-5" />Stop</> : <><Volume2 className="w-5 h-5" />Play Morse Audio</>}
                  </button>
                  <button onClick={() => setShowSettings(!showSettings)} className={`p-3 rounded-xl transition-colors ${showSettings ? 'bg-brand-50 text-brand-600 border border-brand-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <Settings className="w-5 h-5" />
                  </button>
                </div>

                {showSettings && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">Speed</label>
                        <span className="text-xs font-mono text-gray-500">{wpm} WPM</span>
                      </div>
                      <input type="range" min={5} max={40} value={wpm} onChange={(e) => setWpm(parseInt(e.target.value))} className="w-full accent-brand-600" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">Frequency</label>
                        <span className="text-xs font-mono text-gray-500">{frequency} Hz</span>
                      </div>
                      <input type="range" min={300} max={1200} step={50} value={frequency} onChange={(e) => setFrequency(parseInt(e.target.value))} className="w-full accent-brand-600" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">Volume</label>
                        <span className="text-xs font-mono text-gray-500">{Math.round(volume * 100)}%</span>
                      </div>
                      <input type="range" min={5} max={100} value={Math.round(volume * 100)} onChange={(e) => setVolume(parseInt(e.target.value) / 100)} className="w-full accent-brand-600" />
                    </div>
                  </div>
                )}

                {/* Visual representation */}
                <div className="mt-4 p-3 bg-gray-900 rounded-xl overflow-x-auto">
                  <div className="flex items-center gap-0.5 min-h-[32px]">
                    {(mode === 'encode' ? output : textToMorse(input)).split('').map((c, i) => {
                      if (c === '.') return <div key={i} className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                      if (c === '-') return <div key={i} className="w-6 h-2 bg-green-400 rounded-full flex-shrink-0" />
                      if (c === '/') return <div key={i} className="w-6 flex-shrink-0" />
                      if (c === ' ') return <div key={i} className="w-3 flex-shrink-0" />
                      return null
                    })}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Statistics</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Characters', value: stats.chars },
                    { label: 'Words', value: stats.words },
                    { label: 'Dots (dit)', value: stats.dots },
                    { label: 'Dashes (dah)', value: stats.dashes },
                    { label: 'Est. Duration', value: `${stats.totalDuration.toFixed(1)}s` },
                    { label: 'Speed', value: `${wpm} WPM` },
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{s.label}</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Prosigns */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Zap className="w-4 h-4" />Prosigns (Procedural Signals)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.entries(PROSIGNS).map(([name, { code, meaning }]) => (
                <div key={name} className="bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-brand-300 transition-colors">
                  <div className="font-bold text-gray-900 text-sm">{name}</div>
                  <div className="font-mono text-xs text-brand-600">{code}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{meaning}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reference Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <button onClick={() => setShowReference(!showReference)} className="text-sm font-semibold text-gray-700 flex items-center gap-2 w-full">
              {showReference ? '▼' : '▶'} Morse Code Reference Chart
            </button>
            {showReference && (
              <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-13 gap-2">
                {referenceChars.slice(0, 36).map(([char, code]) => (
                  <button
                    key={char}
                    onClick={() => { if (mode === 'encode') setInput(prev => prev + char) }}
                    onMouseEnter={() => setActiveElement(char)}
                    onMouseLeave={() => setActiveElement(null)}
                    className={`rounded-lg p-2 text-center border transition-all cursor-pointer ${activeElement === char ? 'bg-brand-50 border-brand-300 scale-105' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                  >
                    <div className="text-sm font-bold text-gray-900">{char}</div>
                    <div className="text-xs text-gray-500 font-mono">{code}</div>
                    <div className="flex items-center justify-center gap-[2px] mt-1 h-2">
                      {code.split('').map((c, i) => c === '.' ? <div key={i} className="w-1 h-1 bg-brand-500 rounded-full" /> : <div key={i} className="w-3 h-1 bg-brand-500 rounded-full" />)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">History</h4>
                <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0 text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${h.mode === 'encode' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{h.mode}</span>
                    <span className="font-mono text-gray-600 truncate flex-1">{h.input}</span>
                    <span className="text-gray-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔊', title: 'Audio Playback', desc: 'Play Morse code with adjustable speed (5-40 WPM), frequency (300-1200 Hz), and volume. Smooth click-free audio.' },
              { icon: '📊', title: 'Visual & Stats', desc: 'Dot/dash visual waveform display, character statistics, duration estimation, and interactive reference chart.' },
              { icon: '📡', title: 'Prosigns & Export', desc: '7 standard prosigns reference, export as TXT, bidirectional swap, clickable reference chart for input.' },
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
