'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  UserIcon,
  ShieldCheckIcon,
  CogIcon,
  GiftIcon,
  StarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

// Helper function for API calls with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// API data fetching functions
const fetchUserData = async (userId: string) => {
  const [profileRes, rewardsRes] = await Promise.all([
    fetchWithTimeout(`/api/user/profile`, {
      credentials: 'include',
      cache: 'no-store',
    }),
    fetchWithTimeout(`/api/user/rewards/${userId}`, {
      credentials: 'include',
      cache: 'no-store',
    }),
  ]);

  if (!profileRes) {
    throw new Error('Unable to reach profile service');
  }

  const profileJson = await profileRes.json();
  if (!profileRes.ok || !profileJson?.profile) {
    throw new Error(profileJson?.message || 'Failed to load profile');
  }

  if (!rewardsRes) {
    throw new Error('Unable to reach rewards service');
  }

  const rewardsJson = await rewardsRes.json();
  if (!rewardsRes.ok) {
    throw new Error(rewardsJson?.message || 'Failed to load rewards');
  }

  return {
    profile: profileJson.profile,
    rewards: rewardsJson.data,
  };
};

const formatLanguagePreference = (language: any): string => {
  if (!language) return 'Not set';

  if (typeof language === 'string') {
    return language;
  }

  if (typeof language === 'object') {
    const primary = language.primary || language.code || '';
    const secondary = language.secondary || '';
    const parts = [primary, secondary].filter(Boolean).join(' / ');

    const autoDetectLabel =
      typeof language.autoDetect === 'boolean'
        ? language.autoDetect
          ? ' (Auto-detect on)'
          : ' (Auto-detect off)'
        : '';

    if (parts) {
      return `${parts}${autoDetectLabel}`.trim();
    }

    const objectValues = Object.values(language)
      .filter((value) => value !== undefined && value !== null)
      .join(', ');

    return objectValues || 'Not set';
  }

  return String(language);
};

