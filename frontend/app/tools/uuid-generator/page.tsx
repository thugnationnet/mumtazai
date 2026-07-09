'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Key, Copy, Check, RefreshCcw, CheckCircle, XCircle, History, Trash2, ArrowLeft } from 'lucide-react'

/* ─── UUID format types aligned with service file ─────────── */
type UUIDFormat = 'standard' | 'no-hyphens' | 'uppercase' | 'braces' | 'parentheses' | 'urn' | 'base64' | 'hex' | 'binary'

/* ─── Generator logic (client-side, from service file) ─────── */

function generateV4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function generateV7(): string {
  const timestamp = Date.now()
  const hex = timestamp.toString(16).padStart(12, '0')
  const bytes = new Uint8Array(10)
  if (typeof crypto !== 'undefined') crypto.getRandomValues(bytes)
  else for (let i = 0; i < 10; i++) bytes[i] = Math.floor(Math.random() * 256)
  
  bytes[0] = (bytes[0] & 0x0f) | 0x70 // version 7
  bytes[2] = (bytes[2] & 0x3f) | 0x80 // variant 10xx
  
  const randHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${randHex.slice(0, 4)}-${randHex.slice(4, 8)}-${randHex.slice(8, 20)}`
}

function generateV1(): string {
  const timestamp = BigInt(Date.now()) * 10000n + 122192928000000000n
  const timeLow = (timestamp & 0xFFFFFFFFn).toString(16).padStart(8, '0')
  const timeMid = ((timestamp >> 32n) & 0xFFFFn).toString(16).padStart(4, '0')
  const timeHi = ((timestamp >> 48n) & 0x0FFFn | 0x1000n).toString(16).padStart(4, '0')
  
  const bytes = new Uint8Array(8)
  if (typeof crypto !== 'undefined') crypto.getRandomValues(bytes)
  else for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256)
  
  const clockSeq = ((bytes[0] & 0x3f) | 0x80).toString(16).padStart(2, '0') + bytes[1].toString(16).padStart(2, '0')
  const node = Array.from(bytes.slice(2)).map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`
}

function generateUUIDs(count: number, version: 1 | 4 | 7, format: UUIDFormat): string[] {
  const list: string[] = []
  for (let i = 0; i < count; i++) {
    let uuid = version === 1 ? generateV1() : version === 7 ? generateV7() : generateV4()
    uuid = formatUUID(uuid, format)
    list.push(uuid)
  }
  return list
}

function formatUUID(uuid: string, format: UUIDFormat): string {
  const clean = uuid.replace(/-/g, '').toLowerCase()
  const standard = `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`
  switch (format) {
    case 'standard': return standard
    case 'no-hyphens': return clean
    case 'uppercase': return standard.toUpperCase()
    case 'braces': return `{${standard}}`
    case 'parentheses': return `(${standard})`
    case 'urn': return `urn:uuid:${standard}`
    case 'base64': return typeof btoa !== 'undefined' ? btoa(clean.match(/.{2}/g)!.map(h => String.fromCharCode(parseInt(h, 16))).join('')) : standard
    case 'hex': return `0x${clean}`
    case 'binary': return clean.split('').map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('')
    default: return standard
  }
}

function validateUUID(input: string): { isValid: boolean; version?: number; variant?: string; errors: string[] } {
  const result: { isValid: boolean; version?: number; variant?: string; errors: string[] } = { isValid: false, errors: [] }
  
  // Strip common formats
  let normalized = input.trim()
    .replace(/^\{|\}$/g, '')
    .replace(/^\(|\)$/g, '')
    .replace(/^urn:uuid:/i, '')
    .replace(/^0x/i, '')
  
  // Add hyphens if missing
  if (/^[0-9a-f]{32}$/i.test(normalized)) {
    normalized = `${normalized.slice(0,8)}-${normalized.slice(8,12)}-${normalized.slice(12,16)}-${normalized.slice(16,20)}-${normalized.slice(20)}`
  }
  
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!regex.test(normalized)) {
    result.errors.push('Invalid UUID format — expected 32 hex characters')
    return result
  }
  
  const version = parseInt(normalized.charAt(14))
  if (version < 1 || version > 7) {
    result.errors.push(`Unknown UUID version: ${version}`)
    return result
  }
  
  const variantBits = parseInt(normalized.charAt(19), 16)
  let variant = 'unknown'
  if ((variantBits & 0x8) === 0) variant = 'NCS'
  else if ((variantBits & 0xc) === 0x8) variant = 'RFC 4122'
  else if ((variantBits & 0xe) === 0xc) variant = 'Microsoft'
  else variant = 'Reserved'
  
  result.isValid = true
  result.version = version
  result.variant = variant
  return result
}

/* ─── Hook for state persistence ──────────────────────────── */
function useUUIDSettings() {
  const [history, setHistory] = useState<{ uuid: string; version: number; format: string; timestamp: string }[]>([])

  useEffect(() => {
    fetch('/api/user/preferences/tool-state/uuid_generator', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.data?.history) setHistory(d.data.history) })
      .catch(() => {})
  }, [])

  const addToHistory = useCallback((uuids: string[], version: number, format: string) => {
    const entries = uuids.slice(0, 5).map(uuid => ({
      uuid, version, format, timestamp: new Date().toISOString()
    }))
    setHistory(prev => {
      const next = [...entries, ...prev].slice(0, 100)
      fetch('/api/user/preferences/tool-state/uuid_generator', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ history: next }),
      }).catch(() => {})
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    fetch('/api/user/preferences/tool-state/uuid_generator', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ history: [] }),
    }).catch(() => {})
  }, [])

  return { history, addToHistory, clearHistory }
}

