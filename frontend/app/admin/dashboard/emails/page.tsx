'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  MailOpen,
  MailX,
  Send,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Filter,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

const API_BASE = '/api/admin/email-tracking';

interface EmailRecord {
  id: string;
  email: string;
  emailType: string;
  subject: string;
  trackingId: string;
  sentAt: string;
  delivered: boolean;
  deliveredAt: string | null;
  failed: boolean;
  failedAt: string | null;
  failedReason: string | null;
  openedAt: string | null;
  opened: boolean;
  openCount: number;
  userAgent: string | null;
  userId: string | null;
}

interface OverviewData {
  total: { sent: number; delivered: number; failed: number; opened: number; openRate: number; deliveryRate: number };
  today: { sent: number; delivered: number; failed: number; opened: number; openRate: number; deliveryRate: number };
  week: { sent: number; delivered: number; failed: number; opened: number; openRate: number; deliveryRate: number };
  month: { sent: number; delivered: number; failed: number; opened: number; openRate: number; deliveryRate: number };
  byType: Array<{
    emailType: string;
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    openRate: number;
    deliveryRate: number;
  }>;
}

interface ChartPoint {
  date: string;
  sent: number;
  opened: number;
}

const EMAIL_TYPE_LABELS: Record<string, string> = {
  welcome: 'Welcome',
  verification: 'Verification',
  login_otp: 'Login OTP',
  login_alert: 'Login Alert',
  password_reset: 'Password Reset',
  password_changed: 'Password Changed',
  plan_purchase: 'Plan Purchase',
  contact_reply: 'Contact Reply',
  ticket_reply: 'Ticket Reply',
  consultation_reply: 'Consultation',
  admin_notification: 'Admin Alert',
  admin_contact: 'Admin: Contact',
  admin_ticket: 'Admin: Ticket',
  admin_consultation: 'Admin: Consult',
  admin_application: 'Admin: Application',
  admin_new_user: 'Admin: New User',
};

