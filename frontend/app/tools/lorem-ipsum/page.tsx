'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Type, Copy, Check, ArrowLeft, RefreshCw, Download, Code, Eye, Trash2 } from 'lucide-react'

// Word banks for different text styles
const WORD_BANKS: Record<string, string[]> = {
  classic: ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit','voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt','mollit','anim','id','est','laborum','perspiciatis','unde','omnis','iste','natus','error','voluptatem','accusantium','doloremque','laudantium','totam','rem','aperiam','eaque','ipsa','quae','ab','illo','inventore','veritatis','quasi','architecto','beatae','vitae','dicta','explicabo','nemo','ipsam','voluptas','aspernatur','aut','odit','fugit','consequuntur','magni','dolores','eos','ratione','sequi','nesciunt','neque','porro','quisquam','nihil','impedit','quo','minus','quod','maxime','placeat','facere','possimus','assumenda','repellendus','temporibus','quibusdam','illum','blanditiis','praesentium','voluptatum','deleniti','atque','corrupti','quos','quas','molestias','excepturi','occaecati','cupiditate','provident'],
  hipster: ['artisan','craft','organic','sustainable','vinyl','brunch','kombucha','aesthetic','avocado','toast','fixie','unicorn','quinoa','kale','meditation','mindful','vegan','gluten-free','cold-pressed','farm-to-table','locally','sourced','handmade','bespoke','curated','vintage','retro','minimalist','bohemian','eclectic','authentic','wholesome','nourishing','ethically','conscious','plant-based','adaptogenic','activated','fermented','probiotic','matcha','turmeric','ceremonial','intentional','slow','living','wellness','holistic','grounding','nurturing','breathwork','journaling','gratitude','manifesting','healing','crystal','sage','chakra','vibrational','frequency','elevated','aligned','centered','balanced','harmonious','radiant','luminous','transcendent','awakened','enlightened','evolved','cosmic','ethereal','magical','transformative','empowering','revolutionary','disruptive','innovative','cutting-edge','next-level','paradigm','shift','breakthrough','visionary','pioneering','trailblazing','game-changing','world-class','premium','elevated','luxury','exclusive','limited','edition','small-batch','micro','nano','hyper','ultra','super','mega','epic','legendary','iconic'],
  corporate: ['synergy','leverage','paradigm','optimize','stakeholder','deliverables','bandwidth','scalable','proactive','ecosystem','holistic','streamline','robust','agile','innovative','seamless','turnkey','enterprise','mission-critical','value-add','best-practice','core-competency','action-item','bottom-line','circle-back','deep-dive','drill-down','end-to-end','forward-looking','game-plan','granular','ideation','key-performance','low-hanging','milestone','next-steps','on-boarding','pipeline','quick-win','roadmap','ramp-up','strategic','touch-base','use-case','value-proposition','win-win','workshop','alignment','benchmark','catalyst','disruptive','empower','framework','growth','high-level','impact','journey','knowledge','landscape','metrics','north-star','objective','pivot','quarterly','reach','scope','timeline','upside','vertical','waterfall','accelerate','amplify','architect','cultivate','drive','enable','foster','generate','harness','implement','jumpstart','kickstart','launch','monetize','navigate','operationalize','prioritize','quantify','reimagine','spearhead','transform','unlock','validate','whiteboard','yield','zero-in'],
  tech: ['API','blockchain','cloud-native','containerized','decentralized','edge-computing','full-stack','GraphQL','headless','infrastructure','JAMstack','Kubernetes','load-balancer','microservice','neural-network','orchestration','pipeline','quantum','real-time','serverless','TypeScript','UX','virtual','WebSocket','zero-downtime','algorithm','binary','cache','database','encryption','frontend','gateway','hash','interface','JSON','kernel','latency','middleware','namespace','object','protocol','query','repository','schema','token','upstream','viewport','webpack','YAML','async','breakpoint','component','dependency','endpoint','framework','git','HTTP','iteration','JWT','key-value','library','module','node','OAuth','package','RESTful','SDK','thread','UUID','version','webhook','XML','Zustand','abstraction','boilerplate','callback','decorator','event-loop','function','garbage-collection','hook','immutable','lazy-loading','memoization','null-safety','observable','Promise','reducer','singleton','tree-shaking','utility','variable','worker','xss-protection','yield'],
}

