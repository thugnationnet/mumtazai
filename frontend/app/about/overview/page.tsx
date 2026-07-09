'use client'

import Link from 'next/link'
import { Heart, Zap, Shield, Lightbulb, Users, Star, Award, Globe } from 'lucide-react'

export default function AboutOverviewPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="about-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#about-grid)"/>
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <Users className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">About One Last AI</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Transforming businesses with emotionally intelligent, human-centric AI agents
          </p>
        </div>
      </section>

      {/* Special Thanks Section */}
      <section className="py-12">
        <div className="container-custom max-w-4xl">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8 md:p-10 shadow-lg">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🙏</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-amber-900 mb-3">Special Recognition</h3>
                <p className="text-lg text-amber-800 mb-3">
                  We extend our heartfelt gratitude to <span className="font-bold">Mr. Ben from Thailand</span> for his exceptional and invaluable contributions to One Last AI.
                </p>
                <p className="text-amber-700 mb-2">
                  <span className="font-semibold">His dedication includes:</span>
                </p>
                <ul className="space-y-2 text-amber-700 ml-4">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    Significant improvements to our core services and platform architecture
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    Development and provision of essential tools that accelerate innovation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    Financial support that enabled critical growth and expansion
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    Unwavering overall support across all aspects of our mission
                  </li>
                </ul>
                <p className="text-amber-800 font-semibold mt-4">
                  Mr. Ben's vision, generosity, and commitment to excellence have been instrumental in bringing One Last AI to life. He truly deserves this special recognition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About AI Digital Friend */}
      <section className="py-12">
        <div className="container-custom max-w-4xl">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-4">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-neural-900">
              About AI Digital Friend
            </h2>
            <p className="text-lg text-neural-600 max-w-2xl mx-auto">
              Building emotionally intelligent, human-centric AI systems that redefine digital companionship
            </p>
          </div>

          {/* Intro Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-neural-200 mb-8">
            <h3 className="text-2xl font-bold text-neural-900 mb-4">The Initiative</h3>
            <p className="text-lg text-neural-700 mb-4 leading-relaxed">
              <span className="font-semibold">AI Digital Friend</span> is a product of <span className="font-semibold">Grand Pa United™</span>, a global alliance of innovators from the UAE, UK, USA, and Thailand, united by a shared mission: to build emotionally intelligent, human-centric AI systems that redefine digital companionship.
            </p>
            <p className="text-lg text-neural-700 mb-4 leading-relaxed">
              Founded by <span className="font-semibold">Miss Chuttra Dilokkanwong (TH)</span>, and managed by <span className="font-semibold">Shahbaz Chaudhary (TH)</span>, with the visionary backing of <span className="font-semibold">Mr. Chaudhary Mumtaz & Sons</span> — their combined commitment to innovation, community empowerment, and ethical technology has shaped the foundation of the platform.
            </p>
            <p className="text-lg text-neural-700 leading-relaxed">
              The focus is not just on tools, but on creating intelligent allies designed to support, understand, and evolve with users across cultures and contexts.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-2xl p-8 border border-purple-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-neural-900">Our Mission</h3>
              </div>
              <p className="text-neural-700 mb-4 leading-relaxed">
                To develop modular, adaptive, and emotionally aware AI agents that enhance human life through intuitive interaction, deep learning, and ethical design.
              </p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-purple-600 font-bold">▸</span>
                  <div>
                    <span className="font-semibold text-neural-900">Modular</span>
                    <p className="text-sm text-neural-600">Easily integrated and customized</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-purple-600 font-bold">▸</span>
                  <div>
                    <span className="font-semibold text-neural-900">Intuitive</span>
                    <p className="text-sm text-neural-600">Seamless user experience across skill levels</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-purple-600 font-bold">▸</span>
                  <div>
                    <span className="font-semibold text-neural-900">Intelligent</span>
                    <p className="text-sm text-neural-600">Advanced frameworks for real-time learning</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-purple-600 font-bold">▸</span>
                  <div>
                    <span className="font-semibold text-neural-900">Companionable</span>
                    <p className="text-sm text-neural-600">Engages with empathy, not just efficiency</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-neural-600 font-semibold mt-6 pt-6 border-t border-purple-200">
                Bridging the gap between AI and human connection — making technology smarter and more relatable.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-green-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-neural-900">Why AI Digital Friend?</h3>
              </div>
              <p className="text-neural-700 mb-4 leading-relaxed">
                In a world full of automation, the future belongs to human-aware AI — systems that understand context, emotion, and intent.
              </p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <span className="font-semibold text-neural-900">Approachable</span>
                    <p className="text-sm text-neural-600">Friendly and natural interactions</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <span className="font-semibold text-neural-900">Adaptive</span>
                    <p className="text-sm text-neural-600">Continuously learning from user behavior</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <span className="font-semibold text-neural-900">Secure</span>
                    <p className="text-sm text-neural-600">Built with privacy and ethical safeguards</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <span className="font-semibold text-neural-900">Scalable</span>
                    <p className="text-sm text-neural-600">Enterprise-ready, global expansion possible</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-neural-600 font-semibold mt-6 pt-6 border-t border-green-200">
                Building timeless technology that serves real needs, not just trends.
              </p>
            </div>
          </div>

          {/* Royal AI Vision */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 md:p-10 text-white mb-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold">The Road Ahead: Royal AI™</h3>
            </div>
            <p className="text-lg mb-6 text-white/95">
              Long-term vision: Royal AI™, a next-generation ecosystem to push the boundaries of AI–human collaboration.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/15 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <h4 className="text-xl font-bold mb-3">Red Teaming Academy</h4>
                <ul className="space-y-2 text-sm text-white/90">
                  <li className="flex items-center gap-2">
                    <span>▸</span>
                    <span>Secure, invite-only platform for ethical hacking education</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>▸</span>
                    <span>Hands-on labs, mentorship, prevention, and awareness</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>▸</span>
                    <span>Youth empowerment and professional development</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/15 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <h4 className="text-xl font-bold mb-3">One Last AI Master</h4>
                <ul className="space-y-2 text-sm text-white/90">
                  <li className="flex items-center gap-2">
                    <span>▸</span>
                    <span>Immersive AI multiverse with 50+ intelligent agents</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>▸</span>
                    <span>Memory, voice, and visual intelligence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>▸</span>
                    <span>Cinematic AI design — personal and purposeful interactions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Our Vision */}
          <div className="bg-white rounded-2xl p-8 border border-blue-200 shadow-lg mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neural-900">Our Vision</h3>
            </div>
            <p className="text-lg text-neural-700 mb-4 leading-relaxed">
              A future where AI and humanity co-create solutions, govern systems, and elevate global well-being.
            </p>
            <p className="text-neural-700 leading-relaxed">
              AI Digital Friend will be a trusted ally as AI becomes part of daily life. One day, AI could play a role in governance, education, and diplomacy — and this platform is preparing that infrastructure now.
            </p>
          </div>

          {/* Strategic Platforms */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl mb-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-neural-900">Strategic Platforms Overview</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-neural-200 hover:shadow-xl hover:border-orange-300 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-neural-900">OneManArmy.ai</h4>
                </div>
                <p className="text-neural-600 text-sm mb-4">
                  Tactical platform for ethical hacking education
                </p>
                <ul className="space-y-2 text-sm text-neural-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    Real-world labs & AI-powered mentors
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    Certification pathways
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    Youth-focused, premium, secure, invite-only
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-neural-200 hover:shadow-xl hover:border-purple-300 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-neural-900">OneLast.ai</h4>
                </div>
                <p className="text-neural-600 text-sm mb-4">
                  Cinematic AI multiverse with 50+ modular agents
                </p>
                <ul className="space-y-2 text-sm text-neural-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Memory, emotion, voice, and personality
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Terminal, web, and mobile deployment
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Enterprise-ready, scalable, customizable
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Public Manifesto */}
          <div className="bg-white rounded-2xl p-8 border border-pink-200 shadow-lg mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neural-900">Public Manifesto</h3>
            </div>
            <p className="text-neural-700 mb-6 font-semibold">
              This is built for the public — the real stakeholders.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-pink-600 font-bold text-lg">→</span>
                <span className="text-neural-700">Every learner cracking their first exploit</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-600 font-bold text-lg">→</span>
                <span className="text-neural-700">Every creator launching with an AI co-pilot</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-600 font-bold text-lg">→</span>
                <span className="text-neural-700">Every dreamer who sees tech as a story, not just a tool</span>
              </li>
            </ul>
            
            <div className="bg-pink-50/60 rounded-xl p-6 border border-pink-100">
              <p className="text-neural-700 font-semibold mb-3">Our Belief:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-pink-600">◆</span>
                  <span className="text-neural-700"><span className="font-semibold">Platforms should feel personal</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-600">◆</span>
                  <span className="text-neural-700"><span className="font-semibold">Agents should feel alive</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-600">◆</span>
                  <span className="text-neural-700"><span className="font-semibold">Every launch should feel cinematic</span></span>
                </li>
              </ul>
            </div>

            <p className="text-neural-700 font-bold mt-6 text-lg">
              Royal AI™: Every limitation becomes a legend. Every user becomes a collaborator.
            </p>
          </div>

          {/* Acknowledgments */}
          <div className="bg-white rounded-2xl p-8 border border-amber-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neural-900">Acknowledgments</h3>
            </div>
            <p className="text-neural-700 leading-relaxed">
              Special thanks to <span className="font-semibold">Professor Johnny Benz (UK)</span>, Head of Security & Architecture, whose technical brilliance, creative direction, and strategic insight shaped the platform's architecture, security, branding, and strategy.
            </p>
            <p className="text-neural-600 mt-4 italic">
              His work embodies guerrilla-grade innovation — turning constraints into creativity, and ideas into impact.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="values-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#values-pattern)" />
          </svg>
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <Star className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Innovation</h3>
              <p className="text-white/90">
                Continuously pushing the boundaries of what's possible with AI technology.
              </p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Trust</h3>
              <p className="text-white/90">
                Building secure, reliable, and transparent AI solutions you can depend on.
              </p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Excellence</h3>
              <p className="text-white/90">
                Delivering exceptional experiences that exceed expectations every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Team */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container-custom max-w-3xl">
          <div className="bg-white rounded-3xl p-10 md:p-12 text-center shadow-2xl border border-neural-200">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-neural-900">Join Our Growing Team</h2>
            <p className="text-lg text-neural-600 mb-8 max-w-xl mx-auto">
              We're hiring talented people who share our passion for AI innovation and human-centric technology.
            </p>
            <Link href="/resources/careers" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105">
              View Careers
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
