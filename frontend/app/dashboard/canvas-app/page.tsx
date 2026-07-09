'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Activity,
  Zap,
  Palette,
  Code,
  ExternalLink,
  RefreshCw,
  Tag,
  BadgeCheck,
  AlertCircle,
  Globe,
  Layers,
  Clock,
  ArrowUpRight,
  HardDrive,
  Wifi,
  BarChart3,
  Loader2,
  Circle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────

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
  currentApps: number;
  currentBandwidthMb: number;
  currentRequests: number;
  currentStorageMb: number;
  daysRemaining: number | null;
  usagePercent: { bandwidth: number; requests: number; storage: number; apps: number };
}

interface CanvasProject {
  id: string;
  name: string;
  description?: string;
  framework: string;
  status: string;
  subdomain?: string | null;
  deploymentUrl?: string | null;
  tags: string[];
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  plan: HostingPlan;
  projects: CanvasProject[];
  projectStats: { total: number; deployed: number; draft: number; building: number; error: number };
  deployments: { total: number; live: number; totalRequests: number; totalBandwidthFormatted: string; items: unknown[] };
  usage: {
    bandwidth: { used: number; limit: number; percent: number; usedFormatted?: string; limitFormatted?: string };
    requests: { used: number; limit: number; percent: number };
    storage: { used: number; limit: number; percent: number; usedFormatted?: string; limitFormatted?: string };
    apps: { used: number; limit: number; percent: number };
  };
  billing: {
    currentPlan: string;
    monthlyPrice: number;
    totalSpent: number;
    hasActiveSubscription?: boolean;
    gencraftSubscription?: {
      id: string;
      agentId: string;
      plan: string;
      price: number;
      status: string;
      expiryDate: string;
      startDate: string;
    } | null;
    canvasSubscription?: {
      id: string;
      agentId: string;
      plan: string;
      price: number;
      status: string;
      expiryDate: string;
      startDate: string;
    } | null;
  };
}

// ── Helpers ──────────────────────────────────────────────────

