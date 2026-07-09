'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ArticleReference {
  title: string;
  content: string;
  source: string;
}

interface ArticlePopupProps {
  article: ArticleReference;
  onClose: () => void;
}

function ArticlePopup({ article, onClose }: ArticlePopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl border border-neural-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neural-200 bg-neural-50">
          <h3 className="text-xl font-bold text-neural-900">{article.title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-neural-500 hover:text-neural-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-neural-700 whitespace-pre-line leading-relaxed">
            {article.content}
          </div>
          <div className="pt-4 border-t border-neural-200">
            <p className="text-sm text-blue-600 font-medium">
              Source: {article.source}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neural-200 bg-neural-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TermsOfServicePage() {
  const [selectedArticle, setSelectedArticle] =
    useState<ArticleReference | null>(null);

  const articles: Record<string, ArticleReference> = {
    dmca: {
      title: 'DMCA (Digital Millennium Copyright Act)',
      content: `The Digital Millennium Copyright Act (DMCA) is a United States copyright law that implements two 1996 treaties of the World Intellectual Property Organization (WIPO).

Key Provisions:
• Safe harbor provisions for online service providers
• Notice and takedown procedures for copyright infringement
• Anti-circumvention provisions
• Protection for technological measures

Notice Requirements:
To file a DMCA takedown notice, you must provide:
• Physical or electronic signature of copyright owner
• Identification of copyrighted work
• Identification of infringing material
• Contact information
• Statement of good faith belief
• Statement of accuracy under penalty of perjury

Our Compliance:
We respond to valid DMCA notices within 24-48 hours and implement a repeat infringer policy.`,
      source: '17 U.S.C. § 512',
    },
    liability: {
      title: 'Limitation of Liability - Section 230',
      content: `Section 230 of the Communications Decency Act provides immunity from liability for providers and users of interactive computer services who publish information provided by third parties.

Key Points:
• "No provider or user of an interactive computer service shall be treated as the publisher or speaker of any information provided by another information content provider."
• Protection applies to:
  - User-generated content
  - Third-party content
  - Moderation decisions
  - Good faith content filtering

Exceptions:
• Federal criminal law
• Intellectual property law
• Communications privacy law

Application to AI Services:
While AI-generated content is novel, platforms generally retain Section 230 protections for user-directed AI outputs.`,
      source: '47 U.S.C. § 230',
    },
    arbitration: {
      title: 'Arbitration and Class Action Waiver',
      content: `Arbitration is a method of dispute resolution where parties agree to resolve disputes outside of court through a neutral third-party arbitrator.

Key Aspects:
• Binding decision by arbitrator
• Limited grounds for appeal
• Generally faster and less expensive than litigation
• Confidential proceedings

Class Action Waiver:
Users agree to resolve disputes on an individual basis and waive the right to participate in class actions or collective proceedings.

Enforceability:
The Federal Arbitration Act (FAA) generally enforces arbitration agreements. However, some jurisdictions may limit enforceability, particularly for consumer contracts.

Opt-Out:
Many services allow users to opt out of arbitration within a specified period (typically 30 days) by sending written notice.`,
      source: '9 U.S.C. §§ 1-16 (Federal Arbitration Act)',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Last updated: February 18, 2026 • Effective Date: February 18, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="container-custom section-padding max-w-5xl">
        <div className="space-y-12">
          {/* Acceptance */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              1. Acceptance of Terms
            </h2>
            <p className="text-neural-700 leading-relaxed mb-4">
              Welcome to One Last AI. By accessing or using our platform at{' '}
              <a
                href="https://mumtaz.ai"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                mumtaz.ai
              </a>{' '}
              or{' '}
              <a
                href="https://maula.dev"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                maula.dev
              </a>
              , including all sub-applications (Canvas App, Canvas Studio, GenCraft Pro,
              and Maula Editor), you agree to be bound by these Terms of Service
              ("Terms"), our{' '}
              <a
                href="/legal/privacy-policy"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Privacy Policy
              </a>
              ,{' '}
              <a
                href="/legal/cookie-policy"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Cookie Policy
              </a>
              , and all applicable laws and regulations.
            </p>
            <div className="bg-red-50 rounded-xl p-6 border border-red-200 mt-4">
              <div className="flex gap-3">
                <AlertTriangle
                  className="text-red-600 flex-shrink-0 mt-1"
                  size={24}
                />
                <div>
                  <p className="text-neural-900 font-semibold mb-2">
                    Important Notice
                  </p>
                  <p className="text-neural-700">
                    If you do not agree to these Terms, you may not access or
                    use our services. By creating an account or using our
                    platform, you confirm that you are at least 18 years old and
                    have the legal capacity to enter into this agreement.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Service Description */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              2. Service Description
            </h2>
            <p className="text-neural-700 mb-4">
              One Last AI operates a multi-application AI development platform
              across <strong>mumtaz.ai</strong> and <strong>maula.dev</strong>,
              offering <strong>268 AI-powered tools</strong> across <strong>39 categories</strong>.
              Our platform includes the following applications:
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-neural-50 rounded-xl p-5 border border-neural-200">
                <h3 className="font-semibold text-blue-700 mb-2">🧠 Neural Chat &amp; Canvas App</h3>
                <p className="text-neural-600 text-sm mb-1">
                  Real-time AI chat with an in-conversation code overlay ("Canvas")
                  for generating, editing, previewing, and deploying full-stack web
                  applications — React, Next.js, HTML/CSS/JS, and more.
                </p>
                <p className="text-neural-500 text-xs">Accessible at: mumtaz.ai → Neural Chat → Canvas</p>
              </div>
              <div className="bg-neural-50 rounded-xl p-5 border border-neural-200">
                <h3 className="font-semibold text-blue-700 mb-2">🎨 Canvas Studio</h3>
                <p className="text-neural-600 text-sm mb-1">
                  Standalone browser-based IDE with a VS Code–like interface for
                  AI-assisted code generation, multi-file project management, live
                  preview, and one-click deployment to Vercel, Netlify, GitHub, or AWS.
                </p>
                <p className="text-neural-500 text-xs">Stack: React 19 · TypeScript · Vite 6 · Zustand · Monaco Editor</p>
              </div>
              <div className="bg-neural-50 rounded-xl p-5 border border-neural-200">
                <h3 className="font-semibold text-blue-700 mb-2">🎬 GenCraft Pro</h3>
                <p className="text-neural-600 text-sm mb-1">
                  AI creative studio for video generation, image creation,
                  audio synthesis (text-to-speech), and multi-model text completion.
                  All AI processing is handled through One Last AI&apos;s own platform API keys.
                </p>
                <p className="text-neural-500 text-xs">Accessible at: mumtaz.ai → /gen-craft-pro/</p>
              </div>
              <div className="bg-neural-50 rounded-xl p-5 border border-neural-200">
                <h3 className="font-semibold text-blue-700 mb-2">✍️ Maula Editor (maula.dev)</h3>
                <p className="text-neural-600 text-sm mb-1">
                  Lightweight AI code editor focused on fast prototyping. Shares
                  the same backend (268 tools, 39 categories) with the primary
                  platform and uses the same credit system.
                </p>
                <p className="text-neural-500 text-xs">Stack: React 19 · TypeScript · Vite 6 · Zustand · Monaco Editor</p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-neural-900">2.1 AI Provider Network</h3>
            <p className="text-neural-700 mb-3">
              Our services process your prompts and code through the following
              third-party AI providers. <strong>All API calls are made through One Last AI&apos;s own platform API keys</strong> on your behalf —
              you do not need accounts with any AI provider. Each provider has their own data handling policies:
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-neural-100 text-neural-900">
                    <th className="text-left p-3 border border-neural-200 font-semibold">Provider</th>
                    <th className="text-left p-3 border border-neural-200 font-semibold">Models Used</th>
                    <th className="text-left p-3 border border-neural-200 font-semibold">Data Training Policy</th>
                  </tr>
                </thead>
                <tbody className="text-neural-700">
                  <tr><td className="p-3 border border-neural-200">Anthropic</td><td className="p-3 border border-neural-200">Claude Sonnet 4, Opus 4, Haiku</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ Does NOT use API data for training</td></tr>
                  <tr className="bg-neural-50"><td className="p-3 border border-neural-200">OpenAI</td><td className="p-3 border border-neural-200">GPT-4o, GPT-4o Mini, TTS, DALL·E 3</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ API data not used for training (API key tier)</td></tr>
                  <tr><td className="p-3 border border-neural-200">Google</td><td className="p-3 border border-neural-200">Gemini 2.5 Pro, Gemini 2.5 Flash</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ Enterprise Cloud data processing terms</td></tr>
                  <tr className="bg-neural-50"><td className="p-3 border border-neural-200">Mistral AI</td><td className="p-3 border border-neural-200">Mistral Large, Codestral</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ GDPR-compliant; no API training</td></tr>
                  <tr><td className="p-3 border border-neural-200">xAI</td><td className="p-3 border border-neural-200">Grok 3, Grok 3 Mini</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ Enterprise API terms; no training</td></tr>
                  <tr className="bg-neural-50"><td className="p-3 border border-neural-200">Groq</td><td className="p-3 border border-neural-200">LLaMA 3.3 70B (speed-optimized)</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ Inference only; no persistent storage</td></tr>
                  <tr><td className="p-3 border border-neural-200">Cerebras</td><td className="p-3 border border-neural-200">LLaMA 3.3 70B (wafer-scale inference)</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ Inference only; no persistent storage</td></tr>
                  <tr className="bg-neural-50"><td className="p-3 border border-neural-200">HuggingFace</td><td className="p-3 border border-neural-200">Open-source model inference</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ Inference API; enterprise terms</td></tr>
                  <tr><td className="p-3 border border-neural-200">Ollama</td><td className="p-3 border border-neural-200">Local/self-hosted open-source models</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ Runs on our servers; data never leaves our infra</td></tr>
                  <tr className="bg-neural-50"><td className="p-3 border border-neural-200">fal.ai / Minimax</td><td className="p-3 border border-neural-200">Video generation models</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ Processing only; no retention after generation</td></tr>
                  <tr><td className="p-3 border border-neural-200">Azure AI Vision</td><td className="p-3 border border-neural-200">Image-to-code analysis</td><td className="p-3 border border-neural-200 text-green-700 font-medium">✅ Microsoft enterprise DPA; no training</td></tr>
                </tbody>
              </table>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-6">
              <p className="text-green-800 text-sm">
                <strong>⚠️ Important:</strong> We do <strong>not</strong> sell, share, or license your data to any AI provider or third party.
                We do <strong>not</strong> use your data to train, fine-tune, or improve any AI model (ours or third-party).
                No AI provider has access to your email, name, password, credentials, or payment information.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-neural-900">2.2 Credit-Based Billing</h3>
            <p className="text-neural-700 mb-3">
              AI tool usage across our applications is metered via a <strong>credit system</strong>.
              Each AI request consumes credits based on the model, token count, and tool complexity.
              Credit balances, transaction history, and billing records are stored in your account.
              Payments are processed through Stripe (PCI DSS Level 1 compliant) — your card details never touch our servers.
            </p>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-4">
              <h4 className="text-lg font-semibold text-neural-900 mb-3">Credit Packs (One-Time Purchase, No Subscription)</h4>
              <p className="text-neural-700 text-sm mb-3">
                Credits are the universal currency for AI features. <strong>1 credit = $0.10 USD value.</strong>{' '}
                Purchase credit packs and use them as you go — no subscriptions, no auto-renewal, only pay for what you use.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-blue-100 text-neural-900">
                      <th className="text-left p-3 border border-neural-200 font-semibold">Pack</th>
                      <th className="text-left p-3 border border-neural-200 font-semibold">Credits</th>
                      <th className="text-left p-3 border border-neural-200 font-semibold">Bonus</th>
                      <th className="text-left p-3 border border-neural-200 font-semibold">Total</th>
                      <th className="text-left p-3 border border-neural-200 font-semibold">Price (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="text-neural-700">
                    <tr><td className="p-3 border border-neural-200">Starter Pack</td><td className="p-3 border border-neural-200">10</td><td className="p-3 border border-neural-200">—</td><td className="p-3 border border-neural-200">10</td><td className="p-3 border border-neural-200 font-semibold">$5</td></tr>
                    <tr className="bg-neural-50"><td className="p-3 border border-neural-200">Pro Pack</td><td className="p-3 border border-neural-200">50</td><td className="p-3 border border-neural-200">+5</td><td className="p-3 border border-neural-200">55</td><td className="p-3 border border-neural-200 font-semibold">$20</td></tr>
                    <tr><td className="p-3 border border-neural-200">Power Pack</td><td className="p-3 border border-neural-200">100</td><td className="p-3 border border-neural-200">+15</td><td className="p-3 border border-neural-200">115</td><td className="p-3 border border-neural-200 font-semibold">$35</td></tr>
                    <tr className="bg-neural-50"><td className="p-3 border border-neural-200">Enterprise Pack</td><td className="p-3 border border-neural-200">500</td><td className="p-3 border border-neural-200">+100</td><td className="p-3 border border-neural-200">600</td><td className="p-3 border border-neural-200 font-semibold">$150</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-200 mb-4">
              <h4 className="text-lg font-semibold text-neural-900 mb-3">Credit Costs Per AI Action</h4>
              <p className="text-neural-700 text-sm mb-3">
                Actual credit consumption varies based on prompt length, model complexity, and output size. Approximate costs:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-green-100 text-neural-900">
                      <th className="text-left p-3 border border-neural-200 font-semibold">AI Action</th>
                      <th className="text-left p-3 border border-neural-200 font-semibold">Approx. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="text-neural-700">
                    <tr><td className="p-3 border border-neural-200">Chat Message (standard)</td><td className="p-3 border border-neural-200">~0.01–0.15 credits</td></tr>
                    <tr className="bg-neural-50"><td className="p-3 border border-neural-200">Chat Message (advanced / long context)</td><td className="p-3 border border-neural-200">~0.15–0.75 credits</td></tr>
                    <tr><td className="p-3 border border-neural-200">Code Generation (per request)</td><td className="p-3 border border-neural-200">~0.03–0.50 credits</td></tr>
                    <tr className="bg-neural-50"><td className="p-3 border border-neural-200">AI Image Generation (HD)</td><td className="p-3 border border-neural-200">~0.80 credits</td></tr>
                    <tr><td className="p-3 border border-neural-200">AI Video Generation</td><td className="p-3 border border-neural-200">5–8 credits</td></tr>
                    <tr className="bg-neural-50"><td className="p-3 border border-neural-200">Text-to-Speech</td><td className="p-3 border border-neural-200">~0.15 per 1K characters</td></tr>
                    <tr><td className="p-3 border border-neural-200">Image-to-Code Analysis</td><td className="p-3 border border-neural-200">~0.10–0.30 credits</td></tr>
                    <tr className="bg-neural-50"><td className="p-3 border border-neural-200">Web Search &amp; Deep Research</td><td className="p-3 border border-neural-200">~0.05–0.20 credits</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-neural-50 rounded-xl p-6 border border-neural-200 mb-4">
              <h4 className="text-lg font-semibold text-neural-900 mb-3">Credit Policies</h4>
              <ul className="list-disc pl-6 text-neural-700 space-y-2 text-sm">
                <li><strong>Credits never expire.</strong> Purchase once and use at your own pace.</li>
                <li><strong>Each app has its own credit balance.</strong> Credits purchased for Neural Chat can only be used in Neural Chat, credits for Canvas Studio only in Canvas Studio, etc.</li>
                <li><strong>Credits are non-refundable</strong> once purchased. See our No Refund Policy (Section 3.3).</li>
                <li><strong>No subscriptions.</strong> All credit purchases are one-time — no auto-renewal, no recurring charges.</li>
                <li><strong>Minimum purchase:</strong> $5 (Starter Pack with 10 credits).</li>
                <li><strong>Maximum purchase:</strong> Up to $500 worth of credits per transaction.</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 mb-6">
              <h4 className="text-lg font-semibold text-neural-900 mb-3">Apps Using Credit-Based Billing</h4>
              <p className="text-neural-700 text-sm mb-3">
                The following applications use the credit system for AI feature access:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-purple-100 text-neural-900">
                      <th className="text-left p-3 border border-neural-200 font-semibold">Application</th>
                      <th className="text-left p-3 border border-neural-200 font-semibold">Description</th>
                      <th className="text-left p-3 border border-neural-200 font-semibold">Key AI Features</th>
                    </tr>
                  </thead>
                  <tbody className="text-neural-700">
                    <tr><td className="p-3 border border-neural-200 font-medium">Neural Chat</td><td className="p-3 border border-neural-200">AI conversational assistant with 18 personalities</td><td className="p-3 border border-neural-200">Chat, voice calls, TTS, image gen, web search, deep research</td></tr>
                    <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Canvas Studio</td><td className="p-3 border border-neural-200">AI app builder &amp; code generator at apps.mumtaz.ai</td><td className="p-3 border border-neural-200">Code generation, live preview, Sandpack runtime, image-to-code, video gen, deployment</td></tr>
                    <tr><td className="p-3 border border-neural-200 font-medium">GenCraft Pro</td><td className="p-3 border border-neural-200">AI full-stack app builder with dual editors</td><td className="p-3 border border-neural-200">Full app generation, Monaco/CodeMirror editors, 40+ languages, deploy to 5 platforms</td></tr>
                    <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Maula Editor</td><td className="p-3 border border-neural-200">Full cloud IDE at maula.dev with in-browser runtime</td><td className="p-3 border border-neural-200">268 AI tools, AI copilot, terminal, in-browser Node.js, Git, collaboration</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-neural-500 text-xs mt-3">
                Note: GenCraft Pro also offers subscription-based access plans (🎁 50% OFF Welcome Gift: $7/week (was $14), $19/month (was $38), $120/year (was $240)).
                AI Agent access uses per-agent pricing (🎁 50% OFF Welcome Gift: $1/day, $5/week (was $10), $15/month (was $30), $150/year (was $300) per agent).
                The credit system is separate from these subscription/per-agent pricing models.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-neural-900">2.3 Sandbox Code Execution</h3>
            <p className="text-neural-700 mb-3">
              Code generated through Canvas Studio and Canvas App may be executed
              in isolated AWS ECS Fargate sandbox containers. Each session receives
              a dedicated container with no network access to internal systems.
              You are solely responsible for any code you choose to execute or deploy.
            </p>

            <p className="text-neural-500 mt-4 text-sm">
              We reserve the right to modify, suspend, or discontinue any aspect
              of our services at any time without notice.
            </p>
          </section>

          {/* Pricing & Trial */}
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              3. Pricing and $1 Daily Trial
            </h2>

            <div className="bg-white rounded-xl p-6 mb-6 border border-blue-200 shadow-sm">
              <h3 className="text-2xl font-bold text-neural-900 mb-3">
                💵 $1 Daily Trial
              </h3>
              <p className="text-neural-700 mb-4">
                New users can access our platform for just{' '}
                <strong className="text-blue-600">$1.00 USD per day</strong>.
                This low-cost trial gives you full access to:
              </p>
              <ul className="list-disc pl-6 text-neural-700 space-y-2">
                <li>All AI agents and personalities</li>
                <li>Developer tools and network utilities</li>
                <li>Voice interaction features</li>
                <li>Community platform access</li>
                <li>API access (rate-limited)</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  3.1 One-Time Purchase Terms
                </h3>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>Access begins immediately upon payment</li>
                  <li>
                    <strong className="text-neural-900">NO auto-renewal</strong> -
                    you're charged only once per purchase
                  </li>
                  <li>You may cancel access at any time (no refund)</li>
                  <li>Choose from $1/day, <span className="line-through text-neural-400">$10</span> $5/week, <span className="line-through text-neural-400">$30</span> $15/month, or <span className="line-through text-neural-400">$300</span> $150/year per agent — 🎁 50% OFF Welcome Gift</li>
                  <li>
                    Access expires automatically at the end of your chosen
                    period
                  </li>
                  <li>Re-purchase anytime to continue access</li>
                  <li>All prices in USD unless otherwise stated</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  3.2 Payment Methods
                </h3>
                <p className="text-neural-700 mb-2">We accept:</p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li>
                    Credit/Debit cards (Visa, MasterCard, American Express)
                  </li>
                  <li>PayPal</li>
                  <li>Other payment methods as available</li>
                </ul>
              </div>

              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <h3 className="text-xl font-semibold mb-3 text-amber-700">
                  3.3 No Refund Policy
                </h3>
                <p className="text-neural-700 mb-3">
                  <strong className="text-neural-900">
                    All payments are final and non-refundable.
                  </strong>{' '}
                  Given the low-cost nature of our service ($1 per day) and
                  immediate access to platform features, we do not offer refunds
                  for any reason.
                </p>
                <p className="text-neural-700">
                  For detailed refund policy information, see our{' '}
                  <a
                    href="/legal/payments-refunds"
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    Payments & Refunds Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Account Responsibilities */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              4. Account Responsibilities
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  4.1 Account Security
                </h3>
                <p className="text-neural-700 mb-2">You are responsible for:</p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>Maintaining the confidentiality of your password</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of unauthorized access</li>
                  <li>
                    Ensuring your account information is accurate and current
                  </li>
                  <li>
                    Safeguarding any third-party credentials you store on the
                    platform (deploy tokens, API keys, user secrets). While we
                    encrypt these with AES-256-GCM and store them in a separate
                    database table, you remain responsible for the security
                    of your own provider accounts.
                  </li>
                </ul>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mt-4">
                  <h4 className="font-semibold text-blue-800 mb-2">🔒 Security Measures</h4>
                  <p className="text-neural-700 text-sm">
                    Accounts are protected by a three-tier lockout policy:
                    5 failed attempts → 15 min lock, 10 → 24 hr lock, 20 → permanent
                    lock pending manual review. Passwords are hashed with bcrypt/scrypt
                    and never stored in plaintext. Sessions use JWT (HMAC-SHA256)
                    with HTTP-only Secure cookies.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  4.2 Age Requirement
                </h3>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <p className="text-neural-700">
                    You must be at least{' '}
                    <strong className="text-neural-900">18 years old</strong> to
                    create an account and use our services. We do not knowingly
                    collect information from minors.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  4.3 Account Termination
                </h3>
                <p className="text-neural-700">
                  We may suspend or terminate your account if you:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1 mt-2">
                  <li>Violate these Terms of Service</li>
                  <li>Engage in fraudulent or illegal activity</li>
                  <li>Abuse or misuse our services</li>
                  <li>Provide false or misleading information</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              5. Acceptable Use Policy
            </h2>
            <p className="text-neural-700 mb-4">You agree NOT to:</p>

            <div className="space-y-3">
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Use our services for illegal purposes or to violate any
                  laws
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Harass, abuse, threaten, or harm others
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Generate or distribute malicious content, malware, or spam
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Attempt to hack, reverse engineer, or compromise our
                  systems
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Scrape, crawl, or collect data without authorization
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Impersonate others or provide false information
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Share account credentials or resell access
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Generate content that infringes intellectual property
                  rights
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Use services to create deepfakes or misleading content
                  without disclosure
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Deploy malicious, illegal, or resource-abusive code through
                  Canvas Studio, Canvas App, or sandbox execution environments
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Use stored deploy tokens (Vercel, Netlify, GitHub, AWS) to
                  deploy content that violates these Terms or the host platform's
                  terms of service
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Attempt to escape sandbox container isolation or access
                  internal platform infrastructure
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-neural-700">
                  ❌ Overload our systems or interfere with other users' access
                </p>
              </div>
            </div>

            <p className="text-neural-500 mt-4 text-sm">
              Violation of this policy may result in immediate account
              suspension or termination without refund.
            </p>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              6. Intellectual Property Rights
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  6.1 Our IP
                </h3>
                <p className="text-neural-700 mb-2">
                  All platform content, features, and functionality are owned by
                  One Last AI and protected by:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li>Copyright laws</li>
                  <li>Trademark laws</li>
                  <li>Patent laws</li>
                  <li>Trade secret laws</li>
                  <li>Other intellectual property rights</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  6.2 Your Content
                </h3>
                <p className="text-neural-700 mb-2">
                  You retain full ownership of all content you submit. By using our
                  services, you grant us only the minimum rights necessary to operate:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    A worldwide, non-exclusive license to use your content <strong>solely</strong> to
                    provide the requested services to you
                  </li>
                  <li>Right to store, process, and transmit your content for service delivery</li>
                  <li>
                    Right to use <strong>anonymized and aggregated</strong> data for service
                    improvement (analytics, performance optimization only)
                  </li>
                </ul>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200 mt-3">
                  <p className="text-green-800 text-sm">
                    <strong>Absolute guarantees:</strong> We do <strong>not</strong> use your data to train, fine-tune, or improve any AI model.
                    We do <strong>not</strong> sell, license, rent, or share your personal data with any third party for any commercial purpose.
                    We do <strong>not</strong> use your data for advertising, profiling, or behavioral targeting.
                    Your content is yours — we are merely a processor acting on your instructions.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  6.3 AI-Generated Content
                </h3>
                <p className="text-neural-700 mb-2">
                  Content generated by our AI agents:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    You receive a non-exclusive license to use AI-generated
                    outputs for personal and commercial purposes
                  </li>
                  <li>
                    We do not claim ownership of AI-generated content you create
                  </li>
                  <li>
                    You are responsible for ensuring outputs comply with
                    applicable laws
                  </li>
                  <li>
                    We do not guarantee outputs are free from third-party IP
                    claims
                  </li>
                  <li>
                    Code deployed via Canvas Studio or Canvas App to third-party
                    platforms (Vercel, Netlify, GitHub, AWS) is governed by those
                    platforms' terms; you are responsible for compliance
                  </li>
                  <li>
                    AI-generated code executed in sandbox containers is your
                    responsibility — we do not audit or warrant generated code
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  6.4 DMCA Compliance
                </h3>
                <p className="text-neural-700 mb-3">
                  We respect intellectual property rights and comply with the{' '}
                  <button
                    onClick={() => setSelectedArticle(articles.dmca)}
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    Digital Millennium Copyright Act (DMCA)
                  </button>
                  .
                </p>
                <p className="text-neural-700">
                  To file a copyright infringement notice, email:{' '}
                  <a
                    href="mailto:dmca@mumtaz.ai"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    dmca@mumtaz.ai
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* AI-Specific Data Terms */}
          <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              6.5 AI Data Processing Terms
            </h2>

            <div className="bg-white rounded-xl p-6 mb-6 border border-green-200 shadow-sm">
              <h3 className="text-xl font-bold text-neural-900 mb-3">
                🛡️ What We Send to AI Providers
              </h3>
              <p className="text-neural-700 mb-4">
                When you use AI features, we send the following to the relevant
                third-party provider:
              </p>
              <ul className="list-disc pl-6 text-neural-700 space-y-2">
                <li>
                  <strong>Sent:</strong> Your text prompts, code files in the
                  current project, and conversation history
                </li>
                <li>
                  <strong>Never sent:</strong> Your email address, password,
                  stored credentials/deploy tokens, payment information, or
                  personal identifiers
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 mb-6 border border-green-200 shadow-sm">
              <h3 className="text-xl font-bold text-neural-900 mb-3">
                🔒 AI Training &amp; Data Usage Disclosure
              </h3>
              <p className="text-neural-700 mb-3">
                <strong>We do not use your data to train AI models — ever.</strong>{' '}
                Your prompts, code, conversations, and generated outputs are processed <strong>solely</strong> to
                provide the requested service in real time. We do not retain, analyze, aggregate,
                or reprocess your inputs for any purpose other than displaying your conversation history to you.
              </p>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-3">
                <p className="text-red-900 font-semibold mb-2">We Will Never:</p>
                <ul className="list-disc pl-6 text-red-800 text-sm space-y-1">
                  <li>Use your data to train, fine-tune, or improve any AI model (ours or third-party)</li>
                  <li>Sell, license, rent, or share your personal data with any third party for commercial purposes</li>
                  <li>Use your data for advertising, profiling, or cross-context behavioral targeting</li>
                  <li>Aggregate your data with other users&apos; data for model improvement or research</li>
                  <li>Allow any AI provider to use your data for their own training purposes</li>
                </ul>
              </div>
              <p className="text-neural-700 mb-3">
                <strong>All AI calls are made through One Last AI&apos;s own platform API keys.</strong> You never need an account with any AI provider.
                Third-party AI providers may retain API request data per their own policies (typically 30 days or less for abuse monitoring) —
                see their privacy policies and the provider table in Section 2.1 for details.
              </p>
              <p className="text-neural-700">
                Anthropic, our primary provider, does <strong>not</strong> use API data for model training.
                OpenAI does <strong>not</strong> use API key-tier data for training. Groq and Cerebras are inference-only providers
                with no persistent storage. Ollama runs locally on our servers with zero external data transfer.
                We encourage you to review each provider&apos;s data processing terms.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
              <h3 className="text-xl font-bold text-neural-900 mb-3">
                ⚡ Agent Memory System
              </h3>
              <p className="text-neural-700">
                AI agents may store contextual memories (key preferences,
                project context, coding patterns) to improve future
                interactions. These memories are stored server-side in
                PostgreSQL, linked to your account, and deletable at any time.
                Memory data is never shared with other users or used for
                training.
              </p>
            </div>
          </section>

          {/* Disclaimers */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              7. Disclaimers and Limitations
            </h2>

            <div className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <h3 className="text-xl font-semibold mb-3 text-amber-700">
                  7.1 "As Is" Service
                </h3>
                <p className="text-neural-700 mb-2">
                  OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                  WARRANTIES OF ANY KIND, INCLUDING:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li>
                    Accuracy, reliability, or completeness of AI-generated
                    content
                  </li>
                  <li>Uninterrupted or error-free operation</li>
                  <li>Security of data transmission</li>
                  <li>Fitness for a particular purpose</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  7.2 AI Limitations
                </h3>
                <p className="text-neural-700">
                  AI systems may produce inaccurate, biased, or inappropriate
                  outputs. You acknowledge that:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2 mt-2">
                  <li>AI responses may contain errors or hallucinations</li>
                  <li>You should verify important information independently</li>
                  <li>
                    AI should not replace professional advice (legal, medical,
                    financial)
                  </li>
                  <li>
                    We are not responsible for decisions based on AI outputs
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  7.3 Limitation of Liability
                </h3>
                <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                  <p className="text-neural-700 mb-3">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, ONE LAST AI SHALL
                    NOT BE LIABLE FOR:
                  </p>
                  <ul className="list-disc pl-6 text-neural-700 space-y-2">
                    <li>
                      Indirect, incidental, special, consequential, or punitive
                      damages
                    </li>
                    <li>Loss of profits, data, or business opportunities</li>
                    <li>
                      Damages exceeding the amount you paid us in the past 12
                      months
                    </li>
                    <li>Third-party actions or content</li>
                  </ul>
                  <p className="text-neural-700 mt-4">
                    See{' '}
                    <button
                      onClick={() => setSelectedArticle(articles.liability)}
                      className="text-blue-600 hover:text-blue-700 underline font-medium"
                    >
                      Section 230 Protections
                    </button>{' '}
                    for legal framework.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              8. Dispute Resolution
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  8.1 Informal Resolution
                </h3>
                <p className="text-neural-700">
                  Before filing a claim, please contact us at{' '}
                  <a
                    href="mailto:legal@mumtaz.ai"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    legal@mumtaz.ai
                  </a>{' '}
                  to attempt informal resolution.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  8.2 Binding Arbitration
                </h3>
                <p className="text-neural-700 mb-3">
                  Any disputes arising from these Terms or our services shall be
                  resolved through binding{' '}
                  <button
                    onClick={() => setSelectedArticle(articles.arbitration)}
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    arbitration
                  </button>
                  , not in court.
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    Arbitration under American Arbitration Association (AAA)
                    rules
                  </li>
                  <li>Individual basis only (no class actions)</li>
                  <li>Conducted remotely or in your jurisdiction</li>
                  <li>You may opt out within 30 days by written notice</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  8.3 Governing Law
                </h3>
                <p className="text-neural-700 mb-3">
                  These Terms are governed by the laws of the State of California,
                  United States, without regard to conflict of law principles.
                </p>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mt-3">
                  <h4 className="text-sm font-semibold text-neural-900 mb-2">Regional Jurisdiction Notes</h4>
                  <ul className="list-disc pl-6 text-neural-700 space-y-2 text-sm">
                    <li>
                      <strong>Thailand:</strong> Nothing in these Terms limits your rights under the
                      Personal Data Protection Act B.E. 2562 (2019). Data protection-related claims may
                      be brought before the competent Thai courts or the Personal Data Protection Committee (PDPC)
                      as permitted by applicable law.
                    </li>
                    <li>
                      <strong>Singapore:</strong> Nothing in these Terms limits your rights under Singapore&apos;s
                      Personal Data Protection Act 2012. You may lodge data protection complaints with the
                      Personal Data Protection Commission (PDPC) of Singapore regardless of the governing law clause.
                    </li>
                    <li>
                      <strong>United Arab Emirates:</strong> Nothing in these Terms limits your rights under the
                      UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data. Data protection
                      matters may be referred to the UAE Data Office. Consumer claims may be subject to UAE courts
                      where mandatory local consumer protection laws apply.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              9. Changes to Terms
            </h2>
            <p className="text-neural-700 mb-3">
              We may update these Terms periodically. Significant changes will
              be communicated via:
            </p>
            <ul className="list-disc pl-6 text-neural-700 space-y-2">
              <li>Email notification</li>
              <li>Prominent platform notice</li>
              <li>Updated "Last Modified" date</li>
            </ul>
            <p className="text-neural-700 mt-4">
              Continued use after changes constitutes acceptance of updated
              Terms.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-white">
              10. Contact Information
            </h2>
            <div className="space-y-3 text-blue-100">
              <p>
                <strong className="text-white">
                  One Last AI Legal Department
                </strong>
              </p>
              <p>
                Legal:{' '}
                <a
                  href="mailto:legal@mumtaz.ai"
                  className="text-white hover:text-blue-200 underline"
                >
                  legal@mumtaz.ai
                </a>
              </p>
              <p>
                Privacy:{' '}
                <a
                  href="mailto:privacy@mumtaz.ai"
                  className="text-white hover:text-blue-200 underline"
                >
                  privacy@mumtaz.ai
                </a>
              </p>
              <p>
                Data Protection Officer:{' '}
                <a
                  href="mailto:dpo@mumtaz.ai"
                  className="text-white hover:text-blue-200 underline"
                >
                  dpo@mumtaz.ai
                </a>
              </p>
              <p>
                Support:{' '}
                <a
                  href="mailto:support@mumtaz.ai"
                  className="text-white hover:text-blue-200 underline"
                >
                  support@mumtaz.ai
                </a>
              </p>
              <p>
                DMCA:{' '}
                <a
                  href="mailto:dmca@mumtaz.ai"
                  className="text-white hover:text-blue-200 underline"
                >
                  dmca@mumtaz.ai
                </a>
              </p>
              <p>
                Websites:{' '}
                <a
                  href="https://mumtaz.ai"
                  className="text-white hover:text-blue-200 underline"
                >
                  mumtaz.ai
                </a>
                {' '}•{' '}
                <a
                  href="https://maula.dev"
                  className="text-white hover:text-blue-200 underline"
                >
                  maula.dev
                </a>
              </p>

              <div className="mt-6 pt-6 border-t border-white/20 space-y-3">
                <p className="text-sm text-blue-100">
                  <strong className="text-white">Thailand PDPA:</strong>{' '}
                  <a href="mailto:pdpa-th@mumtaz.ai" className="text-white underline">pdpa-th@mumtaz.ai</a>
                </p>
                <p className="text-sm text-blue-100">
                  <strong className="text-white">Singapore PDPA:</strong>{' '}
                  <a href="mailto:pdpa-sg@mumtaz.ai" className="text-white underline">pdpa-sg@mumtaz.ai</a>
                </p>
                <p className="text-sm text-blue-100">
                  <strong className="text-white">UAE PDPL:</strong>{' '}
                  <a href="mailto:pdpl-uae@mumtaz.ai" className="text-white underline">pdpl-uae@mumtaz.ai</a>
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════ SecureTrace Terms ═══════════════════ */}
          <section id="securetrace-terms" className="scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 text-neural-900">
              SecureTrace Device Protection — Terms
            </h2>
            <p className="text-neural-700 mb-6 text-sm">
              These terms govern your use of the SecureTrace feature and apply in addition to
              the general Terms of Service above.
            </p>

            <div className="space-y-5 text-sm text-neural-700">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">Consent to Tracking</h3>
                <p>
                  By registering your device (clicking &quot;Register Device&quot; in the opt-in popup), you
                  explicitly consent to storing a hashed fingerprint of your device. <strong>No location
                  data is collected at this stage.</strong>
                </p>
                <p className="mt-2">
                  Location tracking only begins after all three of the following conditions are met:
                </p>
                <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                  <li>You file a lost-device report and provide identity verification.</li>
                  <li>A member of our security team verifies your ownership claim.</li>
                  <li>Our security team <strong>manually</strong> activates tracking for your device.</li>
                </ol>
                <p className="mt-2">
                  You may revoke consent at any time by clearing your device token from local storage
                  or contacting support at{' '}
                  <a href="mailto:privacy@mumtaz.ai" className="text-blue-600 underline">privacy@mumtaz.ai</a>.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">Lost-Device Report &amp; Verification</h3>
                <p>
                  To trigger tracking on a registered device, you must submit a lost-device report
                  that includes: your full name, email address, phone number, a government-issued ID
                  type and reference number (stored as a one-way hash — never in plain text), and a
                  description of the theft or loss incident. You may also attach purchase proof.
                  Submitting false information in a lost-device report is prohibited and may result
                  in permanent account suspension and referral to law enforcement.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">One-Device License</h3>
                <p>
                  Each device may only be registered once with SecureTrace. The registration fingerprint
                  is hashed and cannot be reversed. If you replace your device, contact support to
                  transfer the registration. Attempting to circumvent the one-device restriction
                  may result in account suspension.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">Remote Commands</h3>
                <p>
                  When you mark a device as lost, you may issue remote commands including: triggering
                  an audible alarm, capturing a photo from the device camera, requesting an immediate
                  location ping, and locking the screen. You agree to use these commands solely for
                  device recovery purposes. Misuse (e.g., unauthorized surveillance of another person&apos;s
                  device) is strictly prohibited and may result in civil or criminal liability.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">Location Unlock Payment</h3>
                <p>
                  Precise GPS coordinates are protected behind a one-time payment. Payments are
                  non-refundable once location data has been viewed. All payment processing is
                  handled by Stripe, Inc. and subject to Stripe&apos;s terms of service. We do not
                  store card numbers or CVV data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">Limitation of Liability</h3>
                <p>
                  SecureTrace is provided as a supplementary recovery tool. We do not guarantee that
                  a lost device will be recovered using this service. We are not liable for any loss,
                  damage, or injury arising from: inability to retrieve device location; delayed GPS
                  updates; failed remote commands; or law enforcement inaction. Use of this service
                  does not replace appropriate physical security measures.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">Legal Compliance</h3>
                <p>
                  You represent and warrant that you are the lawful owner of the device being registered,
                  or have express written consent of the owner. Installing SecureTrace on a device
                  without the owner&apos;s full informed consent may violate applicable wiretapping, computer
                  fraud, or privacy laws in your jurisdiction. You bear full legal responsibility for
                  lawful use of this service.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Article Popup */}
      {selectedArticle && (
        <ArticlePopup
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}
