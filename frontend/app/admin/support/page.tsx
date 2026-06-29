'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  TicketIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ChevronDownIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

interface SupportTicket {
  _id: string;
  ticketId: string;
  ticketNumber: number;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'waiting-customer' | 'waiting-internal' | 'resolved' | 'closed';
  assignedTo?: string;
  assignedName?: string;
  messages: Array<{
    sender: string;
    senderName: string;
    message: string;
    createdAt: string;
    isInternal?: boolean;
  }>;
  sla?: {
    firstResponseDue?: string;
    firstResponseAt?: string;
    resolutionDue?: string;
    breached?: boolean;
  };
  satisfaction?: {
    rating?: number;
    feedback?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingCustomer: number;
  resolved: number;
  closed: number;
  breachedSla: number;
  urgent: number;
}

const statusColors: Record<string, string> = {
  'open': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'in-progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'waiting-customer': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'waiting-internal': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
  'closed': 'bg-slate-200/60 text-slate-500 border-slate-300/30',
};

const priorityColors: Record<string, string> = {
  'low': 'bg-slate-200/60 text-slate-500',
  'medium': 'bg-blue-500/20 text-blue-400',
  'high': 'bg-orange-500/20 text-orange-400',
  'urgent': 'bg-red-500/20 text-red-400',
};

const categoryLabels: Record<string, string> = {
  'billing': '💳 Billing',
  'technical': '🔧 Technical',
  'account': '👤 Account',
  'agents': '🤖 Agents',
  'subscription': '📋 Subscription',
  'feature-request': '💡 Feature',
  'bug-report': '🐛 Bug',
  'general': '📝 General',
  'other': '📌 Other',
};

// Support team members (in production, fetch from database)
const supportAgents = [
  { id: 'agent1', name: 'Support Team', email: 'support@mumtaz.ai' },
  { id: 'agent2', name: 'Technical Support', email: 'tech@mumtaz.ai' },
  { id: 'agent3', name: 'Billing Support', email: 'billing@mumtaz.ai' },
];

const ADMIN_EMAILS = ['admin@mumtaz.ai', 'admin@onelast.ai', 'admin@maula.ai'];

export default function AdminSupportPage() {
  const router = useRouter();
  const { state: authState } = useAuth();

  // Admin email guard — redirect non-admin users
  useEffect(() => {
    if (authState.isAuthenticated === false) {
      router.replace('/auth/login?redirect=/admin/support');
      return;
    }
    if (authState.user && !ADMIN_EMAILS.includes(authState.user.email?.toLowerCase())) {
      router.replace('/');
    }
  }, [authState.isAuthenticated, authState.user, router]);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0, open: 0, inProgress: 0, waitingCustomer: 0, resolved: 0, closed: 0, breachedSla: 0, urgent: 0
  });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSlaBreached, setShowSlaBreached] = useState(false);
  
  // Reply form
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [assignTo, setAssignTo] = useState<string>('');

  // Fetch all tickets
  const fetchTickets = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchQuery) params.set('search', searchQuery);
      if (showSlaBreached) params.set('slaBreached', 'true');

      const response = await fetch(`/api/admin/support-tickets?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      
      if (data.success) {
        setTickets(data.tickets || []);
        setStats(data.stats || stats);
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Failed to load tickets');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery, showSlaBreached, stats]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Select ticket
  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setAssignTo(ticket.assignedTo || '');
    setReplyText('');
    setIsInternal(false);
  };

  // Submit reply
  const handleSubmitReply = async () => {
    if (!selectedTicket || (!replyText.trim() && !newStatus && !assignTo)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticketId: selectedTicket.ticketId,
          message: replyText.trim() || null,
          isInternal,
          newStatus: newStatus !== selectedTicket.status ? newStatus : null,
          assignTo: assignTo !== selectedTicket.assignedTo ? assignTo : null,
          agentName: authState.user?.name || 'Support Agent',
        }),
      });

      if (!response.ok) throw new Error('Failed to update ticket');

      const data = await response.json();
      if (data.success) {
        // Update ticket in list
        setTickets(prev => prev.map(t => 
          t.ticketId === selectedTicket.ticketId ? { ...t, ...data.ticket } : t
        ));
        setSelectedTicket(prev => prev ? { ...prev, ...data.ticket } : null);
        setReplyText('');
        setIsInternal(false);
        fetchTickets(true);
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
      alert('Failed to update ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Check SLA status
  const getSlaStatus = (ticket: SupportTicket) => {
    if (!ticket.sla) return null;
    const now = new Date();
    
    if (ticket.sla.breached) return 'breached';
    
    if (ticket.sla.resolutionDue) {
      const due = new Date(ticket.sla.resolutionDue);
      if (due < now) return 'breached';
      const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursLeft < 4) return 'warning';
    }
    
    return 'ok';
  };

  return (
    <div className="min-h-screen text-slate-900 themed-section-bg">
      {/* Header */}
      <div className="border-b border-white/40 bg-white/30 backdrop-blur-2xl sticky top-0 z-40 shadow-[0_4px_20px_rgba(139,92,246,0.08)] relative overflow-hidden">
        <div className="absolute -top-10 -right-5 w-[100px] h-[300px] rotate-[-25deg] rounded-[60px] bg-gradient-to-b from-white/40 via-indigo-300/20 to-transparent border border-white/30 pointer-events-none" />
        <div className="absolute -top-16 left-[15%] w-[80px] h-[350px] rotate-[20deg] rounded-[60px] bg-gradient-to-b from-transparent via-violet-400/15 to-white/30 border border-white/20 pointer-events-none" />
        <div className="absolute -bottom-10 right-[40%] w-[90px] h-[250px] rotate-[-30deg] rounded-[60px] bg-gradient-to-t from-white/30 via-purple-300/15 to-transparent border border-white/20 pointer-events-none" />
        <div className="max-w-screen-2xl mx-auto px-6 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 neu-icon">
                <TicketIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-rose-500/10 border border-rose-300/40 rounded-full text-rose-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  Support
                </div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-rose-700 bg-clip-text text-transparent">Support Admin</h1>
                <p className="text-sm text-slate-500">Manage customer support tickets</p>
              </div>
            </div>
            
            <button
              onClick={() => fetchTickets(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 hover:bg-white/70 border border-white/60 text-slate-500 hover:text-slate-700 hover:border-purple-300 transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b border-white/30 bg-white/20 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.open}</div>
              <div className="text-xs text-slate-400">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{stats.inProgress}</div>
              <div className="text-xs text-slate-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.waitingCustomer}</div>
              <div className="text-xs text-slate-400">Waiting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
              <div className="text-xs text-slate-400">Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">{stats.closed}</div>
              <div className="text-xs text-slate-400">Closed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{stats.urgent}</div>
              <div className="text-xs text-slate-400">Urgent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.breachedSla}</div>
              <div className="text-xs text-slate-400">SLA Breached</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-slate-100 bg-slate-50/20">
        <div className="max-w-screen-2xl mx-auto px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/60 border border-white/80 focus:border-blue-400 outline-none text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/60 border border-white/80 text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="waiting-customer">Waiting Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/60 border border-white/80 text-sm"
            >
              <option value="all">All Priority</option>
              <option value="urgent">🔥 Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/60 border border-white/80 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="account">Account</option>
              <option value="agents">Agents</option>
              <option value="subscription">Subscription</option>
              <option value="bug-report">Bug Report</option>
              <option value="feature-request">Feature Request</option>
            </select>

            {/* SLA Breached Toggle */}
            <button
              onClick={() => setShowSlaBreached(!showSlaBreached)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                showSlaBreached 
                  ? 'bg-red-500/20 border-red-500 text-red-400' 
                  : 'bg-white/60 border-white/80 text-slate-400'
              }`}
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
              SLA Breached
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        {error ? (
          <div className="text-center py-12">
            <ExclamationCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading tickets...</p>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Ticket List */}
            <div className="flex-1 space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-12 relative glass-card">
                  <TicketIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No tickets found</p>
                </div>
              ) : (
                tickets.map((ticket) => {
                  const slaStatus = getSlaStatus(ticket);
                  const isSelected = selectedTicket?.ticketId === ticket.ticketId;
                  
                  return (
                    <div
                      key={ticket.ticketId}
                      onClick={() => handleSelectTicket(ticket)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white/60 border-white/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-400 text-sm">#{ticket.ticketNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${statusColors[ticket.status]}`}>
                              {ticket.status.replace('-', ' ')}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[ticket.priority]}`}>
                              {ticket.priority === 'urgent' && <FireIcon className="w-3 h-3 inline mr-1" />}
                              {ticket.priority}
                            </span>
                            {slaStatus === 'breached' && (
                              <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                                SLA BREACHED
                              </span>
                            )}
                            {slaStatus === 'warning' && (
                              <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                                SLA Warning
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                            <span>{ticket.userName || ticket.userEmail}</span>
                            <span>•</span>
                            <span>{categoryLabels[ticket.category] || ticket.category}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(ticket.createdAt)}</span>
                          </div>
                        </div>
                        {ticket.assignedName && (
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <UserCircleIcon className="w-4 h-4" />
                            {ticket.assignedName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Ticket Detail Panel */}
            {selectedTicket && (
              <div className="w-[500px] relative glass-card flex flex-col max-h-[calc(100vh-300px)] sticky top-40">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">#{selectedTicket.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusColors[selectedTicket.status]}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <h3 className="font-medium mt-1">{selectedTicket.subject}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Customer Info */}
                <div className="p-4 border-b border-slate-100 bg-white/40">
                  <div className="flex items-center gap-3">
                    <UserCircleIcon className="w-10 h-10 text-slate-400" />
                    <div>
                      <div className="font-medium">{selectedTicket.userName || 'Customer'}</div>
                      <div className="text-sm text-slate-400">{selectedTicket.userEmail}</div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedTicket.messages?.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.sender === 'customer'
                          ? 'bg-slate-50'
                          : msg.sender === 'support'
                          ? 'bg-blue-50 border border-blue-200'
                          : msg.sender === 'ai'
                          ? 'bg-purple-50 border border-purple-200'
                          : 'bg-white/40 border border-slate-200'
                      } ${msg.isInternal ? 'border-l-4 border-l-yellow-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {msg.senderName || msg.sender}
                          {msg.isInternal && <span className="text-yellow-400 ml-2">(Internal)</span>}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatTimeAgo(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <div className="p-4 border-t border-slate-100 space-y-3">
                  {/* Status & Assignment */}
                  <div className="flex gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/60 border border-white/80 text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="waiting-customer">Waiting Customer</option>
                      <option value="waiting-internal">Waiting Internal</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/60 border border-white/80 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {supportAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reply Text */}
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white/60 border border-white/80 resize-none text-sm"
                  />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-400">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      Internal note
                    </label>
                    <button
                      onClick={handleSubmitReply}
                      disabled={isSubmitting || (!replyText.trim() && newStatus === selectedTicket.status && assignTo === selectedTicket.assignedTo)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                      {isSubmitting ? 'Sending...' : 'Update Ticket'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
