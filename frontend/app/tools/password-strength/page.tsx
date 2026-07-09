'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, Copy, Check, Trash2, Download } from 'lucide-react'

// Common password patterns/words to penalize
const COMMON_WORDS = ['password','123456','qwerty','admin','letmein','welcome','monkey','dragon','master','abc123','login','princess','football','shadow','sunshine','trustno1','iloveyou','batman','baseball','soccer']
const KEYBOARD_PATTERNS = ['qwerty','asdfgh','zxcvbn','qazwsx','1234567890','0987654321','!@#$%^']

interface StrengthResult {
  score: number // 0-100
  label: string
  color: string
  bgColor: string
  barColor: string
  checks: { label: string; pass: boolean; weight: number; category: string }[]
  timeToCrack: string
  entropy: number
  poolSize: number
  suggestions: string[]
  breachWarning: boolean
}

function analyzePassword(pw: string): StrengthResult {
  const checks: StrengthResult['checks'] = [
    // Length checks
    { label: 'At least 8 characters', pass: pw.length >= 8, weight: 10, category: 'Length' },
    { label: 'At least 12 characters', pass: pw.length >= 12, weight: 10, category: 'Length' },
    { label: 'At least 16 characters (ideal)', pass: pw.length >= 16, weight: 10, category: 'Length' },
    // Character variety
    { label: 'Contains lowercase letters', pass: /[a-z]/.test(pw), weight: 10, category: 'Characters' },
    { label: 'Contains uppercase letters', pass: /[A-Z]/.test(pw), weight: 10, category: 'Characters' },
    { label: 'Contains numbers', pass: /\d/.test(pw), weight: 10, category: 'Characters' },
    { label: 'Contains symbols (!@#$...)', pass: /[^a-zA-Z0-9]/.test(pw), weight: 10, category: 'Characters' },
    // Advanced
    { label: 'No common dictionary words', pass: !COMMON_WORDS.some(w => pw.toLowerCase().includes(w)), weight: 10, category: 'Patterns' },
    { label: 'No keyboard patterns (qwerty, asdf...)', pass: !KEYBOARD_PATTERNS.some(p => pw.toLowerCase().includes(p)), weight: 5, category: 'Patterns' },
    { label: 'No repeated characters (aaa, 111)', pass: !/(.)\1{2,}/.test(pw), weight: 5, category: 'Patterns' },
    { label: 'No sequential numbers (123, 987)', pass: !/012|123|234|345|456|567|678|789|890|098|987|876|765|654|543|432|321|210/.test(pw), weight: 5, category: 'Patterns' },
    { label: 'Mix of character positions', pass: pw.length >= 4 && /[^a-zA-Z]/.test(pw.slice(1, -1)), weight: 5, category: 'Patterns' },
  ]

  let poolSize = 0
  if (/[a-z]/.test(pw)) poolSize += 26
  if (/[A-Z]/.test(pw)) poolSize += 26
  if (/\d/.test(pw)) poolSize += 10
  if (/[^a-zA-Z0-9]/.test(pw)) poolSize += 33

  const entropy = Math.round(pw.length * Math.log2(poolSize || 1))
  const score = Math.min(100, checks.reduce((s, c) => s + (c.pass ? c.weight : 0), 0))

  // Crack time at 1 trillion guesses/sec
  const combinations = Math.pow(poolSize || 1, pw.length)
  const seconds = combinations / 1e12
  let timeToCrack = ''
  if (seconds < 0.001) timeToCrack = 'Instantly'
  else if (seconds < 1) timeToCrack = 'Less than a second'
  else if (seconds < 60) timeToCrack = `${Math.round(seconds)} seconds`
  else if (seconds < 3600) timeToCrack = `${Math.round(seconds / 60)} minutes`
  else if (seconds < 86400) timeToCrack = `${Math.round(seconds / 3600)} hours`
  else if (seconds < 86400 * 365) timeToCrack = `${Math.round(seconds / 86400)} days`
  else if (seconds < 86400 * 365 * 1000) timeToCrack = `${Math.round(seconds / (86400 * 365))} years`
  else if (seconds < 86400 * 365 * 1e6) timeToCrack = `${(seconds / (86400 * 365 * 1000)).toFixed(0)}K years`
  else if (seconds < 86400 * 365 * 1e9) timeToCrack = `${(seconds / (86400 * 365 * 1e6)).toFixed(0)}M years`
  else timeToCrack = 'Billions+ years'

  let label: string, color: string, bgColor: string, barColor: string
  if (score < 20) { label = 'Very Weak'; color = 'text-red-600'; bgColor = 'bg-red-50'; barColor = 'bg-red-500' }
  else if (score < 40) { label = 'Weak'; color = 'text-orange-600'; bgColor = 'bg-orange-50'; barColor = 'bg-orange-500' }
  else if (score < 60) { label = 'Fair'; color = 'text-yellow-600'; bgColor = 'bg-yellow-50'; barColor = 'bg-yellow-500' }
  else if (score < 80) { label = 'Strong'; color = 'text-green-600'; bgColor = 'bg-green-50'; barColor = 'bg-green-500' }
  else { label = 'Very Strong'; color = 'text-emerald-600'; bgColor = 'bg-emerald-50'; barColor = 'bg-emerald-500' }

  const suggestions: string[] = []
  if (pw.length < 12) suggestions.push('Use at least 12 characters for better security')
  if (!/[A-Z]/.test(pw)) suggestions.push('Add uppercase letters')
  if (!/[^a-zA-Z0-9]/.test(pw)) suggestions.push('Include special symbols (!@#$%^&*)')
  if (/(.)\1{2,}/.test(pw)) suggestions.push('Avoid repeated characters')
  if (COMMON_WORDS.some(w => pw.toLowerCase().includes(w))) suggestions.push('Avoid common words like "password" or "admin"')
  if (pw.length >= 12 && score >= 80) suggestions.push('Great password! Consider using a password manager to remember it')

  const breachWarning = COMMON_WORDS.includes(pw.toLowerCase()) || pw.length <= 6

  return { score, label, color, bgColor, barColor, checks, timeToCrack, entropy, poolSize, suggestions, breachWarning }
}

