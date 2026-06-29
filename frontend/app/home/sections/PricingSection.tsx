import Link from 'next/link';
import Image from 'next/image';
import SectionShell from './SectionShell';

type PricingPlan = {
  name: string;
  price: string;
  desc: string;
  highlight?: boolean;
  originalPrice?: string;
};

export default function PricingSection() {
  const plans: PricingPlan[] = [
    { name: 'Daily', price: '$5/day', desc: 'Perfect for trying out' },
    { name: 'Weekly', price: '$7/week', desc: 'Save 80% vs daily', highlight: true },
    { name: 'Monthly', price: '$30/month', desc: 'Save 80% vs daily' },
    { name: 'Yearly', price: '$300/year', desc: 'Save 84% vs daily' },
  ];

  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Image */}
        <div className="relative h-[400px] md:h-[500px]">
          <Image
            src="/images/products/newsletter.jpeg"
            alt="Agent Pricing Plans"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-2xl shadow-2xl border border-white/50 object-cover"
          />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <span className="text-4xl">💎</span>
          </div>
          <div className="absolute -top-4 -right-4 bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 hidden lg:block">
            <div className="text-2xl font-bold text-purple-500">Save</div>
            <div className="text-xs text-slate-600">Up to 37%</div>
          </div>
        </div>

        {/* Right - Content */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Simple Pricing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            Transparent
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> Pricing</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Choose the plan that works for you. Simple per-agent pricing with no hidden fees.
          </p>
          <div className="space-y-4 mb-8">
            {plans.map((plan, idx) => (
              <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${plan.highlight ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/30 backdrop-blur-xl border-white/50 hover:border-purple-400/60'}`}>
                <div>
                  <h4 className="font-bold text-slate-800">{plan.name}</h4>
                  <p className="text-sm text-slate-500">{plan.desc}</p>
                </div>
                <div className="text-right">
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-500 line-through">{plan.originalPrice}</div>
                  )}
                  <div className="text-xl font-bold text-purple-500">{plan.price}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/overview" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group">
              View All Plans
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="https://mumtaz.ai/agents" className="inline-flex items-center gap-2 px-8 py-4 border border-white/60 bg-white/50 hover:bg-white/70 text-slate-700 font-semibold rounded-xl transition-all">
              Browse Agents
            </Link>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
