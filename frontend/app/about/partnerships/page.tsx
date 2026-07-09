'use client'

import Link from 'next/link'
import { Cloud, Zap, Globe, Link2, Award, Users } from 'lucide-react'

export default function PartnershipsPage() {
  const technologyPartners = [
    {
      name: "Google Cloud",
      icon: "☁️",
      description: "Infrastructure and AI/ML services",
      details: "Leveraging Google Cloud's powerful infrastructure and AI tools for scalable agent deployment and advanced machine learning capabilities."
    },
    {
      name: "Amazon Web Services",
      icon: "⚙️",
      description: "Cloud computing and storage solutions",
      details: "Using AWS's comprehensive suite of services for reliable hosting, data processing, and enterprise-grade security for One Last AI."
    },
    {
      name: "Microsoft Azure",
      icon: "🔷",
      description: "Enterprise cloud and AI services",
      details: "Integrating Azure's enterprise solutions for advanced AI capabilities, compliance, and hybrid cloud support."
    }
  ]

  const integrationPartners = [
    {
      name: "Slack",
      icon: "💬",
      description: "Team communication platform",
      details: "Deploy agents directly in Slack to enhance team productivity, automate workflows, and get instant assistance without leaving your workspace."
    },
    {
      name: "Microsoft Teams",
      icon: "👥",
      description: "Enterprise communication hub",
      details: "Integrate One Last AI agents with Teams for seamless collaboration, automated notifications, and enterprise communication workflows."
    },
    {
      name: "Zapier",
      icon: "⚡",
      description: "Automation and workflow platform",
      details: "Connect One Last AI with thousands of apps through Zapier for sophisticated automation workflows and data synchronization."
    },
    {
      name: "HubSpot",
      icon: "📊",
      description: "CRM and marketing automation",
      details: "Enhance your CRM with intelligent agents for customer support, lead qualification, and marketing automation workflows."
    }
  ]

  const resellerPartners = [
    {
      name: "Accenture",
      icon: "🏢",
      description: "Global technology consulting",
      details: "Helping organizations worldwide implement and optimize AI agent solutions for enterprise transformation."
    },
    {
      name: "Deloitte",
      icon: "📈",
      description: "Professional services and consulting",
      details: "Providing strategic guidance and implementation support for enterprises adopting AI and agent technologies."
    },
    {
      name: "IBM Consulting",
      icon: "🔧",
      description: "Enterprise technology solutions",
      details: "Delivering comprehensive consulting and integration services for enterprise-scale One Last AI deployments."
    }
  ]

  const PartnerCard = ({ partner }: { partner: typeof technologyPartners[0] }) => (
    <div className="bg-white border border-neural-100 rounded-lg p-6 hover:border-brand-500 hover:shadow-lg transition-all group">
      <div className="text-4xl mb-3">{partner.icon}</div>
      <h3 className="text-lg font-bold text-neural-800 mb-2">{partner.name}</h3>
      <p className="text-brand-600 text-sm font-semibold mb-3">{partner.description}</p>
      <p className="text-neural-600 text-sm">{partner.details}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="section-padding-lg bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Our Partnerships</h1>
          <p className="text-xl opacity-90 mb-2">Strategic alliances driving innovation in AI</p>
          <p className="text-lg opacity-75">Together with industry leaders, we're building the future of intelligent automation</p>
        </div>
      </section>

      {/* Partnership Overview */}
      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-neural-100 rounded-lg p-6 text-center shadow-sm">
              <Cloud className="w-10 h-10 text-brand-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-neural-800 mb-2">Technology Partnerships</h3>
              <p className="text-neural-600 text-sm">Infrastructure and cloud services powering One Last AI</p>
            </div>
            <div className="bg-white border border-neural-100 rounded-lg p-6 text-center shadow-sm">
              <Zap className="w-10 h-10 text-accent-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-neural-800 mb-2">Integration Partnerships</h3>
              <p className="text-neural-600 text-sm">Tools and platforms that enhance One Last AI capabilities</p>
            </div>
            <div className="bg-white border border-neural-100 rounded-lg p-6 text-center shadow-sm">
              <Users className="w-10 h-10 text-pink-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-neural-800 mb-2">Reseller Partnerships</h3>
              <p className="text-neural-600 text-sm">Consulting firms helping enterprises implement solutions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Partners */}
      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="w-6 h-6 text-brand-600" />
              <h2 className="text-3xl font-bold text-neural-800">Technology Partners</h2>
            </div>
            <p className="text-neural-600">Strategic partnerships with leading tech companies providing world-class infrastructure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {technologyPartners.map((partner, idx) => (
              <PartnerCard key={idx} partner={partner} />
            ))}
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-6 mb-12">
            <h4 className="text-neural-800 font-bold mb-2">Why These Partners?</h4>
            <p className="text-neural-600">
              We partner with Google Cloud, AWS, and Microsoft Azure to ensure One Last AI runs on best-in-class infrastructure. 
              These partnerships guarantee reliability, security, and scalability for enterprises of all sizes.
            </p>
          </div>
        </div>
      </section>

      {/* Integration Partners */}
      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-6 h-6 text-accent-600" />
              <h2 className="text-3xl font-bold text-neural-800">Integration Partners</h2>
            </div>
            <p className="text-neural-600">Companies we integrate with to enhance your workflow and maximize productivity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {integrationPartners.map((partner, idx) => (
              <PartnerCard key={idx} partner={partner} />
            ))}
          </div>

          <div className="bg-accent-50 border border-accent-200 rounded-lg p-6 mb-12">
            <h4 className="text-neural-800 font-bold mb-2">Seamless Integrations</h4>
            <p className="text-neural-600">
              Our integration partnerships enable One Last AI to work seamlessly with tools your team already uses. 
              From communication platforms to automation tools, we're constantly expanding our ecosystem to enhance your productivity.
            </p>
          </div>
        </div>
      </section>

      {/* Reseller Partners */}
      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-6 h-6 text-pink-500" />
              <h2 className="text-3xl font-bold text-neural-800">Reseller Partners</h2>
            </div>
            <p className="text-neural-600">Global consulting firms helping organizations implement One Last AI solutions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {resellerPartners.map((partner, idx) => (
              <PartnerCard key={idx} partner={partner} />
            ))}
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-6 mb-12">
            <h4 className="text-neural-800 font-bold mb-2">Enterprise Implementation</h4>
            <p className="text-neural-600">
              Our reseller partners bring deep enterprise expertise and global reach. They help organizations of all sizes 
              successfully implement, customize, and optimize One Last AI for their specific business needs.
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-neural-800 mb-8 text-center">Partnership Benefits</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 border border-neural-100 rounded-lg p-6">
              <h3 className="text-lg font-bold text-neural-800 mb-3">🛡️ Enterprise Reliability</h3>
              <p className="text-neural-600">
                Backed by industry-leading infrastructure providers ensuring 99.99% uptime and enterprise-grade security.
              </p>
            </div>

            <div className="bg-gray-50 border border-neural-100 rounded-lg p-6">
              <h3 className="text-lg font-bold text-neural-800 mb-3">🔌 Seamless Integrations</h3>
              <p className="text-neural-600">
                Connect with tools your teams already use, reducing friction and accelerating adoption across your organization.
              </p>
            </div>

            <div className="bg-gray-50 border border-neural-100 rounded-lg p-6">
              <h3 className="text-lg font-bold text-neural-800 mb-3">📈 Advanced Capabilities</h3>
              <p className="text-neural-600">
                Access cutting-edge AI and ML capabilities through our technology partnerships with innovation leaders.
              </p>
            </div>

            <div className="bg-gray-50 border border-neural-100 rounded-lg p-6">
              <h3 className="text-lg font-bold text-neural-800 mb-3">🚀 Expert Implementation</h3>
              <p className="text-neural-600">
                Get support from world-class consulting firms with deep experience implementing enterprise AI solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Become a Partner */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-neural-800 mb-4">Interested in Partnering?</h2>
          <p className="text-neural-600 mb-4 text-lg">
            We're always looking for innovative companies and consulting firms to partner with One Last AI.
          </p>
          <p className="text-neural-600 mb-8">
            Whether you're interested in technology partnerships, integrations, or reselling, we'd love to explore opportunities together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support/contact-us"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-all"
            >
              Contact Partnership Team
            </Link>
            <Link
              href="/support/contact-us"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-neural-50 text-neural-800 font-bold rounded-lg transition-all border border-neural-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Partner Statistics */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-neural-800 mb-8 text-center">Partnership Impact</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-600 mb-2">50+</div>
              <p className="text-neural-600">Active Partnerships</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent-600 mb-2">150+</div>
              <p className="text-neural-600">Countries Reached</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-500 mb-2">10K+</div>
              <p className="text-neural-600">Enterprises Supported</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">99.99%</div>
              <p className="text-neural-600">Uptime SLA</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
