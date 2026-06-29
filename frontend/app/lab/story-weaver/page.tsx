'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { BookOpen, Pen, Sparkles, Save, Share2, RefreshCw, Download, Check, Copy, Plus, Users, Clock, Layers, User, FileText, Wand2 } from 'lucide-react'
import type { Story, Character, StoryTemplate, Genre, Collaboration } from './story-weaver'
import { storyWeaverUtils } from './story-weaver'

type Tab = 'write' | 'stories' | 'characters' | 'templates' | 'genres' | 'collaborate'

export default function StoryWeaverPage() {
  const [tab, setTab] = useState<Tab>('write')
  const [story, setStory] = useState('')
  const [genre, setGenre] = useState('fantasy')
  const [isGenerating, setIsGenerating] = useState(false)
  const [stats, setStats] = useState({ activeUsers: 0, totalCreated: 0 })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')

  // Service-file extended state
  const [userStories, setUserStories] = useState<Story[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [templates, setTemplates] = useState<StoryTemplate[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [generationType, setGenerationType] = useState<'chapter' | 'character' | 'setting' | 'plot' | 'dialogue'>('chapter')

  // Character creation
  const [newCharName, setNewCharName] = useState('')
  const [newCharRole, setNewCharRole] = useState<'protagonist' | 'antagonist' | 'supporting' | 'minor'>('supporting')

  const userId = 'current-user'

  const storyMetrics = useMemo(() => {
    const words = story.split(/\s+/).filter(w => w.length > 0).length
    const chapters = Math.max(0, Math.floor(words / 500) + (words > 100 ? 1 : 0))
    const namePattern = /\b[A-Z][a-z]{2,}\b/g
    const potentialNames = story.match(namePattern) || []
    const commonWords = ['The','This','That','There','They','Then','When','What','Where','Which','While','After','Before','Maybe','Perhaps','Something','Someone','Suddenly','Finally','However']
    const charCount = new Set(potentialNames.filter(n => !commonWords.includes(n))).size
    return { words, chapters, characters: charCount, readTime: storyWeaverUtils.estimateReadingTime(words) }
  }, [story])

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/lab/story-generation?stats=true')
        if (res.ok) { const d = await res.json(); setStats({ activeUsers: d.activeUsers || 0, totalCreated: d.totalCreated || 0 }) }
      } catch {}
    }
    fetchStats()
    const iv = setInterval(fetchStats, 30000)
    return () => clearInterval(iv)
  }, [])

  // Fetch all service data
  useEffect(() => {
    Promise.all([
      fetch(`/api/lab/story-weaver/stories/${userId}`).then(r => r.ok ? r.json() : { stories: [] }),
      fetch(`/api/lab/story-weaver/characters/${userId}`).then(r => r.ok ? r.json() : { characters: [] }),
      fetch('/api/lab/story-weaver/templates').then(r => r.ok ? r.json() : { templates: [] }),
      fetch('/api/lab/story-weaver/genres').then(r => r.ok ? r.json() : { genres: [] }),
      fetch(`/api/lab/story-weaver/collaborations/${userId}`).then(r => r.ok ? r.json() : { collaborations: [] }),
    ]).then(([sData, cData, tData, gData, colData]) => {
      setUserStories(sData.stories || [])
      setCharacters(cData.characters || [])
      setTemplates(tData.templates || [])
      setGenres(gData.genres || [])
      setCollaborations(colData.collaborations || [])
    }).catch(console.error)
  }, [])

  /* ── AI Continue story ── */
  const handleContinue = async () => {
    if (!story.trim()) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/lab/story-generation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story, genre, action: 'continue' }) })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setStory(story + '\n\n' + data.generated)
    } catch { alert('Story generation failed.') }
    finally { setIsGenerating(false) }
  }

  /* ── AI Generate content ── */
  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/lab/story-weaver/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: generationType, prompt: story.slice(-500) || 'Write a creative opening', context: { genre, tone: 'engaging', style: 'descriptive', length: 'medium' } }) })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      if (data.result?.content) setStory(prev => prev + '\n\n' + data.result.content)
    } catch { alert('Generation failed.') }
    finally { setIsGenerating(false) }
  }

  /* ── Save to server ── */
  const handleSaveServer = async () => {
    if (!story.trim()) return
    setSaveStatus('saving')
    try {
      await fetch('/api/lab/story-weaver/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `Untitled ${genre} story`, description: story.slice(0, 200), genre, content: story, userId }) })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch { setSaveStatus('idle'); alert('Save failed') }
  }

  /* ── Export to file ── */
  const handleDownload = () => {
    if (!story.trim()) return
    const blob = new Blob([story], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `story-${genre}-${new Date().toISOString().split('T')[0]}.txt`; a.click()
  }

  /* ── Share ── */
  const handleShare = async () => {
    if (!story.trim()) return
    try {
      if (navigator.share) { await navigator.share({ title: `My ${genre} Story`, text: story.slice(0, 200), url: window.location.href }) }
      else { await navigator.clipboard.writeText(story); setShareStatus('copied'); setTimeout(() => setShareStatus('idle'), 2000) }
    } catch { try { await navigator.clipboard.writeText(story); setShareStatus('copied'); setTimeout(() => setShareStatus('idle'), 2000) } catch {} }
  }

  /* ── Create character ── */
  const handleCreateCharacter = async () => {
    if (!newCharName.trim()) return
    try {
      const res = await fetch('/api/lab/story-weaver/characters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCharName, role: newCharRole, personality: [], description: '', genre, userId }) })
      if (res.ok) { const d = await res.json(); setCharacters(prev => [...prev, d.character]); setNewCharName('') }
    } catch {}
  }

  const genreOptions = [
    { id: 'fantasy', name: 'Fantasy', icon: '🧙‍♂️' },
    { id: 'sci-fi', name: 'Sci-Fi', icon: '🚀' },
    { id: 'mystery', name: 'Mystery', icon: '🔍' },
    { id: 'romance', name: 'Romance', icon: '💕' },
    { id: 'horror', name: 'Horror', icon: '👻' },
    { id: 'adventure', name: 'Adventure', icon: '⚔️' },
  ]

  const starters = [
    'A mysterious stranger arrives in town',
    'You discover a hidden door in your house',
    'The last human on Earth receives a phone call',
    'A detective finds an impossible clue',
    'Two enemies must work together to survive',
    'Someone wakes up with a superpower',
  ]

  const tabList: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'write', label: 'Write', icon: <Pen className="w-4 h-4" /> },
    { id: 'stories', label: 'My Stories', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'characters', label: 'Characters', icon: <User className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <Layers className="w-4 h-4" /> },
    { id: 'genres', label: 'Genres', icon: <FileText className="w-4 h-4" /> },
    { id: 'collaborate', label: 'Collaborate', icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass Pillars */}
        <div className="absolute top-0 left-[8%] w-24 h-full bg-gradient-to-b from-white/30 via-purple-200/20 to-transparent rounded-full blur-sm transform -skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[25%] w-16 h-full bg-gradient-to-b from-white/25 via-indigo-200/15 to-transparent rounded-full blur-sm transform skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[20%] w-20 h-full bg-gradient-to-b from-white/30 via-purple-100/20 to-transparent rounded-full blur-sm transform -skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[8%] w-14 h-full bg-gradient-to-b from-white/20 via-indigo-100/15 to-transparent rounded-full blur-sm transform skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[50%] w-12 h-full bg-gradient-to-b from-white/15 via-purple-200/10 to-transparent rounded-full blur-sm pointer-events-none" />
        {/* Chrome Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

        <div className="container mx-auto px-4 py-12 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link href="/lab" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-700 mb-4"><span>←</span> Back to AI Lab</Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/40 border border-white/60 rounded-2xl shadow-lg"><BookOpen className="w-10 h-10 text-purple-600" /></div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">AI Story Weaver</h1>
                <p className="text-slate-600 mt-1">Collaborate with AI to write compelling stories</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />{stats.activeUsers} active</span>
              <span>&middot;</span>
              <span>{stats.totalCreated.toLocaleString()} stories created</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tab bar */}
      <div className="border-b border-white/30 bg-white/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabList.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* ═══ WRITE TAB ═══ */}
        {tab === 'write' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                <h3 className="font-semibold mb-3 text-gray-900">Genre</h3>
                <div className="space-y-1.5">
                  {genreOptions.map(g => (
                    <button key={g.id} onClick={() => setGenre(g.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${genre === g.id ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                      <span>{g.icon}</span>{g.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                <h3 className="font-semibold mb-3 text-gray-900">Story Starters</h3>
                <div className="space-y-1.5">
                  {starters.map((s, i) => (
                    <button key={i} onClick={() => setStory(s + '...\n\n')}
                      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-gray-700 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Generation type */}
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2"><Wand2 className="w-4 h-4 text-purple-500" />AI Generate</h3>
                <div className="space-y-1.5 mb-3">
                  {(['chapter', 'character', 'setting', 'plot', 'dialogue'] as const).map(t => (
                    <button key={t} onClick={() => setGenerationType(t)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs capitalize transition-colors ${generationType === t ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerate} disabled={isGenerating}
                  className="w-full py-2 bg-white/40 border border-white/60 rounded-lg text-sm font-medium text-slate-700 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg">
                  {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate {generationType}
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-bold flex items-center gap-2 text-gray-900"><Pen className="w-5 h-5 text-emerald-500" />Your Story</label>
                  <span className="text-sm text-gray-500">{storyWeaverUtils.formatWordCount(storyMetrics.words)} words</span>
                </div>
                <textarea value={story} onChange={e => setStory(e.target.value)} placeholder="Start typing your story or choose a story starter..." className="w-full h-80 bg-white/60 border border-white/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 resize-none font-serif text-lg leading-relaxed" />
                <div className="flex gap-3 mt-4">
                  <button onClick={handleContinue} disabled={!story.trim() || isGenerating}
                    className="flex-1 py-3 bg-white/40 border border-white/60 rounded-xl font-semibold text-slate-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                    {isGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" />AI Writing...</> : <><Sparkles className="w-4 h-4" />Continue with AI</>}
                  </button>
                  <button onClick={handleSaveServer} disabled={!story.trim() || saveStatus === 'saving'}
                    className="px-5 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center gap-2 disabled:opacity-50 text-gray-700">
                    {saveStatus === 'saved' ? <><Check className="w-4 h-4 text-green-500" /><span className="text-green-600">Saved!</span></> : <><Save className="w-4 h-4" />Save</>}
                  </button>
                  <button onClick={handleDownload} disabled={!story.trim()} className="px-5 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center gap-2 disabled:opacity-50 text-gray-700"><Download className="w-4 h-4" /></button>
                  <button onClick={handleShare} disabled={!story.trim()} className="px-5 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center gap-2 disabled:opacity-50 text-gray-700">
                    {shareStatus === 'copied' ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Words', value: storyWeaverUtils.formatWordCount(storyMetrics.words), color: 'text-emerald-500' },
                  { label: 'Chapters', value: storyMetrics.chapters, color: 'text-blue-500' },
                  { label: 'Characters', value: storyMetrics.characters, color: 'text-cyan-500' },
                  { label: 'Read Time', value: storyMetrics.readTime, color: 'text-purple-500' },
                ].map((m, i) => (
                  <div key={i} className="bg-white/40 backdrop-blur-lg rounded-2xl p-3 border border-white/60 shadow-lg text-center">
                    <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                    <div className="text-xs text-gray-500">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ MY STORIES TAB ═══ */}
        {tab === 'stories' && (
          <div className="space-y-3">
            {userStories.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No stories saved yet</p>
                <button onClick={() => setTab('write')} className="mt-4 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100">Start Writing</button>
              </div>
            ) : userStories.map((s) => (
              <div key={s.id} className="bg-white/40 backdrop-blur-lg rounded-2xl p-4 border border-white/60 shadow-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{s.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{s.description}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: storyWeaverUtils.getStatusColor(s.status) + '15', color: storyWeaverUtils.getStatusColor(s.status) }}>{s.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{s.genre}</span>
                  <span>&middot;</span>
                  <span>{storyWeaverUtils.formatWordCount(s.wordCount)} words</span>
                  <span>&middot;</span>
                  <span>{s.chapters?.length || 0} chapters</span>
                  <span>&middot;</span>
                  <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ CHARACTERS TAB ═══ */}
        {tab === 'characters' && (
          <div className="space-y-6">
            {/* Create character */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-500" />Create Character</h3>
              <div className="flex gap-3">
                <input value={newCharName} onChange={e => setNewCharName(e.target.value)} placeholder="Character name..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500" />
                <select value={newCharRole} onChange={e => setNewCharRole(e.target.value as typeof newCharRole)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">
                  <option value="protagonist">Protagonist</option>
                  <option value="antagonist">Antagonist</option>
                  <option value="supporting">Supporting</option>
                  <option value="minor">Minor</option>
                </select>
                <button onClick={handleCreateCharacter} disabled={!newCharName.trim()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-emerald-700">Create</button>
              </div>
              {/* Name suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {storyWeaverUtils.generateCharacterNames(genre).map((name, i) => (
                  <button key={i} onClick={() => setNewCharName(name)} className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded border border-gray-200 hover:bg-emerald-50 hover:text-emerald-600">{name}</button>
                ))}
              </div>
            </div>

            {/* Character list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map(c => (
                <div key={c.id} className="bg-white/40 backdrop-blur-lg rounded-2xl p-4 border border-white/60 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">{c.name[0]}</div>
                    <div>
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{c.role}</div>
                    </div>
                  </div>
                  {c.description && <p className="text-sm text-gray-600 line-clamp-2 mb-2">{c.description}</p>}
                  {c.personality && c.personality.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.personality.slice(0, 4).map((p, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {characters.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No characters created yet</p>}
            </div>
          </div>
        )}

        {/* ═══ TEMPLATES TAB ═══ */}
        {tab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{t.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${t.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : t.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{t.difficulty}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{t.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>{t.genre}</span>
                  <span>&middot;</span>
                  <span>{t.estimatedChapters} chapters</span>
                  <span>&middot;</span>
                  <span>Pop: {t.popularity}%</span>
                </div>
                {t.prompts && t.prompts.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {t.prompts.slice(0, 2).map((p, i) => (
                      <div key={i} className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 border border-gray-100">&quot;{p}&quot;</div>
                    ))}
                  </div>
                )}
                <button onClick={() => { if (t.prompts?.[0]) { setStory(t.prompts[0] + '\n\n'); setGenre(t.genre); setTab('write') } }}
                  className="w-full py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                  Use Template
                </button>
              </div>
            ))}
            {templates.length === 0 && <p className="text-gray-400 col-span-full text-center py-12">Loading templates...</p>}
          </div>
        )}

        {/* ═══ GENRES TAB ═══ */}
        {tab === 'genres' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {genres.map(g => (
              <div key={g.id} className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-1">{g.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{g.description}</p>
                {g.subgenres && g.subgenres.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Sub-genres</div>
                    <div className="flex flex-wrap gap-1">{g.subgenres.map((s, i) => <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{s}</span>)}</div>
                  </div>
                )}
                {g.characteristics && g.characteristics.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Characteristics</div>
                    <ul className="text-xs text-gray-600 space-y-0.5">{g.characteristics.slice(0, 3).map((c, i) => <li key={i}>• {c}</li>)}</ul>
                  </div>
                )}
                {g.writingTips && g.writingTips.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Writing Tips</div>
                    <ul className="text-xs text-gray-600 space-y-0.5">{g.writingTips.slice(0, 2).map((t, i) => <li key={i}>💡 {t}</li>)}</ul>
                  </div>
                )}
                <button onClick={() => { setGenre(g.id); setTab('write') }}
                  className="w-full mt-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                  Write in {g.name}
                </button>
              </div>
            ))}
            {genres.length === 0 && <p className="text-gray-400 col-span-full text-center py-12">Loading genres...</p>}
          </div>
        )}

        {/* ═══ COLLABORATE TAB ═══ */}
        {tab === 'collaborate' && (
          <div className="space-y-3">
            {collaborations.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No active collaborations</p>
                <p className="text-sm mt-1">Invite others to co-write stories with you</p>
              </div>
            ) : collaborations.map(c => (
              <div key={c.id} className="bg-white/40 backdrop-blur-lg rounded-2xl p-4 border border-white/60 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{c.storyTitle}</h3>
                    <div className="text-xs text-gray-500 capitalize">Role: {c.role} &middot; {c.contributions} contributions</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize">{c.role}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Joined: {new Date(c.joinedAt).toLocaleDateString()}</span>
                  <span>&middot;</span>
                  <span>Last active: {new Date(c.lastActive).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}