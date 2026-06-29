import Link from 'next/link'

export default function Resources() {
  const resourceCategories = [
    {
      title: "Blog",
      description: "89+ articles on AI history, technology trends, and expert insights.",
      icon: "📝",
      href: "/resources/blog",
      items: ["AI History & Evolution", "Technology Deep Dives", "Expert Opinions", "Industry Analysis"]
    },
    {
      title: "Case Studies",
      description: "Explore real-world success stories and implementations from our clients.",
      icon: "📊",
      href: "/resources/case-studies",
      items: ["Customer Success", "ROI Analysis", "Implementation Stories", "Before & After"]
    },
    {
      title: "News",
      description: "Latest news, product updates, and announcements from Mumtaz AI.",
      icon: "📰",
      href: "/resources/news",
      items: ["Product Updates", "Company Announcements", "Industry News", "Feature Releases"]
    },
    {
      title: "Webinars",
      description: "Join live sessions and access recorded presentations from industry experts.",
      icon: "🎥",
      href: "/resources/webinars",
      items: ["Live Sessions", "Recorded Content", "Expert Panels", "Q&A Sessions"]
    },
    {
      title: "Documentation",
      description: "Comprehensive guides and technical documentation for our platform.",
      icon: "📚",
      href: "/resources/documentation",
      items: ["API Reference", "Integration Guides", "Best Practices", "Troubleshooting"]
    },
    {
      title: "Tutorials",
      description: "Step-by-step guides to help you get the most out of our AI agents.",
      icon: "🎓",
      href: "/resources/tutorials",
      items: ["Getting Started", "Advanced Features", "Video Guides", "Interactive Demos"]
    }
  ]

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
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Resources & Learning</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Discover insights, learn best practices, and stay ahead with our comprehensive resource library.
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {resourceCategories.map((category, index) => (
            <Link key={index} href={category.href} className="group bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-4">{category.icon}</div>
              <h3 className="text-xl font-bold text-slate-700 mb-3 group-hover:text-purple-700 transition-colors">
                {category.title}
              </h3>
              <p className="text-slate-500 mb-4 leading-relaxed">
                {category.description}
              </p>
              <ul className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm text-slate-400 flex items-center">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-2xl p-8 text-center themed-section-bg">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Stay Updated</h2>
            <p className="text-lg mb-6 text-slate-600">
              Subscribe to our newsletter for the latest resources, insights, and updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl text-slate-700 bg-white/60 border border-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg shadow-purple-500/25">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
