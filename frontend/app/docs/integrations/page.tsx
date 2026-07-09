'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Link2 } from 'lucide-react'

export default function DocsIntegrations() {
  const integrations = [
    {
      title: "Slack Integration",
      description: "Connect your agents to Slack and respond to messages directly",
      category: "Communication",
      readTime: "8 min",
      href: "#slack",
      icon: "💬"
    },
    {
      title: "Discord Integration",
      description: "Build Discord bots powered by your AI agents",
      category: "Gaming & Community",
      readTime: "8 min",
      href: "#discord",
      icon: "🎮"
    },
    {
      title: "Teams Integration",
      description: "Deploy agents to Microsoft Teams for enterprise collaboration",
      category: "Enterprise",
      readTime: "8 min",
      href: "#teams",
      icon: "💼"
    },
    {
      title: "Webhooks",
      description: "Send real-time data and trigger actions with webhooks",
      category: "Integration",
      readTime: "6 min",
      href: "#webhooks",
      icon: "🔗"
    },
    {
      title: "Email Integration",
      description: "Connect your agents to handle incoming emails automatically",
      category: "Communication",
      readTime: "7 min",
      href: "#email",
      icon: "📧"
    },
    {
      title: "Custom APIs",
      description: "Build custom integrations with any third-party service",
      category: "Advanced",
      readTime: "10 min",
      href: "#custom",
      icon: "⚙️"
    }
  ]

  const setupSteps = [
    {
      platform: "Slack",
      steps: [
        "Go to Slack App Directory and search for One Last AI",
        "Click 'Add to Slack' and authorize the permissions",
        "Copy your Slack Bot Token from the API settings",
        "Paste the token in One Last AI Settings → Integrations → Slack",
        "Test the connection with a message"
      ]
    },
    {
      platform: "Discord",
      steps: [
        "Create a new application in Discord Developer Portal",
        "Add a Bot User to your application",
        "Copy the Bot Token",
        "In One Last AI, go to Settings → Integrations → Discord",
        "Paste your token and configure the command prefix"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="int-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#int-grid)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <Link href="/docs" className="inline-flex items-center gap-2 text-green-200 hover:text-white mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Docs</Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"><Link2 className="w-10 h-10 text-white" /></div>
              <h1 className="text-5xl md:text-6xl font-bold text-white">Integrations</h1>
            </div>
            <p className="text-xl text-green-100 max-w-3xl mx-auto mb-8">
              Connect your AI agents to the tools and platforms you already use. From Slack and Discord to enterprise solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#setup" className="bg-white text-green-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors">Get Started</a>
              <a href="#available" className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors">Browse Integrations</a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom section-padding-lg">
        
        {/* Integration Overview */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200 text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-bold text-neural-900 mb-2">Easy Setup</h3>
              <p className="text-neural-600 text-sm">
                Most integrations can be set up in minutes with step-by-step guides
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-lg font-bold text-neural-900 mb-2">Real-time Sync</h3>
              <p className="text-neural-600 text-sm">
                Keep your data synchronized across all platforms instantly
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200 text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-lg font-bold text-neural-900 mb-2">Secure</h3>
              <p className="text-neural-600 text-sm">
                Enterprise-grade security with encrypted credentials and tokens
              </p>
            </div>
          </div>
        </div>

        {/* Available Integrations */}
        <div id="available" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Available Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <div key={index} className="group bg-white rounded-2xl p-6 shadow-sm border border-neural-200 hover:shadow-md hover:border-blue-200 transition-all duration-300">
                <div className="text-3xl mb-4">{integration.icon}</div>
                <div className="mb-4">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {integration.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neural-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {integration.title}
                </h3>
                <p className="text-neural-600 mb-4 text-sm leading-relaxed">
                  {integration.description}
                </p>
                <a href={integration.href} className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                  Learn more →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Integrations */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Featured Integrations</h2>

          {/* Slack Section */}
          <div id="slack" className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">💬</div>
                <div>
                  <h3 className="text-2xl font-bold text-neural-900">Slack</h3>
                  <p className="text-neural-600">Connect agents directly to Slack channels and DMs</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-neural-900 mb-3">What You Can Do:</h4>
                <ul className="space-y-2 text-neural-700">
                  <li>✓ Respond to channel messages automatically</li>
                  <li>✓ Handle direct messages from team members</li>
                  <li>✓ Create slash commands for quick agent access</li>
                  <li>✓ Thread conversations for organized discussions</li>
                  <li>✓ Use rich formatting and reactions</li>
                </ul>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg mb-6">
                <h4 className="font-bold text-white mb-3">Example: Slack Command</h4>
                <code className="text-gray-200 text-sm">
                  {`/agent ask Help me debug this error in my code`}
                </code>
              </div>
            </div>
          </div>

          {/* Discord Section */}
          <div id="discord" className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">🎮</div>
                <div>
                  <h3 className="text-2xl font-bold text-neural-900">Discord</h3>
                  <p className="text-neural-600">Deploy AI agents as Discord bots for your community</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-neural-900 mb-3">What You Can Do:</h4>
                <ul className="space-y-2 text-neural-700">
                  <li>✓ Create interactive Discord bots</li>
                  <li>✓ Respond to messages in channels and DMs</li>
                  <li>✓ Use slash commands for quick interactions</li>
                  <li>✓ Display embeds and rich content</li>
                  <li>✓ Handle reactions and button interactions</li>
                </ul>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg mb-6">
                <h4 className="font-bold text-white mb-3">Example: Discord Slash Command</h4>
                <code className="text-gray-200 text-sm">
                  {`/help [topic]\n/agent ask [question]\n/support ticket [issue]`}
                </code>
              </div>
            </div>
          </div>

          {/* Teams Section */}
          <div id="teams" className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">💼</div>
                <div>
                  <h3 className="text-2xl font-bold text-neural-900">Microsoft Teams</h3>
                  <p className="text-neural-600">Enterprise-ready AI agents for Microsoft Teams</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-neural-900 mb-3">What You Can Do:</h4>
                <ul className="space-y-2 text-neural-700">
                  <li>✓ Deploy agents as Teams apps</li>
                  <li>✓ Integrate with enterprise directory</li>
                  <li>✓ Support for Teams channels and group chats</li>
                  <li>✓ Adaptive cards for rich interactions</li>
                  <li>✓ SSO and Azure AD authentication</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Webhooks Section */}
          <div id="webhooks" className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">🔗</div>
                <div>
                  <h3 className="text-2xl font-bold text-neural-900">Webhooks</h3>
                  <p className="text-neural-600">Trigger custom actions with real-time webhooks</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-neural-900 mb-3">What You Can Do:</h4>
                <ul className="space-y-2 text-neural-700">
                  <li>✓ Send events to custom endpoints</li>
                  <li>✓ Trigger workflows and automation</li>
                  <li>✓ Log conversations and analytics</li>
                  <li>✓ Integrate with any HTTP endpoint</li>
                  <li>✓ Retry mechanism with backoff</li>
                </ul>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg">
                <h4 className="font-bold text-white mb-3">Example: Webhook Payload</h4>
                <code className="text-gray-200 text-sm">
                  {`{
  "event": "message.received",
  "agent_id": "agent_123",
  "conversation_id": "conv_456",
  "message": "Hello, how can I help?",
  "timestamp": "2025-01-15T10:30:00Z"
}`}
                </code>
              </div>
            </div>
          </div>

          {/* Email Section */}
          <div id="email" className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">📧</div>
                <div>
                  <h3 className="text-2xl font-bold text-neural-900">Email</h3>
                  <p className="text-neural-600">Respond to incoming emails automatically with AI agents</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-neural-900 mb-3">What You Can Do:</h4>
                <ul className="space-y-2 text-neural-700">
                  <li>✓ Auto-respond to incoming emails</li>
                  <li>✓ Categorize and route emails</li>
                  <li>✓ Draft intelligent replies</li>
                  <li>✓ Track email history and threads</li>
                  <li>✓ Support for multiple email accounts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Custom APIs Section */}
          <div id="custom" className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">⚙️</div>
                <div>
                  <h3 className="text-2xl font-bold text-neural-900">Custom Integrations</h3>
                  <p className="text-neural-600">Build custom integrations with any third-party service</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-neural-900 mb-3">Popular Services:</h4>
                <ul className="space-y-2 text-neural-700">
                  <li>✓ CRM Systems (Salesforce, HubSpot)</li>
                  <li>✓ Project Management (Jira, Asana)</li>
                  <li>✓ Analytics Platforms (Google Analytics, Mixpanel)</li>
                  <li>✓ Payment Processors (Stripe, PayPal)</li>
                  <li>✓ Database Services (PostgreSQL, Firebase)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Guides */}
        <div id="setup" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Setup Guides</h2>
          
          {setupSteps.map((guide, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200 mb-6">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Setting up {guide.platform}</h3>
              <ol className="space-y-4">
                {guide.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {stepIndex + 1}
                    </span>
                    <span className="pt-1 text-neural-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Best Practices */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Integration Best Practices</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-4">Security</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-blue-600">🔐</span>
                  <span className="text-neural-700">Keep API keys and tokens secure</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  <span className="text-neural-700">Use environment variables for secrets</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">🛡️</span>
                  <span className="text-neural-700">Rotate credentials regularly</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">📋</span>
                  <span className="text-neural-700">Audit integration logs frequently</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-4">Performance</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-blue-600">⚡</span>
                  <span className="text-neural-700">Implement rate limiting</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">🔄</span>
                  <span className="text-neural-700">Use webhooks instead of polling</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">💾</span>
                  <span className="text-neural-700">Cache responses when possible</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">📊</span>
                  <span className="text-neural-700">Monitor integration metrics</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-4">Reliability</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-blue-600">🔁</span>
                  <span className="text-neural-700">Implement retry logic</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">⚠️</span>
                  <span className="text-neural-700">Handle errors gracefully</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">📝</span>
                  <span className="text-neural-700">Log all integration events</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">🧪</span>
                  <span className="text-neural-700">Test integrations thoroughly</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-4">Maintenance</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-blue-600">🔄</span>
                  <span className="text-neural-700">Keep dependencies updated</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">📚</span>
                  <span className="text-neural-700">Document integration setup</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">👥</span>
                  <span className="text-neural-700">Train team on integration usage</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">🎯</span>
                  <span className="text-neural-700">Regular integration audits</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Need More Integrations?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Our team is constantly adding new integrations. Can't find what you need? Build a custom integration with our API.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs/api" className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors">
              View API Docs
            </Link>
            <Link href="/docs/tutorials" className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors">
              Build Custom Integration
            </Link>
            <Link href="/support/contact-us" className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors">
              Request Integration
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
