import Link from 'next/link'

export default function SolutionsOverview() {
  const solutions = [
    {
      title: 'Enterprise AI',
      description: 'Comprehensive AI solutions for large-scale enterprise deployments',
      icon: '🏢',
      link: '/solutions/enterprise-ai',
      features: ['Scalable Infrastructure', 'Custom Integration', 'Enterprise Security']
    },
    {
      title: 'Process Automation',
      description: 'Automate complex business processes with intelligent AI workflows',
      icon: '⚡',
      link: '/solutions/process-automation',
      features: ['Workflow Designer', 'Smart Triggers', 'Process Analytics']
    },
    {
      title: 'Smart Analytics',
      description: 'Transform data into actionable insights with AI-powered analytics',
      icon: '📊',
      link: '/solutions/smart-analytics',
      features: ['Real-time Dashboards', 'Predictive Modeling', 'Data Visualization']
    },
    {
      title: 'AI Security',
      description: 'Protect your AI systems with advanced security and compliance features',
      icon: '🔒',
      link: '/solutions/ai-security',
      features: ['Threat Detection', 'Access Control', 'Audit Trails']
    }
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
                AI Solutions
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed mb-8">
                Powerful AI solutions designed to transform your business operations, 
                enhance productivity, and drive innovation across your organization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/overview/pricing" className="px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">
                  View Pricing
                </Link>
                <Link href="/support/book-consultation" className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm">
                  Book Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <div className="container-custom pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => (
            <Link
              key={solution.title}
              href={solution.link}
              className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:border-purple-300 group"
            >
              <div className="flex items-start gap-6">
                <div className="text-4xl bg-white/50 backdrop-blur-sm border border-white/60 p-4 rounded-xl">
                  {solution.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-700 mb-3 group-hover:text-purple-700 transition-colors">
                    {solution.title}
                  </h3>
                  <p className="text-slate-500 mb-4 leading-relaxed">
                    {solution.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {solution.features.map((feature) => (
                      <span 
                        key={feature}
                        className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center text-purple-700 font-medium">
                    Learn More
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <section className="relative py-14 overflow-hidden rounded-[2rem] mx-4 mb-8 themed-section-bg">
        <div className="absolute -top-24 -left-8 w-[160px] h-[500px] rotate-[28deg] rounded-[80px] bg-gradient-to-b from-white/50 via-violet-300/20 to-transparent backdrop-blur-sm border border-white/35" />
        <div className="absolute -top-16 right-[8%] w-[140px] h-[450px] rotate-[-22deg] rounded-[80px] bg-gradient-to-b from-transparent via-purple-300/20 to-white/40 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-32 right-[42%] w-[180px] h-[500px] rotate-[-18deg] rounded-[90px] bg-gradient-to-t from-white/45 via-fuchsia-300/15 to-transparent backdrop-blur-sm border border-white/25" />
        <div className="absolute -bottom-20 -right-6 w-[150px] h-[400px] rotate-[35deg] rounded-[80px] bg-gradient-to-t from-transparent via-indigo-300/20 to-white/50 backdrop-blur-sm border border-white/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom max-w-3xl text-center relative z-10">
          <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-slate-500 mb-8 max-w-2xl mx-auto">
              Join thousands of companies already using our AI solutions to drive growth and innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://mumtaz.ai/agents" className="px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">
                Explore AI Agents
              </Link>
              <Link href="/support/contact-us" className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}