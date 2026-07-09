'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function TechnologyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neural-50 to-white">
      {/* Header */}
      <section className="py-12 px-4">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-neural-900 mb-4">
              Technology Solutions
            </h1>
            <p className="text-xl text-neural-600 max-w-2xl">
              Accelerate innovation with AI-powered development, testing, and infrastructure 
              automation for modern tech teams.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-neural-900 mb-12">Industry Solutions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Code Generation & Review',
                description: 'AI-assisted code development and automated code reviews'
              },
              {
                title: 'Bug Detection & Fixing',
                description: 'Intelligent bug detection and automatic remediation'
              },
              {
                title: 'DevOps Automation',
                description: 'AI-powered infrastructure management and deployment optimization'
              },
              {
                title: 'Security & Compliance',
                description: 'Automated security vulnerability scanning and compliance checking'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 border border-neural-200 rounded-lg hover:border-brand-500 transition-colors"
              >
                <h3 className="text-xl font-bold text-neural-900 mb-3">{feature.title}</h3>
                <p className="text-neural-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-neural-900 mb-6">Ready to Transform?</h2>
          <Link href="/support/book-consultation" className="btn-primary inline-block">
            Schedule Consultation
          </Link>
        </div>
      </section>
    </div>
  )
}
