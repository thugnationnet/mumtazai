'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Binary, Copy, Check, Upload, Download, RefreshCw } from 'lucide-react'

export default function Base64ToolPage(){
  const [mode, setMode] = useState<'encode'|'decode'>('encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [urlSafe, setUrlSafe] = useState(false)
  const [noPadding, setNoPadding] = useState(false)

  const process = (value: string) => {
    try{
      if(mode==='encode'){
  let b64 = btoa(unescape(encodeURIComponent(value)))
  if(urlSafe) b64 = b64.replace(/\+/g,'-').replace(/\//g,'_')
        if(noPadding) b64 = b64.replace(/=+$/,'')
        setOutput(b64)
      }else{
  let v = value
  if(urlSafe) v = v.replace(/\-/g,'+').replace(/_/g,'/')
        // pad if needed
        if(!noPadding){
          const pad = v.length % 4
          if(pad) v = v + '='.repeat(4-pad)
        }
        const text = decodeURIComponent(escape(atob(v)))
        setOutput(text)
      }
    }catch(e:any){
      setOutput(`Error: ${e.message}`)
    }
  }

  const onFile = async (f: File) => {
    const buf = await f.arrayBuffer()
    if(mode==='encode'){
      const bytes = new Uint8Array(buf)
      let s = ''
      bytes.forEach(b=> s += String.fromCharCode(b))
      process(s)
    }else{
      // decode to blob and download
      process(input)
      const bstr = atob(output)
      const bytes = new Uint8Array(bstr.length)
      for(let i=0;i<bstr.length;i++) bytes[i] = bstr.charCodeAt(i)
      const blob = new Blob([bytes])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'decoded.bin'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const copy = async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(()=>setCopied(false),1200) }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-brand-600 to-accent-600">
        <div className="container-custom py-6">
          <Link href="/tools" className="text-blue-100 hover:text-white">← Back to Tools</Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><Binary className="w-6 h-6 text-white"/></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Base64 Encoder / Decoder</h1>
              <p className="text-blue-100">Convert text and files to and from Base64 with URL-safe and padding options</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={mode} onChange={(e)=>{setMode(e.target.value as any); setOutput('');}}>
            <option value="encode">Encode</option>
            <option value="decode">Decode</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={urlSafe} onChange={e=>{setUrlSafe(e.target.checked); process(input)}}/> URL Safe</label>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={noPadding} onChange={e=>{setNoPadding(e.target.checked); process(input)}}/> No padding</label>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center" onClick={()=>{setInput(''); setOutput('')}}><RefreshCw className="w-4 h-4 mr-1"/>Reset</button>
          <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center cursor-pointer"><Upload className="w-4 h-4 mr-1"/> Choose File<input type="file" className="hidden" onChange={(e)=> e.target.files && onFile(e.target.files[0])}/></label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-2">Input</h2>
            <textarea className="w-full h-72 font-mono text-sm bg-white border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={input} onChange={(e)=>{setInput(e.target.value); process(e.target.value)}} placeholder={mode==='encode' ? 'Type or paste text to encode' : 'Paste Base64 to decode'}/>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 lg:sticky lg:top-6 lg:h-fit">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900">Output</h2>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center disabled:opacity-50" disabled={!output} onClick={copy}>{copied ? <Check className="w-4 h-4 mr-1"/> : <Copy className="w-4 h-4 mr-1"/>}Copy</button>
            </div>
            <textarea className="w-full h-72 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900" value={output} readOnly/>
            {mode==='decode' && output && !output.startsWith('Error:') && (
              <button className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg shadow-blue-500/25 transition-all flex items-center" onClick={()=>onFile(new File([], 'decoded.bin'))}><Download className="w-4 h-4 mr-1"/>Download decoded</button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
