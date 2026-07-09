'use client';

import { useState } from 'react';
import { X, Cookie, Settings, Shield, Eye } from 'lucide-react';
import { openCookiePreferences } from '@/components/CookieConsentBanner';

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

export default function CookiePolicyPage() {
  const [selectedArticle, setSelectedArticle] =
    useState<ArticleReference | null>(null);

  const articles: Record<string, ArticleReference> = {
    ePrivacy: {
      title: 'ePrivacy Directive (Cookie Law)',
      content: `The ePrivacy Directive (2002/58/EC), often called the "Cookie Law," regulates the use of cookies and similar tracking technologies in the European Union.

Key Requirements:
• Prior informed consent required for non-essential cookies
• Clear and comprehensive information about cookie use
• Users must be able to refuse cookies
• Consent must be freely given, specific, informed, and unambiguous

Cookie Categories:
1. Strictly Necessary: No consent required (essential for site operation)
2. Performance/Analytics: Consent required (track usage patterns)
3. Functional: Consent required (remember preferences)
4. Targeting/Advertising: Consent required (personalized ads)

Penalties:
Non-compliance can result in fines up to €20 million or 4% of global annual revenue under GDPR enforcement.`,
      source: 'Directive 2002/58/EC (as amended by Directive 2009/136/EC)',
    },
    ccpaOptOut: {
      title: 'CCPA Cookie Opt-Out Rights',
      content: `The California Consumer Privacy Act (CCPA) provides specific rights regarding cookies and tracking technologies.

Consumer Rights:
• Right to know what personal information is collected via cookies
• Right to know if personal information is sold or shared
• Right to opt-out of the sale of personal information
• Right to non-discrimination for exercising privacy rights

"Do Not Sell My Personal Information" Link:
Businesses must provide a clear and conspicuous link on their homepage titled "Do Not Sell My Personal Information" that enables consumers to opt-out of the sale of their data.

Cookie Disclosure Requirements:
• Disclose categories of personal information collected via cookies
• Disclose third parties with whom information is shared
• Provide opt-out mechanisms for non-essential cookies
• Honor Global Privacy Control (GPC) signals

Enforcement:
The California Privacy Protection Agency (CPPA) can impose fines of up to $7,500 per intentional violation.`,
      source: 'California Civil Code § 1798.100 et seq.',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Last updated: February 18, 2026 • Effective Date: February 18, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="container-custom section-padding max-w-5xl">
        <div className="space-y-12">
          {/* Introduction */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <Cookie className="text-blue-600 flex-shrink-0 mt-1" size={36} />
              <div>
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  1. Introduction
                </h2>
                <p className="text-neural-700 leading-relaxed mb-4">
                  This Cookie Policy explains how One Last AI ("we," "our," or
                  "us") uses cookies and similar tracking technologies on our
                  websites at{' '}
                  <a
                    href="https://onelastai.co"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    onelastai.co
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://maula.dev"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    maula.dev
                  </a>
                  , including all sub-applications (Canvas App, Canvas Studio,
                  GenCraft Pro, and Maula Editor).
                </p>
                <p className="text-neural-700 leading-relaxed">
                  By using our website, you consent to our use of cookies in
                  accordance with this policy and our{' '}
                  <a
                    href="/legal/privacy-policy"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Privacy Policy
                  </a>
                  . You can manage your cookie preferences at any time.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mt-6">
              <p className="text-neural-700">
                <strong className="text-neural-900">Legal Framework:</strong> Our
                cookie practices comply with the{' '}
                <button
                  onClick={() => setSelectedArticle(articles.ePrivacy)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  ePrivacy Directive (EU Cookie Law)
                </button>
                , GDPR,{' '}
                <button
                  onClick={() => setSelectedArticle(articles.ccpaOptOut)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  CCPA requirements
                </button>
                , Thailand&apos;s Personal Data Protection Act (PDPA B.E. 2562),
                Singapore&apos;s Personal Data Protection Act 2012, and the
                UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL).
              </p>
            </div>
          </section>

          {/* What Are Cookies */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              2. What Are Cookies?
            </h2>
            <p className="text-neural-700 mb-4">
              Cookies are small text files stored on your device when you visit
              a website. They help websites:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                <p className="font-semibold text-blue-700 mb-2">
                  📝 Remember You
                </p>
                <p className="text-neural-600 text-sm">
                  Store login status and preferences
                </p>
              </div>
              <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                <p className="font-semibold text-blue-700 mb-2">
                  📊 Analyze Usage
                </p>
                <p className="text-neural-600 text-sm">
                  Track how visitors use the site
                </p>
              </div>
              <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                <p className="font-semibold text-blue-700 mb-2">
                  ⚡ Improve Performance
                </p>
                <p className="text-neural-600 text-sm">
                  Optimize loading times and functionality
                </p>
              </div>
              <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                <p className="font-semibold text-blue-700 mb-2">
                  🎯 Personalize Experience
                </p>
                <p className="text-neural-600 text-sm">
                  Customize content and features
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  Cookie Types by Duration
                </h3>
                <div className="space-y-3">
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      Session Cookies
                    </p>
                    <p className="text-neural-600 text-sm">
                      Temporary cookies deleted when you close your browser.
                      Used for essential site functions.
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      Persistent Cookies
                    </p>
                    <p className="text-neural-600 text-sm">
                      Remain on your device until expiration or manual deletion.
                      Remember preferences between visits.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  Cookie Types by Source
                </h3>
                <div className="space-y-3">
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      First-Party Cookies
                    </p>
                    <p className="text-neural-600 text-sm">
                      Set by One Last AI directly. We have full control over
                      these cookies.
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      Third-Party Cookies
                    </p>
                    <p className="text-neural-600 text-sm">
                      Set by external services (e.g., Stripe for payment
                      processing). We do <strong>not</strong> use third-party
                      tracking cookies such as Google Analytics or Facebook Pixel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cookies We Use */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              3. Cookies We Use
            </h2>

            <div className="space-y-6">
              {/* Strictly Necessary */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-start gap-3 mb-4">
                  <Shield
                    className="text-green-600 flex-shrink-0 mt-1"
                    size={28}
                  />
                  <div>
                    <h3 className="text-xl font-bold text-neural-900 mb-2">
                      3.1 Strictly Necessary Cookies
                    </h3>
                    <p className="text-neural-600 text-sm">
                      These cookies are essential for the website to function.
                      We do not need your consent for these.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100">
                      <tr className="border-b border-green-200">
                        <th className="text-left p-3 text-neural-900">
                          Cookie Name
                        </th>
                        <th className="text-left p-3 text-neural-900">Purpose</th>
                        <th className="text-left p-3 text-neural-900">Attributes</th>
                        <th className="text-left p-3 text-neural-900">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr className="border-b border-green-100">
                        <td className="p-3 font-mono text-xs">neural_link_session</td>
                        <td className="p-3">Primary JWT authentication token</td>
                        <td className="p-3 text-xs">HTTP-only, Secure, SameSite=Lax</td>
                        <td className="p-3">7 days</td>
                      </tr>
                      <tr className="border-b border-green-100">
                        <td className="p-3 font-mono text-xs">neural_token</td>
                        <td className="p-3">Backup authentication token</td>
                        <td className="p-3 text-xs">HTTP-only, Secure</td>
                        <td className="p-3">Session</td>
                      </tr>
                      <tr className="border-b border-green-100">
                        <td className="p-3 font-mono text-xs">session_id / sessionId</td>
                        <td className="p-3">Session linking for analytics &amp; tracking</td>
                        <td className="p-3 text-xs">HTTP-only</td>
                        <td className="p-3">Session</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">
                          cookie_consent
                        </td>
                        <td className="p-3">Stores your cookie preferences</td>
                        <td className="p-3 text-xs">Standard</td>
                        <td className="p-3">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Performance/Analytics */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start gap-3 mb-4">
                  <Eye className="text-blue-600 flex-shrink-0 mt-1" size={28} />
                  <div>
                    <h3 className="text-xl font-bold text-neural-900 mb-2">
                      3.2 Performance & Analytics Cookies
                    </h3>
                    <p className="text-neural-600 text-sm">
                      Help us understand how visitors use our site. We need your
                      consent for these.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-neural-900 mb-2">
                      Self-Hosted Analytics
                    </h4>
                    <p className="text-neural-600 text-sm mb-3">
                      We use our own self-hosted analytics system to track page
                      views, visitor sessions, and performance metrics.
                      <strong> We do not use Google Analytics, Facebook Pixel,
                      or any third-party tracking tools.</strong>
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-blue-100">
                          <tr className="border-b border-blue-200">
                            <th className="text-left p-2 text-neural-900">Data Collected</th>
                            <th className="text-left p-2 text-neural-900">
                              Purpose
                            </th>
                            <th className="text-left p-2 text-neural-900">
                              Retention
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-neural-700">
                          <tr className="border-b border-blue-100">
                            <td className="p-2">Page views &amp; URL paths</td>
                            <td className="p-2">
                              Understand which features are used
                            </td>
                            <td className="p-2">1 year</td>
                          </tr>
                          <tr className="border-b border-blue-100">
                            <td className="p-2">Visitor sessions (via session_id cookie)</td>
                            <td className="p-2">
                              Group page views into sessions
                            </td>
                            <td className="p-2">1 year</td>
                          </tr>
                          <tr className="border-b border-blue-100">
                            <td className="p-2">UTM parameters</td>
                            <td className="p-2">
                              Track marketing campaign effectiveness
                            </td>
                            <td className="p-2">1 year</td>
                          </tr>
                          <tr>
                            <td className="p-2">Device type &amp; browser</td>
                            <td className="p-2">Optimize for popular platforms</td>
                            <td className="p-2">1 year</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-neural-500 text-xs mt-3">
                      All analytics data is stored server-side in our PostgreSQL
                      database. No data is sent to third-party analytics services.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-neural-900 mb-2">
                      AI Usage Metrics
                    </h4>
                    <p className="text-neural-600 text-sm mb-3">
                      We track AI tool usage for credit billing and service
                      optimization. These are server-side metrics, not cookies.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-blue-100">
                          <tr className="border-b border-blue-200">
                            <th className="text-left p-2 text-neural-900">Metric</th>
                            <th className="text-left p-2 text-neural-900">
                              Purpose
                            </th>
                            <th className="text-left p-2 text-neural-900">
                              Retention
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-neural-700">
                          <tr className="border-b border-blue-100">
                            <td className="p-2">Token counts &amp; model used</td>
                            <td className="p-2">Credit billing calculation</td>
                            <td className="p-2">2 years</td>
                          </tr>
                          <tr>
                            <td className="p-2">Response latency</td>
                            <td className="p-2">Performance optimization</td>
                            <td className="p-2">2 years</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-start gap-3 mb-4">
                  <Settings
                    className="text-purple-600 flex-shrink-0 mt-1"
                    size={28}
                  />
                  <div>
                    <h3 className="text-xl font-bold text-neural-900 mb-2">
                      3.3 Functional Cookies
                    </h3>
                    <p className="text-neural-600 text-sm">
                      Remember your preferences and provide enhanced features.
                      Consent required.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-purple-100">
                      <tr className="border-b border-purple-200">
                        <th className="text-left p-3 text-neural-900">
                          Cookie Name
                        </th>
                        <th className="text-left p-3 text-neural-900">Purpose</th>
                        <th className="text-left p-3 text-neural-900">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr className="border-b border-purple-100">
                        <td className="p-3 font-mono text-xs">
                          theme_preference
                        </td>
                        <td className="p-3">
                          Remembers dark/light mode choice
                        </td>
                        <td className="p-3">1 year</td>
                      </tr>
                      <tr className="border-b border-purple-100">
                        <td className="p-3 font-mono text-xs">language</td>
                        <td className="p-3">Stores preferred language</td>
                        <td className="p-3">1 year</td>
                      </tr>
                      <tr className="border-b border-purple-100">
                        <td className="p-3 font-mono text-xs">
                          agent_preferences
                        </td>
                        <td className="p-3">Saves favorite AI agents</td>
                        <td className="p-3">6 months</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">
                          voice_settings
                        </td>
                        <td className="p-3">
                          Remembers voice interaction preferences
                        </td>
                        <td className="p-3">6 months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              4. Third-Party Services
            </h2>
            <p className="text-neural-700 mb-4">
              We integrate the following third-party services that may set
              cookies or process data on our behalf:
            </p>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-6">
              <p className="text-green-900 font-semibold mb-1">✅ No Third-Party Tracking Cookies</p>
              <p className="text-green-800 text-sm">
                We do <strong>not</strong> use Google Analytics, Facebook Pixel,
                or any third-party tracking/advertising cookies. All analytics
                are self-hosted.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-neural-50 rounded-xl p-6 border border-neural-200">
                <h3 className="text-lg font-semibold text-neural-900 mb-3">
                  Stripe (Payment Processing)
                </h3>
                <p className="text-neural-600 text-sm mb-2">
                  PCI DSS Level 1 compliant payment processor. Stripe may set
                  its own cookies for fraud detection during checkout. Your card
                  details never touch our servers.
                </p>
                <p className="text-neural-500 text-xs">
                  Privacy Policy:{' '}
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    stripe.com/privacy
                  </a>
                </p>
              </div>

              <div className="bg-neural-50 rounded-xl p-6 border border-neural-200">
                <h3 className="text-lg font-semibold text-neural-900 mb-3">
                  AI Model Providers
                </h3>
                <p className="text-neural-600 text-sm mb-2">
                  All AI API calls are made through <strong>One Last AI&apos;s own platform API keys</strong> on your behalf —
                  you never need accounts with any AI provider. Our AI providers process API requests
                  server-to-server; they do <strong>not</strong> set cookies in your browser.
                  Your prompts and code context are sent via encrypted API calls.
                </p>
                <p className="text-neural-600 text-sm mb-2">
                  <strong>Providers:</strong> Anthropic (Claude), OpenAI (GPT-4o, TTS, DALL·E), Google (Gemini),
                  Mistral AI (Codestral), xAI (Grok), Groq (LLaMA), Cerebras (LLaMA), HuggingFace (open-source models),
                  Ollama (local/self-hosted), fal.ai / Minimax (video generation), Azure AI Vision (image analysis).
                </p>
                <p className="text-neural-600 text-sm mb-2">
                  <strong>Data protection:</strong> We do <strong>not</strong> sell, share, or license your data to any AI provider
                  or third party. We do <strong>not</strong> use your data to train, fine-tune, or improve any AI model.
                  No AI provider has access to your email, name, password, credentials, or payment information.
                  Anthropic (our primary provider) and all API-tier providers do <strong>not</strong> use API request data for model training.
                </p>
              </div>

              <div className="bg-neural-50 rounded-xl p-6 border border-neural-200">
                <h3 className="text-lg font-semibold text-neural-900 mb-3">
                  AWS S3 (File Storage)
                </h3>
                <p className="text-neural-600 text-sm mb-2">
                  Generated files (project archives, images, videos) are stored
                  on AWS S3 with AES-256 server-side encryption (SSE-S3).
                  Files are accessed via signed URLs with short expiration times;
                  no cookies are set.
                </p>
              </div>

              <div className="bg-neural-50 rounded-xl p-6 border border-neural-200">
                <h3 className="text-lg font-semibold text-neural-900 mb-3">
                  Deployment Platforms (User-Initiated)
                </h3>
                <p className="text-neural-600 text-sm mb-2">
                  When you deploy projects to Vercel, Netlify, GitHub, or AWS
                  using your own credentials, those platforms set their own
                  cookies governed by their policies. This is user-initiated and
                  optional.
                </p>
              </div>
            </div>
          </section>

          {/* localStorage & Client-Side Storage */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              5. Local Storage &amp; Client-Side Data
            </h2>
            <p className="text-neural-700 mb-4">
              In addition to cookies, our sub-applications use browser{' '}
              <strong>localStorage</strong> to store non-sensitive preferences
              and session data. This data never leaves your browser and is not
              transmitted to our servers.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-neural-100 text-neural-900">
                    <th className="text-left p-3 border border-neural-200 font-semibold">Key</th>
                    <th className="text-left p-3 border border-neural-200 font-semibold">Application</th>
                    <th className="text-left p-3 border border-neural-200 font-semibold">Data Stored</th>
                    <th className="text-left p-3 border border-neural-200 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-neural-700">
                  <tr>
                    <td className="p-3 border border-neural-200 font-mono text-xs">onelastai_user_id</td>
                    <td className="p-3 border border-neural-200">All apps</td>
                    <td className="p-3 border border-neural-200">UUID string</td>
                    <td className="p-3 border border-neural-200">Link anonymous analytics</td>
                  </tr>
                  <tr className="bg-neural-50">
                    <td className="p-3 border border-neural-200 font-mono text-xs">canvas_studio_usage</td>
                    <td className="p-3 border border-neural-200">Canvas Studio</td>
                    <td className="p-3 border border-neural-200">Usage counter</td>
                    <td className="p-3 border border-neural-200">Track free-tier usage limit</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-neural-200 font-mono text-xs">canvas_studio_model</td>
                    <td className="p-3 border border-neural-200">Canvas Studio</td>
                    <td className="p-3 border border-neural-200">Model name string</td>
                    <td className="p-3 border border-neural-200">Remember preferred AI model</td>
                  </tr>
                  <tr className="bg-neural-50">
                    <td className="p-3 border border-neural-200 font-mono text-xs">canvas_studio_provider</td>
                    <td className="p-3 border border-neural-200">Canvas Studio</td>
                    <td className="p-3 border border-neural-200">Provider name string</td>
                    <td className="p-3 border border-neural-200">Remember preferred AI provider</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-neural-200 font-mono text-xs">canvas_dark_mode</td>
                    <td className="p-3 border border-neural-200">Canvas Studio</td>
                    <td className="p-3 border border-neural-200">Boolean</td>
                    <td className="p-3 border border-neural-200">Theme preference</td>
                  </tr>
                  <tr className="bg-neural-50">
                    <td className="p-3 border border-neural-200 font-mono text-xs">gencraft_v4_history</td>
                    <td className="p-3 border border-neural-200">GenCraft Pro</td>
                    <td className="p-3 border border-neural-200">JSON array of past prompts</td>
                    <td className="p-3 border border-neural-200">Prompt history for quick reuse</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-neural-200 font-mono text-xs">userEmail</td>
                    <td className="p-3 border border-neural-200">All apps</td>
                    <td className="p-3 border border-neural-200">Email string</td>
                    <td className="p-3 border border-neural-200">Pre-fill login forms</td>
                  </tr>
                  <tr className="bg-neural-50">
                    <td className="p-3 border border-neural-200 font-mono text-xs">auth_token</td>
                    <td className="p-3 border border-neural-200">All apps</td>
                    <td className="p-3 border border-neural-200">JWT string</td>
                    <td className="p-3 border border-neural-200">Client-side auth state</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mt-4">
              <p className="text-neural-700 text-sm">
                <strong className="text-neural-900">How to clear:</strong> You
                can clear localStorage at any time via your browser's Developer
                Tools (Application → Local Storage → Clear) or by clearing all
                site data in your browser settings. Clearing localStorage will
                reset your preferences but will not affect your server-side
                account data.
              </p>
            </div>
          </section>

          {/* Regional Cookie Compliance */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              6. Regional Cookie Compliance
            </h2>
            <p className="text-neural-700 mb-6">
              In addition to EU/EEA and California cookie regulations, the following regional data protection
              laws impose specific requirements on how cookies and similar technologies are used:
            </p>

            <div className="space-y-6">
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-neural-900 mb-3">
                  🇹🇭 Thailand — PDPA (B.E. 2562 / 2019)
                </h3>
                <p className="text-neural-600 text-sm mb-2">
                  Under Thailand&apos;s PDPA, cookies that collect personal data require a lawful basis.
                  We rely on <strong>consent</strong> for non-essential cookies (analytics, functional) and
                  <strong> legitimate interest / contract performance</strong> for strictly necessary cookies
                  (authentication, security). Thai users may withdraw consent for non-essential cookies at
                  any time via our cookie preference settings without affecting the lawfulness of prior processing.
                </p>
                <p className="text-neural-500 text-xs">
                  Supervisory Authority: Personal Data Protection Committee (PDPC) —{' '}
                  <a href="https://www.pdpc.or.th" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">www.pdpc.or.th</a>
                </p>
              </div>

              <div className="bg-teal-50 rounded-xl p-6 border border-teal-200">
                <h3 className="text-lg font-semibold text-neural-900 mb-3">
                  🇸🇬 Singapore — PDPA (2012, amended 2020)
                </h3>
                <p className="text-neural-600 text-sm mb-2">
                  Singapore&apos;s PDPA requires organizations to obtain consent before collecting personal
                  data, including data collected via cookies. We provide clear notification of our cookie
                  purposes and obtain consent for non-essential cookies. Singapore users may withdraw
                  consent by adjusting cookie preferences. We comply with the PDPC&apos;s Advisory Guidelines
                  on the PDPA for websites.
                </p>
                <p className="text-neural-500 text-xs">
                  Supervisory Authority: Personal Data Protection Commission (PDPC) —{' '}
                  <a href="https://www.pdpc.gov.sg" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">www.pdpc.gov.sg</a>
                </p>
              </div>

              <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                <h3 className="text-lg font-semibold text-neural-900 mb-3">
                  🇦🇪 United Arab Emirates — PDPL (Federal Decree-Law No. 45 of 2021)
                </h3>
                <p className="text-neural-600 text-sm mb-2">
                  The UAE PDPL requires that personal data processing (including via cookies) has a lawful
                  basis. We rely on <strong>consent</strong> for non-essential cookies and{' '}
                  <strong>contract performance / legitimate interest</strong> for strictly necessary cookies.
                  UAE users may withdraw consent for non-essential cookies at any time. We ensure that any
                  cookie-related data transfers outside the UAE comply with Article 22 cross-border transfer
                  requirements.
                </p>
                <p className="text-neural-500 text-xs">
                  Supervisory Authority: UAE Data Office — established under the Executive Regulations
                </p>
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              7. Managing Your Cookie Preferences
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  7.1 Cookie Settings on Our Site
                </h3>
                <p className="text-neural-700 mb-3">
                  You can manage your cookie preferences at any time:
                </p>
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <button
                    onClick={() => openCookiePreferences()}
                    className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Open Cookie Preferences
                  </button>
                  <p className="text-neural-600 text-sm mt-3">
                    Adjust settings for analytics, functional, and other
                    non-essential cookies
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  7.2 Browser Settings
                </h3>
                <p className="text-neural-700 mb-3">
                  Most browsers allow you to control cookies through settings:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-neural-50 rounded-lg p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      Google Chrome
                    </p>
                    <p className="text-neural-600 text-sm">
                      Settings → Privacy and Security → Cookies
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-lg p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      Mozilla Firefox
                    </p>
                    <p className="text-neural-600 text-sm">
                      Options → Privacy & Security → Cookies
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-lg p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">Safari</p>
                    <p className="text-neural-600 text-sm">
                      Preferences → Privacy → Cookies
                    </p>
                  </div>
                  <div className="bg-neural-50 rounded-lg p-4 border border-neural-200">
                    <p className="font-semibold text-neural-900 mb-2">
                      Microsoft Edge
                    </p>
                    <p className="text-neural-600 text-sm">
                      Settings → Privacy → Cookies
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  7.3 Opt-Out Tools
                </h3>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    <strong className="text-neural-900">Do Not Track (DNT):</strong>{' '}
                    Our platform does <strong>not</strong> currently respond to
                    DNT browser signals, as there is no industry-wide standard
                    for compliance.
                  </li>
                  <li>
                    <strong className="text-neural-900">
                      Global Privacy Control (GPC):
                    </strong>{' '}
                    <a
                      href="https://globalprivacycontrol.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Learn more
                    </a>
                  </li>
                  <li>
                    <strong className="text-neural-900">Browser Settings:</strong>{' '}
                    Use your browser's built-in cookie management to block or
                    delete cookies (see Section 7.2 above)
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <p className="text-neural-700">
                  <strong className="text-neural-900">Important:</strong> Blocking
                  strictly necessary cookies may prevent you from using
                  essential features of our platform, including login and
                  account management.
                </p>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              8. Updates to This Policy
            </h2>
            <p className="text-neural-700">
              We may update this Cookie Policy from time to time to reflect
              changes in our practices or for legal compliance. Updates will be
              posted on this page with a new "Last Updated" date. Significant
              changes will be communicated via email or platform notification.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-white">
              9. Contact Us About Cookies
            </h2>
            <div className="space-y-3 text-blue-100">
              <p>
                <strong className="text-white">Cookie Questions:</strong>
              </p>
              <p>
                Privacy:{' '}
                <a
                  href="mailto:privacy@onelastai.co"
                  className="text-white hover:text-blue-200 underline"
                >
                  privacy@onelastai.co
                </a>
              </p>
              <p>
                Data Protection Officer:{' '}
                <a
                  href="mailto:dpo@onelastai.co"
                  className="text-white hover:text-blue-200 underline"
                >
                  dpo@onelastai.co
                </a>
              </p>
              <p>
                Support:{' '}
                <a
                  href="mailto:support@onelastai.co"
                  className="text-white hover:text-blue-200 underline"
                >
                  support@onelastai.co
                </a>
              </p>
              <p>
                Websites:{' '}
                <a
                  href="https://onelastai.co"
                  className="text-white hover:text-blue-200 underline"
                >
                  onelastai.co
                </a>
                {' '}•{' '}
                <a
                  href="https://maula.dev"
                  className="text-white hover:text-blue-200 underline"
                >
                  maula.dev
                </a>
              </p>
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
