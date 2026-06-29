'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  ArrowLeft,
  Copy,
  Check,
  Download,
  Trash2,
  BookOpen,
  Clock,
  Type,
  AlignLeft,
  Hash,
  FileText,
  Mic,
  Zap,
} from 'lucide-react'

interface KeywordEntry {
  word: string
  count: number
  percentage: number
}

interface ReadabilityScores {
  fleschKincaid: number
  gradeLevel: number
  label: string
  color: string
}

function analyze(text: string) {
  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const sentences = text.trim() ? (text.match(/[.!?]+\s/g) || []).length + (text.trim().match(/[.!?]+$/) ? 1 : 0) || (text.trim() ? 1 : 0) : 0
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0
  const lines = text ? text.split('\n').length : 0

  const wordsArr = text.trim().split(/\s+/).filter(Boolean)
  const cleanWords = wordsArr.map(w => w.replace(/[^\w'-]/g, '').toLowerCase()).filter(Boolean)
  const avgWordLength = cleanWords.length ? +(cleanWords.reduce((s, w) => s + w.length, 0) / cleanWords.length).toFixed(1) : 0
  const longestWord = cleanWords.reduce((a, b) => b.length > a.length ? b : a, '')
  const uniqueWords = new Set(cleanWords).size

  const readMin = Math.ceil(words / 238)
  const speakMin = Math.ceil(words / 150)

  // Syllable count (approximation)
  function countSyllables(word: string): number {
    const w = word.toLowerCase().replace(/[^a-z]/g, '')
    if (w.length <= 3) return 1
    let count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g)?.length || 0
    return Math.max(1, count)
  }

  const totalSyllables = cleanWords.reduce((s, w) => s + countSyllables(w), 0)

  // Flesch-Kincaid readability
  let readability: ReadabilityScores = { fleschKincaid: 0, gradeLevel: 0, label: 'N/A', color: 'text-gray-400' }
  if (sentences > 0 && words > 0) {
    const fk = 206.835 - (1.015 * (words / sentences)) - (84.6 * (totalSyllables / words))
    const grade = (0.39 * (words / sentences)) + (11.8 * (totalSyllables / words)) - 15.59
    const clamped = Math.max(0, Math.min(100, fk))

    let label: string, color: string
    if (clamped >= 80) { label = 'Very Easy'; color = 'text-green-600' }
    else if (clamped >= 60) { label = 'Easy'; color = 'text-green-500' }
    else if (clamped >= 40) { label = 'Moderate'; color = 'text-yellow-600' }
    else if (clamped >= 20) { label = 'Difficult'; color = 'text-orange-600' }
    else { label = 'Very Difficult'; color = 'text-red-600' }

    readability = { fleschKincaid: +clamped.toFixed(1), gradeLevel: +Math.max(0, grade).toFixed(1), label, color }
  }

  // Top keywords (excluding stop words)
  const stopWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has', 'had', 'did', 'am'])
  const freq: Record<string, number> = {}
  cleanWords.filter(w => w.length > 2 && !stopWords.has(w)).forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  const keywords: KeywordEntry[] = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count, percentage: words > 0 ? +(count / words * 100).toFixed(1) : 0 }))

  // Character frequency
  const charFreq: Record<string, number> = {}
  text.replace(/\s/g, '').split('').forEach(c => {
    const lower = c.toLowerCase()
    charFreq[lower] = (charFreq[lower] || 0) + 1
  })
  const topChars = Object.entries(charFreq).sort((a, b) => b[1] - a[1]).slice(0, 10)

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    readingTime: readMin < 1 ? '< 1 min' : `${readMin} min`,
    speakingTime: speakMin < 1 ? '< 1 min' : `${speakMin} min`,
    avgWordLength,
    longestWord,
    uniqueWords,
    totalSyllables,
    readability,
    keywords,
    topChars,
  }
}

