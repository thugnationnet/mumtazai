import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

export default function NewsSection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Content */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Latest Updates
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            News &
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> Updates</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Stay informed about new features, platform improvements, and exciting announcements from Mumtaz AI.
          </p>
          <div className="space-y-4 mb-8">
            {[
              { date: 'Jan 19, 2026', title: 'New Voice-to-Voice Agent Available', category: 'Feature' },
              { date: 'Jan 15, 2026', title: 'Mumtaz AI Reaches 10K Active Users', category: 'Milestone' },
              { date: 'Jan 10, 2026', title: 'Enterprise Security Enhancements', category: 'Security' },
            ].map((news, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-white/30 backdrop-blur-xl rounded-xl border border-white/50 hover:border-purple-400/60 transition-colors">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-purple-500 text-lg">📰</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{news.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-purple-500">{news.category}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-500">{news.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/resources/news" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
            View All News
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Right - Image */}
        <div className="relative">
          <div className="relative rounded-2xl shadow-2xl border border-white/50 overflow-hidden h-[400px] md:h-[500px]">
            <Image
              src="/images/products/roadmap.jpeg"
              alt="Latest News & Activity Updates"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <span className="text-4xl">📢</span>
          </div>
          <div className="absolute -top-4 -left-4 bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 hidden lg:block">
            <div className="text-2xl font-bold text-purple-500">Fresh</div>
            <div className="text-xs text-slate-600">Daily Updates</div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
