import Link from 'next/link'

export default function IndustriesOverview() {
  const industries = [
    {
      title: 'Healthcare',
      description: 'AI-powered solutions for patient care, diagnostics, and healthcare management',
      icon: '🏥',
      link: '/industries/healthcare',
      useCases: ['Patient Support', 'Medical Documentation', 'Appointment Scheduling']
    },
    {
      title: 'Finance & Banking',
      description: 'Intelligent financial services, risk assessment, and customer support',
      icon: '🏦',
      link: '/industries/finance-banking',
      useCases: ['Customer Service', 'Risk Analysis', 'Fraud Detection']
    },
    {
      title: 'Retail & E-commerce',
      description: 'Personalized shopping experiences and intelligent customer engagement',
      icon: '🛒',
      link: '/industries/retail-ecommerce',
      useCases: ['Product Recommendations', 'Customer Support', 'Inventory Management']
    },
    {
      title: 'Manufacturing',
      description: 'Smart manufacturing processes and predictive maintenance solutions',
      icon: '🏭',
      link: '/industries/manufacturing',
      useCases: ['Quality Control', 'Predictive Maintenance', 'Supply Chain Optimization']
    },
    {
      title: 'Technology',
      description: 'Advanced AI integration for tech companies and software development',
      icon: '💻',
      link: '/industries/technology',
      useCases: ['Code Review', 'Technical Support', 'Product Development']
    },
    {
      title: 'Education',
      description: 'Personalized learning experiences and educational support systems',
      icon: '🎓',
      link: '/industries/education',
      useCases: ['Personalized Tutoring', 'Administrative Support', 'Learning Analytics']
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass Pillars */}
        <div className="absolute top-0 left-[8%] w-24 h-full bg-gradient-to-b from-white/30 via-purple-200/20 to-transparent rounded-full blur-sm transform -skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[25%] w-16 h-full bg-gradient-to-b from-white/25 via-indigo-200/15 to-transparent rounded-full blur-sm transform skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[20%] w-20 h-full bg-gradient-to-b from-white/30 via-purple-100/20 to-transparent rounded-full blur-sm transform -skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[8%] w-14 h-full bg-gradient-to-b from-white/20 via-indigo-100/15 to-transparent rounded-full blur-sm transform skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[50%] w-12 h-full bg-gradient-to-b from-white/15 via-purple-200/10 to-transparent rounded-full blur-sm pointer-events-none" />
        {/* Chrome Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

        <div className="container-custom relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">
              Industry Solutions
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed mb-8">
              Specialized AI solutions tailored for specific industries, addressing unique challenges 
              and delivering measurable results across diverse business sectors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/support/book-consultation" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300">
                Industry Consultation
              </Link>
              <Link href="/resources/case-studies" className="inline-flex items-center gap-2 px-8 py-3 bg-white/40 backdrop-blur-sm text-slate-700 rounded-xl font-semibold border border-white/60 hover:bg-white/50 transition-all duration-300">
                View Case Studies
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry) => (
            <Link
              key={industry.title}
              href={industry.link}
              className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-200/60 group"
            >
              <div className="text-4xl mb-4">{industry.icon}</div>
              <h3 className="text-xl font-bold text-slate-700 mb-3 group-hover:text-purple-600 transition-colors">
                {industry.title}
              </h3>
              <p className="text-slate-500 mb-4 leading-relaxed">
                {industry.description}
              </p>
              <div className="space-y-2 mb-4">
                {industry.useCases.map((useCase) => (
                  <div key={useCase} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-500">{useCase}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center text-purple-600 font-medium">
                Learn More
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}