'use client'

import Link from 'next/link'

const countryFlags: Record<string, string> = {
  TH: '🇹🇭',
  UK: '🇬🇧',
  AE: '🇦🇪',
}

export default function TeamPage() {
  const leadership = [
    { name: "Miss Chuttra Dilokkanwong", role: "Owner & Founder", bio: "Visionary leader driving the mission and direction of One Last AI", location: "TH", color: "from-amber-500 to-orange-600" },
    { name: "Shahbaz Chaudhary", role: "Manager", bio: "Operations and strategy leader overseeing platform growth and delivery", location: "TH", color: "from-blue-500 to-indigo-600" },
    { name: "Professor Johnny Benz", role: "Head of Security & Architecture", bio: "Technical architect and security expert shaping platform infrastructure and strategy", location: "UK", color: "from-red-500 to-rose-600" },
  ]

  const team = [
    { name: "Adil Pieter", role: "CTO & Co-founder", bio: "Machine learning expert and former Google AI researcher", location: "AE", color: "from-cyan-500 to-blue-600" },
    { name: "Zara Faisal", role: "VP of Product", bio: "Product leader focused on user experience", location: "AE", color: "from-violet-500 to-purple-600" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="team-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#team-grid)"/>
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Meet Our Team</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">The people behind One Last AI — united by a shared mission to build human-centric AI</p>
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{leadership.length + team.length}</div>
              <div className="text-sm text-white/80">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">3</div>
              <div className="text-sm text-white/80">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">1</div>
              <div className="text-sm text-white/80">Mission</div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neural-900 mb-3">Leadership</h2>
            <p className="text-neural-600 text-lg">Guiding vision, strategy, and execution</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {leadership.map((member, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg border border-neural-100 overflow-hidden hover:shadow-xl transition-all group">
                <div className={`h-2 bg-gradient-to-r ${member.color}`} />
                <div className="p-8 text-center">
                  <div className={`w-20 h-20 mx-auto mb-5 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                    {member.name.split(' ').filter(n => n !== 'Miss' && n !== 'Professor').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-xl font-bold text-neural-900 mb-1">{member.name}</h3>
                  <p className={`font-semibold text-sm mb-3 bg-gradient-to-r ${member.color} bg-clip-text text-transparent`}>{member.role}</p>
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    <span className="text-lg">{countryFlags[member.location]}</span>
                    <span className="text-xs text-neural-500 font-medium">{member.location}</span>
                  </div>
                  <p className="text-neural-600 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neural-900 mb-3">Core Team</h2>
            <p className="text-neural-600 text-lg">Building the technology that powers the platform</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {team.map((member, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl shadow-lg border border-neural-100 overflow-hidden hover:shadow-xl transition-all group">
                <div className={`h-2 bg-gradient-to-r ${member.color}`} />
                <div className="p-8 text-center">
                  <div className={`w-20 h-20 mx-auto mb-5 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-xl font-bold text-neural-900 mb-1">{member.name}</h3>
                  <p className={`font-semibold text-sm mb-3 bg-gradient-to-r ${member.color} bg-clip-text text-transparent`}>{member.role}</p>
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    <span className="text-lg">{countryFlags[member.location]}</span>
                    <span className="text-xs text-neural-500 font-medium">{member.location === 'AE' ? 'UAE' : member.location}</span>
                  </div>
                  <p className="text-neural-600 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-600 to-accent-600">
        <div className="container-custom max-w-3xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">We&apos;re Growing</h2>
          <p className="text-lg text-white/90 mb-8">
            We&apos;re actively hiring talented people to join our mission. Check out our open positions.
          </p>
          <Link
            href="/resources/careers"
            className="inline-flex items-center px-8 py-3 bg-white text-brand-600 font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
          >
            View Open Positions
          </Link>
        </div>
      </section>
    </div>
  )
}
