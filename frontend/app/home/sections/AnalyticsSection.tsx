import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

export default function AnalyticsSection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Image */}
        <div className="relative order-2 lg:order-1">
          <div className="relative rounded-2xl shadow-2xl border border-white/50 overflow-hidden h-[400px] md:h-[450px]">
            <Image
              src="/images/products/analytics-dashboard.jpeg"
              alt="Real-time Analytics"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <span className="text-4xl">📊</span>
          </div>
          <div className="absolute -top-4 -right-4 bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 hidden lg:block">
            <div className="text-2xl font-bold text-purple-500">Live</div>
            <div className="text-xs text-slate-600">Real-time Data</div>
          </div>
        </div>

        {/* Right - Content */}
        <div className="order-1 lg:order-2">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Real-time Analytics
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            Monitor Your AI
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> In Real-time</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Comprehensive dashboards, usage analytics, and performance insights. Track conversations, measure engagement, and optimize your AI interactions.
          </p>
          <ul className="space-y-4 mb-8">
            {['Live conversation tracking', 'Usage & engagement metrics', 'Performance insights', 'Custom reporting dashboards', 'Export data anytime'].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-slate-700">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
            View Dashboard
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
