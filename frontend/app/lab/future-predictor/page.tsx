'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Zap, Target, Calendar, RefreshCw } from 'lucide-react'

export default function FuturePredictorPage() {
  const [topic, setTopic] = useState('')
  const [timeframe, setTimeframe] = useState('1-year')
  const [isPredicting, setIsPredicting] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)
  const [stats, setStats] = useState({ activeUsers: 0, totalPredictions: 0 })

  // Fetch real-time stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/lab/future-prediction?stats=true')
        if (response.ok) {
          const data = await response.json()
          setStats({
            activeUsers: data.activeUsers || 0,
            totalPredictions: data.totalPredictions || 0
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

  const timeframes = [
    { id: '6-months', label: '6 Months' },
    { id: '1-year', label: '1 Year' },
    { id: '3-years', label: '3 Years' },
    { id: '5-years', label: '5 Years' },
    { id: '10-years', label: '10 Years' }
  ]

  const exampleTopics = [
    'AI in healthcare',
    'Remote work trends',
    'Electric vehicles adoption',
    'Space exploration',
    'Cryptocurrency regulation',
    'Climate change solutions'
  ]

  const handlePredict = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic to predict')
      return
    }
    
    setIsPredicting(true)
    
    try {
      const response = await fetch('/api/lab/future-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          timeframe
        })
      })

      if (!response.ok) {
        throw new Error('Prediction failed')
      }

      const data = await response.json()
      
      // Format the prediction to match our UI
      const formattedPrediction = {
        confidence: data.prediction.confidence,
        trend: data.prediction.trend === 'rising' ? 'Rising' : data.prediction.trend === 'falling' ? 'Falling' : 'Stable',
        keyInsights: data.prediction.keyInsights,
        scenarios: data.prediction.scenarios.map((s: any) => ({
          type: s.name,
          probability: s.probability,
          description: s.description
        })),
        relatedTrends: data.prediction.relatedTrends
      }
      
      setPrediction(formattedPrediction)
    } catch (error) {
      console.error('Prediction error:', error)
      alert('Future prediction failed. Please try again.')
    } finally {
      setIsPredicting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass Pillars */}
        <div className="absolute top-0 left-[8%] w-24 h-full bg-gradient-to-b from-white/30 via-purple-200/20 to-transparent rounded-full blur-sm transform -skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[25%] w-16 h-full bg-gradient-to-b from-white/25 via-indigo-200/15 to-transparent rounded-full blur-sm transform skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[20%] w-20 h-full bg-gradient-to-b from-white/30 via-purple-100/20 to-transparent rounded-full blur-sm transform -skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[8%] w-14 h-full bg-gradient-to-b from-white/20 via-indigo-100/15 to-transparent rounded-full blur-sm transform skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[50%] w-12 h-full bg-gradient-to-b from-white/15 via-purple-200/10 to-transparent rounded-full blur-sm pointer-events-none" />
        {/* Chrome Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/lab" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-700 mb-6">
              <span>←</span> Back to AI Lab
            </Link>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                <TrendingUp className="w-12 h-12 text-purple-600" />
              </div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
                  Future Predictor
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Forecast trends and explore future scenarios with AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-600">{stats.activeUsers} users active</span>
              </div>
              <div className="text-sm text-slate-400">•</div>
              <div className="text-sm text-slate-600">{stats.totalPredictions.toLocaleString()} predictions made</div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg">
              <label className="text-lg font-semibold mb-4 block flex items-center gap-2 text-gray-900">
                <Target className="w-5 h-5 text-indigo-500" />
                What do you want to predict?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., AI in healthcare, remote work trends..."
                className="w-full bg-white/60 border border-white/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors mb-4"
              />
              
              <div className="text-sm text-gray-500 mb-2">Example topics:</div>
              <div className="flex flex-wrap gap-2">
                {exampleTopics.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setTopic(ex)}
                    className="text-xs px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 hover:border-indigo-300 transition-all text-gray-700"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg">
              <label className="text-lg font-semibold mb-4 block flex items-center gap-2 text-gray-900">
                <Calendar className="w-5 h-5 text-blue-500" />
                Timeframe
              </label>
              <div className="grid grid-cols-3 gap-3">
                {timeframes.map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setTimeframe(tf.id)}
                    className={`px-4 py-3 rounded-xl text-sm transition-all ${
                      timeframe === tf.id
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 border border-indigo-500 text-white'
                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePredict}
              disabled={!topic.trim() || isPredicting}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl font-semibold text-lg text-white hover:shadow-lg shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isPredicting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Predicting Future...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Generate Prediction
                </>
              )}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              Prediction Results
            </h2>

            {isPredicting ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
                <p className="text-lg font-semibold text-gray-900">Analyzing trends...</p>
                <p className="text-sm text-gray-500 mt-2">Processing data patterns</p>
              </div>
            ) : prediction ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                    <div className="text-3xl font-bold text-indigo-600">{prediction.confidence}%</div>
                    <div className="text-sm text-gray-600 mt-1">Confidence</div>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <div className="text-3xl font-bold text-green-600">↗</div>
                    <div className="text-sm text-gray-600 mt-1">{prediction.trend}</div>
                  </div>
                </div>

                <div>
                  <div className="text-lg font-semibold mb-3 text-gray-900">Key Insights</div>
                  <ul className="space-y-2">
                    {prediction.keyInsights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-lg font-semibold mb-3 text-gray-900">Future Scenarios</div>
                  <div className="space-y-3">
                    {prediction.scenarios.map((scenario: any, i: number) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{scenario.type}</span>
                          <span className="text-sm text-gray-500">{scenario.probability}% chance</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                            style={{ width: `${scenario.probability}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-lg font-semibold mb-3 text-gray-900">Related Trends</div>
                  <div className="flex flex-wrap gap-2">
                    {prediction.relatedTrends.map((trend: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700">
                        {trend}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <TrendingUp className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center px-4">Your prediction will appear here</p>
                <p className="text-sm mt-2">Enter a topic and timeframe</p>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  )
}
