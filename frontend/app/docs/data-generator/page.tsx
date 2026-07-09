'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Database, Users, Package, FileText, BarChart3, MessageSquare, Mail, Settings, Zap, Shield, Download, Copy } from 'lucide-react'
import { useState } from 'react'

export default function DataGeneratorDocsPage() {
  const [copiedExample, setCopiedExample] = useState<string | null>(null)

  const dataTypes = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Users & Profiles',
      description: 'Generate realistic user data with names, emails, avatars, addresses, and demographics.',
      fields: ['name', 'email', 'avatar', 'address', 'phone', 'birthdate', 'occupation'],
      color: 'from-blue-500 to-cyan-500',
      emoji: '👤'
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Products',
      description: 'Create product catalogs with names, descriptions, prices, categories, and inventory data.',
      fields: ['name', 'description', 'price', 'category', 'sku', 'stock', 'images'],
      color: 'from-orange-500 to-red-500',
      emoji: '📦'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Posts & Articles',
      description: 'Generate blog posts, articles, and content with titles, body text, tags, and metadata.',
      fields: ['title', 'content', 'author', 'tags', 'publishedAt', 'views', 'likes'],
      color: 'from-green-500 to-emerald-500',
      emoji: '📝'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics Data',
      description: 'Create time-series analytics data for charts, dashboards, and reporting.',
      fields: ['date', 'pageViews', 'visitors', 'bounceRate', 'sessionDuration', 'conversions'],
      color: 'from-purple-500 to-indigo-500',
      emoji: '📊'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Comments & Reviews',
      description: 'Generate user reviews, comments, ratings, and feedback for products or content.',
      fields: ['author', 'content', 'rating', 'helpful', 'verified', 'createdAt'],
      color: 'from-pink-500 to-rose-500',
      emoji: '💬'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Emails & Messages',
      description: 'Create email threads, chat messages, and notifications with realistic content.',
      fields: ['from', 'to', 'subject', 'body', 'timestamp', 'read', 'attachments'],
      color: 'from-teal-500 to-cyan-500',
      emoji: '✉️'
    }
  ]

  const exampleCode = `// Example: Generate 10 users
const response = await fetch('/api/generate-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'users',
    count: 10,
    fields: ['name', 'email', 'avatar', 'address']
  })
});

const { data } = await response.json();
// Returns array of 10 user objects`

  const sampleOutput = `[
  {
    "id": "usr_1a2b3c4d",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@email.com",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    "address": {
      "street": "123 Oak Street",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102"
    }
  },
  // ... 9 more users
]`

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedExample(id)
    setTimeout(() => setCopiedExample(null), 2000)
  }

  const features = [
    { icon: <Zap className="w-5 h-5" />, title: 'Instant Generation', description: 'Get data in milliseconds, not minutes' },
    { icon: <Shield className="w-5 h-5" />, title: 'Realistic & Valid', description: 'Properly formatted emails, phones, addresses' },
    { icon: <Settings className="w-5 h-5" />, title: 'Customizable', description: 'Choose exactly which fields you need' },
    { icon: <Download className="w-5 h-5" />, title: 'Multiple Formats', description: 'Export as JSON, CSV, or SQL' }
  ]

  const useCases = [
    { title: 'Frontend Development', description: 'Populate UI mockups and prototypes with realistic data', icon: '🎨' },
    { title: 'API Testing', description: 'Generate test payloads for API endpoints', icon: '🔧' },
    { title: 'Database Seeding', description: 'Fill development databases with sample data', icon: '🗄️' },
    { title: 'Demo Environments', description: 'Create compelling demos with real-looking data', icon: '📺' },
    { title: 'Load Testing', description: 'Generate large datasets for performance testing', icon: '⚡' },
    { title: 'Documentation', description: 'Create example data for API documentation', icon: '📚' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="dg-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#dg-grid)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <Link href="/docs" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Docs</Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"><Database className="w-10 h-10 text-white" /></div>
              <h1 className="text-5xl md:text-6xl font-bold text-white">AI Data Generator</h1>
            </div>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Generate realistic test data instantly. Perfect for development, testing, demos, and prototyping.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-custom section-padding">

        {/* Quick Features */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="text-center p-4">
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-brand-600">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-neural-800 text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-neural-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Types */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">Supported Data Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataTypes.map((type, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-neural-100 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-white`}>
                    {type.icon}
                  </div>
                  <h3 className="text-lg font-bold text-neural-800">{type.title}</h3>
                </div>
                <p className="text-neural-600 text-sm mb-4">{type.description}</p>
                <div className="flex flex-wrap gap-2">
                  {type.fields.map((field, fidx) => (
                    <span key={fidx} className="px-2 py-1 bg-neural-50 rounded text-xs text-neural-600 font-mono">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Example */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">Quick Start</h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request */}
            <div className="bg-neural-900 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-neural-800 border-b border-neural-700">
                <span className="text-sm text-neural-400">API Request</span>
                <button 
                  onClick={() => copyToClipboard(exampleCode, 'request')}
                  className="text-neural-400 hover:text-white transition flex items-center gap-1 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  {copiedExample === 'request' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 text-sm text-neural-300 overflow-x-auto">
                <code>{exampleCode}</code>
              </pre>
            </div>
            
            {/* Response */}
            <div className="bg-neural-900 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-neural-800 border-b border-neural-700">
                <span className="text-sm text-neural-400">Sample Response</span>
                <button 
                  onClick={() => copyToClipboard(sampleOutput, 'response')}
                  className="text-neural-400 hover:text-white transition flex items-center gap-1 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  {copiedExample === 'response' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 text-sm text-neural-300 overflow-x-auto">
                <code>{sampleOutput}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-neural-100 hover:border-blue-200 transition">
                <div className="text-3xl mb-3">{useCase.icon}</div>
                <h3 className="font-bold text-neural-800 mb-1">{useCase.title}</h3>
                <p className="text-sm text-neural-600">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Options */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">Configuration Options</h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neural-100">
                    <th className="py-3 px-4 font-bold text-neural-800">Option</th>
                    <th className="py-3 px-4 font-bold text-neural-800">Type</th>
                    <th className="py-3 px-4 font-bold text-neural-800">Default</th>
                    <th className="py-3 px-4 font-bold text-neural-800">Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-neural-50">
                    <td className="py-3 px-4 font-mono text-brand-600">type</td>
                    <td className="py-3 px-4 text-neural-600">string</td>
                    <td className="py-3 px-4 text-neural-500">required</td>
                    <td className="py-3 px-4 text-neural-600">Data type to generate (users, products, etc.)</td>
                  </tr>
                  <tr className="border-b border-neural-50">
                    <td className="py-3 px-4 font-mono text-brand-600">count</td>
                    <td className="py-3 px-4 text-neural-600">number</td>
                    <td className="py-3 px-4 text-neural-500">10</td>
                    <td className="py-3 px-4 text-neural-600">Number of records to generate (1-1000)</td>
                  </tr>
                  <tr className="border-b border-neural-50">
                    <td className="py-3 px-4 font-mono text-brand-600">fields</td>
                    <td className="py-3 px-4 text-neural-600">string[]</td>
                    <td className="py-3 px-4 text-neural-500">all</td>
                    <td className="py-3 px-4 text-neural-600">Specific fields to include in output</td>
                  </tr>
                  <tr className="border-b border-neural-50">
                    <td className="py-3 px-4 font-mono text-brand-600">locale</td>
                    <td className="py-3 px-4 text-neural-600">string</td>
                    <td className="py-3 px-4 text-neural-500">en_US</td>
                    <td className="py-3 px-4 text-neural-600">Locale for region-specific data</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-brand-600">format</td>
                    <td className="py-3 px-4 text-neural-600">string</td>
                    <td className="py-3 px-4 text-neural-500">json</td>
                    <td className="py-3 px-4 text-neural-600">Output format (json, csv, sql)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Try It CTA */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">Try It Now</h2>
              <p className="text-blue-100 mb-6">Generate sample data instantly with our interactive tool.</p>
              <Link href="/tools/data-generator" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition">
                <Database className="w-5 h-5" />
                Open Data Generator Tool
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Need Custom Data?</h2>
            <p className="text-lg opacity-90 mb-8">
              Our AI can generate custom data schemas tailored to your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://demo.mumtaz.ai" className="btn-primary bg-white text-blue-600 hover:bg-neural-50">
                Open Studio
              </Link>
              <Link href="/support/contact-us" className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-blue-600">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