const FIRST_SENTENCE = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'

type TextStyle = 'classic' | 'hipster' | 'corporate' | 'tech'
type UnitMode = 'paragraphs' | 'sentences' | 'words' | 'list-items'
type OutputFormat = 'plain' | 'html' | 'markdown'

const styleInfo: Record<TextStyle, { label: string; emoji: string; desc: string }> = {
  classic: { label: 'Classic Latin', emoji: '📜', desc: 'Traditional Lorem Ipsum placeholder text' },
  hipster: { label: 'Hipster', emoji: '🥑', desc: 'Trendy wellness & lifestyle vocabulary' },
  corporate: { label: 'Corporate', emoji: '💼', desc: 'Business jargon & corporate buzzwords' },
  tech: { label: 'Tech / Dev', emoji: '💻', desc: 'Programming & technology terminology' },
}

function pick(arr: string[]): string { return arr[Math.floor(Math.random() * arr.length)] }

function genWords(bank: string[], count: number): string {
  return Array.from({ length: count }, () => pick(bank)).join(' ')
}

function genSentence(bank: string[]): string {
  const len = 6 + Math.floor(Math.random() * 14)
  const w = genWords(bank, len)
  return w.charAt(0).toUpperCase() + w.slice(1) + '.'
}

function genParagraph(bank: string[]): string {
  const sc = 3 + Math.floor(Math.random() * 5)
  return Array.from({ length: sc }, () => genSentence(bank)).join(' ')
}

