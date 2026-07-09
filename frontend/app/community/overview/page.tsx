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
      description: "Help improve One Last AI by contributing code, reporting bugs, or suggesting new features.",
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <section className="relative py-16 md:py-24 bg-gradient-to-r from-brand-600 to-accent-600 text-white overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="community-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#community-grid)"/>
          </svg>
        </div>
        
        {/* Floating Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
        
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 shadow-lg">
            <Users className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Our Community</h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
            Join thousands of AI enthusiasts, developers, and innovators building the future together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/community/discord" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-white/25 transition-all transform hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              Join Discord
            </Link>
            <Link 
              href="/community/contributing" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold hover:bg-white/30 transition-all"
            >
              <GitBranch className="w-5 h-5" />
              Contribute
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-neural-200">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-neural-900 mb-4">Community Stats</h2>
            <p className="text-lg text-neural-600 max-w-2xl mx-auto">
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
                <p className="text-neural-600 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Links Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
              <Sparkles className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-neural-900 mb-4">Get Involved</h2>
            <p className="text-lg text-neural-600 max-w-2xl mx-auto">
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
                  className={`group bg-white rounded-2xl border ${item.borderColor} shadow-lg hover:shadow-xl p-6 transition-all hover:-translate-y-1`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${item.bgColor} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                      {item.emoji}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-neural-900 mb-2 group-hover:text-brand-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-neural-600 mb-4">{item.description}</p>
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
      <section className="py-16 bg-white border-t border-neural-200">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neural-900 mb-4">Why Join Us?</h2>
            <p className="text-lg text-neural-600 max-w-2xl mx-auto">
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
                  <h3 className="text-xl font-bold text-neural-900 mb-2">{item.title}</h3>
                  <p className="text-neural-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="container-custom text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Join?</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Start your journey with One Last AI today. Connect, learn, and build amazing things together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/community/discord" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-white/25 transition-all transform hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              Join Our Discord
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link 
              href="https://onelastai.co/agents" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold hover:bg-white/30 transition-all"
            >
              Explore AI Agents
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
