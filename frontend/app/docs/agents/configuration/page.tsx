'use client';

import Link from 'next/link';
import { ArrowLeft, Settings, Sliders, Palette, Volume2, Zap } from 'lucide-react';

export default function ConfigurationPage() {
  return (
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
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Agent Configuration</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Master the settings and customization options to tailor agents to your specific needs.
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Back Button */}
        <Link href="/docs/agents" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Overview */}
          <section className="glass-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-xl p-2"><Settings className="w-6 h-6 text-blue-600" /></div>
              <h2 className="text-2xl font-bold text-slate-800">Configuration Overview</h2>
            </div>
            <p className="text-slate-500 mb-4">
              Each agent can be configured to match your preferences and use case. Configuration options include response style, 
              behavior, language, and specialized parameters based on the agent's domain. These settings persist across sessions.
            </p>
          </section>

          {/* Core Settings */}
          <section className="glass-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 rounded-xl p-2"><Sliders className="w-6 h-6 text-purple-600" /></div>
              <h2 className="text-2xl font-bold text-slate-800">Core Configuration Settings</h2>
            </div>

            <div className="space-y-6">
              {/* Setting 1 */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Response Tone</h3>
                <p className="text-slate-500 mb-3">Control how the agent communicates with you:</p>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-2">
                  <li><strong>Professional</strong> - Formal, business-appropriate language</li>
                  <li><strong>Casual</strong> - Friendly, conversational tone</li>
                  <li><strong>Technical</strong> - Detailed, specification-focused responses</li>
                  <li><strong>Balanced</strong> - Mix of professional and approachable tone</li>
                </ul>
              </div>

              {/* Setting 2 */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Response Length</h3>
                <p className="text-slate-500 mb-3">Adjust the detail level of responses:</p>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-2">
                  <li><strong>Brief</strong> - Short, concise answers (1-2 sentences)</li>
                  <li><strong>Standard</strong> - Balanced information (2-4 paragraphs)</li>
                  <li><strong>Detailed</strong> - Comprehensive responses with examples</li>
                  <li><strong>Comprehensive</strong> - In-depth analysis with all relevant details</li>
                </ul>
              </div>

              {/* Setting 3 */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Language</h3>
                <p className="text-slate-500">
                  Choose your preferred language for all agent responses. Supported languages include English, Spanish, French, German, Chinese, Japanese, and more.
                </p>
              </div>

              {/* Setting 4 */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Creativity Level</h3>
                <p className="text-slate-500 mb-3">Control how creative or conservative the agent's responses are:</p>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-2">
                  <li><strong>Conservative</strong> - Stick to facts and proven information</li>
                  <li><strong>Balanced</strong> - Mix of facts with thoughtful insights</li>
                  <li><strong>Creative</strong> - More imaginative and exploratory responses</li>
                </ul>
              </div>

              {/* Setting 5 */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Context Awareness</h3>
                <p className="text-slate-500 mb-3">Manage how the agent uses your conversation history:</p>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-2">
                  <li><strong>Enabled</strong> - Agent remembers all previous messages in the conversation</li>
                  <li><strong>Limited</strong> - Agent only remembers the last 5-10 messages</li>
                  <li><strong>Disabled</strong> - Each message is treated independently (fresh start)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Advanced Settings */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Advanced Settings</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Domain Focus</h3>
                <p className="text-slate-500 mb-3">
                  Specify particular areas or subtopics where you want the agent to concentrate. For example, with Tech Wizard, you could focus on Web Development, Data Science, or DevOps. This narrows the expertise area for more targeted assistance.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Citation Mode</h3>
                <p className="text-slate-500 mb-3">
                  Control whether the agent includes sources and references in responses. Options include:
                </p>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-4">
                  <li>No Citations - Clean responses without reference markers</li>
                  <li>Inline Citations - References embedded within the text</li>
                  <li>Full Citations - Detailed source list at the end of responses</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Output Format</h3>
                <p className="text-slate-500 mb-3">
                  Choose how responses are structured:
                </p>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-4">
                  <li>Narrative - Flowing paragraph text</li>
                  <li>Bullet Points - Key information as a list</li>
                  <li>Structured - Organized with headers and sections</li>
                  <li>Code Format - For technical agents, formatted with syntax highlighting</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Safety & Moderation</h3>
                <p className="text-slate-500">
                  Agents include built-in safety measures. You can adjust the moderation level from strict (filters most potentially sensitive content) to lenient (minimal filtering) based on your needs.
                </p>
              </div>
            </div>
          </section>

          {/* Agent-Specific Settings */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Agent-Specific Settings</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Einstein (Scientific Research)</h3>
                <p className="text-slate-500 text-sm">
                  Configure focus areas (Physics, Chemistry, Biology, etc.), citation style (APA, MLA, Chicago), and depth of technical explanation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Tech Wizard (Technology Support)</h3>
                <p className="text-slate-500 text-sm">
                  Set programming language preferences, framework focus, difficulty level, and whether to include code examples.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Travel Buddy (Travel Planning)</h3>
                <p className="text-slate-500 text-sm">
                  Specify budget range, travel style preferences, climate preferences, and time constraints for personalized recommendations.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Chef Biew (Culinary Arts)</h3>
                <p className="text-slate-500 text-sm">
                  Configure dietary restrictions, cuisine preferences, skill level, cooking equipment availability, and serving size defaults.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Fitness Guru (Health & Fitness)</h3>
                <p className="text-slate-500 text-sm">
                  Set fitness goals, current fitness level, available equipment, dietary preferences, and any physical limitations.
                </p>
              </div>
            </div>
          </section>

          {/* Configuration Best Practices */}
          <section className="bg-green-50 border border-green-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Configuration Best Practices</h2>
            <div className="space-y-3 text-slate-600">
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Start with defaults</strong> - Try standard settings first, then adjust based on your experience</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Test before committing</strong> - Try different settings in a few conversations to find what works</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Save presets</strong> - Store your favorite configurations for different use cases</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Adjust incrementally</strong> - Change one setting at a time to see its impact</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Document your preferences</strong> - Keep notes on which settings work best for your goals</span>
              </div>
            </div>
          </section>

          {/* Accessing Configuration */}
          <section className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">How to Access Settings</h2>
            <ol className="list-decimal list-inside space-y-4 text-slate-600">
              <li>Open any agent conversation</li>
              <li>Click the Settings icon (gear icon) in the top-right corner</li>
              <li>A settings panel will appear on the right side of the screen</li>
              <li>Adjust any configuration options as desired</li>
              <li>Changes are saved automatically and applied immediately</li>
            </ol>
          </section>

          {/* Related Links */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Link 
              href="/docs/agents/getting-started"
              className="p-4 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 transition-colors"
            >
              <h3 className="font-semibold text-purple-600 mb-2">← Getting Started</h3>
              <p className="text-slate-500 text-sm">New to agents? Start here.</p>
            </Link>
            <Link 
              href="/docs/agents/best-practices"
              className="p-4 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 transition-colors"
            >
              <h3 className="font-semibold text-purple-600 mb-2">Best Practices →</h3>
              <p className="text-slate-500 text-sm">Learn advanced tips and techniques.</p>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
