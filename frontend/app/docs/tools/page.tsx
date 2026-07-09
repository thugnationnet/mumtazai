'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Wrench, ArrowLeft, FolderOpen, ImageIcon, Video, Shield, Brain, Code, Globe, Database, FileText, BarChart3, Archive, Bot, Workflow, Network, TrendingUp, Briefcase, Search, Lock, Cpu, Mail, Zap } from 'lucide-react'

export default function ToolsDocsPage() {
  const toolCategories = [
    {
      icon: <FolderOpen className="w-6 h-6" />,
      title: 'File System',
      count: 20,
      description: 'Create, read, modify, delete files and directories. ZIP operations, file watching, and synchronization.',
      tools: ['Create File', 'Read File', 'Modify File', 'Delete File', 'List Directory', 'Create Directory', 'ZIP Create', 'ZIP Extract', 'File Watch', 'File Sync'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <ImageIcon className="w-6 h-6" />,
      title: 'Image Processing',
      count: 13,
      description: 'Create, transform, filter, compose images. OCR text extraction, face detection, AI analysis, and background removal.',
      tools: ['Create Image', 'Transform', 'Apply Filters', 'Compose', 'OCR Extract', 'Face Detection', 'AI Analysis', 'Background Removal'],
      color: 'from-purple-500 to-fuchsia-500'
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: 'Video Processing',
      count: 8,
      description: 'Transform, convert, analyze, overlay videos. Audio mixing, AI capabilities, and batch processing.',
      tools: ['Video Transform', 'Format Convert', 'Video Analyze', 'Overlay', 'Audio Mix', 'AI Video', 'Batch Process'],
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Document Parsing',
      count: 7,
      description: 'Parse PDFs, Word docs, CSVs, JSON, XML, Markdown files, and extract data from archives.',
      tools: ['PDF Parse', 'Word Parse', 'CSV Parse', 'JSON Parse', 'XML Parse', 'Markdown Parse', 'Archive Unpack'],
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Security',
      count: 20,
      description: 'Cryptographic hashing, encryption, signing, secret scanning, malware detection, vulnerability scanning, and compliance checking.',
      tools: ['Hash', 'Encrypt/Decrypt', 'Digital Signing', 'Secret Scanner', 'Malware Detection', 'Vulnerability Scan', 'GDPR Check', 'HIPAA Check', 'PCI-DSS Audit'],
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI & Machine Learning',
      count: 16,
      description: 'LLM chat, embeddings, fine-tuning, text analysis, moderation, model training, prediction, and ML pipelines.',
      tools: ['LLM Chat', 'Embeddings', 'Fine-Tuning', 'Text Analysis', 'Content Moderation', 'Model Training', 'Prediction', 'ML Pipeline'],
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: 'Developer Tools',
      count: 8,
      description: 'Filesystem utilities, code search, language intelligence, debug utilities, testing, Git, npm, and Docker operations.',
      tools: ['Code Search', 'Language Intelligence', 'Debug Utils', 'Test Runner', 'Git Operations', 'npm Commands', 'Docker Control'],
      color: 'from-teal-500 to-cyan-500'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Web & Frontend',
      count: 7,
      description: 'HTML/CSS validation, React/Next.js scaffolding, Tailwind config, SEO audits, accessibility testing, and web scraping.',
      tools: ['HTML Validate', 'CSS Validate', 'React Scaffold', 'Tailwind Config', 'SEO Audit', 'Accessibility Test', 'Web Scrape'],
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Database',
      count: 6,
      description: 'Query execution, schema management, backup/import, migrations, query optimization, and connection management.',
      tools: ['Query Execute', 'Schema Manage', 'Backup/Import', 'Migrations', 'Query Optimize', 'Connection Pool'],
      color: 'from-indigo-500 to-blue-600'
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: 'API & Integrations',
      count: 11,
      description: 'HTTP requests, mocking, documentation generation, testing, GraphQL/REST transforms, webhooks, and SDK generation.',
      tools: ['HTTP Client', 'API Mock', 'Doc Generator', 'API Testing', 'GraphQL Transform', 'Webhook Listener', 'SDK Generator'],
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Content & Markdown',
      count: 8,
      description: 'Convert to HTML/LaTeX, validate content, template generation, scheduling, email templates, and SEO optimization.',
      tools: ['Markdown to HTML', 'LaTeX Convert', 'Content Validate', 'Template Gen', 'Email Builder', 'SEO Optimize'],
      color: 'from-emerald-500 to-green-600'
    },
    {
      icon: <Archive className="w-6 h-6" />,
      title: 'Archive & ZIP',
      count: 8,
      description: 'Core archive operations, in-place editing, structure analysis, security scanning, bulk operations, and deployment packaging.',
      tools: ['Create Archive', 'Extract', 'In-Place Edit', 'Structure Analysis', 'Security Scan', 'Deployment Package'],
      color: 'from-stone-500 to-neutral-600'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics',
      count: 8,
      description: 'Data visualization, trend analysis, report generation, metric tracking, funnel analysis, and A/B test evaluation.',
      tools: ['Visualize Data', 'Trend Analysis', 'Report Generate', 'Metric Track', 'Funnel Analysis', 'A/B Evaluate'],
      color: 'from-blue-400 to-indigo-500'
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'Agent Memory & Control',
      count: 10,
      description: 'Agent context management, memory persistence, conversation history, context switching, and multi-agent coordination.',
      tools: ['Save Memory', 'Load Memory', 'Clear Context', 'History Search', 'Context Switch', 'Multi-Agent Sync'],
      color: 'from-sky-500 to-blue-600'
    },
    {
      icon: <Workflow className="w-6 h-6" />,
      title: 'Workflow Automation',
      count: 8,
      description: 'Task scheduling, event triggers, pipeline orchestration, conditional logic, and batch job management.',
      tools: ['Schedule Task', 'Event Trigger', 'Pipeline Run', 'Conditional Branch', 'Batch Execute'],
      color: 'from-fuchsia-500 to-pink-600'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Growth & Marketing',
      count: 8,
      description: 'Campaign management, lead scoring, content calendar, social media scheduling, and audience segmentation.',
      tools: ['Campaign Create', 'Lead Score', 'Content Calendar', 'Social Schedule', 'Audience Segment'],
      color: 'from-rose-500 to-red-600'
    },
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: 'Business Tools',
      count: 12,
      description: 'Finance calculations, HR management, legal document generation, CRM operations, and invoice processing.',
      tools: ['Finance Calc', 'HR Manage', 'Legal Doc Gen', 'CRM Operations', 'Invoice Process', 'Contract Draft'],
      color: 'from-neutral-500 to-stone-600'
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Web Search & Fetch',
      count: 8,
      description: 'Web search, URL fetching, content extraction, weather data, and real-time information retrieval.',
      tools: ['Web Search', 'Fetch URL', 'Content Extract', 'Weather API', 'Real-time Data'],
      color: 'from-orange-400 to-amber-500'
    },
  ]

  const highlights = [
    { value: '389', label: 'Total Tools', icon: <Wrench className="w-6 h-6" /> },
    { value: '188', label: 'Agent Tools', icon: <Bot className="w-6 h-6" /> },
    { value: '201', label: 'Canvas Tools', icon: <Code className="w-6 h-6" /> },
    { value: '46', label: 'Categories', icon: <FolderOpen className="w-6 h-6" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tools-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tools-grid)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link href="/docs" className="inline-flex items-center gap-2 text-orange-200 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Docs
            </Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Wrench className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white">Tools & Utilities</h1>
            </div>
            <p className="text-xl text-orange-100 max-w-3xl mx-auto mb-8">
              389 powerful tools across 46 categories — from file operations and image processing
              to AI/ML pipelines, security audits, and business automation
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {highlights.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white/15 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center"
                >
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-orange-100">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Where Tools Live */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100"
          >
            <h2 className="text-2xl font-bold text-neural-800 mb-6 text-center">Where to Find Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neural-50 rounded-xl p-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white mb-3">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-neural-800 mb-2">Agent Chat Tools (188)</h3>
                <p className="text-sm text-neural-600">Available in Universal Chat when talking to any AI agent. Tools are invoked automatically based on your request.</p>
              </div>
              <div className="bg-neural-50 rounded-xl p-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-white mb-3">
                  <Code className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-neural-800 mb-2">Canvas Studio Tools (201)</h3>
                <p className="text-sm text-neural-600">Available in Canvas and Canvas Studio IDE. Use them for app building, code generation, and project management.</p>
              </div>
            </div>
            <p className="text-sm text-neural-500 text-center mt-4">13 tools are shared between both environments</p>
          </motion.div>
        </div>

        {/* Tool Categories */}
        <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">All Tool Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {toolCategories.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-neural-100 hover:shadow-lg transition group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white flex-shrink-0`}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-neural-800">{cat.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-neural-100 text-neural-600 font-medium">{cat.count} tools</span>
                  </div>
                  <p className="text-sm text-neural-600 mb-3">{cat.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tools.slice(0, 6).map((tool, tIdx) => (
                      <span key={tIdx} className="px-2 py-1 text-xs bg-neural-50 text-neural-600 rounded-md border border-neural-100">
                        {tool}
                      </span>
                    ))}
                    {cat.tools.length > 6 && (
                      <span className="px-2 py-1 text-xs bg-neural-50 text-neural-500 rounded-md border border-neural-100">
                        +{cat.tools.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How Tools Work */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-800 text-center mb-8">How Tools Work</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { step: 1, title: 'Describe Your Task', desc: 'Tell the AI what you need — "resize this image", "scan for vulnerabilities", "generate a report".' },
              { step: 2, title: 'AI Selects the Right Tool', desc: 'The AI automatically picks the best tool from the 389 available based on your request context.' },
              { step: 3, title: 'Tool Executes', desc: 'The tool runs in a secure environment and returns results — files, data, analysis, or transformed content.' },
              { step: 4, title: 'Review Results', desc: 'See the output inline in your chat or IDE. Download files, copy code, or chain additional tool calls.' },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-neural-100"
              >
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neural-800 mb-1">{step.title}</h3>
                    <p className="text-neural-600">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Try the Tools</h2>
            <p className="text-lg opacity-90 mb-8">
              Start a chat with any agent or open Canvas Studio to access all 389 tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/chat" className="btn-primary bg-white text-orange-600 hover:bg-neural-50">
                Open Chat
              </Link>
              <Link href="https://studio.mumtaz.ai" className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-orange-600">
                Open Canvas Studio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
