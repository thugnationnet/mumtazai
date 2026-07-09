'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, Copy, Check, RefreshCw } from 'lucide-react'

function toEpochMs(date: Date){ return date.getTime() }
function fromEpoch(input: number){ return new Date(input) }

const timeZones = typeof (Intl as any).supportedValuesOf === 'function' ? (Intl as any).supportedValuesOf('timeZone') as string[] : ['UTC']

export default function TimestampConverterPage(){
  const [epoch, setEpoch] = useState<string>('')
  const [human, setHuman] = useState<string>('')
  const [tz, setTz] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
  const [copied, setCopied] = useState('')

  const now = new Date()

  const format = useMemo(() => (d: Date) => new Intl.DateTimeFormat('en-US',{ dateStyle:'full', timeStyle:'long', timeZone: tz }).format(d), [tz])

  useEffect(()=>{
    if(epoch.trim()===''){ setHuman(''); return }
    const n = Number(epoch)
    const ms = String(n).length<=10 ? n*1000 : n
    const d = fromEpoch(ms)
    setHuman(format(d))
  }, [epoch, tz, format])

  useEffect(()=>{
    if(!human.trim()) return
    const d = new Date(human)
    if(!isNaN(d.getTime())){
      setEpoch(String(toEpochMs(d)))
    }
  }, [human])

  const copy = async (text:string,label:string)=>{ await navigator.clipboard.writeText(text); setCopied(label); setTimeout(()=>setCopied(''),1200) }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-brand-600 to-accent-600">
        <div className="container-custom py-6">
          <Link href="/tools" className="text-blue-100 hover:text-white">← Back to Tools</Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><Clock className="w-6 h-6 text-white"/></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Timestamp Converter</h1>
              <p className="text-blue-100">Convert between Unix epoch (seconds/ms) and human-readable dates with time zones</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="text-sm text-gray-600">Time Zone</div>
          <select className="min-w-52 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={tz} onChange={(e)=>setTz(e.target.value)}>
            {timeZones.map(z=> <option key={z} value={z}>{z}</option>)}
          </select>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center" onClick={()=>{ setEpoch(String(Date.now())); setHuman(format(new Date())) }}><RefreshCw className="w-4 h-4 mr-1"/> Now</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-2">Epoch (seconds or milliseconds)</h2>
            <input className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={epoch} onChange={(e)=>setEpoch(e.target.value)} placeholder="e.g., 1730790780 or 1730790780123"/>
            {epoch && <button className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center" onClick={()=>copy(epoch,'epoch')}>{copied==='epoch'?<Check className="w-4 h-4 mr-1"/>:<Copy className="w-4 h-4 mr-1"/>}Copy</button>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 lg:sticky lg:top-6 lg:h-fit">
            <h2 className="font-semibold text-gray-900 mb-2">Human Date</h2>
            <input className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={human} onChange={(e)=>setHuman(e.target.value)} placeholder={format(now)} />
            {human && <button className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center" onClick={()=>copy(human,'human')}>{copied==='human'?<Check className="w-4 h-4 mr-1"/>:<Copy className="w-4 h-4 mr-1"/>}Copy</button>}
            {epoch && (
              <div className="mt-4 text-sm text-gray-600">Relative: {new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round((Number(epoch)-(Date.now()))/1000/60), 'minute')}</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
