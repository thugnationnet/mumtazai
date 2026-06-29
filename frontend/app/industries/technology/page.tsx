'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function TechnologyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass Pillars */}
        <div className="absolute top-0 left-[8%] w-24 h-full bg-gradient-to-b from-white/30 via-purple-200/20 to-transparent rounded-full blur-sm transform -skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[25%] w-16 h-full bg-gradient-to-b from-white/25 via-indigo-200/15 to-transparent rounded-full blur-sm transform skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[20%] w-20 h-full bg-gradient-to-b from-white/30 via-purple-100/20 to-transparent rounded-full blur-sm transform -skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[8%] w-14 h-full bg-gradient-to-b from-white/20 via-indigo-100/15 to-transparent rounded-full blur-sm transform skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[50%] w-12 h-full bg-gradient-to-b from-white/15 via-purple-200/10 to-transparent rounded-full blur-sm pointer-events-none" />
        {/* Chrome Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
              Technology Solutions
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl">
              Accelerate innovation with AI-powered development, testing, and infrastructure 
              automation for modern tech teams.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-slate-800 mb-12">Industry Solutions</h2>
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
                className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg hover:border-purple-200/60 transition-colors"
              >
                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center themed-section-bg">
            {/* Glass Pillars */}
            <div className="absolute top-0 left-[15%] w-16 h-full bg-gradient-to-b from-white/25 via-purple-200/15 to-transparent rounded-full blur-sm transform -skew-x-3 pointer-events-none" />
            <div className="absolute top-0 right-[15%] w-14 h-full bg-gradient-to-b from-white/20 via-indigo-100/15 to-transparent rounded-full blur-sm transform skew-x-3 pointer-events-none" />
            {/* Chrome Shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">Ready to Transform?</h2>
              <Link href="/support/book-consultation" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300">
                Schedule Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
