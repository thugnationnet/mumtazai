'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Brain, Moon, Sparkles, Eye, RefreshCw } from 'lucide-react'

export default function DreamInterpreterPage() {
  const [dream, setDream] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [stats, setStats] = useState({ activeUsers: 0, totalAnalyzed: 0 })

  // Fetch real-time stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/lab/dream-analysis?stats=true')
        if (response.ok) {
          const data = await response.json()
          setStats({
            activeUsers: data.activeUsers || 0,
            totalAnalyzed: data.totalAnalyzed || 0
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAnalyze = async () => {
    if (!dream.trim()) {
      alert('Please describe your dream')
      return
    }
    
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/lab/dream-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream })
      })

      if (!response.ok) {
        throw new Error('Dream analysis failed')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Dream analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-600 to-accent-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>
        <div className="container mx-auto px-4 py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/lab" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-6">
              <span>←</span> Back to AI Lab
            </Link>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/25">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white">
                  Dream Interpreter
                </h1>
                <p className="text-xl text-blue-100 mt-2">
                  Analyze dreams and discover patterns in your subconscious
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-blue-100">{stats.activeUsers.toLocaleString()} users active</span>
              </div>
              <div className="text-sm text-blue-200">•</div>
              <div className="text-sm text-blue-100">{stats.totalAnalyzed.toLocaleString()} dreams analyzed</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <label className="text-2xl font-bold mb-6 block flex items-center gap-2 text-gray-900">
              <Moon className="w-6 h-6 text-violet-500" />
              Describe Your Dream
            </label>

            <textarea
              value={dream}
              onChange={(e) => setDream(e.target.value)}
              placeholder="Describe your dream in as much detail as you can remember... What did you see? How did you feel? What happened?"
              className="w-full h-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors resize-none mb-6"
            />

            <button
              onClick={handleAnalyze}
              disabled={!dream.trim() || isAnalyzing}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-semibold text-lg text-white hover:shadow-lg shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing Dream...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Interpret My Dream
                </>
              )}
            </button>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
              <strong>💡 Tip:</strong> The more details you provide, the more accurate the interpretation. Include emotions, colors, people, and locations.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Eye className="w-6 h-6 text-purple-500" />
              Dream Analysis
            </h2>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-16 h-16 text-violet-500 animate-spin mb-4" />
                <p className="text-lg font-semibold text-gray-900">Interpreting your dream...</p>
                <p className="text-sm text-gray-500 mt-2">Analyzing symbols and patterns</p>
              </div>
            ) : analysis ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-4 bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 rounded-xl">
                  <div className="text-sm text-violet-600 mb-1">Main Theme</div>
                  <div className="text-xl font-bold text-gray-900">{analysis.mainTheme}</div>
                </div>

                <div>
                  <div className="text-lg font-semibold mb-3 text-gray-900">Detected Emotions</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.emotions.map((emotion: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-purple-100 border border-purple-200 rounded-full text-sm text-purple-700">
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-lg font-semibold mb-3 text-gray-900">Key Symbols</div>
                  <div className="space-y-3">
                    {analysis.symbols.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="font-semibold text-violet-600">{item.symbol}</div>
                        <div className="text-sm text-gray-600 mt-1">{item.meaning}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-lg font-semibold mb-2 text-gray-900">Interpretation</div>
                  <p className="text-gray-600 text-sm leading-relaxed">{analysis.interpretation}</p>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Brain className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center px-4">Your dream analysis will appear here</p>
                <p className="text-sm mt-2">Enter your dream and click Interpret</p>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  )
}
