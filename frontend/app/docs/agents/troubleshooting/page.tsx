'use client';

import Link from 'next/link';
import { ArrowLeft, AlertCircle, Wrench, HelpCircle } from 'lucide-react';

export default function TroubleshootingPage() {
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
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Troubleshooting</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Solutions for common issues and problems you might encounter.
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
          {/* Common Issues */}
          <section className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-100 rounded-xl p-2"><AlertCircle className="w-6 h-6 text-orange-600" /></div>
              <h2 className="text-2xl font-bold text-slate-800">Common Issues & Solutions</h2>
            </div>

            <div className="space-y-8">
              {/* Issue 1 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Agent Responses Are Too Generic</h3>
                <p className="text-slate-500 mb-4">
                  The responses lack detail or don't address your specific needs.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <p className="text-slate-700 font-semibold">Solutions:</p>
                  <ul className="list-disc list-inside text-slate-500 space-y-2 ml-2">
                    <li>Provide more specific context in your questions</li>
                    <li>Increase response length to "Detailed" or "Comprehensive"</li>
                    <li>Add follow-up questions like "Can you provide examples?"</li>
                    <li>Try a different agent - may be better suited for your task</li>
                    <li>Enable citations mode to get sourced information</li>
                  </ul>
                </div>
              </div>

              {/* Issue 2 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Not Getting the Type of Response I Want</h3>
                <p className="text-slate-500 mb-4">
                  The response format or style doesn't match your needs.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <p className="text-slate-700 font-semibold">Solutions:</p>
                  <ul className="list-disc list-inside text-slate-500 space-y-2 ml-2">
                    <li>Specify the format you want: "Provide as a list" or "Write as a step-by-step guide"</li>
                    <li>Adjust Response Tone setting (Professional, Casual, Technical)</li>
                    <li>Change Output Format in advanced settings (Narrative, Bullet Points, Structured)</li>
                    <li>Ask the agent to reformat: "Can you rewrite that as a list?"</li>
                    <li>Try role-based prompting: "As a teacher, explain this concept"</li>
                  </ul>
                </div>
              </div>

              {/* Issue 3 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Getting Conflicting Information</h3>
                <p className="text-slate-500 mb-4">
                  Agent responses seem contradictory or inconsistent.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <p className="text-slate-700 font-semibold">Solutions:</p>
                  <ul className="list-disc list-inside text-slate-500 space-y-2 ml-2">
                    <li>Ask for clarification: "Why did you say X before but Y now?"</li>
                    <li>Provide more context to reduce confusion</li>
                    <li>Start a new conversation if context is overwhelming</li>
                    <li>Consult multiple agents for different perspectives</li>
                    <li>Verify information against reliable external sources</li>
                  </ul>
                </div>
              </div>

              {/* Issue 4 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Response Takes Too Long to Receive</h3>
                <p className="text-slate-500 mb-4">
                  The agent is taking a long time to generate responses.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <p className="text-slate-700 font-semibold">Solutions:</p>
                  <ul className="list-disc list-inside text-slate-500 space-y-2 ml-2">
                    <li>Reduce Response Length to "Brief" or "Standard"</li>
                    <li>Simplify your question - break complex questions into smaller parts</li>
                    <li>Check your internet connection</li>
                    <li>Try again during off-peak hours if you're on a free tier</li>
                    <li>Upgrade to a higher plan tier for priority processing</li>
                  </ul>
                </div>
              </div>

              {/* Issue 5 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Agent Doesn't Remember Previous Context</h3>
                <p className="text-slate-500 mb-4">
                  The agent isn't remembering what we discussed earlier in the conversation.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <p className="text-slate-700 font-semibold">Solutions:</p>
                  <ul className="list-disc list-inside text-slate-500 space-y-2 ml-2">
                    <li>Check Context Awareness setting - ensure it's not set to "Disabled"</li>
                    <li>Enable "Limited" context if it's less than 5 messages back</li>
                    <li>Explicitly restate context in your question</li>
                    <li>Very long conversations may lose older context - start fresh if needed</li>
                    <li>Use this feature strategically with fresh contexts for new topics</li>
                  </ul>
                </div>
              </div>

              {/* Issue 6 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Code Examples Have Errors</h3>
                <p className="text-slate-500 mb-4">
                  Code provided by the agent doesn't work or has syntax errors.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <p className="text-slate-700 font-semibold">Solutions:</p>
                  <ul className="list-disc list-inside text-slate-500 space-y-2 ml-2">
                    <li>Show the agent the error message: "I got this error: [error text]"</li>
                    <li>Ask for step-by-step debugging help</li>
                    <li>Clarify your environment: Python version, framework version, etc.</li>
                    <li>Ask for simpler examples first, then build complexity</li>
                    <li>Request explanations of what the code does before using it</li>
                  </ul>
                </div>
              </div>

              {/* Issue 7 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Agent Doesn't Know About Current Events</h3>
                <p className="text-slate-500 mb-4">
                  Agent seems to not have recent information or current date knowledge.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <p className="text-slate-700 font-semibold">Solutions:</p>
                  <ul className="list-disc list-inside text-slate-500 space-y-2 ml-2">
                    <li>Provide current information in your question: "As of October 2025..."</li>
                    <li>Agents have a knowledge cutoff - provide context for recent events</li>
                    <li>Ask about concepts rather than current events when possible</li>
                    <li>Use external sources for real-time information like stock prices, weather</li>
                    <li>Enable citations to see source dates for information</li>
                  </ul>
                </div>
              </div>

              {/* Issue 8 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Language or Translation Issues</h3>
                <p className="text-slate-500 mb-4">
                  Responses in different languages are poor quality or incorrect.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <p className="text-slate-700 font-semibold">Solutions:</p>
                  <ul className="list-disc list-inside text-slate-500 space-y-2 ml-2">
                    <li>Set Language explicitly in configuration settings</li>
                    <li>Use native speakers of the language to verify accuracy</li>
                    <li>Agents perform better in English - consider that if precision matters</li>
                    <li>For technical content, mixing English terms with your language helps</li>
                    <li>Report language quality issues so we can improve</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Optimization Tips */}
          <section className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 rounded-xl p-2">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Performance Optimization</h2>
            </div>

            <div className="space-y-4 text-slate-500">
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span><strong className="text-slate-800">Shorter Questions:</strong> Simpler questions get faster responses</span>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span><strong className="text-slate-800">Reduce Response Length:</strong> "Brief" mode is faster than "Comprehensive"</span>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span><strong className="text-slate-800">Lower Creativity:</strong> Conservative mode doesn't need to generate as many alternatives</span>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span><strong className="text-slate-800">Disable Citations:</strong> Finding sources takes extra time; turn off if not needed</span>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span><strong className="text-slate-800">Manage Conversation Length:</strong> Very long conversations may slow down responses</span>
              </div>
            </div>
          </section>

          {/* Account & Access Issues */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Account & Access Issues</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Can't Log In</h3>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-2">
                  <li>Check that you're using the correct email address</li>
                  <li>Reset your password using "Forgot Password" link</li>
                  <li>Clear browser cache and cookies, then try again</li>
                  <li>Try a different browser to rule out browser-specific issues</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Getting Rate Limited</h3>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-2">
                  <li>You've exceeded your plan's request limit</li>
                  <li>Upgrade to a higher tier for more requests</li>
                  <li>Limits reset daily - wait until tomorrow for free tier</li>
                  <li>For API users: implement request queuing and backoff logic</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">API Key Not Working</h3>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-2">
                  <li>Verify the key includes "Bearer " prefix in the Authorization header</li>
                  <li>Check that the key hasn't been deactivated in settings</li>
                  <li>Regenerate the key from the dashboard if in doubt</li>
                  <li>Verify the key is for the correct environment (test vs production)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Browser & Technical Issues */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Browser & Technical Issues</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Page Not Loading or Blank Screen</h3>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-2">
                  <li>Refresh the page (Ctrl+R or Cmd+R)</li>
                  <li>Hard refresh to clear cache (Ctrl+Shift+R or Cmd+Shift+R)</li>
                  <li>Clear browser cookies and cache for Mumtaz AI.com</li>
                  <li>Try a different browser</li>
                  <li>Disable browser extensions and try again</li>
                  <li>Check that JavaScript is enabled in your browser</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Chat Box Not Responding</h3>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-2">
                  <li>Close the agent and reopen it</li>
                  <li>Refresh the entire page</li>
                  <li>Check your internet connection is stable</li>
                  <li>Try disabling browser extensions temporarily</li>
                  <li>Clear browser cache and cookies</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Settings Not Saving</h3>
                <ul className="list-disc list-inside text-slate-500 space-y-1 ml-2">
                  <li>Ensure you wait for the save confirmation</li>
                  <li>Refresh the page and check if settings persisted</li>
                  <li>Check if cookies are enabled - settings are saved locally</li>
                  <li>Try with a different browser</li>
                  <li>Contact support if problem continues</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Getting Help */}
          <section className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-xl p-2">
                <HelpCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">When Nothing Works</h2>
            </div>

            <div className="space-y-4 text-slate-600">
              <p>If you've tried the solutions above and still have issues:</p>

              <div className="bg-white p-4 rounded-xl space-y-3">
                <h3 className="font-semibold text-blue-600 mb-2">Information to Provide</h3>
                <ul className="list-disc list-inside space-y-2 ml-2 text-slate-500">
                  <li>Describe the issue clearly</li>
                  <li>Include error messages (exact text or screenshots)</li>
                  <li>Tell us which browser and version you're using</li>
                  <li>Specify which agent has the issue (if applicable)</li>
                  <li>Provide steps to reproduce the issue</li>
                  <li>Tell us your plan tier and when the issue started</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl mt-4">
                <h3 className="font-semibold text-blue-600 mb-2">Contact Options</h3>
                <p className="text-slate-500 text-sm">
                  Visit our Support page to contact our help team, or check the Help section in your dashboard for live chat support.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Q: Is my conversation data private?</h3>
                <p className="text-slate-500">
                  Yes. All conversations are encrypted and stored securely. We do not share conversation data with third parties. 
                  Check our Privacy Policy for full details.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Q: Can I delete my conversations?</h3>
                <p className="text-slate-500">
                  Yes. You can delete individual conversations from your history, or bulk delete all conversations in your account settings. 
                  Deleted conversations cannot be recovered.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Q: What if an agent gives incorrect information?</h3>
                <p className="text-slate-500">
                  Use the feedback feature to rate responses as unhelpful. Always verify important information from reliable sources. 
                  For critical decisions, consult multiple sources.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Q: Can I use agent responses in my work?</h3>
                <p className="text-slate-500">
                  Yes. You can use agent responses in your projects. For commercial use, review our Terms of Service for any restrictions. 
                  Always credit original sources when agent responses cite them.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Q: How often are agents updated?</h3>
                <p className="text-slate-500">
                  Agents receive periodic updates to improve accuracy and add new capabilities. Major updates are announced in our blog. 
                  Updates don't affect existing conversations.
                </p>
              </div>
            </div>
          </section>

          {/* Related Links */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Link 
              href="/docs/agents/getting-started"
              className="p-4 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 transition-colors"
            >
              <h3 className="font-semibold text-purple-600 mb-2">← Getting Started</h3>
              <p className="text-slate-500 text-sm">Learn the basics</p>
            </Link>
            <Link 
              href="/docs/agents/configuration"
              className="p-4 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 transition-colors"
            >
              <h3 className="font-semibold text-purple-600 mb-2">← Configuration</h3>
              <p className="text-slate-500 text-sm">Configure agents</p>
            </Link>
            <Link 
              href="/docs/agents/best-practices"
              className="p-4 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 transition-colors"
            >
              <h3 className="font-semibold text-purple-600 mb-2">← Best Practices</h3>
              <p className="text-slate-500 text-sm">Learn expert tips</p>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
