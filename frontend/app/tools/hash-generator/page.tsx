'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Hash, Copy, Check, Upload } from 'lucide-react'

async function subtleHash(alg: 'SHA-1'|'SHA-256'|'SHA-512', data: ArrayBuffer){
  const digest = await crypto.subtle.digest(alg, data)
  const bytes = Array.from(new Uint8Array(digest))
  return bytes.map(b=> b.toString(16).padStart(2,'0')).join('')
}

function textToArrayBuffer(text: string){
  return new TextEncoder().encode(text).buffer
}

export default function HashGeneratorPage(){
  const [text, setText] = useState('')
  const [file, setFile] = useState<File|null>(null)
  const [key, setKey] = useState('')
  const [copiedField, setCopiedField] = useState<string>('')
  const [results, setResults] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(false)

  const sourceChanged = useMemo(()=> ({ text, file, key }), [text, file, key])

  useEffect(()=>{
    const run = async () => {
      setLoading(true)
      try{
        const buf = file ? await file.arrayBuffer() : textToArrayBuffer(text)
        // Compute SHA hashes in browser
        const sha1 = await subtleHash('SHA-1', buf)
        const sha256 = await subtleHash('SHA-256', buf)
        const sha512 = await subtleHash('SHA-512', buf)
        // MD5 + HMAC via API (MD5 not supported in WebCrypto)
        const res = await fetch('/api/tools/hash',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ data: Array.from(new Uint8Array(buf)), key })
        })
        const j = await res.json()
        setResults({ MD5:j.md5, 'SHA-1':sha1, 'SHA-256':sha256, 'SHA-512':sha512, ...(j.hmac ? { 'HMAC-SHA256': j.hmac } : {}) })
      }catch(e){
        console.error(e)
      }finally{ setLoading(false) }
    }
    run()
  }, [text, file, key])

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(label)
    setTimeout(()=>setCopiedField(''),1200)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-brand-600 to-accent-600">
        <div className="container-custom py-6">
          <Link href="/tools" className="text-blue-100 hover:text-white">← Back to Tools</Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><Hash className="w-6 h-6 text-white"/></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Hash Generator</h1>
              <p className="text-blue-100">Generate MD5, SHA-1, SHA-256, SHA-512 and optional HMAC (SHA-256)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 lg:col-span-1">
            <h2 className="font-semibold text-gray-900 mb-2">Input</h2>
            <textarea className="w-full h-40 font-mono text-sm bg-white border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={text} onChange={(e)=>setText(e.target.value)} placeholder="Type or paste text"/>
            <div className="mt-3 flex items-center gap-3">
              <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center cursor-pointer"><Upload className="w-4 h-4 mr-1"/> Choose File<input type="file" className="hidden" onChange={(e)=> setFile(e.target.files?.[0] || null) }/></label>
              {file && <span className="text-gray-600 text-sm">{file.name} ({Math.round(file.size/1024)} KB)</span>}
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-600">HMAC Key (optional)</label>
              <input className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={key} onChange={(e)=>setKey(e.target.value)} placeholder="Enter key for HMAC (SHA-256)"/>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            {['MD5','SHA-1','SHA-256','SHA-512','HMAC-SHA256'].map(lbl => (
              <div key={lbl} className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">{lbl}</div>
                  <div className="font-mono text-gray-900 break-all">{results[lbl] || (loading ? 'Calculating…' : '—')}</div>
                </div>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center disabled:opacity-50" disabled={!results[lbl]} onClick={()=>copy(lbl, results[lbl])}>
                  {copiedField===lbl ? <Check className="w-4 h-4 mr-1"/> : <Copy className="w-4 h-4 mr-1"/>}Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
