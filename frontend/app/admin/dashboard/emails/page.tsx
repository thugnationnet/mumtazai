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
} from 'lucide-react';

const API_BASE = '/api/admin/email-tracking';

interface EmailRecord {
  id: string;
  email: string;
  emailType: string;
  subject: string;
  trackingId: string;
  sentAt: string;
  openedAt: string | null;
  opened: boolean;
  openCount: number;
  userAgent: string | null;
  userId: string | null;
}

interface OverviewData {
  total: { sent: number; opened: number; openRate: number };
  today: { sent: number; opened: number; openRate: number };
  week: { sent: number; opened: number; openRate: number };
  month: { sent: number; opened: number; openRate: number };
  byType: Array<{
    emailType: string;
    sent: number;
    opened: number;
    openRate: number;
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
};

const EMAIL_TYPE_COLORS: Record<string, string> = {
  welcome: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  verification: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  login_otp: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  login_alert: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  password_reset: 'bg-red-500/20 text-red-400 border-red-500/30',
  password_changed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  plan_purchase: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  contact_reply: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  ticket_reply: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  consultation_reply: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
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
          total: o.total || { sent: 0, opened: 0, openRate: 0 },
          today: o.today || { sent: 0, opened: 0, openRate: 0 },
          week: o.last7d || o.week || { sent: 0, opened: 0, openRate: 0 },
          month: o.last30d || o.month || { sent: 0, opened: 0, openRate: 0 },
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
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading email tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Mail className="w-7 h-7 text-sky-400" />
            Email Tracking
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Monitor email delivery, opens, and engagement across all transactional emails
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sent"
            value={overview.total.sent}
            icon={<Send className="w-5 h-5 text-sky-400" />}
            sub={`${overview.today.sent} today`}
          />
          <StatCard
            label="Opened"
            value={overview.total.opened}
            icon={<MailOpen className="w-5 h-5 text-emerald-400" />}
            sub={`${overview.today.opened} today`}
          />
          <StatCard
            label="Unopened"
            value={overview.total.sent - overview.total.opened}
            icon={<MailX className="w-5 h-5 text-red-400" />}
            sub={`${overview.total.sent - overview.total.opened} total`}
          />
          <StatCard
            label="Open Rate"
            value={`${overview.total.openRate}%`}
            icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
            sub={`${overview.week.openRate}% this week`}
          />
        </div>
      )}

      {/* Chart - 30-day send/open trend */}
      {chart.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            30-Day Email Activity
          </h2>
          <div className="flex items-end gap-1 h-40">
            {chart.map((day) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-0.5 group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap z-10">
                  <div className="text-gray-300 font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-sky-400">Sent: {day.sent}</div>
                  <div className="text-emerald-400">Opened: {day.opened}</div>
                </div>
                {/* Sent bar */}
                <div
                  className="w-full bg-sky-500/30 rounded-t-sm min-h-[2px] transition-all hover:bg-sky-500/50"
                  style={{ height: `${(day.sent / maxSent) * 100}%` }}
                />
                {/* Opened bar overlay */}
                <div
                  className="w-full bg-emerald-500/60 rounded-t-sm min-h-[1px] -mt-0.5"
                  style={{ height: `${(day.opened / maxSent) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-500">
            <span>
              {chart.length > 0
                ? new Date(chart[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : ''}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-2 bg-sky-500/40 rounded-sm" /> Sent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-2 bg-emerald-500/60 rounded-sm" /> Opened
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
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-sky-400" />
            Breakdown by Email Type
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {overview.byType.map((t) => (
              <div
                key={t.emailType}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center"
              >
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
                    EMAIL_TYPE_COLORS[t.emailType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}
                >
                  {EMAIL_TYPE_LABELS[t.emailType] || t.emailType}
                </span>
                <div className="mt-3 text-xl font-bold text-white">{t.sent}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {t.opened} opened &middot; {t.openRate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-800 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
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
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-sky-500"
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
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="opened">Opened</option>
            <option value="unopened">Unopened</option>
          </select>

          <span className="text-xs text-gray-500">{totalCount} results</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Sent</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Opened</th>
                <th className="text-right px-4 py-3 font-medium">Opens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No emails found matching your filters.
                  </td>
                </tr>
              ) : (
                emails.map((em) => (
                  <tr
                    key={em.id}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-white font-medium truncate max-w-[200px]">
                        {em.email}
                      </div>
                      {em.userId && (
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-[200px]">
                          {em.userId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
                          EMAIL_TYPE_COLORS[em.emailType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}
                      >
                        {EMAIL_TYPE_LABELS[em.emailType] || em.emailType}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-gray-300 truncate max-w-[250px]">
                        {em.subject}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(em.sentAt)}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {formatDate(em.sentAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {em.opened ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium">
                          <MailOpen className="w-3 h-3" />
                          Opened
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded text-xs font-medium">
                          <MailX className="w-3 h-3" />
                          Unopened
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-400 text-xs">
                        {em.openedAt ? formatDate(em.openedAt) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block min-w-[28px] text-center px-2 py-0.5 rounded text-xs font-bold ${
                          em.openCount > 0
                            ? 'bg-sky-500/10 text-sky-400'
                            : 'text-gray-600'
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                title="Previous page"
                className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                title="Next page"
                className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
    </div>
  );
}
