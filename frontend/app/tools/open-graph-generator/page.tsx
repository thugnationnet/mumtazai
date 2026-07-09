'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Share2, ArrowLeft, Copy, Check, Eye, Download, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface OgTags {
  title: string
  description: string
  url: string
  image: string
  siteName: string
  type: string
  twitterCard: string
  twitterSite: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
  locale: string
  imageWidth: string
  imageHeight: string
  articleAuthor: string
  articleSection: string
}

const PRESETS = [
  { label: 'Blog Post', data: { type: 'article', twitterCard: 'summary_large_image', title: 'My Blog Post Title', description: 'A compelling description of the blog post content', siteName: 'My Blog', articleAuthor: 'Author Name', articleSection: 'Technology' } },
  { label: 'Product Page', data: { type: 'product', twitterCard: 'summary_large_image', title: 'Product Name - Brand', description: 'High-quality product description with key features', siteName: 'My Store' } },
  { label: 'Homepage', data: { type: 'website', twitterCard: 'summary_large_image', title: 'My Website - Tagline', description: 'Brief description of what your website offers', siteName: 'My Website' } },
  { label: 'Video', data: { type: 'video.other', twitterCard: 'player', title: 'Video Title', description: 'Description of the video content', siteName: 'My Video Site' } },
]

const TYPES = ['website', 'article', 'profile', 'book', 'product', 'music.song', 'music.album', 'video.movie', 'video.episode', 'video.other', 'place', 'business.business']

