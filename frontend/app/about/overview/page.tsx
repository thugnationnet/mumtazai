'use client'

import Link from 'next/link'

export default function AboutOverviewPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Glass Pillar Glassmorphism */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -right-10 w-[200px] h-[600px] rotate-[-25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-indigo-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 left-[10%] w-[180px] h-[700px] rotate-[20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 right-[30%] w-[160px] h-[500px] rotate-[-35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-blue-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -left-10 w-[220px] h-[550px] rotate-[30deg] rounded-[100px] bg-gradient-to-t from-transparent via-purple-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[15%] right-[45%] w-[120px] h-[400px] rotate-[-15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-indigo-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-300/40 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              Our Story
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-indigo-800 to-purple-700 bg-clip-text text-transparent leading-tight">
              About Mumtaz AI
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Transforming businesses with emotionally intelligent, human-centric AI agents
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/about/team" className="px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] transition-all duration-300 hover:scale-105">
                Meet the Team
              </Link>
              <Link href="/about/partnerships" className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm">
                Our Partners
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Special Thanks Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 flex justify-between opacity-[0.07]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-300 via-white to-gray-300 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10 max-w-4xl">
          <div className="relative glass-card overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-600 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
            <div className="relative p-8 md:p-10">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70">
                  🙏
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Special Recognition</h3>
                  <p className="text-lg text-slate-600 mb-3">
                    We extend our heartfelt gratitude to <span className="font-bold text-slate-800">Mr. Ben from Thailand</span> for his exceptional and invaluable contributions to Mumtaz AI.
                  </p>
                  <p className="text-slate-500 mb-2 font-semibold">His dedication includes:</p>
                  <ul className="space-y-2 text-slate-500 ml-4">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 neu-icon rounded-full text-xs font-bold">✓</span>
                      Significant improvements to our core services and platform architecture
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 neu-icon rounded-full text-xs font-bold">✓</span>
                      Development and provision of essential tools that accelerate innovation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 neu-icon rounded-full text-xs font-bold">✓</span>
                      Financial support that enabled critical growth and expansion
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 neu-icon rounded-full text-xs font-bold">✓</span>
                      Unwavering overall support across all aspects of our mission
                    </li>
                  </ul>
                  <p className="text-slate-600 font-semibold mt-4">
                    Mr. Ben&apos;s vision, generosity, and commitment to excellence have been instrumental in bringing Mumtaz AI to life.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About AI Digital Friend */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 flex justify-between opacity-[0.05]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-400 via-gray-100 to-gray-400 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10 max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">About AI Digital Friend</h2>
            <p className="text-slate-400 text-lg">Building emotionally intelligent, human-centric AI systems that redefine digital companionship</p>
          </div>

          {/* Intro Card */}
          <div className="relative glass-card overflow-hidden mb-8">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
            <div className="relative p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">The Initiative</h3>
              <p className="text-lg text-slate-500 mb-4 leading-relaxed">
                <span className="font-semibold text-slate-700">AI Digital Friend</span> is a product of <span className="font-semibold text-slate-700">Grand Pa United™</span>, a global alliance of innovators from the UAE, UK, USA, and Thailand, united by a shared mission: to build emotionally intelligent, human-centric AI systems that redefine digital companionship.
              </p>
              <p className="text-lg text-slate-500 mb-4 leading-relaxed">
                Founded by <span className="font-semibold text-slate-700">Miss Chuttra Dilokkanwong (TH)</span>, and managed by <span className="font-semibold text-slate-700">Shahbaz Chaudhary (TH)</span>, with the visionary backing of <span className="font-semibold text-slate-700">Mr. Chaudhary Mumtaz &amp; Sons</span> — their combined commitment to innovation, community empowerment, and ethical technology has shaped the foundation of the platform.
              </p>
              <p className="text-lg text-slate-500 leading-relaxed">
                The focus is not just on tools, but on creating intelligent allies designed to support, understand, and evolve with users across cultures and contexts.
              </p>
            </div>
          </div>

          {/* Mission & Why Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500">
              <div className="h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
              <div className="relative p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70">⚡</div>
                  <h3 className="text-2xl font-bold text-slate-800">Our Mission</h3>
                </div>
                <p className="text-slate-500 mb-4 leading-relaxed">
                  To develop modular, adaptive, and emotionally aware AI agents that enhance human life through intuitive interaction, deep learning, and ethical design.
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3"><span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent font-bold">▸</span><div><span className="font-semibold text-slate-800">Modular</span><p className="text-sm text-slate-400">Easily integrated and customized</p></div></div>
                  <div className="flex gap-3"><span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent font-bold">▸</span><div><span className="font-semibold text-slate-800">Intuitive</span><p className="text-sm text-slate-400">Seamless user experience across skill levels</p></div></div>
                  <div className="flex gap-3"><span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent font-bold">▸</span><div><span className="font-semibold text-slate-800">Intelligent</span><p className="text-sm text-slate-400">Advanced frameworks for real-time learning</p></div></div>
                  <div className="flex gap-3"><span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent font-bold">▸</span><div><span className="font-semibold text-slate-800">Companionable</span><p className="text-sm text-slate-400">Engages with empathy, not just efficiency</p></div></div>
                </div>
                <p className="text-sm text-slate-400 font-semibold mt-6 pt-6 border-t border-slate-200">
                  Bridging the gap between AI and human connection — making technology smarter and more relatable.
                </p>
              </div>
            </div>

            <div className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-600 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
              <div className="relative p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70">💡</div>
                  <h3 className="text-2xl font-bold text-slate-800">Why AI Digital Friend?</h3>
                </div>
                <p className="text-slate-500 mb-4 leading-relaxed">
                  In a world full of automation, the future belongs to human-aware AI — systems that understand context, emotion, and intent.
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3"><span className="text-emerald-600 font-bold">✓</span><div><span className="font-semibold text-slate-800">Approachable</span><p className="text-sm text-slate-400">Friendly and natural interactions</p></div></div>
                  <div className="flex gap-3"><span className="text-emerald-600 font-bold">✓</span><div><span className="font-semibold text-slate-800">Adaptive</span><p className="text-sm text-slate-400">Continuously learning from user behavior</p></div></div>
                  <div className="flex gap-3"><span className="text-emerald-600 font-bold">✓</span><div><span className="font-semibold text-slate-800">Secure</span><p className="text-sm text-slate-400">Built with privacy and ethical safeguards</p></div></div>
                  <div className="flex gap-3"><span className="text-emerald-600 font-bold">✓</span><div><span className="font-semibold text-slate-800">Scalable</span><p className="text-sm text-slate-400">Enterprise-ready, global expansion possible</p></div></div>
                </div>
                <p className="text-sm text-slate-400 font-semibold mt-6 pt-6 border-t border-slate-200">
                  Building timeless technology that serves real needs, not just trends.
                </p>
              </div>
            </div>
          </div>

          {/* Royal AI Vision */}
          <div className="relative glass-card overflow-hidden mb-8">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
            <div className="relative p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70">⭐</div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800">The Road Ahead: Royal AI™</h3>
              </div>
              <p className="text-lg mb-6 text-slate-500">
                Long-term vision: Royal AI™, a next-generation ecosystem to push the boundaries of AI–human collaboration.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h4 className="text-xl font-bold text-slate-800 mb-3">Red Teaming Academy</h4>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2"><span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-bold">▸</span>Secure, invite-only platform for ethical hacking education</li>
                    <li className="flex items-center gap-2"><span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-bold">▸</span>Hands-on labs, mentorship, prevention, and awareness</li>
                    <li className="flex items-center gap-2"><span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-bold">▸</span>Youth empowerment and professional development</li>
                  </ul>
                </div>
                <div className="glass-card p-6">
                  <h4 className="text-xl font-bold text-slate-800 mb-3">Mumtaz AI Master</h4>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2"><span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">▸</span>Immersive AI multiverse with 50+ intelligent agents</li>
                    <li className="flex items-center gap-2"><span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">▸</span>Memory, voice, and visual intelligence</li>
                    <li className="flex items-center gap-2"><span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">▸</span>Cinematic AI design — personal and purposeful interactions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Our Vision */}
          <div className="relative glass-card overflow-hidden mb-8">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
            <div className="relative p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70">🌍</div>
                <h3 className="text-2xl font-bold text-slate-800">Our Vision</h3>
              </div>
              <p className="text-lg text-slate-500 mb-4 leading-relaxed">
                A future where AI and humanity co-create solutions, govern systems, and elevate global well-being.
              </p>
              <p className="text-slate-500 leading-relaxed">
                AI Digital Friend will be a trusted ally as AI becomes part of daily life. One day, AI could play a role in governance, education, and diplomacy — and this platform is preparing that infrastructure now.
              </p>
            </div>
          </div>

          {/* Strategic Platforms */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-700">Strategic Platforms Overview</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500">
                <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-600 opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
                <div className="relative p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70">🛡️</div>
                    <h4 className="text-xl font-bold text-slate-800">OneManArmy.ai</h4>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">Tactical platform for ethical hacking education</p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-full"></span>Real-world labs &amp; AI-powered mentors</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-full"></span>Certification pathways</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-full"></span>Youth-focused, premium, secure, invite-only</li>
                  </ul>
                </div>
              </div>

              <div className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500">
                <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-600 opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
                <div className="relative p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70">👥</div>
                    <h4 className="text-xl font-bold text-slate-800">OneLast.ai</h4>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">Cinematic AI multiverse with 50+ modular agents</p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></span>Memory, emotion, voice, and personality</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></span>Terminal, web, and mobile deployment</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></span>Enterprise-ready, scalable, customizable</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Public Manifesto */}
          <div className="relative glass-card overflow-hidden mb-8">
            <div className="h-1.5 bg-gradient-to-r from-pink-500 to-rose-600 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
            <div className="relative p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70">❤️</div>
                <h3 className="text-2xl font-bold text-slate-800">Public Manifesto</h3>
              </div>
              <p className="text-slate-600 mb-6 font-semibold">
                This is built for the public — the real stakeholders.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3"><span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent font-bold text-lg">→</span><span className="text-slate-500">Every learner cracking their first exploit</span></li>
                <li className="flex items-start gap-3"><span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent font-bold text-lg">→</span><span className="text-slate-500">Every creator launching with an AI co-pilot</span></li>
                <li className="flex items-start gap-3"><span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent font-bold text-lg">→</span><span className="text-slate-500">Every dreamer who sees tech as a story, not just a tool</span></li>
              </ul>
              <div className="glass-card p-6">
                <p className="text-slate-600 font-semibold mb-3">Our Belief:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2"><span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">◆</span><span className="text-slate-500 font-semibold">Platforms should feel personal</span></li>
                  <li className="flex items-center gap-2"><span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">◆</span><span className="text-slate-500 font-semibold">Agents should feel alive</span></li>
                  <li className="flex items-center gap-2"><span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">◆</span><span className="text-slate-500 font-semibold">Every launch should feel cinematic</span></li>
                </ul>
              </div>
              <p className="text-slate-700 font-bold mt-6 text-lg">
                Royal AI™: Every limitation becomes a legend. Every user becomes a collaborator.
              </p>
            </div>
          </div>

          {/* Acknowledgments */}
          <div className="relative glass-card overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
            <div className="relative p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70">🏆</div>
                <h3 className="text-2xl font-bold text-slate-800">Acknowledgments</h3>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Special thanks to <span className="font-semibold text-slate-700">Professor Johnny Benz (UK)</span>, Head of Security &amp; Architecture, whose technical brilliance, creative direction, and strategic insight shaped the platform&apos;s architecture, security, branding, and strategy.
              </p>
              <p className="text-slate-400 mt-4 italic">
                His work embodies guerrilla-grade innovation — turning constraints into creativity, and ideas into impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values - Glass Pillar Glassmorphism */}
      <section className="relative py-14 overflow-hidden rounded-[2rem] mx-4 mb-8 themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-24 -right-8 w-[160px] h-[500px] rotate-[-30deg] rounded-[80px] bg-gradient-to-b from-white/50 via-rose-300/20 to-transparent backdrop-blur-sm border border-white/35" />
        <div className="absolute -top-16 left-[5%] w-[140px] h-[450px] rotate-[25deg] rounded-[80px] bg-gradient-to-b from-transparent via-violet-300/20 to-white/40 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-32 right-[40%] w-[180px] h-[500px] rotate-[-20deg] rounded-[90px] bg-gradient-to-t from-white/45 via-amber-300/15 to-transparent backdrop-blur-sm border border-white/25" />
        <div className="absolute -bottom-20 -left-6 w-[150px] h-[400px] rotate-[35deg] rounded-[80px] bg-gradient-to-t from-transparent via-purple-300/20 to-white/50 backdrop-blur-sm border border-white/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-rose-700 bg-clip-text text-transparent">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { icon: "❤️", title: "Innovation", desc: "Continuously pushing the boundaries of what's possible with AI technology.", color: "from-rose-500 to-pink-500" },
              { icon: "🛡️", title: "Trust", desc: "Building secure, reliable, and transparent AI solutions you can depend on.", color: "from-indigo-500 to-blue-500" },
              { icon: "⚡", title: "Excellence", desc: "Delivering exceptional experiences that exceed expectations every time.", color: "from-amber-500 to-orange-500" }
            ].map((v, i) => (
              <div key={i} className="group bg-white/30 backdrop-blur-2xl border border-white/50 rounded-2xl p-7 text-center hover:bg-white/45 hover:border-white/60 hover:-translate-y-2 transition-all duration-500 shadow-[0_4px_30px_rgba(139,92,246,0.1),inset_0_1px_0_rgba(255,255,255,0.6)]">
                <div className={`w-14 h-14 mx-auto mb-4 bg-gradient-to-br ${v.color} rounded-2xl flex items-center justify-center text-2xl shadow-[0_4px_15px_rgba(139,92,246,0.2)] group-hover:shadow-[0_4px_25px_rgba(139,92,246,0.3)] transition-shadow duration-500`}>
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Team CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 flex justify-between opacity-[0.07]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-300 via-white to-gray-300 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10 max-w-3xl">
          <div className="relative glass-card overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
            <div className="relative p-10 md:p-12 text-center">
              <div className="w-20 h-20 neu-icon rounded-2xl mx-auto mb-6 text-3xl">👥</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800">Join Our Growing Team</h2>
              <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
                We&apos;re hiring talented people who share our passion for AI innovation and human-centric technology.
              </p>
              <Link href="/resources/careers" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-xl shadow-lg transition-all transform hover:scale-105">
                View Careers
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
