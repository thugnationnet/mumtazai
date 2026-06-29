'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import NeuralLinkCard from '@/components/NeuralLinkCard';
import { getAgentChatUrl } from '@/lib/agentUrl';
import type { AnalyticsData } from '@/models/analytics';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  MessageSquare,
  Zap,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const { state } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<{
    agent: string;
    slug: string;
    plan: string;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Check for subscription success
    if (searchParams.get('success') === 'true') {
      const agent = searchParams.get('agent');
      const slug = searchParams.get('slug');
      const plan = searchParams.get('plan');

      if (agent && slug && plan) {
        setSubscriptionSuccess({ agent, slug, plan });
        setShowSuccessMessage(true);

        // Clear URL parameters after showing success message
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        url.searchParams.delete('agent');
        url.searchParams.delete('slug');
        url.searchParams.delete('plan');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);

  const fetchAnalytics = useCallback(async () => {
    if (!state.user) return;

    setError(null);

    if (!hasLoadedRef.current) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    const controller = new AbortController();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = controller;

    try {
      const [analyticsResponse, billingResponse] = await Promise.all([
        fetch('/api/user/analytics', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        }),
        fetch(`/api/user/billing/${state.user.id}`, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        }),
      ]);

      const analyticsPayload: unknown = await analyticsResponse.json();

      if (!analyticsResponse.ok) {
        const message =
          (analyticsPayload &&
          typeof analyticsPayload === 'object' &&
          'error' in analyticsPayload
            ? (analyticsPayload as { error?: string }).error
            : undefined) ||
          (analyticsPayload &&
          typeof analyticsPayload === 'object' &&
          'message' in analyticsPayload
            ? (analyticsPayload as { message?: string }).message
            : undefined) ||
          'Failed to load analytics';
        throw new Error(message);
      }

      let mergedAnalytics = analyticsPayload as AnalyticsData;

      // Default subscription for users with no active plan
      const defaultSubscription = {
        plan: 'No Active Plan',
        status: 'inactive',
        price: 0,
        period: 'month',
        renewalDate: 'N/A',
        daysUntilRenewal: 0,
      };

      // Ensure subscription exists on merged analytics
      if (!mergedAnalytics.subscription) {
        mergedAnalytics = {
          ...mergedAnalytics,
          subscription: defaultSubscription,
        };
      }

      if (billingResponse.ok) {
        const billingJson = await billingResponse.json();
        const billingPlan = billingJson?.data?.currentPlan;

        if (billingPlan) {
          const existingSub =
            mergedAnalytics.subscription || defaultSubscription;
          mergedAnalytics = {
            ...mergedAnalytics,
            subscription: {
              ...existingSub,
              plan: billingPlan.name || existingSub.plan || 'No Active Plan',
              status: billingPlan.status || 'inactive',
              price:
                typeof billingPlan.price === 'number'
                  ? billingPlan.price
                  : existingSub.price,
              period: billingPlan.period || existingSub.period || 'month',
              renewalDate:
                billingPlan.renewalDate || existingSub.renewalDate || 'N/A',
              daysUntilRenewal:
                typeof billingPlan.daysUntilRenewal === 'number'
                  ? billingPlan.daysUntilRenewal
                  : existingSub.daysUntilRenewal || 0,
            },
          };
        }
      }

      setAnalyticsData(mergedAnalytics);
      setLastUpdated(new Date());
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      console.error('Error fetching analytics:', err);
      setError((err as Error).message || 'Unable to load analytics');
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [state.user]);

  useEffect(() => {
    if (!state.user) return;

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);

    return () => {
      clearInterval(interval);
      abortControllerRef.current?.abort();
    };
  }, [state.user, fetchAnalytics]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading your dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!analyticsData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-lg">
            <h2 className="text-2xl font-semibold text-slate-800 mb-3">
              {error || 'Unable to load analytics right now'}
            </h2>
            <p className="text-slate-500 mb-6">
              Please verify your session is active and try refreshing the data.
            </p>
            <button
              onClick={() => fetchAnalytics()}
              className="btn-primary"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Retry'}
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const successRate =
    analyticsData.agentPerformance?.length > 0
      ? (
          analyticsData.agentPerformance.reduce(
            (sum, agent) => sum + (agent.successRate || 0),
            0
          ) / analyticsData.agentPerformance.length
        ).toFixed(1)
      : 'N/A';

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const quickStats = [
    {
      label: 'Active Agents',
      value: (analyticsData?.usage?.agents?.current ?? 0).toString(),
      change: analyticsData?.weeklyTrend?.conversationsChange ?? '+0%',
      trend: 'up',
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Total Conversations',
      value: (analyticsData?.usage?.conversations?.current ?? 0).toLocaleString(),
      change: analyticsData?.weeklyTrend?.conversationsChange ?? '+0%',
      trend: 'up',
      icon: MessageSquare,
      color: 'green',
    },
    {
      label: 'API Calls',
      value: (analyticsData?.usage?.apiCalls?.current ?? 0).toLocaleString(),
      change: analyticsData?.weeklyTrend?.apiCallsChange ?? '+0%',
      trend: 'up',
      icon: Zap,
      color: 'purple',
    },
    {
      label: 'Success Rate',
      value: successRate === 'N/A' ? 'N/A' : `${successRate}%`,
      change: successRate === 'N/A' ? 'No data yet' : '+1.3% this week',
      trend: 'up',
      icon: CheckCircle,
      color: 'emerald',
    },
  ];

  const dashboardSections = [
    {
      title: 'Advanced Analytics',
      description:
        'Real-time analytics dashboard with 10+ metrics including API requests, latency, model usage, geographic distribution, and cost estimation.',
      icon: '📊',
      href: '/dashboard-advanced',
      stats: [
        'API Metrics',
        'Model Performance',
        'Cost Tracking',
        'Error Analysis',
      ],
      badge: 'NEW',
    },
    {
      title: 'Analytics & Insights',
      description:
        'Monitor performance metrics, user interactions, and get actionable insights.',
      icon: '�',
      href: '/dashboard/analytics',
      stats: [
        'Real-time Metrics',
        'Performance Trends',
        'User Engagement',
        'Success Rates',
      ],
    },
    {
      title: 'Conversation History',
      description:
        'Review all interactions, search conversations, and analyze patterns.',
      icon: '💬',
      href: '/dashboard/conversation-history',
      stats: [
        'Search & Filter',
        'Export Data',
        'Pattern Analysis',
        'Quality Scores',
      ],
    },
    {
      title: 'Billing & Usage',
      description:
        'Track your usage, manage billing, and optimize costs effectively.',
      icon: '💳',
      href: '/dashboard/billing',
      stats: [
        'Usage Tracking',
        'Cost Analysis',
        'Billing History',
        'Plan Management',
      ],
    },
    {
      title: 'Agent Performance',
      description:
        'Deep dive into individual agent metrics and optimization opportunities.',
      icon: '🤖',
      href: '/dashboard/agent-performance',
      stats: [
        'Response Times',
        'Accuracy Metrics',
        'Learning Progress',
        'Optimization Tips',
      ],
    },
    {
      title: 'Agent Management',
      description:
        'Manage access, unlock agents, and adjust plans with quick upgrade and downgrade actions.',
      icon: '🛠️',
      href: '/dashboard/agent-management',
      stats: [
        'Unlock Agents',
        'Upgrade or Downgrade',
        'Cancel Plans',
        'Stripe Checkout Redirect',
      ],
      badge: 'BETA',
    },
  ];

  const hasActiveAgents = analyticsData.usage.agents.current > 0;
  const isAgentActive =
    (analyticsData.agentStatus || '').toLowerCase() === 'active' ||
    hasActiveAgents;

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
          {/* Glass Pillars */}
          <div className="absolute -left-20 top-1/4 w-72 h-[500px] rounded-[100px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
          <div className="absolute -right-16 -top-20 w-80 h-[600px] rounded-[100px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
          <div className="absolute left-1/3 -bottom-32 w-64 h-[400px] rounded-[80px] rotate-45 bg-gradient-to-tr from-purple-200/25 via-white/30 to-transparent backdrop-blur-sm border border-white/30" />
          <div className="absolute right-1/4 top-10 w-48 h-[350px] rounded-[60px] -rotate-6 bg-gradient-to-b from-white/35 via-slate-200/20 to-transparent backdrop-blur-sm border border-white/45" />
          <div className="absolute -left-10 -bottom-10 w-56 h-[300px] rounded-[70px] rotate-[30deg] bg-gradient-to-tl from-indigo-100/30 via-white/25 to-transparent backdrop-blur-sm border border-white/35" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
          <div className="container-custom text-center relative z-10">
            <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-300/40 rounded-full px-4 py-1.5 mb-6">
                <span className="text-purple-700 text-xs font-bold uppercase tracking-wider">Dashboard</span>
              </div>
              <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-6">
                <Activity className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">
                Your Dashboard
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4">
                Monitor your AI agents, track usage, and manage your subscription in real-time.
              </p>
              {lastUpdated && (
                <p className="text-sm text-slate-500">
                  Last updated {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Dashboard Content */}
        <div className="container-custom py-12">
          {error && analyticsData && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">Real-time data may be delayed.</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => fetchAnalytics()}
                className="btn-secondary"
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing…' : 'Retry'}
              </button>
            </div>
          )}
          {/* Subscription Success Message */}
          {showSuccessMessage && subscriptionSuccess && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      🎉 Subscription Successful!
                    </h3>
                    <p className="text-green-700 mb-4">
                      You now have access to{' '}
                      <strong>{subscriptionSuccess.agent}</strong> with your{' '}
                      <strong>{subscriptionSuccess.plan}</strong> plan.
                    </p>
                    <Link
                      href={getAgentChatUrl(subscriptionSuccess.slug)}
                      className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Start Chatting <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="text-green-600 hover:text-green-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Agent Status Summary Card */}
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Quick Overview</h2>
              <p className="text-gray-600">
                Your current agent status and resource summary at a glance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* AI App Hosting Card */}
              <Link
                href="/dashboard/apps"
                className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                      </div>
                      <p className="text-sm text-white/80">AI App Hosting</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase">
                      New
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">
                    Build & Deploy
                  </p>
                  <p className="text-sm text-white/80 mb-4">
                    Create AI-powered apps and launch them instantly with free hosting on mumtaz.ai
                  </p>
                  <div className="flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">
                    Open AI Builder
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

              {/* Canvas App Card */}
              <Link
                href="/dashboard/canvas-app"
                className="bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-500 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <span className="text-xl">🎨</span>
                      </div>
                      <p className="text-sm text-white/80">Canvas App</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase">
                      New
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">
                    Canvas Build
                  </p>
                  <p className="text-sm text-white/80 mb-4">
                    AI-powered code generation with live preview — build, edit, and deploy instantly.
                  </p>
                  <div className="flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">
                    View Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

              {/* Agent Status Summary */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Agent Status</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {isAgentActive ? 'Active' : 'Inactive'}
                    </p>
                    {/* Real-time Agent Status */}
                    <p className="text-xs mt-2">
                      <span
                        className={`inline-block px-2 py-1 rounded-full font-semibold text-xs ${
                          isAgentActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isAgentActive ? 'Active' : 'No Active'}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isAgentActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isAgentActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="mt-2 mb-4 text-sm text-gray-600">
                  {hasActiveAgents ? (
                    <>
                      You currently have{' '}
                      <span className="font-semibold text-gray-900">
                        {analyticsData.usage.agents.current} active agent
                        {analyticsData.usage.agents.current === 1 ? '' : 's'}
                      </span>
                      .
                    </>
                  ) : (
                    'You have no active agent plans. Activate an agent to start tracking usage.'
                  )}
                </div>

                <Link
                  href="/dashboard/agent-management"
                  className="mt-4 w-full btn-secondary text-center block text-sm"
                >
                  Manage Agents
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="glass-card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    {stat.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">
                    {stat.label}
                  </h3>
                  <div className="text-3xl font-bold text-slate-700 mb-2">
                    {stat.value}
                  </div>
                  <div
                    className={`text-sm flex items-center ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Usage Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Usage Meters */}
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-700">
                  Resource Usage
                </h2>
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-6">
                {Object.entries(analyticsData.usage).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span
                        className={`text-sm font-semibold ${getStatusColor(
                          value?.percentage ?? 0
                        )}`}
                      >
                        {(value?.current ?? 0).toLocaleString()} /{' '}
                        {(value?.limit ?? 0).toLocaleString()} {value?.unit || ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                          value?.percentage ?? 0
                        )}`}
                        style={{ width: `${Math.min(value?.percentage ?? 0, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {(value?.percentage ?? 0).toFixed(1)}% used
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Day Activity Chart */}
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-700">
                  7-Day Activity
                </h2>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="space-y-4">
                {/* Chart */}
                <div className="flex items-end justify-between h-48 gap-2">
                  {analyticsData.dailyUsage.length > 0 ? (
                    analyticsData.dailyUsage.map((day, index) => {
                      const maxConversations = Math.max(
                        ...analyticsData.dailyUsage.map(
                          (d) => d.conversations || 0
                        ),
                        1
                      );
                      const height =
                        (day.conversations / maxConversations) * 100 || 0;
                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center group"
                        >
                          <div className="relative w-full">
                            <div
                              className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-400 cursor-pointer"
                              style={{
                                height: `${height}%`,
                                minHeight: '20px',
                              }}
                            >
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10">
                                <p className="font-semibold">
                                  {day.conversations} conversations
                                </p>
                                <p>{day.messages} messages</p>
                                <p>{day.apiCalls} API calls</p>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 mt-2">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full text-center text-sm text-slate-400">
                      No activity recorded for the past week.
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 pt-4 border-t border-white/80">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-slate-500">
                      Conversations
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-semibold">
                      {analyticsData.weeklyTrend.conversationsChange}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Performance & Cost Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Top Performing Agents */}
            <div className="glass-card p-8">
              <h2 className="text-2xl font-bold text-slate-700 mb-6">
                Top Agents
              </h2>
              <div className="space-y-4">
                {analyticsData.topAgents && analyticsData.topAgents.length > 0 ? (
                  analyticsData.topAgents.map((agent, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-600">
                          {agent.name}
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {agent.usage}%
                        </span>
                      </div>
                      <div className="w-full bg-white/40 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${agent.usage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No agent subscriptions yet.</p>
                    <Link href="https://mumtaz.ai/agents" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                      Browse available agents →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-700">
                  Cost Analysis
                </h2>
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm text-slate-600">Current Month</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${analyticsData.costAnalysis.currentMonth}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <span className="text-sm text-slate-600">
                    Projected Total
                  </span>
                  <span className="text-2xl font-bold text-purple-600">
                    ${analyticsData.costAnalysis.projectedMonth}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-600 mb-3">
                  Cost Breakdown
                </p>
                {analyticsData.costAnalysis.breakdown && analyticsData.costAnalysis.breakdown.length > 0 ? (
                  analyticsData.costAnalysis.breakdown.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-slate-500">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">
                          ${item.cost}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No costs this month
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Agent Performance Table */}
          <div className="glass-card p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-700 mb-6">
              Agent Performance Details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/80">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Agent Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Conversations
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Messages
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Avg Response
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Success Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.agentPerformance && analyticsData.agentPerformance.length > 0 ? (
                    analyticsData.agentPerformance.map((agent, index) => (
                      <tr
                        key={index}
                        className="border-b border-white/80 hover:bg-transparent transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="font-medium text-slate-700">
                            {agent.name || 'Unknown Agent'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {(agent.conversations ?? 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {(agent.messages ?? 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className="flex items-center gap-1 text-slate-600">
                            <Clock className="w-4 h-4" />
                            {agent.avgResponseTime ?? 0}s
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`font-semibold ${
                              (agent.successRate ?? 0) >= 95
                                ? 'text-green-600'
                                : (agent.successRate ?? 0) >= 90
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {agent.successRate ?? 0}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No conversations yet. Start chatting with an AI agent to see performance data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-8 border border-neutral-200 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Recent Activity
              </h2>
              <span className="text-sm text-gray-500">Last 30 minutes</span>
            </div>
            <div className="space-y-3">
              {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 ? (
                <>
                  {(showAllActivities 
                    ? analyticsData.recentActivity 
                    : analyticsData.recentActivity.slice(0, 3)
                  ).map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.status === 'success' || activity.status === 'completed'
                              ? 'bg-green-500'
                              : activity.status === 'active'
                              ? 'bg-blue-500 animate-pulse'
                              : activity.status === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        ></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action}
                          </p>
                          <p className="text-xs text-gray-600">
                            {activity.agent}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  {analyticsData.recentActivity.length > 3 && (
                    <button
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      {showAllActivities ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          View All Activities ({analyticsData.recentActivity.length})
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No recent activity in the last 30 minutes.</p>
                  <p className="text-xs mt-2">Activity will appear here when you use the platform.</p>
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {dashboardSections.map((section, index) => (
              <Link
                key={index}
                href={section.href}
                className="group relative glass-card p-8 hover:-translate-y-1 transition-all duration-300"
              >
                {section.badge && (
                  <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {section.badge}
                  </div>
                )}
                <div className="text-4xl mb-4">{section.icon}</div>
                <h3 className="text-xl font-bold text-slate-700 mb-3 group-hover:text-blue-600 transition-colors">
                  {section.title}
                </h3>
                <p className="text-slate-500 mb-4 leading-relaxed">
                  {section.description}
                </p>
                <ul className="space-y-2">
                  {section.stats.map((stat, statIndex) => (
                    <li
                      key={statIndex}
                      className="text-sm text-slate-400 flex items-center"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>
                      {stat}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>

          {/* Neural Link - Standalone AI Platform */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-700">Neural Link Platform</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Access our standalone multi-provider AI platform with separate credits & billing
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NeuralLinkCard variant="full" />
              <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_4px_20px_rgba(139,92,246,0.08)] p-6">
                <h3 className="font-bold text-slate-700 mb-4">What is Neural Link?</h3>
                <ul className="space-y-3 text-sm text-slate-500">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-0.5">✓</span>
                    <span><strong>Multiple AI Models</strong> - Automatically optimized for every task</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-0.5">✓</span>
                    <span><strong>Unified Credits</strong> - One balance works across all providers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-0.5">✓</span>
                    <span><strong>Live Voice</strong> - Real-time AI-powered audio chat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-0.5">✓</span>
                    <span><strong>Canvas App</strong> - AI-powered code generation with live preview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-0.5">✓</span>
                    <span><strong>Separate Billing</strong> - Independent credits & usage tracking</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-white/80">
                  Neural Link uses your Mumtaz AI account but has its own credit system and API usage tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-700 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="https://mumtaz.ai/agents"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <span className="text-2xl mr-3">🤖</span>
                <div>
                  <div className="font-medium text-slate-700 group-hover:text-blue-600">
                    Chat with Agents
                  </div>
                  <div className="text-sm text-slate-500">
                    Explore AI agents
                  </div>
                </div>
              </Link>
              <Link
                href="/support/contact-us"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <span className="text-2xl mr-3">💬</span>
                <div>
                  <div className="font-medium text-slate-700 group-hover:text-green-600">
                    Get Support
                  </div>
                  <div className="text-sm text-slate-500">
                    Contact our support team
                  </div>
                </div>
              </Link>
              <Link
                href="/resources/documentation"
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
              >
                <span className="text-2xl mr-3">📚</span>
                <div>
                  <div className="font-medium text-slate-700 group-hover:text-purple-600">
                    View Documentation
                  </div>
                  <div className="text-sm text-slate-500">
                    Learn more about features
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
