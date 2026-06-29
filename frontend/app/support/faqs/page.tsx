'use client';

import Link from 'next/link';

export default function FAQsPage() {
  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'What is Mumtaz AI?',
          a: 'Mumtaz AI is a comprehensive AI platform featuring 20+ specialized AI agents, an AI Studio for interactive conversations, Canvas for real-time code and content generation, and developer tools including APIs and SDKs. Each agent specializes in different areas like physics, programming, cooking, fitness, and entertainment.',
        },
        {
          q: 'How do I get started?',
          a: 'Create your account, browse our AI agents at /agents, and choose the one that fits your needs. Pricing per agent: $5/day, $7/week, $30/month, or $300/year — one-time purchase, no auto-renewal. Once purchased, access your agent through the Studio at /studio for interactive conversations or use Canvas for code generation.',
        },
        {
          q: 'What is the AI Studio?',
          a: 'The AI Studio (/studio) is your central hub for interacting with AI agents. It features a modern chat interface, conversation history, real-time streaming responses, and integration with Canvas for generating live code, applications, and content.',
        },
        {
          q: 'What is Canvas?',
          a: 'Canvas is our real-time code and content generation tool. When chatting with agents in Studio, you can open Canvas to generate live React applications, HTML pages, and interactive content. Canvas renders your creations instantly in a preview panel alongside your conversation.',
        },
        {
          q: 'Do I need technical skills?',
          a: 'No! Mumtaz AI is designed for everyone. Non-technical users can chat with agents naturally, while developers can leverage our APIs, SDKs, and Canvas for advanced integrations. We provide tutorials for all skill levels.',
        },
        {
          q: 'What agents are available?',
          a: 'We offer 20+ AI agents including Einstein (Physics & Math), Tech Wizard (Programming), Chef Biew (Cooking), Fitness Guru (Health), Travel Buddy (Travel), Comedy King (Entertainment), Emma (Emotional Support), and specialized agents for business, education, and creativity.',
        },
      ],
    },
    {
      category: 'Studio & Canvas',
      questions: [
        {
          q: 'How do I access the Studio?',
          a: 'Visit /studio after logging in. Select any agent you have access to and start chatting. The Studio provides a clean interface with your conversation on the left and optional Canvas panel on the right for code generation.',
        },
        {
          q: 'How does Canvas code generation work?',
          a: 'When chatting in Studio, ask an agent to create an app, webpage, or code snippet. Click the Canvas button to open the preview panel. The agent generates React/HTML code that renders live in Canvas, allowing you to see and interact with creations in real-time.',
        },
        {
          q: 'What can Canvas generate?',
          a: 'Canvas can generate React applications, HTML/CSS pages, interactive components, data visualizations, forms, dashboards, games, and more. The generated code is fully functional and can be exported for use in your projects.',
        },
        {
          q: 'Can I export code from Canvas?',
          a: 'Yes! You can copy the generated code directly from the Canvas panel. The code is production-ready React or HTML that you can use in your own projects. Premium users get additional export options and file downloads.',
        },
        {
          q: 'Is conversation history saved?',
          a: 'Yes. All your conversations are automatically saved and synced across devices. You can access previous conversations, continue where you left off, or start new chats at any time from the Studio.',
        },
        {
          q: 'Can I use multiple agents in one session?',
          a: 'Yes! You can switch between any agents you have access to within the Studio. Each agent maintains its own conversation context, and you can have multiple chat sessions open simultaneously.',
        },
      ],
    },
    {
      category: 'Billing & Pricing',
      questions: [
        {
          q: 'What are the pricing plans?',
          a: 'We offer simple per-agent pricing: $5/day, $7/week, $30/month, or $300/year. Each one-time purchase gives you unlimited access to one AI agent including Studio chat, Canvas generation, and API access. No auto-renewal—pay only when you want access.',
        },
        {
          q: "What does 'per agent' pricing mean?",
          a: "Each purchase gives you full access to one AI agent. If you want multiple agents, purchase them separately. This lets you choose exactly what you need—pay for Einstein for a day of math help, or get monthly access to Tech Wizard for ongoing coding projects.",
        },
        {
          q: 'What\'s included in each purchase?',
          a: 'Every purchase includes: unlimited Studio chat sessions, Canvas code generation, conversation history sync, API access with generous rate limits, and all future updates to that agent during your access period.',
        },
        {
          q: 'Can I cancel anytime?',
          a: "Yes! There's no auto-renewal. Your access simply expires at the end of the period. You keep access until expiration and can repurchase whenever you want. No cancellation needed—just don't renew.",
        },
        {
          q: 'Do you offer refunds?',
          a: 'Yes. Full refunds within 30 days, 50% refunds between 30-60 days. After 60 days, no refunds but you can always let your access expire naturally. Contact support for refund requests.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards (Visa, Mastercard, American Express) via Stripe, plus PayPal and bank transfers for enterprise customers. All payments are securely processed.',
        },
      ],
    },
    {
      category: 'Account & Security',
      questions: [
        {
          q: 'Is my data secure?',
          a: 'Yes. We use enterprise-grade encryption (AES-256), SOC 2 Type II compliance, and regular security audits. All communications use HTTPS. Conversations are encrypted at rest and in transit.',
        },
        {
          q: 'How do I reset my password?',
          a: "Click 'Forgot Password' on the login page. You'll receive a secure reset link via email (expires in 24 hours). For account security, we recommend enabling two-factor authentication.",
        },
        {
          q: 'How do I enable two-factor authentication?',
          a: 'Go to Account Settings → Security → Enable 2FA. We support authenticator apps (Google Authenticator, Authy, Microsoft Authenticator) for secure verification.',
        },
        {
          q: 'Can I export my conversation data?',
          a: 'Yes. Export your conversation history in JSON or CSV format from Account Settings → Data → Export. This includes all chats, Canvas creations, and metadata.',
        },
        {
          q: 'What happens to my data if I delete my account?',
          a: 'All personal data and conversations are permanently deleted within 30 days. You can request immediate deletion of specific data. We retain minimal anonymized metadata for legal compliance only.',
        },
        {
          q: 'How do I delete specific conversations?',
          a: 'In Studio, hover over any conversation in your history and click the delete icon. You can also bulk delete from Account Settings. Deleted conversations cannot be recovered.',
        },
      ],
    },
    {
      category: 'API & Developer Tools',
      questions: [
        {
          q: 'Do you have an API?',
          a: 'Yes! We provide a comprehensive REST API at /docs/api. All agent purchases include API access. You get chat endpoints, streaming support, Canvas generation APIs, and webhooks for integrations.',
        },
        {
          q: 'What SDKs are available?',
          a: 'We offer official SDKs for JavaScript/Node.js, Python, Go, PHP, Ruby, and Java. Each SDK includes type definitions, async support, and examples. See /docs/sdks for installation and usage.',
        },
        {
          q: "What's the API rate limit?",
          a: 'Default: 1000 requests/hour per agent. Daily purchases: 500 calls/day. Weekly: 2,500/week. Monthly: 15,000/month. Enterprise users can request higher limits. Limits are generous for typical usage.',
        },
        {
          q: 'Do you support streaming responses?',
          a: 'Yes! Our API supports Server-Sent Events (SSE) for real-time streaming. Get responses token-by-token as they generate, just like in the Studio interface. See our streaming documentation for examples.',
        },
        {
          q: 'Can I use webhooks?',
          a: 'Yes. Configure webhooks to receive real-time notifications for events like message completion, canvas generation, or conversation updates. Available for all paid plans.',
        },
        {
          q: 'How do I get my API key?',
          a: 'Go to Account Settings → Developer → API Keys. Generate a new key and keep it secure. You can create multiple keys with different permissions and rotate them as needed.',
        },
      ],
    },
    {
      category: 'Features & Usage',
      questions: [
        {
          q: 'How many conversations can I have?',
          a: 'Unlimited! Create as many chat sessions as you want with any agent you have access to. All conversations are saved automatically and searchable from your Studio dashboard.',
        },
        {
          q: "Can I customize an agent's behavior?",
          a: 'Yes. You can set custom system prompts, adjust response styles, and configure context preferences. Monthly subscribers get advanced customization including personality fine-tuning and saved prompt templates.',
        },
        {
          q: 'What integrations are available?',
          a: 'We support Slack, Microsoft Teams, Discord, Zapier, Make.com, and direct API integration. Connect agents to your existing workflows or build custom integrations with our APIs.',
        },
        {
          q: 'Can I use Mumtaz AI offline?',
          a: 'Mumtaz AI requires an internet connection as AI processing happens on our servers. However, you can export conversations for offline reference, and our mobile experience is optimized for varying connectivity.',
        },
        {
          q: 'Are there mobile apps?',
          a: 'Our web app is fully responsive and works great on mobile browsers. Native iOS and Android apps are coming soon. You can also add the site to your home screen for an app-like experience.',
        },
        {
          q: 'Can I use Mumtaz AI for commercial purposes?',
          a: 'Yes! All paid plans include commercial usage rights. Use agent outputs in your products, services, or business operations. Enterprise plans include additional SLAs and licensing options.',
        },
      ],
    },
    {
      category: 'Agents & Personalities',
      questions: [
        {
          q: 'How do agents differ from each other?',
          a: 'Each agent is specialized: Einstein excels at physics and math, Tech Wizard at programming and debugging, Chef Biew at recipes and cooking techniques, Emma at emotional support, and so on. Choose the agent that matches your task.',
        },
        {
          q: 'Can agents generate code?',
          a: 'Yes! Many agents can generate code, especially Tech Wizard. Use Canvas for live code preview—generate React apps, HTML pages, algorithms, and more. The code renders in real-time so you can see it working.',
        },
        {
          q: 'Do agents remember previous conversations?',
          a: 'Within a session, agents maintain full context. Across sessions, they can access your conversation history for continuity. For privacy, we don\'t use your data to train other users\' experiences.',
        },
        {
          q: 'Can I suggest new agents?',
          a: 'Absolutely! We love community suggestions. Submit ideas through our feedback portal or contact support. Popular suggestions often become new agents in future releases.',
        },
        {
          q: 'How often are agents updated?',
          a: 'Agents receive continuous improvements. Major updates ship monthly with new capabilities, knowledge updates, and performance enhancements based on user feedback and AI advances.',
        },
        {
          q: 'Can I create my own agent?',
          a: 'Enterprise customers can create custom agents with specialized knowledge bases and personalities. Contact our sales team at /support/contact-us to discuss custom agent development.',
        },
      ],
    },
    {
      category: 'Support & Help',
      questions: [
        {
          q: 'How do I get support?',
          a: 'Visit /support for options: check this FAQ, browse our Help Center, create a support ticket, or use live chat (available for paid users). Enterprise customers get dedicated account managers.',
        },
        {
          q: 'What are the support response times?',
          a: 'Free accounts: 24-48 hours. Paid users: 2-4 hours. Enterprise: 1 hour with priority queue. Live chat provides immediate help during business hours.',
        },
        {
          q: 'Where can I find documentation?',
          a: 'Visit /docs for complete documentation including: Getting Started guides, API reference, SDK tutorials, Canvas documentation, integration guides, and best practices.',
        },
        {
          q: 'Are there video tutorials?',
          a: 'Yes! Check /resources/tutorials for step-by-step video guides on using agents, Studio, Canvas, APIs, and integrations. New tutorials are added regularly.',
        },
        {
          q: 'Can I book a demo or consultation?',
          a: 'Yes! Schedule a free consultation at /support/book-consultation. Enterprise customers can request personalized demos and technical deep-dives.',
        },
        {
          q: 'How do I report a bug?',
          a: 'Report bugs through /support/create-ticket with details about what happened, steps to reproduce, and any error messages. Our team investigates all reports promptly.',
        },
      ],
    },
    {
      category: 'Performance & Reliability',
      questions: [
        {
          q: "What's your uptime guarantee?",
          a: 'We maintain 99.9% uptime with infrastructure across multiple data centers and automatic failover. Check real-time status at /status. Enterprise plans include custom SLAs.',
        },
        {
          q: 'How fast are responses?',
          a: 'Most responses begin streaming within 1-2 seconds. Full responses typically complete in 2-8 seconds depending on length and complexity. Canvas generation adds 1-3 seconds for rendering.',
        },
        {
          q: 'What AI models power the agents?',
          a: 'We use state-of-the-art AI models, automatically selected and fine-tuned for each agent\'s specialty. We continuously update to the latest model versions.',
        },
        {
          q: 'Can the platform handle high volume?',
          a: 'Yes! Our infrastructure auto-scales to handle demand. Enterprise customers can request dedicated capacity for consistent performance during peak usage.',
        },
      ],
    },
    {
      category: 'Compliance & Legal',
      questions: [
        {
          q: 'Is Mumtaz AI GDPR compliant?',
          a: 'Yes! We\'re fully GDPR compliant with data subject rights, DPA agreements, and compliance tools. EU users can request EU data residency. See /security for details.',
        },
        {
          q: 'Do you comply with HIPAA?',
          a: 'Enterprise customers can enable HIPAA-compliant infrastructure with BAA agreements. Contact sales for healthcare compliance options.',
        },
        {
          q: 'How is my data used?',
          a: 'Your data is used only to provide the service. We don\'t sell data or train on individual conversations. Aggregated, anonymized usage helps improve the platform. See our privacy policy for full details.',
        },
        {
          q: 'Can I get compliance documentation?',
          a: 'Yes. SOC 2 Type II reports and compliance certifications are available under NDA for Enterprise and Professional customers. Contact support to request documentation.',
        },
        {
          q: 'What are the terms of service?',
          a: 'Our terms of service at /legal/terms-of-service cover usage rights, acceptable use, liability, and your responsibilities. The privacy policy at /legal/privacy-policy details data handling.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen themed-section-bg">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Find answers to common questions about Mumtaz AI, our agents, Studio, Canvas, and more
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 border-b border-white/60">
        <div className="container-custom max-w-4xl">
          <div className="flex flex-wrap justify-center gap-3">
            {faqs.map((category, idx) => (
              <a
                key={idx}
                href={`#${category.category.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white/40 backdrop-blur-sm border border-white/60 hover:bg-white/60 hover:text-purple-600 rounded-full transition-colors"
              >
                {category.category}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <div className="space-y-12">
            {faqs.map((category, catIdx) => (
              <div key={catIdx} id={category.category.toLowerCase().replace(/\s+/g, '-')}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-purple-200 flex items-center gap-3">
                  <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                  {category.category}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((item, qIdx) => (
                    <details
                      key={qIdx}
                      className="group bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg hover:border-purple-300 hover:shadow-md transition-all"
                    >
                      <summary className="font-semibold text-gray-900 p-5 flex items-center justify-between cursor-pointer group-open:text-purple-600 group-open:border-b group-open:border-white/60">
                        <span className="pr-4">{item.q}</span>
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/40 group-hover:bg-purple-100 group-open:bg-purple-600 group-open:text-white transition-all">
                          <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </summary>
                      <p className="text-gray-600 p-5 pt-4 leading-relaxed">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-14 overflow-hidden rounded-[2rem] mx-4 mb-8 themed-section-bg" >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-violet-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-1/3 w-56 h-56 bg-fuchsia-300/20 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-40 h-40 bg-indigo-300/20 rounded-full blur-3xl" />
        </div>
        <div className="container-custom max-w-3xl text-center relative z-10">
          <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
            Can't find your answer?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Our support team is here to help. Reach out to us anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support/contact-us"
              className="px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105"
            >
              Contact Support
            </Link>
            <Link
              href="/support/create-ticket"
              className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm"
            >
              Create Ticket
            </Link>
            <Link
              href="/docs"
              className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm"
            >
              Browse Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
