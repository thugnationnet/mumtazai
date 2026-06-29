'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Layout, Code, Sparkles, Download, Play, Zap, Layers, Palette, Settings, FileCode, Rocket } from 'lucide-react'

export default function CanvasDocsPage() {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Text to App',
      description: 'Describe your app in plain English and watch it come to life. Our AI understands your intent and generates functional React components.',
      color: 'from-purple-500 to-fuchsia-500'
    },
    {
      icon: <Play className="w-6 h-6" />,
      title: 'Live Preview',
      description: 'See your application running in real-time as it\'s being generated. Make adjustments and see changes instantly.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: 'Clean Code Output',
      description: 'Generated code follows best practices with proper component structure, TypeScript types, and Tailwind CSS styling.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Export & Deploy',
      description: 'Download your generated application as a complete project ready for deployment to Vercel, Netlify, or any hosting platform.',
      color: 'from-orange-500 to-red-500'
    }
  ]

  const useCases = [
    { title: 'Landing Pages', description: 'Create beautiful marketing pages with hero sections, features, testimonials, and CTAs', icon: '🎯' },
    { title: 'Dashboards', description: 'Build data visualization dashboards with charts, metrics, and interactive widgets', icon: '📊' },
    { title: 'Forms & Surveys', description: 'Generate complex forms with validation, multi-step wizards, and data collection', icon: '📝' },
    { title: 'E-commerce', description: 'Create product listings, shopping carts, and checkout flows', icon: '🛒' },
    { title: 'Admin Panels', description: 'Build CRUD interfaces, data tables, and management consoles', icon: '⚙️' },
    { title: 'Portfolio Sites', description: 'Design personal portfolios, galleries, and showcase pages', icon: '🎨' }
  ]

  const steps = [
    {
      step: 1,
      title: 'Describe Your App',
      description: 'Type a natural language description of what you want to build. Be specific about features, styling, and functionality.',
      example: '"Create a modern dashboard with a sidebar navigation, header with user profile, and main content area showing analytics cards with charts"'
    },
    {
      step: 2,
      title: 'AI Generates Code',
      description: 'Our AI analyzes your request and generates a complete React component with proper structure, styling, and interactivity.',
      example: 'Watch as the code appears in the editor with syntax highlighting and real-time compilation.'
    },
    {
      step: 3,
      title: 'Preview & Iterate',
      description: 'See your app running in the live preview panel. Request modifications or enhancements to refine the output.',
      example: '"Add a dark mode toggle to the header" or "Make the sidebar collapsible"'
    },
    {
      step: 4,
      title: 'Export & Use',
      description: 'Download the complete project with all dependencies, or copy individual components to integrate into your existing codebase.',
      example: 'Get a ready-to-run project with package.json, components, and configuration files.'
    }
  ]

  const techStack = [
    { name: 'React', description: 'Modern component-based architecture', icon: '⚛️' },
    { name: 'TypeScript', description: 'Type-safe code generation', icon: '📘' },
    { name: 'Tailwind CSS', description: 'Utility-first styling', icon: '🎨' },
    { name: 'Lucide Icons', description: 'Beautiful icon library', icon: '✨' },
    { name: 'Recharts', description: 'Data visualization charts', icon: '📈' },
    { name: 'Framer Motion', description: 'Smooth animations', icon: '🎬' }
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link href="/docs" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-700 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Docs
            </Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg flex items-center justify-center">
                <Palette className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Canvas Builder</h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Build complete web applications with AI-powered code generation.
              Describe what you want, and watch it come to life.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { label: 'Use Cases', value: '6+' },
                { label: 'Tech Stack', value: '6' },
                { label: 'AI Models', value: 'Multi' },
                { label: 'Export', value: 'Instant' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white/40 backdrop-blur-lg rounded-xl p-4 border border-white/60 text-center"
                >
                  <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* Quick Start CTA */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative overflow-hidden rounded-2xl p-8 text-center themed-section-bg">
            <div className="absolute -left-10 top-1/4 w-48 h-[300px] rounded-[80px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
            <div className="absolute -right-10 -top-10 w-56 h-[350px] rounded-[80px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Ready to Build?</h2>
              <p className="text-slate-600 mb-6">Jump right in and start creating your first app with Canvas Builder.</p>
              <Link href="https://studio.mumtaz.ai" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all">
                <Rocket className="w-5 h-5" />
                Launch Canvas Builder
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-700 text-center mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="glass-card p-6 hover:shadow-lg transition">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">{feature.title}</h3>
                <p className="text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-700 text-center mb-8">How It Works</h2>
          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={idx} className="glass-card p-6">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-700 mb-2">{step.title}</h3>
                    <p className="text-slate-500 mb-4">{step.description}</p>
                    <div className="bg-transparent rounded-lg p-4 border border-white/80">
                      <p className="text-sm text-slate-600 italic">{step.example}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-700 text-center mb-8">What You Can Build</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase, idx) => (
              <div key={idx} className="glass-card p-5 hover:border-purple-200 transition">
                <div className="text-3xl mb-3">{useCase.icon}</div>
                <h3 className="font-bold text-slate-700 mb-1">{useCase.title}</h3>
                <p className="text-sm text-slate-500">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-700 text-center mb-8">Generated Tech Stack</h2>
          <div className="glass-card p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {techStack.map((tech, idx) => (
                <div key={idx} className="text-center p-4 bg-transparent rounded-xl">
                  <div className="text-3xl mb-2">{tech.icon}</div>
                  <h4 className="font-bold text-slate-700 text-sm">{tech.name}</h4>
                  <p className="text-xs text-slate-400">{tech.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-700 text-center mb-8">Pro Tips</h2>
          <div className="glass-card p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Be Specific</h4>
                  <p className="text-sm text-slate-500">Include details about layout, colors, and functionality for better results.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Iterate</h4>
                  <p className="text-sm text-slate-500">Start simple and add features incrementally through conversation.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Reference Examples</h4>
                  <p className="text-sm text-slate-500">Mention well-known sites or apps as style references.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Use Components</h4>
                  <p className="text-sm text-slate-500">Ask for specific UI patterns like "add a modal" or "include a data table".</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center themed-section-bg">
            <div className="absolute -left-10 top-1/4 w-48 h-[300px] rounded-[80px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
            <div className="absolute -right-10 -top-10 w-56 h-[350px] rounded-[80px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Start Building Now</h2>
              <p className="text-lg text-slate-600 mb-8">
                Transform your ideas into working applications in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="https://studio.mumtaz.ai" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all">
                  Open Canvas Builder
                </Link>
                <Link href="/resources/tutorials" className="px-6 py-3 bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 font-semibold rounded-xl hover:bg-white/50 transition">
                  View Tutorials
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
