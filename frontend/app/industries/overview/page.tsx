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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container-custom section-padding-lg">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 via-accent-500 to-brand-700 bg-clip-text text-transparent mb-6">
            Industry Solutions
          </h1>
          <p className="text-xl text-neural-600 leading-relaxed mb-8">
            Specialized AI solutions tailored for specific industries, addressing unique challenges 
            and delivering measurable results across diverse business sectors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/support/book-consultation" className="btn-primary">
              Industry Consultation
            </Link>
            <Link href="/resources/case-studies" className="btn-secondary">
              View Case Studies
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry) => (
            <Link
              key={industry.title}
              href={industry.link}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-neural-100 hover:border-brand-200 group"
            >
              <div className="text-4xl mb-4">{industry.icon}</div>
              <h3 className="text-xl font-bold text-neural-800 mb-3 group-hover:text-brand-600 transition-colors">
                {industry.title}
              </h3>
              <p className="text-neural-600 mb-4 leading-relaxed">
                {industry.description}
              </p>
              <div className="space-y-2 mb-4">
                {industry.useCases.map((useCase) => (
                  <div key={useCase} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-neural-600">{useCase}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center text-brand-600 font-medium">
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