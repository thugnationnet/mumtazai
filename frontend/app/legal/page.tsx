import Link from 'next/link';

export default function Legal() {
  const legalDocuments = [
    {
      title: 'Privacy Policy',
      description:
        'Learn how we collect, use, and protect your personal information and data.',
      icon: '🔒',
      href: '/legal/privacy-policy',
      lastUpdated: 'December 15, 2023',
      sections: [
        'Data Collection',
        'Usage & Processing',
        'Data Protection',
        'Your Rights',
      ],
    },
    {
      title: 'Terms of Service',
      description:
        'Understand the terms and conditions for using our AI agent platform.',
      icon: '📋',
      href: '/legal/terms-of-service',
      lastUpdated: 'December 15, 2023',
      sections: [
        'Service Usage',
        'User Responsibilities',
        'Limitations',
        'Termination',
      ],
    },
    {
      title: 'Cookie Policy',
      description:
        'Information about cookies and tracking technologies we use on our website.',
      icon: '🍪',
      href: '/legal/cookie-policy',
      lastUpdated: 'December 15, 2023',
      sections: [
        'Cookie Types',
        'Purpose & Usage',
        'Your Choices',
        'Third-Party Cookies',
      ],
    },
    {
      title: 'Payments & Refunds',
      description:
        'Policies regarding one-time purchases, payments, refunds, and access management.',
      icon: '💳',
      href: '/legal/payments-refunds',
      lastUpdated: 'December 15, 2023',
      sections: [
        'One-Time Purchase Terms',
        'Payment Methods',
        'No Refund Policy',
        'Cancellation',
      ],
    },
    {
      title: 'Reports',
      description:
        'Report inappropriate activities, misuse, or violations of our policies to our trust and safety team.',
      icon: '⚠️',
      href: '/legal/reports',
      lastUpdated: 'October 22, 2024',
      sections: [
        'How to Report',
        'Report Types',
        'Investigation Process',
        'Legal Disclaimer',
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass Ribbons */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        {/* Chrome Sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Legal Information</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Important legal documents and policies governing your use of our AI
            agent platform.
          </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-16">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {legalDocuments.map((document, index) => (
            <Link
              key={index}
              href={document.href}
              className="group bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-4xl mb-4">{document.icon}</div>
              <h3 className="text-xl font-bold text-slate-700 mb-3 group-hover:text-purple-700 transition-colors">
                {document.title}
              </h3>
              <p className="text-slate-500 mb-4 leading-relaxed">
                {document.description}
              </p>
              <div className="text-sm text-slate-400 mb-4">
                Last updated: {document.lastUpdated}
              </div>
              <ul className="space-y-2">
                {document.sections.map((section, sectionIndex) => (
                  <li
                    key={sectionIndex}
                    className="text-sm text-slate-400 flex items-center"
                  >
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></span>
                    {section}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        {/* Compliance Information */}
        <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-slate-700 mb-6 text-center">
            Compliance & Standards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="font-bold text-slate-700 mb-2">GDPR Compliant</h3>
              <p className="text-sm text-slate-500">
                Full compliance with European data protection regulations.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">🔐</div>
              <h3 className="font-bold text-slate-700 mb-2">SOC 2 Type II</h3>
              <p className="text-sm text-slate-500">
                Independently audited security and availability controls.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="font-bold text-slate-700 mb-2">ISO 27001</h3>
              <p className="text-sm text-slate-500">
                International standard for information security management.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="relative overflow-hidden rounded-2xl p-8 text-center themed-section-bg">
          {/* Glass Pillars */}
          <div className="absolute top-0 left-[15%] w-16 h-full bg-gradient-to-b from-white/30 via-purple-200/20 to-transparent rounded-full blur-sm transform -skew-x-3 pointer-events-none" />
          <div className="absolute top-0 right-[15%] w-14 h-full bg-gradient-to-b from-white/25 via-indigo-200/15 to-transparent rounded-full blur-sm transform skew-x-2 pointer-events-none" />
          {/* Chrome Shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Legal Questions?</h2>
            <p className="text-lg text-slate-600 mb-6">
              If you have questions about our legal policies or need clarification
              on any terms.
            </p>
            <Link
              href="/support/contact-us"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Contact Legal Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
