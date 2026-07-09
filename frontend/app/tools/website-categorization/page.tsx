'use client'

import { useState } from 'react'
import { ArrowLeft, Tag, Loader2, XCircle, Globe, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface CategoryData {
  domain: string
  categories: string[]
  tier1: string
  tier2: string[]
  description: string
}

export default function WebsiteCategorizationPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<CategoryData | null>(null)

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domain.trim()) {
      setError('Please enter a domain or URL')
      return
    }

    setLoading(true)
    setError('')
    setData(null)

    try {
      const response = await fetch('/api/tools/website-categorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() })
      })
      const result = await response.json()
      if (!result.success) {
        setError(result.error || 'Failed to categorize website')
        return
      }
      setData(result.data)
    } catch (err: any) {
      setError('An error occurred while categorizing the website')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Network Tools
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <Tag className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Website <span className="text-blue-100">Categorization</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Automatically classify websites into content categories
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Search Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleCheck} className="relative">
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
              <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter domain (e.g., amazon.com)"
                className="w-full pl-12 pr-36 py-4 bg-white border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-0 transition-all outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !domain.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:from-gray-400 disabled:to-gray-400 rounded-lg font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Tag className="w-4 h-4" />Categorize</>}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {data && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Domain</h2>
              </div>
              <p className="text-2xl font-mono text-gray-900">{data.domain}</p>
              {data.description && <p className="text-gray-600 mt-2">{data.description}</p>}
            </div>

            {data.tier1 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Primary Category
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{data.tier1}</div>
                </div>
              </div>
            )}

            {data.tier2 && data.tier2.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-500" />
                  Secondary Categories
                </h3>
                <div className="flex flex-wrap gap-3">
                  {data.tier2.map((category, index) => (
                    <div key={index} className="px-4 py-2 bg-blue-100 border border-blue-200 rounded-lg text-blue-800 font-medium">
                      {category}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.categories && data.categories.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {data.categories.map((category, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-700">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!data && !loading && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About Website Categorization</h3>
              <div className="space-y-3 text-gray-600">
                <p>Automatically classify websites into content categories. Perfect for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Content filtering and parental controls</li>
                  <li>Market research and competitive analysis</li>
                  <li>Ad targeting and brand safety</li>
                  <li>Network security policies</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
