'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Mic,
  Music,
  Palette,
  Brain,
  BookOpen,
  User,
  TrendingUp,
  Heart,
  MessageSquare,
  BarChart3,
  Beaker,
  Zap,
  Users,
} from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { LockedCard } from '@/components/LockedCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://mumtaz.ai';

interface Experiment {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
  status: 'live' | 'beta' | 'coming-soon';
  testCount: number;
}

interface LabStats {
  totalTestsAllTime: number;
  labActiveUsers: number;
  totalUsers: number;
}

export default function AILabPage() {
  const { hasActiveSubscription } = useSubscriptionStatus();
  const [labStats, setLabStats] = useState<LabStats>({
    totalTestsAllTime: 0,
    labActiveUsers: 0,
    totalUsers: 0
  });
  const [experimentTestCounts, setExperimentTestCounts] = useState<Record<string, number>>({});

  // Fetch real stats from API
  const fetchLabStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/analytics/lab/stats`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) return;
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setLabStats({
          totalTestsAllTime: result.data.realtime.totalTestsAllTime || 0,
          labActiveUsers: result.data.realtime.labActiveUsers || 0,
          totalUsers: result.data.realtime.totalUsers || 0
        });
        
        // Build test counts map from experiments
        const counts: Record<string, number> = {};
        result.data.experiments?.forEach((exp: any) => {
          counts[exp.id] = exp.tests || 0;
        });
        setExperimentTestCounts(counts);
      }
    } catch (err) {
      console.error('Error fetching lab stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchLabStats();
    // Refresh every 10 seconds
    const interval = setInterval(fetchLabStats, 10000);
    return () => clearInterval(interval);
  }, [fetchLabStats]);

  const experiments: Experiment[] = [
    {
      id: 'battle-arena',
      name: 'AI Battle Arena',
      description:
        'Watch AI models compete head-to-head, compare responses, and vote for the winner',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-yellow-500 to-red-500',
      href: '/lab/battle-arena',
      status: 'live',
      testCount: 15230,
    },
    {
      id: 'image-playground',
      name: 'AI Image Playground',
      description:
        'Generate stunning images, apply style transfers, and transform visuals with cutting-edge AI',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'from-pink-500 to-rose-500',
      href: '/lab/image-playground',
      status: 'live',
      testCount: 12450,
    },
    {
      id: 'voice-cloning',
      name: 'Voice Cloning Studio',
      description:
        'Clone voices, create custom speech, and experiment with vocal transformations',
      icon: <Mic className="w-8 h-8" />,
      color: 'from-purple-500 to-indigo-500',
      href: '/lab/voice-cloning',
      status: 'live',
      testCount: 8920,
    },
    {
      id: 'music-generator',
      name: 'AI Music Generator',
      description:
        'Compose original music, generate beats, and create soundtracks from text descriptions',
      icon: <Music className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      href: '/lab/music-generator',
      status: 'live',
      testCount: 6730,
    },
    {
      id: 'neural-art',
      name: 'Neural Art Studio',
      description:
        'Transform photos into masterpieces with neural style transfer and AI-powered art',
      icon: <Palette className="w-8 h-8" />,
      color: 'from-orange-500 to-amber-500',
      href: '/lab/neural-art',
      status: 'live',
      testCount: 9840,
    },
    {
      id: 'dream-interpreter',
      name: 'Dream Interpreter',
      description:
        'Analyze dreams, generate visualizations, and discover patterns in your subconscious',
      icon: <Brain className="w-8 h-8" />,
      color: 'from-violet-500 to-purple-500',
      href: '/lab/dream-interpreter',
      status: 'beta',
      testCount: 5420,
    },
    {
      id: 'story-weaver',
      name: 'AI Story Weaver',
      description:
        'Collaborate with AI to write stories, create adventures, and build immersive worlds',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500',
      href: '/lab/story-weaver',
      status: 'live',
      testCount: 11200,
    },
    {
      id: 'personality-mirror',
      name: 'Personality Mirror',
      description:
        'Discover your communication style, analyze personality traits, and understand your patterns',
      icon: <User className="w-8 h-8" />,
      color: 'from-teal-500 to-cyan-500',
      href: '/lab/personality-mirror',
      status: 'beta',
      testCount: 7650,
    },
    {
      id: 'future-predictor',
      name: 'Future Predictor',
      description:
        'Forecast trends, simulate scenarios, and explore "what if" possibilities with AI',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'from-indigo-500 to-blue-500',
      href: '/lab/future-predictor',
      status: 'live',
      testCount: 4890,
    },
    {
      id: 'emotion-visualizer',
      name: 'Emotion Visualizer',
      description:
        'Analyze emotions, create sentiment heatmaps, and visualize feelings in text',
      icon: <Heart className="w-8 h-8" />,
      color: 'from-red-500 to-pink-500',
      href: '/lab/emotion-visualizer',
      status: 'live',
      testCount: 8340,
    },
    {
      id: 'debate-arena',
      name: 'AI Debate Arena',
      description:
        'Watch AI agents debate topics, vote on winners, and submit your own debate challenges',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500',
      href: '/lab/debate-arena',
      status: 'beta',
      testCount: 6120,
    },
  ];

  // Get test count for experiment from API data, fallback to 0
  const getTestCount = (expId: string): number => {
    return experimentTestCounts[expId] || 0;
  };

  const liveExperiments = experiments.filter(
    (exp) => exp.status === 'live'
  ).length;
  const betaExperiments = experiments.filter(
    (exp) => exp.status === 'beta'
  ).length;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass Pillars */}
        <div className="absolute top-0 left-[8%] w-24 h-full bg-gradient-to-b from-white/30 via-purple-200/20 to-transparent rounded-full blur-sm transform -skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[25%] w-16 h-full bg-gradient-to-b from-white/25 via-indigo-200/15 to-transparent rounded-full blur-sm transform skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[20%] w-20 h-full bg-gradient-to-b from-white/30 via-purple-100/20 to-transparent rounded-full blur-sm transform -skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[8%] w-14 h-full bg-gradient-to-b from-white/20 via-indigo-100/15 to-transparent rounded-full blur-sm transform skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[50%] w-12 h-full bg-gradient-to-b from-white/15 via-purple-200/10 to-transparent rounded-full blur-sm pointer-events-none" />
        {/* Chrome Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-20 h-20 p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg flex items-center justify-center">
                <Beaker className="w-12 h-12 text-purple-600" />
              </div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
                AI Lab
              </h1>
            </div>

            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Explore cutting-edge AI experiments, play with experimental
            features, and push the boundaries of artificial intelligence. All
            experiments are free to use and designed for entertainment and
            learning.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg"
            >
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-slate-800">
                {experiments.length}
              </div>
              <div className="text-sm text-slate-500">Experiments</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg"
            >
              <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <motion.div 
                key={labStats.totalTestsAllTime}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-slate-800"
              >
                {labStats.totalTestsAllTime.toLocaleString()}
              </motion.div>
              <div className="text-sm text-slate-500">Total Tests</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
              <motion.div
                key={labStats.labActiveUsers}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-slate-800"
              >
                {labStats.labActiveUsers}
              </motion.div>
              <div className="text-sm text-slate-500">Active Now</div>
            </motion.div>

            <Link href="/lab/analytics">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/50 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg cursor-pointer"
              >
                <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-slate-800">Live</div>
                <div className="text-sm text-purple-600 font-medium">Analytics →</div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
        </div>
      </section>

      {/* Experiments Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experiments.map((experiment, index) => (
            <motion.div
              key={experiment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <LockedCard
                isLocked={!hasActiveSubscription}
                title={experiment.name}
              >
                <Link href={experiment.href}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -5 }}
                    className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full relative overflow-hidden group"
                  >
                    {/* Background Gradient Effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${experiment.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    />

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {experiment.status === 'live' && (
                        <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 border border-green-300 font-medium">
                          LIVE
                        </span>
                      )}
                      {experiment.status === 'beta' && (
                        <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 font-medium">
                          BETA
                        </span>
                      )}
                      {experiment.status === 'coming-soon' && (
                        <span className="px-3 py-1 rounded-full text-xs bg-white/40 text-slate-500 border border-white/80 font-medium">
                          SOON
                        </span>
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${experiment.color} mb-6 shadow-lg text-white`}
                    >
                      {experiment.icon}
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">
                      {experiment.name}
                    </h3>
                    <p className="text-slate-500 mb-6 line-clamp-3">
                      {experiment.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>{getTestCount(experiment.id).toLocaleString()} tests</span>
                    </div>

                    {/* Hover Arrow */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${experiment.color} flex items-center justify-center shadow-lg`}
                      >
                        <span className="text-white text-xl">→</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </LockedCard>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-16"
        >
          <div className="relative overflow-hidden rounded-2xl p-8 max-w-2xl mx-auto shadow-xl themed-section-bg">
            {/* Glass Pillars */}
            <div className="absolute top-0 left-[15%] w-16 h-full bg-gradient-to-b from-white/25 via-purple-200/15 to-transparent rounded-full blur-sm transform -skew-x-3 pointer-events-none" />
            <div className="absolute top-0 right-[15%] w-14 h-full bg-gradient-to-b from-white/20 via-indigo-100/15 to-transparent rounded-full blur-sm transform skew-x-3 pointer-events-none" />
            {/* Chrome Shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-16 h-16 p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
                <Beaker className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-3">
                More Experiments Coming Soon
              </h2>
              <p className="text-slate-600 mb-6">
                We're constantly developing new AI experiments and features. Check
                back regularly to discover the latest innovations!
              </p>
              <Link href="/lab/analytics">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all"
                >
                  View Real-time Analytics
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
