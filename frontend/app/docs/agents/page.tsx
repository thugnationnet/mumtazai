'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Cog, Users, Code, Lightbulb, Wrench, Bot, ArrowRight, ArrowLeft } from 'lucide-react'
import { getAgentChatUrl } from '@/lib/agentUrl'

export default function DocsAgents() {
  const agentDocs = [
    {
      title: "Getting Started with Agents",
      description: "Learn the basics of creating and deploying AI agents",
      category: "Introduction",
      readTime: "5 min",
      href: "/docs/agents/getting-started",
      icon: BookOpen,
      color: "brand"
    },
    {
      title: "Agent Configuration",
      description: "How to configure your agents for optimal performance",
      category: "Configuration",
      readTime: "8 min",
      href: "/docs/agents/configuration",
      icon: Cog,
      color: "purple"
    },
    {
      title: "Available Agent Types",
      description: "Explore all the different types of agents you can deploy",
      category: "Reference",
      readTime: "12 min",
      href: "/docs/agents/agents-type",
      icon: Users,
      color: "accent"
    },
    {
      title: "Agent API Reference",
      description: "Complete API documentation for agent integration",
      category: "API",
      readTime: "15 min",
      href: "/docs/agents/api-reference",
      icon: Code,
      color: "green"
    },
    {
      title: "Best Practices",
      description: "Tips and tricks for getting the most out of your agents",
      category: "Guide",
      readTime: "10 min",
      href: "/docs/agents/best-practices",
      icon: Lightbulb,
      color: "yellow"
    },
    {
      title: "Troubleshooting",
      description: "Common issues and how to resolve them",
      category: "Support",
      readTime: "6 min",
      href: "/docs/agents/troubleshooting",
      icon: Wrench,
      color: "orange"
    }
  ]

  const availableAgents = [
    { name: "Ben Sega", slug: "ben-sega", specialty: "Gaming & Entertainment", emoji: "🎮" },
    { name: "Einstein", slug: "einstein", specialty: "Scientific Research", emoji: "🔬" },
    { name: "Chef Biew", slug: "chef-biew", specialty: "Culinary Arts", emoji: "👨‍🍳" },
    { name: "Tech Wizard", slug: "tech-wizard", specialty: "Technology Support", emoji: "💻" },
    { name: "Travel Buddy", slug: "travel-buddy", specialty: "Travel Planning", emoji: "✈️" },
    { name: "Fitness Guru", slug: "fitness-guru", specialty: "Health & Fitness", emoji: "💪" },
  ]

  const getIconColor = (color: string) => {
    switch (color) {
      case 'brand': return 'bg-blue-100 text-blue-600'
      case 'purple': return 'bg-purple-100 text-purple-600'
      case 'accent': return 'bg-indigo-100 text-indigo-600'
      case 'green': return 'bg-green-100 text-green-600'
      case 'yellow': return 'bg-yellow-100 text-yellow-600'
      case 'orange': return 'bg-orange-100 text-orange-600'
      default: return 'bg-blue-100 text-blue-600'
    }
  }

  const getCategoryColor = (color: string) => {
    switch (color) {
      case 'brand': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'accent': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'green': return 'bg-green-50 text-green-700 border-green-200'
      case 'yellow': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'orange': return 'bg-orange-50 text-orange-700 border-orange-200'
      default: return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <Link href="/docs" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-700 mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Docs</Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg"><Bot className="w-10 h-10 text-purple-600" /></div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Agent Documentation</h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive guides and documentation for working with AI agents
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-custom section-padding">

        {/* Documentation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {agentDocs.map((doc, index) => {
            const IconComponent = doc.icon
            return (
              <Link key={index} href={doc.href} className="group glass-card p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconColor(doc.color)}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getCategoryColor(doc.color)}`}>
                    {doc.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-slate-500 leading-relaxed mb-4">
                  {doc.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">📖 {doc.readTime} read</span>
                  <ArrowRight className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Available Agents */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Available Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableAgents.map((agent, index) => (
              <Link key={index} href={getAgentChatUrl(agent.slug)} className="group glass-card p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="text-3xl mb-3">{agent.emoji}</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {agent.name}
                </h3>
                <p className="text-sm text-slate-400">
                  {agent.specialty}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Quick Actions</h2>
          <p className="text-slate-500 mb-6">Ready to start building with AI agents?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://mumtaz.ai/agents" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
              View All Agents
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/agents" className="inline-flex items-center justify-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors">
              Browse All Agents
            </Link>
            <Link href="/support" className="inline-flex items-center justify-center gap-2 bg-gray-100 text-slate-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
              Get Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}