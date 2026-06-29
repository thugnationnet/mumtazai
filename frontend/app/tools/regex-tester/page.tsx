'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Code2, Copy, Check } from 'lucide-react'

function highlight(text:string, regex:RegExp){
  if(!regex) return text
  const g = regex.global ? regex : new RegExp(regex.source, regex.flags + 'g')
  let lastIndex = 0
  const parts: JSX.Element[] = []
  let m: RegExpExecArray | null
  while((m = g.exec(text))){
    const index = m.index
    const match = m[0]
    if(index>lastIndex){ parts.push(<span key={lastIndex}>{text.slice(lastIndex,index)}</span>) }
    parts.push(<mark key={index} className="bg-yellow-500/30 text-yellow-200 rounded px-1">{match}</mark>)
    lastIndex = index + match.length
  }
  if(lastIndex < text.length){ parts.push(<span key={lastIndex+':end'}>{text.slice(lastIndex)}</span>) }
  return <>{parts}</>
}

export default function RegexTesterPage(){
  const [pattern, setPattern] = useState('foo.*bar')
  const [flags, setFlags] = useState({ g:true, i:true, m:false, s:false, u:true })
  const [text, setText] = useState('foo 123 bar\nFoo BAR baz\nfoobar')

  const regex = useMemo(()=>{
    try{ return new RegExp(pattern, Object.entries(flags).filter(([k,v])=>v).map(([k])=>k).join('')) }catch{return null}
  }, [pattern, flags])

  const matches = useMemo(()=>{
    if(!regex) return [] as RegExpMatchArray[]
    const g = regex.global ? regex : new RegExp(regex.source, regex.flags + 'g')
    const list: RegExpMatchArray[] = []
    let m: RegExpExecArray | null
    while( (m = g.exec(text)) ) { list.push(m as any) }
    return list
  }, [regex, text])

  const [copied, setCopied] = useState(false)
  const copy = async ()=> { await navigator.clipboard.writeText(matches.map(m=>m[0]).join('\n')); setCopied(true); setTimeout(()=>setCopied(false), 1200) }

  return (
    <div className="min-h-screen themed-section-bg">
      <header className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 py-6">
          <Link href="/tools" className="text-purple-600 hover:text-purple-500">← Back to Tools</Link>
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="mt-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><Code2 className="w-6 h-6 text-white"/></div>
            <div>
              <h1 className="text-2xl font-bold font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Regex Tester</h1>
              <p className="text-slate-500">Test and debug regular expressions with live matches, groups, and replace preview</p>
            </div>
          </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <input className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={pattern} onChange={(e)=>setPattern(e.target.value)} placeholder="Pattern e.g. foo(.*)bar"/>
          {(['g','i','m','s','u'] as const).map(f => (
            <label key={f} className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={(flags as any)[f]} onChange={(e)=>setFlags({...flags, [f]: e.target.checked})}/> {f}</label>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-2">Test Text</h2>
            <textarea className="w-full h-72 font-mono text-sm bg-white border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={text} onChange={(e)=>setText(e.target.value)} />
          </div>
          <div className="space-y-4">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900">Matches ({matches.length})</h2>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center disabled:opacity-50" disabled={!matches.length} onClick={copy}>{copied ? <Check className="w-4 h-4 mr-1"/> : <Copy className="w-4 h-4 mr-1"/>}Copy</button>
              </div>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap break-words bg-gray-50 rounded-lg p-3 text-gray-900">{regex ? highlight(text, regex) : text}</pre>
              </div>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Groups</h2>
              {!matches.length ? <div className="text-gray-500 text-sm">No groups</div> : (
                <div className="space-y-2">
                  {matches.map((m, idx)=> (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-2 text-sm font-mono overflow-auto">
                      {Array.from(m).map((g,i)=> (
                        <div key={i} className="text-gray-900"><span className="text-blue-600">${'{'}{i}{'}'}</span>: {g ?? '—'}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
