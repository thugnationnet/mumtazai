'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, Copy, Check, ArrowLeft, Type } from 'lucide-react'

const MAPS: Record<string, Record<string, string>> = {
  superscript: {
    a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',q:'q',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ',
    '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
  },
  subscript: {
    a:'ₐ',e:'ₑ',h:'ₕ',i:'ᵢ',j:'ⱼ',k:'ₖ',l:'ₗ',m:'ₘ',n:'ₙ',o:'ₒ',p:'ₚ',r:'ᵣ',s:'ₛ',t:'ₜ',u:'ᵤ',v:'ᵥ',x:'ₓ',
    '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
  },
  smallcaps: {
    a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ',
  },
  bold: {
    a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
    A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
    '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵',
  },
  italic: {
    a:'𝘢',b:'𝘣',c:'𝘤',d:'𝘥',e:'𝘦',f:'𝘧',g:'𝘨',h:'𝘩',i:'𝘪',j:'𝘫',k:'𝘬',l:'𝘭',m:'𝘮',n:'𝘯',o:'𝘰',p:'𝘱',q:'𝘲',r:'𝘳',s:'𝘴',t:'𝘵',u:'𝘶',v:'𝘷',w:'𝘸',x:'𝘹',y:'𝘺',z:'𝘻',
    A:'𝘈',B:'𝘉',C:'𝘊',D:'𝘋',E:'𝘌',F:'𝘍',G:'𝘎',H:'𝘏',I:'𝘐',J:'𝘑',K:'𝘒',L:'𝘓',M:'𝘔',N:'𝘕',O:'𝘖',P:'𝘗',Q:'𝘘',R:'𝘙',S:'𝘚',T:'𝘛',U:'𝘜',V:'𝘝',W:'𝘞',X:'𝘟',Y:'𝘠',Z:'𝘡',
  },
  boldItalic: {
    a:'𝙖',b:'𝙗',c:'𝙘',d:'𝙙',e:'𝙚',f:'𝙛',g:'𝙜',h:'𝙝',i:'𝙞',j:'𝙟',k:'𝙠',l:'𝙡',m:'𝙢',n:'𝙣',o:'𝙤',p:'𝙥',q:'𝙦',r:'𝙧',s:'𝙨',t:'𝙩',u:'𝙪',v:'𝙫',w:'𝙬',x:'𝙭',y:'𝙮',z:'𝙯',
    A:'𝘼',B:'𝘽',C:'𝘾',D:'𝘿',E:'𝙀',F:'𝙁',G:'𝙂',H:'𝙃',I:'𝙄',J:'𝙅',K:'𝙆',L:'𝙇',M:'𝙈',N:'𝙉',O:'𝙊',P:'𝙋',Q:'𝙌',R:'𝙍',S:'𝙎',T:'𝙏',U:'𝙐',V:'𝙑',W:'𝙒',X:'𝙓',Y:'𝙔',Z:'𝙕',
  },
  monospace: {
    a:'𝚊',b:'𝚋',c:'𝚌',d:'𝚍',e:'𝚎',f:'𝚏',g:'𝚐',h:'𝚑',i:'𝚒',j:'𝚓',k:'𝚔',l:'𝚕',m:'𝚖',n:'𝚗',o:'𝚘',p:'𝚙',q:'𝚚',r:'𝚛',s:'𝚜',t:'𝚝',u:'𝚞',v:'𝚟',w:'𝚠',x:'𝚡',y:'𝚢',z:'𝚣',
    A:'𝙰',B:'𝙱',C:'𝙲',D:'𝙳',E:'𝙴',F:'𝙵',G:'𝙶',H:'𝙷',I:'𝙸',J:'𝙹',K:'𝙺',L:'𝙻',M:'𝙼',N:'𝙽',O:'𝙾',P:'𝙿',Q:'𝚀',R:'𝚁',S:'𝚂',T:'𝚃',U:'𝚄',V:'𝚅',W:'𝚆',X:'𝚇',Y:'𝚈',Z:'𝚉',
    '0':'𝟶','1':'𝟷','2':'𝟸','3':'𝟹','4':'𝟺','5':'𝟻','6':'𝟼','7':'𝟽','8':'𝟾','9':'𝟿',
  },
  circled: {
    a:'ⓐ',b:'ⓑ',c:'ⓒ',d:'ⓓ',e:'ⓔ',f:'ⓕ',g:'ⓖ',h:'ⓗ',i:'ⓘ',j:'ⓙ',k:'ⓚ',l:'ⓛ',m:'ⓜ',n:'ⓝ',o:'ⓞ',p:'ⓟ',q:'ⓠ',r:'ⓡ',s:'ⓢ',t:'ⓣ',u:'ⓤ',v:'ⓥ',w:'ⓦ',x:'ⓧ',y:'ⓨ',z:'ⓩ',
    A:'Ⓐ',B:'Ⓑ',C:'Ⓒ',D:'Ⓓ',E:'Ⓔ',F:'Ⓕ',G:'Ⓖ',H:'Ⓗ',I:'Ⓘ',J:'Ⓙ',K:'Ⓚ',L:'Ⓛ',M:'Ⓜ',N:'Ⓝ',O:'Ⓞ',P:'Ⓟ',Q:'Ⓠ',R:'Ⓡ',S:'Ⓢ',T:'Ⓣ',U:'Ⓤ',V:'Ⓥ',W:'Ⓦ',X:'Ⓧ',Y:'Ⓨ',Z:'Ⓩ',
    '0':'⓪','1':'①','2':'②','3':'③','4':'④','5':'⑤','6':'⑥','7':'⑦','8':'⑧','9':'⑨',
  },
  squared: {
    A:'🄰',B:'🄱',C:'🄲',D:'🄳',E:'🄴',F:'🄵',G:'🄶',H:'🄷',I:'🄸',J:'🄹',K:'🄺',L:'🄻',M:'🄼',N:'🄽',O:'🄾',P:'🄿',Q:'🅀',R:'🅁',S:'🅂',T:'🅃',U:'🅄',V:'🅅',W:'🅆',X:'🅇',Y:'🅈',Z:'🅉',
    a:'🄰',b:'🄱',c:'🄲',d:'🄳',e:'🄴',f:'🄵',g:'🄶',h:'🄷',i:'🄸',j:'🄹',k:'🄺',l:'🄻',m:'🄼',n:'🄽',o:'🄾',p:'🄿',q:'🅀',r:'🅁',s:'🅂',t:'🅃',u:'🅄',v:'🅅',w:'🅆',x:'🅇',y:'🅈',z:'🅉',
  },
  negativeCircled: {
    A:'🅐',B:'🅑',C:'🅒',D:'🅓',E:'🅔',F:'🅕',G:'🅖',H:'🅗',I:'🅘',J:'🅙',K:'🅚',L:'🅛',M:'🅜',N:'🅝',O:'🅞',P:'🅟',Q:'🅠',R:'🅡',S:'🅢',T:'🅣',U:'🅤',V:'🅥',W:'🅦',X:'🅧',Y:'🅨',Z:'🅩',
    a:'🅐',b:'🅑',c:'🅒',d:'🅓',e:'🅔',f:'🅕',g:'🅖',h:'🅗',i:'🅘',j:'🅙',k:'🅚',l:'🅛',m:'🅜',n:'🅝',o:'🅞',p:'🅟',q:'🅠',r:'🅡',s:'🅢',t:'🅣',u:'🅤',v:'🅥',w:'🅦',x:'🅧',y:'🅨',z:'🅩',
  },
  negativeSquared: {
    A:'🅰',B:'🅱',C:'🅲',D:'🅳',E:'🅴',F:'🅵',G:'🅶',H:'🅷',I:'🅸',J:'🅹',K:'🅺',L:'🅻',M:'🅼',N:'🅽',O:'🅾',P:'🅿',Q:'🆀',R:'🆁',S:'🆂',T:'🆃',U:'🆄',V:'🆅',W:'🆆',X:'🆇',Y:'🆈',Z:'🆉',
    a:'🅰',b:'🅱',c:'🅲',d:'🅳',e:'🅴',f:'🅵',g:'🅶',h:'🅷',i:'🅸',j:'🅹',k:'🅺',l:'🅻',m:'🅼',n:'🅽',o:'🅾',p:'🅿',q:'🆀',r:'🆁',s:'🆂',t:'🆃',u:'🆄',v:'🆅',w:'🆆',x:'🆇',y:'🆈',z:'🆉',
  },
}