const sampleTexts: { label: string; text: string }[] = [
  {
    label: 'Short paragraph',
    text: 'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once. Pangrams have been used since at least the late 19th century for testing typewriters and computers.',
  },
  {
    label: 'Technical writing',
    text: 'Machine learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.\n\nThe process of learning begins with observations or data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future based on the examples that we provide. The primary aim is to allow the computers to learn automatically without human intervention or assistance and adjust actions accordingly.',
  },
  {
    label: 'Creative writing',
    text: 'The old lighthouse stood sentinel against the storm, its beam cutting through sheets of rain like a golden sword. Below, the waves crashed with furious abandon against the ancient rocks, sending plumes of salt spray into the howling wind.\n\nMarina pressed her forehead against the cold glass of the lantern room. She had watched a thousand storms from this perch, but tonight was different. Tonight, somewhere out in that churning darkness, her brother\'s fishing boat was fighting for its life.\n\n"Come on, Thomas," she whispered, her breath fogging the glass. "Follow the light home."',
  },
]

export default function WordCounterPage() {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'stats' | 'keywords' | 'readability'>('stats')

  const stats = useMemo(() => analyze(text), [text])

  const copy = async () => {
    const summary = `Word Count Analysis\n${'='.repeat(30)}\nWords: ${stats.words}\nCharacters: ${stats.characters}\nCharacters (no spaces): ${stats.charactersNoSpaces}\nSentences: ${stats.sentences}\nParagraphs: ${stats.paragraphs}\nLines: ${stats.lines}\nUnique Words: ${stats.uniqueWords}\nAvg Word Length: ${stats.avgWordLength}\nReading Time: ${stats.readingTime}\nSpeaking Time: ${stats.speakingTime}\nReadability: ${stats.readability.label} (${stats.readability.fleschKincaid})\nGrade Level: ${stats.readability.gradeLevel}`
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const exportStats = (format: 'json' | 'csv') => {
    let content: string, mime: string, ext: string
    if (format === 'json') {
      content = JSON.stringify({
        words: stats.words,
        characters: stats.characters,
        sentences: stats.sentences,
        paragraphs: stats.paragraphs,
        uniqueWords: stats.uniqueWords,
        readability: stats.readability,
        keywords: stats.keywords,
        readingTime: stats.readingTime,
        speakingTime: stats.speakingTime,
      }, null, 2)
      mime = 'application/json'
      ext = 'json'
    } else {
      content = 'Metric,Value\n' + [
        `Words,${stats.words}`,
        `Characters,${stats.characters}`,
        `"Characters (no spaces)",${stats.charactersNoSpaces}`,
        `Sentences,${stats.sentences}`,
        `Paragraphs,${stats.paragraphs}`,
        `Lines,${stats.lines}`,
        `"Unique Words",${stats.uniqueWords}`,
        `"Avg Word Length",${stats.avgWordLength}`,
        `"Reading Time","${stats.readingTime}"`,
        `"Speaking Time","${stats.speakingTime}"`,
        `"Readability Score",${stats.readability.fleschKincaid}`,
        `"Grade Level",${stats.readability.gradeLevel}`,
      ].join('\n')
      mime = 'text/csv'
      ext = 'csv'
    }
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `word-count-analysis.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen themed-section-bg">
      {/* Hero */}
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
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Word <span className="text-slate-500">Counter</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Analyze text with word counts, readability scores, keyword density, and more</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto">
          {/* Live Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Words', value: stats.words, icon: Type, color: 'bg-blue-50 text-blue-600 border-blue-200' },
              { label: 'Characters', value: stats.characters, icon: Hash, color: 'bg-green-50 text-green-600 border-green-200' },
              { label: 'Sentences', value: stats.sentences, icon: AlignLeft, color: 'bg-purple-50 text-purple-600 border-purple-200' },
              { label: 'Paragraphs', value: stats.paragraphs, icon: FileText, color: 'bg-orange-50 text-orange-600 border-orange-200' },
              { label: 'Reading', value: stats.readingTime, icon: BookOpen, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
              { label: 'Speaking', value: stats.speakingTime, icon: Mic, color: 'bg-pink-50 text-pink-600 border-pink-200' },
            ].map(s => (
              <div key={s.label} className={`${s.color} border rounded-xl p-3 text-center`}>
                <s.icon className="w-4 h-4 mx-auto mb-1 opacity-60" />
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-[10px] font-medium opacity-70 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Text Input */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Type className="w-4 h-4 text-blue-600" />
                    Your Text
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setText('')} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />Clear
                    </button>
                  </div>
                </div>
                <textarea
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  rows={12}
                  placeholder="Type or paste your text here to get instant analysis..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                {/* Sample Texts */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 self-center">Try:</span>
                  {sampleTexts.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setText(s.text)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg overflow-hidden">
                <div className="flex border-b border-gray-200">
                  {[
                    { id: 'stats' as const, label: 'Details', icon: BarChart3 },
                    { id: 'keywords' as const, label: 'Keywords', icon: Zap },
                    { id: 'readability' as const, label: 'Readability', icon: BookOpen },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-3 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors
                        ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {/* Stats Tab */}
                  {activeTab === 'stats' && (
                    <div className="space-y-2">
                      {[
                        { label: 'Characters (no spaces)', value: stats.charactersNoSpaces },
                        { label: 'Lines', value: stats.lines },
                        { label: 'Unique Words', value: stats.uniqueWords },
                        { label: 'Avg Word Length', value: `${stats.avgWordLength} chars` },
                        { label: 'Total Syllables', value: stats.totalSyllables },
                        { label: 'Longest Word', value: stats.longestWord || '—' },
                      ].map(s => (
                        <div key={s.label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-600">{s.label}</span>
                          <span className="text-sm font-semibold text-gray-900 font-mono">{s.value}</span>
                        </div>
                      ))}

                      {/* Character frequency */}
                      {stats.topChars.length > 0 && (
                        <div className="pt-3 mt-2 border-t border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Characters</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {stats.topChars.map(([char, count]) => (
                              <span key={char} className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                                <span className="font-bold">{char}</span>
                                <span className="text-gray-400 ml-1">×{count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Keywords Tab */}
                  {activeTab === 'keywords' && (
                    <div>
                      {stats.keywords.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">Enter text to see keyword analysis</p>
                      ) : (
                        <div className="space-y-2">
                          {stats.keywords.map((k, i) => (
                            <div key={k.word} className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-sm font-medium text-gray-900">{k.word}</span>
                                  <span className="text-xs text-gray-500">{k.count}× ({k.percentage}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (k.count / stats.keywords[0].count) * 100)}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Readability Tab */}
                  {activeTab === 'readability' && (
                    <div className="space-y-4">
                      <div className="text-center py-3">
                        <div className={`text-4xl font-bold ${stats.readability.color}`}>
                          {stats.readability.fleschKincaid || '—'}
                        </div>
                        <div className={`text-sm font-medium ${stats.readability.color}`}>{stats.readability.label}</div>
                        <div className="text-xs text-gray-400 mt-1">Flesch-Kincaid Score</div>
                      </div>

                      {/* Score bar */}
                      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-30" />
                        {stats.readability.fleschKincaid > 0 && (
                          <div
                            className="absolute top-0 bottom-0 w-2 bg-gray-900 rounded-full"
                            style={{ left: `${Math.min(98, stats.readability.fleschKincaid)}%` }}
                          />
                        )}
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Very Difficult</span>
                        <span>Very Easy</span>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Grade Level</span>
                          <span className="text-sm font-semibold text-gray-900">{stats.readability.gradeLevel || '—'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Audience</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {stats.readability.gradeLevel <= 6 ? 'Everyone' :
                             stats.readability.gradeLevel <= 10 ? 'Teens / Adults' :
                             stats.readability.gradeLevel <= 14 ? 'College Level' : 'Academic'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4 space-y-2">
                <button onClick={copy} disabled={!text} className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Analysis'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => exportStats('json')} disabled={!text} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-50">
                    <Download className="w-3 h-3" />Export JSON
                  </button>
                  <button onClick={() => exportStats('csv')} disabled={!text} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-50">
                    <Download className="w-3 h-3" />Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '📊', title: 'Full Text Analytics', desc: 'Words, characters, sentences, paragraphs, unique words, syllable count, and more' },
              { icon: '📖', title: 'Readability Scoring', desc: 'Flesch-Kincaid readability index with grade level and audience recommendations' },
              { icon: '🔑', title: 'Keyword Density', desc: 'Top keyword extraction with frequency counts, density percentages, and visual bars' },
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