export default function LoremIpsumPage() {
  const [style, setStyle] = useState<TextStyle>('classic')
  const [unit, setUnit] = useState<UnitMode>('paragraphs')
  const [count, setCount] = useState(3)
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [format, setFormat] = useState<OutputFormat>('plain')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState<string | false>(false)
  const [showHtml, setShowHtml] = useState(false)
  const [history, setHistory] = useState<{ text: string; style: string; unit: string; count: number; ts: string }[]>([])

  const generate = () => {
    const bank = WORD_BANKS[style]
    let parts: string[] = []

    if (unit === 'paragraphs') {
      parts = Array.from({ length: count }, () => genParagraph(bank))
    } else if (unit === 'sentences') {
      parts = Array.from({ length: count }, () => genSentence(bank))
    } else if (unit === 'list-items') {
      parts = Array.from({ length: count }, () => genSentence(bank))
    } else {
      parts = [genWords(bank, count)]
    }

    if (startWithLorem && style === 'classic' && parts.length > 0) {
      parts[0] = FIRST_SENTENCE + ' ' + parts[0]
    }

    let text = ''
    if (format === 'plain') {
      if (unit === 'list-items') text = parts.map((p, i) => `${i + 1}. ${p}`).join('\n')
      else if (unit === 'paragraphs') text = parts.join('\n\n')
      else if (unit === 'sentences') text = parts.join(' ')
      else text = parts.join(' ')
    } else if (format === 'html') {
      if (unit === 'paragraphs') text = parts.map(p => `<p>${p}</p>`).join('\n\n')
      else if (unit === 'list-items') text = '<ol>\n' + parts.map(p => `  <li>${p}</li>`).join('\n') + '\n</ol>'
      else if (unit === 'sentences') text = `<p>${parts.join(' ')}</p>`
      else text = `<p>${parts.join(' ')}</p>`
    } else {
      if (unit === 'paragraphs') text = parts.join('\n\n')
      else if (unit === 'list-items') text = parts.map((p, i) => `${i + 1}. ${p}`).join('\n')
      else if (unit === 'sentences') text = parts.join(' ')
      else text = parts.join(' ')
    }

    setOutput(text)
    setHistory(prev => [{ text: text.slice(0, 80) + '...', style, unit, count, ts: new Date().toISOString() }, ...prev].slice(0, 10))
  }

  const stats = useMemo(() => {
    if (!output) return null
    const stripped = output.replace(/<[^>]*>/g, '')
    const words = stripped.trim().split(/\s+/).filter(Boolean).length
    const chars = stripped.length
    const sentences = (stripped.match(/[.!?]+/g) || []).length
    const paragraphs = unit === 'paragraphs' ? count : 1
    const readTime = Math.max(1, Math.ceil(words / 200))
    return { words, chars, sentences, paragraphs, readTime }
  }, [output, count, unit])

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(false), 1200)
  }

  const exportText = () => {
    const ext = format === 'html' ? 'html' : format === 'markdown' ? 'md' : 'txt'
    const blob = new Blob([output], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `lorem-ipsum.${ext}`; a.click(); URL.revokeObjectURL(a.href)
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
                <Type className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Lorem Ipsum <span className="text-blue-100">Generator</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Generate placeholder text in 4 styles with HTML, Markdown & plain text output</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Text Style Chooser */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(styleInfo) as [TextStyle, typeof styleInfo.classic][]).map(([key, info]) => (
              <button key={key} onClick={() => setStyle(key)} className={`p-4 rounded-2xl border-2 text-left transition-all ${style === key ? 'border-brand-600 bg-brand-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="text-2xl mb-1">{info.emoji}</div>
                <div className="font-semibold text-gray-900 text-sm">{info.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{info.desc}</div>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Unit</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value as UnitMode)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  <option value="paragraphs">Paragraphs</option>
                  <option value="sentences">Sentences</option>
                  <option value="words">Words</option>
                  <option value="list-items">List Items</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Count</label>
                <input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  <option value="plain">Plain Text</option>
                  <option value="html">HTML</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={startWithLorem} onChange={(e) => setStartWithLorem(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Start with &quot;Lorem ipsum...&quot;</span>
                </label>
              </div>
              <button onClick={generate} className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-accent-600 hover:opacity-90 text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25">
                <RefreshCw className="w-4 h-4" />Generate
              </button>
            </div>
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400 mr-1 self-center">Presets:</span>
              {[
                { label: '1 Paragraph', u: 'paragraphs' as UnitMode, c: 1 },
                { label: '3 Paragraphs', u: 'paragraphs' as UnitMode, c: 3 },
                { label: '5 Sentences', u: 'sentences' as UnitMode, c: 5 },
                { label: '50 Words', u: 'words' as UnitMode, c: 50 },
                { label: '10 List Items', u: 'list-items' as UnitMode, c: 10 },
                { label: '200 Words', u: 'words' as UnitMode, c: 200 },
              ].map(p => (
                <button key={p.label} onClick={() => { setUnit(p.u); setCount(p.c) }} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs transition-colors">{p.label}</button>
              ))}
            </div>
          </div>

          {/* Output */}
          {output && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  {stats && (
                    <>
                      <span className="text-xs text-gray-500">{stats.words} words</span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-500">{stats.chars} chars</span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-500">{stats.sentences} sentences</span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-500">~{stats.readTime} min read</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {format === 'html' && (
                    <button onClick={() => setShowHtml(!showHtml)} className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 ${showHtml ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {showHtml ? <Code className="w-3 h-3" /> : <Eye className="w-3 h-3" />}{showHtml ? 'Source' : 'Preview'}
                    </button>
                  )}
                  <button onClick={() => copy(output, 'output')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs flex items-center gap-1.5">
                    {copied === 'output' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}{copied === 'output' ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={exportText} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs flex items-center gap-1.5">
                    <Download className="w-3 h-3" />Export
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="p-6">
                {format === 'html' && showHtml ? (
                  <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: output }} />
                ) : (
                  <div className={`bg-gray-50 rounded-lg p-5 border border-gray-200 max-h-[500px] overflow-y-auto ${format === 'html' ? 'font-mono text-sm text-gray-700' : 'text-gray-700 leading-relaxed'}`}>
                    <pre className="whitespace-pre-wrap font-[inherit]">{output}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Generation History</h4>
                <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0 text-xs">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded font-medium capitalize">{h.style}</span>
                    <span className="text-gray-500">{h.count} {h.unit}</span>
                    <span className="font-mono text-gray-400 truncate flex-1">{h.text}</span>
                    <span className="text-gray-400 flex-shrink-0">{new Date(h.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🎨', title: '4 Text Styles', desc: 'Classic Latin, Hipster, Corporate Buzzwords, and Tech/Dev vocabulary for any project context.' },
              { icon: '📝', title: '4 Unit Types', desc: 'Generate paragraphs, sentences, individual words, or numbered list items with configurable counts.' },
              { icon: '💻', title: '3 Output Formats', desc: 'Plain text, HTML with proper tags, or Markdown. Preview rendered HTML or view source code.' },
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
