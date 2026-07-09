import Link from 'next/link'

export default function AISecurity() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container-custom section-padding-lg">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 via-accent-500 to-brand-700 bg-clip-text text-transparent mb-6">
            AI Security
          </h1>
          <p className="text-xl text-neural-600 leading-relaxed mb-8">
            Protect your AI systems with advanced security features, compliance controls, 
            and threat detection designed specifically for AI-powered environments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/legal/privacy-policy" className="btn-primary">
              Security Overview
            </Link>
            <Link href="/support/contact-us" className="btn-secondary">
              Security Consultation
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Threat Detection</h3>
            <p className="text-neural-600">AI-powered security monitoring and threat identification</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Access Control</h3>
            <p className="text-neural-600">Role-based access control with enterprise SSO integration</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Audit Trails</h3>
            <p className="text-neural-600">Comprehensive logging and compliance reporting</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/solutions/overview" className="text-brand-600 hover:text-brand-700 font-medium">
            ← Back to All Solutions
          </Link>
        </div>
      </div>
    </div>
  )
}