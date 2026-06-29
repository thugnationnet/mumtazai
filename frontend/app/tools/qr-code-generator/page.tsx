'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  QrCode,
  Copy,
  Check,
  Download,
  ArrowLeft,
  Wifi,
  Phone,
  Mail,
  Globe,
  MapPin,
  CreditCard,
  Calendar,
  MessageSquare,
  User,
  Link2,
  Trash2,
  RotateCcw,
  Shield,
} from 'lucide-react'

type ErrorCorrection = 'L' | 'M' | 'Q' | 'H'
type ContentType = 'text' | 'url' | 'wifi' | 'phone' | 'email' | 'sms' | 'vcard' | 'geo' | 'event'

interface Template {
  id: ContentType
  label: string
  icon: any
  color: string
  description: string
}

const templates: Template[] = [
  { id: 'text', label: 'Text', icon: QrCode, color: 'bg-gray-100 text-gray-600', description: 'Plain text content' },
  { id: 'url', label: 'URL', icon: Globe, color: 'bg-blue-100 text-blue-600', description: 'Website links' },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi, color: 'bg-green-100 text-green-600', description: 'Network credentials' },
  { id: 'phone', label: 'Phone', icon: Phone, color: 'bg-purple-100 text-purple-600', description: 'Phone numbers' },
  { id: 'email', label: 'Email', icon: Mail, color: 'bg-red-100 text-red-600', description: 'Compose email' },
  { id: 'sms', label: 'SMS', icon: MessageSquare, color: 'bg-orange-100 text-orange-600', description: 'Text message' },
  { id: 'vcard', label: 'vCard', icon: User, color: 'bg-indigo-100 text-indigo-600', description: 'Contact card' },
  { id: 'geo', label: 'Location', icon: MapPin, color: 'bg-cyan-100 text-cyan-600', description: 'GPS coordinates' },
  { id: 'event', label: 'Event', icon: Calendar, color: 'bg-pink-100 text-pink-600', description: 'Calendar event' },
]

const ecLevels: { value: ErrorCorrection; label: string; percent: string }[] = [
  { value: 'L', label: 'Low', percent: '7%' },
  { value: 'M', label: 'Medium', percent: '15%' },
  { value: 'Q', label: 'Quartile', percent: '25%' },
  { value: 'H', label: 'High', percent: '30%' },
]

const presetSizes = [128, 200, 256, 400, 512, 800, 1024]

const presetColors = [
  { fg: '#000000', bg: '#ffffff', label: 'Classic' },
  { fg: '#1a56db', bg: '#ffffff', label: 'Blue' },
  { fg: '#047857', bg: '#ffffff', label: 'Green' },
  { fg: '#7c3aed', bg: '#ffffff', label: 'Purple' },
  { fg: '#dc2626', bg: '#ffffff', label: 'Red' },
  { fg: '#ffffff', bg: '#1a1a2e', label: 'Dark' },
  { fg: '#f59e0b', bg: '#1e1b4b', label: 'Gold' },
  { fg: '#06b6d4', bg: '#0f172a', label: 'Cyber' },
]

