'use client';

import Link from 'next/link';
import { ArrowLeft, Code, BookOpen, Database, Zap } from 'lucide-react';

export default function APIReferencePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Agent API Reference</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Complete API documentation for integrating agents into your applications.
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Back Button */}
        <Link href="/docs/agents" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* API Overview */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brand-100 rounded-xl p-2"><Code className="w-6 h-6 text-brand-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">API Overview</h2>
            </div>
            <p className="text-neural-600 mb-4">
              The One Last AI API provides RESTful endpoints to integrate AI agents into your applications, websites, and systems. 
              The API uses JSON for request and response payloads and requires authentication via API keys.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl border border-neural-200 text-sm">
              <p className="text-neural-600 mb-2"><strong>Base URL:</strong></p>
              <code className="text-green-600">https://api.One Last AI.com/v1</code>
            </div>
          </section>

          {/* Authentication */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Authentication</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">API Keys</h3>
                <p className="text-neural-600 mb-3">
                  All API requests require an API key in the Authorization header. You can generate API keys from your One Last AI dashboard under Settings → API Keys.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Header Format</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-neural-200 font-mono text-sm text-neural-700">
                  Authorization: Bearer your_api_key_here
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Rate Limiting</h3>
                <p className="text-neural-600">
                  API requests are rate-limited based on your plan tier. Standard plans allow 100 requests per minute. 
                  Rate limit information is included in response headers. When you exceed the limit, you'll receive a 429 Too Many Requests response.
                </p>
              </div>
            </div>
          </section>

          {/* Core Endpoints */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Core Endpoints</h2>

            <div className="space-y-8">
              {/* List Agents */}
              <div className="border-l-4 border-green-500 pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono">GET</span>
                  <code className="text-green-600 font-mono">/agents</code>
                </div>
                <p className="text-neural-600 mb-3">Retrieve a list of all available agents with their metadata.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-neural-200 text-sm">
                  <p className="text-neural-500 mb-2">Response:</p>
                  <pre className="text-neural-700 overflow-auto">{`{
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
                <p className="text-neural-600 mb-3">Get detailed information about a specific agent.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-neural-200 text-sm">
                  <p className="text-neural-500 mb-2">Parameters:</p>
                  <p className="text-neural-600 mb-3"><code className="text-green-600">agentId</code> (string) - The ID of the agent (e.g., "einstein")</p>
                  <p className="text-neural-500 mb-2">Response includes:</p>
                  <p className="text-neural-600">ID, name, specialty, description, configuration options, and model information.</p>
                </div>
              </div>

              {/* Send Message */}
              <div className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">POST</span>
                  <code className="text-blue-600 font-mono">/agents/{'{agentId}'}/message</code>
                </div>
                <p className="text-neural-600 mb-3">Send a message to an agent and receive a response.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-neural-200 text-sm">
                  <p className="text-neural-500 mb-2">Request Body:</p>
                  <pre className="text-neural-700 overflow-auto">{`{
  "conversationId": "conv_123",
  "message": "Your question here",
  "config": {
    "tone": "professional",
    "length": "standard"
  }
}`}</pre>
                  <p className="text-neural-500 mt-4 mb-2">Response:</p>
                  <pre className="text-neural-700 overflow-auto">{`{
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
                <p className="text-neural-600 mb-3">Create a new conversation session with an agent.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-neural-200 text-sm">
                  <p className="text-neural-500 mb-2">Request Body:</p>
                  <pre className="text-neural-700 overflow-auto">{`{
  "agentId": "einstein",
  "metadata": {
    "user_id": "user_123",
    "context": "Additional context"
  }
}`}</pre>
                  <p className="text-neural-500 mt-4 mb-2">Returns:</p>
                  <p className="text-neural-600">A new conversation ID to use in subsequent message requests.</p>
                </div>
              </div>

              {/* Get Conversation History */}
              <div className="border-l-4 border-green-500 pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono">GET</span>
                  <code className="text-green-600 font-mono">/conversations/{'{conversationId}'}</code>
                </div>
                <p className="text-neural-600 mb-3">Retrieve the full conversation history including all messages.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-neural-200 text-sm">
                  <p className="text-neural-500 mb-2">Query Parameters:</p>
                  <ul className="list-disc list-inside text-neural-600 space-y-1">
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
                <p className="text-neural-600 mb-3">Update the configuration for an agent session.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-neural-200 text-sm">
                  <p className="text-neural-500 mb-2">Request Body (example):</p>
                  <pre className="text-neural-700 overflow-auto">{`{
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
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Error Handling</h2>

            <div className="space-y-4 text-neural-600">
              <div>
                <p className="font-semibold text-brand-600 mb-2">400 Bad Request</p>
                <p>The request parameters are invalid or malformed. Check your request body and parameters.</p>
              </div>
              <div>
                <p className="font-semibold text-brand-600 mb-2">401 Unauthorized</p>
                <p>Authentication failed. Verify your API key is correct and included in the Authorization header.</p>
              </div>
              <div>
                <p className="font-semibold text-brand-600 mb-2">404 Not Found</p>
                <p>The requested resource (agent, conversation) does not exist.</p>
              </div>
              <div>
                <p className="font-semibold text-brand-600 mb-2">429 Too Many Requests</p>
                <p>Rate limit exceeded. Wait before making additional requests. Check rate-limit headers for reset time.</p>
              </div>
              <div>
                <p className="font-semibold text-brand-600 mb-2">500 Internal Server Error</p>
                <p>A server error occurred. Retry your request. If the issue persists, contact support.</p>
              </div>
            </div>
          </section>

          {/* Integration Examples */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Integration Examples</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">JavaScript/Node.js</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-neural-200 font-mono text-sm text-neural-700 overflow-auto">
                  <pre>{`// Create conversation
const response = await fetch(
  'https://api.One Last AI.com/v1/conversations',
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
  'https://api.One Last AI.com/v1/agents/einstein/message',
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
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Python</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-neural-200 font-mono text-sm text-neural-700 overflow-auto">
                  <pre>{`import requests

api_key = "YOUR_API_KEY"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Create conversation
conv_response = requests.post(
    "https://api.One Last AI.com/v1/conversations",
    headers=headers,
    json={"agentId": "einstein"}
)

conversation_id = conv_response.json()["conversationId"]

# Send message
msg_response = requests.post(
    "https://api.One Last AI.com/v1/agents/einstein/message",
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
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Rate Limits & Quotas</h2>
            
            <div className="space-y-4 text-neural-600">
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
              className="p-4 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-neural-100 transition-colors"
            >
              <h3 className="font-semibold text-brand-600 mb-2">← Configuration</h3>
              <p className="text-neural-600 text-sm">Configure agents</p>
            </Link>
            <Link 
              href="/docs/agents/best-practices"
              className="p-4 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-neural-100 transition-colors"
            >
              <h3 className="font-semibold text-brand-600 mb-2">Best Practices →</h3>
              <p className="text-neural-600 text-sm">Learn expert tips</p>
            </Link>
            <Link 
              href="/docs/agents/troubleshooting"
              className="p-4 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-neural-100 transition-colors"
            >
              <h3 className="font-semibold text-brand-600 mb-2">Troubleshooting →</h3>
              <p className="text-neural-600 text-sm">Solve issues</p>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