// Combining character decorators
function applyStrikethrough(text: string): string {
  return text.split('').map(c => c + '\u0336').join('')
}
function applyUnderline(text: string): string {
  return text.split('').map(c => c + '\u0332').join('')
}
function applyFlip(text: string): string {
  const flipMap: Record<string, string> = {
    a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',
    A:'∀',B:'q',C:'Ɔ',D:'p',E:'Ǝ',F:'Ⅎ',G:'פ',H:'H',I:'I',J:'ſ',K:'ʞ',L:'˥',M:'W',N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ɹ',S:'S',T:'⊥',U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z',
    '1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6','0':'0',
    '.':'˙',',':'\'','\'':',','!':'¡','?':'¿','(':')',')':'(','{':'}','}':'{','[':']',']':'[','<':'>','>':'<','&':'⅋','_':'‾',
  }
  return text.split('').map(c => flipMap[c] || c).reverse().join('')
}

function convert(text: string, style: string): string {
  if (style === 'strikethrough') return applyStrikethrough(text)
  if (style === 'underline') return applyUnderline(text)
  if (style === 'flip') return applyFlip(text)
  const map = MAPS[style]
  if (!map) return text
  return text.split('').map(c => {
    if (map[c]) return map[c]
    const lower = c.toLowerCase()
    return map[lower] || c
  }).join('')
}

