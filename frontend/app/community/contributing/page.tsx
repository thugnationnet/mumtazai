'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Heart, MessageCircle, Users, TrendingUp, Award, Zap, BookOpen, Share2, CheckCircle, ArrowRight, Star } from 'lucide-react'

export default function ContributingPage() {
  const [likedContributions, setLikedContributions] = useState<Set<string>>(new Set())

  const toggleLike = (id: string) => {
    const newLiked = new Set(likedContributions)
    if (newLiked.has(id)) {
      newLiked.delete(id)
    } else {
      newLiked.add(id)
    }
    setLikedContributions(newLiked)
  }

  const contributionTypes = [
    {
      id: 'ideas',
      title: '💡 Share Ideas & Feedback',
      description: 'Have suggestions for new features or improvements? Share your ideas in the Ideas & Suggestions category.',
      details: [
        'Propose new agent features',
        'Suggest platform improvements',
        'Vote on community ideas',
        'Discuss feasibility and impact'
      ],
      category: 'ideas',
      impact: 'High'
    },
    {
      id: 'help',
      title: '🤝 Help Other Community Members',
      description: 'Answer questions and help fellow users in the Help & Support category.',
      details: [
        'Share solutions to common problems',
        'Provide tips and workarounds',
        'Share your best practices',
        'Mentor newer members'
      ],
      category: 'help',
      impact: 'High'
    },
    {
      id: 'success',
      title: '🎯 Share Success Stories',
      description: 'Post about your successful agent implementations and use cases in the Agents & Features category.',
      details: [
        'Share project outcomes',
        'Discuss integration experiences',
        'Showcase innovative applications',
        'Inspire other community members'
      ],
      category: 'agents',
      impact: 'Medium'
    },
    {
      id: 'engage',
      title: '💬 Engage in Discussions',
      description: 'Participate in General discussions about AI, agents, and technology trends.',
      details: [
        'Share industry insights',
        'Discuss emerging technologies',
        'Network with other members',
        'Contribute to knowledge sharing'
      ],
      category: 'general',
      impact: 'Medium'
    },
    {
      id: 'create',
      title: '✍️ Create Content',
      description: 'Write guides, tutorials, or case studies based on your experience with Mumtaz AI.',
      details: [
        'Write how-to guides',
        'Document best practices',
        'Create case studies',
        'Share learning experiences'
      ],
      category: 'general',
      impact: 'Very High'
    },
    {
      id: 'report',
      title: '🐛 Report Issues & Bugs',
      description: 'Help improve the platform by reporting bugs and technical issues you encounter.',
      details: [
        'Document bugs clearly',
        'Provide reproduction steps',
        'Suggest improvements',
        'Help with troubleshooting'
      ],
      category: 'help',
      impact: 'High'
    }
  ]

  return (
    <div className="min-h-full themed-section-bg">
      {/* Header Section - Glass Pillar Glassmorphism */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        {/* Chrome shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              Get Involved
            </div>
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-4">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">Contributing to Mumtaz AI</h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-2 leading-relaxed">Help us build a thriving community of AI enthusiasts and innovators</p>
            <p className="text-sm text-slate-500">Every contribution matters. Help shape the future of Mumtaz AI.</p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">15K+</div>
              <p className="text-slate-500">Active Contributors</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">2.5K+</div>
              <p className="text-slate-500">Discussions</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-2">5.2K+</div>
              <p className="text-slate-500">Posts This Month</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-2">89%</div>
              <p className="text-slate-500">Community Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contribution Types */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-5xl">
          <div className="mb-10">
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-3">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-2">Ways to Contribute</h2>
            <p className="text-slate-500">Choose how you'd like to contribute to Mumtaz AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contributionTypes.map((contribution) => (
              <div
                key={contribution.id}
                className="glass-card p-6 hover:border-purple-300 hover:shadow-[0_12px_50px_rgba(139,92,246,0.15)] transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{contribution.title}</h3>
                    <p className="text-slate-500 text-sm">{contribution.description}</p>
                  </div>
                  <button
                    onClick={() => toggleLike(contribution.id)}
                    className="text-slate-400 hover:text-pink-500 transition-colors"
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={likedContributions.has(contribution.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {contribution.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-500 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/80">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-xs text-blue-700 font-medium">
                    <Zap className="w-3 h-3" />
                    Impact: {contribution.impact}
                  </span>
                  <Link
                    href="/community"
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                  >
                    Go to Community <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Community Contribution Guidelines</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 border border-green-200">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </span>
                Do's
              </h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Be respectful and constructive in all interactions</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Search existing discussions before posting</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Provide clear, detailed information</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Give credit and link to original sources</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Use appropriate category for your post</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Engage positively with different viewpoints</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-8 border border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-600" />
                </span>
                Don'ts
              </h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Post spam or promotional content</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Share personal information or credentials</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Engage in harassment or bullying</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Cross-post the same content multiple times</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Use offensive language or hate speech</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Violate intellectual property rights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contributor Recognition */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Contributor Recognition</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-8 text-center hover:shadow-[0_12px_50px_rgba(139,92,246,0.15)] hover:border-amber-300 transition-all">
              <div className="text-5xl mb-3">🌟</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Featured Contributor</h3>
              <p className="text-slate-500 text-sm mb-4">
                Top contributors are featured on our community page and recognized monthly.
              </p>
              <div className="text-xs text-slate-400 bg-amber-50 rounded-full px-3 py-1 inline-block">Awarded after 10+ impactful contributions</div>
            </div>

            <div className="glass-card p-8 text-center hover:shadow-[0_12px_50px_rgba(139,92,246,0.15)] hover:border-purple-300 transition-all">
              <div className="text-5xl mb-3">🎖️</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Community Badge</h3>
              <p className="text-slate-500 text-sm mb-4">
                Earn special badges in your profile for contributions to specific areas.
              </p>
              <div className="text-xs text-slate-400 bg-purple-50 rounded-full px-3 py-1 inline-block">Badges include Helper, Innovator, Mentor</div>
            </div>

            <div className="glass-card p-8 text-center hover:-translate-y-1 transition-all">
              <div className="text-5xl mb-3">🏆</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Top Contributors</h3>
              <p className="text-slate-500 text-sm mb-4">
                Top community members get perks like early access and special features.
              </p>
              <div className="text-xs text-slate-400 bg-blue-50 rounded-full px-3 py-1 inline-block">Exclusive to top 1% of contributors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Categories */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="mb-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Where to Contribute</h2>
          </div>

          <div className="space-y-4">
            <Link
              href="/community?category=ideas"
              className="block glass-card p-6 hover:border-blue-300 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">💡</div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">Ideas & Suggestions</h3>
                    <p className="text-slate-500">Share feature ideas and vote on platform improvements</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/community?category=help"
              className="block glass-card p-6 hover:border-green-300 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl">❓</div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">Help & Support</h3>
                    <p className="text-slate-500">Answer questions and help community members solve problems</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/community?category=agents"
              className="block glass-card p-6 hover:border-purple-300 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">🤖</div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">Agents & Features</h3>
                    <p className="text-slate-500">Share success stories and discuss agent implementations</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/community"
              className="block glass-card p-6 hover:border-pink-300 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl">🌍</div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">General Discussion</h3>
                    <p className="text-slate-500">Chat about AI, technology trends, and industry insights</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-pink-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Getting Started - Glass Pillar CTA */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-t-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        {/* Chrome shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom max-w-4xl text-center relative z-10">
          <div className="max-w-2xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Ready to Get Started?</h2>
            <p className="text-slate-600 mb-8 text-base max-w-xl mx-auto">
              Join our community and start making an impact today. Your contributions help everyone in the Mumtaz AI ecosystem.
            </p>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)]"
            >
              <Users className="w-5 h-5" />
              Visit Community Page
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Q: Do I need special skills to contribute?</h3>
              <p className="text-slate-500">
                No! Everyone can contribute. Whether you're a beginner or expert, there are ways to help. Share your experiences,
                ask questions, or help others learn.
              </p>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Q: How often should I post?</h3>
              <p className="text-slate-500">
                Contribute at your own pace. Quality matters more than quantity. Post meaningful contributions whenever you have
                something valuable to share.
              </p>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Q: Can I get rewarded for contributions?</h3>
              <p className="text-slate-500">
                Yes! Active contributors earn badges, get featured on our page, and may qualify for perks like early access to new
                features or premium benefits.
              </p>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Q: What if I disagree with someone?</h3>
              <p className="text-slate-500">
                Respectful disagreement is encouraged! We value diverse perspectives. Engage constructively, focus on ideas rather
                than people, and maintain professionalism.
              </p>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Q: How do I report inappropriate content?</h3>
              <p className="text-slate-500">
                Use the report feature on any post or contact our moderation team through the Support page. We take community
                safety seriously and respond to reports quickly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
