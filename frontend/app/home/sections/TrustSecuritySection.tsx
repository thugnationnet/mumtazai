import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

export default function TrustSecuritySection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Image */}
        <div className="relative h-[400px] md:h-[450px]">
          <Image
            src="/images/products/enterprise-security.jpeg"
            alt="Trust & Security Analytics"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-2xl shadow-2xl border border-white/50 object-cover"
          />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <span className="text-4xl">🛡️</span>
          </div>
          <div className="absolute -top-4 -right-4 bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 hidden lg:block">
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-xs text-slate-600">Secure</div>
          </div>
        </div>

        {/* Right - Content */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Enterprise Trust
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            Security &
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> Compliance</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Meet the highest security and compliance standards. Your data is protected with enterprise-grade security.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { badge: '🔒', title: 'SOC 2 Type II', desc: 'Security verified' },
              { badge: '🌍', title: 'GDPR Compliant', desc: 'EU data protection' },
              { badge: '🛡️', title: 'ISO 27001', desc: 'Info security' },
              { badge: '✅', title: 'HIPAA Ready', desc: 'Healthcare ready' },
            ].map((trust, idx) => (
              <div key={idx} className="text-center p-4 bg-white/30 backdrop-blur-xl border border-white/50 rounded-xl hover:border-purple-400/60 transition-colors">
                <div className="text-2xl mb-1">{trust.badge}</div>
                <h4 className="font-bold text-sm text-slate-800">{trust.title}</h4>
                <p className="text-xs text-slate-500">{trust.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/security" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
            Learn About Security
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
