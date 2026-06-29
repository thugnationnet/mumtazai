'use client'

import Link from 'next/link'

export default function WebinarsPage() {
  const upcomingWebinars = [
    {
      title: "Canvas Builder Masterclass: Build Apps with AI in Minutes",
      date: "April 18, 2026",
      time: "2:00 PM EST",
      description: "Learn how to use Canvas Builder to generate full web applications from text prompts. Covers 201 built-in tools, live preview, version history, and one-click deploy.",
      topics: ['Text-to-App Generation', 'Live Preview Modes', 'One-Click Deploy', 'Version History'],
      duration: "60 min",
      level: "Beginner"
    },
    {
      title: "Canvas Studio IDE Deep Dive: Multi-File Projects & Templates",
      date: "April 25, 2026",
      time: "2:00 PM EST",
      description: "Explore Canvas Studio's full IDE — multi-file editor, file tree, sandbox runner, 17 starter templates, voice input, and 6 preview modes. Build real projects live.",
      topics: ['Multi-File Editor', '17 Templates', 'Sandbox Runner', 'Voice Input'],
      duration: "75 min",
      level: "Intermediate"
    },
    {
      title: "AI Agent Workshop: Getting the Most from 18 Specialized Agents",
      date: "May 2, 2026",
      time: "3:00 PM EST",
      description: "Hands-on workshop covering all 18 AI agents — from Einstein and Tech Wizard to Chef Biew and Fitness Guru. Learn agent-specific prompting techniques and API integration.",
      topics: ['Agent Selection', 'Prompt Engineering', 'API Integration', 'Custom Workflows'],
      duration: "90 min",
      level: "All Levels"
    },
    {
      title: "AI Lab Experiments: Battle Arena, Voice Cloning & Neural Art",
      date: "May 16, 2026",
      time: "2:00 PM EST",
      description: "Tour the AI Lab's 13 experiments — pit AI models against each other in Battle Arena, clone voices, generate music, create neural art, and explore beta experiments.",
      topics: ['Battle Arena', 'Voice Cloning', 'Neural Art Studio', 'Music Generator'],
      duration: "60 min",
      level: "All Levels"
    }
  ]

  const recordedWebinars = [
    {
      title: "Platform Overview: Mumtaz AI Complete Tour",
      date: "March 14, 2026",
      description: "Full walkthrough of the Mumtaz AI platform — agents, Canvas Builder, Canvas Studio, AI Lab, tools, data generator, and API integration.",
      duration: "45 min",
      views: "1.2K"
    },
    {
      title: "Building Your First App with Canvas Builder",
      date: "March 7, 2026",
      description: "Step-by-step tutorial: from text prompt to deployed web app. Covers AI model selection, iterating on designs, and publishing to a live URL.",
      duration: "35 min",
      views: "890"
    },
    {
      title: "Multi-AI Model Comparison: GPT-4o vs Claude vs Gemini",
      date: "February 28, 2026",
      description: "Side-by-side comparison of 8 AI models available on Mumtaz AI. Which model is best for code generation, creative writing, analysis, and more.",
      duration: "50 min",
      views: "2.1K"
    },
    {
      title: "API Integration Guide: Embed AI Agents in Your App",
      date: "February 14, 2026",
      description: "Technical session on integrating Mumtaz AI agents into your own applications via REST API, webhooks, and web widget embedding.",
      duration: "55 min",
      views: "670"
    }
  ]

  return (
    <div className="min-h-screen">
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-white/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-purple-100/20 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" style={{ transform: 'skewY(-2deg)' }} />
        <div className="container-custom text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Webinars & Workshops</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Live training sessions, hands-on workshops, and recorded deep dives into every feature on Mumtaz AI
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{upcomingWebinars.length}</div>
              <div className="text-sm text-slate-500">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{recordedWebinars.length}</div>
              <div className="text-sm text-slate-500">Recorded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">Free</div>
              <div className="text-sm text-slate-500">Always</div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Webinars */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-slate-700 mb-2">Upcoming Sessions</h2>
          <p className="text-slate-500 mb-8">Register to attend live and get access to Q&A</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingWebinars.map((webinar, idx) => (
              <div
                key={idx}
                className="p-6 border border-white/60 rounded-2xl hover:shadow-lg transition-all bg-white/40 backdrop-blur-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-700 flex-1 leading-tight">{webinar.title}</h3>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-2 bg-green-100 text-green-700">
                    Upcoming
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">{webinar.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {webinar.topics.map((topic, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100">{topic}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  <span>📅 {webinar.date}</span>
                  <span>🕐 {webinar.time}</span>
                  <span>⏱️ {webinar.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-1 bg-white/40 text-slate-500 rounded-full">{webinar.level}</span>
                  <Link href="/webinars/register-now" className="text-purple-700 font-semibold hover:text-purple-800 text-sm">
                    Register Now →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recorded Webinars */}
      <section className="section-padding bg-white/30">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-slate-700 mb-2">Recorded Sessions</h2>
          <p className="text-slate-500 mb-8">Watch anytime — all recordings are free</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recordedWebinars.map((webinar, idx) => (
              <div
                key={idx}
                className="p-6 border border-white/60 rounded-2xl hover:shadow-lg transition-all bg-white/30 backdrop-blur-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-700 flex-1 leading-tight">{webinar.title}</h3>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-2 bg-white/40 text-slate-500">
                    Recorded
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">{webinar.description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  <span>📅 {webinar.date}</span>
                  <span>⏱️ {webinar.duration}</span>
                  <span>👁️ {webinar.views} views</span>
                </div>
                <Link href="/webinars/register-now" className="text-purple-700 font-semibold hover:text-purple-800 text-sm">
                  Watch Recording →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-14 md:py-20 overflow-hidden themed-section-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
        <div className="container-custom max-w-3xl text-center relative z-10">
          <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Never Miss a Session</h2>
          <p className="text-lg text-slate-600 mb-8">
            All webinars are free. Register for upcoming sessions to get calendar invites and Q&A access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/webinars/register-now" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-purple-500/25">
              Register for Next Session
            </Link>
            <Link href="/resources" className="inline-block px-8 py-3 bg-white/60 hover:bg-white/80 text-slate-800 rounded-xl font-semibold transition-colors border border-white/60">
              Browse All Resources
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