/* ─── Main Page ───────────────────────────────────────────── */

export default function UuidGeneratorPage() {
  const [count, setCount] = useState(5)
  const [version, setVersion] = useState<1 | 4 | 7>(4)
  const [format, setFormat] = useState<UUIDFormat>('standard')
  const [activeTab, setActiveTab] = useState<'generate' | 'validate' | 'history'>('generate')
  const [validateInput, setValidateInput] = useState('')
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateUUID> | null>(null)
  const [copied, setCopied] = useState(false)
  const [regenerateKey, setRegenerateKey] = useState(0)

  const { history, addToHistory, clearHistory } = useUUIDSettings()

  const uuids = useMemo(() => {
    const result = generateUUIDs(count, version, format)
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, version, format, regenerateKey])

  const handleRegenerate = () => {
    setRegenerateKey(k => k + 1)
    addToHistory(uuids, version, format)
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(uuids.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const copySingle = async (uuid: string) => {
    await navigator.clipboard.writeText(uuid)
  }

  const handleValidate = () => {
    if (!validateInput.trim()) return
    setValidationResult(validateUUID(validateInput))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-600 to-accent-600">
        <div className="container-custom py-6">
          <Link href="/tools" className="inline-flex items-center text-blue-100 hover:text-white gap-1 mb-3">
            <ArrowLeft className="w-4 h-4" />Back to Tools
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">UUID Generator</h1>
              <p className="text-blue-100">Generate, validate &amp; convert UUIDs (v1, v4, v7)</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container-custom flex gap-1">
          {[
            { id: 'generate' as const, label: 'Generate', icon: Key },
            { id: 'validate' as const, label: 'Validate', icon: CheckCircle },
            { id: 'history' as const, label: `History (${history.length})`, icon: History },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container-custom py-8 max-w-5xl mx-auto">
        {/* ─── GENERATE TAB ─── */}
        {activeTab === 'generate' && (
          <>
            {/* Controls */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 font-medium">Version</label>
                  <select value={version} onChange={e => setVersion(Number(e.target.value) as 1 | 4 | 7)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option value={4}>v4 (Random)</option>
                    <option value={1}>v1 (Timestamp)</option>
                    <option value={7}>v7 (Unix Timestamp)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 font-medium">Format</label>
                  <select value={format} onChange={e => setFormat(e.target.value as UUIDFormat)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option value="standard">Standard</option>
                    <option value="no-hyphens">No Hyphens</option>
                    <option value="uppercase">Uppercase</option>
                    <option value="braces">{'{Braces}'}</option>
                    <option value="parentheses">(Parentheses)</option>
                    <option value="urn">URN</option>
                    <option value="base64">Base64</option>
                    <option value="hex">Hex (0x)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 font-medium">Count</label>
                  <input type="number" className="w-20 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" value={count} min={1} max={1000} onChange={e => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value || '1'))))} />
                </div>

                <div className="flex-1" />

                <button onClick={handleRegenerate} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1 text-sm">
                  <RefreshCcw className="w-4 h-4" />Regenerate
                </button>
                <button onClick={copyAll} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1 text-sm">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy All'}
                </button>
              </div>

              {/* Version info */}
              <div className="mt-3 text-xs text-gray-500">
                {version === 4 && 'v4: 122 bits of randomness. Best for general-purpose unique identifiers.'}
                {version === 1 && 'v1: Timestamp + node ID based. Sortable by creation time.'}
                {version === 7 && 'v7: Unix timestamp + random. Sortable, modern replacement for v1.'}
              </div>
            </div>

            {/* UUID list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uuids.map((id, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-lg p-3 flex items-center justify-between group hover:border-blue-200 transition-colors">
                  <span className="font-mono text-sm text-gray-900 break-all flex-1 mr-2">{id}</span>
                  <button onClick={() => copySingle(id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 flex-shrink-0" title="Copy">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── VALIDATE TAB ─── */}
        {activeTab === 'validate' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Validate UUID</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input type="text" value={validateInput} onChange={e => { setValidateInput(e.target.value); setValidationResult(null) }}
                    placeholder="Paste a UUID to validate..."
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono" />
                  <button onClick={handleValidate} disabled={!validateInput.trim()} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    Validate
                  </button>
                </div>

                {validationResult && (
                  <div className={`p-4 rounded-lg border ${validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      {validationResult.isValid ? <CheckCircle className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                      <span className={`text-lg font-semibold ${validationResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
                        {validationResult.isValid ? 'Valid UUID' : 'Invalid UUID'}
                      </span>
                    </div>
                    {validationResult.isValid && (
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Version:</span>
                          <span className="font-medium">v{validationResult.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Variant:</span>
                          <span className="font-medium">{validationResult.variant}</span>
                        </div>
                      </div>
                    )}
                    {validationResult.errors.length > 0 && (
                      <ul className="space-y-1 text-sm text-red-600 mt-2">
                        {validationResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── HISTORY TAB ─── */}
        {activeTab === 'history' && (
          <div className="max-w-3xl mx-auto space-y-4">
            {history.length > 0 && (
              <div className="flex justify-end">
                <button onClick={clearHistory} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />Clear History
                </button>
              </div>
            )}
            {history.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg text-center">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No generation history yet. Generate some UUIDs to see them here.</p>
              </div>
            ) : (
              history.map((entry, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-lg flex items-center justify-between group">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm text-gray-900 break-all">{entry.uuid}</span>
                    <div className="flex gap-2 mt-1 text-xs text-gray-500">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded">v{entry.version}</span>
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded">{entry.format}</span>
                      <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => copySingle(entry.uuid)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 ml-2" title="Copy">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
