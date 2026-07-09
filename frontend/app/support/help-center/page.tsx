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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Find everything you need to get the most out of One Last AI. Browse
            our documentation, tutorials, community resources, and support options.
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Quick Access Stats */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-100">
            <div className="grid grid-cols-4 gap-4">
              <Link
                href="/support/faqs"
                className="text-center p-4 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors cursor-pointer"
              >
                <div className="text-2xl mb-1">❓</div>
                <div className="text-sm font-semibold text-brand-600">FAQs</div>
              </Link>
              <Link
                href="/docs"
                className="text-center p-4 bg-accent-50 rounded-lg hover:bg-accent-100 transition-colors cursor-pointer"
              >
                <div className="text-2xl mb-1">📚</div>
                <div className="text-sm font-semibold text-accent-600">Docs</div>
              </Link>
              <Link
                href="/support/live-support"
                className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
              >
                <div className="text-2xl mb-1">💬</div>
                <div className="text-sm font-semibold text-green-600">Live Chat</div>
              </Link>
              <Link
                href="/support/create-ticket"
                className="text-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
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
            <h2 className="text-2xl font-bold text-neural-800 mb-8 pb-4 border-b border-neural-200">
              {section.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {section.cards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group bg-white rounded-2xl p-6 shadow-sm border border-neural-100 hover:shadow-lg hover:border-brand-200 transition-all duration-300 block h-full"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <card.icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-neural-800 mb-2 group-hover:text-brand-600 transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-sm text-neural-600 leading-relaxed mb-4">
                    {card.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {card.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-xs text-neural-500"
                      >
                        <span className="w-1.5 h-1.5 bg-brand-400 rounded-full"></span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center text-brand-600 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                    Learn More <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-to-r from-brand-600 to-accent-500 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-lg opacity-90 mb-8">
              Can't find what you're looking for? Our dedicated support team is
              ready to help you succeed with One Last AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/support/contact-us"
                className="btn-primary bg-white text-brand-600 hover:bg-neural-50"
              >
                Contact Support
              </Link>
              <Link
                href="/support/live-support"
                className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-brand-600"
              >
                Start Live Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
