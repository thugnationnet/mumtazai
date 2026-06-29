'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CreditCard, ArrowLeft, CheckCircle, XCircle, Shield, Copy, Check, Trash2 } from 'lucide-react'

type Tab = 'single' | 'batch' | 'testCards'

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0, alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)
    if (alt) { n *= 2; if (n > 9) n -= 9 }
    sum += n; alt = !alt
  }
  return sum % 10 === 0
}

interface CardInfo {
  type: string; color: string; logo: string; lengths: number[]; prefixPattern: string
}

const CARD_TYPES: CardInfo[] = [
  { type: 'Visa', color: 'from-blue-600 to-blue-800', logo: 'VISA', lengths: [13, 16, 19], prefixPattern: '^4' },
  { type: 'Mastercard', color: 'from-red-600 to-orange-600', logo: 'MC', lengths: [16], prefixPattern: '^(5[1-5]|2[2-7])' },
  { type: 'American Express', color: 'from-emerald-600 to-teal-700', logo: 'AMEX', lengths: [15], prefixPattern: '^3[47]' },
  { type: 'Discover', color: 'from-orange-500 to-amber-600', logo: 'DISC', lengths: [16, 19], prefixPattern: '^(6011|65|64[4-9])' },
  { type: 'Diners Club', color: 'from-gray-600 to-gray-800', logo: 'DC', lengths: [14, 16], prefixPattern: '^(30[0-5]|36|38)' },
  { type: 'JCB', color: 'from-indigo-600 to-purple-700', logo: 'JCB', lengths: [15, 16], prefixPattern: '^35' },
  { type: 'UnionPay', color: 'from-red-700 to-red-900', logo: 'UP', lengths: [16, 17, 18, 19], prefixPattern: '^62' },
  { type: 'Maestro', color: 'from-sky-600 to-sky-800', logo: 'MAES', lengths: [12, 13, 14, 15, 16, 17, 18, 19], prefixPattern: '^(5018|5020|5038|6304|6759|676[1-3])' },
]

function getCardType(num: string): CardInfo | null {
  const d = num.replace(/\D/g, '')
  return CARD_TYPES.find(c => new RegExp(c.prefixPattern).test(d)) || null
}

function formatCard(num: string, type?: string): string {
  const d = num.replace(/\D/g, '')
  if (type === 'American Express') return d.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim()
  return d.replace(/(.{4})/g, '$1 ').trim()
}

const TEST_CARDS = [
  { type: 'Visa', number: '4111111111111111', label: 'Visa Test' },
  { type: 'Visa', number: '4012888888881881', label: 'Visa Test 2' },
  { type: 'Mastercard', number: '5500000000000004', label: 'Mastercard Test' },
  { type: 'Mastercard', number: '5105105105105100', label: 'Mastercard Test 2' },
  { type: 'American Express', number: '378282246310005', label: 'Amex Test' },
  { type: 'American Express', number: '371449635398431', label: 'Amex Test 2' },
  { type: 'Discover', number: '6011111111111117', label: 'Discover Test' },
  { type: 'Diners Club', number: '30569309025904', label: 'Diners Club Test' },
  { type: 'JCB', number: '3530111333300000', label: 'JCB Test' },
  { type: 'UnionPay', number: '6200000000000005', label: 'UnionPay Test' },
]

