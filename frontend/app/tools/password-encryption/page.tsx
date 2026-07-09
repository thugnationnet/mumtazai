'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Lock, ArrowLeft, Copy, Check, Download, Trash2, RefreshCw, Hash, Shield, Eye, EyeOff } from 'lucide-react'

interface HashResult {
  algo: string
  hash: string
  bits: number
  time: number
}

const ALGO_INFO: Record<string, { bits: number; desc: string; security: 'deprecated' | 'weak' | 'strong' | 'recommended' }> = {
  'MD5': { bits: 128, desc: 'Fast but cryptographically broken. Not suitable for security.', security: 'deprecated' },
  'SHA-1': { bits: 160, desc: 'Legacy algorithm. Collision attacks demonstrated in 2017.', security: 'weak' },
  'SHA-256': { bits: 256, desc: 'Part of SHA-2 family. Widely used and currently secure.', security: 'recommended' },
  'SHA-384': { bits: 384, desc: 'SHA-2 variant with extended output. Good for high-security needs.', security: 'strong' },
  'SHA-512': { bits: 512, desc: 'Strongest SHA-2 variant. Maximum output length.', security: 'recommended' },
}

const SECURITY_COLORS = {
  deprecated: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', label: 'Deprecated' },
  weak: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', label: 'Weak' },
  strong: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Strong' },
  recommended: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', label: 'Recommended' },
}

// Minimal MD5 implementation for client-side
function md5Hash(str: string): string {
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3]
    a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330)
    a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983)
    a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162)
    a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329)
    a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302)
    a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848)
    a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501)
    a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734)
    a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556)
    a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640)
    a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189)
    a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651)
    a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055)
    a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799)
    a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649)
    a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551)
    x[0]=add32(a,x[0]);x[1]=add32(b,x[1]);x[2]=add32(c,x[2]);x[3]=add32(d,x[3])
  }
  function cmn(q:number,a:number,b:number,x:number,s:number,t:number){a=add32(add32(a,q),add32(x,t));return add32((a<<s)|(a>>>(32-s)),b)}
  function ff(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn((b&c)|((~b)&d),a,b,x,s,t)}
  function gg(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn((b&d)|(c&(~d)),a,b,x,s,t)}
  function hh(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn(b^c^d,a,b,x,s,t)}
  function ii(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn(c^(b|(~d)),a,b,x,s,t)}
  function md51(s:string){const n=s.length;const st=[1732584193,-271733879,-1732584194,271733878];let i;for(i=64;i<=n;i+=64)md5cycle(st,md5blk(s.substring(i-64,i)));s=s.substring(i-64);const tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(i=0;i<s.length;i++)tail[i>>2]|=s.charCodeAt(i)<<((i%4)<<3);tail[i>>2]|=0x80<<((i%4)<<3);if(i>55){md5cycle(st,tail);for(i=0;i<16;i++)tail[i]=0}tail[14]=n*8;md5cycle(st,tail);return st}
  function md5blk(s:string){const r=[];for(let i=0;i<64;i+=4)r[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24);return r}
  function add32(a:number,b:number){return(a+b)&0xFFFFFFFF}
  const hc='0123456789abcdef'
  function rhex(n:number){let s='';for(let j=0;j<4;j++)s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s}
  function hex(x:number[]){for(let i=0;i<x.length;i++)x[i]=rhex(x[i] as number) as any;return(x as unknown as string[]).join('')}
  return hex(md51(str))
}

