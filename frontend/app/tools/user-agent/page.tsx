'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Monitor, ArrowLeft, Copy, Check, RefreshCw, Smartphone, Laptop, Tablet, ChevronDown, ChevronUp, Info, Download } from 'lucide-react'

interface UAInfo {
  raw: string
  browser: string
  version: string
  os: string
  platform: string
  mobile: boolean
  language: string
  cookiesEnabled: boolean
  screenResolution: string
  windowSize: string
  colorDepth: number
  touchscreen: boolean
  online: boolean
  doNotTrack: string
  hardwareConcurrency: number
  deviceMemory: string
  connectionType: string
}

function parseUA(): UAInfo {
  const ua = navigator.userAgent
  let browser = 'Unknown', version = '', os = 'Unknown'

  if (/Edg\//.test(ua)) { browser = 'Microsoft Edge'; version = ua.match(/Edg\/([\d.]+)/)?.[1] || '' }
  else if (/OPR\//.test(ua)) { browser = 'Opera'; version = ua.match(/OPR\/([\d.]+)/)?.[1] || '' }
  else if (/Brave/.test(ua)) { browser = 'Brave'; version = ua.match(/Chrome\/([\d.]+)/)?.[1] || '' }
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) { browser = 'Google Chrome'; version = ua.match(/Chrome\/([\d.]+)/)?.[1] || '' }
  else if (/Firefox\//.test(ua)) { browser = 'Firefox'; version = ua.match(/Firefox\/([\d.]+)/)?.[1] || '' }
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) { browser = 'Safari'; version = ua.match(/Version\/([\d.]+)/)?.[1] || '' }

  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11'
  else if (/Windows/.test(ua)) os = 'Windows'
  else if (/Mac OS X (\d+[._]\d+)/.test(ua)) { const v = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace(/_/g, '.'); os = `macOS ${v}` }
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Android ([\d.]+)/.test(ua)) os = `Android ${ua.match(/Android ([\d.]+)/)?.[1]}`
  else if (/Linux/.test(ua)) os = 'Linux'
  else if (/iPhone|iPad/.test(ua)) { const v = ua.match(/OS (\d+_\d+)/)?.[1]?.replace(/_/g, '.'); os = `iOS ${v || ''}` }

  const nav = navigator as any
  return {
    raw: ua,
    browser, version, os,
    platform: navigator.platform || 'Unknown',
    mobile: /Mobi|Android/i.test(ua),
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    screenResolution: `${screen.width} × ${screen.height}`,
    windowSize: `${window.innerWidth} × ${window.innerHeight}`,
    colorDepth: screen.colorDepth,
    touchscreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    online: navigator.onLine,
    doNotTrack: navigator.doNotTrack || 'unset',
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory ? `${nav.deviceMemory} GB` : 'N/A',
    connectionType: nav.connection?.effectiveType || 'N/A',
  }
}

