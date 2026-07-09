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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="container-custom section-padding-lg">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 via-accent-500 to-brand-700 bg-clip-text text-transparent mb-6">
            AI Solutions
          </h1>
          <p className="text-xl text-neural-600 leading-relaxed mb-8">
            Powerful AI solutions designed to transform your business operations, 
            enhance productivity, and drive innovation across your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/overview/pricing" className="btn-primary">
              View Pricing
            </Link>
            <Link href="/support/book-consultation" className="btn-secondary">
              Book Consultation
            </Link>
          </div>
        </div>
      </div>

      {/* Solutions Grid */}
      <div className="container-custom pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => (
            <Link
              key={solution.title}
              href={solution.link}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-neural-100 hover:border-brand-200 group"
            >
              <div className="flex items-start gap-6">
                <div className="text-4xl bg-gradient-to-r from-brand-100 to-accent-100 p-4 rounded-xl">
                  {solution.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-neural-800 mb-3 group-hover:text-brand-600 transition-colors">
                    {solution.title}
                  </h3>
                  <p className="text-neural-600 mb-4 leading-relaxed">
                    {solution.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {solution.features.map((feature) => (
                      <span 
                        key={feature}
                        className="px-3 py-1 text-sm bg-brand-50 text-brand-700 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center text-brand-600 font-medium">
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
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 text-white py-16">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-brand-100 mb-8 max-w-2xl mx-auto">
            Join thousands of companies already using our AI solutions to drive growth and innovation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://mumtaz.ai/agents" className="bg-white text-brand-600 px-8 py-4 rounded-lg font-medium hover:bg-brand-50 transition-colors">
              Explore AI Agents
            </Link>
            <Link href="/support/contact-us" className="border-2 border-white text-white px-8 py-4 rounded-lg font-medium hover:bg-white hover:text-brand-600 transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}