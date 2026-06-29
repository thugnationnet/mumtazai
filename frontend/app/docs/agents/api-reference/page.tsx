'use client';

import Link from 'next/link';
import { ArrowLeft, Code, BookOpen, Database, Zap } from 'lucide-react';

export default function APIReferencePage() {
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
        <div className="container-custom text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Agent API Reference</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Complete API documentation for integrating agents into your applications.
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Back Button */}
        <Link href="/docs/agents" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* API Overview */}
          <section className="glass-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-xl p-2"><Code className="w-6 h-6 text-blue-600" /></div>
              <h2 className="text-2xl font-bold text-slate-800">API Overview</h2>
            </div>
            <p className="text-slate-500 mb-4">
              The Mumtaz AI API provides RESTful endpoints to integrate AI agents into your applications, websites, and systems. 
              The API uses JSON for request and response payloads and requires authentication via API keys.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl border border-white/80 text-sm">
              <p className="text-slate-500 mb-2"><strong>Base URL:</strong></p>
              <code className="text-green-600">https://api.Mumtaz AI.com/v1</code>
            </div>
          </section>

          {/* Authentication */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Authentication</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">API Keys</h3>
                <p className="text-slate-500 mb-3">
                  All API requests require an API key in the Authorization header. You can generate API keys from your Mumtaz AI dashboard under Settings → API Keys.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Header Format</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-white/80 font-mono text-sm text-slate-600">
                  Authorization: Bearer your_api_key_here
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Rate Limiting</h3>
                <p className="text-slate-500">
                  API requests are rate-limited based on your plan tier. Standard plans allow 100 requests per minute. 
                  Rate limit information is included in response headers. When you exceed the limit, you'll receive a 429 Too Many Requests response.
                </p>
              </div>
            </div>
          </section>

          {/* Core Endpoints */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Core Endpoints</h2>

            <div className="space-y-8">
              {/* List Agents */}
              <div className="border-l-4 border-green-500 pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono">GET</span>
                  <code className="text-green-600 font-mono">/agents</code>
                </div>
                <p className="text-slate-500 mb-3">Retrieve a list of all available agents with their metadata.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-white/80 text-sm">
                  <p className="text-slate-400 mb-2">Response:</p>
                  <pre className="text-slate-600 overflow-auto">{`{
  "agents": [
    {
      "id": "einstein",
      "name": "Einstein",
      "specialty": "Scientific Research",
      "description": "...",
      "isAvailable": true
    }
  ]
}`}</pre>
                </div>
              </div>

              {/* Get Agent Details */}
              <div className="border-l-4 border-green-500 pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono">GET</span>
                  <code className="text-green-600 font-mono">/agents/{'{agentId}'}</code>
                </div>
                <p className="text-slate-500 mb-3">Get detailed information about a specific agent.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-white/80 text-sm">
                  <p className="text-slate-400 mb-2">Parameters:</p>
                  <p className="text-slate-500 mb-3"><code className="text-green-600">agentId</code> (string) - The ID of the agent (e.g., "einstein")</p>
                  <p className="text-slate-400 mb-2">Response includes:</p>
                  <p className="text-slate-500">ID, name, specialty, description, configuration options, and model information.</p>
                </div>
              </div>

              {/* Send Message */}
              <div className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">POST</span>
                  <code className="text-blue-600 font-mono">/agents/{'{agentId}'}/message</code>
                </div>
                <p className="text-slate-500 mb-3">Send a message to an agent and receive a response.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-white/80 text-sm">
                  <p className="text-slate-400 mb-2">Request Body:</p>
                  <pre className="text-slate-600 overflow-auto">{`{
  "conversationId": "conv_123",
  "message": "Your question here",
  "config": {
    "tone": "professional",
    "length": "standard"
  }
}`}</pre>
                  <p className="text-slate-400 mt-4 mb-2">Response:</p>
                  <pre className="text-slate-600 overflow-auto">{`{
  "id": "msg_456",
  "response": "Agent response text",
  "timestamp": "2025-10-22T10:30:00Z",
  "tokensUsed": 150
}`}</pre>
                </div>
              </div>

              {/* Create Conversation */}
              <div className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">POST</span>
                  <code className="text-blue-600 font-mono">/conversations</code>
                </div>
                <p className="text-slate-500 mb-3">Create a new conversation session with an agent.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-white/80 text-sm">
                  <p className="text-slate-400 mb-2">Request Body:</p>
                  <pre className="text-slate-600 overflow-auto">{`{
  "agentId": "einstein",
  "metadata": {
    "user_id": "user_123",
    "context": "Additional context"
  }
}`}</pre>
                  <p className="text-slate-400 mt-4 mb-2">Returns:</p>
                  <p className="text-slate-500">A new conversation ID to use in subsequent message requests.</p>
                </div>
              </div>

              {/* Get Conversation History */}
              <div className="border-l-4 border-green-500 pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono">GET</span>
                  <code className="text-green-600 font-mono">/conversations/{'{conversationId}'}</code>
                </div>
                <p className="text-slate-500 mb-3">Retrieve the full conversation history including all messages.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-white/80 text-sm">
                  <p className="text-slate-400 mb-2">Query Parameters:</p>
                  <ul className="list-disc list-inside text-slate-500 space-y-1">
                    <li><code className="text-green-600">limit</code> - Maximum messages to return (default: 50)</li>
                    <li><code className="text-green-600">offset</code> - For pagination</li>
                  </ul>
                </div>
              </div>

              {/* Update Configuration */}
              <div className="border-l-4 border-purple-500 pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-mono">PUT</span>
                  <code className="text-purple-600 font-mono">/agents/{'{agentId}'}/config</code>
                </div>
                <p className="text-slate-500 mb-3">Update the configuration for an agent session.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-white/80 text-sm">
                  <p className="text-slate-400 mb-2">Request Body (example):</p>
                  <pre className="text-slate-600 overflow-auto">{`{
  "tone": "casual",
  "length": "brief",
  "language": "es",
  "creativity": "creative"
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Error Handling */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Error Handling</h2>

            <div className="space-y-4 text-slate-500">
              <div>
                <p className="font-semibold text-blue-600 mb-2">400 Bad Request</p>
                <p>The request parameters are invalid or malformed. Check your request body and parameters.</p>
              </div>
              <div>
                <p className="font-semibold text-blue-600 mb-2">401 Unauthorized</p>
                <p>Authentication failed. Verify your API key is correct and included in the Authorization header.</p>
              </div>
              <div>
                <p className="font-semibold text-blue-600 mb-2">404 Not Found</p>
                <p>The requested resource (agent, conversation) does not exist.</p>
              </div>
              <div>
                <p className="font-semibold text-blue-600 mb-2">429 Too Many Requests</p>
                <p>Rate limit exceeded. Wait before making additional requests. Check rate-limit headers for reset time.</p>
              </div>
              <div>
                <p className="font-semibold text-blue-600 mb-2">500 Internal Server Error</p>
                <p>A server error occurred. Retry your request. If the issue persists, contact support.</p>
              </div>
            </div>
          </section>

          {/* Integration Examples */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Integration Examples</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">JavaScript/Node.js</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-white/80 font-mono text-sm text-slate-600 overflow-auto">
                  <pre>{`// Create conversation
const response = await fetch(
  'https://api.Mumtaz AI.com/v1/conversations',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agentId: 'einstein'
    })
  }
);

