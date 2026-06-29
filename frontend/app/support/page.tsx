import Link from "next/link"
export default function Page() {
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
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Support Center</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Get help, contact support, book consultations, and find answers to all your questions.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-14 overflow-hidden rounded-[2rem] mx-4 mb-8 mt-12 themed-section-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-violet-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-1/3 w-56 h-56 bg-fuchsia-300/20 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-40 h-40 bg-indigo-300/20 rounded-full blur-3xl" />
        </div>
        <div className="container-custom text-center relative z-10">
          <Link href="/support/help-center" className="inline-block px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">Get Support</Link>
        </div>
      </section>
    </div>
  )
}