const EMAIL_TYPE_COLORS: Record<string, string> = {
  welcome: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  verification: 'bg-blue-50 text-blue-600 border-blue-200',
  login_otp: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  login_alert: 'bg-amber-50 text-amber-600 border-amber-200',
  password_reset: 'bg-red-50 text-red-600 border-red-200',
  password_changed: 'bg-orange-50 text-orange-600 border-orange-200',
  plan_purchase: 'bg-purple-50 text-purple-600 border-purple-200',
  contact_reply: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  ticket_reply: 'bg-pink-50 text-pink-600 border-pink-200',
  consultation_reply: 'bg-teal-50 text-teal-600 border-teal-200',
  admin_notification: 'bg-gray-50 text-gray-600 border-gray-200',
  admin_contact: 'bg-sky-50 text-sky-600 border-sky-200',
  admin_ticket: 'bg-rose-50 text-rose-600 border-rose-200',
  admin_consultation: 'bg-lime-50 text-lime-600 border-lime-200',
  admin_application: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
  admin_new_user: 'bg-sky-50 text-sky-600 border-sky-200',
};

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EmailTrackingPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/overview`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const o = data.overview || data;
        setOverview({
          total: o.total || { sent: 0, delivered: 0, failed: 0, opened: 0, openRate: 0, deliveryRate: 0 },
          today: o.today || { sent: 0, delivered: 0, failed: 0, opened: 0, openRate: 0, deliveryRate: 0 },
          week: o.last7d || o.week || { sent: 0, delivered: 0, failed: 0, opened: 0, openRate: 0, deliveryRate: 0 },
          month: o.last30d || o.month || { sent: 0, delivered: 0, failed: 0, opened: 0, openRate: 0, deliveryRate: 0 },
          byType: o.byType || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    }
  }, []);

  const fetchEmails = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`${API_BASE}/emails?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEmails(Array.isArray(data.emails) ? data.emails : []);
        const pag = data.pagination || data;
        setTotalPages(pag.totalPages || 1);
        setTotalCount(pag.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    }
  }, [page, typeFilter, statusFilter, searchQuery]);

  const fetchChart = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/chart?days=30`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const raw = data.chart;
        // API returns { sent: [...], opened: [...] } — merge into flat array
        if (raw && !Array.isArray(raw)) {
          const sentArr = Array.isArray(raw.sent) ? raw.sent : [];
          const openedArr = Array.isArray(raw.opened) ? raw.opened : [];
          const dateMap: Record<string, { date: string; sent: number; opened: number }> = {};
          for (const s of sentArr) {
            const d = typeof s.date === 'string' ? s.date.slice(0, 10) : new Date(s.date).toISOString().slice(0, 10);
            dateMap[d] = { date: d, sent: s.count || 0, opened: 0 };
          }
          for (const o of openedArr) {
            const d = typeof o.date === 'string' ? o.date.slice(0, 10) : new Date(o.date).toISOString().slice(0, 10);
            if (dateMap[d]) dateMap[d].opened = o.count || 0;
            else dateMap[d] = { date: d, sent: 0, opened: o.count || 0 };
          }
          const merged = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
          setChart(merged);
        } else {
          setChart(Array.isArray(raw) ? raw : []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chart:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), fetchEmails(), fetchChart()]);
    setLoading(false);
  }, [fetchOverview, fetchEmails, fetchChart]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // Simple bar chart component
  const maxSent = Math.max(...chart.map((c) => c.sent), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading email tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full themed-section-bg">
      {/* Hero Header */}
      <section className="relative py-10 overflow-hidden rounded-b-[2rem]">
        <div className="absolute -top-20 -right-10 w-[200px] h-[600px] rotate-[-25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-indigo-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 left-[10%] w-[180px] h-[700px] rotate-[20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 right-[30%] w-[160px] h-[500px] rotate-[-35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-blue-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -left-10 w-[220px] h-[550px] rotate-[30deg] rounded-[100px] bg-gradient-to-t from-transparent via-purple-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-300/40 rounded-full text-pink-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                  Emails
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-pink-700 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="w-8 h-8 neu-icon"><Mail className="w-4 h-4 text-white" /></div>
                  Email Tracking
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Monitor email delivery, opens, and engagement across all transactional emails
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:border-purple-300 text-slate-500 rounded-lg border border-white/60 transition-all text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Stats Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Sent"
            value={overview.total.sent}
            icon={<Send className="w-5 h-5 text-blue-500" />}
            sub={`${overview.today.sent} today`}
          />
          <StatCard
            label="Opened"
            value={overview.total.opened}
            icon={<MailOpen className="w-5 h-5 text-emerald-500" />}
            sub={`${overview.today.opened} today`}
          />
          <StatCard
            label="Delivered"
            value={overview.total.delivered}
            icon={<CheckCircle className="w-5 h-5 text-cyan-500" />}
            sub={`${overview.today.delivered} today · ${overview.total.deliveryRate}% rate`}
          />
          <StatCard
            label="Failed"
            value={overview.total.failed}
            icon={<XCircle className="w-5 h-5 text-red-500" />}
            sub={`${overview.today.failed} today`}
          />
          <StatCard
            label="Open Rate"
            value={`${overview.total.openRate}%`}
            icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
            sub={`${overview.week.openRate}% this week`}
          />
        </div>
      )}

      {/* Chart - 30-day send/open trend */}
      {chart.length > 0 && (
        <div className="relative glass-card p-6">
          <h2 className="text-slate-700 font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            30-Day Email Activity
          </h2>
          <div className="flex items-end gap-1 h-40">
            {chart.map((day) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-0.5 group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-white/80 backdrop-blur-xl border border-white/80 rounded-xl shadow-lg px-3 py-2 text-xs whitespace-nowrap z-10">
                  <div className="text-slate-700 font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-blue-600">Sent: {day.sent}</div>
                  <div className="text-emerald-600">Opened: {day.opened}</div>
                </div>
                {/* Sent bar */}
                <div
                  className="w-full bg-blue-200 rounded-t-sm min-h-[2px] transition-all hover:bg-blue-300"
                  style={{ height: `${(day.sent / maxSent) * 100}%` }}
                />
                {/* Opened bar overlay */}
                <div
                  className="w-full bg-emerald-400 rounded-t-sm min-h-[1px] -mt-0.5"
                  style={{ height: `${(day.opened / maxSent) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-400">
            <span>
              {chart.length > 0
                ? new Date(chart[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : ''}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-2 bg-blue-200 rounded-sm" /> Sent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-2 bg-emerald-400 rounded-sm" /> Opened
              </span>
            </div>
            <span>
              {chart.length > 0
                ? new Date(chart[chart.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : ''}
            </span>
          </div>
        </div>
      )}

      {/* By Type Breakdown */}
      {overview && overview.byType.length > 0 && (
        <div className="relative glass-card p-6">
          <h2 className="text-slate-700 font-semibold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" />
            Breakdown by Email Type
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {overview.byType.map((t) => (
              <div
                key={t.emailType}
                className="bg-white/40 border border-white/80 rounded-xl p-4 text-center hover:border-blue-300 transition-all"
              >
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
                    EMAIL_TYPE_COLORS[t.emailType] || 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}
                >
                  {EMAIL_TYPE_LABELS[t.emailType] || t.emailType}
                </span>
                <div className="mt-3 text-xl font-bold text-slate-800">{t.sent}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {t.delivered} delivered &middot; {t.opened} opened
                </div>
                {t.failed > 0 && (
                  <div className="text-xs text-red-600 mt-0.5">{t.failed} failed</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Table */}
      <div className="relative glass-card overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white/40 border border-white/80 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-300"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            title="Filter by email type"
            className="px-3 py-2 bg-white/40 border border-white/80 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-300"
          >
            <option value="all">All Types</option>
            {Object.entries(EMAIL_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            title="Filter by status"
            className="px-3 py-2 bg-white/40 border border-white/80 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-300"
          >
            <option value="all">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="opened">Opened</option>
            <option value="unopened">Unopened</option>
            <option value="failed">Failed</option>
          </select>

          <span className="text-xs text-slate-400">{totalCount} results</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Sent</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Opened</th>
                <th className="text-right px-4 py-3 font-medium">Opens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No emails found matching your filters.
                  </td>
                </tr>
              ) : (
                emails.map((em) => (
                  <tr
                    key={em.id}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-slate-700 font-medium truncate max-w-[200px]">
                        {em.email}
                      </div>
                      {em.userId && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                          {em.userId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
                          EMAIL_TYPE_COLORS[em.emailType] || 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}
                      >
                        {EMAIL_TYPE_LABELS[em.emailType] || em.emailType}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-slate-500 truncate max-w-[250px]">
                        {em.subject}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(em.sentAt)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(em.sentAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {em.failed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium" title={em.failedReason || 'Send failed'}>
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        ) : em.opened ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-xs font-medium">
                            <MailOpen className="w-3 h-3" />
                            Opened
                          </span>
                        ) : em.delivered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-slate-400 text-xs">
                        {em.openedAt ? formatDate(em.openedAt) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block min-w-[28px] text-center px-2 py-0.5 rounded text-xs font-bold ${
                          em.openCount > 0
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {em.openCount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                title="Previous page"
                className="p-1.5 rounded-lg bg-white/60 text-slate-500 border border-white/80 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                title="Next page"
                className="p-1.5 rounded-lg bg-white/60 text-slate-500 border border-white/80 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="relative glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 text-sm font-medium">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-800">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  );
}
