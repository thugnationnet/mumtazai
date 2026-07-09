'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, CheckCircle, XCircle, Clock, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AgentSubscription {
  _id: string;
  agentId: string;
  agentName: string;
  plan: 'daily' | 'weekly' | 'monthly' | 'yearly';
  price: number;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
}

export default function BillingPage() {
  const { state } = useAuth();
  const [subscriptions, setSubscriptions] = useState<AgentSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<AgentSubscription | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!state.user?.id) return;

    try {
      setError('');
      setLoading(true);
      const response = await fetch(
        `/api/agent/subscriptions/user/${state.user.id}`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSubscriptions(result.subscriptions || []);
      } else {
        setError('Failed to load subscriptions');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Error loading subscription data');
    } finally {
      setLoading(false);
    }
  }, [state.user?.id]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCancelClick = (sub: AgentSubscription) => {
    setSelectedSub(sub);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedSub) return;

    setCancellingId(selectedSub._id);
    setShowCancelModal(false);

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId: selectedSub._id,
          userId: state.user?.id,
          agentId: selectedSub.agentId,
          immediate: true,
        }),
      });

      if (response.ok) {
        await fetchSubscriptions();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Error cancelling subscription. Please try again.');
    } finally {
      setCancellingId(null);
      setSelectedSub(null);
    }
  };

  // Calculate stats
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const inactiveSubscriptions = subscriptions.filter(
    (s) => s.status === 'expired' || s.status === 'cancelled'
  );
  const totalSpent = subscriptions.reduce((sum, s) => sum + (s.price || 0), 0);

  const getDaysRemaining = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diff);
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'daily':
        return '$1/day';
      case 'weekly':
        return '$7/week';
      case 'monthly':
        return '$19/month';
      case 'yearly':
        return '$120/year';
      default:
        return plan;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'daily':
        return 'bg-blue-100 text-blue-700';
      case 'weekly':
        return 'bg-purple-100 text-purple-700';
      case 'monthly':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPurchaseUrl = (agentId: string, agentName: string) => {
    if (agentId === 'canvas') return 'https://build.mumtaz.ai/overview/canvas-pricing';
    if (agentId === 'gencraft-pro') return '/overview/pricing';
    return `/subscribe?agent=${encodeURIComponent(agentName || agentId)}&slug=${agentId}`;
  };

  const getChatUrl = (agentId: string) => {
    if (agentId === 'canvas') return 'https://build.mumtaz.ai/';
    if (agentId === 'gencraft-pro') return 'https://studio.mumtaz.ai/';
    return `https://${agentId}.mumtaz.ai`;
  };

  const getDisplayName = (sub: AgentSubscription) => {
    if (sub.agentId === 'gencraft-pro') return 'GenCraft Pro';
    if (sub.agentId === 'canvas' || sub.agentId === 'canvas-build') return 'Canvas Build';
    return sub.agentName || sub.agentId;
  };

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view billing
          </h1>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors"
          >
            Log In
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Access?</h3>
              <p className="text-gray-600">
                Are you sure you want to cancel access to{' '}
                <span className="text-gray-900 font-semibold">
                  {getDisplayName(selectedSub)}
                </span>
                ?
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 text-sm">
                ⚠️ This will <strong>immediately</strong> revoke your access.
                You won&apos;t be able to chat with this agent until you purchase again.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedSub(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                Keep Access
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
              >
                Yes, Cancel Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="billing-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#billing-grid)"/>
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <CreditCard className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Billing & Subscriptions</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Manage your agent subscriptions and billing history
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center bg-white text-brand-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>

      {/* Billing Content */}
      <section className="py-16 px-4 bg-gray-50">

        {/* Stats Cards */}
        <div className="container-custom max-w-4xl">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600">{activeSubscriptions.length}</div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                </div>
                <div className="text-3xl font-bold text-gray-600">{inactiveSubscriptions.length}</div>
                <div className="text-sm text-gray-600">Inactive</div>
              </div>
              <div className="text-center p-4 bg-brand-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-brand-600" />
                </div>
                <div className="text-3xl font-bold text-brand-600">${totalSpent.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Reminder */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-brand-50 to-accent-50 border border-brand-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-2xl">💡</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Simple One-Time Pricing</p>
                <p className="text-sm text-gray-600">
                  <span className="text-blue-600 font-medium">$1/day</span>
                  <span className="mx-2">•</span>
                  <span className="text-purple-600 font-medium">$5/week</span>
                  <span className="mx-2">•</span>
                  <span className="text-green-600 font-medium">$15/month</span>
                  <span className="mx-2">—</span>
                  No auto-renewal. Cancel anytime or let it expire.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        {activeSubscriptions.length > 0 && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Active Subscriptions ({activeSubscriptions.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {activeSubscriptions.map((sub) => {
                  const daysRemaining = getDaysRemaining(sub.expiryDate);
                  const isExpiringSoon = daysRemaining <= 3;
                  const isCancelling = cancellingId === sub._id;

                  return (
                    <div
                      key={sub._id}
                      className={`p-6 ${isExpiringSoon ? 'bg-orange-50' : ''}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg text-gray-900">
                              {getDisplayName(sub)}
                            </h3>
                            <span
                              className={`text-xs font-medium px-3 py-1 rounded-full ${getPlanColor(sub.plan)}`}
                            >
                              {getPlanLabel(sub.plan)}
                            </span>
                            {isExpiringSoon && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                                ⚠️ Expiring Soon
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>Started: {new Date(sub.startDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className={isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
                              {daysRemaining === 0 ? 'Expires today' : `${daysRemaining} days remaining`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCancelClick(sub)}
                            disabled={isCancelling}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors border border-red-200 disabled:opacity-50"
                          >
                            {isCancelling ? 'Cancelling...' : 'Cancel'}
                          </button>
                          <Link
                            href={getChatUrl(sub.agentId)}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors"
                          >
                            Chat Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Inactive Subscriptions */}
        {inactiveSubscriptions.length > 0 && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-500 flex items-center gap-3">
                  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                  Inactive Subscriptions ({inactiveSubscriptions.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {inactiveSubscriptions.map((sub) => (
                  <div key={sub._id} className="p-6 bg-gray-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-600">
                            {getDisplayName(sub)}
                          </h3>
                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                            {getPlanLabel(sub.plan)}
                          </span>
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full ${
                              sub.status === 'cancelled'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {sub.status === 'cancelled' ? 'Cancelled' : 'Expired'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {sub.status === 'cancelled' ? 'Cancelled' : 'Expired'}:{' '}
                          {new Date(sub.expiryDate).toLocaleDateString()}
                        </div>
                      </div>

                      <Link
                        href={getPurchaseUrl(sub.agentId, sub.agentName)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Purchase Again
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Subscriptions */}
        {subscriptions.length === 0 && !error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Agent Subscriptions Yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Purchase access to any of our AI agents to get started with intelligent conversations
              </p>
              <Link
                href="https://mumtaz.ai/agents"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
              >
                Browse Agents
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={fetchSubscriptions}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="https://mumtaz.ai/agents"
                className="flex items-center gap-3 p-4 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors group"
              >
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors">Browse Agents</p>
                  <p className="text-sm text-gray-500">Explore AI agents</p>
                </div>
              </Link>
              <Link
                href="/overview"
                className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
              >
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">View Pricing</p>
                  <p className="text-sm text-gray-500">See all plans</p>
                </div>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
              >
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">Dashboard</p>
                  <p className="text-sm text-gray-500">Back to overview</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