const STYLES = [
  { key: 'superscript', label: 'Superscript', preview: 'ˢᵐᵃˡˡ ᵗᵉˣᵗ', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'subscript', label: 'Subscript', preview: 'ₛₘₐₗₗ ₜₑₓₜ', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'smallcaps', label: 'Small Caps', preview: 'ꜱᴍᴀʟʟ ᴛᴇxᴛ', color: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'bold', label: 'Bold', preview: '𝗯𝗼𝗹𝗱 𝘁𝗲𝘅𝘁', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'italic', label: 'Italic', preview: '𝘪𝘵𝘢𝘭𝘪𝘤 𝘵𝘦𝘹𝘵', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { key: 'boldItalic', label: 'Bold Italic', preview: '𝙗𝙤𝙡𝙙 𝙞𝙩𝙖𝙡𝙞𝙘', color: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'monospace', label: 'Monospace', preview: '𝚖𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { key: 'circled', label: 'Circled', preview: 'ⓒⓘⓡⓒⓛⓔⓓ', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { key: 'squared', label: 'Squared', preview: '🅂🅀🅄🄰🅁🄴🄳', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'negativeCircled', label: 'Negative Circled', preview: '🅝🅔🅖 🅒🅘🅡🅒🅛🅔', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'negativeSquared', label: 'Negative Squared', preview: '🅽🅴🅶 🆂🆀🆄🅰🆁🅴', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { key: 'strikethrough', label: 'Strikethrough', preview: 's̶t̶r̶i̶k̶e̶', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { key: 'underline', label: 'Underline', preview: 'u̲n̲d̲e̲r̲l̲i̲n̲e̲', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { key: 'flip', label: 'Upside Down', preview: 'ʇxǝʇ pǝddᴉlɟ', color: 'bg-violet-50 text-violet-700 border-violet-200' },
]

export default function SmallTextGeneratorPage() {
  const [input, setInput] = useState('Hello World')
  const [copied, setCopied] = useState('')
  const [filter, setFilter] = useState<'all' | 'small' | 'styled' | 'special'>('all')

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  const copyAll = async () => {
    const all = filtered.map(s => `${s.label}: ${convert(input, s.key)}`).join('\n')
    await navigator.clipboard.writeText(all)
    setCopied('all')
    setTimeout(() => setCopied(''), 1500)
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return STYLES
    if (filter === 'small') return STYLES.filter(s => ['superscript', 'subscript', 'smallcaps'].includes(s.key))
    if (filter === 'styled') return STYLES.filter(s => ['bold', 'italic', 'boldItalic', 'monospace'].includes(s.key))
    return STYLES.filter(s => ['circled', 'squared', 'negativeCircled', 'negativeSquared', 'strikethrough', 'underline', 'flip'].includes(s.key))
  }, [filter])

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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Unicode Text <span className="text-blue-100">Styler</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">14 Unicode text styles — bold, italic, small caps, circled, flipped & more</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Input */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Your Text</h3>
              <span className="text-xs text-gray-400">{input.length} characters</span>
            </div>
            <textarea className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" rows={3} placeholder="Type your text here..." value={input} onChange={e => setInput(e.target.value)} />
          </div>

          {/* Filter + Copy All */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {([
                { id: 'all' as const, label: 'All (14)' },
                { id: 'small' as const, label: 'Small Text' },
                { id: 'styled' as const, label: 'Styled' },
                { id: 'special' as const, label: 'Special' },
              ]).map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === f.id ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{f.label}</button>
              ))}
            </div>
            <button onClick={copyAll} disabled={!input} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50">
              {copied === 'all' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}Copy All
            </button>
          </div>

          {/* Results Grid */}
          {input && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(s => {
                const converted = convert(input, s.key)
                return (
                  <div key={s.key} className={`rounded-xl border p-4 ${s.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide">{s.label}</span>
                      <button onClick={() => copy(converted, s.key)} className="px-2.5 py-1 bg-white/80 hover:bg-white rounded-lg text-xs flex items-center gap-1 transition-colors border border-current/10">
                        {copied === s.key ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        {copied === s.key ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-lg break-all leading-relaxed">{converted}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔤', title: '14 Styles', desc: 'Superscript, subscript, small caps, bold, italic, monospace, circled, squared, and more.' },
              { icon: '📋', title: 'Copy & Paste', desc: 'All styles use real Unicode characters — paste them into social media, bios, messages.' },
              { icon: '🔒', title: 'Client-Side', desc: 'Everything runs in your browser. No data is sent to any server.' },
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
