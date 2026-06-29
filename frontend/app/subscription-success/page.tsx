'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { getAgentChatUrl } from '@/lib/agentUrl';
import {
  CheckCircle,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Headphones,
  Loader2,
  AlertTriangle,
  CreditCard,
  CalendarClock,
  Zap,
} from 'lucide-react';

interface SubscriptionData {
  success: boolean;
  hasAccess?: boolean;
  subscription?: any;
  error?: string;
  message?: string;
}

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [agentName, setAgentName] = useState('your AI agent');
  const [agentSlug, setAgentSlug] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);

  useEffect(() => {
    const agent = searchParams.get('agent');
    const slug = searchParams.get('slug');
    const session = searchParams.get('session_id');

    if (agent) {
      setAgentName(agent);
    }
    if (slug) {
      setAgentSlug(slug);
    }
    if (session) {
      setSessionId(session);
    }

    // Start verification if we have a session ID
    if (session) {
      verifyStripeSession(session, slug || undefined);
    } else {
      // No session ID - this might be a direct access or error
      setVerificationStatus('error');
      setErrorMessage(
        'No session ID provided. Please complete the subscription process first.'
      );
    }
  }, [searchParams]);

  const verifyStripeSession = async (sessionId: string, slug?: string) => {
    try {
      console.log('🔍 Verifying Stripe session:', sessionId);

      // Set a timeout for the verification
      const timeout = setTimeout(() => {
        console.error('⏰ Verification timeout');
        setVerificationStatus('error');
        setErrorMessage(
          'Verification timed out. Please check your subscription status in the dashboard.'
        );
      }, 10000); // 10 second timeout

      // Verify the session with Stripe
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, slug }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          '❌ Session verification failed:',
          response.status,
          errorData
        );

        if (response.status === 404) {
          setErrorMessage(
            'Session not found. This might be an expired or invalid link.'
          );
        } else if (response.status === 400) {
          setErrorMessage(
            errorData.error || 'Invalid session. Please try subscribing again.'
          );
        } else {
          setErrorMessage(
            'Failed to verify subscription. Please contact support.'
          );
        }
        setVerificationStatus('error');
        return;
      }

      const data = await response.json();
      console.log('✅ Session verification successful:', data);

      setSubscriptionData(data);
      setVerificationStatus('success');
    } catch (error) {
      console.error('❌ Verification error:', error);
      setVerificationStatus('error');
      setErrorMessage(
        'Network error during verification. Please check your connection and try again.'
      );
    }
  };

  const handleAgentRedirect = () => {
    if (agentSlug) {
      window.location.href = getAgentChatUrl(agentSlug);
    }
  };

  const isCanvasBuild = agentSlug === 'canvas' || agentSlug === 'canvas-build';
  const isGenCraftExperience = agentSlug === 'gencraft-pro';

  const dashboardHref = isCanvasBuild
    ? '/dashboard/canvas-app'
    : isGenCraftExperience
    ? '/dashboard/apps'
    : '/dashboard';

  // Loading state
  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">
            Verifying your subscription...
          </h2>
          <p className="text-slate-400">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Error state
  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen">
        <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
          <div className="absolute -top-20 -right-10 w-[200px] h-[600px] rotate-[-25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-violet-300/30 to-transparent backdrop-blur-sm border border-white/40" />
          <div className="absolute -top-32 left-[12%] w-[180px] h-[700px] rotate-[22deg] rounded-[100px] bg-gradient-to-b from-transparent via-purple-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
          <div className="absolute -bottom-40 right-[28%] w-[160px] h-[500px] rotate-[-32deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
          <div className="absolute -bottom-20 -left-10 w-[220px] h-[550px] rotate-[28deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
          <div className="absolute top-[12%] right-[48%] w-[120px] h-[400px] rotate-[-12deg] rounded-[80px] bg-gradient-to-b from-white/40 via-violet-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
          <div className="container-custom relative z-10 text-center">
            <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm mb-6 border border-white/50">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
                Verification Failed
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                {errorMessage ||
                  'We could not verify your subscription. Please try again or contact support.'}
              </p>
            </div>
          </div>
        </section>

        <div className="container-custom section-padding">
          <div className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={dashboardHref}
                className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-purple-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105 text-center"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/support/contact-us"
                className="flex-1 py-3 px-6 rounded-xl font-bold bg-white/50 border border-white/60 text-slate-700 hover:bg-white/70 transition-all duration-300 backdrop-blur-sm text-center"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -right-10 w-[200px] h-[600px] rotate-[-25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-violet-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 left-[12%] w-[180px] h-[700px] rotate-[22deg] rounded-[100px] bg-gradient-to-b from-transparent via-purple-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 right-[28%] w-[160px] h-[500px] rotate-[-32deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -left-10 w-[220px] h-[550px] rotate-[28deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[12%] right-[48%] w-[120px] h-[400px] rotate-[-12deg] rounded-[80px] bg-gradient-to-b from-white/40 via-violet-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/30 backdrop-blur-sm mb-6 border border-white/50 shadow-lg">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
              Subscription Confirmed!
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              You now have full access to{' '}
              <span className="font-bold text-purple-700">{agentName}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Subscription Details Card */}
        {subscriptionData?.subscription && (
          <div className="max-w-2xl mx-auto mb-10">
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">
                  Subscription Details
                </h3>
                <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full capitalize">
                  {subscriptionData.subscription.status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Zap className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-sm text-slate-400">Plan</div>
                  <div className="font-bold text-slate-700 capitalize">
                    {subscriptionData.subscription.plan}
                  </div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-xl">
                  <CreditCard className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                  <div className="text-sm text-slate-400">Price</div>
                  <div className="font-bold text-slate-700">
                    ${subscriptionData.subscription.price}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <div className="text-sm text-slate-400">Status</div>
                  <div className="font-bold text-green-600 capitalize">
                    {subscriptionData.subscription.status}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <CalendarClock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <div className="text-sm text-slate-400">Renews</div>
                  <div className="font-bold text-slate-700">
                    {subscriptionData.subscription.daysRemaining ||
                      subscriptionData.subscription.daysUntilRenewal ||
                      0}{' '}
                    days
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What's Next Card */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700">
                What&apos;s next?
              </h2>
            </div>

            {isCanvasBuild ? (
              <div className="space-y-4">
                {[
                  {
                    icon: Zap,
                    text: 'Start building AI-powered apps instantly with Canvas Build',
                    color: 'from-orange-500 to-red-500',
                  },
                  {
                    icon: MessageSquare,
                    text: 'Use the AI-powered visual canvas builder',
                    color: 'from-blue-500 to-cyan-500',
                  },
                  {
                    icon: LayoutDashboard,
                    text: 'Manage your builds and projects from the Canvas dashboard',
                    color: 'from-purple-500 to-pink-500',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl hover:bg-purple-50/50 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}
                    >
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-slate-600 font-medium">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  {
                    icon: MessageSquare,
                    text: 'Enjoy unlimited conversations with your subscribed agent',
                    color: 'from-blue-500 to-cyan-500',
                  },
                  {
                    icon: LayoutDashboard,
                    text: 'Manage billing or cancel anytime from your dashboard',
                    color: 'from-purple-500 to-pink-500',
                  },
                  {
                    icon: Headphones,
                    text: 'Need help? Visit the support center for quick assistance',
                    color: 'from-orange-500 to-red-500',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl hover:bg-purple-50/50 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}
                    >
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-slate-600 font-medium">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-2xl mx-auto">
          <div className="relative py-14 overflow-hidden rounded-[2rem] themed-section-bg">
            <div className="absolute -top-16 -right-8 w-[140px] h-[400px] rotate-[-25deg] rounded-[80px] bg-gradient-to-b from-white/60 via-violet-300/30 to-transparent backdrop-blur-sm border border-white/40" />
            <div className="absolute -top-20 left-[15%] w-[120px] h-[450px] rotate-[22deg] rounded-[80px] bg-gradient-to-b from-transparent via-purple-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
            <div className="absolute -bottom-24 right-[30%] w-[100px] h-[350px] rotate-[-32deg] rounded-[80px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
            <div className="absolute -bottom-12 -left-6 w-[150px] h-[380px] rotate-[28deg] rounded-[80px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
            <div className="relative z-10 p-8 text-center">
              <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-2">Ready to get started?</h2>
              <p className="text-slate-500 mb-6">
                Jump right in and start using your subscription.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Go to Dashboard
                </Link>
                {isCanvasBuild ? (
                  <a
                    href="https://build.mumtaz.ai/"
                    className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl font-bold bg-white/50 border border-white/60 text-slate-700 hover:bg-white/70 transition-all duration-300 backdrop-blur-sm"
                  >
                    <Sparkles className="w-5 h-5" />
                    Open Canvas Build
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : isGenCraftExperience ? (
                  <a
                    href="https://studio.mumtaz.ai/"
                    className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl font-bold bg-white/50 border border-white/60 text-slate-700 hover:bg-white/70 transition-all duration-300 backdrop-blur-sm"
                  >
                    <Sparkles className="w-5 h-5" />
                    Open GenCraft Pro
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    onClick={handleAgentRedirect}
                    disabled={!agentSlug}
                    className={`inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl font-bold bg-white/50 border border-white/60 text-slate-700 hover:bg-white/70 transition-all duration-300 backdrop-blur-sm ${
                      agentSlug ? '' : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Open Agent Chat
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {!agentSlug && (
          <p className="text-center text-sm text-slate-400 mt-6">
            We couldn&apos;t detect which agent you subscribed to. Please return
            to the dashboard to continue.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              Loading subscription details...
            </h2>
            <p className="text-slate-400">Please wait</p>
          </div>
        </div>
      }
    >
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