export default function QrCodeGeneratorPage() {
  const [contentType, setContentType] = useState<ContentType>('text')
  const [text, setText] = useState('')
  const [size, setSize] = useState(300)
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [ecLevel, setEcLevel] = useState<ErrorCorrection>('M')
  const [margin, setMargin] = useState(1)
  const [copied, setCopied] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [history, setHistory] = useState<{ content: string; type: ContentType; timestamp: string }[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Structured data for templates
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [wifiHidden, setWifiHidden] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [smsTo, setSmsTo] = useState('')
  const [smsBody, setSmsBody] = useState('')
  const [vcardName, setVcardName] = useState('')
  const [vcardPhone, setVcardPhone] = useState('')
  const [vcardEmail, setVcardEmail] = useState('')
  const [vcardOrg, setVcardOrg] = useState('')
  const [vcardUrl, setVcardUrl] = useState('')
  const [geoLat, setGeoLat] = useState('')
  const [geoLng, setGeoLng] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventStart, setEventStart] = useState('')
  const [eventEnd, setEventEnd] = useState('')
  const [eventLocation, setEventLocation] = useState('')

  // Build QR content string from structured inputs
  const getQrContent = useCallback((): string => {
    switch (contentType) {
      case 'text': return text
      case 'url': return text.startsWith('http') ? text : `https://${text}`
      case 'wifi': return `WIFI:T:${wifiEncryption};S:${wifiSSID};P:${wifiPassword};H:${wifiHidden};;`
      case 'phone': return `tel:${phoneNumber}`
      case 'email': return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      case 'sms': return `smsto:${smsTo}:${smsBody}`
      case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nORG:${vcardOrg}\nURL:${vcardUrl}\nEND:VCARD`
      case 'geo': return `geo:${geoLat},${geoLng}`
      case 'event': {
        const fmt = (d: string) => d ? new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : ''
        return `BEGIN:VEVENT\nSUMMARY:${eventTitle}\nDTSTART:${fmt(eventStart)}\nDTEND:${fmt(eventEnd)}\nLOCATION:${eventLocation}\nEND:VEVENT`
      }
      default: return text
    }
  }, [contentType, text, wifiSSID, wifiPassword, wifiEncryption, wifiHidden, phoneNumber, emailTo, emailSubject, emailBody, smsTo, smsBody, vcardName, vcardPhone, vcardEmail, vcardOrg, vcardUrl, geoLat, geoLng, eventTitle, eventStart, eventEnd, eventLocation])

  const qrContent = getQrContent()
  const isContentReady = qrContent.length > 0 && qrContent !== 'tel:' && qrContent !== 'mailto:?subject=&body=' && qrContent !== 'geo:,'

  // Render QR via API
  useEffect(() => {
    if (!isContentReady || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = size
      canvas.height = size
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
    }
    img.onerror = () => {
      canvas.width = size
      canvas.height = size
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#9ca3af'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Generation failed', size / 2, size / 2)
    }
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrContent)}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&ecc=${ecLevel}&margin=${margin}`
  }, [qrContent, size, fgColor, bgColor, ecLevel, margin, isContentReady])

  const download = (format: 'png' | 'svg') => {
    if (!canvasRef.current || !isContentReady) return

    // Add to history
    setHistory(prev => [{ content: qrContent.slice(0, 60), type: contentType, timestamp: new Date().toISOString() }, ...prev].slice(0, 10))

    if (format === 'svg') {
      const svgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrContent)}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&ecc=${ecLevel}&margin=${margin}&format=svg`
      const a = document.createElement('a')
      a.href = svgUrl
      a.download = 'qrcode.svg'
      a.click()
      return
    }

    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  const copyImage = async () => {
    if (!canvasRef.current) return
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvasRef.current!.toBlob(resolve, 'image/png'))
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }
    } catch {
      await navigator.clipboard.writeText(canvasRef.current.toDataURL())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const copyContent = async () => {
    await navigator.clipboard.writeText(qrContent)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 1500)
  }

  const resetAll = () => {
    setText(''); setWifiSSID(''); setWifiPassword(''); setPhoneNumber(''); setEmailTo(''); setEmailSubject(''); setEmailBody(''); setSmsTo(''); setSmsBody(''); setVcardName(''); setVcardPhone(''); setVcardEmail(''); setVcardOrg(''); setVcardUrl(''); setGeoLat(''); setGeoLng(''); setEventTitle(''); setEventStart(''); setEventEnd(''); setEventLocation('')
  }

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
                <QrCode className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">QR Code <span className="text-slate-500">Generator</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Generate QR codes for URLs, Wi-Fi, contacts, events, and more — with full customization</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Content Type & Input */}
          <div className="lg:col-span-2 space-y-4">
            {/* Content Type Selector */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Content Type</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setContentType(t.id); resetAll() }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all
                      ${contentType === t.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50 bg-white border border-gray-100'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${t.color} flex items-center justify-center`}>
                      <t.icon className="w-4 h-4" />
                    </div>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Content</h3>
                <button onClick={resetAll} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />Reset
                </button>
              </div>

              {/* Text / URL */}
              {(contentType === 'text' || contentType === 'url') && (
                <textarea
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder={contentType === 'url' ? 'https://example.com' : 'Enter your text content...'}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              )}

              {/* Wi-Fi */}
              {contentType === 'wifi' && (
                <div className="space-y-3">
                  <input type="text" placeholder="Network Name (SSID)" value={wifiSSID} onChange={(e) => setWifiSSID(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input type="text" placeholder="Password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <div className="flex gap-3 items-center">
                    <select value={wifiEncryption} onChange={(e) => setWifiEncryption(e.target.value as any)} className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500">
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No Password</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={wifiHidden} onChange={(e) => setWifiHidden(e.target.checked)} className="rounded" />
                      Hidden Network
                    </label>
                  </div>
                </div>
              )}

              {/* Phone */}
              {contentType === 'phone' && (
                <input type="tel" placeholder="+1 234 567 8900" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              )}

              {/* Email */}
              {contentType === 'email' && (
                <div className="space-y-3">
                  <input type="email" placeholder="recipient@example.com" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input type="text" placeholder="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <textarea placeholder="Email body..." rows={3} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                </div>
              )}

              {/* SMS */}
              {contentType === 'sms' && (
                <div className="space-y-3">
                  <input type="tel" placeholder="Phone number" value={smsTo} onChange={(e) => setSmsTo(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <textarea placeholder="Message..." rows={3} value={smsBody} onChange={(e) => setSmsBody(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                </div>
              )}

              {/* vCard */}
              {contentType === 'vcard' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Full Name" value={vcardName} onChange={(e) => setVcardName(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input type="tel" placeholder="Phone" value={vcardPhone} onChange={(e) => setVcardPhone(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input type="email" placeholder="Email" value={vcardEmail} onChange={(e) => setVcardEmail(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input type="text" placeholder="Organization" value={vcardOrg} onChange={(e) => setVcardOrg(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input type="url" placeholder="Website URL" value={vcardUrl} onChange={(e) => setVcardUrl(e.target.value)} className="sm:col-span-2 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              )}

              {/* Location */}
              {contentType === 'geo' && (
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Latitude (e.g. 40.7128)" value={geoLat} onChange={(e) => setGeoLat(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input type="text" placeholder="Longitude (e.g. -74.0060)" value={geoLng} onChange={(e) => setGeoLng(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              )}

              {/* Event */}
              {contentType === 'event' && (
                <div className="space-y-3">
                  <input type="text" placeholder="Event Title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start</label>
                      <input type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End</label>
                      <input type="datetime-local" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                  <input type="text" placeholder="Location" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              )}
            </div>

            {/* Customization */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Customize</h3>

              {/* Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Size</label>
                  <span className="text-sm text-gray-500 font-mono">{size}×{size}px</span>
                </div>
                <input type="range" min={128} max={1024} step={8} value={size} onChange={(e) => setSize(parseInt(e.target.value))} className="w-full accent-blue-600" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {presetSizes.map(s => (
                    <button key={s} onClick={() => setSize(s)} className={`px-2 py-1 rounded text-xs transition-colors ${size === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {s}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Correction */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />Error Correction
                </label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {ecLevels.map(ec => (
                    <button
                      key={ec.value}
                      onClick={() => setEcLevel(ec.value)}
                      className={`p-2 rounded-lg text-center transition-all ${ecLevel === ec.value ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}
                    >
                      <div className="text-sm font-bold">{ec.value}</div>
                      <div className="text-[10px] text-gray-500">{ec.label}</div>
                      <div className="text-[10px] text-gray-400">{ec.percent}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Colors</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {presetColors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => { setFgColor(c.fg); setBgColor(c.bg) }}
                      className={`w-10 h-10 rounded-lg border-2 transition-all overflow-hidden ${fgColor === c.fg && bgColor === c.bg ? 'border-blue-500 scale-110' : 'border-gray-200'}`}
                      title={c.label}
                    >
                      <div className="w-full h-1/2" style={{ backgroundColor: c.bg }} />
                      <div className="w-full h-1/2" style={{ backgroundColor: c.fg }} />
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 mb-1 block">Foreground</span>
                    <div className="flex items-center gap-2">
                      <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                      <input type="text" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 mb-1 block">Background</span>
                    <div className="flex items-center gap-2">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                      <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Margin */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Margin</label>
                  <span className="text-sm text-gray-500">{margin} modules</span>
                </div>
                <input type="range" min={0} max={10} value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} className="w-full accent-blue-600" />
              </div>
            </div>
          </div>

          {/* Right Column — Preview & Actions */}
          <div className="space-y-4">
            {/* Preview */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 sticky top-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-center">Preview</h3>
              <div className="flex justify-center mb-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 inline-block">
                  {isContentReady ? (
                    <canvas ref={canvasRef} width={size} height={size} className="max-w-full h-auto rounded" style={{ maxWidth: '280px' }} />
                  ) : (
                    <div className="w-[280px] h-[280px] flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <QrCode className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Enter content to generate</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Content preview */}
              {isContentReady && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-gray-600 font-mono break-all line-clamp-3">{qrContent}</p>
                    <button onClick={copyContent} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => download('png')}
                    disabled={!isContentReady}
                    className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />PNG
                  </button>
                  <button
                    onClick={() => download('svg')}
                    disabled={!isContentReady}
                    className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />SVG
                  </button>
                </div>
                <button
                  onClick={copyImage}
                  disabled={!isContentReady}
                  className="w-full px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to clipboard!' : 'Copy Image'}
                </button>
              </div>

              {/* Info */}
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                <div className="flex justify-between"><span>Size</span><span>{size}×{size}px</span></div>
                <div className="flex justify-between"><span>Error Correction</span><span>{ecLevel} ({ecLevels.find(e => e.value === ecLevel)?.percent})</span></div>
                <div className="flex justify-between"><span>Content Length</span><span>{qrContent.length} chars</span></div>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</h4>
                  <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
                <div className="space-y-1.5">
                  {history.map((h, i) => (
                    <div key={i} className="text-xs text-gray-600 py-1.5 border-b border-gray-50 last:border-0 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] uppercase font-medium">{h.type}</span>
                      <span className="truncate">{h.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🎨', title: '9 Content Types', desc: 'Generate QR codes for URLs, Wi-Fi, vCards, calendar events, SMS, email, phone, GPS coordinates, and plain text' },
            { icon: '⚙️', title: 'Full Customization', desc: 'Custom colors, sizes up to 1024px, 4 error correction levels, adjustable margins, and 8 color presets' },
            { icon: '📦', title: 'Multiple Exports', desc: 'Download as PNG or SVG format, copy to clipboard, and save your generation history' },
          ].map((f, i) => (
            <div key={i} className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h4 className="font-semibold text-gray-900 mb-1">{f.title}</h4>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