export default function DashboardOverviewPage() {
  const { state } = useAuth(); // Get authenticated user
  const [userProfile, setUserProfile] = useState<any>(null);
  const [securitySettings, setSecuritySettings] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [rewards, setRewards] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    if (!state.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [profileRewards, securityRes, preferencesRes] = await Promise.all([
        fetchUserData(state.user.id),
        fetchWithTimeout(`/api/user/security/${state.user.id}`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetchWithTimeout(`/api/user/preferences/${state.user.id}`, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      if (profileRewards) {
        const profile = profileRewards.profile;
        setUserProfile({
          ...profile,
          joinedDate: profile.createdAt
            ? new Date(profile.createdAt).toISOString().split('T')[0]
            : 'N/A',
          lastActive: profile.updatedAt
            ? new Date(profile.updatedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        });
        setRewards(profileRewards.rewards || null);
      }

      if (securityRes) {
        const securityJson = await securityRes.json();
        if (!securityRes.ok) {
          throw new Error(
            securityJson?.message || 'Failed to load security data'
          );
        }
        setSecuritySettings(securityJson.security || securityJson.data);
      }

      if (preferencesRes) {
        const preferencesJson = await preferencesRes.json();
        if (!preferencesRes.ok) {
          throw new Error(
            preferencesJson?.message || 'Failed to load preferences'
          );
        }
        setPreferences(preferencesJson.preferences || preferencesJson.data);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(
        err instanceof Error ? err.message : 'Unable to load dashboard data'
      );
    } finally {
      setIsLoading(false);
    }
  }, [state.user?.id]);

  useEffect(() => {
    if (!state.user?.id) {
      setIsLoading(false);
      return;
    }
    loadUserData();
  }, [state.user?.id, loadUserData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const quickStats = [
    {
      label: 'AI Interactions',
      value: rewards?.rewardHistory?.length ?? 0,
    },
    {
      label: 'Days Active',
      value: rewards?.statistics?.daysActive ?? 0,
    },
    {
      label: 'Features Customized',
      value: preferences?.dashboard?.widgets?.length ?? 0,
    },
    {
      label: 'Security Score',
      value: securitySettings?.securityScore ?? 0,
      suffix: '%',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent">
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
              <span className="text-purple-700 text-xs font-bold uppercase tracking-wider">Overview</span>
            </div>
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-6">
              <UserIcon className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">
              Dashboard Overview
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Get started with your analytics and insights
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all shadow-lg"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Main Dashboard Sections */}
      <section className="py-16 px-4 bg-transparent">
        <div className="container-custom">
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
              <div>
                <p className="font-semibold text-red-800">
                  Unable to refresh some account data
                </p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button
                onClick={loadUserData}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors self-start md:self-auto"
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Retry'}
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User Profile Section */}
            <Link href="/dashboard/profile" className="group h-full">
              <div className="p-8 glass-card hover:-translate-y-1 transition-all h-full flex flex-col">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/25">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      User Profile
                    </h3>
                    <p className="text-slate-500">
                      Manage your personal information
                    </p>
                  </div>
                </div>

                {userProfile && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/25">
                        {userProfile.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {userProfile.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {userProfile.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>📍 {userProfile.location}</p>
                      <p>
                        💼 {userProfile.profession} at {userProfile.company}
                      </p>
                      <p>
                        📅 Member since{' '}
                        {new Date(userProfile.joinedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-indigo-700">
                  View and edit profile →
                </div>
              </div>
            </Link>

            {/* Security Settings Section */}
            <Link href="/dashboard/security" className="group h-full">
              <div className="p-8 glass-card hover:shadow-xl hover:border-green-300 transition-all h-full flex flex-col">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-green-500/25">
                    <ShieldCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Security Settings
                    </h3>
                    <p className="text-slate-500">
                      Password, 2FA, and security options
                    </p>
                  </div>
                </div>

                {securitySettings && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        Two-Factor Authentication
                      </span>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          securitySettings.twoFactorEnabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {securitySettings.twoFactorEnabled
                          ? 'Enabled'
                          : 'Disabled'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>
                        🔐 Password last changed:{' '}
                        {new Date(
                          securitySettings.passwordLastChanged
                        ).toLocaleDateString()}
                      </p>
                      <p>
                        📱 {securitySettings.trustedDevices?.length || 0}{' '}
                        trusted devices
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-emerald-700">
                  Manage security settings →
                </div>
              </div>
            </Link>

            {/* Preferences Section */}
            <Link href="/dashboard/preferences" className="group h-full">
              <div className="p-8 glass-card hover:shadow-xl hover:border-purple-300 transition-all h-full flex flex-col">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-purple-500/25">
                    <CogIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Preferences
                    </h3>
                    <p className="text-slate-500">
                      Themes, languages, and settings
                    </p>
                  </div>
                </div>

                {preferences && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Theme</p>
                        <p className="font-medium text-slate-800 capitalize">
                          {preferences.theme}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Language</p>
                        <p className="font-medium text-slate-800">
                          {formatLanguagePreference(preferences.language)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>🌍 {preferences.timezone}</p>
                      <p>💰 Currency: {preferences.currency}</p>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-pink-700">
                  Customize preferences →
                </div>
              </div>
            </Link>

            {/* Rewards Center Section */}
            <Link href="/dashboard/rewards" className="group h-full">
              <div className="p-8 glass-card hover:shadow-xl hover:border-yellow-300 transition-all relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-bl-[4rem] opacity-10"></div>

                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-yellow-500/25">
                    <GiftIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Rewards Center
                    </h3>
                    <p className="text-slate-500">
                      Points, badges, and achievements
                    </p>
                  </div>
                </div>

                {rewards && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                          {rewards?.totalPoints?.toLocaleString() || '0'}
                        </p>
                        <p className="text-sm text-slate-500">Total Points</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-5 h-5 text-yellow-500" />
                          <span className="text-lg font-semibold text-slate-800">
                            Level {rewards?.currentLevel || 1}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {rewards?.pointsToNextLevel || 0} to next level
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {rewards?.badges
                        ?.slice(0, 3)
                        .map((badge: any, idx: number) => (
                          <div key={idx} className="text-center p-2 bg-transparent rounded-xl">
                            <div className="text-2xl mb-1">
                              {badge.icon || '🎖️'}
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {badge.name}
                            </p>
                          </div>
                        )) || (
                        <div className="col-span-3 text-center text-slate-400 p-3 bg-transparent rounded-xl">
                          <div className="text-2xl mb-1">🎖️</div>
                          <p className="text-xs">No badges yet</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        🔥 {rewards?.streaks?.current || 0} day streak
                      </span>
                      <span className="text-slate-600">
                        🏆 {rewards?.badges?.length || 0} badges earned
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 text-sm font-medium bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent group-hover:from-yellow-700 group-hover:to-orange-700">
                  Explore rewards →
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="py-16 px-6 bg-transparent">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Your Activity Overview
            </h2>
            <p className="text-lg text-slate-500">
              Track your progress and engagement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => (
              <div
                key={stat.label}
                className="glass-card p-6 text-center hover:shadow-xl transition-shadow"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {typeof stat.value === 'number'
                    ? stat.value.toLocaleString()
                    : stat.value}{' '}
                  {stat.suffix || ''}
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
