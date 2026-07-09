'use client'

import { useState, useEffect } from 'react'
import { Zap, CheckCircle, XCircle, AlertTriangle, Clock, Activity, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface APIStatusData {
  endpoints: Array<{
    name: string
    endpoint: string
    method: string
    status: 'operational' | 'degraded' | 'down'
    responseTime: number
    uptime: number
    lastChecked: string
    errorRate: number
  }>
  categories: {
    agents: Array<{
      name: string
      apiEndpoint: string
      status: 'operational' | 'degraded' | 'down'
      responseTime: number
      requestsPerMinute: number
    }>
    tools: Array<{
      name: string
      apiEndpoint: string
      status: 'operational' | 'degraded' | 'down'
      responseTime: number
      requestsPerMinute: number
    }>
  }
}

const StatusBadge = ({ status }: { status: 'operational' | 'degraded' | 'down' }) => {
  const config = {
    operational: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', text: 'Operational' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', text: 'Degraded' },
    down: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', text: 'Down' },
  }

  const { icon: Icon, color, bg, text } = config[status]

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bg}`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-xs font-semibold ${color}`}>{text}</span>
    </div>
  )
}

export default function APIStatusPage() {
  const [data, setData] = useState<APIStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchAPIStatus = async () => {
    try {
      const response = await fetch('/api/status/api-status')
      const apiData = await response.json()
      setData(apiData)
      setIsLoading(false)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching API status:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAPIStatus()
    const interval = setInterval(fetchAPIStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-2 border-b-2 border-brand-600"></div>
          <p className="text-neural-800 text-base md:text-lg font-medium">Loading API Status...</p>
        </div>
      </div>
    )
  }

  const totalAPIs = data.endpoints.length + data.categories.agents.length + data.categories.tools.length
  const operationalAPIs = [
    ...data.endpoints.filter(e => e.status === 'operational'),
    ...data.categories.agents.filter(a => a.status === 'operational'),
    ...data.categories.tools.filter(t => t.status === 'operational'),
  ].length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            API Status
          </h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-6">
            Real-time monitoring of all API endpoints and services
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
              href="/status/analytics"
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-white text-white hover:bg-white/10 font-semibold rounded-lg transition-all w-full sm:w-auto"
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </Link>
          </div>
          {/* Overall Status */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 md:gap-4 bg-white/20 backdrop-blur-sm rounded-xl md:rounded-full px-5 md:px-6 py-3">
            <span className="text-white font-medium">Overall API Health:</span>
            <StatusBadge status={operationalAPIs === totalAPIs ? 'operational' : 'degraded'} />
            <span className="text-white/80">
              {operationalAPIs}/{totalAPIs} APIs Operational
            </span>
          </div>
        </div>
      </section>

      <div className="container-custom max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* Core API Endpoints */}
        <div className="bg-white rounded-2xl p-6 border border-neural-200 shadow-sm hover:shadow-md mb-12">
          <h3 className="text-2xl font-bold mb-6">Core API Endpoints</h3>
          <div className="space-y-4">
            {data.endpoints.map((endpoint, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-neural-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      endpoint.method === 'GET' ? 'bg-blue-600' :
                      endpoint.method === 'POST' ? 'bg-green-600' :
                      endpoint.method === 'PUT' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {endpoint.method}
                    </span>
                    <div>
                      <h4 className="font-semibold">{endpoint.name}</h4>
                      <p className="text-sm text-neural-600 font-mono">{endpoint.endpoint}</p>
                    </div>
                  </div>
                  <StatusBadge status={endpoint.status} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-neural-600">Response Time</p>
                    <p className="font-bold text-brand-700">{endpoint.responseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-neural-600">Uptime</p>
                    <p className="font-bold text-green-700">{endpoint.uptime}%</p>
                  </div>
                  <div>
                    <p className="text-neural-600">Error Rate</p>
                    <p className="font-bold text-yellow-700">{endpoint.errorRate}%</p>
                  </div>
                  <div>
                    <p className="text-neural-600">Last Checked</p>
                    <p className="font-bold text-purple-700">{new Date(endpoint.lastChecked).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent APIs */}
        <div className="bg-white rounded-2xl p-6 border border-neural-200 shadow-sm hover:shadow-md mb-12">
          <h3 className="text-2xl font-bold mb-6">Agent APIs ({data.categories.agents.filter(a => a.status === 'operational').length}/{data.categories.agents.length} Operational)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.categories.agents.map((agent, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-neural-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{agent.name}</h4>
                  <div className={`w-2 h-2 rounded-full ${agent.status === 'operational' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                </div>
                <p className="text-xs text-neural-600 font-mono mb-3">{agent.apiEndpoint}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-neural-600">Response</p>
                    <p className="font-bold text-brand-700">{agent.responseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-neural-600">Req/min</p>
                    <p className="font-bold text-purple-700">{agent.requestsPerMinute}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tools APIs */}
        <div className="bg-white rounded-2xl p-6 border border-neural-200 shadow-sm hover:shadow-md">
          <h3 className="text-2xl font-bold mb-6">Tools & Services APIs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.categories.tools.map((tool, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-neural-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{tool.name}</h4>
                  <StatusBadge status={tool.status} />
                </div>
                <p className="text-xs text-neural-600 font-mono mb-3">{tool.apiEndpoint}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neural-600">Response Time</p>
                    <p className="font-bold text-brand-700">{tool.responseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-neural-600">Requests/min</p>
                    <p className="font-bold text-purple-700">{tool.requestsPerMinute}</p>
                  </div>
                </div>
              </div>
            ))}
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
