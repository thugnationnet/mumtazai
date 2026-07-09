import Link from 'next/link'

export default function Healthcare() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container-custom section-padding-lg">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 via-accent-500 to-brand-700 bg-clip-text text-transparent mb-6">
            Healthcare AI Solutions
          </h1>
          <p className="text-xl text-neural-600 leading-relaxed mb-8">
            Transform patient care with AI-powered solutions designed specifically 
            for healthcare providers, improving outcomes while reducing costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://chat.mumtaz.ai/agents/emma-emotional" className="btn-primary">
              Try Patient Support Agent
            </Link>
            <Link href="/support/book-consultation" className="btn-secondary">
              Healthcare Consultation
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">🏥</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Patient Support</h3>
            <p className="text-neural-600">24/7 AI-powered patient assistance and triage</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Medical Documentation</h3>
            <p className="text-neural-600">Automated documentation and record management</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Appointment Scheduling</h3>
            <p className="text-neural-600">Intelligent scheduling and resource optimization</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/industries/overview" className="text-brand-600 hover:text-brand-700 font-medium">
            ← Back to All Industries
          </Link>
        </div>
      </div>
    </div>
  )
}