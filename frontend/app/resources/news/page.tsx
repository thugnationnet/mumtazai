'use client'

import Link from 'next/link'
import { Newspaper, Zap, TrendingUp, Award, Calendar, ArrowRight, MessageSquare, Info } from 'lucide-react'
import { useState } from 'react'
import { allAgents } from '@/app/agents/agent-registry'

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [showAgentDetails, setShowAgentDetails] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [showArticleModal, setShowArticleModal] = useState(false)

  // Build Available Agents from the central registry (18 total)
  const agentSlugs: string[] = [
    'ben-sega',
    'bishop-burger',
    'chef-biew',
    'chess-player',
    'comedy-king',
    'drama-queen',
    'einstein',
    'emma-emotional',
    'fitness-guru',
    'julie-girlfriend',
    'knight-logic',
    'lazy-pawn',
    'mrs-boss',
    'nid-gaming',
    'professor-astrology',
    'rook-jokey',
    'tech-wizard',
    'travel-buddy'
  ]

  const availableAgents = agentSlugs
    .map(id => allAgents.find(a => a.id === id))
    .filter(Boolean)
    .map((a: any, i: number) => ({
      key: `${a.id}-${i}`,
      id: a.id,
      name: a.name,
      emoji: a?.details?.icon || '🤖',
      description: a.description,
      path: `https://${a.id}.mumtaz.ai`,
      specialties: a?.personality?.specialties || [],
      details: a?.details?.sections || []
    }))

  // Coming Soon Agents (40-50)
  const comingSoonAgents = [
    { id: 1, name: 'Quantum Einstein', emoji: '⚛️', description: 'Quantum Physics Specialist' },
    { id: 2, name: 'Marketing Maven', emoji: '📢', description: 'Marketing Strategy Expert' },
    { id: 3, name: 'Financial Advisor Pro', emoji: '💼', description: 'Investment & Finance Expert' },
    { id: 4, name: 'Legal Eagle', emoji: '⚖️', description: 'Legal Advice Specialist' },
    { id: 5, name: 'Health Guru', emoji: '🏥', description: 'Medical Information Expert' },
    { id: 6, name: 'Design Master', emoji: '🎨', description: 'UI/UX Design Expert' },
    { id: 7, name: 'Yoga Master', emoji: '🧘', description: 'Meditation & Yoga Guide' },
    { id: 8, name: 'Music Producer', emoji: '🎵', description: 'Music & Sound Expert' },
    { id: 9, name: 'Photography Pro', emoji: '📸', description: 'Photography Tips' },
    { id: 10, name: 'Writing Wizard', emoji: '✍️', description: 'Content Writing Expert' },
    { id: 11, name: 'History Scholar', emoji: '📚', description: 'Historical Knowledge' },
    { id: 12, name: 'Language Master', emoji: '🌍', description: 'Language Learning' },
    { id: 13, name: 'Poetry Poet', emoji: '🖋️', description: 'Poetry & Literature' },
    { id: 14, name: 'Movie Critic', emoji: '🎬', description: 'Film & Entertainment' },
    { id: 15, name: 'Sports Analyst', emoji: '⚽', description: 'Sports News & Analysis' },
    { id: 16, name: 'Weather Wizard', emoji: '🌦️', description: 'Weather & Climate Expert' },
    { id: 17, name: 'Car Enthusiast', emoji: '🚗', description: 'Automotive Expert' },
    { id: 18, name: 'Fashion Guru', emoji: '👗', description: 'Fashion & Style Advisor' },
    { id: 19, name: 'Architecture Expert', emoji: '🏛️', description: 'Building & Design Expert' },
    { id: 20, name: 'Astronomy Ace', emoji: '🌌', description: 'Space Science Expert' },
    { id: 21, name: 'Gardening Guide', emoji: '🌿', description: 'Plant Care Expert' },
    { id: 22, name: 'Pet Companion', emoji: '🐕', description: 'Pet Care Advisor' },
    { id: 23, name: 'Coffee Connoisseur', emoji: '☕', description: 'Coffee Expert' },
    { id: 24, name: 'Wine Sommelier', emoji: '🍷', description: 'Wine & Beverages' },
    { id: 25, name: 'Sustainability Expert', emoji: '♻️', description: 'Environmental Expert' },
    { id: 26, name: 'Robotics Engineer', emoji: '🤖', description: 'Robotics & Automation' },
    { id: 27, name: 'Data Scientist', emoji: '📊', description: 'Data Analytics Expert' },
    { id: 28, name: 'Cloud Architect', emoji: '☁️', description: 'Cloud Computing Expert' },
    { id: 29, name: 'Cybersecurity Guard', emoji: '🔐', description: 'Security Expert' },
    { id: 30, name: 'DevOps Master', emoji: '⚙️', description: 'DevOps Specialist' },
    { id: 31, name: 'Mobile Developer', emoji: '📱', description: 'App Development Expert' },
    { id: 32, name: 'Web Designer', emoji: '💻', description: 'Web Development' },
    { id: 33, name: 'Database Pro', emoji: '🗄️', description: 'Database Management' },
    { id: 34, name: 'AI Researcher', emoji: '🤖', description: 'AI & Machine Learning' },
    { id: 35, name: 'Crypto Expert', emoji: '₿', description: 'Cryptocurrency Advisor' },
    { id: 36, name: 'Startup Coach', emoji: '🚀', description: 'Entrepreneurship Guide' },
    { id: 37, name: 'Career Counselor', emoji: '💼', description: 'Career Development' },
    { id: 38, name: 'Lifestyle Coach', emoji: '🌟', description: 'Personal Development' },
    { id: 39, name: 'Parenting Expert', emoji: '👨‍👩‍👧‍👦', description: 'Parenting Advice' },
    { id: 40, name: 'Education Tutor', emoji: '📖', description: 'Learning & Tutoring' },
    { id: 41, name: 'Philosophy Thinker', emoji: '🤔', description: 'Philosophy Expert' },
    { id: 42, name: 'Psychology Analyst', emoji: '🧠', description: 'Psychology & Mind' },
    { id: 43, name: 'Nutrition Specialist', emoji: '🥗', description: 'Diet & Nutrition' },
    { id: 44, name: 'Meditation Guide', emoji: '🙏', description: 'Mindfulness Expert' },
    { id: 45, name: 'Adventure Seeker', emoji: '⛰️', description: 'Adventure & Exploration' },
  ]

  const categories = [
    { id: 'all', label: '📰 All News', icon: Newspaper },
    { id: 'product', label: '🚀 Product Updates', icon: Zap },
    { id: 'industry', label: '📊 Industry News', icon: TrendingUp },
    { id: 'awards', label: '🏆 Awards & Recognition', icon: Award }
  ]

  const newsArticles = [
    {
      id: 1,
      title: 'Mumtaz AI Launches New $1/Day Testing Plan',
      description: 'We\'re excited to announce our affordable new testing plan, allowing users to evaluate all features for just $1 per day before committing to larger subscriptions.',
      category: 'product',
      date: 'October 22, 2025',
      image: '🚀',
      readTime: '3 min read',
      featured: true,
      content: `We\'re making it easier than ever to try our agents. With the new $1/day testing plan,\n\n- Get full access to core features\n- Test any agent at your own pace\n- Upgrade or cancel any time\n\nThis plan is perfect for experimenting with agent workflows, evaluating voice and chat experiences, and validating your use cases before moving to higher tiers.`
    },
    {
      id: 2,
      title: 'AI Adoption Reaches All-Time High in Enterprise',
      description: 'A new industry report shows that 78% of enterprises have adopted some form of AI technology, with chatbots and intelligent agents leading the charge.',
      category: 'industry',
      date: 'October 20, 2025',
      image: '📈',
      readTime: '5 min read',
      featured: true,
      content: `The latest industry data shows enterprise AI adoption at unprecedented levels.\n\nTop drivers include:\n- Intelligent customer support agents\n- Automated content workflows\n- Real-time analytics and insights\n\nOrganizations report faster response times, improved customer satisfaction, and reduced operational costs.`
    },
    {
      id: 3,
      title: 'Mumtaz AI Recognized as Top AI Platform',
      description: 'We\'re thrilled to announce that Mumtaz AI has been recognized by TechCrunch as one of the top 10 emerging AI platforms for 2025.',
      category: 'awards',
      date: 'October 18, 2025',
      image: '🏆',
      readTime: '2 min read',
      featured: true,
      content: `We\'re honored to be recognized for product innovation, real-time community features, and voice-enabled experiences.\n\nThe judges highlighted:\n- Agent catalog breadth\n- Production-ready App Router APIs\n- Robust infrastructure behind Cloudflare with SSE support`
    },
    {
      id: 4,
      title: 'New Voice Integration Features Now Available',
      description: 'We\'ve rolled out enhanced voice capabilities for all agents, enabling more natural and human-like conversations with users.',
      category: 'product',
      date: 'October 15, 2025',
      image: '🎙️',
      readTime: '4 min read',
      featured: false,
      content: `Voice just got better: improved TTS quality, expressive styles, and lower latency.\n\nWhat\'s new:\n- Emotional TTS presets\n- Faster streaming responses\n- Fine-grained voice controls`
    },
    {
      id: 5,
      title: 'The Future of Customer Service with AI',
      description: 'Industry experts discuss how AI-powered agents are transforming customer service and improving customer satisfaction scores.',
      category: 'industry',
      date: 'October 12, 2025',
      image: '💬',
      readTime: '6 min read',
      featured: false,
      content: `AI agents are redefining service with 24/7 availability, instant routing, and personalized responses.\n\nKey takeaways:\n- Augment, don\'t replace, human teams\n- Use analytics to continuously improve\n- Ensure privacy and security from day one`
    },
    {
      id: 6,
      title: 'Mumtaz AI Community Crosses 50,000 Members',
      description: 'Our community has grown to over 50,000 active members sharing insights, best practices, and innovative use cases.',
      category: 'product',
      date: 'October 10, 2025',
      image: '👥',
      readTime: '3 min read',
      featured: false,
      content: `Thank you to our growing global community!\n\nWhat\'s happening:\n- Real-time presence and metrics\n- Weekly AMAs with the dev team\n- Community-driven feature requests`
    },
    {
      id: 7,
      title: 'Natural Language Processing Breakthrough',
      description: 'Researchers announce major advancements in NLP technology, enabling more accurate understanding of human intent and context.',
      category: 'industry',
      date: 'October 8, 2025',
      image: '🧠',
      readTime: '7 min read',
      featured: false,
      content: `Emerging architectures improve context retention, reasoning, and controllability. Expect better performance on complex tasks with fewer tokens.`
    },
    {
      id: 8,
      title: 'Mumtaz AI Security Certification Achieved',
      description: 'We\'re proud to announce that Mumtaz AI has achieved SOC 2 Type II certification, ensuring the highest security standards.',
      category: 'awards',
      date: 'October 5, 2025',
      image: '🔒',
      readTime: '3 min read',
      featured: false,
      content: `Security first: SOC 2 Type II compliance validates our processes, monitoring, and controls across the platform.`
    }
  ]

  const filteredArticles = selectedCategory === 'all' 
    ? newsArticles 
    : newsArticles.filter(article => article.category === selectedCategory)

  const featuredArticles = filteredArticles.filter(article => article.featured)
  const regularArticles = filteredArticles.filter(article => !article.featured)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Latest News</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Stay updated with the latest news, product announcements, and industry insights about AI and Mumtaz AI.
          </p>
        </div>
      </section>

      {/* Agent Updates Hero Section */}
      <section className="py-12 bg-white border-b border-neural-200">
        <div className="container-custom text-center max-w-3xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
            <span className="text-4xl">🤖</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neural-900 mb-4">Discover Our AI Agents</h2>
          <p className="text-lg text-neural-600 mb-8">
            Mumtaz AI offers a diverse collection of AI agents designed to help you with virtually anything. From scientific experts to lifestyle coaches, our agents are ready to assist you. Explore our current agents and stay tuned for exciting new additions coming soon!
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <p className="text-3xl font-bold text-blue-600">{agentSlugs.length}</p>
              <p className="text-sm text-neural-600">Available Agents</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <p className="text-3xl font-bold text-purple-600">{comingSoonAgents.length}</p>
              <p className="text-sm text-neural-600">Coming Soon</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
              <p className="text-3xl font-bold text-amber-600">{agentSlugs.length + comingSoonAgents.length}</p>
              <p className="text-sm text-neural-600">Total Agents</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white border-b border-neural-200">
        <div className="container-custom">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-neural-100 text-neural-700 hover:bg-neural-200 border border-neural-200'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="py-12">
          <div className="container-custom">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-neural-900">Featured News</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article) => (
                <div key={article.id} className="group bg-white rounded-2xl border border-neural-200 shadow-lg hover:shadow-xl hover:border-blue-300 overflow-hidden transition-all">
                  {/* Image Area */}
                  <div className="h-40 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
                    {article.image}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-neural-500 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{article.date}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                        {article.readTime}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-neural-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-neural-600 text-sm mb-4 line-clamp-3">
                      {article.description}
                    </p>

                    <button
                      className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform"
                      onClick={() => { setSelectedArticle(article); setShowArticleModal(true); }}
                      aria-label={`Read more about ${article.title}`}
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Articles */}
      <section className="py-12 bg-white border-t border-neural-200">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
              <Newspaper className="w-5 h-5" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-neural-900">
              {selectedCategory === 'all' ? 'All News' : 'Latest News'}
            </h2>
          </div>
          
          {regularArticles.length > 0 ? (
            <div className="space-y-4">
              {regularArticles.map((article) => (
                <div key={article.id} className="group bg-gradient-to-r from-neural-50 to-white border border-neural-200 hover:border-blue-300 rounded-2xl p-6 transition-all hover:shadow-lg">
                  <div className="flex gap-6 items-start">
                    {/* Icon */}
                    <div className="text-4xl flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {article.image}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-neural-500 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{article.date}</span>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                          {article.readTime}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-neural-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-neural-600 text-sm mb-3 line-clamp-2">
                        {article.description}
                      </p>

                      <button
                        className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform"
                        onClick={() => { setSelectedArticle(article); setShowArticleModal(true); }}
                        aria-label={`Read article ${article.title}`}
                      >
                        Read Article
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neural-500 text-lg">No news articles in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Article Modal (floating, scrollable) */}
      {showArticleModal && selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowArticleModal(false)} />

          {/* Modal */}
          <div className="relative bg-white border border-neural-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neural-200 bg-white/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="text-3xl bg-gradient-to-br from-blue-100 to-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center">{selectedArticle.image}</div>
                <div>
                  <h2 className="text-xl font-bold text-neural-900">{selectedArticle.title}</h2>
                  <p className="text-neural-500 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {selectedArticle.date}
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full ml-2">{selectedArticle.readTime}</span>
                  </p>
                </div>
              </div>
              <button aria-label="Close" onClick={() => setShowArticleModal(false)} className="px-3 py-2 rounded-xl bg-neural-100 hover:bg-neural-200 border border-neural-200 text-sm text-neural-700">
                Close
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[calc(85vh-64px)]">
              <p className="whitespace-pre-line text-neural-700 leading-relaxed">{selectedArticle.content || selectedArticle.description}</p>

              {/* Bottom actions including Close button */}
              <div className="pt-4 border-t border-neural-200 flex justify-end">
                <button onClick={() => setShowArticleModal(false)} className="px-4 py-2 bg-neural-100 hover:bg-neural-200 border border-neural-200 rounded-xl text-sm text-neural-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Agents Section */}
      <section className="py-12 border-t border-neural-200">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-neural-900">Available Agents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {availableAgents.map((agent) => (
              <div key={agent.id} className="group bg-white rounded-2xl border border-neural-200 shadow-lg hover:shadow-xl hover:border-blue-300 p-6 transition-all">
                <div className="text-5xl mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">{agent.emoji}</div>
                <h3 className="text-xl font-bold text-neural-900 mb-2 group-hover:text-blue-600 transition">{agent.name}</h3>
                <p className="text-neural-600 text-sm mb-6">{agent.description}</p>
                <div className="flex gap-2">
                  <Link href={agent.path} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-center transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/25">
                    <MessageSquare className="w-4 h-4" />
                    Launch Agent
                  </Link>
                  <button onClick={() => {
                    setSelectedAgent(agent)
                    setShowAgentDetails(true)
                  }} className="bg-neural-100 hover:bg-neural-200 border border-neural-200 px-4 py-2 rounded-xl transition flex items-center justify-center text-neural-700">
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Agents Section */}
      <section className="py-12 bg-white border-t border-neural-200">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-neural-900">Coming Soon Agents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {comingSoonAgents.map((agent) => (
              <div key={agent.id} className="group bg-gradient-to-br from-neural-50 to-white border border-neural-200 hover:border-purple-300 rounded-2xl p-6 transition-all hover:shadow-lg opacity-80 hover:opacity-100">
                <div className="text-5xl mb-4 bg-gradient-to-br from-purple-100 to-pink-100 w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">{agent.emoji}</div>
                <h3 className="text-xl font-bold text-neural-900 mb-2 group-hover:text-purple-600 transition">{agent.name}</h3>
                <p className="text-neural-600 text-sm mb-6">{agent.description}</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-purple-100 text-purple-600 px-4 py-2 rounded-xl font-semibold text-center cursor-not-allowed opacity-75 text-sm border border-purple-200">
                    Available Soon
                  </button>
                  <button onClick={() => {
                    setSelectedAgent(agent)
                    setShowAgentDetails(true)
                  }} className="bg-neural-100 hover:bg-neural-200 border border-neural-200 px-4 py-2 rounded-xl transition flex items-center justify-center text-neural-700">
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Details Modal (floating with internal scroll) */}
      {showAgentDetails && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAgentDetails(false)} />

          {/* Modal */}
          <div className="relative bg-white border border-neural-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neural-200 bg-white/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="text-4xl bg-gradient-to-br from-blue-100 to-indigo-100 w-14 h-14 rounded-xl flex items-center justify-center">{selectedAgent.emoji}</div>
                <div>
                  <h2 className="text-xl font-bold text-neural-900">{selectedAgent.name}</h2>
                  <p className="text-neural-500 text-sm">{selectedAgent.description}</p>
                </div>
              </div>
              <button aria-label="Close" onClick={() => setShowAgentDetails(false)} className="px-3 py-2 rounded-xl bg-neural-100 hover:bg-neural-200 border border-neural-200 text-sm text-neural-700">
                Close
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[calc(85vh-64px)]">
              {/* Specialties */}
              {selectedAgent.specialties?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-neural-900 mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.specialties.map((s: string, idx: number) => (
                      <span key={idx} className="text-xs bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full text-blue-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* How they work / Details */}
              {selectedAgent.details?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-neural-900 mb-3">How this agent works</h3>
                  <div className="space-y-4">
                    {selectedAgent.details.map((section: any, idx: number) => (
                      <div key={idx} className="bg-neural-50 border border-neural-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl" aria-hidden>{section.icon}</span>
                          <h4 className="font-semibold text-neural-900">{section.title}</h4>
                        </div>
                        {section.items?.length ? (
                          <ul className="list-disc list-inside text-neural-600 space-y-1">
                            {section.items.map((item: string, i: number) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-neural-600">{section.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Getting Started */}
              <div>
                <h3 className="text-lg font-semibold text-neural-900 mb-2">
                  {selectedAgent.path ? 'How to Get Started' : 'Coming Soon'}
                </h3>
                {selectedAgent.path ? (
                  <>
                    <ol className="list-decimal list-inside text-neural-600 space-y-1">
                      <li>Open the agent and try a conversation using the Launch button.</li>
                      <li>Create an account or sign in when prompted.</li>
                      <li>Choose a subscription to unlock full features. You can manage or cancel anytime.</li>
                    </ol>
                    <div className="mt-3 flex gap-3">
                      <Link href="/overview/pricing" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25">View Plans</Link>
                      <Link href={selectedAgent.path} className="px-4 py-2 bg-neural-100 hover:bg-neural-200 border border-neural-200 rounded-xl text-sm text-neural-700">Launch Agent</Link>
                    </div>
                    <p className="text-amber-600 text-sm mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">💡 Pro tip: Our lowest subscription is just $1 — test an agent before committing to a larger plan.</p>
                  </>
                ) : (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-purple-700 mb-3">
                      This agent is currently in development and will be available soon! Stay tuned for updates.
                    </p>
                    <div className="flex gap-3">
                      <Link href="/overview/pricing" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/25">View Current Plans</Link>
                      <Link href="https://mumtaz.ai/agents" className="px-4 py-2 bg-neural-100 hover:bg-neural-200 border border-neural-200 rounded-xl text-sm text-neural-700">Browse Available Agents</Link>
                    </div>
                    <p className="text-purple-600 text-sm mt-3">🔔 Sign up for our newsletter to be notified when new agents launch!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter Section */}
      <section className="py-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="container-custom max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <span className="text-2xl">📧</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 text-white">Stay Updated</h2>
          <p className="text-white/90 mb-6">
            Subscribe to our newsletter to get the latest news, product updates, and industry insights delivered directly to your inbox.
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white border border-neural-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-neural-900 placeholder-gray-500"
            />
            <button className="px-6 py-3 bg-white hover:bg-gray-100 text-blue-600 rounded-xl font-semibold transition shadow-lg">
              Subscribe
            </button>
          </div>
          <p className="text-white/70 text-sm mt-3">No spam, just quality news and updates.</p>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-12">
        <div className="container-custom max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-neural-900">Explore More</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/resources/blog" className="group bg-white border border-neural-200 hover:border-blue-300 p-6 rounded-2xl transition shadow-lg hover:shadow-xl">
              <div className="text-3xl mb-3 bg-gradient-to-br from-blue-100 to-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center">📖</div>
              <h3 className="text-lg font-bold text-neural-900 mb-2 group-hover:text-blue-600 transition">Read Blog Articles</h3>
              <p className="text-neural-600 text-sm mb-4">Explore in-depth articles on AI, agents, and technology trends.</p>
              <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                Read Blog
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            <Link href="/community" className="group bg-white border border-neural-200 hover:border-blue-300 p-6 rounded-2xl transition shadow-lg hover:shadow-xl">
              <div className="text-3xl mb-3 bg-gradient-to-br from-purple-100 to-pink-100 w-12 h-12 rounded-xl flex items-center justify-center">👥</div>
              <h3 className="text-lg font-bold text-neural-900 mb-2 group-hover:text-blue-600 transition">Join Community</h3>
              <p className="text-neural-600 text-sm mb-4">Connect with other users and share insights with the community.</p>
              <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                Go to Community
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            <Link href="/resources/documentation" className="group bg-white border border-neural-200 hover:border-blue-300 p-6 rounded-2xl transition shadow-lg hover:shadow-xl">
              <div className="text-3xl mb-3 bg-gradient-to-br from-green-100 to-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center">📚</div>
              <h3 className="text-lg font-bold text-neural-900 mb-2 group-hover:text-blue-600 transition">View Documentation</h3>
              <p className="text-neural-600 text-sm mb-4">Check out our comprehensive documentation and guides.</p>
              <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                Read Docs
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