const { conversationId } = await response.json();

// Send message
const msgResponse = await fetch(
  'https://api.Mumtaz AI.com/v1/agents/einstein/message',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      conversationId,
      message: 'What is quantum entanglement?'
    })
  }
);

const data = await msgResponse.json();
console.log(data.response);`}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Python</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-white/80 font-mono text-sm text-slate-600 overflow-auto">
                  <pre>{`import requests

api_key = "YOUR_API_KEY"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Create conversation
conv_response = requests.post(
    "https://api.Mumtaz AI.com/v1/conversations",
    headers=headers,
    json={"agentId": "einstein"}
)

conversation_id = conv_response.json()["conversationId"]

# Send message
msg_response = requests.post(
    "https://api.Mumtaz AI.com/v1/agents/einstein/message",
    headers=headers,
    json={
        "conversationId": conversation_id,
        "message": "Explain relativity"
    }
)

print(msg_response.json()["response"])`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Rate Limits & Quotas */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Rate Limits & Quotas</h2>
            
            <div className="space-y-4 text-slate-500">
              <p>Rate limits vary by plan tier:</p>
              <div className="space-y-3 ml-4">
                <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-semibold">Starter Plan</span>
                  <span>100 requests/minute</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-semibold">Professional Plan</span>
                  <span>500 requests/minute</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-semibold">Enterprise Plan</span>
                  <span>Custom limits</span>
                </div>
              </div>
              <p className="mt-4">Upgrade your plan at any time to increase your rate limits and token quotas.</p>
            </div>
          </section>

          {/* Related Links */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Link 
              href="/docs/agents/configuration"
              className="p-4 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 transition-colors"
            >
              <h3 className="font-semibold text-purple-600 mb-2">← Configuration</h3>
              <p className="text-slate-500 text-sm">Setup & customize</p>
            </Link>
            <Link 
              href="/docs/agents/best-practices"
              className="p-4 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 transition-colors"
            >
              <h3 className="font-semibold text-purple-600 mb-2">Best Practices →</h3>
              <p className="text-slate-500 text-sm">Tips & strategies</p>
            </Link>
            <Link 
              href="/docs/agents/troubleshooting"
              className="p-4 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 transition-colors"
            >
              <h3 className="font-semibold text-purple-600 mb-2">Troubleshooting →</h3>
              <p className="text-slate-500 text-sm">Solve issues</p>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
