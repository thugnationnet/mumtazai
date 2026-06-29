'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Bot, Paintbrush, Wrench, Beaker, Database, Code, Link2, Terminal, GraduationCap, LifeBuoy } from 'lucide-react'

export default function Docs() {
  const docSections = [
    {
      title: "Agent Documentation",
      description: "Learn how to create, configure, and deploy 18 specialized AI agents with unique personalities",
      icon: <Bot className="w-6 h-6" />,
      href: "/docs/agents",
      topics: ["Getting Started", "Configuration", "API Reference", "Best Practices"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Canvas Builder",
      description: "Build complete web applications with AI-powered code generation from natural language",
      icon: <Paintbrush className="w-6 h-6" />,
      href: "/docs/canvas",
      topics: ["Text to App", "Live Preview", "Export Code", "Components"],
      color: "from-purple-500 to-fuchsia-500"
    },
    {
      title: "Canvas Studio",
      description: "Full-featured IDE with 17 templates, multi-language support, sandbox execution, and deployment",
      icon: <Code className="w-6 h-6" />,
      href: "/docs/canvas-studio",
      topics: ["IDE Features", "Templates", "Code Runner", "Deployment"],
      color: "from-violet-500 to-purple-600"
    },
    {
      title: "Tools & Utilities",
      description: "389 powerful tools across 46 categories — file ops, image processing, security, AI/ML, and more",
      icon: <Wrench className="w-6 h-6" />,
      href: "/docs/tools",
      topics: ["File System", "Image & Video", "Security", "AI & ML"],
      color: "from-amber-500 to-orange-500"
    },
    {
      title: "AI Lab",
      description: "13 cutting-edge AI experiments — battle arena, music generator, voice cloning, neural art, and more",
      icon: <Beaker className="w-6 h-6" />,
      href: "/docs/lab",
      topics: ["Experiments", "Battle Arena", "Voice Cloning", "Neural Art"],
      color: "from-pink-500 to-rose-500"
    },
    {
      title: "Data Generator",
      description: "Generate realistic test data for your applications — users, products, analytics, and more",
      icon: <Database className="w-6 h-6" />,
      href: "/docs/data-generator",
      topics: ["Users & Profiles", "Products", "Analytics", "Custom Data"],
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "API Reference",
      description: "Complete API documentation for all 50+ endpoints and methods",
      icon: <BookOpen className="w-6 h-6" />,
      href: "/docs/api",
      topics: ["Authentication", "Endpoints", "Rate Limits", "Error Codes"],
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Integration Guides",
      description: "Step-by-step guides for integrating with popular platforms and services",
      icon: <Link2 className="w-6 h-6" />,
      href: "/docs/integrations",
      topics: ["Slack", "Discord", "Teams", "Webhooks"],
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "SDKs & Libraries",
      description: "Official SDKs and community libraries for 6 programming languages",
      icon: <Terminal className="w-6 h-6" />,
      href: "/docs/sdks",
      topics: ["JavaScript", "Python", "Go", "PHP"],
      color: "from-teal-500 to-cyan-500"
    },
    {
      title: "Tutorials",
      description: "Hands-on tutorials from beginner to advanced for building AI experiences",
      icon: <GraduationCap className="w-6 h-6" />,
      href: "/docs/tutorials",
      topics: ["Quick Start", "Advanced Features", "Use Cases", "Examples"],
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "Support",
      description: "Get help, report bugs, and connect with the community",
      icon: <LifeBuoy className="w-6 h-6" />,
      href: "/support",
      topics: ["FAQ", "Contact Support", "Community", "Bug Reports"],
      color: "from-rose-500 to-pink-500"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
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
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-300/40 rounded-full px-4 py-1.5 mb-6">
              <span className="text-purple-700 text-xs font-bold uppercase tracking-wider">Documentation</span>
            </div>
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                <BookOpen className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Documentation</h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everything you need to build amazing AI experiences — agents, app builders, 389 tools, and 13 experiments
            </p>
          </motion.div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              { label: 'AI Agents', value: '18', color: 'text-yellow-300' },
              { label: 'Tools', value: '389', color: 'text-green-300' },
              { label: 'Experiments', value: '13', color: 'text-cyan-300' },
              { label: 'Templates', value: '17', color: 'text-pink-300' },
              { label: 'API Endpoints', value: '50+', color: 'text-orange-300' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/40 backdrop-blur-lg rounded-xl p-4 border border-white/60 text-center"
              >
                <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {docSections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Link href={section.href} className="group glass-card p-6 hover:-translate-y-1 transition-all duration-300 block h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-white`}>
                  {section.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {section.description}
                </p>
                <ul className="space-y-2">
                  {section.topics.map((topic, topicIndex) => (
                    <li key={topicIndex} className="text-sm text-slate-400 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Start */}
        <div className="glass-card p-8 mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-700 mb-6">Quick Start</h2>
            <p className="text-lg text-slate-500 mb-8">
              Get up and running with your first AI agent in minutes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                  1
                </div>
                <h3 className="font-bold text-slate-700 mb-2">Choose a Feature</h3>
                <p className="text-sm text-slate-500">Pick from agents, canvas builder, studio, or tools</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-xl">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                  2
                </div>
                <h3 className="font-bold text-slate-700 mb-2">Configure</h3>
                <p className="text-sm text-slate-500">Customize settings, choose AI models, or select templates</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                  3
                </div>
                <h3 className="font-bold text-slate-700 mb-2">Build & Deploy</h3>
                <p className="text-sm text-slate-500">Create your project and deploy it live</p>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs/agents" className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all shadow-lg">
                View Agent Docs
              </Link>
              <Link href="/docs/canvas-studio" className="inline-flex items-center bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 px-6 py-3 rounded-xl font-semibold hover:bg-white/50 transition-all">
                Canvas Studio Docs
              </Link>
            </div>
          </div>
        </div>

        {/* Popular Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-slate-700 mb-4">Popular Guides</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs/agents/getting-started" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Getting Started with Agents →
                </Link>
              </li>
              <li>
                <Link href="/docs/canvas-studio" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Canvas Studio IDE Guide →
                </Link>
              </li>
              <li>
                <Link href="/docs/tools" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  389 Tools Reference →
                </Link>
              </li>
              <li>
                <Link href="/docs/lab" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  AI Lab Experiments →
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  API Authentication →
                </Link>
              </li>
            </ul>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-slate-700 mb-4">Need Help?</h3>
            <p className="text-slate-500 mb-4">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="space-y-3">
              <Link href="/support/contact-us" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Contact Support →
              </Link>
              <Link href="/community" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Join Community →
              </Link>
              <Link href="/support/help-center" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Browse FAQ →
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center themed-section-bg">
            <div className="absolute -left-10 top-1/4 w-40 h-[300px] rounded-[60px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
            <div className="absolute -right-10 -top-10 w-48 h-[350px] rounded-[60px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Ready to Build?</h2>
              <p className="text-lg text-slate-600 mb-8">
                Start creating powerful AI experiences with our comprehensive documentation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/docs/agents/getting-started" className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all shadow-lg">
                  Get Started
                </Link>
                <Link href="/demo" className="inline-flex items-center bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 px-6 py-3 rounded-xl font-semibold hover:bg-white/50 transition-all">
                  Request Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}