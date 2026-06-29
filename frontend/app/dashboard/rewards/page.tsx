'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrophyIcon,
  StarIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function RewardsCenterPage() {
  const { state } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [rewardsData, setRewardsData] = useState(null);

  // Fetch rewards data on mount
  const fetchRewardsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/user/rewards/${state.user.id}`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setRewardsData(result.data);
      } else {
        console.error('Failed to fetch rewards data');
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  }, [state.user?.id, setLoading, setRewardsData]);

  useEffect(() => {
    if (state.user?.id) {
      fetchRewardsData();
    }
  }, [state.user, fetchRewardsData]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen neu-page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading your rewards...</p>
        </div>
      </div>
    );
  }

  // Use real data or fallback to default values
  const currentLevel = rewardsData?.currentLevel || 1;
  const totalPoints = rewardsData?.totalPoints || 0;
  const pointsToNextLevel = rewardsData?.pointsToNextLevel || 100;
  const badgesEarned = rewardsData?.badges?.length || 0;
  const totalBadges = 8; // Total available badges
  const leaderboardRank = rewardsData?.leaderboardRank || rewardsData?.rank || 0;

  // Calculate level progress percentage
  const pointsThisLevel = rewardsData?.pointsThisLevel || 0;
  const levelProgress =
    pointsToNextLevel > 0
      ? (pointsThisLevel / (pointsThisLevel + pointsToNextLevel)) * 100
      : 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -left-20 top-1/4 w-72 h-[500px] rounded-[100px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
        <div className="absolute -right-16 -top-20 w-80 h-[600px] rounded-[100px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute left-1/3 -bottom-32 w-64 h-[400px] rounded-[80px] rotate-45 bg-gradient-to-tr from-purple-200/25 via-white/30 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute right-1/4 top-10 w-48 h-[350px] rounded-[60px] -rotate-6 bg-gradient-to-b from-white/35 via-slate-200/20 to-transparent backdrop-blur-sm border border-white/45" />
        <div className="absolute -left-10 -bottom-10 w-56 h-[300px] rounded-[70px] rotate-[30deg] bg-gradient-to-tl from-indigo-100/30 via-white/25 to-transparent backdrop-blur-sm border border-white/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-300/40 rounded-full px-4 py-1.5 mb-6">
              <span className="text-purple-700 text-xs font-bold uppercase tracking-wider">Rewards</span>
            </div>
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-6">
              <TrophyIcon className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">My Rewards</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Track your progress, earn rewards, and unlock achievements
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all shadow-lg"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Rewards Content */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container-custom max-w-6xl">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_4px_20px_rgba(139,92,246,0.08)] p-6">
              <div className="flex items-center justify-between mb-4">
                <TrophyIcon className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-slate-800">Lv.{currentLevel}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Current Level</h3>
              <div className="w-full bg-purple-200/30 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full h-2 transition-all duration-300"
                  style={{ width: `${levelProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-slate-500">
                {pointsToNextLevel} points to next level
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <StarIcon className="w-8 h-8 text-yellow-500" />
                <span className="text-2xl font-bold text-slate-800">
                  {totalPoints.toLocaleString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Total Points
              </h3>
              <p className="text-sm text-slate-500">Lifetime points earned</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <SparklesIcon className="w-8 h-8 text-purple-500" />
                <span className="text-2xl font-bold text-slate-800">
                  {badgesEarned}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Badges Earned
              </h3>
              <p className="text-sm text-slate-500">
                Out of {totalBadges} available
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <ChartBarIcon className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-slate-800">
                  {leaderboardRank > 0 ? `#${leaderboardRank}` : '—'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Leaderboard
              </h3>
              <p className="text-sm text-slate-500">Current ranking</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 p-1 bg-white/40 rounded-xl mb-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'badges'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Badges
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'overview' && (
              <div className="glass-card p-8">
                <h3 className="text-xl font-semibold text-slate-800 mb-6">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {rewardsData?.rewardHistory &&
                  rewardsData.rewardHistory.length > 0 ? (
                    rewardsData.rewardHistory
                      .slice(0, 5)
                      .map((reward, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-transparent rounded-lg"
                        >
                          <div className="flex items-center">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-4">
                              <SparklesIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-800">
                                {reward.title}
                              </h4>
                              <p className="text-sm text-slate-500">
                                {reward.date
                                  ? new Date(reward.date).toLocaleDateString()
                                  : 'Recently'}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-blue-600">
                            +{reward.points}
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <TrophyIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500">No recent activity</p>
                      <p className="text-sm text-neutral-400 mt-1">
                        Start using AI tools to earn points and badges!
                      </p>
                    </div>
                  )}
                </div>

                {/* Show available badges */}
                {rewardsData?.badges && rewardsData.badges.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">
                      Your Badges
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {rewardsData.badges.map((badge, index) => (
                        <div
                          key={index}
                          className="text-center p-4 bg-transparent rounded-lg"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <SparklesIcon className="w-6 h-6 text-white" />
                          </div>
                          <h5 className="font-medium text-slate-800 text-sm">
                            {badge.name}
                          </h5>
                          <p className="text-xs text-slate-500 mt-1">
                            {badge.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'overview' && (
              <div className="text-center py-16">
                <div className="glass-card p-12 max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <SparklesIcon className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">
                    Coming Soon!
                  </h3>
                  <p className="text-slate-500 mb-6">
                    We're working hard to bring you an amazing {activeTab}{' '}
                    experience. Stay tuned for exciting updates!
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
