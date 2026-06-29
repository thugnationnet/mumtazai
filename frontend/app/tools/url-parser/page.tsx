'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Code2, Copy, Check } from 'lucide-react'

export default function UrlParserPage(){
  const [urlStr, setUrlStr] = useState('https://example.com:8080/path/to/page?foo=1&bar=2#section')
  const [copied, setCopied] = useState(false)

  const url = useMemo(()=>{
    try{ return new URL(urlStr) }catch{ return null }
  }, [urlStr])

  const entries = url ? Array.from(url.searchParams.entries()) : []
  const copy = async ()=>{ if(!url) return; await navigator.clipboard.writeText(url.toString()); setCopied(true); setTimeout(()=>setCopied(false),1200) }

  const updateParam = (k:string,v:string)=>{
    if(!url) return
    const u = new URL(url)
    u.searchParams.set(k,v)
    setUrlStr(u.toString())
  }
  const removeParam = (k:string)=>{
    if(!url) return
    const u = new URL(url)
    u.searchParams.delete(k)
    setUrlStr(u.toString())
  }
  const addParam = ()=>{
    const u = url ? new URL(url) : new URL('https://example.com')
    u.searchParams.append('param','value')
    setUrlStr(u.toString())
  }

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
              <h1 className="text-2xl font-bold font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">URL Parser</h1>
              <p className="text-slate-500">Parse URLs, inspect components, and edit query parameters</p>
            </div>
          </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4 mb-4">
          <input className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={urlStr} onChange={(e)=>setUrlStr(e.target.value)} />
          <div className="mt-3">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center disabled:opacity-50" disabled={!url} onClick={copy}>{copied ? <Check className="w-4 h-4 mr-1"/> : <Copy className="w-4 h-4 mr-1"/>}Copy URL</button>
          </div>
        </div>

        {!url ? (
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4 text-red-600">Invalid URL</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4"><div className="text-sm text-gray-500">Protocol</div><div className="font-mono text-gray-900">{url.protocol}</div></div>
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4"><div className="text-sm text-gray-500">Host</div><div className="font-mono text-gray-900">{url.host}</div></div>
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4"><div className="text-sm text-gray-500">Hostname</div><div className="font-mono text-gray-900">{url.hostname}</div></div>
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4"><div className="text-sm text-gray-500">Port</div><div className="font-mono text-gray-900">{url.port || '—'}</div></div>
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4"><div className="text-sm text-gray-500">Pathname</div><div className="font-mono text-gray-900 break-all">{url.pathname}</div></div>
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4"><div className="text-sm text-gray-500">Hash</div><div className="font-mono text-gray-900 break-all">{url.hash || '—'}</div></div>
            </div>
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900">Query Parameters</h2>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center" onClick={addParam}>+ Add</button>
              </div>
              {!entries.length ? (
                <div className="text-gray-500 text-sm">No query parameters</div>
              ) : (
                <div className="space-y-2">
                  {entries.map(([k,v],i)=> (
                    <div key={i} className="flex items-center gap-2">
                      <input className="w-48 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" value={k} readOnly/>
                      <input className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={v} onChange={(e)=>updateParam(k, e.target.value)}/>
                      <button className="text-red-500 hover:text-red-600" onClick={()=>removeParam(k)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
