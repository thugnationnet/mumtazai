'use client'

import Link from 'next/link'

export default function PartnershipsPage() {
  const technologyPartners = [
    {
      name: "Google Cloud",
      icon: "☁️",
      description: "Infrastructure and AI/ML services",
      details: "Leveraging Google Cloud's powerful infrastructure and AI tools for scalable agent deployment and advanced machine learning capabilities.",
      color: "from-blue-500 to-cyan-600"
    },
    {
      name: "Amazon Web Services",
      icon: "⚙️",
      description: "Cloud computing and storage solutions",
      details: "Using AWS's comprehensive suite of services for reliable hosting, data processing, and enterprise-grade security for Mumtaz AI.",
      color: "from-orange-500 to-amber-600"
    },
    {
      name: "Microsoft Azure",
      icon: "🔷",
      description: "Enterprise cloud and AI services",
      details: "Integrating Azure's enterprise solutions for advanced AI capabilities, compliance, and hybrid cloud support.",
      color: "from-indigo-500 to-blue-600"
    }
  ]

  const integrationPartners = [
    {
      name: "Slack",
      icon: "💬",
      description: "Team communication platform",
      details: "Deploy agents directly in Slack to enhance team productivity, automate workflows, and get instant assistance without leaving your workspace.",
      color: "from-purple-500 to-violet-600"
    },
    {
      name: "Microsoft Teams",
      icon: "👥",
      description: "Enterprise communication hub",
      details: "Integrate Mumtaz AI agents with Teams for seamless collaboration, automated notifications, and enterprise communication workflows.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      name: "Zapier",
      icon: "⚡",
      description: "Automation and workflow platform",
      details: "Connect Mumtaz AI with thousands of apps through Zapier for sophisticated automation workflows and data synchronization.",
      color: "from-amber-500 to-orange-600"
    },
    {
      name: "HubSpot",
      icon: "📊",
      description: "CRM and marketing automation",
      details: "Enhance your CRM with intelligent agents for customer support, lead qualification, and marketing automation workflows.",
      color: "from-rose-500 to-pink-600"
    }
  ]

  const resellerPartners = [
    {
      name: "Accenture",
      icon: "🏢",
      description: "Global technology consulting",
      details: "Helping organizations worldwide implement and optimize AI agent solutions for enterprise transformation.",
      color: "from-emerald-500 to-green-600"
    },
    {
      name: "Deloitte",
      icon: "📈",
      description: "Professional services and consulting",
      details: "Providing strategic guidance and implementation support for enterprises adopting AI and agent technologies.",
      color: "from-blue-500 to-sky-600"
    },
    {
      name: "IBM Consulting",
      icon: "🔧",
      description: "Enterprise technology solutions",
      details: "Delivering comprehensive consulting and integration services for enterprise-scale Mumtaz AI deployments.",
      color: "from-slate-500 to-gray-600"
    }
  ]

  const benefits = [
    { title: "Enterprise Reliability", icon: "🛡️", description: "Backed by industry-leading infrastructure providers ensuring 99.99% uptime and enterprise-grade security.", color: "from-blue-500 to-indigo-600" },
    { title: "Seamless Integrations", icon: "🔌", description: "Connect with tools your teams already use, reducing friction and accelerating adoption across your organization.", color: "from-violet-500 to-purple-600" },
    { title: "Advanced Capabilities", icon: "📈", description: "Access cutting-edge AI and ML capabilities through our technology partnerships with innovation leaders.", color: "from-emerald-500 to-green-600" },
    { title: "Expert Implementation", icon: "🚀", description: "Get support from world-class consulting firms with deep experience implementing enterprise AI solutions.", color: "from-amber-500 to-orange-600" }
  ]

  const stats = [
    { number: "50+", label: "Active Partnerships", color: "from-blue-500 to-indigo-600" },
    { number: "150+", label: "Countries Reached", color: "from-violet-500 to-purple-600" },
    { number: "10K+", label: "Enterprises Supported", color: "from-rose-500 to-pink-600" },
    { number: "99.99%", label: "Uptime SLA", color: "from-emerald-500 to-green-600" }
  ]

  const PartnerCard = ({ partner }: { partner: { name: string; icon: string; description: string; details: string; color: string } }) => (
    <div className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500 group">
      <div className={`h-1.5 bg-gradient-to-r ${partner.color} opacity-80`} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
      <div className="relative p-8">
        <div className={`w-16 h-16 mb-5 bg-gradient-to-br ${partner.color} rounded-2xl flex items-center justify-center text-3xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70`}>
          {partner.icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">{partner.name}</h3>
        <p className={`font-semibold text-sm mb-3 bg-gradient-to-r ${partner.color} bg-clip-text text-transparent`}>{partner.description}</p>
        <p className="text-slate-500 text-sm leading-relaxed">{partner.details}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* Hero Section - Glass Pillar Glassmorphism */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[20deg] rounded-[100px] bg-gradient-to-b from-white/60 via-amber-300/25 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[8%] w-[180px] h-[700px] rotate-[-22deg] rounded-[100px] bg-gradient-to-b from-transparent via-orange-300/20 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[25%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-purple-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-28deg] rounded-[100px] bg-gradient-to-t from-transparent via-rose-300/20 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[50%] w-[120px] h-[400px] rotate-[12deg] rounded-[80px] bg-gradient-to-b from-white/40 via-amber-200/15 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-300/40 rounded-full text-amber-700 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Strategic Alliances
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-amber-800 to-orange-700 bg-clip-text text-transparent leading-tight">
              Our Partnerships
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Strategic alliances driving innovation in AI. Together with industry leaders, we&apos;re building the future of intelligent automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/support/contact-us" className="px-7 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all duration-300 hover:scale-105">
                Become a Partner
              </Link>
              <Link href="/about" className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Partners */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 flex justify-between opacity-[0.07]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-300 via-white to-gray-300 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">Technology Partners</h2>
            <p className="text-slate-400 text-lg">World-class infrastructure powering Mumtaz AI</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {technologyPartners.map((partner, idx) => (
              <PartnerCard key={idx} partner={partner} />
            ))}
          </div>
        </div>
      </section>

      {/* Integration Partners */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 flex justify-between opacity-[0.05]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-400 via-gray-100 to-gray-400 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">Integration Partners</h2>
            <p className="text-slate-400 text-lg">Tools and platforms that enhance your workflow</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {integrationPartners.map((partner, idx) => (
              <PartnerCard key={idx} partner={partner} />
            ))}
          </div>
        </div>
      </section>

      {/* Reseller Partners */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 flex justify-between opacity-[0.07]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-300 via-white to-gray-300 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">Reseller Partners</h2>
            <p className="text-slate-400 text-lg">Global consulting firms helping enterprises implement solutions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {resellerPartners.map((partner, idx) => (
              <PartnerCard key={idx} partner={partner} />
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 flex justify-between opacity-[0.05]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-400 via-gray-100 to-gray-400 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">Partnership Benefits</h2>
            <p className="text-slate-400 text-lg">Why organizations choose to partner with us</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500">
                <div className={`h-1.5 bg-gradient-to-r ${benefit.color} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
                <div className="relative p-8">
                  <div className={`w-14 h-14 mb-4 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center text-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-4 ring-white/70`}>
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{benefit.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Impact Stats */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 flex justify-between opacity-[0.07]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-full w-16 bg-gradient-to-b from-gray-300 via-white to-gray-300 rounded-full" />
          ))}
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">Partnership Impact</h2>
            <p className="text-slate-400 text-lg">Numbers that demonstrate our reach</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="relative glass-card overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-2 transition-all duration-500">
                <div className={`h-1.5 bg-gradient-to-r ${stat.color} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent pointer-events-none" />
                <div className="relative p-8 text-center">
                  <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>{stat.number}</div>
                  <p className="text-slate-500 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Glass Pillar Glassmorphism */}
      <section className="relative py-14 overflow-hidden rounded-[2rem] mx-4 mb-8 themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-24 -right-8 w-[160px] h-[500px] rotate-[-30deg] rounded-[80px] bg-gradient-to-b from-white/50 via-amber-300/20 to-transparent backdrop-blur-sm border border-white/35" />
        <div className="absolute -top-16 left-[8%] w-[140px] h-[450px] rotate-[22deg] rounded-[80px] bg-gradient-to-b from-transparent via-orange-300/15 to-white/40 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-32 left-[45%] w-[180px] h-[500px] rotate-[18deg] rounded-[90px] bg-gradient-to-t from-white/45 via-purple-300/15 to-transparent backdrop-blur-sm border border-white/25" />
        <div className="absolute -bottom-20 -left-6 w-[150px] h-[400px] rotate-[32deg] rounded-[80px] bg-gradient-to-t from-transparent via-rose-300/15 to-white/50 backdrop-blur-sm border border-white/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom max-w-3xl text-center relative z-10">
          <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <h2 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-slate-800 via-amber-800 to-orange-700 bg-clip-text text-transparent">Interested in Partnering?</h2>
            <p className="text-base text-slate-600 mb-7 max-w-xl mx-auto">
              We&apos;re always looking for innovative companies and consulting firms to partner with Mumtaz AI.
            </p>
            <Link
              href="/support/contact-us"
              className="inline-flex items-center px-7 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all duration-300 hover:scale-105"
            >
              Contact Partnership Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
