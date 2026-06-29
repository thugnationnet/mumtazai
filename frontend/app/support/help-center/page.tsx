'use client';

import Link from 'next/link';
import {
  BookOpen,
  Users,
  MessageSquare,
  Lightbulb,
  FileText,
  Video,
  ShoppingCart,
  BarChart3,
  Zap,
  Phone,
  Scroll,
  Map,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

const sections = [
  {
    category: 'Learning & Resources',
    cards: [
      {
        title: 'Documentation',
        description: 'Complete guides and API documentation for developers',
        icon: BookOpen,
        href: '/docs',
        color: 'from-blue-500 to-cyan-500',
        features: ['Getting Started', 'API Reference', 'Integration Guide'],
      },
      {
        title: 'Tutorials',
        description: 'Step-by-step tutorials for all agents and features',
        icon: Video,
        href: '/resources/tutorials',
        color: 'from-purple-500 to-pink-500',
        features: ['Agent Walkthroughs', 'Best Practices', 'Video Guides'],
      },
      {
        title: 'FAQ & Help',
        description: 'Answers to frequently asked questions',
        icon: FileText,
        href: '/support/faqs',
        color: 'from-green-500 to-emerald-500',
        features: ['Common Questions', 'Troubleshooting', 'Tips & Tricks'],
      },
      {
        title: 'Blog & Case Studies',
        description: 'Insights, case studies, and product updates',
        icon: Scroll,
        href: '/resources/blog',
        color: 'from-orange-500 to-red-500',
        features: ['Industry News', 'Success Stories', 'Use Cases'],
      },
    ],
  },
  {
    category: 'Community & Support',
    cards: [
      {
        title: 'Community',
        description: 'Connect with other users and get community support',
        icon: Users,
        href: '/community',
        color: 'from-pink-500 to-rose-500',
        features: ['Community Forum', 'Events', 'Networking'],
      },
      {
        title: 'Product Roadmap',
        description: "See what we're building next and share feedback",
        icon: Map,
        href: '/community/roadmap',
        color: 'from-indigo-500 to-purple-500',
        features: ['Upcoming Features', 'Status Updates', 'Public Roadmap'],
      },
      {
        title: 'Submit Ideas',
        description: 'Share feature requests and improvement ideas',
        icon: Lightbulb,
        href: '/community/suggestions',
        color: 'from-yellow-500 to-orange-500',
        features: ['Feature Requests', 'Improvements', 'Community Voting'],
      },
      {
        title: 'Live Support',
        description: 'Get real-time assistance from our support team',
        icon: MessageSquare,
        href: '/support/live-support',
        color: 'from-cyan-500 to-blue-500',
        features: ['Live Chat', 'Real-time Help', 'Expert Support'],
      },
    ],
  },
  {
    category: 'Services & Information',
    cards: [
      {
        title: 'Pricing Plans',
        description: 'Explore our pricing options and choose the right plan',
        icon: ShoppingCart,
        href: '/overview',
        color: 'from-red-500 to-rose-500',
        features: ['Per-Agent Pricing', 'Feature Comparison', 'Plans Overview'],
      },
      {
        title: 'Book Consultation',
        description: 'Schedule a one-on-one consultation with an expert',
        icon: Phone,
        href: '/support/book-consultation',
        color: 'from-emerald-500 to-teal-500',
        features: ['Expert Consultation', 'Personalized Support', 'Training'],
      },
      {
        title: 'Contact Us',
        description: 'Get in touch with our team for any inquiries',
        icon: Zap,
        href: '/support/contact-us',
        color: 'from-violet-500 to-purple-500',
        features: ['Email Support', 'Contact Form', 'Response Guarantee'],
      },
      {
        title: 'Support Ticket',
        description: 'Submit a ticket for technical issues or problems',
        icon: BarChart3,
        href: '/support/create-ticket',
        color: 'from-teal-500 to-green-500',
        features: ['Issue Tracking', 'Priority Support', 'Ticket History'],
      },
    ],
  },
];

export default function SupportHelpCenter() {
  return (
    <div className="min-h-screen themed-section-bg">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Help Center</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Find everything you need to get the most out of Mumtaz AI. Browse
              our documentation, tutorials, community resources, and support options.
            </p>
          </div>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Quick Access Stats */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <div className="grid grid-cols-4 gap-4">
              <Link
                href="/support/faqs"
                className="text-center p-4 bg-white/40 backdrop-blur-sm border border-white/60 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                <div className="text-2xl mb-1">❓</div>
                <div className="text-sm font-semibold text-purple-600">FAQs</div>
              </Link>
              <Link
                href="/docs"
                className="text-center p-4 bg-white/40 backdrop-blur-sm border border-white/60 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                <div className="text-2xl mb-1">📚</div>
                <div className="text-sm font-semibold text-purple-600">Docs</div>
              </Link>
              <Link
                href="/support/live-support"
                className="text-center p-4 bg-white/40 backdrop-blur-sm border border-white/60 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                <div className="text-2xl mb-1">💬</div>
                <div className="text-sm font-semibold text-purple-600">Live Chat</div>
              </Link>
              <Link
                href="/support/create-ticket"
                className="text-center p-4 bg-white/40 backdrop-blur-sm border border-white/60 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                <div className="text-2xl mb-1">🎫</div>
                <div className="text-sm font-semibold text-purple-600">Ticket</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.category} className="mb-16">
            <h2 className="text-2xl font-bold text-slate-700 mb-8 pb-4 border-b border-white/60">
              {section.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {section.cards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:-translate-y-1 transition-all duration-300 block h-full"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <card.icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-700 mb-2 group-hover:text-purple-600 transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    {card.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {card.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-xs text-slate-400"
                      >
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center text-purple-600 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                    Learn More <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="relative py-14 overflow-hidden rounded-[2rem] themed-section-bg">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-violet-300/30 rounded-full blur-3xl" />
              <div className="absolute top-1/2 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 left-1/3 w-56 h-56 bg-fuchsia-300/20 rounded-full blur-3xl" />
              <div className="absolute top-0 right-1/4 w-40 h-40 bg-indigo-300/20 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-8 md:p-12 text-center">
              <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Still Need Help?</h2>
              <p className="text-lg text-slate-600 mb-8">
                Can't find what you're looking for? Our dedicated support team is
                ready to help you succeed with Mumtaz AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/support/contact-us"
                  className="px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105"
                >
                  Contact Support
                </Link>
                <Link
                  href="/support/live-support"
                  className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm"
                >
                  Start Live Chat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
