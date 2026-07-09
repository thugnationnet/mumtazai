'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, ArrowLeft, Plus, Trash2, Calculator, Download, Copy, Check, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface TimeEntry {
  id: number
  date: string
  start: string
  end: string
  breakMin: number
  note: string
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function formatHours(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.abs(minutes) % 60
  return `${h}h ${m}m`
}

const PRESETS = [
  { label: '9-5 Weekday', entries: [
    { start: '09:00', end: '17:00', breakMin: 30 },
  ]},
  { label: 'Full Week (Mon-Fri)', entries: Array(5).fill({ start: '09:00', end: '17:00', breakMin: 30 }) },
  { label: 'Part-time (4h)', entries: [
    { start: '09:00', end: '13:00', breakMin: 0 },
  ]},
  { label: 'Night Shift', entries: [
    { start: '22:00', end: '06:00', breakMin: 30 },
  ]},
]

export default function TimeCardCalculatorPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([
    { id: 1, date: new Date().toISOString().split('T')[0], start: '09:00', end: '17:00', breakMin: 30, note: '' }
  ])
  const [hourlyRate, setHourlyRate] = useState(25)
  const [overtimeThreshold, setOvertimeThreshold] = useState(40)
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(1.5)
  const [copied, setCopied] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const addEntry = () => {
    const lastDate = entries.length ? entries[entries.length - 1].date : new Date().toISOString().split('T')[0]
    const nextDate = new Date(lastDate)
    nextDate.setDate(nextDate.getDate() + 1)
    setEntries(prev => [...prev, {
      id: Date.now(), date: nextDate.toISOString().split('T')[0],
      start: '09:00', end: '17:00', breakMin: 30, note: ''
    }])
  }

  const removeEntry = (id: number) => setEntries(prev => prev.filter(e => e.id !== id))

  const updateEntry = (id: number, field: keyof TimeEntry, value: string | number) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const getWorked = (entry: TimeEntry): number => {
    let start = parseTime(entry.start)
    let end = parseTime(entry.end)
    if (end < start) end += 24 * 60 // overnight shift
    return Math.max(0, end - start - entry.breakMin)
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const baseDate = new Date()
    const day = baseDate.getDay()
    const monday = new Date(baseDate)
    monday.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1))

    const newEntries = preset.entries.map((e, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      return { id: Date.now() + i, date: date.toISOString().split('T')[0], ...e, note: '' }
    })
    setEntries(newEntries)
  }

  const totalMinutes = entries.reduce((sum, e) => sum + getWorked(e), 0)
  const totalHours = totalMinutes / 60
  const regularHours = Math.min(totalHours, overtimeThreshold)
  const overtimeHours = Math.max(0, totalHours - overtimeThreshold)
  const regularPay = regularHours * hourlyRate
  const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier
  const totalPay = regularPay + overtimePay

  const exportCSV = () => {
    const header = 'Date,Start,End,Break (min),Worked,Note\n'
    const rows = entries.map(e => `${e.date},${e.start},${e.end},${e.breakMin},${formatHours(getWorked(e))},"${e.note}"`).join('\n')
    const summary = `\n\nTotal Hours,${formatHours(totalMinutes)}\nRegular Hours,${regularHours.toFixed(1)}h\nOvertime Hours,${overtimeHours.toFixed(1)}h\nTotal Pay,$${totalPay.toFixed(2)}`
    const blob = new Blob([header + rows + summary], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'timecard.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const copyTable = async () => {
    const txt = entries.map(e => `${e.date}\t${e.start}\t${e.end}\t${e.breakMin}min\t${formatHours(getWorked(e))}`).join('\n')
    await navigator.clipboard.writeText(txt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
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
                <Clock className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Time Card <span className="text-blue-100">Calculator</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Calculate work hours, overtime, and pay with CSV export</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Settings Row */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Hourly Rate ($)</label>
                <input type="number" min={0} step={0.5} value={hourlyRate} onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">OT Threshold (hrs/wk)</label>
                <input type="number" min={0} value={overtimeThreshold} onChange={(e) => setOvertimeThreshold(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">OT Multiplier</label>
                <select value={overtimeMultiplier} onChange={(e) => setOvertimeMultiplier(parseFloat(e.target.value))} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value={1.5}>1.5x (Time and a half)</option>
                  <option value={2}>2x (Double time)</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1}>1x (No overtime)</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map(p => (
                    <button key={p.label} onClick={() => applyPreset(p)} className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors">{p.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Time Entries */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Time Entries</h3>
              <div className="flex gap-2">
                <button onClick={copyTable} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={exportCSV} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                  <Download className="w-3.5 h-3.5" />CSV
                </button>
                <button onClick={addEntry} className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" />Add Entry
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-2">
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Start</div>
                <div className="col-span-2">End</div>
                <div className="col-span-1">Break</div>
                <div className="col-span-1">Hours</div>
                <div className="col-span-3">Note</div>
                <div className="col-span-1"></div>
              </div>

              {entries.map(entry => {
                const worked = getWorked(entry)
                return (
                  <div key={entry.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2 border border-gray-200">
                    <input type="date" value={entry.date} onChange={(e) => updateEntry(entry.id, 'date', e.target.value)} className="col-span-2 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <input type="time" value={entry.start} onChange={(e) => updateEntry(entry.id, 'start', e.target.value)} className="col-span-2 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <input type="time" value={entry.end} onChange={(e) => updateEntry(entry.id, 'end', e.target.value)} className="col-span-2 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <input type="number" min={0} value={entry.breakMin} onChange={(e) => updateEntry(entry.id, 'breakMin', parseInt(e.target.value) || 0)} className="col-span-1 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <div className={`col-span-1 text-sm font-semibold text-center ${worked >= 480 ? 'text-green-600' : 'text-gray-900'}`}>{formatHours(worked)}</div>
                    <input type="text" value={entry.note} onChange={(e) => updateEntry(entry.id, 'note', e.target.value)} placeholder="Optional note" className="col-span-3 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <button onClick={() => removeEntry(entry.id)} className="col-span-1 text-red-400 hover:text-red-600 transition-colors justify-self-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-brand-600" />Pay Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{formatHours(totalMinutes)}</div>
                <div className="text-xs text-gray-600 mt-1">Total Hours</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">{regularHours.toFixed(1)}h</div>
                <div className="text-xs text-gray-600 mt-1">Regular Hours</div>
              </div>
              <div className={`rounded-lg p-4 text-center border ${overtimeHours > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-2xl font-bold ${overtimeHours > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{overtimeHours.toFixed(1)}h</div>
                <div className="text-xs text-gray-600 mt-1">Overtime ({overtimeMultiplier}x)</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{entries.length}</div>
                <div className="text-xs text-gray-600 mt-1">Entries</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-700">${totalPay.toFixed(2)}</div>
                <div className="text-xs text-gray-600 mt-1">Total Pay</div>
              </div>
            </div>
            {overtimeHours > 0 && (
              <div className="mt-3 text-xs text-gray-500">
                Regular: ${regularPay.toFixed(2)} ({regularHours.toFixed(1)}h × ${hourlyRate}/hr) + Overtime: ${overtimePay.toFixed(2)} ({overtimeHours.toFixed(1)}h × ${(hourlyRate * overtimeMultiplier).toFixed(2)}/hr)
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />About Time Card Calculations</h3>
              {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showInfo && (
              <div className="px-6 pb-6 text-sm text-gray-600 space-y-2">
                <p>This calculator supports overnight shifts (end time before start time is treated as next-day). Break time is subtracted from total hours.</p>
                <p>Under the US FLSA, non-exempt employees earn 1.5x for hours over 40/week. Some states (CA) also require daily overtime after 8 hours.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
