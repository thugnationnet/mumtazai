import Link from 'next/link'

export default function BookConsultation() {
  return (
    <div className="min-h-screen themed-section-bg">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-violet-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-fuchsia-300/20 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-56 h-56 bg-violet-200/25 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-block bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl px-8 py-10 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
              Book a Consultation
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Schedule a personalized consultation with our AI experts to discuss your specific needs and goals.
            </p>
          </div>
        </div>
      </section>

      <div className="container-custom section-padding">
        <div className="max-w-3xl mx-auto bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/40 backdrop-blur-sm border border-white/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="font-bold text-slate-700 mb-2">Schedule</h3>
              <p className="text-sm text-slate-500">Choose a time that works for you</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/40 backdrop-blur-sm border border-white/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="font-bold text-slate-700 mb-2">Discuss</h3>
              <p className="text-sm text-slate-500">Talk about your AI agent needs</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/40 backdrop-blur-sm border border-white/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-bold text-slate-700 mb-2">Launch</h3>
              <p className="text-sm text-slate-500">Get started with your solution</p>
            </div>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">First Name</label>
                <input type="text" className="w-full px-4 py-3 border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Last Name</label>
                <input type="text" className="w-full px-4 py-3 border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Email</label>
              <input type="email" className="w-full px-4 py-3 border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Company</label>
              <input type="text" className="w-full px-4 py-3 border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">What are you interested in?</label>
              <select className="w-full px-4 py-3 border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm">
                <option value="">Select an option</option>
                <option value="enterprise">Enterprise Solutions</option>
                <option value="agents">AI Agent Implementation</option>
                <option value="custom">Custom Development</option>
                <option value="consulting">Strategy Consulting</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Tell us about your project</label>
              <textarea rows={4} className="w-full px-4 py-3 border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm" placeholder="Describe your needs, goals, and timeline..."></textarea>
            </div>
            
            <button type="submit" className="w-full px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">
              Schedule Consultation
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}