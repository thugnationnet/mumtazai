import Link from 'next/link'

export default function EnterpriseAI() {
  const features = [
    {
      title: 'Scalable Infrastructure',
      description: 'Deploy AI agents across thousands of endpoints with enterprise-grade scalability',
      icon: '🏗️'
    },
    {
      title: 'Custom Integration',
      description: 'Seamlessly integrate with existing enterprise systems and workflows',
      icon: '🔗'
    },
    {
      title: 'Advanced Security',
      description: 'Enterprise-grade security with SSO, RBAC, and compliance controls',
      icon: '🛡️'
    },
    {
      title: 'Dedicated Support',
      description: '24/7 dedicated support with guaranteed SLA and response times',
      icon: '🎧'
    }
  ]

  const benefits = [
    'Reduce operational costs by up to 40%',
    'Improve customer satisfaction by 35%',
    'Accelerate decision-making processes',
    'Scale AI capabilities across departments',
    'Maintain compliance and security standards'
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -right-10 w-[200px] h-[600px] rotate-[-25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-violet-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 left-[12%] w-[180px] h-[700px] rotate-[22deg] rounded-[100px] bg-gradient-to-b from-transparent via-purple-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 right-[28%] w-[160px] h-[500px] rotate-[-32deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -left-10 w-[220px] h-[550px] rotate-[28deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[12%] right-[48%] w-[120px] h-[400px] rotate-[-12deg] rounded-[80px] bg-gradient-to-b from-white/40 via-violet-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">
                Enterprise AI Solutions
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed mb-8">
                Deploy AI at enterprise scale with our comprehensive platform designed for 
                large organizations requiring advanced security, compliance, and scalability.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/support/book-consultation" className="px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">
                  Schedule Demo
                </Link>
                <Link href="/overview" className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm">
                  View Enterprise Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <div className="container-custom pb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-700 mb-12">
          Enterprise-Grade Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-slate-700 mb-3">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-6">
                Proven Enterprise Results
              </h2>
              <p className="text-lg text-slate-500 mb-8">
                Our enterprise clients see measurable improvements in efficiency, 
                customer satisfaction, and operational costs within the first quarter.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
              <h3 className="text-2xl font-bold text-slate-700 mb-6">Ready to Get Started?</h3>
              <div className="space-y-4">
                <Link href="/support/book-consultation" className="block w-full px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105 text-center">
                  Book Enterprise Consultation
                </Link>
                <Link href="/resources/case-studies" className="block w-full px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm text-center">
                  View Case Studies
                </Link>
                <Link href="/support/contact-us" className="block w-full text-center text-purple-700 hover:text-purple-800 font-medium">
                  Contact Enterprise Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}