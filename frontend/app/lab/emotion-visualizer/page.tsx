'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Heart, Smile, Frown, Meh, RefreshCw, Clock, Brain, BarChart3, Download, History, Lightbulb, Mic, MicOff } from 'lucide-react'
import type { EmotionAnalysis, EmotionInsights, EmotionSession } from './emotion-visualizer'
import { emotionVisualizerUtils } from './emotion-visualizer'

type Tab = 'analyze' | 'insights' | 'history' | 'sessions'

export default function EmotionVisualizerPage() {
  const [tab, setTab] = useState<Tab>('analyze')
  const [text, setText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null)
  const [stats, setStats] = useState({ activeUsers: 0, totalAnalyzed: 0 })

  // Extended state from service file
  const [insights, setInsights] = useState<EmotionInsights | null>(null)
  const [history, setHistory] = useState<EmotionAnalysis[]>([])
  const [sessions, setSessions] = useState<EmotionSession[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)

  const userId = 'current-user'

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/lab/emotion-analysis?stats=true')
        if (res.ok) { const d = await res.json(); setStats({ activeUsers: d.activeUsers || 0, totalAnalyzed: d.totalAnalyzed || 0 }) }
      } catch {}
    }
    fetchStats()
    const iv = setInterval(fetchStats, 30000)
    return () => clearInterval(iv)
  }, [])

  // Fetch history + sessions + insights on mount
  useEffect(() => {
    Promise.all([
      fetch(`/api/lab/emotion-visualizer/history/${userId}`).then(r => r.ok ? r.json() : { history: [] }),
      fetch(`/api/lab/emotion-visualizer/sessions/${userId}`).then(r => r.ok ? r.json() : { sessions: [] }),
      fetch(`/api/lab/emotion-visualizer/insights/${userId}`).then(r => r.ok ? r.json() : { insights: null }),
    ]).then(([hData, sData, iData]) => {
      setHistory(hData.history || [])
      setSessions(sData.sessions || [])
      if (iData.insights) setInsights(iData.insights)
    }).catch(console.error)
  }, [])

  /* ── Text analysis ── */
  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/lab/emotion-visualizer/analyze-text', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId })
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setAnalysis(data.analysis)
      setHistory(prev => [data.analysis, ...prev].slice(0, 50))
    } catch { alert('Emotion analysis failed. Please try again.') }
    finally { setIsAnalyzing(false) }
  }, [text])

  /* ── Voice analysis (simulated) ── */
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      setIsRecording(false)
      // Simulate sending audio
      try {
        const formData = new FormData()
        formData.append('userId', userId)
        const res = await fetch('/api/lab/emotion-visualizer/analyze-voice', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          setAnalysis(data.analysis)
        }
      } catch {}
    } else {
      setIsRecording(true)
    }
  }

  /* ── Generate insights ── */
  const generateInsights = async () => {
    setIsLoadingInsights(true)
    try {
      const res = await fetch(`/api/lab/emotion-visualizer/insights/${userId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      if (res.ok) { const d = await res.json(); setInsights(d.insights) }
    } catch {}
    finally { setIsLoadingInsights(false) }
  }

  /* ── Export ── */
  const handleExport = async (format: 'json' | 'csv' | 'txt') => {
    try {
      const res = await fetch('/api/lab/emotion-visualizer/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, format, includeHistory: true, includeInsights: true })
      })
      if (res.ok) {
        const d = await res.json()
        const blob = new Blob([typeof d.data === 'string' ? d.data : JSON.stringify(d.data, null, 2)], { type: 'text/plain' })
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `emotions-export.${format}`; a.click()
      }
    } catch {}
  }

  /* ── Helpers ── */
  const getSentimentIcon = () => {
    if (!analysis) return <Meh className="w-10 h-10" />
    const score = analysis.sentiment?.score ?? 0
    if (score > 0.3) return <Smile className="w-10 h-10 text-green-500" />
    if (score < -0.3) return <Frown className="w-10 h-10 text-red-500" />
    return <Meh className="w-10 h-10 text-yellow-500" />
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'analyze', label: 'Analyze', icon: <Heart className="w-4 h-4" /> },
    { id: 'insights', label: 'Insights', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'sessions', label: 'Sessions', icon: <Clock className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-brand-600 to-accent-600 overflow-hidden">
        <div className="container mx-auto px-4 py-12 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link href="/lab" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4"><span>←</span> Back to AI Lab</Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg"><Heart className="w-10 h-10 text-white" /></div>
              <div>
                <h1 className="text-4xl font-bold text-white">Emotion Visualizer</h1>
                <p className="text-blue-100 mt-1">AI-powered emotion analysis &amp; visualization</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />{stats.activeUsers} active</span>
              <span>&middot;</span>
              <span>{stats.totalAnalyzed.toLocaleString()} analyzed</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
          {/* Export button */}
          <div className="ml-auto flex items-center gap-1">
            {(['json', 'csv', 'txt'] as const).map(f => (
              <button key={f} onClick={() => handleExport(f)} className="px-2 py-1 text-xs text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded transition-colors"><Download className="w-3 h-3 inline mr-1" />{f.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* ═══ ANALYZE TAB ═══ */}
        {tab === 'analyze' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <label className="font-bold mb-3 flex items-center gap-2 text-gray-900"><Heart className="w-5 h-5 text-pink-500" />Text Analysis</label>
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste text, a social media post, email, or your thoughts..." className="w-full h-48 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-pink-500 resize-none" />
                <button onClick={handleAnalyze} disabled={!text.trim() || isAnalyzing}
                  className="w-full mt-3 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-pink-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isAnalyzing ? <><RefreshCw className="w-4 h-4 animate-spin" />Analyzing...</> : <><Heart className="w-4 h-4" />Analyze Emotions</>}
                </button>
              </div>

              {/* Voice recording */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <label className="font-bold mb-3 flex items-center gap-2 text-gray-900"><Mic className="w-5 h-5 text-blue-500" />Voice Analysis</label>
                <p className="text-sm text-gray-500 mb-3">Record your voice to analyze emotional tone</p>
                <button onClick={toggleVoiceRecording}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                  {isRecording ? <><MicOff className="w-4 h-4" />Stop Recording</> : <><Mic className="w-4 h-4" />Start Recording</>}
                </button>
              </div>
            </div>

            {/* Results panel */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Emotion Analysis</h2>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <RefreshCw className="w-12 h-12 text-pink-500 animate-spin mb-3" />
                  <p className="font-semibold text-gray-900">Detecting emotions...</p>
                  <p className="text-sm text-gray-500 mt-1">Processing sentiment patterns</p>
                </div>
              ) : analysis ? (
                <AnimatePresence mode="wait">
                  <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Sentiment overview */}
                    <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-xl text-center">
                      {getSentimentIcon()}
                      <div className="text-xl font-bold mt-2 text-gray-900 capitalize">{analysis.sentiment?.label || 'Analyzed'}</div>
                      <div className="text-sm text-gray-600">
                        Confidence: {emotionVisualizerUtils.formatConfidence(analysis.sentiment?.confidence ?? analysis.sentiment?.score ?? 0)}
                      </div>
                    </div>

                    {/* Emotion bars */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-gray-900">Emotion Breakdown</h3>
                      <div className="space-y-2.5">
                        {(analysis.emotions || []).map((em, i) => (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-700">{em.label || em.emotion}</span>
                              <span className="text-xs text-gray-500">{Math.round((em.confidence ?? em.score ?? 0) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${(em.confidence ?? em.score ?? 0) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                                className="h-full rounded-full" style={{ backgroundColor: emotionVisualizerUtils.getEmotionColor(em.label || em.emotion || '') }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Visualization color map */}
                    {analysis.visualization?.colorMap && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-gray-900">Emotion Color Map</h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(analysis.visualization.colorMap).map(([emotion, color]) => (
                            <div key={emotion} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color as string }} />
                              <span className="text-gray-700 capitalize">{emotion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Emotion wheel segments */}
                    {analysis.visualization?.emotionWheel?.segments && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-gray-900">Emotion Wheel</h3>
                        <div className="grid grid-cols-4 gap-2">
                          {analysis.visualization.emotionWheel.segments.map((seg: { emotion: string; intensity: number; color: string }, i: number) => (
                            <div key={i} className="text-center p-2 rounded-lg border border-gray-100" style={{ backgroundColor: seg.color + '15' }}>
                              <div className="text-lg font-bold" style={{ color: seg.color }}>{Math.round(seg.intensity * 100)}</div>
                              <div className="text-[10px] text-gray-500 capitalize">{seg.emotion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Heart className="w-12 h-12 mb-3 opacity-40" />
                  <p>Emotion visualization will appear here</p>
                  <p className="text-sm mt-1">Enter text and click Analyze</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ INSIGHTS TAB ═══ */}
        {tab === 'insights' && (
          <div className="space-y-6">
            {!insights ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
                <Brain className="w-12 h-12 mx-auto text-purple-400 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Generate Emotional Insights</h3>
                <p className="text-gray-500 text-sm mb-4">Analyze your emotion history to discover patterns, triggers, and get personalized recommendations.</p>
                <button onClick={generateInsights} disabled={isLoadingInsights}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2 mx-auto">
                  {isLoadingInsights ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating...</> : <><Lightbulb className="w-4 h-4" />Generate Insights</>}
                </button>
              </div>
            ) : (
              <>
                {/* Wellness + EI scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm text-center">
                    <div className="text-4xl font-bold text-green-600">{insights.wellnessScore ?? '—'}</div>
                    <div className="text-sm text-gray-500 mt-1">Wellness Score</div>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: `${insights.wellnessScore || 0}%` }} />
                    </div>
                  </div>
                  {insights.emotionalIntelligence && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                      <div className="text-center mb-3">
                        <div className="text-4xl font-bold text-purple-600">{insights.emotionalIntelligence.overall ?? '—'}</div>
                        <div className="text-sm text-gray-500">EI Score</div>
                      </div>
                      <div className="space-y-1.5">
                        {Object.entries(insights.emotionalIntelligence).filter(([k]) => k !== 'overall').map(([key, val]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-medium text-gray-900">{val as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Patterns */}
                {insights.patterns && insights.patterns.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-500" />Patterns</h3>
                    <div className="space-y-3">
                      {insights.patterns.map((p, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="font-medium text-gray-900 text-sm">{p.description}</div>
                          <div className="text-xs text-gray-500 mt-1">Frequency: {p.frequency} &middot; Strength: {emotionVisualizerUtils.formatIntensity(p.strength)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {insights.recommendations && insights.recommendations.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-500" />Recommendations</h3>
                    <div className="space-y-3">
                      {insights.recommendations.map((r, i) => (
                        <div key={i} className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                          <div className="font-medium text-gray-900 text-sm">{r.title}</div>
                          <div className="text-xs text-gray-600 mt-1">{r.description}</div>
                          <div className="text-[10px] text-gray-400 mt-1 capitalize">Priority: {r.priority} &middot; Category: {r.category}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Triggers */}
                {insights.triggers && insights.triggers.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3">Emotional Triggers</h3>
                    <div className="flex flex-wrap gap-2">
                      {insights.triggers.map((t, i) => (
                        <div key={i} className="px-3 py-1.5 rounded-full text-xs border" style={{ borderColor: emotionVisualizerUtils.getEmotionColor(t.emotion) + '40', backgroundColor: emotionVisualizerUtils.getEmotionColor(t.emotion) + '10', color: emotionVisualizerUtils.getEmotionColor(t.emotion) }}>
                          {t.trigger} → {t.emotion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={generateInsights} disabled={isLoadingInsights} className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                  <RefreshCw className={`w-3 h-3 ${isLoadingInsights ? 'animate-spin' : ''}`} />Refresh Insights
                </button>
              </>
            )}
          </div>
        )}

        {/* ═══ HISTORY TAB ═══ */}
        {tab === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No analysis history yet</p>
                <button onClick={() => setTab('analyze')} className="mt-4 px-4 py-2 text-sm font-medium text-pink-600 bg-pink-50 rounded-lg hover:bg-pink-100">Analyze Your First Text</button>
              </div>
            ) : history.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 line-clamp-2">{item.text || 'Analysis'}</p>
                    <div className="text-xs text-gray-400 mt-1">{item.analyzedAt ? new Date(item.analyzedAt).toLocaleString() : ''}</div>
                  </div>
                  <span className="ml-3 text-sm font-medium capitalize px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: emotionVisualizerUtils.getEmotionColor(item.sentiment?.label || 'neutral') + '15', color: emotionVisualizerUtils.getEmotionColor(item.sentiment?.label || 'neutral') }}>
                    {item.sentiment?.label || 'neutral'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(item.emotions || []).slice(0, 4).map((em, j) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded-full border border-gray-100 text-gray-600">
                      {em.label || em.emotion}: {Math.round((em.confidence ?? em.score ?? 0) * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ SESSIONS TAB ═══ */}
        {tab === 'sessions' && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No emotion sessions recorded yet</p>
                <p className="text-sm mt-1">Sessions are created automatically as you analyze emotions</p>
              </div>
            ) : sessions.map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{s.name || `Session ${i + 1}`}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status || 'completed'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{s.analysisCount || 0} analyses</span>
                  <span>&middot;</span>
                  <span>Duration: {s.duration ? `${Math.round(s.duration / 60)}m` : '—'}</span>
                  <span>&middot;</span>
                  <span>{s.startTime ? new Date(s.startTime).toLocaleDateString() : ''}</span>
                </div>
                {s.summary && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2 border border-gray-100">
                    Avg Sentiment: {((s.summary as Record<string, number>).averageSentiment ?? 0).toFixed(2)} &middot; Dominant: {(s.summary as Record<string, string>).dominantEmotion || '—'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
