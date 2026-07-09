'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Brain, MessageSquare, TrendingUp, RefreshCw } from 'lucide-react'

export default function PersonalityMirrorPage() {
  const [text, setText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [stats, setStats] = useState({ activeUsers: 0, totalAnalyzed: 0 })

  // Fetch real-time stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/lab/personality-analysis?stats=true')
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
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAnalyze = async () => {
    if (!text.trim()) {
      alert('Please provide a writing sample')
      return
    }
    
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/lab/personality-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ writingSample: text })
      })

      if (!response.ok) {
        throw new Error('Personality analysis failed')
      }

      const data = await response.json()
      
      // Format the analysis to match our UI
      const formattedResults = {
        personality: data.analysis.personalityType,
        traits: [
          { name: 'Openness', score: data.analysis.traits.openness, color: 'from-purple-500 to-pink-500' },
          { name: 'Conscientiousness', score: data.analysis.traits.conscientiousness, color: 'from-blue-500 to-cyan-500' },
          { name: 'Extraversion', score: data.analysis.traits.extraversion, color: 'from-green-500 to-emerald-500' },
          { name: 'Agreeableness', score: data.analysis.traits.agreeableness, color: 'from-yellow-500 to-orange-500' },
          { name: 'Emotional Stability', score: data.analysis.traits.emotionalStability, color: 'from-red-500 to-pink-500' }
        ],
        communication: data.analysis.communicationStyle,
        strengths: data.analysis.strengths,
        suggestions: data.analysis.growthAreas
      }
      
      setResults(formattedResults)
    } catch (error) {
      console.error('Personality analysis error:', error)
      alert('Personality analysis failed. Please try again.')
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
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
                <User className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white">
                  Personality Mirror
                </h1>
                <p className="text-xl text-blue-100 mt-2">
                  Discover your communication style and personality traits
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-blue-100">{stats.activeUsers} users active</span>
              </div>
              <div className="text-sm text-blue-200">•</div>
              <div className="text-sm text-blue-100">{stats.totalAnalyzed.toLocaleString()} analyses completed</div>
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
              <MessageSquare className="w-6 h-6 text-teal-500" />
              Your Writing Sample
            </label>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a few paragraphs about yourself, your thoughts, or respond to a prompt... The more you write, the more accurate the analysis!"
              className="w-full h-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors resize-none mb-6"
            />

            <button
              onClick={handleAnalyze}
              disabled={!text.trim() || isAnalyzing}
              className="w-full py-4 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl font-semibold text-lg text-white hover:shadow-lg shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Analyze Personality
                </>
              )}
            </button>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
              <strong>💡 Tip:</strong> Write naturally! The AI analyzes your word choice, sentence structure, and expression patterns to understand your personality.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Brain className="w-6 h-6 text-cyan-500" />
              Your Personality Profile
            </h2>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-16 h-16 text-teal-500 animate-spin mb-4" />
                <p className="text-lg font-semibold text-gray-900">Analyzing your personality...</p>
                <p className="text-sm text-gray-500 mt-2">Processing linguistic patterns</p>
              </div>
            ) : results ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 bg-teal-50 border border-teal-200 rounded-xl text-center">
                  <User className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-gray-900">{results.personality}</div>
                  <div className="text-sm text-gray-600 mt-1">{results.communication}</div>
                </div>

                <div>
                  <div className="text-lg font-semibold mb-4 text-gray-900">Personality Traits</div>
                  <div className="space-y-4">
                    {results.traits.map((trait: any, i: number) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{trait.name}</span>
                          <span className="text-sm text-gray-500">{trait.score}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${trait.score}%` }}
                            transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
                            className={`h-full bg-gradient-to-r ${trait.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-lg font-semibold mb-3 text-gray-900">Key Strengths</div>
                  <div className="flex flex-wrap gap-2">
                    {results.strengths.map((strength: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-teal-50 border border-teal-200 rounded-full text-sm text-teal-700">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-900">
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                    Growth Suggestions
                  </div>
                  <ul className="space-y-2">
                    {results.suggestions.map((suggestion: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-cyan-500 mt-0.5">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <User className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center px-4">Your personality analysis will appear here</p>
                <p className="text-sm mt-2">Write something and click Analyze</p>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  )
}
