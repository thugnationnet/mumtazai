'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function DocsAPI() {
  const apiEndpoints = [
    {
      title: "Authentication",
      description: "Secure your API requests with OAuth 2.0 and API keys",
      category: "Security",
      readTime: "5 min",
      href: "#authentication"
    },
    {
      title: "Agents Endpoints",
      description: "Create, retrieve, and manage AI agents through our REST API",
      category: "Reference",
      readTime: "10 min",
      href: "#agents"
    },
    {
      title: "Conversations API",
      description: "Access and manage chat conversations and message history",
      category: "Reference",
      readTime: "8 min",
      href: "#conversations"
    },
    {
      title: "Rate Limits",
      description: "Understand rate limiting and throttling policies",
      category: "Policy",
      readTime: "4 min",
      href: "#rate-limits"
    },
    {
      title: "Error Handling",
      description: "Learn how to handle and debug API errors effectively",
      category: "Guide",
      readTime: "6 min",
      href: "#errors"
    },
    {
      title: "Webhooks",
      description: "Set up real-time notifications for agent events",
      category: "Integration",
      readTime: "7 min",
      href: "#webhooks"
    }
  ]

  const codeExamples = [
    {
      title: "List All Agents",
      language: "JavaScript",
      code: `// Get all agents
const response = await fetch('https://api.Mumtaz AI.com/v1/agents', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const agents = await response.json();
console.log(agents);`
    },
    {
      title: "Create an Agent",
      language: "Python",
      code: `import requests

# Create a new agent
response = requests.post(
  'https://api.Mumtaz AI.com/v1/agents',
  headers={
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  json={
    'name': 'My Bot',
    'personality': 'helpful',
    'model': 'gpt-4'
  }
)

agent = response.json()
print(agent['id'])`
    },
    {
      title: "Send Message",
      language: "JavaScript",
      code: `// Send a message to an agent
const response = await fetch('https://api.Mumtaz AI.com/v1/conversations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agent_id: 'agent_123',
    message: 'Hello, how are you?'
  })
});

const result = await response.json();
console.log(result.reply);`
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -left-20 top-1/4 w-72 h-[500px] rounded-[100px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
        <div className="absolute -right-16 -top-20 w-80 h-[600px] rounded-[100px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute left-1/3 -bottom-32 w-64 h-[400px] rounded-[80px] rotate-45 bg-gradient-to-tr from-purple-200/25 via-white/30 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute right-1/4 top-10 w-48 h-[350px] rounded-[60px] -rotate-6 bg-gradient-to-b from-white/35 via-slate-200/20 to-transparent backdrop-blur-sm border border-white/45" />
        <div className="absolute -left-10 -bottom-10 w-56 h-[300px] rounded-[70px] rotate-[30deg] bg-gradient-to-tl from-indigo-100/30 via-white/25 to-transparent backdrop-blur-sm border border-white/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <Link href="/docs" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-700 mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Docs</Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg flex items-center justify-center"><BookOpen className="w-10 h-10 text-purple-600" /></div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">API Reference</h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Build powerful integrations with our comprehensive REST API. Access real-time agent management, conversation tracking, and webhook capabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#quick-start" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] px-6 py-3 rounded-lg font-semibold transition-all">Quick Start</a>
              <a href="#authentication" className="bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 hover:bg-white/50 px-6 py-3 rounded-lg font-semibold transition-colors">View Endpoints</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-custom section-padding">
        
        {/* API Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-blue-600">
                📡
              </span>
              Base URL
            </h3>
            <code className="block bg-gray-900 p-4 rounded-lg text-gray-200 text-sm">
              https://api.Mumtaz AI.com/v1
            </code>
            <p className="text-slate-500 text-sm mt-3">
              All API requests should be made to this base URL with proper versioning.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-blue-600">
                🔑
              </span>
              Authentication
            </h3>
            <code className="block bg-gray-900 p-4 rounded-lg text-gray-200 text-sm">
              Authorization: Bearer YOUR_API_KEY
            </code>
            <p className="text-slate-500 text-sm mt-3">
              Include your API key in the Authorization header for all requests.
            </p>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">API Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apiEndpoints.map((endpoint, index) => (
              <div key={index} className="group glass-card p-6 hover:shadow-lg transition-all duration-300">
                <div className="mb-4">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {endpoint.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                  {endpoint.title}
                </h3>
                <p className="text-slate-500 mb-4 leading-relaxed">
                  {endpoint.description}
                </p>
                <a href={endpoint.href} className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                  Learn more →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Authentication Section */}
        <div id="authentication" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Authentication</h2>
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Getting Your API Key</h3>
            <ol className="space-y-4 mb-6">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="font-semibold text-slate-800">Sign in to your account</p>
                  <p className="text-slate-500 text-sm">Log in to the Mumtaz AI dashboard</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="font-semibold text-slate-800">Navigate to API Settings</p>
                  <p className="text-slate-500 text-sm">Go to Settings → Developer → API Keys</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="font-semibold text-slate-800">Generate a new API key</p>
                  <p className="text-slate-500 text-sm">Click "Create New Key" and copy your key</p>
                </div>
              </li>
            </ol>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>⚠️ Security Note:</strong> Keep your API keys confidential. Never commit them to version control or share publicly.
              </p>
            </div>
          </div>
        </div>

        {/* Agents Endpoints */}
        <div id="agents" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Agents Endpoints</h2>
          
          <div className="space-y-6">
            {/* GET Agents */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-mono text-sm font-semibold">GET</span>
                <code className="text-slate-600">/agents</code>
              </div>
              <p className="text-slate-500 mb-4">Retrieve a list of all your agents</p>
              <div className="bg-gray-900 p-4 rounded-lg mb-4">
                <p className="text-slate-400 text-xs mb-2">Response:</p>
                <code className="text-gray-200 text-sm">
                  {`{
  "data": [
    {
      "id": "agent_123",
      "name": "Tech Wizard",
      "personality": "helpful",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1
}`}
                </code>
              </div>
            </div>

            {/* POST Create Agent */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded font-mono text-sm font-semibold">POST</span>
                <code className="text-slate-600">/agents</code>
              </div>
              <p className="text-slate-500 mb-4">Create a new AI agent</p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-slate-400 text-xs mb-2">Request:</p>
                <code className="text-gray-200 text-sm">
                  {`{
  "name": "New Agent",
  "personality": "friendly",
  "model": "gpt-4",
  "system_prompt": "You are a helpful assistant"
}`}
                </code>
              </div>
            </div>

            {/* GET Agent by ID */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-mono text-sm font-semibold">GET</span>
                <code className="text-slate-600">/agents/[agent_id]</code>
              </div>
              <p className="text-slate-500 mb-4">Retrieve details of a specific agent</p>
            </div>
          </div>
        </div>

        {/* Conversations API */}
        <div id="conversations" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Conversations API</h2>
          
          <div className="space-y-6">
            {/* POST Send Message */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded font-mono text-sm font-semibold">POST</span>
                <code className="text-slate-600">/conversations</code>
              </div>
              <p className="text-slate-500 mb-4">Send a message to an agent and get a response</p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-slate-400 text-xs mb-2">Request:</p>
                <code className="text-gray-200 text-sm">
                  {`{
  "agent_id": "agent_123",
  "message": "How do I create an agent?",
  "conversation_id": "conv_456" // optional
}`}
                </code>
              </div>
            </div>

            {/* GET Conversation History */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-mono text-sm font-semibold">GET</span>
                <code className="text-slate-600">/conversations/[conversation_id]</code>
              </div>
              <p className="text-slate-500 mb-4">Retrieve the full conversation history</p>
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div id="rate-limits" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Rate Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Standard Plan</h3>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span className="text-slate-500">Requests/minute:</span>
                  <span className="font-bold text-blue-600">100</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Daily limit:</span>
                  <span className="font-bold text-blue-600">100,000</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Concurrent requests:</span>
                  <span className="font-bold text-blue-600">10</span>
                </li>
              </ul>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Pro Plan</h3>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span className="text-slate-500">Requests/minute:</span>
                  <span className="font-bold text-blue-600">500</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Daily limit:</span>
                  <span className="font-bold text-blue-600">1,000,000</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Concurrent requests:</span>
                  <span className="font-bold text-blue-600">50</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Code Examples</h2>
          <div className="grid grid-cols-1 gap-6">
            {codeExamples.map((example, index) => (
              <div key={index} className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">{example.title}</h3>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {example.language}
                  </span>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-gray-200 text-sm">
                    <code>{example.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Handling */}
        <div id="errors" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Error Handling</h2>
          <div className="glass-card p-6">
            <p className="text-slate-600 mb-6">
              All API errors follow a standard format. Handle errors gracefully in your applications:
            </p>
            <div className="bg-gray-900 p-4 rounded-lg mb-6">
              <code className="text-gray-200 text-sm">
                {`{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid",
    "details": "Please check your API key and try again"
  }
}`}
              </code>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <span className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold">400</span>
                <div>
                  <p className="font-semibold text-slate-800">Bad Request</p>
                  <p className="text-slate-500 text-sm">Invalid parameters or missing required fields</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold">401</span>
                <div>
                  <p className="font-semibold text-slate-800">Unauthorized</p>
                  <p className="text-slate-500 text-sm">API key is missing or invalid</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold">429</span>
                <div>
                  <p className="font-semibold text-slate-800">Rate Limit Exceeded</p>
                  <p className="text-slate-500 text-sm">You've exceeded the rate limit for your plan</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold">500</span>
                <div>
                  <p className="font-semibold text-slate-800">Server Error</p>
                  <p className="text-slate-500 text-sm">Internal server error - try again later</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks */}
        <div id="webhooks" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Webhooks</h2>
          <div className="glass-card p-6 mb-6">
            <p className="text-slate-600 mb-6">
              Subscribe to real-time events from your agents. Webhooks are triggered when specific events occur:
            </p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-slate-800 mb-2">agent.created</h3>
                <p className="text-slate-500 text-sm">Triggered when a new agent is created</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-slate-800 mb-2">agent.updated</h3>
                <p className="text-slate-500 text-sm">Triggered when an agent is updated</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-slate-800 mb-2">message.received</h3>
                <p className="text-slate-500 text-sm">Triggered when an agent receives a message</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-slate-800 mb-2">conversation.completed</h3>
                <p className="text-slate-500 text-sm">Triggered when a conversation ends</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center themed-section-bg">
          <div className="absolute -left-10 top-1/4 w-48 h-[300px] rounded-[80px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
          <div className="absolute -right-10 -top-10 w-56 h-[350px] rounded-[80px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Ready to Build?</h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Start integrating with our API today. Check out our tutorials and SDKs for different programming languages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs/sdks" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all">
                View SDKs
              </Link>
              <Link href="/docs/tutorials" className="px-6 py-3 bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 font-semibold rounded-xl hover:bg-white/50 transition">
                See Tutorials
              </Link>
              <Link href="/support/contact-us" className="px-6 py-3 bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 font-semibold rounded-xl hover:bg-white/50 transition">
                Get Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
