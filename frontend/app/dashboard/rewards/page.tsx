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
      <div className="min-h-screen bg-gradient-to-br from-neural-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-neural-600">Loading your rewards...</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="rewards-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#rewards-grid)"/>
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <TrophyIcon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">My Rewards</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Track your progress, earn rewards, and unlock achievements
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center bg-white text-brand-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>

      {/* Rewards Content */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container-custom max-w-6xl">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <TrophyIcon className="w-8 h-8" />
                <span className="text-2xl font-bold">Lv.{currentLevel}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Current Level</h3>
              <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${levelProgress}%` }}
                ></div>
              </div>
              <p className="text-sm opacity-90">
                {pointsToNextLevel} points to next level
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neural-100">
              <div className="flex items-center justify-between mb-4">
                <StarIcon className="w-8 h-8 text-yellow-500" />
                <span className="text-2xl font-bold text-neural-900">
                  {totalPoints.toLocaleString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neural-900 mb-2">
                Total Points
              </h3>
              <p className="text-sm text-neural-600">Lifetime points earned</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neural-100">
              <div className="flex items-center justify-between mb-4">
                <SparklesIcon className="w-8 h-8 text-purple-500" />
                <span className="text-2xl font-bold text-neural-900">
                  {badgesEarned}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neural-900 mb-2">
                Badges Earned
              </h3>
              <p className="text-sm text-neural-600">
                Out of {totalBadges} available
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neural-100">
              <div className="flex items-center justify-between mb-4">
                <ChartBarIcon className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-neural-900">
                  {leaderboardRank > 0 ? `#${leaderboardRank}` : '—'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neural-900 mb-2">
                Leaderboard
              </h3>
              <p className="text-sm text-neural-600">Current ranking</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 p-1 bg-neural-100 rounded-xl mb-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-neural-600 hover:text-neural-900'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'badges'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-neural-600 hover:text-neural-900'
              }`}
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Badges
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'overview' && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
                <h3 className="text-xl font-semibold text-neural-900 mb-6">
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
                          className="flex items-center justify-between p-4 bg-neural-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-4">
                              <SparklesIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-neural-900">
                                {reward.title}
                              </h4>
                              <p className="text-sm text-neural-600">
                                {reward.date
                                  ? new Date(reward.date).toLocaleDateString()
                                  : 'Recently'}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-brand-600">
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
                    <h4 className="text-lg font-semibold text-neural-900 mb-4">
                      Your Badges
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {rewardsData.badges.map((badge, index) => (
                        <div
                          key={index}
                          className="text-center p-4 bg-neural-50 rounded-lg"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <SparklesIcon className="w-6 h-6 text-white" />
                          </div>
                          <h5 className="font-medium text-neural-900 text-sm">
                            {badge.name}
                          </h5>
                          <p className="text-xs text-neural-600 mt-1">
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
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-neural-100 max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <SparklesIcon className="w-10 h-10 text-brand-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-neural-900 mb-4">
                    Coming Soon!
                  </h3>
                  <p className="text-neural-600 mb-6">
                    We're working hard to bring you an amazing {activeTab}{' '}
                    experience. Stay tuned for exciting updates!
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"
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
