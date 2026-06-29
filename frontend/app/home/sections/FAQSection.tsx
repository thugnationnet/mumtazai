import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

export default function FAQSection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Image */}
        <div className="relative">
          <div className="relative rounded-2xl shadow-2xl border border-white/50 overflow-hidden h-[400px] md:h-[500px]">
            <Image
              src="/images/products/news-updates.jpeg"
              alt="AI Agent Support & Monitoring"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <span className="text-4xl">❓</span>
          </div>
          {/* Floating badge */}
          <div className="absolute -top-4 -right-4 bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 hidden lg:block">
            <div className="text-2xl font-bold text-purple-500">24/7</div>
            <div className="text-xs text-slate-600">Support Ready</div>
          </div>
        </div>

        {/* Right - FAQ Content */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            FAQ Center
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            Frequently Asked
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> Questions</span>
          </h2>
          <div className="space-y-6">
            {[
              { q: 'How do I get started?', a: 'Sign up, choose your AI agents, and start chatting within minutes.' },
              { q: 'What AI agents are available?', a: '20+ specialized personalities including Einstein, Tech Wizard, and more.' },
              { q: 'Is my data secure?', a: 'Bank-level encryption, SOC 2 compliance, and privacy-first architecture.' },
              { q: 'What pricing plans exist?', a: 'Simple per-agent pricing: $5/day, $7/week, $30/month, or $300/year per agent — one-time purchase, no auto-renewal.' },
            ].map((item, idx) => (
              <div key={idx} className="border-l-4 border-purple-400 pl-6 hover:border-purple-600 transition-colors">
                <h3 className="text-lg font-bold mb-2 text-slate-800">{item.q}</h3>
                <p className="text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/support/faqs" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
              View All FAQs
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
