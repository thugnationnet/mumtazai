'use client'

import Link from 'next/link'
import { MessageCircle, Users, Zap, Award, TrendingUp, Share2, Heart, Flame, Star } from 'lucide-react'

export default function DiscordPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="discord-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#discord-pattern)" />
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Join Our Discord</h1>
          <p className="text-xl text-white/90 mb-2">Connect with the One Last AI community</p>
          <p className="text-lg text-white/75">10,000+ members sharing knowledge and building together</p>
        </div>
      </section>

      {/* Main CTA */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="bg-white rounded-3xl p-10 md:p-12 text-center mb-12 shadow-2xl border border-neural-200">
            <div className="text-7xl mb-6 animate-bounce">💜</div>
            <h2 className="text-3xl md:text-4xl font-bold text-neural-900 mb-4">Our Active Discord Community</h2>
            <p className="text-lg text-neural-600 mb-8 max-w-2xl mx-auto">
              Join thousands of AI enthusiasts, developers, and innovators sharing tips, asking questions, and connecting with fellow One Last AI users worldwide.
            </p>
            <a
              href="https://discord.gg/EXH6w9CH"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              <MessageCircle className="w-5 h-5" />
              Join Discord Community
              <span className="text-lg">→</span>
            </a>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-neural-200 hover:border-purple-300 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-xl font-bold text-neural-900 mb-2">Share Ideas</h3>
              <p className="text-neural-600">Discuss new features, improvements, and innovative use cases with the community</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-neural-200 hover:border-indigo-300 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">❓</div>
              <h3 className="text-xl font-bold text-neural-900 mb-2">Get Help</h3>
              <p className="text-neural-600">Connect with experts, get quick answers, and learn from experienced community members</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-neural-200 hover:border-pink-300 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-neural-900 mb-2">Events & Updates</h3>
              <p className="text-neural-600">Participate in live events, competitions, and stay updated with latest platform news</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-neural-900">Why Join Our Discord?</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 flex gap-4 hover:border-purple-300 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neural-900 mb-1">Real-Time Support</h3>
                <p className="text-neural-600">Get instant help from community members and One Last AI team members</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 flex gap-4 hover:border-indigo-300 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neural-900 mb-1">Network & Collaborate</h3>
                <p className="text-neural-600">Build connections with fellow developers, entrepreneurs, and AI enthusiasts</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 flex gap-4 hover:border-pink-300 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neural-900 mb-1">Learn & Grow</h3>
                <p className="text-neural-600">Access tutorials, case studies, and best practices shared by experts</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 flex gap-4 hover:border-green-300 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neural-900 mb-1">Exclusive Opportunities</h3>
                <p className="text-neural-600">Get early access to features, special events, and community recognition programs</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 flex gap-4 hover:border-amber-300 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neural-900 mb-1">Active Channels</h3>
                <p className="text-neural-600">Dedicated channels for different topics, agent types, and use cases</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 md:py-20 bg-white/50">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-neural-900">Community Stats</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">10K+</div>
              <p className="text-neural-600">Active Members</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent mb-2">50+</div>
              <p className="text-neural-600">Active Channels</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-2">1K+</div>
              <p className="text-neural-600">Daily Messages</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-2">24/7</div>
              <p className="text-neural-600">Community Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="py-16 md:py-20">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-neural-900">Community Guidelines</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-8 border border-green-200 shadow-lg">
              <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">✓</span> Do's
              </h3>
              <ul className="space-y-3 text-neural-700">
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Be respectful and inclusive to all members</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Share knowledge and help others learn</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Keep conversations relevant and focused</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Use threads for extended discussions</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-lg">
              <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">✗</span> Don'ts
              </h3>
              <ul className="space-y-3 text-neural-700">
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Spam or post promotional content</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Engage in harassment or bullying</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Share personal or sensitive information</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Violate Discord's community guidelines</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Discord Channels Preview */}
      <section className="py-16 md:py-20 bg-white/50">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-neural-900">Popular Channels</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-purple-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-neural-900 mb-2">💬 #general</h3>
              <p className="text-neural-600 text-sm">General discussion about One Last AI and the community</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-indigo-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-neural-900 mb-2">❓ #help</h3>
              <p className="text-neural-600 text-sm">Ask questions and get support from the community</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-blue-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-neural-900 mb-2">🤖 #agents</h3>
              <p className="text-neural-600 text-sm">Discuss agents, features, and agent-specific topics</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-amber-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-neural-900 mb-2">💡 #ideas</h3>
              <p className="text-neural-600 text-sm">Share ideas and vote on feature requests</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-green-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-neural-900 mb-2">📰 #announcements</h3>
              <p className="text-neural-600 text-sm">Official updates and important announcements</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-neural-200 hover:border-pink-300 hover:shadow-xl transition-all">
              <h3 className="text-lg font-bold text-neural-900 mb-2">🎉 #events</h3>
              <p className="text-neural-600 text-sm">Community events, competitions, and activities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cta-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-pattern)" />
          </svg>
        </div>
        <div className="container-custom max-w-3xl text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join the Community?</h2>
          <p className="text-white/90 mb-8 text-lg max-w-xl mx-auto">
            Don't miss out! Join our Discord server now and connect with thousands of AI enthusiasts and developers.
          </p>
          <a
            href="https://discord.gg/EXH6w9CH"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            <MessageCircle className="w-5 h-5" />
            Join Discord Server
            <span className="text-lg">→</span>
          </a>
          <p className="text-white/60 mt-6 text-sm">
            By joining, you agree to follow our community guidelines and Discord's terms of service.
          </p>
        </div>
      </section>
    </div>
  )
}
