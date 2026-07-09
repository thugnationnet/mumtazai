'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  Rocket,
  Sparkles,
  Globe,
  Code2,
  ArrowRight,
  Layers,
  ExternalLink,
  BadgeCheck,
  Loader2,
  RefreshCw,
  Trash2,
  Clock,
  Eye,
  Copy,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  BarChart3,
  HardDrive,
  Zap,
  Crown,
  ArrowUpRight,
  Activity,
  Server,
  Wifi,
  Star,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────

type ProjectStatus = 'draft' | 'building' | 'deployed' | 'error' | 'stopped';

interface CanvasDeployment {
  id: string;
  subdomain: string;
  url: string;
  status: string;
  requestCount: number;
  bandwidthUsed: number;
  lastAccessedAt?: string;
  createdAt: string;
}

interface CanvasProject {
  id: string;
  name: string;
  description?: string;
  framework: string;
  status: ProjectStatus;
  subdomain?: string | null;
  deploymentUrl?: string | null;
  tags: string[];
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  latestDeployment?: CanvasDeployment | null;
  latestBuild?: { status: string; createdAt: string } | null;
}

interface UsageData {
  used: number;
  limit: number;
  percent: number;
  usedFormatted?: string;
  limitFormatted?: string;
}

interface HostingPlan {
  id: string;
  tier: string;
  status: string;
  price: number;
  billingCycle: string;
  maxApps: number;
  maxBandwidthMb: number;
  maxRequestsPerMonth: number;
  maxStorageMb: number;
  customDomain: boolean;
  sslIncluded: boolean;
  prioritySupport: boolean;
  currentBandwidthMb: number;
  currentRequests: number;
  currentStorageMb: number;
  currentApps: number;
  daysRemaining: number | null;
  startDate: string;
  expiryDate?: string;
  usagePercent: {
    bandwidth: number;
    requests: number;
    storage: number;
    apps: number;
  };
  tierConfig?: {
    name: string;
    features: string[];
    price: { monthly: number; yearly: number };
  };
}

interface DashboardData {
  plan: HostingPlan;
  projects: CanvasProject[];
  projectStats: {
    total: number;
    deployed: number;
    draft: number;
    building: number;
    error: number;
  };
  deployments: {
    total: number;
    live: number;
    totalRequests: number;
    totalBandwidthFormatted: string;
    items: CanvasDeployment[];
  };
  usage: {
    bandwidth: UsageData;
    requests: UsageData;
    storage: UsageData;
    apps: UsageData;
    currentPeriod: { start: string; end: string };
  };
  billing: {
    currentPlan: string;
    monthlyPrice: number;
    billingCycle: string;
    totalSpent: number;
    gencraftSubscription: {
      plan: string;
      price: number;
      status: string;
      expiryDate: string;
    } | null;
    canvasSubscription: {
      plan: string;
      price: number;
      status: string;
      expiryDate: string;
    } | null;
    subscriptionHistory: {
      id: string;
      agentId: string;
      plan: string;
      price: number;
      status: string;
      startDate: string;
      expiryDate: string;
    }[];
  };
}

