'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Code, Play, FileCode, Monitor, Smartphone, Tablet, Terminal, Upload, Mic, Palette, Layers, Video, Cpu, Globe, Rocket, ArrowLeft, Zap, Box, Settings } from 'lucide-react'

export default function CanvasStudioDocsPage() {
  const features = [
    {
      icon: <Code className="w-6 h-6" />,
      title: 'Multi-Language Editor',
      description: 'Full code editor with syntax highlighting for HTML, CSS, JavaScript, TypeScript, Python, Go, Java, Rust, Bash, SQL, and more.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Play className="w-6 h-6" />,
      title: 'Sandbox Code Runner',
      description: 'Execute JavaScript, Python, and Bash code in a secure sandboxed environment. See output instantly without leaving the IDE.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Monitor className="w-6 h-6" />,
      title: 'Live Preview Modes',
      description: 'Preview your app in Code, Preview, Split, Desktop, Tablet, and Mobile views. Real-time rendering as you type.',
      color: 'from-purple-500 to-fuchsia-500'
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'Multi-AI Model Support',
      description: 'Choose from 8 AI providers: OpenAI, Anthropic, Groq, Mistral, Cohere, xAI, Google Gemini, and Cerebras.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <Mic className="w-6 h-6" />,
      title: 'Voice Input',
      description: 'Speak your code requirements — voice-to-code transcription converts speech into working code instantly.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: 'Video Editor',
      description: 'Built-in multi-track video composition tool for creating tutorials, demos, and promotional content.',
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: <Upload className="w-6 h-6" />,
      title: 'One-Click Deploy',
      description: 'Deploy your projects directly from the IDE. Publish live to the web with automatic hosting and SSL.',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      icon: <FileCode className="w-6 h-6" />,
      title: 'File Tree Manager',
      description: 'Full file system — create, edit, delete, rename files and directories. Track terminal commands and changes.',
      color: 'from-amber-500 to-orange-500'
    }
  ]

  const templates = [
    { category: 'HTML & Web', items: [
      { name: 'SaaS Landing Page', desc: 'Marketing site with features, pricing, testimonials', icon: '🚀' },
      { name: 'Portfolio', desc: 'Personal portfolio with skills showcase', icon: '🎨' },
      { name: 'Dashboard', desc: 'Real-time analytics dashboard', icon: '📊' },
      { name: 'E-commerce Store', desc: 'Product catalog with cart & filtering', icon: '🛒' },
      { name: 'HTML Game', desc: 'Interactive web-based game', icon: '🎮' },
    ]},
    { category: 'React & Frontend', items: [
      { name: 'React Dashboard', desc: 'Dashboard with state management', icon: '⚛️' },
      { name: 'React Todo App', desc: 'Todo app with local persistence', icon: '✅' },
    ]},
    { category: 'Backend & API', items: [
      { name: 'Python API', desc: 'REST API server with routing', icon: '🐍' },
      { name: 'Express API', desc: 'Node.js Express server', icon: '🟢' },
      { name: 'Go API', desc: 'Go microservice', icon: '🐹' },
      { name: 'Java API', desc: 'Spring Boot application', icon: '☕' },
      { name: 'SQL Schema', desc: 'Database schema templates', icon: '🗄️' },
    ]},
    { category: 'Advanced', items: [
      { name: 'Python ML', desc: 'Machine learning model training', icon: '🧠' },
      { name: 'Python Scraper', desc: 'Web scraping pipeline', icon: '🕷️' },
      { name: 'Rust CLI', desc: 'Command-line tool', icon: '🦀' },
      { name: 'Bash Deploy', desc: 'Deployment automation scripts', icon: '📜' },
      { name: 'Docker Node', desc: 'Containerized Node.js app', icon: '🐳' },
    ]},
  ]

  const aiModels = [
    { name: 'OpenAI', models: 'GPT-4o, GPT-4o-mini', icon: '🟢' },
    { name: 'Anthropic', models: 'Claude 4 Sonnet, Claude 3.5', icon: '🟠' },
    { name: 'Google', models: 'Gemini 2.5 Flash, Gemini Pro', icon: '🔵' },
    { name: 'Groq', models: 'Llama 3, Mixtral', icon: '⚡' },
    { name: 'Mistral', models: 'Mistral Large, Medium', icon: '🌊' },
    { name: 'xAI', models: 'Grok-2, Grok-1', icon: '🤖' },
    { name: 'Cohere', models: 'Command R+, Command R', icon: '🔶' },
    { name: 'Cerebras', models: 'Llama 3.1 70B', icon: '🧠' },
  ]

  const steps = [
    {
      step: 1,
      title: 'Choose a Template or Start Blank',
      description: 'Select from 17 pre-built templates spanning HTML, React, Python, Go, Java, and more — or start with a blank canvas.',
    },
    {
      step: 2,
      title: 'Describe What You Want',
      description: 'Use the AI chat panel to describe features, changes, or entire applications in natural language. Voice input is also supported.',
    },
    {
      step: 3,
      title: 'Edit & Preview',
      description: 'See your code and live preview side-by-side. Switch between desktop, tablet, and mobile views. Edit code directly or let AI iterate.',
    },
    {
      step: 4,
      title: 'Run & Test',
      description: 'Execute code in the sandbox runner to test JavaScript, Python, or Bash scripts. View console output right in the IDE.',
    },
    {
      step: 5,
      title: 'Deploy Live',
      description: 'One-click deployment publishes your project to the web with automatic hosting, SSL, and a shareable URL.',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="studio-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#studio-grid)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link href="/docs" className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Docs
            </Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Code className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white">Canvas Studio</h1>
            </div>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto mb-8">
              A full-featured cloud IDE with 17 templates, 8 AI models, sandbox code execution,
              voice input, video editor, and one-click deployment
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { label: 'Templates', value: '17' },
                { label: 'AI Models', value: '8' },
                { label: 'Languages', value: '10+' },
                { label: 'Preview Modes', value: '6' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white/15 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center"
                >
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-purple-100">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Launch CTA */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-neural-900 via-neural-800 to-neural-900 rounded-2xl p-8 text-center text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">Ready to Build?</h2>
              <p className="text-neural-300 mb-6">Jump into the full IDE and start creating with AI-powered code generation.</p>
              <Link href="https://studio.mumtaz.ai" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-xl font-semibold hover:opacity-90 transition">
                <Rocket className="w-5 h-5" />
                Launch Canvas Studio
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">IDE Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-neural-100 hover:shadow-lg transition"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-neural-800 mb-2">{feature.title}</h3>
                <p className="text-neural-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">How It Works</h2>
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-neural-100"
              >
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neural-800 mb-2">{step.title}</h3>
                    <p className="text-neural-600">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">17 Built-in Templates</h2>
          <div className="space-y-8">
            {templates.map((group, gIdx) => (
              <div key={gIdx}>
                <h3 className="text-lg font-bold text-neural-700 mb-4">{group.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (gIdx * 5 + idx) * 0.03 }}
                      className="bg-white rounded-xl p-5 shadow-sm border border-neural-100 hover:border-purple-200 transition"
                    >
                      <div className="text-3xl mb-3">{item.icon}</div>
                      <h4 className="font-bold text-neural-800 mb-1">{item.name}</h4>
                      <p className="text-sm text-neural-600">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Models */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">8 AI Providers</h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {aiModels.map((model, idx) => (
                <div key={idx} className="text-center p-4 bg-neural-50 rounded-xl hover:bg-purple-50 transition">
                  <div className="text-3xl mb-2">{model.icon}</div>
                  <h4 className="font-bold text-neural-800 text-sm">{model.name}</h4>
                  <p className="text-xs text-neural-500">{model.models}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Modes */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">Preview Modes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: <Code className="w-6 h-6" />, name: 'Code', desc: 'Full editor view' },
              { icon: <Globe className="w-6 h-6" />, name: 'Preview', desc: 'Full preview' },
              { icon: <Layers className="w-6 h-6" />, name: 'Split', desc: 'Side by side' },
              { icon: <Monitor className="w-6 h-6" />, name: 'Desktop', desc: '1920×1080' },
              { icon: <Tablet className="w-6 h-6" />, name: 'Tablet', desc: '768×1024' },
              { icon: <Smartphone className="w-6 h-6" />, name: 'Mobile', desc: '375×812' },
            ].map((mode, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-neural-100 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white mx-auto mb-3">
                  {mode.icon}
                </div>
                <h4 className="font-bold text-neural-800 text-sm">{mode.name}</h4>
                <p className="text-xs text-neural-500">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Start Building Now</h2>
            <p className="text-lg opacity-90 mb-8">
              Create full-stack applications with AI assistance in your browser.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://studio.mumtaz.ai" className="btn-primary bg-white text-purple-600 hover:bg-neural-50">
                Open Canvas Studio
              </Link>
              <Link href="/docs/canvas" className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-purple-600">
                Canvas Builder Docs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