export default function CreditCardCheckerPage() {
  const [cardNumber, setCardNumber] = useState('')
  const [tab, setTab] = useState<Tab>('single')
  const [batchInput, setBatchInput] = useState('')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<{ num: string; valid: boolean; type: string }[]>([])

  const clean = cardNumber.replace(/\D/g, '')
  const card = useMemo(() => getCardType(clean), [clean])
  const valid = useMemo(() => clean.length >= 13 && luhnCheck(clean), [clean])
  const formatted = useMemo(() => formatCard(clean, card?.type), [clean, card])

  const addToHistory = () => {
    if (!clean) return
    setHistory(prev => [{ num: clean, valid, type: card?.type || 'Unknown' }, ...prev].slice(0, 20))
  }

  const batchResults = useMemo(() => {
    if (!batchInput.trim()) return []
    return batchInput.split('\n').filter(l => l.trim()).map(line => {
      const d = line.trim().replace(/\D/g, '')
      const c = getCardType(d)
      return { number: d, formatted: formatCard(d, c?.type), valid: luhnCheck(d), type: c?.type || 'Unknown' }
    })
  }, [batchInput])

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  const binInfo = useMemo(() => {
    if (clean.length < 6) return null
    const bin = clean.slice(0, 6)
    const iin = clean.slice(0, 8)
    return { bin, iin, length: clean.length, checkDigit: clean[clean.length - 1] }
  }, [clean])

  return (
    <div className="min-h-screen themed-section-bg">
      <div className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10">
          <Link href="/tools" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-500 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Tools
          </Link>
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Credit Card <span className="text-slate-500">Validator</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Luhn algorithm validation with card type detection, BIN info & batch checking</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-1">
            {([
              { id: 'single' as Tab, label: 'Single Check' },
              { id: 'batch' as Tab, label: 'Batch Validate' },
              { id: 'testCards' as Tab, label: 'Test Cards' },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{t.label}</button>
            ))}
          </div>

          {/* Single Check */}
          {tab === 'single' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                  <input type="text" placeholder="4111 1111 1111 1111" value={cardNumber} onChange={e => setCardNumber(e.target.value)} onKeyDown={e => e.key === 'Enter' && addToHistory()} maxLength={23} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <button onClick={addToHistory} disabled={!clean} className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors">Validate</button>
                </div>

                {/* Visual Card */}
                {clean.length >= 4 && (
                  <div className={`rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br ${card?.color || 'from-gray-500 to-gray-700'} aspect-[1.6/1] flex flex-col justify-between`}>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-7 bg-yellow-300/80 rounded-sm" />
                      <span className="text-lg font-bold tracking-wider">{card?.logo || '???'}</span>
                    </div>
                    <div className="font-mono text-xl tracking-[0.15em]">{formatted || '•••• •••• •••• ••••'}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs opacity-75 uppercase">Card Holder</div>
                      <div className="text-xs opacity-75">{card?.type || 'Unknown'}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Validation Result */}
                {clean.length >= 13 && (
                  <div className={`rounded-2xl border shadow-lg p-5 ${valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      {valid ? <CheckCircle className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                      <h3 className={`text-lg font-bold ${valid ? 'text-green-700' : 'text-red-700'}`}>{valid ? 'Valid Number' : 'Invalid Number'}</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Card Type', value: card?.type || 'Unknown' },
                        { label: 'Formatted', value: formatted },
                        { label: 'Luhn Check', value: valid ? 'Pass ✓' : 'Fail ✗' },
                        { label: 'Length', value: `${clean.length} digits${card ? ` (expected: ${card.lengths.join('/')})` : ''}` },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between py-1 border-b border-gray-200/50">
                          <span className="text-gray-600">{r.label}</span>
                          <span className="font-medium text-gray-900">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BIN Info */}
                {binInfo && (
                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">BIN / IIN Info</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'BIN (Bank Identification Number)', value: binInfo.bin },
                        { label: 'IIN (Issuer Identification Number)', value: binInfo.iin },
                        { label: 'Total Length', value: `${binInfo.length} digits` },
                        { label: 'Check Digit', value: binInfo.checkDigit },
                      ].map(r => (
                        <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 group">
                          <span className="text-gray-500">{r.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-gray-900">{r.value}</span>
                            <button onClick={() => copy(r.value, r.label)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600">
                              {copied === r.label ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Batch Validate */}
          {tab === 'batch' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Card Numbers (one per line)</h3>
                <textarea className="w-full h-64 font-mono text-sm bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" value={batchInput} onChange={e => setBatchInput(e.target.value)} placeholder={'4111111111111111\n5500000000000004\n378282246310005\n1234567890123456'} />
              </div>
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Results ({batchResults.length})</h3>
                  {batchResults.length > 0 && (
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded">{batchResults.filter(r => r.valid).length} valid</span>
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded">{batchResults.filter(r => !r.valid).length} invalid</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {batchResults.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${r.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2">
                        {r.valid ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                        <span className="font-mono text-sm text-gray-900">{r.formatted}</span>
                      </div>
                      <span className={`text-xs font-medium ${r.valid ? 'text-green-700' : 'text-red-700'}`}>{r.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Test Cards */}
          {tab === 'testCards' && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-1">Industry Standard Test Card Numbers</h3>
              <p className="text-sm text-gray-500 mb-4">These test numbers are commonly used in payment gateway testing. They pass Luhn validation but are not real cards.</p>
              <div className="space-y-2">
                {TEST_CARDS.map((tc, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg group hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        tc.type === 'Visa' ? 'bg-blue-100 text-blue-700' :
                        tc.type === 'Mastercard' ? 'bg-red-100 text-red-700' :
                        tc.type === 'American Express' ? 'bg-emerald-100 text-emerald-700' :
                        tc.type === 'Discover' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{tc.type}</span>
                      <span className="font-mono text-sm text-gray-900">{formatCard(tc.number)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setCardNumber(tc.number); setTab('single') }} className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100">Test</button>
                      <button onClick={() => copy(tc.number, `tc-${i}`)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600">
                        {copied === `tc-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Recent Checks ({history.length})</h3>
                <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-red-500">Clear</button>
              </div>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => { setCardNumber(h.num); setTab('single') }}>
                    <div className="flex items-center gap-2">
                      {h.valid ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="font-mono text-sm text-gray-700">{formatCard(h.num)}</span>
                    </div>
                    <span className="text-xs text-gray-500">{h.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features + Privacy */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: '🔢', title: 'Luhn Algorithm', desc: 'Industry-standard checksum validation used by all major card networks.' },
              { icon: '💳', title: '8 Card Types', desc: 'Visa, Mastercard, Amex, Discover, Diners, JCB, UnionPay, Maestro.' },
              { icon: '📋', title: 'Batch Mode', desc: 'Validate multiple card numbers at once with detailed results.' },
              { icon: '🔒', title: '100% Client-Side', desc: 'All validation runs in your browser. No data is transmitted.' },
            ].map((f, i) => (
              <div key={i} className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
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
