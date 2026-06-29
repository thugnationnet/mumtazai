import Link from 'next/link'

export default function About() {
  const sections = [
    {
      title: "About Us",
      description: "Learn about our mission, vision, and the story behind our AI agent platform.",
      icon: "🏢",
      href: "/about/overview",
      highlights: ["Company Mission", "Our Vision", "Core Values", "Company History"],
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Meet the Team",
      description: "Get to know the talented individuals driving innovation in AI technology.",
      icon: "👥",
      href: "/about/team",
      highlights: ["Leadership Team", "Engineering", "Research", "Customer Success"],
      color: "from-violet-500 to-purple-600"
    },
    {
      title: "Partnerships",
      description: "Discover our strategic partnerships and ecosystem of collaborators.",
      icon: "🤝",
      href: "/about/partnerships",
      highlights: ["Technology Partners", "Integration Partners", "Channel Partners", "Academic Research"],
      color: "from-amber-500 to-orange-600"
    }
  ]

  const stats = [
    { number: "50M+", label: "Conversations Processed", color: "from-blue-500 to-indigo-600" },
    { number: "10K+", label: "Active Users", color: "from-violet-500 to-purple-600" },
    { number: "99.9%", label: "Uptime", color: "from-emerald-500 to-green-600" },
    { number: "150+", label: "Countries Served", color: "from-amber-500 to-orange-600" }
  ]

  return (
    <div className="min-h-screen">
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
        <div className="container-custom relative z-10 text-center">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              About Mumtaz AI
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">
              About Us
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              We&apos;re building the future of AI agents, empowering businesses to automate and scale with intelligent conversational AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/about/overview" className="px-7 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">
                Our Story
              </Link>
              <Link href="/about/team" className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm">
                Meet the Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="relative py-20 overflow-hidden">
        {/* Silver pillar background */}
        <div className="absolute inset-0 flex justify-between opacity-[0.07]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-300 via-white to-gray-300 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="relative glass-card overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
              <div className="relative p-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-6">Our Mission</h2>
                <p className="text-lg text-slate-500 leading-relaxed mb-6">
                  To democratize access to advanced AI technology by creating intelligent agents that understand, learn, and adapt to help businesses achieve their goals more efficiently.
                </p>
                <p className="text-slate-500">
                  We believe that AI should be accessible, transparent, and designed to augment human capabilities rather than replace them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 flex justify-between opacity-[0.05]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-400 via-gray-100 to-gray-400 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">Our Impact</h2>
            <p className="text-slate-400 text-lg">Numbers that tell our story</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500">
                <div className={`h-1.5 bg-gradient-to-r ${stat.color} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
                <div className="relative p-8 text-center">
                  <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                    {stat.number}
                  </div>
                  <div className="text-slate-500 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Sections */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 flex justify-between opacity-[0.07]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-300 via-white to-gray-300 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">Explore</h2>
            <p className="text-slate-400 text-lg">Learn more about what makes us tick</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {sections.map((section, index) => (
              <Link key={index} href={section.href} className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500 group">
                <div className={`h-1.5 bg-gradient-to-r ${section.color} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
                <div className="relative p-8">
                  <div className={`w-16 h-16 mb-5 bg-gradient-to-br ${section.color} rounded-2xl flex items-center justify-center text-3xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70`}>
                    {section.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-slate-500 mb-4 leading-relaxed text-sm">
                    {section.description}
                  </p>
                  <ul className="space-y-2">
                    {section.highlights.map((highlight, highlightIndex) => (
                      <li key={highlightIndex} className="text-sm text-slate-400 flex items-center">
                        <span className={`w-1.5 h-1.5 bg-gradient-to-r ${section.color} rounded-full mr-3`}></span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values CTA - Glass Pillar Glassmorphism */}
      <section className="relative py-14 overflow-hidden rounded-[2rem] mx-4 mb-8 themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-24 -left-8 w-[160px] h-[500px] rotate-[30deg] rounded-[80px] bg-gradient-to-b from-white/50 via-purple-300/25 to-transparent backdrop-blur-sm border border-white/35" />
        <div className="absolute -top-16 right-[5%] w-[140px] h-[450px] rotate-[-25deg] rounded-[80px] bg-gradient-to-b from-transparent via-violet-300/20 to-white/40 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-32 left-[40%] w-[180px] h-[500px] rotate-[20deg] rounded-[90px] bg-gradient-to-t from-white/45 via-fuchsia-300/15 to-transparent backdrop-blur-sm border border-white/25" />
        <div className="absolute -bottom-20 -right-6 w-[150px] h-[400px] rotate-[-35deg] rounded-[80px] bg-gradient-to-t from-transparent via-indigo-300/20 to-white/50 backdrop-blur-sm border border-white/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom max-w-4xl relative z-10">
          <h2 className="text-3xl md:text-4xl font-black mb-8 text-center bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: "🎯", title: "Innovation", desc: "Continuously pushing the boundaries of what's possible with AI technology.", color: "from-blue-500 to-cyan-500" },
              { icon: "🛡️", title: "Trust", desc: "Building secure, reliable, and transparent AI solutions you can depend on.", color: "from-indigo-500 to-purple-500" },
              { icon: "🚀", title: "Excellence", desc: "Delivering exceptional experiences that exceed expectations every time.", color: "from-cyan-500 to-emerald-500" }
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
    </div>
  )
}