'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Beaker, ArrowLeft, Swords, ImageIcon, Mic, Music, Palette, BookOpen, TrendingUp, Heart, Brain, Star, MessageCircle, Sparkles, Zap, Users, FlaskConical } from 'lucide-react'

export default function LabDocsPage() {
  const experiments = [
    {
      icon: <Swords className="w-6 h-6" />,
      name: 'AI Battle Arena',
      description: 'Pit AI models against each other in head-to-head competitions. Compare GPT-4, Claude, Gemini, and more on the same prompts. Vote for winners and see community rankings.',
      status: 'live',
      href: '/lab/battle-arena',
      color: 'from-red-500 to-orange-500',
      features: ['Model vs Model', 'Community Voting', 'Leaderboards', 'Custom Prompts']
    },
    {
      icon: <ImageIcon className="w-6 h-6" />,
      name: 'AI Image Playground',
      description: 'Generate images from text prompts, apply style transfers, and create visual art with multiple AI image models.',
      status: 'live',
      href: '/lab/image-playground',
      color: 'from-purple-500 to-fuchsia-500',
      features: ['Text to Image', 'Style Transfer', 'Image Editing', 'Multiple Models']
    },
    {
      icon: <Mic className="w-6 h-6" />,
      name: 'Voice Cloning Studio',
      description: 'Clone voices, generate custom speech, and create vocal transformations. Upload a sample and hear AI speak in any voice.',
      status: 'live',
      href: '/lab/voice-cloning',
      color: 'from-cyan-500 to-blue-500',
      features: ['Voice Cloning', 'Custom Speech', 'Vocal Effects', 'Voice Blending']
    },
    {
      icon: <Music className="w-6 h-6" />,
      name: 'AI Music Generator',
      description: 'Compose original music, generate beats, and create soundtracks. Choose genres, instruments, and moods.',
      status: 'live',
      href: '/lab/music-generator',
      color: 'from-green-500 to-emerald-500',
      features: ['Original Music', 'Beat Generation', 'Genre Selection', 'Instrument Control']
    },
    {
      icon: <Palette className="w-6 h-6" />,
      name: 'Neural Art Studio',
      description: 'Create stunning art using neural style transfer. Combine content images with artistic styles for unique masterpieces.',
      status: 'live',
      href: '/lab/neural-art',
      color: 'from-amber-500 to-yellow-500',
      features: ['Style Transfer', 'Art Generation', 'Multiple Styles', 'High Resolution']
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      name: 'AI Story Weaver',
      description: 'Collaborative storytelling with AI. Build narratives, create characters, develop worlds, and generate plot twists together.',
      status: 'live',
      href: '/lab/story-weaver',
      color: 'from-indigo-500 to-violet-500',
      features: ['Collaborative Stories', 'Character Builder', 'World Building', 'Plot Generator']
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      name: 'Future Predictor',
      description: 'Explore trend forecasting and scenario simulation. Ask "what if" questions and see AI-generated future scenarios.',
      status: 'live',
      href: '/lab/future-predictor',
      color: 'from-teal-500 to-cyan-500',
      features: ['Trend Forecasting', 'Scenario Simulation', 'What-If Analysis', 'Data Synthesis']
    },
    {
      icon: <Heart className="w-6 h-6" />,
      name: 'Emotion Visualizer',
      description: 'Analyze text for emotions and sentiments. See heatmaps of emotional content, classify feelings, and understand communication patterns.',
      status: 'live',
      href: '/lab/emotion-visualizer',
      color: 'from-pink-500 to-rose-500',
      features: ['Sentiment Analysis', 'Emotion Heatmaps', 'Pattern Recognition', 'Communication Insights']
    },
    {
      icon: <Brain className="w-6 h-6" />,
      name: 'Dream Interpreter',
      description: 'Describe your dreams and get AI-powered analysis. Discover subconscious patterns and symbolic meanings with visual outputs.',
      status: 'beta',
      href: '/lab/dream-interpreter',
      color: 'from-violet-500 to-purple-600',
      features: ['Dream Analysis', 'Symbol Database', 'Pattern Discovery', 'Visualization']
    },
    {
      icon: <Star className="w-6 h-6" />,
      name: 'Personality Mirror',
      description: 'Analyze your communication style and personality traits. AI examines your text for writing patterns, emotional tendencies, and more.',
      status: 'beta',
      href: '/lab/personality-mirror',
      color: 'from-sky-500 to-blue-600',
      features: ['Style Analysis', 'Trait Detection', 'Writing Patterns', 'Personality Profile']
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      name: 'AI Debate Arena',
      description: 'Watch AIs debate on any topic. Submit challenges, pick sides, vote for winners, and explore different perspectives.',
      status: 'beta',
      href: '/lab/debate-arena',
      color: 'from-orange-500 to-red-500',
      features: ['AI Debates', 'Topic Submission', 'Community Voting', 'Perspective Analysis']
    },
  ]

  const liveCount = experiments.filter(e => e.status === 'live').length
  const betaCount = experiments.filter(e => e.status === 'beta').length

  return (
    <div className="min-h-screen">
      {/* Hero */}
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
                <Beaker className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">AI Lab</h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              13 cutting-edge AI experiments — battle arena, voice cloning, music generation,
              neural art, dream interpretation, and more. All free to explore.
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
              {[
                { label: 'Total Experiments', value: '13' },
                { label: 'Live', value: String(liveCount) },
                { label: 'Beta', value: String(betaCount) },
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
        {/* Try It CTA */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl p-8 text-center themed-section-bg"
          >
            <div className="absolute -left-10 top-1/4 w-48 h-[300px] rounded-[80px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
            <div className="absolute -right-10 -top-10 w-56 h-[350px] rounded-[80px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Try the Experiments</h2>
              <p className="text-slate-600 mb-6">All experiments are free. Jump in and start exploring cutting-edge AI capabilities.</p>
              <Link href="/lab" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all">
                <FlaskConical className="w-5 h-5" />
                Open AI Lab
              </Link>
            </div>
          </motion.div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-700 text-center mb-8">How AI Lab Works</h2>
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, title: 'Pick an Experiment', desc: 'Browse the 13 experiments and choose one that interests you.' },
              { step: 2, title: 'Interact & Create', desc: 'Each experiment has a unique interface. Generate art, compose music, debate topics, and more.' },
              { step: 3, title: 'Share & Compare', desc: 'View community results, vote on AI battles, and share your creations.' },
            ].map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-slate-700 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Experiments Grid */}
        <h2 className="text-3xl font-bold text-slate-700 text-center mb-8">All Experiments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {experiments.map((exp, idx) => (
            <motion.div
              key={exp.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
            >
              <Link href={exp.href}>
                <div className="glass-card p-6 hover:shadow-lg hover:border-white/80 transition-all h-full cursor-pointer group relative overflow-hidden">
                  {/* Background Gradient Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${exp.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {exp.status === 'live' && (
                      <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 border border-green-300 font-medium">LIVE</span>
                    )}
                    {exp.status === 'beta' && (
                      <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 font-medium">BETA</span>
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${exp.color} mb-4 text-white`}>
                    {exp.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">{exp.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-3">{exp.description}</p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5">
                    {exp.features.map((f, fIdx) => (
                      <span key={fIdx} className="px-2 py-1 text-xs bg-transparent text-slate-500 rounded-md border border-white/80">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Analytics */}
        <div className="mb-16">
          <div className="glass-card p-8 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Real-time Analytics</h3>
            <p className="text-slate-500 mb-4">
              Track experiment usage, see how many tests are running, and view community statistics in real-time.
            </p>
            <Link href="/lab/analytics" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              View Lab Analytics →
            </Link>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center themed-section-bg">
            <div className="absolute -left-10 top-1/4 w-48 h-[300px] rounded-[80px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
            <div className="absolute -right-10 -top-10 w-56 h-[350px] rounded-[80px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Start Experimenting</h2>
              <p className="text-lg text-slate-600 mb-8">
                All experiments are free. Explore the cutting edge of AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/lab" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all">
                  Open AI Lab
                </Link>
                <Link href="/docs" className="px-6 py-3 bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 font-semibold rounded-xl hover:bg-white/50 transition">
                  Back to Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
