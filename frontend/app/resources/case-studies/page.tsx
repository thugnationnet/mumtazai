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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-white/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-purple-100/20 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" style={{ transform: 'skewY(-2deg)' }} />
        <div className="container-custom text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Case Studies</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
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
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25' 
                  : 'bg-white/40 text-slate-500 hover:bg-white/60 hover:text-purple-700 border border-white/60'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {caseStudies.map((study, index) => (
            <div key={index} className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="text-4xl">{study.image}</div>
                <span className="text-xs font-medium text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                  {study.category}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-700 mb-3">
                {study.title}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                <span className="font-medium">{study.industry}</span>
                <span>•</span>
                <span>{study.company}</span>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="font-medium text-slate-700 mb-1">Challenge:</h4>
                  <p className="text-sm text-slate-500">{study.challenge}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-700 mb-1">Solution:</h4>
                  <p className="text-sm text-slate-500">{study.solution}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-700 mb-3">Results:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {study.results.map((result, resultIndex) => (
                    <div key={resultIndex} className="text-sm text-slate-500 flex items-center">
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
        <div className="relative overflow-hidden rounded-2xl p-8 text-center themed-section-bg">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Ready to Write Your Success Story?</h2>
            <p className="text-lg mb-6 text-slate-600">
              Join hundreds of organizations already transforming their operations with AI agents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/support/book-consultation" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg shadow-purple-500/25">
                Schedule a Consultation
              </Link>
              <Link href="/overview/pricing" className="px-6 py-3 bg-white/60 hover:bg-white/80 text-slate-800 font-semibold rounded-xl transition-colors border border-white/60">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}