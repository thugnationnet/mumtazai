'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  Mail,
  Clock,
  Crown,
  Ban,
  CheckCircle,
  UserCog,
  Activity,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6'];

const API_BASE = '/api/admin/dashboard';

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  loginAttempts: number;
  isActive: boolean;
  image: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLE_BADGES: Record<
  string,
  { bg: string; text: string; icon: React.ElementType }
> = {
  admin: { bg: 'bg-red-50', text: 'text-red-600', icon: Crown },
  moderator: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    icon: ShieldCheck,
  },
  user: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Shield },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '50' });
        if (search) params.set('search', search);
        if (roleFilter) params.set('role', roleFilter);
        const res = await fetch(`${API_BASE}/users?${params}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) {
          setUsers(json.data.users);
          setPagination(json.data.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter]
  );

  const fetchUserDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setUserDetail(json.data);
    } catch (err) {
      console.error('Failed to fetch user detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isActive: !currentStatus } : u
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => fetchUsers(pagination.page), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, pagination.page, fetchUsers]);

  // Compute role distribution from current page
  const roleDistribution = users.reduce((acc: Record<string, number>, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  const roleChartData = Object.entries(roleDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

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
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-300/40 rounded-full text-amber-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Users
                </div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-amber-700 bg-clip-text text-transparent">User Management</h1>
                <p className="text-sm text-slate-500 mt-1">Manage users, roles, and account status</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${autoRefresh ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {autoRefresh ? '● Live (30s)' : '○ Paused'}
                </button>
                <button onClick={() => fetchUsers()} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/50 text-slate-500 hover:text-slate-700 border border-white/60 hover:border-purple-300 hover:shadow transition-all">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="relative glass-card p-5">
          <p className="text-xs text-slate-400">Total Users</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">
            {pagination.total.toLocaleString()}
          </p>
        </div>
        <div className="relative glass-card p-5">
          <p className="text-xs text-slate-400">On This Page</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {users.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">of {pagination.total}</p>
        </div>
        <div className="relative glass-card p-5">
          <p className="text-xs text-slate-400">Active (page)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {users.filter((u) => u.isActive).length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{users.filter((u) => !u.isActive).length} banned</p>
        </div>
        <div className="relative glass-card p-5">
          <p className="text-xs text-slate-400">Subscribers (page)</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {users.filter((u) => u.isActive).length}
          </p>
        </div>
        <div className="relative glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Role Distribution</p>
          {roleChartData.length > 0 && (
            <ResponsiveContainer width="100%" height={70}>
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={18}
                  outerRadius={30}
                  dataKey="value"
                  stroke="none"
                >
                  {roleChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 11, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by email, name, or ID..."
            className="w-full pl-9 pr-3 py-2 bg-white/60 border border-white/80 rounded-lg text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white/60 border border-white/80 rounded-lg text-sm text-slate-500 px-3 py-2 outline-none focus:border-blue-400"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="relative glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">
                  Subscription
                </th>
                <th className="text-left px-4 py-3 font-medium">Logins</th>
                <th className="text-left px-4 py-3 font-medium">Last Login</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleBadge = ROLE_BADGES[u.role] || ROLE_BADGES.user;
                  const RoleIcon = roleBadge.icon;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.image ? (
                            <img
                              src={u.image}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full neu-icon text-[10px] font-bold">
                              {(u.name || u.email)?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <span className="text-slate-700 font-medium truncate max-w-[120px]">
                            {u.name || 'No name'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${roleBadge.bg} ${roleBadge.text}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 capitalize">
                        {u.role}
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-center">
                        {u.loginAttempts}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium">
                            Banned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u.id);
                              fetchUserDetail(u.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                            title="View Details"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u.id, e.target.value)}
                            className="bg-transparent text-slate-500 text-[10px] outline-none cursor-pointer hover:text-slate-700"
                            title="Change Role"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Mod</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => toggleUserStatus(u.id, u.isActive)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isActive
                                ? 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                                : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                            }`}
                            title={u.isActive ? 'Ban User' : 'Unban User'}
                          >
                            {u.isActive ? (
                              <Ban className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchUsers(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 rounded-lg bg-white/60 text-slate-500 hover:text-slate-700 disabled:opacity-30 border border-white/80 hover:border-blue-300 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchUsers(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-900 disabled:opacity-30 border border-gray-200 hover:border-blue-300 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && userDetail && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white/80 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-700">
                {userDetail.user?.name ||
                  userDetail.user?.email ||
                  'User Detail'}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* User Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      ['Email', userDetail.user?.email],
                      ['Name', userDetail.user?.name || 'N/A'],
                      ['Role', userDetail.user?.role],
                      [
                        'Subscription',
                        'N/A',
                      ],
                      ['Login Attempts', String(userDetail.user?.loginAttempts || 0)],
                      [
                        'Last Login',
                        userDetail.user?.lastLoginAt
                          ? new Date(
                              userDetail.user.lastLoginAt
                            ).toLocaleString()
                          : 'Never',
                      ],
                      [
                        'Joined',
                        new Date(userDetail.user?.createdAt).toLocaleString(),
                      ],
                      [
                        'Status',
                        userDetail.user?.isActive ? 'Active' : 'Banned',
                      ],
                      ['Stripe', userDetail.user?.stripeCustomerId || 'N/A'],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="bg-white/40 rounded-xl p-3"
                      >
                        <p className="text-[10px] text-slate-400 mb-0.5">
                          {label}
                        </p>
                        <p className="text-xs text-slate-700 font-mono truncate">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Activity Summary */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-blue-600">
                        {userDetail.sessions?.length || 0}
                      </p>
                      <p className="text-[10px] text-slate-500">Sessions</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-purple-600">
                        {userDetail.events?.length || 0}
                      </p>
                      <p className="text-[10px] text-slate-500">Events</p>
                    </div>
                    <div className="bg-pink-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-pink-600">
                        {userDetail.chats?.length || 0}
                      </p>
                      <p className="text-[10px] text-slate-500">Chats</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600">
                        {userDetail.transactions?.length || 0}
                      </p>
                      <p className="text-[10px] text-slate-500">Transactions</p>
                    </div>
                  </div>

                  {/* Recent Events */}
                  {userDetail.events?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Recent Events
                      </h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {userDetail.events
                          .slice(0, 15)
                          .map((ev: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 px-3 py-1.5 text-xs bg-white/40 rounded"
                            >
                              <span className="text-slate-400">
                                {new Date(ev.occurredAt).toLocaleString()}
                              </span>
                              <span className="text-blue-600 font-medium">
                                {ev.eventType}
                              </span>
                              <span className="text-slate-500 truncate flex-1">
                                {ev.action || ev.label || ''}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Transactions */}
                  {userDetail.transactions?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Transactions
                      </h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {userDetail.transactions
                          .slice(0, 10)
                          .map((tx: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 px-3 py-1.5 text-xs bg-white/40 rounded"
                            >
                              <span className="text-slate-400">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </span>
                              <span
                                className={`font-medium ${tx.status === 'completed' ? 'text-green-600' : tx.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}
                              >
                                ${(tx.amount / 100).toFixed(2)}
                              </span>
                              <span className="text-slate-500 capitalize">
                                {tx.type}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  tx.status === 'completed'
                                    ? 'bg-green-50 text-green-600'
                                    : tx.status === 'failed'
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-yellow-50 text-yellow-600'
                                }`}
                              >
                                {tx.status}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
