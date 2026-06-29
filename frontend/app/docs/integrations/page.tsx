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
        "Go to Slack App Directory and search for Mumtaz AI",
        "Click 'Add to Slack' and authorize the permissions",
        "Copy your Slack Bot Token from the API settings",
        "Paste the token in Mumtaz AI Settings → Integrations → Slack",
        "Test the connection with a message"
      ]
    },
    {
      platform: "Discord",
      steps: [
        "Create a new application in Discord Developer Portal",
        "Add a Bot User to your application",
        "Copy the Bot Token",
        "In Mumtaz AI, go to Settings → Integrations → Discord",
        "Paste your token and configure the command prefix"
      ]
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
              <div className="w-16 h-16 p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg flex items-center justify-center"><Link2 className="w-10 h-10 text-purple-600" /></div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Integrations</h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Connect your AI agents to the tools and platforms you already use. From Slack and Discord to enterprise solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#setup" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] px-6 py-3 rounded-lg font-semibold transition-all">Get Started</a>
              <a href="#available" className="bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 hover:bg-white/50 px-6 py-3 rounded-lg font-semibold transition-colors">Browse Integrations</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-custom section-padding-lg">
        
        {/* Integration Overview */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Easy Setup</h3>
              <p className="text-slate-500 text-sm">
                Most integrations can be set up in minutes with step-by-step guides
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Real-time Sync</h3>
              <p className="text-slate-500 text-sm">
                Keep your data synchronized across all platforms instantly
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Secure</h3>
              <p className="text-slate-500 text-sm">
                Enterprise-grade security with encrypted credentials and tokens
              </p>
            </div>
          </div>
        </div>

        {/* Available Integrations */}
        <div id="available" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Available Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <div key={index} className="group glass-card p-6 hover:shadow-md hover:border-blue-200 transition-all duration-300">
                <div className="text-3xl mb-4">{integration.icon}</div>
                <div className="mb-4">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {integration.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                  {integration.title}
                </h3>
                <p className="text-slate-500 mb-4 text-sm leading-relaxed">
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
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Featured Integrations</h2>

          {/* Slack Section */}
          <div id="slack" className="mb-12">
            <div className="glass-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">💬</div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Slack</h3>
                  <p className="text-slate-500">Connect agents directly to Slack channels and DMs</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-slate-800 mb-3">What You Can Do:</h4>
                <ul className="space-y-2 text-slate-600">
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
            <div className="glass-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">🎮</div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Discord</h3>
                  <p className="text-slate-500">Deploy AI agents as Discord bots for your community</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-slate-800 mb-3">What You Can Do:</h4>
                <ul className="space-y-2 text-slate-600">
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
            <div className="glass-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">💼</div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Microsoft Teams</h3>
                  <p className="text-slate-500">Enterprise-ready AI agents for Microsoft Teams</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-slate-800 mb-3">What You Can Do:</h4>
                <ul className="space-y-2 text-slate-600">
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
            <div className="glass-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">🔗</div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Webhooks</h3>
                  <p className="text-slate-500">Trigger custom actions with real-time webhooks</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-slate-800 mb-3">What You Can Do:</h4>
                <ul className="space-y-2 text-slate-600">
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
            <div className="glass-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">📧</div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Email</h3>
                  <p className="text-slate-500">Respond to incoming emails automatically with AI agents</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-slate-800 mb-3">What You Can Do:</h4>
                <ul className="space-y-2 text-slate-600">
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
            <div className="glass-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">⚙️</div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Custom Integrations</h3>
                  <p className="text-slate-500">Build custom integrations with any third-party service</p>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <h4 className="text-lg font-bold text-slate-800 mb-3">Popular Services:</h4>
                <ul className="space-y-2 text-slate-600">
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
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Setup Guides</h2>
          
          {setupSteps.map((guide, index) => (
            <div key={index} className="glass-card p-8 mb-6">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Setting up {guide.platform}</h3>
              <ol className="space-y-4">
                {guide.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {stepIndex + 1}
                    </span>
                    <span className="pt-1 text-slate-600">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Best Practices */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Integration Best Practices</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Security</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-blue-600">🔐</span>
                  <span className="text-slate-600">Keep API keys and tokens secure</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  <span className="text-slate-600">Use environment variables for secrets</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">🛡️</span>
                  <span className="text-slate-600">Rotate credentials regularly</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">📋</span>
                  <span className="text-slate-600">Audit integration logs frequently</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Performance</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-blue-600">⚡</span>
                  <span className="text-slate-600">Implement rate limiting</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">🔄</span>
                  <span className="text-slate-600">Use webhooks instead of polling</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">💾</span>
                  <span className="text-slate-600">Cache responses when possible</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">📊</span>
                  <span className="text-slate-600">Monitor integration metrics</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Reliability</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-blue-600">🔁</span>
                  <span className="text-slate-600">Implement retry logic</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">⚠️</span>
                  <span className="text-slate-600">Handle errors gracefully</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">📝</span>
                  <span className="text-slate-600">Log all integration events</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">🧪</span>
                  <span className="text-slate-600">Test integrations thoroughly</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Maintenance</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-blue-600">🔄</span>
                  <span className="text-slate-600">Keep dependencies updated</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">📚</span>
                  <span className="text-slate-600">Document integration setup</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">👥</span>
                  <span className="text-slate-600">Train team on integration usage</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">🎯</span>
                  <span className="text-slate-600">Regular integration audits</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center themed-section-bg">
          <div className="absolute -left-10 top-1/4 w-48 h-[300px] rounded-[80px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
          <div className="absolute -right-10 -top-10 w-56 h-[350px] rounded-[80px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Need More Integrations?</h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Our team is constantly adding new integrations. Can't find what you need? Build a custom integration with our API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs/api" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all">
                View API Docs
              </Link>
              <Link href="/docs/tutorials" className="px-6 py-3 bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 hover:bg-white/50 rounded-lg font-semibold transition-colors">
                Build Custom Integration
              </Link>
              <Link href="/support/contact-us" className="px-6 py-3 bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 hover:bg-white/50 rounded-lg font-semibold transition-colors">
                Request Integration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
