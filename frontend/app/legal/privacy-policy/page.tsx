'use client';

import { useState } from 'react';
import { X, Shield, Scale, Globe, AlertTriangle } from 'lucide-react';

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

/* ─────────────────────────── Compliance Badge ─────────────────────────── */
function ComplianceBadge({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}
    >
      <Icon size={14} />
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

export default function PrivacyPolicyPage() {
  const [selectedArticle, setSelectedArticle] =
    useState<ArticleReference | null>(null);

  /* ─── Article Reference Popups ─── */
  const articles: Record<string, ArticleReference> = {
    gdpr: {
      title: 'GDPR (General Data Protection Regulation)',
      content: `The General Data Protection Regulation (EU) 2016/679 is a regulation in EU law on data protection and privacy in the European Union and the European Economic Area. It also addresses the transfer of personal data outside the EU and EEA areas.

Key Principles (Article 5):
• Lawfulness, fairness and transparency
• Purpose limitation
• Data minimisation
• Accuracy
• Storage limitation
• Integrity and confidentiality
• Accountability

Rights of Data Subjects (Articles 15-22):
• Right to access (Art. 15)
• Right to rectification (Art. 16)
• Right to erasure / "right to be forgotten" (Art. 17)
• Right to restriction of processing (Art. 18)
• Right to data portability (Art. 20)
• Right to object (Art. 21)
• Rights related to automated decision making and profiling (Art. 22)

Lawful Bases for Processing (Article 6):
• Consent of the data subject
• Performance of a contract
• Compliance with a legal obligation
• Protection of vital interests
• Performance of a task in the public interest
• Legitimate interests of the controller

Cross-Border Transfers (Chapter V):
• Adequacy decisions (Art. 45)
• Standard Contractual Clauses (Art. 46)
• Binding Corporate Rules (Art. 47)
• Derogations for specific situations (Art. 49)`,
      source: 'Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016',
    },
    ccpa_cpra: {
      title: 'CCPA + CPRA (California Consumer Privacy Act as amended by the California Privacy Rights Act)',
      content: `The California Consumer Privacy Act of 2018 (CCPA), as substantially amended by the California Privacy Rights Act of 2020 (CPRA, effective January 1, 2023), grants California residents comprehensive privacy rights.

Consumer Rights under CCPA/CPRA:
• Right to Know / Access (§ 1798.100, § 1798.110): Know what personal information is collected, used, shared, or sold, and request access to specific pieces of PI
• Right to Delete (§ 1798.105): Request deletion of personal information collected, with limited exceptions
• Right to Correct (§ 1798.106 — CPRA addition): Request that a business correct inaccurate personal information
• Right to Opt-Out of Sale/Sharing (§ 1798.120): Direct a business to stop selling or sharing personal information, including cross-context behavioral advertising
• Right to Limit Use of Sensitive Personal Information (§ 1798.121 — CPRA addition): Limit a business's use of sensitive PI to what is necessary to perform the services
• Right to Non-Discrimination (§ 1798.125): Cannot be denied goods or services, charged different prices, or provided a different quality for exercising privacy rights

Categories of Personal Information (§ 1798.140(v)):
A. Identifiers (name, email, IP address)
B. Customer records (address, phone, financial info)
C. Protected classifications (age, gender)
D. Commercial information (purchase history)
E. Biometric information
F. Internet activity (browsing, search history)
G. Geolocation data
H. Audio, electronic, visual information
I. Professional or employment information
J. Education information
K. Inferences drawn from the above
L. Sensitive personal information (CPRA addition)

CPRA Enhancements (eff. Jan 1, 2023):
• Created the California Privacy Protection Agency (CPPA)
• Eliminated the 30-day cure period for violations
• Expanded definition of "sharing" to include cross-context behavioral advertising
• Introduced "sensitive personal information" category
• Established data minimization and purpose limitation principles
• Extended employee and B2B data protections
• New requirements for automated decision-making and profiling`,
      source: 'California Civil Code §§ 1798.100-1798.199.100 (as amended by Proposition 24, CPRA 2020)',
    },
    calOppa: {
      title: 'CalOPPA (California Online Privacy Protection Act)',
      content: `The California Online Privacy Protection Act (CalOPPA), Cal. Bus. & Prof. Code §§ 22575-22579, was the first state law in the United States requiring commercial websites and online services to post a privacy policy.

CalOPPA Requirements:
• Conspicuously post a privacy policy on the website
• Identify the categories of personally identifiable information (PII) collected
• Identify the categories of third parties with whom PII may be shared
• Describe the process for notifying users of material changes to the policy
• Identify the effective date of the policy
• Disclose how the operator responds to "Do Not Track" (DNT) browser signals
• Disclose whether third parties may collect PII about individual consumers' online activities over time and across different websites

Key Provisions:
• "Conspicuously post" — link on homepage or first significant page using the word "Privacy"
• Must be updated when practices change
• 30-day cure period after notification of non-compliance
• Applies to any person or entity that collects PII from California residents through a commercial website or online service

Do Not Track (DNT) Disclosure:
CalOPPA requires operators to disclose how they respond to "Do Not Track" signals. An operator must state:
(a) Whether it honors DNT signals, and
(b) Whether third parties can collect PII about users' online activities on the site.`,
      source: 'California Business and Professions Code §§ 22575-22579 (CalOPPA, enacted 2003, amended 2013)',
    },
    coppa: {
      title: "COPPA (Children's Online Privacy Protection Act)",
      content: `The Children's Online Privacy Protection Act (COPPA) is a United States federal law designed to protect the privacy of children under 13 years of age.

Requirements:
• Obtain verifiable parental consent before collecting personal information from children
• Provide clear privacy policies
• Limit collection to what is necessary
• Protect confidentiality, security, and integrity of information
• Delete information when no longer needed

Our Compliance:
One Last AI does not knowingly collect information from children under 13. Our services are intended for users 18 years and older.`,
      source: '15 U.S.C. §§ 6501–6506',
    },
    pipeda: {
      title: 'PIPEDA (Personal Information Protection and Electronic Documents Act)',
      content: `Canada's federal private-sector privacy law. PIPEDA sets out ground rules for how businesses must handle personal information in the course of commercial activity.

10 Fair Information Principles:
1. Accountability
2. Identifying Purposes
3. Consent
4. Limiting Collection
5. Limiting Use, Disclosure, and Retention
6. Accuracy
7. Safeguards
8. Openness
9. Individual Access
10. Challenging Compliance

Key Rights:
• Right to access personal information held by an organization
• Right to challenge accuracy and completeness
• Right to withdraw consent (subject to legal or contractual restrictions)
• Right to complain to the Privacy Commissioner of Canada`,
      source: 'S.C. 2000, c. 5 (Personal Information Protection and Electronic Documents Act)',
    },
    pdpa_thailand: {
      title: 'PDPA Thailand (Personal Data Protection Act B.E. 2562)',
      content: `Thailand's Personal Data Protection Act B.E. 2562 (2019), effective June 1, 2022, is the kingdom's comprehensive data protection law modeled on the GDPR.

Key Principles:
• Lawfulness and fairness of collection
• Purpose limitation — collect only for stated purposes
• Data minimisation — only what is necessary
• Accuracy — keep data up to date
• Storage limitation — retain only as long as necessary
• Security — appropriate technical and organizational measures
• Accountability — data controller must demonstrate compliance

Lawful Bases for Processing (Section 24):
• Consent of the data subject
• Research or statistical purposes (with safeguards)
• Performance of a contract
• Vital interests of the data subject
• Compliance with a legal obligation
• Legitimate interests (proportionality test required)
• Public interest or exercise of official authority

Data Subject Rights (Sections 30–42):
• Right to access (Sec. 30)
• Right to data portability (Sec. 31)
• Right to object to processing (Sec. 32)
• Right to erasure / destruction (Sec. 33)
• Right to restrict processing (Sec. 34)
• Right to rectification (Sec. 36)
• Right to withdraw consent (Sec. 19)
• Right to lodge a complaint with the PDPC (Sec. 73)

Cross-Border Transfers (Section 28):
• Adequate protection standard in destination country
• Binding Corporate Rules or intra-group agreements
• Consent of the data subject
• Contract performance necessity

Enforcement:
• Personal Data Protection Committee (PDPC) — supervisory authority
• Administrative fines up to 5,000,000 THB (~$140,000 USD)
• Criminal penalties: imprisonment up to 1 year and/or fines up to 1,000,000 THB
• Civil liability and punitive damages up to twice actual damages`,
      source: 'Personal Data Protection Act B.E. 2562 (2019), Thailand Government Gazette, Vol. 136, Part 69 Kor',
    },
    pdpa_singapore: {
      title: 'PDPA Singapore (Personal Data Protection Act 2012)',
      content: `Singapore's Personal Data Protection Act 2012 (No. 26 of 2012), along with its 2020 amendments, governs the collection, use, disclosure, and care of personal data in Singapore.

Data Protection Obligations:
• Consent Obligation — obtain consent before collecting, using, or disclosing personal data
• Purpose Limitation Obligation — collect, use, or disclose only for purposes a reasonable person would consider appropriate
• Notification Obligation — inform individuals of purposes for data collection
• Access and Correction Obligation — provide access to and correct personal data upon request
• Accuracy Obligation — make reasonable effort to ensure data is accurate and complete
• Protection Obligation — protect personal data with reasonable security arrangements
• Retention Limitation Obligation — cease retention when no longer necessary
• Transfer Limitation Obligation — ensure comparable protection for overseas transfers
• Data Breach Notification Obligation (2020 amendment) — notify PDPC and affected individuals of significant breaches
• Accountability Obligation — demonstrate compliance through policies and practices

Exceptions to Consent (Fourth Schedule):
• Vital interests — necessary to respond to emergency threatening life, health, or safety
• Publicly available data
• National interest
• Investigations and legal proceedings
• Business asset transactions
• Business improvement purposes (2020 amendment)

Data Subject Rights:
• Right to access personal data held by an organization
• Right to correction of personal data
• Right to withdraw consent (reasonable notice required)
• Right to data portability (2020 amendment)

Do Not Call (DNC) Registry:
• Singapore maintains a national DNC Registry
• Organizations must check the DNC Registry before sending marketing messages
• Covers voice calls, SMS/MMS, and fax messages

Enforcement:
• Personal Data Protection Commission (PDPC) — supervisory authority
• Financial penalties up to SGD 1,000,000 or 10% of annual turnover (whichever is higher, per 2020 amendments)
• Directions to stop collection, destroy data, or comply
• Criminal penalties for egregious mishandling`,
      source: 'Personal Data Protection Act 2012 (No. 26 of 2012), as amended by the Personal Data Protection (Amendment) Act 2020 (No. 40 of 2020)',
    },
    uae_pdpl: {
      title: 'UAE PDPL (Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data)',
      content: `The United Arab Emirates Federal Decree-Law No. 45 of 2021, effective January 2, 2022 (with enforcement from January 2023), is the UAE's first comprehensive federal data protection law.

Key Principles:
• Lawfulness, fairness, and transparency
• Purpose limitation — process only for specific, clear, and legitimate purposes
• Data minimisation — adequate, relevant, and limited to what is necessary
• Accuracy — keep data accurate and up to date
• Storage limitation — retain only as long as necessary for the purpose
• Integrity and confidentiality — appropriate technical and organizational measures

Lawful Bases for Processing (Article 4):
• Consent of the data subject
• Necessary for the performance of a contract
• Compliance with legal obligations under UAE law
• Protection of public interest
• Legitimate interests of the data controller (must not override data subject rights)
• Medical or health purposes
• Processing by non-profit organizations of their members' data

Data Subject Rights (Articles 13–18):
• Right to be informed about data processing (Art. 13)
• Right to access personal data (Art. 14)
• Right to request transfer/portability of data (Art. 15)
• Right to object to automated decision-making and profiling (Art. 16)
• Right to correct or erase personal data (Art. 17)
• Right to restrict or stop processing (Art. 18)
• Right to withdraw consent at any time

Cross-Border Transfers (Article 22):
• Transfers permitted to countries with adequate protection levels (as determined by the UAE Data Office)
• Standard Contractual Clauses approved by the UAE Data Office
• Consent of the data subject for specific transfer
• Necessary for contract performance or legal obligations
• Data localisation requirements may apply per sector-specific regulations

Special Categories:
• Health data, biometric data, genetic data
• Requires explicit consent or legal basis
• Enhanced security measures required

UAE Data Office:
• Established as the supervisory authority under the Executive Regulations
• Responsible for issuing guidance, approving cross-border transfer mechanisms, and enforcement

Enforcement & Penalties:
• Administrative fines and penalties (amounts defined in Executive Regulations)
• Suspension of data processing activities
• Compensation claims by data subjects`,
      source: 'Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data, United Arab Emirates',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══════════════════════ Hero Section ═══════════════════════ */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-6">
            Last updated: February 18, 2026 • Effective Date: February 18, 2026
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <ComplianceBadge icon={Shield} label="GDPR Compliant" color="bg-green-100 text-green-800" />
            <ComplianceBadge icon={Scale} label="CCPA / CPRA" color="bg-blue-100 text-blue-800" />
            <ComplianceBadge icon={Globe} label="CalOPPA" color="bg-amber-100 text-amber-800" />
            <ComplianceBadge icon={AlertTriangle} label="COPPA" color="bg-red-100 text-red-800" />
            <ComplianceBadge icon={Shield} label="PDPA Thailand" color="bg-purple-100 text-purple-800" />
            <ComplianceBadge icon={Shield} label="PDPA Singapore" color="bg-teal-100 text-teal-800" />
            <ComplianceBadge icon={Globe} label="UAE PDPL" color="bg-orange-100 text-orange-800" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════ Content ═══════════════════════ */}
      <div className="container-custom section-padding max-w-5xl">
        <div className="space-y-12">

          {/* ───────────────── 1. Introduction ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              1. Introduction
            </h2>
            <p className="text-neural-700 leading-relaxed mb-4">
              Welcome to One Last AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We operate a global
              AI platform that provides specialized AI personalities
              and services to users worldwide. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you
              use our platform at{' '}
              <a
                href="https://onelastai.co"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                onelastai.co
              </a>{' '}
              and its sub-site applications, including Canvas App, Canvas Studio,
              GenCraft Pro, and Maula Editor ({' '}
              <a
                href="https://maula.dev"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                maula.dev
              </a>
              ).
            </p>
            <p className="text-neural-700 leading-relaxed mb-4">
              We are committed to protecting your privacy and complying with
              applicable data protection laws globally, including:
            </p>
            <ul className="list-disc pl-6 text-neural-700 space-y-2">
              <li>
                <button
                  onClick={() => setSelectedArticle(articles.gdpr)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  GDPR (General Data Protection Regulation)
                </button>{' '}
                — European Union / EEA
              </li>
              <li>
                <button
                  onClick={() => setSelectedArticle(articles.ccpa_cpra)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  CCPA / CPRA (California Consumer Privacy Act, as amended by the California Privacy Rights Act)
                </button>{' '}
                — California, United States
              </li>
              <li>
                <button
                  onClick={() => setSelectedArticle(articles.calOppa)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  CalOPPA (California Online Privacy Protection Act)
                </button>{' '}
                — California, United States
              </li>
              <li>
                <button
                  onClick={() => setSelectedArticle(articles.coppa)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  COPPA (Children&apos;s Online Privacy Protection Act)
                </button>{' '}
                — United States
              </li>
              <li>
                <button
                  onClick={() => setSelectedArticle(articles.pipeda)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  PIPEDA (Personal Information Protection and Electronic Documents Act)
                </button>{' '}
                — Canada
              </li>
              <li>Privacy Act 1988 — Australia</li>
              <li>LGPD (Lei Geral de Proteção de Dados) — Brazil</li>
              <li>
                <button
                  onClick={() => setSelectedArticle(articles.pdpa_thailand)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  PDPA (Personal Data Protection Act B.E. 2562)
                </button>{' '}
                — Thailand
              </li>
              <li>
                <button
                  onClick={() => setSelectedArticle(articles.pdpa_singapore)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  PDPA (Personal Data Protection Act 2012)
                </button>{' '}
                — Singapore
              </li>
              <li>
                <button
                  onClick={() => setSelectedArticle(articles.uae_pdpl)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  PDPL (Federal Decree-Law No. 45 of 2021)
                </button>{' '}
                — United Arab Emirates
              </li>
            </ul>
            <p className="text-neural-500 mt-4 text-sm">
              By using our services, you agree to the collection and use of
              information in accordance with this policy. If you do not agree
              with the terms of this policy, please do not access or use our
              services.
            </p>
          </section>

          {/* ───────────────── 2. Information We Collect ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              2. Information We Collect
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  2.1 Personal Information You Provide
                </h3>
                <p className="text-neural-700 mb-3">
                  Information you provide directly when creating an account,
                  using our services, or contacting us:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    <strong className="text-neural-900">Identifiers:</strong>{' '}
                    Name, email address, username, password, phone number
                  </li>
                  <li>
                    <strong className="text-neural-900">Profile Information:</strong>{' '}
                    Company name, job title, profile picture, bio
                  </li>
                  <li>
                    <strong className="text-neural-900">Financial Information:</strong>{' '}
                    Billing address, payment method details (processed via Stripe; we do not store full card numbers)
                  </li>
                  <li>
                    <strong className="text-neural-900">Communication Data:</strong>{' '}
                    Support tickets, feedback, chat conversations with AI agents, emails
                  </li>
                  <li>
                    <strong className="text-neural-900">Content Data:</strong>{' '}
                    Files, documents, images, code, and prompts submitted to AI agents
                  </li>
                  <li>
                    <strong className="text-neural-900">Audio/Visual Data:</strong>{' '}
                    Voice recordings when using voice-chat features, uploaded images/screenshots
                  </li>
                  <li>
                    <strong className="text-neural-900">Optional Profile Data:</strong>{' '}
                    Preferred name, age, gender, nationality (for AI personalization and localization)
                  </li>
                  <li>
                    <strong className="text-neural-900">User-Supplied Credentials (Encrypted):</strong>{' '}
                    Deploy tokens (GitHub, Vercel, Netlify, AWS), API keys, and user secrets — all encrypted with AES-256-GCM at rest in PostgreSQL; never logged or included in AI prompts
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  2.2 Information Collected Automatically
                </h3>
                <p className="text-neural-700 mb-3">
                  When you access or use our services, we automatically collect:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    <strong className="text-neural-900">Usage Data:</strong>{' '}
                    Pages visited, features used, time spent, click patterns, interaction frequency, AI model used, token counts (input/output), request latency, credits consumed per request
                  </li>
                  <li>
                    <strong className="text-neural-900">Device Information:</strong>{' '}
                    IP address, browser type and version, operating system, device type (mobile/tablet/desktop), screen resolution, user-agent string
                  </li>
                  <li>
                    <strong className="text-neural-900">Geolocation Data:</strong>{' '}
                    Approximate country and city derived from your IP address
                  </li>
                  <li>
                    <strong className="text-neural-900">Cookies &amp; Tracking Technologies:</strong>{' '}
                    Session cookies, authentication cookies, preference cookies (see Section 13)
                  </li>
                  <li>
                    <strong className="text-neural-900">Performance Data:</strong>{' '}
                    API response times, page load times, error logs, crash reports, success/failure status
                  </li>
                  <li>
                    <strong className="text-neural-900">Referral &amp; Marketing Data:</strong>{' '}
                    Referrer URL, UTM parameters (source, medium, campaign), search terms
                  </li>
                  <li>
                    <strong className="text-neural-900">Session Tracking:</strong>{' '}
                    Anonymous visitor ID (UUID), session start/end, page views per session, landing and exit pages
                  </li>
                  <li>
                    <strong className="text-neural-900">Security Data:</strong>{' '}
                    Login attempts, failed login counts, account lock level and lock-until timestamps (3-tier progressive lockout: 15 min → 24 hr → permanent)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  2.3 AI Interaction Data
                </h3>
                <p className="text-neural-700 mb-3">
                  When you interact with our AI agents, we collect:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>Conversation history and context</li>
                  <li>Prompts, queries, and instructions submitted</li>
                  <li>AI-generated responses and outputs</li>
                  <li>Agent preferences and personalization settings</li>
                  <li>Tool execution requests and results (268 tools across 39 categories)</li>
                  <li>Files uploaded for AI processing (images, documents, code)</li>
                  <li>Voice recordings (if voice features are used)</li>
                  <li>Project files (code, HTML, CSS, JS, etc.) and project metadata</li>
                  <li>AI-generated video outputs (stored in AWS S3)</li>
                </ul>

                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 mt-4">
                  <h4 className="font-semibold text-neural-900 mb-2">Agent Memory System</h4>
                  <p className="text-neural-700 text-sm mb-2">
                    Our AI agents can auto-save &quot;memories&quot; about your preferences, facts,
                    and interaction patterns to personalize your experience. These memories are:
                  </p>
                  <ul className="list-disc pl-6 text-neural-700 text-sm space-y-1">
                    <li>Stored in PostgreSQL with category tags (preference, fact, interaction, general)</li>
                    <li>User-scoped — never shared between users</li>
                    <li>Source-tracked: &quot;agent&quot; (auto-saved) or &quot;user&quot; (manually saved)</li>
                    <li>Viewable, disableable, and deletable by you at any time via the Agent Memory Panel</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  2.4 Sensitive Personal Information
                </h3>
                <p className="text-neural-700 mb-3">
                  Under the CPRA, &quot;sensitive personal information&quot; includes
                  certain categories of data. We may process the following
                  sensitive PI only as necessary to provide our services:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    <strong className="text-neural-900">Account credentials:</strong>{' '}
                    Username/email in combination with password (stored using bcrypt hashing)
                  </li>
                  <li>
                    <strong className="text-neural-900">Precise geolocation:</strong>{' '}
                    We do NOT collect precise geolocation. Only approximate location from IP address.
                  </li>
                  <li>
                    <strong className="text-neural-900">Contents of communications:</strong>{' '}
                    Messages you send to AI agents and support
                  </li>
                </ul>
                <p className="text-neural-500 mt-3 text-sm">
                  We do not collect Social Security numbers, financial account
                  numbers, racial/ethnic origin, religious beliefs, biometric
                  data for identification, health data, or sexual orientation
                  data.
                </p>
              </div>
            </div>
          </section>

          {/* ───────────────── 3. How We Use Your Information ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              3. How We Use Your Information
            </h2>
            <p className="text-neural-700 mb-4">
              We use collected information for the following purposes. Under the
              GDPR, each purpose is linked to a lawful basis for processing:
            </p>

            <div className="space-y-4">
              <div className="bg-neural-50 rounded-xl p-6 border border-neural-200">
                <h3 className="text-lg font-semibold mb-1 text-blue-700">
                  3.1 Service Delivery
                </h3>
                <p className="text-xs text-neural-500 mb-2">
                  GDPR lawful basis: Performance of a contract (Art. 6(1)(b))
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li>Provide access to AI agents and platform features</li>
                  <li>Process your requests and transactions</li>
                  <li>Maintain your account, preferences, and subscriptions</li>
                  <li>Deliver personalized AI interactions</li>
                  <li>Execute tool calls and return results</li>
                </ul>
              </div>

              <div className="bg-neural-50 rounded-xl p-6 border border-neural-200">
                <h3 className="text-lg font-semibold mb-1 text-blue-700">
                  3.2 Platform Improvement
                </h3>
                <p className="text-xs text-neural-500 mb-2">
                  GDPR lawful basis: Legitimate interests (Art. 6(1)(f))
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li>Analyze usage patterns to improve AI accuracy and relevance</li>
                  <li>Train and enhance AI models (anonymized and aggregated data only)</li>
                  <li>Develop new features and services</li>
                  <li>Optimize performance, reliability, and user experience</li>
                </ul>
              </div>

              <div className="bg-neural-50 rounded-xl p-6 border border-neural-200">
                <h3 className="text-lg font-semibold mb-1 text-blue-700">
                  3.3 Communication
                </h3>
                <p className="text-xs text-neural-500 mb-2">
                  GDPR lawful basis: Legitimate interests (Art. 6(1)(f)) or Consent (Art. 6(1)(a)) for marketing
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li>Send service-related updates and transactional notifications</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Send marketing communications (only with explicit opt-in consent; you can unsubscribe at any time)</li>
                </ul>
              </div>

              <div className="bg-neural-50 rounded-xl p-6 border border-neural-200">
                <h3 className="text-lg font-semibold mb-1 text-blue-700">
                  3.4 Security &amp; Compliance
                </h3>
                <p className="text-xs text-neural-500 mb-2">
                  GDPR lawful basis: Legal obligation (Art. 6(1)(c)) / Legitimate interests (Art. 6(1)(f))
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li>Detect and prevent fraud, abuse, and unauthorized access</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Comply with legal obligations, including tax and financial reporting</li>
                  <li>Protect user safety and platform integrity</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ───────────────── 4. Data Sharing and Disclosure ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              4. Data Sharing and Disclosure
            </h2>

            {/* CCPA/CPRA: Do Not Sell notice */}
            <div className="bg-green-50 rounded-xl p-5 border border-green-200 mb-6">
              <p className="text-green-900 font-semibold flex items-center gap-2 mb-2">
                <Shield size={18} />
                We Do Not Sell or Share Your Personal Information
              </p>
              <p className="text-green-800 text-sm">
                As defined under the CCPA/CPRA (Cal. Civ. Code § 1798.140(ad) and § 1798.140(ah)),
                we do <strong>not</strong> sell your personal information and do <strong>not</strong>{' '}
                share your personal information for cross-context behavioral advertising.
                In the preceding 12 months, we have not sold or shared the personal information
                of any consumer.
              </p>
            </div>

            <p className="text-neural-700 mb-4">
              We may disclose your information in the following limited circumstances:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">
                  4.1 Service Providers (Processors)
                </h3>
                <p className="text-neural-700 mb-2">
                  We engage third-party service providers who process personal
                  information on our behalf under written contracts that restrict
                  their use of the data. Under the CCPA/CPRA, these disclosures
                  qualify as disclosures for a &quot;business purpose&quot;:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li><strong>Payment processing:</strong> Stripe (PCI DSS Level 1 compliant)</li>
                  <li><strong>Cloud hosting &amp; infrastructure:</strong> AWS (Amazon Web Services)</li>
                  <li><strong>Analytics:</strong> Internal analytics (self-hosted); no data sent to Google Analytics or third-party analytics</li>
                  <li><strong>AI model providers (accessed via One Last AI&apos;s own API keys — users never need provider accounts):</strong>
                    <ul className="list-disc pl-6 mt-1 space-y-1 text-sm">
                      <li><strong>Anthropic</strong> — Claude Sonnet 4, Claude Opus 4, Claude Haiku (primary provider; does NOT use API data for model training)</li>
                      <li><strong>OpenAI</strong> — GPT-4o, GPT-4o Mini, TTS (text-to-speech), DALL·E 3 (image generation); API data not used for training when accessed via API keys</li>
                      <li><strong>Google</strong> — Gemini 2.5 Pro, Gemini 2.5 Flash; API data processed under Google Cloud data processing terms</li>
                      <li><strong>Mistral AI</strong> — Mistral Large, Codestral (code-specialized); European-headquartered, GDPR-compliant</li>
                      <li><strong>xAI</strong> — Grok 3, Grok 3 Mini; prompts processed under xAI&apos;s API data policy</li>
                      <li><strong>Groq</strong> — LLaMA 3.3 70B (speed-optimized inference); processes prompts in-memory with no persistent storage</li>
                      <li><strong>Cerebras</strong> — LLaMA 3.3 70B (ultra-fast wafer-scale inference); processes prompts with no persistent storage of request data</li>
                      <li><strong>HuggingFace</strong> — Open-source model hosting and inference; processing governed by HuggingFace Inference API terms</li>
                      <li><strong>Ollama</strong> — Local/self-hosted open-source model execution; data stays on our servers and is never sent to external APIs</li>
                      <li><strong>fal.ai / Minimax</strong> — AI video generation from text prompts</li>
                      <li><strong>Azure AI Vision</strong> — Image-to-code analysis from uploaded screenshots</li>
                    </ul>
                    <p className="mt-2 text-sm"><strong>Important:</strong> All AI API calls are made through One Last AI&apos;s own platform API keys on your behalf. You do not need accounts with any AI provider. Your prompts and code context may be sent to generate responses. We do <strong>NOT</strong> include your email, name, password, credentials, or payment info in AI prompts. We do <strong>NOT</strong> sell, share, or license your data to any third party. We do <strong>NOT</strong> use your data to train, fine-tune, or improve any AI models.</p>
                  </li>
                  <li><strong>Media processing:</strong> fal.ai / Minimax (AI video generation from text prompts), Azure AI Vision (image-to-code analysis from uploaded screenshots)</li>
                  <li><strong>Deployment targets (user-initiated only):</strong> Vercel, Netlify, GitHub, AWS — project files are sent only when you click &quot;Deploy&quot; using your own stored deploy tokens</li>
                  <li><strong>Email delivery:</strong> Transactional email services</li>
                  <li><strong>Content delivery:</strong> CDN for static asset delivery</li>
                  <li><strong>Sandbox execution:</strong> AWS ECS Fargate — isolated container per session for user code execution</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">
                  4.2 Legal Requirements
                </h3>
                <p className="text-neural-700">
                  We may disclose personal information when required by law, subpoena,
                  or other legal process, or when we believe in good faith that
                  disclosure is necessary to:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1 mt-2">
                  <li>Comply with applicable law, regulation, or legal process</li>
                  <li>Respond to lawful requests by public authorities, including national security or law enforcement</li>
                  <li>Protect our rights, property, or safety, or that of our users or the public</li>
                  <li>Investigate potential violations of our Terms of Service</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">
                  4.3 Business Transfers
                </h3>
                <p className="text-neural-700">
                  In the event of a merger, acquisition, bankruptcy, reorganization,
                  or sale of all or a portion of our assets, your personal information
                  may be transferred as part of that transaction. We will notify you
                  via email and/or a prominent notice on our website before your
                  information is transferred and becomes subject to a different
                  privacy policy.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-neural-900">
                  4.4 With Your Consent
                </h3>
                <p className="text-neural-700">
                  We may share information with third parties when you explicitly
                  consent to such sharing.
                </p>
              </div>

              {/* CCPA/CPRA disclosure table */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-3 text-neural-900">
                  4.5 CCPA/CPRA Disclosure Table — Categories of PI Disclosed for Business Purposes (Preceding 12 Months)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-neural-100 text-neural-900">
                        <th className="text-left p-3 border border-neural-200 font-semibold">Category of PI</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">Disclosed To</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr>
                        <td className="p-3 border border-neural-200">A. Identifiers</td>
                        <td className="p-3 border border-neural-200">Cloud host, email service, payment processor</td>
                        <td className="p-3 border border-neural-200">Account management, billing, support</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200">B. Customer records</td>
                        <td className="p-3 border border-neural-200">Payment processor (Stripe)</td>
                        <td className="p-3 border border-neural-200">Payment processing</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200">D. Commercial information</td>
                        <td className="p-3 border border-neural-200">Payment processor</td>
                        <td className="p-3 border border-neural-200">Transaction processing, invoicing</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200">F. Internet activity</td>
                        <td className="p-3 border border-neural-200">Internal analytics (self-hosted)</td>
                        <td className="p-3 border border-neural-200">Service improvement, fraud detection</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200">G. Geolocation (approx.)</td>
                        <td className="p-3 border border-neural-200">Cloud host, analytics</td>
                        <td className="p-3 border border-neural-200">Service delivery, localization</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200">H. Audio/visual (voice chat, images)</td>
                        <td className="p-3 border border-neural-200">AI model providers, Azure AI Vision, fal.ai</td>
                        <td className="p-3 border border-neural-200">Voice-to-text, AI interaction, image-to-code, video generation</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200">K. Inferences (agent memories)</td>
                        <td className="p-3 border border-neural-200">Not disclosed to third parties</td>
                        <td className="p-3 border border-neural-200">Internal AI personalization only</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-neural-500 text-xs mt-2">
                  Categories C, E, I, J, L: Not collected. We have not sold or shared any category of PI in the preceding 12 months.
                </p>
              </div>
            </div>
          </section>

          {/* ───────────────── 5. Data Retention ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              5. Data Retention
            </h2>
            <p className="text-neural-700 mb-4">
              In accordance with the GDPR principle of storage limitation
              (Art. 5(1)(e)) and the CPRA&apos;s data minimization requirements, we
              retain your information only for as long as reasonably necessary
              for the purposes for which it was collected:
            </p>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <p className="text-neural-700 mb-3">
                <strong className="text-neural-900">Retention Periods:</strong>
              </p>
              <ul className="list-disc pl-6 text-neural-700 space-y-2">
                <li>
                  <strong>Active accounts:</strong> Duration of account + 30 days
                  after deletion request (includes all associated data: projects, chat history, agent memories, credentials, usage logs, and files)
                </li>
                <li>
                  <strong>Chat messages:</strong> Until you delete the session or
                  delete your account
                </li>
                <li>
                  <strong>Project files:</strong> Until you delete the project or
                  delete your account
                </li>
                <li>
                  <strong>Agent memories:</strong> Until you disable or delete them,
                  or delete your account
                </li>
                <li>
                  <strong>Encrypted credentials (deploy tokens, API keys):</strong> Until
                  you remove them or delete your account
                </li>
                <li>
                  <strong>Usage logs:</strong> 2 years (automatic purge)
                </li>
                <li>
                  <strong>Page views &amp; visitor sessions:</strong> 1 year (automatic purge)
                </li>
                <li>
                  <strong>Login attempt records:</strong> 90 days (automatic purge)
                </li>
                <li>
                  <strong>Payment &amp; billing records:</strong> 7 years (tax and
                  financial compliance obligations)
                </li>
                <li>
                  <strong>Support ticket records:</strong> 3 years after resolution
                </li>
              </ul>
            </div>
            <p className="text-neural-500 mt-4 text-sm">
              When data is no longer needed, we securely delete or anonymize it.
              Anonymized data that can no longer identify you may be retained
              indefinitely for statistical and research purposes.
            </p>
          </section>

          {/* ───────────────── 6. Your Privacy Rights (General) ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              6. Your Privacy Rights
            </h2>
            <p className="text-neural-700 mb-4">
              Regardless of your location, we extend the following rights to all users:
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                <h3 className="font-semibold text-blue-700 mb-2">✓ Right to Access</h3>
                <p className="text-neural-600 text-sm">Request a copy of your personal data we hold</p>
              </div>
              <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                <h3 className="font-semibold text-blue-700 mb-2">✓ Right to Rectification / Correction</h3>
                <p className="text-neural-600 text-sm">Correct inaccurate or incomplete personal data</p>
              </div>
              <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                <h3 className="font-semibold text-blue-700 mb-2">✓ Right to Erasure / Deletion</h3>
                <p className="text-neural-600 text-sm">Request deletion of your personal data, subject to legal retention obligations</p>
              </div>
              <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                <h3 className="font-semibold text-blue-700 mb-2">✓ Right to Data Portability</h3>
                <p className="text-neural-600 text-sm">Receive your data in a structured, machine-readable format (JSON or CSV)</p>
              </div>
              <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                <h3 className="font-semibold text-blue-700 mb-2">✓ Right to Object / Opt-Out</h3>
                <p className="text-neural-600 text-sm">Object to processing of your personal data for certain purposes</p>
              </div>
              <div className="bg-neural-50 rounded-xl p-4 border border-neural-200">
                <h3 className="font-semibold text-blue-700 mb-2">✓ Right to Withdraw Consent</h3>
                <p className="text-neural-600 text-sm">Withdraw consent at any time without affecting prior processing</p>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
              <p className="text-neural-900 font-semibold mb-2">
                How to Exercise Your Rights:
              </p>
              <ul className="list-disc pl-6 text-neural-700 space-y-1">
                <li>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@onelastai.co" className="text-blue-600 hover:text-blue-700 underline">
                    privacy@onelastai.co
                  </a>
                </li>
                <li>
                  <strong>In-app:</strong> Dashboard → Preferences → Privacy Controls
                </li>
                <li>
                  <strong>Mailing address:</strong> One Last AI, Attn: Privacy Team (see Section 15)
                </li>
              </ul>
              <p className="text-neural-700 mt-3 text-sm">
                We will verify your identity before processing any request. We respond
                within <strong>30 days</strong> (GDPR) or <strong>45 days</strong> (CCPA/CPRA),
                with extensions as permitted by law. We will not charge a fee for
                reasonable requests.
              </p>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ───────────────── 7. GDPR COMPLIANCE ───────────────── */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="bg-white rounded-2xl p-8 border-2 border-green-200 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <ComplianceBadge icon={Shield} label="GDPR" color="bg-green-100 text-green-800" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                7. GDPR Compliance (EU/EEA Users)
              </h2>
            </div>
            <p className="text-neural-700 mb-6">
              This section applies if you are located in the European Union (EU),
              European Economic Area (EEA), or the United Kingdom (UK), and
              supplements the information in the rest of this Privacy Policy per
              Regulation (EU) 2016/679 (the &quot;GDPR&quot;) and the UK GDPR.
            </p>

            <div className="space-y-6">
              {/* 7.1 Data Controller */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  7.1 Data Controller
                </h3>
                <p className="text-neural-700">
                  One Last AI is the data controller responsible for your personal
                  data. Our contact details are set out in Section 15 below.
                </p>
              </div>

              {/* 7.2 Lawful Bases */}
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  7.2 Lawful Bases for Processing (Article 6)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-green-50 text-neural-900">
                        <th className="text-left p-3 border border-neural-200 font-semibold">Processing Activity</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">Lawful Basis</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr>
                        <td className="p-3 border border-neural-200">Creating &amp; maintaining your account</td>
                        <td className="p-3 border border-neural-200">Performance of contract (Art. 6(1)(b))</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200">Providing AI agent services &amp; features</td>
                        <td className="p-3 border border-neural-200">Performance of contract (Art. 6(1)(b))</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200">AI code generation &amp; tool execution</td>
                        <td className="p-3 border border-neural-200">Performance of contract (Art. 6(1)(b))</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200">Credit/billing management</td>
                        <td className="p-3 border border-neural-200">Performance of contract (Art. 6(1)(b))</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200">Page view &amp; visitor session tracking</td>
                        <td className="p-3 border border-neural-200">Legitimate interest (Art. 6(1)(f)) — analytics</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200">Security monitoring (login attempts, lockout)</td>
                        <td className="p-3 border border-neural-200">Legitimate interest (Art. 6(1)(f)) — security</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200">Processing payments &amp; billing</td>
                        <td className="p-3 border border-neural-200">Performance of contract (Art. 6(1)(b))</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200">Sending transactional emails</td>
                        <td className="p-3 border border-neural-200">Performance of contract (Art. 6(1)(b))</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200">Analytics &amp; service improvement</td>
                        <td className="p-3 border border-neural-200">Legitimate interest (Art. 6(1)(f)) — improving our services</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200">Fraud prevention &amp; security</td>
                        <td className="p-3 border border-neural-200">Legitimate interest (Art. 6(1)(f)) — protecting our platform</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200">Marketing communications</td>
                        <td className="p-3 border border-neural-200">Consent (Art. 6(1)(a)) — opt-in only</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200">Optional profile data (age, gender, nationality)</td>
                        <td className="p-3 border border-neural-200">Consent (Art. 6(1)(a))</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200">Agent memory storage</td>
                        <td className="p-3 border border-neural-200">Consent (Art. 6(1)(a)) — user can disable</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200">Tax/financial record-keeping</td>
                        <td className="p-3 border border-neural-200">Legal obligation (Art. 6(1)(c))</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200">Responding to legal requests</td>
                        <td className="p-3 border border-neural-200">Legal obligation (Art. 6(1)(c))</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7.3 Data Subject Rights */}
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  7.3 Your Rights Under the GDPR (Articles 15–22)
                </h3>
                <p className="text-neural-700 mb-3">
                  In addition to the general rights in Section 6, GDPR provides the following specific rights:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>
                    <strong>Right of Access (Art. 15):</strong> Obtain confirmation
                    of whether we process your data and receive a copy in a commonly
                    used electronic format.
                  </li>
                  <li>
                    <strong>Right to Rectification (Art. 16):</strong> Have inaccurate
                    personal data corrected without undue delay.
                  </li>
                  <li>
                    <strong>Right to Erasure (Art. 17):</strong> Request deletion of
                    your personal data where there is no compelling reason for
                    continued processing (the &quot;right to be forgotten&quot;).
                  </li>
                  <li>
                    <strong>Right to Restriction (Art. 18):</strong> Restrict
                    processing while we verify accuracy or assess an objection.
                  </li>
                  <li>
                    <strong>Right to Data Portability (Art. 20):</strong> Receive
                    your data in a structured, commonly used, machine-readable
                    format (JSON) and transmit it to another controller.
                  </li>
                  <li>
                    <strong>Right to Object (Art. 21):</strong> Object to processing
                    based on legitimate interests, including profiling. We will
                    cease processing unless we demonstrate compelling legitimate
                    grounds.
                  </li>
                  <li>
                    <strong>Automated Decision-Making (Art. 22):</strong> We do not
                    make solely automated decisions that produce legal effects on you.
                    AI agent responses are generated content, not automated legal
                    decisions.
                  </li>
                </ul>
              </div>

              {/* 7.4 Cross-Border Transfers */}
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  7.4 International Data Transfers (Chapter V)
                </h3>
                <p className="text-neural-700 mb-3">
                  Your data may be transferred to and processed in the United States
                  and other countries outside the EU/EEA. We ensure an adequate level
                  of protection through:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li>
                    <strong>Standard Contractual Clauses (SCCs)</strong> approved by the
                    European Commission (Commission Decision 2021/914)
                  </li>
                  <li>
                    <strong>Data Processing Agreements (DPAs)</strong> with all
                    third-party sub-processors
                  </li>
                  <li>
                    <strong>Adequacy decisions</strong> where the European Commission
                    has determined a country provides adequate protection
                  </li>
                  <li>
                    <strong>Supplementary measures</strong> (encryption, pseudonymization)
                    where required by the Schrems II ruling (Case C-311/18)
                  </li>
                </ul>
                <p className="text-neural-500 text-sm mt-2">
                  You may request a copy of the applicable SCCs by contacting{' '}
                  <a href="mailto:privacy@onelastai.co" className="text-blue-600 underline">privacy@onelastai.co</a>.
                </p>
              </div>

              {/* 7.5 DPO */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  7.5 Data Protection Officer
                </h3>
                <p className="text-neural-700">
                  You may reach our Data Protection Officer at{' '}
                  <a href="mailto:dpo@onelastai.co" className="text-blue-600 hover:text-blue-700 underline">
                    dpo@onelastai.co
                  </a>.
                </p>
              </div>

              {/* 7.6 Supervisory Authority */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  7.6 Right to Lodge a Complaint
                </h3>
                <p className="text-neural-700">
                  If you believe your data protection rights have been violated,
                  you have the right to lodge a complaint with your local
                  supervisory authority. A list of EU Data Protection Authorities
                  is available at{' '}
                  <a
                    href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    edpb.europa.eu
                  </a>.
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ───────────────── 8. CCPA + CPRA COMPLIANCE ───────────────── */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="bg-white rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <ComplianceBadge icon={Scale} label="CCPA/CPRA" color="bg-blue-100 text-blue-800" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                8. CCPA &amp; CPRA Compliance (California Residents)
              </h2>
            </div>
            <p className="text-neural-700 mb-6">
              This section applies to California residents and supplements the rest
              of this Privacy Policy pursuant to the California Consumer Privacy Act
              of 2018 (Cal. Civ. Code §§ 1798.100–1798.199), as amended by the
              California Privacy Rights Act of 2020 (&quot;CPRA&quot;, effective January 1, 2023).
              Terms used in this section have the meanings given in the CCPA/CPRA.
            </p>

            <div className="space-y-6">
              {/* 8.1 Categories of PI */}
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  8.1 Categories of Personal Information Collected (§ 1798.110)
                </h3>
                <p className="text-neural-700 mb-3">
                  In the preceding 12 months, we have collected the following
                  categories of personal information:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-blue-50 text-neural-900">
                        <th className="text-left p-3 border border-neural-200 font-semibold">Category</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">Examples</th>
                        <th className="text-center p-3 border border-neural-200 font-semibold">Collected?</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr>
                        <td className="p-3 border border-neural-200 font-medium">A. Identifiers</td>
                        <td className="p-3 border border-neural-200">Name, email, username, IP address, account name</td>
                        <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200 font-medium">B. Customer records</td>
                        <td className="p-3 border border-neural-200">Name, address, phone, payment information</td>
                        <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200 font-medium">C. Protected classifications</td>
                        <td className="p-3 border border-neural-200">Age, gender (optional profile fields)</td>
                        <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes*</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200 font-medium">D. Commercial information</td>
                        <td className="p-3 border border-neural-200">Purchase history, subscription plan, usage records</td>
                        <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200 font-medium">E. Biometric information</td>
                        <td className="p-3 border border-neural-200">Fingerprints, voice prints, facial recognition data</td>
                        <td className="p-3 border border-neural-200 text-center text-red-500 font-bold">No</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200 font-medium">F. Internet / network activity</td>
                        <td className="p-3 border border-neural-200">Browsing history, interactions with our platform, search queries</td>
                        <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200 font-medium">G. Geolocation data</td>
                        <td className="p-3 border border-neural-200">Approximate location from IP address</td>
                        <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200 font-medium">H. Audio / visual data</td>
                        <td className="p-3 border border-neural-200">Voice recordings (voice chat), uploaded images/videos</td>
                        <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200 font-medium">I. Professional / employment info</td>
                        <td className="p-3 border border-neural-200">Job title, company name (optional profile fields)</td>
                        <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200 font-medium">J. Education information</td>
                        <td className="p-3 border border-neural-200">Education records</td>
                        <td className="p-3 border border-neural-200 text-center text-red-500 font-bold">No</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-neural-200 font-medium">K. Inferences</td>
                        <td className="p-3 border border-neural-200">Agent preferences, usage patterns, content interests</td>
                        <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                      </tr>
                      <tr className="bg-neural-50">
                        <td className="p-3 border border-neural-200 font-medium">L. Sensitive PI (CPRA)</td>
                        <td className="p-3 border border-neural-200">Account login credentials; contents of messages to AI agents</td>
                        <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes*</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-neural-500 text-xs mt-2">
                  *Category C: Only age and gender are collected as optional, user-provided profile fields for AI personalization; race, religion, and other protected classes are NOT collected.
                  *Category L: Sensitive PI is used only as necessary to provide the services you
                  requested. You may exercise the right to limit use of sensitive PI (see Section 8.2).
                </p>
              </div>

              {/* 8.2 Consumer Rights */}
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  8.2 Your Rights Under the CCPA/CPRA
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-1">Right to Know / Access (§ 1798.100, § 1798.110)</h4>
                    <p className="text-neural-700 text-sm">
                      You may request that we disclose the categories and specific pieces
                      of personal information we have collected about you, the categories
                      of sources, the business or commercial purpose for collecting, and
                      the categories of third parties with whom we share your PI. You may
                      make this request up to twice in a 12-month period.
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-1">Right to Delete (§ 1798.105)</h4>
                    <p className="text-neural-700 text-sm">
                      You may request that we delete your personal information. We will
                      comply except where retention is necessary for completing the
                      transaction, detecting security incidents, complying with legal
                      obligations, or other lawful purposes described in § 1798.105(d).
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-1">Right to Correct (§ 1798.106 — CPRA)</h4>
                    <p className="text-neural-700 text-sm">
                      You may request that we correct inaccurate personal information we
                      maintain about you, taking into account the nature and purposes of
                      processing.
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-1">Right to Opt-Out of Sale/Sharing (§ 1798.120)</h4>
                    <p className="text-neural-700 text-sm">
                      You have the right to direct us not to sell or share your personal
                      information. <strong>We do not sell or share (as defined by the CCPA/CPRA)
                      your personal information.</strong> Therefore, no opt-out mechanism is required.
                      However, should our practices change, we will provide a &quot;Do Not Sell or
                      Share My Personal Information&quot; link on our homepage.
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-1">Right to Limit Use of Sensitive PI (§ 1798.121 — CPRA)</h4>
                    <p className="text-neural-700 text-sm">
                      You may direct us to limit our use of your sensitive personal
                      information to that which is necessary to perform the services or
                      provide the goods you requested. We only use sensitive PI for
                      permissible purposes (authentication, service delivery) and do not
                      use or disclose it for inferring characteristics about you.
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-1">Right to Non-Discrimination (§ 1798.125)</h4>
                    <p className="text-neural-700 text-sm">
                      We will not discriminate against you for exercising any of your
                      CCPA/CPRA rights. We will not: deny you services, charge different
                      prices, provide a different level or quality of services, or
                      suggest that you will receive a different price or quality.
                    </p>
                  </div>
                </div>
              </div>

              {/* 8.3 How to Submit Requests */}
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neural-900">
                  8.3 How to Submit a Verifiable Consumer Request
                </h3>
                <p className="text-neural-700 mb-3">
                  You (or an authorized agent acting on your behalf) may submit a
                  request by:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1">
                  <li>
                    Emailing{' '}
                    <a href="mailto:privacy@onelastai.co" className="text-blue-600 underline">
                      privacy@onelastai.co
                    </a>{' '}
                    with subject &quot;CCPA Request&quot;
                  </li>
                  <li>Using the Privacy Controls in Dashboard → Preferences</li>
                </ul>
                <p className="text-neural-700 mt-3 text-sm">
                  We will verify your identity by matching information you provide
                  against our existing records. For requests from authorized agents,
                  we require a signed written authorization or power of attorney, and
                  we may still verify the consumer&apos;s identity directly.
                </p>
                <p className="text-neural-700 mt-2 text-sm">
                  <strong>Response timing:</strong> We will acknowledge receipt within
                  10 business days and respond substantively within 45 calendar days
                  from receipt. If we need additional time, we will inform you and may
                  extend by an additional 45 days (90 days total) as permitted by law.
                </p>
              </div>

              {/* 8.4 Financial Incentives */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  8.4 Financial Incentives
                </h3>
                <p className="text-neural-700 text-sm">
                  We do not offer financial incentives, price differences, or service
                  differences in exchange for the retention or sale of personal information.
                </p>
              </div>

              {/* 8.5 Metrics */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  8.5 Metrics Disclosure
                </h3>
                <p className="text-neural-700 text-sm">
                  Per CCPA/CPRA requirements, we will publish annual metrics on the
                  number of requests to know, delete, correct, and opt-out received,
                  complied with (in whole or in part), and denied, along with the
                  median response time.
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ───────────────── 9. CalOPPA COMPLIANCE ───────────────── */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="bg-white rounded-2xl p-8 border-2 border-amber-200 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <ComplianceBadge icon={Globe} label="CalOPPA" color="bg-amber-100 text-amber-800" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                9. CalOPPA Compliance (California Online Privacy Protection Act)
              </h2>
            </div>
            <p className="text-neural-700 mb-6">
              Pursuant to the California Online Privacy Protection Act (Cal. Bus.
              &amp; Prof. Code §§ 22575–22579), we make the following disclosures:
            </p>

            <div className="space-y-6">
              {/* 9.1 Conspicuous Posting */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  9.1 Privacy Policy Accessibility
                </h3>
                <p className="text-neural-700">
                  This Privacy Policy is conspicuously posted and accessible via the
                  &quot;Privacy Policy&quot; link in the footer of every page on{' '}
                  <a href="https://onelastai.co" className="text-blue-600 underline">onelastai.co</a>,
                  as well as from the account registration page and account settings.
                  The link uses the word &quot;Privacy&quot; as required by § 22577(b)(1).
                </p>
              </div>

              {/* 9.2 PII Collected */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  9.2 Categories of Personally Identifiable Information
                </h3>
                <p className="text-neural-700">
                  The categories of PII collected are described in Section 2 above.
                  The categories of third parties with whom PII may be shared are
                  described in Section 4 above.
                </p>
              </div>

              {/* 9.3 Review & Change */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  9.3 Process for Reviewing and Requesting Changes to Your PII (§ 22575(b)(2))
                </h3>
                <p className="text-neural-700">
                  You may review, update, or request changes to your personally
                  identifiable information by:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-1 mt-2">
                  <li>Logging into your account and visiting Dashboard → Profile</li>
                  <li>Emailing <a href="mailto:privacy@onelastai.co" className="text-blue-600 underline">privacy@onelastai.co</a></li>
                </ul>
                <p className="text-neural-700 mt-2 text-sm">
                  We will process your request within 30 days.
                </p>
              </div>

              {/* 9.4 DNT */}
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  9.4 Do Not Track (DNT) Disclosure (§ 22575(b)(5)–(6))
                </h3>
                <p className="text-neural-700 mb-3">
                  <strong>How we respond to DNT signals:</strong> Our services do
                  <strong> not</strong> currently respond to &quot;Do Not Track&quot; browser
                  signals, as there is no industry-standard technology for
                  recognizing or honoring DNT signals. We do not engage in
                  cross-site tracking.
                </p>
                <p className="text-neural-700">
                  <strong>Third-party tracking:</strong> We do not allow third
                  parties to collect personally identifiable information about your
                  individual online activities over time and across different websites
                  when you use our services. We do not use Google Analytics,
                  Facebook Pixel, or other third-party tracking tools.
                </p>
              </div>

              {/* 9.5 Effective Date & Changes */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  9.5 Effective Date and Changes (§ 22575(b)(3)–(4))
                </h3>
                <p className="text-neural-700">
                  The effective date of this Privacy Policy is stated at the top of
                  this page. When we make material changes to this policy, we will
                  notify users via email and/or a prominent notice on our platform at
                  least 30 days before the changes take effect. Continued use of our
                  services after the effective date constitutes acceptance.
                </p>
              </div>
            </div>
          </section>

          {/* ───────────────── 10. PDPA Thailand Compliance ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              10. PDPA Thailand Compliance (Personal Data Protection Act B.E. 2562)
            </h2>
            <p className="text-neural-700 mb-6">
              If you are located in Thailand, the following provisions apply under the{' '}
              <button
                onClick={() => setSelectedArticle(articles.pdpa_thailand)}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                Personal Data Protection Act B.E. 2562 (2019)
              </button>
              , effective June 1, 2022.
            </p>

            <div className="space-y-6">
              {/* 10.1 Data Controller */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  10.1 Data Controller Information
                </h3>
                <p className="text-neural-700">
                  One Last AI acts as the <strong>Data Controller</strong> for personal data
                  collected from users in Thailand. We determine the purposes and means of
                  processing your personal data in accordance with the PDPA.
                </p>
              </div>

              {/* 10.2 Lawful Bases */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  10.2 Lawful Bases for Processing (Section 24)
                </h3>
                <p className="text-neural-700 mb-3">
                  We process your personal data under the following lawful bases:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-purple-50 text-neural-900">
                        <th className="text-left p-3 border border-neural-200 font-semibold">Lawful Basis</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">Processing Activity</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr><td className="p-3 border border-neural-200 font-medium">Consent (Sec. 19)</td><td className="p-3 border border-neural-200">Marketing communications, optional analytics</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Contract Performance (Sec. 24(3))</td><td className="p-3 border border-neural-200">Account creation, service delivery, payment processing, AI interactions</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Legal Obligation (Sec. 24(6))</td><td className="p-3 border border-neural-200">Tax records, fraud prevention, regulatory compliance</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Legitimate Interest (Sec. 24(5))</td><td className="p-3 border border-neural-200">Security, service improvement, abuse prevention</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 10.3 Your Rights Under PDPA Thailand */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  10.3 Your Rights Under PDPA Thailand (Sections 30–42)
                </h3>
                <p className="text-neural-700 mb-3">
                  As a data subject in Thailand, you have the following rights:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-purple-50 text-neural-900">
                        <th className="text-left p-3 border border-neural-200 font-semibold">Right</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr><td className="p-3 border border-neural-200 font-medium">Right to Access (Sec. 30)</td><td className="p-3 border border-neural-200">Request access to your personal data and a copy thereof</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Right to Data Portability (Sec. 31)</td><td className="p-3 border border-neural-200">Receive your data in a structured, machine-readable format</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Right to Object (Sec. 32)</td><td className="p-3 border border-neural-200">Object to processing based on legitimate interests or public interest</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Right to Erasure (Sec. 33)</td><td className="p-3 border border-neural-200">Request deletion or destruction of your personal data</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Right to Restrict Processing (Sec. 34)</td><td className="p-3 border border-neural-200">Request restriction of processing in certain circumstances</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Right to Rectification (Sec. 36)</td><td className="p-3 border border-neural-200">Request correction of inaccurate or incomplete data</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Right to Withdraw Consent (Sec. 19)</td><td className="p-3 border border-neural-200">Withdraw consent at any time (does not affect prior lawful processing)</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Right to Complain (Sec. 73)</td><td className="p-3 border border-neural-200">Lodge a complaint with the Personal Data Protection Committee (PDPC)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 10.4 Cross-Border Transfers */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  10.4 Cross-Border Data Transfers (Section 28)
                </h3>
                <p className="text-neural-700 mb-3">
                  When your data is transferred outside Thailand to our servers, we ensure:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>The destination country has adequate data protection standards as determined by the PDPC</li>
                  <li>Appropriate safeguards are in place (contractual clauses, binding corporate rules)</li>
                  <li>Where required, your explicit consent is obtained for specific transfers</li>
                  <li>All AI provider API calls are server-to-server with no persistent data retention by AI providers</li>
                </ul>
              </div>

              {/* 10.5 Supervisory Authority */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  10.5 Supervisory Authority
                </h3>
                <p className="text-neural-700">
                  The <strong>Personal Data Protection Committee (PDPC)</strong> under
                  the Ministry of Digital Economy and Society is Thailand&apos;s supervisory authority.
                  You may lodge a complaint with the PDPC if you believe your data protection rights
                  have been violated. Contact:{' '}
                  <a href="https://www.pdpc.or.th" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">www.pdpc.or.th</a>.
                </p>
              </div>
            </div>
          </section>

          {/* ───────────────── 11. PDPA Singapore Compliance ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              11. PDPA Singapore Compliance (Personal Data Protection Act 2012)
            </h2>
            <p className="text-neural-700 mb-6">
              If you are located in Singapore, the following provisions apply under the{' '}
              <button
                onClick={() => setSelectedArticle(articles.pdpa_singapore)}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                Personal Data Protection Act 2012
              </button>
              , as amended by the PDPA (Amendment) Act 2020.
            </p>

            <div className="space-y-6">
              {/* 11.1 Data Protection Obligations */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  11.1 Our Data Protection Obligations
                </h3>
                <p className="text-neural-700 mb-3">
                  As an organization processing personal data of Singapore residents, we comply
                  with the following obligations under the PDPA:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-teal-50 text-neural-900">
                        <th className="text-left p-3 border border-neural-200 font-semibold">Obligation</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">How We Comply</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr><td className="p-3 border border-neural-200 font-medium">Consent</td><td className="p-3 border border-neural-200">We obtain consent before collecting, using, or disclosing personal data</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Purpose Limitation</td><td className="p-3 border border-neural-200">Data is used only for purposes stated in this policy</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Notification</td><td className="p-3 border border-neural-200">Users are informed of purposes before or at the time of collection</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Access &amp; Correction</td><td className="p-3 border border-neural-200">Users can request access to and correction of their personal data</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Accuracy</td><td className="p-3 border border-neural-200">We make reasonable efforts to ensure data accuracy</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Protection</td><td className="p-3 border border-neural-200">Reasonable security arrangements to protect personal data (TLS 1.2/1.3, AES-256)</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Retention Limitation</td><td className="p-3 border border-neural-200">Data is not retained longer than necessary for the purposes</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Transfer Limitation</td><td className="p-3 border border-neural-200">Overseas transfers only to jurisdictions with comparable protection</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Data Breach Notification</td><td className="p-3 border border-neural-200">We notify PDPC and affected individuals of significant data breaches</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Accountability</td><td className="p-3 border border-neural-200">We designate a Data Protection Officer and maintain compliance documentation</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 11.2 Your Rights Under PDPA Singapore */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  11.2 Your Rights Under PDPA Singapore
                </h3>
                <p className="text-neural-700 mb-3">
                  As a data subject in Singapore, you have the right to:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li><strong>Access</strong> — Request access to personal data we hold about you</li>
                  <li><strong>Correction</strong> — Request correction of errors or omissions in your personal data</li>
                  <li><strong>Withdraw Consent</strong> — Withdraw consent for collection, use, or disclosure (with reasonable notice)</li>
                  <li><strong>Data Portability</strong> — Request your data in a machine-readable format (per 2020 amendment)</li>
                  <li><strong>Complaint</strong> — Lodge a complaint with the Personal Data Protection Commission (PDPC)</li>
                </ul>
              </div>

              {/* 11.3 Do Not Call Registry */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  11.3 Do Not Call (DNC) Registry
                </h3>
                <p className="text-neural-700">
                  We respect Singapore&apos;s national Do Not Call (DNC) Registry. We do <strong>not</strong> send
                  unsolicited marketing messages via voice calls, SMS, MMS, or fax. All marketing
                  communications are sent only with your explicit prior consent via email.
                </p>
              </div>

              {/* 11.4 Supervisory Authority */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  11.4 Supervisory Authority
                </h3>
                <p className="text-neural-700">
                  The <strong>Personal Data Protection Commission (PDPC)</strong> is
                  Singapore&apos;s data protection authority. You may lodge a complaint with the
                  PDPC at{' '}
                  <a href="https://www.pdpc.gov.sg" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">www.pdpc.gov.sg</a>.
                </p>
              </div>
            </div>
          </section>

          {/* ───────────────── 12. UAE PDPL Compliance ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              12. UAE PDPL Compliance (Federal Decree-Law No. 45 of 2021)
            </h2>
            <p className="text-neural-700 mb-6">
              If you are located in the United Arab Emirates, the following provisions apply under the{' '}
              <button
                onClick={() => setSelectedArticle(articles.uae_pdpl)}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                Federal Decree-Law No. 45 of 2021
              </button>{' '}
              on the Protection of Personal Data, effective January 2, 2022.
            </p>

            <div className="space-y-6">
              {/* 12.1 Data Controller */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  12.1 Data Controller Information
                </h3>
                <p className="text-neural-700">
                  One Last AI acts as the <strong>Data Controller</strong> for personal data
                  collected from users in the UAE. We process your personal data in accordance
                  with the UAE PDPL and its Executive Regulations.
                </p>
              </div>

              {/* 12.2 Lawful Bases */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  12.2 Lawful Bases for Processing (Article 4)
                </h3>
                <p className="text-neural-700 mb-3">
                  We process your personal data under the following lawful bases:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-orange-50 text-neural-900">
                        <th className="text-left p-3 border border-neural-200 font-semibold">Lawful Basis</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">Processing Activity</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr><td className="p-3 border border-neural-200 font-medium">Consent (Art. 4(1))</td><td className="p-3 border border-neural-200">Marketing communications, optional features</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Contract Performance (Art. 4(2))</td><td className="p-3 border border-neural-200">Account creation, service delivery, payment processing</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Legal Obligation (Art. 4(3))</td><td className="p-3 border border-neural-200">Compliance with UAE laws, tax requirements, fraud prevention</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Legitimate Interest (Art. 4(5))</td><td className="p-3 border border-neural-200">Platform security, service improvement, abuse prevention</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 12.3 Your Rights Under UAE PDPL */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  12.3 Your Rights Under UAE PDPL (Articles 13–18)
                </h3>
                <p className="text-neural-700 mb-3">
                  As a data subject in the UAE, you have the following rights:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-orange-50 text-neural-900">
                        <th className="text-left p-3 border border-neural-200 font-semibold">Right</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr><td className="p-3 border border-neural-200 font-medium">Right to Information (Art. 13)</td><td className="p-3 border border-neural-200">Be informed about how your data is processed</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Right to Access (Art. 14)</td><td className="p-3 border border-neural-200">Request access to your personal data</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Right to Portability (Art. 15)</td><td className="p-3 border border-neural-200">Request transfer of your data in a structured format</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Right to Object to Automated Decisions (Art. 16)</td><td className="p-3 border border-neural-200">Object to decisions based solely on automated processing including profiling</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Right to Correction/Erasure (Art. 17)</td><td className="p-3 border border-neural-200">Request correction of inaccurate data or erasure of personal data</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Right to Restrict/Stop Processing (Art. 18)</td><td className="p-3 border border-neural-200">Request restriction or cessation of data processing</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Right to Withdraw Consent</td><td className="p-3 border border-neural-200">Withdraw consent at any time without affecting prior lawful processing</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 12.4 Cross-Border Transfers */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  12.4 Cross-Border Data Transfers (Article 22)
                </h3>
                <p className="text-neural-700 mb-3">
                  When your data is transferred outside the UAE, we ensure compliance with Article 22:
                </p>
                <ul className="list-disc pl-6 text-neural-700 space-y-2">
                  <li>Transfers only to countries with adequate data protection levels as determined by the UAE Data Office</li>
                  <li>Standard Contractual Clauses approved by the UAE Data Office are in place</li>
                  <li>Where required, your explicit consent is obtained for specific international transfers</li>
                  <li>Sector-specific data localisation requirements are respected</li>
                  <li>All AI provider API calls are encrypted server-to-server with no persistent retention</li>
                </ul>
              </div>

              {/* 12.5 UAE Data Office */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">
                  12.5 UAE Data Office (Supervisory Authority)
                </h3>
                <p className="text-neural-700">
                  The <strong>UAE Data Office</strong>, established under the Executive Regulations
                  of the Federal Decree-Law No. 45 of 2021, is the competent supervisory authority.
                  You may lodge a complaint with the UAE Data Office if you believe your data
                  protection rights have been violated.
                </p>
              </div>
            </div>
          </section>

          {/* ───────────────── 13. AI-Specific Data Processing ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              13. AI-Specific Data Processing &amp; Training Disclosure
            </h2>

            <div className="bg-green-50 rounded-xl p-6 border border-green-200 mb-6">
              <p className="text-green-900 font-semibold flex items-center gap-2 mb-2">
                <Shield size={18} />
                We Do Not Use Your Data to Train AI Models — Ever
              </p>
              <p className="text-green-800 text-sm mb-3">
                Your prompts, code, conversations, and generated outputs are used <strong>solely</strong> to provide
                the requested service in real time. Once a response is delivered, we do not retain, analyze, aggregate,
                or reprocess your inputs for any purpose other than displaying your conversation history to you.
              </p>
              <p className="text-green-800 text-sm mb-3">
                <strong>We will never:</strong>
              </p>
              <ul className="list-disc pl-6 text-green-800 text-sm space-y-1 mb-3">
                <li>Use your data to train, fine-tune, or improve any AI model (ours or third-party)</li>
                <li>Sell, license, rent, or share your personal data with any third party for commercial purposes</li>
                <li>Use your data for advertising, profiling, or cross-context behavioral targeting</li>
                <li>Aggregate your data with other users&apos; data for model improvement or research</li>
                <li>Allow any AI provider to use your data for their own training purposes</li>
              </ul>
              <p className="text-green-800 text-sm mb-3">
                <strong>How we protect your data with AI providers:</strong>
              </p>
              <ul className="list-disc pl-6 text-green-800 text-sm space-y-1 mb-3">
                <li><strong>Anthropic (primary provider):</strong> Does not use API data for model training. Zero data retention on their API tier.</li>
                <li><strong>OpenAI:</strong> API data is not used for training when accessed via API keys (our configuration). 30-day retention for abuse monitoring only.</li>
                <li><strong>Google (Gemini):</strong> Processed under Google Cloud&apos;s enterprise data processing terms. Not used for model improvement.</li>
                <li><strong>Mistral AI:</strong> European-headquartered, GDPR-compliant. API data not used for training.</li>
                <li><strong>xAI:</strong> API data processed under xAI&apos;s enterprise API terms. Not used for training.</li>
                <li><strong>Groq &amp; Cerebras:</strong> Inference-only providers. Process prompts in-memory with no persistent storage of request data.</li>
                <li><strong>HuggingFace:</strong> Inference API only. Processing governed by HuggingFace enterprise terms.</li>
                <li><strong>Ollama:</strong> Runs locally on our servers. Data never leaves our infrastructure.</li>
                <li><strong>fal.ai / Minimax:</strong> Video generation processing only. Input prompts are not retained after generation.</li>
                <li><strong>Azure AI Vision:</strong> Image analysis only. Processed under Microsoft&apos;s enterprise data processing agreement.</li>
              </ul>
              <p className="text-green-800 text-sm">
                <strong>All AI calls are made through One Last AI&apos;s own platform API keys.</strong> You never need an account with any AI provider.
                Your interactions are processed server-to-server and routed through our infrastructure — no direct connection between your browser and any AI provider exists.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-neural-900">What We Send to AI Providers</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-neural-100 text-neural-900">
                    <th className="text-left p-3 border border-neural-200 font-semibold">Data Type</th>
                    <th className="text-center p-3 border border-neural-200 font-semibold">Sent?</th>
                    <th className="text-left p-3 border border-neural-200 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-neural-700">
                  <tr>
                    <td className="p-3 border border-neural-200">User text prompts</td>
                    <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                    <td className="p-3 border border-neural-200">Generate AI response</td>
                  </tr>
                  <tr className="bg-neural-50">
                    <td className="p-3 border border-neural-200">Code files in current project</td>
                    <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                    <td className="p-3 border border-neural-200">Contextual code generation</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-neural-200">Conversation history</td>
                    <td className="p-3 border border-neural-200 text-center text-green-600 font-bold">Yes</td>
                    <td className="p-3 border border-neural-200">Multi-turn conversation context</td>
                  </tr>
                  <tr className="bg-neural-50">
                    <td className="p-3 border border-neural-200">User email / name / password</td>
                    <td className="p-3 border border-neural-200 text-center text-red-500 font-bold">No</td>
                    <td className="p-3 border border-neural-200">Never included in AI prompts</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-neural-200">User credentials / deploy tokens</td>
                    <td className="p-3 border border-neural-200 text-center text-red-500 font-bold">No</td>
                    <td className="p-3 border border-neural-200">Never accessible to AI layer</td>
                  </tr>
                  <tr className="bg-neural-50">
                    <td className="p-3 border border-neural-200">Payment information</td>
                    <td className="p-3 border border-neural-200 text-center text-red-500 font-bold">No</td>
                    <td className="p-3 border border-neural-200">Never accessible to AI layer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ───────────────── 14. Data Security ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              14. Data Security
            </h2>
            <p className="text-neural-700 mb-4">
              We implement industry-standard technical and organizational security
              measures to protect your information in accordance with GDPR
              Article 32 and reasonable security procedures required by the CCPA/CPRA:
            </p>
            <ul className="list-disc pl-6 text-neural-700 space-y-2">
              <li>
                <strong className="text-neural-900">Encryption:</strong> TLS 1.2/1.3
                encryption for all data in transit; AES-256-GCM application-level encryption
                for user credentials (deploy tokens, API keys, user secrets); AWS EBS encryption at rest for database; AES-256 S3 server-side encryption for file storage with time-limited signed URLs
              </li>
              <li>
                <strong className="text-neural-900">Authentication:</strong> bcrypt/scrypt
                password hashing (never stored in plaintext), HTTP-only secure JWT session cookies (HMAC-SHA256 signed), optional 2FA
              </li>
              <li>
                <strong className="text-neural-900">Access Controls:</strong>{' '}
                Role-based access control (RBAC), principle of least privilege, CORS restricted to onelastai.co and app domains
              </li>
              <li>
                <strong className="text-neural-900">Monitoring &amp; Lockout:</strong>{' '}
                24/7 security monitoring, intrusion detection, per-IP rate limiting on AI and auth endpoints, 3-tier progressive account lockout (15 min → 24 hr → permanent) after failed login attempts
              </li>
              <li>
                <strong className="text-neural-900">Infrastructure:</strong> AWS
                cloud infrastructure (ap-southeast-1 region) with isolated networks,
                regular security patches, COOP/COEP headers for WebContainer
                SharedArrayBuffer isolation
              </li>
              <li>
                <strong className="text-neural-900">Credential Separation:</strong>{' '}
                User-supplied API keys and deploy tokens are encrypted separately with
                AES-256-GCM, never logged, and never included in AI prompts or server logs
              </li>
              <li>
                <strong className="text-neural-900">Sandbox Isolation:</strong>{' '}
                User code execution runs in isolated AWS ECS Fargate containers (one per session)
              </li>
              <li>
                <strong className="text-neural-900">Regular Audits:</strong>{' '}
                Third-party security assessments and dependency vulnerability scanning
              </li>
              <li>
                <strong className="text-neural-900">Data Backup:</strong> Regular
                encrypted backups with tested disaster recovery procedures
              </li>
            </ul>
            <p className="text-neural-500 mt-4 text-sm">
              While we strive to protect your data using commercially reasonable
              measures, no method of transmission over the Internet or electronic
              storage is 100% secure. In the event of a data breach, we will notify
              affected individuals and supervisory authorities as required by
              applicable law (72 hours under GDPR Art. 33).
            </p>
          </section>

          {/* ───────────────── 15. International Data Transfers ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              15. International Data Transfers
            </h2>
            <p className="text-neural-700 mb-4">
              As a global platform, we may transfer your data to countries outside
              your country of residence, including the United States. We ensure
              appropriate safeguards are in place as required by the GDPR (Chapter V)
              and other applicable laws:
            </p>
            <ul className="list-disc pl-6 text-neural-700 space-y-2">
              <li>
                Standard Contractual Clauses (SCCs) approved by the European
                Commission
              </li>
              <li>Data Processing Agreements with all third-party processors</li>
              <li>Adequacy decisions where applicable</li>
              <li>Supplementary technical measures (encryption, pseudonymization)</li>
              <li>Binding Corporate Rules for intra-group transfers</li>
            </ul>
          </section>

          {/* ───────────────── 16. Children's Privacy ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              16. Children&apos;s Privacy
            </h2>
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <p className="text-neural-700 mb-3">
                <strong className="text-neural-900">Age Restriction:</strong> Our
                services are NOT intended for individuals under 18 years of age. We
                do not knowingly collect personal information from children under 13
                (as defined by COPPA, 15 U.S.C. §§ 6501–6506) or under 16 (as
                defined by GDPR Art. 8 and CCPA for &quot;minors&quot;).
              </p>
              <p className="text-neural-700 mb-3">
                If you are a parent or guardian and believe your child has provided
                us with personal information, please contact us immediately at{' '}
                <a
                  href="mailto:privacy@onelastai.co"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  privacy@onelastai.co
                </a>
                . We will delete such information within 48 hours of verification.
              </p>
              <p className="text-neural-700 text-sm">
                We do not have actual knowledge that we sell or share the personal
                information of consumers under 16 years of age (CCPA § 1798.120(c)).
              </p>
            </div>
          </section>

          {/* ───────────────── 17. Cookies and Tracking ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              17. Cookies and Tracking Technologies
            </h2>
            <p className="text-neural-700 mb-4">
              We use cookies and similar technologies as follows:
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-neural-100 text-neural-900">
                    <th className="text-left p-3 border border-neural-200 font-semibold">Cookie Type</th>
                    <th className="text-left p-3 border border-neural-200 font-semibold">Purpose</th>
                    <th className="text-left p-3 border border-neural-200 font-semibold">Duration</th>
                    <th className="text-left p-3 border border-neural-200 font-semibold">Required?</th>
                  </tr>
                </thead>
                <tbody className="text-neural-700">
                  <tr>
                    <td className="p-3 border border-neural-200 font-medium">Essential</td>
                    <td className="p-3 border border-neural-200">
                      <span className="font-mono text-xs">neural_link_session</span> (JWT auth, 7 days),{' '}
                      <span className="font-mono text-xs">neural_token</span> (backup auth, session),{' '}
                      <span className="font-mono text-xs">session_id</span> (session linking)
                    </td>
                    <td className="p-3 border border-neural-200">Session / 7 days</td>
                    <td className="p-3 border border-neural-200">Yes</td>
                  </tr>
                  <tr className="bg-neural-50">
                    <td className="p-3 border border-neural-200 font-medium">Preference</td>
                    <td className="p-3 border border-neural-200">Theme (dark mode), AI model/provider selection, display settings</td>
                    <td className="p-3 border border-neural-200">1 year</td>
                    <td className="p-3 border border-neural-200">No — opt-out</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-neural-200 font-medium">Analytics</td>
                    <td className="p-3 border border-neural-200">Page views, feature engagement, usage patterns (self-hosted — no Google Analytics)</td>
                    <td className="p-3 border border-neural-200">1 year</td>
                    <td className="p-3 border border-neural-200">No — opt-out</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-neural-700 mb-2">
              We do <strong>not</strong> use third-party advertising cookies or tracking pixels.
              No third-party tracking cookies (Google Analytics, Facebook Pixel, etc.) are used.
              For detailed information including localStorage keys used by our sub-site applications,
              please see our{' '}
              <a
                href="/legal/cookie-policy"
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                Cookie Policy
              </a>.
            </p>
            <p className="text-neural-500 text-sm">
              Under GDPR, non-essential cookies require prior consent (ePrivacy
              Directive Art. 5(3) / &quot;Cookie Law&quot;). Under CalOPPA and CCPA, we
              disclose our cookie practices above.
            </p>
          </section>

          {/* ───────────────── 18. Changes to This Policy ───────────────── */}
          <section className="bg-white rounded-2xl p-8 border border-neural-200 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              18. Changes to This Policy
            </h2>
            <p className="text-neural-700 mb-3">
              We may update this Privacy Policy periodically to reflect changes in
              our practices, legal requirements, or operational needs. When we make
              material changes:
            </p>
            <ul className="list-disc pl-6 text-neural-700 space-y-1">
              <li>We will notify you via email (at the address associated with your account)</li>
              <li>We will post a prominent notice on our platform</li>
              <li>We will update the &quot;Last updated&quot; date at the top of this page</li>
              <li>For changes requiring consent under GDPR, we will obtain your renewed consent</li>
            </ul>
            <p className="text-neural-700 mt-3 text-sm">
              We encourage you to review this Privacy Policy periodically. Your
              continued use of our services after the updated policy becomes effective
              constitutes acceptance of the changes, except where consent is required.
            </p>
          </section>

          {/* ───────────────── 19. Contact Us ───────────────── */}
          <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-white">19. Contact Us</h2>
            <div className="space-y-4 text-blue-100">
              <div>
                <p className="text-white font-semibold mb-1">Data Controller / Business:</p>
                <p>One Last AI</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Data Protection Officer (GDPR):</p>
                <p>
                  Email:{' '}
                  <a href="mailto:dpo@onelastai.co" className="text-white hover:text-blue-200 underline">
                    dpo@onelastai.co
                  </a>
                </p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Privacy Team (General / CCPA Requests):</p>
                <p>
                  Email:{' '}
                  <a href="mailto:privacy@onelastai.co" className="text-white hover:text-blue-200 underline">
                    privacy@onelastai.co
                  </a>
                </p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">General Support:</p>
                <p>
                  Email:{' '}
                  <a href="mailto:support@onelastai.co" className="text-white hover:text-blue-200 underline">
                    support@onelastai.co
                  </a>
                </p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Website:</p>
                <p>
                  <a href="https://onelastai.co" className="text-white hover:text-blue-200 underline">
                    https://onelastai.co
                  </a>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20 space-y-3">
                <p className="text-sm text-blue-100">
                  <strong className="text-white">EU/EEA Representative (GDPR Art. 27):</strong>{' '}
                  For users in the European Union / EEA, you may contact our EU
                  representative regarding data protection matters at{' '}
                  <a href="mailto:eu-rep@onelastai.co" className="text-white underline">eu-rep@onelastai.co</a>.
                </p>
                <p className="text-sm text-blue-100">
                  <strong className="text-white">UK Representative (UK GDPR):</strong>{' '}
                  For users in the United Kingdom, please contact{' '}
                  <a href="mailto:uk-rep@onelastai.co" className="text-white underline">uk-rep@onelastai.co</a>.
                </p>
                <p className="text-sm text-blue-100">
                  <strong className="text-white">California Residents:</strong>{' '}
                  To exercise CCPA/CPRA rights, email{' '}
                  <a href="mailto:privacy@onelastai.co" className="text-white underline">privacy@onelastai.co</a>{' '}
                  with subject &quot;CCPA Request&quot; or use in-app Privacy Controls.
                </p>
                <p className="text-sm text-blue-100">
                  <strong className="text-white">Thailand PDPA Representative:</strong>{' '}
                  For users in Thailand, please contact our PDPA representative at{' '}
                  <a href="mailto:pdpa-th@onelastai.co" className="text-white underline">pdpa-th@onelastai.co</a>{' '}
                  with subject &quot;PDPA Thailand Request&quot;.
                </p>
                <p className="text-sm text-blue-100">
                  <strong className="text-white">Singapore PDPA Representative:</strong>{' '}
                  For users in Singapore, please contact our Data Protection Officer at{' '}
                  <a href="mailto:pdpa-sg@onelastai.co" className="text-white underline">pdpa-sg@onelastai.co</a>{' '}
                  with subject &quot;PDPA Singapore Request&quot;.
                </p>
                <p className="text-sm text-blue-100">
                  <strong className="text-white">UAE PDPL Representative:</strong>{' '}
                  For users in the United Arab Emirates, please contact our UAE data protection representative at{' '}
                  <a href="mailto:pdpl-uae@onelastai.co" className="text-white underline">pdpl-uae@onelastai.co</a>{' '}
                  with subject &quot;UAE PDPL Request&quot;.
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════ SecureTrace Section ═══════════════════ */}
          <section id="securetrace" className="scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 text-neural-900 flex items-center gap-2">
              <Shield size={22} className="text-green-600" />
              SecureTrace — Device Tracking &amp; Recovery
            </h2>
            <div className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
              <strong>Important:</strong> SecureTrace does <strong>NOT</strong> activate tracking when you register your device. Location data is only collected after (1) you file a lost-device report, (2) our security team verifies your identity, and (3) we manually enable tracking. Registration only stores a hashed device fingerprint.
            </div>
            <p className="text-neural-700 mb-6">
              SecureTrace is an optional device protection feature available as a standalone app and
              as an opt-in add-on within the One Last AI platform. This section describes exactly
              what data is collected, how it is used, and your rights regarding that data.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">What SecureTrace Collects</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-neural-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-green-50 text-neural-900">
                        <th className="text-left p-3 border border-neural-200 font-semibold">Data Type</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">Purpose</th>
                        <th className="text-left p-3 border border-neural-200 font-semibold">Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="text-neural-700">
                      <tr><td className="p-3 border border-neural-200 font-medium">GPS Coordinates (lat/lng)</td><td className="p-3 border border-neural-200">Device location for recovery — <strong>collected only AFTER security team manually activates tracking</strong></td><td className="p-3 border border-neural-200">Every 5 min (every 30s if marked lost) — <strong>never at registration</strong></td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Location Accuracy / Altitude</td><td className="p-3 border border-neural-200">Precision tracking</td><td className="p-3 border border-neural-200">With each GPS ping</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Battery Level</td><td className="p-3 border border-neural-200">Device health monitoring</td><td className="p-3 border border-neural-200">With each GPS ping</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Network Type (WiFi / Mobile)</td><td className="p-3 border border-neural-200">Connectivity monitoring</td><td className="p-3 border border-neural-200">With each GPS ping</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Device Fingerprint (hashed)</td><td className="p-3 border border-neural-200">One-device licensing</td><td className="p-3 border border-neural-200">At registration only</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">SIM Serial Hash</td><td className="p-3 border border-neural-200">SIM swap detection / theft alert</td><td className="p-3 border border-neural-200">On SIM state change</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">Camera Image (on-demand)</td><td className="p-3 border border-neural-200">Silent photo on remote command only</td><td className="p-3 border border-neural-200">Only when owner issues command</td></tr>
                      <tr className="bg-neural-50"><td className="p-3 border border-neural-200 font-medium">Device Model / OS</td><td className="p-3 border border-neural-200">Device identification</td><td className="p-3 border border-neural-200">At registration</td></tr>
                      <tr><td className="p-3 border border-neural-200 font-medium">IP Address</td><td className="p-3 border border-neural-200">Security and abuse prevention</td><td className="p-3 border border-neural-200">With each API request</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">How SecureTrace Data Is Used</h3>
                <ul className="list-disc list-inside text-neural-700 space-y-1 text-sm">
                  <li>To enable the device owner to locate their device if it is lost or stolen.</li>
                  <li>To alert the device owner when a SIM card is replaced without authorization.</li>
                  <li>To allow the device owner to trigger a remote alarm, lock, or camera capture.</li>
                  <li>To enforce geofence zones defined by the device owner.</li>
                  <li>Location data is <strong>hidden behind a payment wall</strong> — you must purchase a Location Unlock to view precise GPS coordinates.</li>
                  <li>Data is never sold, shared with advertisers, or used for any purpose other than device recovery.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">Consent &amp; Opt-Out</h3>
                <p className="text-neural-700 text-sm mb-3">
                  SecureTrace is <strong>entirely optional</strong>. You are prompted to register it when
                  first using the One Last AI platform. Clicking &quot;No thanks&quot; permanently opts you out.
                  Clicking &quot;Register Device&quot; stores <em>only</em> a hashed device fingerprint — no tracking occurs.
                </p>
                <p className="text-neural-700 text-sm">
                  To revoke consent after registering, clear your browser&apos;s localStorage (key: <code className="bg-neural-100 px-1 py-0.5 rounded text-xs">sct_opted</code>, <code className="bg-neural-100 px-1 py-0.5 rounded text-xs">st_device_token</code>)
                  and contact us at{' '}
                  <a href="mailto:privacy@onelastai.co" className="text-blue-600 underline">privacy@onelastai.co</a>{' '}
                  to request deletion of your device record.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">Manual Activation Process</h3>
                <p className="text-neural-700 text-sm mb-3">
                  Location tracking is <strong>never automatic</strong>. It follows a verified, multi-step activation process:
                </p>
                <ol className="list-decimal list-inside text-neural-700 space-y-1 text-sm">
                  <li><strong>Device Registration</strong> — you opt in and a hashed fingerprint is stored. No tracking begins.</li>
                  <li><strong>Lost-Device Report</strong> — if your device is stolen, you submit a report including your name, contact information, a government-issued ID reference (hashed — never stored in plain text), and a description of the incident.</li>
                  <li><strong>Identity Verification</strong> — a member of our security team reviews your submission within 24 hours and verifies you are the registered owner.</li>
                  <li><strong>Manual Activation</strong> — only after successful verification does our team manually set the device to &quot;activated&quot;. This is the only way tracking starts.</li>
                </ol>
                <p className="text-neural-700 text-sm mt-3">
                  You can check the status of your report at any time. If your report is rejected or you request deactivation, tracking stops immediately.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">Data Retention</h3>
                <ul className="list-disc list-inside text-neural-700 space-y-1 text-sm">
                  <li><strong>Location history:</strong> 90 days rolling window, then automatically purged.</li>
                  <li><strong>Camera captures:</strong> 30 days, then purged.</li>
                  <li><strong>Device record:</strong> Retained while the device is registered. Deleted on request.</li>
                  <li><strong>SIM alerts:</strong> 90 days for fraud investigation purposes.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">Location Unlock Payment</h3>
                <p className="text-neural-700 text-sm">
                  Precise GPS coordinates are hidden by default. To view the exact location of a registered
                  device, the registered owner must complete a one-time payment via Stripe. This payment
                  is processed securely and we do not store card details. Once unlocked, location data
                  is accessible to the authenticated device owner only.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 text-neural-900">Native App (Android)</h3>
                <p className="text-neural-700 text-sm mb-3">
                  The SecureTrace Android application operates as a background service. It requests the
                  following Android permissions:
                </p>
                <ul className="list-disc list-inside text-neural-700 space-y-1 text-sm">
                  <li><code className="bg-neural-100 px-1 rounded text-xs">ACCESS_FINE_LOCATION</code> + <code className="bg-neural-100 px-1 rounded text-xs">ACCESS_BACKGROUND_LOCATION</code> — GPS tracking</li>
                  <li><code className="bg-neural-100 px-1 rounded text-xs">CAMERA</code> — Remote camera capture (on-command only)</li>
                  <li><code className="bg-neural-100 px-1 rounded text-xs">READ_PHONE_STATE</code> — SIM serial for swap detection</li>
                  <li><code className="bg-neural-100 px-1 rounded text-xs">RECEIVE_BOOT_COMPLETED</code> — Restart tracking after device reboot</li>
                  <li><code className="bg-neural-100 px-1 rounded text-xs">BIND_DEVICE_ADMIN</code> — Optional: prevents unauthorized uninstallation</li>
                </ul>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* ═══════════════════════ Article Popup ═══════════════════════ */}
      {selectedArticle && (
        <ArticlePopup
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}
