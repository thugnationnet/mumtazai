'use client'

import React, { useState } from 'react'
import { Trophy, Star, Gift, Zap, Users, Calendar, MessageSquare, Share2, Crown, Award, TrendingUp, CheckCircle, Key } from 'lucide-react'
import Link from 'next/link'

interface Reward {
  id: string
  title: string
  description: string
  points: number
  icon: React.ElementType
  color: string
  category: 'subscription' | 'activity' | 'social' | 'milestone'
}

interface Level {
  name: string
  minPoints: number
  maxPoints: number
  color: string
  benefits: string[]
  icon: React.ElementType
}

interface AgentReward {
  id: string
  name: string
  subscriptionPoints: { daily: number; weekly: number; monthly: number }
  category: string
  image: string
}

export default function RewardsCenterPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'agents' | 'leaderboard'>('overview')
  const userPoints = 2450

  const levels: Level[] = [
    { name: 'Bronze', minPoints: 0, maxPoints: 999, color: 'from-amber-500 to-amber-600', benefits: ['5% bonus points', 'Access to basic agents', 'Weekly rewards'], icon: Award },
    { name: 'Silver', minPoints: 1000, maxPoints: 2499, color: 'from-slate-400 to-slate-500', benefits: ['10% bonus points', 'Access to premium agents', 'Daily rewards', 'Priority support'], icon: Award },
    { name: 'Gold', minPoints: 2500, maxPoints: 4999, color: 'from-yellow-400 to-yellow-500', benefits: ['15% bonus points', 'Access to all agents', 'Daily rewards', 'Priority support', 'Exclusive features'], icon: Crown },
    { name: 'Platinum', minPoints: 5000, maxPoints: 9999, color: 'from-purple-400 to-purple-500', benefits: ['25% bonus points', 'Unlimited agent access', 'Daily rewards', 'VIP support', 'Exclusive features', 'Early access'], icon: Crown },
    { name: 'Diamond', minPoints: 10000, maxPoints: Infinity, color: 'from-blue-400 to-blue-600', benefits: ['50% bonus points', 'Lifetime access', 'Daily rewards', 'VIP support', 'All features', 'Early access', 'Custom agents'], icon: Crown },
  ]

  const rewards: Reward[] = [
    { id: '1', title: 'Daily Login', description: 'Login to your account every day', points: 50, icon: Calendar, color: 'from-blue-500 to-cyan-500', category: 'activity' },
    { id: '2', title: 'Subscribe to Agent', description: 'Subscribe to any agent for the first time', points: 200, icon: Star, color: 'from-purple-500 to-pink-500', category: 'subscription' },
    { id: '3', title: 'Send 10 Messages', description: 'Send 10 messages to any agent', points: 100, icon: MessageSquare, color: 'from-green-500 to-emerald-500', category: 'activity' },
    { id: '4', title: 'Refer a Friend', description: 'Invite friends and earn when they join', points: 500, icon: Share2, color: 'from-orange-500 to-red-500', category: 'social' },
    { id: '5', title: 'Weekly Streak', description: 'Login 7 days in a row', points: 300, icon: Zap, color: 'from-indigo-500 to-purple-500', category: 'activity' },
    { id: '6', title: 'Monthly Streak', description: 'Login 30 days in a row', points: 1000, icon: Trophy, color: 'from-yellow-500 to-orange-500', category: 'milestone' },
    { id: '7', title: 'Complete Profile', description: 'Fill out your profile 100%', points: 150, icon: Users, color: 'from-teal-500 to-green-500', category: 'activity' },
    { id: '8', title: 'Premium Subscription', description: 'Subscribe to any premium agent', points: 400, icon: Crown, color: 'from-rose-500 to-pink-500', category: 'subscription' },
  ]

  const agentRewards: AgentReward[] = [
    { id: '1', name: 'Einstein AI', subscriptionPoints: { daily: 100, weekly: 600, monthly: 2000 }, category: 'Education', image: '\u{1F9E0}' },
    { id: '2', name: 'Doctor Network', subscriptionPoints: { daily: 120, weekly: 700, monthly: 2400 }, category: 'Healthcare', image: '\u2695\uFE0F' },
    { id: '3', name: 'Tech Wizard', subscriptionPoints: { daily: 100, weekly: 600, monthly: 2000 }, category: 'Technology', image: '\u{1F9D9}\u200D\u2642\uFE0F' },
    { id: '4', name: 'Fitness Guru', subscriptionPoints: { daily: 80, weekly: 500, monthly: 1600 }, category: 'Health & Fitness', image: '\u{1F4AA}' },
    { id: '5', name: 'Travel Buddy', subscriptionPoints: { daily: 90, weekly: 550, monthly: 1800 }, category: 'Travel', image: '\u2708\uFE0F' },
    { id: '6', name: 'Chef Biew', subscriptionPoints: { daily: 80, weekly: 500, monthly: 1600 }, category: 'Food & Cooking', image: '\u{1F468}\u200D\u{1F373}' },
    { id: '7', name: 'Comedy King', subscriptionPoints: { daily: 70, weekly: 450, monthly: 1400 }, category: 'Entertainment', image: '\u{1F3AD}' },
    { id: '8', name: 'Bishop Burger', subscriptionPoints: { daily: 110, weekly: 650, monthly: 2200 }, category: 'Business', image: '\u{1F4CA}' },
  ]

  const getCurrentLevel = () => levels.find(l => userPoints >= l.minPoints && userPoints <= l.maxPoints) || levels[0]
  const getNextLevel = () => {
    const idx = levels.findIndex(l => l.name === getCurrentLevel().name)
    return idx < levels.length - 1 ? levels[idx + 1] : null
  }
  const getProgress = () => {
    const cur = getCurrentLevel()
    const next = getNextLevel()
    if (!next) return 100
    return Math.min(((userPoints - cur.minPoints) / (next.minPoints - cur.minPoints)) * 100, 100)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Crystal Flow Glassmorphism */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/60 mb-6">
              <Trophy className="w-8 h-8 text-purple-700" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">Rewards Center</h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Earn points, unlock rewards, and level up your AI Agent experience
            </p>
            {/* Coming Soon Banner */}
            <div className="bg-purple-500/10 border border-purple-300/40 rounded-xl p-4 max-w-xl mx-auto mt-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="w-5 h-5 text-purple-600" />
                <span className="text-lg font-bold text-purple-700">Coming Soon!</span>
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600">
                We&apos;re building an amazing rewards experience for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Quick Stats */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="glass-card p-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{userPoints.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Total Points</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{getCurrentLevel().name}</div>
                <div className="text-xs text-slate-500">Current Level</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{getNextLevel() ? (getNextLevel()!.minPoints - userPoints).toLocaleString() : '0'}</div>
                <div className="text-xs text-slate-500">Points to Next</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{Math.round(getProgress())}%</div>
                <div className="text-xs text-slate-500">Progress</div>
              </div>
            </div>
            {/* Progress bar */}
            {getNextLevel() && (
              <div className="mt-4">
                <div className="bg-white/40 rounded-full h-3 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${getProgress()}%` }}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-400">
                  <span>{getCurrentLevel().name}</span>
                  <span>{getNextLevel()?.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {([
            { id: 'overview' as const, label: 'Overview', Icon: Trophy },
            { id: 'rewards' as const, label: 'Earn Rewards', Icon: Gift },
            { id: 'agents' as const, label: 'Agent Subscriptions', Icon: Star },
            { id: 'leaderboard' as const, label: 'Leaderboard', Icon: Award },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white text-slate-500 hover:bg-transparent hover:text-slate-800 border border-white/80'
              }`}
            >
              <tab.Icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Levels */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-700">Membership Levels</h2>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                    {levels.length} tiers
                  </span>
                </div>
                <div className="space-y-4">
                  {levels.map((level) => {
                    const isCurrent = level.name === getCurrentLevel().name
                    return (
                      <div key={level.name} className={`rounded-2xl p-5 border transition-all duration-300 ${isCurrent ? 'bg-gradient-to-r ' + level.color + ' border-white/30 text-white shadow-lg' : 'bg-white border-white/80 hover:shadow-md hover:border-blue-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCurrent ? 'bg-white/20' : 'bg-gradient-to-br ' + level.color}`}>
                              <level.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className={`text-lg font-bold ${isCurrent ? 'text-white' : 'text-slate-700'}`}>{level.name}</h3>
                              <p className={`text-xs ${isCurrent ? 'text-white/80' : 'text-slate-400'}`}>
                                {level.minPoints.toLocaleString()} &ndash; {level.maxPoints === Infinity ? '\u221E' : level.maxPoints.toLocaleString()} pts
                              </p>
                            </div>
                          </div>
                          {isCurrent && <CheckCircle className="w-6 h-6 text-green-300" />}
                        </div>
                        <div className="space-y-1">
                          {level.benefits.map((b, i) => (
                            <div key={i} className={`flex items-center gap-2 text-sm ${isCurrent ? 'text-white/90' : 'text-slate-500'}`}>
                              <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'text-green-300' : 'text-green-500'}`} />
                              {b}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick Actions + Redeem */}
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-700">Quick Actions</h2>
                  </div>
                  <div className="space-y-3">
                    {rewards.slice(0, 4).map((reward) => (
                      <div key={reward.id} className="group flex items-center justify-between p-4 glass-card hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${reward.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <reward.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{reward.title}</h3>
                            <p className="text-xs text-slate-400">{reward.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">+{reward.points}</div>
                          <div className="text-[10px] text-slate-400">points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Redeem */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-700">Redeem Points</h2>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: '1 Day Agent Access', cost: '1,000' },
                      { name: '1 Week Agent Access', cost: '5,000' },
                      { name: '1 Month Premium', cost: '15,000' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 glass-card hover:shadow-md hover:border-blue-200 transition-all duration-300">
                        <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                        <span className="text-sm font-bold text-blue-600">{item.cost} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earn Rewards Tab */}
        {activeTab === 'rewards' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700">Earn Points Every Day</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                {rewards.length} ways
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rewards.map((reward) => (
                <div key={reward.id} className="group glass-card p-6 hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${reward.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <reward.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-1 group-hover:text-blue-600 transition-colors">{reward.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{reward.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      reward.category === 'subscription' ? 'bg-blue-50 text-blue-700' :
                      reward.category === 'activity' ? 'bg-blue-50 text-blue-700' :
                      reward.category === 'social' ? 'bg-green-50 text-green-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {reward.category.charAt(0).toUpperCase() + reward.category.slice(1)}
                    </span>
                    <span className="text-lg font-bold text-blue-600">+{reward.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Subscriptions Tab */}
        {activeTab === 'agents' && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700">Agent Subscription Rewards</h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                {agentRewards.length} agents
              </span>
            </div>
            <p className="text-slate-500 text-sm mb-6 ml-[52px]">
              Subscribe to your favorite agents and earn points! Longer subscriptions = more points.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {agentRewards.map((agent) => (
                <div key={agent.id} className="group glass-card p-6 hover:-translate-y-1 transition-all duration-300">
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-3">{agent.image}</div>
                    <h3 className="text-lg font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{agent.name}</h3>
                    <span className="text-xs text-blue-600 font-medium">{agent.category}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-white/80">
                      <span className="text-slate-500 text-xs">Daily</span>
                      <span className="text-blue-600 font-bold text-sm">+{agent.subscriptionPoints.daily} pts</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-white/80">
                      <span className="text-slate-500 text-xs">Weekly</span>
                      <span className="text-blue-600 font-bold text-sm">+{agent.subscriptionPoints.weekly} pts</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-slate-700 text-xs font-semibold flex items-center gap-1">Monthly <Crown className="w-3 h-3 text-yellow-500" /></span>
                      <span className="text-blue-600 font-bold text-sm">+{agent.subscriptionPoints.monthly} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700">Top Performers</h2>
            </div>
            <div className="max-w-3xl space-y-3">
              {[
                { rank: 1, name: 'Alex Johnson', points: 15420, level: 'Diamond' },
                { rank: 2, name: 'Sarah Chen', points: 12850, level: 'Diamond' },
                { rank: 3, name: 'Michael Kim', points: 10200, level: 'Diamond' },
                { rank: 4, name: 'Emma Davis', points: 8750, level: 'Platinum' },
                { rank: 5, name: 'You', points: userPoints, level: getCurrentLevel().name },
                { rank: 6, name: 'James Wilson', points: 2100, level: 'Silver' },
                { rank: 7, name: 'Lisa Brown', points: 1850, level: 'Silver' },
                { rank: 8, name: 'David Lee', points: 1620, level: 'Silver' },
              ].map((user) => (
                <div
                  key={user.rank}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                    user.name === 'You'
                      ? 'bg-blue-50 border-2 border-blue-300 shadow-md'
                      : 'bg-white border border-white/80 hover:shadow-md hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                      user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                      user.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                      user.rank === 3 ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' :
                      'bg-white/40 text-slate-500'
                    }`}>
                      {user.rank <= 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][user.rank - 1] : user.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">{user.name}</span>
                        {user.name === 'You' && (
                          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">You</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{user.level} Member</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{user.points.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="neu-hero rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Start Earning Rewards Today</h2>
            <p className="text-lg opacity-90 mb-8">
              Subscribe to your favorite AI agents and start collecting points toward amazing rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://mumtaz.ai/agents" className="btn-primary bg-white text-blue-600 hover:bg-transparent">
                Explore AI Agents
              </Link>
              <Link href="https://demo.mumtaz.ai" className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-blue-600">
                Try AI Studio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
