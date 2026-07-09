import Link from 'next/link'

export default function CaseStudies() {
  const caseStudies = [
    {
      title: "Healthcare Provider Reduces Response Time by 85%",
      industry: "Healthcare",
      company: "MedFirst Hospital Network",
      challenge: "Overwhelming patient inquiries and appointment scheduling",
      solution: "AI-powered patient support and scheduling assistant",
      results: ["85% faster response time", "60% reduction in call volume", "95% patient satisfaction", "$2M annual savings"],
      image: "🏥",
      category: "Customer Success"
    },
    {
      title: "E-commerce Giant Scales Customer Support 10x",
      industry: "Retail",
      company: "ShopFlow Commerce",
      challenge: "Seasonal customer service demands and 24/7 support needs",
      solution: "Multi-language AI agents for customer service and order management",
      results: ["10x support capacity", "24/7 availability", "40% cost reduction", "92% issue resolution"],
      image: "🛒",
      category: "ROI Analysis"
    },
    {
      title: "Financial Services Improves Compliance by 95%",
      industry: "Finance",
      company: "SecureBank Holdings",
      challenge: "Complex regulatory compliance and risk assessment",
      solution: "AI compliance monitoring and automated risk analysis",
      results: ["95% compliance improvement", "75% faster risk assessment", "50% audit preparation time", "Zero compliance violations"],
      image: "🏦",
      category: "Implementation Stories"
    },
    {
      title: "Manufacturing Company Optimizes Production by 30%",
      industry: "Manufacturing",
      company: "TechFlow Industries",
      challenge: "Production inefficiencies and quality control issues",
      solution: "AI-driven production optimization and quality monitoring",
      results: ["30% production optimization", "25% quality improvement", "20% waste reduction", "$5M cost savings"],
      image: "🏭",
      category: "Before & After"
    }
  ]

  const categories = ["All", "Customer Success", "ROI Analysis", "Implementation Stories", "Before & After"]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Case Studies</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Discover how organizations across industries are transforming their operations with our AI agents.
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">

        {/* Filter Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                index === 0 
                  ? 'bg-brand-600 text-white' 
                  : 'bg-white text-neural-600 hover:bg-brand-50 hover:text-brand-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {caseStudies.map((study, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="text-4xl">{study.image}</div>
                <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                  {study.category}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-neural-800 mb-3">
                {study.title}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-neural-600 mb-4">
                <span className="font-medium">{study.industry}</span>
                <span>•</span>
                <span>{study.company}</span>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="font-medium text-neural-800 mb-1">Challenge:</h4>
                  <p className="text-sm text-neural-600">{study.challenge}</p>
                </div>
                <div>
                  <h4 className="font-medium text-neural-800 mb-1">Solution:</h4>
                  <p className="text-sm text-neural-600">{study.solution}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-neural-800 mb-3">Results:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {study.results.map((result, resultIndex) => (
                    <div key={resultIndex} className="text-sm text-neural-600 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-brand-600 to-accent-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Write Your Success Story?</h2>
          <p className="text-lg mb-6 opacity-90">
            Join hundreds of organizations already transforming their operations with AI agents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/support/book-consultation" className="px-6 py-3 bg-white text-brand-600 font-semibold rounded-lg hover:bg-neural-50 transition-colors">
              Schedule a Consultation
            </Link>
            <Link href="/overview/pricing" className="px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-brand-600 transition-colors">
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}