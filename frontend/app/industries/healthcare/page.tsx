import Link from 'next/link'
import { getAgentChatUrl } from '@/lib/agentUrl'

export default function Healthcare() {
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
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">
              Healthcare AI Solutions
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed mb-8">
              Transform patient care with AI-powered solutions designed specifically 
              for healthcare providers, improving outcomes while reducing costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={getAgentChatUrl('emma-emotional')} className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300">
                Try Patient Support Agent
              </Link>
              <Link href="/support/book-consultation" className="inline-flex items-center gap-2 px-8 py-3 bg-white/40 backdrop-blur-sm text-slate-700 rounded-xl font-semibold border border-white/60 hover:bg-white/50 transition-all duration-300">
                Healthcare Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg text-center">
            <div className="text-4xl mb-4">🏥</div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">Patient Support</h3>
            <p className="text-slate-500">24/7 AI-powered patient assistance and triage</p>
          </div>
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">Medical Documentation</h3>
            <p className="text-slate-500">Automated documentation and record management</p>
          </div>
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">Appointment Scheduling</h3>
            <p className="text-slate-500">Intelligent scheduling and resource optimization</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/industries/overview" className="text-slate-500 hover:text-purple-700 font-medium transition-colors">
            ← Back to All Industries
          </Link>
        </div>
      </div>
    </div>
  )
}