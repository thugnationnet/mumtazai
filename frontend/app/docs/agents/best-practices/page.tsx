'use client';

import Link from 'next/link';
import { ArrowLeft, Lightbulb, TrendingUp, Award, Target } from 'lucide-react';

export default function BestPracticesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Best Practices</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Expert tips and strategies for maximizing the value and effectiveness of your agents.
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Back Button */}
        <Link href="/docs/agents" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Effective Communication */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-100 rounded-xl p-2"><Lightbulb className="w-6 h-6 text-yellow-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Effective Communication</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Be Specific and Clear</h3>
                <p className="text-neural-600 mb-3">Vague questions lead to vague answers. Instead of asking general questions, provide specific details about your situation.</p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
                  <p className="text-red-700 text-sm">❌ <strong>Avoid:</strong> "How do I code?"</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-700 text-sm">✓ <strong>Try:</strong> "How do I create a REST API in Python using Flask? I need endpoints for CRUD operations."</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Provide Context</h3>
                <p className="text-neural-600 mb-3">Give agents relevant background information. This helps them understand your situation and provide more appropriate responses.</p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-700 text-sm">✓ "I'm developing an ecommerce platform for fashion items. We expect 10,000 daily users. What database should I choose?"</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Ask Follow-Up Questions</h3>
                <p className="text-neural-600 mb-3">
                  If a response isn't quite right, ask the agent to clarify, expand, or approach the topic differently. The conversation context helps refine answers.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-700 text-sm">✓ "That's helpful! Can you explain that more simply for a beginner?" or "Can you provide code examples?"</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Use Precise Language</h3>
                <p className="text-neural-600 mb-3">
                  While agents understand casual language, using precise terminology helps get better results. Use domain-specific terms when appropriate.
                </p>
              </div>
            </div>
          </section>

          {/* Optimizing Configuration */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 rounded-xl p-2"><Target className="w-6 h-6 text-purple-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Optimizing Configuration</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Match Tone to Your Use Case</h3>
                <p className="text-neural-600 mb-3">Select response tone based on your needs:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-2 ml-2">
                  <li><strong>Professional</strong> - Business communications, formal documentation</li>
                  <li><strong>Casual</strong> - Learning, exploration, creative tasks</li>
                  <li><strong>Technical</strong> - Deep technical discussions, specifications</li>
                  <li><strong>Balanced</strong> - General purpose, most situations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Adjust Response Length Strategically</h3>
                <p className="text-neural-600 mb-3">
                  Use brief responses for quick facts, standard for most situations, and detailed/comprehensive for learning or complex topics.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Experiment with Creativity Level</h3>
                <p className="text-neural-600 mb-3">
                  For brainstorming and ideation, increase creativity. For factual accuracy, use conservative. Start conservative and increase as needed.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Save Preset Configurations</h3>
                <p className="text-neural-600 mb-3">
                  If you frequently use the same settings, create named presets. Access them quickly without reconfiguring each time.
                </p>
              </div>
            </div>
          </section>

          {/* Leveraging Specialization */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-xl p-2"><Award className="w-6 h-6 text-blue-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Leveraging Agent Specialization</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Choose the Right Agent</h3>
                <p className="text-neural-600 mb-3">Match agents to their specialization:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-2 ml-2">
                  <li><strong>Einstein</strong> for science, math, research questions</li>
                  <li><strong>Tech Wizard</strong> for programming, tech support, debugging</li>
                  <li><strong>Travel Buddy</strong> for travel planning, destination research</li>
                  <li><strong>Chef Biew</strong> for recipes, cooking techniques, meal planning</li>
                  <li><strong>Fitness Guru</strong> for workouts, nutrition, fitness advice</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Combine Multiple Agents</h3>
                <p className="text-neural-600 mb-3">
                  Don't limit yourself to one agent. For complex projects, consult multiple agents for different aspects. 
                  For example, ask Tech Wizard about architecture, then Einstein about the mathematics involved.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Use Agent Domain Focus</h3>
                <p className="text-neural-600 mb-3">
                  Set domain focus within specialized agents to narrow expertise. For Tech Wizard, focus on your programming language. 
                  For Travel Buddy, focus on your destination region.
                </p>
              </div>
            </div>
          </section>

          {/* Conversation Management */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Conversation Management</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Start Fresh When Needed</h3>
                <p className="text-neural-600 mb-3">
                  If your conversation topic shifts significantly, consider starting a new conversation. This keeps context clean and improves response quality.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Save Important Responses</h3>
                <p className="text-neural-600 mb-3">
                  Bookmark or copy important responses for future reference. Create a knowledge base of useful agent responses.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Review and Validate</h3>
                <p className="text-neural-600 mb-3">
                  While agents are highly capable, always review responses critically, especially for important decisions. 
                  Cross-reference facts and test code suggestions before using in production.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Provide Feedback</h3>
                <p className="text-neural-600 mb-3">
                  Use the feedback system to rate responses. This helps improve overall agent quality and personalization for your needs.
                </p>
              </div>
            </div>
          </section>

          {/* Advanced Techniques */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 rounded-xl p-2"><TrendingUp className="w-6 h-6 text-green-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Advanced Techniques</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Iterative Refinement</h3>
                <p className="text-neural-600 mb-3">
                  Get an initial response, then iteratively refine by asking follow-ups: "Make it more concise," 
                  "Add more examples," "Explain for a child," etc. This builds exactly what you need.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Role-Based Prompting</h3>
                <p className="text-neural-600 mb-3">
                  Ask agents to adopt a specific role: "As a senior architect, how would you design this system?" 
                  This often produces more targeted, expert-level responses.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Structured Requests</h3>
                <p className="text-neural-600 mb-3">
                  Break complex requests into structured steps. Example: "First, explain the concepts. Then provide a concrete example. Finally, list best practices."
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Comparison Prompts</h3>
                <p className="text-neural-600 mb-3">
                  Ask agents to compare options: "Compare these three approaches in terms of performance, maintainability, and learning curve." 
                  This produces comprehensive analysis.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">Scenario-Based Queries</h3>
                <p className="text-neural-600 mb-3">
                  Present specific scenarios for tailored advice. Example: "I have 3 hours to learn React basics before a job interview. What should I focus on?"
                </p>
              </div>
            </div>
          </section>

          {/* Common Mistakes to Avoid */}
          <section className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Common Mistakes to Avoid</h2>

            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="text-red-600 font-bold text-lg">✗</span>
                <div>
                  <p className="text-neural-900 font-semibold mb-1">Asking too general or vague questions</p>
                  <p className="text-neural-600 text-sm">Specific questions get specific answers. Vague questions get vague responses.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-red-600 font-bold text-lg">✗</span>
                <div>
                  <p className="text-neural-900 font-semibold mb-1">Ignoring context and conversation flow</p>
                  <p className="text-neural-600 text-sm">Agents work best with context. Provide relevant background in your questions.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-red-600 font-bold text-lg">✗</span>
                <div>
                  <p className="text-neural-900 font-semibold mb-1">Using wrong agent for the task</p>
                  <p className="text-neural-600 text-sm">Choose agents based on their specialization. Tech Wizard won't help with recipes.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-red-600 font-bold text-lg">✗</span>
                <div>
                  <p className="text-neural-900 font-semibold mb-1">Not reviewing responses critically</p>
                  <p className="text-neural-600 text-sm">Always verify important information, especially for decisions or production code.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-red-600 font-bold text-lg">✗</span>
                <div>
                  <p className="text-neural-900 font-semibold mb-1">Never adjusting configuration</p>
                  <p className="text-neural-600 text-sm">Experiment with settings to find what works best for your use case.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Use Case Examples */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Use Case Examples</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">📚 Learning & Education</h3>
                <p className="text-neural-600">
                  Set to detailed response length and balanced tone. Ask questions progressively, building knowledge. 
                  Request examples frequently. Save responses for review.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">💼 Professional Work</h3>
                <p className="text-neural-600">
                  Use professional tone with standard response length. Set citations on. Combine multiple agents for complex projects. 
                  Archive important conversations.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">🚀 Brainstorming & Ideation</h3>
                <p className="text-neural-600">
                  Set creativity to high. Use casual tone. Ask comparison questions and role-based prompts. 
                  Iterate on ideas to refine them.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-brand-600 mb-2">🔧 Problem-Solving</h3>
                <p className="text-neural-600">
                  Provide detailed context about the problem. Ask step-by-step solutions. Use the Troubleshooting guide for technical issues. 
                  Test recommendations before implementation.
                </p>
              </div>
            </div>
          </section>

          {/* Key Takeaways */}
          <section className="bg-green-50 border border-green-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Key Takeaways</h2>
            <div className="space-y-3 text-neural-700">
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">→</span>
                <span>Be specific and provide context for better responses</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">→</span>
                <span>Choose the right agent for your task's domain</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">→</span>
                <span>Configure agents for your specific use case</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">→</span>
                <span>Use iterative refinement to get exactly what you need</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">→</span>
                <span>Always review and validate important responses</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">→</span>
                <span>Combine multiple agents for complex projects</span>
              </div>
            </div>
          </section>

          {/* Related Links */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Link 
              href="/docs/agents/getting-started"
              className="p-4 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-neural-100 transition-colors"
            >
              <h3 className="font-semibold text-brand-600 mb-2">← Getting Started</h3>
              <p className="text-neural-600 text-sm">Learn the basics</p>
            </Link>
            <Link 
              href="/docs/agents/configuration"
              className="p-4 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-neural-100 transition-colors"
            >
              <h3 className="font-semibold text-brand-600 mb-2">← Configuration</h3>
              <p className="text-neural-600 text-sm">Configure agents</p>
            </Link>
            <Link 
              href="/docs/agents/troubleshooting"
              className="p-4 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-neural-100 transition-colors"
            >
              <h3 className="font-semibold text-brand-600 mb-2">Troubleshooting →</h3>
              <p className="text-neural-600 text-sm">Solve issues</p>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
