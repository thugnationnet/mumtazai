'use client';

import Link from 'next/link';
import {
  Smartphone,
  Monitor,
  Globe,
  Download,
  Apple,
  Chrome,
  Sparkles,
  Code2,
  Palette,
  ExternalLink,
  CheckCircle,
  Beaker,
  MessageSquare,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AppInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  borderHover: string;
  badgeBg: string;
  badgeText: string;
  btnGradient: string;
  webUrl: string;
  features: string[];
  status: 'Live' | 'Beta' | 'Coming Soon';
}

const apps: AppInfo[] = [
  {
    id: 'mumtazai',
    name: 'Mumtaz AI',
    tagline: 'Your AI Dream Team — 20+ Agents',
    description:
      'The complete AI platform with 20+ specialized AI personalities. Chat, create, build, and deploy — all from one app. Includes dashboard, analytics, dev tools, and community.',
    icon: Sparkles,
    accentColor: 'text-blue-500',
    borderHover: 'hover:border-blue-300',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-600',
    btnGradient: 'from-blue-500 to-indigo-500',
    webUrl: 'https://mumtaz.ai',
    features: [
      '20+ AI Agents with unique personalities',
      'Real-time voice & text chat',
      'Dashboard & analytics',
      'Community & gamification',
      'Dev tools suite',
      'Push notifications & PWA',
    ],
    status: 'Live',
  },
  {
    id: 'canvas',
    name: 'AI Canvas Pro',
    tagline: 'AI-Powered App Builder',
    description:
      'Build and deploy full-stack web applications using AI. Visual code editor with real-time preview, component library, hosting, and one-click deployment to production.',
    icon: Code2,
    accentColor: 'text-emerald-500',
    borderHover: 'hover:border-emerald-300',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
    btnGradient: 'from-emerald-500 to-teal-500',
    webUrl: 'https://build.mumtaz.ai',
    features: [
      'AI code generation from prompts',
      'Visual component builder',
      'Real-time live preview',
      'Cloud hosting & deployment',
      'Template library',
      'Analytics dashboard',
    ],
    status: 'Live',
  },
  {
    id: 'canvas-studio',
    name: 'Canvas Studio',
    tagline: 'AI Design & Code Studio',
    description:
      'AI-powered design and development studio. Create, customize, and deploy beautiful applications with natural language. Sandpack-powered live code preview and editing.',
    icon: Palette,
    accentColor: 'text-violet-500',
    borderHover: 'hover:border-violet-300',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-600',
    btnGradient: 'from-violet-500 to-purple-500',
    webUrl: 'https://studio.mumtaz.ai',
    features: [
      'Natural language app building',
      'Live Sandpack preview',
      'AI design assistance',
      'Full-stack generation',
      'Asset & file management',
      'Version control & history',
    ],
    status: 'Live',
  },
  {
    id: 'demo',
    name: 'AI Chat Demo',
    tagline: 'Try AI Agents Instantly',
    description:
      'Jump straight into conversations with our AI agents — no sign-up required. Experience the full power of 20+ AI personalities in an instant demo environment.',
    icon: MessageSquare,
    accentColor: 'text-sky-500',
    borderHover: 'hover:border-sky-300',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-600',
    btnGradient: 'from-sky-500 to-blue-500',
    webUrl: 'https://demo.mumtaz.ai',
    features: [
      'No sign-up required',
      'All 20+ AI agents available',
      'Real-time streaming responses',
      'Multi-model support',
      'Voice & text chat',
      'Instant access',
    ],
    status: 'Live',
  },
  {
    id: 'lab',
    name: 'AI Lab',
    tagline: 'Experimental AI Playground',
    description:
      'Explore cutting-edge AI experiments, prototype new features, and test advanced capabilities in our dedicated laboratory environment.',
    icon: Beaker,
    accentColor: 'text-amber-500',
    borderHover: 'hover:border-amber-300',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
    btnGradient: 'from-amber-500 to-orange-500',
    webUrl: 'https://mumtaz.ai/lab',
    features: [
      'Experimental AI features',
      'Prototype playground',
      'Advanced model testing',
      'Research tools',
      'Performance benchmarks',
      'Early access features',
    ],
    status: 'Live',
  },
];

