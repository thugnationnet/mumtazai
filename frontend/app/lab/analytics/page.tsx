'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  Sparkles,
  Clock,
  Zap,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Get API base URL - use main domain for analytics
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://onelastai.co'

interface ExperimentStat {
  id: string
  name: string
  tests: number
  activeUsers: number
  avgDuration: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  color: string
}

interface RealtimeData {
  totalUsers: number
  labActiveUsers: number
  activeExperiments: number
  testsToday: number
  totalTestsAllTime: number
  avgSessionTime: string
}

interface ActivityItem {
  user: string
  action: string
  experiment: string
  time: string
  color: string
}

export default function AnalyticsPage() {
  const [realtimeData, setRealtimeData] = useState<RealtimeData>({
    totalUsers: 0,
    labActiveUsers: 0,
    activeExperiments: 10,
    testsToday: 0,
    totalTestsAllTime: 0,
    avgSessionTime: '0m 00s'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [experimentStats, setExperimentStats] = useState<ExperimentStat[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])

  // Fetch real-time stats from API
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/analytics/lab/stats`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setRealtimeData(result.data.realtime)
        setExperimentStats(result.data.experiments)
        setLastUpdated(new Date(result.data.timestamp))
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching lab stats:', err)
      setError('Unable to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch activity feed
  const fetchActivity = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/analytics/lab/activity?limit=10`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) return
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setActivityFeed(result.data)
      }
    } catch (err) {
      console.error('Error fetching activity:', err)
    }
  }, [])

  // Initial load and real-time polling
  useEffect(() => {
    fetchStats()
    fetchActivity()
    
    // Poll every 3 seconds for real-time updates
    const statsInterval = setInterval(fetchStats, 3000)
    const activityInterval = setInterval(fetchActivity, 5000)

    return () => {
      clearInterval(statsInterval)
      clearInterval(activityInterval)
    }
  }, [fetchStats, fetchActivity])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <ArrowUp className="w-4 h-4" />
    if (trend === 'down') return <ArrowDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-green-400'
    if (trend === 'down') return 'text-red-400'
    return 'text-gray-400'
  }

  // Calculate max tests for progress bar scaling
  const maxTests = Math.max(...experimentStats.map(s => s.tests), 1)

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
              <BarChart3 className="w-12 h-12 text-white" />
              <h1 className="text-5xl font-bold text-white">
                Real-time Analytics
              </h1>
            </div>
            <p className="text-xl text-blue-100">
              Live statistics and usage data for all AI Lab experiments
            </p>
            
            {/* Live Indicator */}
            <div className="flex items-center gap-4 mt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full border border-white/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 text-sm font-semibold">LIVE</span>
                <span className="text-blue-100 text-sm">Updates every 3 seconds</span>
              </div>
              {lastUpdated && (
                <span className="text-xs text-blue-200">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={fetchStats}
              className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Real-time Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-cyan-500" />
              <motion.div
                key={realtimeData.totalUsers}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-xs text-cyan-500 font-semibold"
              >
                LIVE
              </motion.div>
            </div>
            <motion.div
              key={realtimeData.totalUsers}
              initial={{ scale: 1.1, color: '#22d3ee' }}
              animate={{ scale: 1, color: '#111827' }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold mb-2 text-gray-900"
            >
              {realtimeData.totalUsers.toLocaleString()}
            </motion.div>
            <div className="text-sm text-gray-600">Active Users Now</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-yellow-500" />
              <div className="text-xs text-green-500 font-semibold flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> 12%
              </div>
            </div>
            <motion.div
              key={realtimeData.testsToday}
              initial={{ scale: 1.1, color: '#facc15' }}
              animate={{ scale: 1, color: '#111827' }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold mb-2 text-gray-900"
            >
              {realtimeData.testsToday.toLocaleString()}
            </motion.div>
            <div className="text-sm text-gray-600">Tests Today</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-purple-500" />
              <div className="text-xs text-purple-500 font-semibold">ALL</div>
            </div>
            <div className="text-4xl font-bold mb-2 text-gray-900">{realtimeData.activeExperiments}</div>
            <div className="text-sm text-gray-600">Active Experiments</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-pink-500" />
              <div className="text-xs text-gray-500 font-semibold">AVG</div>
            </div>
            <div className="text-4xl font-bold mb-2 text-gray-900">{realtimeData.avgSessionTime}</div>
            <div className="text-sm text-gray-600">Session Duration</div>
          </motion.div>
        </div>

        {/* Popular Experiments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-900">Most Popular Experiments</h2>
          </div>

          <div className="space-y-4">
            {loading && experimentStats.length === 0 ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-32" />
                    </div>
                  </div>
                </div>
              ))
            ) : experimentStats.length === 0 ? (
              <div className="text-center text-gray-500 py-12 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No experiments tracked yet</p>
                <p className="text-sm mt-2">Run some AI Lab experiments to see analytics here!</p>
              </div>
            ) : (
              experimentStats.map((stat, index) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:border-gray-300 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Rank & Name */}
                  <div className="flex items-center gap-4 flex-1 min-w-[250px]">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl font-bold text-white`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{stat.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{stat.tests.toLocaleString()} total tests</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-8">
                    {/* Active Users */}
                    <div className="text-center">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-cyan-500" />
                        <motion.span
                          key={stat.activeUsers}
                          initial={{ scale: 1.2, color: '#22d3ee' }}
                          animate={{ scale: 1, color: '#111827' }}
                          transition={{ duration: 0.3 }}
                          className="text-2xl font-bold text-gray-900"
                        >
                          {stat.activeUsers}
                        </motion.span>
                      </div>
                      <div className="text-xs text-gray-500">Active Now</div>
                    </div>

                    {/* Avg Duration */}
                    <div className="text-center">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-2xl font-bold text-gray-900">{stat.avgDuration}</span>
                      </div>
                      <div className="text-xs text-gray-500">Avg Duration</div>
                    </div>

                    {/* Trend */}
                    <div className="text-center">
                      <div className={`flex items-center gap-1 mb-1 ${getTrendColor(stat.trend)}`}>
                        {getTrendIcon(stat.trend)}
                        <span className="text-2xl font-bold">{Math.abs(stat.trendValue)}%</span>
                      </div>
                      <div className="text-xs text-gray-500">24h Trend</div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.tests / maxTests) * 100}%` }}
                      transition={{ duration: 1, delay: 0.8 + index * 0.05 }}
                      className={`h-full bg-gradient-to-r ${stat.color}`}
                    />
                  </div>
                </div>
              </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Real-time Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-green-500" />
            <h2 className="text-3xl font-bold text-gray-900">Live Activity Stream</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2" />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityFeed.length > 0 ? (
              activityFeed.map((activity, index) => (
                <motion.div
                  key={`${activity.user}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.action === 'started' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`} />
                    <span className="text-gray-700">{activity.user}</span>
                    <span className="text-gray-500">{activity.action}</span>
                    <span className={`font-semibold ${activity.color}`}>{activity.experiment}</span>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading activity...</span>
                  </div>
                ) : (
                  <p>No recent activity. Run some experiments to see activity here!</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
