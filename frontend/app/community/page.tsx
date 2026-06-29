'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Heart,
  MessageCircle,
  Users,
  TrendingUp,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';

interface CommunityMessage {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: number;
  category: 'general' | 'agents' | 'ideas' | 'help';
  isPinned?: boolean;
}

interface CommunityUser {
  id: string;
  name: string;
  avatar: string;
  title: string;
  joinedDate: Date;
  postsCount?: number;
}

export default function CommunityPage() {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [topMembers, setTopMembers] = useState<CommunityUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [postCategory, setPostCategory] = useState<
    'general' | 'agents' | 'ideas' | 'help'
  >('general');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'general' | 'agents' | 'ideas' | 'help'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [userProfile, setUserProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<{
    totalMembers: number;
    onlineNow: number;
    totalPosts: number;
    postsThisWeek: number;
    activeReplies: number;
    newMembersWeek: number;
  } | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Presence ping with cookie authentication (20s)
  useEffect(() => {
    const ping = async () => {
      try {
        if (!userProfile?.authenticated) return; // Only ping if authenticated

        await fetch('/api/community/presence/ping', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Presence ping failed:', error);
      }
    };
    ping();
    const interval = setInterval(ping, 20000);
    return () => clearInterval(interval);
  }, [userProfile?.token]);

  // Fetch initial posts and top members
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingPosts(true);
        const params = new URLSearchParams();
        if (selectedCategory !== 'all')
          params.set('category', selectedCategory);
        if (searchQuery) params.set('search', searchQuery);

        // Fetch posts
        const res = await fetch(`/api/community/posts?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          const list: CommunityMessage[] = (json.data || []).map((p: any) => ({
            id: p._id,
            author: p.authorName,
            avatar: p.authorAvatar || '👤',
            content: p.content,
            timestamp: new Date(p.createdAt),
            likes: p.likesCount || 0,
            replies: p.repliesCount || 0,
            category: p.category,
            isPinned: !!p.isPinned,
          }));
          setMessages(list);
        } else {
          setError(json.error || 'Failed to load posts');
        }

        // Fetch top members
        const membersRes = await fetch('/api/community/top-members');
        const membersJson = await membersRes.json();
        if (membersJson.success && membersJson.data) {
          const membersList: CommunityUser[] = membersJson.data.map(
            (m: any) => ({
              id: m._id,
              name: m.name || m.email || 'Member',
              avatar: m.avatar || '👤',
              title: m.title || `${m.postsCount || 0} posts`,
              joinedDate: new Date(m.createdAt),
              postsCount: m.postsCount || 0,
            })
          );
          setTopMembers(membersList);
        }
      } catch (e: any) {
        setError('Failed to load posts');
      } finally {
        setLoadingPosts(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load user profile from API using HttpOnly session cookies
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', {
          credentials: 'include', // HttpOnly cookies sent automatically
        });
        if (res.ok) {
          const profile = await res.json();
          setUserProfile({
            ...profile.profile,
            authenticated: true,
          });
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };
    loadUserProfile();
  }, []);

  // Poll community metrics every 30 seconds
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/community/stream');
        const json = await res.json();
        if (json.success && json.data?.stats) {
          setMetrics({
            totalMembers: json.data.stats.totalMembers ?? 0,
            onlineNow: json.data.stats.onlineNow ?? 0,
            totalPosts: json.data.stats.totalPosts ?? 0,
            postsThisWeek: json.data.stats.postsThisWeek ?? 0,
            activeReplies: 0,
            newMembersWeek: 0,
          });
        }
      } catch (_) {}
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!userProfile?.authenticated) {
      setError('Please log in to post messages');
      return;
    }
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          category: postCategory,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const p = json.data;
        const newMsg: CommunityMessage = {
          id: p._id,
          author: p.authorName,
          avatar: p.authorAvatar || '👤',
          content: p.content,
          timestamp: new Date(p.createdAt),
          likes: p.likesCount || 0,
          replies: p.repliesCount || 0,
          category: p.category,
          isPinned: !!p.isPinned,
        };
        setMessages((prev) => [newMsg, ...prev]);
        setNewMessage('');
      }
    } catch (_) {}
  };

  const handleLike = async (messageId: string) => {
    if (!userProfile?.authenticated) {
      setError('Please log in to like posts');
      return;
    }
    const isLiked = likedMessages.has(messageId);
    try {
      // Backend /like endpoint is a toggle — always call /like
      const res = await fetch(`/api/community/posts/${messageId}/like`, {
        method: 'POST',
        credentials: 'include', // Use HttpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to update like');
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, likes: Math.max(0, m.likes + (isLiked ? -1 : 1)) }
            : m
        )
      );
      const next = new Set(likedMessages);
      if (isLiked) next.delete(messageId);
      else next.add(messageId);
      setLikedMessages(next);
    } catch (_) {}
  };

  const filteredMessages = messages
    .filter(
      (msg) => selectedCategory === 'all' || msg.category === selectedCategory
    )
    .filter(
      (msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort(
      (a, b) =>
        (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) ||
        b.timestamp.getTime() - a.timestamp.getTime()
    );

  const stats = [
    {
      number: metrics?.totalMembers ?? '—',
      label: 'Community Members',
      icon: '👥',
    },
    {
      number: metrics?.totalPosts ?? '—',
      label: 'Total Discussions',
      icon: '💬',
    },
    { number: metrics?.onlineNow ?? '—', label: 'Online Now', icon: '🟢' },
    {
      number: metrics?.postsThisWeek ?? '—',
      label: 'Posts This Week',
      icon: '📝',
    },
  ];

  const categories = [
    {
      id: 'all',
      label: 'All Discussions',
      icon: '💭',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'general',
      label: 'General',
      icon: '🌍',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'agents',
      label: 'Agents & Features',
      icon: '🤖',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'ideas',
      label: 'Ideas & Suggestions',
      icon: '💡',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: '❓',
      color: 'from-red-500 to-pink-500',
    },
  ];

  return (
    <div className="min-h-full themed-section-bg">
      {/* Hero Section - Glass Pillar Glassmorphism */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        {/* Chrome shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              Community Hub
            </div>
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">
              Mumtaz AI Community
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Join real-time discussions with thousands of developers, AI
              enthusiasts, and innovators
            </p>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="text-center p-6 glass-card hover:border-blue-300 hover:shadow-xl transition-all"
              >
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  {stat.number}
                </div>
                <div className="text-slate-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Community Section */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar - Categories & Top Members */}
            <div className="lg:col-span-1 space-y-8">
              {/* Category Navigation */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/40 border border-white/60 rounded-xl shadow-lg flex items-center justify-center">
                    <Filter size={16} className="text-purple-600" />
                  </div>
                  Categories
                </h3>
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        selectedCategory === cat.id
                          ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                          : 'bg-transparent text-slate-600 hover:bg-gray-100 border border-white/80'
                      }`}
                    >
                      <span className="text-lg mr-2">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Members */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/40 border border-white/60 rounded-xl shadow-lg flex items-center justify-center">
                    <Users size={16} className="text-purple-600" />
                  </div>
                  Top Members
                </h3>
                <div className="space-y-4">
                  {topMembers.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      No members yet
                    </div>
                  ) : (
                    topMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-transparent rounded-xl hover:bg-gray-100 border border-white/80 transition-colors cursor-pointer"
                      >
                        <div className="text-2xl">{member.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-slate-800">
                            {member.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {member.title}
                          </div>
                          <div className="text-xs text-slate-400">
                            Joined{' '}
                            {new Date(member.joinedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-3 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search discussions..."
                    className="w-full bg-white border border-white/80 rounded-xl pl-12 pr-4 py-3 text-slate-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-lg"
                  />
                </div>
              </div>

              {/* Messages Feed */}
              <div className="space-y-4 max-h-96 overflow-y-auto mb-8 pr-4 glass-card p-6">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">💭</div>
                    <p className="text-slate-400">
                      {loadingPosts
                        ? 'Loading discussions…'
                        : 'No discussions found. Be the first to start one!'}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-5 rounded-xl border transition-all ${
                        message.isPinned
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                          : 'bg-transparent border-white/80 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{message.avatar}</div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              {message.author}
                              {message.isPinned && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                  📌 Pinned
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              {Math.round(
                                (Date.now() - message.timestamp.getTime()) /
                                  60000
                              )}{' '}
                              mins ago
                            </div>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-slate-200 rounded-full text-xs font-medium text-slate-600">
                          {
                            categories.find((c) => c.id === message.category)
                              ?.icon
                          }{' '}
                          {message.category}
                        </div>
                      </div>
                      <p className="text-slate-600 mb-4 whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <div className="flex gap-6 text-sm text-slate-400">
                        <button
                          onClick={() => handleLike(message.id)}
                          className={`flex items-center gap-2 transition-colors ${
                            likedMessages.has(message.id)
                              ? 'text-pink-500'
                              : 'hover:text-pink-500'
                          }`}
                        >
                          <Heart
                            size={16}
                            fill={
                              likedMessages.has(message.id)
                                ? 'currentColor'
                                : 'none'
                            }
                          />{' '}
                          {message.likes}
                        </button>
                        <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                          <MessageCircle size={16} /> {message.replies}
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="glass-card p-6"
              >
                <div className="mb-4">
                  <label className="text-sm text-slate-500 mb-2 block font-medium">
                    Select Category
                  </label>
                  <div className="relative">
                    <select
                      value={postCategory}
                      onChange={(e) =>
                        setPostCategory(
                          e.target.value as
                            | 'general'
                            | 'agents'
                            | 'ideas'
                            | 'help'
                        )
                      }
                      className="w-full bg-transparent border border-white/80 rounded-xl px-4 py-3 text-slate-800 appearance-none cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pr-10"
                    >
                      <option value="general">🌍 General</option>
                      <option value="agents">🤖 Agents & Features</option>
                      <option value="ideas">💡 Ideas & Suggestions</option>
                      <option value="help">❓ Help & Support</option>
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={20}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Share your thoughts, ask questions, or join the discussion..."
                    className="flex-1 bg-transparent border border-white/80 rounded-xl px-4 py-3 text-slate-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap text-white shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)]"
                  >
                    <Send size={18} /> Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Community Guidelines Section */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
              Community Guidelines
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 text-2xl">🤝</div>
              <h3 className="font-bold text-slate-800 mb-2">Be Respectful</h3>
              <p className="text-slate-500 text-sm">
                Harassment, hate speech, doxxing, and threats are strictly
                prohibited. Disagreements are fine—keep them civil and on-topic.
              </p>
            </div>
            <div className="glass-card p-6 hover:shadow-xl hover:border-amber-300 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 text-2xl">💡</div>
              <h3 className="font-bold text-slate-800 mb-2">Share Knowledge</h3>
              <p className="text-slate-500 text-sm">
                Provide constructive, good-faith contributions. Don't post spam,
                scams, or misleading content.
              </p>
            </div>
            <div className="glass-card p-6 hover:shadow-xl hover:border-green-300 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 text-2xl">🎯</div>
              <h3 className="font-bold text-slate-800 mb-2">Stay On Topic</h3>
              <p className="text-slate-500 text-sm">
                Keep discussions relevant to Mumtaz AI and applicable law.
                Don't share illegal content or proprietary data without
                permission.
              </p>
            </div>
            <div className="glass-card p-6 hover:shadow-xl hover:border-purple-300 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 text-2xl">✨</div>
              <h3 className="font-bold text-slate-800 mb-2">Be Authentic</h3>
              <p className="text-slate-500 text-sm">
                Protect your account. Don't impersonate others. By
                participating, you agree to our Terms and applicable policies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Activity Stats Section */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
              Community Activity
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 glass-card">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {metrics?.postsThisWeek ?? '—'}
              </div>
              <p className="text-slate-500">Posts This Week</p>
              <div className="mt-4 h-2 bg-white/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 w-3/4 rounded-full"></div>
              </div>
            </div>
            <div className="text-center p-8 glass-card">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {metrics?.activeReplies ?? '—'}
              </div>
              <p className="text-slate-500">Active Replies</p>
              <div className="mt-4 h-2 bg-white/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 w-4/5 rounded-full"></div>
              </div>
            </div>
            <div className="text-center p-8 glass-card">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {metrics?.newMembersWeek ?? '—'}
              </div>
              <p className="text-slate-500">New Members</p>
              <div className="mt-4 h-2 bg-white/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-600 to-emerald-600 w-2/3 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