function AppCard({ app, index }: { app: AppInfo; index: number }) {
  const AppIcon = app.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`glass-card ${app.borderHover} hover:shadow-xl transition-all duration-300 overflow-hidden group`}
    >
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.btnGradient} flex items-center justify-center shadow-md`}>
            <AppIcon className="w-7 h-7 text-white" />
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${app.badgeBg} ${app.badgeText}`}>
            {app.status}
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-800">{app.name}</h3>
        <p className="text-sm text-slate-400 mt-1">{app.tagline}</p>
      </div>

      {/* Description */}
      <div className="px-6 pb-4">
        <p className="text-sm text-slate-500 leading-relaxed">{app.description}</p>
      </div>

      {/* Features */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-1 gap-1.5">
          {app.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6 pt-2">
        <a
          href={app.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r ${app.btnGradient} rounded-xl text-white font-semibold hover:scale-105 hover:shadow-lg transition-all duration-300`}
        >
          <Globe className="w-5 h-5" />
          Open App
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}

export default function AppsPage() {
  return (
    <div className="min-h-screen themed-section-bg">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 themed-section-bg">
        {/* Glass ribbons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-24 bg-white/20 rounded-3xl rotate-12 backdrop-blur-sm border border-white/40" />
          <div className="absolute top-1/3 -right-16 w-80 h-20 bg-white/15 rounded-3xl -rotate-6 backdrop-blur-sm border border-white/30" />
          <div className="absolute bottom-20 left-1/4 w-72 h-16 bg-white/10 rounded-3xl rotate-3 backdrop-blur-sm border border-white/25" />
          <div className="absolute -bottom-10 right-1/3 w-64 h-14 bg-white/20 rounded-3xl -rotate-12 backdrop-blur-sm border border-white/35" />
          <div className="absolute top-1/2 left-10 w-48 h-12 bg-white/10 rounded-3xl rotate-45 backdrop-blur-sm border border-white/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-xl border border-white/60 rounded-full text-purple-600 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              5 Apps — All Live & Ready
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800">
              Mumtaz AI
              <br />
              <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">App Ecosystem</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to chat with AI, build apps, design interfaces, and experiment
              with cutting-edge technology — available now on any device via PWA.
            </p>

            {/* Platform badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {[
                { icon: Globe, label: 'Web App', available: true },
                { icon: Chrome, label: 'PWA', available: true },
                { icon: Smartphone, label: 'Mobile PWA', available: true },
                { icon: Monitor, label: 'Desktop PWA', available: true },
              ].map((p) => (
                <div
                  key={p.label}
                  className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-xl border border-white/60 rounded-xl"
                >
                  <p.icon className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700 font-medium">{p.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 font-medium">
                    Available
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Apps Grid */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Our Apps</h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              Each app is optimized for its purpose — from AI chat to full-stack app building.
              All apps work as installable PWAs for the best experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app, i) => (
              <AppCard key={app.id} app={app} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* How to Install PWA Section */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              Install as App (PWA)
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              Install any of our apps on your device for offline access, push notifications, and a native app experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Chrome / Edge',
                subtitle: 'Desktop & Android',
                steps: [
                  'Open the app URL in Chrome or Edge',
                  'Click the install icon (⊕) in the address bar',
                  'Or click Menu (⋮) → "Install App"',
                  'The app opens in its own window',
                ],
                icon: Chrome,
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                title: 'Safari',
                subtitle: 'iPhone & iPad',
                steps: [
                  'Open the app URL in Safari',
                  'Tap the Share button (↑)',
                  'Scroll down → "Add to Home Screen"',
                  'Tap "Add" to confirm',
                ],
                icon: Globe,
                gradient: 'from-sky-500 to-blue-500',
              },
              {
                title: 'Safari',
                subtitle: 'macOS (Sonoma+)',
                steps: [
                  'Open the app URL in Safari 17+',
                  'Click File → "Add to Dock"',
                  'Or Share button → "Add to Dock"',
                  'The app appears in your Dock',
                ],
                icon: Apple,
                gradient: 'from-gray-500 to-gray-700',
              },
            ].map((guide, i) => (
              <motion.div
                key={guide.title + guide.subtitle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-white/30 backdrop-blur-xl rounded-2xl border-2 border-white/50 hover:border-purple-300 p-6 hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${guide.gradient} rounded-xl flex items-center justify-center mb-4 shadow-md`}
                >
                  <guide.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{guide.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{guide.subtitle}</p>
                <ol className="space-y-3">
                  {guide.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {j + 1}
                      </span>
                      <span className="text-sm text-slate-500">{step}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Native Apps Coming Soon Banner */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-8 md:p-12 text-center shadow-xl bg-white/30 backdrop-blur-2xl border border-white/50"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
              Native Apps Coming Soon
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
              We&apos;re building native apps for Google Play, App Store, macOS, and Windows.
              In the meantime, our PWAs deliver the same great experience — offline support,
              push notifications, and native app feel.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {['Google Play', 'App Store', 'macOS', 'Windows', 'Microsoft Store'].map((store) => (
                <span
                  key={store}
                  className="text-xs px-3 py-1.5 bg-white/40 border border-white/60 rounded-full text-slate-600 font-medium"
                >
                  {store}
                </span>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/overview"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
              >
                View Pricing & Plans
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