function charDistribution(pw: string) {
  let lower = 0, upper = 0, digits = 0, symbols = 0
  for (const c of pw) {
    if (/[a-z]/.test(c)) lower++
    else if (/[A-Z]/.test(c)) upper++
    else if (/\d/.test(c)) digits++
    else symbols++
  }
  const total = pw.length || 1
  return [
    { label: 'Lowercase', count: lower, pct: Math.round((lower / total) * 100), color: 'bg-blue-500' },
    { label: 'Uppercase', count: upper, pct: Math.round((upper / total) * 100), color: 'bg-green-500' },
    { label: 'Numbers', count: digits, pct: Math.round((digits / total) * 100), color: 'bg-yellow-500' },
    { label: 'Symbols', count: symbols, pct: Math.round((symbols / total) * 100), color: 'bg-red-500' },
  ]
}

export default function PasswordStrengthPage() {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [history, setHistory] = useState<{ pw: string; score: number; label: string; ts: string }[]>([])

  const result = useMemo(() => password ? analyzePassword(password) : null, [password])
  const dist = useMemo(() => password ? charDistribution(password) : [], [password])

  const addToHistory = () => {
    if (!result) return
    setHistory(prev => [{ pw: password.slice(0, 3) + '***', score: result.score, label: result.label, ts: new Date().toISOString() }, ...prev].slice(0, 10))
  }

  const exportReport = () => {
    if (!result) return
    addToHistory()
    const report = `Password Strength Report\n${'='.repeat(40)}\nPassword Length: ${password.length}\nStrength: ${result.label} (${result.score}/100)\nEntropy: ${result.entropy} bits\nCharset Size: ${result.poolSize}\nCrack Time (1T guesses/sec): ${result.timeToCrack}\n\nChecks:\n${result.checks.map(c => `  ${c.pass ? '✓' : '✗'} ${c.label}`).join('\n')}\n\nSuggestions:\n${result.suggestions.map(s => `  • ${s}`).join('\n')}`
    const blob = new Blob([report], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'password-strength-report.txt'; a.click(); URL.revokeObjectURL(a.href)
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
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Password <span className="text-blue-100">Strength Analyzer</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Deep analysis with entropy calculation, pattern detection & crack-time estimation</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Input */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Password to Analyze</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Type a password to check..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 text-gray-900 font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Strength bar */}
            {result && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-sm font-bold ${result.color}`}>{result.label}</span>
                  <span className="text-sm font-mono text-gray-500">{result.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${result.barColor}`} style={{ width: `${result.score}%` }} />
                </div>
              </div>
            )}
          </div>

          {result && (
            <>
              {/* Breach warning */}
              {result.breachWarning && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">High breach risk!</p>
                    <p className="text-sm text-red-600">This password is extremely common or too short. It likely appears in known data breach databases.</p>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Crack Time', value: result.timeToCrack, sub: '@ 1T guesses/sec' },
                  { label: 'Entropy', value: `${result.entropy} bits`, sub: 'Information density' },
                  { label: 'Charset Size', value: result.poolSize.toString(), sub: 'Possible characters' },
                  { label: 'Length', value: `${password.length} chars`, sub: password.length >= 16 ? 'Excellent' : password.length >= 12 ? 'Good' : 'Needs more' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                    <div className="text-lg font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Character Distribution */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Character Distribution</h3>
                <div className="flex rounded-full h-4 overflow-hidden mb-3">
                  {dist.map((d, i) => d.pct > 0 && <div key={i} className={`${d.color} transition-all`} style={{ width: `${d.pct}%` }} />)}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {dist.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className={`w-2.5 h-2.5 rounded-full ${d.color}`} />
                      <span className="text-gray-600">{d.label}: {d.count} ({d.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Checks */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Security Checks</h3>
                  <button onClick={exportReport} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs flex items-center gap-1.5"><Download className="w-3 h-3" />Export Report</button>
                </div>
                {['Length', 'Characters', 'Patterns'].map(cat => (
                  <div key={cat} className="mb-4 last:mb-0">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</h4>
                    <div className="space-y-1.5">
                      {result.checks.filter(c => c.category === cat).map((check, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5">
                          {check.pass ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                          <span className={`text-sm ${check.pass ? 'text-gray-700' : 'text-gray-500'}`}>{check.label}</span>
                          <span className="text-xs text-gray-400 ml-auto">+{check.weight}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div className={`${result.bgColor} rounded-2xl border p-5`}>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Recommendations</h3>
                  <ul className="space-y-1">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Analysis History</h4>
                    <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="space-y-1">
                    {history.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0 text-xs">
                        <span className="font-mono text-gray-600">{h.pw}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${h.score >= 80 ? 'bg-green-100 text-green-700' : h.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{h.score}/100</span>
                        <span className="text-gray-400">{h.label}</span>
                        <span className="ml-auto text-gray-400">{new Date(h.ts).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Privacy notice */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">100% Client-Side Analysis</h3>
              <p className="text-sm text-gray-600">Your password never leaves your browser. All checks, entropy calculations, and crack-time estimates are performed entirely on your device.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
