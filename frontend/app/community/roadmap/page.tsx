'use client'

import Link from 'next/link'

export default function RoadmapPage() {
  const roadmap = [
    {
      quarter: "Q4 2025",
      status: "Completed",
      statusColor: "bg-green-100 text-green-700 border-green-200",
      icon: "✓",
      features: [
        { name: "Voice integration for all agents", description: "Natural voice conversations with every AI agent", completed: true },
        { name: "Advanced analytics dashboard", description: "Deep insights into usage patterns and performance", completed: true },
        { name: "Custom agent creation", description: "Build and train your own specialized AI agents", completed: true }
      ]
    },
    {
      quarter: "Q1 2026",
      status: "In Progress",
      statusColor: "bg-amber-100 text-amber-700 border-amber-200",
      icon: "🔄",
      features: [
        { name: "Mobile app launch", description: "Native iOS and Android apps for on-the-go access", completed: false },
        { name: "Slack integration", description: "Use agents directly in your Slack workspace", completed: true },
        { name: "Team collaboration features", description: "Share agents and conversations with your team", completed: false },
        { name: "Canvas code generation", description: "AI-powered code and content generation workspace", completed: true }
      ]
    },
    {
      quarter: "Q2 2026",
      status: "Planned",
      statusColor: "bg-blue-100 text-blue-700 border-blue-200",
      icon: "📋",
      features: [
        { name: "Enterprise SSO", description: "SAML and OAuth integration for enterprise security", completed: false },
        { name: "Advanced security features", description: "SOC 2 compliance and advanced encryption", completed: false },
        { name: "API marketplace", description: "Discover and integrate third-party AI tools", completed: false }
      ]
    },
    {
      quarter: "Q3 2026",
      status: "Planned",
      statusColor: "bg-purple-100 text-purple-700 border-purple-200",
      icon: "🚀",
      features: [
        { name: "Multi-modal agents", description: "Agents that understand images, audio, and documents", completed: false },
        { name: "Workflow automation", description: "Chain agents together for complex tasks", completed: false },
        { name: "White-label solutions", description: "Deploy branded AI agents for your customers", completed: false }
      ]
    }
  ]

  return (
    <div className="min-h-full themed-section-bg">
      {/* Hero Section - Glass Pillar Glassmorphism */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        {/* Chrome shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="text-xl">🗺️</span>
              Building the Future
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">Product Roadmap</h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">See what we&apos;re building next and help shape the future of Mumtaz AI</p>
          </div>
        </div>
      </section>

      {/* Roadmap Timeline */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {roadmap.map((phase, idx) => (
              <div key={idx} className="glass-card overflow-hidden">
                {/* Phase Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-white/80">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                      {phase.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-800">{phase.quarter}</h2>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${phase.statusColor}`}>
                      {phase.status}
                    </span>
                  </div>
                </div>
                
                {/* Features List */}
                <div className="p-6">
                  <div className="space-y-4">
                    {phase.features.map((feature, fIdx) => (
                      <div key={fIdx} className={`flex items-start gap-4 p-4 rounded-xl transition ${feature.completed ? 'bg-green-50 border border-green-100' : 'bg-transparent border border-white/80'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${feature.completed ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          {feature.completed ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold ${feature.completed ? 'text-green-800' : 'text-slate-800'}`}>{feature.name}</h3>
                          <p className={`text-sm mt-0.5 ${feature.completed ? 'text-green-600' : 'text-slate-400'}`}>{feature.description}</p>
                        </div>
                        {feature.completed && (
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Done</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          <div className="mt-12 glass-card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Overall Progress</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-white/40 rounded-full h-4 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <span className="text-sm font-semibold text-slate-600">45% Complete</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-500">Completed: 6 features</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-slate-500">In Progress: 2 features</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                <span className="text-slate-500">Planned: 6 features</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Glass Pillar */}
      <section className="py-16 border-t border-white/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="w-16 h-16 bg-white/40 border border-white/60 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Have an Idea?</h2>
            <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
              We love hearing from our community. Share your feature requests and help shape the future of Mumtaz AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/community/suggestions" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Submit Your Idea
              </Link>
              <Link href="/community" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/40 hover:bg-white/60 text-slate-700 rounded-xl font-semibold transition border border-white/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Join Community
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
