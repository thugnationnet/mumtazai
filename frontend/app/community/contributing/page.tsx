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
      description: 'Write guides, tutorials, or case studies based on your experience with One Last AI.',
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="contrib-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#contrib-pattern)" />
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contributing to One Last AI</h1>
          <p className="text-xl text-white/90 mb-4">Help us build a thriving community of AI enthusiasts and innovators</p>
          <p className="text-lg text-white/75">Every contribution matters. Help shape the future of One Last AI.</p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">15K+</div>
              <p className="text-neural-600">Active Contributors</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">2.5K+</div>
              <p className="text-neural-600">Discussions</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-2">5.2K+</div>
              <p className="text-neural-600">Posts This Month</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-2">89%</div>
              <p className="text-neural-600">Community Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contribution Types */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-5xl">
          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-neural-900 mb-2">Ways to Contribute</h2>
            <p className="text-neural-600">Choose how you'd like to contribute to One Last AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contributionTypes.map((contribution) => (
              <div
                key={contribution.id}
                className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-blue-300 hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-neural-900 mb-2">{contribution.title}</h3>
                    <p className="text-neural-600 text-sm">{contribution.description}</p>
                  </div>
                  <button
                    onClick={() => toggleLike(contribution.id)}
                    className="text-neural-400 hover:text-pink-500 transition-colors"
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={likedContributions.has(contribution.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {contribution.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-neural-600 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neural-100">
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
            <h2 className="text-3xl font-bold text-neural-900">Community Contribution Guidelines</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-green-200 shadow-lg">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </span>
                Do's
              </h3>
              <ul className="space-y-3 text-neural-700">
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

            <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-lg">
              <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-600" />
                </span>
                Don'ts
              </h3>
              <ul className="space-y-3 text-neural-700">
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
      <section className="py-16 md:py-20 bg-white/50">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-neural-900">Contributor Recognition</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-neural-200 text-center hover:shadow-xl hover:border-amber-300 transition-all">
              <div className="text-5xl mb-3">🌟</div>
              <h3 className="text-xl font-bold text-neural-900 mb-2">Featured Contributor</h3>
              <p className="text-neural-600 text-sm mb-4">
                Top contributors are featured on our community page and recognized monthly.
              </p>
              <div className="text-xs text-neural-500 bg-amber-50 rounded-full px-3 py-1 inline-block">Awarded after 10+ impactful contributions</div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-neural-200 text-center hover:shadow-xl hover:border-purple-300 transition-all">
              <div className="text-5xl mb-3">🎖️</div>
              <h3 className="text-xl font-bold text-neural-900 mb-2">Community Badge</h3>
              <p className="text-neural-600 text-sm mb-4">
                Earn special badges in your profile for contributions to specific areas.
              </p>
              <div className="text-xs text-neural-500 bg-purple-50 rounded-full px-3 py-1 inline-block">Badges include Helper, Innovator, Mentor</div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-neural-200 text-center hover:shadow-xl hover:border-blue-300 transition-all">
              <div className="text-5xl mb-3">🏆</div>
              <h3 className="text-xl font-bold text-neural-900 mb-2">Top Contributors</h3>
              <p className="text-neural-600 text-sm mb-4">
                Top community members get perks like early access and special features.
              </p>
              <div className="text-xs text-neural-500 bg-blue-50 rounded-full px-3 py-1 inline-block">Exclusive to top 1% of contributors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Categories */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-neural-900">Where to Contribute</h2>
          </div>

          <div className="space-y-4">
            <Link
              href="/community?category=ideas"
              className="block bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-blue-300 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">💡</div>
                  <div>
                    <h3 className="text-xl font-bold text-neural-900 mb-1">Ideas & Suggestions</h3>
                    <p className="text-neural-600">Share feature ideas and vote on platform improvements</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/community?category=help"
              className="block bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-green-300 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl">❓</div>
                  <div>
                    <h3 className="text-xl font-bold text-neural-900 mb-1">Help & Support</h3>
                    <p className="text-neural-600">Answer questions and help community members solve problems</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/community?category=agents"
              className="block bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-purple-300 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">🤖</div>
                  <div>
                    <h3 className="text-xl font-bold text-neural-900 mb-1">Agents & Features</h3>
                    <p className="text-neural-600">Share success stories and discuss agent implementations</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/community"
              className="block bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-pink-300 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl">🌍</div>
                  <div>
                    <h3 className="text-xl font-bold text-neural-900 mb-1">General Discussion</h3>
                    <p className="text-neural-600">Chat about AI, technology trends, and industry insights</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-pink-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="start-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#start-pattern)" />
          </svg>
        </div>
        <div className="container-custom max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-white/90 mb-8 text-lg max-w-xl mx-auto">
            Join our community and start making an impact today. Your contributions help everyone in the One Last AI ecosystem.
          </p>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            <Users className="w-5 h-5" />
            Visit Community Page
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-neural-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-2">Q: Do I need special skills to contribute?</h3>
              <p className="text-neural-600">
                No! Everyone can contribute. Whether you're a beginner or expert, there are ways to help. Share your experiences,
                ask questions, or help others learn.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-2">Q: How often should I post?</h3>
              <p className="text-neural-600">
                Contribute at your own pace. Quality matters more than quantity. Post meaningful contributions whenever you have
                something valuable to share.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-2">Q: Can I get rewarded for contributions?</h3>
              <p className="text-neural-600">
                Yes! Active contributors earn badges, get featured on our page, and may qualify for perks like early access to new
                features or premium benefits.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-2">Q: What if I disagree with someone?</h3>
              <p className="text-neural-600">
                Respectful disagreement is encouraged! We value diverse perspectives. Engage constructively, focus on ideas rather
                than people, and maintain professionalism.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-2">Q: How do I report inappropriate content?</h3>
              <p className="text-neural-600">
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
