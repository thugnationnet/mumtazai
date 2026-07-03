import React, { useState, useEffect } from 'react';
import { fetchWithCredentials } from '../fetchUtil';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  priceDisplay: string;
  savings?: string;
  popular?: boolean;
}

interface BillingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

const API_BASE = '/api';
const APP_ID = 'canvas';

export const BillingPanel: React.FC<BillingPanelProps> = ({ isOpen, onClose, userId }) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
      fetchCredits();
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    try {
      const res = await fetchWithCredentials(`${API_BASE}/billing/packages/${APP_ID}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      const res = await fetchWithCredentials(`${API_BASE}/billing/credits?app=${APP_ID}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        const raw = data.credits;
        const value = typeof raw === 'object' && raw !== null ? Number(raw.balance) : Number(raw);
        setCredits(Number.isFinite(value) ? value : 0);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setProcessing(packageId);
    try {
      const res = await fetchWithCredentials(`${API_BASE}/billing/checkout/${APP_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          packageId,
        })
      });

      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process checkout');
    } finally {
      setProcessing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl shadow-purple-500/20">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Credits</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Power your Canvas Studio creations</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Balance */}
        {userId && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-6 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Current Balance</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{credits.toLocaleString()} <span className="text-purple-400 text-lg">credits</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Packages Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-xl p-4 border transition-all duration-300 hover:scale-105 cursor-pointer ${pkg.popular
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 hover:border-purple-500/50'
                  }`}
                onClick={() => handlePurchase(pkg.id)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-slate-900 dark:text-white text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ BEST VALUE
                  </div>
                )}

                <div className="text-center pt-2">
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{pkg.credits}</p>
                  <p className="text-purple-400 text-sm mb-3">credits</p>

                  <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{pkg.priceDisplay}</p>
                  {pkg.savings && (
                    <p className="text-violet-600 dark:text-violet-400 text-sm font-medium">{pkg.savings}</p>
                  )}

                  <button
                    disabled={processing === pkg.id}
                    className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-all ${processing === pkg.id
                        ? 'bg-gray-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        : pkg.popular
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-slate-900 dark:text-white hover:from-purple-400 hover:to-pink-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-gray-600'
                      }`}
                  >
                    {processing === pkg.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </span>
                    ) : (
                      'Purchase'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-300 dark:border-slate-700">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure payment powered by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPanel;
