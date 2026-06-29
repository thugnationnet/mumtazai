import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

export default function SecuritySection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Content */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Enterprise Security
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            Bank-Level
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> Protection</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            SOC 2 compliance, end-to-end encryption, and privacy-first architecture. Your data stays protected and confidential at all times.
          </p>
          <ul className="space-y-4 mb-8">
            {['End-to-end encryption', 'SOC 2 Type II certified', 'GDPR & HIPAA compliant', 'Privacy-first architecture', 'Regular security audits'].map((feature, idx) => (
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
          <Link href="/security" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
            Security Details
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Right - Image */}
        <div className="relative">
          <div className="relative rounded-2xl shadow-2xl border border-white/50 overflow-hidden h-[400px] md:h-[450px]">
            <Image
              src="/images/products/integrations.jpeg"
              alt="Enterprise Security - Security Settings & 2FA"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <span className="text-4xl">🔒</span>
          </div>
          <div className="absolute -top-4 -left-4 bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 hidden lg:block">
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-xs text-slate-600">Secure</div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