const PROJECT_STATUS: Record<string, { label: string; cls: string; icon: typeof Circle }> = {
  deployed: { label: 'Live', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  draft: { label: 'Draft', cls: 'text-amber-600 bg-amber-50 border-amber-200', icon: Circle },
  building: { label: 'Building', cls: 'text-blue-600 bg-blue-50 border-blue-200', icon: Loader2 },
  error: { label: 'Error', cls: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
  stopped: { label: 'Stopped', cls: 'text-slate-500 bg-slate-50 border-slate-200', icon: Circle },
};

const FRAMEWORK_LABELS: Record<string, string> = {
  html: 'HTML/CSS/JS', vite_react: 'React', nextjs: 'Next.js', vue: 'Vue',
  svelte: 'Svelte', astro: 'Astro', express: 'Express', fastapi: 'FastAPI',
};

function fmtRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function UsageMeter({ label, icon: Icon, percent, usedFormatted, limitFormatted }: {
  label: string; icon: typeof Activity; percent: number;
  usedFormatted?: string; limitFormatted?: string;
}) {
  const bar = percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-cyan-500';
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <span className="text-xs text-slate-400">
          {percent >= 90 && <AlertCircle className="inline h-3 w-3 text-red-500 mr-1" />}
          {percent}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{usedFormatted || '—'} used</span>
        <span>{limitFormatted || '—'} limit</span>
      </div>
    </div>
  );
}

export default function CanvasAppDashboard() {
  const { state } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = state.user?.id || ((state.user as Record<string, unknown>)?.userId as string | undefined);

  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    try {
      const [dashRes, projRes] = await Promise.all([
        fetch(`/api/apps/hosting/dashboard/${userId}`, { credentials: 'include' }),
        fetch('/api/canvas-builder/projects', { credentials: 'include' }),
      ]);
      const dashData = dashRes.ok ? await dashRes.json() : null;
      const projData = projRes.ok ? await projRes.json() : null;

      if (dashData?.success) {
        const d: DashboardData = dashData.dashboard;
        if (projData?.projects) d.projects = projData.projects;
        setDashboard(d);
      }
    } catch (err) {
      console.error('Canvas-app dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleRefresh = () => { setRefreshing(true); fetchDashboard(); };

  const plan = dashboard?.plan;
  const activeSub = dashboard?.billing?.canvasSubscription;
  const hasActiveSub = activeSub?.status === 'active' && activeSub?.expiryDate && new Date(activeSub.expiryDate) > new Date();
  const isActive = !!hasActiveSub;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700 text-white">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-3 text-sm transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Palette className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold">Canvas App Dashboard</h1>
                </div>
                <p className="text-white/80 text-sm max-w-lg">
                  AI-powered code builder — track your projects, hosting plan, and usage in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://build.onelastai.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-teal-700 font-semibold rounded-xl hover:bg-slate-100 transition text-sm shadow-lg"
                >
                  <Palette className="h-4 w-4" />
                  Open Builder
                </a>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/30 text-white font-medium rounded-xl hover:bg-white/20 disabled:opacity-50 transition text-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
            </div>
          ) : !dashboard ? (
            <div className="text-center py-24">
              <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Failed to load dashboard data.</p>
              <button onClick={handleRefresh} className="text-teal-600 font-medium hover:underline">Retry</button>
            </div>
          ) : (
            <>
              {/* Plan Status Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {isActive ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                          <BadgeCheck className="h-4 w-4" />
                          Active
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold bg-slate-100 text-slate-500 border-slate-200">
                          <AlertCircle className="h-4 w-4" />
                          Inactive
                        </div>
                      )}
                      {activeSub && (
                        <span className="text-sm font-semibold text-slate-700 capitalize">
                          {activeSub.agentId === 'canvas' ? 'Canvas Build' :
                           activeSub.agentId === 'gencraft-pro' ? 'GenCraft Pro' :
                           activeSub.agentId} — {activeSub.plan}
                        </span>
                      )}
                      {!activeSub && plan?.tier && plan.tier !== 'none' && plan.tier !== 'free' && (
                        <span className="text-sm font-semibold text-slate-700 capitalize">
                          {plan.tier} Hosting Plan
                        </span>
                      )}
                    </div>
                    {activeSub && (
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5 text-teal-500" />
                          <span className="font-medium text-slate-700">${activeSub.price}</span>
                          /{activeSub.plan === 'yearly' ? 'year' : activeSub.plan === 'monthly' ? 'month' : activeSub.plan}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          Renews {new Date(activeSub.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {!activeSub && plan?.tier && plan.tier !== 'none' && plan.tier !== 'free' && (
                      <div className="text-sm text-slate-500">
                        ${plan.price}/{plan.billingCycle === 'yearly' ? 'year' : 'month'}
                        {plan.daysRemaining !== null && (
                          <span className="ml-3">{plan.daysRemaining} days remaining</span>
                        )}
                      </div>
                    )}
                    {!isActive && (
                      <p className="text-sm text-slate-400">Purchase a plan to unlock app hosting and deployments.</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!isActive ? (
                      <Link href="/overview/canvas-pricing" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition">
                        <ArrowUpRight className="h-4 w-4" />
                        Get a Plan
                      </Link>
                    ) : (
                      <Link href="/dashboard/billing" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-50 transition">
                        <ArrowUpRight className="h-4 w-4" />
                        Manage Plan
                      </Link>
                    )}
                    <Link href="/overview/canvas-pricing" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                      <Tag className="h-4 w-4" />
                      Pricing
                    </Link>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Apps', value: dashboard.projectStats.total, sub: `${dashboard.projectStats.deployed} deployed`, icon: Layers, color: 'teal' },
                  { label: 'Live Sites', value: dashboard.deployments.live, sub: `of ${dashboard.deployments.total} deployments`, icon: Globe, color: 'emerald' },
                  { label: 'Requests', value: dashboard.deployments.totalRequests.toLocaleString(), sub: 'all-time', icon: Activity, color: 'blue' },
                  { label: 'Total Spent', value: `$${dashboard.billing.totalSpent.toFixed(2)}`, sub: 'lifetime', icon: BarChart3, color: 'violet' },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-medium">{stat.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
                    </div>
                  );
                })}
              </div>

              {/* Usage Meters */}
              <div>
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-teal-500" />
                  Current Usage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <UsageMeter label="Bandwidth" icon={Wifi}
                    percent={dashboard.usage.bandwidth.percent}
                    usedFormatted={dashboard.usage.bandwidth.usedFormatted}
                    limitFormatted={dashboard.usage.bandwidth.limitFormatted} />
                  <UsageMeter label="Requests" icon={Activity}
                    percent={dashboard.usage.requests.percent}
                    usedFormatted={String(dashboard.usage.requests.used)}
                    limitFormatted={String(dashboard.usage.requests.limit)} />
                  <UsageMeter label="Storage" icon={HardDrive}
                    percent={dashboard.usage.storage.percent}
                    usedFormatted={dashboard.usage.storage.usedFormatted}
                    limitFormatted={dashboard.usage.storage.limitFormatted} />
                  <UsageMeter label="Apps" icon={Layers}
                    percent={dashboard.usage.apps.percent}
                    usedFormatted={String(dashboard.usage.apps.used)}
                    limitFormatted={String(dashboard.usage.apps.limit)} />
                </div>
              </div>

              {/* Project Cards */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <Code className="h-4 w-4 text-teal-500" />
                    Your Projects
                    <span className="ml-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {dashboard.projects.length}
                    </span>
                  </h3>
                  <a
                    href="https://build.onelastai.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium hover:underline"
                  >
                    + New Project
                  </a>
                </div>
                {dashboard.projects.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <Palette className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium mb-1">No projects yet</p>
                    <p className="text-slate-400 text-sm mb-4">Start building your first AI-powered app in Canvas.</p>
                    <a
                      href="https://build.onelastai.co"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold text-sm"
                    >
                      Open Canvas Builder <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboard.projects.map((project) => {
                      const st = PROJECT_STATUS[project.status] || PROJECT_STATUS.draft;
                      const StatusIcon = st.icon;
                      return (
                        <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{project.name}</p>
                              {project.description && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{project.description}</p>
                              )}
                            </div>
                            <span className={`ml-2 flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold ${st.cls}`}>
                              <StatusIcon className="h-3 w-3" />
                              {st.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                              {FRAMEWORK_LABELS[project.framework] || project.framework}
                            </span>
                            {project.isPublic && (
                              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-medium">Public</span>
                            )}
                            {project.tags?.slice(0, 2).map((t) => (
                              <span key={t} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">{t}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtRelative(project.updatedAt)}</span>
                            {project.viewCount > 0 && (
                              <span>{project.viewCount.toLocaleString()} views</span>
                            )}
                          </div>
                          {project.deploymentUrl ? (
                            <a
                              href={project.deploymentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-auto inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium truncate"
                            >
                              <Globe className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{project.deploymentUrl.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <a
                              href={`https://build.onelastai.co`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-auto inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 font-medium transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open in Builder
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-800 mb-4">Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href="https://build.onelastai.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors group"
                  >
                    <span className="text-2xl">🎨</span>
                    <div>
                      <div className="font-medium text-slate-800 group-hover:text-teal-700 text-sm">Canvas Builder</div>
                      <div className="text-xs text-slate-500">Open the AI app builder</div>
                    </div>
                  </a>
                  <Link
                    href="/dashboard/apps"
                    className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                  >
                    <span className="text-2xl">🚀</span>
                    <div>
                      <div className="font-medium text-slate-800 group-hover:text-blue-700 text-sm">App Hosting</div>
                      <div className="text-xs text-slate-500">Deployments &amp; hosting plans</div>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors group"
                  >
                    <span className="text-2xl">💎</span>
                    <div>
                      <div className="font-medium text-slate-800 group-hover:text-emerald-700 text-sm">Billing</div>
                      <div className="text-xs text-slate-500">View plans &amp; billing history</div>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
