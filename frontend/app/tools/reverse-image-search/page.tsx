'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Search, ArrowLeft, ExternalLink, Upload, Link2, ImageIcon, Info, ChevronDown, ChevronUp, X, Globe } from 'lucide-react'

const ENGINES = [
  { name: 'Google Lens', getUrl: (url: string) => `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}`, color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100', desc: 'Best for product identification, text extraction, landmarks' },
  { name: 'TinEye', getUrl: (url: string) => `https://tineye.com/search?url=${encodeURIComponent(url)}`, color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100', desc: 'Best for finding exact matches and image origins' },
  { name: 'Yandex Images', getUrl: (url: string) => `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(url)}`, color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100', desc: 'Best for faces, locations, and foreign content' },
  { name: 'Bing Visual', getUrl: (url: string) => `https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encodeURIComponent(url)}`, color: 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100', desc: 'Best for similar images and shopping results' },
  { name: 'Baidu Images', getUrl: (url: string) => `https://graph.baidu.com/details?isfromtus498&uptextimage_url=${encodeURIComponent(url)}`, color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100', desc: 'Best for content originating from Asia' },
]

export default function ReverseImageSearchPage() {
  const [tab, setTab] = useState<'url' | 'upload'>('url')
  const [imageUrl, setImageUrl] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; type: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', type: file.type })
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    setTab('upload')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const clearImage = () => {
    setPreview(null); setFileInfo(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const activeUrl = tab === 'url' ? imageUrl : ''
  const canSearch = tab === 'url' ? !!imageUrl.trim() : false

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
                <Search className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Reverse Image <span className="text-slate-500">Search</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Find where an image appears online using 5 search engines</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Input Section */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            {/* Tab Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button onClick={() => setTab('url')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                <Link2 className="w-4 h-4" />Image URL
              </button>
              <button onClick={() => setTab('upload')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                <Upload className="w-4 h-4" />Upload Image
              </button>
            </div>

            {tab === 'url' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Paste image URL</label>
                <input type="url" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {imageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 p-2">
                    <img src={imageUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
                {preview ? (
                  <div className="relative inline-block">
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <button onClick={(e) => { e.stopPropagation(); clearImage() }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">Drag & drop or click to upload</p>
                    <p className="text-xs mt-1">JPG, PNG, GIF, WebP — max 20MB</p>
                  </div>
                )}
              </div>
            )}

            {/* File Info */}
            {tab === 'upload' && fileInfo && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center gap-3 text-sm">
                <ImageIcon className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700">{fileInfo.name}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">{fileInfo.size}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">{fileInfo.type}</span>
              </div>
            )}

            {tab === 'upload' && preview && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <strong>Note:</strong> Uploaded images must be hosted online first (e.g., Imgur, Postimages) to use with search engines. Copy the hosted URL and switch to the URL tab.
              </div>
            )}
          </div>

          {/* Search Engines */}
          {canSearch && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Search Engines</h3>
              <p className="text-sm text-gray-500 mb-4">Click to open — try multiple for best coverage</p>
              <div className="space-y-3">
                {ENGINES.map(engine => (
                  <a key={engine.name} href={engine.getUrl(activeUrl)} target="_blank" rel="noopener noreferrer" className={`${engine.color} border rounded-xl p-4 flex items-center justify-between transition-colors block`}>
                    <div>
                      <span className="font-semibold text-sm">{engine.name}</span>
                      <p className="text-xs opacity-70 mt-0.5">{engine.desc}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                ))}
              </div>
              <button onClick={() => { ENGINES.forEach(e => window.open(e.getUrl(activeUrl), '_blank')) }} className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Globe className="w-5 h-5" />Open All 5 Engines
              </button>
            </div>
          )}

          {/* Tips & Info */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg">
            <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />Reverse Image Search Tips</h3>
              {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showInfo && (
              <div className="px-6 pb-6 space-y-3 text-sm text-gray-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { t: 'Use Multiple Engines', d: 'Each engine indexes differently. TinEye finds exact matches, Yandex is great for faces, Google recognizes objects.' },
                    { t: 'Crop to Focus', d: 'Crop your image to the relevant subject before searching to improve accuracy and reduce noise.' },
                    { t: 'Check Image Origins', d: 'TinEye can show the oldest indexed version of an image, helping identify the original source.' },
                    { t: 'High Resolution Helps', d: 'Use the highest resolution version available. Low-res thumbnails may not return useful results.' },
                  ].map(tip => (
                    <div key={tip.t} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="font-semibold text-gray-800 text-xs mb-1">{tip.t}</div>
                      <p className="text-xs leading-relaxed">{tip.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