// ── Helpers ────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; cls: string; spinning?: boolean }
> = {
  live: {
    label: 'LIVE',
    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  deployed: {
    label: 'DEPLOYED',
    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  draft: {
    label: 'DRAFT',
    cls: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  building: {
    label: 'BUILDING',
    cls: 'bg-blue-100 text-blue-700 border-blue-200',
    spinning: true,
  },
  deploying: {
    label: 'DEPLOYING',
    cls: 'bg-blue-100 text-blue-700 border-blue-200',
    spinning: true,
  },
  error: { label: 'ERROR', cls: 'bg-red-100 text-red-700 border-red-200' },
  failed: { label: 'FAILED', cls: 'bg-red-100 text-red-700 border-red-200' },
  stopped: {
    label: 'STOPPED',
    cls: 'bg-slate-100 text-slate-500 border-slate-200',
  },
};

const frameworkLabels: Record<string, string> = {
  html: 'HTML/CSS/JS',
  vite_react: 'React (Vite)',
  nextjs: 'Next.js',
  vue: 'Vue',
  svelte: 'Svelte',
  astro: 'Astro',
  express: 'Express',
  fastapi: 'FastAPI',
};

// Status badge — active if hosting plan OR any subscription is active
const getStatusBadge = (plan: HostingPlan, billing?: DashboardData['billing']) => {
  const hasHostingPlan = plan.status === 'active' && plan.tier !== 'none' && plan.tier !== 'free';
  const hasGencraft = billing?.gencraftSubscription?.status === 'active' &&
    billing.gencraftSubscription.expiryDate && new Date(billing.gencraftSubscription.expiryDate) > new Date();
  const hasCanvas = billing?.canvasSubscription?.status === 'active' &&
    billing.canvasSubscription.expiryDate && new Date(billing.canvasSubscription.expiryDate) > new Date();
  if (hasHostingPlan || hasGencraft || hasCanvas) {
    const tierLabel = hasGencraft
      ? `GenCraft ${billing!.gencraftSubscription!.plan.charAt(0).toUpperCase() + billing!.gencraftSubscription!.plan.slice(1)}`
      : hasCanvas
      ? `Canvas ${billing!.canvasSubscription!.plan.charAt(0).toUpperCase() + billing!.canvasSubscription!.plan.slice(1)}`
      : plan.tier ? plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1) : '';
    return {
      label: 'Active',
      cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: BadgeCheck,
      tierLabel,
    };
  }
  return {
    label: 'Inactive',
    cls: 'bg-slate-100 text-slate-500 border-slate-200',
    icon: AlertCircle,
    tierLabel: '',
  };
};

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// ── Usage Meter Component ──────────────────────────────────

function UsageMeter({
  label,
  icon: Icon,
  used,
  limit,
  percent,
  usedFormatted,
  limitFormatted,
  color = 'brand',
}: {
  label: string;
  icon: typeof Activity;
  used: number;
  limit: number;
  percent: number;
  usedFormatted?: string;
  limitFormatted?: string;
  color?: string;
}) {
  const barColor =
    percent >= 90
      ? 'bg-red-500'
      : percent >= 70
        ? 'bg-amber-500'
        : color === 'blue'
          ? 'bg-blue-500'
          : color === 'emerald'
            ? 'bg-emerald-500'
            : color === 'violet'
              ? 'bg-violet-500'
              : 'bg-brand-500';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <span className="text-xs text-slate-400">
          {percent >= 90 && (
            <AlertCircle className="inline h-3 w-3 text-red-500 mr-1" />
          )}
          {percent}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{usedFormatted || formatNumber(used)} used</span>
        <span>{limitFormatted || formatNumber(limit)} limit</span>
      </div>
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────

type TabId = 'overview' | 'projects';

// ── Main Page ──────────────────────────────────────────────

export default function AppsDashboardPage() {
  const { state } = useAuth();
  const userId =
    state.user?.id ||
    ((state.user as Record<string, unknown>)?.userId as string | undefined);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  // ── Fetch dashboard data ─────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    try {
      const dashRes = await fetch(`/api/apps/hosting/dashboard/${userId}`, {
        credentials: 'include',
      });

      if (dashRes.ok) {
        const data = await dashRes.json();
        if (data.success) setDashboard(data.dashboard);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Check for Stripe session callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId && userId) {
      fetch('/api/apps/hosting/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            window.history.replaceState({}, '', '/dashboard/apps');
            fetchDashboard();
          }
        })
        .catch(console.error);
    }
  }, [userId, fetchDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Delete this project and all its deployments?')) return;
    try {
      const res = await fetch(`/api/canvas-builder/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok && dashboard) {
        setDashboard({
          ...dashboard,
          projects: dashboard.projects.filter((p) => p.id !== projectId),
        });
      }
    } catch {
      setActionError('Failed to delete project');
    }
  };

  const handleCancelPlan = async () => {
    if (!dashboard?.plan?.id) return;
    if (dashboard.plan.tier === 'free') {
      setActionError('You are already on the Free plan — nothing to cancel.');
      return;
    }
    if (
      !confirm('Cancel your current plan? You will be downgraded to the Free tier immediately.')
    )
      return;
    try {
      const res = await fetch(`/api/apps/hosting/plan/${dashboard.plan.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        fetchDashboard();
      } else {
        const body = await res.json().catch(() => ({}));
        setActionError(body.error || 'Failed to cancel plan — please try again.');
      }
    } catch {
      setActionError('Failed to cancel plan — please check your connection.');
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Tabs config ──────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: typeof Activity }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: Code2 },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        {/* Action Error Banner */}
        {actionError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
            <p className="text-red-700 text-sm">{actionError}</p>
            <button onClick={() => setActionError('')} className="text-red-500 hover:text-red-700 text-sm font-medium">Dismiss</button>
          </div>
        )}
        {/* Hero */}
        <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-700 text-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 text-sm text-white/80 mb-3">
                  <BadgeCheck className="h-4 w-4" />
                  <span>GenCraft — AI App Builder &amp; Hosting</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                  App Hosting Dashboard
                </h1>
                <p className="text-white/80 mt-2 max-w-lg">
                  Build, deploy, and manage your apps. Monitor usage
                  and hosting — all in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="https://studio.mumtaz.ai/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold rounded-xl shadow-lg shadow-brand-900/20 hover:bg-slate-100 transition text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  Open AI Builder
                </Link>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/30 text-white font-medium rounded-xl hover:bg-white/20 disabled:opacity-50 transition text-sm"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Nav */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6">
            <nav className="flex gap-1 -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <section className="max-w-6xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
            </div>
          ) : !dashboard ? (
            <div className="text-center py-24">
              <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                Failed to load dashboard data. Please try again.
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 text-brand-600 font-medium hover:underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* ──── OVERVIEW TAB ──── */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Plan Summary Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {(() => {
                          const badge = getStatusBadge(dashboard.plan, dashboard.billing);
                          const BadgeIcon = badge.icon;
                          return (
                            <div
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${badge.cls}`}
                            >
                              <BadgeIcon className="h-4 w-4" />
                              {badge.label}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const hasAnyPlan = (dashboard.plan.status === 'active' && dashboard.plan.tier !== 'none' && dashboard.plan.tier !== 'free') ||
                            (dashboard.billing?.gencraftSubscription?.status === 'active' &&
                             dashboard.billing.gencraftSubscription.expiryDate &&
                             new Date(dashboard.billing.gencraftSubscription.expiryDate) > new Date()) ||
                            (dashboard.billing?.canvasSubscription?.status === 'active' &&
                             dashboard.billing.canvasSubscription.expiryDate &&
                             new Date(dashboard.billing.canvasSubscription.expiryDate) > new Date());
                          if (!hasAnyPlan) {
                            return (
                              <Link
                                href="/overview/pricing"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                                Get a Plan
                              </Link>
                            );
                          }
                          return (
                            <>
                              <Link
                                href="/dashboard/billing"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 border border-brand-200 rounded-xl hover:bg-brand-50 transition"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                                Manage Plan
                              </Link>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Layers className="h-4 w-4" />
                        <span className="text-xs font-medium">Total Apps</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {dashboard.projectStats.total}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {dashboard.projectStats.deployed} deployed
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Globe className="h-4 w-4" />
                        <span className="text-xs font-medium">Live Sites</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-600">
                        {dashboard.deployments.live}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        of {dashboard.deployments.total} deployments
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-xs font-medium">Requests</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatNumber(dashboard.deployments.totalRequests)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">all-time</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-xs font-medium">Total Spent</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        ${dashboard.billing.totalSpent.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">lifetime</p>
                    </div>
                  </div>

                  {/* Usage Meters */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Current Usage
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <UsageMeter
                        label="Bandwidth"
                        icon={Wifi}
                        used={dashboard.usage.bandwidth.used}
                        limit={dashboard.usage.bandwidth.limit}
                        percent={dashboard.usage.bandwidth.percent}
                        usedFormatted={dashboard.usage.bandwidth.usedFormatted}
                        limitFormatted={
                          dashboard.usage.bandwidth.limitFormatted
                        }
                        color="blue"
                      />
                      <UsageMeter
                        label="Requests"
                        icon={Activity}
                        used={dashboard.usage.requests.used}
                        limit={dashboard.usage.requests.limit}
                        percent={dashboard.usage.requests.percent}
                        color="emerald"
                      />
                      <UsageMeter
                        label="Storage"
                        icon={HardDrive}
                        used={dashboard.usage.storage.used}
                        limit={dashboard.usage.storage.limit}
                        percent={dashboard.usage.storage.percent}
                        usedFormatted={dashboard.usage.storage.usedFormatted}
                        limitFormatted={dashboard.usage.storage.limitFormatted}
                        color="violet"
                      />
                      <UsageMeter
                        label="Apps"
                        icon={Server}
                        used={dashboard.usage.apps.used}
                        limit={dashboard.usage.apps.limit}
                        percent={dashboard.usage.apps.percent}
                        color="brand"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                      Usage period:{' '}
                      {new Date(
                        dashboard.usage.currentPeriod.start
                      ).toLocaleDateString()}{' '}
                      –{' '}
                      {new Date(
                        dashboard.usage.currentPeriod.end
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Recent Deployments */}
                  {dashboard.deployments.items.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        Recent Deployments
                      </h3>
                      <div className="space-y-3">
                        {dashboard.deployments.items.slice(0, 5).map((dep) => {
                          const cfg =
                            statusConfig[dep.status] || statusConfig.draft;
                          return (
                            <div
                              key={dep.id}
                              className="flex items-center justify-between p-3 border border-slate-100 rounded-lg"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${cfg.cls}`}
                                >
                                  {cfg.spinning && (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  )}
                                  {cfg.label}
                                </span>
                                <span className="text-sm text-slate-700 truncate">
                                  {dep.subdomain}.apps.mumtaz.ai
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-400 flex-shrink-0">
                                <span>
                                  {formatNumber(dep.requestCount)} reqs
                                </span>
                                <span>{formatRelativeTime(dep.createdAt)}</span>
                                <a
                                  href={dep.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-600 hover:text-brand-700"
                                  title="Visit deployment"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Link
                      href="https://studio.mumtaz.ai/"
                      className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
                    >
                      <Sparkles className="h-6 w-6 text-violet-600" />
                      <h3 className="mt-3 text-base font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                        Create New App
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Open the AI canvas builder to create, edit, and deploy
                        apps.
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                        Open Builder <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-brand-200 transition-all text-left"
                    >
                      <Crown className="h-6 w-6 text-amber-500" />
                      <h3 className="mt-3 text-base font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                        Manage Plan
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        View billing, cancel, or get a new plan when yours expires.
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                        Manage Billing <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                    <Link
                      href="/dashboard"
                      className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
                    >
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                      <h3 className="mt-3 text-base font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                        Main Dashboard
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        View your agents, chats, analytics, and account
                        settings.
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                        Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </div>
                </div>
              )}

              {/* ──── PROJECTS TAB ──── */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">
                        Your Projects
                      </h2>
                      <p className="text-slate-500 mt-1">
                        {dashboard.projectStats.total} project
                        {dashboard.projectStats.total !== 1 ? 's' : ''}
                        {dashboard.projectStats.deployed > 0 &&
                          ` · ${dashboard.projectStats.deployed} deployed`}
                        <span className="text-slate-400 ml-2">
                          ({dashboard.usage.apps.used}/
                          {dashboard.usage.apps.limit} app slots used)
                        </span>
                      </p>
                    </div>
                    <Link
                      href="https://studio.mumtaz.ai/"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition text-sm"
                    >
                      <Sparkles className="h-4 w-4" />
                      New Project
                    </Link>
                  </div>

                  {dashboard.projects.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-white">
                      <Code2 className="h-14 w-14 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600">
                        No projects yet
                      </h3>
                      <p className="text-slate-400 mt-2 mb-6 max-w-md mx-auto">
                        Open the AI canvas builder, describe your app, and the
                        agent will create, edit, and deploy it.
                      </p>
                      <Link
                        href="https://studio.mumtaz.ai/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition"
                      >
                        <Sparkles className="h-4 w-4" />
                        Create with AI
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.projects.map((project) => {
                        const cfg =
                          statusConfig[project.status] || statusConfig.draft;
                        const url =
                          project.deploymentUrl ||
                          (project.subdomain
                            ? `https://${project.subdomain}.apps.mumtaz.ai`
                            : null);
                        const dep = project.latestDeployment;

                        return (
                          <div
                            key={project.id}
                            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="text-lg font-semibold text-slate-900 truncate">
                                    {project.name}
                                  </h3>
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${cfg.cls}`}
                                  >
                                    {cfg.spinning && (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    {cfg.label}
                                  </span>
                                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    {frameworkLabels[project.framework] ||
                                      project.framework}
                                  </span>
                                </div>
                                <div className="mt-1.5 flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                                  {url && (
                                    <span className="flex items-center gap-1.5 truncate">
                                      <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="truncate">
                                        {url.replace('https://', '')}
                                      </span>
                                    </span>
                                  )}
                                  {dep && (
                                    <span className="flex items-center gap-1 text-xs">
                                      <Activity className="h-3 w-3" />
                                      {formatNumber(dep.requestCount)} requests
                                    </span>
                                  )}
                                  {project.viewCount > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Eye className="h-3.5 w-3.5" />
                                      {project.viewCount}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatRelativeTime(project.updatedAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                                <Link
                                  href="https://studio.mumtaz.ai/"
                                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition"
                                >
                                  <Layers className="h-4 w-4" />
                                  Edit
                                </Link>
                                {url && (
                                  <>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Visit
                                    </a>
                                    <button
                                      onClick={() => copyUrl(url, project.id)}
                                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                                      title="Copy URL"
                                    >
                                      {copiedId === project.id ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDelete(project.id)}
                                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}


            </>
          )}
        </section>
      </div>
    </ProtectedRoute>
  );
}
