import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

export default function RoadmapSection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Content */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Product Roadmap
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            What&apos;s Coming
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> Next</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            See what we&apos;re building next. Our transparent roadmap keeps you informed about upcoming features.
          </p>
          <div className="space-y-4 mb-8">
            {[
              { quarter: 'Q1 2026', features: ['Multi-language Support', 'Real-time Translation', 'Enterprise SSO'], status: 'In Progress' },
              { quarter: 'Q2 2026', features: ['AI Agent Marketplace', 'White-label Solution', 'Advanced API'], status: 'Planned' },
            ].map((roadmap, idx) => (
              <div key={idx} className="p-4 bg-white/30 backdrop-blur-xl rounded-xl border border-white/50 hover:border-purple-400/60 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-800">{roadmap.quarter}</h3>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${roadmap.status === 'In Progress' ? 'bg-purple-500/20 text-purple-600' : 'bg-indigo-500/20 text-indigo-600'}`}>
                    {roadmap.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roadmap.features.map((f, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-white/40 rounded text-slate-700">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Link href="/community/roadmap" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
            View Full Roadmap
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Right - Image */}
        <div className="relative">
          <div className="relative rounded-2xl shadow-2xl border border-white/50 overflow-hidden h-[400px] md:h-[450px]">
            <Image
              src="/images/products/why-choose-us.jpeg"
              alt="Feature Roadmap & Usage Trends"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <span className="text-4xl">🚀</span>
          </div>
          <div className="absolute -top-4 -left-4 bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 hidden lg:block">
            <div className="text-2xl font-bold text-purple-500">2026</div>
            <div className="text-xs text-slate-600">Big Plans</div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
