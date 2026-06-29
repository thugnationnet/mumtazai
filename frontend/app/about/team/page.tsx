'use client'

import Link from 'next/link'

const countryFlags: Record<string, string> = {
  TH: '🇹🇭',
  UK: '🇬🇧',
  AE: '🇦🇪',
}

export default function TeamPage() {
  const leadership = [
    { name: "Miss Chuttra Dilokkanwong", role: "Owner & Founder", bio: "Visionary leader driving the mission and direction of Mumtaz AI", location: "TH", color: "from-amber-500 to-orange-600" },
    { name: "Shahbaz Chaudhary", role: "Manager", bio: "Operations and strategy leader overseeing platform growth and delivery", location: "TH", color: "from-blue-500 to-indigo-600" },
    { name: "Professor Johnny Benz", role: "Head of Security & Architecture", bio: "Technical architect and security expert shaping platform infrastructure and strategy", location: "UK", color: "from-red-500 to-rose-600" },
  ]

  const team = [
    { name: "Adil Pieter", role: "CTO & Co-founder", bio: "Machine learning expert and former Google AI researcher", location: "AE", color: "from-cyan-500 to-blue-600" },
    { name: "Zara Faisal", role: "VP of Product", bio: "Product leader focused on user experience", location: "AE", color: "from-violet-500 to-purple-600" },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section - Glass Pillar Glassmorphism */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -right-10 w-[200px] h-[600px] rotate-[-25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-violet-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 left-[12%] w-[180px] h-[700px] rotate-[22deg] rounded-[100px] bg-gradient-to-b from-transparent via-purple-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 right-[28%] w-[160px] h-[500px] rotate-[-32deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -left-10 w-[220px] h-[550px] rotate-[28deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[12%] right-[48%] w-[120px] h-[400px] rotate-[-12deg] rounded-[80px] bg-gradient-to-b from-white/40 via-violet-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/10 border border-violet-300/40 rounded-full text-violet-700 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              Our People
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-violet-800 to-purple-700 bg-clip-text text-transparent leading-tight">
              Meet Our Team
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              The people behind Mumtaz AI — united by a shared mission to build human-centric AI.
              {' '}{leadership.length + team.length} team members across 3 countries.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/resources/careers" className="px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">
                Join Our Team
              </Link>
              <Link href="/about" className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="relative py-20 overflow-hidden">
        {/* Silver pillar background */}
        <div className="absolute inset-0 flex justify-between opacity-[0.07]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-300 via-white to-gray-300 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">Leadership</h2>
            <p className="text-slate-400 text-lg">Guiding vision, strategy, and execution</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {leadership.map((member, idx) => (
              <div key={idx} className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500 group">
                <div className={`h-1.5 bg-gradient-to-r ${member.color} opacity-80`} />
                {/* Glass shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
                <div className="relative p-8 text-center">
                  <div className={`w-20 h-20 mx-auto mb-5 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70`}>
                    {member.name.split(' ').filter(n => n !== 'Miss' && n !== 'Professor').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{member.name}</h3>
                  <p className={`font-semibold text-sm mb-3 bg-gradient-to-r ${member.color} bg-clip-text text-transparent`}>{member.role}</p>
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    <span className="text-lg">{countryFlags[member.location]}</span>
                    <span className="text-xs text-slate-400 font-medium">{member.location}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="relative py-20 overflow-hidden">
        {/* Silver pillar background */}
        <div className="absolute inset-0 flex justify-between opacity-[0.05]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-400 via-gray-100 to-gray-400 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">Core Team</h2>
            <p className="text-slate-400 text-lg">Building the technology that powers the platform</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {team.map((member, idx) => (
              <div key={idx} className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500 group">
                <div className={`h-1.5 bg-gradient-to-r ${member.color} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
                <div className="relative p-8 text-center">
                  <div className={`w-20 h-20 mx-auto mb-5 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{member.name}</h3>
                  <p className={`font-semibold text-sm mb-3 bg-gradient-to-r ${member.color} bg-clip-text text-transparent`}>{member.role}</p>
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    <span className="text-lg">{countryFlags[member.location]}</span>
                    <span className="text-xs text-slate-400 font-medium">{member.location === 'AE' ? 'UAE' : member.location}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Glass Pillar Glassmorphism */}
      <section className="relative py-14 overflow-hidden rounded-[2rem] mx-4 mb-8 themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-24 -left-8 w-[160px] h-[500px] rotate-[28deg] rounded-[80px] bg-gradient-to-b from-white/50 via-violet-300/20 to-transparent backdrop-blur-sm border border-white/35" />
        <div className="absolute -top-16 right-[8%] w-[140px] h-[450px] rotate-[-22deg] rounded-[80px] bg-gradient-to-b from-transparent via-purple-300/20 to-white/40 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-32 right-[42%] w-[180px] h-[500px] rotate-[-18deg] rounded-[90px] bg-gradient-to-t from-white/45 via-fuchsia-300/15 to-transparent backdrop-blur-sm border border-white/25" />
        <div className="absolute -bottom-20 -right-6 w-[150px] h-[400px] rotate-[35deg] rounded-[80px] bg-gradient-to-t from-transparent via-indigo-300/20 to-white/50 backdrop-blur-sm border border-white/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom max-w-3xl text-center relative z-10">
          <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <h2 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-slate-800 via-violet-800 to-purple-700 bg-clip-text text-transparent">We&apos;re Growing</h2>
            <p className="text-base text-slate-600 mb-7 max-w-xl mx-auto">
              We&apos;re actively hiring talented people to join our mission. Check out our open positions.
            </p>
            <Link
              href="/resources/careers"
              className="inline-flex items-center px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105"
            >
              View Open Positions
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
