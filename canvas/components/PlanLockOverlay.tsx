import React, { useState } from 'react';

interface PlanLockOverlayProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onCheckout: (plan: 'weekly' | 'monthly' | 'yearly') => Promise<void>;
}

const PLANS = [
  {
    id: 'weekly' as const,
    label: 'Weekly',
    price: '$10',
    period: '/ week',
  },
  {
    id: 'monthly' as const,
    label: 'Monthly',
    price: '$30',
    period: '/ month',
    popular: true,
  },
  {
    id: 'yearly' as const,
    label: 'Yearly',
    price: '$300',
    period: '/ year',
  },
];

const PlanLockOverlay: React.FC<PlanLockOverlayProps> = ({
  isAuthenticated,
  onLogin,
  onCheckout,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: 'weekly' | 'monthly' | 'yearly') => {
    setLoading(plan);
    try {
      await onCheckout(plan);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8 text-center bg-white dark:bg-[#111]/98 backdrop-blur-xl">
      {/* Lock Icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        Unlock All Features
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-[240px]">
        Get full access to AI assistant, deploy, tools, database, and all premium panels.
      </p>

      {!isAuthenticated ? (
        <button
          onClick={onLogin}
          className="w-full max-w-[220px] py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 dark:text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25 text-sm"
        >
          Sign In to Continue
        </button>
      ) : (
        <div className="w-full space-y-2.5">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleCheckout(p.id)}
              disabled={loading !== null}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-between ${
                p.popular
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 dark:text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-400'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-indigo-500/40 hover:bg-cyan-500/10'
              } ${loading === p.id ? 'opacity-60' : ''}`}
            >
              <span className="flex items-center gap-2">
                {p.label}
                {p.popular && (
                  <span className="text-[10px] bg-slate-300 dark:bg-white/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Best
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <span>{p.price}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{p.period}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Features List */}
      <div className="mt-6 text-left w-full">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-semibold">
          What you get
        </p>
        <div className="space-y-2">
          {[
            'AI code assistant & generation',
            'One-click deploy & hosting',
            'Database management',
            'Video generation',
            'Real-time collaboration',
            'Project workspace & tools',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <svg className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanLockOverlay;
