import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

export default function WhyChooseUsSection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Content */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            Why Thousands
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> Choose Us</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Industry-leading features, exceptional support, and a platform built for your success.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { icon: '🚀', title: 'Lightning Fast', desc: 'Deploy in minutes' },
              { icon: '🔒', title: 'Enterprise Security', desc: 'Bank-level encryption' },
              { icon: '📊', title: 'Real-time Analytics', desc: 'Monitor everything' },
              { icon: '🌍', title: 'Global Scale', desc: '100+ countries' },
              { icon: '🤖', title: 'AI Expertise', desc: 'Built by pioneers' },
              { icon: '💬', title: '24/7 Support', desc: 'Always available' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-white/30 backdrop-blur-xl rounded-xl border border-white/50 hover:border-purple-400/60 transition-colors">
                <div className="text-2xl">{item.icon}</div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/about" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
            Learn More About Us
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Right - Image */}
        <div className="relative">
          <div className="relative rounded-2xl shadow-2xl border border-white/50 overflow-hidden h-[400px] md:h-[500px]">
            <Image
              src="/images/products/pricing-plans.jpeg"
              alt="Platform Analytics & Performance"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <span className="text-4xl">⭐</span>
          </div>
          <div className="absolute -top-4 -left-4 bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 hidden lg:block">
            <div className="text-2xl font-bold text-purple-500">10K+</div>
            <div className="text-xs text-slate-600">Happy Users</div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
