import Link from 'next/link'
import { Shield, Lock, Server, FileCheck, Activity, Bug, Key, Fingerprint, RefreshCw, AlertTriangle, Eye, Bell } from 'lucide-react'

export default function Security() {
  const securityFeatures = [
    {
      title: "Data Encryption",
      description: "All data is encrypted in transit and at rest using industry-standard AES-256 encryption.",
      icon: Lock,
      color: 'from-blue-500 to-cyan-500',
      details: ["End-to-end encryption", "TLS 1.3 for data in transit", "AES-256 for data at rest", "Regular encryption audits"]
    },
    {
      title: "Access Control",
      description: "Advanced authentication and authorization mechanisms to protect your accounts.",
      icon: Fingerprint,
      color: 'from-purple-500 to-pink-500',
      details: ["Multi-factor authentication (MFA)", "Role-based access control (RBAC)", "Single Sign-On (SSO)", "API key management"]
    },
    {
      title: "Infrastructure Security",
      description: "Enterprise-grade infrastructure with multiple layers of security protection.",
      icon: Server,
      color: 'from-green-500 to-emerald-500',
      details: ["Cloud-based redundancy", "DDoS protection", "Firewall protection", "Intrusion detection systems"]
    },
    {
      title: "Compliance & Certifications",
      description: "We maintain the highest industry standards and certifications.",
      icon: FileCheck,
      color: 'from-orange-500 to-red-500',
      details: ["SOC 2 Type II certified", "GDPR compliant", "ISO 27001 certified", "HIPAA compliant"]
    },
    {
      title: "Monitoring & Logging",
      description: "Continuous monitoring and comprehensive logging of all system activities.",
      icon: Activity,
      color: 'from-indigo-500 to-purple-500',
      details: ["24/7 system monitoring", "Detailed audit logs", "Real-time alerts", "Security incident response"]
    },
    {
      title: "Vulnerability Management",
      description: "Proactive identification and remediation of security vulnerabilities.",
      icon: Bug,
      color: 'from-teal-500 to-green-500',
      details: ["Regular penetration testing", "Security code reviews", "Bug bounty program", "Vulnerability scanning"]
    }
  ]

  const complianceStandards = [
    {
      name: "GDPR",
      description: "General Data Protection Regulation compliance for EU users",
      icon: "🇪🇺",
      color: 'from-blue-500 to-indigo-500',
      features: ["Data privacy rights", "Consent management", "Data portability", "Right to be forgotten"]
    },
    {
      name: "SOC 2 Type II",
      description: "Independently audited security, availability, and confidentiality controls",
      icon: "📋",
      color: 'from-emerald-500 to-teal-500',
      features: ["Security controls", "Availability controls", "Processing integrity", "Confidentiality controls"]
    },
    {
      name: "ISO 27001",
      description: "International standard for information security management systems",
      icon: "🌍",
      color: 'from-purple-500 to-violet-500',
      features: ["Information security policies", "Risk management", "Access control", "Incident management"]
    },
    {
      name: "HIPAA",
      description: "Health Insurance Portability and Accountability Act compliance",
      icon: "🏥",
      color: 'from-rose-500 to-pink-500',
      features: ["Protected health information", "Business associate agreements", "Privacy safeguards", "Security safeguards"]
    }
  ]

  const bestPractices = [
    {
      title: "Use Strong Passwords",
      description: "Create passwords with at least 12 characters including uppercase, lowercase, numbers, and symbols.",
      icon: Key,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: "Enable MFA",
      description: "Always enable multi-factor authentication on your account for an extra layer of security.",
      icon: Lock,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: "Keep Software Updated",
      description: "Regularly update your browser and operating system to receive the latest security patches.",
      icon: RefreshCw,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: "Be Cautious with Links",
      description: "Don't click suspicious links or download files from untrusted sources.",
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: "Review Access Logs",
      description: "Regularly review your account access logs and remove any unauthorized sessions.",
      icon: Eye,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: "Report Vulnerabilities",
      description: "Report any security issues to our security team at security@mumtaz.ai.",
      icon: Bell,
      color: 'from-teal-500 to-green-500',
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section - matching tools page style */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/60 mb-6">
              <Shield className="w-8 h-8 text-purple-700" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">Security & Compliance</h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Your data security and privacy are our top priorities. We employ enterprise-grade security measures and maintain the highest industry standards.
            </p>
          </div>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Quick Stats */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="glass-card p-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">AES-256</div>
                <div className="text-xs text-slate-500">Encryption</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">99.99%</div>
                <div className="text-xs text-slate-500">Uptime SLA</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">SOC 2</div>
                <div className="text-xs text-slate-500">Certified</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">24/7</div>
                <div className="text-xs text-slate-500">Monitoring</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700">Security Features</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {securityFeatures.length} areas
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="group glass-card p-6 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="text-sm text-slate-500 flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Standards */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700">Compliance Standards</h2>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
              {complianceStandards.length} certifications
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceStandards.map((standard, index) => (
              <div key={index} className="group glass-card p-6 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${standard.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="text-xl">{standard.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                  {standard.name}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {standard.description}
                </p>
                <ul className="space-y-2">
                  {standard.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-xs text-slate-500 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2 flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Security Best Practices */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700">Security Best Practices</h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Tips for you
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestPractices.map((practice, index) => (
              <div key={index} className="group glass-card p-6 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${practice.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <practice.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                  {practice.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {practice.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Security FAQ */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700">Security FAQ</h2>
          </div>
          <div className="max-w-4xl space-y-4">
            {[
              {
                q: "Where is my data stored?",
                a: "Your data is stored in secure, redundant data centers across multiple geographic locations. All data is encrypted both in transit and at rest."
              },
              {
                q: "How often do you perform security audits?",
                a: "We perform comprehensive security audits quarterly and maintain continuous monitoring. We also engage third-party security firms for penetration testing twice yearly."
              },
              {
                q: "Can I export my data?",
                a: "Yes, you can export your data at any time in standard formats. We support GDPR data portability requirements for all users."
              },
              {
                q: "What happens if there's a data breach?",
                a: "In the unlikely event of a breach, we will notify affected users within 24 hours as required by law. We maintain comprehensive incident response procedures."
              },
              {
                q: "Is my data shared with third parties?",
                a: "No, we do not sell or share your personal data with third parties. We only share data with service providers under strict data processing agreements."
              },
              {
                q: "How do I enable two-factor authentication?",
                a: "You can enable 2FA in your account settings. We support authenticator apps and SMS-based verification methods for maximum security."
              }
            ].map((faq, index) => (
              <div key={index} className="glass-card p-6 hover:shadow-md hover:border-blue-200 transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-700 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Report Security Issue CTA */}
        <div className="max-w-4xl mx-auto mt-16 mb-16">
          <div className="neu-hero rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Report a Security Issue</h2>
            <p className="text-lg opacity-90 mb-4">
              If you discover a security vulnerability, please report it responsibly to our security team.
            </p>
            <div className="bg-slate-200 rounded-xl p-6 backdrop-blur-sm inline-block mb-6">
              <p className="text-sm mb-2 opacity-80">Security Email</p>
              <a href="mailto:security@mumtaz.ai" className="text-xl font-semibold hover:underline">
                security@mumtaz.ai
              </a>
            </div>
            <p className="text-sm opacity-80">
              Please provide detailed information about the vulnerability and allow 48 hours for our team to respond.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto">
          <div className="relative py-14 overflow-hidden rounded-[2rem] themed-section-bg">
            <div className="absolute -top-20 -left-10 w-[160px] h-[450px] rotate-[25deg] rounded-[80px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
            <div className="absolute -top-24 right-[10%] w-[140px] h-[500px] rotate-[-20deg] rounded-[80px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
            <div className="absolute -bottom-32 left-[30%] w-[120px] h-[400px] rotate-[35deg] rounded-[80px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
            <div className="absolute -bottom-16 -right-10 w-[180px] h-[420px] rotate-[-30deg] rounded-[80px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
            <div className="relative z-10 text-center px-8 md:px-12">
              <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Ready to Get Started?</h2>
              <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed">
                Your security is guaranteed. Start using our AI platform with confidence today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="px-7 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">
                  Create Account
                </Link>
                <Link href="/legal/privacy-policy" className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