const COMMON_UAS = [
  { label: 'Chrome (Windows)', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  { label: 'Safari (macOS)', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' },
  { label: 'Firefox (Linux)', ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0' },
  { label: 'iPhone Safari', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
  { label: 'Googlebot', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
  { label: 'Bingbot', ua: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' },
]

export default function UserAgentPage() {
  const [info, setInfo] = useState<UAInfo | null>(null)
  const [copied, setCopied] = useState('')
  const [showCommon, setShowCommon] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const detect = () => setInfo(parseUA())
  useEffect(() => { detect() }, [])

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1200)
  }

  const exportAll = () => {
    if (!info) return
    const txt = `User Agent: ${info.raw}\n\nBrowser: ${info.browser} ${info.version}\nOS: ${info.os}\nPlatform: ${info.platform}\nMobile: ${info.mobile ? 'Yes' : 'No'}\nLanguage: ${info.language}\nCookies: ${info.cookiesEnabled ? 'Enabled' : 'Disabled'}\nScreen: ${info.screenResolution}\nWindow: ${info.windowSize}\nColor Depth: ${info.colorDepth}-bit\nTouchscreen: ${info.touchscreen ? 'Yes' : 'No'}\nOnline: ${info.online ? 'Yes' : 'No'}\nDo Not Track: ${info.doNotTrack}\nCPU Cores: ${info.hardwareConcurrency}\nDevice Memory: ${info.deviceMemory}\nConnection: ${info.connectionType}`
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'user-agent-info.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const DeviceIcon = info?.mobile ? Smartphone : info?.touchscreen ? Tablet : Laptop

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
                <Monitor className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">What Is My <span className="text-blue-100">User Agent</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">View your browser fingerprint, device info, and system details</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {info && (
            <>
              {/* UA String Hero */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Your User Agent String</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copy(info.raw, 'ua')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                      {copied === 'ua' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}Copy
                    </button>
                    <button onClick={detect} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                      <RefreshCw className="w-3.5 h-3.5" />Refresh
                    </button>
                    <button onClick={exportAll} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                      <Download className="w-3.5 h-3.5" />Export
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-sm text-gray-900 break-all leading-relaxed">{info.raw}</div>
              </div>

              {/* Device Summary Card */}
              <div className="bg-gradient-to-r from-brand-50 to-accent-50 rounded-2xl border border-brand-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border border-brand-200">
                    <DeviceIcon className="w-7 h-7 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{info.browser} {info.version}</h2>
                    <p className="text-gray-600">{info.os} • {info.mobile ? 'Mobile' : 'Desktop'} • {info.language}</p>
                  </div>
                </div>
              </div>

              {/* System Details - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Browser & Network */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Monitor className="w-4 h-4 text-brand-600" />Browser & Network</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Browser', value: `${info.browser} ${info.version}` },
                      { label: 'Language', value: info.language },
                      { label: 'Cookies', value: info.cookiesEnabled ? '✓ Enabled' : '✗ Disabled' },
                      { label: 'Do Not Track', value: info.doNotTrack === '1' ? '✓ Enabled' : info.doNotTrack === '0' ? '✗ Disabled' : 'Unset' },
                      { label: 'Online', value: info.online ? '✓ Online' : '✗ Offline' },
                      { label: 'Connection', value: info.connectionType },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 group cursor-pointer" onClick={() => copy(row.value, row.label)}>
                        <span className="text-sm text-gray-500">{row.label}</span>
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device & Display */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Laptop className="w-4 h-4 text-brand-600" />Device & Display</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Platform', value: info.platform },
                      { label: 'OS', value: info.os },
                      { label: 'Mobile', value: info.mobile ? 'Yes' : 'No' },
                      { label: 'Screen', value: info.screenResolution },
                      { label: 'Window', value: info.windowSize },
                      { label: 'Color Depth', value: `${info.colorDepth}-bit` },
                      { label: 'Touchscreen', value: info.touchscreen ? 'Yes' : 'No' },
                      { label: 'CPU Cores', value: info.hardwareConcurrency.toString() },
                      { label: 'Device Memory', value: info.deviceMemory },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 group cursor-pointer" onClick={() => copy(row.value, row.label)}>
                        <span className="text-sm text-gray-500">{row.label}</span>
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Common User Agents */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
                <button onClick={() => setShowCommon(!showCommon)} className="w-full flex items-center justify-between p-6">
                  <h3 className="text-sm font-semibold text-gray-700">Common User Agent Strings</h3>
                  {showCommon ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showCommon && (
                  <div className="px-6 pb-6 space-y-2">
                    {COMMON_UAS.map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                          <button onClick={() => copy(item.ua, item.label)} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                            {copied === item.label ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}Copy
                          </button>
                        </div>
                        <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">{item.ua}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
                <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />About User Agents</h3>
                  {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showInfo && (
                  <div className="px-6 pb-6 text-sm text-gray-600 space-y-2">
                    <p>A User Agent string identifies your browser, operating system, and device to websites. It&apos;s sent with every HTTP request as the <code className="bg-gray-100 px-1 rounded text-xs">User-Agent</code> header.</p>
                    <p>Websites use this to serve optimized content, but it&apos;s also a fingerprinting vector. Modern browsers are reducing UA detail via Client Hints (UA-CH) for privacy.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
