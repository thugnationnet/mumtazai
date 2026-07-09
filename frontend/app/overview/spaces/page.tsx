'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Globe,
  Code2,
  Layers,
  Shield,
  Zap,
  Database,
  Cloud,
  CreditCard,
  HelpCircle,
  ChevronDown,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  MessageSquare,
  Paintbrush,
  Wrench,
  Terminal,
  Bot,
} from 'lucide-react';
import { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  4 App Cards                                                        */
/* ------------------------------------------------------------------ */
const apps = [
  {
    name: 'Neural Chat',
    tagline: 'AI Conversational Assistant',
    href: 'https://maula.onelastai.co/neural-chat/',
    icon: MessageSquare,
    color: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    features: [
      'Unlimited multi-session chat with search & sharing',
      'Real-time streaming responses',
      'Voice calls with 8 voice options',
      'Speech-to-text recording & transcription',
      'Image upload + AI analysis (captions, OCR, object detection)',
      'AI image generation',
      'Text-to-speech (6 voices)',
      'Web search & deep research modes',
      '5 chat modes: Chat, Web Search, Deep Research, Thinking, Create Image',
      '268 AI tools across 39 categories',
    ],
  },
  {
    name: 'Canvas Studio',
    tagline: 'AI App Builder & Code Generator',
    href: 'https://maula.onelastai.co/canvas-studio/',
    icon: Paintbrush,
    color: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    features: [
      'AI-powered real-time code generation with streaming',
      'Sandpack live preview (React / HTML / Python)',
      'Cloud sandbox execution (real builds & runtime)',
      'VS Code-style file explorer with drag & drop',
      'CodeMirror 6 editor — 21 languages',
      'AI video & image generation',
      'Text-to-speech output',
      'Cloud deployment (Vercel, Netlify, GitHub Pages)',
      'ZIP project export & download',
      '268 AI tools across 39 categories',
    ],
  },
  {
    name: 'GenCraft Pro',
    tagline: 'AI Full-Stack App Builder',
    href: 'https://maula.onelastai.co/gen-craft-pro/',
    icon: Code2,
    color: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    features: [
      'Dual code editors — CodeMirror 6 + Monaco Editor (VS Code engine)',
      'Real terminal emulator with command execution',
      'Sandpack in-browser runtime (React/HTML/Python)',
      'Cloud sandbox with full build & run',
      'Image-to-code — upload screenshots, AI generates code',
      'Voice input — speak instructions instead of typing',
      'Cloud deployment (Vercel, Netlify, GitHub Pages)',
      'ZIP project export',
      '268 AI tools across 39 categories',
      'Multiple AI models for best results',
    ],
  },
  {
    name: 'Maula Editor',
    tagline: 'Full Cloud IDE',
    href: 'https://maula.onelastai.co/maula-editor/',
    icon: Terminal,
    color: 'from-orange-500 to-amber-500',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    features: [
      'Monaco Editor — VS Code\'s actual editor engine',
      'Full Node.js runtime in-browser (no server needed)',
      'Integrated terminal with search, links & unicode',
      'In-browser Git — commits, branches, push/pull',
      'AI Copilot — inline ghost text suggestions',
      'AI Chat with streaming & tool calling',
      'Extension marketplace',
      'Real-time collaboration (multi-user editing)',
      'Cloud deployment & app packaging',
      '268 AI tools across 39 categories',
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Credit Packs                                                       */
/* ------------------------------------------------------------------ */
const creditPacks = [
  {
    name: 'Starter Pack',
    credits: 10,
    bonus: 0,
    total: 10,
    price: 5,
    popular: false,
    description: 'Great for trying out an app',
  },
  {
    name: 'Pro Pack',
    credits: 50,
    bonus: 5,
    total: 55,
    price: 20,
    popular: true,
    description: 'Best value for regular usage',
  },
  {
    name: 'Power Pack',
    credits: 100,
    bonus: 15,
    total: 115,
    price: 35,
    popular: false,
    description: 'For power users building projects',
  },
  {
    name: 'Enterprise Pack',
    credits: 500,
    bonus: 100,
    total: 600,
    price: 150,
    popular: false,
    description: 'Maximum credits with 20% bonus',
  },
];

/* ------------------------------------------------------------------ */
/*  Credit Costs Per Action                                            */
/* ------------------------------------------------------------------ */
const creditCosts = [
  { action: 'Chat Message (standard)', cost: '~0.01–0.15 credits' },
  { action: 'Chat Message (advanced)', cost: '~0.15–0.75 credits' },
  { action: 'AI Image Generation (HD)', cost: '~0.80 credits' },
  { action: 'AI Video Generation', cost: '5–8 credits' },
  { action: 'Text-to-Speech', cost: '~0.15 per 1K characters' },
  { action: 'Code Generation (per request)', cost: '~0.03–0.50 credits' },
  { action: 'Image-to-Code Analysis', cost: '~0.10–0.30 credits' },
  { action: 'Web Search & Deep Research', cost: '~0.05–0.20 credits' },
];

/* ------------------------------------------------------------------ */
/*  Feature Comparison                                                  */
/* ------------------------------------------------------------------ */
const features = [
  { feature: 'AI Chat / Code Generation', neural: true, studio: true, gencraft: true, maula: true },
  { feature: 'Real-time Streaming', neural: true, studio: true, gencraft: true, maula: true },
  { feature: '268 AI Backend Tools', neural: true, studio: true, gencraft: true, maula: true },
  { feature: 'Live Preview (Sandpack)', neural: false, studio: true, gencraft: true, maula: false },
  { feature: 'CodeMirror 6 Editor', neural: false, studio: true, gencraft: true, maula: false },
  { feature: 'Monaco Editor (VS Code)', neural: false, studio: false, gencraft: true, maula: true },
  { feature: 'Terminal Emulator (xterm.js)', neural: false, studio: false, gencraft: true, maula: true },
  { feature: 'In-Browser Node.js Runtime', neural: false, studio: false, gencraft: false, maula: true },
  { feature: 'Cloud Sandbox Execution', neural: false, studio: true, gencraft: true, maula: true },
  { feature: 'Cloud Deploy (Vercel, Netlify, GitHub)', neural: false, studio: true, gencraft: true, maula: true },
  { feature: 'Multi-File Projects', neural: false, studio: true, gencraft: true, maula: true },
  { feature: 'AI Image Generation', neural: true, studio: true, gencraft: false, maula: false },
  { feature: 'AI Video Generation', neural: false, studio: true, gencraft: false, maula: true },
  { feature: 'Image-to-Code (Vision)', neural: false, studio: true, gencraft: true, maula: false },
  { feature: 'Voice Input / Speech-to-Text', neural: true, studio: false, gencraft: true, maula: false },
  { feature: 'Text-to-Speech', neural: true, studio: true, gencraft: false, maula: false },
  { feature: 'Voice Calls', neural: true, studio: false, gencraft: false, maula: false },
  { feature: 'Web Search & Deep Research', neural: true, studio: false, gencraft: false, maula: false },
  { feature: 'In-Browser Git', neural: false, studio: false, gencraft: false, maula: true },
  { feature: 'AI Copilot (Inline Suggestions)', neural: false, studio: false, gencraft: false, maula: true },
  { feature: 'Extension Marketplace', neural: false, studio: false, gencraft: false, maula: true },
  { feature: 'Real-time Collaboration', neural: false, studio: true, gencraft: false, maula: true },
  { feature: 'ZIP Export / Download', neural: false, studio: true, gencraft: true, maula: true },
];

/* ------------------------------------------------------------------ */
/*  Tool Categories (268 tools / 39 categories)                        */
/* ------------------------------------------------------------------ */
const toolCategories = [
  'Code Generation', 'Code Analysis', 'Code Refactoring', 'Debugging',
  'Testing', 'Documentation', 'AI Chat', 'Image Generation',
  'Video Generation', 'Audio/TTS', 'Data Analysis', 'Database Tools',
  'API Builder', 'DevOps', 'Security Scanner', 'Performance',
  'Accessibility', 'SEO Tools', 'Design Tokens', 'Component Builder',
  'State Machine', 'Regex Builder', 'CLI Generator', 'Git Tools',
  'Package Manager', 'Linter/Formatter', 'Bundler Config', 'Docker Tools',
  'CI/CD Pipeline', 'Cloud Deploy', 'File Manager', 'Markdown Editor',
  'Diagram Generator', 'Kanban Board', 'Calendar Planner', 'Budget Tracker',
  'Email Templates', 'Form Builder', 'Chart Generator',
];

/* ------------------------------------------------------------------ */
/*  FAQs                                                               */
/* ------------------------------------------------------------------ */
const faqs = [
  {
    q: 'What apps are available?',
    a: 'There are 4 apps: Neural Chat (AI conversational assistant), Canvas Studio (AI app builder & code generator), GenCraft Pro (AI full-stack app builder with dual editors), and Maula Editor (full cloud IDE with in-browser runtime). Each app is designed for different workflows.',
  },
  {
    q: 'How do credits work?',
    a: 'Credits are the currency for using AI features. 1 credit = $0.10 USD value. Each AI action (chat, code generation, image creation, etc.) consumes credits based on complexity. You purchase credit packs starting at $5 and use them as you go — no subscriptions, only pay for what you use.',
  },
  {
    q: 'Can I share credits between apps?',
    a: 'No. Each app has its own separate credit balance. Credits purchased for Neural Chat can only be used in Neural Chat, credits for Canvas Studio only in Canvas Studio, and so on. If you use multiple apps, you buy credits for each one separately.',
  },
  {
    q: 'Do credits expire?',
    a: 'No. Credits never expire. Purchase once and use them at your own pace. There are no monthly fees, no subscriptions, and no auto-renewal.',
  },
  {
    q: 'What is the minimum and maximum I can add?',
    a: 'The minimum credit purchase is $5 (Starter Pack with 10 credits). You can purchase up to $500 worth of credits at a time. Buy as many packs as you need.',
  },
  {
    q: 'How much does a typical chat message cost?',
    a: 'A standard chat message typically costs 0.01–0.15 credits depending on the message length and complexity. Advanced operations like image generation (~0.80 credits) or video generation (5–8 credits) cost more.',
  },
  {
    q: 'Is my code private and secure?',
    a: 'Yes. All data is encrypted in transit (TLS 1.2/1.3) and at rest (AES-256). Credentials and API keys you store are encrypted with AES-256-GCM. Your code and prompts are never used to train AI models.',
  },
  {
    q: 'Is there a free plan?',
    a: 'There is no free plan. All apps use a credit-based system where you pay only for what you use. The minimum purchase is just $5 (10 credits), allowing you to try any app at minimal cost.',
  },
];

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */
export default function SpacesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-neural-50">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-white/20">
              <Globe className="w-4 h-4" />
              4 AI Apps &mdash; maula.onelastai.co
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AI Apps &amp; Spaces
            </h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto mb-8">
              4 powerful AI applications at{' '}
              <a
                href="https://maula.onelastai.co"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-white/50 hover:decoration-white transition"
              >
                maula.onelastai.co
              </a>
              . Credit-based pay-as-you-go system — no subscriptions. Each app
              has its own credit balance.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <span className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Layers className="w-4 h-4" /> 4 Apps
              </span>
              <span className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Wrench className="w-4 h-4" /> 268 AI Tools
              </span>
              <span className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <CreditCard className="w-4 h-4" /> Credit System
              </span>
              <span className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Shield className="w-4 h-4" /> No Subscriptions
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4 App Cards */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-sm font-medium text-emerald-600 mb-4">
              <Bot className="w-4 h-4" />
              4 AI Applications
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-neural-800 mb-4">
              Choose Your App
            </h2>
            <p className="text-lg text-neural-600 max-w-2xl mx-auto">
              Each app is built for a specific workflow. Credits are purchased
              per app — use what you need, when you need it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {apps.map((app, i) => {
              const Icon = app.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative bg-white rounded-2xl border ${app.borderColor} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}
                >
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-neural-800">
                          {app.name}
                        </h3>
                        <p className="text-sm text-neural-500">
                          {app.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-6">
                      {app.features.map((feat, j) => (
                        <div key={j} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${app.textColor}`}
                          />
                          <span className="text-sm text-neural-600">
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg ${app.bgLight} mb-6`}
                    >
                      <CreditCard className={`w-4 h-4 ${app.textColor}`} />
                      <span className="text-sm text-neural-700 font-medium">
                        Separate credit balance — credits for this app only
                      </span>
                    </div>

                    <a
                      href={app.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${app.color} hover:opacity-90 transition`}
                    >
                      Open {app.name}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How Credits Work */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neural-800 mb-3">
              How Credits Work
            </h2>
            <p className="text-neural-600 max-w-2xl mx-auto">
              Simple pay-as-you-go. No subscriptions, no monthly fees. Buy
              credits for the app you want to use.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              {
                icon: CreditCard,
                title: 'Buy Credits',
                desc: 'Purchase a credit pack for any app. Min $5, max $500.',
              },
              {
                icon: Layers,
                title: 'Per-App Balance',
                desc: 'Each app has its own credit balance. Not shareable between apps.',
              },
              {
                icon: Zap,
                title: 'Use As You Go',
                desc: 'Each AI action consumes credits based on complexity. 1 credit = $0.10.',
              },
              {
                icon: Shield,
                title: 'Never Expires',
                desc: 'Credits never expire. No auto-renewal. No surprise charges.',
              },
            ].map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={i}
                  className="text-center p-6 bg-neural-50 rounded-xl border border-neural-100"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <ItemIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-neural-800 mb-1">
                    {item.title}
                  </p>
                  <p className="text-sm text-neural-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Credit Packs */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-sm font-medium text-emerald-600 mb-4">
              <CreditCard className="w-4 h-4" />
              Credit Packs
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-neural-800 mb-4">
              Buy Credits for Any App
            </h2>
            <p className="text-lg text-neural-600 max-w-2xl mx-auto">
              Purchase credits inside each app. 1 credit = $0.10 value. Credits
              are loaded into the specific app you buy them from.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {creditPacks.map((pack, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-2xl border-2 ${
                  pack.popular
                    ? 'border-emerald-500 shadow-xl shadow-emerald-100'
                    : 'border-neural-100 shadow-sm'
                } overflow-hidden`}
              >
                {pack.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white text-xs font-bold text-center py-1.5">
                    BEST VALUE
                  </div>
                )}
                <div className={`p-6 ${pack.popular ? 'pt-9' : ''}`}>
                  <h3 className="text-lg font-bold text-neural-800 mb-1">
                    {pack.name}
                  </h3>
                  <p className="text-sm text-neural-500 mb-5">
                    {pack.description}
                  </p>
                  <div className="mb-5">
                    <span className="text-3xl font-bold text-neural-900">
                      ${pack.price}
                    </span>
                    <span className="text-neural-500 ml-2 text-sm">
                      one-time
                    </span>
                  </div>
                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-neural-700">
                        <strong>{pack.credits}</strong> credits
                      </span>
                    </div>
                    {pack.bonus > 0 && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-neural-700">
                          <strong>+{pack.bonus}</strong> bonus credits
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-neural-700">
                        <strong>{pack.total}</strong> total credits
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-neural-700">
                        Credits never expire
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-neural-700">No auto-renewal</span>
                    </div>
                  </div>
                  <a
                    href="https://maula.onelastai.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition ${
                      pack.popular
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-neural-100 text-neural-700 hover:bg-neural-200'
                    }`}
                  >
                    Buy in App
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="max-w-5xl mx-auto mt-8">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 text-center">
              <p className="text-neural-700 font-medium text-sm">
                Credits are purchased inside each app. Minimum $5, maximum $500
                per transaction. Each app maintains its own separate balance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credit Cost Per Action */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-neural-800 mb-3">
              Credit Costs Per Action
            </h2>
            <p className="text-neural-600">
              How many credits each type of action uses. Costs vary by
              complexity and length.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-neural-200 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neural-50 border-b border-neural-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-neural-800">
                      Action
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-neural-800">
                      Credit Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {creditCosts.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-neural-100 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-neural-50/50'
                      }`}
                    >
                      <td className="px-6 py-3.5 font-medium text-neural-800">
                        {row.action}
                      </td>
                      <td className="px-6 py-3.5 text-right text-neural-600 font-medium">
                        {row.cost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-neural-50 border-t border-neural-200">
              <p className="text-xs text-neural-500 text-center">
                1 credit = $0.10 USD value. Minimum charge per request is 0.01
                credits. Costs depend on message length and action complexity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-neural-800 mb-3">
              App Feature Comparison
            </h2>
            <p className="text-neural-600">
              See which features each app includes
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-neural-200 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neural-50 border-b-2 border-neural-200">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold text-neural-800">
                      Feature
                    </th>
                    <th className="px-5 py-4 text-center font-semibold text-violet-600">
                      Neural Chat
                    </th>
                    <th className="px-5 py-4 text-center font-semibold text-blue-600">
                      Canvas Studio
                    </th>
                    <th className="px-5 py-4 text-center font-semibold text-emerald-600">
                      GenCraft Pro
                    </th>
                    <th className="px-5 py-4 text-center font-semibold text-orange-600">
                      Maula Editor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-neural-100 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-neural-50/50'
                      }`}
                    >
                      <td className="px-5 py-3.5 font-medium text-neural-800">
                        {row.feature}
                      </td>
                      {(
                        ['neural', 'studio', 'gencraft', 'maula'] as const
                      ).map((key) => (
                        <td key={key} className="px-5 py-3.5 text-center">
                          {row[key] ? (
                            <svg
                              className="w-5 h-5 mx-auto text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <span className="text-neural-300">&mdash;</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Categories */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-sm font-medium text-emerald-600 mb-4">
              <Sparkles className="w-4 h-4" />
              268 Tools &middot; 39 Categories
            </div>
            <h2 className="text-3xl font-bold text-neural-800 mb-3">
              AI Tool Categories
            </h2>
            <p className="text-neural-600">
              Available across all 4 apps
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {toolCategories.map((cat, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-neural-50 border border-neural-200 text-sm font-semibold text-[#1e293b] hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 transition"
              >
                {cat}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-neural-800 mb-3">
              Enterprise-Grade Security
            </h2>
            <p className="text-neural-600">
              Your code and data are protected at every layer
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'TLS 1.2/1.3 Encryption',
                desc: 'All data encrypted in transit',
              },
              {
                icon: Database,
                title: 'AES-256-GCM',
                desc: 'Credentials and keys encrypted at rest',
              },
              {
                icon: Cloud,
                title: 'Isolated Sandboxes',
                desc: 'Each project runs in its own container',
              },
              {
                icon: Zap,
                title: 'Rate Limiting',
                desc: 'Per-IP limits on all endpoints',
              },
              {
                icon: Shield,
                title: 'No AI Training',
                desc: 'Your data is never used to train models',
              },
              {
                icon: CreditCard,
                title: 'Stripe Payments',
                desc: 'PCI DSS Level 1 — card data never on our servers',
              },
            ].map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 bg-white rounded-xl border border-neural-100 shadow-sm"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ItemIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neural-800">
                      {item.title}
                    </p>
                    <p className="text-sm text-neural-500">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-sm font-medium text-emerald-600 mb-4">
              <HelpCircle className="w-4 h-4" />
              Common Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-neural-800 mb-3">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-neural-50 rounded-xl border border-neural-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-neural-100 transition-colors"
                >
                  <span className="font-bold text-[#1e293b] pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-neural-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-[#334155] font-medium text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-10 text-center text-white shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">
              Start Using AI Apps Today
            </h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
              4 powerful apps, 268 AI tools, credit-based pricing. No
              subscriptions — pay only for what you use.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://maula.onelastai.co"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-neural-50 transition shadow-lg"
              >
                <Globe className="w-5 h-5" />
                Visit maula.onelastai.co
                <ExternalLink className="w-4 h-4" />
              </a>
              <Link
                href="/overview"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition border border-white/20 backdrop-blur-sm"
              >
                All Plans
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
