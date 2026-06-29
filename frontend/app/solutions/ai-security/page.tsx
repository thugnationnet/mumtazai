import Link from 'next/link'

export default function AISecurity() {
  return (
    <div className="min-h-screen">
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -right-10 w-[200px] h-[600px] rotate-[-25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-violet-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 left-[12%] w-[180px] h-[700px] rotate-[22deg] rounded-[100px] bg-gradient-to-b from-transparent via-purple-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 right-[28%] w-[160px] h-[500px] rotate-[-32deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -left-10 w-[220px] h-[550px] rotate-[28deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[12%] right-[48%] w-[120px] h-[400px] rotate-[-12deg] rounded-[80px] bg-gradient-to-b from-white/40 via-violet-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">
                AI Security
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed mb-8">
                Protect your AI systems with advanced security features, compliance controls, 
                and threat detection designed specifically for AI-powered environments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/legal/privacy-policy" className="px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">
                  Security Overview
                </Link>
                <Link href="/support/contact-us" className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm">
                  Security Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">Threat Detection</h3>
            <p className="text-slate-500">AI-powered security monitoring and threat identification</p>
          </div>
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">Access Control</h3>
            <p className="text-slate-500">Role-based access control with enterprise SSO integration</p>
          </div>
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">Audit Trails</h3>
            <p className="text-slate-500">Comprehensive logging and compliance reporting</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/solutions/overview" className="text-purple-700 hover:text-purple-800 font-medium">
            ← Back to All Solutions
          </Link>
        </div>
    </div>
  )
}