'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const contentRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to content on mobile when section changes
  useEffect(() => {
    if (contentRef.current && window.innerWidth < 1024) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeSection])

  const agents = [
    { id: 'einstein', name: 'Einstein', description: 'Physics & Mathematics Expert - Master of scientific concepts and complex calculations', avatar: '🧠', color: 'from-amber-500 to-orange-600' },
    { id: 'chess-player', name: 'Chess Player', description: 'Strategic Thinking & Chess Master - Expert in chess strategies and competitive play', avatar: '♟️', color: 'from-slate-600 to-gray-800' },
    { id: 'comedy-king', name: 'Comedy King', description: 'Humor & Entertainment - Your go-to for jokes, comedy, and fun conversations', avatar: '🎭', color: 'from-yellow-500 to-amber-600' },
    { id: 'drama-queen', name: 'Drama Queen', description: 'Creative Storytelling & Drama - Expert in theatrical arts and emotional expression', avatar: '👑', color: 'from-purple-500 to-pink-600' },
    { id: 'lazy-pawn', name: 'Lazy Pawn', description: 'Relaxation & Work-Life Balance - Champion of taking it easy and avoiding burnout', avatar: '😴', color: 'from-green-400 to-teal-500' },
    { id: 'knight-logic', name: 'Knight Logic', description: 'Creative Problem Solving - Unconventional L-shaped thinking for unique solutions', avatar: '♞', color: 'from-indigo-500 to-blue-600' },
    { id: 'rook-jokey', name: 'Rook Jokey', description: 'Direct Communication with Humor - Straight talk with witty observations', avatar: '♜', color: 'from-red-500 to-rose-600' },
    { id: 'bishop-burger', name: 'Bishop Burger', description: 'Food & Cuisine Expert - Master of recipes, cooking tips, and culinary arts', avatar: '🍔', color: 'from-orange-500 to-red-600' },
    { id: 'tech-wizard', name: 'Tech Wizard', description: 'Technology & Programming - Expert in coding, software, and tech solutions', avatar: '💻', color: 'from-cyan-500 to-blue-600' },
    { id: 'chef-biew', name: 'Chef Biew', description: 'Professional Cooking & Recipes - Gourmet cooking techniques and recipe creation', avatar: '👨‍🍳', color: 'from-amber-600 to-yellow-500' },
    { id: 'fitness-guru', name: 'Fitness Guru', description: 'Fitness & Health Expert - Workout plans, nutrition, and wellness guidance', avatar: '💪', color: 'from-emerald-500 to-green-600' },
    { id: 'travel-buddy', name: 'Travel Buddy', description: 'Travel & Exploration - Destination planning, tips, and adventure ideas', avatar: '✈️', color: 'from-sky-500 to-indigo-600' },
    { id: 'professor-astrology', name: 'Professor Astrology', description: 'Astrology & Zodiac Expert - Horoscopes, star signs, and cosmic insights', avatar: '🔭', color: 'from-violet-500 to-purple-600' },
    { id: 'julie-girlfriend', name: 'Julie Girlfriend', description: 'Relationship Advice & Companionship - Friendly support and dating guidance', avatar: '💕', color: 'from-pink-400 to-rose-500' },
    { id: 'emma-emotional', name: 'Emma Emotional', description: 'Emotional Intelligence & Support - Empathetic listening and emotional guidance', avatar: '🤗', color: 'from-pink-500 to-rose-600' },
    { id: 'mrs-boss', name: 'Mrs Boss', description: 'Business & Management Expert - Leadership, strategy, and professional growth', avatar: '📊', color: 'from-slate-600 to-zinc-700' },
    { id: 'ben-sega', name: 'Ben Sega', description: 'Gaming & Retro Entertainment - Video games, retro classics, and gaming culture', avatar: '🎮', color: 'from-blue-500 to-indigo-600' },
    { id: 'nid-gaming', name: 'Nid Gaming', description: 'Gaming Expert & Streamer - Game tips, streaming advice, and esports strategies', avatar: '🕹️', color: 'from-purple-500 to-pink-600' },
  ]

  const sections = {
    'getting-started': {
      title: 'Getting Started',
      icon: '🚀',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-neural-900 mb-3">Welcome to Mumtaz AI</h3>
            <p className="text-neural-600 leading-relaxed">
              Mumtaz AI is a powerful platform that lets you interact with specialized AI agents for various purposes. Whether you need help with physics, cooking advice, emotional support, or entertainment, our 18 unique AI personalities are ready to assist you.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Getting Your First Agent Running</h4>
            <ol className="space-y-3 list-decimal list-inside text-neural-600">
              <li>Browse our library of 18 specialized AI agents</li>
              <li>Choose an agent that matches your needs</li>
              <li>Start a conversation directly or use our API</li>
              <li>Use Studio for enhanced features and Canvas for code generation</li>
            </ol>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Key Concepts</h4>
            <ul className="space-y-3 text-neural-600">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm">🤖</span>
                </span>
                <div><strong className="text-neural-900">Agents:</strong> 18 pre-built AI personalities with specialized knowledge</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 text-sm">🎨</span>
                </span>
                <div><strong className="text-neural-900">Studio:</strong> Enhanced chat interface with advanced features</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-sm">🖼️</span>
                </span>
                <div><strong className="text-neural-900">Canvas:</strong> AI-powered code and content generation workspace</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">🔑</span>
                </span>
                <div><strong className="text-neural-900">API Keys:</strong> Credentials to authenticate your API requests</div>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
            <p className="text-neural-700 text-sm">
              💡 <strong>Tip:</strong> Start with the &quot;Integration Guide&quot; section to learn how to connect Mumtaz AI to your platform.
            </p>
          </div>
        </div>
      )
    },
    'api-reference': {
      title: 'API Reference',
      icon: '📚',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-neural-900 mb-3">API Reference</h3>
            <p className="text-neural-600 leading-relaxed">
              The Mumtaz AI API provides RESTful endpoints for managing agents, conversations, and more.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Base URL</h4>
            <div className="bg-gray-900 p-4 rounded-xl font-mono text-sm text-green-400">
              https://api.mumtaz.ai/v1
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Core Endpoints</h4>
            <div className="space-y-3">
              <div className="bg-neural-50 p-4 rounded-xl border border-neural-200">
                <p className="font-mono"><span className="text-blue-600 font-bold">GET</span> <span className="text-neural-700">/agents</span></p>
                <p className="text-neural-500 text-sm mt-1">List all available agents</p>
              </div>
              <div className="bg-neural-50 p-4 rounded-xl border border-neural-200">
                <p className="font-mono"><span className="text-green-600 font-bold">POST</span> <span className="text-neural-700">/conversations</span></p>
                <p className="text-neural-500 text-sm mt-1">Create a new conversation with an agent</p>
              </div>
              <div className="bg-neural-50 p-4 rounded-xl border border-neural-200">
                <p className="font-mono"><span className="text-blue-600 font-bold">GET</span> <span className="text-neural-700">/conversations/:id</span></p>
                <p className="text-neural-500 text-sm mt-1">Retrieve conversation history</p>
              </div>
              <div className="bg-neural-50 p-4 rounded-xl border border-neural-200">
                <p className="font-mono"><span className="text-green-600 font-bold">POST</span> <span className="text-neural-700">/conversations/:id/messages</span></p>
                <p className="text-neural-500 text-sm mt-1">Send a message to an agent</p>
              </div>
              <div className="bg-neural-50 p-4 rounded-xl border border-neural-200">
                <p className="font-mono"><span className="text-green-600 font-bold">POST</span> <span className="text-neural-700">/canvas/generate</span></p>
                <p className="text-neural-500 text-sm mt-1">Generate code or content via Canvas</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Rate Limits</h4>
            <p className="text-neural-600">API requests are limited to 1000 requests per hour per API key. Premium plans have higher limits.</p>
          </div>
        </div>
      )
    },
    'authentication': {
      title: 'Authentication',
      icon: '🔐',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-neural-900 mb-3">Authentication</h3>
            <p className="text-neural-600 leading-relaxed">
              All Mumtaz AI API requests require authentication using an API key.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Getting Your API Key</h4>
            <ol className="space-y-3 list-decimal list-inside text-neural-600">
              <li>Navigate to your dashboard settings</li>
              <li>Go to &quot;API Keys&quot; section</li>
              <li>Click &quot;Generate New Key&quot;</li>
              <li>Copy and store it securely</li>
            </ol>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Using Your API Key</h4>
            <p className="text-neural-600 mb-3">Include your API key in the Authorization header:</p>
            <div className="bg-gray-900 p-4 rounded-xl font-mono text-sm text-green-400 overflow-x-auto">
              Authorization: Bearer YOUR_API_KEY
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Example Request</h4>
            <div className="bg-gray-900 p-4 rounded-xl font-mono text-sm text-green-400 overflow-x-auto">
              <pre>{`curl -X GET https://api.mumtaz.ai/v1/agents \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-5 rounded-xl">
            <p className="text-red-700 text-sm">
              🔒 <strong>Security:</strong> Never share your API key in public repositories or client-side code.
            </p>
          </div>
        </div>
      )
    },
    'integration-guide': {
      title: 'Integration Guide',
      icon: '🔗',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-neural-900 mb-3">Integration Guide</h3>
            <p className="text-neural-600 leading-relaxed">
              Learn how to integrate Mumtaz AI with your applications.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Web Integration</h4>
            <p className="text-neural-600 mb-3">Add a chat widget to your website:</p>
            <div className="bg-gray-900 p-4 rounded-xl font-mono text-sm text-blue-400 overflow-x-auto">
              <pre>{`<script src="https://cdn.mumtaz.ai/widget.js"></script>
<script>
  OnelastAI.init({
    apiKey: 'YOUR_API_KEY',
    agent: 'einstein' // or any agent id
  })
</script>`}</pre>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Slack Integration</h4>
            <ol className="space-y-2 list-decimal list-inside text-neural-600">
              <li>Go to your workspace settings</li>
              <li>Connect Mumtaz AI to your Slack workspace</li>
              <li>Authorize the required permissions</li>
              <li>Your agent is now available in Slack!</li>
            </ol>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Discord Integration</h4>
            <p className="text-neural-600">Similar to Slack, you can integrate Mumtaz AI with Discord to make your agents available as bots in your servers.</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
            <p className="text-neural-700 text-sm">
              💡 <strong>Tip:</strong> Use webhooks to trigger custom actions when agents respond.
            </p>
          </div>
        </div>
      )
    },
    'webhook-troubleshooting': {
      title: 'Webhook Troubleshooting',
      icon: '📡',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-neural-900 mb-3">Webhook Troubleshooting</h3>
            <p className="text-neural-600 leading-relaxed">
              Webhooks allow you to receive real-time updates about agent activities.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Setting Up Webhooks</h4>
            <div className="space-y-2 text-neural-600">
              <p>1. Configure a webhook URL in your dashboard</p>
              <p>2. Choose which events to subscribe to</p>
              <p>3. Mumtaz AI will POST to your URL when events occur</p>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Common Issues</h4>
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="font-bold text-amber-700">Webhook not triggering?</p>
                <p className="text-neural-600 text-sm mt-1">Check that your URL is publicly accessible and returns a 200 status code.</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="font-bold text-amber-700">Timeouts occurring?</p>
                <p className="text-neural-600 text-sm mt-1">Ensure your webhook endpoint processes requests within 30 seconds.</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="font-bold text-amber-700">Missing payload data?</p>
                <p className="text-neural-600 text-sm mt-1">Verify you&apos;re subscribing to the correct event types in your dashboard.</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Webhook Events</h4>
            <ul className="space-y-2 text-neural-600">
              <li className="flex items-center gap-2"><span className="text-green-500">●</span> <strong>message.sent:</strong> When an agent sends a message</li>
              <li className="flex items-center gap-2"><span className="text-blue-500">●</span> <strong>message.received:</strong> When an agent receives a message</li>
              <li className="flex items-center gap-2"><span className="text-purple-500">●</span> <strong>conversation.started:</strong> When a conversation begins</li>
              <li className="flex items-center gap-2"><span className="text-neural-500">●</span> <strong>conversation.ended:</strong> When a conversation ends</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 p-5 rounded-xl">
            <p className="text-green-700 text-sm">
              ✓ <strong>Pro Tip:</strong> Use webhook logs in your dashboard to debug delivery issues.
            </p>
          </div>
        </div>
      )
    },
    'canvas-builder': {
      title: 'Canvas Builder',
      icon: '🎨',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-neural-900 mb-3">Canvas Builder</h3>
            <p className="text-neural-600 leading-relaxed">
              Canvas is the AI-powered app generator on Mumtaz AI. Describe what you want to build in plain text and Canvas generates a fully functional web application — complete with HTML, CSS, JavaScript, and React components — in seconds.
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-fuchsia-600 p-6 rounded-xl text-white">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🎨</span>
              <div>
                <h4 className="text-xl font-bold">AI-Powered App Generation</h4>
                <p className="text-white/90 mt-1">201 built-in tools • 8 AI models • Live preview • One-click deploy</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Key Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'Text-to-App Generation', desc: 'Describe your app in natural language and get working code instantly' },
                { title: 'Live Preview', desc: 'See your app running in real-time as it generates — desktop, tablet & mobile views' },
                { title: '8 AI Models', desc: 'GPT-4o, Claude 3.5 Sonnet, Gemini 2.0, DeepSeek R1, Llama 3.3, and more' },
                { title: 'One-Click Deploy', desc: 'Publish your generated app to a live URL instantly from Canvas' },
                { title: '201 Built-in Tools', desc: 'Code formatters, color pickers, image generation, data visualization, and more' },
                { title: 'Version History', desc: 'Track every iteration, compare versions, and roll back to any previous state' },
                { title: 'Code Export', desc: 'Download clean production-ready HTML/CSS/JS or React code' },
                { title: 'Responsive Design', desc: 'Generated apps are mobile-friendly with responsive layouts by default' },
              ].map((feature, idx) => (
                <div key={idx} className="bg-neural-50 p-4 rounded-xl border border-neural-100">
                  <p className="font-semibold text-neural-900 mb-1">{feature.title}</p>
                  <p className="text-neural-600 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">How It Works</h4>
            <ol className="space-y-3 list-decimal list-inside text-neural-600">
              <li><strong className="text-neural-900">Describe</strong> — Type what you want to build in the chat prompt</li>
              <li><strong className="text-neural-900">Generate</strong> — Canvas AI creates fully functional code in seconds</li>
              <li><strong className="text-neural-900">Preview</strong> — See the live result in desktop, tablet or mobile view</li>
              <li><strong className="text-neural-900">Iterate</strong> — Request changes, add features, or refine the design</li>
              <li><strong className="text-neural-900">Deploy</strong> — Publish to a live URL or download the source code</li>
            </ol>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">What You Can Build</h4>
            <div className="flex flex-wrap gap-2">
              {['Landing Pages', 'Dashboards', 'Portfolios', 'E-commerce Stores', 'Games', 'Calculators', 'Data Visualizations', 'Interactive Forms', 'Blogs', 'Chat UIs', 'Animations', 'API Integrations'].map((item, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">{item}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">API Endpoint</h4>
            <div className="bg-gray-900 p-4 rounded-xl font-mono text-sm text-green-400 overflow-x-auto">
              <pre>{`POST /api/canvas/generate
{
  "prompt": "Build a weather dashboard with charts",
  "model": "gpt-4o",
  "framework": "react"
}`}</pre>
            </div>
          </div>

          <Link href="https://build.mumtaz.ai" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-xl font-semibold transition shadow-lg shadow-purple-500/25">
            Open Canvas Builder
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      )
    },
    'canvas-studio': {
      title: 'Canvas Studio IDE',
      icon: '🖥️',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-neural-900 mb-3">Canvas Studio IDE</h3>
            <p className="text-neural-600 leading-relaxed">
              Canvas Studio is the full-featured online IDE on Mumtaz AI. Unlike the single-prompt Canvas Builder, Canvas Studio gives you a complete development environment with a multi-file editor, file tree, terminal, live preview, and 17 starter templates — all powered by AI.
            </p>
          </div>

          <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 rounded-xl text-white">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🖥️</span>
              <div>
                <h4 className="text-xl font-bold">Full Online IDE</h4>
                <p className="text-white/90 mt-1">17 templates • Multi-file editor • Sandbox runner • 6 preview modes</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">IDE Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'Multi-Language Code Editor', desc: 'Syntax highlighting for HTML, CSS, JS, TypeScript, Python, React, Vue, and more' },
                { title: 'File Tree Manager', desc: 'Create, rename, delete, and organize files and folders — just like VS Code' },
                { title: 'Sandbox Code Runner', desc: 'Execute code in a secure sandbox environment with console output' },
                { title: 'Live Preview Modes', desc: '6 preview modes: Desktop, Tablet, Mobile, Split, Fullscreen, and Side-by-Side' },
                { title: 'Multi-AI Model Support', desc: 'Switch between GPT-4o, Claude 3.5, Gemini 2.0, DeepSeek, Llama 3.3 and more' },
                { title: 'Voice Input', desc: 'Speak your instructions and let AI generate or modify code for you' },
                { title: 'Video Editor', desc: 'Built-in video editing capabilities powered by AI' },
                { title: 'One-Click Deploy', desc: 'Publish your project to a live URL directly from the IDE' },
              ].map((feature, idx) => (
                <div key={idx} className="bg-neural-50 p-4 rounded-xl border border-neural-100">
                  <p className="font-semibold text-neural-900 mb-1">{feature.title}</p>
                  <p className="text-neural-600 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">17 Starter Templates</h4>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-neural-500 uppercase tracking-wider mb-2">HTML & Web</p>
                <div className="flex flex-wrap gap-2">
                  {['Blank HTML', 'Landing Page', 'Portfolio', 'Blog'].map((t, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-neural-500 uppercase tracking-wider mb-2">React & Frontend</p>
                <div className="flex flex-wrap gap-2">
                  {['React App', 'React Dashboard', 'React E-commerce', 'React + Tailwind'].map((t, i) => (
                    <span key={i} className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-sm border border-cyan-200">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-neural-500 uppercase tracking-wider mb-2">Backend & API</p>
                <div className="flex flex-wrap gap-2">
                  {['Node.js API', 'Express Server', 'Python Flask', 'REST API'].map((t, i) => (
                    <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-neural-500 uppercase tracking-wider mb-2">Advanced</p>
                <div className="flex flex-wrap gap-2">
                  {['Three.js 3D', 'Game Engine', 'Data Visualization', 'Full-Stack App', 'Vue.js App'].map((t, i) => (
                    <span key={i} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-sm border border-violet-200">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Canvas Builder vs Canvas Studio</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neural-200">
                    <th className="text-left py-3 px-4 text-neural-900">Feature</th>
                    <th className="text-center py-3 px-4 text-purple-600">Canvas Builder</th>
                    <th className="text-center py-3 px-4 text-violet-600">Canvas Studio</th>
                  </tr>
                </thead>
                <tbody className="text-neural-600">
                  <tr className="border-b border-neural-100"><td className="py-2 px-4">Single-prompt generation</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                  <tr className="border-b border-neural-100"><td className="py-2 px-4">Multi-file projects</td><td className="text-center">—</td><td className="text-center">✅</td></tr>
                  <tr className="border-b border-neural-100"><td className="py-2 px-4">File tree & editor</td><td className="text-center">—</td><td className="text-center">✅</td></tr>
                  <tr className="border-b border-neural-100"><td className="py-2 px-4">Sandbox code runner</td><td className="text-center">—</td><td className="text-center">✅</td></tr>
                  <tr className="border-b border-neural-100"><td className="py-2 px-4">17 starter templates</td><td className="text-center">—</td><td className="text-center">✅</td></tr>
                  <tr className="border-b border-neural-100"><td className="py-2 px-4">Live preview</td><td className="text-center">✅</td><td className="text-center">✅ (6 modes)</td></tr>
                  <tr className="border-b border-neural-100"><td className="py-2 px-4">One-click deploy</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                  <tr><td className="py-2 px-4">Voice input</td><td className="text-center">—</td><td className="text-center">✅</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="https://studio.mumtaz.ai" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-semibold transition shadow-lg shadow-violet-500/25">
              Open Canvas Studio
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link href="https://build.mumtaz.ai" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-neural-200 text-neural-700 rounded-xl font-semibold hover:bg-neural-50 transition">
              Open Canvas Builder
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      )
    }
  }

  const agentContent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) {
      return {
        title: 'Agent Not Found',
        icon: '❓',
        content: <p className="text-neural-600">This agent could not be found.</p>
      }
    }
    return {
      title: agent.name,
      icon: agent.avatar,
      content: (
        <div className="space-y-6">
          <div className={`bg-gradient-to-r ${agent.color} p-6 rounded-xl text-white`}>
            <div className="flex items-center gap-4">
              <span className="text-5xl">{agent.avatar}</span>
              <div>
                <h3 className="text-2xl font-bold">{agent.name}</h3>
                <p className="text-white/90 leading-relaxed mt-1">
                  {agent.description}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Overview</h4>
            <p className="text-neural-600">
              {agent.name} is a specialized AI agent designed to provide expert guidance and assistance. This agent brings unique expertise and personality to every conversation.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Capabilities</h4>
            <ul className="space-y-2 text-neural-600">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Expert knowledge in their field
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Conversational and friendly responses
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Real-time information retrieval
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Personalized recommendations
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">API Integration</h4>
            <div className="bg-gray-900 p-4 rounded-xl font-mono text-sm text-blue-400 overflow-x-auto">
              <pre>{`POST /conversations
{
  "agent_id": "${agentId}",
  "message": "Your message here"
}`}</pre>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-neural-900 mb-3">Use Cases</h4>
            <ul className="space-y-2 text-neural-600">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span> Customer support
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span> Content creation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span> Expert consultation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span> Interactive learning
              </li>
            </ul>
          </div>

          <Link href={`https://${agentId}.mumtaz.ai`} className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-500/25">
            Try {agent.name} Now
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      )
    }
  }

  const currentContent = activeSection.startsWith('agent-')
    ? agentContent(activeSection.replace('agent-', ''))
    : (sections as Record<string, { title: string; icon: string; content: React.ReactNode }>)[activeSection] || sections['getting-started']

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation & Agents</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">Learn everything about Mumtaz AI and explore our 18 specialized AI agents</p>
        </div>
      </section>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile: Vertical Stack, Desktop: Side-by-side */}
        <div className="flex flex-col lg:flex-row gap-6 lg:min-h-[600px]">
          
          {/* Left Sidebar / Top Panel - Navigation */}
          <div className="w-full lg:w-72 bg-white rounded-2xl border border-neural-200 shadow-lg p-5 lg:overflow-y-auto lg:flex-shrink-0 lg:max-h-[calc(100vh-200px)] lg:sticky lg:top-8">
            {/* Documentation Sections */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-neural-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Documentation
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                {[
                  { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
                  { id: 'api-reference', label: 'API Reference', icon: '📚' },
                  { id: 'authentication', label: 'Authentication', icon: '🔐' },
                  { id: 'integration-guide', label: 'Integration Guide', icon: '🔗' },
                  { id: 'webhook-troubleshooting', label: 'Troubleshooting', icon: '📡' },
                  { id: 'canvas-builder', label: 'Canvas Builder', icon: '🎨' },
                  { id: 'canvas-studio', label: 'Canvas Studio IDE', icon: '🖥️' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center gap-2 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-neural-600 hover:bg-neural-100 hover:text-neural-900'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Agents Section */}
            <div className="border-t border-neural-200 pt-5">
              <h3 className="text-xs font-bold text-neural-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                AI Agents ({agents.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5 max-h-[400px] lg:max-h-none overflow-y-auto">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setActiveSection(`agent-${agent.id}`)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${
                      activeSection === `agent-${agent.id}`
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-neural-600 hover:bg-neural-100 hover:text-neural-900'
                    }`}
                  >
                    <span className="text-base">{agent.avatar}</span>
                    <span className="text-xs lg:text-sm font-medium truncate">{agent.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel / Bottom Content - Content Display */}
          <div 
            ref={contentRef}
            className="flex-1 bg-white rounded-2xl border border-neural-200 shadow-lg p-6 lg:p-8 lg:overflow-y-auto scroll-mt-4"
          >
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-neural-200">
              <span className="text-4xl lg:text-5xl">{currentContent.icon}</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-neural-900">{currentContent.title}</h2>
            </div>
            {currentContent.content}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-white border-t border-neural-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-neural-900 mb-4">Ready to Get Started?</h2>
          <p className="text-neural-600 mb-8 max-w-2xl mx-auto">
            Browse our collection of 18 specialized AI agents or dive into our API documentation to start building.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://mumtaz.ai/agents" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Browse All Agents
            </Link>
            <Link href="/support" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-neural-100 hover:bg-neural-200 text-neural-700 rounded-xl font-semibold transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Get Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

