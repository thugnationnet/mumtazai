'use client'

import Link from 'next/link'
import { Users, MessageCircle, GitBranch, Map, Heart, Star, Code, Sparkles, ArrowRight, ExternalLink } from 'lucide-react'

export default function CommunityOverviewPage() {
  const communityLinks = [
    {
      icon: MessageCircle,
      emoji: "💬",
      title: "Discord Community",
      description: "Join our active Discord server to connect with other AI enthusiasts, get help, and share your projects.",
      link: "/community/discord",
      linkText: "Join Discord",
      color: "from-indigo-500 to-purple-600",
      bgColor: "from-indigo-50 to-purple-50",
      borderColor: "border-indigo-200"
    },
    {
      icon: GitBranch,
      emoji: "🔧",
      title: "Contributing",
      description: "Help improve Mumtaz AI by contributing code, reporting bugs, or suggesting new features.",
      link: "/community/contributing",
      linkText: "Get Involved",
      color: "from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200"
    },
    {
      icon: Map,
      emoji: "🗺️",
      title: "Open Roadmap",
      description: "See what features are coming next, track progress, and vote on what matters to you.",
      link: "/community/roadmap",
      linkText: "View Roadmap",
      color: "from-amber-500 to-orange-600",
      bgColor: "from-amber-50 to-orange-50",
      borderColor: "border-amber-200"
    },
    {
      icon: Sparkles,
      emoji: "💡",
      title: "Suggestions",
      description: "Share your ideas and feature requests. We love hearing from our community!",
      link: "/community/suggestions",
      linkText: "Submit Ideas",
      color: "from-pink-500 to-rose-600",
      bgColor: "from-pink-50 to-rose-50",
      borderColor: "border-pink-200"
    }
  ]

  const stats = [
    { number: "10K+", label: "Active Members", emoji: "👥", color: "text-blue-600", bgColor: "from-blue-50 to-indigo-50", borderColor: "border-blue-100" },
    { number: "5K+", label: "GitHub Stars", emoji: "⭐", color: "text-amber-600", bgColor: "from-amber-50 to-yellow-50", borderColor: "border-amber-100" },
    { number: "500+", label: "Contributions", emoji: "🔧", color: "text-green-600", bgColor: "from-green-50 to-emerald-50", borderColor: "border-green-100" },
    { number: "18", label: "AI Agents", emoji: "🤖", color: "text-purple-600", bgColor: "from-purple-50 to-pink-50", borderColor: "border-purple-100" }
  ]

  const highlights = [
    { icon: Heart, title: "Supportive Environment", description: "Our community is welcoming to all skill levels" },
    { icon: Code, title: "Open Source Spirit", description: "Transparency and collaboration at our core" },
    { icon: Star, title: "Recognition", description: "Top contributors get featured and rewarded" }
  ]

  return (
    <div className="min-h-full themed-section-bg">
      {/* Hero Header - Glass Pillar Glassmorphism */}
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
              Community
            </div>
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-4">
              <Users className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">Our Community</h1>
            <p className="text-base md:text-lg text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Join thousands of AI enthusiasts, developers, and innovators building the future together.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/community/discord" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all transform hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                Join Discord
              </Link>
              <Link 
                href="/community/contributing" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/40 backdrop-blur-sm border border-white/60 text-slate-700 rounded-xl font-semibold hover:bg-white/60 transition-all"
              >
                <GitBranch className="w-5 h-5" />
                Contribute
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b border-white/40">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Community Stats</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              A growing community of passionate individuals making AI accessible to everyone.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <div 
                key={idx} 
                className={`bg-gradient-to-br ${stat.bgColor} rounded-2xl p-6 border ${stat.borderColor} text-center hover:shadow-lg transition-all hover:-translate-y-1`}
              >
                <div className="text-4xl mb-2">{stat.emoji}</div>
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-1`}>{stat.number}</div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Links Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-4">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Get Involved</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              There are many ways to be part of our community. Find what works best for you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {communityLinks.map((item, idx) => {
              const Icon = item.icon
              return (
                <Link 
                  key={idx} 
                  href={item.link}
                  className={`group glass-card border ${item.borderColor} hover:shadow-xl p-6 transition-all hover:-translate-y-1`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${item.bgColor} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                      {item.emoji}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-slate-500 mb-4">{item.description}</p>
                      <div className={`inline-flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r ${item.color} font-semibold group-hover:gap-3 transition-all`}>
                        {item.linkText}
                        <ArrowRight className={`w-4 h-4 text-current opacity-70`} style={{color: 'currentColor'}} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-16 border-t border-white/40">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Why Join Us?</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Be part of a community that values collaboration, learning, and innovation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {highlights.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-slate-500">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Glass Pillar */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-t-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        {/* Chrome shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom text-center relative z-10">
          <div className="max-w-2xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-4">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Ready to Join?</h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto mb-8">
              Start your journey with Mumtaz AI today. Connect, learn, and build amazing things together.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/community/discord" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all transform hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                Join Our Discord
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link 
                href="https://mumtaz.ai/agents" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/40 backdrop-blur-sm border border-white/60 text-slate-700 rounded-xl font-semibold hover:bg-white/60 transition-all"
              >
                Explore AI Agents
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