export default function OpenGraphGeneratorPage() {
  const [tags, setTags] = useState<OgTags>({
    title: '', description: '', url: '', image: '', siteName: '',
    type: 'website', twitterCard: 'summary_large_image', twitterSite: '',
    twitterTitle: '', twitterDescription: '', twitterImage: '', locale: 'en_US',
    imageWidth: '1200', imageHeight: '630', articleAuthor: '', articleSection: '',
  })
  const [copied, setCopied] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const update = (key: keyof OgTags, value: string) => setTags(prev => ({ ...prev, [key]: value }))

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setTags(prev => ({ ...prev, ...preset.data }))
  }

  const generateCode = (): string => {
    const lines: string[] = ['<!-- Open Graph Meta Tags -->']
    if (tags.title) lines.push(`<meta property="og:title" content="${tags.title}" />`)
    if (tags.description) lines.push(`<meta property="og:description" content="${tags.description}" />`)
    if (tags.url) lines.push(`<meta property="og:url" content="${tags.url}" />`)
    if (tags.image) {
      lines.push(`<meta property="og:image" content="${tags.image}" />`)
      if (tags.imageWidth) lines.push(`<meta property="og:image:width" content="${tags.imageWidth}" />`)
      if (tags.imageHeight) lines.push(`<meta property="og:image:height" content="${tags.imageHeight}" />`)
    }
    if (tags.siteName) lines.push(`<meta property="og:site_name" content="${tags.siteName}" />`)
    if (tags.type) lines.push(`<meta property="og:type" content="${tags.type}" />`)
    if (tags.locale) lines.push(`<meta property="og:locale" content="${tags.locale}" />`)
    if (tags.type === 'article') {
      if (tags.articleAuthor) lines.push(`<meta property="article:author" content="${tags.articleAuthor}" />`)
      if (tags.articleSection) lines.push(`<meta property="article:section" content="${tags.articleSection}" />`)
    }
    lines.push('')
    lines.push('<!-- Twitter Card Meta Tags -->')
    if (tags.twitterCard) lines.push(`<meta name="twitter:card" content="${tags.twitterCard}" />`)
    if (tags.twitterSite) lines.push(`<meta name="twitter:site" content="${tags.twitterSite}" />`)
    lines.push(`<meta name="twitter:title" content="${tags.twitterTitle || tags.title}" />`)
    lines.push(`<meta name="twitter:description" content="${tags.twitterDescription || tags.description}" />`)
    if (tags.twitterImage || tags.image) lines.push(`<meta name="twitter:image" content="${tags.twitterImage || tags.image}" />`)
    return lines.join('\n')
  }

  const code = generateCode()

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const download = () => {
    const blob = new Blob([code], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'og-meta-tags.html'; a.click()
    URL.revokeObjectURL(url)
  }

  const titleLen = tags.title.length
  const descLen = tags.description.length

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
                <Share2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Open Graph <span className="text-blue-100">Generator</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Generate Open Graph and Twitter Card meta tags for your pages</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-5xl mx-auto">
          {/* Presets */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase self-center mr-1">Presets:</span>
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)} className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors shadow-sm">{p.label}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Open Graph</h3>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-gray-700">Title</label>
                    <span className={`text-xs ${titleLen > 60 ? 'text-red-500 font-semibold' : titleLen > 50 ? 'text-amber-500' : 'text-gray-400'}`}>{titleLen}/60</span>
                  </div>
                  <input type="text" value={tags.title} onChange={(e) => update('title', e.target.value)} placeholder="My Awesome Page" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <span className={`text-xs ${descLen > 160 ? 'text-red-500 font-semibold' : descLen > 140 ? 'text-amber-500' : 'text-gray-400'}`}>{descLen}/160</span>
                  </div>
                  <textarea value={tags.description} onChange={(e) => update('description', e.target.value)} placeholder="A brief description of your page" rows={2} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                {[
                  { key: 'url' as const, label: 'URL', placeholder: 'https://example.com/page' },
                  { key: 'image' as const, label: 'Image URL', placeholder: 'https://example.com/image.jpg' },
                  { key: 'siteName' as const, label: 'Site Name', placeholder: 'My Website' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
                    <input type="text" value={tags[f.key]} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <select value={tags.type} onChange={(e) => update('type', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Width</label>
                    <input type="text" value={tags.imageWidth} onChange={(e) => update('imageWidth', e.target.value)} placeholder="1200" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Height</label>
                    <input type="text" value={tags.imageHeight} onChange={(e) => update('imageHeight', e.target.value)} placeholder="630" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                </div>
                {tags.type === 'article' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Author</label>
                      <input type="text" value={tags.articleAuthor} onChange={(e) => update('articleAuthor', e.target.value)} placeholder="Author name" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Section</label>
                      <input type="text" value={tags.articleSection} onChange={(e) => update('articleSection', e.target.value)} placeholder="Technology" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Twitter Card</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Card Type</label>
                    <select value={tags.twitterCard} onChange={(e) => update('twitterCard', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      {['summary', 'summary_large_image', 'app', 'player'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">@Site Handle</label>
                    <input type="text" value={tags.twitterSite} onChange={(e) => update('twitterSite', e.target.value)} placeholder="@yoursite" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Twitter fields default to OG values if left empty.</p>
              </div>
            </div>

            {/* Preview + Code */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />Social Preview</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {tags.image && <div className="h-40 bg-gray-100 bg-cover bg-center" style={{ backgroundImage: `url(${tags.image})` }} />}
                  <div className="p-3">
                    <p className="text-xs text-gray-400 uppercase">{tags.siteName || 'example.com'}</p>
                    <p className="font-semibold text-gray-900 text-sm">{tags.title || 'Page Title'}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{tags.description || 'Page description will appear here.'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Generated Code</h3>
                  <div className="flex gap-2">
                    <button onClick={copy} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={download} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                      <Download className="w-3.5 h-3.5" />Download
                    </button>
                  </div>
                </div>
                <pre className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">{code}</pre>
              </div>

              {/* Info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
                <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />Best Practices</h3>
                  {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showInfo && (
                  <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { title: 'Title Length', desc: 'Keep titles under 60 characters. Facebook truncates at ~88 chars, Twitter at ~70.' },
                      { title: 'Description', desc: 'Aim for 150-160 characters. This appears in social cards and search results.' },
                      { title: 'Image Size', desc: 'Use 1200x630px for best results. Minimum 600x315px. Keep under 8MB.' },
                      { title: 'Testing', desc: 'Use Facebook Sharing Debugger and Twitter Card Validator to preview your tags.' },
                    ].map(c => (
                      <div key={c.title} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="font-semibold text-gray-900 text-sm">{c.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{c.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
