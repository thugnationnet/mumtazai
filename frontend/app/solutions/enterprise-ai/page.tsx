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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="container-custom section-padding-lg">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 via-accent-500 to-brand-700 bg-clip-text text-transparent mb-6">
            Enterprise AI Solutions
          </h1>
          <p className="text-xl text-neural-600 leading-relaxed mb-8">
            Deploy AI at enterprise scale with our comprehensive platform designed for 
            large organizations requiring advanced security, compliance, and scalability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/support/book-consultation" className="btn-primary">
              Schedule Demo
            </Link>
            <Link href="/overview" className="btn-secondary">
              View Enterprise Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container-custom pb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-neural-800 mb-12">
          Enterprise-Grade Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-neural-800 mb-3">{feature.title}</h3>
              <p className="text-neural-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-neural-800 mb-6">
                Proven Enterprise Results
              </h2>
              <p className="text-lg text-neural-600 mb-8">
                Our enterprise clients see measurable improvements in efficiency, 
                customer satisfaction, and operational costs within the first quarter.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-neural-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-brand-50 to-accent-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-neural-800 mb-6">Ready to Get Started?</h3>
              <div className="space-y-4">
                <Link href="/support/book-consultation" className="block w-full btn-primary text-center">
                  Book Enterprise Consultation
                </Link>
                <Link href="/resources/case-studies" className="block w-full btn-secondary text-center">
                  View Case Studies
                </Link>
                <Link href="/support/contact-us" className="block w-full text-center text-brand-600 hover:text-brand-700 font-medium">
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