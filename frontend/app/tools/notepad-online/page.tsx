'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { FileEdit, ArrowLeft, Download, Upload, Trash2, Save, Plus, X, Search, Replace, Eye, Code, Undo2, Redo2, AlignLeft } from 'lucide-react'

interface Tab {
  id: string
  name: string
  content: string
  saved: boolean
  createdAt: string
}

const defaultTab = (): Tab => ({ id: crypto.randomUUID(), name: 'Untitled.txt', content: '', saved: true, createdAt: new Date().toISOString() })

export default function NotepadOnlinePage() {
  const [tabs, setTabs] = useState<Tab[]>([defaultTab()])
  const [activeTabId, setActiveTabId] = useState(tabs[0].id)
  const [fontSize, setFontSize] = useState(14)
  const [wordWrap, setWordWrap] = useState(true)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [showFind, setShowFind] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light')
  const [saveMsg, setSaveMsg] = useState('')
  const [undoStack, setUndoStack] = useState<Record<string, string[]>>({})
  const [redoStack, setRedoStack] = useState<Record<string, string[]>>({})
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  // Load from DB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/preferences/tool-state/notepad', { credentials: 'include' });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const saved = json?.data?.tabs;
        if (!cancelled && Array.isArray(saved) && saved.length > 0) {
          setTabs(saved);
          setActiveTabId(saved[0].id);
        }
      } catch { /* not logged in or no data */ }
    })();
    return () => { cancelled = true; };
  }, [])

  // Auto-save every 30 seconds to DB
  useEffect(() => {
    const timer = setInterval(() => {
      fetch('/api/user/preferences/tool-state/notepad', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tabs }),
      }).catch(() => {})
    }, 30000)
    return () => clearInterval(timer)
  }, [tabs])

  const updateTab = useCallback((id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates, saved: false } : t))
  }, [])

  const handleTextChange = (value: string) => {
    // Push to undo
    setUndoStack(prev => ({
      ...prev,
      [activeTabId]: [...(prev[activeTabId] || []).slice(-50), activeTab.content]
    }))
    setRedoStack(prev => ({ ...prev, [activeTabId]: [] }))
    updateTab(activeTabId, { content: value })
  }

  const undo = () => {
    const stack = undoStack[activeTabId] || []
    if (stack.length === 0) return
    const prev = stack[stack.length - 1]
    setRedoStack(rs => ({ ...rs, [activeTabId]: [...(rs[activeTabId] || []), activeTab.content] }))
    setUndoStack(us => ({ ...us, [activeTabId]: stack.slice(0, -1) }))
    updateTab(activeTabId, { content: prev })
  }

  const redo = () => {
    const stack = redoStack[activeTabId] || []
    if (stack.length === 0) return
    const next = stack[stack.length - 1]
    setUndoStack(us => ({ ...us, [activeTabId]: [...(us[activeTabId] || []), activeTab.content] }))
    setRedoStack(rs => ({ ...rs, [activeTabId]: stack.slice(0, -1) }))
    updateTab(activeTabId, { content: next })
  }

  const saveAll = () => {
    fetch('/api/user/preferences/tool-state/notepad', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tabs }),
    }).catch(() => {})
    setTabs(prev => prev.map(t => ({ ...t, saved: true })))
    setSaveMsg('Saved!')
    setTimeout(() => setSaveMsg(''), 1200)
  }

  const addTab = () => {
    const t = defaultTab()
    setTabs(prev => [...prev, t])
    setActiveTabId(t.id)
  }

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return
    const remaining = tabs.filter(t => t.id !== id)
    setTabs(remaining)
    if (activeTabId === id) setActiveTabId(remaining[0].id)
  }

  const renameTab = (id: string) => {
    const name = prompt('File name:', tabs.find(t => t.id === id)?.name || '')
    if (name) updateTab(id, { name })
  }

  const downloadTab = () => {
    const blob = new Blob([activeTab.content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = activeTab.name; a.click(); URL.revokeObjectURL(a.href)
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const content = await file.text()
    const t: Tab = { id: crypto.randomUUID(), name: file.name, content, saved: true, createdAt: new Date().toISOString() }
    setTabs(prev => [...prev, t])
    setActiveTabId(t.id)
    e.target.value = ''
  }

  // Find & Replace
  const findCount = useMemo(() => {
    if (!findText || !activeTab.content) return 0
    try { return (activeTab.content.match(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length } catch { return 0 }
  }, [findText, activeTab.content])

  const replaceNext = () => {
    if (!findText) return
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const newContent = activeTab.content.replace(new RegExp(escaped, 'i'), replaceText)
    handleTextChange(newContent)
  }

  const replaceAll = () => {
    if (!findText) return
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const newContent = activeTab.content.replace(new RegExp(escaped, 'gi'), replaceText)
    handleTextChange(newContent)
  }

  // Stats
  const stats = useMemo(() => {
    const text = activeTab.content
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const chars = text.length
    const lines = text.split('\n').length
    const bytes = new Blob([text]).size
    return { words, chars, lines, bytes }
  }, [activeTab.content])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveAll() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); setShowFind(v => !v) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const themeStyles: Record<string, { bg: string; text: string; editorBg: string; linesBg: string }> = {
    light: { bg: 'bg-white', text: 'text-gray-900', editorBg: 'bg-white', linesBg: 'bg-gray-50' },
    dark: { bg: 'bg-gray-900', text: 'text-gray-100', editorBg: 'bg-gray-900', linesBg: 'bg-gray-800' },
    sepia: { bg: 'bg-amber-50', text: 'text-amber-900', editorBg: 'bg-amber-50', linesBg: 'bg-amber-100/50' },
  }
  const ts = themeStyles[theme]

  const lineNumbers = useMemo(() => {
    return activeTab.content.split('\n').map((_, i) => i + 1)
  }, [activeTab.content])

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
                <FileEdit className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Notepad <span className="text-blue-100">Online</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Multi-tab text editor with find/replace, themes, auto-save & Markdown preview</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-3 flex flex-wrap items-center gap-2">
            <button onClick={saveAll} className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm">
              <Save className="w-4 h-4" />{saveMsg || 'Save'}
            </button>
            <button onClick={downloadTab} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 text-sm">
              <Download className="w-4 h-4" />Download
            </button>
            <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 text-sm cursor-pointer">
              <Upload className="w-4 h-4" />Open
              <input type="file" accept=".txt,.md,.csv,.json,.js,.ts,.html,.css,.xml,.yaml,.yml,.log,.env,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.sh,.sql,.toml" onChange={uploadFile} className="hidden" />
            </label>
            <div className="w-px h-6 bg-gray-200" />
            <button onClick={undo} disabled={!(undoStack[activeTabId]?.length)} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 rounded-lg hover:bg-gray-100" title="Undo"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={!(redoStack[activeTabId]?.length)} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 rounded-lg hover:bg-gray-100" title="Redo"><Redo2 className="w-4 h-4" /></button>
            <button onClick={() => setShowFind(!showFind)} className={`p-2 rounded-lg ${showFind ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`} title="Find & Replace"><Search className="w-4 h-4" /></button>
            <button onClick={() => setShowPreview(!showPreview)} className={`p-2 rounded-lg ${showPreview ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`} title="Markdown Preview"><Eye className="w-4 h-4" /></button>
            <div className="w-px h-6 bg-gray-200" />
            <button onClick={() => updateTab(activeTabId, { content: '' })} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100" title="Clear"><Trash2 className="w-4 h-4" /></button>
            <div className="ml-auto flex items-center gap-2">
              <select value={theme} onChange={(e) => setTheme(e.target.value as any)} className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="sepia">Sepia</option>
              </select>
              <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700">
                {[12, 14, 16, 18, 20, 24].map(s => <option key={s} value={s}>{s}px</option>)}
              </select>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} className="rounded text-blue-600 w-3.5 h-3.5" />Wrap
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={showLineNumbers} onChange={(e) => setShowLineNumbers(e.target.checked)} className="rounded text-blue-600 w-3.5 h-3.5" />#
              </label>
            </div>
          </div>

          {/* Find & Replace */}
          {showFind && (
            <div className="bg-white rounded-xl border border-gray-200 shadow p-3 flex flex-wrap items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input placeholder="Find..." value={findText} onChange={(e) => setFindText(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              {findText && <span className="text-xs text-gray-500">{findCount} match{findCount !== 1 ? 'es' : ''}</span>}
              <Replace className="w-4 h-4 text-gray-400 ml-2" />
              <input placeholder="Replace..." value={replaceText} onChange={(e) => setReplaceText(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button onClick={replaceNext} disabled={!findText || findCount === 0} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs disabled:opacity-50">Replace</button>
              <button onClick={replaceAll} disabled={!findText || findCount === 0} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs disabled:opacity-50">Replace All</button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white rounded-t-2xl border border-b-0 border-gray-200 shadow-sm px-2 pt-2 overflow-x-auto">
            {tabs.map(t => (
              <div key={t.id} onDoubleClick={() => renameTab(t.id)} onClick={() => setActiveTabId(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm cursor-pointer transition-colors ${t.id === activeTabId ? 'bg-gray-100 text-gray-900 font-medium border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                <Code className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[120px]">{t.name}</span>
                {!t.saved && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
                {tabs.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); closeTab(t.id) }} className="ml-1 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                )}
              </div>
            ))}
            <button onClick={addTab} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg ml-1"><Plus className="w-4 h-4" /></button>
          </div>

          {/* Editor */}
          <div className={`${ts.bg} rounded-b-2xl border border-gray-200 shadow-lg overflow-hidden`}>
            {showPreview ? (
              <div className="p-6 prose prose-gray max-w-none min-h-[450px]" dangerouslySetInnerHTML={{ __html: simpleMarkdown(activeTab.content) }} />
            ) : (
              <div className="flex">
                {showLineNumbers && (
                  <div className={`${ts.linesBg} px-3 py-4 text-right select-none border-r border-gray-200 flex-shrink-0 font-mono`} style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.75}px` }}>
                    {lineNumbers.map(n => (
                      <div key={n} className="text-gray-400 text-xs" style={{ height: `${fontSize * 1.75}px`, lineHeight: `${fontSize * 1.75}px` }}>{n}</div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={editorRef}
                  value={activeTab.content}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className={`w-full min-h-[450px] p-4 ${ts.text} ${ts.editorBg} focus:outline-none resize-y font-mono border-none`}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: `${fontSize * 1.75}px`,
                    whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                    overflowWrap: wordWrap ? 'break-word' : 'normal',
                    tabSize: 4,
                  }}
                  placeholder="Start typing... (Ctrl+S to save, Ctrl+F to find)"
                  spellCheck
                />
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-3 flex flex-wrap gap-4 text-xs text-gray-500 items-center">
            <span>{stats.words} words</span>
            <span className="text-gray-300">|</span>
            <span>{stats.chars} characters</span>
            <span className="text-gray-300">|</span>
            <span>{stats.lines} lines</span>
            <span className="text-gray-300">|</span>
            <span>{formatBytes(stats.bytes)}</span>
            <span className="text-gray-300">|</span>
            <span>{tabs.length} file{tabs.length !== 1 ? 's' : ''} open</span>
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
              <span>Auto-saves every 30s</span>
              <span>•</span>
              <span>⌘S Save • ⌘F Find</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Minimal Markdown → HTML for preview
function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>').replace(/$/, '</p>')
}
