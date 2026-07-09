'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingUp, Zap, Activity, Clock, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
  overview: {
    totalRequests: number
    avgResponseTime: number
    successRate: number
    requestsGrowth: number
  }
  agents: Array<{
    name: string
    requests: number
    users: number
    avgResponseTime: number
    successRate: number
    trend: 'up' | 'down' | 'stable'
  }>
  tools: Array<{
    name: string
    usage: number
    users: number
    avgDuration: number
    trend: 'up' | 'down' | 'stable'
  }>
  hourlyData: Array<{
    hour: string
    requests: number
    users: number
  }>
  topAgents: Array<{
    name: string
    requests: number
    percentage: number
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/status/analytics?timeRange=${timeRange}`)
      const data = await response.json()
      setData(data)
      setIsLoading(false)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setIsLoading(false)
    }
  }, [timeRange, setData, setIsLoading, setLastUpdate])

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [timeRange, fetchAnalytics])

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-2 border-b-2 border-brand-600"></div>
          <p className="text-neural-800 text-base md:text-lg font-medium">Loading Analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Real-Time Analytics
          </h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-6">
            Comprehensive insights into platform performance and usage
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6">
            <Link
              href="/status"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-600 hover:bg-gray-100 font-semibold rounded-lg transition-all w-full sm:w-auto"
            >
              <Activity className="w-5 h-5" />
              Status Dashboard
            </Link>
            <Link
              href="/status/api-status"
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-white text-white hover:bg-white/10 font-semibold rounded-lg transition-all w-full sm:w-auto"
            >
              <Zap className="w-5 h-5" />
              API Status
            </Link>
          </div>
          {/* Time Range Selector */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-white text-brand-600 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-custom max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 border border-neural-200 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-brand-600" />
              <div className={`flex items-center gap-1 text-sm ${data.overview.requestsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.overview.requestsGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {Math.abs(data.overview.requestsGrowth).toFixed(1)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-700 mb-2">{data.overview.totalRequests.toLocaleString()}</div>
            <p className="text-sm text-neural-600">Total Requests</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neural-200 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-700 mb-2">{data.overview.avgResponseTime}ms</div>
            <p className="text-sm text-neural-600">Avg Response Time</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neural-200 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-green-600" />
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-700 mb-2">{data.overview.successRate.toFixed(2)}%</div>
            <p className="text-sm text-neural-600">Success Rate</p>
          </div>
        </div>

        {/* Hourly Traffic Chart */}
        <div className="bg-white rounded-2xl p-6 border border-neural-200 shadow-sm hover:shadow-md mb-12">
          <h3 className="text-2xl font-bold mb-6">24-Hour Traffic Pattern</h3>
          <div className="h-80 flex items-end justify-between gap-1">
            {data.hourlyData.map((hour, i) => {
              const maxRequests = Math.max(...data.hourlyData.map(h => h.requests))
              const height = (hour.requests / maxRequests) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                      style={{ height: `${height * 3}px` }}
                    />
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-neural-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
                      <div className="font-bold mb-1">{hour.hour}</div>
                      <div>{hour.requests.toLocaleString()} requests</div>
                      <div className="text-brand-300">{hour.users} users</div>
                    </div>
                  </div>
                  {i % 3 === 0 && <span className="text-xs text-neural-600">{hour.hour}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Agents Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 border border-neural-200 shadow-sm hover:shadow-md">
            <h3 className="text-2xl font-bold mb-6">Top Performing Agents</h3>
            <div className="space-y-4">
              {data.topAgents.map((agent, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{agent.name}</span>
                    <span className="text-neural-600">{agent.requests.toLocaleString()} requests</span>
                  </div>
                  <div className="h-3 bg-neural-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
                      style={{ width: `${agent.percentage * 5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools Usage */}
          <div className="bg-white rounded-2xl p-6 border border-neural-200 shadow-sm hover:shadow-md">
            <h3 className="text-2xl font-bold mb-6">Tools Usage</h3>
            <div className="space-y-4">
              {data.tools.map((tool, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white rounded-lg border border-neural-200">
                  <div>
                    <h4 className="font-semibold mb-1">{tool.name}</h4>
                    <p className="text-sm text-neural-600">{tool.users} active users</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-brand-700">{tool.usage.toLocaleString()}</div>
                    <div className={`flex items-center gap-1 text-sm ${
                      tool.trend === 'up' ? 'text-green-600' : tool.trend === 'down' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {tool.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : tool.trend === 'down' ? <ArrowDown className="w-4 h-4" /> : '−'}
                      {tool.trend === 'up' ? 'Rising' : tool.trend === 'down' ? 'Falling' : 'Stable'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agents Performance Table */}
        <div className="bg-white rounded-2xl p-6 border border-neural-200 shadow-sm hover:shadow-md">
          <h3 className="text-2xl font-bold mb-6">All Agents Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neural-200 shadow-sm">
                  <th className="text-left py-3 px-4 text-neural-700 font-semibold">Agent</th>
                  <th className="text-right py-3 px-4 text-neural-700 font-semibold">Requests</th>
                  <th className="text-right py-3 px-4 text-neural-700 font-semibold">Users</th>
                  <th className="text-right py-3 px-4 text-neural-700 font-semibold">Avg Response</th>
                  <th className="text-right py-3 px-4 text-neural-700 font-semibold">Success Rate</th>
                  <th className="text-center py-3 px-4 text-neural-700 font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.agents.map((agent, i) => (
                  <tr key={i} className="border-b border-neural-200 hover:bg-neural-100 transition-colors">
                    <td className="py-3 px-4 font-semibold capitalize">{agent.name.replace(/-/g, ' ')}</td>
                    <td className="py-3 px-4 text-right text-brand-700">{agent.requests.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-purple-700">{agent.users}</td>
                    <td className="py-3 px-4 text-right text-yellow-700">{agent.avgResponseTime}ms</td>
                    <td className="py-3 px-4 text-right text-green-700">{agent.successRate.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-center">
                      {agent.trend === 'up' ? (
                        <ArrowUp className="w-5 h-5 text-green-600 inline" />
                      ) : agent.trend === 'down' ? (
                        <ArrowDown className="w-5 h-5 text-red-600 inline" />
                      ) : (
                        <span className="text-yellow-600">−</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auto-refresh Notice */}
        <div className="mt-8 text-center">
          <p className="text-neural-600 text-sm">
            🔄 Auto-refreshing every 30 seconds • Last update: {lastUpdate.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
