'use client'

import Link from 'next/link'
import { MessageCircle, Users, Zap, Award, TrendingUp, Share2, Heart, Flame, Star } from 'lucide-react'

export default function DiscordPage() {
  return (
    <div className="min-h-full themed-section-bg">
      {/* Header - Glass Pillar Glassmorphism */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        {/* Chrome shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              Discord Community
            </div>
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-4">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">Join Our Discord</h1>
            <p className="text-base md:text-lg text-slate-600 mb-2">Connect with the Mumtaz AI community</p>
            <p className="text-sm text-slate-500">10,000+ members sharing knowledge and building together</p>
          </div>
        </div>
      </section>

      {/* Main CTA */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="glass-card p-10 md:p-12 text-center mb-12">
            <div className="text-7xl mb-6 animate-bounce">💜</div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Our Active Discord Community</h2>
            <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
              Join thousands of AI enthusiasts, developers, and innovators sharing tips, asking questions, and connecting with fellow Mumtaz AI users worldwide.
            </p>
            <a
              href="https://discord.gg/EXH6w9CH"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              <MessageCircle className="w-5 h-5" />
              Join Discord Community
              <span className="text-lg">→</span>
            </a>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-card p-8 hover:border-purple-300 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Share Ideas</h3>
              <p className="text-slate-500">Discuss new features, improvements, and innovative use cases with the community</p>
            </div>

            <div className="glass-card p-8 hover:border-indigo-300 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">❓</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Get Help</h3>
              <p className="text-slate-500">Connect with experts, get quick answers, and learn from experienced community members</p>
            </div>

            <div className="glass-card p-8 hover:border-pink-300 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Events & Updates</h3>
              <p className="text-slate-500">Participate in live events, competitions, and stay updated with latest platform news</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-3">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Why Join Our Discord?</h2>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-6 flex gap-4 hover:border-purple-300 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Real-Time Support</h3>
                <p className="text-slate-500">Get instant help from community members and Mumtaz AI team members</p>
              </div>
            </div>

            <div className="glass-card p-6 flex gap-4 hover:border-indigo-300 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Network & Collaborate</h3>
                <p className="text-slate-500">Build connections with fellow developers, entrepreneurs, and AI enthusiasts</p>
              </div>
            </div>

            <div className="glass-card p-6 flex gap-4 hover:border-pink-300 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Learn & Grow</h3>
                <p className="text-slate-500">Access tutorials, case studies, and best practices shared by experts</p>
              </div>
            </div>

            <div className="glass-card p-6 flex gap-4 hover:border-green-300 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Exclusive Opportunities</h3>
                <p className="text-slate-500">Get early access to features, special events, and community recognition programs</p>
              </div>
            </div>

            <div className="glass-card p-6 flex gap-4 hover:border-amber-300 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Active Channels</h3>
                <p className="text-slate-500">Dedicated channels for different topics, agent types, and use cases</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Community Stats</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">10K+</div>
              <p className="text-slate-500">Active Members</p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent mb-2">50+</div>
              <p className="text-slate-500">Active Channels</p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-2">1K+</div>
              <p className="text-slate-500">Daily Messages</p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-2">24/7</div>
              <p className="text-slate-500">Community Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Community Guidelines</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-card p-8 border border-green-200">
              <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">✓</span> Do's
              </h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Be respectful and inclusive to all members</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Share knowledge and help others learn</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Keep conversations relevant and focused</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Use threads for extended discussions</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-8 border border-red-200">
              <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">✗</span> Don'ts
              </h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Spam or post promotional content</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Engage in harassment or bullying</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Share personal or sensitive information</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Violate Discord's community guidelines</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Discord Channels Preview */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Popular Channels</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-card p-6 hover:border-purple-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-slate-800 mb-2">💬 #general</h3>
              <p className="text-slate-500 text-sm">General discussion about Mumtaz AI and the community</p>
            </div>

            <div className="glass-card p-6 hover:border-indigo-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-slate-800 mb-2">❓ #help</h3>
              <p className="text-slate-500 text-sm">Ask questions and get support from the community</p>
            </div>

            <div className="glass-card p-6 hover:border-blue-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-slate-800 mb-2">🤖 #agents</h3>
              <p className="text-slate-500 text-sm">Discuss agents, features, and agent-specific topics</p>
            </div>

            <div className="glass-card p-6 hover:border-amber-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-slate-800 mb-2">💡 #ideas</h3>
              <p className="text-slate-500 text-sm">Share ideas and vote on feature requests</p>
            </div>

            <div className="glass-card p-6 hover:border-green-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-slate-800 mb-2">📰 #announcements</h3>
              <p className="text-slate-500 text-sm">Official updates and important announcements</p>
            </div>

            <div className="glass-card p-6 hover:border-pink-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-slate-800 mb-2">🎉 #events</h3>
              <p className="text-slate-500 text-sm">Community events, competitions, and activities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Glass Pillar */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-t-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        {/* Chrome shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom max-w-3xl text-center relative z-10">
          <div className="max-w-2xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-4">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Ready to Join the Community?</h2>
            <p className="text-slate-600 mb-8 text-base max-w-xl mx-auto">
              Don&apos;t miss out! Join our Discord server now and connect with thousands of AI enthusiasts and developers.
            </p>
            <a
              href="https://discord.gg/EXH6w9CH"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)]"
            >
              <MessageCircle className="w-5 h-5" />
              Join Discord Server
              <span className="text-lg">→</span>
            </a>
            <p className="text-slate-400 mt-6 text-sm">
              By joining, you agree to follow our community guidelines and Discord&apos;s terms of service.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
