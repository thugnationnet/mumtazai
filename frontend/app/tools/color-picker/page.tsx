'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Palette, Copy, Check } from 'lucide-react'

function hexToRgb(hex:string){
  hex = hex.replace('#','')
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('')
  const n = parseInt(hex,16)
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 }
}
function rgbToHex(r:number,g:number,b:number){
  return '#'+[r,g,b].map(v=> Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')
}
function rgbToHsl(r:number,g:number,b:number){
  r/=255; g/=255; b/=255
  const max=Math.max(r,g,b), min=Math.min(r,g,b)
  let h=0,s=0,l=(max+min)/2
  if(max!==min){
    const d=max-min
    s=l>0.5 ? d/(2-max-min) : d/(max+min)
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break
      case g: h=(b-r)/d+2; break
      case b: h=(r-g)/d+4; break
    }
    h/=6
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) }
}
function hslToRgb(h:number,s:number,l:number){
  h/=360; s/=100; l/=100
  if(s===0){ const v=Math.round(l*255); return {r:v,g:v,b:v} }
  const hue2rgb=(p:number,q:number,t:number)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6) return p+(q-p)*6*t; if(t<1/2) return q; if(t<2/3) return p+(q-p)*(2/3-t)*6; return p }
  const q=l<0.5? l*(1+s) : l+s-l*s
  const p=2*l-q
  const r=Math.round(hue2rgb(p,q,h+1/3)*255)
  const g=Math.round(hue2rgb(p,q,h)*255)
  const b=Math.round(hue2rgb(p,q,h-1/3)*255)
  return {r,g,b}
}

export default function ColorPickerPage(){
  const [hex, setHex] = useState('#7c3aed')
  const rgb = useMemo(()=> hexToRgb(hex), [hex])
  const hsl = useMemo(()=> rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb])
  const [copied, setCopied] = useState<string>('')

  const setFromRgb = (r:number,g:number,b:number)=> setHex(rgbToHex(r,g,b))
  const setFromHsl = (h:number,s:number,l:number)=> { const c=hslToRgb(h,s,l); setHex(rgbToHex(c.r,c.g,c.b)) }

  const copy = async (text:string, label:string)=>{ await navigator.clipboard.writeText(text); setCopied(label); setTimeout(()=>setCopied(''),1200)}

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-brand-600 to-accent-600">
        <div className="container-custom py-6">
          <Link href="/tools" className="text-blue-100 hover:text-white">← Back to Tools</Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><Palette className="w-6 h-6 text-white"/></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Color Picker</h1>
              <p className="text-blue-100">Pick colors and convert between HEX, RGB, and HSL</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
            <div className="flex items-center gap-4">
              <input type="color" value={hex} onChange={(e)=>setHex(e.target.value)} className="w-16 h-16 rounded-md bg-transparent"/>
              <div>
                <div className="text-sm text-gray-600">Preview</div>
                <div className="w-40 h-8 rounded-md" style={{background: hex}}/>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center gap-3">
              <div className="w-20 text-sm text-gray-600">HEX</div>
              <input className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={hex} onChange={(e)=>setHex(e.target.value)} />
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center" onClick={()=>copy(hex,'hex')}>{copied==='hex'?<Check className="w-4 h-4 mr-1"/>:<Copy className="w-4 h-4 mr-1"/>}Copy</button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center gap-3 flex-wrap">
              <div className="w-20 text-sm text-gray-600">RGB</div>
              <input className="w-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={rgb.r} onChange={(e)=>setFromRgb(parseInt(e.target.value||'0'), rgb.g, rgb.b)} />
              <input className="w-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={rgb.g} onChange={(e)=>setFromRgb(rgb.r, parseInt(e.target.value||'0'), rgb.b)} />
              <input className="w-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={rgb.b} onChange={(e)=>setFromRgb(rgb.r, rgb.g, parseInt(e.target.value||'0'))} />
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center" onClick={()=>copy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,'rgb')}>{copied==='rgb'?<Check className="w-4 h-4 mr-1"/>:<Copy className="w-4 h-4 mr-1"/>}Copy</button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center gap-3 flex-wrap">
              <div className="w-20 text-sm text-gray-600">HSL</div>
              <input className="w-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={hsl.h} onChange={(e)=>setFromHsl(parseInt(e.target.value||'0'), hsl.s, hsl.l)} />
              <input className="w-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={hsl.s} onChange={(e)=>setFromHsl(hsl.h, parseInt(e.target.value||'0'), hsl.l)} />
              <input className="w-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={hsl.l} onChange={(e)=>setFromHsl(hsl.h, hsl.s, parseInt(e.target.value||'0'))} />
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center" onClick={()=>copy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,'hsl')}>{copied==='hsl'?<Check className="w-4 h-4 mr-1"/>:<Copy className="w-4 h-4 mr-1"/>}Copy</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