export default function PasswordEncryptionPage() {
  const [input, setInput] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [results, setResults] = useState<HashResult[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(-1)
  const [compareHash, setCompareHash] = useState('')
  const [iterations, setIterations] = useState(1)
  const [history, setHistory] = useState<{ input: string; algo: string; hash: string; ts: string }[]>([])

  const hashAll = async () => {
    if (!input) return
    setLoading(true)
    const encoder = new TextEncoder()
    const hashes: HashResult[] = []

    // Web Crypto API hashes
    for (const [name, algoId] of [['SHA-1', 'SHA-1'], ['SHA-256', 'SHA-256'], ['SHA-384', 'SHA-384'], ['SHA-512', 'SHA-512']] as const) {
      const start = performance.now()
      let data = encoder.encode(input)
      for (let i = 0; i < iterations; i++) {
        const buf = await crypto.subtle.digest(algoId, data)
        data = new Uint8Array(buf)
      }
      const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('')
      hashes.push({ algo: name, hash: hex, bits: ALGO_INFO[name].bits, time: Math.round((performance.now() - start) * 100) / 100 })
    }

    // MD5
    const md5Start = performance.now()
    let md5Result = input
    for (let i = 0; i < iterations; i++) md5Result = md5Hash(md5Result)
    hashes.unshift({ algo: 'MD5', hash: md5Result, bits: 128, time: Math.round((performance.now() - md5Start) * 100) / 100 })

    setResults(hashes)
    setHistory(prev => [...hashes.map(h => ({ input: input.slice(0, 20) + (input.length > 20 ? '...' : ''), algo: h.algo, hash: h.hash.slice(0, 16) + '...', ts: new Date().toISOString() })), ...prev].slice(0, 20))
    setLoading(false)
  }

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(-1), 1200)
  }

  // Compare feature
  const matchResult = useMemo(() => {
    if (!compareHash || results.length === 0) return null
    const clean = compareHash.trim().toLowerCase()
    const match = results.find(r => r.hash === clean)
    return match ? { found: true, algo: match.algo } : { found: false, algo: '' }
  }, [compareHash, results])

  const exportResults = () => {
    if (results.length === 0) return
    const lines = [`Hash Results for: "${input.slice(0, 50)}${input.length > 50 ? '...' : ''}"`, `Iterations: ${iterations}`, '']
    results.forEach(r => {
      const info = ALGO_INFO[r.algo]
      lines.push(`${r.algo} (${r.bits}-bit) [${info.security}]`)
      lines.push(`  ${r.hash}`)
      lines.push(`  Time: ${r.time}ms`)
      lines.push('')
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'hash-results.txt'; a.click(); URL.revokeObjectURL(a.href)
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
                <Lock className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Hash <span className="text-blue-100">Generator</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Generate MD5, SHA-1, SHA-256, SHA-384 & SHA-512 hashes with security ratings</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Input */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Text to Hash</label>
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter text, password, or data to hash..."
                  className={`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 ${showInput ? 'text-gray-900' : 'text-security-disc'} font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                  rows={3}
                  style={!showInput ? { WebkitTextSecurity: 'disc' } as any : {}}
                />
                <button onClick={() => setShowInput(!showInput)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {showInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Iterations</label>
                <select value={iterations} onChange={(e) => setIterations(Number(e.target.value))} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value={1}>1 (standard)</option>
                  <option value={100}>100 (stretched)</option>
                  <option value={1000}>1,000 (key derivation)</option>
                  <option value={10000}>10,000 (PBKDF2-like)</option>
                </select>
              </div>
              <button onClick={hashAll} disabled={!input || loading} className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-brand-600/25">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}{loading ? 'Hashing...' : 'Generate All Hashes'}
              </button>
              {results.length > 0 && (
                <button onClick={exportResults} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1.5"><Download className="w-4 h-4" />Export</button>
              )}
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((r, i) => {
                const info = ALGO_INFO[r.algo]
                const sc = SECURITY_COLORS[info.security]
                return (
                  <div key={r.algo} className={`${sc.bg} rounded-2xl border ${sc.border} p-5`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">{r.algo}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.badge}`}>{sc.label}</span>
                        <span className="text-xs text-gray-500">{r.bits}-bit</span>
                        <span className="text-xs text-gray-400">{r.time}ms</span>
                      </div>
                      <button onClick={() => copy(r.hash, i)} className="px-3 py-1.5 bg-white/80 hover:bg-white text-gray-700 rounded-lg text-xs flex items-center gap-1.5 border border-gray-200">
                        {copiedIdx === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}{copiedIdx === i ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="font-mono text-sm text-gray-800 break-all bg-white/60 rounded-lg p-3 border border-gray-200/50">{r.hash}</div>
                    <p className="text-xs text-gray-500 mt-2">{info.desc}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Hash Comparison */}
          {results.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-brand-600" />Verify / Compare Hash</h3>
              <input
                placeholder="Paste a hash to verify against results..."
                value={compareHash}
                onChange={(e) => setCompareHash(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {matchResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${matchResult.found ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {matchResult.found ? `✓ Match found! This is a valid ${matchResult.algo} hash of your input.` : '✗ No match. The hash does not correspond to any algorithm output.'}
                </div>
              )}
            </div>
          )}

          {/* Algorithm Comparison Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Algorithm Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Algorithm</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Output</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Security</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Use Case</th>
                </tr></thead>
                <tbody>
                  {[
                    { algo: 'MD5', out: '128-bit / 32 hex', sec: 'deprecated', use: 'Checksums only (not security)' },
                    { algo: 'SHA-1', out: '160-bit / 40 hex', sec: 'weak', use: 'Legacy systems, Git commits' },
                    { algo: 'SHA-256', out: '256-bit / 64 hex', sec: 'recommended', use: 'Digital signatures, certificates, Bitcoin' },
                    { algo: 'SHA-384', out: '384-bit / 96 hex', sec: 'strong', use: 'TLS, high-security environments' },
                    { algo: 'SHA-512', out: '512-bit / 128 hex', sec: 'recommended', use: 'Password hashing, file integrity' },
                  ].map(r => (
                    <tr key={r.algo} className="border-b border-gray-100">
                      <td className="py-2 font-mono font-medium text-gray-900">{r.algo}</td>
                      <td className="py-2 text-gray-600">{r.out}</td>
                      <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SECURITY_COLORS[r.sec as keyof typeof SECURITY_COLORS].badge}`}>{SECURITY_COLORS[r.sec as keyof typeof SECURITY_COLORS].label}</span></td>
                      <td className="py-2 text-gray-600">{r.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hash History</h4>
                <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-1">
                {history.slice(0, 10).map((h, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0 text-xs">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">{h.algo}</span>
                    <span className="text-gray-600 truncate">{h.input}</span>
                    <span className="font-mono text-gray-400 truncate flex-1">{h.hash}</span>
                    <span className="text-gray-400 flex-shrink-0">{new Date(h.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="text-sm text-amber-800"><strong>Important:</strong> These are one-way cryptographic hashes. For password storage in production, always use bcrypt, scrypt, or Argon2 with proper salting — never raw SHA or MD5.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
