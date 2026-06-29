import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

export default function IntegrationsSection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Image */}
        <div className="relative h-[400px] md:h-[450px]">
          <Image
            src="/images/products/environment-config.jpeg"
            alt="API Integrations & Partner Monitoring"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-2xl shadow-2xl border border-white/50 object-cover"
          />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <span className="text-4xl">🔗</span>
          </div>
          <div className="absolute -top-4 -right-4 bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 hidden lg:block">
            <div className="text-2xl font-bold text-purple-500">20+</div>
            <div className="text-xs text-slate-600">Integrations</div>
          </div>
        </div>

        {/* Right - Content */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Integrations
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            Connect Your
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> Favorite Tools</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Seamlessly integrate with the tools and platforms you already use. Our API and webhooks make it easy to connect.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { name: 'Slack', icon: '💬' },
              { name: 'Teams', icon: '🤖' },
              { name: 'Zapier', icon: '⚡' },
              { name: 'Discord', icon: '👾' },
              { name: 'Twilio', icon: '📞' },
              { name: 'AI Engine', icon: '🧠' },
            ].map((partner, idx) => (
              <div key={idx} className="text-center p-4 rounded-xl bg-white/30 backdrop-blur-xl border border-white/50 hover:border-purple-400/60 transition-colors">
                <div className="text-2xl mb-1">{partner.icon}</div>
                <p className="font-medium text-sm text-slate-700">{partner.name}</p>
              </div>
            ))}
          </div>
          <Link href="/about/partnerships" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
            Explore Integrations
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
