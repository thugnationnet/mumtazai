import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

export default function CTASection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Image */}
        <div className="relative h-[350px] md:h-[400px]">
          <Image
            src="/images/showcase/canvas-preview.jpg"
            alt="AI Canvas - Build Amazing Apps"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-2xl shadow-2xl border border-white/50 object-cover"
          />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <span className="text-4xl">✨</span>
          </div>
        </div>

        {/* Right - Content */}
        <div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            Ready to Transform
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> Your Workflow?</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Join thousands of professionals who trust our AI platform for their most important work. Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
              Contact Us
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/demo" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/60 bg-white/50 hover:bg-white/70 text-slate-700 font-semibold rounded-xl transition-all">
              Schedule Demo
            </Link>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
