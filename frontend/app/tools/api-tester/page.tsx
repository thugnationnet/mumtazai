'use client'

import { useState } from 'react'
import { Send, Plus, Trash2, Copy, Clock } from 'lucide-react'
import Link from 'next/link'

interface Header {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface QueryParam {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  time?: number
}

const quickPresets = [
  {
    name: 'JSONPlaceholder - Get Posts',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts'
  },
  {
    name: 'JSONPlaceholder - Create Post',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    body: JSON.stringify({ title: 'Test Post', body: 'Test content', userId: 1 }, null, 2),
    headers: [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }]
  },
  {
    name: 'GitHub API - Get User',
    method: 'GET',
    url: 'https://api.github.com/users/github'
  },
  {
    name: 'REST Countries - Get Country',
    method: 'GET',
    url: 'https://restcountries.com/v3.1/name/canada'
  },
  {
    name: 'Cat Facts API',
    method: 'GET',
    url: 'https://catfact.ninja/fact'
  }
]

export default function ApiTesterPage() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [authType, setAuthType] = useState('none')
  const [bearerToken, setBearerToken] = useState('')
  const [basicUsername, setBasicUsername] = useState('')
  const [basicPassword, setBasicPassword] = useState('')
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key')
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [headers, setHeaders] = useState<Header[]>([])
  const [queryParams, setQueryParams] = useState<QueryParam[]>([])
  const [bodyType, setBodyType] = useState('json')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const addHeader = () => {
    setHeaders([...headers, { id: Date.now().toString(), key: '', value: '', enabled: true }])
  }

  const removeHeader = (id: string) => {
    setHeaders(headers.filter(h => h.id !== id))
  }

  const updateHeader = (id: string, field: keyof Header, value: string | boolean) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, [field]: value } : h))
  }

  const addQueryParam = () => {
    setQueryParams([...queryParams, { id: Date.now().toString(), key: '', value: '', enabled: true }])
  }

  const removeQueryParam = (id: string) => {
    setQueryParams(queryParams.filter(q => q.id !== id))
  }

  const updateQueryParam = (id: string, field: keyof QueryParam, value: string | boolean) => {
    setQueryParams(queryParams.map(q => q.id === id ? { ...q, [field]: value } : q))
  }

  const loadPreset = (preset: typeof quickPresets[0]) => {
    setMethod(preset.method)
    setUrl(preset.url)
    if (preset.body) {
      setBody(preset.body)
      setBodyType('json')
    } else {
      setBody('')
    }
    if (preset.headers) {
      setHeaders(preset.headers)
    } else {
      setHeaders([])
    }
    setQueryParams([])
    setAuthType('none')
    setResponse(null)
    setError('')
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(body)
      setBody(JSON.stringify(parsed, null, 2))
    } catch (e) {
      // Invalid JSON, don't format
    }
  }

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSend = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)
    setError('')
    setResponse(null)

    try {
      // Build full URL with query params
      const enabledParams = queryParams.filter(q => q.enabled && q.key)
      let fullUrl = url
      if (enabledParams.length > 0) {
        const params = new URLSearchParams()
        enabledParams.forEach(p => params.append(p.key, p.value))
        fullUrl += (url.includes('?') ? '&' : '?') + params.toString()
      }

      // Build headers
      const requestHeaders: Record<string, string> = {}
      headers.filter(h => h.enabled && h.key).forEach(h => {
        requestHeaders[h.key] = h.value
      })

      // Add auth headers
      if (authType === 'bearer' && bearerToken) {
        requestHeaders['Authorization'] = `Bearer ${bearerToken}`
      } else if (authType === 'basic' && basicUsername && basicPassword) {
        const encoded = btoa(`${basicUsername}:${basicPassword}`)
        requestHeaders['Authorization'] = `Basic ${encoded}`
      } else if (authType === 'apikey' && apiKeyHeader && apiKeyValue) {
        requestHeaders[apiKeyHeader] = apiKeyValue
      }

      // Prepare body
      let requestBody: any = undefined
      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        if (bodyType === 'json') {
          requestHeaders['Content-Type'] = 'application/json'
          requestBody = body
        } else if (bodyType === 'form') {
          requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
          requestBody = body
        } else {
          requestBody = body
        }
      }

      const startTime = Date.now()
      const res = await fetch('/api/tools/api-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          url: fullUrl,
          headers: requestHeaders,
          body: requestBody
        })
      })

      const endTime = Date.now()
      const data = await res.json()

      if (res.ok) {
        setResponse({
          status: data.data?.status || data.status || 0,
          statusText: data.data?.statusText || data.statusText || 'Unknown',
          headers: data.data?.headers || data.headers || {},
          data: data.data?.data || data.data || null,
          time: endTime - startTime
        })
      } else {
        setError(data.error || 'Request failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-600 to-accent-600">
        <div className="container-custom py-6">
          <Link 
            href="/tools"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
          >
            <span></span>
            <span>Back to Network Tools</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <Send className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">API Tester</h1>
              <p className="text-blue-100">Professional API testing with presets and advanced options</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Quick Presets */}
            <div className="card-modern p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Presets</h2>
              <select
                className="input-modern w-full"
                onChange={(e) => {
                  const preset = quickPresets[parseInt(e.target.value)]
                  if (preset) loadPreset(preset)
                }}
                defaultValue=""
              >
                <option value="" disabled>Select a preset...</option>
                {quickPresets.map((preset, idx) => (
                  <option key={idx} value={idx}>{preset.name}</option>
                ))}
              </select>
            </div>

            {/* URL and Method */}
            <div className="card-modern p-6">
              <h2 className="text-xl font-semibold mb-4">Request</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <select
                    className="input-modern w-32"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>
                  <input
                    type="text"
                    className="input-modern flex-1"
                    placeholder="https://api.example.com/endpoint"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Authentication */}
            <div className="card-modern p-6">
              <h2 className="text-xl font-semibold mb-4">Authentication</h2>
              <div className="space-y-4">
                <select
                  className="input-modern w-full"
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value)}
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="apikey">API Key</option>
                </select>

                {authType === 'bearer' && (
                  <input
                    type="text"
                    className="input-modern w-full"
                    placeholder="Token"
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                  />
                )}

                {authType === 'basic' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="input-modern w-full"
                      placeholder="Username"
                      value={basicUsername}
                      onChange={(e) => setBasicUsername(e.target.value)}
                    />
                    <input
                      type="password"
                      className="input-modern w-full"
                      placeholder="Password"
                      value={basicPassword}
                      onChange={(e) => setBasicPassword(e.target.value)}
                    />
                  </div>
                )}

                {authType === 'apikey' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="input-modern w-full"
                      placeholder="Header Name (e.g., X-API-Key)"
                      value={apiKeyHeader}
                      onChange={(e) => setApiKeyHeader(e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-modern w-full"
                      placeholder="API Key Value"
                      value={apiKeyValue}
                      onChange={(e) => setApiKeyValue(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Query Parameters */}
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Query Parameters</h2>
                <button
                  onClick={addQueryParam}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {queryParams.length === 0 ? (
                  <p className="text-gray-500 text-sm">No query parameters</p>
                ) : (
                  queryParams.map((param) => (
                    <div key={param.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        onChange={(e) => updateQueryParam(param.id, 'enabled', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        className="input-modern flex-1"
                        placeholder="Key"
                        value={param.key}
                        onChange={(e) => updateQueryParam(param.id, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        className="input-modern flex-1"
                        placeholder="Value"
                        value={param.value}
                        onChange={(e) => updateQueryParam(param.id, 'value', e.target.value)}
                      />
                      <button
                        onClick={() => removeQueryParam(param.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Headers */}
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Headers</h2>
                <button
                  onClick={addHeader}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {headers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No custom headers</p>
                ) : (
                  headers.map((header) => (
                    <div key={header.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) => updateHeader(header.id, 'enabled', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        className="input-modern flex-1"
                        placeholder="Key"
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        className="input-modern flex-1"
                        placeholder="Value"
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                      />
                      <button
                        onClick={() => removeHeader(header.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Body */}
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div className="card-modern p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Body</h2>
                  <div className="flex gap-2">
                    <select
                      className="input-modern text-sm"
                      value={bodyType}
                      onChange={(e) => setBodyType(e.target.value)}
                    >
                      <option value="json">JSON</option>
                      <option value="text">Raw Text</option>
                      <option value="form">Form Data</option>
                      <option value="urlencoded">URL Encoded</option>
                    </select>
                    {bodyType === 'json' && (
                      <button
                        onClick={formatJson}
                        className="btn-secondary text-sm"
                      >
                        Format
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  className="input-modern w-full font-mono text-sm"
                  rows={10}
                  placeholder={
                    bodyType === 'json' 
                      ? '{\n  "key": "value"\n}'
                      : 'Request body...'
                  }
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={loading || !url.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Request
                </>
              )}
            </button>
          </div>

          {/* Right Column - Response */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Response</h2>
                {response && (
                  <button
                    onClick={copyResponse}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    {copied ? <span></span> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {response ? (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      response.status >= 200 && response.status < 300
                        ? 'bg-green-500/20 text-green-400'
                        : response.status >= 400
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {response.status} {response.statusText}
                    </span>
                    {response.time !== undefined && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {response.time}ms
                      </div>
                    )}
                  </div>

                  {/* Response Body */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-600">Body</h3>
                    <pre className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96 text-sm border border-gray-200">
                      <code>{JSON.stringify(response.data, null, 2)}</code>
                    </pre>
                  </div>

                  {/* Response Headers */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-600">Headers</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm max-h-48 overflow-auto border border-gray-200">
                      {response.headers && Object.keys(response.headers).length > 0 ? (
                        Object.entries(response.headers).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-violet-600 font-mono">{key}:</span>
                            <span className="text-gray-600 font-mono break-all">{value}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">No headers returned</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Send a request to see the response</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
