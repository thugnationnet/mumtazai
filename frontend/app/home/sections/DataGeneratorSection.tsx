import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

export default function DataGeneratorSection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Visual/Image */}
        <div className="relative order-2 lg:order-1">
          <div className="relative">
            <div className="relative rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
              <Image
                src="/images/products/data-generator.jpeg"
                alt="AI Data Generator"
                width={600}
                height={400}
                className="w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
          {/* Floating stats */}
          <div className="absolute -top-4 -left-4 bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 hidden lg:block">
            <div className="text-2xl font-bold text-purple-500">50+</div>
            <div className="text-xs text-slate-600">Data Templates</div>
          </div>
        </div>

        {/* Right - Content */}
        <div className="order-1 lg:order-2">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            AI Data Generator
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            Generate Test Data
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> in Seconds</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Create realistic test data for your applications instantly. Choose from pre-built templates or customize your own schema with AI assistance.
          </p>
          <ul className="space-y-4 mb-8">
            {['50+ pre-built data templates', 'Custom schema builder', 'Export to JSON, CSV, SQL', 'AI-powered realistic data', 'Batch generation support'].map((feature, idx) => (
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
          <div className="flex flex-wrap gap-4">
            <Link href="/tools/data-generator" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
              Generate Data
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/docs/data-generator" className="inline-flex items-center gap-2 px-8 py-4 border border-white/60 bg-white/50 hover:bg-white/70 text-slate-700 font-semibold rounded-xl transition-all">
              View Documentation
            </Link>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
