'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  agentSubscriptionService,
  type AgentSubscription,
} from '@/services/agentSubscriptionService';
import { allAgents } from '@/app/agents/agent-registry';
import { getAgentChatUrl } from '@/lib/agentUrl';
import {
  ArrowRight,
  Loader2,
  Lock,
  ShieldCheck,
  Unlock,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useSubscribeRedirect } from '@/hooks/useSubscribeRedirect';

interface AgentCardState {
  agentId: string;
  agentName: string;
  isUnlocked: boolean;
  subscription?: AgentSubscription | null;
}

type PlanType = 'daily' | 'weekly' | 'monthly';

const PLAN_LABELS: Record<PlanType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function AgentManagementPage() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  const userId = user?.id;
  const [subscriptions, setSubscriptions] = useState<
    AgentSubscription[] | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingAgentId, setCancellingAgentId] = useState<string | null>(
    null
  );
  const redirectToSubscribe = useSubscribeRedirect();

  useEffect(() => {
    let isMounted = true;

    const loadSubscriptions = async () => {
      if (!userId) {
        setSubscriptions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data =
          await agentSubscriptionService.getUserSubscriptions(userId);
        if (isMounted) {
          setSubscriptions(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load subscriptions', err);
        if (isMounted) {
          setError(
            'Unable to load subscription information. Please try again later.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSubscriptions();

    // Refresh subscriptions when page becomes visible (user returns from checkout)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userId) {
        // Add a small delay to allow webhook processing
        setTimeout(() => {
          loadSubscriptions();
        }, 2000);
      }
    };

    // Also refresh when window gains focus
    const handleFocus = () => {
      if (userId) {
        // Add a small delay to allow webhook processing
        setTimeout(() => {
          loadSubscriptions();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId]);

  const activeAgentCount = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) {
      return 0;
    }
    return subscriptions.filter((sub) => sub.status === 'active').length;
  }, [subscriptions]);

  const agentStates: AgentCardState[] = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) {
      return allAgents.map((agent) => ({
        agentId: agent.id,
        agentName: agent.name,
        isUnlocked: false,
      }));
    }

    return allAgents.map((agent) => {
      const subscription = subscriptions.find(
        (sub) => sub.agentId === agent.id && sub.status === 'active'
      );
      return {
        agentId: agent.id,
        agentName: agent.name,
        isUnlocked: Boolean(subscription),
        subscription,
      };
    });
  }, [subscriptions]);

  const goToSubscribe = (
    agentId: string,
    agentName: string,
    options?: { plan?: string; intent?: 'upgrade' | 'downgrade' | 'cancel' }
  ) => {
    redirectToSubscribe({
      agentName,
      agentSlug: agentId,
      plan: options?.plan,
      intent: options?.intent,
    });
  };

  const handleCardClick = (agentId: string, agentName: string) => {
    goToSubscribe(agentId, agentName);
  };

  const handleCancelSubscription = async (
    agentId: string,
    agentName: string
  ) => {
    if (!userId) return;

    // Confirm cancellation
    if (
      !confirm(
        `Are you sure you want to cancel your subscription to ${agentName}? You will lose access immediately.`
      )
    ) {
      return;
    }

    setCancellingAgentId(agentId);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          agentId,
          immediate: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Successfully cancelled - refresh subscriptions list
      const updatedSubs =
        await agentSubscriptionService.getUserSubscriptions(userId);
      setSubscriptions(updatedSubs);

      alert(`Successfully cancelled your subscription to ${agentName}.`);
    } catch (err) {
      console.error('Cancel subscription error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to cancel subscription. Please try again.'
      );
    } finally {
      setCancellingAgentId(null);
    }
  };

  const handleChatWithAgent = (agentId: string) => {
    window.location.href = getAgentChatUrl(agentId);
  };

  const handleRefreshSubscriptions = () => {
    if (userId) {
      const loadSubscriptions = async () => {
        setIsLoading(true);
        try {
          const data =
            await agentSubscriptionService.getUserSubscriptions(userId);
          setSubscriptions(data);
          setError(null);
        } catch (err) {
          console.error('Failed to load subscriptions', err);
          setError(
            'Unable to load subscription information. Please try again later.'
          );
        } finally {
          setIsLoading(false);
        }
      };
      loadSubscriptions();
    }
  };

  return (
    <ProtectedRoute>
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
                <span className="text-purple-700 text-xs font-bold uppercase tracking-wider">Agent Management</span>
              </div>
              <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-6">
                <ShieldCheck className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">Agent Management</h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4">
                Purchase access to specialized agents on a per-agent basis
              </p>
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="bg-white/40 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/60">
                  <p className="text-sm text-slate-500">Active Agents</p>
                  <p className="text-3xl font-bold text-slate-800">{activeAgentCount}</p>
                </div>
                <button
                  onClick={handleRefreshSubscriptions}
                  disabled={isLoading}
                  className="p-3 rounded-xl bg-white/40 backdrop-blur-sm hover:bg-white/50 border border-white/60 disabled:opacity-50 transition-colors"
                  title="Refresh subscription status"
                >
                  <RefreshCw className={`w-6 h-6 text-slate-700 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all shadow-lg"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Agent Cards Section */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="container-custom space-y-10">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {agentStates.map((agent) => {
                const subscriptionPlan = agent.subscription?.plan as
                  | PlanType
                  | undefined;

                return (
                  <div
                    key={agent.agentId}
                    className={`relative rounded-2xl border p-6 shadow-sm transition-all duration-300 group ${
                      agent.isUnlocked
                        ? 'bg-white border-green-200 hover:border-green-300'
                        : 'bg-white/80 border-white/80 hover:border-blue-200'
                    }`}
                  >
                    {!agent.isUnlocked && (
                      <div className="absolute inset-0 rounded-2xl bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                        <Lock className="w-10 h-10 text-blue-500 mb-3" />
                        <p className="font-semibold text-slate-700 mb-2">
                          Purchase Access to {agent.agentName}
                        </p>
                        <p className="text-sm text-slate-500 mb-4">
                          Get instant access by choosing a plan.
                        </p>
                        <button
                          onClick={() =>
                            handleCardClick(agent.agentId, agent.agentName)
                          }
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          Purchase Access
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-slate-400">
                          Agent
                        </p>
                        <h3 className="text-2xl font-bold text-slate-800">
                          {agent.agentName}
                        </h3>
                      </div>
                      {agent.isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
                          <Unlock className="w-4 h-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400">
                          <Lock className="w-4 h-4" /> Locked
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-500 mb-5">
                      {agent.isUnlocked
                        ? `Currently on ${
                            PLAN_LABELS[subscriptionPlan ?? 'daily']
                          } plan. You can cancel anytime.`
                        : `Purchase access to ${agent.agentName} to explore personalized capabilities.`}
                    </p>

                    <div className="space-y-3">
                      {agent.isUnlocked && (
                        <>
                          <button
                            onClick={() => handleChatWithAgent(agent.agentId)}
                            className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            Chat with Agent
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleCancelSubscription(
                                agent.agentId,
                                agent.agentName
                              )
                            }
                            disabled={cancellingAgentId === agent.agentId}
                            className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingAgentId === agent.agentId ? (
                              <>
                                <span>Cancelling...</span>
                                <Loader2 className="w-4 h-4 animate-spin" />
                              </>
                            ) : (
                              <>
                                Cancel Subscription
                                <span className="text-xs uppercase tracking-widest font-semibold">
                                  Stop
                                </span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>

                    {!agent.isUnlocked && (
                      <button
                        onClick={() =>
                          handleCardClick(agent.agentId, agent.agentName)
                        }
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                      >
                        Purchase Access
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              How Agent Management Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Choose', 'Access', 'Renew'].map((step, index) => (
                <div
                  key={step}
                  className="p-5 rounded-xl border border-white/80"
                >
                  <p className="text-sm font-semibold text-blue-500 mb-2">
                    Step {index + 1}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {step}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    {index === 0 &&
                      'Select any locked agent to see plan options and purchase access.'}
                    {index === 1 &&
                      'Chat with your unlocked agents and access their specialized capabilities.'}
                    {index === 2 &&
                      'Renew or cancel subscriptions anytime - no auto-renewal.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
